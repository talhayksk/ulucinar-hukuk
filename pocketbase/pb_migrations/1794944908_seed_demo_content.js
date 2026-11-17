/// <reference path="../pb_data/types.d.ts" />

// Demo content so the dashboard and the public API are not empty on first run.
// Every record here is placeholder copy that matches the brief; real firm data
// must replace it from the admin panel before launch.

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
  seedRecord(app, "site_settings", {
    firm_name: "ULUÇINAR Hukuk & Danışmanlık",
    tagline: "Adalet, güven ve tecrübeyle yanınızdayız.",
    phone: "+902120000000",
    whatsapp: "https://wa.me/905000000000",
    email: "info@ulucinar.av.tr",
    address: "Teşvikiye Cad. No: 00, Nişantaşı / İstanbul",
    working_hours: "Pazartesi – Cuma 09.00 – 18.30",
    socials: JSON.stringify({ instagram: "", linkedin: "" }),
    hero_note: "İstanbul · Hukuk & Danışmanlık",
  })

  const practiceAreas = [
    {
      title: "Aile Hukuku",
      slug: "aile-hukuku",
      summary: "Boşanma, velayet, nafaka ve mal rejimi süreçleri; müvekkilin mahremiyeti gözetilerek yürütülür.",
      body: "<p>Anlaşmalı ve çekişmeli boşanma, velayet, nafaka, mal rejiminin tasfiyesi ve aile içi uyuşmazlıklarda danışmanlık ve temsil.</p>",
      icon: "scale",
      sort_order: 1,
      published: true,
    },
    {
      title: "Ceza Hukuku",
      slug: "ceza-hukuku",
      summary: "Soruşturma ve kovuşturma aşamalarında delil ve hak temelli savunma.",
      body: "<p>İfade ve sorgu süreçleri, tutuklama ve adli kontrol incelemeleri, kovuşturma aşamasında müdafilik.</p>",
      icon: "gavel",
      sort_order: 2,
      published: true,
    },
    {
      title: "Ticaret ve Şirketler",
      slug: "ticaret-hukuku",
      summary: "Şirket kuruluşu, ticari sözleşmeler ve ortaklık uyuşmazlıkları.",
      body: "<p>Şirket kuruluşu ve hisse devri, ticari sözleşmelerin hazırlanması, ortaklık ve rekabet uyuşmazlıkları.</p>",
      icon: "columns",
      sort_order: 3,
      published: true,
    },
    {
      title: "İş Hukuku",
      slug: "is-hukuku",
      summary: "İş sözleşmesi, fesih, kıdem ve ihbar; işçi ve işveren uyuşmazlıkları.",
      body: "<p>İş sözleşmelerinin hazırlanması, işe iade, kıdem ve ihbar tazminatı, mobbing ve iş kazası dosyaları.</p>",
      icon: "clock",
      sort_order: 4,
      published: true,
    },
    {
      title: "Gayrimenkul Hukuku",
      slug: "gayrimenkul-hukuku",
      summary: "Tapu, kat mülkiyeti, kira ve imar uyuşmazlıkları.",
      body: "<p>Tapu iptali ve tescil, kira sözleşmeleri ve tahliye, kat mülkiyeti, imar ve kamulaştırma uyuşmazlıkları.</p>",
      icon: "home",
      sort_order: 5,
      published: true,
    },
    {
      title: "Miras Hukuku",
      slug: "miras-hukuku",
      summary: "Tereke tespiti, mirasçılık belgesi, tenkis ve paylaşım.",
      body: "<p>Mirasçılık belgesi, terekenin tespiti ve paylaşımı, tenkis ve denkleştirme davaları, vasiyetname düzenlemeleri.</p>",
      icon: "scroll",
      sort_order: 6,
      published: true,
    },
    {
      title: "İcra ve İflas",
      slug: "icra-hukuku",
      summary: "Alacak takibi, haciz, itirazın iptali ve iflas süreçleri.",
      body: "<p>İlamlı ve ilamsız takip, itirazın iptali ve menfi tespit, haciz işlemleri, konkordato ve iflas dosyaları.</p>",
      icon: "gavel",
      sort_order: 7,
      published: true,
    },
    {
      title: "İdare Hukuku",
      slug: "idare-hukuku",
      summary: "İdari işlemlerin iptali, tam yargı ve kamu ihale uyuşmazlıkları.",
      body: "<p>İdari işlemin iptali, tam yargı ve tazminat davaları, kamu ihale uyuşmazlıkları, memur disiplin süreçleri.</p>",
      icon: "columns",
      sort_order: 8,
      published: true,
    },
    {
      title: "Yabancılar ve Göç",
      slug: "goc-hukuku",
      summary: "İkamet, vatandaşlık, sınır dışı ve uluslararası koruma başvuruları.",
      body: "<p>İkamet izinleri, Türk vatandaşlığı başvuruları, sınır dışı kararlarına itiraz ve uluslararası koruma süreçleri.</p>",
      icon: "globe",
      sort_order: 9,
      published: true,
    },
  ]

  for (const area of practiceAreas) {
    seedRecord(app, "practice_areas", area)
  }

  const teamMembers = [
    {
      name: "Av. Ad Soyad",
      role: "Kurucu Ortak",
      bio: "<p>Yer tutucu kayıt. Gerçek isim, özgeçmiş ve fotoğraf admin panelinden eklenecek.</p>",
      expertise: JSON.stringify(["Ticaret Hukuku", "Sözleşmeler"]),
      sort_order: 1,
      published: true,
    },
    {
      name: "Av. Ad Soyad",
      role: "Ortak Avukat",
      bio: "<p>Yer tutucu kayıt. Gerçek isim, özgeçmiş ve fotoğraf admin panelinden eklenecek.</p>",
      expertise: JSON.stringify(["Aile Hukuku", "Miras Hukuku"]),
      sort_order: 2,
      published: true,
    },
    {
      name: "Av. Ad Soyad",
      role: "Avukat",
      bio: "<p>Yer tutucu kayıt. Gerçek isim, özgeçmiş ve fotoğraf admin panelinden eklenecek.</p>",
      expertise: JSON.stringify(["İş Hukuku", "İcra Hukuku"]),
      sort_order: 3,
      published: true,
    },
  ]

  for (const member of teamMembers) {
    seedRecord(app, "team_members", member)
  }

  const articles = [
    {
      title: "Aile hukukunda uzlaşma: arabuluculuğun rolü",
      slug: "aile-arabuluculuk",
      excerpt: "Anlaşmalı boşanma ve velayet uyuşmazlıklarında arabuluculuğun sürece etkisi.",
      body: "<p>Arabuluculuk, tarafların kendi çözümlerini üretmesine imkân tanır ve özellikle çocukla kişisel ilişki ile nafaka konularında daha hızlı bir sonuç sağlayabilir.</p><p>Bu yazı genel bilgilendirme amaçlıdır; somut dosyanın değerlendirmesi için randevu alınması önerilir.</p>",
      published_at: "2026-09-18 09:00:00.000Z",
      status: "published",
    },
    {
      title: "Ticari sözleşmelerde risk yönetimi",
      slug: "ticari-sozlesme-riski",
      excerpt: "Sözleşme müzakeresinde ceza koşulu, tahkim ve fesih maddelerinin önemi.",
      body: "<p>İyi tasarlanmış bir sözleşme, uyuşmazlık çıktıktan sonra değil; henüz müzakereler sürerken riski azaltır. Ceza koşulu, fesih ve tahkim maddeleri bu dengenin ana parçalarıdır.</p><p>Bu yazı genel bilgilendirme amaçlıdır.</p>",
      published_at: "2026-10-02 09:00:00.000Z",
      status: "published",
    },
    {
      title: "Miras paylaşımında denkleştirme",
      slug: "miras-denklestirme",
      excerpt: "Sağlar arası kazandırmaların miras paylaşımına etkisi.",
      body: "<p>Mirasbırakanın hayattayken yaptığı kazandırmalar, paylaşım sırasında denkleştirmeye tabi olabilir. Hangi kazandırmaların bu kapsama girdiği dosyanın özelliklerine göre değerlendirilir.</p><p>Bu yazı genel bilgilendirme amaçlıdır.</p>",
      published_at: "2026-10-21 09:00:00.000Z",
      status: "published",
    },
  ]

  for (const article of articles) {
    seedRecord(app, "articles", article)
  }

  const faqItems = [
    {
      question: "İlk görüşme nasıl gerçekleşiyor?",
      answer: "<p>Ön görüşme randevu ile ofiste veya çevrim içi yapılır. Görüşmede konunun kapsamı, izlenecek yol ve ücret konusunda bilgi verilir.</p>",
      sort_order: 1,
      published: true,
    },
    {
      question: "Vekâlet ücreti nasıl belirleniyor?",
      answer: "<p>Ücret; işin kapsamı, harcanacak emek ve süre dikkate alınarak yazılı olarak belirlenir. Baro tarifesindeki asgari ücretin altında vekâlet üstlenilmez.</p>",
      sort_order: 2,
      published: true,
    },
    {
      question: "Görüşmeler gizli mi?",
      answer: "<p>Evet. Avukatlık mesleğinin temel ilkelerinden biri mesleki sırdır; görüşme ve dosya bilgileri üçüncü kişilerle paylaşılmaz.</p>",
      sort_order: 3,
      published: true,
    },
    {
      question: "Şehir dışından hizmet alabilir miyim?",
      answer: "<p>Evet. Dosyalar çevrim içi görüşme ve elektronik tebligat üzerinden yürütülebilir; duruşmalar için yetkili mahkemede hazır bulunulur.</p>",
      sort_order: 4,
      published: true,
    },
    {
      question: "Dava ne kadar sürer?",
      answer: "<p>Süre; dosyanın niteliğine, mahkemenin iş yüküne ve delil durumuna göre değişir. Bu nedenle önceden kesin bir süre taahhüt edilemez.</p>",
      sort_order: 5,
      published: true,
    },
  ]

  for (const item of faqItems) {
    seedRecord(app, "faq", item)
  }
}, (app) => {
  const slugs = [
    "aile-hukuku", "ceza-hukuku", "ticaret-hukuku", "is-hukuku", "gayrimenkul-hukuku",
    "miras-hukuku", "icra-hukuku", "idare-hukuku", "goc-hukuku",
  ]
  for (const slug of slugs) {
    seedDeleteBy(app, "practice_areas", "slug", slug)
  }

  const articleSlugs = ["aile-arabuluculuk", "ticari-sozlesme-riski", "miras-denklestirme"]
  for (const slug of articleSlugs) {
    seedDeleteBy(app, "articles", "slug", slug)
  }

  const questions = [
    "İlk görüşme nasıl gerçekleşiyor?",
    "Vekâlet ücreti nasıl belirleniyor?",
    "Görüşmeler gizli mi?",
    "Şehir dışından hizmet alabilir miyim?",
    "Dava ne kadar sürer?",
  ]
  for (const question of questions) {
    seedDeleteBy(app, "faq", "question", question)
  }

  seedDeleteBy(app, "site_settings", "firm_name", "ULUÇINAR Hukuk & Danışmanlık")
  seedDeleteBy(app, "team_members", "role", "Kurucu Ortak")
  seedDeleteBy(app, "team_members", "role", "Ortak Avukat")
  seedDeleteBy(app, "team_members", "role", "Avukat")
})
