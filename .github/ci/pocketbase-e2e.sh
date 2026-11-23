#!/usr/bin/env bash
# PocketBase end-to-end smoke test for CI (and for local dry runs).
#
# Boots a throwaway PocketBase instance from the repository migrations and
# hooks, publishes a copy of the static site into a temporary pb_public, and
# verifies routing, SSR article output, sitemap/robots and the contact guard.
#
# Hard rules:
#   * never touches pocketbase/pb_data, pocketbase/pb_public or pocketbase/backups
#   * no secrets: no superuser account is created and no credentials are used
#   * if the PocketBase binary cannot be obtained, the test is SKIPPED (exit 0)
#     with a notice, so an unreachable release mirror does not break CI
#
# Environment:
#   PB_BIN            use this binary instead of downloading one
#   PB_E2E_PORT       port to listen on (default 8091)
#   PB_E2E_WORKDIR    working directory (default: a fresh mktemp dir)
#   PB_E2E_KEEP=1     keep the working directory for debugging
set -euo pipefail

PB_VERSION="${PB_VERSION:-0.42.3}"
PORT="${PB_E2E_PORT:-8091}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
SLUG="aile-hukukunda-uzlasma"

log()  { printf '[e2e] %s\n' "$*" >&2; }
notice() { [ -n "${GITHUB_ACTIONS:-}" ] && printf '::notice::%s\n' "$*" || true; }
fail() { printf '[e2e] FAIL: %s\n' "$*" >&2; [ -n "${GITHUB_ACTIONS:-}" ] && printf '::error::%s\n' "$*" || true; }

failures=0
check() {  # check <description> <command...>
  local description="$1"; shift
  if "$@"; then
    log "ok   $description"
  else
    fail "$description"
    failures=$((failures + 1))
  fi
}

# ---------------------------------------------------------------- binary ---
download_binary() {
  local work="$1"
  command -v curl >/dev/null 2>&1 || return 1
  command -v unzip >/dev/null 2>&1 || command -v python3 >/dev/null 2>&1 || return 1

  local base="https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}"
  local zip_name="pocketbase_${PB_VERSION}_linux_amd64.zip"
  local urls=(
    "${base}/${zip_name}"
    "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/${zip_name}"
  )

  local zip="$work/pocketbase.zip"
  local ok=0
  for url in "${urls[@]}"; do
    log "downloading $url"
    if curl -fsSL --retry 3 --retry-delay 2 -m 120 -o "$zip" "$url"; then
      ok=1
      break
    fi
  done
  [ "$ok" -eq 1 ] || return 1

  # Verify the published checksum when available; refuse a mismatching archive.
  local sums="$work/checksums.txt"
  if curl -fsSL -m 60 -o "$sums" "${base}/pocketbase_${PB_VERSION}_checksums.txt" 2>/dev/null; then
    local expected
    expected="$(awk -v f="$zip_name" '$2 == f || $2 == "*" f {print $1}' "$sums" | head -n1)"
    if [ -n "$expected" ]; then
      local actual
      if command -v sha256sum >/dev/null 2>&1; then
        actual="$(sha256sum "$zip" | awk '{print $1}')"
      else
        actual="$(shasum -a 256 "$zip" | awk '{print $1}')"
      fi
      if [ "$expected" != "$actual" ]; then
        fail "checksum mismatch for $zip_name (expected $expected, got $actual)"
        return 2
      fi
      log "checksum verified (sha256)"
    else
      log "checksum file did not list $zip_name; continuing unverified"
    fi
  else
    log "checksum file unavailable; continuing unverified"
  fi

  if command -v unzip >/dev/null 2>&1; then
    unzip -o -q "$zip" -d "$work/bin"
  else
    python3 - "$zip" "$work/bin" <<'PY'
import sys, zipfile
zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])
PY
  fi
  chmod +x "$work/bin/pocketbase"
  printf '%s' "$work/bin/pocketbase"
}

PB_BIN="${PB_BIN:-}"
WORKDIR="${PB_E2E_WORKDIR:-}"

# ------------------------------------------------------------------ work ---
if [ -z "$WORKDIR" ]; then
  WORKDIR="$(mktemp -d "${TMPDIR:-/tmp}/ulucinar-pb-e2e.XXXXXX")"
  OWN_WORKDIR=1
else
  OWN_WORKDIR=0
  mkdir -p "$WORKDIR"
fi

server_pid=""
cleanup() {
  if [ -n "$server_pid" ] && kill -0 "$server_pid" 2>/dev/null; then
    kill "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
  fi
  if [ "${PB_E2E_KEEP:-0}" = "1" ] || [ "${OWN_WORKDIR}" = "0" ]; then
    log "workdir kept: $WORKDIR"
  else
    rm -rf "$WORKDIR"
  fi
}
trap cleanup EXIT

# Binary selection: explicit env, then the checked-in binary, then download.
if [ -z "$PB_BIN" ] && [ -x "$ROOT_DIR/pocketbase/pocketbase" ]; then
  PB_BIN="$ROOT_DIR/pocketbase/pocketbase"
  log "using repository binary: $PB_BIN"
fi
if [ -z "$PB_BIN" ]; then
  download_rc=0
  PB_BIN="$(download_binary "$WORKDIR")" || download_rc=$?
  if [ "$download_rc" -ne 0 ]; then
    if [ "$download_rc" -eq 2 ]; then
      fail "downloaded PocketBase archive failed checksum verification"
      exit 1
    fi
    notice "PocketBase ${PB_VERSION} binary unavailable; PocketBase E2E skipped"
    log "SKIPPED: could not download PocketBase ${PB_VERSION} (mirror/network)"
    exit 0
  fi
fi
[ -x "$PB_BIN" ] || { fail "binary not executable: $PB_BIN"; exit 1; }
log "binary: $PB_BIN ($("$PB_BIN" --version 2>/dev/null | awk '{print $3}'))"

# Layout: pb_hooks/../pb_public is how the SEO hook resolves the public dir,
# so the tree must mirror the repository.
APP="$WORKDIR/app"
rm -rf "$APP"
mkdir -p "$APP/pb_data" "$APP/pb_public"
cp -a "$ROOT_DIR/pocketbase/pb_hooks" "$APP/pb_hooks"
cp -a "$ROOT_DIR/pocketbase/pb_migrations" "$APP/pb_migrations"

# Publish only what goes to production: root pages + assets. Generated
# /makale/** pages are intentionally absent - the hooks must recreate them.
shopt -s nullglob
for page in "$ROOT_DIR"/*.html; do
  name="$(basename "$page")"
  [ "$name" = "lawyer_sablon.html" ] && continue
  cp -a "$page" "$APP/pb_public/"
done
shopt -u nullglob
cp -a "$ROOT_DIR/assets" "$APP/pb_public/"

[ -f "$APP/pb_public/makale.html" ] || { fail "pb_public/makale.html missing"; exit 1; }

# ----------------------------------------------------------------- serve ---
if command -v ss >/dev/null 2>&1 && ss -ltn 2>/dev/null | grep -q ":$PORT "; then
  notice "port $PORT is busy; PocketBase E2E skipped"
  log "SKIPPED: port $PORT already in use"
  exit 0
fi

log "starting PocketBase on 127.0.0.1:$PORT"
"$PB_BIN" serve \
  --http="127.0.0.1:$PORT" \
  --dir="$APP/pb_data" \
  --migrationsDir="$APP/pb_migrations" \
  --publicDir="$APP/pb_public" \
  --hooksDir="$APP/pb_hooks" \
  --origins="http://127.0.0.1:$PORT" \
  >"$WORKDIR/serve.log" 2>&1 &
server_pid=$!

BASE="http://127.0.0.1:$PORT"
ready=0
for _ in $(seq 1 120); do
  if curl -fs -o /dev/null "$BASE/api/health" 2>/dev/null; then ready=1; break; fi
  if ! kill -0 "$server_pid" 2>/dev/null; then break; fi
  sleep 0.5
done
if [ "$ready" -ne 1 ]; then
  fail "PocketBase did not become healthy; see the log below"
  tail -n 60 "$WORKDIR/serve.log" || true
  exit 1
fi
log "server healthy"

if grep -q "generation aborted" "$WORKDIR/serve.log"; then
  fail "SSR generation aborted (template markers missing) - see log"
  failures=$((failures + 1))
fi

# Temp files for status/body capture.
BODY="$WORKDIR/body"
status() {  # status <url> -> writes body, echoes HTTP code
  curl -s -o "$BODY" -w '%{http_code}' "$1"
}
status_head() {  # status_head <url> -> writes headers, echoes HTTP code
  curl -s -o /dev/null -D "$WORKDIR/headers" -w '%{http_code}' "$1"
}

# ------------------------------------------------------------- assertions ---
code="$(status "$BASE/api/health")"
check "GET /api/health -> 200 (got $code)" test "$code" = "200"

code="$(status "$BASE/")"
check "GET / -> 200 (got $code)" test "$code" = "200"
check "home page has a canonical link" grep -qi 'rel="canonical"' "$BODY"

code="$(status "$BASE/sitemap.xml")"
check "GET /sitemap.xml -> 200 (got $code)" test "$code" = "200"
check "sitemap is XML urlset" grep -q '<urlset' "$BODY"
check "sitemap lists the article URL" grep -q "/makale/$SLUG/" "$BODY"

code="$(status "$BASE/robots.txt")"
check "GET /robots.txt -> 200 (got $code)" test "$code" = "200"
check "robots disallows /_/" grep -q 'Disallow: /_/' "$BODY"
check "robots points at the sitemap" grep -q 'Sitemap:' "$BODY"

code="$(status "$BASE/makale/$SLUG/")"
check "GET /makale/$SLUG/ -> 200 (got $code)" test "$code" = "200"
check "article page has <title>" grep -q '<title>' "$BODY"
check "article page renders Article JSON-LD" grep -q '"@type": "Article"' "$BODY"
check "article page renders body markup without JS" grep -q '<h2' "$BODY"
check "article page has no client-side loader script" bash -c '! grep -q "content.js" "$0"' "$BODY"

generated="$APP/pb_public/makale/$SLUG/index.html"
check "generated file exists at pb_public/makale/$SLUG/index.html" test -f "$generated"
if [ -f "$generated" ]; then
  size=$(wc -c <"$generated")
  check "generated file is non-trivial ($size bytes)" test "$size" -gt 5000
fi

code="$(status_head "$BASE/makale.html?slug=$SLUG")"
location="$(grep -i '^location:' "$WORKDIR/headers" | tr -d '\r' || true)"
check "legacy ?slug= URL -> 301 (got $code)" test "$code" = "301"
check "301 targets the clean URL" bash -c 'case "$0" in *"/makale/'"$SLUG"'/") exit 0;; *) exit 1;; esac' "$location"

code="$(status "$BASE/makale/$SLUG")"
check "GET /makale/$SLUG (no trailing slash) -> 301 (got $code)" test "$code" = "301"

code="$(status "$BASE/makale/this-slug-does-not-exist/")"
check "unknown article -> 404 (got $code)" test "$code" = "404"
code="$(status "$BASE/makale.html?slug=this-slug-does-not-exist")"
check "unknown ?slug= -> 404 (got $code)" test "$code" = "404"

code="$(status_head "$BASE/_/")"
check "GET /_/ admin UI -> 200 (got $code)" test "$code" = "200"
check "admin UI is noindex" grep -qi 'x-robots-tag:.*noindex' "$WORKDIR/headers"

code="$(status "$BASE/api/collections/practice_areas/records")"
check "GET practice_areas -> 200 (got $code)" test "$code" = "200"
items="$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("totalItems",""))' <"$BODY" 2>/dev/null || true)"
check "practice_areas seed has 9 records (got ${items:-?})" test "$items" = "9"

# KVKK guard: a contact message without kvkk_consent must be rejected.
code="$(curl -s -o "$BODY" -w '%{http_code}' -X POST \
  -H 'Content-Type: application/json' \
  --data '{"name":"E2E","phone":"05000000000","email":"e2e@example.invalid","subject":"E2E","message":"e2e guard check"}' \
  "$BASE/api/collections/contact_messages/records")"
check "contact create without kvkk_consent -> 400 (got $code)" test "$code" = "400"

# ------------------------------------------------------------------ done ---
echo
if [ "$failures" -ne 0 ]; then
  log "FAILED: $failures check(s)"
  [ -n "${GITHUB_ACTIONS:-}" ] && printf '::error::PocketBase E2E failed with %s check(s)\n' "$failures" || true
  tail -n 40 "$WORKDIR/serve.log" || true
  exit 1
fi
log "all checks passed"
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  {
    echo "## PocketBase E2E"
    echo
    echo "- binary: \`$(basename "$PB_BIN")\` ${PB_VERSION}"
    echo "- base: \`$BASE\`"
    echo "- result: all checks passed"
  } >>"$GITHUB_STEP_SUMMARY"
fi
exit 0
