# PocketBase Yönetim Rehberi — ULUÇINAR Hukuk & Danışmanlık

Bu rehber, site içeriğini PocketBase yönetim panelinden nasıl güncelleyeceğinizi anlatır.
Panel İngilizce arayüzlüdür; alan adları kodla aynıdır, açıklamalar Türkçedir.

- Panel adresi (yerel): `http://127.0.0.1:8090/_/`
- Yayındaki adres: `https://<alan-adiniz>/_/` (yayına geçince)
- Sürüm: PocketBase 0.42.3

> Site yayın adayıdır (v0.1.0). Tüm sayfa bölümleri ve form PocketBase'e bağlıdır. Kalan işler
> içerik ve yayın girdileridir: alan adı, e-posta, çalışma saatleri, istatistikler, ekip
> isim/fotoğrafları, sosyal adresler ve tam KVKK metni. Bunlar aşağıda ayrıca işaretlenmiştir.

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
| `published_at` | Hayır | Yayın tarihi. Ana sayfa sıralaması bu alana göre **yeniden eskiye** yapılır. |
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
4. Ana sayfadaki “Makaleler” bölümü en yeni **3 yayınlanmış** makaleyi gösterir. Daha eski
   makaleler silinmez, yalnızca ana sayfa listesinde görünmez.
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

Tam KVKK aydınlatma metni henüz yayınlanmamıştır; formdaki bağlantı sayfa içindeki kısa nota
gider. Metin `pages` koleksiyonuna eklendiğinde bağlantı oraya yönlendirilmelidir.

## 8. Diğer içerikler

| Koleksiyon | Kullanım | Not |
|---|---|---|
| `practice_areas` | Ana sayfadaki 9 çalışma alanı kartı ve detay penceresi. `published` kapalıysa görünmez; `sort_order` sırayı belirler. | `summary` kartta, `body` modalda gösterilir; kartlar ortalanmış düzendedir. |
| `team_members` | Ekip kartları. `name`, `role`, `bio`, `photo`, `expertise`, `slug`. | `slug` zorunlu ve benzersiz (örn. `kurucu-ortak`); yalnız küçük harf/rakam/tire. `photo` yüklenebilir (JPEG/PNG/WebP, 5 MB); yüklenmezse amblem görünür. |
| `faq` | Sık sorulan sorular. `question`, `answer`, `sort_order`, `published`. | Akordeon ve `FAQPage` yapısal verisi bu kayıtlardan beslenir. |
| `pages` | KVKK aydınlatma metni gibi serbest sayfalar. `slug` benzersiz olmalı. | Şu an boş; public sayfa rotası yok, metin eklenince bağlantı güncellenmeli. |

`slug` alanı olan tüm kayıtlarda küçük harf, rakam ve tek tire kullanın. Geçersiz slug kaydı
**400** hatasıyla reddedilir. `published` kapatıldığında kayıt public API'de görünmez.

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
| Görsel kırık | `cover` yüklenmemiş ve `cover_url` geçersiz; tam `https://` adresi kullanın veya dosya yükleyin. |
| “Slug already exists” | Aynı `slug` başka kayıtta var. Benzersiz bir slug seçin. |
| Form mesajı panele düşmüyor | Form güncellemesi henüz tamamlanmamış olabilir; `kvkk_consent` gönderilmiyor veya endpoint boş. Geliştiriciye bildirin. |
| Form 400 hatası | KVKK onayı işaretlenmemiş ya da `kvkk_consent` gönderilmiyor. |
| Form 429 hatası | Dakikada 5 gönderim sınırı aşıldı; bir dakika sonra tekrar deneyin. |
| Telefon/adres değişmedi | `site_settings` kaydını kaydedin, sayfayı yenileyin; önbelleği temizleyin. |
| Yeni hero/hakkımızda metni görünmüyor | Bu alanların sayfaya bağlanması sürüyor; kayıt doğru olsa da frontend güncellemesi gerekir. |
| Panel açılmıyor | Sunucu çalışmıyor veya adres yanlış. `./scripts/pocketbase-serve.sh` çıktısını kontrol edin. |

## 11. Güvenlik kuralları

- Süper kullanıcı şifresini yalnızca yetkili kişiler bilmeli; düzenli aralıklarla değiştirin.
- Paneli herkese açık internete korumasız bırakmayın; proxy'de IP kısıtı, VPN veya ek kimlik
  doğrulama kullanın. Mümkünse MFA'yı açın.
- Makale gövdesine üçüncü taraflardan script, iframe, style veya bilinmeyen etiketler
  yapıştırmayın. Sunucu makale gövdelerini temizler, ancak yalnız güvenilir editörlerin yazması
  esastır. Hakkımızda metni gibi henüz sayfaya bağlanmamış HTML alanlarında da sade metin kullanın.
- Formdan gelen kişisel verileri yalnız yetkili kişilerle paylaşın; yedeği şifreli saklayın.
- Yedekleri ve `pb_data/` klasörünü git deposuna, e-posta veya mesajlaşmaya koymayın.
- Şüpheli girişleri **Logs** bölümünden kontrol edin; art arda başarısız girişlerde şifreyi
  değiştirin.
