import assert from "node:assert/strict";
import test from "node:test";
import { PaymentClient } from "../server/payment-client.mjs";

test("concurrent protected requests share one authentication flow", async () => {
  const originalFetch = globalThis.fetch;
  let challengeCalls = 0;
  let loginCalls = 0;
  const wallet = {
    getAddress: async () => "0x0000000000000000000000000000000000000001",
    signMessage: async () => "0xtest-signature"
  };

  globalThis.fetch = async (url, options = {}) => {
    if (url.includes("/auth/challenge")) {
      challengeCalls += 1;
      return Response.json({ code: 200, data: { uuid: "test-uuid", message: "test-message" } });
    }
    if (url.endsWith("/auth/login")) {
      loginCalls += 1;
      return Response.json({ code: 200, data: { token: "test-token" } });
    }
    assert.equal(options.headers.token, "test-token");
    if (url.includes("lottery2/dashboard")) return Response.json({ code: 200, data: { totalDraws: 1 } });
    if (url.includes("ms2-staking/info")) return Response.json({ code: 200, data: { baseRate: 0.15 } });
    throw new Error(`Unexpected URL ${url}`);
  };

  try {
    const client = new PaymentClient({ baseUrl: "https://example.test/api", wallet });
    const [dashboard, staking] = await Promise.all([client.getDashboard(), client.getStakingInfo()]);
    assert.equal(dashboard.totalDraws, 1);
    assert.equal(staking.baseRate, 0.15);
    assert.equal(challengeCalls, 1);
    assert.equal(loginCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
