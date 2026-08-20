import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, posix, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = fileURLToPath(new URL("../", import.meta.url));
const tcRoot = join(siteRoot, "tc");
const cachePath = join(siteRoot, "locales", "translation-cache.json");
const han = /[\u3400-\u9fff\uf900-\ufaff]/;
const translatedJs = new Set();
const cache = { en: {}, "zh-TW": {} };

const protectedTerms = [
  "W3.MAGNE.AI", "MAGNE.AI", "M Hash L2", "MAGNE L1", "Phone Gen1", "Season 1", "Season 2",
  "AgentPay", "AI Box", "llama.cpp", "Qwen3.6-35B-A3B", "Q4_K_M", "GGUF", "Web3", "DePIN",
  "MAG1", "MS2", "MHA", "USDT", "DApp", "RPC", "NDA", "GAEA", "MYBW", "W3"
].sort((a, b) => b.length - a.length);

try {
  Object.assign(cache, JSON.parse(await readFile(cachePath, "utf8")));
} catch {}

async function walk(directory, predicate, ignored = new Set()) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(path, predicate, ignored));
    else if (entry.isFile() && predicate(path)) output.push(path);
  }
  return output;
}

function protect(value) {
  const terms = [];
  const escapedTerms = protectedTerms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`https?:\\/\\/[^\\s<>"']+|<[^>]*>|^[^<]*>|<[^>]*$|&[a-zA-Z0-9#]+;|${escapedTerms.join("|")}`, "g");
  const text = value.replace(pattern, function (match) {
    const id = `ZXQ${String(terms.length).padStart(4, "0")}ZXQ`;
    terms.push(match);
    return id;
  });
  return { text, terms };
}

function restore(value, terms) {
  return value.replace(/ZXQ\s*(\d+)\s*ZXQ/g, function (_, index) {
    return terms[Number(index)] ?? _;
  });
}

async function translateBatch(items, target) {
  const protectedItems = items.map(protect);
  const query = protectedItems.map((item, index) => `[[W3SEG${String(index).padStart(4, "0")}]]${item.text}`).join("\n");
  const endpoint = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" + encodeURIComponent(target) + "&dt=t&q=" + encodeURIComponent(query);
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(endpoint, { headers: { "user-agent": "W3-localization-build/1.0" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const translated = payload[0].map((part) => part[0]).join("");
      const matches = [...translated.matchAll(/\[\[W3SEG(\d{4})\]\]/g)];
      if (matches.length !== items.length) throw new Error(`segment mismatch ${matches.length}/${items.length}`);
      return matches.map(function (match, index) {
        const start = match.index + match[0].length;
        const end = matches[index + 1]?.index ?? translated.length;
        return restore(translated.slice(start, end).trim(), protectedItems[index].terms);
      });
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function populateTranslations(values, target) {
  const missing = [...new Set(values.filter((value) => han.test(value) && !cache[target][value]))];
  const batches = [];
  let batch = [];
  let size = 0;
  for (const value of missing) {
    if (batch.length >= 18 || size + value.length > 2600) {
      batches.push(batch);
      batch = [];
      size = 0;
    }
    batch.push(value);
    size += value.length;
  }
  if (batch.length) batches.push(batch);
  let cursor = 0;
  async function worker() {
    while (cursor < batches.length) {
      const index = cursor++;
      const input = batches[index];
      const output = await translateBatch(input, target);
      input.forEach((value, itemIndex) => { cache[target][value] = output[itemIndex]; });
      process.stdout.write(`[i18n:${target}] ${index + 1}/${batches.length}\n`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, batches.length) }, worker));
}

function quotedRanges(code) {
  const ranges = [];
  let i = 0;
  let previous = "";
  while (i < code.length) {
    const char = code[i];
    const next = code[i + 1];
    if (char === "/" && next === "/") {
      i = code.indexOf("\n", i + 2);
      if (i === -1) break;
      previous = "\n";
      continue;
    }
    if (char === "/" && next === "*") {
      const end = code.indexOf("*/", i + 2);
      i = end === -1 ? code.length : end + 2;
      previous = "/";
      continue;
    }
    if (char === "/" && /[({[=,:;!?]|^$/.test(previous)) {
      let j = i + 1;
      let inClass = false;
      for (; j < code.length; j += 1) {
        if (code[j] === "\\") { j += 1; continue; }
        if (code[j] === "[") inClass = true;
        else if (code[j] === "]") inClass = false;
        else if (code[j] === "/" && !inClass) { j += 1; while (/[a-z]/i.test(code[j])) j += 1; break; }
        else if (code[j] === "\n") break;
      }
      i = j;
      previous = "/";
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      const quote = char;
      const start = i;
      i += 1;
      for (; i < code.length; i += 1) {
        if (code[i] === "\\") { i += 1; continue; }
        if (code[i] === quote) break;
      }
      const end = Math.min(i + 1, code.length);
      const raw = code.slice(start + 1, end - 1);
      if (han.test(raw) && !/[<>]/.test(raw) && !(quote === "`" && raw.includes("${"))) {
        let value = raw;
        try { value = Function(`"use strict";return ${code.slice(start, end)}`)(); } catch {}
        ranges.push({ start, end, value: String(value), kind: "quoted" });
      }
      i = end;
      previous = quote;
      continue;
    }
    if (!/\s/.test(char)) previous = char;
    i += 1;
  }
  return ranges;
}

function htmlRanges(html) {
  const ranges = [];
  const masked = [];
  let protectedHtml = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, function (block) {
    const id = `___W3_BLOCK_${masked.length}___`;
    masked.push(block);
    return id;
  });
  const textPattern = />((?:[^<]|<(?![!/a-z]))*?[\u3400-\u9fff\uf900-\ufaff](?:[^<]|<(?![!/a-z]))*?)</gi;
  for (const match of protectedHtml.matchAll(textPattern)) {
    const value = match[1];
    const leading = value.match(/^\s*/)[0].length;
    const trailing = value.match(/\s*$/)[0].length;
    const clean = value.slice(leading, value.length - trailing);
    if (!clean) continue;
    const protectedStart = match.index + 1 + leading;
    let originalStart = protectedStart;
    for (let index = 0; index < masked.length; index += 1) {
      const token = `___W3_BLOCK_${index}___`;
      const tokenAt = protectedHtml.indexOf(token);
      if (tokenAt < protectedStart) originalStart += masked[index].length - token.length;
    }
    ranges.push({ start: originalStart, end: originalStart + clean.length, value: clean, kind: "html" });
  }
  const attributePattern = /\b(?:title|content|aria-label|placeholder|alt)=(['"])([\s\S]*?)\1/gi;
  for (const match of html.matchAll(attributePattern)) {
    if (!han.test(match[2])) continue;
    const valueOffset = match[0].indexOf(match[2]);
    ranges.push({ start: match.index + valueOffset, end: match.index + valueOffset + match[2].length, value: match[2], kind: "attribute" });
  }
  const blockPattern = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(blockPattern)) {
    const bodyOffset = match.index + match[0].indexOf(match[1]);
    quotedRanges(match[1]).forEach((range) => ranges.push({ ...range, start: bodyOffset + range.start, end: bodyOffset + range.end }));
  }
  return ranges.sort((a, b) => a.start - b.start).filter((range, index, all) => index === 0 || range.start >= all[index - 1].end);
}

function collectStrings(content, type) {
  return (type === "html" ? htmlRanges(content) : quotedRanges(content)).map((range) => range.value);
}

function translateContent(content, type, target) {
  const ranges = type === "html" ? htmlRanges(content) : quotedRanges(content);
  for (const range of ranges.sort((a, b) => b.start - a.start)) {
    const translated = cache[target][range.value] || range.value;
    const replacement = range.kind === "quoted" ? JSON.stringify(translated) : translated;
    content = content.slice(0, range.start) + replacement + content.slice(range.end);
  }
  return content;
}

function rootPrefix(relativePath) {
  const directory = posix.dirname(relativePath);
  return directory === "." ? "" : "../".repeat(directory.split("/").length);
}

function routeFor(relativePath, locale) {
  let route = relativePath === "index.html" ? "" : relativePath.endsWith("/index.html") ? relativePath.slice(0, -"index.html".length) : relativePath;
  if (relativePath === "newsroom.html") route = "newsroom/";
  return `https://w3.magne.ai/${locale === "zh-Hant" ? "tc/" : ""}${route}`;
}

function peerFor(relativePath, locale) {
  const ownPath = locale === "zh-Hant" ? posix.join("tc", relativePath) : relativePath;
  const peerPath = locale === "zh-Hant" ? relativePath : posix.join("tc", relativePath);
  return posix.relative(posix.dirname(ownPath), peerPath) || "./";
}

function setBodyLocale(html, locale, relativePath, assetRoot) {
  return html.replace(/<body\b([^>]*)>/i, function (_, attributes) {
    let next = attributes.replace(/\sdata-lang=(['"])[\s\S]*?\1/i, "").replace(/\sdata-locale-peer=(['"])[\s\S]*?\1/i, "").replace(/\sdata-asset-root=(['"])[\s\S]*?\1/i, "");
    next += ` data-lang="${locale}" data-locale-peer="${peerFor(relativePath, locale)}"`;
    if (locale === "zh-Hant") next += ` data-asset-root="${assetRoot}"`;
    return `<body${next}>`;
  });
}

function setHeadLocale(html, locale, relativePath, assetRoot) {
  const own = routeFor(relativePath, locale);
  const en = routeFor(relativePath, "en");
  const tc = routeFor(relativePath, "zh-Hant");
  html = html.replace(/<html\s+lang=(['"])[^'"]+\1/i, `<html lang="${locale}"`);
  html = html.replace(/\s*<link\s+rel=(['"])alternate\1[^>]*>/gi, "");
  if (/<link\s+rel=(['"])canonical\1/i.test(html)) html = html.replace(/<link\s+rel=(['"])canonical\1[^>]*>/i, `<link rel="canonical" href="${own}" />`);
  else html = html.replace(/<\/head>/i, `  <link rel="canonical" href="${own}" />\n</head>`);
  if (/<meta\s+property=(['"])og:url\1/i.test(html)) html = html.replace(/<meta\s+property=(['"])og:url\1\s+content=(['"])[^'"]*\2\s*\/?\s*>/i, `<meta property="og:url" content="${own}" />`);
  const tags = `  <link rel="alternate" hreflang="en" href="${en}" />\n  <link rel="alternate" hreflang="zh-Hant" href="${tc}" />\n  <link rel="alternate" hreflang="x-default" href="${en}" />\n  <link rel="stylesheet" href="${assetRoot}assets/css/locale.css?v=20260821-1" />`;
  return html.replace(/<\/head>/i, `${tags}\n</head>`);
}

function rewriteSharedAssets(html, relativePath, locale, localizedScripts) {
  const originalRoot = rootPrefix(relativePath);
  const assetRoot = locale === "zh-Hant" ? "../" + originalRoot : originalRoot;
  if (locale === "zh-Hant") {
    const quoted = /(['"])([^'"]+)\1/g;
    html = html.replace(quoted, function (full, quote, value) {
      if (value.startsWith(originalRoot + "assets/")) value = assetRoot + value.slice(originalRoot.length);
      else if (value === originalRoot + "manifest.webmanifest") value = assetRoot + "manifest.webmanifest";
      return quote + value + quote;
    });
    for (const name of localizedScripts) {
      html = html.replaceAll(assetRoot + "assets/js/" + name, assetRoot + "assets/js/tc/" + name);
    }
  }
  html = setHeadLocale(html, locale, relativePath, assetRoot);
  html = setBodyLocale(html, locale, relativePath, assetRoot);
  const localeScript = `<script src="${assetRoot}assets/js/locale-switch.js?v=20260821-1"></script>`;
  if (!html.includes("locale-switch.js")) html = html.replace(/<\/body>/i, `${localeScript}\n</body>`);
  return html;
}

async function repairExistingPlaceholders() {
  const maps = { en: new Map(), "zh-TW": new Map() };
  for (const target of Object.keys(maps)) {
    for (const [source, value] of Object.entries(cache[target] || {})) {
      const repaired = restore(value, protect(source).terms);
      if (repaired !== value) maps[target].set(value, repaired);
      cache[target][source] = repaired;
    }
  }
  const rootHtml = await walk(siteRoot, (path) => path.endsWith(".html"), new Set([".git", "node_modules", "tc", "outputs"]));
  const rootJs = await walk(join(siteRoot, "assets", "js"), (path) => path.endsWith(".js"), new Set(["tc"]));
  const tcHtml = await walk(tcRoot, (path) => path.endsWith(".html"));
  const tcJsRoot = join(siteRoot, "assets", "js", "tc");
  const tcJs = await walk(tcJsRoot, (path) => path.endsWith(".js"));
  async function repairFiles(files, replacements) {
    for (const path of files) {
      let content = await readFile(path, "utf8");
      const original = content;
      for (const [before, after] of replacements) content = content.split(before).join(after);
      if (content !== original) await writeFile(path, content, "utf8");
    }
  }
  await repairFiles(rootHtml.concat(rootJs), maps.en);
  await repairFiles(tcHtml.concat(tcJs), maps["zh-TW"]);
  await writeFile(cachePath, JSON.stringify(cache, null, 2) + "\n", "utf8");
  console.log(`[i18n] repaired ${maps.en.size} English and ${maps["zh-TW"].size} Traditional Chinese cached strings`);
}

async function retranslateExistingFiles() {
  const sourceKeys = [...new Set([...Object.keys(cache.en || {}), ...Object.keys(cache["zh-TW"] || {})])];
  const old = { en: { ...cache.en }, "zh-TW": { ...cache["zh-TW"] } };
  cache.en = {};
  cache["zh-TW"] = {};
  await populateTranslations(sourceKeys, "en");
  await populateTranslations(sourceKeys, "zh-TW");
  const maps = { en: new Map(), "zh-TW": new Map() };
  for (const target of Object.keys(maps)) {
    for (const source of sourceKeys) {
      const before = old[target][source];
      const after = cache[target][source];
      if (before && after && before !== after) maps[target].set(before, after);
    }
  }
  const rootHtml = await walk(siteRoot, (path) => path.endsWith(".html"), new Set([".git", "node_modules", "tc", "outputs"]));
  const rootJs = await walk(join(siteRoot, "assets", "js"), (path) => path.endsWith(".js"), new Set(["tc"]));
  const tcHtml = await walk(tcRoot, (path) => path.endsWith(".html"));
  const tcJs = await walk(join(siteRoot, "assets", "js", "tc"), (path) => path.endsWith(".js"));
  async function applyMap(files, replacements) {
    const ordered = [...replacements].sort((a, b) => b[0].length - a[0].length);
    for (const path of files) {
      let content = await readFile(path, "utf8");
      const original = content;
      for (const [before, after] of ordered) content = content.split(before).join(after);
      if (content !== original) await writeFile(path, content, "utf8");
    }
  }
  await applyMap(rootHtml.concat(rootJs), maps.en);
  await applyMap(tcHtml.concat(tcJs), maps["zh-TW"]);
  await writeFile(cachePath, JSON.stringify(cache, null, 2) + "\n", "utf8");
  console.log(`[i18n] retranslations applied: ${maps.en.size} English, ${maps["zh-TW"].size} Traditional Chinese`);
}

if (process.argv.includes("--repair-existing")) {
  await repairExistingPlaceholders();
  process.exit(0);
}

if (process.argv.includes("--retranslate-existing")) {
  await retranslateExistingFiles();
  process.exit(0);
}

const ignored = new Set([".git", "node_modules", "tc", "outputs"]);
const htmlFiles = await walk(siteRoot, (path) => path.endsWith(".html"), ignored);
const jsFiles = (await walk(join(siteRoot, "assets", "js"), (path) => path.endsWith(".js"), new Set(["tc"]))).filter(async () => true);
const htmlSources = new Map();
const jsSources = new Map();
for (const path of htmlFiles) htmlSources.set(relative(siteRoot, path).split(sep).join("/"), await readFile(path, "utf8"));
for (const path of jsFiles) {
  const content = await readFile(path, "utf8");
  if (han.test(content)) {
    const name = relative(join(siteRoot, "assets", "js"), path).split(sep).join("/");
    translatedJs.add(name);
    jsSources.set(name, content);
  }
}

const sourceStrings = [];
for (const content of htmlSources.values()) sourceStrings.push(...collectStrings(content, "html"));
for (const content of jsSources.values()) sourceStrings.push(...collectStrings(content, "js"));
console.log(`[i18n] ${htmlSources.size} HTML files, ${jsSources.size} localized JS files, ${new Set(sourceStrings).size} unique strings`);
await populateTranslations(sourceStrings, "zh-TW");
await populateTranslations(sourceStrings, "en");

await mkdir(tcRoot, { recursive: true });
await mkdir(join(siteRoot, "assets", "js", "tc"), { recursive: true });
await mkdir(dirname(cachePath), { recursive: true });
for (const [relativePath, source] of htmlSources) {
  const en = rewriteSharedAssets(translateContent(source, "html", "en"), relativePath, "en", translatedJs);
  const tc = rewriteSharedAssets(translateContent(source, "html", "zh-TW"), relativePath, "zh-Hant", translatedJs);
  await mkdir(dirname(join(tcRoot, relativePath)), { recursive: true });
  await writeFile(join(siteRoot, relativePath), en, "utf8");
  await writeFile(join(tcRoot, relativePath), tc, "utf8");
}
for (const [name, source] of jsSources) {
  await mkdir(dirname(join(siteRoot, "assets", "js", "tc", name)), { recursive: true });
  await writeFile(join(siteRoot, "assets", "js", name), translateContent(source, "js", "en"), "utf8");
  await writeFile(join(siteRoot, "assets", "js", "tc", name), translateContent(source, "js", "zh-TW"), "utf8");
}
await writeFile(cachePath, JSON.stringify(cache, null, 2) + "\n", "utf8");
console.log("[i18n] bilingual site bootstrap complete");
