// Allow-list HTML sanitizer and slug validation for the PocketBase hooks.
//
// Content editors may paste arbitrary HTML into article bodies. Instead of a
// regex blocklist (bypassable), the markup is re-serialized from a small
// allow-list: unknown tags are dropped, attributes are dropped unless listed,
// and URLs must use a safe scheme.

var ALLOWED_TAGS = {
  p: 1, br: 1, h2: 1, h3: 1, h4: 1, ul: 1, ol: 1, li: 1, blockquote: 1,
  strong: 1, b: 1, em: 1, i: 1, a: 1, img: 1, figure: 1, figcaption: 1,
  hr: 1, table: 1, thead: 1, tbody: 1, tr: 1, th: 1, td: 1, code: 1, pre: 1,
};

var VOID_TAGS = { br: 1, hr: 1, img: 1 };

// Dropped together with their inner content.
var DROP_WITH_CONTENT = {
  script: 1, style: 1, iframe: 1, object: 1, embed: 1, svg: 1, math: 1,
  form: 1, textarea: 1, select: 1, option: 1, button: 1, template: 1,
  noscript: 1, title: 1, base: 1, video: 1, audio: 1, picture: 1, canvas: 1,
  applet: 1, frame: 1, frameset: 1, slot: 1, portal: 1,
};

// Dropped tag only (no meaningful inner content allowed anyway).
var VOID_DROP = {
  input: 1, link: 1, meta: 1, source: 1, track: 1, param: 1, area: 1,
  col: 1, wbr: 1, keygen: 1, menuitem: 1,
};

var ALLOWED_ATTRS = {
  a: { href: 1, title: 1 },
  img: { src: 1, alt: 1, width: 1, height: 1, loading: 1, decoding: 1 },
  th: { colspan: 1, rowspan: 1 },
  td: { colspan: 1, rowspan: 1 },
};

var NUMERIC_ATTRS = { width: 1, height: 1, colspan: 1, rowspan: 1 };

var NAMED_ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  colon: ":", tab: "\t", newline: "\n", sol: "/", comma: ",",
};

/* ------------------------------------------------------------------ *
 * Escaping / decoding
 * ------------------------------------------------------------------ */

function escapeText(value) {
  return String(value == null ? "" : value)
    .replace(/&(?!(?:#\d{1,7}|#x[0-9a-fA-F]{1,6}|[a-zA-Z][a-zA-Z0-9]{1,31});)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value) {
  return String(value == null ? "" : value)
    .replace(/&(?!(?:#\d{1,7}|#x[0-9a-fA-F]{1,6}|[a-zA-Z][a-zA-Z0-9]{1,31});)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeCodePoint(code) {
  if (!isFinite(code) || code <= 0 || code > 1114111) {
    return "";
  }
  try {
    return String.fromCodePoint(code);
  } catch (err) {
    return "";
  }
}

// Used only for validation, never for output.
function decodeEntities(value) {
  return String(value == null ? "" : value)
    .replace(/&#x([0-9a-fA-F]+);?/g, function (match, hex) {
      return safeCodePoint(parseInt(hex, 16));
    })
    .replace(/&#(\d+);?/g, function (match, dec) {
      return safeCodePoint(parseInt(dec, 10));
    })
    .replace(/&([a-zA-Z][a-zA-Z0-9]{1,31});/g, function (match, name) {
      var key = name.toLowerCase();
      return NAMED_ENTITIES[key] !== undefined ? NAMED_ENTITIES[key] : match;
    });
}

/* ------------------------------------------------------------------ *
 * URLs
 * ------------------------------------------------------------------ */

// Schemes allowed in href/src. Everything else (javascript:, data:, vbscript:,
// protocol-relative //host) is rejected, including entity/whitespace obfuscation.
function isSafeUrl(value) {
  var raw = decodeEntities(value);
  var normalized = String(raw)
    .replace(/[\u0000-\u0020\u007f-\u009f]/g, "")
    .toLowerCase();

  if (!normalized) {
    return false;
  }
  if (
    normalized.indexOf("javascript:") === 0 ||
    normalized.indexOf("data:") === 0 ||
    normalized.indexOf("vbscript:") === 0 ||
    normalized.indexOf("file:") === 0
  ) {
    return false;
  }
  if (normalized.indexOf("//") === 0) {
    return false;
  }
  return (
    normalized.indexOf("https://") === 0 ||
    normalized.indexOf("http://") === 0 ||
    normalized.indexOf("/") === 0 ||
    normalized.indexOf("#") === 0 ||
    normalized.indexOf("mailto:") === 0
  );
}

/* ------------------------------------------------------------------ *
 * Tokenizer helpers
 * ------------------------------------------------------------------ */

// Index of the closing ">" that is not inside an attribute value, or -1.
function findTagEnd(html, start) {
  var quote = "";
  for (var i = start + 1; i < html.length; i++) {
    var ch = html.charAt(i);
    if (quote) {
      if (ch === quote) {
        quote = "";
      }
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === ">") {
      return i;
    }
  }
  return -1;
}

function toTagName(raw) {
  var match = String(raw).match(/^\s*\/?\s*([a-zA-Z][a-zA-Z0-9:-]*)/);
  return match ? match[1].toLowerCase() : "";
}

function parseAttributes(raw) {
  var attrs = [];
  var re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'<>`]+)))?/g;
  var match;
  while ((match = re.exec(raw))) {
    var value = "";
    if (match[3] !== undefined) {
      value = match[3];
    } else if (match[4] !== undefined) {
      value = match[4];
    } else if (match[5] !== undefined) {
      value = match[5];
    }
    attrs.push({ name: match[1].toLowerCase(), value: value });
  }
  return attrs;
}

function renderOpenTag(name, rawAttrs) {
  var attrs = parseAttributes(rawAttrs);
  var allowed = ALLOWED_ATTRS[name] || {};
  var out = "<" + name;
  var hrefValue = null;

  for (var i = 0; i < attrs.length; i++) {
    var attr = attrs[i];
    if (!allowed[attr.name]) {
      continue;
    }
    if ((attr.name === "href" || attr.name === "src") && !isSafeUrl(attr.value)) {
      continue;
    }
    if (NUMERIC_ATTRS[attr.name]) {
      var num = String(attr.value).replace(/[^\d]/g, "");
      if (!num || num.length > 5) {
        continue;
      }
      out += " " + attr.name + '="' + num + '"';
      continue;
    }
    if (attr.name === "href") {
      hrefValue = attr.value;
    }
    out += " " + attr.name + '="' + escapeAttr(attr.value) + '"';
  }

  // External links open in the same tab; never leak the opener.
  if (name === "a" && hrefValue && /^\s*https?:\/\//i.test(decodeEntities(hrefValue))) {
    out += ' rel="noopener noreferrer"';
  }

  return out + ">";
}

function skipElementContent(html, from, name) {
  // Returns the index just after the matching closing tag (or end of string).
  var openRe = new RegExp("<" + name + "\\b", "gi");
  var closeRe = new RegExp("</" + name + "\\s*>", "gi");
  var depth = 1;
  var cursor = from;

  while (depth > 0) {
    closeRe.lastIndex = cursor;
    var close = closeRe.exec(html);
    if (!close) {
      return html.length;
    }
    openRe.lastIndex = cursor;
    var open = openRe.exec(html);
    while (open && open.index < close.index) {
      depth++;
      cursor = open.index + 1;
      openRe.lastIndex = cursor;
      open = openRe.exec(html);
    }
    depth--;
    cursor = close.index + close[0].length;
  }
  return cursor;
}

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */

function sanitizeBody(input) {
  var html = String(input == null ? "" : input);
  var out = "";
  var i = 0;

  while (i < html.length) {
    var lt = html.indexOf("<", i);
    if (lt === -1) {
      out += escapeText(html.slice(i));
      break;
    }
    out += escapeText(html.slice(i, lt));

    // Comments, CDATA and processing instructions are removed entirely.
    if (html.substr(lt, 4) === "<!--") {
      var commentEnd = html.indexOf("-->", lt + 4);
      i = commentEnd === -1 ? html.length : commentEnd + 3;
      continue;
    }
    if (html.substr(lt, 9).toUpperCase() === "<![CDATA[") {
      var cdataEnd = html.indexOf("]]>", lt + 9);
      i = cdataEnd === -1 ? html.length : cdataEnd + 3;
      continue;
    }
    if (html.charAt(lt + 1) === "?" || html.charAt(lt + 1) === "!") {
      var declEnd = html.indexOf(">", lt);
      i = declEnd === -1 ? html.length : declEnd + 1;
      continue;
    }

    var isClosing = html.charAt(lt + 1) === "/";
    var gt = findTagEnd(html, lt);
    if (gt === -1) {
      out += "&lt;";
      i = lt + 1;
      continue;
    }

    var raw = html.slice(lt + 1, gt);
    var name = toTagName(raw);
    if (!name) {
      out += "&lt;";
      i = lt + 1;
      continue;
    }

    if (isClosing) {
      if (ALLOWED_TAGS[name] && !VOID_TAGS[name]) {
        out += "</" + name + ">";
      }
      i = gt + 1;
      continue;
    }

    i = gt + 1;
    var selfClosing = /\/\s*$/.test(raw);

    if (DROP_WITH_CONTENT[name]) {
      // "<svg/>TAIL" is a self-closing tag: only the tag is dropped, the
      // following content must be preserved.
      if (!selfClosing) {
        i = skipElementContent(html, i, name);
      }
      continue;
    }
    if (VOID_DROP[name] || !ALLOWED_TAGS[name]) {
      // Unknown/forbidden tag: drop the tag, keep its text content.
      continue;
    }

    var attrsRaw = raw.slice(raw.indexOf(name) + name.length).replace(/\/\s*$/, "");
    out += renderOpenTag(name, attrsRaw);
  }

  return out;
}

// Strict slug: lowercase ASCII words separated by single hyphens.
// Rejects "..", "/", spaces, leading/trailing and doubled hyphens.
function validateSlug(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value == null ? "" : value));
}

module.exports = {
  sanitizeBody: sanitizeBody,
  validateSlug: validateSlug,
  isSafeUrl: isSafeUrl,
  decodeEntities: decodeEntities,
  escapeText: escapeText,
};
