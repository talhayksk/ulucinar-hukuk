# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-23

First release candidate: static marketing site for ULUÇINAR Hukuk & Danışmanlık
plus a PocketBase 0.42.3 content backend, server-rendered article pages,
technical SEO and the operational tooling needed to host it.

### Added

- Single-page Turkish site (`index.html`): hero slider, practice areas, team,
  articles, FAQ accordion, contact form, sticky header, floating WhatsApp and
  back-to-top controls, responsive from 360px up.
- Brand asset set in `assets/logo/`: primary lockup (SVG/PNG), emblem,
  favicon (`favicon.svg`, `favicon-32.png`, `favicon-512.png`) and
  `apple-touch-icon.png`.
- Self-hosted typography and photography: Cinzel + Manrope variable fonts
  (`assets/fonts/`, OFL licensed) and 38 WebP/JPEG images in `assets/img/`.
  No third-party font or image CDN is referenced by the shipped pages.
- Opening sequence: gold logo fill animation (~2.6 s) with a reduced-motion and
  `?intro=off` escape hatch, no FOUC and no repeat on later page loads.
- Article template (`makale.html`) with loading, error and not-found states,
  client-side PocketBase rendering for preview use.
- PocketBase 0.42.3 backend (`pocketbase/`): collections for `site_settings`,
  `practice_areas`, `team_members`, `articles`, `faq`, `contact_messages` and
  `pages`, defined entirely as reproducible migrations under
  `pb_migrations/`.
- Demo seed content (clearly labelled placeholder text, addresses and numbers)
  so the site and the admin panel are usable before real content arrives.
- Server-rendered article pages: `GET /makale/<slug>/` returns complete HTML
  (title, date, author, cover, body, breadcrumb, `Article` + `BreadcrumbList`
  JSON-LD, canonical, Open Graph) without executing JavaScript.
- Legacy URL handling: `makale.html?slug=<slug>` responds `301` to the clean
  URL; draft and unknown slugs return `404`; `/makale.html` redirects to the
  homepage article section.
- Dynamic `/sitemap.xml` (homepage + published articles, `lastmod` from the
  record) and `/robots.txt` (`Disallow: /_/`, `Disallow: /api/`).
- Contact form guard: `kvkk_consent` is required server-side, `consent_at`,
  `source` and `page` are recorded, and client-supplied `status` is ignored.
- Rate limiting enabled in PocketBase (auth, create, global API) plus a
  dedicated `contact_messages:create` bucket.
- Helper scripts: `pocketbase-serve.sh`, `pocketbase-sync-public.sh`,
  `pocketbase-superuser.sh`, `pocketbase-backup.sh`,
  `pocketbase-rebuild-seo.sh`.
- CI pipeline (`.github/workflows/ci.yml`): JavaScript and shell syntax gates,
  a dependency-free site checker (`.github/ci/check-site.py`) for metadata,
  SSR template markers, local asset integrity and repository hygiene, and a
  throwaway PocketBase E2E job (`.github/ci/pocketbase-e2e.sh`) that verifies
  health, sitemap, robots, SSR pages, the `301` redirect, `404`s and the KVKK
  guard from a clean data directory.
- Production deployment files (`deploy/`): nginx reverse proxy with TLS,
  HSTS and security headers, admin allow-list and per-route rate limits;
  hardened systemd unit for the PocketBase binary; nightly cron backup example.

### Changed

- Site content is hydrated from PocketBase when the API is reachable, with the
  static markup as the fallback, so the pages stay readable if the backend is
  down.
- `site_settings` drives phone, e-mail, address, opening hours, social links
  and default SEO values; editing it regenerates article pages.
- Article URLs are canonical with a trailing slash; relative asset paths in
  generated pages are rewritten to root-absolute ones.

### Fixed

- Article bodies are sanitised on write and again on render with a single
  allow-list tokenizer (`pb_hooks/lib/sanitize.js`) instead of a regex
  blacklist; `iframe`, `object`, `embed`, `style`, `svg`, `srcdoc` and
  `on*`/`javascript:` payloads are dropped.
- Article slugs are validated (`^[a-z0-9]+(?:-[a-z0-9]+)*$`) before they are
  used as directory names, preventing path traversal into `pb_hooks/`.
- The generated article page no longer shows the loading skeleton (a CSS
  `display:flex` rule overrode the `hidden` attribute); the skeleton is
  removed at render time and `[data-ssr="1"]` marks the page.
- Backups and the live data directory are written owner-only (`0700/0600`)
  with `umask 077`.

### Security

- Content-Security-Policy, `Referrer-Policy`, `Permissions-Policy`,
  `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff` on all public
  responses; HSTS whenever the request arrives over TLS.
- Admin panel (`/_/`) and superuser endpoints kept off the public surface:
  loopback bind, `X-Robots-Tag: noindex`, and an nginx IP allow-list plus
  dedicated rate limits in the reference deployment.
- No secrets in the repository: `.env*`, `pb_data/`, `pb_public/`, `backups/`
  and the PocketBase binary are ignored, and CI rejects tracked private keys
  or runtime data.

### Known limitations

- Real domain, NAP data, team identities, statistics and the full KVKK
  disclosure text still have to be supplied by the client; placeholders are
  labelled as such in the admin panel and in the site code.
- Unknown paths are answered by the homepage (`indexFallback` is on) unless
  PocketBase is started with `--indexFallback=false`; enable it to avoid soft
  404s once the site goes live.
- Article covers stored as external URLs keep an external dependency; upload
  them to the `cover` file field to remove it.

[0.1.0]: https://github.com/talhayksk/ulucinar-hukuk/releases/tag/v0.1.0
