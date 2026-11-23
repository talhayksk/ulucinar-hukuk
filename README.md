# ULUÇINAR Hukuk & Danışmanlık — website and PocketBase CMS

Marketing site for a Turkish law firm in İzmit/Kocaeli: a static, no-build front end (Turkish UI)
served next to a self-hosted [PocketBase](https://pocketbase.io/) instance that provides the content
API and the admin panel. The visual identity is navy (`#081422`) and gold (`#c9a227`), with a
Cinzel/Manrope type pair and a logo-fill intro animation.

> **Status (23 November 2026) — `v0.1.0`.** The site, CMS, server-rendered articles, SEO, security
> layer, CI and deployment examples are complete. Remaining inputs are client content and the live
> domain: e-mail, working hours, team identities/photos, statistics, the full KVKK notice and the
> production URL. See [Current content and placeholders](#9-current-content-and-placeholders).

---

## 1. Overview

- **Public site** — one-page home (`index.html`) plus server-rendered article pages. All copy is
  Turkish; code, comments and this README are English.
- **Content backend** — PocketBase 0.42.3 at `/_/`. Home copy, contact details, statistics,
  principles, practice areas, team, FAQ, articles and the contact inbox are admin-managed. There is
  no custom admin application.
- **No build step** — plain HTML, CSS and ES5-style JavaScript. No npm, no bundler, no framework.
- **Self-contained assets** — fonts and photographs are served from the repository; the shipped
  pages reference no third-party font or image CDN.
- **Graceful degradation** — if the API is unreachable, the home page keeps its static markup and
  the article page shows a not-found state instead of breaking.

The site is served **from PocketBase itself** (`pb_public/`), so the browser talks to the API on the
same origin. There is no query-string API override; the only supported API base is the site origin.

### Opening sequence

Every full page load shows the full-screen navy splash and fills the gold logo (2600 ms) before a
650 ms exit. The intro is not remembered across loads — reloading the page plays it again. Two
escape hatches exist:

- `?intro=off` (or the `#intro-off` hash) skips the intro.
- `prefers-reduced-motion: reduce` replaces the fill animation with a ~450 ms fade.

The splash critical CSS is inline, body scroll is locked while it runs, and the visible logo is
decoded before the fill starts, so no fallback font flashes.

---

## 2. Stack and structure

| Layer | Choice |
|---|---|
| Front end | HTML5, CSS custom properties, vanilla JS (no dependencies) |
| CMS / API | PocketBase 0.42.3 (SQLite, REST, admin UI) |
| Server-side SEO | PocketBase JS hooks: article pages, sitemap, robots, headers |
| Typography | Cinzel + Manrope variable fonts, self-hosted (SIL OFL) |
| Photography | Pexels, self-hosted WebP/JPEG renditions |
| Hosting | Any host that can run the PocketBase binary and terminate TLS; examples in `deploy/` |

```text
.
├── index.html                  # one-page home (TR), content hydrated from PocketBase
├── makale.html                 # article page shell + server-rendered template
├── assets/
│   ├── css/style.css
│   ├── js/
│   │   ├── config.js           # SITE_CONFIG: same-origin API, collections, contact fallback
│   │   ├── pb.js               # minimal PocketBase REST client (fetch, no SDK)
│   │   ├── content.js          # binds settings, stats, values, practices, team, FAQ, articles
│   │   └── main.js             # intro, navigation, sliders, modal, form validation, a11y
│   ├── logo/                   # original PDF, gold lockups, emblem, favicon set
│   ├── img/                    # 38 local image files; see assets/img/CREDITS.md
│   └── fonts/                  # Cinzel/Manrope variable fonts, fonts.css, OFL licences
├── pocketbase/
│   ├── pocketbase              # 0.42.3 binary — NOT committed
│   ├── pb_migrations/          # reproducible schema, content, SEO and security migrations
│   ├── pb_hooks/               # defaults, seo, security + lib/ (renderer, sanitizer)
│   ├── pb_public/              # generated site copy — NOT committed
│   ├── pb_data/                # runtime database and uploads — NOT committed
│   └── backups/                # local snapshots — NOT committed
├── scripts/                    # serve, sync, superuser, backup, SEO rebuild
├── deploy/                     # nginx, systemd unit and cron examples
├── .github/                    # CI workflow and dependency-free site/E2E checks
├── docs/pocketbase-admin.md    # Turkish admin guide for the client
└── CHANGELOG.md                # release notes (Keep a Changelog)
```

Not committed (see `.gitignore`): `pocketbase/pb_data/`, `pocketbase/pb_public/`,
`pocketbase/backups/`, the PocketBase binary, `.env*`, `.team/`, `lawyer_sablon.html` and local test
probes. The schema and seeded content are reproducible from `pb_migrations/` alone.

---

## 3. Local preview

### 3.1 Static only

Useful for markup and CSS work. The API is same-origin, so a plain static server cannot reach
PocketBase: data calls fall back to the static markup, images and fonts load normally, and the
contact form falls back to `mailto:`.

```bash
python3 -m http.server 8000
# open http://127.0.0.1:8000/
```

### 3.2 Full stack (site + API + admin)

**1. Get the PocketBase binary.** Download the 0.42.3 release for your platform from
<https://github.com/pocketbase/pocketbase/releases> and place the executable at
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

Migrations are applied automatically on start. The site and API share the origin, so no API URL is
configured. Environment overrides: `PB_HTTP` (default `127.0.0.1:8090`), `PB_ORIGINS` (CORS
allow-list) and `PB_BIN`. If the port is busy:

```bash
PB_HTTP=127.0.0.1:8091 ./scripts/pocketbase-serve.sh
```

**4. Create the first superuser** (once). The password is read with echo disabled and never written
to disk.

```bash
./scripts/pocketbase-superuser.sh
```

**5. Manual migrations** (normally unnecessary):

```bash
./pocketbase/pocketbase migrate up \
  --dir="$PWD/pocketbase/pb_data" \
  --migrationsDir="$PWD/pocketbase/pb_migrations"
```

---

## 4. Content management

Everything public is edited in the PocketBase admin UI (`/_/`); there is no separate CMS. A Turkish
step-by-step guide for the client is in [`docs/pocketbase-admin.md`](docs/pocketbase-admin.md).

### Collections

| Collection | Purpose | Public access |
|---|---|---|
| `site_settings` | Firm identity, contact details, home copy, stats, values, SEO defaults | list/view public |
| `articles` | Articles, covers and per-article SEO | list/view only when `status = published` |
| `practice_areas` | Nine practice areas: card summary, modal body, icon, order | only `published = true` |
| `team_members` | Team cards: name, role, bio, photo, expertise, slug | only `published = true` |
| `faq` | Accordion questions and `FAQPage` content | only `published = true` |
| `pages` | Free HTML pages (reserved for the full KVKK notice) | only `published = true` |
| `contact_messages` | Contact-form inbox with consent trail | create public; read/update/delete superuser only |

### What the admin controls

| Page area | Source |
|---|---|
| Top bar, contact block, footer phone/e-mail/address/hours | `site_settings.phone`, `email`, `address`, `working_hours` |
| WhatsApp buttons | `site_settings.whatsapp` (full `https://wa.me/...` URL) |
| Footer tagline and legal note | `site_settings.tagline`, `footer_note` |
| Hero eyebrow, heading and lead | `site_settings.hero_note`, `hero_title`, `hero_lead` |
| About heading, lead and body | `about_title`, `about_lead`, `about_body` |
| Trust strip (four figures) | `stats` JSON array of `{value,label}` |
| Three principle cards | `values` JSON array of `{title,text}` |
| Practice-area cards and detail modal | `practice_areas` (`title`, `summary`, `body`, `icon`, `sort_order`) |
| Team cards | `team_members` (`name`, `role`, `bio`, `photo`, `expertise`, `slug`) |
| Article cards and article pages | `articles` |
| FAQ accordion and `FAQPage` data | `faq` |
| Footer KVKK link | currently the in-page summary; the full text belongs in `pages` |
| Home page title/description | `site_settings.seo_title`, `seo_description` |
| Social profiles and schema | `site_settings.socials`, `same_as` |

`site_settings` must contain **exactly one record**; the site reads the first one. Writes are
superuser-only. Empty optional fields fall back to the static markup.

### `site_settings` fields

| Group | Fields |
|---|---|
| Identity | `firm_name`, `tagline`, `footer_note` |
| Contact | `phone`, `whatsapp`, `email`, `address`, `working_hours` |
| Social | `socials` (`{"instagram":"...","linkedin":"..."}`), `same_as` (JSON array for schema.org) |
| Home copy | `hero_note`, `hero_title`, `hero_lead`, `about_title`, `about_lead`, `about_body`, `stats`, `values` |
| SEO | `site_url`, `seo_title`, `seo_description`, `default_seo_title`, `default_seo_description`, `og_image_url`, `google_site_verification` |

`stats` is a JSON array, for example `[{"value":"25+","label":"Yıllık deneyim"}]`. `values` is a JSON
array of `{"title":"...","text":"..."}`. Keep the key names; invalid JSON is rejected by the admin
UI. Statistics are content, not decoration — replace the current figures with verified ones or
remove them.

### Article fields

| Field | Type | Notes |
|---|---|---|
| `title` | text (180) | required |
| `slug` | text (140) | required, unique, lowercase letters/digits/hyphens; used in the URL |
| `excerpt` | text (600) | card summary |
| `body` | editor (HTML, 60 KB) | article body, sanitised on write and on render |
| `cover` | file (jpeg/png/webp, 5 MB) | **recommended** cover upload |
| `cover_url` | URL | legacy external cover; blocked by the current CSP in the browser — upload `cover` instead |
| `published_at` | date | home-page order: `sort=-published_at` |
| `status` | select `draft` / `published` | required; new records default to `draft` via hook |
| `author` | text (120) | optional display name |
| `seo_title` | text (120) | optional `<title>` override (aim for 50–60 chars) |
| `seo_description` | text (400) | optional meta description (aim for 140–160 chars) |
| `og_image_url` | URL | optional social image; falls back to cover, then the site default |

Slugs are validated with `^[a-z0-9]+(?:-[a-z0-9]+)*$`; invalid values return `400`. Changing a slug
changes the public URL and removes the old generated page.

The public site sends `Content-Security-Policy: img-src 'self' data:`; an external `cover_url` is
therefore not displayed in the browser. Use the `cover` file field (served from the same origin) for
all new articles.

### Publish flow

1. Create the record; if `status` is left empty the hook stores it as `draft`.
2. Fill `title`, `slug`, `excerpt`, `body`, and upload a `cover`.
3. Set `status = published` and save.
4. The home page shows the **three latest published** articles (`sort=-published_at`).
5. The server generates `pb_public/makale/<slug>/index.html` with title, canonical, body,
   `Article`/`BreadcrumbList` JSON-LD; `/makale/<slug>/` is the public URL. `/sitemap.xml` and
   `/robots.txt` are generated from the database.
6. To retract, set `status = draft`; the record disappears from public list/view and the generated
   page is removed at the next sync. A cached page can live for up to five minutes.

The home-page cards and article links use the clean `/makale/<slug>/` URLs. The legacy
`/makale.html?slug=...` entry point still responds with a `301` to the clean URL built from
`site_settings.site_url`.

### Contact form and KVKK

The form posts to the same-origin `POST /api/collections/contact_messages/records` and stores
`name`, `phone`, `email`, `subject`, `message`, `kvkk_consent`, `consent_at`, `source`, `page` and
an inbox `status`.

- `kvkk_consent` must be `true`; a missing or false value returns `400` with a field error.
- `consent_at` is written by the server; client values are ignored.
- `status` is always forced to `new`; clients cannot archive their own message.
- Submissions are rate-limited (5 per 60 s) and the record is invisible to the public API.

The full KVKK disclosure text is still a placeholder: the form links to the short in-page summary,
and `pages` is empty. The notice should be added to `pages` and linked before launch.

---

## 5. SEO

**Implemented**

- `lang="tr"`, unique title/description, canonical and Open Graph/Twitter tags on both pages.
- `LegalService` + `PostalAddress` JSON-LD on the home page; `FAQPage` from the FAQ section; `Image`,
  `logo` and real NAP (phone, address, region) included.
- Server-rendered `/makale/<slug>/` HTML with `Article` + `BreadcrumbList` JSON-LD, title, date,
  author, cover, breadcrumb, canonical and Open Graph — no JavaScript needed.
- Legacy `?slug=` URLs `301` to the clean URL; draft and unknown slugs return `404`.
- `/sitemap.xml` (home + published articles, `lastmod` from the record) and `/robots.txt`
  (disallow `/_/` and `/api/`); `X-Robots-Tag: noindex` on admin and API responses.
- Site-wide `seo_title`/`seo_description` applied to the home page from `site_settings`.
- Self-hosted, responsive images with `srcset`/`sizes` and a 1200×630 local Open Graph image.

**Domain.** The canonical origin is currently `https://www.ulucinar.av.tr` and is **not confirmed**.
It appears in:

| Location | What to change |
|---|---|
| `site_settings.site_url` | canonical/OG/sitemap base and legacy redirect target |
| `assets/js/config.js` → `site.url` | client-side canonical and link building |
| `index.html` | static canonical, `og:url`, `LegalService.url` |
| `makale.html` | static canonical and `og:url` fallback |
| `site_settings.og_image_url` | absolute default share image |

To change the domain: update `site_settings.site_url` in the admin panel, then the static tags above,
then run `./scripts/pocketbase-sync-public.sh` and restart/redeploy. The SEO hook rebuilds article
pages and the sitemap from `site_url`.

**Search Console.** A `google_site_verification` field exists on `site_settings`, but verification,
sitemap submission and property access are **not done**; they require the real domain and client
access. Lighthouse and Rich Results testing were **not run** without a live URL. After launch:
verify the domain, submit `/sitemap.xml`, run Rich Results and monitor coverage. Do not add fake
reviews/ratings to structured data.

---

## 6. Brand, typography and photography

- `assets/logo/logo-siyah-beyaz.pdf` is the original supplied logo and the source of truth. Gold
  derivatives (`ulucinar-gold.svg/png`, `ulucinar-emblem-gold.svg`) and the favicon set were produced
  from it; the intro uses inline SVG/PNG layers, so it never flashes a fallback font.
- Regeneration is manual: rasterise/vectorise the PDF (e.g. `pdftocairo`), re-apply the gold gradient
  in a vector editor, then export the sizes used by the header, splash and social image. There is no
  regeneration script in the repo, so these steps are **not verified** here.
- Typography is self-hosted in `assets/fonts/`: Cinzel and Manrope variable fonts plus `fonts.css`
  and their OFL licences.
- Photography is self-hosted in `assets/img/`: 38 image files — nine Pexels photographs with
  responsive WebP/JPEG renditions (1600 px wide; the about portrait at 960×1200) plus a locally
  composed 1200×630 `og-cover.jpg`/`.png`. The mediation article cover is a people-free composition.
  Source URLs and licence notes are in [`assets/img/CREDITS.md`](assets/img/CREDITS.md); the Pexels
  licence allows commercial use without attribution.
- Open Graph image: `assets/img/og-cover.jpg` (1200×630), referenced absolutely from
  `https://www.ulucinar.av.tr/assets/img/og-cover.jpg`. Update the absolute URL with the domain.

Do not commit `pb_data/`, uploaded covers, the PocketBase binary or `.team/`.

---

## 7. Scripts

All scripts resolve paths from their own location, so they can be called from any directory. They
use `set -euo pipefail`.

| Script | What it does | Verified |
|---|---|---|
| `pocketbase-serve.sh` | Starts PocketBase with `--dir`, `--migrationsDir`, `--publicDir`, `--hooksDir`, `--origins`. Reads `PB_HTTP`, `PB_ORIGINS`, `PB_BIN`. | Yes |
| `pocketbase-sync-public.sh` | Copies root `*.html` (except `lawyer_sablon.html`) and `assets/` into `pb_public/`; preserves generated `makale/` pages. | Yes |
| `pocketbase-superuser.sh` | Prompts for e-mail and password (hidden, confirmed, min 8 chars) and runs `superuser upsert`. | Not run end-to-end (would create/reset credentials) |
| `pocketbase-backup.sh` | Cold-copies `pb_data/` into `backups/YYYYmmdd-HHMMSS/`; enforces `0700`/`0600` on the copy and the live data directory. Not a consistent online backup. | Yes (permissions verified) |
| `pocketbase-rebuild-seo.sh` | Rebuilds generated article HTML, either through a running server (superuser login over stdin) or a temporary instance. | Not run in this pass |

`pocketbase-backup.sh` writes owner-only backups. They contain superuser password hashes and client
messages: encrypt before copying them off the host (for example `age -p` or `gpg -c`) and define a
retention period.

---

## 8. Deployment

Reference files are in `deploy/`: `nginx.conf` (TLS, HSTS, security headers, admin allow-list and
per-route rate limits), `ulucinar-pocketbase.service` (hardened systemd unit, loopback bind,
`UMask=0077`) and `backup.cron` (nightly backup example). CI in `.github/` runs JavaScript/shell
syntax checks, a static site gate and a throwaway PocketBase E2E job.

1. Build/host: copy the static files into `pb_public/` with `pocketbase-sync-public.sh` (run it on
   the server checkout, not locally and then uploaded, so paths stay consistent).
2. Run the PocketBase binary behind a reverse proxy with TLS and HTTP/2. Bind to `127.0.0.1` (the
   serve script does) and let the proxy expose 443. Protect `/_/` and
   `/api/collections/_superusers/*` with an IP allow-list or VPN; do not rely on the password alone.
   Use a strong, unique superuser password and enable MFA if available.
3. Set `PB_ORIGINS` to the real origin only. Never use `*`. Typical server values:
   `PB_HTTP=127.0.0.1:8090`, `PB_ORIGINS=https://www.example.com`,
   `PB_BIN=/opt/pocketbase/pocketbase`.
4. Persist `pb_data/` (database + uploaded files) on a volume and back it up daily. Prefer
   **Settings → Backups** in the admin panel for live backups; `pocketbase-backup.sh` is a cold copy
   for local/dev use. The script keeps backups and `pb_data` at `0700`/`0600`; encrypt archives
   before moving them off the host and define retention.
5. Update the domain (see §5), sync public files, restart, then verify:
   `curl -I https://<domain>/`, `/robots.txt`, `/sitemap.xml`, an article URL, the contact form and
   `/_/`.
6. The binary is not committed: install it on the server (pinned to 0.42.3) and keep it out of the
   repo. `pb_data/` and uploaded files are not committed and must be backed up separately.

### Security hardening

- **Headers.** A PocketBase middleware adds a strict `Content-Security-Policy`,
  `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY` and
  `X-Content-Type-Options: nosniff` to public responses. HSTS is sent only over TLS; TLS and HSTS
  are terminated in the reference nginx config if TLS ends at the proxy. The CSP allows only the
  site origin (`default-src 'self'`; fonts and images from `'self'`; `connect-src 'self'`), with
  `'unsafe-inline'` retained for the critical inline CSS/JS in the static pages.
- **Rate limits.** PocketBase rate limits are enabled (authentication, create and global API), with
  a dedicated 5-per-60 s bucket for contact submissions. The nginx example adds per-route limits
  and fail2ban-friendly logging; use proxy-level limits for distributed abuse.
- **Content safety.** Article HTML passes through an allow-list sanitizer on write and again on
  server render. `script`, `style`, `iframe`, `object`, `embed`, `svg`, event attributes and
  `javascript:`/`data:` URLs are removed. This is a safety net, not a trust boundary: only staff
  who are allowed to publish should have write access, and pasted HTML should still be reviewed.
- **API base.** Same-origin only; there is no query-string override. Do not configure a
  cross-origin PocketBase URL for production.
- **Admin surface.** `/_/` and `/api/` are `noindex`; keep the panel off the public internet or
  behind the proxy allow-list. Never commit `.env`, credentials, backups or `pb_data/`.

Environment variables used by the scripts (no secrets are stored in the repo):
`PB_HTTP`, `PB_ORIGINS`, `PB_BIN`, and for the rebuild script `PB_SUPERUSER_EMAIL` /
`PB_SUPERUSER_PASSWORD` (optional; otherwise prompted), `PB_REBUILD_PORT`.

---

## 9. Current content and placeholders

Real and already in the site:

- Phone `+90 (501) 943 63 41` (`+905019436341`), WhatsApp `https://wa.me/905019436341`.
- Address: Karabaş Mh. Cumhuriyet Blv. No:177/2, İzmit / Kocaeli.
- Firm name, tagline, practice-area and FAQ copy seeded in the CMS.

Still to be supplied or confirmed by the client:

| Item | Where |
|---|---|
| Domain (canonical/OG/sitemap) — currently `https://www.ulucinar.av.tr` | `site_settings.site_url`, `assets/js/config.js` → `site.url`, static meta tags |
| E-mail — currently `info@ulucinar.av.tr` placeholder | `site_settings.email`, static markup, `LegalService` JSON-LD |
| Working hours — currently “Pazartesi – Cuma 09.00 – 18.30” | `site_settings.working_hours` and static fallbacks |
| Statistics `25+`, `1.200+`, `%100` | `site_settings.stats` and the static trust strip — unverified claims; replace or remove |
| Team identities and photos | `team_members` (`name`, `role`, `photo`); some seeded names are placeholders |
| Full KVKK disclosure text | `pages` (empty) and the form/footer link (currently the in-page summary) |
| Social profiles | `site_settings.socials`, `same_as`, footer links |
| Logo/social preview for the final domain | `assets/img/og-cover.jpg` (absolute URL updated with the domain) |

Local development note: the working `pb_data` database is not part of the release and may contain
test records; clean the collections (especially `articles`) before deploying that database. A fresh
installation reproduces the schema and seed content from `pb_migrations/`.

---

## 10. Verification

Checked on 23 November 2026 (Linux) against a temporary copy of the database on port 8096, so test
messages did not touch the working database. The project QA run reported 37/37 focused checks and
0 blockers; CI reported 12/12 static checks and 26/26 PocketBase E2E checks. Those suites were run by
the QA/release workstream and were not re-run for this README.

| Command | Result |
|---|---|
| `python3 -m http.server 8011` + `curl` for `/`, `/makale.html`, OG image, hero image, font, `fonts.css` | all `200` |
| `node --check` for `assets/js/*.js`, `pb_hooks/*.pb.js` and `pb_hooks/lib/*.js` | passes |
| `./pocketbase/pocketbase --version` | `pocketbase version 0.42.3` |
| `./scripts/pocketbase-serve.sh` with all hooks (temporary copy) | starts; `/api/health` → `200` |
| `GET /` | `200`; CSP, Referrer-Policy, Permissions-Policy, X-Frame-Options and nosniff present |
| `GET /makale/aile-hukukunda-uzlasma/` | `200`; title, body and `Article` JSON-LD in the server HTML |
| `GET /makale/yok-boyle-bir-sey/` | `404` |
| `GET /makale.html?slug=aile-hukukunda-uzlasma` | `301` → `https://www.ulucinar.av.tr/makale/aile-hukukunda-uzlasma/` |
| `GET /sitemap.xml`, `/robots.txt`, `/_/` | `200`; robots disallows `/_/` and `/api/`; admin sends `noindex` |
| Public API counts | `practice_areas 9`, `faq 5`, `team_members 3`, `site_settings 1` |
| `site_settings` fields | phone/address/site URL present; `stats` 4 objects, `values` 3 objects; SEO fields present |
| `POST contact_messages` without `kvkk_consent` | `400`, field error on `kvkk_consent` |
| `POST contact_messages` with `kvkk_consent: true` | `200`; `status: new`, server `consent_at`, `source`/`page` stored |
| `GET /` rendered HTML | `FAQPage` JSON-LD present |
| `./scripts/pocketbase-backup.sh` | backup written; directory `700`, files `600`; `pb_data` tightened to `700` |

**Not run in this pass**

- Lighthouse, Rich Results and mobile/desktop cross-browser checks (no live URL yet).
- Search Console verification and sitemap submission.
- `pocketbase-superuser.sh` end-to-end (would create or reset a credential).
- `pocketbase-rebuild-seo.sh`.
- Production TLS, proxy and live backup/restore.

---

## 11. License and ownership

Private, proprietary project for the client (ULUÇINAR Hukuk & Danışmanlık). No open-source license is
granted for the site code or brand assets. Typography is used under the SIL Open Font License
(licences in `assets/fonts/`); photography is used under the Pexels License (source record in
`assets/img/CREDITS.md`). Replace these terms only if the client explicitly chooses a different
license.

---

## Open items

1. Confirm the domain and update `site_settings.site_url`, `config.js` and the static meta tags.
2. Supply real e-mail, working hours, statistics, team identities/photos, social URLs and the full
   KVKK notice.
3. Upload article covers as `cover` files; external `cover_url` images are blocked by the CSP.
4. Run Lighthouse/Rich Results and Search Console verification on the live domain.
5. Clean local test records from `pb_data` before deploying a database copy.
6. Re-check the release run (`RELEASE_GATE=true`) in CI after the final content/domain update.
