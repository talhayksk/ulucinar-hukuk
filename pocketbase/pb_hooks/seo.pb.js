/// <reference path="../pb_data/types.d.ts" />

// P0 technical SEO routes and lifecycle hooks.
//
// Handlers run in isolated JS runtimes without the rest of this file in scope,
// so every handler loads its own helpers with:
//   var seo = require(__hooks + "/lib/seo.js")
//
// Generated output: pb_public/makale/<slug>/index.html (static, no JS needed).

/* ------------------------------------------------------------------ *
 * Legacy article URL -> clean URL
 * ------------------------------------------------------------------ */

routerAdd("GET", "/makale.html", function (e) {
  var seo = require(__hooks + "/lib/seo.js");
  var requestUri = String(e.request.requestURI || "");
  var slug = "";
  var queryMatch = requestUri.match(/[?&]slug=([^&]*)/);
  if (queryMatch) {
    slug = decodeURIComponent(queryMatch[1]);
  }

  if (!slug) {
    return e.redirect(301, "/makaleler/");
  }

  if (!seo.findPublishedBySlug(e.app, slug)) {
    return seo.sendNotFound(e);
  }

  var siteUrl = seo.resolveSiteUrl(seo.loadSettings(e.app));
  return e.redirect(301, siteUrl + "/makale/" + encodeURIComponent(slug) + "/");
});

/* ------------------------------------------------------------------ *
 * Server-rendered article pages
 * ------------------------------------------------------------------ */

// PocketBase 0.42 routes use Go ServeMux patterns, so the wildcard segment is
// "{slug}" (not ":slug") and the value comes from request.pathValue().
function seoServeArticlePage(e) {
  var seo = require(__hooks + "/lib/seo.js");
  var slug = String(e.request.pathValue("slug") || "").replace(/\/+$/, "");
  var path = String(e.request.requestURI || "").split("?")[0];

  if (!slug) {
    return e.redirect(301, "/#makaleler");
  }

  var html;
  try {
    html = seo.readArticleHtml(slug);
  } catch (err) {
    return seo.sendNotFound(e);
  }

  // Canonical form always ends with a slash.
  if (!/\/$/.test(path)) {
    return e.redirect(301, "/makale/" + encodeURIComponent(slug) + "/");
  }

  e.response.header().set("Cache-Control", "public, max-age=300, must-revalidate");
  e.response.header().set("X-Content-Type-Options", "nosniff");
  return e.html(200, html);
}

routerAdd("GET", "/makale/{slug}", seoServeArticlePage);
routerAdd("GET", "/makale/{slug}/", seoServeArticlePage);
routerAdd("GET", "/makale", function (e) {
  return e.redirect(301, "/makaleler/");
});
// Exact "/makale/" only (Go ServeMux end-of-path marker) - it must not swallow
// the article routes above.
routerAdd("GET", "/makale/{$}", function (e) {
  return e.redirect(301, "/makaleler/");
});

/* ------------------------------------------------------------------ *
 * Article archive
 * ------------------------------------------------------------------ */

routerAdd("GET", "/makaleler.html", function (e) {
  return e.redirect(301, "/makaleler/");
});
routerAdd("GET", "/makaleler", function (e) {
  return e.redirect(301, "/makaleler/");
});

/* ------------------------------------------------------------------ *
 * Practice area detail pages
 * ------------------------------------------------------------------ */

function seoServePracticePage(e) {
  var seo = require(__hooks + "/lib/seo.js");
  var slug = String(e.request.pathValue("slug") || "").replace(/\/+$/, "");
  var path = String(e.request.requestURI || "").split("?")[0];
  if (!slug) {
    return e.redirect(301, "/#calisma-alanlari");
  }

  var html;
  try {
    html = seo.readPracticeHtml(slug);
  } catch (err) {
    return seo.sendNotFound(e);
  }

  if (!/\/$/.test(path)) {
    return e.redirect(301, "/calisma-alani/" + encodeURIComponent(slug) + "/");
  }

  e.response.header().set("Cache-Control", "public, max-age=300, must-revalidate");
  e.response.header().set("X-Content-Type-Options", "nosniff");
  return e.html(200, html);
}

routerAdd("GET", "/calisma-alani/{slug}", seoServePracticePage);
routerAdd("GET", "/calisma-alani/{slug}/", seoServePracticePage);
routerAdd("GET", "/calisma-alani/{$}", function (e) {
  return e.redirect(301, "/#calisma-alanlari");
});
routerAdd("GET", "/calisma-alani.html", function (e) {
  return e.redirect(301, "/#calisma-alanlari");
});

/* ------------------------------------------------------------------ *
 * Team member detail pages
 * ------------------------------------------------------------------ */

function seoServeTeamPage(e) {
  var seo = require(__hooks + "/lib/seo.js");
  var slug = String(e.request.pathValue("slug") || "").replace(/\/+$/, "");
  var path = String(e.request.requestURI || "").split("?")[0];
  if (!slug) {
    return e.redirect(301, "/#ekibimiz");
  }

  var html;
  try {
    html = seo.readTeamHtml(slug);
  } catch (err) {
    return seo.sendNotFound(e);
  }

  if (!/\/$/.test(path)) {
    return e.redirect(301, "/ekip/" + encodeURIComponent(slug) + "/");
  }

  e.response.header().set("Cache-Control", "public, max-age=300, must-revalidate");
  e.response.header().set("X-Content-Type-Options", "nosniff");
  return e.html(200, html);
}

routerAdd("GET", "/ekip/{slug}", seoServeTeamPage);
routerAdd("GET", "/ekip/{slug}/", seoServeTeamPage);
routerAdd("GET", "/ekip/{$}", function (e) {
  return e.redirect(301, "/#ekibimiz");
});
routerAdd("GET", "/ekip", function (e) {
  return e.redirect(301, "/#ekibimiz");
});
routerAdd("GET", "/ekip-uyesi.html", function (e) {
  return e.redirect(301, "/#ekibimiz");
});

/* ------------------------------------------------------------------ *
 * Legal / information pages (served from the generated directories)
 * ------------------------------------------------------------------ */

routerAdd("GET", "/kvkk", function (e) {
  return e.redirect(301, "/kvkk/");
});
routerAdd("GET", "/cerez-politikasi", function (e) {
  return e.redirect(301, "/cerez-politikasi/");
});
routerAdd("GET", "/gizlilik", function (e) {
  return e.redirect(301, "/gizlilik/");
});
routerAdd("GET", "/sayfa.html", function (e) {
  return e.redirect(301, "/");
});
routerAdd("GET", "/randevu", function (e) {
  return e.redirect(301, "/randevu/");
});
routerAdd("GET", "/randevu.html", function (e) {
  return e.redirect(301, "/randevu/");
});

/* ------------------------------------------------------------------ *
 * Sitemap and robots
 * ------------------------------------------------------------------ */

routerAdd("GET", "/sitemap.xml", function (e) {
  var seo = require(__hooks + "/lib/seo.js");
  return e.blob(200, "application/xml; charset=utf-8", seo.buildSitemap(e.app));
});

routerAdd("GET", "/site.webmanifest", function (e) {
  var raw;
  try {
    raw = toString($os.readFile(__hooks + "/../pb_public/site.webmanifest"));
  } catch (err) {
    return e.notFoundError("Manifest not found");
  }
  e.response.header().set("Cache-Control", "public, max-age=3600");
  return e.blob(200, "application/manifest+json; charset=utf-8", raw);
});

routerAdd("GET", "/rss.xml", function (e) {
  var seo = require(__hooks + "/lib/seo.js");
  return e.blob(200, "application/rss+xml; charset=utf-8", seo.buildRss(e.app));
});

routerAdd("GET", "/robots.txt", function (e) {
  var seo = require(__hooks + "/lib/seo.js");
  return e.blob(200, "text/plain; charset=utf-8", seo.buildRobots(e.app));
});

/* ------------------------------------------------------------------ *
 * Rebuild trigger used by scripts/pocketbase-rebuild-seo.sh
 * ------------------------------------------------------------------ */

routerAdd(
  "POST",
  "/api/seo/rebuild",
  function (e) {
    var seo = require(__hooks + "/lib/seo.js");
    return e.json(200, seo.syncAll(e.app));
  },
  $apis.requireSuperuserAuth()
);

/* ------------------------------------------------------------------ *
 * Security headers + noindex for the admin UI / REST API
 * ------------------------------------------------------------------ */

routerUse(function (e) {
  var path = String(e.request.requestURI || "").split("?")[0];
  var header = e.response.header();
  var isAdmin = path === "/_" || path.indexOf("/_/") === 0;

  // The admin dashboard ships its own CSP and is excluded on purpose.
  if (!isAdmin) {
    header.set("X-Content-Type-Options", "nosniff");
    header.set("Referrer-Policy", "strict-origin-when-cross-origin");
    header.set("Permissions-Policy", "geolocation=(), camera=(), microphone=(), payment=(), usb=()");
    header.set("X-Frame-Options", "DENY");
    // Fonts, images and the API are same-origin. 'unsafe-inline' stays for the
    // critical inline CSS/JS in the static pages; tightening that needs hashes.
    // Note: img-src has no `https:` - an article cover_url pointing at an
    // external host would be blocked by the browser (upload it or use a local
    // asset instead).
    header.set(
      "Content-Security-Policy",
      "default-src 'self'; " +
        "base-uri 'self'; " +
        "object-src 'none'; " +
        "frame-src 'none'; " +
        "frame-ancestors 'none'; " +
        "img-src 'self' data:; " +
        "font-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "connect-src 'self'; " +
        "form-action 'self' mailto:"
    );
  }

  if (isAdmin || path.indexOf("/api/") === 0) {
    header.set("X-Robots-Tag", "noindex, nofollow");
  }

  // HSTS is only meaningful (and only safe) on a TLS connection.
  if (e.request.tls != null) {
    header.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  return e.next();
});

/* ------------------------------------------------------------------ *
 * Lifecycle: backfill on start, resync on article changes
 * ------------------------------------------------------------------ */

onBootstrap(function (e) {
  // Run after the bootstrap chain finished, otherwise the database is not
  // initialized yet and model queries crash the process.
  e.next();
  var seo = require(__hooks + "/lib/seo.js");
  try {
    seo.syncAll(e.app);
  } catch (err) {
    console.warn("[seo] bootstrap sync failed: " + err);
  }
});

function seoOnArticleChange(e) {
  var seo = require(__hooks + "/lib/seo.js");
  try {
    seo.syncAll(e.app);
  } catch (err) {
    console.warn("[seo] article change sync failed: " + err);
  }
}

onRecordAfterCreateSuccess(seoOnArticleChange, "articles");
onRecordAfterUpdateSuccess(seoOnArticleChange, "articles");
onRecordAfterDeleteSuccess(seoOnArticleChange, "articles");

// Contact details and the site URL are baked into the generated pages, so a
// settings edit must refresh them too.
function seoOnSettingsChange(e) {
  var seo = require(__hooks + "/lib/seo.js");
  try {
    seo.syncAll(e.app);
  } catch (err) {
    console.warn("[seo] settings change sync failed: " + err);
  }
}

onRecordAfterUpdateSuccess(seoOnSettingsChange, "site_settings");
