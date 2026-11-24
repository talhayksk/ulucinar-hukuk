# ULUÇINAR Hukuk & Danışmanlık — website and PocketBase CMS

Marketing site for a Turkish law firm in İzmit/Kocaeli: a static, no-build front end (Turkish UI)
served next to a self-hosted [PocketBase](https://pocketbase.io/) instance that provides the content
API and the admin panel. The visual identity is navy (`#081422`) and gold (`#c9a227`), with a
Cinzel/Manrope type pair and a logo-fill intro animation.

> **Status (24 November 2026).** The site now includes the article archive, server-rendered
> practice/team/legal pages, an appointment request flow, site search, RSS, a web manifest and a
> cookie notice. Remaining work is external configuration and client content: domain, e-mail
> delivery, working hours, statistics, team bios/photos, the legal review of the drafted policies,
> Search Console/analytics, and TR/EN translation. See
> [Current content and external configuration](#9-current-content-and-external-configuration).

---

## 1. Overview

- **Public site** — home (`index.html`), article archive (`/makaleler/`) with search and category
  filters, server-rendered article/practice/team detail pages, three legal pages, and an appointment
  request page. All copy is Turkish; code, comments and this README are English.
- **Content backend** — PocketBase 0.42.3 at `/_/`. Home copy, contact details, statistics,
  principles, practice areas, team, FAQ, articles, legal pages, contact messages and appointment
  requests are admin-managed. There is no custom admin application.
- **No build step** — plain HTML, CSS and ES5-style JavaScript. No npm, no bundler, no framework.
- **Self-contained assets** — fonts and photographs are served from the repository; the shipped
  pages reference no third-party font or image CDN.
- **Site utilities** — header search (opens with `/` or `Ctrl/Cmd+K`), RSS at `/rss.xml`, a web app
  manifest, a cookie notice stored under `ulucinar-cookie-consent` in `localStorage`, and a Google
  Maps link (no embedded iframe).
- **Graceful degradation** — if the API is unreachable, the home page keeps its static markup and
  the server-rendered pages remain readable.

The site is served **from PocketBase itself** (`pb_public/`), so the browser talks to the API on the
same origin. There is no query-string API override; the only supported API base is the site origin.

### Opening sequence

The intro plays **once per browser session**: it fills the gold logo (2600 ms) and exits over 650 ms,
then stores `ulucinar-intro-seen` in `sessionStorage`. A new tab/session or a cleared storage shows
it again. Escape hatches:

- `?intro=1` forces the intro even if it was already seen.
- `?intro=off` (or the `#intro-off` hash) skips it.
- `prefers-reduced-motion: reduce` skips the animation.

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
| Photography | Pexels, self-hosted AVIF/WebP/JPEG renditions |
| Hosting | Any host that can run the PocketBase binary and terminate TLS; examples in `deploy/` |

```text
.
├── index.html                  # one-page home (TR), content hydrated from PocketBase
├── makaleler.html              # article archive template (search + category chips)
├── makale.html                 # article detail shell / SSR template
├── calisma-alani.html          # practice-area detail template
├── ekip-uyesi.html             # team member detail template
├── randevu.html                # appointment request form
├── sayfa.html                  # legal/information page template
├── site.webmanifest            # PWA manifest (served as application/manifest+json)
├── assets/
│   ├── css/style.css
│   ├── js/
│   │   ├── config.js           # same-origin API, collection names, endpoint fallbacks
│   │   ├── pb.js               # minimal PocketBase REST client (fetch, no SDK)
│   │   ├── content.js          # settings, home sections, articles, modals, page hydration
│   │   ├── archive.js          # client-side filtering of server-rendered archive cards
│   │   ├── appointment.js      # appointment form validation and POST
│   │   └── main.js             # intro, navigation, search overlay, cookie notice, form, a11y
│   ├── logo/                   # original PDF, gold lockups, emblem, favicon set
│   ├── img/                    # 83 image files; see assets/img/CREDITS.md
│   └── fonts/                  # Cinzel/Manrope variable fonts, fonts.css, OFL licences
├── pocketbase/
│   ├── pocketbase              # 0.42.3 binary — NOT committed
│   ├── pb_migrations/          # schema, legal pages, appointments, SEO/security migrations
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

Generated by the SEO hook into `pb_public/` (not committed): `/makale/<slug>/`,
`/makaleler/index.html`, `/calisma-alani/<slug>/`, `/ekip/<slug>/`, `/kvkk/`,
`/cerez-politikasi/`, `/gizlilik/` and `/randevu/`.

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

The script copies root-level `*.html`, `site.webmanifest` and `assets/` into `pocketbase/pb_public/`.
It preserves generated SEO output (`makale/`, `makaleler/`, `calisma-alani/`, `ekip/`, legal pages,
`randevu/`); the hooks rebuild that output on start and on content changes.

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
| `site_settings` | Firm identity, contact details, home copy, stats, values, map link, analytics switch, SEO defaults | list/view public |
| `articles` | Articles, covers, category/tags and per-article SEO | list/view only when `status = published` |
| `practice_areas` | Nine practice areas: card summary, detail body, icon, order | only `published = true` |
| `team_members` | Team cards and detail pages: name, role, bio, photo, expertise, slug | only `published = true` |
| `faq` | Accordion questions and `FAQPage` content | only `published = true` |
| `pages` | Legal/information pages: `kvkk`, `cerez-politikasi`, `gizlilik` | only `published = true` |
| `contact_messages` | Contact-form inbox with consent trail | create public; read/update/delete superuser only |
| `appointments` | Appointment requests with consent trail | create public; read/update/delete superuser only |

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
| Practice-area cards, modal and `/calisma-alani/<slug>/` pages | `practice_areas` (`title`, `summary`, `body`, `icon`, `sort_order`) |
| Team cards and `/ekip/<slug>/` pages | `team_members` (`name`, `role`, `bio`, `photo`, `expertise`, `slug`) |
| Article cards, archive and article pages | `articles` (`title`, `slug`, `excerpt`, `body`, `category`, `tags`, `published_at`, `status`) |
| Article archive `/makaleler/` | generated from published `articles`; search and category chips filter the server-rendered cards |
| FAQ accordion and `FAQPage` data | `faq` |
| Legal pages `/kvkk/`, `/cerez-politikasi/`, `/gizlilik/` | `pages` (`slug`, `title`, `content`, `published`) |
| Appointment requests | `appointments` (public form; admin inbox only) |
| Map link | `site_settings.map_url` (Google Maps link, also used as schema.org `hasMap`) |
| Analytics | `site_settings.analytics_provider` (`none`/`plausible`), `analytics_id` |
| Footer legal links | point to the generated legal pages above |
| Home page title/description | `site_settings.seo_title`, `seo_description` |
| Social profiles and schema | `site_settings.socials`, `same_as` |

`site_settings` must contain **exactly one record**; the site reads the first one. Writes are
superuser-only. Empty optional fields fall back to the static markup.

### `site_settings` fields

| Group | Fields |
|---|---|
| Identity | `firm_name`, `tagline`, `footer_note` |
| Contact | `phone`, `whatsapp`, `email`, `address`, `working_hours`, `map_url` |
| Social | `socials` (`{"instagram":"...","linkedin":"..."}`), `same_as` (JSON array for schema.org) |
| Analytics | `analytics_provider` (`none`/`plausible`), `analytics_id` (Plausible data-domain) |
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
| `published_at` | date | home/archive order: `sort=-published_at` |
| `category` | text | archive category chip (e.g. `Aile Hukuku`) |
| `tags` | JSON array | archive search terms and related keywords |
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
4. The home page shows **up to six latest published** articles (`sort=-published_at`); the full set
   is listed at `/makaleler/`.
5. The server generates `pb_public/makale/<slug>/index.html` with title, canonical, body,
   `Article`/`BreadcrumbList` JSON-LD; `/makale/<slug>/` is the public URL. The archive page, practice
   and team detail pages, legal pages, `/randevu/`, `/sitemap.xml` and `/robots.txt` are generated
   from the same data.
6. To retract, set `status = draft`; the record disappears from public list/view and the generated
   page is removed at the next sync. A cached page can live for up to five minutes.

The home-page cards and article links use the clean `/makale/<slug>/` URLs. The legacy
`/makale.html?slug=...` entry point still responds with a `301` to the clean URL built from
`site_settings.site_url`.

### Public URLs

| URL | Content |
|---|---|
| `/` | one-page home (up to six latest articles) |
| `/makaleler/` | server-rendered archive with client-side search and category filters |
| `/makale/<slug>/` | article detail, `Article` + `BreadcrumbList` JSON-LD |
| `/calisma-alani/<slug>/` | practice-area detail, `Service` JSON-LD |
| `/ekip/<slug>/` | team member detail, `Person` JSON-LD |
| `/kvkk/`, `/cerez-politikasi/`, `/gizlilik/` | legal pages from `pages`, `WebPage` JSON-LD |
| `/randevu/` | appointment request form |
| `/rss.xml` | RSS 2.0 feed of published articles |
| `/site.webmanifest` | web app manifest |
| `/sitemap.xml`, `/robots.txt` | generated sitemap and crawler rules |
| `/_/` | PocketBase admin (noindex, keep behind the proxy allow-list) |

Legacy aliases redirect with `301`: `/makaleler.html` and `/makaleler` → `/makaleler/`,
`/makale.html?slug=...` → `/makale/<slug>/`, `/randevu.html` → `/randevu/`, and slash-less detail
URLs to their trailing-slash form.

### Contact form, appointments and consent

The contact form posts to the same-origin `POST /api/collections/contact_messages/records` and stores
`name`, `phone`, `email`, `subject`, `message`, `kvkk_consent`, `consent_at`, `source`, `page` and
an inbox `status`.

- `kvkk_consent` must be `true`; a missing or false value returns `400` with a field error.
- `consent_at` is written by the server; client values are ignored.
- `status` is always forced to `new`; clients cannot archive their own message.
- Submissions are rate-limited (5 per 60 s) and the record is invisible to the public API.

The appointment form at `/randevu/` posts to `POST /api/collections/appointments/records` and stores
`name`, `phone`, optional `email`, `practice_area`, `preferred_date`, `preferred_time`, `message`,
consent fields and `source`/`page`.

- A past `preferred_date` is rejected with `400`; the form is a request, not a booking calendar.
- `kvkk_consent` is required, `consent_at` is server-side, and `status` always starts as `new`.
- Admin statuses are `new` → `contacted` → `closed`; the collection is create-only for the public and
  has its own 5-per-60 s rate limit.
- E-mail notifications are optional (see below). Without the Resend environment keys, submissions
  stay in the admin panel only.

The legal pages under `/kvkk/`, `/cerez-politikasi/` and `/gizlilik/` are editable in `pages`.
Their current text is a **draft** with a visible “TASLAK — yayın öncesi hukuki inceleme gerekir”
warning; it must be reviewed and finalised by the client’s lawyer before launch.

### E-mail notifications, analytics and languages

**E-mail (optional).** Contact and appointment submissions can trigger a notification and an
auto-reply through Resend. The feature is disabled unless **all three** of `RESEND_API_KEY`,
`MAIL_FROM` and `MAIL_TO` are set in the PocketBase environment; `RESEND_API_URL` is optional and is
useful for a test/mock endpoint. Missing configuration is logged and ignored — the form still
returns `200` and the record is stored. No email has been sent in this checkout; real delivery must
be tested once a key is supplied.

The systemd example loads these values from `EnvironmentFile=-/etc/ulucinar/pocketbase.env`
(owner-readable only). Never put keys in the repository, the admin panel or the README.

**Analytics (optional, consent-based).** `site_settings.analytics_provider` accepts `none` or
`plausible`; `analytics_id` is the Plausible `data-domain` value. With `provider = plausible` and a
non-empty ID, the loader is injected **only after** the visitor chooses **“Kabul et”**; “Sadece
zorunlu”, dismissing the banner, or an empty setting loads nothing. The current database has
`provider = none` and no Plausible account/ID, so analytics is **off and not run**. The cookie
banner/policy text currently says no analytics is used and must be updated before enabling it.

**Languages.** The site is currently Turkish only (`lang="tr"`); there is no `/en/` route. A TR/EN
version needs translated content plus multilingual fields (or separate records) in PocketBase; that
is a later phase, not part of this release.

---

## 5. SEO

**Implemented**

- `lang="tr"`, unique title/description, canonical and Open Graph/Twitter tags on every page.
- Home: `LegalService` + `PostalAddress` JSON-LD with real NAP, `hasMap` from
  `site_settings.map_url`, and `FAQPage` from the FAQ section.
- Archive `/makaleler/`: server-rendered cards, `CollectionPage` + `ItemList` JSON-LD, canonical and
  category metadata.
- Article `/makale/<slug>/`: server-rendered HTML with `Article` + `BreadcrumbList` JSON-LD, title,
  date, author, cover, canonical and Open Graph — no JavaScript needed.
- Practice `/calisma-alani/<slug>/`: `Service` JSON-LD (provider, area served, URL) + breadcrumb.
- Team `/ekip/<slug>/`: `Person` JSON-LD (job title, works for, expertise, URL, image) + breadcrumb.
- Legal `/kvkk/`, `/cerez-politikasi/`, `/gizlilik/`: `WebPage` + `BreadcrumbList` JSON-LD.
- Legacy aliases `301` to the clean URLs; unknown/draft detail pages return `404`.
- `/sitemap.xml` (21+ URLs: home, archive, appointment page, nine practice areas, three legal pages,
  team members and published articles) and `/robots.txt` (disallow `/_/` and `/api/`);
  `X-Robots-Tag: noindex` on admin and API responses.
- `/rss.xml` (RSS 2.0, published articles) and `/site.webmanifest`, linked from every page head.
- Site-wide `seo_title`/`seo_description` applied to the home page from `site_settings`.
- Self-hosted, responsive images with `srcset`/`sizes` and a 1200×630 local Open Graph image.
- No iframe map: the address block links out to Google Maps (`map_url`), keeping `frame-src 'none'`.

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

**Search Console.** A `google_site_verification` field exists on `site_settings` for the HTML-tag
token; DNS TXT verification is also possible at the registrar. Verification, sitemap submission and
property access are **not done**; they require the live domain and client access. After launch:
verify the domain (DNS or HTML), submit `/sitemap.xml`, run Rich Results and monitor coverage. Do not
add fake reviews/ratings to structured data.

**Google Business Profile.** GBP is an external account, not repository configuration. Keep the
name/address/phone identical to the site and to `map_url`/`hasMap`; verify the listing and add the
final domain as the website. GBP access must come from the client; local SEO was **not run**.

**Map.** The contact block links out to Google Maps (`site_settings.map_url`) and the home JSON-LD
includes `hasMap`. There is no embedded iframe, and `geo`/`openingHoursSpecification` are intentionally
absent until real coordinates and hours are supplied.

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
- Photography is self-hosted in `assets/img/`: 83 image files — nine Pexels photographs with
  responsive AVIF, WebP and JPEG renditions at 480/800/1600/2400 px (the about portrait at
  960×1200), plus a locally composed 1200×630 `og-cover.jpg`/`.png`. Pages use `<picture>` with
  AVIF first, WebP second and JPEG fallback. The mediation article cover is a people-free
  composition. Source URLs and licence notes are in
  [`assets/img/CREDITS.md`](assets/img/CREDITS.md); the Pexels licence allows commercial use without
  attribution.
- WhatsApp controls in the hero, contact block, footer and floating button use the official solid
  WhatsApp glyph, tinted with `currentColor` to keep contrast on navy and gold surfaces.
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
7. Put deployment-only values in `EnvironmentFile=-/etc/ulucinar/pocketbase.env` (referenced by the
   systemd unit, readable only by the service user/root). This is where Resend keys (`RESEND_API_KEY`,
   `MAIL_FROM`, `MAIL_TO`, optional `RESEND_API_URL`) belong; missing values simply disable e-mail.
8. Admin access: strong unique superuser password, MFA/TOTP from the PocketBase panel where available,
   `/_/` behind the nginx IP allow-list/VPN, review **Logs** for failed logins, and test restore from
   a backup before launch. `deploy/nginx.conf`, `deploy/ulucinar-pocketbase.service` and
   `deploy/backup.cron` are reference configurations, not a live deployment.

### Security hardening

- **Headers.** A PocketBase middleware adds a strict `Content-Security-Policy`,
  `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY` and
  `X-Content-Type-Options: nosniff` to public responses. HSTS is sent only over TLS; TLS and HSTS
  are terminated in the reference nginx config if TLS ends at the proxy. The CSP is same-origin for
  content and fonts, with `https://plausible.io` added to `img-src`, `script-src` and `connect-src`
  solely for the optional consent-gated analytics; `'unsafe-inline'` is retained for the critical
  inline CSS/JS in the static pages.
- **Rate limits.** PocketBase rate limits are enabled (authentication, create and global API), with
  dedicated 5-per-60 s buckets for contact and appointment submissions. The nginx example adds
  per-route limits and fail2ban-friendly logging; use proxy-level limits for distributed abuse.
- **Content safety.** Article HTML passes through an allow-list sanitizer on write and again on
  server render. `script`, `style`, `iframe`, `object`, `embed`, `svg`, event attributes and
  `javascript:`/`data:` URLs are removed. This is a safety net, not a trust boundary: only staff
  who are allowed to publish should have write access, and pasted HTML should still be reviewed.
- **API base.** Same-origin only; there is no query-string override. Do not configure a
  cross-origin PocketBase URL for production.
- **Admin surface.** `/_/` and `/api/` are `noindex`; keep the panel off the public internet or
  behind the proxy allow-list. Use a strong unique superuser password, enable TOTP/MFA from the
  PocketBase panel where available, review Logs for failed logins, and test backup/restore. Never
  commit `.env`, credentials, backups or `pb_data/`.

Environment variables used by the scripts (no secrets are stored in the repo):
`PB_HTTP`, `PB_ORIGINS`, `PB_BIN`, and for the rebuild script `PB_SUPERUSER_EMAIL` /
`PB_SUPERUSER_PASSWORD` (optional; otherwise prompted), `PB_REBUILD_PORT`. Optional e-mail
notifications read `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TO` and `RESEND_API_URL` from the service
environment (see the systemd `EnvironmentFile`), never from the repository.

---

## 9. Current content and external configuration

Real and already in the site:

- Phone `+90 (501) 943 63 41` (`+905019436341`), WhatsApp `https://wa.me/905019436341`.
- Address: Karabaş Mh. Cumhuriyet Blv. No:177/2, İzmit / Kocaeli (also used for `hasMap`).
- Firm name, tagline, practice-area, FAQ and legal-page drafts seeded in the CMS.

### Content still to be supplied or confirmed

| Item | Where |
|---|---|
| Domain (canonical/OG/sitemap) — currently `https://www.ulucinar.av.tr` | `site_settings.site_url`, `assets/js/config.js` → `site.url`, static meta tags |
| E-mail — currently `info@ulucinar.av.tr` placeholder | `site_settings.email`, static markup, `LegalService` JSON-LD |
| Working hours — currently “Pazartesi – Cuma 09.00 – 18.30” | `site_settings.working_hours` and static fallbacks |
| Statistics `25+`, `1.200+`, `%100` | `site_settings.stats` and the static trust strip — unverified claims; replace or remove |
| Team identities, bios and photos | `team_members` (`name`, `role`, `bio`, `photo`); some seeded names are placeholders |
| Legal review and final text of `/kvkk/`, `/cerez-politikasi/`, `/gizlilik/` | `pages` (`content`); current text carries a visible draft warning |
| Social profiles | `site_settings.socials`, `same_as`, footer links |
| TR/EN translation (if required) | new content/locale work; the current site is Turkish only |
| Social preview for the final domain | `assets/img/og-cover.jpg` (absolute URL updated with the domain) |

### External configuration

| Service / item | Current state |
|---|---|
| E-mail delivery (Resend) | **Not configured / not tested.** Add `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TO` (and optional `RESEND_API_URL`) to `/etc/ulucinar/pocketbase.env`. With any missing value notifications are silently disabled and forms keep returning `200`. A real send must be tested once a key is supplied. |
| Google Search Console | Not verified. Use DNS TXT or the `google_site_verification` HTML tag; the field exists but no token is set. Submit `/sitemap.xml` after the domain is live. |
| Analytics (Plausible) | `analytics_provider`/`analytics_id` exist; provider is `none`. The consent-gated loader is implemented (injected only after “Kabul et” when provider/id are set; CSP allows `https://plausible.io`). **No account/ID is configured and no analytics was sent/tested.** Update the cookie banner/policy text before enabling. |
| Google Business Profile / local SEO | External account, not set up. Keep NAP identical to the site, verify the listing and add the final domain; GBP access is required from the client. |
| Admin security | Use a strong unique superuser password, enable TOTP/MFA in the PocketBase panel where available, keep `/_/` and superuser endpoints behind the nginx IP allow-list/VPN, review **Logs** and test backup/restore. Live MFA was **not verified**. |
| Lighthouse / Rich Results | **Not run** without a live URL; run after deployment and before announcing the site. |

Local development note: the working `pb_data` database is not part of the release and may contain
test records; clean the collections (especially `articles` and `appointments`) before deploying that
database. A fresh installation reproduces the schema and seed content from `pb_migrations/`.

---

## 10. Verification

Checked on 24 November 2026 (Linux) against a temporary copy of the database on port 8098, so test
records did not touch the working database. The earlier v0.1.0 QA run reported 37/37 focused checks
and 0 blockers, and CI reported 12/12 static checks and 26/26 PocketBase E2E checks; the new archive,
detail, legal, appointment, RSS and manifest features were smoke-checked for this update but not put
through a full QA cycle.

| Command | Result |
|---|---|
| `python3 -m http.server` + `curl` for static HTML, images and fonts | `200` |
| `node --check` for `assets/js/*.js`, `pb_hooks/*.pb.js`, `pb_hooks/lib/*.js` and the analytics migration | passes |
| `./pocketbase/pocketbase --version` | `pocketbase version 0.42.3` |
| `./scripts/pocketbase-serve.sh` with all hooks (temporary copy) | starts; `/api/health` → `200` |
| `GET /`, `/makaleler/`, `/kvkk/`, `/cerez-politikasi/`, `/gizlilik/`, `/randevu/` | all `200` |
| `GET /makale/aile-hukukunda-uzlasma/`, `/calisma-alani/aile-hukuku/`, `/ekip/kurucu-ortak/` | all `200`, server-rendered |
| `GET /rss.xml`, `/site.webmanifest` | `200` with RSS / manifest MIME types |
| `GET /sitemap.xml`, `/robots.txt`, `/_/` | `200`; sitemap has 21 URLs; robots disallows `/_/` and `/api/`; admin sends `noindex` |
| Security headers on `/` | CSP, Referrer-Policy, Permissions-Policy, X-Frame-Options, nosniff present |
| Public API counts | `practice_areas 9`, `faq 5`, `team_members 3`, `site_settings 1` |
| `site_settings` fields | phone/address/site URL/map URL present; `stats` 4 objects, `values` 3 objects; SEO fields present |
| `POST contact_messages` without `kvkk_consent` | `400`, field error on `kvkk_consent` |
| `POST appointments` without `kvkk_consent` | `400` |
| `POST appointments` with `kvkk_consent: true` | `200`; `status: new`, server `consent_at` |
| `GET /` rendered HTML | `FAQPage` JSON-LD present |
| `./scripts/pocketbase-backup.sh` | backup written; directory `700`, files `600`; `pb_data` tightened to `700` |

**Not run in this pass**

- Full QA/Lighthouse/Rich Results/cross-browser cycle for the new features; Lighthouse and Rich
  Results still require a live URL.
- Search Console verification, analytics and Google Business Profile setup.
- E-mail delivery (Resend) and appointment/contact notification sends.
- Plausible analytics: no ID/account, no browser test, no data sent.
- Admin MFA/TOTP live verification and proxy IP allow-list.
- TR/EN translation and `/en/` routing.
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
2. Supply real e-mail, working hours, statistics, team identities/bios/photos and social URLs.
3. Have the drafted legal pages (`/kvkk/`, `/cerez-politikasi/`, `/gizlilik/`) reviewed and finalised;
   keep the draft warning until then.
4. Configure Resend (`RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TO`, optional `RESEND_API_URL`) and test one
   real contact/appointment notification; until then forms store records only.
5. Add a real Plausible account/ID, update the cookie banner/policy text, and verify the
   consent-gated loader in a browser.
6. Set up Search Console (DNS/HTML) and Google Business Profile, and enable admin MFA + proxy IP
   allow-list in production.
7. Upload article covers as `cover` files; external `cover_url` images are blocked by the CSP.
8. Run Lighthouse/Rich Results on the live URL; add TR/EN translation if required.
9. Clean local test records (`articles`, `appointments`, `contact_messages`) from `pb_data` before
   deploying a database copy.
10. Re-check the release run (`RELEASE_GATE=true`) in CI after the final content/domain update.
