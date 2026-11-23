/**
 * ULUÇINAR Hukuk & Danışmanlık — site configuration.
 *
 * This file is the single place for deployment values. It is intentionally
 * free of secrets: only public endpoints and placeholder content live here.
 *
 * PocketBase:
 *  - Leave pocketbaseUrl empty: the site and PocketBase are served from the
 *    same origin (pb_public), so no API override exists by design.
 */
window.SITE_CONFIG = {
  /**
   * PocketBase base URL, for example "https://admin.ulucinar.av.tr".
   * Empty means same-origin. There is no query-string override (security).
   */
  pocketbaseUrl: "",

  /** PocketBase collection names used by the public site. */
  collections: {
    articles: "articles",
    settings: "site_settings",
    practiceAreas: "practice_areas",
    teamMembers: "team_members",
    faq: "faq",
    contactMessages: "contact_messages"
  },

  /** Number of published articles shown on the home page. */
  articlesPerPage: 6,

  /**
   * Form POST endpoint (same-origin PocketBase collection).
   * When empty, the contact form falls back to mailto:.
   */
  contactEndpoint: "/api/collections/contact_messages/records",

  site: {
    name: "ULUÇINAR Hukuk & Danışmanlık",
    url: "https://www.ulucinar.av.tr",
    locale: "tr_TR"
  },

  /* Placeholder contact details — replace with the real ones or via site_settings. */
  contact: {
    phone: "+905019436341",
    phoneDisplay: "+90 501 943 63 41",
    email: "info@ulucinar.av.tr",
    address: "Karabaş Mh. Cumhuriyet Blv. No:177/2, İzmit / KOCAELİ",
    hours: "Hafta içi 09.00 – 18.30"
  },

  /* Social profiles. Empty values keep the placeholder "#" links. */
  social: {
    instagram: "",
    linkedin: "",
    whatsapp: "https://wa.me/905019436341"
  },

  /* Content still to be supplied by the client. */
  placeholders: {
    logo: "assets/logo/ulucinar-gold.svg",
    teamNames: true,
    statistics: true,
    address: true,
    articles: true
  }
};
