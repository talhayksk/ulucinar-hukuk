/// <reference path="../pb_data/types.d.ts" />

// `cover_url` started as a URL field, which rejects root-relative paths. The
// covers are now self-hosted under assets/img; a text field lets the same
// value work on any host (local preview, staging, production) without baking
// the domain into the record.
migrate((app) => {
  const articles = app.findCollectionByNameOrId("articles")
  articles.fields.removeByName("cover_url")
  articles.fields.add(new TextField({
    name: "cover_url",
    max: 300,
    help: "Cover image URL: root-relative (/assets/img/...) or absolute.",
  }))
  app.save(articles)

  const covers = {
    "aile-hukukunda-uzlasma": "/assets/img/1554224155-6726b3ff858f-1600.jpg",
    "is-hukukunda-ise-iade": "/assets/img/1521737711867-e3b97375f902-1600.jpg",
    "gayrimenkulde-tapu-guvenligi": "/assets/img/1479142506502-19b3a3b7ff33-1600.jpg",
  }

  for (const slug in covers) {
    try {
      const record = app.findFirstRecordByData("articles", "slug", slug)
      record.set("cover_url", covers[slug])
      app.save(record)
    } catch (err) {
      // Article not present (seed not applied).
    }
  }
}, (app) => {
  const articles = app.findCollectionByNameOrId("articles")
  articles.fields.removeByName("cover_url")
  articles.fields.add(new URLField({ name: "cover_url" }))
  app.save(articles)
})
