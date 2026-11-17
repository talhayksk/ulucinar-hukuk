/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    name: "practice_areas",
    type: "base",
    listRule: "published = true",
    viewRule: "published = true",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "title", type: "text", required: true, max: 120 },
      { name: "slug", type: "text", required: true, max: 120 },
      { name: "summary", type: "text", max: 400 },
      { name: "body", type: "editor", maxSize: 20000 },
      { name: "icon", type: "text", max: 40 },
      { name: "sort_order", type: "number", onlyInt: true },
      { name: "published", type: "bool" },
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_practice_areas_slug` ON `practice_areas` (`slug`)",
    ],
  })

  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("practice_areas")
  app.delete(collection)
})
