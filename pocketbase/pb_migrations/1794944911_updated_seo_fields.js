/// <reference path="../pb_data/types.d.ts" />

// P0 SEO fields: per-article overrides and site-wide defaults used by the
// static article renderer (pb_hooks/seo.pb.js).
migrate((app) => {
  const articles = app.findCollectionByNameOrId("articles")
  articles.fields.add(new TextField({
    name: "seo_title",
    max: 120,
    help: "Optional <title> override (aim for 50-60 characters).",
  }))
  articles.fields.add(new TextField({
    name: "seo_description",
    max: 400,
    help: "Optional meta description override (aim for 140-160 characters).",
  }))
  articles.fields.add(new URLField({
    name: "og_image_url",
    help: "Optional social share image URL; falls back to cover, then site default.",
  }))
  app.save(articles)

  const settings = app.findCollectionByNameOrId("site_settings")
  settings.fields.add(new URLField({
    name: "site_url",
    help: "Public origin used for canonical, OG and sitemap URLs (no trailing slash).",
  }))
  settings.fields.add(new TextField({ name: "default_seo_title", max: 160 }))
  settings.fields.add(new TextField({ name: "default_seo_description", max: 400 }))
  settings.fields.add(new URLField({ name: "og_image_url" }))
  settings.fields.add(new TextField({
    name: "google_site_verification",
    max: 120,
    help: "Google Search Console HTML tag verification token.",
  }))
  settings.fields.add(new JSONField({
    name: "same_as",
    maxSize: 2000,
    help: "Social profile URLs for schema.org sameAs.",
  }))
  app.save(settings)

  // Seed: placeholder domain until the client confirms the real one.
  try {
    const record = app.findFirstRecordByData("site_settings", "firm_name", "ULUÇINAR Hukuk & Danışmanlık")
    record.set("site_url", "https://www.ulucinar.av.tr")
    record.set("default_seo_title", "ULUÇINAR Hukuk & Danışmanlık | İstanbul")
    record.set("default_seo_description", "İstanbul merkezli ULUÇINAR Hukuk & Danışmanlık: aile, ceza, ticaret, iş, gayrimenkul, miras, icra, idare ve göç hukukunda gizlilik esaslı danışmanlık.")
    record.set("og_image_url", "https://www.ulucinar.av.tr/assets/logo/ulucinar-gold.png")
    record.set("google_site_verification", "")
    record.set("same_as", JSON.stringify([]))
    app.save(record)
  } catch (err) {
    // No settings record yet (fresh install before the seed migration).
  }

  const articleSeo = {
    "aile-hukukunda-uzlasma": {
      seo_title: "Aile Hukukunda Arabuluculuk ve Uzlaşma | ULUÇINAR",
      seo_description: "Boşanma, velayet ve nafaka uyuşmazlıklarında arabuluculuğun rolü, sürece etkisi ve süreç öncesinde dikkat edilmesi gereken noktalar.",
      og_image_url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80",
    },
    "is-hukukunda-ise-iade": {
      seo_title: "İşe İade Davası: Süreler ve Koşullar | ULUÇINAR",
      seo_description: "İşe iade davasının koşulları, otuz günlük hak düşürücü süre ve fesih bildiriminin dosyaya etkisi üzerine kısa bir değerlendirme.",
      og_image_url: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
    },
    "gayrimenkulde-tapu-guvenligi": {
      seo_title: "Tapu Güvenliği: Alım Satımda Kontrol Listesi | ULUÇINAR",
      seo_description: "Gayrimenkul alım satımında tapu kaydı, takyidat, imar durumu ve ödeme planı nasıl kontrol edilir? İşlem öncesi pratik bir liste.",
      og_image_url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80",
    },
  }

  for (const slug in articleSeo) {
    try {
      const record = app.findFirstRecordByData("articles", "slug", slug)
      record.set("seo_title", articleSeo[slug].seo_title)
      record.set("seo_description", articleSeo[slug].seo_description)
      record.set("og_image_url", articleSeo[slug].og_image_url)
      app.save(record)
    } catch (err) {
      // Article not present (seed not applied) - nothing to update.
    }
  }
}, (app) => {
  const articles = app.findCollectionByNameOrId("articles")
  articles.fields.removeByName("seo_title")
  articles.fields.removeByName("seo_description")
  articles.fields.removeByName("og_image_url")
  app.save(articles)

  const settings = app.findCollectionByNameOrId("site_settings")
  settings.fields.removeByName("site_url")
  settings.fields.removeByName("default_seo_title")
  settings.fields.removeByName("default_seo_description")
  settings.fields.removeByName("og_image_url")
  settings.fields.removeByName("google_site_verification")
  settings.fields.removeByName("same_as")
  app.save(settings)
})
