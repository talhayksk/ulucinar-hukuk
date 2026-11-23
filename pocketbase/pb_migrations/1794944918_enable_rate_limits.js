/// <reference path="../pb_data/types.d.ts" />

// O-02/O-06: PocketBase ships sane rate-limit rules but they are disabled by
// default. Turn them on and add a stricter rule for the public contact form.
// Existing rules (*:auth 2/3s, *:create 20/5s, /api/ 300/10s) are kept as-is.
migrate((app) => {
  const settings = app.settings()
  const rules = []
  const existing = settings.rateLimits.rules || []
  let hasContactRule = false

  for (let i = 0; i < existing.length; i++) {
    rules.push(existing[i])
    if (existing[i].label === "POST /api/collections/contact_messages/records") {
      hasContactRule = true
    }
  }

  if (!hasContactRule) {
    rules.push({
      label: "POST /api/collections/contact_messages/records",
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
    if (existing[i].label !== "POST /api/collections/contact_messages/records") {
      rules.push(existing[i])
    }
  }
  settings.rateLimits.enabled = false
  settings.rateLimits.rules = rules
  app.save(settings)
})
