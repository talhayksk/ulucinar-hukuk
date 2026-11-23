#!/usr/bin/env bash
# Start PocketBase for local development.
#
# All paths are resolved from this script's location, so the command works no
# matter which directory you call it from.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PB_DIR="$ROOT_DIR/pocketbase"
PB_BIN="${PB_BIN:-$PB_DIR/pocketbase}"
HTTP_ADDR="${PB_HTTP:-127.0.0.1:8090}"
# CORS allow-list. The site is meant to be served from pb_public on the same
# origin (no CORS needed); 8000 is only for `python3 -m http.server` previews.
# Never widen this to "*" in production.
ORIGINS="${PB_ORIGINS:-http://127.0.0.1:8090,http://localhost:8090,http://127.0.0.1:8000,http://localhost:8000}"

if [[ ! -x "$PB_BIN" ]]; then
  echo "PocketBase binary not found or not executable: $PB_BIN" >&2
  echo "Copy it to pocketbase/pocketbase and run: chmod +x pocketbase/pocketbase" >&2
  exit 1
fi

mkdir -p "$PB_DIR/pb_data" "$PB_DIR/pb_public"

# Reminder only; the server itself reports the bind error.
if command -v ss >/dev/null 2>&1 && ss -ltn 2>/dev/null | grep -q "${HTTP_ADDR##*:} "; then
  echo "Warning: ${HTTP_ADDR} looks busy. Set PB_HTTP=127.0.0.1:8091 to use another port." >&2
fi

echo "PocketBase $( "$PB_BIN" --version | awk '{print $3}' )"
echo "Serving http://$HTTP_ADDR/ (admin: /_/)"
echo "CORS origins: $ORIGINS"
echo "Data: $PB_DIR/pb_data"
echo "Migrations: $PB_DIR/pb_migrations"
echo "Public: $PB_DIR/pb_public"
echo "Hooks: $PB_DIR/pb_hooks"

exec "$PB_BIN" serve \
  --http="$HTTP_ADDR" \
  --dir="$PB_DIR/pb_data" \
  --migrationsDir="$PB_DIR/pb_migrations" \
  --publicDir="$PB_DIR/pb_public" \
  --hooksDir="$PB_DIR/pb_hooks" \
  --indexFallback=false \
  --origins="$ORIGINS"
