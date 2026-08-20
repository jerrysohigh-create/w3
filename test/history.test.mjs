import assert from "node:assert/strict";
import test from "node:test";
import { historyPoint, updateHistory } from "../server/history.mjs";

function snapshot(fetchedAt, entries = 100) {
  return {
    _meta: { fetchedAt },
    data: {
      totalEntries: entries,
      totalMobile: 1,
      currRound: 2,
      nextDrawNeed: 100 - (entries % 100),
    },
  };
}

test("historyPoint keeps only public cumulative fields", () => {
  const point = historyPoint(snapshot("2026-08-18T00:00:00.000Z"));
  assert.deepEqual(Object.keys(point), ["observedAt", "totalEntries", "totalMobile", "currRound", "nextDrawNeed"]);
});

test("updateHistory adds changed observations and skips unchanged heartbeats", () => {
  const first = updateHistory(null, snapshot("2026-08-18T00:00:00.000Z"));
  const heartbeat = updateHistory(first, snapshot("2026-08-18T00:01:00.000Z"));
  const changed = updateHistory(heartbeat, snapshot("2026-08-18T00:02:00.000Z", 101));
  assert.equal(first.points.length, 1);
  assert.equal(heartbeat.points.length, 1);
  assert.equal(heartbeat._meta.lastCheckedAt, "2026-08-18T00:01:00.000Z");
  assert.equal(changed.points.length, 2);
  assert.equal(changed.points[1].totalEntries, 101);
});
