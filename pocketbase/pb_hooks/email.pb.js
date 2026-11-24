/// <reference path="../pb_data/types.d.ts" />

// Optional email notifications for the public forms (Resend).
// Handlers run in isolated runtimes, so the shared logic lives in lib/email.js.
// Any failure is logged and never changes the create response.

onRecordAfterCreateSuccess(function (e) {
  try {
    require(__hooks + "/lib/email.js").sendContactEmails(e.record);
  } catch (err) {
    console.log("[email] contact hook failed: " + String(err));
  }
}, "contact_messages");

onRecordAfterCreateSuccess(function (e) {
  try {
    require(__hooks + "/lib/email.js").sendAppointmentEmails(e.record);
  } catch (err) {
    console.log("[email] appointment hook failed: " + String(err));
  }
}, "appointments");
