// Allow-list sanitizer regression checks (no framework, run with node).
//   node scripts/test-sanitizer.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(here, "..", "pocketbase", "pb_hooks", "lib", "sanitize.js"), "utf8");
const mod = { exports: {} };
new Function("module", "exports", source)(mod, mod.exports);
const { sanitizeBody, validateSlug } = mod.exports;

let failures = 0;
function check(name, actual, expected) {
  const ok = actual === expected;
  if (!ok) {
    failures++;
    console.error(`FAIL ${name}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`);
  } else {
    console.log(`ok   ${name}`);
  }
}
function keepsTail(name, input, tail = "TAIL") {
  const out = sanitizeBody(input);
  check(name, out.includes(tail), true);
  if (/<(svg|iframe|script|style|object|embed|math)/i.test(out)) {
    failures++;
    console.error(`FAIL ${name}: forbidden tag survived -> ${out}`);
  }
}

// N-01: self-closing and dropped tags must not swallow the rest of the body.
keepsTail("N-01 <svg/>TAIL", "<svg/>TAIL");
keepsTail("N-01 <iframe/>TAIL", "<iframe/>TAIL");
keepsTail("N-01 <script/>TAIL", "<script/>TAIL");
keepsTail("N-01 <style/>TAIL", "<style/>TAIL");
keepsTail("N-01 <math/>TAIL", "<math/>TAIL");
keepsTail("N-01 <div/>TAIL", "<div/>TAIL");
keepsTail("N-01 <svg>inner</svg>TAIL", "<svg>inner</svg>TAIL");
keepsTail("N-01 <script>alert(1)</script>TAIL", "<script>alert(1)</script>TAIL");
check("N-01 trailing paragraph kept", sanitizeBody("<svg/></svg><p>TAIL</p>"), "<p>TAIL</p>");

// Stored-XSS payloads from the security review.
const payloads = {
  "iframe srcdoc": '<iframe srcdoc="&lt;script&gt;alert(1)&lt;/script&gt;"></iframe>',
  "unquoted javascript": "<a href=javascript:alert(1)>x</a>",
  "entity javascript": '<a href="java&#115;cript:alert(1)">x</a>',
  "svg onload": "<svg/onload=alert(1)>",
  "img onerror": "<img src=x onerror=alert(1)>",
  "style import": '<style>@import "evil.css";</style>',
  "math": '<math><mi xlink:href="javascript:alert(1)">x</mi></math>',
};
for (const [name, payload] of Object.entries(payloads)) {
  const out = sanitizeBody(payload);
  const unsafe = /<script|<iframe|<object|<embed|<style|<svg|<math|javascript:|srcdoc|onerror|onload/i.test(out);
  check("payload safe: " + name, unsafe, false);
}

check("attributes stripped", sanitizeBody('<p style="color:red" class="x" id="y">t</p>'), "<p>t</p>");
check("div wrapper keeps text", sanitizeBody('<div onclick="alert(1)">div text</div>'), "div text");
check("safe link kept", sanitizeBody('<a href="https://example.com">x</a>'), '<a href="https://example.com" rel="noopener noreferrer">x</a>');
check("proto-relative rejected", sanitizeBody('<a href="//evil.example">x</a>'), "<a>x</a>");
check("mailto kept", sanitizeBody('<a href="mailto:a@b.c">m</a>'), '<a href="mailto:a@b.c">m</a>');

const article = "<h2>Başlık</h2><p>Metin</p><ul><li>bir</li></ul><blockquote>alıntı</blockquote>";
check("article markup kept", sanitizeBody(article), article);
check("idempotent", sanitizeBody(sanitizeBody(article)), article);
check("broken tag escaped", sanitizeBody("a < b"), "a &lt; b");

for (const slug of ["aile-hukuku", "goc-hukuku", "a1-b2"]) {
  check("slug ok: " + slug, validateSlug(slug), true);
}
for (const slug of ["../x", "a/b", "Aile", "a--b", "-a", "a-", "", "a b"]) {
  check("slug rejected: " + JSON.stringify(slug), validateSlug(slug), false);
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
