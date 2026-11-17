#!/usr/bin/env bash
# Snapshot pocketbase/pb_data into pocketbase/backups/<timestamp>/.
#
# Stop the server or accept a short write window first: this is a plain file
# copy, not a PocketBase-consistent online backup. For a live instance use the
# dashboard backup button (Settings -> Backups) instead.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PB_DIR="$ROOT_DIR/pocketbase"
DATA_DIR="$PB_DIR/pb_data"
BACKUP_DIR="$PB_DIR/backups"

if [[ ! -d "$DATA_DIR" ]]; then
  echo "No data directory at $DATA_DIR - nothing to back up." >&2
  exit 1
fi

stamp="$(date +%Y%m%d-%H%M%S)"
target="$BACKUP_DIR/$stamp"
mkdir -p "$target"

cp -a "$DATA_DIR/." "$target/"

echo "Backup written to $target"
du -sh "$target" 2>/dev/null || true
