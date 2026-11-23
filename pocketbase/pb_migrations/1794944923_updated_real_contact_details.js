/// <reference path="../pb_data/types.d.ts" />

// Real contact details supplied by the client (İzmit / Kocaeli office).
// Only the fields below are touched; other admin edits are preserved.
// Text fields that may have been edited are updated with a targeted
// "İstanbul" -> "İzmit" replacement instead of being overwritten wholesale.
migrate((app) => {
  const record = app.findFirstRecordByData(
    "site_settings",
    "firm_name",
    "ULUÇINAR Hukuk & Danışmanlık"
  )

  record.set("phone", "+905019436341")
  record.set("whatsapp", "https://wa.me/905019436341")
  record.set("address", "Karabaş Mh. Cumhuriyet Blv. No:177/2, İzmit / KOCAELİ")
  record.set("hero_note", "İzmit · Hukuk & Danışmanlık")
  record.set("default_seo_title", "ULUÇINAR Hukuk & Danışmanlık | İzmit/Kocaeli")
  record.set(
    "default_seo_description",
    "İzmit/Kocaeli merkezli ULUÇINAR Hukuk & Danışmanlık: aile, ceza, ticaret, iş, gayrimenkul, miras, icra, idare ve göç hukukunda gizlilik esaslı danışmanlık."
  )
  record.set("seo_title", "ULUÇINAR Hukuk & Danışmanlık | İzmit/Kocaeli")
  record.set(
    "seo_description",
    "ULUÇINAR Hukuk & Danışmanlık: İzmit/Kocaeli merkezli, gizlilik esaslı hukuki danışmanlık ve avukatlık hizmetleri. Aile, ceza, ticaret, iş, gayrimenkul, miras, icra, idare ve göç hukuku."
  )

  const cityFix = (value) =>
    String(value || "")
      .replace(/İstanbul'da/g, "İzmit'te")
      .replace(/İstanbul merkezli/g, "İzmit/Kocaeli merkezli")
      .replace(/İstanbul/g, "İzmit")

  ;["about_title", "about_lead", "about_body", "footer_note"].forEach((field) => {
    const current = record.getString(field)
    if (current && current.indexOf("İstanbul") !== -1) {
      record.set(field, cityFix(current))
    }
  })

  app.save(record)
}, (app) => {
  const record = app.findFirstRecordByData(
    "site_settings",
    "firm_name",
    "ULUÇINAR Hukuk & Danışmanlık"
  )
  record.set("phone", "+902120000000")
  record.set("whatsapp", "https://wa.me/905000000000")
  record.set("address", "Teşvikiye Cad. No: 00, Nişantaşı / İstanbul")
  record.set("hero_note", "İstanbul · Hukuk & Danışmanlık")
  record.set("default_seo_title", "ULUÇINAR Hukuk & Danışmanlık | İstanbul")
  record.set("seo_title", "ULUÇINAR Hukuk & Danışmanlık | İstanbul")
  app.save(record)
})
