/// <reference path="../pb_data/types.d.ts" />

// One-off data fix: the "Yabancılar ve Göç" practice area title was edited in
// the dashboard with a stray " ty" suffix. Restore the intended label.
migrate((app) => {
  const record = app.findFirstRecordByData("practice_areas", "slug", "goc-hukuku")
  record.set("title", "Yabancılar ve Göç")
  app.save(record)
}, (app) => {
  // Data-only correction; nothing to revert.
})
