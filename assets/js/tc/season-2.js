(function () {
  var assetRoot = document.body.dataset.assetRoot || "";
  var collectorSource = { url: "/api/v1/season-2/dashboard", label: "W3 AUTHENTICATED COLLECTOR", mode: "collector" };
  var verifiedSnapshotSource = { url: assetRoot + "assets/data/season-2-snapshot.json", label: "W3 VERIFIED SNAPSHOT", mode: "snapshot" };
  var snapshotSources = [collectorSource, verifiedSnapshotSource];
  var listSource = "https://payment.magne.ai/api/v1/lottery2/list";
  var winnersSource = "https://payment.magne.ai/api/v1/lottery2/winners";
  var leaderboardSource = "https://payment.magne.ai/api/v1/lottery2/leaderboard";
  var totalPhones = 1600;
  var entriesPerRound = 100;
  var entryFee = 17;
  var ms2PerEntry = 10;
  var expectedLotteryImplementation = "0x877f5c053f3f3b43063572b432ff7b7f7b08226b";
  var expectedStakingImplementation = "0x9a7d5e82ab8bb64e279d02f80ff87ad42397532c";
  var leaderboardRatios = [40, 15, 10, 8, 7, 6, 5, 4, 3, 2];

  function get(id) {
    return document.getElementById(id);
  }

  function formatNumber(value, options) {
    var number = Number(value);
    if (!Number.isFinite(number)) return "—";
    return number.toLocaleString("en-US", options || {});
  }

  function setText(id, value) {
    var element = get(id);
    if (element) element.textContent = value;
  }

  function setField(field, value) {
    document.querySelectorAll('[data-s2-field="' + field + '"]').forEach(function (element) {
      element.textContent = value;
    });
  }

  function setSourceState(message, status, mode) {
    var state = get("s2-source-state");
    var badge = get("s2-source-badge");
    var verified = status === "verified" && mode === "collector";
    var snapshot = status === "verified" && mode !== "collector";
    var stale = status === "stale";
    if (state) {
      state.textContent = message;
      state.classList.toggle("lime", verified);
      state.style.color = stale ? "var(--amber)" : "";
    }
    if (badge) {
      badge.textContent = verified ? "VERIFIED LIVE" : snapshot ? "VERIFIED SNAPSHOT" : stale ? "STALE SNAPSHOT" : "UNAVAILABLE";
      badge.style.color = verified ? "var(--lime)" : snapshot ? "var(--cyan)" : "var(--amber)";
    }
    var pageState = get("s2-page-state");
    var stakingState = get("s2-staking-state");
    var stateLabel = verified ? "LIVE COLLECTOR" : snapshot ? "VERIFIED SNAPSHOT" : stale ? "STALE SNAPSHOT" : "SOURCE UNAVAILABLE";
    if (pageState) {
      pageState.textContent = stateLabel;
      pageState.classList.remove("is-checking", "is-snapshot", "is-stale", "is-unavailable");
      if (snapshot) pageState.classList.add("is-snapshot");
      if (stale) pageState.classList.add("is-stale");
      if (!verified && !snapshot && !stale) pageState.classList.add("is-unavailable");
    }
    if (stakingState) {
      stakingState.textContent = stateLabel;
      stakingState.className = "intel-state " + (verified ? "live" : stale ? "watch" : snapshot ? "" : "alert");
    }
  }

  function snapshotStatus(payload) {
    var meta = payload && payload._meta;
    if (!meta) return "stale";
    if (meta.status === "stale") return "stale";
    var fetchedAt = new Date(meta.fetchedAt || meta.onchainFetchedAt || 0).getTime();
    var staleAfter = Number(meta.staleAfterSeconds || 300) * 1000;
    return fetchedAt && Date.now() - fetchedAt <= staleAfter ? "verified" : "stale";
  }

  function applySnapshot(payload) {
    var data = payload.data || {};
    var entries = formatNumber(data.totalEntries);
    var phones = formatNumber(data.totalMobile);
    var currentRound = Number(data.currRound);
    var nextDrawNeed = Number(data.nextDrawNeed);
    var totalEntries = Number(data.totalEntries);
    var totalMobile = Number(data.totalMobile);
    var currentEntries = Number.isFinite(nextDrawNeed) ? entriesPerRound - nextDrawNeed : totalEntries % entriesPerRound;
    var needed = Number.isFinite(nextDrawNeed) ? nextDrawNeed : entriesPerRound - currentEntries;
    var progress = Math.max(0, Math.min(100, currentEntries));

    setField("entries", entries);
    setField("phones", phones);
    setText("s2-phones-remaining", Number.isFinite(totalMobile) ? formatNumber(totalPhones - totalMobile) + " REMAINING" : "— REMAINING");
    setText("s2-usdt-pool", Number.isFinite(totalEntries) ? "$" + formatNumber(totalEntries * entryFee) : "—");
    setText("s2-ms2-credits", Number.isFinite(totalEntries) ? formatNumber(totalEntries * ms2PerEntry) : "—");
    setText("s2-round", Number.isFinite(currentRound) ? formatNumber(currentRound) : "—");
    setText("s2-current-entries", Number.isFinite(currentEntries) ? formatNumber(currentEntries) : "—");
    setText("s2-needed", Number.isFinite(needed) ? formatNumber(needed) : "—");

    var progressBar = get("s2-progress");
    if (progressBar) progressBar.style.width = progress + "%";

    setText("s2-ms2-issued", Number.isFinite(Number(data.ms2Issued)) ? formatNumber(data.ms2Issued) + " MS2" : "—");
    setText("s2-liquidity", Number.isFinite(Number(data.liquidityPrepared)) ? formatNumber(data.liquidityPrepared, { maximumFractionDigits: 2 }) + " MS2" : "—");
    setText("s2-base-rate", Number.isFinite(Number(data.baseRate)) ? formatNumber(Number(data.baseRate) * 100, { maximumFractionDigits: 4 }) + "%" : "—");

    var ms2Supply = Number(data.ms2Issued);
    var ms2Staked = Number(data.liquidityPrepared);
    var stakingRatio = Number.isFinite(ms2Supply) && ms2Supply > 0 && Number.isFinite(ms2Staked)
      ? (ms2Staked / ms2Supply) * 100
      : NaN;
    setText("s2-staking-ratio", Number.isFinite(stakingRatio) ? formatNumber(stakingRatio, { minimumFractionDigits: 4, maximumFractionDigits: 4 }) + "%" : "—");
    setText("s2-ci-supply", Number.isFinite(ms2Supply) ? formatNumber(ms2Supply) + " MS2" : "—");
    setText("s2-ci-staked", Number.isFinite(ms2Staked) ? formatNumber(ms2Staked, { maximumFractionDigits: 2 }) + " MS2" : "—");
    setText("s2-ci-gross-usdt", Number.isFinite(totalEntries) ? "$" + formatNumber(totalEntries * entryFee) + " USDT" : "—");

    var contracts = payload.contracts || {};
    var lottery = contracts.lottery || {};
    var staking = contracts.staking || {};
    var lotteryImplementation = String(lottery.implementation || "").toLowerCase();
    var stakingImplementation = String(staking.implementation || "").toLowerCase();
    var implementationsMatch = lotteryImplementation === expectedLotteryImplementation && stakingImplementation === expectedStakingImplementation;
    setText("s2-lottery-implementation", lotteryImplementation ? shortAddress(lotteryImplementation) : "—");
    setText("s2-staking-implementation", stakingImplementation ? shortAddress(stakingImplementation) : "—");
    setText("s2-contract-cost", lottery.costPerDraw != null ? formatNumber(lottery.costPerDraw, { maximumFractionDigits: 4 }) + " USDT" : "—");
    setText("s2-contract-ms2", lottery.ms2PerDraw != null ? formatNumber(lottery.ms2PerDraw, { maximumFractionDigits: 4 }) + " MS2" : "—");
    setText("s2-contract-max", lottery.maxDrawsPerUser != null ? formatNumber(lottery.maxDrawsPerUser) : "—");
    setText("s2-contract-active", lottery.active === true ? "ACTIVE" : lottery.active === false ? "PAUSED" : "—");
    var matchBadge = get("s2-contract-match");
    if (matchBadge) {
      matchBadge.textContent = implementationsMatch ? "2 / 2 MATCHED" : lotteryImplementation || stakingImplementation ? "REVIEW" : "UNAVAILABLE";
      matchBadge.classList.toggle("ok", implementationsMatch);
      matchBadge.classList.toggle("alert", !implementationsMatch);
    }

    var fetchedAt = payload._meta && (payload._meta.onchainFetchedAt || payload._meta.fetchedAt);
    if (fetchedAt) setText("s2-fetched-at", new Date(fetchedAt).toLocaleString("zh-Hant", { hour12: false }));
  }

  async function loadSnapshot() {
    for (var index = 0; index < snapshotSources.length; index += 1) {
      var source = snapshotSources[index];
      try {
        var separator = source.url.indexOf("?") === -1 ? "?" : "&";
        var response = await fetch(source.url + separator + "t=" + Date.now(), { cache: "no-store" });
        if (!response.ok) throw new Error("Season 2 snapshot HTTP " + response.status);
        var payload = await response.json();
        if (payload.code !== 200 || !payload.data) throw new Error("Season 2 snapshot payload");
        applySnapshot(payload);
        var status = snapshotStatus(payload);
        var fetchedAt = payload._meta && payload._meta.fetchedAt;
        var timeLabel = fetchedAt ? new Date(fetchedAt).toLocaleString("zh-Hant", { hour12: false }) : "UNKNOWN TIME";
        var mode = source.mode || "snapshot";
        var suffix = status === "verified"
          ? (mode === "collector" ? "· 即時擷取器已驗證。" : "· 已驗證快照；即時擷取器目前無法使用。")
          : "· 快照已過期，等待重新收集。";
        setSourceState(source.label + " · " + timeLabel + suffix, status, mode);
        return true;
      } catch (error) {
        continue;
      }
    }
    setSourceState("Season 2 已驗證資料暫時無法使用；頁面不使用範例資料。", "unavailable", "none");
    return false;
  }

  function shortAddress(address) {
    if (!address || address.length < 12) return address || "—";
    return address.slice(0, 6) + "…" + address.slice(-4);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function loadLatestDraw() {
    return fetch(listSource, { cache: "no-store" }).then(function (response) {
      if (!response.ok) throw new Error("Lottery2 list");
      return response.json();
    }).then(function (payload) {
      var rows = Array.isArray(payload.data) ? payload.data : ((payload.data && (payload.data.list || payload.data.rows)) || []);
      var container = get("s2-latest-draw");
      if (!container) return false;
      if (payload.code !== 200 || !rows.length) {
        container.innerHTML = '<p class="empty-copy">暫無公開中選記錄；原介面當前未返回可展示資料。</p>';
        return false;
      }
      var row = rows[0];
      var tx = row.txHash || row.tx || "";
      var result = row.result || row.winner || row.prize || "—";
      var time = row.time || row.timestamp || row.blockTime;
      container.innerHTML = '<dl class="record-ledger"><div><dt>RESULT</dt><dd>' + escapeHtml(result) + '</dd></div><div><dt>TIME</dt><dd>' + escapeHtml(time ? new Date(time).toLocaleString("zh-Hant", { hour12: false }) : "—") + '</dd></div><div><dt>TX</dt><dd>' + (tx ? '<a class="cyan mono" href="https://bscscan.com/tx/' + encodeURIComponent(tx) + '" target="_blank" rel="noopener">' + escapeHtml(shortAddress(tx)) + ' ↗</a>' : "—") + '</dd></div></dl>';
      return true;
    }).catch(function () {
      var container = get("s2-latest-draw");
      if (container) container.innerHTML = '<p class="empty-copy">最近中選介面需要有效訪問狀態，當前沒有公開記錄可顯示。</p>';
      return false;
    });
  }

  function renderWinners(rows) {
    var list = get("s2-winner-list");
    if (!list) return;
    list.innerHTML = "";
    if (!Array.isArray(rows) || !rows.length) {
      list.innerHTML = '<div class="winner-row"><span class="winner-round">[ UNAVAILABLE ]</span><span class="winner-address">公開中選記錄暫時不可用。</span><span class="winner-state pending">NO FALLBACK DATA</span></div>';
      setText("s2-winners-count", "公開介面目前沒有回傳中選記錄。");
      return;
    }
    rows.forEach(function (winner) {
      var row = document.createElement("div");
      row.className = "winner-row";

      var round = document.createElement("span");
      round.className = "winner-round";
      round.textContent = "ROUND " + (winner.drawRound || "—");

      var address = document.createElement("span");
      address.className = "winner-address";
      var link = document.createElement("a");
      link.href = "https://bscscan.com/address/" + encodeURIComponent(winner.address || "");
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = shortAddress(winner.address) + " ↗";
      link.setAttribute("aria-label", "Open full winner address for round " + (winner.drawRound || "—") + " on BscScan");
      address.appendChild(link);

      var status = document.createElement("span");
      status.className = "winner-state " + (winner.hasAddress ? "complete" : "pending");
      status.textContent = winner.hasAddress ? "ADDRESS FILLED" : "NOT SET";

      row.appendChild(round);
      row.appendChild(address);
      row.appendChild(status);
      list.appendChild(row);
    });
    setText("s2-winners-count", rows.length.toLocaleString("en-US") + "筆公開中選記錄；頁面減敏顯示，連結保留完整地址。");
  }

  function loadWinners() {
    return fetch(winnersSource, { cache: "no-store" }).then(function (response) {
      if (!response.ok) throw new Error("Lottery2 winners");
      return response.json();
    }).then(function (payload) {
      var rows = Array.isArray(payload.data) ? payload.data : [];
      renderWinners(payload.code === 200 ? rows : []);
      return payload.code === 200 && rows.length > 0;
    }).catch(function () {
      renderWinners([]);
      return false;
    });
  }

  function renderLeaderboard(rows) {
    var body = get("s2-leaderboard");
    if (!body) return;
    var byRank = {};
    (rows || []).forEach(function (row) {
      if (row && row.rank) byRank[row.rank] = row;
    });
    body.innerHTML = leaderboardRatios.map(function (share, index) {
      var rank = index + 1;
      var row = byRank[rank] || {};
      var amount = Number.isFinite(Number(row.usdt)) ? formatNumber(row.usdt) + " USDT" : "—";
      var address = row.address || "";
      var addressHtml = address ? '<a class="cyan mono" href="https://bscscan.com/address/' + encodeURIComponent(address) + '" target="_blank" rel="noopener">' + escapeHtml(shortAddress(address)) + ' ↗</a>' : "—";
      return "<tr><td>" + rank + "</td><td>" + share + "%</td><td>" + amount + "</td><td>" + addressHtml + "</td></tr>";
    }).join("");
  }

  function loadLeaderboard() {
    return fetch(leaderboardSource, { cache: "no-store" }).then(function (response) {
      if (!response.ok) throw new Error("Lottery2 leaderboard");
      return response.json();
    }).then(function (payload) {
      var rows = Array.isArray(payload.data) ? payload.data : ((payload.data && (payload.data.list || payload.data.rows)) || []);
      renderLeaderboard(payload.code === 200 ? rows : []);
      return payload.code === 200 && rows.length > 0;
    }).catch(function () {
      renderLeaderboard([]);
      return false;
    });
  }

  renderLeaderboard([]);
  Promise.all([loadWinners(), loadLatestDraw(), loadLeaderboard()]).then(function (results) {
    setText("s2-record-state", results[0] ? "完整中選位址介面讀取成功；頁面以脫敏位址展示並連結至 BscScan。" : "中選位址介面暫時無法使用；頁面未使用範例記錄。");
  });
  loadSnapshot();

  window.setInterval(loadSnapshot, 60000);
  window.setInterval(loadWinners, 60000);
  window.setInterval(loadLatestDraw, 30000);
  window.setInterval(loadLeaderboard, 60000);
})();
