/**
 * ULUÇINAR Hukuk & Danışmanlık — appointment request form.
 *
 * Sends a request to PocketBase (no calendar reservation). The practice area
 * list is hydrated from practice_areas when available; the static options in
 * the HTML are the fallback. `?area=<slug>` preselects the area.
 */
(function (global) {
  "use strict";

  var config = global.SITE_CONFIG || {};

  var AREA_BY_SLUG = {
    "aile-hukuku": "Aile Hukuku",
    "ceza-hukuku": "Ceza Hukuku",
    "ticaret-hukuku": "Ticaret ve Şirketler",
    "is-hukuku": "İş Hukuku",
    "gayrimenkul-hukuku": "Gayrimenkul",
    "miras-hukuku": "Miras",
    "icra-hukuku": "İcra ve İflas",
    "idare-hukuku": "İdare",
    "goc-hukuku": "Yabancılar ve Göç",
  };

  function $(selector, context) {
    return (context || document).querySelector(selector);
  }

  function digits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function twoDigits(value) {
    return value < 10 ? "0" + value : String(value);
  }

  function todayLocal() {
    var now = new Date();
    return now.getFullYear() + "-" + twoDigits(now.getMonth() + 1) + "-" + twoDigits(now.getDate());
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function init() {
    var form = document.getElementById("appointmentForm");
    if (!form) { return; }

    var status = document.getElementById("appointmentStatus");
    var submit = document.getElementById("appointmentSubmit");
    var submitLabel = submit ? $(".btn__label", submit) : null;
    var originalLabel = submitLabel ? submitLabel.textContent : "Talebi Gönder";
    var endpoint = (config.appointmentEndpoint || "/api/collections/appointments/records").trim();
    var areaSelect = $("[data-appointment-area]", form);
    var dateInput = form.elements["preferred_date"];

    var areaSlug = "";
    try {
      areaSlug = new URLSearchParams(global.location.search).get("area") || "";
    } catch (err) { areaSlug = ""; }

    if (dateInput) {
      dateInput.min = todayLocal();
    }

    if (areaSelect && areaSlug && AREA_BY_SLUG[areaSlug]) {
      areaSelect.value = AREA_BY_SLUG[areaSlug];
    }

    if (areaSelect && global.PB && global.PB.getPracticeAreas) {
      global.PB.getPracticeAreas().then(function (records) {
        if (!records || !records.length) { return; }
        var current = areaSelect.value;
        var options = ['<option value="">Seçiniz (opsiyonel)</option>'];
        var selected = "";
        records.forEach(function (record) {
          var title = String(record.title || "");
          if (!title) { return; }
          options.push("<option>" + escapeHtml(title) + "</option>");
          if (record.slug === areaSlug) { selected = title; }
        });
        options.push("<option>Diğer</option>");
        areaSelect.innerHTML = options.join("");
        areaSelect.value = selected || current;
      });
    }

    var validators = {
      name: function (value) {
        return value.trim().length >= 2 ? "" : "Lütfen adınızı ve soyadınızı yazın.";
      },
      phone: function (value) {
        var count = digits(value).length;
        return count >= 10 && count <= 15 ? "" : "Geçerli bir telefon numarası girin.";
      },
      email: function (value) {
        if (!value.trim()) { return ""; }
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) ? "" : "Geçerli bir e-posta adresi girin.";
      },
      preferred_date: function (value) {
        if (!value) { return ""; }
        return value >= todayLocal() ? "" : "Lütfen bugün veya ilerisi için bir tarih seçin.";
      },
      kvkk: function (_value, field) {
        return field.checked ? "" : "Devam etmek için KVKK metnini onaylayın.";
      },
    };

    function fieldByName(name) {
      return form.elements[name] || null;
    }

    function setError(name, message) {
      var field = fieldByName(name);
      var error = document.getElementById("ap-err-" + name);
      if (error) { error.textContent = message; }
      if (field) {
        if (message) { field.setAttribute("aria-invalid", "true"); }
        else { field.removeAttribute("aria-invalid"); }
      }
    }

    function validateField(name) {
      var field = fieldByName(name);
      if (!field || !validators[name]) { return true; }
      var message = validators[name](field.value || "", field);
      setError(name, message);
      return message === "";
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

    Object.keys(validators).forEach(function (name) {
      var field = fieldByName(name);
      if (!field) { return; }
      var eventName = field.type === "checkbox" || field.tagName === "SELECT" ? "change" : "blur";
      field.addEventListener(eventName, function () {
        if (field.getAttribute("aria-invalid") === "true") { validateField(name); }
      });
      field.addEventListener("input", function () {
        if (field.getAttribute("aria-invalid") === "true") { validateField(name); }
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
        if (!validateField(name) && !firstInvalid) { firstInvalid = fieldByName(name); }
      });
      if (firstInvalid) {
        if (status) {
          status.textContent = "Lütfen işaretli alanları kontrol edin.";
          status.className = "form-status is-error";
        }
        firstInvalid.focus();
        return;
      }

      var preferredDate = fieldByName("preferred_date") ? fieldByName("preferred_date").value : "";
      var payload = {
        name: fieldByName("name").value.trim(),
        phone: fieldByName("phone").value.trim(),
        email: fieldByName("email").value.trim(),
        practice_area: areaSelect ? areaSelect.value : "",
        preferred_time: fieldByName("preferred_time") ? fieldByName("preferred_time").value : "Fark etmez",
        message: fieldByName("message") ? fieldByName("message").value.trim() : "",
        kvkk_consent: true,
        source: "website",
        page: global.location.pathname,
      };
      if (preferredDate) {
        payload.preferred_date = preferredDate + " 00:00:00.000Z";
      }

      setLoading(true);
      global.fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (response) {
          if (!response.ok) {
            var error = new Error("HTTP " + response.status);
            error.status = response.status;
            throw error;
          }
          form.reset();
          Object.keys(validators).forEach(function (name) { setError(name, ""); });
          if (dateInput) { dateInput.min = todayLocal(); }
          if (areaSelect) { areaSelect.value = ""; }
          showStatus("Talebiniz alındı. Büro en kısa sürede size dönüş yapacaktır.", "success");
        })
        .catch(function (error) {
          var message = "Talep şu anda gönderilemedi. Lütfen telefon veya e-posta ile ulaşın.";
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})(window);
