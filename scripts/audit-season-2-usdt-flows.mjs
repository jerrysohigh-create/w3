import { readFile, rename, writeFile } from "node:fs/promises";
import { config } from "../server/config.mjs";

const evidenceFile = config.evidenceFile;
const outputFile = config.flowAuditFile;
const rpcUrl = process.env.BSC_RECEIPT_RPC || "https://bsc-dataseed.bnbchain.org";
const usdt = "0x55d398326f99059ff775485246999027b3197955";
const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const zeroAddress = "0x0000000000000000000000000000000000000000";
const unit = 10n ** 18n;
let requestId = 0;

function addressFromTopic(topic) {
  return `0x${String(topic).slice(-40)}`.toLowerCase();
}

async function receipt(transactionHash, attempts = 5) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: ++requestId, method: "eth_getTransactionReceipt", params: [transactionHash] }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`Receipt HTTP ${response.status}`);
      const payload = await response.json();
      if (payload.error) throw new Error(payload.error.message || "Receipt RPC error");
      if (!payload.result) throw new Error("Receipt unavailable");
      return payload.result;
    } catch (error) {
      lastError = error;
      if (attempt + 1 < attempts) await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function concurrentMap(items, worker, concurrency = 5) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  }));
  return results;
}

const evidence = JSON.parse(await readFile(evidenceFile, "utf8"));
const events = evidence.events || [];
if (!events.length) throw new Error("No Season 2 events available for flow audit");
const latestTransactionHash = String(events[events.length - 1].transactionHash || "").toLowerCase();
try {
  const previousAudit = JSON.parse(await readFile(outputFile, "utf8"));
  if (Number(previousAudit?.data?.eventsAudited) === events.length
    && String(previousAudit?._meta?.lastTransactionHash || "").toLowerCase() === latestTransactionHash
    && previousAudit?._meta?.matched === true) {
    console.log(`[flow-audit] unchanged at ${events.length} events; retained verified audit`);
    process.exit(0);
  }
} catch {
  // No reusable audit exists yet.
}
const receipts = await concurrentMap(events, async (event) => ({ event, receipt: await receipt(event.transactionHash) }));

const referralRecipients = new Set();
const poolRecipients = new Set();
let referralTransfers = 0;
let poolTransfers = 0;
let referralAmount = 0n;
let poolAmount = 0n;
let mismatchedEvents = 0;

for (const item of receipts) {
  const expectedAmount = BigInt(item.event.entries) * 4n * unit;
  const transfers = (item.receipt.logs || []).filter((log) => (
    String(log.address).toLowerCase() === usdt
    && String(log.topics?.[0]).toLowerCase() === transferTopic
    && BigInt(log.data) === expectedAmount
  )).map((log) => ({
    to: addressFromTopic(log.topics[2]),
    amount: BigInt(log.data),
  }));
  const referrer = String(item.event.referrer).toLowerCase();
  const referral = transfers.filter((transfer) => referrer !== zeroAddress && transfer.to === referrer);
  const pool = transfers.filter((transfer) => !(referrer !== zeroAddress && transfer.to === referrer));
  if (referral.length !== 1 || pool.length !== 1 || transfers.length !== 2) mismatchedEvents += 1;
  for (const transfer of referral) {
    referralRecipients.add(transfer.to);
    referralTransfers += 1;
    referralAmount += transfer.amount;
  }
  for (const transfer of pool) {
    poolRecipients.add(transfer.to);
    poolTransfers += 1;
    poolAmount += transfer.amount;
  }
}

const matched = mismatchedEvents === 0
  && referralTransfers === events.length
  && poolTransfers === events.length;
if (!matched) throw new Error(`USDT flow audit failed: ${JSON.stringify({ mismatchedEvents, referralTransfers, poolTransfers })}`);

const payload = {
  _meta: {
    source: "BSC transaction receipts",
    contract: evidence._meta.contract,
    token: usdt,
    fromBlock: evidence._meta.fromBlock,
    toBlock: evidence._meta.toBlock,
    firstEventAt: events[0].observedAt,
    lastEventAt: events[events.length - 1].observedAt,
    lastTransactionHash: latestTransactionHash,
    generatedAt: new Date().toISOString(),
    rule: "Each participation event has exactly two USDT transfers equal to 4 × Entries",
    matched,
  },
  code: 200,
  msg: "ok",
  data: {
    eventsAudited: events.length,
    transfersAudited: referralTransfers + poolTransfers,
    perEntryUsdt: 4,
    referral: {
      transfers: referralTransfers,
      uniqueRecipients: referralRecipients.size,
      totalUsdt: (referralAmount / unit).toString(),
    },
    pool: {
      transfers: poolTransfers,
      uniqueRecipients: poolRecipients.size,
      totalUsdt: (poolAmount / unit).toString(),
    },
  },
};

const temporary = `${outputFile}.tmp`;
await writeFile(temporary, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
await rename(temporary, outputFile);
console.log(`[flow-audit] ${events.length}/${events.length} events matched; ${referralRecipients.size} referral recipients; ${poolRecipients.size} pool recipient`);
