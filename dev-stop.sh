#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"
RUN_DIR="$ROOT/.dev-run"
PID_FILE="$RUN_DIR/pids.json"

if [ ! -f "$PID_FILE" ]; then
  echo "No running service state found at: $PID_FILE"
  exit 0
fi

# ---------- kill process tree ----------
kill_tree() {
  local pid="$1"
  # kill children first
  for child in $(pgrep -P "$pid" 2>/dev/null); do
    kill_tree "$child"
  done
  kill "$pid" 2>/dev/null
}

force_kill_tree() {
  local pid="$1"
  for child in $(pgrep -P "$pid" 2>/dev/null); do
    force_kill_tree "$child"
  done
  kill -9 "$pid" 2>/dev/null
}

# ---------- main ----------
# Extract name|pid pairs from JSON using python3
pids=$(python3 -c "
import json, sys
try:
    with open('$PID_FILE') as f:
        services = json.load(f)
    if not services:
        sys.exit(0)
    for svc in services:
        print(f\"{svc['name']}|{svc['pid']}\")
except Exception:
    sys.exit(1)
") || {
  echo "Failed to read run state, removing $PID_FILE"
  rm -f "$PID_FILE"
  exit 1
}

if [ -z "$pids" ]; then
  echo "Run state is empty"
  rm -f "$PID_FILE"
  exit 0
fi

while IFS='|' read -r name pid; do
  echo "Stopping $name (PID $pid)..."
  kill_tree "$pid"
done <<< "$pids"

# Give processes a moment to shut down gracefully
sleep 1

# Force-kill any survivors
while IFS='|' read -r name pid; do
  if kill -0 "$pid" 2>/dev/null; then
    echo "$name (PID $pid) still alive, force killing..."
    force_kill_tree "$pid"
  fi
done <<< "$pids"

rm -f "$PID_FILE"
echo "Stopped development services."
