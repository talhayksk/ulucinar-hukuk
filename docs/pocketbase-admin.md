# PocketBase Yönetim Rehberi — ULUÇINAR Hukuk & Danışmanlık

Bu rehber, site içeriğini PocketBase yönetim panelinden nasıl güncelleyeceğinizi anlatır.
Panel İngilizce arayüzlüdür; alan adları kodla aynıdır, açıklamalar Türkçedir.

- Panel adresi (yerel): `http://127.0.0.1:8090/_/`
- Yayındaki adres: `https://<alan-adiniz>/_/` (yayına geçince)
- Sürüm: PocketBase 0.42.3

> Site yayın adayıdır. Tüm sayfa bölümleri, makale arşivi, detay sayfaları, hukuki sayfalar ve
> formlar PocketBase'e bağlıdır. Kalan işler içerik/yayın girdileridir: alan adı, e-posta, çalışma
> saatleri, istatistikler, ekip isim/bio/fotoğrafları, sosyal adresler, hukuki metinlerin
> incelenmesi ve e-posta bildirimi (Resend). Bunlar aşağıda ayrıca işaretlenmiştir.

## 1. Giriş ve hesap

1. Tarayıcıda `/_/` adresini açın.
2. Süper kullanıcı e-posta ve şifrenizle giriş yapın.
3. Hesap yoksa, sunucuda bir kez şu komutla oluşturun:

   ```bash
   ./scripts/pocketbase-superuser.sh
   ```

   Komut e-posta ve şifreyi gizli olarak sorar; şifre dosyaya yazılmaz. Şifre en az 8 karakter
   olmalıdır. Aynı komut, mevcut e-posta için şifreyi **sıfırlar** — dikkatli kullanın.

Şifrenizi kimseyle paylaşmayın, README veya mesajlara yazmayın. Yayında paneli herkese açık
internete bırakmayın; mümkünse IP kısıtı/VPN ve güçlü bir şifre kullanın.

## 2. Panelde gezinme

Sol menüde başlıca bölümler:

- **Collections** — içerik tabloları (makaleler, ayarlar, mesajlar, ekip, SSS vb.)
- **Settings** — yedekleme, uygulama ayarları, loglar
- **Logs** — istek ve hata kayıtları

Bir koleksiyonu açtığınızda kayıt listesi görünür. Sağ üstteki **New record** yeni kayıt ekler;
satıra tıklayınca düzenleme formu açılır.

## 3. Makale ekleme

**Collections → articles → New record**

| Alan | Zorunlu | Ne yazılmalı |
|---|---|---|
| `title` | Evet | Makale başlığı (en fazla 180 karakter) |
| `slug` | Evet | URL'de görünecek kısa ad. **Benzersiz** olmalı. Yalnız küçük harf, rakam ve tek tire: `aile-hukukunda-uzlasma`. Türkçe karakter, boşluk, büyük harf ve `../` gibi karakterler reddedilir. |
| `excerpt` | Hayır | Ana sayfa kartında görünen 1–2 cümlelik özet |
| `body` | Hayır | Makalenin HTML gövdesi (başlık, paragraf, liste, alıntı) |
| `cover` | Hayır | Kapak görseli dosyası (JPEG/PNG/WebP, en fazla 5 MB; tek dosya). **Önerilen yöntem.** |
| `cover_url` | Hayır | Harici kapak adresi. Mevcut güvenlik politikası (CSP) harici görselleri engellediği için sitede görünmez; kullanmayın. |
| `published_at` | Hayır | Yayın tarihi. Ana sayfa ve arşiv sıralaması bu alana göre **yeniden eskiye** yapılır. |
| `category` | Hayır | Arşivdeki kategori filtresi; ör. `Aile Hukuku`. |
| `tags` | Hayır | Arşiv aramasında kullanılan JSON etiket dizisi; ör. `["arabuluculuk","aile"]`. |
| `status` | Evet | `draft` (taslak) veya `published` (yayında) |
| `author` | Hayır | Görünen yazar adı |
| `seo_title` | Hayır | Arama sonuçlarında görünecek başlık (50–60 karakter önerilir) |
| `seo_description` | Hayır | Arama sonuçları açıklaması (140–160 karakter önerilir) |
| `og_image_url` | Hayır | Sosyal medya paylaşım görseli adresi (tam `https://` URL) |

Notlar:

- `status` boş bırakılırsa kayıt otomatik olarak **draft** kaydedilir. Bu, yanlışlıkla yayına
  almayı önler.
- Kapak için **dosya yükleyin** (`cover`). Sitenin güvenlik politikası yalnız kendi sunucusundan
  gelen görsellere izin verir; `cover_url` ile verilen harici adresler tarayıcıda gösterilmez.
  Yükleme yapılmazsa kartta görsel alanı boş kalır.
- Makale bağlantısı `slug` ile kurulur: `/makale/<slug>/`. Yayından sonra `slug` değiştirirseniz
  eski bağlantı kırılır ve eski sayfa kaldırılır; mevcut makalelerde değiştirmemeye çalışın.
- `body` alanı HTML kabul eder. Yalnız izin verilen biçimlendirme korunur: paragraf, `h2`–`h4`,
  liste, alıntı, kalın/italik, bağlantı, görsel, tablo. `script`, `style`, `iframe`, `object`,
  `embed`, `svg`, `onclick` gibi olay özellikleri ve `javascript:`/`data:` bağlantıları
  **temizlenir**. Yine de yalnız güvendiğiniz kaynaklardan HTML yapıştırın; otomatik temizlik
  editör sorumluluğunun yerini tutmaz.
- HTML editöründe görünmeyen/bozuk etiketler kayıt sırasında düşebilir. Kaydettikten sonra
  makaleyi sitede kontrol edin.

## 4. SEO alanlarını doldurma

- `seo_title` boşsa makale başlığı + marka adı kullanılır. Doldurursanız **tam başlık** olarak
  kullanılır; sonuna ayrıca marka eklenmez.
- `seo_description` boşsa `excerpt`, o da boşsa site varsayılan açıklaması kullanılır.
- `og_image_url` boşsa kapak görseli, o da yoksa sitenin varsayılan paylaşım görseli kullanılır.
  Görsel adresi **tam URL** olmalıdır (`https://...`), göreli yol çalışmaz.
- Başlık ve açıklamayı anahtar kelime doldurmadan, sade Türkçe yazın. Tırnak/emoji kullanmayın.

Bu alanlar sunucu tarafında oluşturulan makale sayfasında (`/makale/<slug>/`) `<title>`, meta
açıklama ve sosyal paylaşım etiketlerini besler. Sitemap ve robots dosyaları da yayınlanmış
makalelerden otomatik üretilir.

## 5. Yayınlama ve geri çekme

1. Makaleyi kaydedin (taslak olarak kalabilir).
2. Önizleme: `status = published` yapmadan önce gövdeyi ve kapağı kontrol edin.
3. `status` alanını **published** yapıp kaydedin.
4. Ana sayfadaki “Makaleler” bölümü en yeni **6 yayınlanmış** makaleyi gösterir; tüm arşiv
   `/makaleler/` adresinde arama ve kategori filtreleriyle listelenir. Daha eski makaleler
   silinmez.
5. Sunucu, makale sayfasını `/makale/<slug>/` adresinde üretir; sitemap ve robots otomatik
   güncellenir.
6. Yayından kaldırmak için `status = draft` yapıp kaydedin. Kayıt silinmez, siteden kalkar;
   üretilmiş sayfa bir sonraki eşitlemede kaldırılır. Tarayıcı/önbellek nedeniyle en fazla
   5 dakika eski sayfa görülebilir.
7. Tamamen silmek için kaydı açıp **Delete** kullanın. Bu işlem geri alınamaz; önce yedek alın.

Yayın kontrol listesi:

- [ ] `title` ve `slug` dolu, slug benzersiz ve küçük harfli
- [ ] `excerpt` 1–2 cümle
- [ ] `body` başlık/paragraf yapısıyla okunuyor; istenmeyen HTML yok
- [ ] Kapak görseli `cover` alanına yüklendi (5 MB sınırı)
- [ ] `published_at` doğru
- [ ] `status = published`
- [ ] `seo_title` / `seo_description` dolduruldu
- [ ] `/makale/<slug>/` adresi açılıyor

## 6. Site ayarları (`site_settings`)

**Collections → site_settings**

Gerçek iletişim bilgileri: telefon `+90 (501) 943 63 41`, WhatsApp `https://wa.me/905019436341`,
adres `Karabaş Mh. Cumhuriyet Blv. No:177/2, İzmit / KOCAELİ`, harita bağlantısı `map_url`.
E-posta, çalışma saatleri, istatistikler ve ekip isim/fotoğrafları henüz yer tutucudur; hukuki
sayfalar ise taslaktır ve avukat incelemesi bekler.

Bu koleksiyonda **tek kayıt** olmalıdır. Yanlışlıkla ikinci kayıt oluşturmayın; site ilk kaydı
kullanır. Kayıt sayısı 1'den fazlaysa fazlalıkları silin.

### Hangi alan sayfada nereyi besliyor?

| Sayfadaki yer | Alan | Durum |
|---|---|---|
| Üst bilgi, iletişim ve footer telefon/e-posta/adres/saat | `phone`, `email`, `address`, `working_hours` | Sitede aktif (e-posta ve saat yer tutucu) |
| WhatsApp butonları | `whatsapp` | Sitede aktif (`https://wa.me/...` tam adres) |
| Footer kısa açıklama | `tagline` | Sitede aktif |
| Hero küçük notu | `hero_note` | Sitede aktif |
| Hero ana başlık | `hero_title` | Sitede aktif (düz metin) |
| Hero açıklama paragrafı | `hero_lead` | Sitede aktif |
| Hakkımızda başlığı | `about_title` | Sitede aktif |
| Hakkımızda giriş paragrafı | `about_lead` | Sitede aktif |
| Hakkımızda metinleri | `about_body` (HTML) | Sitede aktif |
| Güven şeridindeki 4 sayı | `stats` (JSON) | Sitede aktif (değerler yer tutucu) |
| 3 ilke kartı | `values` (JSON) | Sitede aktif |
| Footer yasal not | `footer_note` | Sitede aktif |
| Ana sayfa `<title>` | `seo_title` | Sitede aktif |
| Ana sayfa meta açıklama | `seo_description` | Sitede aktif |
| Canonical / OG / sitemap adresi | `site_url` | Sunucu tarafında kullanılıyor (alan adı yer tutucu) |
| Google Maps bağlantısı | `map_url` | İletişim bölümü ve schema.org `hasMap`; iframe yok |
| Analytics | `analytics_provider`, `analytics_id` | Yalnız çerez kabulü + sağlayıcı/id doluysa yüklenmeli |
| Sosyal profiller | `socials`, `same_as` | Bağlantılar; gerçek adresler girilmeli |
| Google doğrulama | `google_site_verification` | Search Console kodu (henüz doğrulanmadı) |

### Alan listesi

| Alan | Açıklama |
|---|---|
| `firm_name` | Büro adı (zorunlu) |
| `tagline` | Kısa slogan |
| `phone` | Telefon. `+905019436341` gibi boşluksuz yazın; site görünümü kendisi biçimlendirir. |
| `whatsapp` | WhatsApp bağlantısı: `https://wa.me/905019436341` |
| `email` | İletişim e-postası (şu an `info@ulucinar.av.tr` yer tutucu) |
| `address` | Açık adres: `Karabaş Mh. Cumhuriyet Blv. No:177/2, İzmit / KOCAELİ` |
| `working_hours` | Çalışma saatleri (şu an yer tutucu) |
| `socials` | JSON: `{"instagram":"https://...","linkedin":"https://..."}` |
| `hero_note` | Hero üstündeki kısa etiket |
| `hero_title` / `hero_lead` | Hero başlığı ve açıklaması (düz metin) |
| `about_title` / `about_lead` | Hakkımızda başlığı ve giriş paragrafı |
| `about_body` | Hakkımızda HTML metni |
| `stats` | JSON dizi: `[{"value":"25+","label":"Yıllık deneyim"}]` |
| `values` | JSON dizi: `[{"title":"Mesleki Sır","text":"..."}]` |
| `footer_note` | Footer yasal not |
| `site_url` | Sitenin tam adresi, sonunda `/` olmadan: `https://www.ulucinar.av.tr` |
| `map_url` | Google Maps bağlantısı; iletişim bölümündeki “Google Maps'te aç” ve `hasMap` |
| `analytics_provider` | `none` veya `plausible`; varsayılan `none` |
| `analytics_id` | Plausible `data-domain` değeri (ör. `ulucinar.av.tr`); boşsa analytics kapalı |
| `seo_title` / `seo_description` | Ana sayfa SEO başlığı ve açıklaması |
| `default_seo_title` / `default_seo_description` | Makale sayfaları için varsayılan SEO değerleri |
| `og_image_url` | Varsayılan paylaşım görseli (tam URL) |
| `google_site_verification` | Google Search Console HTML doğrulama kodu |
| `same_as` | JSON: sosyal profil adresleri listesi, ör. `["https://instagram.com/..."]` |

### `stats` ve `values` örnekleri

```json
[
  {"value": "25+", "label": "Yıllık deneyim"},
  {"value": "1.200+", "label": "Takip edilen dosya"}
]
```

```json
[
  {"title": "Mesleki Sır", "text": "Görüşmeler ve dosya bilgileri üçüncü kişilerle paylaşılmaz."}
]
```

JSON'da çift tırnak kullanın, sonda virgül bırakmayın. Anahtar adlarını (`value`, `label`, `title`,
`text`) değiştirmeyin. Mevcut istatistikler **yer tutucudur**; gerçek verilerle değiştirin veya
kaldırın.

Değişiklikten sonra sayfayı yenileyin. Telefon, e-posta, adres, çalışma saatleri, WhatsApp ve
sosyal bağlantılar site genelinde bu kayıttan güncellenir. `site_url` değişirse makale
sayfaları, canonical ve sitemap yeniden üretilir.

## 7. Gelen mesajlar (`contact_messages`)

**Collections → contact_messages**

- Yeni form mesajları `status = new` olarak düşer.
- Okunduğunda `read`, arşivlemek istediğinizde `archived` yapın.
- Listeyi `status` alanına göre filtreleyebilirsiniz.
- Kayıtlar yalnızca yönetici tarafından görülebilir; site ziyaretçisi okuyamaz.
- Her kayıtta iletişim bilgileri, mesaj, `kvkk_consent` (onay), `consent_at` (onay zamanı,
  sunucu tarafından yazılır), `source` ve `page` bulunur.

### KVKK onayı

Formu göndermek için ziyaretçinin KVKK kutusunu işaretlemesi zorunludur:

- `kvkk_consent` `true` değilse istek **400** döner ve kayıt oluşmaz.
- Panelde yeni kayıt her zaman `status = new` olarak düşer; gönderen kişi durumu değiştiremez.
- `consent_at` sunucu saatidir; istemciden gelen değer dikkate alınmaz.

Form gönderimleri dakikada 5 istek ile sınırlıdır. Yoğun spam görürseniz panel/log kayıtlarını
kontrol edin ve barındırma tarafında ek limit uygulayın.

### Formun çalışma biçimi

Form, aynı origin'deki `/api/collections/contact_messages/records` adresine yazar ve KVKK onayını
`kvkk_consent: true` olarak gönderir. Gönderim başarılıysa kayıt panelde görünür; hata olursa
ziyaretçiye mesaj gösterilir. Eski `kvkk` alanı onay yerine **geçmez**.

Tam KVKK aydınlatma metni taslaktır; `/kvkk/` sayfası panelden düzenlenir ve üzerinde hukuki
inceleme uyarısı taşır. Metin avukat tarafından kesinleştirilene kadar uyarı kaldırılmamalıdır.

### Randevu talepleri (`appointments`)

**Collections → appointments**

`/randevu/` formundan gelen ön görüşme talepleri burada toplanır. Kayıtlar public API'de
görünmez; yalnız yönetici okur ve günceller.

| Alan | Not |
|---|---|
| `name`, `phone` | Zorunlu |
| `email` | Opsiyonel |
| `practice_area` | Seçilen çalışma alanı |
| `preferred_date` | Opsiyonel; geçmiş tarih sunucuda reddedilir |
| `preferred_time` | `09:00–12:00`, `13:00–18:30` veya `Fark etmez` |
| `message` | Serbest metin |
| `kvkk_consent`, `consent_at` | Onay zorunlu; `consent_at` sunucu tarafından yazılır |
| `status` | `new` → `contacted` → `closed` |
| `source`, `page` | Form kaynağı ve sayfa yolu |

- Form bir rezervasyon takvimi değildir; talep büro tarafından değerlendirilir.
- Onay yoksa veya tarih geçmişse istek **400** döner; `status` her zaman `new` başlar.
- Gönderimler dakikada 5 istek ile sınırlıdır.
- **E-posta bildirimi opsiyoneldir:** Resend anahtarları sunucuda tanımlıysa talep e-postası
  gönderilir; tanımlı değilse kayıt yalnız panelde görünür. Form her durumda çalışır.

## 8. Diğer içerikler

| Koleksiyon | Kullanım | Not |
|---|---|---|
| `practice_areas` | Ana sayfadaki 9 çalışma alanı kartı, detay penceresi ve `/calisma-alani/<slug>/` sayfası. `published` kapalıysa görünmez; `sort_order` sırayı belirler. | `summary` kartta, `body` modalda ve detay sayfasında gösterilir. |
| `team_members` | Ekip kartları ve `/ekip/<slug>/` sayfaları. `name`, `role`, `bio`, `photo`, `expertise`, `slug`. | `slug` zorunlu ve benzersiz; `photo` yüklenebilir (JPEG/PNG/WebP, 5 MB); bio/uzmanlık detay sayfasını besler. |
| `faq` | Sık sorulan sorular. `question`, `answer`, `sort_order`, `published`. | Akordeon ve `FAQPage` yapısal verisi bu kayıtlardan beslenir. |
| `pages` | `/kvkk/`, `/cerez-politikasi/`, `/gizlilik/` sayfaları. `slug`, `title`, `content`, `published`. | Üç sayfa hazır ama metinler **taslak**; her birinde hukuki inceleme uyarısı var. `slug` sabittir, değiştirmeyin. |

`slug` alanı olan tüm kayıtlarda küçük harf, rakam ve tek tire kullanın. Geçersiz slug kaydı
**400** hatasıyla reddedilir. `published` kapatıldığında kayıt public API'de görünmez.

### Hukuki sayfalar ve çerez bildirimi

**Collections → pages**

- Üç kayıt vardır: `kvkk`, `cerez-politikasi`, `gizlilik`. Her biri `/kvkk/`,
  `/cerez-politikasi/`, `/gizlilik/` adresinde yayınlanır ve footer'dan bağlanır.
- İçerikler **taslaktır** ve sayfaların başında “TASLAK — yayın öncesi hukuki inceleme gerekir”
  uyarısı görünür. Metinler avukat tarafından incelenip kesinleştirilene kadar uyarıyı kaldırmayın.
- `content` alanı HTML kabul eder; izin verilen biçimlendirme korunur. `slug` sabittir; değiştirmek
  sayfa adresini kırar.
- Sayfa güncellenince “Son güncelleme” ve sitemap `lastmod` değeri yenilenir.

Çerez bildirimi ziyaretçiye bir kez gösterilir ve seçim tarayıcıda
`ulucinar-cookie-consent` anahtarıyla saklanır. Sitede analitik/reklam çerezi yoktur; yalnız
zorunlu/teknik çerezler ve yerel depolama kullanılır. Analitik eklenirse hem çerez politikası hem
bildirim metni güncellenmelidir.

### Analytics ve e-posta bildirimi

- **Analytics:** `site_settings` içinde `analytics_provider` (`none`/`plausible`) ve `analytics_id`
  alanları vardır. Yükleyici yalnız ziyaretçi **“Kabul et”** dediyse ve iki alan da doluysa çalışır;
  “Sadece zorunlu” hiçbir analytics yüklemez. Şu an sağlayıcı `none`, gerçek hesap/ID yoktur ve
  hiçbir veri gönderilmemiştir. Etkinleştirmeden önce çerez bandı/politikası metnini (“analitik
  çerezi yoktur” ifadesi) güncelleyin ve tarayıcıda test edin.
- **E-posta:** Form ve randevu kayıtları için opsiyonel Resend bildirimi vardır. Sunucuda
  `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TO` (opsiyonel `RESEND_API_URL`) tanımlıysa bildirim ve
  otomatik yanıt gönderilir; üçü de yoksa özellik sessizce kapalıdır ve form yine **200** döner.
  Anahtarlar panele, repoya veya bu rehbere yazılmaz; `EnvironmentFile` ile root-only dosyadan
  okunur. Gerçek gönderim anahtar sağlanınca test edilmelidir.

## 9. Yedekleme

**Canlı sistemde tercih edilen yol:** Settings → Backups → **Create backup**. Oluşan arşivi indirin
ve sunucu dışında saklayın. Bu yöntem veritabanını tutarlı biçimde yedekler.

Yerel/geliştirme ortamında:

```bash
./scripts/pocketbase-backup.sh
```

Bu komut `pocketbase/pb_data/` klasörünü `pocketbase/backups/<tarih-saat>/` altına kopyalar.
Yedek dizini `0700`, dosyalar `0600` olur; canlı `pb_data` izinleri de sıkılaştırılır. Yedekler
süper kullanıcı parola özetleri ve müvekkil mesajları içerir:

- Sunucu dışına kopyalamadan önce şifreleyin (ör. `age -p` veya `gpg -c`).
- Saklama süresi belirleyin ve eski yedekleri güvenli biçimde silin.
- Sunucu çalışırken alınan kopya **tutarlı olmayabilir**; canlı sistemde panelin Backups
  özelliğini kullanın veya sunucuyu durdurup kopyalayın.

Geri yükleme: sunucuyu durdurun, mevcut `pb_data/` klasörünü yedekleyin, yedek içeriğini
`pb_data/` üzerine kopyalayın, sunucuyu yeniden başlatın. Emin değilseniz önce deneme ortamında
deneyin.

## 10. Sık karşılaşılan durumlar

| Belirti | Olası neden / çözüm |
|---|---|
| Makale sitede görünmüyor | `status` `published` değil; `published_at` boş/eski; ana sayfa yalnızca son 3 kaydı gösterir. |
| Makale adresi 404 | Slug yanlış veya kayıt taslak. `/makale/<slug>/` adresini kontrol edin. |
| Slug hatası (400) | Büyük harf, Türkçe karakter, boşluk veya `../` var. Küçük harf/rakam/tire kullanın. |
| Görsel kırık | `cover` yüklenmemiş veya harici `cover_url` kullanılıyor; güvenlik politikası harici görselleri engeller. Dosya yükleyin. |
| “Slug already exists” | Aynı `slug` başka kayıtta var. Benzersiz bir slug seçin. |
| Form mesajı panele düşmüyor | Sunucu ve `/api/health` çalışıyor mu kontrol edin; form gönderiminde hata varsa tarayıcı konsoluna ve sunucu loglarına bakın. |
| Form 400 hatası | KVKK onayı işaretlenmemiş ya da `kvkk_consent` gönderilmiyor. |
| Randevu 400 hatası | KVKK onayı yok veya `preferred_date` geçmişte. Tarihi kontrol edin. |
| Randevu/mesaj e-postası gelmiyor | Resend anahtarları (`RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TO`) sunucuda tanımlı değil; kayıtlar yalnız panelde. Anahtarlar `EnvironmentFile` ile eklenmeli. |
| Hukuki sayfa düzenlemesi görünmüyor | `pages` kaydının `published` olduğundan ve kaydedildiğinden emin olun; taslak uyarısı metnin parçasıdır. |
| Form 429 hatası | Dakikada 5 gönderim sınırı aşıldı; bir dakika sonra tekrar deneyin. |
| Telefon/adres değişmedi | `site_settings` kaydını kaydedin, sayfayı yenileyin; önbelleği temizleyin. |
| Panel açılmıyor | Sunucu çalışmıyor veya adres yanlış. `./scripts/pocketbase-serve.sh` çıktısını kontrol edin. |

## 11. Güvenlik kuralları

- Süper kullanıcı şifresini yalnızca yetkili kişiler bilmeli; düzenli aralıklarla değiştirin.
- Paneli herkese açık internete korumasız bırakmayın; proxy'de IP kısıtı, VPN veya ek kimlik
  doğrulama kullanın. Mümkünse MFA'yı açın.
- Makale gövdesine ve hakkımızda metnine üçüncü taraflardan script, iframe, style veya bilinmeyen
  etiketler yapıştırmayın. Sunucu/tarayıcı izin verilmeyen etiketleri temizler, ancak yalnız
  güvenilir editörlerin yazması esastır.
- Formdan gelen kişisel verileri yalnız yetkili kişilerle paylaşın; yedeği şifreli saklayın.
- Yedekleri ve `pb_data/` klasörünü git deposuna, e-posta veya mesajlaşmaya koymayın.
- Şüpheli girişleri **Logs** bölümünden kontrol edin; art arda başarısız girişlerde şifreyi
  değiştirin.

## 12. Dış yapılandırma ve yayın öncesi

- **E-posta gönderimi (Resend):** Opsiyoneldir. `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TO`
  (opsiyonel `RESEND_API_URL`) sunucudaki `EnvironmentFile` içinde tanımlanırsa iletişim ve randevu
  bildirimleri gönderilir; eksikse özellik sessizce kapalıdır ve form **200** döner. Anahtarları
  panele, repoya veya dokümana yazmayın; gerçek gönderimi anahtar gelince test edin.
- **Alan adı:** `site_settings.site_url` ve statik meta etiketleri gerçek alan adıyla
  güncellenmeden yayına çıkmayın.
- **Search Console:** DNS TXT veya HTML doğrulama yapılabilir; `google_site_verification` alanı
  vardır. Canlı alan adı ve kullanıcı erişimi gerekir; sitemap doğrulama sonrası gönderilir.
- **Google Business Profile:** Dış hesaptır; NAP bilgileri siteyle birebir aynı olmalı, harita
  bağlantısı `map_url` ile eşleşmeli. Erişim kullanıcıdan alınmalıdır.
- **Analytics:** `analytics_provider`/`analytics_id` alanları vardır; yalnız “Kabul et” sonrası ve
  alanlar doluysa yüklenmelidir. Şu an gerçek hesap/ID yok; çerez politikası güncellenmeden
  etkinleştirmeyin.
- **Diller:** Site şu an yalnız Türkçedir; `/en/` yoktur. TR/EN için çeviri ve PocketBase çok dilli
  alanlar gerekir (sonraki faz).
- **Harita:** iframe yoktur; `map_url` linki ve `hasMap` kullanılır. `geo` ve
  `openingHoursSpecification` gerçek koordinat/saat girilene kadar eklenmemiştir.
- **Hukuki metinler:** `/kvkk/`, `/cerez-politikasi/`, `/gizlilik/` taslaktır; avukat incelemesi
  tamamlanana kadar uyarıyı kaldırmayın.
- **Admin güvenliği:** güçlü ve benzersiz süper kullanıcı şifresi, mümkünse panelden TOTP/MFA,
  `/_/` ve süper kullanıcı uçları için nginx IP allow-list/VPN, **Logs** takibi ve yedek/geri
  yükleme testi. Canlı MFA doğrulanmadı.
- **Yayın testi:** canlı alan adında `/`, `/makaleler/`, bir makale, `/calisma-alani/<slug>/`,
  `/ekip/<slug>/`, `/randevu/`, `/rss.xml`, `/sitemap.xml` ve `/_/` adreslerini kontrol edin;
  Lighthouse/Rich Results ölçümünü yayın sonrası yapın.
