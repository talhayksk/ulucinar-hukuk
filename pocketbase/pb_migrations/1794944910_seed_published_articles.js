/// <reference path="../pb_data/types.d.ts" />

// Replaces the first placeholder articles with publishable demo articles that
// exercise the public article API (slug lookup, rich HTML body, cover_url).
// All copy is demo text for the ULUÇINAR site, not legal advice.

function seedRecord(app, collectionName, data) {
  const collection = app.findCollectionByNameOrId(collectionName)
  const record = new Record(collection)
  for (const key in data) {
    record.set(key, data[key])
  }
  app.save(record)
}

function seedDeleteBy(app, collectionName, field, value) {
  try {
    const record = app.findFirstRecordByData(collectionName, field, value)
    app.delete(record)
  } catch (err) {
    // record already gone - nothing to roll back
  }
}

migrate((app) => {
  // Superseded demo records from the initial seed.
  seedDeleteBy(app, "articles", "slug", "aile-arabuluculuk")
  seedDeleteBy(app, "articles", "slug", "ticari-sozlesme-riski")
  seedDeleteBy(app, "articles", "slug", "miras-denklestirme")

  const articles = [
    {
      title: "Aile hukukunda uzlaşma: arabuluculuğun rolü",
      slug: "aile-hukukunda-uzlasma",
      excerpt: "Anlaşmalı boşanma, velayet ve nafaka uyuşmazlıklarında arabuluculuğun sürece etkisi.",
      body: "<p>Boşanma ve velayet uyuşmazlıklarında taraflar çoğu zaman hem duygusal hem de hukuki bir yük taşır. Arabuluculuk, bu yükü azaltmayı hedefleyen ve tarafların kendi çözümünü kurmasına imkân tanıyan bir yoldur.</p><h2>Arabuluculuk ne zaman devreye girer?</h2><p>Anlaşmalı boşanmada taraflar protokol üzerinde birlikte çalışır. Velayet, kişisel ilişki ve nafaka başlıklarında ise arabuluculuk, mahkeme süreci başlamadan önce bir çerçeve oluşturabilir.</p><ul><li>Çocukla kişisel ilişkinin takvimi</li><li>Nafaka miktarı ve artış esasları</li><li>Mal rejimine ilişkin kalemlerin ayrıştırılması</li></ul><h2>Sürecin dosyaya etkisi</h2><p>Uzlaşmayla netleşen başlıklar, mahkemede tartışma alanını daraltır. Yine de her dosyanın kendine özgü olduğu ve arabuluculuğun her uyuşmazlıkta uygun olmadığı unutulmamalıdır.</p><blockquote>Uzlaşma, çoğu zaman tarafların kendi çözümünü kurmasıdır; vekilin görevi bu zemini hukuken güvenli hale getirmektir.</blockquote><p>Bu yazı genel bilgilendirme amaçlıdır; somut dosyanız için randevu alarak değerlendirme yapılması önerilir.</p>",
      cover_url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80",
      published_at: "2026-09-18 09:00:00.000Z",
      author: "ULUÇINAR Hukuk & Danışmanlık",
      status: "published",
    },
    {
      title: "İş hukukunda işe iade: süreler ve koşullar",
      slug: "is-hukukunda-ise-iade",
      excerpt: "İşe iade davasının koşulları, otuz günlük başvuru süresi ve fesih bildiriminin önemi.",
      body: "<p>İş sözleşmesi feshedilen işçi, feshin geçersizliğini ileri sürerek işe iade talep edebilir. Ancak bu yol her dosyada açık değildir; kanunda belirtilen koşulların birlikte gerçekleşmesi gerekir.</p><h2>İşe iadenin temel koşulları</h2><ul><li>Belirsiz süreli iş sözleşmesi bulunması</li><li>İşyerinde otuz veya daha fazla işçi çalışması</li><li>İşverenin geçerli bir sebep göstermemesi</li></ul><p>Koşullar sağlandığında dava, fesih bildiriminin tebliğinden itibaren otuz gün içinde açılmalıdır. Bu süre hak düşürücüdür; kaçırılması hâlinde işe iade talep edilemez.</p><h2>Fesih bildirimi ve kayıtlar</h2><p>Fesih bildiriminde sebebin açıkça gösterilmesi, dosyanın seyri açısından belirleyicidir. İşyeri kayıtları, yazışmalar ve tanık beyanları bu değerlendirmenin parçasıdır.</p><blockquote>Sürelerin kaçırılması, esastan haklı bir dosyada dahi telafisi güç bir kayıp yaratabilir.</blockquote><p>Bu yazı genel bilgilendirme amaçlıdır; fesih tebliğinden sonra vakit kaybetmeden hukuki destek alınması önerilir.</p>",
      cover_url: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
      published_at: "2026-10-06 09:00:00.000Z",
      author: "ULUÇINAR Hukuk & Danışmanlık",
      status: "published",
    },
    {
      title: "Gayrimenkulde tapu güvenliği: alım satımda kontrol listesi",
      slug: "gayrimenkulde-tapu-guvenligi",
      excerpt: "Tapu kaydı, takyidat, imar durumu ve ödeme planı: alım satım öncesi kontrol edilmesi gerekenler.",
      body: "<p>Gayrimenkul alım satımında asıl risk, bedelin ödenmesi ile tapu devrinin farklı zamanlarda gerçekleşmesinden doğar. Bu nedenle sözleşme ve ödeme planı, tapu kaydıyla birlikte değerlendirilmelidir.</p><h2>Tapu kaydında nelere bakılır?</h2><ul><li>Takyidat bilgisi: ipotek, haciz, şerh</li><li>İmar durumu ve kullanım amacı</li><li>Emlak vergisi ve aidat borçları</li></ul><p>Kayıtta görünen bir şerh, devrin yapılabilmesi veya bedelin güvenliği açısından doğrudan etkili olabilir. Bu nedenle inceleme, sözleşme imzalanmadan önce yapılmalıdır.</p><h2>Sözleşme ve ödeme planı</h2><p>Ödeme takviminin tapu randevusuyla eşleştirilmesi, ceza koşulu ve cayma hâllerinin açıkça yazılması tarafların menfaatini korur.</p><blockquote>Tapu devri ile ödeme, mümkün olduğunca eş zamanlı yürütülmelidir.</blockquote><p>Bu yazı genel bilgilendirme amaçlıdır; işlem öncesi dosya bazında inceleme yapılması önerilir.</p>",
      cover_url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80",
      published_at: "2026-10-24 09:00:00.000Z",
      author: "ULUÇINAR Hukuk & Danışmanlık",
      status: "published",
    },
  ]

  for (const article of articles) {
    seedRecord(app, "articles", article)
  }
}, (app) => {
  const slugs = ["aile-hukukunda-uzlasma", "is-hukukunda-ise-iade", "gayrimenkulde-tapu-guvenligi"]
  for (const slug of slugs) {
    seedDeleteBy(app, "articles", "slug", slug)
  }
})
