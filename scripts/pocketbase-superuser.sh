#!/usr/bin/env bash
# Create (or reset) the PocketBase superuser for the admin panel at /_/.
#
# The password is read with echo disabled and passed straight to the CLI.
# It is never written to a file, echoed or logged. PocketBase only accepts
# the password as a positional argument, so it is briefly visible in the
# process list on a shared machine - run this on a trusted host.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PB_DIR="$ROOT_DIR/pocketbase"
PB_BIN="${PB_BIN:-$PB_DIR/pocketbase}"

if [[ ! -x "$PB_BIN" ]]; then
  echo "PocketBase binary not found: $PB_BIN" >&2
  exit 1
fi

read -r -p "Superuser email: " email
if [[ -z "$email" ]]; then
  echo "Email is required." >&2
  exit 1
fi

read -r -s -p "Password (min 8 chars): " password
echo
read -r -s -p "Repeat password: " password_repeat
echo

if [[ "$password" != "$password_repeat" ]]; then
  unset password password_repeat
  echo "Passwords do not match." >&2
  exit 1
fi

if [[ ${#password} -lt 8 ]]; then
  unset password password_repeat
  echo "Password must be at least 8 characters." >&2
  exit 1
fi

# upsert = create, or update the password when the email already exists.
"$PB_BIN" superuser upsert "$email" "$password" --dir="$PB_DIR/pb_data"
unset password password_repeat

echo "Superuser ready. Open http://127.0.0.1:8090/_/ and sign in with $email"
