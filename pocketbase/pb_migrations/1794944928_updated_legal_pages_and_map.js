/// <reference path="../pb_data/types.d.ts" />

// Legal pages (draft content, to be reviewed by a lawyer before launch) and
// the Google Maps link stored in site_settings.
migrate((app) => {
  // ---- map_url setting ----
  const settings = app.findCollectionByNameOrId("site_settings")
  settings.fields.add(new URLField({
    name: "map_url",
    help: "Google Maps link used by the contact section and schema.org hasMap.",
  }))
  app.save(settings)

  const mapUrl =
    "https://www.google.com/maps/search/?api=1&query=" +
    "Karaba%C5%9F%20Mh.%20Cumhuriyet%20Blv.%20No%3A177%2F2%2C%20%C4%B0zmit%20%2F%20KOCAEL%C4%B0"

  try {
    const record = app.findFirstRecordByData(
      "site_settings",
      "firm_name",
      "ULUÇINAR Hukuk & Danışmanlık"
    )
    record.set("map_url", mapUrl)
    app.save(record)
  } catch (err) {
    // settings record not created yet
  }

  // ---- pages ----
  const warning =
    '<p class="legal-warning"><strong>TASLAK — yayın öncesi hukuki inceleme gerekir.</strong> ' +
    "Bu metin örnek amaçlı hazırlanmıştır; gerçek veri işleme faaliyetlerinize göre " +
    "güncellenmesi ve bir avukat tarafından incelenmesi gerekir.</p>"

  const pages = [
    {
      slug: "kvkk",
      title: "KVKK Aydınlatma Metni",
      content:
        warning +
        "<h2>1. Veri sorumlusu</h2>" +
        "<p>6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında veri sorumlusu " +
        "ULUÇINAR Hukuk &amp; Danışmanlık'tır. Adres: Karabaş Mh. Cumhuriyet Blv. No:177/2, " +
        "İzmit / KOCAELİ. Telefon: +90 (501) 943 63 41. E-posta: info@ulucinar.av.tr.</p>" +
        "<h2>2. İşlenen kişisel veriler</h2>" +
        "<ul><li>Kimlik ve iletişim verileri: ad soyad, telefon, e-posta</li>" +
        "<li>Talep içeriği: konu ve mesaj metni</li>" +
        "<li>KVKK onay kaydı: onay durumu ve onay zamanı</li>" +
        "<li>Teknik veriler: sunucu erişim kayıtları (IP, tarayıcı bilgisi, istek zamanı)</li></ul>" +
        "<h2>3. İşleme amaçları ve hukuki sebep</h2>" +
        "<p>Veriler; iletişim taleplerinin yanıtlanması, randevu ve dosya süreçlerinin yürütülmesi, " +
        "hukuki yükümlülüklerin yerine getirilmesi ve site güvenliğinin sağlanması amacıyla işlenir. " +
        "Hukuki sebepler: KVKK m.5/2 (sözleşmenin kurulması veya ifası, hukuki yükümlülük, meşru " +
        "menfaat) ve açık rıza.</p>" +
        "<h2>4. Aktarım</h2>" +
        "<p>Kişisel veriler, yasal zorunluluklar dışında üçüncü kişilerle paylaşılmaz; hizmet " +
        "aldığımız bilişim altyapısı sağlayıcılarıyla yalnızca hizmetin gerektirdiği ölçüde ve " +
        "sözleşmesel güvencelerle aktarılabilir.</p>" +
        "<h2>5. Saklama süresi</h2>" +
        "<p>Veriler, işleme amacının gerektirdiği süre ve ilgili mevzuatta öngörülen zamanaşımı " +
        "süreleri boyunca saklanır; süre sonunda silinir veya anonim hale getirilir.</p>" +
        "<h2>6. İlgili kişinin hakları</h2>" +
        "<p>KVKK m.11 uyarınca; verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, " +
        "düzeltilmesini veya silinmesini isteme, işlemeye itiraz etme ve zararın giderilmesini " +
        "talep etme haklarına sahipsiniz.</p>" +
        "<h2>7. Başvuru</h2>" +
        "<p>Taleplerinizi yukarıdaki adrese yazılı olarak veya info@ulucinar.av.tr adresine " +
        "iletebilirsiniz. Başvurular en geç 30 gün içinde yanıtlanır.</p>",
      published: true,
    },
    {
      slug: "cerez-politikasi",
      title: "Çerez Politikası",
      content:
        warning +
        "<h2>1. Bu sitede kullanılan çerezler</h2>" +
        "<p>Site yalnızca zorunlu ve teknik çerezler ile tarayıcı yerel depolaması (localStorage) " +
        "kullanır. Analitik, reklam veya profilleme çerezi kullanılmaz.</p>" +
        "<h3>Zorunlu / teknik</h3>" +
        "<ul><li>Oturum ve güvenlik amacıyla sunucu tarafında oluşturulan teknik kayıtlar</li>" +
        "<li><code>ulucinar-cookie-consent</code>: çerez bilgilendirmesine verdiğiniz yanıtı " +
        "hatırlamak için kullanılan localStorage kaydı</li></ul>" +
        "<h2>2. Üçüncü taraf hizmetler</h2>" +
        "<p>Sayfalarımızda gömülü harita veya reklam iframe'i yoktur. \"Google Maps'te aç\" " +
        "bağlantısı yeni sekmede harici bir siteye yönlendirir; ilgili sitenin gizlilik politikası " +
        "geçerlidir. Yazı tipleri ve görseller kendi sunucumuzdan yüklenir.</p>" +
        "<h2>3. Tercihleriniz</h2>" +
        "<p>Bilgilendirme bandındaki \"Kabul et\" veya \"Sadece zorunlu\" seçenekleri şu anda aynı " +
        "davranışı gösterir: yalnızca zorunlu/teknik çerezler kullanılır. Tercihiniz tarayıcınızda " +
        "saklanır ve sonraki ziyaretlerde bant gösterilmez. Tarayıcı ayarlarından çerezleri ve " +
        "yerel depolamayı silebilirsiniz.</p>" +
        "<h2>4. İletişim</h2>" +
        "<p>Sorularınız için info@ulucinar.av.tr veya +90 (501) 943 63 41.</p>",
      published: true,
    },
    {
      slug: "gizlilik",
      title: "Gizlilik Politikası",
      content:
        warning +
        "<h2>1. Kapsam</h2>" +
        "<p>Bu politika, ULUÇINAR Hukuk &amp; Danışmanlık web sitesini ziyaret ettiğinizde ve " +
        "iletişim formunu kullandığınızda verilerin nasıl işlendiğini açıklar.</p>" +
        "<h2>2. Toplanan veriler</h2>" +
        "<p>İletişim formu aracılığıyla ad soyad, telefon, e-posta, konu ve mesaj; ayrıca KVKK " +
        "onay kaydı ve teknik erişim kayıtları toplanır.</p>" +
        "<h2>3. Kullanım amaçları</h2>" +
        "<p>Talepleri yanıtlamak, randevu ve dosya süreçlerini yürütmek, site güvenliğini sağlamak " +
        "ve yasal yükümlülükleri yerine getirmek.</p>" +
        "<h2>4. Paylaşım</h2>" +
        "<p>Veriler, açık rızanız veya yasal zorunluluk olmadan üçüncü kişilerle paylaşılmaz. " +
        "Avukatlık mesleği kapsamındaki bilgiler mesleki sır olarak korunur.</p>" +
        "<h2>5. Güvenlik</h2>" +
        "<p>Verilere yetkisiz erişimi önlemek için erişim kontrolü, sunucu tarafı doğrulama ve " +
        "düzenli yedekleme uygulanır.</p>" +
        "<h2>6. Haklarınız ve başvuru</h2>" +
        "<p>KVKK kapsamındaki haklarınız için /kvkk/ sayfasındaki başvuru yöntemini " +
        "kullanabilirsiniz. İletişim: info@ulucinar.av.tr, +90 (501) 943 63 41.</p>",
      published: true,
    },
  ]

  const collection = app.findCollectionByNameOrId("pages")
  for (const page of pages) {
    try {
      app.findFirstRecordByData("pages", "slug", page.slug)
      // already seeded (or edited by the admin) - leave it untouched
      continue
    } catch (err) {
      // not found: create it
    }
    const record = new Record(collection)
    record.set("slug", page.slug)
    record.set("title", page.title)
    record.set("content", page.content)
    record.set("published", page.published)
    app.save(record)
  }
}, (app) => {
  for (const slug of ["kvkk", "cerez-politikasi", "gizlilik"]) {
    try {
      app.delete(app.findFirstRecordByData("pages", "slug", slug))
    } catch (err) {
      // already gone
    }
  }
  const settings = app.findCollectionByNameOrId("site_settings")
  settings.fields.removeByName("map_url")
  app.save(settings)
})
