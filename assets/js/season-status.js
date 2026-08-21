(function () {
  "use strict";

  var root = document.body.dataset.root || "";
  var assetRoot = document.body.dataset.assetRoot || root;
  var collectorSource = { url: "/api/v1/season-2/dashboard", mode: "collector" };
  var snapshotSource = { url: assetRoot + "assets/data/season-2-snapshot.json", mode: "snapshot" };
  var sources = location.hostname === "jerrysohigh-create.github.io"
    ? [snapshotSource, collectorSource]
    : [collectorSource, snapshotSource];

  function freshness(payload) {
    var meta = payload && payload._meta;
    if (!meta || !meta.fetchedAt) return "unavailable";
    var fetchedAt = new Date(meta.fetchedAt).getTime();
    var staleAfter = Number(meta.staleAfterSeconds || 300) * 1000;
    if (!fetchedAt || meta.status === "stale" || Date.now() - fetchedAt > staleAfter) return "stale";
    return "fresh";
  }

  function render(state, payload) {
    var statusText = state === "checking" ? "S2: CHECKING" : state === "live" ? "S2: LIVE" : state === "snapshot" ? "S2: SNAPSHOT" : state === "stale" ? "S2: STALE" : "S2: UNAVAILABLE";
    var fetchedAt = payload && payload._meta && payload._meta.fetchedAt;
    var detail = state === "checking"
      ? "Checking Season 2 data freshness."
      : state === "live"
      ? "Season 2 collector is current."
      : state === "snapshot"
        ? "Season 2 is showing a current verified snapshot; live collector unavailable."
        : state === "stale"
          ? "Season 2 snapshot is stale" + (fetchedAt ? "; last verified " + new Date(fetchedAt).toLocaleString("zh-Hant", { hour12: false }) : "") + "."
          : "Season 2 verified data is currently unavailable.";

    document.querySelectorAll("[data-s2-global-status]").forEach(function (element) {
      element.textContent = statusText;
      element.classList.remove("is-checking", "is-live", "is-snapshot", "is-stale", "is-unavailable");
      element.classList.add("is-" + state);
      element.setAttribute("aria-label", detail);
      element.title = detail;
    });
    document.querySelectorAll("[data-s2-global-action]").forEach(function (element) {
      element.textContent = "$ join season 2 ↗";
      element.href = "https://payment.magne.ai/lottery";
      element.target = "_blank";
      element.rel = "noopener noreferrer";
      element.classList.remove("is-checking", "is-live", "is-snapshot", "is-stale", "is-unavailable");
      element.classList.add("is-" + state);
      element.title = "Join Season 2 on payment.magne.ai";
    });
    document.documentElement.dataset.s2State = state;
  }

  async function load(index) {
    if (index >= sources.length) return render("unavailable");
    var source = sources[index];
    try {
      var separator = source.url.indexOf("?") === -1 ? "?" : "&";
      var response = await fetch(source.url + separator + "t=" + Date.now(), { cache: "no-store" });
      if (!response.ok) throw new Error("HTTP " + response.status);
      var payload = await response.json();
      if (payload.code !== 200 || !payload.data) throw new Error("Invalid payload");
      var state = freshness(payload) === "fresh" ? (source.mode === "collector" ? "live" : "snapshot") : "stale";
      render(state, payload);
    } catch (error) {
      await load(index + 1);
    }
  }

  render("checking");
  void load(0);
})();
