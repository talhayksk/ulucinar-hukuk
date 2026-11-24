/// <reference path="../pb_data/types.d.ts" />

// Write-side guards for editor content and the public contact form.
//
// Handlers run in isolated runtimes, so the helpers are loaded with require().
// - articles / team_members: strict slug validation (+ sanitized body).
// - contact_messages / appointments: KVKK consent required, inbox fields forced
//   server-side (status, consent_at), past appointment dates rejected.

function guardArticleWrite(e) {
  const sanitize = require(__hooks + "/lib/sanitize.js")
  const record = e.record
  if (!record) {
    return e.next()
  }

  const slug = String(record.getString("slug") || "").trim()
  if (!sanitize.validateSlug(slug)) {
    throw new BadRequestError("Geçersiz slug.", {
      slug: new ValidationError(
        "invalid",
        "Yalnız küçük harf, rakam ve tek tire kullanın (örn. aile-hukuku)."
      ),
    })
  }

  const body = record.getString("body") || ""
  const clean = sanitize.sanitizeBody(body)
  if (clean !== body) {
    record.set("body", clean)
  }

  return e.next()
}

onRecordCreateRequest(guardArticleWrite, "articles")
onRecordUpdateRequest(guardArticleWrite, "articles")

function guardTeamMemberWrite(e) {
  const sanitize = require(__hooks + "/lib/sanitize.js")
  const record = e.record
  if (!record) {
    return e.next()
  }

  const slug = String(record.getString("slug") || "").trim()
  if (!sanitize.validateSlug(slug)) {
    throw new BadRequestError("Geçersiz slug.", {
      slug: new ValidationError(
        "invalid",
        "Yalnız küçük harf, rakam ve tek tire kullanın (örn. kurucu-ortak)."
      ),
    })
  }

  return e.next()
}

onRecordCreateRequest(guardTeamMemberWrite, "team_members")
onRecordUpdateRequest(guardTeamMemberWrite, "team_members")

// Public contact form: the consent flag is mandatory and the inbox metadata is
// always server-side. Client values for status/consent_at are overwritten.
function guardContactCreate(e) {
  const record = e.record
  if (!record) {
    return e.next()
  }

  if (record.get("kvkk_consent") !== true) {
    throw new BadRequestError("KVKK aydınlatma metni onayı gerekli.", {
      kvkk_consent: new ValidationError(
        "required",
        "Formu göndermek için KVKK aydınlatma metnini onaylamanız gerekir."
      ),
    })
  }

  record.set("kvkk_consent", true)
  record.set("status", "new")
  record.set("consent_at", new Date().toISOString().replace("T", " "))

  return e.next()
}

onRecordCreateRequest(guardContactCreate, "contact_messages")

// Appointment requests: consent is mandatory, the inbox status is always "new",
// the consent timestamp is server-side, and past dates are rejected.
function guardAppointmentCreate(e) {
  const record = e.record
  if (!record) {
    return e.next()
  }

  if (record.get("kvkk_consent") !== true) {
    throw new BadRequestError("KVKK aydınlatma metni onayı gerekli.", {
      kvkk_consent: new ValidationError(
        "required",
        "Randevu talebi göndermek için KVKK aydınlatma metnini onaylamanız gerekir."
      ),
    })
  }

  const preferred = String(record.getString("preferred_date") || "").trim()
  if (preferred) {
    const now = new Date()
    const pad = (value) => (value < 10 ? "0" + value : String(value))
    const today = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate())
    if (preferred.slice(0, 10) < today) {
      throw new BadRequestError("Geçmiş bir tarih için randevu talep edilemez.", {
        preferred_date: new ValidationError(
          "invalid",
          "Lütfen bugün veya ilerisi için bir tarih seçin."
        ),
      })
    }
  }

  record.set("kvkk_consent", true)
  record.set("status", "new")
  record.set("consent_at", new Date().toISOString().replace("T", " "))

  return e.next()
}

onRecordCreateRequest(guardAppointmentCreate, "appointments")
