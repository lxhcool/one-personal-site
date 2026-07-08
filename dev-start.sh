#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
RUN_DIR="$ROOT/.dev-run"
PID_FILE="$RUN_DIR/pids.json"

# ---------- helper ----------
start_service() {
  local name="$1"
  local dir="$2"
  shift 2

  local out_log="$RUN_DIR/$name.out.log"
  local err_log="$RUN_DIR/$name.err.log"

  pushd "$dir" > /dev/null
  nohup npm "$@" > "$out_log" 2> "$err_log" &
  local pid=$!
  popd > /dev/null

  # brief wait to surface immediate crashes
  sleep 0.5
  if ! kill -0 "$pid" 2>/dev/null; then
    echo "Warning: $name may have failed to start (PID $pid) — check $err_log"
  else
    echo "Started $name: PID $pid"
  fi

  # build JSON entry
  if [ "$FIRST_SVC" = true ]; then
    FIRST_SVC=false
  else
    echo "," >> "$PID_FILE"
  fi

  cat >> "$PID_FILE" << EOF
  {
    "name": "$name",
    "pid": $pid,
    "directory": "$dir",
    "stdout": "$out_log",
    "stderr": "$err_log"
  }
EOF
}

# ---------- main ----------
if [ -f "$PID_FILE" ]; then
  echo "Found existing run state: $PID_FILE"
  echo "Run ./dev-stop.sh first if you want to restart all services."
  exit 1
fi

mkdir -p "$RUN_DIR"

echo "[" > "$PID_FILE"
FIRST_SVC=true

start_service "backend"  "$ROOT/lxhcool-backend"  "run" "dev"
start_service "frontend" "$ROOT/lxhcool-frontend" "run" "dev" "--" "--host" "127.0.0.1" "--port" "3000"
start_service "admin"    "$ROOT/lxhcool-admin"    "run" "dev" "--" "--host" "127.0.0.1" "--port" "5173"

echo "" >> "$PID_FILE"
echo "]" >> "$PID_FILE"

echo ""
echo "Started development services."
echo ""
echo "URLs:"
echo "  Backend API : http://127.0.0.1:4000"
echo "  API Docs    : http://127.0.0.1:4000/api-docs"
echo "  Frontend    : http://127.0.0.1:3000"
echo "  Admin       : http://127.0.0.1:5173"
echo ""
echo "Logs and process state are in: $RUN_DIR"
echo "Stop everything with: ./dev-stop.sh"
