import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { seedPersistentData } from "../server/seed-data.mjs";

test("deployment bundle includes the verified Season 2 chain baseline", async () => {
  const evidenceFile = join(dirname(fileURLToPath(import.meta.url)), "..", "server-data", "season-2-chain-events.json");
  const evidence = JSON.parse(await readFile(evidenceFile, "utf8"));
  const events = Array.isArray(evidence.events) ? evidence.events : [];
  const payers = new Set(events.map((event) => String(event.participant).toLowerCase()));

  assert.ok(events.length >= 137, "verified event history must ship with the deployment");
  assert.ok(payers.size >= 80, "verified direct-payer baseline must not regress below 80");
  assert.ok(Number(evidence?._meta?.toBlock) >= 117055101, "verified scan coverage must be preserved");
});

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

test("seedPersistentData restores regressed BSC history and preserves newer data", async () => {
  const root = await mkdtemp(join(tmpdir(), "w3-seed-recovery-"));
  const dataDir = join(root, "persistent");
  const historySeed = {
    _meta: { chainBackfill: { toBlock: 200, eventCount: 20, uniqueDirectPayers: 8, totalEntries: 30 } },
    points: [{ observedAt: "2026-08-20T00:00:00.000Z", onchainPayers: 8, totalEntries: 30 }],
  };
  const eventsSeed = {
    _meta: { toBlock: 200, eventCount: 20, uniqueDirectPayers: 8, totalEntries: 30 },
    events: Array.from({ length: 20 }, (_, index) => ({ transactionHash: `0x${index}`, participant: `0x${index}`, entries: index < 10 ? 2 : 1 })),
  };

  try {
    const seedFiles = {
      "assets/data/season-2-snapshot.json": {},
      "assets/data/season-2-history.json": historySeed,
      "server-data/season-2-chain-events.json": eventsSeed,
      "server-data/season-2-bscscan-bootstrap.json": {},
      "assets/data/season-2-flow-audit.json": {},
    };
    for (const [relative, value] of Object.entries(seedFiles)) {
      const file = join(root, relative);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, JSON.stringify(value), "utf8");
    }
    const config = {
      dataDir,
      cacheFile: join(dataDir, "season-2-snapshot.json"),
      historyFile: join(dataDir, "season-2-history.json"),
      evidenceFile: join(dataDir, "season-2-chain-events.json"),
      bootstrapFile: join(dataDir, "season-2-bscscan-bootstrap.json"),
      flowAuditFile: join(dataDir, "season-2-flow-audit.json"),
    };
    await seedPersistentData(config, root);

    await writeFile(config.historyFile, JSON.stringify({
      _meta: { chainBackfill: { toBlock: 120, eventCount: 4, uniqueDirectPayers: 3, totalEntries: 5 } },
      points: [{ observedAt: "2026-07-10T00:00:00.000Z", onchainPayers: 3, totalEntries: 5 }],
    }), "utf8");
    await writeFile(config.evidenceFile, JSON.stringify({
      _meta: { toBlock: 120, eventCount: 4, uniqueDirectPayers: 3, totalEntries: 5 },
      events: eventsSeed.events.slice(0, 4),
    }), "utf8");

    assert.equal((await seedPersistentData(config, root)).length, 2);
    assert.equal(JSON.parse(await readFile(config.historyFile, "utf8"))._meta.chainBackfill.uniqueDirectPayers, 8);
    assert.equal(JSON.parse(await readFile(config.evidenceFile, "utf8"))._meta.uniqueDirectPayers, 8);

    const newer = { ...historySeed, _meta: { chainBackfill: { toBlock: 220, eventCount: 22, uniqueDirectPayers: 9, totalEntries: 33 } } };
    await writeFile(config.historyFile, JSON.stringify(newer), "utf8");
    assert.equal((await seedPersistentData(config, root)).length, 0);
    assert.equal(JSON.parse(await readFile(config.historyFile, "utf8"))._meta.chainBackfill.uniqueDirectPayers, 9);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
