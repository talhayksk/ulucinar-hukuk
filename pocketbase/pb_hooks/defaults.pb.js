/// <reference path="../pb_data/types.d.ts" />

// New articles start as drafts unless the author explicitly publishes them.
onRecordCreateRequest((e) => {
  const record = e.record
  if (record && !record.get("status")) {
    record.set("status", "draft")
  }
  e.next()
}, "articles")

// Incoming contact form submissions enter the inbox as "new".
onRecordCreateRequest((e) => {
  const record = e.record
  if (record && !record.get("status")) {
    record.set("status", "new")
  }
  e.next()
}, "contact_messages")
