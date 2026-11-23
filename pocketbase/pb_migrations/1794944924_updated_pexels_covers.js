/// <reference path="../pb_data/types.d.ts" />

// New Pexels photo set (free license) with semantic file names. Update the
// demo article covers so the cards and the SSR pages use the new images.
migrate((app) => {
  const site = "https://www.ulucinar.av.tr";
  const covers = {
    "aile-hukukunda-uzlasma": "/assets/img/article-mediation-1600.jpg",
    "is-hukukunda-ise-iade": "/assets/img/article-employment-1600.jpg",
    "gayrimenkulde-tapu-guvenligi": "/assets/img/article-property-1600.jpg",
  }

  for (const slug in covers) {
    try {
      const record = app.findFirstRecordByData("articles", "slug", slug)
      record.set("cover_url", covers[slug])
      record.set("og_image_url", site + covers[slug])
      app.save(record)
    } catch (err) {
      // Article not present (seed not applied).
    }
  }
}, (app) => {
  const site = "https://www.ulucinar.av.tr"
  const previous = {
    "aile-hukukunda-uzlasma": "/assets/img/1554224155-6726b3ff858f-1600.jpg",
    "is-hukukunda-ise-iade": "/assets/img/1521737711867-e3b97375f902-1600.jpg",
    "gayrimenkulde-tapu-guvenligi": "/assets/img/1479142506502-19b3a3b7ff33-1600.jpg",
  }
  for (const slug in previous) {
    try {
      const record = app.findFirstRecordByData("articles", "slug", slug)
      record.set("cover_url", previous[slug])
      record.set("og_image_url", site + previous[slug])
      app.save(record)
    } catch (err) {
      // nothing to revert
    }
  }
})
