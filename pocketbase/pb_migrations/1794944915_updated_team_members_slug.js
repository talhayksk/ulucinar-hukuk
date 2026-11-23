/// <reference path="../pb_data/types.d.ts" />

// Stable public identifier for team members so the site can map a card to a
// record (previously only sort_order/name existed).
migrate((app) => {
  const collection = app.findCollectionByNameOrId("team_members")
  collection.fields.add(new TextField({
    name: "slug",
    required: true,
    max: 120,
    help: "Stable public identifier, e.g. kurucu-ortak.",
  }))
  app.save(collection)

  // Backfill before adding the unique index: three empty strings would clash.
  const slugsBySortOrder = { 1: "kurucu-ortak", 2: "ortak-avukat", 3: "avukat" }
  const records = app.findRecordsByFilter("team_members", "id != ''", "sort_order", 0, 0)
  for (const record of records) {
    if (record.getString("slug")) {
      continue
    }
    const order = record.getInt("sort_order")
    const slug = slugsBySortOrder[order]
    if (!slug) {
      continue
    }
    record.set("slug", slug)
    app.save(record)
  }

  const indexes = []
  const current = collection.indexes || []
  for (let i = 0; i < current.length; i++) {
    indexes.push(current[i])
  }
  indexes.push("CREATE UNIQUE INDEX `idx_team_members_slug` ON `team_members` (`slug`)")
  collection.indexes = indexes
  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("team_members")

  const indexes = []
  const current = collection.indexes || []
  for (let i = 0; i < current.length; i++) {
    if (current[i].indexOf("idx_team_members_slug") === -1) {
      indexes.push(current[i])
    }
  }
  collection.indexes = indexes
  collection.fields.removeByName("slug")
  app.save(collection)
})
