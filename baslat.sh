#!/usr/bin/env bash
# ULUÇINAR Hukuk — tek komutla yerel siteyi başlat.
#
#   ./baslat.sh            siteyi başlat (gerekirse pb_public'i yeniler)
#   Ctrl+C                 durdur
#   ./durdur.sh            arka planda kalan sunucuyu durdur
#
# Yaptıkları: PocketBase binary'sini bulur/yerleştirir, 8090'da sağlıklı bir
# sunucu varsa ikinci kez başlatmaz, yoksa site dosyalarını pb_public'e kopyalar,
# tarayıcıyı açar ve sunucuyu çalıştırır. Veri dizini (pb_data) korunur.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"
PB_DIR="$ROOT_DIR/pocketbase"
PB_BIN="$PB_DIR/pocketbase"
HTTP_ADDR="${PB_HTTP:-127.0.0.1:8090}"
PORT="${HTTP_ADDR##*:}"
BASE_URL="http://$HTTP_ADDR"
ADMIN_URL="$BASE_URL/_/"

# ---------------------------------------------------------------- çıktı ---
if [ -t 1 ]; then
  C_RESET=$'\033[0m'; C_BOLD=$'\033[1m'; C_DIM=$'\033[2m'
  C_GOLD=$'\033[38;5;179m'; C_GREEN=$'\033[32m'; C_RED=$'\033[31m'; C_YEL=$'\033[33m'
else
  C_RESET=""; C_BOLD=""; C_DIM=""; C_GOLD=""; C_GREEN=""; C_RED=""; C_YEL=""
fi

say()  { printf '%s\n' "$*"; }
ok()   { printf '%s✔%s %s\n' "$C_GREEN" "$C_RESET" "$*"; }
warn() { printf '%s!%s %s\n' "$C_YEL" "$C_RESET" "$*"; }
die()  { printf '%s✖%s %s\n' "$C_RED" "$C_RESET" "$*" >&2; exit 1; }

banner() {
  printf '%s\n' "${C_GOLD}══════════════════════════════════════════════${C_RESET}"
  printf '%s  ULUÇINAR HUKUK — yerel site%s\n' "$C_BOLD" "$C_RESET"
  printf '%s\n' "${C_GOLD}══════════════════════════════════════════════${C_RESET}"
}

# Tarayıcıyı aç (başarısız olsa da devam et). BASLAT_NO_BROWSER=1 ile kapatılır.
open_browser() {
  [ "${BASLAT_NO_BROWSER:-0}" = "1" ] && return 0
  command -v xdg-open >/dev/null 2>&1 || return 0
  xdg-open "$1" >/dev/null 2>&1 || true
}

# ---------------------------------------------------------------- binary ---
find_downloaded_binary() {
  local candidates=() pattern
  shopt -s nullglob
  for pattern in \
    "$HOME/İndirilenler/pocketbase_*_linux_amd64/pocketbase" \
    "$HOME/Downloads/pocketbase_*_linux_amd64/pocketbase" \
    "$HOME/İndirilenler/pocketbase*/pocketbase" \
    "$HOME/Downloads/pocketbase*/pocketbase"; do
    candidates+=($pattern)
  done
  shopt -u nullglob

  local file
  for file in "${candidates[@]}"; do
    if [ -f "$file" ]; then
      printf '%s\n' "$file"
      return 0
    fi
  done
  return 1
}

ensure_binary() {
  if [ -x "$PB_BIN" ]; then
    return 0
  fi

  local source
  if source="$(find_downloaded_binary)"; then
    say "${C_DIM}Binary kopyalanıyor: $source${C_RESET}"
    mkdir -p "$PB_DIR"
    cp -f "$source" "$PB_BIN"
    chmod 750 "$PB_BIN"
    ok "PocketBase binary'si pocketbase/pocketbase konumuna kopyalandı."
    return 0
  fi

  cat >&2 <<EOF
${C_RED}✖ PocketBase binary'si bulunamadı.${C_RESET}

  Beklenen konum : $PB_BIN
  Aranan yerler : ~/İndirilenler/pocketbase_*_linux_amd64/pocketbase
                  ~/Downloads/pocketbase_*_linux_amd64/pocketbase

  İndirme (Linux amd64, sürüm 0.42.3):
    https://github.com/pocketbase/pocketbase/releases

  İndirdikten sonra zip'i açın ve binary'yi şuraya koyun:
    $PB_BIN   (çalıştırma izni gerekir: chmod 750)

  Veya binary'yi doğrudan indirip kopyalayın:
    unzip -o ~/İndirilenler/pocketbase_0.42.3_linux_amd64.zip -d ~/İndirilenler
    cp ~/İndirilenler/pocketbase_0.42.3_linux_amd64/pocketbase "$PB_BIN"
    chmod 750 "$PB_BIN"
EOF
  exit 1
}

# ---------------------------------------------------------------- portlar ---
port_has_listener() {
  command -v ss >/dev/null 2>&1 || return 1
  ss -ltn 2>/dev/null | awk -v p=":$PORT" '$4 ~ p"$" {found=1} END {exit !found}'
}

is_healthy() {
  curl -sf -m 2 -o /dev/null "http://$HTTP_ADDR/api/health"
}

server_pid() {
  local pid
  pid="$(ss -ltnp 2>/dev/null | awk -v p=":$PORT" '$4 ~ p"$" {print}' \
        | grep -o 'pid=[0-9]*' | cut -d= -f2 | head -n1 || true)"
  printf '%s' "${pid:-}"
}

print_endpoints() {
  say ""
  say "  Site  : ${C_BOLD}$BASE_URL/${C_RESET}"
  say "  Admin : ${C_BOLD}$ADMIN_URL${C_RESET}"
  say "  Veri  : ${C_DIM}$PB_DIR/pb_data${C_RESET}"
  say ""
}

# ---------------------------------------------------------------- ana akış ---
banner

ensure_binary
PB_VERSION_STR="$("$PB_BIN" --version 2>/dev/null | awk '{print $3}')" || true

if is_healthy; then
  pid="$(server_pid)"
  ok "Site zaten çalışıyor${pid:+ (pid $pid)} — ikinci kez başlatılmadı."
  say "  ${C_DIM}Sürüm: PocketBase ${PB_VERSION_STR:-?}${C_RESET}"
  print_endpoints
  say "  ${C_DIM}Durdurmak için: ./durdur.sh${C_RESET}"
  open_browser "$BASE_URL/"
  say ""
  say "${C_DIM}Tarayıcı açılmadıysa yukarıdaki adresi elle açın.${C_RESET}"
  exit 0
fi

if port_has_listener; then
  die "$PORT portu başka bir süreç tarafından kullanılıyor.

  Çözmek için:
    • O süreci kapatın, veya
    • Başka port:  PB_HTTP=127.0.0.1:8091 ./baslat.sh

  Portu kimin tuttuğunu görmek için:
    ss -ltnp | grep :$PORT"
fi

fresh_install=0
[ -f "$PB_DIR/pb_data/data.db" ] || fresh_install=1

say "${C_DIM}Site dosyaları pb_public'e kopyalanıyor…${C_RESET}"
"$ROOT_DIR/scripts/pocketbase-sync-public.sh"
ok "Site dosyaları güncellendi."

if [ "$fresh_install" -eq 1 ]; then
  cat <<EOF

${C_YEL}İlk kurulum notu${C_RESET}
  • Veritabanı ve demo içerik ilk açılışta otomatik oluşturulur (migration'lar).
  • Admin hesabı yoksa bir kez şunu çalıştırın:
      ./scripts/pocketbase-superuser.sh
  • Admin panel: $ADMIN_URL

EOF
fi

print_endpoints
say "  ${C_DIM}PocketBase ${PB_VERSION_STR:-?} · tarayıcı 2 saniye içinde açılacak${C_RESET}"
say "  ${C_DIM}Durdurmak için: Ctrl+C (veya başka terminalde ./durdur.sh)${C_RESET}"
say ""

# Tarayıcıyı gecikmeli aç: sunucu hazır olmadan boş sayfa görünmesin.
(
  sleep 2
  open_browser "$BASE_URL/"
) &

say "${C_GOLD}Sunucu başlatılıyor…${C_RESET}"
say ""
exec "$ROOT_DIR/scripts/pocketbase-serve.sh"
