/// <reference path="../pb_data/types.d.ts" />

// O-05 follow-up: the demo articles and the site default share image were
// still pointing at images.unsplash.com. Point them at the local, self-hosted
// copies in assets/img so the public site makes no third-party image calls.
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
      record.set("cover_url", covers[slug])
      // og:image must be absolute for social crawlers.
      record.set("og_image_url", site + covers[slug])
      app.save(record)
    } catch (err) {
      // Article not present (seed not applied).
    }
  }

  try {
    const settings = app.findFirstRecordByData(
      "site_settings",
      "firm_name",
      "ULUÇINAR Hukuk & Danışmanlık"
    )
    settings.set("og_image_url", site + "/assets/img/og-cover.jpg")
    app.save(settings)
  } catch (err) {
    // Settings record not created yet.
  }
}, (app) => {
  const site = "https://www.ulucinar.av.tr";
  const originals = {
    "aile-hukukunda-uzlasma": {
      cover: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80",
    },
    "is-hukukunda-ise-iade": {
      cover: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
    },
    "gayrimenkulde-tapu-guvenligi": {
      cover: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80",
    },
  }

  for (const slug in originals) {
    try {
      const record = app.findFirstRecordByData("articles", "slug", slug)
      record.set("cover_url", originals[slug].cover)
      record.set("og_image_url", originals[slug].cover)
      app.save(record)
    } catch (err) {
      // nothing to revert
    }
  }

  try {
    const settings = app.findFirstRecordByData(
      "site_settings",
      "firm_name",
      "ULUÇINAR Hukuk & Danışmanlık"
    )
    settings.set("og_image_url", site + "/assets/logo/ulucinar-gold.png")
    app.save(settings)
  } catch (err) {
    // nothing to revert
  }
})
