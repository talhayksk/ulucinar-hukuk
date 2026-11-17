/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    name: "articles",
    type: "base",
    listRule: "status = 'published'",
    viewRule: "status = 'published'",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "title", type: "text", required: true, max: 180 },
      { name: "slug", type: "text", required: true, max: 140 },
      { name: "excerpt", type: "text", max: 600 },
      { name: "body", type: "editor", maxSize: 60000 },
      { name: "cover", type: "file", maxSelect: 1, maxSize: 5242880, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
      { name: "published_at", type: "date" },
      { name: "status", type: "select", values: ["draft", "published"], maxSelect: 1, required: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_articles_slug` ON `articles` (`slug`)",
    ],
  })

  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("articles")
  app.delete(collection)
})
