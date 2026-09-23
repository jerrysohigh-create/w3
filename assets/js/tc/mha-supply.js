(function () {
  var root = document.body.dataset.assetRoot || "";
  var PAGE_REFRESH_MS = 30000;
  var refreshInFlight = false;
  var hasRendered = false;
  function format(value) {
    if (value == null || value === "") return "待確認";
    return new Intl.NumberFormat("zh-Hant", { maximumFractionDigits: 4 }).format(Number(value));
  }
  async function readData() {
    try {
      var response = await fetch("/api/v1/mha/supply", { cache: "no-store" });
      if (!response.ok) throw new Error("live endpoint unavailable");
      return await response.json();
    } catch (_) {
      var fallback = await fetch(root + "assets/data/mha-supply-snapshot.json", { cache: "no-store" });
      if (!fallback.ok) throw new Error("snapshot unavailable");
      var payload = await fallback.json();
      payload._meta.status = "snapshot";
      return payload;
    }
  }
  function metric(name, value) {
    document.querySelectorAll('[data-metric="' + name + '"]').forEach(function (node) { node.textContent = format(value); });
  }
  function addressLink(address, contract) {
    var link = document.createElement("a");
    link.href = "https://bscscan.com/token/" + contract + "?a=" + address;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = address.slice(0, 8) + "…" + address.slice(-6) + " ↗";
    link.setAttribute("aria-label", address + "，在 BscScan 開啟");
    return link;
  }
  function renderEvidence(payload) {
    var evidence = payload.data.evidence || {};
    var contract = payload.data.token.contract;
    var custody = document.querySelector("[data-custody-wallets]");
    if (custody) {
      custody.innerHTML = "";
      (evidence.exchangeCustodyWallets || []).forEach(function (item) {
        var row = document.createElement("article");
        row.className = "is-observation";
        row.innerHTML = '<div><span>交易所</span><strong></strong></div><div><span>已觀察託管地址</span></div><div><span>錢包餘額</span><b></b><small>交易所混合託管</small></div><div><span>含義</span><i>不是內部做市帳戶餘額</i></div><div><span>計算角色</span><em>僅供觀察</em></div>';
        row.querySelector("strong").textContent = item.exchange;
        row.children[1].appendChild(addressLink(item.address, contract));
        row.querySelector("b").textContent = format(item.balance) + " MHA";
        custody.appendChild(row);
      });
    }
  }
  function render(payload) {
    var metrics = payload.data.metrics;
    ["totalSupply", "disclosedNonCirculating", "releasedFromPrimaryWallets", "circulatingSupply"].forEach(function (name) { metric(name, metrics[name]); });
    var state = document.querySelector("[data-supply-state]");
    var isLive = payload._meta.status === "live";
    var isSnapshot = payload._meta.status === "snapshot" || payload._meta.status === "stale";
    state.className = "supply-state " + (isLive ? "is-live" : "is-snapshot");
    state.innerHTML = "<i></i> " + (isLive ? "鏈上即時 · 官方流通量" : isSnapshot ? "已保存快照 · 官方流通量" : "發布已暫停 · 分類審查中");
    document.querySelector('[data-field="blockNumber"]').textContent = new Intl.NumberFormat("en-US").format(payload._meta.blockNumber);
    document.querySelector('[data-field="fetchedAt"]').textContent = new Date(payload._meta.fetchedAt).toLocaleString("zh-Hant", { hour12: false });
    var wallets = document.querySelector("[data-wallets]");
    wallets.innerHTML = "";
    payload.data.wallets.forEach(function (wallet) {
      var row = document.createElement("article");
      var treatment = wallet.treatment === "non-circulating" ? "非流通" : "需要審查";
      row.className = wallet.treatment === "non-circulating" ? "" : "is-review";
      row.innerHTML = '<div><span>類別</span><strong></strong></div><div><span>地址</span><a target="_blank" rel="noopener noreferrer"></a></div><div><span>餘額</span><b></b></div><div><span>處理</span><em></em></div>';
      row.querySelector("strong").textContent = wallet.labelTc;
      var link = row.querySelector("a");
      link.href = "https://bscscan.com/token/" + payload.data.token.contract + "?a=" + wallet.address;
      link.textContent = wallet.address.slice(0, 8) + "…" + wallet.address.slice(-6) + " ↗";
      link.setAttribute("aria-label", wallet.address + "，在 BscScan 開啟");
      row.querySelector("b").textContent = format(wallet.balance) + " MHA";
      row.querySelector("em").textContent = treatment;
      wallets.appendChild(row);
    });
    renderEvidence(payload);
    hasRendered = true;
  }

  async function refreshData() {
    if (refreshInFlight) return;
    refreshInFlight = true;
    try {
      render(await readData());
    } catch (_) {
      if (!hasRendered) {
        var state = document.querySelector("[data-supply-state]");
        state.className = "supply-state is-error";
        state.innerHTML = "<i></i> 資料暫時不可用";
      }
    } finally {
      refreshInFlight = false;
    }
  }

  refreshData();
  setInterval(function () {
    if (document.visibilityState === "visible") refreshData();
  }, PAGE_REFRESH_MS);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") refreshData();
  });
})();
