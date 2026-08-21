import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { seedPersistentData } from "../server/seed-data.mjs";

test("seedPersistentData initializes an empty persistent directory without overwriting it", async () => {
  const root = await mkdtemp(join(tmpdir(), "w3-seed-test-"));
  const dataDir = join(root, "persistent");
  const sources = [
    ["assets/data/season-2-snapshot.json", "snapshot"],
    ["assets/data/season-2-history.json", "history"],
    ["server-data/season-2-chain-events.json", "events"],
    ["server-data/season-2-bscscan-bootstrap.json", "bootstrap"],
    ["assets/data/season-2-flow-audit.json", "flows"],
  ];

  try {
    for (const [relative, value] of sources) {
      const file = join(root, relative);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, value, "utf8");
    }

    const config = {
      dataDir,
      cacheFile: join(dataDir, "season-2-snapshot.json"),
      historyFile: join(dataDir, "season-2-history.json"),
      evidenceFile: join(dataDir, "season-2-chain-events.json"),
      bootstrapFile: join(dataDir, "season-2-bscscan-bootstrap.json"),
      flowAuditFile: join(dataDir, "season-2-flow-audit.json"),
    };

    assert.equal((await seedPersistentData(config, root)).length, 5);
    await writeFile(config.historyFile, "preserved", "utf8");
    assert.equal((await seedPersistentData(config, root)).length, 0);
    assert.equal(await readFile(config.historyFile, "utf8"), "preserved");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
