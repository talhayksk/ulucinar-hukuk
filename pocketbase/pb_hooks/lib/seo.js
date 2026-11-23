// Shared SEO helpers for the PocketBase hooks.
//
// PocketBase executes every hook handler in an isolated runtime, so helpers
// cannot live in the .pb.js file itself. Handlers load this module with:
//   var seo = require(__hooks + "/lib/seo.js")
//
// This file is intentionally NOT named *.pb.js so it is never auto-executed.

var sanitizer = require(__hooks + "/lib/sanitize.js");

var FALLBACK_SITE_URL = "https://www.ulucinar.av.tr";
var FILE_MODE = 420; // 0644
var DIR_MODE = 493; // 0755

var REQUIRED_MARKERS = [
  "<title>",
  'rel="canonical"',
  'id="articleJsonLd"',
  'id="articleTitle"',
  'id="articleMeta"',
  'id="articleCrumb"',
  'id="articleCategory"',
  'id="articleCoverWrap"',
  'id="articleCover"',
  'id="articleContent"',
  'id="articleLoading"',
  'id="articleBody"></div>',
  "data-article-page",
];

var TR_MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

var BODY_MARKER = "@@ULUCINAR_ARTICLE_BODY@@";

/* ------------------------------------------------------------------ *
 * Paths and IO
 * ------------------------------------------------------------------ */

function hooksDir() {
  return String(__hooks || "").replace(/\/+$/, "");
}

function publicDir() {
  return hooksDir() + "/../pb_public";
}

function templatePath() {
  return publicDir() + "/makale.html";
}

function articleRoot() {
  return publicDir() + "/makale";
}

function articlePath(slug) {
  // Defense in depth: a slug is used as a directory name, so reject anything
  // that is not a strict lowercase slug ("..", "/", spaces, uppercase).
  if (!sanitizer.validateSlug(slug)) {
    throw new Error("invalid article slug: " + slug);
  }
  return articleRoot() + "/" + slug + "/index.html";
}

function readText(path) {
  return toString($os.readFile(path));
}

function writeText(path, content) {
  var slash = path.lastIndexOf("/");
  if (slash > 0) {
    $os.mkdirAll(path.substring(0, slash), DIR_MODE);
  }
  $os.writeFile(path, content, FILE_MODE);
}

function removeTree(path) {
  try {
    $os.removeAll(path);
  } catch (err) {
    // already gone
  }
}

/* ------------------------------------------------------------------ *
 * Logging and escaping
 * ------------------------------------------------------------------ */

function log(message) {
  try {
    console.log("[seo] " + message);
  } catch (err) {
    // logging must never break a request
  }
}

function warn(message) {
  try {
    console.warn("[seo] " + message);
  } catch (err) {
    // ignore
  }
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeXml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function jsonLd(payload) {
  return JSON.stringify(payload, null, 2)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripAttr(attrs, name) {
  var re = new RegExp(
    "\\s+" + name + "(?:\\s*=\\s*(\"[^\"]*\"|'[^']*'|[^\\s>]+))?",
    "gi"
  );
  return String(attrs).replace(re, "");
}

function get(record, field) {
  if (!record) {
    return "";
  }
  var value = record.get(field);
  return value == null ? "" : String(value).trim();
}

function parseJson(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (err) {
      return null;
    }
  }
  return value;
}

/* ------------------------------------------------------------------ *
 * Settings and dates
 * ------------------------------------------------------------------ */

function loadSettings(app) {
  try {
    var records = app.findRecordsByFilter("site_settings", "id != ''", "id", 1, 0);
    if (records && records.length) {
      return records[0];
    }
  } catch (err) {
    // collection not migrated yet
  }
  return null;
}

function resolveSiteUrl(settings) {
  var url = get(settings, "site_url");
  if (!url) {
    url = FALLBACK_SITE_URL;
  }
  return url.replace(/\/+$/, "");
}

function parseDateParts(value) {
  var match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?/);
  if (!match) {
    return null;
  }
  return {
    year: match[1],
    month: match[2],
    day: match[3],
    time: (match[4] || "00") + ":" + (match[5] || "00") + ":" + (match[6] || "00"),
  };
}

function displayDate(value) {
  var parts = parseDateParts(value);
  if (!parts) {
    return "";
  }
  return Number(parts.day) + " " + TR_MONTHS[Number(parts.month) - 1] + " " + parts.year;
}

function dateOnly(value) {
  var parts = parseDateParts(value);
  return parts ? parts.year + "-" + parts.month + "-" + parts.day : "";
}

function isoDateTime(value) {
  var parts = parseDateParts(value);
  if (!parts) {
    return "";
  }
  return parts.year + "-" + parts.month + "-" + parts.day + "T" + parts.time + ".000Z";
}

/* ------------------------------------------------------------------ *
 * Article field helpers
 * ------------------------------------------------------------------ */

function articleCover(record, siteUrl) {
  var file = get(record, "cover");
  if (file) {
    return siteUrl + "/api/files/articles/" + record.id + "/" + file;
  }
  return get(record, "cover_url");
}

function ogImage(record, settings, siteUrl) {
  var explicit = get(record, "og_image_url");
  if (explicit) {
    return explicit;
  }
  var cover = articleCover(record, siteUrl);
  if (cover) {
    return cover;
  }
  var fallback = get(settings, "og_image_url");
  return fallback || siteUrl + "/assets/logo/ulucinar-gold.png";
}

// Re-serialized from an allow-list (see lib/sanitize.js). Admin content is
// treated as untrusted markup: unknown tags, attributes and URL schemes are
// dropped instead of denylisted.
function sanitizeBody(html) {
  return sanitizer.sanitizeBody(html);
}

// Same display format as the client (assets/js/content.js): "+90 (501) 943 63 41".
function displayPhone(value) {
  var raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  if (/\(|\)|[a-z]/i.test(raw)) {
    return raw;
  }
  var digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.slice(0, 2) === "90") {
    return (
      "+90 (" + digits.slice(2, 5) + ") " + digits.slice(5, 8) + " " +
      digits.slice(8, 10) + " " + digits.slice(10, 12)
    );
  }
  return raw;
}

function telHref(value) {
  var raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  return "tel:" + raw.replace(/[^\d+]/g, "");
}

/* ------------------------------------------------------------------ *
 * Template rendering
 * ------------------------------------------------------------------ */

function validateTemplate(template) {
  var missing = [];
  for (var i = 0; i < REQUIRED_MARKERS.length; i++) {
    if (template.indexOf(REQUIRED_MARKERS[i]) === -1) {
      missing.push(REQUIRED_MARKERS[i]);
    }
  }
  return missing;
}

function setMetaTag(html, attr, key, value) {
  if (!value) {
    return html;
  }
  var tag = "<meta " + attr + '="' + key + '" content="' + escapeHtml(value) + '">';
  var re = new RegExp("<meta\\s+[^>]*" + attr + '="' + escapeRegExp(key) + '"[^>]*>', "i");
  if (re.test(html)) {
    return html.replace(re, function () {
      return tag;
    });
  }
  return html.replace(/<\/head>/i, function () {
    return "  " + tag + "\n</head>";
  });
}

function applySetting(html, key, text, href) {
  var re = new RegExp(
    '(<([a-zA-Z][a-zA-Z0-9]*)[^>]*\\bdata-pb-setting="' + escapeRegExp(key) + '"[^>]*>)([\\s\\S]*?)(</\\2>)',
    "gi"
  );
  return html.replace(re, function (match, open, tag, inner, close) {
    var nextOpen = open;
    if (href) {
      nextOpen = nextOpen.replace(/href="[^"]*"/i, 'href="' + escapeHtml(href) + '"');
    }
    var nextInner = text ? escapeHtml(text).replace(/\r?\n/g, "<br>") : inner;
    return nextOpen + nextInner + close;
  });
}

function renderArticlePage(template, record, settings, siteUrl) {
  var slug = get(record, "slug");
  var title = get(record, "title") || slug;
  var firm = get(settings, "firm_name") || "ULUÇINAR Hukuk & Danışmanlık";
  var pageTitle = get(record, "seo_title") || title + " | " + firm;
  var description =
    get(record, "seo_description") ||
    get(record, "excerpt") ||
    get(settings, "default_seo_description");
  var canonical = siteUrl + "/makale/" + encodeURIComponent(slug) + "/";
  var published = get(record, "published_at") || get(record, "created");
  var updated = get(record, "updated") || published;
  var author = get(record, "author") || firm;
  var cover = articleCover(record, siteUrl);
  var image = ogImage(record, settings, siteUrl);
  var bodyHtml = sanitizeBody(get(record, "body"));
  var printedDate = displayDate(published);

  if (!bodyHtml) {
    bodyHtml = "<p>" + escapeHtml(get(record, "excerpt")) + "</p>";
  }

  var html = template;

  // Mark the document as server-rendered (no client hydration on this page).
  html = html.replace(/<html([^>]*)>/i, function (match, attrs) {
    return "<html" + stripAttr(attrs, "data-ssr") + ' data-ssr="1">';
  });

  // Drop the client-side article renderer: the page is complete without it.
  if (/src="[^"]*content\.js/i.test(html)) {
    html = html.replace(/[ \t]*<script[^>]*src="[^"]*content\.js[^"]*"[^>]*><\/script>\s*/gi, "");
  } else {
    warn("content.js reference not found in the article template (nothing to remove)");
  }

  // Controls that would be dead without JavaScript.
  html = html.replace(/[ \t]*<button[^>]*id="copyLink"[^>]*>[\s\S]*?<\/button>\s*/i, "");
  html = html.replace(/[ \t]*<p[^>]*id="copyStatus"[^>]*>[\s\S]*?<\/p>\s*/i, "");

  // Pages live in subdirectories: every site-relative URL becomes root-absolute.
  html = html.replace(/(href|src)="assets\//g, '$1="/assets/');
  html = html.replace(/content="assets\//g, 'content="/assets/');
  html = html.replace(/href="index\.html(#[^"]*)?"/g, function (match, hash) {
    return 'href="/' + (hash || "") + '"';
  });
  html = html.replace(/href="(instagram|linkedin)"/g, 'href="#"');

  // Head: title, description, canonical, Open Graph, Twitter.
  html = html.replace(/<title>[\s\S]*?<\/title>/i, function () {
    return "<title>" + escapeHtml(pageTitle) + "</title>";
  });
  html = setMetaTag(html, "name", "description", description);
  html = setMetaTag(html, "property", "og:type", "article");
  html = setMetaTag(html, "property", "og:title", pageTitle);
  html = setMetaTag(html, "property", "og:description", description);
  html = setMetaTag(html, "property", "og:url", canonical);
  html = setMetaTag(html, "property", "og:image", image);
  html = setMetaTag(html, "name", "twitter:title", pageTitle);
  html = setMetaTag(html, "name", "twitter:description", description);
  html = setMetaTag(html, "property", "og:image:alt", title);
  html = setMetaTag(html, "name", "twitter:image:alt", title);
  html = setMetaTag(html, "name", "twitter:image", image);

  html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*">/i, function () {
    return '<link rel="canonical" href="' + escapeHtml(canonical) + '">';
  });

  // Structured data.
  var articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description,
    inLanguage: "tr-TR",
    author: { "@type": "Organization", name: author },
    publisher: {
      "@type": "Organization",
      name: firm,
      logo: { "@type": "ImageObject", url: siteUrl + "/assets/logo/ulucinar-gold.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    url: canonical,
  };
  if (image) {
    articleLd.image = [image];
  }
  if (published) {
    articleLd.datePublished = isoDateTime(published);
  }
  if (updated) {
    articleLd.dateModified = isoDateTime(updated);
  }

  var breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Anasayfa", item: siteUrl + "/" },
      { "@type": "ListItem", position: 2, name: "Makaleler", item: siteUrl + "/#makaleler" },
      { "@type": "ListItem", position: 3, name: title, item: canonical },
    ],
  };

  html = html.replace(
    /(<script type="application\/ld\+json" id="articleJsonLd">)[\s\S]*?(<\/script>)/i,
    function (match, open, close) {
      return open + "\n" + jsonLd(articleLd) + "\n" + close;
    }
  );

  var extraHead = [];
  if (published) {
    extraHead.push('<meta property="article:published_time" content="' + escapeHtml(isoDateTime(published)) + '">');
  }
  if (updated) {
    extraHead.push('<meta property="article:modified_time" content="' + escapeHtml(isoDateTime(updated)) + '">');
  }
  var verification = get(settings, "google_site_verification");
  if (verification) {
    extraHead.push('<meta name="google-site-verification" content="' + escapeHtml(verification) + '">');
  }
  extraHead.push('<script type="application/ld+json" id="breadcrumbJsonLd">' + jsonLd(breadcrumbLd) + "</script>");
  // Defensive: even if a future template re-introduces the skeleton, keep it
  // out of the static page.
  extraHead.push("<style>#articleLoading{display:none!important}</style>");

  html = html.replace(/<\/head>/i, function () {
    return "  " + extraHead.join("\n  ") + "\n</head>";
  });

  // Article hero.
  html = html.replace(/<h1([^>]*\bid="articleTitle"[^>]*)>[\s\S]*?<\/h1>/i, function (match, attrs) {
    return "<h1" + attrs + ">" + escapeHtml(title) + "</h1>";
  });
  html = html.replace(/<span([^>]*\bid="articleCrumb"[^>]*)>[\s\S]*?<\/span>/i, function (match, attrs) {
    return "<span" + attrs + ">" + escapeHtml(title) + "</span>";
  });
  html = html.replace(/<p([^>]*\bid="articleCategory"[^>]*)>[\s\S]*?<\/p>/i, function (match, attrs) {
    return "<p" + attrs + ">Makale</p>";
  });

  var metaInner = "";
  if (printedDate) {
    metaInner += '<time datetime="' + escapeHtml(dateOnly(published)) + '">' + escapeHtml(printedDate) + "</time> · ";
  }
  metaInner += "<span>" + escapeHtml(author) + "</span>";
  html = html.replace(/<p([^>]*\bid="articleMeta"[^>]*)>[\s\S]*?<\/p>/i, function (match, attrs) {
    return "<p" + stripAttr(attrs, "hidden") + ">" + metaInner + "</p>";
  });

  html = html.replace(/<div([^>]*\bid="articleCoverWrap"[^>]*)>/i, function (match, attrs) {
    return "<div" + (cover ? stripAttr(attrs, "hidden") : attrs) + ">";
  });

  html = html.replace(/<img([^>]*\bid="articleCover"[^>]*)>/i, function () {
    if (!cover) {
      return '<img id="articleCover" alt="" width="1600" height="900" decoding="async">';
    }
    return (
      '<img id="articleCover" src="' + escapeHtml(cover) + '" alt="' + escapeHtml(title) +
      '" width="1600" height="900" fetchpriority="high" decoding="async">'
    );
  });

  if (!cover) {
    html = html.replace(/<section([^>]*\bid="articleHero"[^>]*)>/i, function (match, attrs) {
      if (/\barticle-hero--no-cover\b/.test(attrs)) {
        return match;
      }
      if (/class="/.test(attrs)) {
        return "<section" + attrs.replace(/class="([^"]*)"/, function (m, cls) {
          return 'class="' + cls + ' article-hero--no-cover"';
        }) + ">";
      }
      return "<section" + attrs + ' class="article-hero article-hero--no-cover">';
    });
  }

  // Article body.
  // The page is complete: drop the loading skeleton instead of just hiding it.
  // `.article-loading` sets `display:flex`, which beats the `hidden` attribute.
  html = html.replace(/[ \t]*<div[^>]*\bid="articleLoading"[^>]*>[\s\S]*?<\/div>\s*/i, "");
  if (html.indexOf('id="articleLoading"') !== -1) {
    // Fallback when the template nests extra markup inside the skeleton.
    html = html.replace(/<div([^>]*\bid="articleLoading"[^>]*)>/i, function (match, attrs) {
      return "<div" + stripAttr(attrs, "aria-hidden") + ' aria-hidden="true" hidden>';
    });
  }
  html = html.replace(/<div([^>]*\bid="articleContent"[^>]*)>/i, function (match, attrs) {
    return "<div" + stripAttr(attrs, "hidden") + ">";
  });

  html = html.replace(/<div([^>]*\bid="articleBody"[^>]*)>[\s\S]*?<\/div>/i, function (match, attrs) {
    return "<div" + attrs + ">" + BODY_MARKER + "</div>";
  });
  html = html.split(BODY_MARKER).join(bodyHtml);

  html = html.replace(/aria-busy="true"/g, 'aria-busy="false"');

  var year = String(new Date().getFullYear());
  html = html.replace(/(<span id="year">)\d+(<\/span>)/, function (match, open, close) {
    return open + year + close;
  });

  // Contact details from site_settings so no-JS visitors see the same NAP.
  if (settings) {
    var phone = get(settings, "phone");
    var email = get(settings, "email");
    var address = get(settings, "address");
    var tagline = get(settings, "tagline");
    var whatsapp = get(settings, "whatsapp");
    var socials = parseJson(settings.get("socials")) || {};

    if (phone) {
      html = applySetting(html, "phone", displayPhone(phone), telHref(phone));
    }
    if (email) {
      html = applySetting(html, "email", email, "mailto:" + email);
    }
    if (address) {
      html = applySetting(html, "address", address, "");
    }
    if (tagline) {
      html = applySetting(html, "tagline", tagline, "");
    }
    if (whatsapp) {
      html = applySetting(html, "whatsapp", "", whatsapp);
    }
    var instagram = socials["instagram"] || "";
    if (instagram) {
      html = applySetting(html, "instagram", "", instagram);
    }
    var linkedin = socials["linkedin"] || "";
    if (linkedin) {
      html = applySetting(html, "linkedin", "", linkedin);
    }
  }

  return { html: html, canonical: canonical, title: title, slug: slug };
}

/* ------------------------------------------------------------------ *
 * Queries and generation
 * ------------------------------------------------------------------ */

function publishedArticles(app) {
  try {
    return app.findRecordsByFilter("articles", "status = 'published'", "-published_at", 0, 0) || [];
  } catch (err) {
    return [];
  }
}

function findPublishedBySlug(app, slug) {
  if (!slug || !sanitizer.validateSlug(slug)) {
    return null;
  }
  try {
    return app.findFirstRecordByFilter(
      "articles",
      "slug = {:slug} && status = 'published'",
      { slug: slug }
    );
  } catch (err) {
    return null;
  }
}

// Regenerates every published article page and removes pages that are no
// longer published. Never writes a page from an invalid template.
// shortcut: full resync on every article write; switch to single-record writes
// when the article count grows into the hundreds.
function syncAll(app) {
  var summary = { generated: 0, removed: 0, skipped: false, missingMarkers: [] };

  var template;
  try {
    template = readText(templatePath());
  } catch (err) {
    warn("template not found at " + templatePath() + " - run scripts/pocketbase-sync-public.sh first");
    summary.skipped = true;
    return summary;
  }

  var missing = validateTemplate(template);
  if (missing.length) {
    summary.skipped = true;
    summary.missingMarkers = missing;
    warn(
      "article template is missing required markers (" + missing.join(", ") +
      "); generation aborted, no files were written"
    );
    return summary;
  }

  var settings = loadSettings(app);
  var siteUrl = resolveSiteUrl(settings);
  var articles = publishedArticles(app);
  var keep = {};

  for (var i = 0; i < articles.length; i++) {
    var record = articles[i];
    if (!record) {
      continue;
    }
    var slug = get(record, "slug");
    if (!slug) {
      warn("published article with empty slug skipped: " + record.id);
      continue;
    }
    try {
      var rendered = renderArticlePage(template, record, settings, siteUrl);
      writeText(articlePath(slug), rendered.html);
      keep[slug] = true;
      summary.generated++;
    } catch (err) {
      warn("failed to render article " + slug + ": " + err);
    }
  }

  try {
    var entries = $os.readDir(articleRoot());
    for (var j = 0; j < entries.length; j++) {
      var entry = entries[j];
      if (!entry.isDir() || keep[entry.name()]) {
        continue;
      }
      removeTree(articleRoot() + "/" + entry.name());
      summary.removed++;
    }
  } catch (err) {
    // no generated directory yet
  }

  // The bare /makale/ path is served by the static handler; keep it out of the
  // index instead of letting it fall back to the home page.
  try {
    writeText(
      articleRoot() + "/index.html",
      '<!doctype html><html lang="tr"><head><meta charset="utf-8">' +
        "<title>Makaleler | ULUÇINAR Hukuk &amp; Danışmanlık</title>" +
        '<meta name="robots" content="noindex, follow">' +
        '<meta http-equiv="refresh" content="0; url=/#makaleler">' +
        '</head><body><p><a href="/#makaleler">Makalelere dönün</a></p></body></html>'
    );
  } catch (err) {
    warn("failed to write the /makale/ stub: " + err);
  }

  log("sync complete: " + summary.generated + " page(s) generated, " + summary.removed + " removed");
  return summary;
}

/* ------------------------------------------------------------------ *
 * Sitemap / robots / 404
 * ------------------------------------------------------------------ */

function buildSitemap(app) {
  var settings = loadSettings(app);
  var siteUrl = resolveSiteUrl(settings);
  var articles = publishedArticles(app);

  var entries = [];
  var homeLastmod = dateOnly(get(settings, "updated"));
  for (var i = 0; i < articles.length; i++) {
    var record = articles[i];
    if (!record) {
      continue;
    }
    var slug = get(record, "slug");
    if (!slug) {
      continue;
    }
    var lastmod = dateOnly(get(record, "updated") || get(record, "published_at"));
    if (!homeLastmod && lastmod) {
      homeLastmod = lastmod;
    }
    entries.push({
      loc: siteUrl + "/makale/" + encodeURIComponent(slug) + "/",
      lastmod: lastmod,
    });
  }
  if (!homeLastmod) {
    homeLastmod = dateOnly(new Date().toISOString());
  }
  entries.unshift({ loc: siteUrl + "/", lastmod: homeLastmod });

  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (var j = 0; j < entries.length; j++) {
    xml += "  <url><loc>" + escapeXml(entries[j].loc) + "</loc>";
    if (entries[j].lastmod) {
      xml += "<lastmod>" + escapeXml(entries[j].lastmod) + "</lastmod>";
    }
    xml += "</url>\n";
  }
  xml += "</urlset>\n";
  return xml;
}

function buildRobots(app) {
  var settings = loadSettings(app);
  var siteUrl = resolveSiteUrl(settings);
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /_/",
    "Disallow: /api/",
    "",
    "Sitemap: " + siteUrl + "/sitemap.xml",
    "",
  ].join("\n");
}

function sendNotFound(e) {
  e.response.header().set("X-Robots-Tag", "noindex, nofollow");
  return e.html(
    404,
    '<!doctype html><html lang="tr"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<meta name="robots" content="noindex, follow">' +
      "<title>Sayfa bulunamadı | ULUÇINAR Hukuk &amp; Danışmanlık</title></head>" +
      '<body><h1>Sayfa bulunamadı</h1><p>Bu adrese ait yayımlanmış bir makale bulunmuyor. ' +
      '<a href="/">Anasayfaya dönün</a>.</p></body></html>'
  );
}

module.exports = {
  publicDir: publicDir,
  templatePath: templatePath,
  articleRoot: articleRoot,
  articlePath: articlePath,
  loadSettings: loadSettings,
  resolveSiteUrl: resolveSiteUrl,
  publishedArticles: publishedArticles,
  findPublishedBySlug: findPublishedBySlug,
  renderArticlePage: renderArticlePage,
  syncAll: syncAll,
  buildSitemap: buildSitemap,
  buildRobots: buildRobots,
  sendNotFound: sendNotFound,
  readArticleHtml: function (slug) {
    return readText(articlePath(slug));
  },
};
