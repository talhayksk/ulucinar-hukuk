/// <reference path="../pb_data/types.d.ts" />

// New articles start as drafts unless the author explicitly publishes them.
// (Contact-form defaults and validation live in security.pb.js.)
onRecordCreateRequest(function (e) {
  const record = e.record
  if (record && !record.get("status")) {
    record.set("status", "draft")
  }
  e.next()
}, "articles")
