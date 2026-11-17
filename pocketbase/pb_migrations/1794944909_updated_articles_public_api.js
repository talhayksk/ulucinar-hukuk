/// <reference path="../pb_data/types.d.ts" />

// Adds the fields the public article pages need (external cover image, author)
// and a composite index for the "latest published" listing.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("articles")

  collection.fields.add(new URLField({
    name: "cover_url",
    help: "Optional external cover image URL (used when no file is uploaded).",
  }))
  collection.fields.add(new TextField({
    name: "author",
    max: 120,
    help: "Optional display name of the author.",
  }))

  const indexes = []
  const current = collection.indexes || []
  for (let i = 0; i < current.length; i++) {
    indexes.push(current[i])
  }
  indexes.push("CREATE INDEX `idx_articles_status_published_at` ON `articles` (`status`, `published_at`)")
  collection.indexes = indexes

  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("articles")
  collection.fields.removeByName("cover_url")
  collection.fields.removeByName("author")

  const indexes = []
  const current = collection.indexes || []
  for (let i = 0; i < current.length; i++) {
    if (current[i].indexOf("idx_articles_status_published_at") === -1) {
      indexes.push(current[i])
    }
  }
  collection.indexes = indexes

  app.save(collection)
})
