/// <reference path="../pb_data/types.d.ts" />

// Static pages managed from the admin panel (e.g. legal notices).
migrate((app) => {
  const collection = new Collection({
    name: "pages",
    type: "base",
    listRule: "published = true",
    viewRule: "published = true",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "slug", type: "text", required: true, max: 140 },
      { name: "title", type: "text", required: true, max: 180 },
      { name: "content", type: "editor", maxSize: 60000 },
      { name: "published", type: "bool" },
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_pages_slug` ON `pages` (`slug`)",
    ],
  })

  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pages")
  app.delete(collection)
})
