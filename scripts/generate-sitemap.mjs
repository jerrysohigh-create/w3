import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function collectHtml(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if ([".git", "node_modules", "tc"].includes(entry.name) && directory === root) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtml(absolute));
    else if (entry.name.endsWith(".html")) files.push(absolute);
  }
  return files;
}

function readTag(html, pattern) {
  return html.match(pattern)?.[1] || "";
}

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

const routes = new Map();
for (const englishFile of await collectHtml(root)) {
  if (englishFile.startsWith(path.join(root, "tc") + path.sep)) continue;
  const relative = path.relative(root, englishFile);
  if (relative.replaceAll("\\", "/") === "404.html") continue;
  const traditionalFile = path.join(root, "tc", relative);
  let traditional;
  try { traditional = await fs.readFile(traditionalFile, "utf8"); }
  catch { continue; }
  const english = await fs.readFile(englishFile, "utf8");
  const enUrl = readTag(english, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  const tcUrl = readTag(traditional, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  if (!enUrl || !tcUrl || routes.has(enUrl)) continue;
  const modified = readTag(english, /"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})/i);
  routes.set(enUrl, { enUrl, tcUrl, modified });
}

function urlEntry(location, route) {
  const lastmod = route.modified ? `\n    <lastmod>${route.modified}</lastmod>` : "";
  return `  <url>\n    <loc>${escapeXml(location)}</loc>${lastmod}\n    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(route.enUrl)}" />\n    <xhtml:link rel="alternate" hreflang="zh-Hant" href="${escapeXml(route.tcUrl)}" />\n    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(route.enUrl)}" />\n  </url>`;
}

const entries = [];
for (const route of routes.values()) {
  entries.push(urlEntry(route.enUrl, route));
  entries.push(urlEntry(route.tcUrl, route));
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join("\n")}\n</urlset>\n`;
await fs.writeFile(path.join(root, "sitemap.xml"), sitemap, "utf8");
console.log(`Sitemap generated: ${routes.size} route pairs / ${entries.length} URLs.`);
