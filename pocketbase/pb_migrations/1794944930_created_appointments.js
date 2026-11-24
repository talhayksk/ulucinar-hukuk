/// <reference path="../pb_data/types.d.ts" />

// Appointment requests (form + admin inbox). Public may only create; reading
// and managing requests requires a superuser. No booking/calendar semantics.
migrate((app) => {
  const collection = new Collection({
    name: "appointments",
    type: "base",
    listRule: null,
    viewRule: null,
    createRule: "",
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "name", type: "text", required: true, max: 120 },
      { name: "phone", type: "text", required: true, max: 40 },
      { name: "email", type: "email" },
      { name: "practice_area", type: "text", max: 120 },
      { name: "preferred_date", type: "date" },
      {
        name: "preferred_time",
        type: "select",
        values: ["09:00–12:00", "13:00–18:30", "Fark etmez"],
        maxSelect: 1,
      },
      { name: "message", type: "text", max: 4000 },
      { name: "kvkk_consent", type: "bool", required: true },
      { name: "consent_at", type: "date" },
      { name: "source", type: "text", max: 120 },
      { name: "page", type: "text", max: 300 },
      {
        name: "status",
        type: "select",
        values: ["new", "contacted", "closed"],
        maxSelect: 1,
      },
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
  })
  app.save(collection)

  // Form-specific rate limit: 5 requests / minute per IP.
  try {
    const settings = app.settings()
    const rules = []
    const existing = settings.rateLimits.rules || []
    let hasRule = false
    for (let i = 0; i < existing.length; i++) {
      rules.push(existing[i])
      if (existing[i].label === "appointments:create") {
        hasRule = true
      }
    }
    if (!hasRule) {
      rules.push({
        label: "appointments:create",
        audience: "",
        duration: 60,
        maxRequests: 5,
      })
    }
    settings.rateLimits.enabled = true
    settings.rateLimits.rules = rules
    app.save(settings)
  } catch (err) {
    // settings unavailable: skip the rate limit rule
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("appointments")
  app.delete(collection)

  try {
    const settings = app.settings()
    const rules = []
    const existing = settings.rateLimits.rules || []
    for (let i = 0; i < existing.length; i++) {
      if (existing[i].label !== "appointments:create") {
        rules.push(existing[i])
      }
    }
    settings.rateLimits.rules = rules
    app.save(settings)
  } catch (err) {
    // nothing to revert
  }
})
