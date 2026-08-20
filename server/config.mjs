import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const projectRoot = fileURLToPath(new URL("../", import.meta.url));

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

const persistentDataDir = process.env.W3_DATA_DIR ? resolve(process.env.W3_DATA_DIR) : "";
function dataFile(name, fallbackUrl) {
  return persistentDataDir ? resolve(persistentDataDir, name) : fileURLToPath(new URL(fallbackUrl, import.meta.url));
}

export const config = Object.freeze({
  port: positiveInteger(process.env.PORT, 4184),
  host: process.env.HOST || "127.0.0.1",
  refreshMs: positiveInteger(process.env.W3_REFRESH_SECONDS, 60) * 1000,
  chainSyncMs: positiveInteger(process.env.W3_CHAIN_SYNC_SECONDS, 300) * 1000,
  staleAfterMs: positiveInteger(process.env.W3_STALE_AFTER_SECONDS, 300) * 1000,
  paymentApiBase: (process.env.PAYMENT_API_BASE || "https://payment.magne.ai/api").replace(/\/$/, ""),
  rpcUrls: (process.env.BSC_RPC_URLS || "https://bsc-dataseed.bnbchain.org,https://rpc-bsc.48.club")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  serviceWalletPrivateKey: process.env.W3_SERVICE_WALLET_PRIVATE_KEY || "",
  allowEphemeralWallet: process.env.W3_ALLOW_EPHEMERAL_WALLET === "true",
  dataDir: persistentDataDir || null,
  cacheFile: dataFile("season-2-snapshot.json", "../assets/data/season-2-snapshot.json"),
  historyFile: dataFile("season-2-history.json", "../assets/data/season-2-history.json"),
  evidenceFile: dataFile("season-2-chain-events.json", "../server-data/season-2-chain-events.json"),
  bootstrapFile: dataFile("season-2-bscscan-bootstrap.json", "../server-data/season-2-bscscan-bootstrap.json"),
  flowAuditFile: dataFile("season-2-flow-audit.json", "../assets/data/season-2-flow-audit.json")
});
