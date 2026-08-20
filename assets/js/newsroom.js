(function () {
  "use strict";

  var dashboardSources = [
    "/api/v1/season-2/dashboard",
    "http://127.0.0.1:4184/api/v1/season-2/dashboard",
    "assets/data/season-2-snapshot.json"
  ];
  var historySources = [
    "/api/v1/season-2/history",
    "http://127.0.0.1:4184/api/v1/season-2/history",
    "assets/data/season-2-history.json"
  ];

  function fetchJson(url) {
    var separator = url.indexOf("?") === -1 ? "?" : "&";
    return fetch(url + separator + "t=" + Date.now(), { cache: "no-store" }).then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    });
  }

  function fetchFirst(sources, validate, index) {
    var cursor = index || 0;
    if (cursor >= sources.length) return Promise.reject(new Error("No valid source"));
    return fetchJson(sources[cursor]).then(function (payload) {
      if (!validate(payload)) throw new Error("Invalid payload");
      return payload;
    }).catch(function () {
      return fetchFirst(sources, validate, cursor + 1);
    });
  }

  function setText(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function numeric(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function format(value) {
    return value === null ? "—" : value.toLocaleString("en-US");
  }

  function timeLabel(value) {
    if (!value) return "SOURCE BOUND";
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return "SOURCE BOUND";
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false
    }).format(date).replace(",", "") + " SGT";
  }

  Promise.allSettled([
    fetchFirst(dashboardSources, function (payload) { return payload && payload.code === 200 && payload.data; }),
    fetchFirst(historySources, function (payload) { return payload && payload.code === 200 && Array.isArray(payload.points); })
  ]).then(function (results) {
    var dashboard = results[0].status === "fulfilled" ? results[0].value : null;
    var history = results[1].status === "fulfilled" ? results[1].value : null;
    var data = dashboard && dashboard.data ? dashboard.data : {};
    var points = history && Array.isArray(history.points) ? history.points : [];
    var latest = points.length ? points[points.length - 1] : null;
    var entries = numeric(data.totalEntries);
    var mobile = numeric(data.totalMobile);
    var payers = numeric(latest && latest.onchainPayers);
    var checkedAt = (history && history._meta && history._meta.lastCheckedAt) ||
      (dashboard && dashboard._meta && dashboard._meta.fetchedAt) || (latest && latest.observedAt);

    setText("news-s2-entries", format(entries));
    setText("news-s2-payers", format(payers));
    setText("news-s2-units-left", mobile === null ? "—" : format(Math.max(0, 1600 - mobile)));
    setText("news-latest-check", timeLabel(checkedAt));
    if (checkedAt) {
      var date = new Date(checkedAt);
      if (!Number.isNaN(date.getTime())) setText("news-s2-date", date.toISOString().slice(0, 10));
    }
  });
})();
