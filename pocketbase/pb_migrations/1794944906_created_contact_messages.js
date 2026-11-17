/// <reference path="../pb_data/types.d.ts" />

// Public contact form inbox. Anyone may create a record; only superusers
// may read, update or delete them.
migrate((app) => {
  const collection = new Collection({
    name: "contact_messages",
    type: "base",
    listRule: null,
    viewRule: null,
    createRule: "",
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "name", type: "text", required: true, max: 120 },
      { name: "phone", type: "text", required: true, max: 40 },
      { name: "email", type: "email", required: true },
      { name: "subject", type: "text", required: true, max: 120 },
      { name: "message", type: "text", required: true, max: 4000 },
      { name: "status", type: "select", values: ["new", "read", "archived"], maxSelect: 1 },
    ],
  })

  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("contact_messages")
  app.delete(collection)
})
