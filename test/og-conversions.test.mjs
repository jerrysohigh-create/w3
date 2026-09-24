import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  OG_CONVERSION_START_BLOCK,
  OgConversionCollector,
  mergeConvertedUsers,
  publicOgConversions,
} from "../server/og-conversions.mjs";

const baseline = {
  code: 200,
  data: {
    participatingWallets: 1085,
    convertedWallets: 744,
    convertedEvents: 744,
    totalAllocatedMs2: "2603654.05782747416005"
  },
  _meta: {
    baselineConvertedWallets: 744,
    baselineBlock: 121253346,
    lastScannedBlock: 121253346
  },
  _state: { seenUsers: [] }
};

function log(user) {
  return { topics: ["0xtopic", `0x${"0".repeat(24)}${user.slice(2)}`] };
}

test("adds each newly finalized conversion user once", () => {
  const first = mergeConvertedUsers(baseline, [
    log("0x1111111111111111111111111111111111111111"),
    log("0x2222222222222222222222222222222222222222"),
    log("0x1111111111111111111111111111111111111111")
  ], { finalizedBlock: 121254000, chainHead: 121254015, confirmations: 15 });
  assert.equal(first.data.convertedWallets, 746);
  assert.equal(first.data.convertedEvents, 746);
  assert.equal(first._state.seenUsers.length, 2);
  const second = mergeConvertedUsers(first, [log("0x1111111111111111111111111111111111111111")], {
    finalizedBlock: 121255000,
    chainHead: 121255015,
    confirmations: 15
  });
  assert.equal(second.data.convertedWallets, 746);
});

test("public payload omits internal incremental address state", () => {
  const safe = publicOgConversions(baseline);
  assert.equal("_state" in safe, false);
  assert.equal(safe.data.convertedWallets, 744);
});

test("fresh server rebuilds the private address set once before incremental sync", async () => {
  const directory = await mkdtemp(join(tmpdir(), "w3-og-bootstrap-"));
  const file = join(directory, "public-sale-og-conversions.json");
  const ranges = [];
  let head = 121300003;
  const portal = {
    getFinalizedHead: async () => {
      const current = head;
      head += 10;
      return current;
    },
    queryLogs: async (range) => {
      ranges.push(range);
      return [
        log("0x1111111111111111111111111111111111111111"),
        log("0x2222222222222222222222222222222222222222"),
      ];
    },
  };
  const chain = { call: async () => `0x${(3000n * 10n ** 18n).toString(16)}` };

  try {
    await writeFile(file, JSON.stringify({
      ...baseline,
      data: { ...baseline.data, convertedWallets: 2, convertedEvents: 2 },
      _state: undefined,
    }), "utf8");
    const collector = new OgConversionCollector({ file, chain, confirmations: 3, portal });
    const rebuilt = await collector.sync();
    assert.equal(ranges[0].fromBlock, OG_CONVERSION_START_BLOCK);
    assert.equal(rebuilt.data.convertedWallets, 2);
    assert.equal(rebuilt._state.seenUsers.length, 2);

    await collector.sync();
    assert.equal(ranges[1].fromBlock, 121300001);
    assert.equal(JSON.parse(await readFile(file, "utf8")).data.convertedWallets, 2);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
