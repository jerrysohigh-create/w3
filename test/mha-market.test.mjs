import test from "node:test";
import assert from "node:assert/strict";
import { createMarketReader } from "../server/mha-market.mjs";
test("deduplicates requests and marks retained quotes stale after upstream failure", async () => {
  let now = 1800000000000, calls = 0;
  const read = createMarketReader(async () => {
    calls++;
    if (calls > 1) throw new Error("offline");
    return { ok: true, json: async () => ({ "magic-hash": { usd: .05, usd_24h_change: null, usd_24h_vol: 0, last_updated_at: now / 1000 } }) };
  }, () => now);
  const results = await Promise.all([read(), read()]);
  assert.equal(calls, 1);
  assert.equal(results[0].status, "live");
  assert.equal(results[1].data.volume24hUsd, 0);
  assert.equal(results[0].data.change24h, null);
  now += 360000;
  assert.equal((await read()).status, "stale");
  assert.equal((await read()).data.priceUsd, .05);
  assert.equal(calls, 2);
});
test("invalid quotes are not published", async () => {
  const read = createMarketReader(async () => ({ ok: true, json: async () => ({ "magic-hash": { usd: -1, last_updated_at: 1 } }) }));
  assert.deepEqual((await read()).data, null);
});
