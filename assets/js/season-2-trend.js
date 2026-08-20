(function () {
  var sources = [
    "/api/v1/season-2/history",
    "assets/data/season-2-history.json",
  ];
  var activeMetric = "totalEntries";
  var historyPayload = null;
  var metrics = {
    totalEntries: {
      title: "Season 2 累计有效参与名额",
      aria: "Season 2 累计有效参与名额从零增长图",
    },
    onchainPayers: {
      title: "Season 2 唯一直接参与 / 付款地址增长",
      aria: "Season 2 链上唯一直接参与付款地址从零增长图",
    },
  };

  function get(id) {
    return document.getElementById(id);
  }

  function setField(field, value) {
    document.querySelectorAll('[data-s2-field="' + field + '"]').forEach(function (element) {
      element.textContent = value;
    });
  }

  function escapeText(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function format(value) {
    return Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  function shortTime(value, includeTime) {
    var date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "—";
    return date.toLocaleString("zh-Hant", includeTime
      ? { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }
      : { month: "2-digit", day: "2-digit" });
  }

  function niceMaximum(maximum) {
    if (maximum <= 0) return 1;
    var magnitude = Math.pow(10, Math.floor(Math.log10(maximum)));
    var step = Math.ceil(maximum / magnitude / 4) * magnitude;
    return Math.ceil(maximum / step) * step;
  }

  function renderChart() {
    var svg = get("s2-growth-chart");
    if (!svg || !historyPayload) return;
    var rows = metricRows().filter(function (point) {
      return point && Number.isFinite(Number(point[activeMetric])) && Number.isFinite(new Date(point.observedAt).getTime());
    });
    if (!rows.length) {
      svg.setAttribute("viewBox", "0 0 360 220");
      svg.innerHTML = '<text x="180" y="112" text-anchor="middle" fill="#96969e" font-family="JetBrains Mono, monospace" font-size="11">WAITING FOR VERIFIED OBSERVATIONS</text>';
      return;
    }

    var mobile = window.matchMedia("(max-width: 600px)").matches;
    var width = mobile ? 360 : 900;
    var height = mobile ? 286 : 340;
    var margin = mobile ? { top: 34, right: 14, bottom: 44, left: 48 } : { top: 42, right: 24, bottom: 54, left: 68 };
    var chartWidth = width - margin.left - margin.right;
    var chartHeight = height - margin.top - margin.bottom;
    var maximum = Math.max.apply(null, rows.map(function (point) { return Number(point[activeMetric]); }));
    var yMax = niceMaximum(maximum * 1.08);
    var firstTime = new Date(rows[0].observedAt).getTime();
    var lastTime = new Date(rows[rows.length - 1].observedAt).getTime();
    var duration = Math.max(1, lastTime - firstTime);
    var points = rows.map(function (row, index) {
      var timestamp = new Date(row.observedAt).getTime();
      return {
        row: row,
        x: margin.left + (rows.length === 1 ? chartWidth : ((timestamp - firstTime) / duration) * chartWidth),
        y: margin.top + chartHeight - (Number(row[activeMetric]) / yMax) * chartHeight,
        index: index,
      };
    });
    var linePath = points.map(function (point, index) {
      return (index ? "L" : "M") + point.x.toFixed(1) + " " + point.y.toFixed(1);
    }).join(" ");
    if (rows.length === 1) linePath += " L" + (margin.left + chartWidth).toFixed(1) + " " + points[0].y.toFixed(1);
    var areaPath = linePath + " L" + (margin.left + chartWidth) + " " + (margin.top + chartHeight) + " L" + margin.left + " " + (margin.top + chartHeight) + " Z";
    var parts = [
      '<defs><linearGradient id="s2-trend-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#00d4d4" stop-opacity=".26"/><stop offset="100%" stop-color="#00d4d4" stop-opacity=".015"/></linearGradient></defs>',
    ];

    [0, yMax / 2, yMax].forEach(function (tick) {
      var y = margin.top + chartHeight - (tick / yMax) * chartHeight;
      parts.push('<line x1="' + margin.left + '" y1="' + y.toFixed(1) + '" x2="' + (margin.left + chartWidth) + '" y2="' + y.toFixed(1) + '" stroke="rgba(255,255,255,.08)" stroke-width="1"/>');
      parts.push('<text x="' + (margin.left - 9) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" fill="#6d6e77" font-family="JetBrains Mono, monospace" font-size="' + (mobile ? 9 : 10) + '">' + escapeText(format(tick)) + "</text>");
    });

    parts.push('<path d="' + areaPath + '" fill="url(#s2-trend-area)"/>');
    parts.push('<path d="' + linePath + '" fill="none" stroke="#00d4d4" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>');
    points.forEach(function (point) {
      parts.push('<circle cx="' + point.x.toFixed(1) + '" cy="' + point.y.toFixed(1) + '" r="3.5" fill="#09090b" stroke="#7ce5e5" stroke-width="2"><title>' + escapeText(shortTime(point.row.observedAt, true) + " · " + format(point.row[activeMetric])) + "</title></circle>");
    });

    var labels = [points[0], points[Math.floor((points.length - 1) / 2)], points[points.length - 1]].filter(function (point, index, all) {
      return all.indexOf(point) === index;
    });
    labels.forEach(function (point, index) {
      var anchor = index === 0 ? "start" : index === labels.length - 1 ? "end" : "middle";
      parts.push('<text x="' + point.x.toFixed(1) + '" y="' + (margin.top + chartHeight + 23) + '" text-anchor="' + anchor + '" fill="#96969e" font-family="JetBrains Mono, monospace" font-size="9">' + escapeText(shortTime(point.row.observedAt, false)) + "</text>");
    });

    var latest = points[points.length - 1];
    parts.push('<g transform="translate(' + (latest.x - 5).toFixed(1) + " " + Math.max(17, latest.y - 17).toFixed(1) + ')"><text text-anchor="end" fill="#f2f3f3" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700">' + escapeText(format(latest.row[activeMetric])) + '</text><text y="13" text-anchor="end" fill="#7ce5e5" font-family="JetBrains Mono, monospace" font-size="8">LATEST</text></g>');

    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("aria-label", metrics[activeMetric].aria);
    svg.dataset.chartMode = mobile ? "mobile" : "desktop";
    svg.innerHTML = parts.join("");
  }

  function metricRows() {
    return historyPayload && Array.isArray(historyPayload.points) ? historyPayload.points : [];
  }

  function applyHistory(payload) {
    historyPayload = payload;
    var points = Array.isArray(payload.points) ? payload.points : [];
    var latest = points[points.length - 1];
    setField("direct-payers", latest && Number.isFinite(Number(latest.onchainPayers)) ? format(latest.onchainPayers) : "—");
    updateMetricMetadata();
    renderChart();
  }

  function updateMetricMetadata() {
    var status = get("s2-growth-status");
    var coverage = get("s2-growth-coverage");
    var refreshed = get("s2-growth-refreshed");
    var source = get("s2-growth-source");
    var historyMeta = historyPayload?._meta || {};
    var historyPoints = historyPayload?.points || [];
    var backfill = historyMeta.chainBackfill || {};
    var reconciliation = backfill.reconciliation || {};
    var delta = Number(reconciliation.deltaEntries);
    var hasDelta = reconciliation.comparable === true && reconciliation.matched === false && Number.isFinite(delta);
    if (status) status.textContent = historyPoints.length >= 8
      ? (hasDelta ? "CHAIN VERIFIED · PAYMENT " + (delta >= 0 ? "+" : "") + format(delta) : "BSC VERIFIED")
      : "BUILDING HISTORY";
    if (coverage) coverage.textContent = format(backfill.eventCount || Math.max(0, historyPoints.length - 1))
      + " EVENTS · FROM BLOCK " + format(backfill.firstEventBlock || backfill.fromBlock || 0)
      + (hasDelta ? " · " + format(Math.abs(delta)) + " ENTRY PENDING RECONCILIATION" : "");
    if (refreshed) refreshed.textContent = shortTime(activeMetric === "onchainPayers"
      ? (historyMeta.lastCheckedAt || historyMeta.updatedAt)
      : (historyMeta.automatedSnapshotAt || historyMeta.updatedAt), true);
    if (source) source.textContent = activeMetric === "onchainPayers"
      ? "BSC EVENTS · INDEXED BOOTSTRAP + FINALIZED-BLOCK INCREMENT"
      : "PAYMENT AUTHENTICATED SNAPSHOTS · BSC CONTRACT STATE";
  }

  function setMetric(metric) {
    if (!metrics[metric] || metric === activeMetric) return;
    activeMetric = metric;
    var title = get("s2-growth-title");
    if (title) title.textContent = metrics[metric].title;
    document.querySelectorAll("[data-trend-metric]").forEach(function (button) {
      var selected = button.dataset.trendMetric === metric;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    updateMetricMetadata();
    renderChart();
  }

  async function loadHistory() {
    for (var index = 0; index < sources.length; index += 1) {
      try {
        var url = sources[index];
        var response = await fetch(url + (url.indexOf("?") === -1 ? "?" : "&") + "t=" + Date.now(), { cache: "no-store" });
        if (!response.ok) throw new Error("History HTTP " + response.status);
        var payload = await response.json();
        if (payload.code !== 200 || !Array.isArray(payload.points)) throw new Error("History payload");
        applyHistory(payload);
        return true;
      } catch (error) {
        continue;
      }
    }
    var status = get("s2-growth-status");
    if (status) status.textContent = "SOURCE UNAVAILABLE";
    return false;
  }

  async function loadFlowAudit() {
    try {
      var response = await fetch("assets/data/season-2-flow-audit.json?t=" + Date.now(), { cache: "no-store" });
      if (!response.ok) throw new Error("Flow audit HTTP " + response.status);
      var payload = await response.json();
      if (payload.code !== 200 || !payload._meta?.matched) throw new Error("Flow audit payload");
      var data = payload.data || {};
      var referral = data.referral || {};
      var pool = data.pool || {};
      var values = {
        "s2-flow-referrer-addresses": referral.uniqueRecipients,
        "s2-flow-referrer-transfers": referral.transfers,
        "s2-flow-referrer-usdt": referral.totalUsdt,
        "s2-flow-pool-addresses": pool.uniqueRecipients,
        "s2-flow-pool-transfers": pool.transfers,
        "s2-flow-pool-usdt": pool.totalUsdt,
        "s2-flow-events": data.eventsAudited,
        "s2-flow-transfers": data.transfersAudited,
      };
      Object.keys(values).forEach(function (id) {
        if (get(id)) get(id).textContent = format(values[id]);
      });
      setField("referrer-addresses", format(referral.uniqueRecipients));
      if (get("s2-flow-audit-state")) get("s2-flow-audit-state").textContent = data.eventsAudited + "/" + data.eventsAudited + " EVENTS MATCHED";
    } catch (error) {
      if (get("s2-flow-audit-state")) get("s2-flow-audit-state").textContent = "AUDIT UNAVAILABLE";
    }
  }

  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(renderChart, 120);
  });

  document.querySelectorAll("[data-trend-metric]").forEach(function (button) {
    button.addEventListener("click", function () {
      setMetric(button.dataset.trendMetric);
    });
  });

  loadHistory();
  loadFlowAudit();
  window.setInterval(loadHistory, 60000);
})();
