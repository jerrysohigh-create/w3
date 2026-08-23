import { readFile, rename, writeFile } from "node:fs/promises";
import { config } from "../server/config.mjs";

const evidenceFile = config.evidenceFile;
const snapshotFile = config.cacheFile;
const historyFile = config.historyFile;

const evidence = JSON.parse(await readFile(evidenceFile, "utf8"));
const snapshot = JSON.parse(await readFile(snapshotFile, "utf8"));
const events = [...new Map((evidence.events || []).map((event) => [`${event.transactionHash}:${event.logIndex}`, event])).values()]
  .sort((left, right) => left.blockNumber - right.blockNumber || left.logIndex - right.logIndex);
if (!events.length) throw new Error("No chain evidence available");

let totalEntries = 0;
const payers = new Set();
const firstTime = new Date(events[0].observedAt).getTime();
const points = [{
  observedAt: new Date(firstTime - 1).toISOString(),
  onchainPayers: 0,
  totalEntries: 0,
  totalMobile: 0,
  currRound: 1,
  nextDrawNeed: 100,
  source: "BSC_EVENT_BASELINE",
}];

for (const event of events) {
  totalEntries += Number(event.entries);
  payers.add(String(event.participant).toLowerCase());
  const currentEntries = totalEntries % 100;
  points.push({
    observedAt: event.observedAt,
    onchainPayers: payers.size,
    totalEntries,
    totalMobile: Math.floor(totalEntries / 100),
    currRound: Math.floor(totalEntries / 100) + 1,
    nextDrawNeed: currentEntries === 0 ? 100 : 100 - currentEntries,
    source: "BSC_PARTICIPATION_EVENT",
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash,
  });
}

const chainLatest = points[points.length - 1];
const snapshotAt = snapshot?._meta?.fetchedAt || null;
const snapshotTime = snapshotAt ? new Date(snapshotAt).getTime() : 0;
const chainTime = new Date(chainLatest.observedAt).getTime();
const snapshotTotals = {
  totalEntries: Number(snapshot?.data?.totalEntries),
  totalMobile: Number(snapshot?.data?.totalMobile),
};
const snapshotComparable = Number.isFinite(snapshotTotals.totalEntries)
  && Number.isFinite(snapshotTotals.totalMobile)
  && snapshotTime >= chainTime;
const snapshotMatched = snapshotComparable
  ? snapshotTotals.totalEntries === chainLatest.totalEntries && snapshotTotals.totalMobile === chainLatest.totalMobile
  : null;

if (snapshotMatched === true && snapshotTime > chainTime) {
  points.push({
    observedAt: snapshotAt,
    onchainPayers: payers.size,
    totalEntries: chainLatest.totalEntries,
    totalMobile: chainLatest.totalMobile,
    currRound: chainLatest.currRound,
    nextDrawNeed: chainLatest.nextDrawNeed,
    source: "W3_DASHBOARD_RECONCILIATION",
  });
}

const lastPoint = points[points.length - 1];
const reconciliation = {
  snapshotAt,
  comparable: snapshotComparable,
  matched: snapshotMatched,
  deltaEntries: snapshotComparable ? snapshotTotals.totalEntries - chainLatest.totalEntries : null,
  snapshot: snapshotTotals,
  chain: {
    totalEntries: chainLatest.totalEntries,
    totalMobile: chainLatest.totalMobile,
  },
};
const history = {
  _meta: {
    source: "BSC participation events",
    grain: "one cumulative point per verified participation event",
    metricDefinitions: {
      totalEntries: "Cumulative sum of entries decoded from the participation event",
      onchainPayers: "Distinct participant addresses observed in the participation event",
    },
    startedAt: points[0].observedAt,
    updatedAt: lastPoint.observedAt,
    lastCheckedAt: evidence._meta.generatedAt,
    refreshSeconds: 300,
    pointCount: points.length,
    chartMetric: "totalEntries",
    chainBackfill: {
      contract: evidence._meta.contract,
      eventTopic: evidence._meta.eventTopic,
      provenEmptyFromBlock: evidence._meta.provenEmptyFromBlock,
      firstEventBlock: events[0].blockNumber,
      fromBlock: evidence._meta.fromBlock,
      toBlock: evidence._meta.toBlock,
      chainHead: evidence._meta.chainHead,
      caughtUp: Boolean(evidence._meta.caughtUp),
      remainingBlocks: Number(evidence._meta.remainingBlocks || 0),
      confirmations: evidence._meta.confirmations,
      eventCount: events.length,
      firstEventAt: events[0].observedAt,
      lastEventAt: events[events.length - 1].observedAt,
      uniqueDirectPayers: payers.size,
      totalEntries,
      reconciliation,
    },
  },
  code: 200,
  msg: "ok",
  points,
};

const temporary = `${historyFile}.materialize.tmp`;
await writeFile(temporary, `${JSON.stringify(history, null, 2)}\n`, "utf8");
await rename(temporary, historyFile);
console.log(`[history] ${points.length} points from zero; ${events.length} events; ${totalEntries} entries; ${payers.size} direct payers`);
