// Optional transactional email for the public forms (Resend API).
//
// Enabled only when RESEND_API_KEY, MAIL_FROM and MAIL_TO are set; otherwise
// every entry point logs "email skipped (not configured)" and returns.
// No secrets, message bodies or contact details are written to the logs.
//
// Optional: RESEND_API_URL (defaults to https://api.resend.com/emails).

var EMAIL_DEFAULT_ENDPOINT = "https://api.resend.com/emails";

function emailConfig() {
  return {
    apiKey: String($os.getenv("RESEND_API_KEY") || "").trim(),
    from: String($os.getenv("MAIL_FROM") || "").trim(),
    to: String($os.getenv("MAIL_TO") || "").trim(),
    endpoint: String($os.getenv("RESEND_API_URL") || "").trim() || EMAIL_DEFAULT_ENDPOINT,
  };
}

function emailLog(message) {
  try {
    console.log("[email] " + message);
  } catch (err) {
    // ignore
  }
}

function emailEscape(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function emailNl2br(value) {
  return emailEscape(value).replace(/\r?\n/g, "<br>");
}

function emailIsValid(value) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(value || "").trim());
}

function emailSubject(value) {
  return String(value || "").replace(/[\r\n]+/g, " ").slice(0, 160);
}

function emailFormatDate(value) {
  var raw = String(value || "");
  var match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return raw;
  }
  return match[3] + "." + match[2] + "." + match[1];
}

function emailLayout(title, rows, note) {
  var cells = "";
  for (var i = 0; i < rows.length; i++) {
    cells +=
      '<tr><td style="padding:6px 12px 6px 0;color:#5c6672;vertical-align:top;white-space:nowrap">' +
      emailEscape(rows[i][0]) +
      '</td><td style="padding:6px 0;color:#1b2430">' +
      rows[i][1] +
      "</td></tr>";
  }
  return (
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1b2430">' +
    '<h1 style="font-size:18px;margin:0 0 16px;color:#081422">' + emailEscape(title) + "</h1>" +
    '<table cellpadding="0" cellspacing="0" style="border-collapse:collapse">' + cells + "</table>" +
    (note ? '<p style="margin:18px 0 0;color:#5c6672;font-size:13px">' + note + "</p>" : "") +
    "</div>"
  );
}

function emailSend(cfg, payload, label) {
  var response;
  try {
    response = $http.send({
      url: cfg.endpoint,
      method: "POST",
      headers: {
        Authorization: "Bearer " + cfg.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      timeout: 10,
    });
  } catch (err) {
    emailLog(label + " request failed: " + String(err));
    return false;
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    var bodyText = "";
    try {
      bodyText = toString(response.body);
    } catch (err) {
      bodyText = "";
    }
    emailLog(label + " rejected: HTTP " + response.statusCode + " " + bodyText.slice(0, 200));
    return false;
  }

  emailLog(label + " sent");
  return true;
}

function emailBasics(cfg, subject, html, replyTo) {
  var payload = {
    from: cfg.from,
    to: [cfg.to],
    subject: emailSubject(subject),
    html: html,
  };
  if (replyTo && emailIsValid(replyTo)) {
    payload.reply_to = replyTo;
  }
  return payload;
}

function emailAutoReply(cfg, name, email, intro) {
  var safeName = emailEscape(name || "");
  var greeting = safeName ? "Sayın " + safeName + ",<br><br>" : "";
  var html =
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#1b2430">' +
    "<p>" + greeting + intro + "</p>" +
    '<p style="margin:16px 0">Talebiniz büro tarafından değerlendirilecek ve en kısa sürede size dönüş yapılacaktır.</p>' +
    '<p style="margin:0;color:#5c6672;font-size:13px">Bu e-posta otomatik olarak gönderilmiştir; yanıtlamanız gerekmez.</p>' +
    '<p style="margin:18px 0 0;color:#081422;font-size:13px">ULUÇINAR Hukuk &amp; Danışmanlık<br>' +
    "Karabaş Mh. Cumhuriyet Blv. No:177/2, İzmit / KOCAELİ<br>" +
    "+90 (501) 943 63 41 · info@ulucinar.av.tr</p>" +
    "</div>";
  return {
    from: cfg.from,
    to: [email],
    subject: "Talebiniz alındı — ULUÇINAR Hukuk & Danışmanlık",
    html: html,
    reply_to: cfg.to,
  };
}

function emailReady(cfg) {
  if (!cfg.apiKey || !cfg.from || !cfg.to) {
    emailLog("email skipped (not configured)");
    return false;
  }
  return true;
}

function sendContactEmails(record) {
  var cfg = emailConfig();
  if (!emailReady(cfg)) {
    return;
  }

  var name = String(record.getString("name") || "");
  var phone = String(record.getString("phone") || "");
  var email = String(record.getString("email") || "");
  var subject = String(record.getString("subject") || "");
  var message = String(record.getString("message") || "");
  var consentAt = String(record.getString("consent_at") || "");

  var html = emailLayout(
    "Yeni iletişim mesajı",
    [
      ["Ad Soyad", emailEscape(name)],
      ["Telefon", emailEscape(phone)],
      ["E-posta", email ? emailEscape(email) : "—"],
      ["Konu", emailEscape(subject)],
      ["Mesaj", emailNl2br(message)],
      ["KVKK onayı", consentAt ? emailEscape(consentAt) : "—"],
    ],
    "Site iletişim formundan gönderildi."
  );

  emailSend(cfg, emailBasics(cfg, "Yeni iletişim mesajı — " + name, html, email), "contact notification");

  if (emailIsValid(email)) {
    var reply = emailAutoReply(
      cfg,
      name,
      email,
      "Web sitesi iletişim formu üzerinden ilettiğiniz mesaj büroya ulaştı."
    );
    emailSend(cfg, reply, "contact auto-reply");
  }
}

function sendAppointmentEmails(record) {
  var cfg = emailConfig();
  if (!emailReady(cfg)) {
    return;
  }

  var name = String(record.getString("name") || "");
  var phone = String(record.getString("phone") || "");
  var email = String(record.getString("email") || "");
  var area = String(record.getString("practice_area") || "");
  var date = String(record.getString("preferred_date") || "");
  var time = String(record.getString("preferred_time") || "");
  var message = String(record.getString("message") || "");
  var consentAt = String(record.getString("consent_at") || "");

  var html = emailLayout(
    "Yeni randevu talebi",
    [
      ["Ad Soyad", emailEscape(name)],
      ["Telefon", emailEscape(phone)],
      ["E-posta", email ? emailEscape(email) : "—"],
      ["Çalışma alanı", area ? emailEscape(area) : "—"],
      ["Tercih edilen tarih", date ? emailEscape(emailFormatDate(date)) : "—"],
      ["Zaman dilimi", time ? emailEscape(time) : "—"],
      ["Mesaj", emailNl2br(message)],
      ["KVKK onayı", consentAt ? emailEscape(consentAt) : "—"],
    ],
    "Site randevu formundan gönderildi. Otomatik takvim rezervasyonu değildir."
  );

  emailSend(cfg, emailBasics(cfg, "Yeni randevu talebi — " + name, html, email), "appointment notification");

  if (emailIsValid(email)) {
    var reply = emailAutoReply(
      cfg,
      name,
      email,
      "Randevu talebiniz büroya ulaştı."
    );
    emailSend(cfg, reply, "appointment auto-reply");
  }
}

module.exports = {
  sendContactEmails: sendContactEmails,
  sendAppointmentEmails: sendAppointmentEmails,
};
