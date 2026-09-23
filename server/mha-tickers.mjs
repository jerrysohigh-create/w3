export function createTickerReader(fetcher = fetch, clock = Date.now) {
  let cache = null, checked = -Infinity, pending = null, failed = false;
  return async () => {
    if (!pending && clock() - checked >= 60000) {
      checked = clock();
      pending = (async () => {
        try {
          const headers = {};
          if (process.env.COINGECKO_DEMO_API_KEY) headers['x-cg-demo-api-key'] = process.env.COINGECKO_DEMO_API_KEY;
          const r = await fetcher('https://api.coingecko.com/api/v3/coins/magic-hash/tickers?page=1&order=volume_desc', { headers, signal: AbortSignal.timeout(8000) });
          if (!r.ok) throw Error('upstream');
          const raw = (await r.json()).tickers;
          if (!Array.isArray(raw)) throw Error('invalid');
          const rows = raw.filter(t => t.coin_id === 'magic-hash' && t.is_anomaly === false && t.is_stale === false && t.market?.name && Number.isFinite(t.converted_last?.usd) && t.converted_last.usd > 0 && Number.isFinite(Date.parse(t.timestamp)) && Date.parse(t.timestamp) <= clock() + 60000 && clock() - Date.parse(t.timestamp) < 3600000).map(t => {
            let url = null;
            try { const u = new URL(t.trade_url); if (u.protocol === 'https:' && !u.username && !u.password) url = u.href; } catch {}
            return { exchange: t.market.name, pair: t.base + '/' + t.target, priceUsd: t.converted_last.usd, volumeUsd: Number.isFinite(t.converted_volume?.usd) && t.converted_volume.usd >= 0 ? t.converted_volume.usd : null, updatedAt: t.timestamp, url };
          });
          cache = { rows, fetchedAt: new Date(clock()).toISOString() };
          failed = false;
        } catch { failed = true; }
      })().finally(() => { pending = null; });
    }
    if (pending) await pending;
    return { source: 'CoinGecko', status: !cache ? 'unavailable' : failed || clock() - Date.parse(cache.fetchedAt) > 120000 ? 'stale' : 'live', data: cache };
  };
}
export const readMhaTickers = createTickerReader();
