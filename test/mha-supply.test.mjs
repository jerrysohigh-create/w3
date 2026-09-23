import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateMhaSupply,
  collectMhaSupply,
  MHA_EXCHANGE_CUSTODY_WALLETS
} from "../server/mha-supply.mjs";

test("MHA public market observation register contains four pooled custody wallets", () => {
  assert.equal(MHA_EXCHANGE_CUSTODY_WALLETS.length, 4);
  assert.equal(new Set(MHA_EXCHANGE_CUSTODY_WALLETS.map((item) => item.address.toLowerCase())).size, 4);
  assert.ok(MHA_EXCHANGE_CUSTODY_WALLETS.every((item) => item.calculationRole === "observation-only"));
});

test("MHA public payload omits internal review adjustments and zero-balance review wallets", async () => {
  const payload = await collectMhaSupply({
    platformReady: false,
    chain: {
      blockNumber: async () => 123n,
      tokenTotalSupply: async () => "10000000000",
      tokenBalance: async (_token, address) => address.toLowerCase() === "0xcb2326d8f5872905fccdbb684ba9a832cedc911b" ? "0" : "1"
    }
  });
  assert.equal(Object.hasOwn(payload.data, "reviewAdjustments"), false);
  assert.equal(Object.hasOwn(payload.data.metrics, "reviewRequiredBalance"), false);
  assert.equal(payload.data.wallets.some((wallet) => wallet.category === "listing-fee"), false);
  assert.equal(payload.data.evidence.exchangeCustodyWallets.length, 4);
});

test("MHA supply remains gated until classifications are approved", () => {
  const result = calculateMhaSupply({
    totalSupply: "10000000000",
    wallets: [
      { treatment: "non-circulating", balance: "9922114500" },
      { treatment: "review-required", balance: "40000000" }
    ],
    platformReady: false
  });
  assert.equal(result.releasedFromPrimaryWallets, "77885500");
  assert.equal(result.circulatingSupply, null);
});

test("MHA supply publishes the classified result only after approval", () => {
  const result = calculateMhaSupply({
    totalSupply: "10000000000",
    wallets: [
      { treatment: "non-circulating", balance: "9922114500" },
      { treatment: "review-required", balance: "0" }
    ],
    platformReady: true
  });
  assert.equal(result.circulatingSupply, "77885500");
  assert.equal(result.platformReady, true);
});

test("MHA supply fails closed when a monitored review wallet has a positive balance", () => {
  const result = calculateMhaSupply({
    totalSupply: "10000000000",
    wallets: [
      { treatment: "non-circulating", balance: "9922114500" },
      { treatment: "review-required", balance: "1" }
    ],
    platformReady: true
  });
  assert.equal(result.circulatingSupply, null);
  assert.equal(result.platformReady, false);
});
