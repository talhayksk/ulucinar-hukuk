/// <reference path="../pb_data/types.d.ts" />

// Optional, consent-based analytics. The site only loads a provider script
// after the visitor accepts cookies AND the provider/id are configured here.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("site_settings")

  collection.fields.add(new SelectField({
    name: "analytics_provider",
    values: ["none", "plausible"],
    maxSelect: 1,
    help: "none = no analytics. plausible = load Plausible after cookie consent.",
  }))
  collection.fields.add(new TextField({
    name: "analytics_id",
    max: 120,
    help: "Plausible data-domain value, e.g. ulucinar.av.tr. Empty = disabled.",
  }))
  app.save(collection)

  try {
    const record = app.findFirstRecordByData(
      "site_settings",
      "firm_name",
      "ULUÇINAR Hukuk & Danışmanlık"
    )
    record.set("analytics_provider", "none")
    record.set("analytics_id", "")
    app.save(record)
  } catch (err) {
    // settings record not created yet
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("site_settings")
  collection.fields.removeByName("analytics_provider")
  collection.fields.removeByName("analytics_id")
  app.save(collection)
})
