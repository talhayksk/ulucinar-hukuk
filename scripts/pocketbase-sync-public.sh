#!/usr/bin/env bash
# Copy the static site into pocketbase/pb_public so PocketBase can serve it
# next to the REST API and the admin panel.
#
# Copies the root-level *.html pages (except the reference template) and the
# assets/ directory. Only pocketbase/pb_public is written; every other
# directory is left alone.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PUBLIC_DIR="$ROOT_DIR/pocketbase/pb_public"

# Safety rail: never clean a directory outside pocketbase/pb_public.
if [[ "$PUBLIC_DIR" != "$ROOT_DIR/pocketbase/pb_public" ]]; then
  echo "Refusing to clean unexpected path: $PUBLIC_DIR" >&2
  exit 1
fi

shopt -s nullglob
html_files=()
for file in "$ROOT_DIR"/*.html; do
  name="$(basename "$file")"
  [[ "$name" == "lawyer_sablon.html" ]] && continue
  html_files+=("$file")
done
shopt -u nullglob

if [[ ${#html_files[@]} -eq 0 ]]; then
  echo "No HTML pages found in $ROOT_DIR - nothing to publish yet." >&2
  exit 1
fi

rm -rf "$PUBLIC_DIR"
mkdir -p "$PUBLIC_DIR"

cp -a "${html_files[@]}" "$PUBLIC_DIR/"

if [[ -d "$ROOT_DIR/assets" ]]; then
  cp -a "$ROOT_DIR/assets" "$PUBLIC_DIR/"
fi

echo "Published to $PUBLIC_DIR"
find "$PUBLIC_DIR" -type f | sort | sed "s|$ROOT_DIR/||"
