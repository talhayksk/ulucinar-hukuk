#!/usr/bin/env bash
# Snapshot pocketbase/pb_data into pocketbase/backups/<timestamp>/.
#
# Stop the server or accept a short write window first: this is a plain file
# copy, not a PocketBase-consistent online backup. For a live instance use the
# dashboard backup button (Settings -> Backups) instead.
#
# Security: the data directory contains superuser password hashes and client
# PII. Both the live data and the copy are kept owner-only (0700/0600).
# For off-site storage encrypt the archive first, e.g.:
#   age -p -o backup.tar.age backup.tar   (or: gpg -c backup.tar)
# and define a retention period before copying it anywhere else.
set -euo pipefail
umask 077

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

# cp -a preserves source modes, so tighten the copy explicitly.
find "$target" -type d -exec chmod 700 {} +
find "$target" -type f -exec chmod 600 {} +
chmod 700 "$BACKUP_DIR"

# Harden the live data directory as well (idempotent).
find "$DATA_DIR" -type d -exec chmod 700 {} +
find "$DATA_DIR" -type f -exec chmod 600 {} +

echo "Backup written to $target"
du -sh "$target" 2>/dev/null || true
echo "Permissions: backup and pb_data are owner-only (0700/0600)."
echo "Reminder: encrypt before moving the archive off this host (age/gpg)."
