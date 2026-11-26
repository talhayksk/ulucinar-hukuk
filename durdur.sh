#!/usr/bin/env bash
# ULUÇINAR Hukuk — 8090'daki yerel PocketBase sunucusunu durdur.
#
#   ./durdur.sh             sunucuyu nazikçe durdur (SIGTERM)
#   ./durdur.sh --dry-run   yalnız hangi sürecin durdurulacağını göster
#
# Güvenlik: yalnızca dinleme portu eşleşen ve komut satırında "pocketbase"
# geçen süreç hedeflenir. Başka portlardaki PocketBase süreçlerine dokunulmaz.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PB_PORT:-8090}"
HTTP_ADDR="${PB_HTTP:-127.0.0.1:$PORT}"
BASE_URL="http://$HTTP_ADDR"
TIMEOUT_SECONDS="${DURDUR_TIMEOUT:-10}"

if [ -t 1 ]; then
  C_RESET=$'\033[0m'; C_BOLD=$'\033[1m'; C_DIM=$'\033[2m'
  C_GREEN=$'\033[32m'; C_RED=$'\033[31m'; C_YEL=$'\033[33m'
else
  C_RESET=""; C_BOLD=""; C_DIM=""; C_GREEN=""; C_RED=""; C_YEL=""
fi

say()  { printf '%s\n' "$*"; }
ok()   { printf '%s✔%s %s\n' "$C_GREEN" "$C_RESET" "$*"; }
warn() { printf '%s!%s %s\n' "$C_YEL" "$C_RESET" "$*"; }
die()  { printf '%s✖%s %s\n' "$C_RED" "$C_RESET" "$*" >&2; exit 1; }

usage() {
  cat <<EOF
Kullanım: $(basename "$0") [--dry-run]

  --dry-run, -n   Süreci durdurmadan yalnız hedefi gösterir.
  PB_PORT=8091    Farklı porttaki sunucuyu hedefler.
EOF
}

DRY_RUN=0
case "${1:-}" in
  "") ;;
  -n|--dry-run) DRY_RUN=1 ;;
  -h|--help) usage; exit 0 ;;
  *) usage >&2; die "Bilinmeyen argüman: $1" ;;
esac

# ------------------------------------------------------------ süreç bulma ---
listening_pids() {
  local pids=""
  if command -v ss >/dev/null 2>&1; then
    pids="$(ss -ltnp 2>/dev/null \
      | awk -v p=":$PORT" '$4 ~ p"$" {print}' \
      | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u || true)"
  fi
  if [ -z "$pids" ] && command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -ti "tcp:$PORT" -sTCP:LISTEN 2>/dev/null | sort -u || true)"
  fi
  if [ -z "$pids" ] && command -v pgrep >/dev/null 2>&1; then
    pids="$(pgrep -f "pocketbase serve .*:$PORT" 2>/dev/null | sort -u || true)"
  fi
  printf '%s\n' "$pids"
}

is_pocketbase() {
  local pid="$1" cmd
  [ -r "/proc/$pid/cmdline" ] || return 1
  cmd="$(tr '\0' ' ' <"/proc/$pid/cmdline" 2>/dev/null || true)"
  case "$cmd" in
    *pocketbase*) return 0 ;;
    *) return 1 ;;
  esac
}

targets=()
while IFS= read -r pid; do
  [ -n "$pid" ] || continue
  if is_pocketbase "$pid"; then
    targets+=("$pid")
  else
    warn "$pid numaralı süreç :$PORT portunu dinliyor ama PocketBase değil — atlandı."
  fi
done < <(listening_pids)

if [ ${#targets[@]} -eq 0 ]; then
  say "${C_DIM}$PORT portunda çalışan PocketBase yok.${C_RESET}"
  exit 0
fi

if [ "$DRY_RUN" -eq 1 ]; then
  for pid in "${targets[@]}"; do
    say "Kuru çalışma: PID $pid durdurulacaktı ($(ps -o args= -p "$pid" 2>/dev/null | cut -c1-100))."
  done
  exit 0
fi

say "${C_BOLD}ULUÇINAR Hukuk — sunucu durduruluyor${C_RESET}"
say "  Site : $BASE_URL/"
say ""

for pid in "${targets[@]}"; do
  say "  SIGTERM → PID $pid"
  kill -TERM "$pid" 2>/dev/null || warn "PID $pid zaten kapanmış."
done

deadline=$((SECONDS + TIMEOUT_SECONDS))
while [ "$SECONDS" -lt "$deadline" ]; do
  alive=0
  for pid in "${targets[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      alive=1
    fi
  done
  [ "$alive" -eq 0 ] && break
  sleep 0.5
done

still_alive=()
for pid in "${targets[@]}"; do
  kill -0 "$pid" 2>/dev/null && still_alive+=("$pid")
done

if [ ${#still_alive[@]} -ne 0 ]; then
  die "${TIMEOUT_SECONDS} saniye içinde kapanmadı (PID: ${still_alive[*]}).
  Elle denetleyip gerekirse zorla kapatın:
    ps -o args= -p ${still_alive[*]}
    kill -9 ${still_alive[*]}"
fi

if curl -sf -m 2 -o /dev/null "http://$HTTP_ADDR/api/health"; then
  warn "Süreç kapandı ama $HTTP_ADDR hâlâ yanıt veriyor — başka bir sunucu olabilir."
else
  ok "Sunucu durduruldu. Verileriniz $SCRIPT_DIR/pocketbase/pb_data içinde korunuyor."
fi
