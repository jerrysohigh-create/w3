import { formatUnits } from "ethers";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { ChainClient } from "../server/chain-client.mjs";
import {
  OG_CONVERSION_CONTRACT,
  OG_CONVERSION_START_BLOCK,
  OG_CONVERTED_TOPIC,
  publicOgConversions,
  readOgConversions,
  writeOgConversions,
} from "../server/og-conversions.mjs";
import { PortalClient } from "../server/portal-client.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const publicFile = resolve(projectRoot, "assets", "data", "public-sale-og-conversions.json");
const persistentFile = process.env.W3_DATA_DIR
  ? resolve(process.env.W3_DATA_DIR, "public-sale-og-conversions.json")
  : null;
const participatingWallets = Number(process.env.W3_OG_PARTICIPATING_WALLETS || 1085);
const confirmations = Number(process.env.W3_OG_CONFIRMATIONS || 3);
const portal = new PortalClient(process.env.W3_OG_PORTAL_URL ? { streamUrl: process.env.W3_OG_PORTAL_URL } : {});
const chain = new ChainClient(
  (process.env.BSC_RPC_URLS || "https://bsc-dataseed.bnbchain.org,https://rpc-bsc.48.club")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
);

const chainHead = await portal.getFinalizedHead();
const finalizedBlock = Math.max(0, chainHead - confirmations);
const logs = await portal.queryLogs({
  fromBlock: Number(process.env.W3_OG_START_BLOCK || OG_CONVERSION_START_BLOCK),
  toBlock: finalizedBlock,
  address: OG_CONVERSION_CONTRACT,
  topic0: OG_CONVERTED_TOPIC,
  onProgress: ({ scannedTo, logCount }) => console.log(`[og-backfill] block ${scannedTo}; events ${logCount}`),
});
const seenUsers = [...new Set(logs.map((log) => `0x${String(log?.topics?.[1] || "").slice(-40)}`.toLowerCase()))]
  .filter((address) => address.length === 42)
  .sort();
const rawAllocated = await chain.call(OG_CONVERSION_CONTRACT, "totalAllocated()", `0x${finalizedBlock.toString(16)}`);
const totalAllocatedMs2 = rawAllocated && rawAllocated !== "0x" ? formatUnits(BigInt(rawAllocated), 18) : null;
const fetchedAt = new Date().toISOString();
const payload = {
  code: 200,
  msg: "OK",
  data: {
    participatingWallets,
    convertedWallets: seenUsers.length,
    conversionRate: participatingWallets ? seenUsers.length / participatingWallets * 100 : null,
    convertedEvents: logs.length,
    totalAllocatedMs2,
  },
  _meta: {
    status: "verified",
    source: "SQD Portal finalized BSC stream",
    contract: OG_CONVERSION_CONTRACT,
    eventTopic: OG_CONVERTED_TOPIC,
    baselineConvertedWallets: seenUsers.length,
    baselineBlock: finalizedBlock,
    lastScannedBlock: finalizedBlock,
    chainHead,
    confirmations,
    newConvertedWallets: 0,
    fetchedAt,
  },
  _state: { seenUsers },
};

for (const target of [publicFile, persistentFile].filter(Boolean)) {
  const prior = await readOgConversions(target);
  if (prior && (prior.data.convertedWallets > seenUsers.length || prior._meta.lastScannedBlock > finalizedBlock)) throw new Error("Refusing to replace a newer OG baseline");
}
const writes = [writeOgConversions(publicFile, publicOgConversions(payload))];
if (persistentFile) writes.push(writeOgConversions(persistentFile, payload));
await Promise.all(writes);
console.log(JSON.stringify({
  convertedWallets: seenUsers.length,
  participatingWallets,
  conversionRate: payload.data.conversionRate,
  convertedEvents: logs.length,
  totalAllocatedMs2,
  finalizedBlock,
  chainHead,
}, null, 2));
