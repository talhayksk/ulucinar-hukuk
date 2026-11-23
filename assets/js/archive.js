/**
 * ULUÇINAR Hukuk & Danışmanlık — article archive filtering.
 *
 * The archive page is fully server-rendered: every published article card is
 * already in the DOM (works without JavaScript). This script only filters the
 * existing cards by search text and category; it never calls PocketBase.
 */
(function (global) {
  "use strict";

  function $(selector, context) {
    return (context || document).querySelector(selector);
  }

  function $$(selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  }

  function fold(value) {
    return String(value == null ? "" : value)
      .toLocaleLowerCase("tr")
      .replace(/ı/g, "i")
      .replace(/ş/g, "s")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function initArchive() {
    var grid = $("#archiveGrid");
    if (!grid) { return; }

    var cards = $$(".article", grid);
    var input = $("#archiveSearch");
    var chips = $$("[data-archive-filter]");
    var count = $("#archiveCount");
    var emptyAll = $("#archiveEmpty");
    var emptyResults = $("#archiveNoResults");
    var activeCategory = "all";
    var total = cards.length;

    function setPressed(chip, pressed) {
      chip.setAttribute("aria-pressed", pressed ? "true" : "false");
      chip.classList.toggle("is-active", pressed);
    }

    function apply() {
      var terms = fold(input && input.value).split(" ").filter(Boolean);
      var visible = 0;

      cards.forEach(function (card) {
        var category = card.getAttribute("data-category") || "";
        var haystack = card.getAttribute("data-search") || "";

        var matchesCategory = activeCategory === "all" || category === activeCategory;
        var matchesTerms = terms.every(function (term) {
          return haystack.indexOf(term) !== -1;
        });
        var show = matchesCategory && matchesTerms;

        card.hidden = !show;
        if (show) { visible++; }
      });

      if (count) {
        if (!total) {
          count.textContent = "";
        } else if (visible === total) {
          count.textContent = total + " makale";
        } else {
          count.textContent = visible + " / " + total + " makale";
        }
      }
      if (emptyAll) { emptyAll.hidden = total > 0; }
      if (emptyResults) { emptyResults.hidden = !(total > 0 && visible === 0); }
    }

    if (input) {
      input.addEventListener("input", apply);
      input.addEventListener("search", apply);
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        activeCategory = chip.getAttribute("data-archive-filter") || "all";
        chips.forEach(function (other) { setPressed(other, other === chip); });
        apply();
      });
    });

    apply();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initArchive, { once: true });
  } else {
    initArchive();
  }
})(window);
