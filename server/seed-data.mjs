import { constants } from "node:fs";
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export async function seedPersistentData(config, projectRoot) {
  if (!config.dataDir) return [];

  const seeds = [
    [resolve(projectRoot, "assets", "data", "season-2-snapshot.json"), config.cacheFile],
    [resolve(projectRoot, "assets", "data", "season-2-history.json"), config.historyFile],
    [resolve(projectRoot, "server-data", "season-2-chain-events.json"), config.evidenceFile],
    [resolve(projectRoot, "server-data", "season-2-bscscan-bootstrap.json"), config.bootstrapFile],
    [resolve(projectRoot, "assets", "data", "season-2-flow-audit.json"), config.flowAuditFile],
  ];

  const copied = [];
  for (const [source, target] of seeds) {
    await mkdir(dirname(target), { recursive: true });
    try {
      await copyFile(source, target, constants.COPYFILE_EXCL);
      copied.push(target);
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
    }
  }
  return copied;
}
