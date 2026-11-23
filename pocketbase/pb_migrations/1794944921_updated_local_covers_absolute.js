/// <reference path="../pb_data/types.d.ts" />

// `articles.cover_url` is a URL field, so a root-relative path is rejected by
// validation ("Must be a valid url"). Use the absolute same-origin asset URL:
// still self-hosted, no third-party request.
migrate((app) => {
  const site = "https://www.ulucinar.av.tr";
  const covers = {
    "aile-hukukunda-uzlasma": "/assets/img/1554224155-6726b3ff858f-1600.jpg",
    "is-hukukunda-ise-iade": "/assets/img/1521737711867-e3b97375f902-1600.jpg",
    "gayrimenkulde-tapu-guvenligi": "/assets/img/1479142506502-19b3a3b7ff33-1600.jpg",
  }

  for (const slug in covers) {
    try {
      const record = app.findFirstRecordByData("articles", "slug", slug)
      record.set("cover_url", site + covers[slug])
      record.set("og_image_url", site + covers[slug])
      app.save(record)
    } catch (err) {
      // Article not present (seed not applied).
    }
  }
}, (app) => {
  const originals = {
    "aile-hukukunda-uzlasma": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80",
    "is-hukukunda-ise-iade": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
    "gayrimenkulde-tapu-guvenligi": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80",
  }

  for (const slug in originals) {
    try {
      const record = app.findFirstRecordByData("articles", "slug", slug)
      record.set("cover_url", originals[slug])
      record.set("og_image_url", originals[slug])
      app.save(record)
    } catch (err) {
      // nothing to revert
    }
  }
})
