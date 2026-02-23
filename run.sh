#!/bin/bash
# Fire Engineering Tools - macOS/Linux Control Script
# Usage: ./run.sh [command]
# Commands: start, persist, stop, restart, status, help

PORT=4000
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVE_DIR="$SCRIPT_DIR/FSE web"
PID_FILE="$SCRIPT_DIR/.server.pid"
LOG_DIR="$SCRIPT_DIR/logs"

get_local_ip() {
  if command -v ipconfig &>/dev/null; then
    ipconfig getifaddr en0 2>/dev/null
  elif command -v hostname &>/dev/null; then
    hostname -I 2>/dev/null | awk '{print $1}'
  fi
}

is_running() {
  if [ -f "$PID_FILE" ]; then
    local pid=$(cat "$PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
    rm -f "$PID_FILE"
  fi
  # Also check by port
  lsof -ti:$PORT &>/dev/null && return 0
  return 1
}

get_pid() {
  if [ -f "$PID_FILE" ]; then
    local pid=$(cat "$PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      echo "$pid"
      return
    fi
  fi
  lsof -ti:$PORT 2>/dev/null | head -1
}

print_urls() {
  local IP=$(get_local_ip)
  echo ""
  echo "  Local:   http://localhost:$PORT"
  if [ -n "$IP" ]; then
    echo "  Network: http://$IP:$PORT"
  fi
  echo ""
  echo "  Other devices on the same Wi-Fi can"
  echo "  access using the Network URL above."
}

# ============================================
# Start (foreground, session-dependent)
# ============================================
do_start() {
  echo "========================================="
  echo "  Starting Fire Engineering Tools"
  echo "========================================="

  if is_running; then
    echo ""
    echo "  Server already running (PID: $(get_pid))"
    print_urls
    echo "========================================="
    return
  fi

  print_urls
  echo "  Press Ctrl+C to stop the server."
  echo "========================================="
  echo ""

  cd "$SERVE_DIR"
  python3 -m http.server $PORT --bind 0.0.0.0
}

# ============================================
# Persist (background, survives logout, auto-restart)
# ============================================
do_persist() {
  echo "========================================="
  echo "  Starting in Persistent Mode"
  echo "========================================="
  echo ""
  echo "  Servers will keep running after you"
  echo "  disconnect and auto-restart on crash."
  echo ""

  if is_running; then
    echo "  Server already running (PID: $(get_pid))"
    print_urls
    echo ""
    echo "  Logs: $LOG_DIR/server.log"
    echo "========================================="
    return
  fi

  mkdir -p "$LOG_DIR"

  # Create the persistent wrapper script
  cat > "$SCRIPT_DIR/_server_persist.sh" << 'WRAPPER'
#!/bin/bash
PORT="$1"
SERVE_DIR="$2"
LOG_FILE="$3"
PID_FILE="$4"

echo $$ > "$PID_FILE"

while true; do
  echo "[$(date)] Server starting on port $PORT" >> "$LOG_FILE"
  cd "$SERVE_DIR"
  python3 -m http.server "$PORT" --bind 0.0.0.0 >> "$LOG_FILE" 2>&1
  echo "[$(date)] Server exited, restarting in 3 seconds..." >> "$LOG_FILE"
  sleep 3
done
WRAPPER
  chmod +x "$SCRIPT_DIR/_server_persist.sh"

  # Launch with nohup so it survives logout
  nohup "$SCRIPT_DIR/_server_persist.sh" "$PORT" "$SERVE_DIR" "$LOG_DIR/server.log" "$PID_FILE" > /dev/null 2>&1 &

  sleep 2

  if is_running; then
    echo "  Server started (PID: $(get_pid))"
    print_urls
    echo ""
    echo "  Logs: $LOG_DIR/server.log"
    echo ""
    echo "  To check: ./run.sh status"
    echo "  To stop:  ./run.sh stop"
    echo ""
    echo "  You can safely disconnect now."
    echo "========================================="
  else
    echo "  ERROR: Server failed to start."
    echo "  Check $LOG_DIR/server.log"
    echo "========================================="
  fi
}

# ============================================
# Stop
# ============================================
do_stop() {
  echo "========================================="
  echo "  Stopping Server"
  echo "========================================="
  echo ""

  if ! is_running; then
    echo "  Server is not running."
    echo "========================================="
    return
  fi

  local pid=$(get_pid)
  # Kill the wrapper and its children
  kill "$pid" 2>/dev/null
  # Also kill anything on the port
  lsof -ti:$PORT 2>/dev/null | xargs kill 2>/dev/null
  rm -f "$PID_FILE"
  rm -f "$SCRIPT_DIR/_server_persist.sh"

  sleep 1
  if is_running; then
    # Force kill
    lsof -ti:$PORT 2>/dev/null | xargs kill -9 2>/dev/null
    rm -f "$PID_FILE"
  fi

  echo "  Server stopped."
  echo "========================================="
}

# ============================================
# Restart
# ============================================
do_restart() {
  echo "========================================="
  echo "  Restarting Server"
  echo "========================================="
  echo ""
  do_stop
  sleep 1
  # Check if it was likely in persist mode (pid file or wrapper exists)
  if [ -f "$SCRIPT_DIR/_server_persist.sh" ] || [ -f "$LOG_DIR/server.log" ]; then
    do_persist
  else
    do_start
  fi
}

# ============================================
# Status
# ============================================
do_status() {
  echo "========================================="
  echo "  Server Status"
  echo "========================================="
  echo ""

  if is_running; then
    echo "  Status: RUNNING (PID: $(get_pid))"
    print_urls
    if [ -f "$LOG_DIR/server.log" ]; then
      echo "  Mode: Persistent"
      echo "  Log:  $LOG_DIR/server.log"
    else
      echo "  Mode: Foreground"
    fi
  else
    echo "  Status: STOPPED"
  fi
  echo ""
  echo "========================================="
}

# ============================================
# Usage
# ============================================
do_usage() {
  echo "Fire Engineering Tools - Control Script"
  echo ""
  echo "Usage: ./run.sh [command]"
  echo ""
  echo "Commands:"
  echo "  start      Start server (foreground, stops when you disconnect)"
  echo "  persist    Start in persistent mode (survives disconnects, auto-restart)"
  echo "  stop       Stop the server"
  echo "  restart    Restart the server"
  echo "  status     Check if server is running"
  echo "  help       Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./run.sh persist    # For company servers (RECOMMENDED)"
  echo "  ./run.sh start      # For local testing"
  echo "  ./run.sh status     # Check what's running"
  echo "  ./run.sh stop       # Stop everything"
  echo ""
  echo "For remote/company servers, use 'persist' to keep running after disconnect."
}

# ============================================
# Main
# ============================================
case "${1:-}" in
  start)    do_start ;;
  persist)  do_persist ;;
  stop)     do_stop ;;
  restart)  do_restart ;;
  status)   do_status ;;
  help|--help|-h) do_usage ;;
  "")       do_usage ;;
  *)        echo "ERROR: Unknown command: $1"; echo ""; do_usage ;;
esac
