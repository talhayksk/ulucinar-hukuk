/**
 * ULUÇINAR Hukuk & Danışmanlık — interactions.
 * Vanilla JS, no dependencies. Every feature degrades safely without JS.
 */
(function () {
  "use strict";

  var html = document.documentElement;
  var config = window.SITE_CONFIG || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  var INTRO_FILL_MS = 2600;
  var INTRO_BADGE_WAIT_MS = 150;
  var INTRO_EXIT_MS = 650;
  var HERO_INTERVAL_MS = 6000;

  var introDone = false;
  var introTimer = null;

  function $(selector, context) {
    return (context || document).querySelector(selector);
  }

  function $$(selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  }

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  }

  /* ------------------------------------------------------------------ *
   * 1. Intro / preloader
   * ------------------------------------------------------------------ */

  function getPreloader() {
    return document.getElementById("preloader");
  }

  function getShell() {
    return document.getElementById("siteShell");
  }

  function announceIntroDone() {
    window.dispatchEvent(new CustomEvent("ulucinar:intro-done"));
  }

  function finishIntro(instant) {
    if (introDone) { return; }
    introDone = true;
    if (introTimer) { window.clearTimeout(introTimer); }

    var preloader = getPreloader();
    var shell = getShell();
    var reduced = reduceMotion.matches;
    var delay = instant ? 0 : (reduced ? 520 : INTRO_EXIT_MS + 40);

    if (preloader && !instant) {
      preloader.classList.add("is-exiting");
    }

    /* Reveal the site beneath the sweeping overlay. */
    html.classList.add("intro-done");

    window.setTimeout(function () {
      if (preloader) {
        preloader.setAttribute("aria-hidden", "true");
        preloader.style.display = "none";
      }
      if (shell) { shell.removeAttribute("inert"); }
      html.classList.remove("is-loading");
      announceIntroDone();
    }, delay);
  }

  /* Graceful version of the bootstrap fallback. */
  window.__skipIntro = function () {
    finishIntro(true);
  };

  function markSplashReady() {
    html.classList.add("splash-ready");
  }

  function waitForBadge(preloader) {
    var badges = preloader ? preloader.querySelectorAll(".splash-badge") : [];
    var decodes = [];

    Array.prototype.forEach.call(badges, function (img) {
      if (img.decode) {
        decodes.push(img.decode().catch(function () {}));
      }
    });

    if (!decodes.length) {
      markSplashReady();
      return;
    }

    /* Start after the badge is decoded, but never wait more than 150 ms. */
    var timer = window.setTimeout(markSplashReady, INTRO_BADGE_WAIT_MS);
    Promise.all(decodes)
      .then(function () {
        window.clearTimeout(timer);
        markSplashReady();
      })
      .catch(function () {
        window.clearTimeout(timer);
        markSplashReady();
      });
  }

  function startIntro() {
    var preloader = getPreloader();

    if (html.classList.contains("intro-off")) {
      if (preloader) {
        preloader.setAttribute("aria-hidden", "true");
        preloader.style.display = "none";
      }
      var offShell = getShell();
      if (offShell) { offShell.removeAttribute("inert"); }
      html.classList.remove("is-loading");
      introDone = true;
      return;
    }

    if (!preloader) {
      finishIntro(true);
      return;
    }

    var forceIntro = false;
    var seenIntro = false;
    try {
      var introParams = new URLSearchParams(window.location.search);
      forceIntro = introParams.get("intro") === "1";
      seenIntro = window.sessionStorage.getItem("ulucinar-intro-seen") === "1";
    } catch (err) { /* storage unavailable */ }

    /* One intro per browser session; reduced motion skips it entirely. */
    if (reduceMotion.matches || (seenIntro && !forceIntro)) {
      finishIntro(true);
      return;
    }

    try {
      window.sessionStorage.setItem("ulucinar-intro-seen", "1");
    } catch (err) { /* ignore */ }

    /* Reveal and start the fill once the real badge is decoded. */
    waitForBadge(preloader);

    var fill = preloader.querySelector(".logo-fill");
    var exitScheduled = false;

    function scheduleExit() {
      if (exitScheduled || introDone) { return; }
      exitScheduled = true;
      introTimer = window.setTimeout(function () { finishIntro(false); }, 100);
    }

    if (fill) {
      fill.addEventListener("animationend", function (event) {
        if (event.animationName === "splash-fill") { scheduleExit(); }
      });
    }

    /* Failsafe in case the animationend event never arrives. */
    introTimer = window.setTimeout(scheduleExit, INTRO_FILL_MS + INTRO_BADGE_WAIT_MS + 900);
  }

  /* ------------------------------------------------------------------ *
   * 2. Header, dropdown, mobile menu
   * ------------------------------------------------------------------ */

  function initHeader() {
    var header = $("#header");
    var toTop = $("#toTop");

    function onScroll() {
      var y = window.scrollY || window.pageYOffset || 0;
      if (header) { header.classList.toggle("is-scrolled", y > 12); }
      if (toTop) { toTop.classList.toggle("is-visible", y > 600); }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function initDropdown() {
    var dropdown = $("#practiceDropdown");
    if (!dropdown) { return; }

    var toggle = $(".nav__toggle", dropdown);
    if (!toggle) { return; }

    function close() {
      dropdown.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", function (event) {
      event.stopPropagation();
      var open = !dropdown.classList.contains("is-open");
      dropdown.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });

    document.addEventListener("click", function (event) {
      if (!dropdown.contains(event.target)) { close(); }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && dropdown.classList.contains("is-open")) {
        close();
        toggle.focus();
      }
    });

    $$("a", dropdown).forEach(function (link) {
      link.addEventListener("click", close);
    });
  }

  function trapFocus(event, container) {
    var focusable = $$(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      container
    ).filter(function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });

    if (!focusable.length) { return; }

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function initMobileMenu() {
    var toggle = $("#menuToggle");
    var panel = $("#mobileMenu");
    var closeButton = $("#menuClose");
    if (!toggle || !panel) { return; }

    var lastFocus = null;

    function setOpen(open, restoreFocus) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Menüyü kapat" : "Menüyü aç");
      panel.setAttribute("aria-hidden", String(!open));
      panel.classList.toggle("is-open", open);
      html.classList.toggle("menu-open", open);

      if (open) {
        lastFocus = document.activeElement;
        panel.removeAttribute("inert");
        window.setTimeout(function () {
          if (closeButton) { closeButton.focus(); }
        }, 40);
      } else {
        panel.setAttribute("inert", "");
        if (restoreFocus !== false) {
          var target = lastFocus && lastFocus.focus ? lastFocus : toggle;
          target.focus();
        }
      }
    }

    /* Closed by default: keep it out of the tab order and the a11y tree. */
    if (!panel.classList.contains("is-open")) {
      panel.setAttribute("inert", "");
    }

    toggle.addEventListener("click", function () {
      setOpen(!panel.classList.contains("is-open"), true);
    });

    if (closeButton) {
      closeButton.addEventListener("click", function () {
        setOpen(false, true);
      });
    }

    $$("a", panel).forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false, false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (!panel.classList.contains("is-open")) { return; }

      if (event.key === "Escape") {
        setOpen(false, true);
        return;
      }

      if (event.key === "Tab") {
        trapFocus(event, panel);
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * 3. Hero slider
   * ------------------------------------------------------------------ */

  function initHeroSlider() {
    var slides = $$(".hero__slide");
    var dots = $$(".hero__dot");
    if (slides.length < 2 || !dots.length) { return; }

    var index = 0;
    var timer = null;

    function goTo(next) {
      index = (next + slides.length) % slides.length;

      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });

      dots.forEach(function (dot, i) {
        var active = i === index;
        dot.classList.toggle("is-active", active);
        if (active) {
          dot.setAttribute("aria-current", "true");
        } else {
          dot.removeAttribute("aria-current");
        }
      });
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function start() {
      stop();
      if (reduceMotion.matches) { return; }
      timer = window.setInterval(function () {
        goTo(index + 1);
      }, HERO_INTERVAL_MS);
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        goTo(Number(dot.getAttribute("data-slide")) || 0);
        start();
      });
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { stop(); } else { start(); }
    });

    if (reduceMotion.addEventListener) {
      reduceMotion.addEventListener("change", start);
    }

    goTo(0);

    /* Keep the first hero frame during the splash, then start the rotation. */
    var introRunning = html.classList.contains("is-loading") && !html.classList.contains("intro-off");
    if (introRunning) {
      window.addEventListener("ulucinar:intro-done", start, { once: true });
    } else {
      start();
    }
  }

  /* ------------------------------------------------------------------ *
   * 4. Active section + scroll reveal
   * ------------------------------------------------------------------ */

  function initActiveSection() {
    var links = $$(".nav__link[data-section]");
    if (!links.length || !("IntersectionObserver" in window)) { return; }

    var bySection = {};
    links.forEach(function (link) {
      bySection[link.getAttribute("data-section")] = link;
    });

    function setCurrent(id) {
      links.forEach(function (link) {
        link.classList.remove("is-current");
        link.removeAttribute("aria-current");
      });
      var link = bySection[id];
      if (link) {
        link.classList.add("is-current");
        link.setAttribute("aria-current", "true");
      }
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { setCurrent(entry.target.id); }
      });
    }, { rootMargin: "-42% 0px -52% 0px", threshold: 0 });

    ["anasayfa", "hakkimizda", "calisma-alanlari", "ekibimiz", "makaleler", "sss", "iletisim"].forEach(function (id) {
      var section = document.getElementById(id);
      if (section) { observer.observe(section); }
    });
  }

  function initReveal() {
    var items = $$("[data-reveal]");
    if (!items.length) { return; }

    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      items.forEach(function (item) { item.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    items.forEach(function (item) {
      item.classList.add("reveal");
      observer.observe(item);
    });
  }

  /* ------------------------------------------------------------------ *
   * 5. FAQ accordion
   * ------------------------------------------------------------------ */

  function initFaq() {
    var items = $$(".faq__item");
    if (!items.length) { return; }

    function openItem(item) {
      var button = $(".faq__q", item);
      var panel = $(".faq__a", item);
      if (!button || !panel) { return; }

      panel.hidden = false;
      item.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");

      if (reduceMotion.matches) {
        panel.style.maxHeight = "none";
        return;
      }

      panel.style.maxHeight = "0px";
      window.requestAnimationFrame(function () {
        panel.style.maxHeight = panel.scrollHeight + "px";
      });
    }

    function closeItem(item) {
      var button = $(".faq__q", item);
      var panel = $(".faq__a", item);
      if (!button || !panel) { return; }
      if (button.getAttribute("aria-expanded") !== "true") { return; }

      item.classList.remove("is-open");
      button.setAttribute("aria-expanded", "false");

      if (reduceMotion.matches) {
        panel.hidden = true;
        panel.style.maxHeight = "";
        return;
      }

      panel.style.maxHeight = panel.scrollHeight + "px";
      window.requestAnimationFrame(function () {
        panel.style.maxHeight = "0px";
      });

      var onEnd = function (event) {
        if (event.target !== panel) { return; }
        panel.hidden = true;
        panel.style.maxHeight = "";
        panel.removeEventListener("transitionend", onEnd);
      };
      panel.addEventListener("transitionend", onEnd);
    }

    items.forEach(function (item) {
      var button = $(".faq__q", item);
      var panel = $(".faq__a", item);
      if (!button || !panel) { return; }

      button.addEventListener("click", function () {
        var isOpen = button.getAttribute("aria-expanded") === "true";
        items.forEach(function (other) {
          if (other !== item) { closeItem(other); }
        });
        if (isOpen) { closeItem(item); } else { openItem(item); }
      });

      panel.addEventListener("transitionend", function (event) {
        if (event.target === panel && button.getAttribute("aria-expanded") === "true") {
          panel.style.maxHeight = "none";
        }
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * 6. Contact form
   * ------------------------------------------------------------------ */

  function initForm() {
    var form = $("#contactForm");
    if (!form) { return; }

    var status = $("#formStatus");
    var submit = $("#formSubmit");
    var submitLabel = submit ? $(".btn__label", submit) : null;
    var originalLabel = submitLabel ? submitLabel.textContent : "Mesajı Gönder";
    var endpoint = (config.contactEndpoint || "").trim();

    var validators = {
      name: function (value) {
        return value.trim().length >= 2 ? "" : "Lütfen adınızı ve soyadınızı yazın.";
      },
      phone: function (value) {
        var digits = value.replace(/\D/g, "");
        return digits.length >= 10 && digits.length <= 15 ? "" : "Geçerli bir telefon numarası girin.";
      },
      email: function (value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) ? "" : "Geçerli bir e-posta adresi girin.";
      },
      subject: function (value) {
        return value ? "" : "Lütfen bir konu seçin.";
      },
      message: function (value) {
        return value.trim().length >= 10 ? "" : "Mesajınız en az 10 karakter olmalı.";
      },
      kvkk: function (_value, field) {
        return field.checked ? "" : "Devam etmek için KVKK metnini onaylayın.";
      }
    };

    function fieldByName(name) {
      return form.elements[name] || null;
    }

    function setError(name, message) {
      var field = fieldByName(name);
      var error = document.getElementById("err-" + name);

      if (error) { error.textContent = message; }

      if (field) {
        if (message) {
          field.setAttribute("aria-invalid", "true");
        } else {
          field.removeAttribute("aria-invalid");
        }
      }
    }

    function validateField(name) {
      var field = fieldByName(name);
      if (!field || !validators[name]) { return true; }
      var message = validators[name](field.value || "", field);
      setError(name, message);
      return message === "";
    }

    function clearAll() {
      Object.keys(validators).forEach(function (name) { setError(name, ""); });
      if (status) {
        status.textContent = "";
        status.className = "form-status";
      }
    }

    function showStatus(message, type) {
      if (!status) { return; }
      status.textContent = message;
      status.className = "form-status " + (type === "error" ? "is-error" : "is-success");
      status.focus();
    }

    function setLoading(loading) {
      if (!submit) { return; }
      submit.disabled = loading;
      submit.classList.toggle("is-loading", loading);
      submit.setAttribute("aria-busy", String(loading));
      if (submitLabel) {
        submitLabel.textContent = loading ? "Gönderiliyor…" : originalLabel;
      }
    }

    function sendMailto(payload) {
      setLoading(true);
      var email = (config.contact && config.contact.email) || "info@ulucinar.av.tr";
      var subject = "Web sitesi iletişim: " + payload.subject;
      var body = [
        "Ad Soyad: " + payload.name,
        "Telefon: " + payload.phone,
        "E-posta: " + payload.email,
        "Konu: " + payload.subject,
        "",
        payload.message
      ].join("\n");

      var href = "mailto:" + email +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      window.setTimeout(function () {
        window.location.href = href;
        setLoading(false);
        showStatus("E-posta uygulamanız açıldı. Gönderimi oradan tamamlayabilirsiniz.", "success");
      }, 350);
    }

    Object.keys(validators).forEach(function (name) {
      var field = fieldByName(name);
      if (!field) { return; }

      var eventName = field.type === "checkbox" || field.tagName === "SELECT" ? "change" : "blur";

      field.addEventListener(eventName, function () {
        if (field.getAttribute("aria-invalid") === "true" || name === "kvkk") {
          validateField(name);
        }
      });

      field.addEventListener("input", function () {
        if (field.getAttribute("aria-invalid") === "true") {
          validateField(name);
        }
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (status) {
        status.textContent = "";
        status.className = "form-status";
      }

      var firstInvalid = null;

      Object.keys(validators).forEach(function (name) {
        if (!validateField(name) && !firstInvalid) {
          firstInvalid = fieldByName(name);
        }
      });

      if (firstInvalid) {
        if (status) {
          status.textContent = "Lütfen işaretli alanları kontrol edin.";
          status.className = "form-status is-error";
        }
        firstInvalid.focus();
        return;
      }

      var payload = {
        name: fieldByName("name").value.trim(),
        phone: fieldByName("phone").value.trim(),
        email: fieldByName("email").value.trim(),
        subject: fieldByName("subject").value,
        message: fieldByName("message").value.trim(),
        kvkk_consent: fieldByName("kvkk").checked === true,
        source: "website",
        page: window.location.pathname
      };

      if (!endpoint) {
        sendMailto(payload);
        return;
      }

      setLoading(true);

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          if (!response.ok) {
            var httpError = new Error("HTTP " + response.status);
            httpError.status = response.status;
            throw httpError;
          }
          form.reset();
          clearAll();
          showStatus("Mesajınız alındı. En kısa sürede size dönüş yapılacaktır.", "success");
        })
        .catch(function (error) {
          var message = "Mesajınız şu anda gönderilemedi. Lütfen info@ulucinar.av.tr adresine e-posta gönderin veya WhatsApp'tan yazın.";
          if (error && error.status === 429) {
            message = "Çok fazla deneme yapıldı. Lütfen bir dakika sonra tekrar deneyin.";
          } else if (error && error.status === 400) {
            message = "Form bilgileri doğrulanamadı. Lütfen alanları kontrol edip yeniden deneyin.";
          }
          showStatus(message, "error");
        })
        .then(function () {
          setLoading(false);
        });
    });
  }

  /* ------------------------------------------------------------------ *
   * 7. Config-driven links, year, details deep link
   * ------------------------------------------------------------------ */

  function initConfigLinks() {
    var whatsapp = (config.social && config.social.whatsapp) ||
      (config.contact && config.contact.whatsapp) || "";

    if (whatsapp) {
      $$("[data-whatsapp]").forEach(function (link) {
        link.setAttribute("href", whatsapp);
      });
    }

    var instagram = (config.social && config.social.instagram) || "";
    var linkedin = (config.social && config.social.linkedin) || "";

    $$('.footer__social a[aria-label="Instagram"]').forEach(function (link) {
      if (instagram) { link.setAttribute("href", instagram); }
    });
    $$('.footer__social a[aria-label="LinkedIn"]').forEach(function (link) {
      if (linkedin) { link.setAttribute("href", linkedin); }
    });
  }

  function initYear() {
    var year = $("#year");
    if (year) { year.textContent = String(new Date().getFullYear()); }
  }

  function initDetailsLink() {
    var details = document.getElementById("kvkk-notu");
    if (!details) { return; }

    $$('a[href="#kvkk-notu"]').forEach(function (link) {
      link.addEventListener("click", function () {
        details.open = true;
      });
    });
  }

  /* Re-bind the accordion after PocketBase replaces the FAQ list. */
  window.SiteUI = window.SiteUI || {};
  window.SiteUI.initFaq = initFaq;


  /* ------------------------------------------------------------------ *
   * 7b. Cookie notice (localStorage, shown once)
   * ------------------------------------------------------------------ */

  var COOKIE_KEY = "ulucinar-cookie-consent";

  function readCookieChoice() {
    try {
      var raw = window.localStorage.getItem(COOKIE_KEY);
      if (!raw) { return ""; }
      try {
        var parsed = JSON.parse(raw);
        return parsed && parsed.choice ? String(parsed.choice) : "";
      } catch (err) {
        return String(raw);
      }
    } catch (err) {
      return "";
    }
  }

  /* Analytics (Plausible) loads only with provider+id configured AND consent. */
  function injectPlausible(domain) {
    if (!domain || document.getElementById("plausibleScript")) { return; }
    var script = document.createElement("script");
    script.id = "plausibleScript";
    script.defer = true;
    script.setAttribute("data-domain", domain);
    script.src = "https://plausible.io/js/script.js";
    script.addEventListener("error", function () {
      /* blocked or offline: the site keeps working */
    });
    document.head.appendChild(script);
  }

  function loadAnalyticsIfConsented() {
    if (readCookieChoice() !== "accepted") { return; }
    if (document.getElementById("plausibleScript")) { return; }

    globalFetchSettings(function (settings) {
      if (!settings) { return; }
      if (settings.analytics_provider !== "plausible") { return; }
      injectPlausible(String(settings.analytics_id || "").trim());
    });
  }

  function globalFetchSettings(callback) {
    if (!window.fetch) { return callback(null); }
    window.fetch("/api/collections/site_settings/records?perPage=1", {
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin"
    })
      .then(function (response) {
        return response.ok ? response.json() : null;
      })
      .then(function (data) {
        callback(data && data.items && data.items.length ? data.items[0] : null);
      })
      .catch(function () { callback(null); });
  }

  function storeCookieChoice(choice) {
    try {
      window.localStorage.setItem(COOKIE_KEY, JSON.stringify({ choice: choice, at: new Date().toISOString() }));
    } catch (err) {
      /* private mode: show the banner again next visit */
    }
  }

  function initCookieBanner() {
    if (readCookieChoice()) { return; }
    if (document.getElementById("cookieBanner")) { return; }

    var banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.id = "cookieBanner";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Çerez bilgilendirmesi");
    banner.innerHTML =
      '<div class="cookie-banner__inner">' +
        '<p class="cookie-banner__text">Bu sitede yalnızca <strong>zorunlu ve teknik çerezler</strong> ile ' +
          'tarayıcı yerel depolaması (localStorage) kullanılır; analitik veya reklam çerezi yoktur. ' +
          'Ayrıntılar için <a href="/cerez-politikasi/">Çerez Politikası</a>.</p>' +
        '<div class="cookie-banner__actions">' +
          '<button type="button" class="btn btn--gold btn--sm" data-cookie-choice="accepted">Kabul et</button>' +
          '<button type="button" class="btn btn--ghost btn--sm" data-cookie-choice="necessary">Sadece zorunlu</button>' +
          '<button type="button" class="cookie-banner__close" data-cookie-choice="dismissed" aria-label="Çerez bilgilendirmesini kapat">' +
            '<svg class="icon" aria-hidden="true"><use href="#i-close"></use></svg>' +
          "</button>" +
        "</div>" +
      "</div>";
    document.body.appendChild(banner);
    document.body.classList.add("has-cookie-banner");

    function hide(choice) {
      document.body.classList.remove("has-cookie-banner");
      storeCookieChoice(choice);
      if (choice === "accepted") {
        loadAnalyticsIfConsented();
      }
      banner.classList.add("is-hidden");
      window.setTimeout(function () {
        if (banner.parentNode) { banner.parentNode.removeChild(banner); }
      }, 260);
      document.removeEventListener("keydown", onKey);
    }

    function onKey(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        hide("dismissed");
      }
    }

    banner.addEventListener("click", function (event) {
      var target = event.target.closest ? event.target.closest("[data-cookie-choice]") : null;
      if (!target) { return; }
      hide(target.getAttribute("data-cookie-choice") || "accepted");
    });

    document.addEventListener("keydown", onKey);
  }


  /* ------------------------------------------------------------------ *
   * 8. Site search overlay
   * ------------------------------------------------------------------ */

  function escapeSearchHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function initSearch() {
    var triggers = $$("[data-search-open]");
    if (!triggers.length) { return; }
    if (document.getElementById("searchOverlay")) { return; }

    var overlay = document.createElement("div");
    overlay.className = "search-overlay";
    overlay.id = "searchOverlay";
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="search-overlay__backdrop" data-search-close></div>' +
      '<div class="search-overlay__panel" role="dialog" aria-modal="true" aria-labelledby="searchTitle">' +
        '<div class="search-overlay__head">' +
          '<h2 class="search-overlay__title" id="searchTitle">Sitede ara</h2>' +
          '<button class="search-overlay__close" type="button" data-search-close aria-label="Aramayı kapat">' +
            '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
          "</button>" +
        "</div>" +
        '<form class="search-overlay__form" role="search">' +
          '<label class="sr-only" for="searchInput">Arama</label>' +
          '<input id="searchInput" class="search-overlay__input" type="search" autocomplete="off" spellcheck="false" placeholder="Makale, çalışma alanı veya ekip üyesi ara">' +
        "</form>" +
        '<p class="search-overlay__status" id="searchStatus" role="status" aria-live="polite"></p>' +
        '<div class="search-overlay__results" id="searchResults"></div>' +
        '<p class="search-overlay__hint">En az 2 karakter yazın. Enter ile ilk sonuca gidebilirsiniz.</p>' +
      "</div>";
    document.body.appendChild(overlay);

    var panel = $(".search-overlay__panel", overlay);
    var input = $("#searchInput", overlay);
    var status = $("#searchStatus", overlay);
    var results = $("#searchResults", overlay);
    var form = $(".search-overlay__form", overlay);
    var lastTrigger = null;
    var timer = null;
    var sequence = 0;
    var keyHandler = null;

    function setStatus(text, isError) {
      status.textContent = text;
      status.classList.toggle("is-error", !!isError);
    }

    function resultItem(href, title, meta) {
      return '<a class="search-result" href="' + href + '">' +
        '<span class="search-result__title">' + escapeSearchHtml(title) + "</span>" +
        (meta ? '<span class="search-result__meta">' + escapeSearchHtml(meta) + "</span>" : "") +
      "</a>";
    }

    function group(title, items) {
      if (!items.length) { return ""; }
      return '<section class="search-group" aria-label="' + title + '">' +
        '<h3 class="search-group__title">' + title + "</h3>" +
        '<div class="search-group__list">' + items.join("") + "</div>" +
      "</section>";
    }

    function render(data) {
      var articles = (data.articles || []).map(function (record) {
        return resultItem(
          "/makale/" + encodeURIComponent(record.slug) + "/",
          record.title || record.slug,
          record.excerpt || record.category || "Makale"
        );
      });
      var practices = (data.practices || []).map(function (record) {
        return resultItem(
          "/calisma-alani/" + encodeURIComponent(record.slug) + "/",
          record.title || record.slug,
          record.summary || "Çalışma alanı"
        );
      });
      var team = (data.team || []).map(function (record) {
        return resultItem(
          "/ekip/" + encodeURIComponent(record.slug) + "/",
          record.name || record.slug,
          record.role || "Ekip üyesi"
        );
      });
      var total = articles.length + practices.length + team.length;
      if (!total) {
        results.innerHTML = "";
        setStatus("Sonuç bulunamadı.");
        return;
      }
      results.innerHTML =
        group("Makaleler", articles) +
        group("Çalışma Alanları", practices) +
        group("Ekip", team);
      setStatus(total + " sonuç");
    }

    function runSearch(term) {
      var current = ++sequence;
      setStatus("Aranıyor…");
      results.innerHTML = "";
      if (!window.PB || typeof window.PB.search !== "function") {
        setStatus("Arama şu anda kullanılamıyor.", true);
        return;
      }
      window.PB.search(term).then(function (data) {
        if (current !== sequence) { return; }
        if (data.error) {
          setStatus("Arama yapılamadı. Lütfen yeniden deneyin.", true);
          return;
        }
        render(data);
      });
    }

    function onKey(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") { return; }
      var focusables = $$("a[href], button:not([disabled]), input", panel)
        .filter(function (element) { return element.offsetParent !== null; });
      if (!focusables.length) { return; }
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function open(trigger) {
      var menuClose = document.getElementById("menuClose");
      if (menuClose && document.documentElement.classList.contains("menu-open")) {
        menuClose.click();
      } else if (document.body.classList.contains("menu-open") && menuClose) {
        menuClose.click();
      }
      lastTrigger = trigger || null;
      overlay.hidden = false;
      document.body.classList.add("search-open");
      keyHandler = onKey;
      document.addEventListener("keydown", keyHandler);
      window.setTimeout(function () { input.focus(); }, 20);
    }

    function close() {
      if (overlay.hidden) { return; }
      overlay.hidden = true;
      document.body.classList.remove("search-open");
      if (keyHandler) {
        document.removeEventListener("keydown", keyHandler);
        keyHandler = null;
      }
      if (timer) { window.clearTimeout(timer); timer = null; }
      sequence++;
      input.value = "";
      results.innerHTML = "";
      setStatus("");
      if (lastTrigger && typeof lastTrigger.focus === "function") { lastTrigger.focus(); }
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function (event) {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return; /* no-JS style fallback: the link goes to /makaleler/ */
        }
        event.preventDefault();
        open(trigger);
      });
    });

    $$("[data-search-close]", overlay).forEach(function (element) {
      element.addEventListener("click", close);
    });

    input.addEventListener("input", function () {
      var term = input.value.trim();
      if (timer) { window.clearTimeout(timer); }
      if (term.length < 2) {
        sequence++;
        results.innerHTML = "";
        setStatus(term.length ? "En az 2 karakter yazın." : "");
        return;
      }
      timer = window.setTimeout(function () { runSearch(term); }, 250);
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var firstResult = results.querySelector(".search-result");
      if (firstResult) { firstResult.click(); }
    });

    document.addEventListener("keydown", function (event) {
      var target = event.target;
      var tagName = (target && target.tagName ? target.tagName : "").toLowerCase();
      var typing = tagName === "input" || tagName === "textarea" || tagName === "select" ||
        (target && target.isContentEditable);
      if (typing) { return; }

      var isSlash = event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey;
      var isCmdK = (event.metaKey || event.ctrlKey) && (event.key === "k" || event.key === "K");
      if (!isSlash && !isCmdK) { return; }
      if (!overlay.hidden) { return; }
      event.preventDefault();
      open(triggers[0]);
    });
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */

  onReady(function () {
    var shell = getShell();
    if (shell && html.classList.contains("is-loading")) {
      shell.setAttribute("inert", "");
    }

    initConfigLinks();
    initHeader();
    initDropdown();
    initMobileMenu();
    initHeroSlider();
    initActiveSection();
    initReveal();
    initFaq();
    initForm();
    initYear();
    initDetailsLink();
    initCookieBanner();
    loadAnalyticsIfConsented();
    initSearch();
    startIntro();
  });
})();
