/// <reference path="../pb_data/types.d.ts" />

// The contact-form rate rule has to use the record-create tag; a URL path
// label does not match PocketBase's record routes. Replaces the ineffective
// rule from 1794944918 without touching the other defaults.
migrate((app) => {
  const settings = app.settings()
  const rules = []
  const existing = settings.rateLimits.rules || []
  let hasTagRule = false

  for (let i = 0; i < existing.length; i++) {
    if (existing[i].label === "POST /api/collections/contact_messages/records") {
      continue
    }
    if (existing[i].label === "contact_messages:create") {
      hasTagRule = true
    }
    rules.push(existing[i])
  }

  if (!hasTagRule) {
    rules.push({
      label: "contact_messages:create",
      audience: "",
      duration: 60,
      maxRequests: 5,
    })
  }

  settings.rateLimits.enabled = true
  settings.rateLimits.rules = rules
  app.save(settings)
}, (app) => {
  const settings = app.settings()
  const rules = []
  const existing = settings.rateLimits.rules || []
  for (let i = 0; i < existing.length; i++) {
    if (existing[i].label !== "contact_messages:create") {
      rules.push(existing[i])
    }
  }
  settings.rateLimits.rules = rules
  app.save(settings)
})
