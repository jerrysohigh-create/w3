(() => {
  const host = document.querySelector('[data-mha-tickers]');
  if (!host) return;
  const tc = document.documentElement.lang.startsWith('zh');
  const labels = tc ? ['\u4ea4\u6613\u6240','\u4ea4\u6613\u5c0d','\u50f9\u683c / USD','24H \u6210\u4ea4\u91cf / USD','\u4ea4\u6613\u5165\u53e3','\u4f86\u6e90\u66f4\u65b0'] : ['Exchange','Pair','Price / USD','24h volume / USD','Market','Source updated'];
  const words = tc ? {loading:'\u8f09\u5165\u4ea4\u6613\u5e02\u5834\u2026', error:'\u5e02\u5834\u8cc7\u6599\u66ab\u4e0d\u53ef\u7528\uff1b\u8acb\u67e5\u770b CoinGecko\u3002', stale:'\u6b77\u53f2\u5feb\u53d6 \u00b7 \u66f4\u65b0\u5931\u6557\u6216\u903e\u6642', live:'\u6bcf 60 \u79d2\u66f4\u65b0', empty:'\u66ab\u7121\u7b26\u5408\u7be9\u9078\u689d\u4ef6\u7684\u4ea4\u6613\u5e02\u5834', trade:'\u524d\u5f80\u4ea4\u6613 \u2197', none:'\u672a\u63d0\u4f9b'} : {loading:'Loading markets\u2026',error:'Markets unavailable; please view CoinGecko.',stale:'Cached data \u00b7 refresh failed or overdue',live:'Refreshes every 60 seconds',empty:'No markets match the data filters.',trade:'Trade \u2197',none:'Not provided'};
  const status = document.createElement('p'); status.setAttribute('role','status'); status.textContent = words.loading;
  const table = document.createElement('table'); table.className = 'mha-tickers-table';
  const caption = table.createCaption(); caption.textContent = tc ? 'CoinGecko \u6536\u9304\u5e02\u5834' : 'Markets tracked by CoinGecko';
  const head = table.createTHead().insertRow();
  labels.forEach(label => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = label; head.append(th); });
  const body = table.createTBody(); host.append(status, table);
  const usd = (n, digits) => n == null ? '\u2014' : new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:digits}).format(n);
  let busy = false;
  async function refresh() {
    if (busy) return; busy = true;
    try {
      const r = await fetch('/api/v1/mha/markets',{cache:'no-store',signal:AbortSignal.timeout(12000)});
      if (!r.ok) throw Error();
      const q = await r.json(); if (!Array.isArray(q.data?.rows)) throw Error();
      body.replaceChildren();
      q.data.rows.forEach(row => {
        const tr = body.insertRow();
        const values = [row.exchange,row.pair,usd(row.priceUsd,6),usd(row.volumeUsd,0),null,new Date(row.updatedAt).toLocaleString(tc ? 'zh-TW' : 'en-GB')];
        values.forEach((value,i) => {
          const cell = tr.insertCell(); cell.dataset.label = labels[i];
          const content = document.createElement('span'); content.textContent = value || '\u2014'; cell.append(content);
          if (i === 4 && row.url && /^https:\/\//i.test(row.url)) {
            const a = document.createElement('a'); a.href = row.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = words.trade; a.setAttribute('aria-label',row.exchange + ' ' + row.pair + ' ' + words.trade); content.replaceChildren(a);
          }
        });
      });
      status.textContent = (q.status === 'live' ? words.live : words.stale) + ' \u00b7 ' + new Date(q.data.fetchedAt).toLocaleString() + (q.data.rows.length ? '' : ' \u00b7 ' + words.empty);
    } catch { status.textContent = body.rows.length ? words.stale : words.error; }
    finally { busy = false; }
  }
  refresh(); setInterval(() => { if (!document.hidden) refresh(); },60000);
  document.addEventListener('visibilitychange',() => { if (!document.hidden) refresh(); });
})();
