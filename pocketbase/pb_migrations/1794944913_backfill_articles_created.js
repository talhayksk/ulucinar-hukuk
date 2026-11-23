/// <reference path="../pb_data/types.d.ts" />

// Autodate fields only fill on insert/update, so the records that existed
// before 1794944912_updated_articles_timestamps.js still have an empty
// "created". Backfill it from published_at for a consistent admin list.
migrate((app) => {
  app.db().newQuery(
    "UPDATE articles SET created = published_at WHERE created IS NULL OR created = ''"
  ).execute()
}, (app) => {
  // Data-only backfill; nothing to revert.
})
