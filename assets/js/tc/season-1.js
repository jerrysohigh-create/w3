(function () {
  var dashboardSource = "https://payment.magne.ai/api/v1/lottery/dashboard";
  var winnersSource = "https://payment.magne.ai/api/v1/lottery/winners";
  var growthSource = "https://jerrysohigh-create.github.io/DR/assets/data/dune/season1-participants-growth.json";
  var pageSize = 20;
  var currentPage = 1;
  var winners = [];

  function get(id) {
    return document.getElementById(id);
  }

  function setText(id, value) {
    var element = get(id);
    if (element) element.textContent = value;
  }

  function formatNumber(value, prefix) {
    var number = Number(value);
    return Number.isFinite(number) ? (prefix || "") + number.toLocaleString("en-US") : "—";
  }

  function setNumber(id, value, prefix) {
    setText(id, formatNumber(value, prefix));
  }

  function setSourceState(message, ok) {
    var state = get("s1dash-source-state");
    var hero = get("s1dash-status");
    if (state) {
      state.textContent = message;
      state.classList.toggle("lime", Boolean(ok));
    }
    if (hero) {
      hero.textContent = ok ? "SOURCE LOADED" : "PARTIAL";
      hero.style.color = ok ? "var(--lime)" : "var(--amber)";
    }
  }

  function shortAddress(address) {
    if (!address || address.length < 14) return address || "—";
    return address.slice(0, 8) + "…" + address.slice(-6);
  }

  function renderWinners() {
    var list = get("s1-winner-list");
    var previous = get("s1-prev-page");
    var next = get("s1-next-page");
    var totalPages = Math.max(1, Math.ceil(winners.length / pageSize));
    if (!list) return;

    currentPage = Math.min(Math.max(1, currentPage), totalPages);
    list.innerHTML = "";
    winners.slice((currentPage - 1) * pageSize, currentPage * pageSize).forEach(function (winner) {
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
      address.appendChild(link);

      var status = document.createElement("span");
      status.className = "winner-state " + (winner.hasAddress ? "complete" : "pending");
      status.textContent = winner.hasAddress ? "ADDRESS SUBMITTED" : "ADDRESS PENDING";

      row.appendChild(round);
      row.appendChild(address);
      row.appendChild(status);
      list.appendChild(row);
    });

    if (!winners.length) {
      list.innerHTML = '<div class="winner-row"><span class="winner-round">[ UNAVAILABLE ]</span><span class="winner-address">公開中選記錄暫時無法讀取。</span><span class="winner-state pending">NO FALLBACK DATA</span></div>';
    }

    if (previous) previous.disabled = currentPage <= 1;
    if (next) next.disabled = currentPage >= totalPages || !winners.length;
    setText("s1-page-indicator", "PAGE " + currentPage + " / " + totalPages);
    setText("s1-winners-count", winners.length ? winners.length.toLocaleString("en-US") + "筆公開中選記錄。" : "公開中選記錄暫時無法使用。");
  }

  function applyDashboard(payload) {
    var dashboard = payload.data || {};
    var currentRound = Number(dashboard.currRound || 1);
    var nextDrawNeed = Number(dashboard.nextDrawNeed || 100);
    var completedRounds = currentRound - 1;
    var currentEntries = 100 - nextDrawNeed;
    var totalMobile = Number(dashboard.totalMobile || 0);
    var progress = Math.max(0, Math.min(100, currentEntries));

    setNumber("s1dash-wallets", dashboard.totalParticipants);
    setNumber("s1dash-units", totalMobile);
    setNumber("s1dash-pool", completedRounds * 1000 + currentEntries * 10, "$");
    setNumber("s1dash-mha", completedRounds * 99 * 100);
    setText("s1dash-remaining", "剩餘" + (1000 - totalMobile).toLocaleString("en-US") + "名額");
    setText("s1dash-ms2-airdrop", formatNumber(totalMobile * 100));
    setText("s1dash-round", currentRound.toLocaleString("en-US"));
    setText("s1dash-current-entries", currentEntries.toLocaleString("en-US"));
    setText("s1dash-needed", nextDrawNeed.toLocaleString("en-US"));
    var progressBar = get("s1dash-progress");
    if (progressBar) progressBar.style.width = progress + "%";
  }

  function loadDashboard() {
    return fetch(dashboardSource, { cache: "no-store" }).then(function (response) {
      if (!response.ok) throw new Error("Dashboard API");
      return response.json();
    }).then(function (payload) {
      applyDashboard(payload);
      return true;
    });
  }

  function loadWinners() {
    return fetch(winnersSource, { cache: "no-store" }).then(function (response) {
      if (!response.ok) throw new Error("Winners API");
      return response.json();
    }).then(function (payload) {
      winners = Array.isArray(payload.data) ? payload.data : [];
      renderWinners();
      return true;
    });
  }

  function loadGrowth() {
    return fetch(growthSource + "?t=" + Date.now(), { cache: "no-store" }).then(function (response) {
      if (!response.ok) throw new Error("Growth snapshot");
      return response.json();
    }).then(function (growth) {
      var rendered = window.W3SeasonChart && window.W3SeasonChart.render(get("s1-dashboard-growth-chart"), growth);
      var status = get("s1dash-growth-status");
      if (status) {
        status.textContent = rendered ? "SOURCE LOADED" : "SOURCE UNAVAILABLE";
        status.style.color = rendered ? "var(--lime)" : "var(--amber)";
        status.style.borderColor = rendered ? "rgba(0,255,136,.35)" : "rgba(255,149,0,.35)";
      }
      if (growth.last_result_at) {
        setText("s1dash-growth-refreshed", new Date(growth.last_result_at).toLocaleString("zh-Hant", { hour12: false }));
      }
      return Boolean(rendered);
    });
  }

  var previousButton = get("s1-prev-page");
  var nextButton = get("s1-next-page");
  if (previousButton) previousButton.addEventListener("click", function () {
    currentPage -= 1;
    renderWinners();
  });
  if (nextButton) nextButton.addEventListener("click", function () {
    currentPage += 1;
    renderWinners();
  });

  Promise.allSettled([loadDashboard(), loadWinners(), loadGrowth()]).then(function (results) {
    var available = results.filter(function (result) { return result.status === "fulfilled" && result.value; }).length;
    if (results[1].status === "rejected") renderWinners();
    if (results[2].status === "rejected" && window.W3SeasonChart) {
      window.W3SeasonChart.fallback(get("s1-dashboard-growth-chart"));
    }
    setSourceState(available === 3 ? "三組公開來源讀取成功。" : "部分公開來源暫時無法使用；頁面未使用範例資料。", available === 3);
  });

  window.setInterval(function () {
    Promise.allSettled([loadDashboard(), loadWinners()]);
  }, 30000);
})();
