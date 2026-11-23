/// <reference path="../pb_data/types.d.ts" />

// Archive/filtering metadata: a single category per article plus free tags.
// Public list/view rules stay untouched (status = 'published').
migrate((app) => {
  const articles = app.findCollectionByNameOrId("articles")

  articles.fields.add(new SelectField({
    name: "category",
    values: [
      "Aile Hukuku",
      "Ceza Hukuku",
      "Ticaret ve Şirketler",
      "İş Hukuku",
      "Gayrimenkul",
      "Miras",
      "İcra ve İflas",
      "İdare",
      "Yabancılar ve Göç",
      "Genel",
    ],
    maxSelect: 1,
    help: "Primary practice area shown on cards and used by the archive filter.",
  }))
  articles.fields.add(new JSONField({
    name: "tags",
    maxSize: 2000,
    help: 'Free tags, e.g. ["arabuluculuk","aile"].',
  }))
  app.save(articles)

  const seeds = {
    "aile-hukukunda-uzlasma": { category: "Aile Hukuku", tags: ["arabuluculuk", "aile"] },
    "is-hukukunda-ise-iade": { category: "İş Hukuku", tags: ["işe iade", "fesih"] },
    "gayrimenkulde-tapu-guvenligi": { category: "Gayrimenkul", tags: ["tapu", "gayrimenkul"] },
  }

  for (const slug in seeds) {
    try {
      const record = app.findFirstRecordByData("articles", "slug", slug)
      record.set("category", seeds[slug].category)
      record.set("tags", JSON.stringify(seeds[slug].tags))
      app.save(record)
    } catch (err) {
      // Article not present (seed not applied).
    }
  }
}, (app) => {
  const articles = app.findCollectionByNameOrId("articles")
  articles.fields.removeByName("category")
  articles.fields.removeByName("tags")
  app.save(articles)
})
