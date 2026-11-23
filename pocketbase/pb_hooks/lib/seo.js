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

var PRACTICE_MARKERS = [
  "<title>",
  'rel="canonical"',
  'id="practiceJsonLd"',
  'id="practiceDetailTitle"',
  'id="practiceDetailBody"',
  "<!-- practice:list -->",
];

var TEAM_MARKERS = [
  "<title>",
  'rel="canonical"',
  'id="teamJsonLd"',
  'id="teamDetailName"',
  'id="teamDetailBio"',
  "<!-- team:media -->",
];

var PRACTICE_ICONS = {
  scale: 1, gavel: 1, columns: 1, home: 1, scroll: 1, globe: 1, clock: 1,
  family: 1, building: 1, briefcase: 1, shield: 1, eye: 1,
};

var PAGE_MARKERS = [
  "<title>",
  'rel="canonical"',
  'id="pageJsonLd"',
  'id="pageTitle"',
  'id="pageBody"',
];

// Public URL for each seeded legal page (slug -> path).
var PAGE_PATHS = {
  kvkk: "/kvkk/",
  "cerez-politikasi": "/cerez-politikasi/",
  gizlilik: "/gizlilik/",
};

var ARCHIVE_MARKERS = [
  "<title>",
  'rel="canonical"',
  'id="archiveGrid"',
  "<!-- archive:cards -->",
  'id="archiveJsonLd"',
];

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

function practiceTemplatePath() {
  return publicDir() + "/calisma-alani.html";
}

function teamTemplatePath() {
  return publicDir() + "/ekip-uyesi.html";
}

function practiceRoot() {
  return publicDir() + "/calisma-alani";
}

function teamRoot() {
  return publicDir() + "/ekip";
}

function practicePagePath(slug) {
  if (!sanitizer.validateSlug(slug)) {
    throw new Error("invalid practice slug: " + slug);
  }
  return practiceRoot() + "/" + slug + "/index.html";
}

function teamPagePath(slug) {
  if (!sanitizer.validateSlug(slug)) {
    throw new Error("invalid team slug: " + slug);
  }
  return teamRoot() + "/" + slug + "/index.html";
}

function pageTemplatePath() {
  return publicDir() + "/sayfa.html";
}

function archiveTemplatePath() {
  return publicDir() + "/makaleler.html";
}

function archiveOutputPath() {
  return publicDir() + "/makaleler/index.html";
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
  // PocketBase JSON fields arrive as raw bytes ([]uint8) in the JSVM runtime.
  if (typeof value.length === "number") {
    var isByteArray = true;
    for (var i = 0; i < value.length; i++) {
      if (typeof value[i] !== "number") {
        isByteArray = false;
        break;
      }
    }
    if (isByteArray) {
      try {
        return JSON.parse(toString(value));
      } catch (err) {
        return null;
      }
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

// Root-relative path for <img> tags (works on any host/CSP 'self').
function articleCoverPath(record) {
  var file = get(record, "cover");
  if (file) {
    return "/api/files/articles/" + record.id + "/" + file;
  }
  return get(record, "cover_url");
}

function absolutize(url, siteUrl) {
  if (url && url.indexOf("/") === 0) {
    return siteUrl + url;
  }
  return url;
}

// Absolute URL (Open Graph / JSON-LD require it).
function articleCover(record, siteUrl) {
  return absolutize(articleCoverPath(record), siteUrl);
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
  return absolutize(fallback, siteUrl) || siteUrl + "/assets/logo/ulucinar-gold.png";
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

// Root-relative URLs so a page served from /makale/<slug>/ or /makaleler/
// resolves the same assets and links as the root document.
function rootifyHtml(html) {
  var out = html.replace(/(href|src)="assets\//g, '$1="/assets/');
  out = out.replace(/content="assets\//g, 'content="/assets/');
  out = out.replace(/href="index\.html(#[^"]*)?"/g, function (match, hash) {
    return 'href="/' + (hash || "") + '"';
  });
  out = out.replace(/href="(instagram|linkedin)"/g, 'href="#"');
  return out;
}

// Contact details / social links from site_settings (works without JS).
function applySiteSettings(html, settings) {
  if (!settings) {
    return html;
  }
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
  return html;
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
  var cover = articleCoverPath(record);
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
  html = rootifyHtml(html);

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
  html = applySiteSettings(html, settings);

  return { html: html, canonical: canonical, title: title, slug: slug };
}

/* ------------------------------------------------------------------ *
 * Archive page (/makaleler/)
 * ------------------------------------------------------------------ */

function archiveCardHtml(record, siteUrl) {
  var slug = get(record, "slug");
  var title = get(record, "title") || slug;
  var category = get(record, "category") || "Genel";
  var excerpt = get(record, "excerpt") || "";
  var tags = parseJson(record.get("tags"));
  if (!tags || typeof tags.length !== "number") {
    tags = [];
  }
  var cover = articleCoverPath(record);
  var published = get(record, "published_at") || get(record, "created");
  var printedDate = displayDate(published);
  var iso = dateOnly(published);
  var href = "/makale/" + encodeURIComponent(slug) + "/";
  var search = [title, excerpt, category, tags.join(" ")].join(" ").toLowerCase();

  var media = cover
    ? '<img src="' + escapeHtml(cover) + '" alt="" width="800" height="500" loading="lazy" decoding="async">'
    : '<span class="article__placeholder" aria-hidden="true"></span>';

  var meta = "";
  if (printedDate) {
    meta = '<time datetime="' + escapeHtml(iso) + '">' + escapeHtml(printedDate) + "</time> · ";
  }
  meta += escapeHtml(category);

  return (
    '<article class="article" data-category="' + escapeHtml(category) + '" data-search="' + escapeHtml(search) + '">' +
      '<a class="article__media media' + (cover ? "" : " media--placeholder") + '" href="' + href + '" aria-hidden="true" tabindex="-1">' +
        media +
      "</a>" +
      '<div class="article__body">' +
        '<p class="article__meta">' + meta + "</p>" +
        '<h3><a href="' + href + '">' + escapeHtml(title) + "</a></h3>" +
        "<p>" + escapeHtml(excerpt) + "</p>" +
        '<a class="article__more" href="' + href + '" tabindex="-1" aria-hidden="true">Devamını Oku ' +
          '<svg class="icon" aria-hidden="true"><use href="#i-arrow-right"></use></svg></a>' +
      "</div>" +
    "</article>"
  );
}

function renderArchivePage(template, articles, settings, siteUrl) {
  var firm = get(settings, "firm_name") || "ULUÇINAR Hukuk & Danışmanlık";
  var pageTitle = "Makaleler | " + firm;
  var description =
    "ULUÇINAR Hukuk & Danışmanlık makale arşivi: aile, ceza, ticaret, iş, gayrimenkul, " +
    "miras ve icra hukuku üzerine sade ve bilgilendirici yazılar.";
  var canonical = siteUrl + "/makaleler/";
  var image = get(settings, "og_image_url") || siteUrl + "/assets/img/og-cover.jpg";
  var html = rootifyHtml(template);

  html = html.replace(/<title>[\s\S]*?<\/title>/i, function () {
    return "<title>" + escapeHtml(pageTitle) + "</title>";
  });
  html = setMetaTag(html, "name", "description", description);
  html = setMetaTag(html, "property", "og:type", "website");
  html = setMetaTag(html, "property", "og:title", pageTitle);
  html = setMetaTag(html, "property", "og:description", description);
  html = setMetaTag(html, "property", "og:url", canonical);
  html = setMetaTag(html, "property", "og:image", image);
  html = setMetaTag(html, "name", "twitter:title", pageTitle);
  html = setMetaTag(html, "name", "twitter:description", description);
  html = setMetaTag(html, "name", "twitter:image", image);
  html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*">/i, function () {
    return '<link rel="canonical" href="' + escapeHtml(canonical) + '">';
  });

  // Cards (server-rendered; visible without JavaScript).
  var cards = [];
  for (var i = 0; i < articles.length; i++) {
    if (articles[i]) {
      cards.push(archiveCardHtml(articles[i], siteUrl));
    }
  }
  html = html.split("<!-- archive:cards -->").join(cards.join("\n            "));

  html = html.replace(/(<p[^>]*id="archiveCount"[^>]*>)[\s\S]*?(<\/p>)/i, function (match, open, close) {
    return open + (articles.length ? articles.length + " makale" : "") + close;
  });
  if (!articles.length) {
    html = html.replace(/<p([^>]*id="archiveEmpty"[^>]*)>/i, function (match, attrs) {
      return "<p" + stripAttr(attrs, "hidden") + ">";
    });
  }
  if (articles.length >= 100) {
    html = html.replace(/<p([^>]*id="archiveMore"[^>]*)>/i, function (match, attrs) {
      return "<p" + stripAttr(attrs, "hidden") + ">";
    });
  }

  var listItems = [];
  for (var j = 0; j < articles.length; j++) {
    var record = articles[j];
    if (!record) {
      continue;
    }
    listItems.push({
      "@type": "ListItem",
      position: listItems.length + 1,
      url: siteUrl + "/makale/" + encodeURIComponent(get(record, "slug")) + "/",
      name: get(record, "title") || get(record, "slug"),
    });
  }
  var archiveLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Makaleler",
    description: description,
    url: canonical,
    inLanguage: "tr-TR",
    isPartOf: { "@type": "WebSite", name: firm, url: siteUrl + "/" },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: listItems.length,
      itemListElement: listItems,
    },
  };
  html = html.replace(
    /(<script type="application\/ld\+json" id="archiveJsonLd">)[\s\S]*?(<\/script>)/i,
    function (match, open, close) {
      return open + "\n" + jsonLd(archiveLd) + "\n" + close;
    }
  );

  html = applySiteSettings(html, settings);
  return html;
}

/* ------------------------------------------------------------------ *
 * Practice area / team member detail pages
 * ------------------------------------------------------------------ */

function plainTextFromHtml(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function clampText(text, max) {
  var value = String(text || "").trim();
  if (value.length <= max) {
    return value;
  }
  var cut = value.slice(0, max);
  var space = cut.lastIndexOf(" ");
  if (space > max * 0.6) {
    cut = cut.slice(0, space);
  }
  return cut.replace(/[.,;:!?]+$/, "") + "…";
}

function practiceIconHref(name) {
  var key = String(name || "");
  return "#i-" + (PRACTICE_ICONS[key] ? key : "scale");
}

function renderPracticePage(template, record, allPractices, settings, siteUrl) {
  var slug = get(record, "slug");
  var title = get(record, "title") || slug;
  var firm = get(settings, "firm_name") || "ULUÇINAR Hukuk & Danışmanlık";
  var summary = get(record, "summary");
  var bodyHtml = sanitizeBody(get(record, "body"));
  var canonical = siteUrl + "/calisma-alani/" + encodeURIComponent(slug) + "/";
  var pageTitle = title + " | " + firm;
  var description =
    summary ||
    clampText(plainTextFromHtml(bodyHtml), 155) ||
    get(settings, "default_seo_description");
  var image = absolutize(get(settings, "og_image_url"), siteUrl) || siteUrl + "/assets/img/og-cover.jpg";
  var html = rootifyHtml(template);

  if (!bodyHtml) {
    bodyHtml = "<p>" + escapeHtml(summary) + "</p>";
  }

  html = html.replace(/<html([^>]*)>/i, function (match, attrs) {
    return "<html" + stripAttr(attrs, "data-ssr") + ' data-ssr="1">';
  });

  html = html.replace(
    /<use href="#i-[a-z-]+" id="practiceDetailIcon"><\/use>/i,
    '<use href="' + practiceIconHref(get(record, "icon")) + '" id="practiceDetailIcon"></use>'
  );
  html = html.replace(/<span([^>]*\bid="practiceDetailCrumb"[^>]*)>[\s\S]*?<\/span>/i, function (match, attrs) {
    return "<span" + attrs + ">" + escapeHtml(title) + "</span>";
  });
  html = html.replace(/<h1([^>]*\bid="practiceDetailTitle"[^>]*)>[\s\S]*?<\/h1>/i, function (match, attrs) {
    return "<h1" + attrs + ">" + escapeHtml(title) + "</h1>";
  });
  html = html.replace(/<p([^>]*\bid="practiceDetailSummary"[^>]*)>[\s\S]*?<\/p>/i, function (match, attrs) {
    return "<p" + attrs + ">" + escapeHtml(summary) + "</p>";
  });

  var bodyMarker = "@@ULUCINAR_PRACTICE_BODY@@";
  html = html.replace(/<div([^>]*\bid="practiceDetailBody"[^>]*)>[\s\S]*?<\/div>/i, function (match, attrs) {
    return "<div" + attrs + ">" + bodyMarker + "</div>";
  });
  html = html.split(bodyMarker).join(bodyHtml);

  var listItems = [];
  for (var i = 0; i < allPractices.length; i++) {
    var item = allPractices[i];
    if (!item || get(item, "slug") === slug) {
      continue;
    }
    listItems.push(
      '<li><a href="/calisma-alani/' + encodeURIComponent(get(item, "slug")) + '/">' +
      escapeHtml(get(item, "title") || get(item, "slug")) + "</a></li>"
    );
  }
  html = html.split("<!-- practice:list -->").join(listItems.join("\n              "));

  // Head: title / description / canonical / Open Graph.
  html = html.replace(/<title>[\s\S]*?<\/title>/i, function () {
    return "<title>" + escapeHtml(pageTitle) + "</title>";
  });
  html = setMetaTag(html, "name", "description", description);
  html = setMetaTag(html, "property", "og:type", "website");
  html = setMetaTag(html, "property", "og:title", pageTitle);
  html = setMetaTag(html, "property", "og:description", description);
  html = setMetaTag(html, "property", "og:url", canonical);
  html = setMetaTag(html, "property", "og:image", image);
  html = setMetaTag(html, "name", "twitter:title", pageTitle);
  html = setMetaTag(html, "name", "twitter:description", description);
  html = setMetaTag(html, "name", "twitter:image", image);
  html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*">/i, function () {
    return '<link rel="canonical" href="' + escapeHtml(canonical) + '">';
  });

  var serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: title,
    description: description,
    serviceType: "Hukuk hizmeti",
    provider: { "@type": "LegalService", name: firm, url: siteUrl + "/" },
    areaServed: ["İzmit", "Kocaeli", "TR"],
    url: canonical,
    inLanguage: "tr-TR",
  };
  var breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Anasayfa", item: siteUrl + "/" },
      { "@type": "ListItem", position: 2, name: "Çalışma Alanları", item: siteUrl + "/#calisma-alanlari" },
      { "@type": "ListItem", position: 3, name: title, item: canonical },
    ],
  };
  html = html.replace(
    /(<script type="application\/ld\+json" id="practiceJsonLd">)[\s\S]*?(<\/script>)/i,
    function (match, open, close) {
      return open + "\n" + jsonLd(serviceLd) + "\n" + close;
    }
  );
  html = html.replace(/<\/head>/i, function () {
    return '  <script type="application/ld+json" id="practiceBreadcrumbJsonLd">' +
      jsonLd(breadcrumbLd) + "</script>\n</head>";
  });

  return applySiteSettings(html, settings);
}

function renderTeamPage(template, record, settings, siteUrl) {
  var slug = get(record, "slug");
  var name = get(record, "name") || slug;
  var role = get(record, "role");
  var firm = get(settings, "firm_name") || "ULUÇINAR Hukuk & Danışmanlık";
  var expertise = parseJson(record.get("expertise"));
  if (!expertise || typeof expertise.length !== "number") {
    expertise = [];
  }
  var bioHtml = sanitizeBody(get(record, "bio"));
  var photo = get(record, "photo");
  var photoPath = photo ? "/api/files/team_members/" + record.id + "/" + photo : "";
  var canonical = siteUrl + "/ekip/" + encodeURIComponent(slug) + "/";
  var pageTitle = name + (role ? " — " + role : "") + " | " + firm;
  var bioText = plainTextFromHtml(bioHtml);
  var fallbackBio =
    name + (role ? ", " + role : "") + " olarak ULUÇINAR Hukuk & Danışmanlık bünyesinde görev yapmaktadır." +
    (expertise.length ? " Uzmanlık alanları: " + expertise.join(", ") + "." : "");
  var description = clampText(bioText || fallbackBio, 155);
  var image = photoPath
    ? siteUrl + photoPath
    : absolutize(get(settings, "og_image_url"), siteUrl) || siteUrl + "/assets/img/og-cover.jpg";
  var html = rootifyHtml(template);

  if (!bioHtml) {
    bioHtml = "<p>" + escapeHtml(fallbackBio) + "</p>";
  }

  html = html.replace(/<html([^>]*)>/i, function (match, attrs) {
    return "<html" + stripAttr(attrs, "data-ssr") + ' data-ssr="1">';
  });

  // Photo or monogram.
  var mediaMarker = "@@ULUCINAR_TEAM_MEDIA@@";
  html = html.replace(/(<div[^>]*\bid="teamDetailMedia"[^>]*)>[\s\S]*?<\/div>/i, function (match, attrs) {
    var nextAttrs = photo
      ? stripAttr(attrs, "team-detail__media--monogram")
      : attrs + " team-detail__media--monogram";
    return "<div" + nextAttrs + ">" + mediaMarker + "</div>";
  });
  var mediaHtml = photo
    ? '<img src="' + escapeHtml(photoPath) + '" alt="' + escapeHtml(name) + '" width="236" height="236" loading="eager" decoding="async">'
    : '<img src="/assets/logo/ulucinar-emblem-gold.svg" alt="" width="356" height="168" loading="lazy" decoding="async">';
  html = html.split(mediaMarker).join(mediaHtml);

  html = html.replace(/<span([^>]*\bid="teamDetailCrumb"[^>]*)>[\s\S]*?<\/span>/i, function (match, attrs) {
    return "<span" + attrs + ">" + escapeHtml(name) + "</span>";
  });
  html = html.replace(/<h1([^>]*\bid="teamDetailName"[^>]*)>[\s\S]*?<\/h1>/i, function (match, attrs) {
    return "<h1" + attrs + ">" + escapeHtml(name) + "</h1>";
  });
  html = html.replace(/<p([^>]*\bid="teamDetailRole"[^>]*)>[\s\S]*?<\/p>/i, function (match, attrs) {
    return "<p" + attrs + ">" + escapeHtml(role) + "</p>";
  });

  var tagsHtml = expertise.map(function (item) {
    return "<li>" + escapeHtml(item) + "</li>";
  }).join("");
  html = html.replace(/(<ul[^>]*\bid="teamDetailExpertise"[^>]*>)[\s\S]*?(<\/ul>)/i, function (match, open, close) {
    return open + tagsHtml + close;
  });

  var bioMarker = "@@ULUCINAR_TEAM_BIO@@";
  html = html.replace(/<div([^>]*\bid="teamDetailBio"[^>]*)>[\s\S]*?<\/div>/i, function (match, attrs) {
    return "<div" + attrs + ">" + bioMarker + "</div>";
  });
  html = html.split(bioMarker).join(bioHtml);

  // Head.
  html = html.replace(/<title>[\s\S]*?<\/title>/i, function () {
    return "<title>" + escapeHtml(pageTitle) + "</title>";
  });
  html = setMetaTag(html, "name", "description", description);
  html = setMetaTag(html, "property", "og:type", "profile");
  html = setMetaTag(html, "property", "og:title", pageTitle);
  html = setMetaTag(html, "property", "og:description", description);
  html = setMetaTag(html, "property", "og:url", canonical);
  html = setMetaTag(html, "property", "og:image", image);
  html = setMetaTag(html, "name", "twitter:title", pageTitle);
  html = setMetaTag(html, "name", "twitter:description", description);
  html = setMetaTag(html, "name", "twitter:image", image);
  html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*">/i, function () {
    return '<link rel="canonical" href="' + escapeHtml(canonical) + '">';
  });

  var personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: name,
    jobTitle: role || "Avukat",
    worksFor: { "@type": "LegalService", name: firm, url: siteUrl + "/" },
    url: canonical,
    image: image,
    inLanguage: "tr-TR",
  };
  if (expertise.length) {
    personLd.knowsAbout = expertise;
  }
  var breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Anasayfa", item: siteUrl + "/" },
      { "@type": "ListItem", position: 2, name: "Ekibimiz", item: siteUrl + "/#ekibimiz" },
      { "@type": "ListItem", position: 3, name: name, item: canonical },
    ],
  };
  html = html.replace(
    /(<script type="application\/ld\+json" id="teamJsonLd">)[\s\S]*?(<\/script>)/i,
    function (match, open, close) {
      return open + "\n" + jsonLd(personLd) + "\n" + close;
    }
  );
  html = html.replace(/<\/head>/i, function () {
    return '  <script type="application/ld+json" id="teamBreadcrumbJsonLd">' +
      jsonLd(breadcrumbLd) + "</script>\n</head>";
  });

  return applySiteSettings(html, settings);
}

/* ------------------------------------------------------------------ *
 * Legal / information pages (pages collection -> /kvkk/ etc.)
 * ------------------------------------------------------------------ */

function renderPagePage(template, record, settings, siteUrl, urlPath) {
  var title = get(record, "title") || get(record, "slug");
  var firm = get(settings, "firm_name") || "ULUÇINAR Hukuk & Danışmanlık";
  var canonical = siteUrl + urlPath;
  var pageTitle = title + " | " + firm;
  var rawContent = get(record, "content");
  // The draft warning is visible on the page but must not become the meta
  // description; strip it from the raw source before sanitizing.
  var descriptionSource = rawContent.replace(
    /<p[^>]*class="legal-warning"[^>]*>[\s\S]*?<\/p>/i,
    ""
  );
  var contentHtml = sanitizeBody(rawContent);
  var updated = get(record, "updated") || get(record, "created");
  var description =
    clampText(plainTextFromHtml(descriptionSource), 155) ||
    get(settings, "default_seo_description");
  var image = absolutize(get(settings, "og_image_url"), siteUrl) || siteUrl + "/assets/img/og-cover.jpg";
  var html = rootifyHtml(template);

  if (!contentHtml) {
    contentHtml = "<p>" + escapeHtml(get(record, "excerpt")) + "</p>";
  }

  html = html.replace(/<html([^>]*)>/i, function (match, attrs) {
    return "<html" + stripAttr(attrs, "data-ssr") + ' data-ssr="1">';
  });
  html = html.replace(/<span([^>]*\bid="pageCrumb"[^>]*)>[\s\S]*?<\/span>/i, function (match, attrs) {
    return "<span" + attrs + ">" + escapeHtml(title) + "</span>";
  });
  html = html.replace(/<h1([^>]*\bid="pageTitle"[^>]*)>[\s\S]*?<\/h1>/i, function (match, attrs) {
    return "<h1" + attrs + ">" + escapeHtml(title) + "</h1>";
  });
  html = html.replace(/<p([^>]*\bid="pageUpdated"[^>]*)>[\s\S]*?<\/p>/i, function (match, attrs) {
    var printed = displayDate(updated);
    return "<p" + attrs + ">" + (printed ? "Son güncelleme: " + escapeHtml(printed) : "") + "</p>";
  });

  var bodyMarker = "@@ULUCINAR_PAGE_BODY@@";
  html = html.replace(/<div([^>]*\bid="pageBody"[^>]*)>[\s\S]*?<\/div>/i, function (match, attrs) {
    return "<div" + attrs + ">" + bodyMarker + "</div>";
  });
  html = html.split(bodyMarker).join(contentHtml);

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
  html = setMetaTag(html, "name", "twitter:image", image);
  html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*">/i, function () {
    return '<link rel="canonical" href="' + escapeHtml(canonical) + '">';
  });

  var pageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description: description,
    url: canonical,
    inLanguage: "tr-TR",
    dateModified: isoDateTime(updated),
    isPartOf: { "@type": "WebSite", name: firm, url: siteUrl + "/" },
  };
  var breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Anasayfa", item: siteUrl + "/" },
      { "@type": "ListItem", position: 2, name: title, item: canonical },
    ],
  };
  html = html.replace(
    /(<script type="application\/ld\+json" id="pageJsonLd">)[\s\S]*?(<\/script>)/i,
    function (match, open, close) {
      return open + "\n" + jsonLd(pageLd) + "\n" + close;
    }
  );
  html = html.replace(/<\/head>/i, function () {
    return '  <script type="application/ld+json" id="pageBreadcrumbJsonLd">' +
      jsonLd(breadcrumbLd) + "</script>\n</head>";
  });

  return applySiteSettings(html, settings);
}

/* ------------------------------------------------------------------ *
 * Queries and generation
 * ------------------------------------------------------------------ */

function findPublishedPageBySlug(app, slug) {
  if (!slug) {
    return null;
  }
  try {
    return app.findFirstRecordByFilter(
      "pages",
      "slug = {:slug} && published = true",
      { slug: slug }
    );
  } catch (err) {
    return null;
  }
}

function publishedPractices(app) {
  try {
    return app.findRecordsByFilter("practice_areas", "published = true", "sort_order", 0, 0) || [];
  } catch (err) {
    return [];
  }
}

function publishedTeamMembers(app) {
  try {
    return app.findRecordsByFilter("team_members", "published = true", "sort_order", 0, 0) || [];
  } catch (err) {
    return [];
  }
}

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

// Renders one collection of detail pages (practices or team) and removes
// directories that are no longer published.
function syncDetailFamily(options) {
  var stats = { generated: 0, removed: 0, skipped: false };
  var template;

  try {
    template = readText(options.templatePath);
  } catch (err) {
    warn("template not found at " + options.templatePath + " - pages not generated");
    stats.skipped = true;
    return stats;
  }

  var missing = [];
  for (var m = 0; m < options.markers.length; m++) {
    if (template.indexOf(options.markers[m]) === -1) {
      missing.push(options.markers[m]);
    }
  }
  if (missing.length) {
    stats.skipped = true;
    warn(
      options.templatePath + " is missing required markers (" + missing.join(", ") +
      "); generation aborted"
    );
    return stats;
  }

  var keep = {};
  for (var i = 0; i < options.records.length; i++) {
    var record = options.records[i];
    if (!record) {
      continue;
    }
    var slug = get(record, "slug");
    if (!slug) {
      warn("record without slug skipped: " + record.id);
      continue;
    }
    try {
      writeText(options.pagePath(slug), options.render(template, record));
      keep[slug] = true;
      stats.generated++;
    } catch (err) {
      warn("failed to render " + slug + ": " + err);
    }
  }

  try {
    var entries = $os.readDir(options.root);
    for (var j = 0; j < entries.length; j++) {
      var entry = entries[j];
      if (!entry.isDir() || keep[entry.name()]) {
        continue;
      }
      removeTree(options.root + "/" + entry.name());
      stats.removed++;
    }
  } catch (err) {
    // no generated directory yet
  }

  return stats;
}

// Regenerates every published article page and removes pages that are no
// longer published. Never writes a page from an invalid template.
// shortcut: full resync on every article write; switch to single-record writes
// when the article count grows into the hundreds.
function syncAll(app) {
  var summary = { generated: 0, removed: 0, skipped: false, missingMarkers: [], archiveGenerated: false, archiveSkipped: false };

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

  // /makale/ redirects to /makaleler/ at the router level now; drop the old
  // meta-refresh stub if a previous build wrote one.
  try {
    $os.remove(articleRoot() + "/index.html");
  } catch (err) {
    // already gone
  }

  // Archive page: every published article, server-rendered.
  var archiveTemplate;
  try {
    archiveTemplate = readText(archiveTemplatePath());
  } catch (err) {
    warn("archive template not found at " + archiveTemplatePath() + " - archive page not generated");
    archiveTemplate = null;
  }
  if (archiveTemplate) {
    var missingArchive = [];
    for (var k = 0; k < ARCHIVE_MARKERS.length; k++) {
      if (archiveTemplate.indexOf(ARCHIVE_MARKERS[k]) === -1) {
        missingArchive.push(ARCHIVE_MARKERS[k]);
      }
    }
    if (missingArchive.length) {
      summary.archiveSkipped = true;
      warn(
        "archive template is missing required markers (" + missingArchive.join(", ") +
        "); generation aborted, no archive file was written"
      );
    } else {
      try {
        writeText(archiveOutputPath(), renderArchivePage(archiveTemplate, articles, settings, siteUrl));
        summary.archiveGenerated = true;
      } catch (err) {
        warn("failed to render the archive page: " + err);
      }
    }
  }

  // Practice area and team member detail pages.
  summary.practicesGenerated = syncDetailFamily({
    app: app,
    templatePath: practiceTemplatePath(),
    markers: PRACTICE_MARKERS,
    records: publishedPractices(app),
    root: practiceRoot(),
    pagePath: practicePagePath,
    render: function (template, record) {
      return renderPracticePage(template, record, publishedPractices(app), settings, siteUrl);
    },
    settings: settings,
    siteUrl: siteUrl,
  });

  summary.teamGenerated = syncDetailFamily({
    app: app,
    templatePath: teamTemplatePath(),
    markers: TEAM_MARKERS,
    records: publishedTeamMembers(app),
    root: teamRoot(),
    pagePath: teamPagePath,
    render: function (template, record) {
      return renderTeamPage(template, record, settings, siteUrl);
    },
    settings: settings,
    siteUrl: siteUrl,
  });

  // Legal / information pages (fixed public URLs).
  summary.pagesGenerated = 0;
  var pageTemplate;
  try {
    pageTemplate = readText(pageTemplatePath());
  } catch (err) {
    warn("page template not found at " + pageTemplatePath() + " - legal pages not generated");
    pageTemplate = null;
  }
  if (pageTemplate) {
    var missingPageMarkers = [];
    for (var pm = 0; pm < PAGE_MARKERS.length; pm++) {
      if (pageTemplate.indexOf(PAGE_MARKERS[pm]) === -1) {
        missingPageMarkers.push(PAGE_MARKERS[pm]);
      }
    }
    if (missingPageMarkers.length) {
      warn(
        "page template is missing required markers (" + missingPageMarkers.join(", ") +
        "); legal pages not generated"
      );
    } else {
      for (var pageSlug in PAGE_PATHS) {
        var pagePath = PAGE_PATHS[pageSlug];
        var pageRecord = findPublishedPageBySlug(app, pageSlug);
        var pageFile = publicDir() + pagePath + "index.html";
        if (!pageRecord) {
          removeTree(publicDir() + pagePath);
          continue;
        }
        try {
          writeText(pageFile, renderPagePage(pageTemplate, pageRecord, settings, siteUrl, pagePath));
          summary.pagesGenerated++;
        } catch (err) {
          warn("failed to render page " + pageSlug + ": " + err);
        }
      }
    }
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
  entries.splice(1, 0, { loc: siteUrl + "/makaleler/", lastmod: homeLastmod });

  var practices = publishedPractices(app);
  for (var p = 0; p < practices.length; p++) {
    var practice = practices[p];
    if (!practice || !get(practice, "slug")) {
      continue;
    }
    entries.push({
      loc: siteUrl + "/calisma-alani/" + encodeURIComponent(get(practice, "slug")) + "/",
      lastmod: dateOnly(get(practice, "updated") || get(practice, "created")),
    });
  }

  for (var pageSlug in PAGE_PATHS) {
    var legalPage = findPublishedPageBySlug(app, pageSlug);
    if (!legalPage) {
      continue;
    }
    entries.push({
      loc: siteUrl + PAGE_PATHS[pageSlug],
      lastmod: dateOnly(get(legalPage, "updated") || get(legalPage, "created")),
    });
  }

  var members = publishedTeamMembers(app);
  for (var t = 0; t < members.length; t++) {
    var member = members[t];
    if (!member || !get(member, "slug")) {
      continue;
    }
    entries.push({
      loc: siteUrl + "/ekip/" + encodeURIComponent(get(member, "slug")) + "/",
      lastmod: dateOnly(get(member, "updated") || get(member, "created")),
    });
  }

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
  readPracticeHtml: function (slug) {
    return readText(practicePagePath(slug));
  },
  readTeamHtml: function (slug) {
    return readText(teamPagePath(slug));
  },
};
