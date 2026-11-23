/// <reference path="../pb_data/types.d.ts" />

// PocketBase 0.42 does not add created/updated to base collections
// automatically. The SEO output (sitemap <lastmod>, schema dateModified)
// needs them, so they are declared explicitly here.
migrate((app) => {
  const articles = app.findCollectionByNameOrId("articles")
  articles.fields.add(new AutodateField({ name: "created", onCreate: true }))
  articles.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }))
  app.save(articles)

  // Backfill the existing demo articles so the sitemap has a stable lastmod.
  const records = app.findRecordsByFilter("articles", "id != ''", "id", 0, 0)
  for (const record of records) {
    const published = record.getString("published_at")
    if (!record.getString("created")) {
      record.set("created", published || "2026-09-18 09:00:00.000Z")
    }
    if (!record.getString("updated")) {
      record.set("updated", published || "2026-09-18 09:00:00.000Z")
    }
    app.save(record)
  }
}, (app) => {
  const articles = app.findCollectionByNameOrId("articles")
  articles.fields.removeByName("created")
  articles.fields.removeByName("updated")
  app.save(articles)
})
