#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required but was not found on PATH." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is installed, but this terminal cannot access the Docker engine." >&2
  echo "Start Docker Desktop and wait until it is running. On Linux, add your user to the docker group or run with appropriate permissions." >&2
  exit 1
fi

if [[ ! -f ".env.development" ]]; then
  if [[ ! -f ".env.development.example" ]]; then
    echo "Missing .env.development and .env.development.example." >&2
    exit 1
  fi

  cp ".env.development.example" ".env.development"
  echo "Created .env.development from .env.development.example"
fi

get_env_value() {
  local key="$1"
  grep -E "^${key}=" ".env.development" | tail -n 1 | cut -d '=' -f 2- | sed "s/^['\"]//;s/['\"]$//"
}

NEON_API_KEY_VALUE="$(get_env_value "NEON_API_KEY")"
NEON_PROJECT_ID_VALUE="$(get_env_value "NEON_PROJECT_ID")"
APP_PORT_VALUE="$(get_env_value "APP_PORT")"
APP_PORT_VALUE="${APP_PORT_VALUE:-3001}"
NEON_LOCAL_PORT_VALUE="$(get_env_value "NEON_LOCAL_PORT")"
NEON_LOCAL_PORT_VALUE="${NEON_LOCAL_PORT_VALUE:-5432}"

missing=()
if [[ -z "$NEON_API_KEY_VALUE" || "$NEON_API_KEY_VALUE" == "your_neon_api_key" ]]; then
  missing+=("NEON_API_KEY")
fi
if [[ -z "$NEON_PROJECT_ID_VALUE" || "$NEON_PROJECT_ID_VALUE" == "your_neon_project_id" ]]; then
  missing+=("NEON_PROJECT_ID")
fi

if [[ "${#missing[@]}" -gt 0 ]]; then
  echo "Update .env.development with real Neon values before starting Docker: ${missing[*]}." >&2
  echo "Neon Local returns 401 Unauthorized when these are placeholders." >&2
  exit 1
fi

if command -v lsof >/dev/null 2>&1; then
  if lsof -iTCP:"$APP_PORT_VALUE" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Host port $APP_PORT_VALUE is already in use. Stop that process or set APP_PORT to a free port in .env.development." >&2
    exit 1
  fi

  if lsof -iTCP:"$NEON_LOCAL_PORT_VALUE" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Host port $NEON_LOCAL_PORT_VALUE is already in use. Stop that process or set NEON_LOCAL_PORT to a free port in .env.development." >&2
    exit 1
  fi
fi

echo "Starting development stack with Neon Local..."
echo "API will be published on http://localhost:$APP_PORT_VALUE"
docker compose --env-file .env.development -f docker-compose.dev.yml down --remove-orphans

if ! docker compose --env-file .env.development -f docker-compose.dev.yml up --build; then
  echo ""
  echo "Docker Compose failed. Recent logs:"
  docker compose --env-file .env.development -f docker-compose.dev.yml logs --tail=120
  exit 1
fi
