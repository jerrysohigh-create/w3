import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const files = [
  fileURLToPath(new URL("../assets/css/site.css", import.meta.url)),
  fileURLToPath(new URL("../index.html", import.meta.url))
];

for (const file of files) {
  const source = await readFile(file, "utf8");
  const next = source
    .replace(/font-size:\s*(?:7|8|9|10)px/g, "font-size: 11px")
    .replace(/font:\s*(?:7|8|9|10)px(?=\/|\s)/g, "font: 11px");
  if (next !== source) await writeFile(file, next, "utf8");
}

console.log("[type] enforced 11px minimum for explicit microcopy");
