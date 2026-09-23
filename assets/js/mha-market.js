(() => {
  const panel = document.querySelector("[data-mha-market]");
  if (!panel) return;
  const tc = document.documentElement.lang.toLowerCase().startsWith("zh");
  let busy = false;
  const set = (key, value) => { panel.querySelector('[data-market-' + key + ']').textContent = value; };
  async function refresh() {
    if (busy) return;
    busy = true;
    try {
      const r = await fetch("/api/v1/mha/market", { cache: "no-store", signal: AbortSignal.timeout(12000) });
      if (!r.ok) throw new Error();
      const q = await r.json(), d = q.data;
      if (d) {
        set("price", new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 6 }).format(d.priceUsd));
        set("change", d.change24h == null ? "\u2014" : (d.change24h > 0 ? "+" : "") + d.change24h.toFixed(2) + "%");
        set("volume", d.volume24hUsd == null ? "\u2014" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(d.volume24hUsd));
        set("time", (q.status === "live" ? (tc ? "\u884c\u60c5\u66f4\u65b0\uff1a" : "Updated: ") : (tc ? "\u6b77\u53f2\u5feb\u53d6\uff1a" : "Cached quote: ")) + new Date(d.updatedAt).toLocaleString());
      } else throw new Error();
    } catch {
      set("time", tc ? "\u884c\u60c5\u66ab\u4e0d\u53ef\u7528\uff0c\u8acb\u524d\u5f80 CoinGecko \u67e5\u770b\u3002" : "Quotes temporarily unavailable. View CoinGecko.");
    } finally { busy = false; }
  }
  refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
})();
