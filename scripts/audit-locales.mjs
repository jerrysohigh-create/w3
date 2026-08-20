import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const han = /\p{Script=Han}/u;

async function walk(directory, predicate) {
  const found = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if ([".git", "node_modules", "tc"].includes(entry.name) && directory === root) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await walk(absolute, predicate));
    else if (predicate(absolute)) found.push(absolute);
  }
  return found;
}

const rootPages = (await walk(root, (file) => file.endsWith(".html")))
  .filter((file) => !file.startsWith(path.join(root, "tc") + path.sep));
const tcPages = await walk(path.join(root, "tc"), (file) => file.endsWith(".html"));

if (rootPages.length !== tcPages.length) {
  errors.push(`Page count mismatch: EN ${rootPages.length}, TC ${tcPages.length}`);
}

for (const englishFile of rootPages) {
  const relative = path.relative(root, englishFile);
  const chineseFile = path.join(root, "tc", relative);
  const english = await fs.readFile(englishFile, "utf8");
  let chinese = "";
  try { chinese = await fs.readFile(chineseFile, "utf8"); }
  catch { errors.push(`Missing TC peer: ${relative}`); continue; }

  const checks = [
    [english.includes('<html lang="en">'), `EN lang missing: ${relative}`],
    [english.includes('data-lang="en"'), `EN data-lang missing: ${relative}`],
    [english.includes('hreflang="en"'), `EN hreflang missing: ${relative}`],
    [english.includes('hreflang="zh-Hant"'), `TC hreflang missing from EN: ${relative}`],
    [chinese.includes('<html lang="zh-Hant">'), `TC lang missing: ${relative}`],
    [chinese.includes('data-lang="zh-Hant"'), `TC data-lang missing: ${relative}`],
    [chinese.includes('hreflang="en"'), `EN hreflang missing from TC: ${relative}`],
    [chinese.includes('hreflang="zh-Hant"'), `TC hreflang missing: ${relative}`],
    [!han.test(english), `Han text remains in EN HTML: ${relative}`],
    [!/__W3TERM_|ZXQ\d+/.test(english + chinese), `Translation token remains: ${relative}`],
  ];
  for (const [pass, message] of checks) if (!pass) errors.push(message);
}

const rootJs = (await walk(path.join(root, "assets", "js"), (file) => file.endsWith(".js")))
  .filter((file) => !file.startsWith(path.join(root, "assets", "js", "tc") + path.sep))
  .filter((file) => path.basename(file) !== "locale-switch.js");
for (const file of rootJs) {
  const content = await fs.readFile(file, "utf8");
  if (han.test(content)) errors.push(`Han text remains in EN JS: ${path.relative(root, file)}`);
}

async function localTargetExists(fromFile, value) {
  if (!value || /^(?:https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(value)) return true;
  const clean = decodeURIComponent(value.split(/[?#]/)[0]);
  if (!clean) return true;
  const target = clean.startsWith("/")
    ? path.join(root, clean.replace(/^\/+/, ""))
    : path.resolve(path.dirname(fromFile), clean);
  try {
    const stat = await fs.stat(target);
    if (stat.isDirectory()) await fs.access(path.join(target, "index.html"));
    return true;
  } catch {
    return false;
  }
}

for (const file of [...rootPages, ...tcPages]) {
  const content = await fs.readFile(file, "utf8");
  for (const match of content.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    if (!(await localTargetExists(file, match[1]))) {
      errors.push(`Missing local target in ${path.relative(root, file)}: ${match[1]}`);
    }
  }
  if (/payment\.magne\.ai\/buy(?:[?#"'])/i.test(content)) {
    errors.push(`Legacy Season 2 /buy link remains: ${path.relative(root, file)}`);
  }
}

if (errors.length) {
  console.error(`Locale audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Locale audit passed: ${rootPages.length} EN pages + ${tcPages.length} TC pages, metadata, assets and links verified.`);
