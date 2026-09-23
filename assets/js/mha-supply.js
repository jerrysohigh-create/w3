(function () {
  var root = document.body.dataset.assetRoot || "";
  var PAGE_REFRESH_MS = 30000;
  var refreshInFlight = false;
  var hasRendered = false;
  function format(value) {
    if (value == null || value === "") return "PENDING";
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(Number(value));
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
    document.querySelectorAll('[data-metric="' + name + '"]').forEach(function (node) {
      node.textContent = format(value);
    });
  }

  function addressLink(address, contract) {
    var link = document.createElement("a");
    link.href = "https://bscscan.com/token/" + contract + "?a=" + address;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = address.slice(0, 8) + "…" + address.slice(-6) + " ↗";
    link.setAttribute("aria-label", address + " on BscScan");
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
        row.innerHTML = '<div><span>EXCHANGE</span><strong></strong></div><div><span>OBSERVED CUSTODY ADDRESS</span></div><div><span>WALLET BALANCE</span><b></b><small>POOLED EXCHANGE CUSTODY</small></div><div><span>MEANING</span><i>NOT AN INTERNAL MM BALANCE</i></div><div><span>CALCULATION</span><em>OBSERVATION ONLY</em></div>';
        row.querySelector("strong").textContent = item.exchange;
        row.children[1].appendChild(addressLink(item.address, contract));
        row.querySelector("b").textContent = format(item.balance) + " MHA";
        custody.appendChild(row);
      });
    }
  }

  function render(payload) {
    var metrics = payload.data.metrics;
    ["totalSupply", "disclosedNonCirculating", "releasedFromPrimaryWallets", "circulatingSupply"].forEach(function (name) {
      metric(name, metrics[name]);
    });
    var state = document.querySelector("[data-supply-state]");
    var isLive = payload._meta.status === "live";
    var isSnapshot = payload._meta.status === "snapshot" || payload._meta.status === "stale";
    state.className = "supply-state " + (isLive ? "is-live" : "is-snapshot");
    state.innerHTML = "<i></i> " + (isLive ? "CHAIN LIVE · OFFICIAL SUPPLY" : isSnapshot ? "SAVED SNAPSHOT · OFFICIAL SUPPLY" : "PUBLICATION PAUSED · CLASSIFICATION REVIEW");
    document.querySelector('[data-field="blockNumber"]').textContent = new Intl.NumberFormat("en-US").format(payload._meta.blockNumber);
    document.querySelector('[data-field="fetchedAt"]').textContent = new Date(payload._meta.fetchedAt).toLocaleString("en-GB", { hour12: false });

    var wallets = document.querySelector("[data-wallets]");
    wallets.innerHTML = "";
    payload.data.wallets.forEach(function (wallet) {
      var row = document.createElement("article");
      var treatment = wallet.treatment === "non-circulating" ? "NON-CIRCULATING" : "REVIEW REQUIRED";
      row.className = wallet.treatment === "non-circulating" ? "" : "is-review";
      row.innerHTML = '<div><span>CLASS</span><strong></strong></div><div><span>ADDRESS</span><a target="_blank" rel="noopener noreferrer"></a></div><div><span>BALANCE</span><b></b></div><div><span>TREATMENT</span><em></em></div>';
      row.querySelector("strong").textContent = wallet.label;
      var link = row.querySelector("a");
      link.href = "https://bscscan.com/token/" + payload.data.token.contract + "?a=" + wallet.address;
      link.textContent = wallet.address.slice(0, 8) + "…" + wallet.address.slice(-6) + " ↗";
      link.setAttribute("aria-label", wallet.address + " on BscScan");
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
        state.innerHTML = "<i></i> DATA UNAVAILABLE";
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
