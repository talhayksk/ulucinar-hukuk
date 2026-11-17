/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    name: "team_members",
    type: "base",
    listRule: "published = true",
    viewRule: "published = true",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "name", type: "text", required: true, max: 120 },
      { name: "role", type: "text", max: 120 },
      { name: "bio", type: "editor", maxSize: 20000 },
      { name: "photo", type: "file", maxSelect: 1, maxSize: 5242880, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
      { name: "expertise", type: "json", maxSize: 2000 },
      { name: "sort_order", type: "number", onlyInt: true },
      { name: "published", type: "bool" },
    ],
  })

  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("team_members")
  app.delete(collection)
})
