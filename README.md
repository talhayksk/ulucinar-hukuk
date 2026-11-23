# ULUÇINAR Hukuk & Danışmanlık — website and PocketBase CMS

Marketing site for a Turkish law firm: a static, no-build front end (Turkish UI) served next to a
self-hosted [PocketBase](https://pocketbase.io/) instance that provides the content API and the admin
panel. The visual identity is navy (`#081422`) and gold (`#c9a227`), with a Cinzel/Manrope type
pair and a logo-fill intro animation.

> **Status (18 November 2026).** The static front end, the PocketBase schema/content API, admin-editable
> home-page copy, KVKK consent trail and the server-side security layer are in place. The front-end
> binding for several admin collections, the real content/domain and the production deployment are
> still being finished. Sections marked **in progress** are not production-ready yet. Commands are
> marked as verified or not verified in [Verification](#10-verification).

---

## 1. Overview

- **Public site** — one-page home (`index.html`) plus an article detail page (`makale.html`).
  All copy is Turkish; code, comments and this README are English.
- **Content backend** — PocketBase 0.42.3. Articles, home-page copy, team/practice/FAQ content,
  contact settings and the contact inbox are managed from the built-in admin UI at `/_/`. There is
  no custom admin application.
- **No build step** — plain HTML, CSS and ES5-style JavaScript. No npm, no bundler, no framework.
- **Graceful degradation** — if the API is unreachable, the home page keeps its static demo content
  and the article page shows a not-found state instead of breaking.

The site is intended to be served **from PocketBase itself** (`pb_public/`), so the browser talks to
the API on the same origin. This removes CORS from the production path.

---

## 2. Stack and structure

| Layer | Choice |
|---|---|
| Front end | HTML5, CSS custom properties, vanilla JS (no dependencies) |
| CMS / API | PocketBase 0.42.3 (SQLite, REST, admin UI) |
| Server-side SEO | PocketBase JS hooks (article pages, sitemap, robots) |
| Hosting | Any host that can run the PocketBase binary and terminate TLS |

```text
.
├── index.html                  # one-page home (TR)
├── makale.html                 # article page shell, rendered from PocketBase by content.js
├── assets/
│   ├── css/style.css
│   ├── js/
│   │   ├── config.js           # SITE_CONFIG: API URL, collection names, placeholders
│   │   ├── pb.js               # minimal PocketBase REST client (fetch, no SDK)
│   │   ├── content.js          # binds site_settings and articles into the DOM
│   │   └── main.js             # intro, navigation, sliders, form validation
│   ├── logo/
│   │   ├── logo-siyah-beyaz.pdf    # original supplied logo (source of truth)
│   │   ├── ulucinar-gold.svg/.png  # gold lockup used by the site
│   │   ├── ulucinar-emblem-gold.svg
│   │   ├── favicon.svg, favicon-32.png, favicon-512.png
│   │   └── apple-touch-icon.png
│   ├── img/                    # locally hosted image copies (in progress)
│   └── fonts/                  # self-hosted font files (in progress)
├── pocketbase/
│   ├── pocketbase              # 0.42.3 binary — NOT committed
│   ├── pb_migrations/          # schema, content, SEO and security migrations (19 JS migrations)
│   ├── pb_hooks/               # defaults, seo.pb.js, security.pb.js + lib/ (SEO/sanitizer)
│   ├── pb_public/              # generated site copy — NOT committed
│   ├── pb_data/                # runtime database and uploads — NOT committed
│   └── backups/                # local snapshots — NOT committed
├── scripts/
│   ├── pocketbase-serve.sh
│   ├── pocketbase-sync-public.sh
│   ├── pocketbase-superuser.sh
│   ├── pocketbase-backup.sh
│   └── pocketbase-rebuild-seo.sh   # in progress
└── docs/pocketbase-admin.md    # Turkish admin guide for the client
```

Not committed (see `.gitignore`): `pocketbase/pb_data/`, `pocketbase/pb_public/`,
`pocketbase/backups/`, the PocketBase binary, `.team/`, the reference template
`lawyer_sablon.html`, and local test probes. The schema and demo content are reproducible from
`pb_migrations/` alone.

---

## 3. Local preview

### 3.1 Static only

Useful while editing markup and CSS. The API base is same-origin, so a plain static server cannot
reach PocketBase: data calls fall back to the static markup and the contact form falls back to
`mailto:`. Use the full stack below when testing CMS content.

```bash
python3 -m http.server 8000
# open http://127.0.0.1:8000/
```

### 3.2 Full stack (site + API + admin)

**1. Get the PocketBase binary.** Download the 0.42.3 release for your platform from
<https://github.com/pocketbase/pocketbase/releases/tag/v0.42.3> and place the executable at
`pocketbase/pocketbase`. It is intentionally not committed.

```bash
chmod +x pocketbase/pocketbase
./pocketbase/pocketbase --version    # expect: pocketbase version 0.42.3
```

**2. Publish the static files to `pb_public/`.** Run this after every front-end change.

```bash
./scripts/pocketbase-sync-public.sh
```

The script copies root-level `*.html` (except `lawyer_sablon.html`) and `assets/` into
`pocketbase/pb_public/`. It never deletes generated article pages under `pb_public/makale/`.

**3. Start the server.**

```bash
./scripts/pocketbase-serve.sh
# site:  http://127.0.0.1:8090/
# admin: http://127.0.0.1:8090/_/
```

Migrations in `pb_migrations/` are applied automatically on start. The site and the API share the
same origin, so no API URL needs to be configured. Environment overrides:
`PB_HTTP` (default `127.0.0.1:8090`), `PB_ORIGINS` (CORS allow-list), `PB_BIN`.

If the port is busy:

```bash
PB_HTTP=127.0.0.1:8091 ./scripts/pocketbase-serve.sh
```

**4. Create the first superuser** (once). The password is read with echo disabled and is never
written to disk.

```bash
./scripts/pocketbase-superuser.sh
```

**5. Manual migrations** (normally unnecessary):

```bash
./pocketbase/pocketbase migrate up \
  --dir="$PWD/pocketbase/pb_data" \
  --migrationsDir="$PWD/pocketbase/pb_migrations"
```

> **In progress:** the server-rendered SEO layer (`pb_hooks/seo.pb.js` + `pb_hooks/lib/seo.js`) now
> serves clean article URLs and a `404`; remaining work is the real domain, the front-end switch
> from `makale.html?slug=` links to `/makale/<slug>/`, structured-data review and image hosting.

---

## 4. Content management

Everything public is edited in the PocketBase admin UI (`/_/`); there is no separate CMS. A Turkish
step-by-step guide for the client is in [`docs/pocketbase-admin.md`](docs/pocketbase-admin.md).

The API side is complete, but the front-end binding is still being finished. The **Status** column
below distinguishes what is already consumed by the markup from what is ready in the database and
waiting for the front-end update.

### Collections

| Collection | Purpose | Public access | Status |
|---|---|---|---|
| `site_settings` | Firm identity, contact details, home-page copy, stats, values, SEO defaults | list/view public | Contact fields live; new copy fields in progress |
| `articles` | Blog articles and their cover/SEO data | list/view only when `status = published` | Live (home list + detail) |
| `practice_areas` | Nine practice areas, card summary and modal body | only `published = true` | API ready; cards/modals still static |
| `team_members` | Team cards: name, role, bio, photo, expertise, slug | only `published = true` | API ready; cards still static |
| `faq` | Accordion questions | only `published = true` | API ready; accordion still static |
| `pages` | Free HTML pages (e.g. the full KVKK notice) | only `published = true` | API ready; no route yet |
| `contact_messages` | Contact-form inbox with consent trail | create public; read/update/delete superuser only | API live; form wiring in progress |

### What the admin controls

| Page area | Source | Notes |
|---|---|---|
| Top bar, contact block, footer phone/e-mail/address/hours | `site_settings.phone`, `email`, `address`, `working_hours` | Live; `phone` is also used for `tel:` links |
| WhatsApp buttons | `site_settings.whatsapp` | Live; store the full `https://wa.me/...` URL |
| Footer tagline | `site_settings.tagline` | Live |
| Hero small note and lead paragraph | `hero_note`, `hero_lead` | `hero_note` is currently bound to the lead paragraph; moving it to the eyebrow and binding `hero_lead` is in progress |
| Hero heading and lead paragraph | `hero_title`, `hero_lead` | Front-end binding in progress; `hero_title` is plain text |
| About heading, lead and body | `about_title`, `about_lead`, `about_body` | Front-end binding in progress; keep `about_body` to simple HTML |
| Trust strip (four figures) | `stats` JSON array of `{value,label}` | Front-end binding in progress; seeded values are placeholders |
| Three principle cards | `values` JSON array of `{title,text}` | Front-end binding in progress |
| Practice-area cards and detail modal | `practice_areas.title`, `summary`, `body`, `icon`, `sort_order` | API ready; card/modal rendering in progress |
| Team cards | `team_members.name`, `role`, `bio`, `photo`, `expertise`, `slug` | API ready; card rendering in progress |
| Article cards and article pages | `articles` | Live; see below |
| FAQ accordion | `faq.question`, `answer`, `sort_order` | API ready; rendering in progress |
| Footer legal note | `site_settings.footer_note` | Front-end binding in progress |
| Home page `<title>` / meta description | `site_settings.seo_title`, `seo_description` | Data ready; static HTML still hard-codes the current values |
| Structured data / social profiles | `site_settings.same_as` | Used by the server-rendered SEO output |

`site_settings` must contain **exactly one record**; the site reads the first one. Do not create a
second record. Writes are superuser-only.

### `site_settings` fields

| Group | Fields |
|---|---|
| Identity | `firm_name`, `tagline`, `footer_note` |
| Contact | `phone`, `whatsapp`, `email`, `address`, `working_hours` |
| Social | `socials` (`{"instagram":"...","linkedin":"..."}`), `same_as` (JSON array for schema.org) |
| Home copy | `hero_note`, `hero_title`, `hero_lead`, `about_title`, `about_lead`, `about_body`, `stats`, `values` |
| SEO | `site_url`, `seo_title`, `seo_description`, `default_seo_title`, `default_seo_description`, `og_image_url`, `google_site_verification` |

`stats` is a JSON array, for example `[{"value":"25+","label":"Yıllık deneyim"}]`. `values` is a JSON
array of `{"title":"...","text":"..."}`. Invalid JSON is rejected by the admin UI; keep the existing
key names. All seeded statistics are placeholders (see §9) and must be replaced or removed before
launch.

### Article fields

| Field | Type | Notes |
|---|---|---|
| `title` | text (180) | required |
| `slug` | text (140) | required, unique, lowercase letters/digits/hyphens; used in the URL |
| `excerpt` | text (600) | card summary |
| `body` | editor (HTML, 60 KB) | article body, sanitised on write and on render |
| `cover` | file (jpeg/png/webp, 5 MB) | optional upload; preferred over external URLs |
| `cover_url` | URL | optional external cover used when no file is uploaded |
| `published_at` | date | home-page order: `sort=-published_at` |
| `status` | select `draft` / `published` | required; new records default to `draft` via hook |
| `author` | text (120) | optional display name |
| `seo_title` | text (120) | optional `<title>` override (aim for 50–60 chars) |
| `seo_description` | text (400) | optional meta description (aim for 140–160 chars) |
| `og_image_url` | URL | optional social image; falls back to cover, then site default |

Slugs are validated with `^[a-z0-9]+(?:-[a-z0-9]+)*$`; invalid values return `400`. Changing a slug
changes the public URL and removes the old generated page.

### Publish flow

1. Create the record; if `status` is left empty the hook stores it as `draft`.
2. Fill `title`, `slug`, `excerpt`, `body`, and a cover (`cover` file or `cover_url`).
3. Set `status = published` and save.
4. The home page shows the **three latest published** articles (`sort=-published_at`).
5. The server generates `pb_public/makale/<slug>/index.html` with title, canonical, body and
   `Article` JSON-LD; `/makale/<slug>/` is the public URL. `/sitemap.xml` and `/robots.txt` are
   updated from the database.
6. To retract, set `status = draft`; the record disappears from public list/view and the generated
   page is removed at the next sync. A previously cached page can live for up to five minutes.

`/makale.html?slug=...` is a legacy entry point: it redirects to the clean URL built from
`site_settings.site_url`. The static home-page markup still links to that legacy form; switching the
links to relative `/makale/<slug>/` URLs is front-end work in progress. Use the clean URL directly
when testing locally.

### Contact form and KVKK

Public submissions are accepted at `POST /api/collections/contact_messages/records`. The record
stores `name`, `phone`, `email`, `subject`, `message`, `kvkk_consent`, `consent_at`, `source`,
`page`, and an inbox `status`.

- `kvkk_consent` must be `true`; a missing or false value returns `400` with a field error. The legacy
  `kvkk` field is **not** accepted as consent.
- `consent_at` is written by the server; client values are ignored.
- `status` is always forced to `new`; clients cannot archive their own message.
- Contact submissions are rate-limited (5 per 60 s) and the record is invisible to the public API.

The browser form and the API contract are being aligned: `contactEndpoint` must point at the same
origin endpoint and the checkbox must send `kvkk_consent: true`. Until that front-end change lands,
the form may fall back to `mailto:` and messages may not reach the inbox. The full KVKK notice is not
published yet; `pages` is empty and the form still links to the short in-page note.

---

## 5. SEO

**Implemented today**

- `lang="tr"`, title/description, canonical, Open Graph/Twitter tags on both HTML pages.
- `LegalService` + `PostalAddress` JSON-LD on the home page; server-rendered `Article` JSON-LD on
  article pages.
- Semantic sections, single `h1`, descriptive `alt` text, lazy images, `prefers-reduced-motion`.
- Per-article `seo_title`, `seo_description`, `og_image_url`, and site-wide `seo_title`,
  `seo_description`, `default_seo_title`, `default_seo_description`, `og_image_url`, `site_url`.
- Clean article URLs at `/makale/<slug>/`, generated from PocketBase data; unknown or draft slugs
  return `404`.
- `/sitemap.xml` (home + published articles) and `/robots.txt` (disallow `/_/` and `/api/`).
- Legacy `?slug=` URLs redirect to the clean URL, and `/_/` / `/api/` send `X-Robots-Tag: noindex`.

**In progress**

- The home page still ships static title/description/canonical; the `site_settings.seo_title` and
  `seo_description` values are not applied to the static HTML yet.
- Front-end article links still use `makale.html?slug=...` instead of relative `/makale/<slug>/`.
- `Article`, `FAQPage` and `BreadcrumbList` review with the Rich Results Test.
- Self-hosted, responsive images (`assets/img/` exists but is not wired into the markup yet), which
  also removes the current third-party dependency.
- The real domain (placeholder below) and Search Console verification.

**Domain.** The placeholder origin is `https://www.ulucinar.av.tr` — **to be confirmed by the
client**. It appears in:

| Location | What to change |
|---|---|
| `site_settings.site_url` | canonical/OG/sitemap base and legacy redirect target |
| `assets/js/config.js` → `site.url` | client-side canonical and link building |
| `index.html` | static canonical, `og:url`, `LegalService.url` |
| `makale.html` | static canonical and `og:url` fallback |
| `site_settings.og_image_url` | absolute default share image |

To change the domain: update `site_settings.site_url` in the admin panel, then the static tags above,
then run `./scripts/pocketbase-sync-public.sh` and restart/redeploy. The SEO hook rebuilds the
article pages and sitemap from `site_url`. Absolute URLs in the database (e.g. seeded `cover_url`)
should also be reviewed.

**Search Console.** A `google_site_verification` field exists on `site_settings` for the HTML-tag
token. Verification, sitemap submission and property access are **not done**; they require the real
domain and client access. After launch: verify the domain, submit `/sitemap.xml`, and monitor
coverage. Do not add fake reviews/ratings to structured data.

---

## 6. Brand assets

- `assets/logo/logo-siyah-beyaz.pdf` is the original supplied logo and the source of truth.
- Gold derivatives (`ulucinar-gold.svg/png`, `ulucinar-emblem-gold.svg`) and the favicon set were
  produced from it; the intro animation uses inline SVG/PNG layers, so it never flashes a fallback
  font.
- Regeneration approach: rasterise/vectorise the PDF (e.g. `pdftocairo`) and re-apply the gold
  gradient in a vector editor, then export SVG + PNG at the sizes used by the header, splash and
  `og:image`. There is **no regeneration script in the repo**, so these steps are manual and are
  **not verified** here.
- `ulucinar-gold.png` is the current Open Graph image (1200×1257). A 1200×630 social crop is
  recommended before launch.

Do not commit `pb_data/`, uploaded covers, the PocketBase binary or `.team/`.

---

## 7. Scripts

All scripts resolve paths from their own location, so they can be called from any directory.
They use `set -euo pipefail`.

| Script | What it does | Verified |
|---|---|---|
| `pocketbase-serve.sh` | Starts PocketBase with `--dir`, `--migrationsDir`, `--publicDir`, `--hooksDir`, `--origins`. Reads `PB_HTTP`, `PB_ORIGINS`, `PB_BIN`. | Yes (verified with all hooks) |
| `pocketbase-sync-public.sh` | Copies root `*.html` (except `lawyer_sablon.html`) and `assets/` into `pb_public/`; preserves generated `makale/` pages. | Yes |
| `pocketbase-superuser.sh` | Prompts for e-mail and password (hidden, confirmed, min 8 chars) and runs `superuser upsert`. | Not run end-to-end (would create/reset credentials) |
| `pocketbase-backup.sh` | Cold-copies `pb_data/` into `backups/YYYYmmdd-HHMMSS/`; enforces `0700`/`0600` on the copy and the live data directory. Still not a consistent online backup. | Yes (permissions verified) |
| `pocketbase-rebuild-seo.sh` | Rebuilds generated article HTML, either through a running server (superuser login over stdin) or a temporary instance. | Not run in this pass |

`pocketbase-backup.sh` writes owner-only backups. They contain superuser password hashes and client
messages: encrypt before copying them off the host (for example `age -p` or `gpg -c`) and define a
retention period.

---

## 8. Deployment

1. Build/host: copy the static files into `pb_public/` with `pocketbase-sync-public.sh` (run it on
   the server checkout, not locally and then uploaded, so paths stay consistent).
2. Run the PocketBase binary behind a reverse proxy (Caddy, Nginx) with TLS and HTTP/2. Bind to
   `127.0.0.1` (the serve script does) and let the proxy expose 443. Protect `/_/` and
   `/api/collections/_superusers/*` in the proxy with an IP allow-list or VPN; do not rely on the
   password alone. Use a strong, unique superuser password and enable MFA if available.
3. Set `PB_ORIGINS` to the real origin only. Never use `*`. Typical server values:
   `PB_HTTP=127.0.0.1:8090`, `PB_ORIGINS=https://www.example.com`,
   `PB_BIN=/opt/pocketbase/pocketbase`.
4. Persist `pb_data/` (database + uploaded files) on a volume and back it up daily. Prefer
   **Settings → Backups** in the admin panel for live backups; `pocketbase-backup.sh` is a cold
   copy for local/dev use. The script keeps backups and `pb_data` at `0700`/`0600`; encrypt archives
   before moving them off the host and define retention.
5. Update the domain (see §5), sync public files, restart, then verify:
   `curl -I https://<domain>/`, `/robots.txt`, `/sitemap.xml`, an article URL, and `/_/`.
6. The binary is not committed: install it on the server (pinned to 0.42.3) and keep it out of the
   repo. `pb_data/` and uploaded files are not committed and must be backed up separately.

### Security hardening

- **Headers.** A PocketBase middleware adds `Content-Security-Policy`, `Referrer-Policy`,
  `Permissions-Policy`, `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff` to public
  responses. HSTS is sent only over TLS; terminate TLS and add HSTS at the proxy if TLS ends there.
  The current CSP still allows Google Fonts, `https:` images and two localhost API origins for
  preview; tighten it after fonts/images are self-hosted and the real origin is configured.
- **Rate limits.** PocketBase rate limits are enabled (authentication and create buckets, plus
  5 form submissions per 60 s). Add proxy-level limits/fail2ban for distributed abuse.
- **Content safety.** Article HTML passes through an allow-list sanitizer on write and again on
  server render. `script`, `style`, `iframe`, `object`, `embed`, `svg`, event attributes and
  `javascript:`/`data:` URLs are removed. This reduces risk but is not a substitute for trusted
  editors: only staff who are allowed to publish should have write access, and pasted HTML should
  still be reviewed. Other rich-text fields (for example `about_body`) are not rendered yet and
  must be treated as untrusted until their binding applies the same policy.
- **API base.** The site is designed to talk to its own origin only; do not configure a
  cross-origin PocketBase URL for production.
- **Admin surface.** `/_/` and `/api/` are `noindex`; keep the panel off the public internet or
  behind the proxy allow-list. Never commit `.env`, credentials, backups or `pb_data/`.

Environment variables used by the scripts (no secrets are stored in the repo):
`PB_HTTP`, `PB_ORIGINS`, `PB_BIN`, and for the rebuild script `PB_SUPERUSER_EMAIL` /
`PB_SUPERUSER_PASSWORD` (optional; otherwise prompted), `PB_REBUILD_PORT`.

---

## 9. Placeholders to replace

| Placeholder | Where |
|---|---|
| Phone `+90 (212) 000 00 00`, `+902120000000` | `index.html` top bar/contact/footer, `makale.html` top bar, `assets/js/config.js` → `contact.phone`, `site_settings.phone` |
| WhatsApp `https://wa.me/905000000000` | `assets/js/config.js` → `social.whatsapp`, `site_settings.whatsapp` |
| E-mail `info@ulucinar.av.tr` | same files, `site_settings.email` |
| Address `Teşvikiye Cad. No: 00, Nişantaşı / İstanbul` | same files, `site_settings.address`, `LegalService` JSON-LD in `index.html` |
| Working hours | top bar/contact/footer, `site_settings.working_hours` |
| Team names and roles | `index.html` team cards; `team_members` records (`name`, `role`, `slug`) |
| Statistics “25+ yıllık deneyim”, “1.200+ dosya”, “9 uzmanlık”, “%100 gizlilik” | `site_settings.stats` JSON (seeded) and the static trust strip (`#guven`) — unverified claims, replace or remove before launch (legal-advertising rules) |
| Domain `www.ulucinar.av.tr` | see the table in §5 |
| Social links (currently `#` or empty) | `index.html` footer, `assets/js/config.js` → `social`, `site_settings.socials` / `same_as` |
| KVKK notice link | `index.html` footer/form links point to the in-page `#kvkk-notu` summary; the full notice belongs in `pages`, and `pages` is currently empty |
| Demo articles, FAQ, practice-area texts | seed migrations only for bootstrap; edit in the admin panel (`articles`, `faq`, `practice_areas`) |
| Team photos, practice-area modal bodies | optional `team_members.photo` and `practice_areas.body` are ready in the schema but not exposed by the current static markup |
| Logo | `assets/logo/*` (see §6) |

Demo seed content is **not** client copy: phone, address, team names, statistics, articles and FAQ
answers are placeholders written for the build.

---

## 10. Verification

Checked on 18 November 2026 (Linux) against a temporary copy of the project data on port 8095, so
test messages did not touch the working database. The front end is still being updated; rows marked
otherwise are backend/API checks.

| Command | Result |
|---|---|
| `python3 -m http.server 8010` + `curl` for `/`, `/makale.html`, CSS, JS | all `200` |
| `node --check assets/js/*.js` | passes (`main.js`, `content.js`, `pb.js`, `config.js`) |
| `node --check` for `hooks/*.pb.js`, `lib/seo.js`, `lib/sanitize.js` | passes |
| `./pocketbase/pocketbase --version` | `pocketbase version 0.42.3` |
| `./scripts/pocketbase-sync-public.sh` | prints `Published to .../pocketbase/pb_public` and the copied files |
| `./scripts/pocketbase-serve.sh` with all hooks | starts; `/api/health` → `200` |
| Public record counts | `practice_areas 9`, `faq 5`, `team_members 3`, `site_settings 1` |
| `GET /api/collections/site_settings/records` | `200`, one record; new fields present (`hero_title`, `hero_lead`, `about_*`, `footer_note`, `seo_*`, `site_url`, …) |
| `stats` / `values` | 4 objects (`value`+`label`) / 3 objects (`title`+`text`) |
| `team_members` | records include `slug`, `expertise`, optional `photo` |
| `GET /` | `200` |
| `GET /sitemap.xml` | `200`, 4 URLs (home + 3 published articles) |
| `GET /robots.txt` | `200`, disallows `/_/` and `/api/`, sitemap URL present |
| `GET /makale/aile-hukukunda-uzlasma/` | `200`, title, body and `Article` JSON-LD in the server HTML |
| `GET /makale/yok-boyle-bir-sey/` | `404` “Sayfa bulunamadı” |
| `GET /makale.html?slug=aile-hukukunda-uzlasma` | `301` → `https://www.ulucinar.av.tr/makale/aile-hukukunda-uzlasma/` |
| `POST contact_messages` without `kvkk_consent` | `400`, field error on `kvkk_consent` |
| `POST contact_messages` with `kvkk_consent: true` | `200`; `status: new`, server `consent_at`, `source`/`page` stored; a client-sent `status: archived` is ignored |
| `GET /_/` | `200` (admin UI) |
| Security headers on `/` | CSP, Referrer-Policy, Permissions-Policy, X-Frame-Options, X-Content-Type-Options present; no HSTS over plain HTTP |
| `./scripts/pocketbase-backup.sh` | backup written; directory `700`, files `600`; `pb_data` tightened to `700` |
| Migration ledger (`sqlite3 pb_data/data.db`) | all 19 current migration files applied (ledger also lists superseded entries) |

**Not tested / not verified**

- The same-origin API policy in the browser: front-end hardening is still pending (tracked with the
  security review); the docs describe same-origin as the only supported mode.
- The contact form end-to-end in a browser: the API contract is verified, but the current static form
  still uses the old payload and `mailto:` fallback until the front-end update lands.
- Rate limits (configured and reported by the security workstream, not re-measured here).
- `pocketbase-superuser.sh` end-to-end (would create or reset a credential).
- `pocketbase-rebuild-seo.sh`.
- Mobile/desktop Lighthouse, Rich Results, cross-browser checks (front end still in progress).
- Production deployment, TLS, backups on a live instance, Search Console.

---

## 11. License and ownership

Private, proprietary project for the client (ULUÇINAR Hukuk & Danışmanlık). No open-source license
is granted. All copy and brand assets belong to the client; third-party images (currently some
Unsplash URLs in demo content) keep their own licenses and should be replaced or self-hosted before
launch.

Replace this section only if the client explicitly chooses a license.

---

## Open items

1. Real domain, NAP (name/address/phone), team names, statistics and social URLs.
2. Finish the front-end binding for `site_settings` copy, `practice_areas`, `team_members`, `faq`
   and clean article links; then remove the “in progress” markers in §4 and §5.
3. Front-end hardening: same-origin API base, contact form sending `kvkk_consent`, and self-hosted
   fonts/images so the CSP can be tightened.
4. Publish the full KVKK notice in `pages` (currently empty) and link it from the form and footer.
5. Replace external `cover_url` images with uploaded `cover` files, and wire `assets/img/` into the
   markup.
6. Decide the binary policy for the repo (download script vs. Git LFS) — it is currently excluded.
7. Add proxy-level IP allow-listing for `/_/`, TLS/HSTS, and monitor rate-limit/logs in production.
