import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { config } from "../server/config.mjs";

const RPC_URLS = (process.env.BSC_HISTORY_RPCS || process.env.BSC_HISTORY_RPC
  || [
    // BNB's public data-seed endpoints disable eth_getLogs. These third-party
    // public endpoints support it with small ranges; production can override
    // this list with a dedicated provider via BSC_HISTORY_RPCS.
    "https://1rpc.io/bnb",
    "https://bsc.blockrazor.xyz",
  ].join(","))
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const CONTRACT = "0x6DE61D8438176741fc8150Aef53256830a6Dd635";
const PARTICIPATION_TOPIC = "0xd5ebc3d9c3a71b9c3497611bf3661374d4ee6ebc3cb681ececec42926816faec";
// A prior proof scan from block 108,500,000 found the first matching event here.
const FIRST_EVENT_BLOCK = Number(process.env.S2_HISTORY_ORIGIN_BLOCK || 109128469);
const REQUESTED_TO_BLOCK = Number(process.env.S2_HISTORY_TO_BLOCK || 0);
const FULL_REBUILD = process.env.S2_HISTORY_FULL === "true";
const ANALYZE_ONLY = process.env.S2_HISTORY_ANALYZE_ONLY === "true";
const WINDOW = Math.max(1, Number(process.env.S2_HISTORY_WINDOW || 25));
const MAX_WINDOWS = Math.max(1, Number(process.env.S2_HISTORY_MAX_WINDOWS || 200));
const OVERLAP = Math.max(0, Number(process.env.S2_HISTORY_OVERLAP || 100));
const CONFIRMATIONS = Math.max(0, Number(process.env.S2_HISTORY_CONFIRMATIONS || 15));
const CONCURRENCY = Math.max(1, Number(process.env.S2_HISTORY_CONCURRENCY || 1));
const RPC_COOLDOWN_MS = Math.max(0, Number(process.env.S2_HISTORY_RPC_COOLDOWN_MS || 1000));
const snapshotFile = config.cacheFile;
const evidenceFile = config.evidenceFile;
const bootstrapFile = config.bootstrapFile;

let requestId = 0;
let rpcCursor = 0;
const endpointReadyAt = new Map();

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimit(error) {
  return /429|limit exceeded|rate.?limit|too many requests|request limit/i.test(String(error?.message || error));
}

async function rpc(method, params, attempts = Math.max(6, RPC_URLS.length * 3)) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const rpcUrl = RPC_URLS[rpcCursor++ % RPC_URLS.length];
    const readyAt = endpointReadyAt.get(rpcUrl) || 0;
    if (readyAt > Date.now()) await wait(readyAt - Date.now());
    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: ++requestId, method, params }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`${rpcUrl} HTTP ${response.status}`);
      const payload = await response.json();
      if (payload.error) throw new Error(`${rpcUrl} ${method}: ${payload.error.message || "RPC error"}`);
      endpointReadyAt.set(rpcUrl, Date.now() + RPC_COOLDOWN_MS);
      return payload.result;
    } catch (error) {
      lastError = error;
      const backoff = isRateLimit(error)
        ? Math.min(30_000, 2_000 * (attempt + 1))
        : Math.min(5_000, 350 * (attempt + 1));
      endpointReadyAt.set(rpcUrl, Date.now() + backoff);
      if (attempt + 1 < attempts) await wait(100 + Math.floor(Math.random() * 250));
    }
  }
  throw lastError || new Error("No BSC RPC endpoint available");
}

function hex(number) {
  return `0x${number.toString(16)}`;
}

function addressFromTopic(topic) {
  return `0x${String(topic).slice(-40)}`.toLowerCase();
}

function uintWord(data, index) {
  const start = 2 + index * 64;
  return BigInt(`0x${data.slice(start, start + 64)}`);
}

function eventKey(event) {
  // The lottery emits one participation event per draw transaction. Hash-level
  // de-duplication lets an indexed bootstrap event be replaced by its RPC copy.
  return String(event.transactionHash).toLowerCase();
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function concurrentMap(items, worker, concurrency = CONCURRENCY) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }));
  return results;
}

const previous = await readJson(evidenceFile, { _meta: {}, events: [] });
const bootstrap = await readJson(bootstrapFile, { _meta: {}, events: [] });
const previousEvents = Array.isArray(previous.events) ? previous.events : [];
const bootstrapEvents = Array.isArray(bootstrap.events) ? bootstrap.events : [];
const previousToBlock = Number(previous?._meta?.toBlock || 0);
const bootstrapToBlock = Math.max(
  Number(bootstrap?._meta?.toBlock || 0),
  Number(bootstrap?._meta?.verifiedThroughBlock || 0),
  ...bootstrapEvents.map((event) => Number(event.blockNumber || 0)),
);
const latestKnownBlock = Math.max(previousToBlock, bootstrapToBlock);
const latestHead = REQUESTED_TO_BLOCK || Number.parseInt(await rpc("eth_blockNumber", []), 16);
const finalizedBlock = Math.max(FIRST_EVENT_BLOCK, latestHead - CONFIRMATIONS);
const scanFrom = FULL_REBUILD || !previousEvents.length
  ? FIRST_EVENT_BLOCK
  : Math.max(FIRST_EVENT_BLOCK, latestKnownBlock - OVERLAP + 1);

if (scanFrom > finalizedBlock) {
  console.log(`[chain-sync] already current at block ${previousToBlock}; head ${latestHead}`);
  process.exit(0);
}

const scanTo = Math.min(finalizedBlock, scanFrom + WINDOW * MAX_WINDOWS - 1);
const ranges = [];
for (let from = scanFrom; from <= scanTo; from += WINDOW) {
  ranges.push([from, Math.min(scanTo, from + WINDOW - 1)]);
}
console.log(`[chain-sync] ${FULL_REBUILD ? "full" : "incremental"} scan: ${ranges.length} windows, blocks ${scanFrom}–${scanTo}${scanTo < finalizedBlock ? ` of ${finalizedBlock}` : ""}`);

const batches = await concurrentMap(ranges, async ([fromBlock, toBlock], index) => {
  const logs = await rpc("eth_getLogs", [{
    address: CONTRACT,
    fromBlock: hex(fromBlock),
    toBlock: hex(toBlock),
    topics: [PARTICIPATION_TOPIC],
  }]);
  if ((index + 1) % 10 === 0 || index + 1 === ranges.length) {
    console.log(`[chain-sync] ${index + 1}/${ranges.length} windows`);
  }
  return logs;
});

const rawLogs = batches.flat();
const blockNumbers = [...new Set(rawLogs.map((log) => Number.parseInt(log.blockNumber, 16)))];
const blocks = await concurrentMap(blockNumbers, async (blockNumber) => {
  const block = await rpc("eth_getBlockByNumber", [hex(blockNumber), false]);
  return [blockNumber, Number.parseInt(block.timestamp, 16)];
}, 5);
const timestamps = new Map(blocks);
const newEvents = rawLogs.map((log) => {
  const blockNumber = Number.parseInt(log.blockNumber, 16);
  return {
    blockNumber,
    transactionHash: log.transactionHash,
    logIndex: Number.parseInt(log.logIndex, 16),
    observedAt: new Date(timestamps.get(blockNumber) * 1000).toISOString(),
    participant: addressFromTopic(log.topics[1]),
    referrer: addressFromTopic(log.topics[2]),
    entries: Number(uintWord(log.data, 0)),
  };
});

const baseEvents = FULL_REBUILD ? [] : [...previousEvents, ...bootstrapEvents];
const events = [...new Map([...baseEvents, ...newEvents].map((event) => [eventKey(event), event])).values()]
  .sort((left, right) => left.blockNumber - right.blockNumber || left.logIndex - right.logIndex);
if (!events.length) throw new Error("No Season 2 participation events found");

const participants = new Set(events.map((event) => String(event.participant).toLowerCase()));
const totalEntries = events.reduce((sum, event) => sum + Number(event.entries), 0);
const firstEvent = events[0];
const lastEvent = events[events.length - 1];
const snapshot = await readJson(snapshotFile, null);
const snapshotAt = snapshot?._meta?.fetchedAt || null;
const snapshotTime = snapshotAt ? new Date(snapshotAt).getTime() : 0;
const lastEventTime = new Date(lastEvent.observedAt).getTime();
const snapshotTotals = snapshot?.data ? {
  totalEntries: Number(snapshot.data.totalEntries),
  totalMobile: Number(snapshot.data.totalMobile),
} : null;
const chainTotals = {
  totalEntries,
  totalMobile: Math.floor(totalEntries / 100),
};
const caughtUp = scanTo >= finalizedBlock;
const comparable = Boolean(caughtUp && snapshotTotals && snapshotTime >= lastEventTime);
const matched = comparable
  ? snapshotTotals.totalEntries === chainTotals.totalEntries && snapshotTotals.totalMobile === chainTotals.totalMobile
  : null;
const reconciliation = {
  snapshotAt,
  comparable,
  matched,
  deltaEntries: comparable ? snapshotTotals.totalEntries - chainTotals.totalEntries : null,
  snapshot: snapshotTotals,
  chain: chainTotals,
};

const evidence = {
  _meta: {
    source: "BSC JSON-RPC + BscScan indexed bootstrap",
    contract: CONTRACT,
    eventTopic: PARTICIPATION_TOPIC,
    provenEmptyFromBlock: 108500000,
    firstEventBlock: FIRST_EVENT_BLOCK,
    fromBlock: FIRST_EVENT_BLOCK,
    toBlock: scanTo,
    chainHead: latestHead,
    caughtUp,
    remainingBlocks: Math.max(0, finalizedBlock - scanTo),
    confirmations: CONFIRMATIONS,
    generatedAt: new Date().toISOString(),
    eventCount: events.length,
    newEvents: events.length - previousEvents.length,
    uniqueDirectPayers: participants.size,
    totalEntries,
    reconciliation,
    bootstrap: bootstrapEvents.length ? {
      source: bootstrap?._meta?.source || "BscScan public contract events",
      retrievedAt: bootstrap?._meta?.retrievedAt || null,
      fromBlock: bootstrap?._meta?.fromBlock || null,
      toBlock: bootstrapToBlock,
      eventCount: bootstrapEvents.length,
      totalEntries: bootstrap?._meta?.totalEntries || null,
    } : null,
  },
  events,
};

if (ANALYZE_ONLY) {
  console.log(JSON.stringify({
    scanFrom,
    toBlock: scanTo,
    finalizedBlock,
    caughtUp,
    remainingBlocks: Math.max(0, finalizedBlock - scanTo),
    firstEventBlock: firstEvent.blockNumber,
    firstEventAt: firstEvent.observedAt,
    lastEventBlock: lastEvent.blockNumber,
    lastEventAt: lastEvent.observedAt,
    eventCount: events.length,
    newEvents: events.length - previousEvents.length,
    uniqueDirectPayers: participants.size,
    totalEntries,
    reconciliation,
  }, null, 2));
  process.exit(0);
}

if (matched === false) {
  console.warn(`[chain-sync] dashboard/chain delta retained for review: ${JSON.stringify(reconciliation)}`);
}

await mkdir(dirname(evidenceFile), { recursive: true });
const temporary = `${evidenceFile}.tmp`;
await writeFile(temporary, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
await rename(temporary, evidenceFile);
console.log(`[chain-sync] stored ${events.length} events (+${Math.max(0, events.length - previousEvents.length)}); ${participants.size} direct payers; ${totalEntries} entries; scanned through ${scanTo}${caughtUp ? " (current)" : ` (${finalizedBlock - scanTo} blocks remain)`}`);
