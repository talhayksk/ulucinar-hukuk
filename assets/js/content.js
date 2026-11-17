/**
 * ULUÇINAR Hukuk & Danışmanlık — PocketBase content binding.
 *
 * Responsibilities:
 *  - fill [data-pb-setting] / [data-pb-href] elements from site_settings;
 *  - replace the three home-page article fallbacks with published articles;
 *  - render makale.html?slug=... (with sanitised HTML and meta/JSON-LD updates).
 *
 * Everything degrades to the static markup when PocketBase is unavailable.
 */
(function (global) {
  "use strict";

  var config = global.SITE_CONFIG || {};
  var reduceMotion = global.matchMedia ? global.matchMedia("(prefers-reduced-motion: reduce)") : null;

  var ALLOWED_TAGS = {
    P: 1, H2: 1, H3: 1, H4: 1, UL: 1, OL: 1, LI: 1, BLOCKQUOTE: 1,
    STRONG: 1, EM: 1, A: 1, IMG: 1, FIGURE: 1, FIGCAPTION: 1,
    BR: 1, HR: 1, TABLE: 1, THEAD: 1, TBODY: 1, TR: 1, TH: 1, TD: 1
  };

  var DROP_TAGS = {
    SCRIPT: 1, STYLE: 1, IFRAME: 1, OBJECT: 1, EMBED: 1, FORM: 1,
    INPUT: 1, TEXTAREA: 1, SELECT: 1, BUTTON: 1, LINK: 1, META: 1,
    BASE: 1, SVG: 1, MATH: 1, VIDEO: 1, AUDIO: 1, CANVAS: 1,
    NOSCRIPT: 1, TEMPLATE: 1
  };

  var ALLOWED_ATTRS = {
    A: ["href", "title", "target", "rel"],
    IMG: ["src", "alt", "width", "height"],
    TH: ["colspan", "rowspan"],
    TD: ["colspan", "rowspan"]
  };

  /* Social links may be top-level fields or a JSON `socials` object. */
  function getSetting(settings, key) {
    if (!settings) { return ""; }
    var value = settings[key];
    if (value == null && settings.socials && typeof settings.socials === "object") {
      value = settings.socials[key];
    }
    return value || "";
  }

  /* Pretty-print a bare phone number when no display field is provided. */
  function displayPhone(value) {
    var raw = String(value || "").trim();
    if (!raw) { return ""; }
    if (/\(|\)|[a-z]/i.test(raw)) { return raw; }
    var d = digits(raw);
    if (d.length === 12 && d.slice(0, 2) === "90") {
      return "+90 (" + d.slice(2, 5) + ") " + d.slice(5, 8) + " " + d.slice(8, 10) + " " + d.slice(10, 12);
    }
    return raw;
  }

  var TEXT_SETTINGS = {
    phone: function (s) { return s.phone_display || displayPhone(s.phone); },
    email: function (s) { return s.email; },
    address: function (s) { return s.address; },
    working_hours: function (s) { return s.working_hours || s.hours; },
    whatsapp: function (s) { return getSetting(s, "whatsapp"); },
    instagram: function (s) { return getSetting(s, "instagram"); },
    linkedin: function (s) { return getSetting(s, "linkedin"); },
    hero_note: function (s) { return s.hero_note; },
    tagline: function (s) { return s.tagline; },
    firm_name: function (s) { return s.firm_name; }
  };

  function $(selector, context) {
    return (context || document).querySelector(selector);
  }

  function $$(selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function digits(value) {
    return String(value == null ? "" : value).replace(/\D/g, "");
  }

  function telHref(value) {
    var raw = String(value || "").trim();
    if (!raw) { return ""; }
    if (/^tel:/i.test(raw)) { return raw; }
    var number = digits(raw);
    if (!number) { return ""; }
    return "tel:" + (raw.charAt(0) === "+" ? "+" : "") + number;
  }

  function mailHref(value) {
    var raw = String(value || "").trim();
    if (!raw) { return ""; }
    if (/^mailto:/i.test(raw)) { return raw; }
    return raw.indexOf("@") > -1 ? "mailto:" + raw : "";
  }

  function whatsappHref(value) {
    var raw = String(value || "").trim();
    if (!raw) { return ""; }
    if (/^https?:\/\//i.test(raw)) { return raw; }
    var number = digits(raw);
    return number ? "https://wa.me/" + number : "";
  }

  function urlHref(value) {
    var raw = String(value || "").trim();
    if (!raw) { return ""; }
    if (/^https?:\/\//i.test(raw)) { return raw; }
    if (/^\/\//.test(raw)) { return "https:" + raw; }
    return "";
  }

  function applySettings(settings) {
    if (!settings) { return; }

    $$("[data-pb-setting]").forEach(function (element) {
      var key = element.getAttribute("data-pb-setting");
      var value = TEXT_SETTINGS[key] ? TEXT_SETTINGS[key](settings) : "";

      if (value && !element.hasAttribute("data-pb-keep-text")) {
        element.textContent = String(value);
      }

      var hrefType = element.getAttribute("data-pb-href");
      if (!hrefType) { return; }

      var href = "";
      if (hrefType === "tel") { href = telHref(settings.phone); }
      else if (hrefType === "mailto") { href = mailHref(settings.email); }
      else if (hrefType === "wa") { href = whatsappHref(settings.whatsapp); }
      else if (hrefType === "instagram") { href = urlHref(getSetting(settings, "instagram")); }
      else if (hrefType === "linkedin") { href = urlHref(getSetting(settings, "linkedin")); }

      if (href) {
        element.setAttribute("href", href);
        if (hrefType === "wa") {
          element.setAttribute("target", "_blank");
          element.setAttribute("rel", "noopener");
        }
      }
    });
  }

  function toDate(value) {
    if (!value) { return null; }
    var normalized = String(value).replace(" ", "T");
    var date = new Date(normalized);
    return isNaN(date.getTime()) ? null : date;
  }

  function formatDate(value) {
    var date = toDate(value);
    if (!date) { return ""; }
    try {
      return new Intl.DateTimeFormat("tr-TR", {
        day: "numeric", month: "long", year: "numeric"
      }).format(date);
    } catch (err) {
      return date.toISOString().slice(0, 10);
    }
  }

  function isoDate(value) {
    var date = toDate(value);
    return date ? date.toISOString().slice(0, 10) : "";
  }

  function articleSlug(record) {
    return String(record.slug || record.id || "");
  }

  function articleHref(record) {
    return "makale.html?slug=" + encodeURIComponent(articleSlug(record));
  }

  function coverUrl(record) {
    if (record.cover) {
      var file = global.PB ? global.PB.fileUrl(record, record.cover) : "";
      if (file) { return file; }
    }
    return record.cover_url || "";
  }

  function articleCategory(record) {
    return record.category || record.category_label || "Makale";
  }

  function articleAuthor(record) {
    return record.author || "ULUÇINAR Hukuk & Danışmanlık";
  }

  /* ------------------------------------------------------------------ *
   * Home-page article list
   * ------------------------------------------------------------------ */

  function skeletonCard() {
    return '<article class="article-skeleton" aria-hidden="true">' +
      '<div class="article-skeleton__media"></div>' +
      '<div class="article-skeleton__body">' +
        '<span class="article-skeleton__line article-skeleton__line--short"></span>' +
        '<span class="article-skeleton__line article-skeleton__line--title"></span>' +
        '<span class="article-skeleton__line"></span>' +
        '<span class="article-skeleton__line article-skeleton__line--medium"></span>' +
      '</div>' +
    '</article>';
  }

  function buildArticleCard(record) {
    var href = articleHref(record);
    var title = record.title || "Başlıksız makale";
    var excerpt = record.excerpt || "";
    var dateValue = record.published_at || record.created || "";
    var displayDate = formatDate(dateValue);
    var datetime = isoDate(dateValue);
    var cover = coverUrl(record);
    var category = articleCategory(record);

    var media = cover
      ? '<img src="' + escapeHtml(cover) + '" alt="" width="800" height="500" loading="lazy" decoding="async" onerror="this.style.opacity=\'0\'">'
      : '<span class="article__placeholder" aria-hidden="true"></span>';

    var meta = displayDate
      ? '<time datetime="' + escapeHtml(datetime) + '">' + escapeHtml(displayDate) + '</time> · '
      : "";

    return '<article class="article" data-pb-collection="articles" data-pb-id="' + escapeHtml(record.id) + '">' +
      '<a class="article__media media' + (cover ? "" : " media--placeholder") + '" href="' + escapeHtml(href) + '" aria-hidden="true" tabindex="-1">' +
        media +
      '</a>' +
      '<div class="article__body">' +
        '<p class="article__meta">' + meta + escapeHtml(category) + '</p>' +
        '<h3><a href="' + escapeHtml(href) + '">' + escapeHtml(title) + '</a></h3>' +
        '<p>' + escapeHtml(excerpt) + '</p>' +
        '<a class="article__more" href="' + escapeHtml(href) + '" tabindex="-1" aria-hidden="true">Devamını Oku ' +
          '<svg class="icon" aria-hidden="true"><use href="#i-arrow-right"></use></svg></a>' +
      '</div>' +
    '</article>';
  }

  function initHomeArticles() {
    var grid = $("#articleGrid");
    if (!grid) { return; }

    var fallbacks = $$("[data-fallback-article]", grid);
    if (!fallbacks.length) { return; }

    var skeleton = document.createElement("div");
    skeleton.className = "article-skeletons";
    skeleton.setAttribute("aria-hidden", "true");
    skeleton.innerHTML = skeletonCard() + skeletonCard() + skeletonCard();

    grid.setAttribute("aria-busy", "true");
    grid.classList.add("is-loading");
    grid.appendChild(skeleton);

    var limit = Number(config.articlesPerPage) || 3;

    global.PB.getArticles(limit).then(function (items) {
      grid.classList.remove("is-loading");
      grid.removeAttribute("aria-busy");
      if (skeleton.parentNode) { skeleton.parentNode.removeChild(skeleton); }

      /* Empty result or network error: keep the static fallback cards. */
      if (!items || !items.length) { return; }

      fallbacks.forEach(function (card) {
        if (card.parentNode) { card.parentNode.removeChild(card); }
      });

      items.slice(0, limit).forEach(function (record) {
        var holder = document.createElement("div");
        holder.innerHTML = buildArticleCard(record);
        var card = holder.firstElementChild;
        if (card) { grid.appendChild(card); }
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * HTML sanitiser for PocketBase body fields
   * ------------------------------------------------------------------ */

  function safeUrl(value, allowContact) {
    var raw = String(value == null ? "" : value).trim();
    if (!raw) { return ""; }
    var compact = raw.replace(/[\u0000-\u0020]+/g, "");
    if (/^(javascript|vbscript|data):/i.test(compact)) { return ""; }

    var scheme = compact.match(/^([a-z][a-z0-9+.-]*):/i);
    if (scheme) {
      var name = scheme[1].toLowerCase();
      if (name === "http" || name === "https") { return raw; }
      if (allowContact && (name === "mailto" || name === "tel")) { return raw; }
      return "";
    }

    if (/^\/\//.test(compact)) { return raw; }
    return raw;
  }

  function cleanAttributes(element) {
    var tag = element.tagName;
    var allowed = ALLOWED_ATTRS[tag] || [];

    Array.prototype.slice.call(element.attributes).forEach(function (attr) {
      var name = attr.name.toLowerCase();

      if (name.indexOf("on") === 0 || name === "style" || name === "srcdoc" || name === "formaction") {
        element.removeAttribute(attr.name);
        return;
      }
      if (allowed.indexOf(name) === -1) {
        element.removeAttribute(attr.name);
      }
    });

    if (tag === "A") {
      var href = element.getAttribute("href");
      var safeHref = safeUrl(href, true);
      if (!safeHref) {
        element.removeAttribute("href");
      } else {
        element.setAttribute("href", safeHref);
        if (/^(https?:)?\/\//i.test(safeHref.trim())) {
          element.setAttribute("rel", "noopener noreferrer");
          element.setAttribute("target", "_blank");
        }
      }
    }

    if (tag === "IMG") {
      var src = safeUrl(element.getAttribute("src"), false);
      if (!src) {
        element.remove();
        return;
      }
      element.setAttribute("src", src);
      if (!element.hasAttribute("alt")) { element.setAttribute("alt", ""); }
      element.setAttribute("loading", "lazy");
      element.setAttribute("decoding", "async");
    }
  }

  function sanitizeNode(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 8) {
        node.removeChild(child);
        return;
      }
      if (child.nodeType !== 1) { return; }

      var tag = child.tagName.toUpperCase();

      if (DROP_TAGS[tag]) {
        node.removeChild(child);
        return;
      }

      if (!ALLOWED_TAGS[tag]) {
        /* Keep the text content of harmless wrappers such as <div>. */
        sanitizeNode(child);
        while (child.firstChild) {
          node.insertBefore(child.firstChild, child);
        }
        node.removeChild(child);
        return;
      }

      if (child.tagName === "IMG" || child.tagName === "A") {
        cleanAttributes(child);
        if (!child.parentNode) { return; }
      } else {
        cleanAttributes(child);
      }

      sanitizeNode(child);
    });
  }

  function sanitizeHtml(html) {
    var doc = new DOMParser().parseFromString(String(html || ""), "text/html");
    sanitizeNode(doc.body);
    return doc.body.innerHTML;
  }

  /* ------------------------------------------------------------------ *
   * Article detail page
   * ------------------------------------------------------------------ */

  function setMeta(selector, value) {
    var element = document.querySelector(selector);
    if (element && value) { element.setAttribute("content", value); }
  }

  function absoluteUrl(value) {
    if (!value) { return ""; }
    if (/^https?:\/\//i.test(value)) { return value; }
    return global.location.origin + (value.charAt(0) === "/" ? "" : "/") + value;
  }

  function updateJsonLd(record, title, description, image, canonical) {
    var id = "articleJsonLd";
    var script = document.getElementById(id);
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = id;
      document.head.appendChild(script);
    }

    var payload = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": description,
      "datePublished": record.published_at || record.created || "",
      "dateModified": record.updated || record.published_at || record.created || "",
      "author": {
        "@type": "Person",
        "name": articleAuthor(record)
      },
      "publisher": {
        "@type": "Organization",
        "name": (config.site && config.site.name) || "ULUÇINAR Hukuk & Danışmanlık"
      },
      "mainEntityOfPage": canonical
    };
    if (image) { payload.image = image; }

    script.textContent = JSON.stringify(payload);
  }

  function initArticlePage() {
    var page = $("[data-article-page]");
    if (!page) { return; }

    var hero = $("#articleHero");
    var coverWrap = $("#articleCoverWrap");
    var cover = $("#articleCover");
    var crumb = $("#articleCrumb");
    var category = $("#articleCategory");
    var title = $("#articleTitle");
    var meta = $("#articleMeta");
    var loading = $("#articleLoading");
    var content = $("#articleContent");
    var body = $("#articleBody");
    var missing = $("#articleMissing");
    var error = $("#articleError");
    var retry = $("#retryArticle");
    var copy = $("#copyLink");
    var copyStatus = $("#copyStatus");
    var slug = "";

    try {
      slug = new URLSearchParams(global.location.search).get("slug") || "";
    } catch (err) { slug = ""; }

    function showOnly(target) {
      [loading, content, missing, error].forEach(function (node) {
        if (!node) { return; }
        node.hidden = node !== target;
      });
    }

    function showErrorState() {
      showOnly(error);
      if (hero) { hero.classList.add("article-hero--no-cover"); }
      if (title) { title.textContent = "İçerik yüklenemedi"; }
      if (category) { category.textContent = "Makaleler"; }
      if (crumb) { crumb.textContent = "Makale"; }
      if (meta) { meta.hidden = true; }
      document.title = "İçerik yüklenemedi | ULUÇINAR Hukuk & Danışmanlık";
    }

    function showMissingState() {
      showOnly(missing);
      if (hero) { hero.classList.add("article-hero--no-cover"); }
      if (title) { title.textContent = "Makale bulunamadı"; }
      if (category) { category.textContent = "Makaleler"; }
      if (crumb) { crumb.textContent = "Makale bulunamadı"; }
      if (meta) { meta.hidden = true; }
      document.title = "Makale bulunamadı | ULUÇINAR Hukuk & Danışmanlık";
    }

    function render(record) {
      var articleTitle = record.title || "Makale";
      var description = record.excerpt || "";
      var image = coverUrl(record);
      var dateValue = record.published_at || record.created || "";
      var displayDate = formatDate(dateValue);
      var datetime = isoDate(dateValue);
      var canonical = (config.site && config.site.url ? config.site.url.replace(/\/+$/, "") : global.location.origin) +
        "/makale.html?slug=" + encodeURIComponent(articleSlug(record));

      if (title) { title.textContent = articleTitle; }
      if (crumb) { crumb.textContent = articleTitle; }
      if (category) { category.textContent = articleCategory(record); }

      if (meta) {
        meta.textContent = "";
        if (displayDate) {
          var time = document.createElement("time");
          time.setAttribute("datetime", datetime);
          time.textContent = displayDate;
          meta.appendChild(time);
          meta.appendChild(document.createTextNode(" · "));
        }
        var author = document.createElement("span");
        author.textContent = articleAuthor(record);
        meta.appendChild(author);
        meta.hidden = false;
      }

      if (image && cover && coverWrap) {
        cover.setAttribute("src", image);
        cover.setAttribute("alt", record.cover_alt || articleTitle);
        coverWrap.hidden = false;
        if (hero) { hero.classList.remove("article-hero--no-cover"); }

        cover.onerror = function () {
          coverWrap.hidden = true;
          if (hero) { hero.classList.add("article-hero--no-cover"); }
        };
      } else {
        if (coverWrap) { coverWrap.hidden = true; }
        if (hero) { hero.classList.add("article-hero--no-cover"); }
      }

      if (body) {
        var html = record.body || record.content || "";
        if (!html && description) {
          html = "<p>" + escapeHtml(description) + "</p>";
        }
        body.innerHTML = sanitizeHtml(html);
      }

      document.title = articleTitle + " | ULUÇINAR Hukuk & Danışmanlık";
      if (description) {
        setMeta('meta[name="description"]', description);
        setMeta('meta[property="og:description"]', description);
        setMeta('meta[name="twitter:description"]', description);
      }
      setMeta('meta[property="og:title"]', articleTitle);
      setMeta('meta[name="twitter:title"]', articleTitle);
      setMeta('meta[property="og:url"]', canonical);
      if (image) {
        var absoluteImage = absoluteUrl(image);
        setMeta('meta[property="og:image"]', absoluteImage);
        setMeta('meta[name="twitter:image"]', absoluteImage);
      }
      var canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) { canonicalLink.setAttribute("href", canonical); }

      updateJsonLd(record, articleTitle, description, image ? absoluteUrl(image) : "", canonical);

      showOnly(content);
      page.setAttribute("aria-busy", "false");
    }

    function load() {
      if (!slug) {
        showMissingState();
        return;
      }

      page.setAttribute("aria-busy", "true");
      showOnly(loading);

      global.PB.getArticleBySlug(slug).then(function (record) {
        if (record) {
          render(record);
        } else if (global.PB.hasError()) {
          showErrorState();
        } else {
          showMissingState();
        }
      }).catch(function () {
        showErrorState();
      });
    }

    if (retry) {
      retry.addEventListener("click", load);
    }

    if (copy) {
      copy.addEventListener("click", function () {
        var link = global.location.href;
        function done(ok) {
          if (!copyStatus) { return; }
          copyStatus.textContent = ok ? "Bağlantı kopyalandı." : "Bağlantı kopyalanamadı.";
        }
        if (global.navigator.clipboard && global.navigator.clipboard.writeText) {
          global.navigator.clipboard.writeText(link).then(function () { done(true); }).catch(function () { done(false); });
        } else {
          done(false);
        }
      });
    }

    load();
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  }

  onReady(function () {
    if (!global.PB) { return; }

    global.PB.getSettings().then(applySettings);
    initHomeArticles();
    initArticlePage();
  });
})(window);
