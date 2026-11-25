/// <reference path="../pb_data/types.d.ts" />

// Sitemap lastmod for practice areas and team members (QA finding).
// Articles and pages already have autodate created/updated; these two
// collections were missing them, so their sitemap entries had no <lastmod>.
migrate((app) => {
  const targets = ["practice_areas", "team_members"]

  for (let i = 0; i < targets.length; i++) {
    const name = targets[i]
    const collection = app.findCollectionByNameOrId(name)
    if (!collection.fields.getByName("created")) {
      collection.fields.add(new AutodateField({ name: "created", onCreate: true }))
    }
    if (!collection.fields.getByName("updated")) {
      collection.fields.add(
        new AutodateField({ name: "updated", onCreate: true, onUpdate: true })
      )
    }
    app.save(collection)

    // Existing rows: touch them so "updated" is populated for published items.
    try {
      const records = app.findRecordsByFilter(name, "", "sort_order", 200, 0)
      for (let j = 0; j < records.length; j++) {
        app.save(records[j])
      }
    } catch (err) {
      // ignore backfill failures; the fields still exist for future saves
    }
  }
}, (app) => {
  const targets = ["practice_areas", "team_members"]
  for (let i = 0; i < targets.length; i++) {
    const collection = app.findCollectionByNameOrId(targets[i])
    collection.fields.removeByName("created")
    collection.fields.removeByName("updated")
    app.save(collection)
  }
})
