import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const baseUrl = "https://w3.magne.ai";
const defaultDescription = "W3.MAGNE.AI 为 AI Agent 提供身份、策略、受控执行、支付与可验证收据。";
const defaultImage = `${baseUrl}/assets/images/og/w3-system-card.svg`;
const mediaDimensions = new Map([
  ["assets/media-kit/logos/magne-logo-white-horizontal.png", [1210, 116]],
  ["assets/media-kit/logos/magne-logo-composite-black-wide.png", [1181, 116]],
  ["assets/media-kit/logos/06-logo-white-wide.png", [3962, 769]],
  ["assets/media-kit/logos/04-logo-black-wide.png", [3962, 768]],
  ["assets/media-kit/logos/01-logo-variant.png", [799, 769]],
  ["assets/media-kit/logos/02-logo-variant.png", [800, 769]],
  ["assets/media-kit/logos/03-logo-variant.png", [877, 769]],
  ["assets/media-kit/logos/28-logo-variant.png", [877, 769]],
  ["assets/media-kit/ms2/ms2-icon-3d.png", [2048, 2048]],
  ["assets/media-kit/ms2/ms2-icon-vector.svg", [1024, 1024]],
  ["assets/media-kit/ms2/ms2-wordmark.png", [1143, 292]],
  ["assets/media-kit/ms2/ms2-logo-horizontal.png", [1354, 495]],
  ["assets/media-kit/guides/color-guide.png", [2520, 1887]],
  ["assets/media-kit/guides/logo-concept.png", [2526, 1896]],
  ["assets/media-kit/guides/brand-identity.png", [2535, 1893]],
  ["assets/media-kit/products/phone-black.png", [2314, 1724]],
  ["assets/media-kit/products/phone-white.png", [2314, 1724]],
  ["assets/media-kit/products/pkg-exploded-new.png", [2022, 3240]]
]);

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(path));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}

function escapeAttribute(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function matchContent(html, pattern, fallback = "") {
  const match = html.match(pattern);
  return match ? match[1].trim() : fallback;
}

function canonicalFor(relativePath) {
  if (relativePath === "index.html") return `${baseUrl}/`;
  if (relativePath === "newsroom.html") return `${baseUrl}/newsroom/`;
  if (relativePath.endsWith("/index.html")) return `${baseUrl}/${relativePath.slice(0, -"index.html".length)}`;
  return `${baseUrl}/${relativePath}`;
}

function relativeRoot(relativePath) {
  const directory = dirname(relativePath);
  if (directory === ".") return "";
  return "../".repeat(directory.split("/").length);
}

function insertHead(html, tags) {
  return html.replace(/<\/head>/i, `${tags}\n</head>`);
}

const files = await htmlFiles(root);
let changed = 0;
for (const file of files) {
  const relativePath = relative(root, file).split(sep).join("/");
  let html = await readFile(file, "utf8");
  const original = html;
  const language = relativePath === "media-kit.html" || relativePath === "privacy-policy.html" || relativePath === "magne-contact.html"
    ? "en"
    : (relativePath === "newsroom.html" || relativePath.startsWith("newsroom/")) ? "zh-Hans" : "zh-Hant";
  html = html.replace(/<html\s+lang=["'][^"']+["']/i, `<html lang="${language}"`);

  const title = matchContent(html, /<title>([^<]+)<\/title>/i, "W3.MAGNE.AI");
  const description = matchContent(html, /<meta\s+name=["']description["']\s+content=["']([^"']*)["'][^>]*>/i, defaultDescription);
  const canonical = canonicalFor(relativePath);
  const rootPrefix = relativeRoot(relativePath);
  const tags = [];

  if (relativePath === "404.html") {
    if (!/<meta\s+name=["']robots["']/i.test(html)) tags.push('  <meta name="robots" content="noindex,follow" />');
  } else if (!/<link\s+rel=["']canonical["']/i.test(html)) {
    tags.push(`  <link rel="canonical" href="${canonical}" />`);
  }
  if (!/<meta\s+property=["']og:type["']/i.test(html)) tags.push(`  <meta property="og:type" content="${relativePath.includes("/article/") ? "article" : "website"}" />`);
  if (!/<meta\s+property=["']og:title["']/i.test(html)) tags.push(`  <meta property="og:title" content="${escapeAttribute(title)}" />`);
  if (!/<meta\s+property=["']og:description["']/i.test(html)) tags.push(`  <meta property="og:description" content="${escapeAttribute(description)}" />`);
  if (!/<meta\s+property=["']og:image["']/i.test(html)) tags.push(`  <meta property="og:image" content="${defaultImage}" />`);
  if (!/<meta\s+property=["']og:url["']/i.test(html) && relativePath !== "404.html") tags.push(`  <meta property="og:url" content="${canonical}" />`);
  if (!/<meta\s+name=["']twitter:card["']/i.test(html)) tags.push('  <meta name="twitter:card" content="summary_large_image" />');
  if (!/<meta\s+name=["']theme-color["']/i.test(html)) tags.push('  <meta name="theme-color" content="#0a0a0c" />');
  if (!/<link\s+rel=["']icon["']/i.test(html)) tags.push(`  <link rel="icon" href="${rootPrefix}assets/images/brand/w3-mark.svg" type="image/svg+xml" />`);
  if (!/<link\s+rel=["']manifest["']/i.test(html)) tags.push(`  <link rel="manifest" href="${rootPrefix}manifest.webmanifest" />`);
  if (tags.length) html = insertHead(html, tags.join("\n"));

  const scripts = [];
  if (!/assets\/js\/season-status\.js/i.test(html)) scripts.push(`<script src="${rootPrefix}assets/js/season-status.js?v=20260821-1"></script>`);
  if (!/assets\/js\/analytics\.js/i.test(html)) scripts.push(`<script src="${rootPrefix}assets/js/analytics.js?v=20260821-1"></script>`);
  if (scripts.length) html = html.replace(/<\/body>/i, `${scripts.join("\n")}\n</body>`);

  if (relativePath === "media-kit.html") {
    html = html.replace(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi, function (tag, src) {
      var size = mediaDimensions.get(src);
      if (!size) return tag;
      var next = tag;
      if (!/\bloading=/.test(next)) next = next.replace(/\s*\/>$/, ' loading="lazy" />');
      if (!/\bwidth=/.test(next)) next = next.replace(/\s*\/>$/, ` width="${size[0]}" height="${size[1]}" />`);
      return next;
    });
  }

  html = html
    .replace(/assets\/css\/site\.css\?v=[^"']+/g, "assets/css/site.css?v=20260821-19")
    .replace(/assets\/js\/site\.js\?v=[^"']+/g, "assets/js/site.js?v=20260821-11")
    .replace(/assets\/js\/season-2\.js\?v=[^"']+/g, "assets/js/season-2.js?v=20260821-2")
    .replace(/assets\/js\/seasons\.js\?v=[^"']+/g, "assets/js/seasons.js?v=20260821-1")
    .replace(/assets\/js\/newsroom-pages\.js\?v=[^"']+/g, "assets/js/newsroom-pages.js?v=20260821-1");

  if (html !== original) {
    await writeFile(file, html, "utf8");
    changed += 1;
  }
}

console.log(`[meta] normalized ${changed}/${files.length} HTML files`);
