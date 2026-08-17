#!/usr/bin/env bash
# dsh-web-supervisor.sh — manage / auto-restart the DSH web service (127.0.0.1:3080).
#
# WHY THIS EXISTS: the agent runs INSIDE the dsh web process, so a restart must be
# performed by a process OUTSIDE the dsh web process tree. A script launched from
# the agent's bash tool is a descendant of dsh web — when it kills dsh web, the
# harness cleanup kills the script itself (observed 2026-08-16: script died right
# after TERM, before starting the new instance). Hence the launchd supervisor:
#   launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.dsh.web-supervisor.plist
# which keeps `watch` running under launchd (KeepAlive), immune to dsh web's death.
#
# LESSON 2026-08-16 22:26: `launchctl bootout` kills the WHOLE PROCESS GROUP of the
# job. The service used to be started as a plain child of the supervisor, so it died
# together with the supervisor and needed a manual restart. The service is now
# started in a NEW SESSION (setsid semantics via python3), so it survives supervisor
# teardown and reparents to launchd.
#
# LESSON 2026-08-17 (v0.3): a restart was requested while the dsh-web-restart
# plugin's own node_modules was missing @deepseek-ai/schemastery (pnpm `link:` never
# installs the TARGET's dependencies), so dsh web died on boot with
# ERR_MODULE_NOT_FOUND and the service crash-looped for ~an hour. `start` now runs
# `ensure_deps` first (installs missing deps of every linked workspace plugin) and
# dumps the service-log tail into the restart log when boot fails.
#
# Usage:
#   dsh-web-supervisor.sh status                  show current state
#   dsh-web-supervisor.sh start                   start if not running (idempotent)
#   dsh-web-supervisor.sh stop                    stop the listener (TERM, then KILL)
#                                                 NOTE: the watch loop brings it back
#                                                 within 5s — stop means restart
#   dsh-web-supervisor.sh restart [--delay N]     stop, wait for port release, start fresh
#   dsh-web-supervisor.sh request [--delay N]     ask the supervisor to restart in N s
#   dsh-web-supervisor.sh halt                    STOP THE DAEMON for good: bootout the
#                                                 launchd job, kill the supervisor, stop
#                                                 the service. The only way to keep it
#                                                 down — launchd KeepAlive respawns a
#                                                 killed supervisor otherwise.
#   dsh-web-supervisor.sh watch                   supervisor loop (run under launchd):
#                                              crash-recovery first, then restart requests
#
# Env overrides (used by tests): DSH_WEB_PORT, DSH_WEB_HOST, DSH_START_CMD,
# DSH_REQUEST_FILE, DSH_RESTART_LOG, DSH_SERVICE_LOG, DSH_LOCK_DIR, DSH_SUPER_PID_FILE
set -u

PORT="${DSH_WEB_PORT:-3080}"
HOST="${DSH_WEB_HOST:-127.0.0.1}"
NODE_BIN="$(command -v node 2>/dev/null || true)"
[ -n "$NODE_BIN" ] || NODE_BIN="/opt/homebrew/opt/node@24/bin/node"
DSH_BIN="/Users/kisen/.npm/_npx/6c7f445d1bf61956/node_modules/.bin/dsh"
LOG_DIR="$HOME/.dsh"
RESTART_LOG="${DSH_RESTART_LOG:-$LOG_DIR/dsh-web-restart.log}"
SERVICE_LOG="${DSH_SERVICE_LOG:-$LOG_DIR/dsh-web.log}"
PID_FILE="$LOG_DIR/dsh-web.pid"
REQUEST_FILE="${DSH_REQUEST_FILE:-$LOG_DIR/dsh-web.restart-request}"
SUPER_PID_FILE="${DSH_SUPER_PID_FILE:-$LOG_DIR/dsh-web-supervisor.pid}"
LOCK_DIR="${DSH_LOCK_DIR:-$LOG_DIR/dsh-web-supervisor.lock}"
WORKDIR="$HOME"
PROFILE_PKG="$HOME/.dsh/profiles/web/package.json"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S %Z')] $*" >> "$RESTART_LOG"; }

listener_pid() { lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null | head -1; }

start_cmd() {
  if [ -n "${DSH_START_CMD:-}" ]; then
    echo "$DSH_START_CMD"
  else
    echo "$NODE_BIN $DSH_BIN web"
  fi
}

# Pre-flight for the workspace plugin tree: pnpm `link:` deps resolve their own
# dependencies from their own node_modules, so a plugin dir whose node_modules was
# wiped (git clean -fdx, fresh clone, ...) makes the WHOLE dsh web boot fail with
# ERR_MODULE_NOT_FOUND (observed 2026-08-17: dsh-web-restart lost
# @deepseek-ai/schemastery and the service crash-looped for an hour). Install
# missing deps before launching.
ensure_deps() {
  local dirs=() dir dep missing rc
  if [ -f "$PROFILE_PKG" ]; then
    # NOTE: plugin paths contain spaces ("DeepSeek harness"), so collect into an
    # array — a space-joined string would be word-split and miss every plugin
    # (observed in the 2026-08-17 self-heal test).
    while IFS= read -r dir; do
      [ -n "$dir" ] && dirs+=("$dir")
    done < <("$NODE_BIN" -e 'const p=require(process.argv[1]);for(const v of Object.values(p.dependencies||{})){if(typeof v==="string"&&v.startsWith("link:"))console.log(v.slice(5))}' "$PROFILE_PKG" 2>/dev/null)
  fi
  [ "${#dirs[@]}" -gt 0 ] || return 0
  for dir in "${dirs[@]}"; do
    [ -f "$dir/package.json" ] || continue
    missing=""
    for dep in $("$NODE_BIN" -e 'const p=require(process.argv[1]);console.log(Object.keys(p.dependencies||{}).join(" "))' "$dir/package.json" 2>/dev/null); do
      [ -d "$dir/node_modules/$dep" ] || missing="$missing $dep"
    done
    if [ -n "$missing" ]; then
      log "ensure_deps: $dir missing:$missing — running npm install"
      ( cd "$dir" && npm install --no-audit --no-fund --fetch-retries=2 --fetch-timeout=30000 ) >> "$RESTART_LOG" 2>&1
      rc=$?
      log "ensure_deps: npm install rc=$rc ($dir)"
    fi
  done
}

status() {
  local pid
  pid="$(listener_pid)"
  if [ -n "$pid" ]; then
    echo "running: dsh web pid=$pid on $HOST:$PORT"
  else
    echo "stopped: nothing listening on $HOST:$PORT"
  fi
}

start() {
  local pid
  pid="$(listener_pid)"
  if [ -n "$pid" ]; then
    log "start: already running pid=$pid"
    echo "already running pid=$pid"
    return 0
  fi
  ensure_deps
  log "start: launching $(start_cmd)"
  cd "$WORKDIR" || exit 1
  # Detach into a NEW SESSION (setsid semantics via python3; macOS has no setsid
  # binary). Without this, the service shares the supervisor's process group and
  # `launchctl bootout` of the supervisor job kills the service too (observed
  # 2026-08-16 22:26: bootout took the whole group down, service needed manual
  # restart). A session leader survives supervisor teardown and reparents to
  # launchd.
  /usr/bin/python3 -c 'import os,sys; os.setsid(); os.execv(sys.argv[1], sys.argv[1:])' \
    /bin/bash -c "$(start_cmd)" >> "$SERVICE_LOG" 2>&1 < /dev/null &
  for i in $(seq 1 120); do
    pid="$(listener_pid)"
    if [ -n "$pid" ]; then
      echo "$pid" > "$PID_FILE"
      log "start: OK port $PORT up (pid $pid)"
      echo "started pid=$pid"
      return 0
    fi
    sleep 0.5
  done
  rm -f "$PID_FILE"
  {
    echo "[$(date '+%Y-%m-%d %H:%M:%S %Z')] start: FAILED — port $PORT never came up; tail of $SERVICE_LOG:"
    tail -40 "$SERVICE_LOG" 2>/dev/null | sed 's/^/    /'
  } >> "$RESTART_LOG"
  echo "FAILED: port $PORT not up within 60s; see $SERVICE_LOG" >&2
  return 1
}

stop() {
  local pid i
  pid="$(listener_pid)"
  if [ -z "$pid" ]; then
    log "stop: nothing to stop"
    echo "nothing to stop"
    return 0
  fi
  log "stop: TERM pid=$pid"
  kill -TERM "$pid" 2>/dev/null
  for i in $(seq 1 60); do
    # wait for BOTH the port to be released AND the old process to be gone —
    # otherwise a fresh instance can race the dying one (EADDRINUSE, observed
    # 2026-08-16 07:01: first start after stop failed exactly this way).
    if [ -z "$(listener_pid)" ] && ! kill -0 "$pid" 2>/dev/null; then
      log "stop: port $PORT released, pid $pid exited"
      echo "stopped pid=$pid"
      echo "note: the watch loop restarts the service within 5s — use 'halt' to stop the daemon"
      return 0
    fi
    sleep 0.5
  done
  log "stop: TERM ignored, KILL pid=$pid"
  kill -KILL "$pid" 2>/dev/null
  sleep 1
  echo "stopped pid=$pid (forced)"
  echo "note: the watch loop restarts the service within 5s — use 'halt' to stop the daemon"
}

restart() {
  local delay="$1"
  if [ "$delay" -gt 0 ]; then
    log "restart: delaying ${delay}s so the running reply is delivered first"
    sleep "$delay"
  fi
  log "restart: begin (port $PORT)"
  stop
  start
  local rc=$?
  log "restart: done rc=$rc"
  return $rc
}

request() {
  local delay="${1:-0}"
  local now target
  now=$(date +%s)
  target=$(( now + delay ))
  echo "$target" > "$REQUEST_FILE"
  if [ "$delay" -gt 0 ]; then
    log "request: restart scheduled in ${delay}s (target ts $target)"
    echo "restart requested; supervisor will restart in ${delay}s"
  else
    log "request: restart requested immediately (target ts $target)"
    echo "restart requested; supervisor will restart within 5s"
  fi
}

# Single-instance guard for `watch`. launchd KeepAlive normally guarantees one
# instance, but a manual `watch` raced the launchd one on 2026-08-16 23:03 (two
# supervisors started 16s apart). mkdir is atomic; a stale lock (dead owner) is
# reclaimed.
acquire_lock() {
  local i opid
  for i in 1 2 3; do
    if mkdir "$LOCK_DIR" 2>/dev/null; then
      echo $$ > "$LOCK_DIR/pid" 2>/dev/null
      return 0
    fi
    opid=$(cat "$LOCK_DIR/pid" 2>/dev/null || echo 0)
    if [ -z "$opid" ] || [ "$opid" = "0" ] || ! kill -0 "$opid" 2>/dev/null; then
      rm -rf "$LOCK_DIR" 2>/dev/null
      continue
    fi
    return 1
  done
  return 1
}

watch() {
  local delay="$1" fail_count=0 sleep_s
  if ! acquire_lock; then
    log "watch: another supervisor holds $LOCK_DIR; exiting"
    exit 0
  fi
  trap 'rm -f "$LOCK_DIR/pid"; rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT
  echo $$ > "$SUPER_PID_FILE"
  if [ "$delay" -gt 0 ]; then
    log "watch: delaying ${delay}s before first check"
    sleep "$delay"
  fi
  log "watch: supervisor started (pid $$)"
  while true; do
    # 1) crash recovery FIRST and independent of any request file: if the
    #    service is down, bring it back no matter what.
    if [ -z "$(listener_pid)" ]; then
      log "watch: service down — starting"
      if start; then
        fail_count=0
      else
        fail_count=$(( fail_count + 1 ))
      fi
    else
      fail_count=0
    fi
    # 2) then honor a due restart request (stop + start).
    if [ -f "$REQUEST_FILE" ]; then
      local target now
      target=$(cat "$REQUEST_FILE" 2>/dev/null || echo 0)
      now=$(date +%s)
      if [ "$now" -ge "$target" ]; then
        rm -f "$REQUEST_FILE"
        log "watch: restart request due — restarting"
        stop
        if start; then
          fail_count=0
        else
          fail_count=$(( fail_count + 1 ))
        fi
      fi
    fi
    # back off if the service keeps failing to boot (missing deps, bad config)
    sleep_s=5
    if [ "$fail_count" -ge 6 ]; then sleep_s=60; elif [ "$fail_count" -ge 3 ]; then sleep_s=30; fi
    sleep "$sleep_s"
  done
}

halt() {
  local plist="$HOME/Library/LaunchAgents/com.dsh.web-supervisor.plist"
  local spid
  log "halt: bootout launchd job ($plist)"
  if [ -f "$plist" ]; then
    launchctl bootout "gui/$(id -u)" "$plist" 2>/dev/null || true
  else
    launchctl bootout "gui/$(id -u)/com.dsh.web-supervisor" 2>/dev/null || true
  fi
  if [ -f "$SUPER_PID_FILE" ]; then
    spid=$(cat "$SUPER_PID_FILE" 2>/dev/null || echo 0)
    if [ "$spid" -gt 0 ] 2>/dev/null; then
      kill -TERM "$spid" 2>/dev/null
      sleep 1
      kill -KILL "$spid" 2>/dev/null || true
    fi
  fi
  pkill -9 -f 'dsh-web-supervisor.sh watch' 2>/dev/null || true
  rm -rf "$LOCK_DIR" 2>/dev/null || true
  rm -f "$SUPER_PID_FILE"
  stop
  echo "halt: daemon stopped and launchd job disabled"
  echo "  re-enable: launchctl bootstrap gui/$(id -u) $plist"
}

CMD="${1:-status}"
case "$CMD" in
  status) status ;;
  start) start ;;
  stop) stop ;;
  restart)
    DELAY=0
    if [ "${2:-}" = "--delay" ]; then DELAY="${3:-0}"; fi
    restart "$DELAY"
    ;;
  request)
    DELAY=0
    if [ "${2:-}" = "--delay" ]; then DELAY="${3:-0}"; fi
    request "$DELAY"
    ;;
  watch)
    DELAY=0
    if [ "${2:-}" = "--delay" ]; then DELAY="${3:-0}"; fi
    watch "$DELAY"
    ;;
  halt) halt ;;
  *) echo "unknown command: $CMD" >&2; exit 2 ;;
esac
