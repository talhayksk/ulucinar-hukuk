#!/usr/bin/env bash
# Copy the static site into pocketbase/pb_public so PocketBase can serve it
# next to the REST API and the admin panel.
#
# Copies the root-level *.html pages (except the reference template) and the
# assets/ directory. Generated SEO artifacts (pb_public/makale/**, sitemap.xml,
# robots.txt) are preserved: they are rebuilt by the server hooks, not by this
# script. Nothing outside pocketbase/pb_public is touched.
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

mkdir -p "$PUBLIC_DIR"

# Remove only the files owned by this script; keep generated SEO output.
rm -f "$PUBLIC_DIR"/*.html
rm -rf "$PUBLIC_DIR/assets"

cp -a "${html_files[@]}" "$PUBLIC_DIR/"

if [[ -d "$ROOT_DIR/assets" ]]; then
  cp -a "$ROOT_DIR/assets" "$PUBLIC_DIR/"
fi

echo "Published to $PUBLIC_DIR"
find "$PUBLIC_DIR" -maxdepth 1 -type f | sort | sed "s|$ROOT_DIR/|  |"
if [[ -d "$PUBLIC_DIR/makale" ]]; then
  echo "Preserved generated article pages: $(find "$PUBLIC_DIR/makale" -name index.html | wc -l)"
fi
