// dsh-web-restart — host half.
// Exposes a small same-origin API for the browser plugin:
//   GET  /plugin/dsh-web-restart          → service + supervisor status + config + last sweep
//   POST /plugin/dsh-web-restart          → write a restart request file
//   GET  /plugin/dsh-web-restart/config   → current auto-continue switch
//   POST /plugin/dsh-web-restart/config   → set the auto-continue switch (settings domain)
// The restart itself is NOT performed here: this process is the one being
// restarted, so killing it from inside is suicide (the script would die with
// it, as observed with the earlier naive approach). Instead the request is
// handed to the launchd supervisor (com.dsh.web-supervisor, watch mode),
// which polls the request file from OUTSIDE the dsh web process tree and
// performs stop → wait-for-port-release → start → health-check.
//
// Auto-continue: the switch lives in the user settings domain under the
// `web-restart` namespace (设置 → 插件 → 插件配置 card; persisted in
// $DSH_HOME/settings.yaml). When it is ON, the host sweep runs once shortly
// after boot. It scans every persisted top-level session whose log tail was
// interrupted by the previous shutdown (an open turn from a hard kill, or a
// turn/end aborted by teardown — user-initiated stops carry {kind:'user'}
// and are never resumed). Each affected session is resumed
// (`ctx.agents.resume`) and either re-arms its active goal (the
// goal-round-driver then continues rounds automatically) or receives a
// synthetic "continue" user message. The boot-time marker in the runtime
// file (~/.dsh/dsh-web-restart.json) bounds the sweep to sessions
// interrupted by the LAST restart, so stale sessions from earlier crashes
// are left alone. That file holds runtime state only (boot marker + last
// sweep); user configuration lives in the settings document.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { homedir } from 'node:os'
import Schema from '@deepseek-ai/schemastery'

export const name = 'web-restart'
export const inject = ['webServer', 'agents', 'goals', 'sessionQuery', 'sessionPersistence']

const ROUTE_PATH = '/plugin/dsh-web-restart'
const CONFIG_PATH = '/plugin/dsh-web-restart/config'
const DEFAULT_DELAY_S = 10
const MAX_DELAY_S = 120
const SWEEP_START_DELAY_MS = 2000
const STALE_EPSILON_MS = 1000

// User-visible configuration namespace (设置 → 插件 → 插件配置).
// settingsNamespace() in @deepseek-ai/dsh-settings only validates the
// kebab-case pattern; spelled here to keep this out-of-tree bundle free of
// in-box package imports beyond the vendored schemastery symlink.
const SETTINGS_NS = 'web-restart'
const SETTINGS_SCHEMA = Schema.object({
  autoContinueAfterRestart: Schema.boolean().default(false),
})

function homeDir() {
  return process.env.DSH_HOME || join(homedir(), '.dsh')
}

function requestFilePath() {
  return join(homeDir(), 'dsh-web.restart-request')
}

function runtimeFilePath() {
  return join(homeDir(), 'dsh-web-restart.json')
}

function supervisorPidPath() {
  return join(homeDir(), 'dsh-web-supervisor.pid')
}

function pidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return error?.code === 'EPERM'
  }
}

function readSupervisor() {
  const path = supervisorPidPath()
  if (!existsSync(path)) return { running: false, pid: null }
  try {
    const pid = Number.parseInt(readFileSync(path, 'utf8').trim(), 10)
    return { running: pidAlive(pid), pid: Number.isInteger(pid) && pid > 0 ? pid : null }
  } catch {
    return { running: false, pid: null }
  }
}

function readPendingRequest() {
  const path = requestFilePath()
  if (!existsSync(path)) return null
  try {
    const raw = readFileSync(path, 'utf8').trim()
    const target = Number.parseInt(raw, 10)
    if (!Number.isFinite(target) || target <= 0) return { target: null, due: false }
    return { target, due: Date.now() / 1000 >= target }
  } catch {
    return { target: null, due: false }
  }
}

// ── runtime state file (~/.dsh/dsh-web-restart.json) ───────────────────────
// { lastBootAt: epochMs, lastSweep: {...} } — NOT user configuration; the
// auto-continue switch lives in the settings document (web-restart namespace).

function readRuntimeFile() {
  const path = runtimeFilePath()
  if (!existsSync(path)) return {}
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'))
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeRuntimeFile(data) {
  writeFileSync(runtimeFilePath(), JSON.stringify(data, null, 2))
}

/** Effective switch: user settings layer → entry config (base) → schema default. */
function effectiveConfig(settingsService, pluginConfig) {
  if (settingsService !== null) {
    try {
      const resolved = settingsService.get(SETTINGS_NS)
      if (resolved !== void 0 && typeof resolved.autoContinueAfterRestart === 'boolean') {
        let source = 'patch'
        for (const descriptor of settingsService.describe()) {
          if (descriptor.ns === SETTINGS_NS && descriptor.user !== void 0 && Object.hasOwn(descriptor.user, 'autoContinueAfterRestart')) {
            source = 'user'
            break
          }
        }
        return { autoContinueAfterRestart: resolved.autoContinueAfterRestart, source }
      }
    } catch (error) {
      // fall through to entry config
    }
  }
  return { autoContinueAfterRestart: pluginConfig.autoContinueAfterRestart === true, source: 'patch' }
}

// ── interrupted-tail detection ──────────────────────────────────────────────
// A session log tail is "interrupted by shutdown" when:
//   • the last turn/start never received its turn/end (hard kill mid-turn), or
//   • the last turn/end is aborted with a non-user cause. The agent loop aborts
//     with {kind:'user'} on the user's stop button, with {kind:'disposed'} on
//     lifecycle teardown (SIGTERM shutdown), and with {kind:'parent'} on the
//     goal-round-driver teardown. Only non-user aborts mean "cut by restart".
function detectInterruptedTail(events) {
  let openTurn = false
  let tailAbortKind = null
  let lastTime = 0
  for (const event of events || []) {
    if (!event || typeof event.type !== 'string') continue
    if (typeof event.time === 'number') lastTime = event.time
    if (event.type === 'turn/start') {
      openTurn = true
      tailAbortKind = null
    } else if (event.type === 'turn/end') {
      openTurn = false
      const reason = event.data?.reason
      tailAbortKind = reason?.kind === 'aborted' ? (reason.reason?.kind ?? null) : null
    }
  }
  return {
    interrupted: openTurn || (tailAbortKind !== null && tailAbortKind !== 'user'),
    lastTime
  }
}

function errorText(error) {
  return error instanceof Error ? error.message : String(error)
}

/** Resume one interrupted session (or reuse its live agent) and continue it. */
async function continueSession(ctx, agent) {
  let goal = null
  try {
    goal = ctx.goals.get(agent)
  } catch (error) {
    ctx.logger.warn(`dsh-web-restart: goal read failed for "${agent.id}": ${errorText(error)}`)
  }
  if (goal) {
    if (goal.phase !== 'active') {
      return { kind: 'skipped', reason: `goal-${goal.phase}` }
    }
    if (goal.roundsStarted >= goal.maxGoalRounds) {
      return { kind: 'skipped', reason: 'round-limit' }
    }
    // Re-arm continuation; the goal-round-driver queues the next <goal_round>
    // automatically once the agent is idle.
    ctx.goals.resume(agent, { id: goal.id, revision: goal.revision })
    return { kind: 'goal', goalId: goal.id }
  }
  // No goal: inject a synthetic continuation prompt so the loop starts a turn.
  agent.followup({
    id: randomUUID(),
    role: 'user',
    content: [{
      type: 'text',
      text: '（服务已重启）请继续之前中断的工作：先依据会话历史确认进度与外部状态，再从尚未完成的部分继续；如有工具调用结果未知，按需核实或重试。'
    }],
    source: { kind: 'plugin', plugin: 'web-restart' }
  })
  return { kind: 'message' }
}

/** One boot sweep: resume every top-level session cut by the last shutdown. */
async function runSweep(ctx, previousBootAt) {
  const resumed = []
  const skipped = []
  const failed = []
  let records = []
  try {
    records = await ctx.sessionQuery.listSessions()
  } catch (error) {
    return { error: `listSessions failed: ${errorText(error)}`, resumed, skipped, failed }
  }
  for (const record of records) {
    const header = record?.header
    if (!header || typeof header.id !== 'string') continue
    if (header.delegationDepth !== 0) continue // subagent sessions resume with their parent
    const id = header.id

    const liveAgent = ctx.agents.get(id)
    if (liveAgent?.status === 'running') {
      skipped.push(`${id} (live-running)`)
      continue
    }

    let events = []
    try {
      const snap = await ctx.sessionQuery.readSession(id)
      events = snap?.events ?? []
    } catch (error) {
      failed.push(`${id} (read: ${errorText(error)})`)
      continue
    }

    const { interrupted, lastTime } = detectInterruptedTail(events)
    if (!interrupted) {
      skipped.push(`${id} (not-interrupted)`)
      continue
    }
    if (previousBootAt !== null && lastTime + STALE_EPSILON_MS < previousBootAt) {
      skipped.push(`${id} (stale, interrupted before previous boot)`)
      continue
    }

    try {
      let agent = liveAgent
      let handle = null
      if (!agent) {
        handle = await ctx.agents.resume({ resumeSessionId: id })
        agent = handle.agent
      }
      const outcome = await continueSession(ctx, agent)
      if (outcome.kind === 'skipped') {
        skipped.push(`${id} (${outcome.reason})`)
        if (handle !== null) void handle.dispose().catch((error) => {
          ctx.logger.warn(`dsh-web-restart: teardown of skipped session "${id}" failed: ${errorText(error)}`)
        })
      } else {
        resumed.push(outcome.kind === 'goal' ? `${id} (goal ${outcome.goalId})` : `${id} (${outcome.kind})`)
      }
    } catch (error) {
      failed.push(`${id} (${errorText(error)})`)
    }
  }
  return { resumed, skipped, failed }
}

function writeJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(body)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > 65536) {
        reject(new Error('request body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8')
        resolve(text === '' ? {} : JSON.parse(text))
      } catch (error) {
        reject(new Error('invalid JSON body: ' + (error?.message ?? error)))
      }
    })
    req.on('error', reject)
  })
}

export function apply(ctx, config = {}) {
  // Runtime state: boot marker so the sweep only touches sessions interrupted
  // by the previous shutdown, not older crashes.
  const runtime = readRuntimeFile()
  const previousBootAt = typeof runtime.lastBootAt === 'number' ? runtime.lastBootAt : null
  try {
    writeRuntimeFile({ ...runtime, lastBootAt: Date.now() })
  } catch (error) {
    ctx.logger.warn(`dsh-web-restart: cannot persist boot marker: ${errorText(error)}`)
  }

  // Settings domain: register the user-facing configuration namespace. The
  // card in 设置 → 插件 → 插件配置 binds this namespace; the settings
  // provider persists user overrides in $DSH_HOME/settings.yaml.
  let settingsService = null
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(SETTINGS_NS, SETTINGS_SCHEMA, {
      base: { autoContinueAfterRestart: config.autoContinueAfterRestart === true },
    })
    settingsService = settingsCtx.settings
    // Migrate the switch value written by older versions into the runtime file.
    const legacy = readRuntimeFile()
    if (typeof legacy.autoContinueAfterRestart === 'boolean') {
      try {
        settingsCtx.settings.update(SETTINGS_NS, {
          autoContinueAfterRestart: legacy.autoContinueAfterRestart,
        })
        const migrated = { ...legacy }
        delete migrated.autoContinueAfterRestart
        writeRuntimeFile(migrated)
        ctx.logger.info(`dsh-web-restart: migrated autoContinueAfterRestart=${legacy.autoContinueAfterRestart} from the runtime file into settings`)
      } catch (error) {
        ctx.logger.warn(`dsh-web-restart: could not migrate legacy switch: ${errorText(error)}`)
      }
    }
    settingsCtx.effect(() => () => {
      settingsService = null
    }, 'dsh-web-restart: settings scope')
  })

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: ROUTE_PATH,
    handler: async (req, res) => {
      try {
        if (req.method === 'GET' || req.method === 'HEAD') {
          const supervisor = readSupervisor()
          const pending = readPendingRequest()
          const file = readRuntimeFile()
          writeJson(res, 200, {
            ok: true,
            name: 'web-restart',
            pid: process.pid,
            uptimeMs: process.uptime() * 1000,
            supervisor,
            request: pending,
            restartSupported: supervisor.running,
            requestFile: requestFilePath(),
            config: effectiveConfig(settingsService, config),
            lastSweep: file.lastSweep ?? null,
          })
          return
        }

        if (req.method !== 'POST') {
          writeJson(res, 405, { ok: false, error: 'method not allowed' })
          return
        }

        const body = await readBody(req)
        const rawDelay = Number(body?.delay ?? DEFAULT_DELAY_S)
        const delay = Number.isFinite(rawDelay) && rawDelay >= 0
          ? Math.min(Math.floor(rawDelay), MAX_DELAY_S)
          : DEFAULT_DELAY_S

        const supervisor = readSupervisor()
        if (!supervisor.running) {
          writeJson(res, 503, {
            ok: false,
            error: 'supervisor not running — start it with: launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.dsh.web-supervisor.plist',
            supervisor,
          })
          return
        }

        const target = Math.floor(Date.now() / 1000) + delay
        writeFileSync(requestFilePath(), String(target))
        writeJson(res, 200, {
          ok: true,
          scheduledAt: Date.now(),
          delayS: delay,
          targetEpochS: target,
          note: 'the launchd supervisor will stop this process and start a fresh one; the page will briefly disconnect — refresh afterwards',
        })
      } catch (error) {
        writeJson(res, 500, { ok: false, error: error?.message ?? String(error) })
      }
    },
  }), 'dsh-web-restart: api endpoint')

  // Runtime switch: GET returns it; POST writes it into the settings domain.
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: CONFIG_PATH,
    handler: async (req, res) => {
      try {
        if (req.method === 'GET' || req.method === 'HEAD') {
          const file = readRuntimeFile()
          writeJson(res, 200, { ok: true, config: effectiveConfig(settingsService, config), lastSweep: file.lastSweep ?? null })
          return
        }
        if (req.method !== 'POST') {
          writeJson(res, 405, { ok: false, error: 'method not allowed' })
          return
        }
        const body = await readBody(req)
        if (typeof body?.autoContinueAfterRestart !== 'boolean') {
          writeJson(res, 400, { ok: false, error: 'autoContinueAfterRestart must be a boolean' })
          return
        }
        if (settingsService === null) {
          writeJson(res, 503, { ok: false, error: 'settings domain unavailable in this deployment' })
          return
        }
        try {
          await settingsService.update(SETTINGS_NS, {
            autoContinueAfterRestart: body.autoContinueAfterRestart,
          })
        } catch (error) {
          writeJson(res, 500, { ok: false, error: `cannot persist config: ${errorText(error)}` })
          return
        }
        writeJson(res, 200, {
          ok: true,
          config: { autoContinueAfterRestart: body.autoContinueAfterRestart, source: 'user' },
        })
      } catch (error) {
        writeJson(res, 500, { ok: false, error: error?.message ?? String(error) })
      }
    },
  }), 'dsh-web-restart: config endpoint')

  // Auto-continue sweep: one run shortly after boot when the switch is on.
  ctx.effect(() => {
    const effective = effectiveConfig(settingsService, config)
    if (effective.autoContinueAfterRestart !== true) {
      ctx.logger.info('dsh-web-restart: auto-continue disabled — interrupted sessions need manual continuation')
      return
    }
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const result = await runSweep(ctx, previousBootAt)
          if (result.error) {
            ctx.logger.warn(`dsh-web-restart: auto-continue sweep failed: ${result.error}`)
          } else {
            ctx.logger.info(`dsh-web-restart: auto-continue sweep done — resumed ${result.resumed.length}: ${result.resumed.join(', ') || '(none)'}${result.skipped.length ? `; skipped ${result.skipped.join(', ')}` : ''}${result.failed.length ? `; failed ${result.failed.join(', ')}` : ''}`)
          }
          try {
            const file = readRuntimeFile()
            file.lastSweep = {
              at: Date.now(),
              bootMarker: previousBootAt,
              resumed: result.resumed,
              skipped: result.skipped,
              failed: result.failed,
            }
            writeRuntimeFile(file)
          } catch (error) {
            ctx.logger.warn(`dsh-web-restart: cannot persist last sweep: ${errorText(error)}`)
          }
        } catch (error) {
          ctx.logger.warn(`dsh-web-restart: auto-continue sweep crashed: ${errorText(error)}`)
        }
      })()
    }, SWEEP_START_DELAY_MS)
    return () => clearTimeout(timer)
  }, 'dsh-web-restart: auto-continue sweep')
}
