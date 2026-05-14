#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT_DIR/.dev-logs"
BACKEND_URL="http://localhost:3001/health"
FRONTEND_URL="http://localhost:3000"
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  local exit_code=$?

  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi

  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi

  if [[ $exit_code -ne 0 ]]; then
    echo "Servers stopped with an error. Logs are in: $LOG_DIR"
  else
    echo "Servers stopped."
  fi
}
trap cleanup EXIT INT TERM

port_in_use() {
  local port="$1"
  ss -ltn "sport = :$port" | awk 'NR > 1 { found = 1 } END { exit found ? 0 : 1 }'
}

assert_port_free() {
  local port="$1"
  local name="$2"

  if port_in_use "$port"; then
    echo "Error: $name port $port is already in use. Stop the existing process first."
    ss -ltnp "sport = :$port" || true
    exit 1
  fi
}

wait_for_url() {
  local name="$1"
  local url="$2"
  local pid="$3"
  local log_file="$4"
  local timeout_seconds="${5:-180}"
  local elapsed=0

  printf "Waiting for %s" "$name"
  until curl -fsS "$url" >/dev/null 2>&1; do
    if ! kill -0 "$pid" 2>/dev/null; then
      echo " failed."
      echo "$name process exited before becoming ready. Last 80 log lines:"
      tail -n 80 "$log_file" || true
      exit 1
    fi

    if (( elapsed >= timeout_seconds )); then
      echo " timed out."
      echo "$name did not become ready within ${timeout_seconds}s. Last 80 log lines:"
      tail -n 80 "$log_file" || true
      exit 1
    fi

    sleep 1
    elapsed=$((elapsed + 1))
    printf "."
  done
  echo " ready."
}

mkdir -p "$LOG_DIR"
: > "$LOG_DIR/backend.log"
: > "$LOG_DIR/frontend.log"

echo "Starting RepoNarrate dev stack..."
echo ""

echo "Starting Docker services..."
docker compose -f "$ROOT_DIR/docker-compose.yml" up -d

assert_port_free 3001 "Backend"
assert_port_free 3000 "Frontend"

echo "Starting backend (NestJS + SWC watch)..."
(
  cd "$ROOT_DIR/backend"
  npm run start:dev
) > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

echo "Starting frontend (Next.js dev server)..."
(
  cd "$ROOT_DIR/frontend"
  npm run dev
) > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

wait_for_url "backend" "$BACKEND_URL" "$BACKEND_PID" "$LOG_DIR/backend.log" 180
wait_for_url "frontend" "$FRONTEND_URL" "$FRONTEND_PID" "$LOG_DIR/frontend.log" 180

echo ""
echo "  Backend:  http://localhost:3001"
echo "  Swagger:  http://localhost:3001/api"
echo "  Frontend: http://localhost:3000"
echo "  Logs:     $LOG_DIR"
echo ""
echo "Press Ctrl+C to stop."

set +e
wait -n "$BACKEND_PID" "$FRONTEND_PID"
EXITED_STATUS=$?
set -e

echo "A dev server exited. Last backend log lines:"
tail -n 40 "$LOG_DIR/backend.log" || true
echo "Last frontend log lines:"
tail -n 40 "$LOG_DIR/frontend.log" || true
exit "$EXITED_STATUS"
