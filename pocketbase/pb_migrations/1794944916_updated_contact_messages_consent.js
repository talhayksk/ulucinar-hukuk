/// <reference path="../pb_data/types.d.ts" />

// KVKK consent trail for the public contact form (Y-03) plus the metadata the
// form already sends (source/page). status/consent_at are enforced server-side
// by pb_hooks/security.pb.js.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("contact_messages")

  collection.fields.add(new BoolField({
    name: "kvkk_consent",
    required: true,
    help: "Must be true: the visitor accepted the KVKK notice.",
  }))
  collection.fields.add(new DateField({
    name: "consent_at",
    help: "Server timestamp of the consent (set on create, client value ignored).",
  }))
  collection.fields.add(new TextField({
    name: "source",
    max: 120,
    help: "Where the submission came from, e.g. website.",
  }))
  collection.fields.add(new TextField({
    name: "page",
    max: 300,
    help: "URL of the page that hosted the form.",
  }))

  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("contact_messages")
  collection.fields.removeByName("kvkk_consent")
  collection.fields.removeByName("consent_at")
  collection.fields.removeByName("source")
  collection.fields.removeByName("page")
  app.save(collection)
})
