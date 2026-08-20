import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

function finiteNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`Invalid ${field}`);
  return number;
}

export function sanitizeDashboard(data) {
  return {
    totalEntries: finiteNumber(data.totalDraws ?? data.totalEntries, "totalEntries"),
    totalMobile: finiteNumber(data.totalMobile, "totalMobile"),
    currRound: finiteNumber(data.currRound, "currRound"),
    nextDrawNeed: finiteNumber(data.nextDrawNeed, "nextDrawNeed")
  };
}

export function buildSnapshot({ dashboard, winners, chain, stakingInfo = {}, authMode, staleAfterMs }) {
  const sanitized = sanitizeDashboard(dashboard);
  const fetchedAt = new Date().toISOString();
  const ms2Issued = chain.ms2TotalSupply == null ? null : Number(chain.ms2TotalSupply);
  const liquidityPrepared = chain.totalStaked == null ? null : Number(chain.totalStaked);

  return {
    _meta: {
      fetchedAt,
      onchainFetchedAt: chain.fetchedAt,
      source: "W3 authenticated collector",
      status: "verified",
      authMode,
      staleAfterSeconds: Math.round(staleAfterMs / 1000),
      evidence: {
        dashboard: "PAYMENT_AUTHENTICATED",
        winners: "PAYMENT_PUBLIC_API",
        contracts: "BSC_RPC"
      }
    },
    code: 200,
    msg: "ok",
    data: {
      ...sanitized,
      ms2Issued: Number.isFinite(ms2Issued) ? ms2Issued : null,
      liquidityPrepared: Number.isFinite(liquidityPrepared) ? liquidityPrepared : null,
      baseRate: Number.isFinite(Number(stakingInfo.baseRate)) ? Number(stakingInfo.baseRate) : null,
      annualRate: Number.isFinite(Number(stakingInfo.annualRate)) ? Number(stakingInfo.annualRate) : null,
      winnerRecords: winners.length
    },
    contracts: chain
  };
}

export function snapshotWithFreshness(snapshot, staleAfterMs) {
  if (!snapshot?._meta?.fetchedAt) return snapshot;
  const ageMs = Date.now() - new Date(snapshot._meta.fetchedAt).getTime();
  return {
    ...snapshot,
    _meta: {
      ...snapshot._meta,
      ageSeconds: Math.max(0, Math.floor(ageMs / 1000)),
      status: ageMs > staleAfterMs ? "stale" : "verified"
    }
  };
}

export async function writeSnapshot(file, snapshot) {
  await mkdir(dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  await writeFile(temporary, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  await rename(temporary, file);
}

export async function readSnapshot(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}
