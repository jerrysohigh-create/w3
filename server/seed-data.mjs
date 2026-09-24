import { constants } from "node:fs";
import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}

function chainCoverage(payload) {
  const meta = payload?._meta?.chainBackfill || payload?._meta || {};
  const points = Array.isArray(payload?.points) ? payload.points : [];
  const events = Array.isArray(payload?.events) ? payload.events : [];
  const latest = points[points.length - 1] || {};
  return {
    toBlock: Number(meta.toBlock || 0),
    eventCount: Number(meta.eventCount || events.length || Math.max(0, points.length - 1)),
    uniqueDirectPayers: Number(meta.uniqueDirectPayers || latest.onchainPayers || 0),
    totalEntries: Number(meta.totalEntries || latest.totalEntries || 0),
  };
}

function regressedAgainstSeed(seed, target) {
  if (!seed || !target) return false;
  const baseline = chainCoverage(seed);
  const current = chainCoverage(target);
  return current.toBlock < baseline.toBlock
    || current.eventCount < baseline.eventCount
    || current.uniqueDirectPayers < baseline.uniqueDirectPayers
    || current.totalEntries < baseline.totalEntries;
}

function ogConversionRegressed(seed, target) {
  const seedBlock = Number(seed?._meta?.lastScannedBlock || 0);
  const targetBlock = Number(target?._meta?.lastScannedBlock || 0);
  const seedCount = Number(seed?.data?.convertedWallets || 0);
  const targetCount = Number(target?.data?.convertedWallets || 0);
  return targetCount < seedCount || (targetCount === seedCount && targetBlock < seedBlock);
}

async function restoreRegressedSeed(source, target) {
  const [seed, current] = await Promise.all([readJson(source), readJson(target)]);
  if (!regressedAgainstSeed(seed, current)) return false;
  const temporary = `${target}.seed-recovery.tmp`;
  await writeFile(temporary, await readFile(source, "utf8"), "utf8");
  await rename(temporary, target);
  return true;
}

async function restoreRegressedOgSeed(source, target) {
  const [seed, current] = await Promise.all([readJson(source), readJson(target)]);
  if (!seed || !current || !ogConversionRegressed(seed, current)) return false;
  const temporary = `${target}.seed-recovery.tmp`;
  await writeFile(temporary, await readFile(source, "utf8"), "utf8");
  await rename(temporary, target);
  return true;
}

export async function seedPersistentData(config, projectRoot) {
  const seeds = config.dataDir ? [
    [resolve(projectRoot, "assets", "data", "season-2-snapshot.json"), config.cacheFile, false],
    [resolve(projectRoot, "assets", "data", "season-2-history.json"), config.historyFile, true],
    [resolve(projectRoot, "server-data", "season-2-chain-events.json"), config.evidenceFile, true],
    [resolve(projectRoot, "server-data", "season-2-bscscan-bootstrap.json"), config.bootstrapFile, false],
    [resolve(projectRoot, "assets", "data", "season-2-flow-audit.json"), config.flowAuditFile, false],
  ] : [];
  if (config.ogConversionsFile) {
    seeds.push([resolve(projectRoot, "assets", "data", "public-sale-og-conversions.json"), config.ogConversionsFile, "og"]);
  }
  if (config.dataDir && config.mhaSupplyFile) {
    seeds.push([resolve(projectRoot, "assets", "data", "mha-supply-snapshot.json"), config.mhaSupplyFile, false]);
  }

  const copied = [];
  for (const [source, target, recoverRegression] of seeds) {
    await mkdir(dirname(target), { recursive: true });
    try {
      await copyFile(source, target, constants.COPYFILE_EXCL);
      copied.push(target);
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      if (error?.code !== "EEXIST") throw error;
      if (recoverRegression === "og" && await restoreRegressedOgSeed(source, target)) copied.push(target);
      else if (recoverRegression && await restoreRegressedSeed(source, target)) copied.push(target);
    }
  }
  return copied;
}
