/// <reference path="../pb_data/types.d.ts" />

// Admin-editable copy for the home page: hero, about, stats, principles,
// footer note and the home page SEO title/description. Seeded with the texts
// currently rendered by index.html so nothing changes visually on day one.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("site_settings")

  collection.fields.add(new TextField({ name: "hero_title", max: 200 }))
  collection.fields.add(new TextField({ name: "hero_lead", max: 400 }))
  collection.fields.add(new TextField({ name: "about_title", max: 200 }))
  collection.fields.add(new TextField({ name: "about_lead", max: 500 }))
  collection.fields.add(new EditorField({ name: "about_body", maxSize: 20000 }))
  collection.fields.add(new JSONField({ name: "stats", maxSize: 4000 }))
  collection.fields.add(new JSONField({ name: "values", maxSize: 4000 }))
  collection.fields.add(new TextField({ name: "footer_note", max: 300 }))
  collection.fields.add(new TextField({ name: "seo_title", max: 160 }))
  collection.fields.add(new TextField({ name: "seo_description", max: 400 }))

  app.save(collection)

  const stats = [
    { value: "25+", label: "Yıllık deneyim" },
    { value: "1.200+", label: "Takip edilen dosya" },
    { value: "9", label: "Uzmanlık alanı" },
    { value: "%100", label: "Mesleki gizlilik esası" },
  ]

  const values = [
    {
      title: "Mesleki Sır",
      text: "Görüşmeler ve dosya bilgileri, mesleki sır kapsamında üçüncü kişilerle paylaşılmaz.",
    },
    {
      title: "Bağımsızlık",
      text: "Her dosyada yalnızca hukuka ve müvekkilin menfaatine bağlı, bağımsız bir tutum izlenir.",
    },
    {
      title: "Şeffaflık",
      text: "Süreç, takvim ve olası riskler baştan ve anlaşılır biçimde paylaşılır.",
    },
  ]

  try {
    const record = app.findFirstRecordByData(
      "site_settings",
      "firm_name",
      "ULUÇINAR Hukuk & Danışmanlık"
    )
    record.set("hero_title", "Adalet, güven ve tecrübeyle yanınızdayız.")
    record.set(
      "hero_lead",
      "Bireysel ve kurumsal müvekkillerimize; aile, ticaret, iş ve uyuşmazlık çözümü alanlarında titiz, gizlilik esaslı ve ölçülü bir hukuki destek sunuyoruz."
    )
    record.set("about_title", "Hukukun sakin ve titiz tarafında.")
    record.set(
      "about_lead",
      "ULUÇINAR Hukuk & Danışmanlık, İstanbul'da bireysel ve kurumsal müvekkillerine hukuki danışmanlık ve avukatlık hizmeti sunar."
    )
    record.set(
      "about_body",
      "<p>Her dosyayı kendi gerçekliği içinde ele alır; önce dinler, sonra belgeleri ve seçenekleri açık bir dille paylaşırız. Amacımız kısa vadeli bir sonuç değil, uzun vadede korunmuş bir hukuki denge kurmaktır.</p>" +
        "<p>Çalışma biçimimiz; düzenli bilgilendirme, ölçülü iletişim ve mesleki sır ilkesine tam bağlılık üzerine kuruludur.</p>"
    )
    record.set("stats", JSON.stringify(stats))
    record.set("values", JSON.stringify(values))
    record.set("footer_note", "Bilgilendirme amaçlıdır; avukatlık reklam yasağına uygundur.")
    record.set("seo_title", "ULUÇINAR Hukuk & Danışmanlık | İstanbul")
    record.set(
      "seo_description",
      "ULUÇINAR Hukuk & Danışmanlık: İstanbul merkezli, gizlilik esaslı hukuki danışmanlık ve avukatlık hizmetleri. Aile, ceza, ticaret, iş, gayrimenkul, miras, icra, idare ve göç hukuku."
    )
    app.save(record)
  } catch (err) {
    // Settings record not created yet (fresh install before the seed migration).
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("site_settings")
  const names = [
    "hero_title", "hero_lead", "about_title", "about_lead", "about_body",
    "stats", "values", "footer_note", "seo_title", "seo_description",
  ]
  for (const name of names) {
    collection.fields.removeByName(name)
  }
  app.save(collection)
})
