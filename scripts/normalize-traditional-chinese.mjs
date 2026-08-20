import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as OpenCC from "opencc-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const converter = OpenCC.Converter({ from: "cn", to: "twp" });
const targets = [path.join(root, "tc"), path.join(root, "assets", "js", "tc")];

async function collectFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(absolute));
    else if (/\.(?:html|js)$/.test(entry.name)) files.push(absolute);
  }
  return files;
}

let changed = 0;
for (const directory of targets) {
  for (const file of await collectFiles(directory)) {
    const before = await fs.readFile(file, "utf8");
    const after = converter(before)
      .replaceAll("引數", "參數")
      .replaceAll("后續", "後續");
    if (after !== before) {
      await fs.writeFile(file, after, "utf8");
      changed += 1;
    }
  }
}

console.log(`Traditional Chinese normalization complete: ${changed} files updated.`);
