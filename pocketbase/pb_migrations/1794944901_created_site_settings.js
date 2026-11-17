/// <reference path="../pb_data/types.d.ts" />

// Single-record content collection for the site-wide settings.
// PocketBase has no "single" collection type, so this is a base collection
// that is expected to hold exactly one record (enforced by convention + the
// public list giving the same payload every time).
migrate((app) => {
  const collection = new Collection({
    name: "site_settings",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "firm_name", type: "text", required: true, max: 160 },
      { name: "tagline", type: "text", max: 240 },
      { name: "phone", type: "text", max: 40 },
      { name: "whatsapp", type: "text", max: 120 },
      { name: "email", type: "email" },
      { name: "address", type: "text", max: 400 },
      { name: "working_hours", type: "text", max: 200 },
      { name: "socials", type: "json", maxSize: 4000 },
      { name: "hero_note", type: "text", max: 300 },
    ],
  })

  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("site_settings")
  app.delete(collection)
})
