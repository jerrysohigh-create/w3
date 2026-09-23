export function createMarketReader(fetcher = fetch, clock = Date.now) {
  let cached = null, checked = -Infinity, pending = null;
  return async function readMarket() {
    if (clock() - checked >= 60000 && !pending) {
      checked = clock();
      pending = (async () => {
        try {
          const headers = {};
          if (process.env.COINGECKO_DEMO_API_KEY) headers["x-cg-demo-api-key"] = process.env.COINGECKO_DEMO_API_KEY;
          const response = await fetcher("https://api.coingecko.com/api/v3/simple/price?ids=magic-hash&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true", { headers, signal: AbortSignal.timeout(8000) });
          if (!response.ok) throw new Error("upstream");
          const data = (await response.json())["magic-hash"];
          if (!data || !Number.isFinite(data.usd) || data.usd <= 0 || !Number.isFinite(data.last_updated_at) || data.last_updated_at <= 0 || data.last_updated_at * 1000 > clock() + 60000) throw new Error("invalid");
          cached = { priceUsd: data.usd, change24h: Number.isFinite(data.usd_24h_change) ? data.usd_24h_change : null, volume24hUsd: Number.isFinite(data.usd_24h_vol) && data.usd_24h_vol >= 0 ? data.usd_24h_vol : null, updatedAt: new Date(data.last_updated_at * 1000).toISOString() };
        } catch { /* Keep the last valid quote; freshness is derived below. */ }
      })().finally(() => { pending = null; });
    }
    if (pending) await pending;
    return { source: "CoinGecko", sourceUrl: "https://www.coingecko.com/en/coins/magic-hash", status: !cached ? "unavailable" : clock() - Date.parse(cached.updatedAt) > 300000 ? "stale" : "live", data: cached };
  };
}
export const readMhaMarket = createMarketReader();
