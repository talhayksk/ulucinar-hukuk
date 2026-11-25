/// <reference path="../pb_data/types.d.ts" />

// Brand refresh (2026-11-25): the firm now presents itself as
// "ULUÇINAR Hukuk, Arabuluculuk ve Danışmanlık" and 12+ years of experience.
// Applies the new name to site settings, stats, article authors and legal pages.
migrate((app) => {
  const OLD_NAME = "ULUÇINAR Hukuk " + "& Danışmanlık"
  const NEW_NAME = "ULUÇINAR Hukuk, Arabuluculuk ve Danışmanlık"
  const TITLE = NEW_NAME + " | İzmit/Kocaeli"
  const DESCRIPTION =
    NEW_NAME +
    ": İzmit/Kocaeli'de aile, ceza, ticaret, iş, gayrimenkul ve miras hukukunda " +
    "danışmanlık, avukatlık ve arabuluculuk."
  const HERO_NOTE = "İzmit · Uluçınar Hukuk, Arabuluculuk ve Danışmanlık"

  // JSONField values must be written as a JSON string (see the 1794944917 seed).
  const stats = [
    { value: "12+", label: "Yıllık deneyim" },
    { value: "1.200+", label: "Takip edilen dosya" },
    { value: "9", label: "Uzmanlık alanı" },
    { value: "%100", label: "Mesleki gizlilik esası" },
  ]

  // ---- site_settings ----
  let settings = null
  try {
    settings = app.findFirstRecordByData("site_settings", "firm_name", OLD_NAME)
  } catch (err) {
    settings = null
  }
  if (!settings) {
    try {
      const records = app.findRecordsByFilter("site_settings", "", "", 1, 0)
      settings = records.length ? records[0] : null
    } catch (err) {
      settings = null
    }
  }

  if (settings) {
    settings.set("firm_name", NEW_NAME)
    settings.set("seo_title", TITLE)
    settings.set("default_seo_title", TITLE)
    settings.set("seo_description", DESCRIPTION)
    settings.set("default_seo_description", DESCRIPTION)
    settings.set("hero_note", HERO_NOTE)

    const aboutLead = String(settings.getString("about_lead") || "")
    settings.set(
      "about_lead",
      aboutLead
        .replace(OLD_NAME, NEW_NAME)
        .replace(
          "hukuki danışmanlık ve avukatlık hizmeti",
          "hukuki danışmanlık, avukatlık ve arabuluculuk hizmeti"
        )
    )

    settings.set("stats", JSON.stringify(stats))
    app.save(settings)
  }

  // ---- article author labels ----
  try {
    const articles = app.findRecordsByFilter(
      "articles",
      "author = '" + OLD_NAME + "'",
      "",
      200,
      0
    )
    for (let i = 0; i < articles.length; i++) {
      articles[i].set("author", NEW_NAME)
      app.save(articles[i])
    }
  } catch (err) {
    // articles collection may not exist on a partial install
  }

  // ---- legal pages (data controller name, HTML-escaped) ----
  try {
    const pages = app.findRecordsByFilter("pages", "", "", 50, 0)
    const oldHtml = "ULUÇINAR Hukuk " + "&amp; Danışmanlık"
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      const content = String(page.getString("content") || "")
      const next = content.split(OLD_NAME).join(NEW_NAME).split(oldHtml).join(NEW_NAME)
      if (next !== content) {
        page.set("content", next)
        app.save(page)
      }
    }
  } catch (err) {
    // pages collection not created yet
  }
}, (app) => {
  const OLD_NAME = "ULUÇINAR Hukuk " + "& Danışmanlık"
  const NEW_NAME = "ULUÇINAR Hukuk, Arabuluculuk ve Danışmanlık"
  const stats = [
    { value: "25" + "+", label: "Yıllık deneyim" },
    { value: "1.200+", label: "Takip edilen dosya" },
    { value: "9", label: "Uzmanlık alanı" },
    { value: "%100", label: "Mesleki gizlilik esası" },
  ]

  try {
    const records = app.findRecordsByFilter("site_settings", "", "", 1, 0)
    if (records.length) {
      const record = records[0]
      record.set("firm_name", OLD_NAME)
      record.set("seo_title", OLD_NAME + " | İzmit/Kocaeli")
      record.set("default_seo_title", OLD_NAME + " | İzmit/Kocaeli")
      record.set(
        "seo_description",
        OLD_NAME + ": İzmit/Kocaeli merkezli; aile, ceza, ticaret, iş, " +
          "gayrimenkul ve miras hukukunda gizlilik esaslı danışmanlık ve avukatlık hizmeti."
      )
      record.set("default_seo_description", record.getString("seo_description"))
      record.set("hero_note", "İzmit · Hukuk & Danışmanlık")
      record.set(
        "about_lead",
        OLD_NAME + ", İzmit'te bireysel ve kurumsal müvekkillerine " +
          "hukuki danışmanlık ve avukatlık hizmeti sunar."
      )
      record.set("stats", JSON.stringify(stats))
      app.save(record)
    }
  } catch (err) {
    // nothing to revert
  }

  try {
    const articles = app.findRecordsByFilter(
      "articles",
      "author = '" + NEW_NAME + "'",
      "",
      200,
      0
    )
    for (let i = 0; i < articles.length; i++) {
      articles[i].set("author", OLD_NAME)
      app.save(articles[i])
    }
  } catch (err) {
    // ignore
  }

  try {
    const pages = app.findRecordsByFilter("pages", "", "", 50, 0)
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      const content = String(page.getString("content") || "")
      const next = content.split(NEW_NAME).join(OLD_NAME)
      if (next !== content) {
        page.set("content", next)
        app.save(page)
      }
    }
  } catch (err) {
    // ignore
  }
})
