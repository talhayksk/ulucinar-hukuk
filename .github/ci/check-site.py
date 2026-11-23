#!/usr/bin/env python3
"""Static site gate for the ULUÇINAR Hukuk site.

Runs without any dependency (python3 stdlib only) so it behaves the same on a
developer machine and in GitHub Actions. It does not need PocketBase: it only
inspects the files that go into pb_public.

Hard checks (always fail the build):
  * every root HTML page has a non-empty title, description, absolute canonical
    and og:image; <html lang="tr">
  * makale.html still carries the 13 SSR template markers required by
    pocketbase/pb_hooks/lib/seo.js (removing one silently stops page
    generation - the hook aborts instead)
  * every local href/src/url() reference resolves to a file on disk
  * self-hosted font files referenced by assets/fonts/fonts.css exist and are
    non-trivial in size
  * assets/img and assets/fonts are present and populated
  * probe.html is gone; runtime data (pb_data, pb_public, backups), the
    PocketBase binary and .env files are not tracked by git
  * no private key material in tracked text files

Advisory checks (warnings; promoted to errors with --release-gate):
  * no Google Fonts / images.unsplash.com references in HTML (O-05, still open)
  * no ?pb= API-base override in assets/js/pb.js (Y-02, still open)
  * SITE_CONFIG.contactEndpoint is set to the same-origin API (Y-03, still open)

Usage:
  python3 .github/ci/check-site.py
  python3 .github/ci/check-site.py --release-gate
  python3 .github/ci/check-site.py --root . --summary-file "$GITHUB_STEP_SUMMARY"
"""

from __future__ import annotations

import argparse
import html
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

EXTERNAL_HOSTS = (
    "fonts.googleapis.com",
    "fonts.gstatic.com",
    "images.unsplash.com",
)

# Pages that are part of the product. lawyer_sablon.html is a gitignored
# reference file and is intentionally not checked.
HTML_EXCLUDE = {"lawyer_sablon.html"}

# Required by pocketbase/pb_hooks/lib/seo.js (template contract). If one is
# missing, article generation aborts: keep this list in sync with the hook.
SSR_MARKERS = (
    "<title>",
    'rel="canonical"',
    'id="articleJsonLd"',
    'id="articleTitle"',
    'id="articleMeta"',
    'id="articleCrumb"',
    'id="articleCategory"',
    'id="articleCoverWrap"',
    'id="articleCover"',
    'id="articleContent"',
    'id="articleLoading"',
    'id="articleBody"></div>',
    "data-article-page",
)

REQUIRED_FILES = (
    "index.html",
    "makale.html",
    "assets/css/style.css",
    "assets/js/config.js",
    "assets/js/main.js",
    "assets/js/pb.js",
    "assets/js/content.js",
    "assets/fonts/fonts.css",
    "assets/logo/ulucinar-gold.svg",
    "assets/logo/ulucinar-gold.png",
    "assets/logo/favicon.svg",
    "assets/logo/apple-touch-icon.png",
)

FORBIDDEN_TRACKED = re.compile(
    r"(^|/)("
    r"pb_data/|pb_public/|backups/|"
    r"\.env($|\.)|"
    r"pocketbase/pocketbase$|"
    r"lawyer_sablon\.html$|"
    r"probe\.html$"
    r")"
)

PRIVATE_KEY_RE = re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----")
MAX_SCAN_BYTES = 1_000_000


@dataclass
class Report:
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    passed: list[str] = field(default_factory=list)

    def error(self, msg: str) -> None:
        self.errors.append(msg)

    def warn(self, msg: str) -> None:
        self.warnings.append(msg)

    def ok(self, msg: str) -> None:
        self.passed.append(msg)


def annotate(level: str, message: str) -> None:
    """Emit a GitHub Actions annotation when running inside Actions."""
    if not os.environ.get("GITHUB_ACTIONS"):
        return
    message = message.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
    print(f"::{level}::{message}")


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def attr_value(tag: str, attr: str) -> str:
    match = re.search(rf'\b{attr}\s*=\s*"([^"]*)"', tag)
    if match:
        return html.unescape(match.group(1))
    match = re.search(rf"\b{attr}\s*=\s*'([^']*)'", tag)
    return html.unescape(match.group(1)) if match else ""


def check_meta(report: Report, root: Path, page: Path) -> None:
    text = read_text(page)
    name = page.name
    lower = text.lower()

    if 'lang="tr"' not in lower:
        report.error(f"{name}: <html lang=\"tr\"> is missing")

    titles = re.findall(r"<title[^>]*>(.*?)</title>", text, re.S | re.I)
    if not titles or not titles[0].strip():
        report.error(f"{name}: <title> is missing or empty")
    else:
        title = html.unescape(titles[0].strip())
        if not 10 <= len(title) <= 120:
            report.warn(f"{name}: <title> length is {len(title)} (expected 10-120)")

    desc = re.findall(r"<meta\b[^>]*name=[\"']description[\"'][^>]*>", text, re.I)
    if not desc or not attr_value(desc[0], "content").strip():
        report.error(f"{name}: meta description is missing or empty")

    canonical = re.findall(r"<link\b[^>]*rel=[\"']canonical[\"'][^>]*>", text, re.I)
    if not canonical:
        report.error(f"{name}: canonical link is missing")
    else:
        href = attr_value(canonical[0], "href")
        if not href.startswith(("https://", "http://")):
            report.error(f"{name}: canonical must be absolute, got {href!r}")
        elif not href.startswith("https://"):
            report.warn(f"{name}: canonical is not https ({href})")

    og_image = re.findall(r"<meta\b[^>]*property=[\"']og:image[\"'][^>]*>", text, re.I)
    if not og_image or not attr_value(og_image[0], "content").strip():
        report.error(f"{name}: og:image is missing or empty")
    elif not attr_value(og_image[0], "content").startswith(("https://", "http://")):
        report.warn(
            f"{name}: og:image is relative - social crawlers expect an absolute URL"
        )

    h1_count = len(re.findall(r"<h1\b", text, re.I))
    if h1_count != 1:
        report.warn(f"{name}: expected exactly one <h1>, found {h1_count}")

    report.ok(f"{name}: title/description/canonical/og:image present")


def check_markers(report: Report, root: Path) -> None:
    page = root / "makale.html"
    if not page.is_file():
        report.error("makale.html is missing")
        return
    text = read_text(page)
    missing = [marker for marker in SSR_MARKERS if marker not in text]
    if missing:
        for marker in missing:
            report.error(
                "makale.html: SSR marker missing -> article generation would abort: "
                + marker
            )
    else:
        report.ok(f"makale.html: all {len(SSR_MARKERS)} SSR markers present")


def collect_refs(text: str) -> list[str]:
    refs: list[str] = []
    # (?<![-\w]) keeps data-pb-href="instagram" style markers out of the scan.
    for match in re.finditer(
        r"(?<![-\w])(?:href|src|poster)\s*=\s*[\"']([^\"']+)[\"']", text, re.I
    ):
        refs.append(match.group(1))
    for match in re.finditer(r"(?<![-\w])srcset\s*=\s*[\"']([^\"']+)[\"']", text, re.I):
        for candidate in match.group(1).split(","):
            url = candidate.strip().split(" ")[0]
            if url:
                refs.append(url)
    return refs


def resolve_local(ref: str, base_dir: Path) -> Path | None:
    """Return the on-disk path for a local reference, or None if remote/special."""
    if ref.startswith(("http://", "https://", "//", "data:", "mailto:", "tel:", "#", "javascript:")):
        return None
    if not ref:
        return None
    path = ref.split("#", 1)[0].split("?", 1)[0]
    if not path:
        return None
    if path.startswith("/"):
        return None  # root-absolute: generated pages only, not verifiable here
    return (base_dir / path).resolve()


def check_local_refs(report: Report, root: Path, page: Path) -> None:
    text = read_text(page)
    missing: list[str] = []
    for ref in collect_refs(text):
        target = resolve_local(ref, root)
        if target is None:
            continue
        if not target.exists():
            missing.append(ref)
    if missing:
        unique = sorted(set(missing))
        # One annotation with a short list; the full list stays on stdout.
        preview = ", ".join(unique[:8]) + (f" (+{len(unique) - 8} more)" if len(unique) > 8 else "")
        report.error(
            f"{page.name}: {len(unique)} broken local reference(s): {preview}"
        )
        for ref in unique:
            print(f"      missing: {ref}")
    else:
        report.ok(f"{page.name}: local asset references resolve")


def check_fonts(report: Report, root: Path) -> None:
    fonts_css = root / "assets/fonts/fonts.css"
    if not fonts_css.is_file():
        report.error("assets/fonts/fonts.css is missing")
        return
    css = read_text(fonts_css)
    refs = re.findall(r"url\(([^)]+)\)", css)
    if not refs:
        report.error("assets/fonts/fonts.css: no @font-face source found")
        return
    for ref in refs:
        name = ref.strip().strip("'\"")
        if name.startswith(("http://", "https://", "data:")):
            report.error(f"assets/fonts/fonts.css: remote font source not allowed: {name}")
            continue
        target = (fonts_css.parent / name).resolve()
        if not target.is_file():
            report.error(f"assets/fonts/fonts.css: missing font file {name}")
        elif target.stat().st_size < 10_000:
            report.error(f"assets/fonts/{name}: suspiciously small ({target.stat().st_size} bytes)")
    report.ok(f"assets/fonts: {len(refs)} font file(s) verified")


def check_asset_dirs(report: Report, root: Path) -> None:
    img = root / "assets/img"
    if not img.is_dir():
        report.error("assets/img directory is missing")
    else:
        images = [p for p in img.iterdir() if p.suffix.lower() in {".webp", ".jpg", ".jpeg", ".png", ".avif"}]
        if not images:
            report.error("assets/img is empty - self-hosted images are required")
        else:
            remote_only = not any(
                "assets/img/" in read_text(page)
                for page in root.glob("*.html")
                if page.name not in HTML_EXCLUDE
            )
            if remote_only:
                report.warn(
                    f"assets/img has {len(images)} file(s) but no HTML page uses them yet (O-05)"
                )
            report.ok(f"assets/img: {len(images)} image(s) present")

    for required in REQUIRED_FILES:
        if not (root / required).is_file():
            report.error(f"required file is missing: {required}")


def check_forbidden(report: Report, root: Path) -> None:
    for name in ("probe.html",):
        if (root / name).exists():
            report.error(f"{name} must not exist in the repository (D-01)")
    report.ok("probe.html absent")


def check_tracked_files(report: Report, root: Path) -> None:
    try:
        out = subprocess.run(
            ["git", "ls-files", "-z"],
            cwd=root,
            capture_output=True,
            check=True,
        ).stdout
    except (OSError, subprocess.CalledProcessError):
        report.warn("git metadata unavailable; skipped tracked-file checks")
        return

    tracked = [p for p in out.decode("utf-8", "replace").split("\0") if p]
    bad = [p for p in tracked if FORBIDDEN_TRACKED.search(p)]
    for path in bad:
        report.error(f"tracked file must be ignored by git (runtime data/secret): {path}")
    if not bad:
        report.ok(f"git: {len(tracked)} tracked file(s), no runtime data or binary")

    for path in tracked:
        full = root / path
        try:
            if not full.is_file() or full.stat().st_size > MAX_SCAN_BYTES:
                continue
            data = full.read_bytes()
        except OSError:
            continue
        if b"\0" in data[:1024]:
            continue
        if PRIVATE_KEY_RE.search(data.decode("utf-8", "ignore")):
            report.error(f"private key material found in tracked file: {path}")


def check_external_refs(report: Report, root: Path, release_gate: bool) -> None:
    offenders: list[str] = []
    for page in sorted(root.glob("*.html")):
        if page.name in HTML_EXCLUDE:
            continue
        text = read_text(page)
        counts = {host: text.count(host) for host in EXTERNAL_HOSTS if host in text}
        for host, count in counts.items():
            offenders.append(f"{page.name}: {count}x {host}")
    if offenders:
        detail = "; ".join(offenders)
        message = (
            "third-party font/image CDN references in HTML (O-05 open): "
            + detail
            + " - self-host assets/fonts + assets/img before release"
        )
        if release_gate:
            report.error(message)
        else:
            report.warn(message)
    else:
        report.ok("no Google Fonts / Unsplash references in HTML")


def check_client_security(report: Report, root: Path, release_gate: bool) -> None:
    pb_js = root / "assets/js/pb.js"
    if pb_js.is_file() and re.search(r'get\(\s*["\']pb["\']\s*\)', read_text(pb_js)):
        message = (
            "assets/js/pb.js still honours ?pb= (Y-02 high: content spoofing) - "
            "restrict it to localhost or remove it"
        )
        if release_gate:
            report.error(message)
        else:
            report.warn(message)
    else:
        report.ok("assets/js/pb.js: no ?pb= override")

    config_js = root / "assets/js/config.js"
    if config_js.is_file():
        match = re.search(r"contactEndpoint\s*:\s*([\"'])(.*?)\1", read_text(config_js))
        if match and not match.group(2).strip():
            message = (
                "assets/js/config.js: contactEndpoint is empty (Y-03 / KVKK consent) - "
                "set it to /api/collections/contact_messages/records"
            )
            if release_gate:
                report.error(message)
            else:
                report.warn(message)
        else:
            report.ok("assets/js/config.js: contactEndpoint configured")


def write_summary(path: str | None, report: Report, release_gate: bool) -> None:
    if not path:
        return
    lines = [
        "## Site checks",
        "",
        f"- mode: `{'release-gate' if release_gate else 'advisory'}`",
        f"- passed: {len(report.passed)}",
        f"- warnings: {len(report.warnings)}",
        f"- errors: {len(report.errors)}",
        "",
    ]
    if report.errors:
        lines += ["### Errors", ""] + [f"- {e}" for e in report.errors] + [""]
    if report.warnings:
        lines += ["### Warnings", ""] + [f"- {w}" for w in report.warnings] + [""]
    try:
        with open(path, "a", encoding="utf-8") as handle:
            handle.write("\n".join(lines) + "\n")
    except OSError:
        pass


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root",
        default=".",
        help="repository root (default: current directory)",
    )
    parser.add_argument(
        "--release-gate",
        action="store_true",
        help="promote release blockers from warnings to errors",
    )
    parser.add_argument(
        "--summary-file",
        default=os.environ.get("GITHUB_STEP_SUMMARY"),
        help="append a markdown summary to this file",
    )
    args = parser.parse_args()

    root = Path(args.root).resolve()
    report = Report()

    for required in ("index.html", "makale.html"):
        if not (root / required).is_file():
            report.error(f"required page is missing: {required}")

    pages = [p for p in sorted(root.glob("*.html")) if p.name not in HTML_EXCLUDE]
    for page in pages:
        check_meta(report, root, page)
        check_local_refs(report, root, page)

    check_markers(report, root)
    check_fonts(report, root)
    check_asset_dirs(report, root)
    check_forbidden(report, root)
    check_tracked_files(report, root)
    check_external_refs(report, root, args.release_gate)
    check_client_security(report, root, args.release_gate)

    for message in report.passed:
        print(f"ok    {message}")
    for message in report.warnings:
        print(f"warn  {message}")
        annotate("warning", message)
    for message in report.errors:
        print(f"ERROR {message}")
        annotate("error", message)

    write_summary(args.summary_file, report, args.release_gate)

    print()
    print(
        f"summary: {len(report.passed)} passed, "
        f"{len(report.warnings)} warning(s), {len(report.errors)} error(s)"
    )
    if args.release_gate:
        print("mode: release-gate (release blockers are errors)")
    else:
        print("mode: advisory (release blockers are warnings)")
    return 1 if report.errors else 0


if __name__ == "__main__":
    sys.exit(main())
