/// <reference path="../pb_data/types.d.ts" />

// Keep the admin-managed descriptions in step with the static <meta> text:
// 159 characters (~150-160 target), İzmit/Kocaeli, no over-long service list.
migrate((app) => {
  const description =
    "ULUÇINAR Hukuk & Danışmanlık: İzmit/Kocaeli merkezli; aile, ceza, ticaret, iş, " +
    "gayrimenkul ve miras hukukunda gizlilik esaslı danışmanlık ve avukatlık hizmeti."

  const record = app.findFirstRecordByData(
    "site_settings",
    "firm_name",
    "ULUÇINAR Hukuk & Danışmanlık"
  )
  record.set("default_seo_description", description)
  record.set("seo_description", description)
  app.save(record)
}, (app) => {
  const record = app.findFirstRecordByData(
    "site_settings",
    "firm_name",
    "ULUÇINAR Hukuk & Danışmanlık"
  )
  record.set(
    "default_seo_description",
    "İzmit/Kocaeli merkezli ULUÇINAR Hukuk & Danışmanlık: aile, ceza, ticaret, iş, gayrimenkul, miras, icra, idare ve göç hukukunda gizlilik esaslı danışmanlık."
  )
  record.set(
    "seo_description",
    "ULUÇINAR Hukuk & Danışmanlık: İzmit/Kocaeli merkezli, gizlilik esaslı hukuki danışmanlık ve avukatlık hizmetleri. Aile, ceza, ticaret, iş, gayrimenkul, miras, icra, idare ve göç hukuku."
  )
  app.save(record)
})
