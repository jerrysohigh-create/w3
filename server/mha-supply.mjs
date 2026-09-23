import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export const MHA_TOKEN = "0x37c563cdf4606d4302abb395cdb94e79d31233ed";

export const MHA_DISCLOSED_WALLETS = Object.freeze([
  { address: "0x1117dA6F04376588A94a7B7fDC070607d0ad649C", category: "exchange-allocation", label: "Exchange allocation reserve", labelTc: "交易所分配儲備", treatment: "non-circulating" },
  { address: "0x222EB7Dca28C875115dE21055881E3008df822c4", category: "user-airdrop", label: "User airdrop reserve", labelTc: "用戶空投儲備", treatment: "non-circulating" },
  { address: "0x3337e8082646Df644179db3834b3ACc19bc55eFf", category: "market-making-reserve", label: "Market-making reserve", labelTc: "做市儲備", treatment: "non-circulating" },
  { address: "0x4442ff4eae58dc9dbbe318b284b001b3967478fd", category: "equipment-agents", label: "Equipment agents", labelTc: "設備代理商", treatment: "non-circulating" },
  { address: "0x555d2527752c41c6bdb8166fd6e00d34997be1dd", category: "public-sale", label: "Public sale and subscriptions", labelTc: "公募與訂閱", treatment: "non-circulating" },
  { address: "0x66660077B39DbF0c6225289Fa6c6a4BF4b1C9417", category: "vc", label: "VC allocation", labelTc: "VC 分配", treatment: "non-circulating" },
  { address: "0x777031eb97880cee836ce508b2d24dc66f898358", category: "team", label: "Team and advisers", labelTc: "團隊與顧問", treatment: "non-circulating" },
  { address: "0x888F2F895aCf7E068e5eFF76Ae7E7ec7CC337cDD", category: "ecosystem", label: "Ecosystem / DAO", labelTc: "生態 / DAO", treatment: "non-circulating" },
  { address: "0x999A665B14D33B947813ea1a6525c9C377DBE196", category: "staking", label: "Staking nodes", labelTc: "質押節點", treatment: "non-circulating" },
  { address: "0xaAa2ec1f5bd840754e7459fd848D681bC50D62e8", category: "mining", label: "Mining nodes", labelTc: "挖礦節點", treatment: "non-circulating" },
  { address: "0xcb2326d8f5872905fccdbb684ba9a832cedc911b", category: "listing-fee", label: "Bitget listing-fee wallet", labelTc: "Bitget 上幣費錢包", treatment: "review-required" }
]);

export const MHA_EXCHANGE_CUSTODY_WALLETS = Object.freeze([
  { address: "0x1ab4973a48dc892cd9971ece8e01dcc7688f8f23", exchange: "Bitget", label: "Observed pooled custody destination", labelTc: "已觀察混合託管歸集地址", calculationRole: "observation-only" },
  { address: "0x53f78a071d04224b8e254e243fffc6d9f2f3fa23", exchange: "KuCoin", label: "Observed pooled custody destination", labelTc: "已觀察混合託管歸集地址", calculationRole: "observation-only" },
  { address: "0x124d9bf2fecbc16b54ec4accdb14d44c2144f012", exchange: "LBank", label: "Observed pooled custody destination", labelTc: "已觀察混合託管歸集地址", calculationRole: "observation-only" },
  { address: "0x4982085c9e2f89f2ecb8131eca71afad896e89cb", exchange: "MEXC", label: "Observed pooled custody destination", labelTc: "已觀察混合託管歸集地址", calculationRole: "observation-only" }
]);

function integerUnits(value) {
  const [whole = "0", fraction = ""] = String(value ?? "0").split(".");
  return BigInt(`${whole}${fraction.padEnd(18, "0").slice(0, 18)}`);
}

function decimalUnits(value) {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const whole = absolute / 10n ** 18n;
  const fraction = (absolute % 10n ** 18n).toString().padStart(18, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

export function calculateMhaSupply({ totalSupply, wallets, platformReady = false }) {
  const total = integerUnits(totalSupply);
  const primary = wallets.filter((wallet) => wallet.treatment === "non-circulating");
  const review = wallets.filter((wallet) => wallet.treatment === "review-required");
  const primaryBalance = primary.reduce((sum, wallet) => sum + integerUnits(wallet.balance), 0n);
  const reviewWalletBalance = review.reduce((sum, wallet) => sum + integerUnits(wallet.balance), 0n);
  const released = total - primaryBalance;
  const publicationReady = platformReady && reviewWalletBalance === 0n;
  return {
    totalSupply: decimalUnits(total),
    maxSupply: decimalUnits(total),
    disclosedNonCirculating: decimalUnits(primaryBalance),
    releasedFromPrimaryWallets: decimalUnits(released),
    reviewWalletBalance: decimalUnits(reviewWalletBalance),
    circulatingSupply: publicationReady ? decimalUnits(released) : null,
    platformReady: publicationReady
  };
}

export async function collectMhaSupply({ chain, platformReady = false }) {
  const blockNumber = await chain.blockNumber();
  const blockTag = `0x${blockNumber.toString(16)}`;
  const [totalSupply, balances, custodyBalances] = await Promise.all([
    chain.tokenTotalSupply(MHA_TOKEN, 18, blockTag),
    Promise.all(MHA_DISCLOSED_WALLETS.map((wallet) => chain.tokenBalance(MHA_TOKEN, wallet.address, 18, blockTag))),
    Promise.all(MHA_EXCHANGE_CUSTODY_WALLETS.map((wallet) => chain.tokenBalance(MHA_TOKEN, wallet.address, 18, blockTag)))
  ]);
  const wallets = MHA_DISCLOSED_WALLETS.map((wallet, index) => ({ ...wallet, balance: balances[index] }));
  const exchangeCustodyWallets = MHA_EXCHANGE_CUSTODY_WALLETS.map((wallet, index) => ({ ...wallet, balance: custodyBalances[index] }));
  const metrics = calculateMhaSupply({ totalSupply, wallets, platformReady });
  const publicMetrics = {
    totalSupply: metrics.totalSupply,
    maxSupply: metrics.maxSupply,
    disclosedNonCirculating: metrics.disclosedNonCirculating,
    releasedFromPrimaryWallets: metrics.releasedFromPrimaryWallets,
    circulatingSupply: metrics.circulatingSupply,
    platformReady: metrics.platformReady
  };
  const publicWallets = wallets.filter((wallet) => wallet.treatment === "non-circulating" || integerUnits(wallet.balance) > 0n);
  return {
    code: 200,
    data: {
      token: { name: "MAGNE.AI", symbol: "MHA", network: "BNB Smart Chain", chainId: 56, decimals: 18, contract: MHA_TOKEN },
      metrics: publicMetrics,
      wallets: publicWallets,
      evidence: {
        exchangeCustodyWallets,
        boundary: "Pooled exchange custody balances are public-market observations only. They are not project holdings, internal market-making balances or direct circulating-supply deductions."
      },
      methodology: {
        equation: "totalSupply - disclosedNonCirculating = releasedFromPrimaryWallets; released is not automatically official circulating supply",
        officialCirculatingSupply: metrics.platformReady ? "published" : "withheld-pending-classification",
        note: "Released from primary allocation wallets is not automatically public circulating supply. Pooled exchange custody balances are observations, not direct deductible-wallet inputs."
      }
    },
    _meta: {
      status: metrics.platformReady ? "live" : "review",
      fetchedAt: new Date().toISOString(),
      blockNumber,
      source: "BSC RPC eth_call at one block",
      version: "2026-09-22"
    }
  };
}

export async function readMhaSupply(file) {
  try { return JSON.parse(await readFile(file, "utf8")); } catch { return null; }
}

export async function writeMhaSupply(file, payload) {
  await mkdir(dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  await writeFile(temporary, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await rename(temporary, file);
}

export function mhaSupplyWithFreshness(payload, staleAfterMs) {
  if (!payload) return null;
  const ageMs = Date.now() - Date.parse(payload?._meta?.fetchedAt || 0);
  return {
    ...payload,
    _meta: {
      ...payload._meta,
      ageSeconds: Number.isFinite(ageMs) ? Math.max(0, Math.round(ageMs / 1000)) : null,
      status: Number.isFinite(ageMs) && ageMs <= staleAfterMs ? payload._meta.status : "stale"
    }
  };
}
