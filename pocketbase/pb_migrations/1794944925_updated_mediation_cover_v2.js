/// <reference path="../pb_data/types.d.ts" />

// Client feedback: the mediation article cover showed a person. Replace it with
// the Pexels 6077797 image (gold scales + laptop, no people), file set
// article-mediation-v2-*.
migrate((app) => {
  const record = app.findFirstRecordByData("articles", "slug", "aile-hukukunda-uzlasma")
  record.set("cover_url", "/assets/img/article-mediation-v2-1600.jpg")
  record.set("og_image_url", "https://www.ulucinar.av.tr/assets/img/article-mediation-v2-1600.jpg")
  app.save(record)
}, (app) => {
  const record = app.findFirstRecordByData("articles", "slug", "aile-hukukunda-uzlasma")
  record.set("cover_url", "/assets/img/article-mediation-1600.jpg")
  record.set("og_image_url", "https://www.ulucinar.av.tr/assets/img/article-mediation-1600.jpg")
  app.save(record)
})
