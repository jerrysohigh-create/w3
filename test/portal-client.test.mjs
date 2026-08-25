import test from "node:test";
import assert from "node:assert/strict";
import { PortalClient } from "../server/portal-client.mjs";

test("PortalClient reads the finalized head and paginates filtered logs", async () => {
  const requests = [];
  const pages = [
    [
      { header: { number: 100, timestamp: 1_700_000_000 }, logs: [] },
      { header: { number: 102, timestamp: 1_700_000_006 }, logs: [{ transactionHash: "0x01", logIndex: 0, topics: ["0xaa"], data: "0x" }] },
    ],
    [
      { header: { number: 105, timestamp: 1_700_000_015 }, logs: [{ transactionHash: "0x02", logIndex: 1, topics: ["0xaa"], data: "0x" }] },
    ],
  ];
  const fetchImpl = async (url, options = {}) => {
    if (String(url).endsWith("/finalized-head")) {
      return new Response(JSON.stringify({ number: 105 }), { status: 200, headers: { "content-type": "application/json" } });
    }
    const body = JSON.parse(options.body);
    requests.push(body);
    const page = pages.shift();
    return new Response(`${page.map((block) => JSON.stringify(block)).join("\n")}\n`, { status: 200 });
  };
  const client = new PortalClient({ fetchImpl });

  assert.equal(await client.getFinalizedHead(), 105);
  const logs = await client.queryLogs({ fromBlock: 100, toBlock: 105, address: "0xabc", topic0: "0xdef" });

  assert.deepEqual(requests.map((request) => request.fromBlock), [100, 103]);
  assert.deepEqual(requests[0].logs, [{ address: ["0xabc"], topic0: ["0xdef"] }]);
  assert.deepEqual(logs.map((log) => [log.blockNumber, log.timestamp, log.transactionHash]), [
    [102, 1_700_000_006, "0x01"],
    [105, 1_700_000_015, "0x02"],
  ]);
});

test("PortalClient rejects a stream response that makes no progress", async () => {
  const client = new PortalClient({
    fetchImpl: async () => new Response(`${JSON.stringify({ header: {}, logs: [] })}\n`, { status: 200 }),
  });
  await assert.rejects(
    client.queryLogs({ fromBlock: 100, toBlock: 105, address: "0xabc", topic0: "0xdef" }),
    /did not advance/,
  );
});
