import assert from "node:assert/strict";
import test from "node:test";
import { buildSnapshot, sanitizeDashboard, snapshotWithFreshness } from "../server/snapshot.mjs";

test("sanitizeDashboard maps totalDraws without retaining account data", () => {
  const sanitized = sanitizeDashboard({
    totalParticipants: 125,
    totalDraws: 1603,
    totalMobile: 16,
    currRound: 17,
    nextDrawNeed: 97,
    address: "must-not-survive",
    token: "must-not-survive"
  });
  assert.deepEqual(sanitized, {
    totalEntries: 1603,
    totalMobile: 16,
    currRound: 17,
    nextDrawNeed: 97
  });
});

test("buildSnapshot combines authenticated, public and chain evidence", () => {
  const snapshot = buildSnapshot({
    dashboard: { totalParticipants: 1, totalDraws: 2, totalMobile: 3, currRound: 4, nextDrawNeed: 5 },
    winners: [{ drawRound: 1 }],
    chain: { fetchedAt: new Date().toISOString(), ms2TotalSupply: "5110000.0", totalStaked: "77618.3" },
    stakingInfo: { baseRate: 0.15, annualRate: 0.15, currentStaked: 0, nonce: "private-account-field" },
    authMode: "ephemeral",
    staleAfterMs: 300000
  });
  assert.equal(snapshot.code, 200);
  assert.equal(snapshot.data.totalEntries, 2);
  assert.equal(snapshot.data.winnerRecords, 1);
  assert.equal(snapshot.data.ms2Issued, 5110000);
  assert.equal(snapshot.data.baseRate, 0.15);
  assert.equal(snapshot.data.annualRate, 0.15);
  assert.equal("nonce" in snapshot.data, false);
  assert.equal(snapshot._meta.evidence.dashboard, "PAYMENT_AUTHENTICATED");
});

test("snapshotWithFreshness marks an old snapshot stale", () => {
  const old = { _meta: { fetchedAt: "2020-01-01T00:00:00.000Z", status: "verified" }, data: {} };
  assert.equal(snapshotWithFreshness(old, 1000)._meta.status, "stale");
});
