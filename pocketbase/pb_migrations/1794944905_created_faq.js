/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    name: "faq",
    type: "base",
    listRule: "published = true",
    viewRule: "published = true",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "question", type: "text", required: true, max: 300 },
      { name: "answer", type: "editor", maxSize: 20000, required: true },
      { name: "sort_order", type: "number", onlyInt: true },
      { name: "published", type: "bool" },
    ],
  })

  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("faq")
  app.delete(collection)
})
