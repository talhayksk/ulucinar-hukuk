# ULUÇINAR — Hızlı Başlat

## Tek komut

```bash
cd "/home/talha/Projeler/avukat projesi"
./baslat.sh
```

Script şunları yapar:

- PocketBase binary'sini `pocketbase/pocketbase` içinde arar; yoksa `~/İndirilenler` / `~/Downloads` altındaki `pocketbase_*_linux_amd64` klasöründen kopyalar.
- Site dosyalarını `pocketbase/pb_public` içine senkronlar.
- PocketBase'i `http://127.0.0.1:8090/` üzerinde başlatır ve tarayıcıyı açar.
- Site zaten çalışıyorsa **ikinci kez başlatmaz**; sadece adresleri yazar.

Açılan adresler:

- Site: http://127.0.0.1:8090/
- Yönetim paneli: http://127.0.0.1:8090/_/

Durdurmak için terminalde `Ctrl + C` veya:

```bash
./durdur.sh
```

## Çift tıklama

Dosya yöneticisinde `ULUCINAR-Baslat.desktop` dosyasına çift tıklayın. (İlk seferde “Güven/Güvenilir olarak işaretle” isteyebilir.)

## İlk kurulum

Admin hesabı yoksa (sunucu kapalıyken):

```bash
./scripts/pocketbase-superuser.sh
```

İlk çalıştırmada migration'lar ve demo içerik otomatik yüklenir.

## Yedek

```bash
./scripts/pocketbase-backup.sh
```

`pb_data` ve yedekler git'e dahil değildir; yedekleri şifreli/özel tutun.

## Notlar

- Varsayılan olarak yalnız `127.0.0.1` dinlenir; telefonla aynı ağdan açmak için:
  `PB_HTTP=0.0.0.0:8090 ./baslat.sh` (admin panelini internete açmayın).
- Farklı port: `PB_HTTP=127.0.0.1:8091 ./baslat.sh`.
- Tarayıcı açılmasın: `BASLAT_NO_BROWSER=1 ./baslat.sh`.
- GitHub Pages yalnızca manuel **statik önizleme** içindir; admin, form, SSR ve sitemap için PocketBase sunucusu gerekir.
- Günlük kullanımda `pb_public` her seferinde senkronlanır; içerik değişiklikleri PocketBase panelinden yapılır.
