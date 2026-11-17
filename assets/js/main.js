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

    if (reduceMotion.matches) {
      markSplashReady();
      preloader.classList.add("is-reduced");
      window.setTimeout(function () { finishIntro(false); }, 450);
      return;
    }

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
        kvkk: fieldByName("kvkk").checked,
        source: "website",
        page: window.location.href
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
          if (!response.ok) { throw new Error("HTTP " + response.status); }
          form.reset();
          clearAll();
          showStatus("Mesajınız alındı. En kısa sürede size dönüş yapılacaktır.", "success");
        })
        .catch(function () {
          showStatus(
            "Mesajınız şu anda gönderilemedi. Lütfen info@ulucinar.av.tr adresine e-posta gönderin veya WhatsApp'tan yazın.",
            "error"
          );
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
    startIntro();
  });
})();
