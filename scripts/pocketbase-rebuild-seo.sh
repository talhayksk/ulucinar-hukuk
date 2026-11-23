#!/usr/bin/env bash
# Rebuild the server-rendered SEO output (article pages, sitemap, robots).
#
# The sitemap and robots are served dynamically, so only the article HTML files
# live on disk: pocketbase/pb_public/makale/<slug>/index.html.
#
# Two paths, both without writing secrets to disk:
#   1. PocketBase is already running on PB_HTTP -> authenticate as superuser
#      (prompted with echo disabled, or PB_SUPERUSER_EMAIL/PB_SUPERUSER_PASSWORD)
#      and POST /api/seo/rebuild.
#   2. PocketBase is not running -> boot a temporary instance on
#      PB_REBUILD_PORT; the onBootstrap hook regenerates every page, then the
#      instance is stopped again.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PB_DIR="$ROOT_DIR/pocketbase"
PB_BIN="${PB_BIN:-$PB_DIR/pocketbase}"
LIVE_URL="${PB_HTTP:-127.0.0.1:8090}"
TEMP_PORT="${PB_REBUILD_PORT:-8091}"
TMP_LOG="${TMPDIR:-/tmp}/pocketbase-rebuild.log"

if [[ ! -x "$PB_BIN" ]]; then
  echo "PocketBase binary not found: $PB_BIN" >&2
  exit 1
fi

if ! curl -sf -o /dev/null "http://$LIVE_URL/api/health"; then
  echo "PocketBase is not running on $LIVE_URL; using a temporary instance on 127.0.0.1:$TEMP_PORT"
  if ss -ltn 2>/dev/null | grep -q ":$TEMP_PORT "; then
    echo "Port $TEMP_PORT is busy. Set PB_REBUILD_PORT to a free port." >&2
    exit 1
  fi
  "$PB_BIN" serve \
    --http="127.0.0.1:$TEMP_PORT" \
    --dir="$PB_DIR/pb_data" \
    --migrationsDir="$PB_DIR/pb_migrations" \
    --publicDir="$PB_DIR/pb_public" \
    --hooksDir="$PB_DIR/pb_hooks" >"$TMP_LOG" 2>&1 &
  temp_pid=$!
  cleanup() {
    kill "$temp_pid" 2>/dev/null || true
    wait "$temp_pid" 2>/dev/null || true
  }
  trap cleanup EXIT

  for _ in $(seq 1 40); do
    if curl -sf -o /dev/null "http://127.0.0.1:$TEMP_PORT/api/health"; then
      break
    fi
    sleep 0.25
  done
  if ! curl -sf -o /dev/null "http://127.0.0.1:$TEMP_PORT/api/health"; then
    echo "Temporary PocketBase instance did not start; see $TMP_LOG" >&2
    exit 1
  fi
  # onBootstrap runs before the listener accepts traffic, so the files are ready.
  if grep -q "generation aborted" "$TMP_LOG"; then
    echo "Rebuild aborted: the article template is missing required markers. See $TMP_LOG" >&2
    exit 1
  fi
  if grep -q "template not found" "$TMP_LOG"; then
    echo "Rebuild aborted: pb_public/makale.html is missing. Run scripts/pocketbase-sync-public.sh first." >&2
    exit 1
  fi
  generated=$(find "$PB_DIR/pb_public/makale" -name index.html 2>/dev/null | wc -l)
  echo "Rebuilt $generated article page(s) via bootstrap backfill."
  exit 0
fi

email="${PB_SUPERUSER_EMAIL:-}"
password="${PB_SUPERUSER_PASSWORD:-}"
if [[ -z "$email" ]]; then
  read -r -p "Superuser email: " email
fi
if [[ -z "$password" ]]; then
  read -r -s -p "Password: " password
  echo
fi

# Credentials go through stdin so the password never appears in the process
# argument list (ps / proc cmdline).
auth_body=$(printf '{"identity":"%s","password":"%s"}' "$email" "$password")
unset password
auth_response=$(printf '%s' "$auth_body" | curl -s -X POST \
  -H 'Content-Type: application/json' --data-binary @- \
  "http://$LIVE_URL/api/collections/_superusers/auth-with-password")
unset auth_body

token=$(printf '%s' "$auth_response" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("token",""))' 2>/dev/null || true)
if [[ -z "$token" ]]; then
  echo "Superuser authentication failed." >&2
  exit 1
fi

response=$(curl -s -X POST -H "Authorization: $token" "http://$LIVE_URL/api/seo/rebuild")
printf '%s\n' "$response"
if printf '%s' "$response" | grep -q '"skipped":true'; then
  echo "Rebuild aborted: the article template is missing required markers (see the server log)." >&2
  exit 1
fi
