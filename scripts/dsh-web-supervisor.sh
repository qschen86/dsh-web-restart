#!/usr/bin/env bash
# dsh-web-supervisor.sh — manage / auto-restart the DSH web service.
#
# Companion of the dsh-web-restart plugin: the agent runs INSIDE the dsh web
# process, so a restart must be performed by a process OUTSIDE its tree. Run
# this script under launchd (KeepAlive) as a supervisor: it crash-recovers the
# service and honors restart requests written by the plugin.
#
# Usage:
#   dsh-web-supervisor.sh status                  show current state
#   dsh-web-supervisor.sh start                   start if not running (idempotent)
#   dsh-web-supervisor.sh stop                    stop the listener (TERM, then KILL)
#   dsh-web-supervisor.sh restart [--delay N]     stop, wait for port release, start fresh
#   dsh-web-supervisor.sh request [--delay N]     ask the supervisor to restart in N s
#   dsh-web-supervisor.sh watch                   supervisor loop (run under launchd):
#                                              crash-recovery first, then restart requests
#
# Env overrides: DSH_WEB_PORT, DSH_WEB_HOST, DSH_START_CMD, DSH_BIN
#   DSH_BIN: path to the dsh executable. Defaults to \`command -v dsh\`; when dsh
#   lives in an npx cache dir not on the launchd PATH, set DSH_BIN explicitly
#   (recommended: in the launchd plist's EnvironmentVariables).
set -u

PORT="\${DSH_WEB_PORT:-3080}"
HOST="\${DSH_WEB_HOST:-127.0.0.1}"
NODE_BIN="$(command -v node 2>/dev/null || true)"
[ -n "$NODE_BIN" ] || NODE_BIN="/opt/homebrew/opt/node@24/bin/node"
DSH_BIN="\${DSH_BIN:-$(command -v dsh 2>/dev/null || true)}"
if [ -z "$DSH_BIN" ]; then
  echo "dsh-web-supervisor: cannot locate the dsh binary — set DSH_BIN (e.g. in the launchd plist EnvironmentVariables) or add dsh to PATH" >&2
  exit 2
fi
LOG_DIR="$HOME/.dsh"
RESTART_LOG="$LOG_DIR/dsh-web-restart.log"
SERVICE_LOG="$LOG_DIR/dsh-web.log"
PID_FILE="$LOG_DIR/dsh-web.pid"
REQUEST_FILE="$LOG_DIR/dsh-web.restart-request"
SUPER_PID_FILE="$LOG_DIR/dsh-web-supervisor.pid"
WORKDIR="$HOME"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S %Z')] $*" >> "$RESTART_LOG"; }

listener_pid() { lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null | head -1; }

start_cmd() {
  if [ -n "\${DSH_START_CMD:-}" ]; then
    echo "$DSH_START_CMD"
  else
    echo "$NODE_BIN $DSH_BIN web"
  fi
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
  log "start: launching $(start_cmd)"
  cd "$WORKDIR" || exit 1
  # Detach into a NEW SESSION (setsid semantics via python3; macOS has no setsid
  # binary): without this the service shares the supervisor's process group and
  # \`launchctl bootout\` of the supervisor job kills the service too.
  /usr/bin/python3 -c 'import os,sys; os.setsid(); os.execv(sys.argv[1], sys.argv[1:])' \\
    /bin/bash -c "$(start_cmd)" >> "$SERVICE_LOG" 2>&1 < /dev/null &
  echo $! > "$PID_FILE"
  for i in $(seq 1 120); do
    pid="$(listener_pid)"
    if [ -n "$pid" ]; then
      log "start: OK port $PORT up (pid $pid)"
      echo "started pid=$pid"
      return 0
    fi
    sleep 0.5
  done
  log "start: FAILED — port $PORT never came up; see $SERVICE_LOG"
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
    # otherwise a fresh instance can race the dying one (EADDRINUSE).
    if [ -z "$(listener_pid)" ] && ! kill -0 "$pid" 2>/dev/null; then
      log "stop: port $PORT released, pid $pid exited"
      echo "stopped pid=$pid"
      return 0
    fi
    sleep 0.5
  done
  log "stop: TERM ignored, KILL pid=$pid"
  kill -KILL "$pid" 2>/dev/null
  sleep 1
  echo "stopped pid=$pid (forced)"
}

restart() {
  local delay="$1"
  if [ "$delay" -gt 0 ]; then
    log "restart: delaying \${delay}s so the running reply is delivered first"
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
  local delay="\${1:-0}"
  local now target
  now=$(date +%s)
  target=$(( now + delay ))
  echo "$target" > "$REQUEST_FILE"
  if [ "$delay" -gt 0 ]; then
    log "request: restart scheduled in \${delay}s (target ts $target)"
    echo "restart requested; supervisor will restart in \${delay}s"
  else
    log "request: restart requested immediately (target ts $target)"
    echo "restart requested; supervisor will restart within 5s"
  fi
}

watch() {
  local delay="$1"
  if [ -f "$SUPER_PID_FILE" ] && kill -0 "$(cat "$SUPER_PID_FILE")" 2>/dev/null; then
    log "watch: another supervisor already running (pid $(cat "$SUPER_PID_FILE")); exiting"
    exit 0
  fi
  echo $$ > "$SUPER_PID_FILE"
  if [ "$delay" -gt 0 ]; then
    log "watch: delaying \${delay}s before first check"
    sleep "$delay"
  fi
  log "watch: supervisor started (pid $$)"
  while true; do
    # 1) crash recovery FIRST and independent of any request file.
    if [ -z "$(listener_pid)" ]; then
      log "watch: service down — starting"
      start
    fi
    # 2) then honor a due restart request.
    if [ -f "$REQUEST_FILE" ]; then
      local target now
      target=$(cat "$REQUEST_FILE" 2>/dev/null || echo 0)
      now=$(date +%s)
      if [ "$now" -ge "$target" ]; then
        rm -f "$REQUEST_FILE"
        log "watch: restart request due — restarting"
        stop
        start
      fi
    fi
    sleep 5
  done
}

CMD="\${1:-status}"
case "$CMD" in
  status) status ;;
  start) start ;;
  stop) stop ;;
  restart)
    DELAY=0
    if [ "\${2:-}" = "--delay" ]; then DELAY="\${3:-0}"; fi
    restart "$DELAY"
    ;;
  request)
    DELAY=0
    if [ "\${2:-}" = "--delay" ]; then DELAY="\${3:-0}"; fi
    request "$DELAY"
    ;;
  watch)
    DELAY=0
    if [ "\${2:-}" = "--delay" ]; then DELAY="\${3:-0}"; fi
    watch "$DELAY"
    ;;
  *) echo "unknown command: $CMD" >&2; exit 2 ;;
esac
