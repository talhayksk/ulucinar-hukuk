/// <reference path="../pb_data/types.d.ts" />

// PocketBase 0.42 base collections have no created/updated columns by default.
// Legal pages need them for "Son güncelleme", sitemap lastmod and schema
// dateModified.
migrate((app) => {
  const pages = app.findCollectionByNameOrId("pages")
  pages.fields.add(new AutodateField({ name: "created", onCreate: true }))
  pages.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }))
  app.save(pages)

  const records = app.findRecordsByFilter("pages", "id != ''", "id", 0, 0)
  for (const record of records) {
    app.save(record) // triggers the onUpdate autodate
  }
  app.db().newQuery(
    "UPDATE pages SET created = updated WHERE (created IS NULL OR created = '') AND updated IS NOT NULL"
  ).execute()
}, (app) => {
  const pages = app.findCollectionByNameOrId("pages")
  pages.fields.removeByName("created")
  pages.fields.removeByName("updated")
  app.save(pages)
})
