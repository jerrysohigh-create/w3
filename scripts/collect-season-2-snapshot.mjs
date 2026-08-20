import { ChainClient } from "../server/chain-client.mjs";
import { config } from "../server/config.mjs";
import { readHistory, updateHistory, writeHistory } from "../server/history.mjs";
import { createServiceWallet, PaymentClient } from "../server/payment-client.mjs";
import { buildSnapshot, readSnapshot, writeSnapshot } from "../server/snapshot.mjs";

function finite(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`Invalid ${field}`);
  return number;
}

function assertTransition(previous, next) {
  if (!previous?.data) return;
  for (const field of ["totalEntries", "totalMobile", "currRound"]) {
    if (finite(next.data[field], field) < finite(previous.data[field], `previous ${field}`)) {
      throw new Error(`${field} moved backwards`);
    }
  }
}

function preserveVerifiedPayerCount(history, previousHistory) {
  const points = history?.points || [];
  const previousPoints = previousHistory?.points || [];
  const latest = points[points.length - 1];
  if (!latest) return history;
  if (!latest.source) latest.source = "PAYMENT_AUTHENTICATED_OBSERVATION";
  if (Number.isFinite(Number(latest.onchainPayers))) return history;
  const lastVerified = [...previousPoints].reverse().find((point) => Number.isFinite(Number(point.onchainPayers)));
  if (lastVerified) latest.onchainPayers = Number(lastVerified.onchainPayers);
  return history;
}

const serviceWallet = createServiceWallet({
  privateKey: config.serviceWalletPrivateKey,
  allowEphemeral: config.allowEphemeralWallet,
});
if (!serviceWallet.wallet) {
  throw new Error("Collector wallet unavailable; enable an ephemeral wallet or configure a service wallet secret");
}

const payment = new PaymentClient({ baseUrl: config.paymentApiBase, wallet: serviceWallet.wallet });
const chain = new ChainClient(config.rpcUrls);
const previous = await readSnapshot(config.cacheFile);
const previousHistory = await readHistory(config.historyFile);

const [dashboard, winners, stakingInfo, chainSnapshot] = await Promise.all([
  payment.getDashboard(),
  payment.getWinners(),
  payment.getStakingInfo(),
  chain.getSnapshot(),
]);

const snapshot = buildSnapshot({
  dashboard,
  winners,
  stakingInfo,
  chain: chainSnapshot,
  authMode: serviceWallet.mode,
  staleAfterMs: config.staleAfterMs,
});
assertTransition(previous, snapshot);
await writeSnapshot(config.cacheFile, snapshot);

const history = preserveVerifiedPayerCount(
  updateHistory(previousHistory, snapshot, { maxPoints: 20000 }),
  previousHistory,
);
history._meta = {
  ...history._meta,
  source: "BSC participation events + Payment authenticated snapshots",
  lastCheckedAt: previousHistory?._meta?.chainBackfill?.reconciliation?.snapshotAt
    || previousHistory?._meta?.lastCheckedAt
    || history._meta.lastCheckedAt,
  refreshSeconds: Math.round(config.refreshMs / 1000),
  automatedSnapshotAt: snapshot._meta.fetchedAt,
};
await writeHistory(config.historyFile, history);

console.log(JSON.stringify({
  status: "verified",
  fetchedAt: snapshot._meta.fetchedAt,
  authMode: serviceWallet.mode,
  totalEntries: snapshot.data.totalEntries,
  totalMobile: snapshot.data.totalMobile,
  winnerRecords: snapshot.data.winnerRecords,
  historyPoints: history.points.length,
}));
