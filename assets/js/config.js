/**
 * ULUÇINAR Hukuk & Danışmanlık — site configuration.
 *
 * This file is the single place for deployment values. It is intentionally
 * free of secrets: only public endpoints and placeholder content live here.
 *
 * PocketBase:
 *  - Leave pocketbaseUrl empty when the site and PocketBase are served from the
 *    same origin (recommended, see README.md).
 *  - Append ?pb=http://127.0.0.1:8090 to any page for local development.
 */
window.SITE_CONFIG = {
  /**
   * PocketBase base URL, for example "https://admin.ulucinar.av.tr".
   * Empty means same-origin. A ?pb=... query parameter overrides this value.
   */
  pocketbaseUrl: "",

  /** PocketBase collection names used by the public site. */
  collections: {
    articles: "articles",
    settings: "site_settings",
    contactMessages: "contact_messages"
  },

  /** Number of published articles shown on the home page. */
  articlesPerPage: 3,

  /**
   * Form POST endpoint. When empty, the contact form falls back to mailto:.
   * When set, it must accept JSON and answer with a 2xx status.
   * Optional PocketBase value:
   * "/api/collections/contact_messages/records"
   */
  contactEndpoint: "",

  site: {
    name: "ULUÇINAR Hukuk & Danışmanlık",
    url: "https://www.ulucinar.av.tr",
    locale: "tr_TR"
  },

  /* Placeholder contact details — replace with the real ones or via site_settings. */
  contact: {
    phone: "+902120000000",
    phoneDisplay: "+90 (212) 000 00 00",
    email: "info@ulucinar.av.tr",
    address: "Teşvikiye Cad. No: 00, Nişantaşı / İstanbul",
    hours: "Hafta içi 09.00 – 18.30"
  },

  /* Social profiles. Empty values keep the placeholder "#" links. */
  social: {
    instagram: "",
    linkedin: "",
    whatsapp: "https://wa.me/905000000000"
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
