/**
 * ULUÇINAR Hukuk, Arabuluculuk ve Danışmanlık — minimal PocketBase client.
 *
 * No SDK, no dependencies. Every method degrades gracefully: errors return
 * null/[] and set PB.lastError so callers can distinguish "not found" from
 * "network failed". The API is always same-origin (no query-string override).
 */
(function (global) {
  "use strict";

  var config = global.SITE_CONFIG || {};
  var TIMEOUT_MS = 6000;

  var PB = {
    lastError: false
  };

  function normalizeBase(value) {
    return String(value || "").trim().replace(/\/+$/, "");
  }

  // Always same-origin (or the explicitly configured base). The former
  // ?pb=<url> override was removed: it let a shared link swap the whole
  // content API for an attacker-controlled server.
  function baseUrl() {
    return normalizeBase(config.pocketbaseUrl);
  }

  function collection(name, fallback) {
    var map = config.collections || {};
    return map[name] || fallback;
  }

  function endpoint(path) {
    return baseUrl() + path;
  }

  function request(path, params) {
    PB.lastError = false;

    var url = endpoint(path);
    if (params) {
      var query = new URLSearchParams(params).toString();
      if (query) { url += (url.indexOf("?") === -1 ? "?" : "&") + query; }
    }

    var controller = typeof global.AbortController === "function" ? new global.AbortController() : null;
    var timer = global.setTimeout(function () {
      if (controller) { controller.abort(); }
    }, TIMEOUT_MS);

    var options = {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin"
    };
    if (controller) { options.signal = controller.signal; }

    return global.fetch(url, options)
      .then(function (response) {
        if (!response.ok) {
          PB.lastError = true;
          return null;
        }
        return response.json().catch(function () {
          PB.lastError = true;
          return null;
        });
      })
      .catch(function () {
        PB.lastError = true;
        return null;
      })
      .then(function (data) {
        global.clearTimeout(timer);
        return data;
      });
  }

  function escapeFilterValue(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  }

  /**
   * First site_settings record, or null when the request fails / is empty.
   */
  PB.getSettings = function () {
    var name = collection("settings", "site_settings");
    return request("/api/collections/" + encodeURIComponent(name) + "/records", {
      perPage: "1"
    }).then(function (data) {
      if (!data || !Array.isArray(data.items) || !data.items.length) { return null; }
      return data.items[0];
    });
  };

  /**
   * Latest published articles. Returns [] on any failure.
   */
  PB.getArticles = function (limit) {
    var amount = Number(limit) || Number(config.articlesPerPage) || 3;
    var name = collection("articles", "articles");

    return request("/api/collections/" + encodeURIComponent(name) + "/records", {
      filter: "(status='published')",
      sort: "-published_at",
      perPage: String(amount)
    }).then(function (data) {
      if (!data || !Array.isArray(data.items)) { return []; }
      return data.items;
    });
  };

  /**
   * One article by slug, or null when it does not exist / the request fails.
   * Check PB.lastError to tell a network failure from an empty result.
   */
  PB.getArticleBySlug = function (slug) {
    if (!slug) { return Promise.resolve(null); }

    var name = collection("articles", "articles");
    var filter = "(slug='" + escapeFilterValue(slug) + "')";

    return request("/api/collections/" + encodeURIComponent(name) + "/records", {
      filter: filter,
      perPage: "1"
    }).then(function (data) {
      if (!data || !Array.isArray(data.items) || !data.items.length) { return null; }
      return data.items[0];
    });
  };

  /**
   * Published practice areas, ordered for the 3x3 grid.
   */
  PB.getPracticeAreas = function () {
    var name = collection("practiceAreas", "practice_areas");
    return request("/api/collections/" + encodeURIComponent(name) + "/records", {
      filter: "(published=true)",
      sort: "sort_order",
      perPage: "100"
    }).then(function (data) {
      if (!data || !Array.isArray(data.items)) { return []; }
      return data.items;
    });
  };

  /**
   * Published team members, ordered for the team grid.
   */
  PB.getTeamMembers = function () {
    var name = collection("teamMembers", "team_members");
    return request("/api/collections/" + encodeURIComponent(name) + "/records", {
      filter: "(published=true)",
      sort: "sort_order",
      perPage: "100"
    }).then(function (data) {
      if (!data || !Array.isArray(data.items)) { return []; }
      return data.items;
    });
  };

  /**
   * Published FAQ entries, ordered for the accordion.
   */
  PB.getFaq = function () {
    var name = collection("faq", "faq");
    return request("/api/collections/" + encodeURIComponent(name) + "/records", {
      filter: "(published=true)",
      sort: "sort_order",
      perPage: "100"
    }).then(function (data) {
      if (!data || !Array.isArray(data.items)) { return []; }
      return data.items;
    });
  };

  /**
   * Site-wide search across published articles, practice areas and team.
   * Resolves to { articles, practices, team, error } and never rejects.
   */
  PB.search = function (term) {
    var query = String(term || "").trim();
    if (query.length < 2) {
      return Promise.resolve({ articles: [], practices: [], team: [], error: false });
    }
    var safe = escapeFilterValue(query);

    function run(name, filter, sort, perPage) {
      return request("/api/collections/" + encodeURIComponent(name) + "/records", {
        filter: filter,
        sort: sort,
        perPage: String(perPage)
      }).then(function (data) {
        return data && Array.isArray(data.items) ? data.items : [];
      });
    }

    return Promise.all([
      run(collection("articles", "articles"),
        "(status='published' && (title~'" + safe + "' || excerpt~'" + safe + "' || body~'" + safe + "'))",
        "-published_at", 8),
      run(collection("practiceAreas", "practice_areas"),
        "(published=true && (title~'" + safe + "' || summary~'" + safe + "' || body~'" + safe + "'))",
        "sort_order", 6),
      run(collection("teamMembers", "team_members"),
        "(published=true && (name~'" + safe + "' || role~'" + safe + "'))",
        "sort_order", 6)
    ]).then(function (results) {
      return {
        articles: results[0],
        practices: results[1],
        team: results[2],
        error: PB.lastError
      };
    }).catch(function () {
      return { articles: [], practices: [], team: [], error: true };
    });
  };

  /**
   * Absolute or root-relative URL for a PocketBase file field.
   */
  PB.fileUrl = function (record, filename) {
    if (!record || !filename) { return ""; }

    var collectionId = record.collectionId || record.collectionName || collection("articles", "articles");
    var id = record.id;
    if (!collectionId || !id) { return ""; }

    return baseUrl() + "/api/files/" +
      encodeURIComponent(collectionId) + "/" +
      encodeURIComponent(id) + "/" +
      encodeURIComponent(filename);
  };

  PB.hasError = function () {
    return PB.lastError;
  };

  PB.baseUrl = baseUrl;

  global.PB = PB;
})(window);
