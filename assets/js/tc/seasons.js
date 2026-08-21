(function () {
  var assetRoot = document.body.dataset.assetRoot || "";
  var s1Source = "https://payment.magne.ai/api/v1/lottery/dashboard";
  var collectorSource = { url: "/api/v1/season-2/dashboard", label: "W3 AUTHENTICATED COLLECTOR" };
  var verifiedSnapshotSource = { url: assetRoot + "assets/data/season-2-snapshot.json", label: "W3 VERIFIED SNAPSHOT" };
  var s2Sources = [collectorSource, verifiedSnapshotSource];
  var s2HistorySources = [
    "/api/v1/season-2/history",
    assetRoot + "assets/data/season-2-history.json",
  ];
  var s2FlowSource = assetRoot + "assets/data/season-2-flow-audit.json";

  function finite(value) {
    if (value === null || value === undefined || value === "") return null;
    var number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function set(id, value) {
    var element = document.getElementById(id);
    if (!element) return;
    var number = finite(value);
    element.textContent = number === null ? "—" : number.toLocaleString("en-US");
  }

  function setText(id, value) {
    var element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function setState(message, ok) {
    var element = document.getElementById("season-source-state");
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("lime", Boolean(ok));
  }

  function fetchJson(url, message) {
    var separator = url.indexOf("?") === -1 ? "?" : "&";
    return fetch(url + separator + "t=" + Date.now(), { cache: "no-store" }).then(function (response) {
      if (!response.ok) throw new Error(message + " HTTP " + response.status);
      return response.json();
    });
  }

  function loadS2(index) {
    if (index >= s2Sources.length) return Promise.reject(new Error("Season 2 sources unavailable"));
    var source = s2Sources[index];
    return fetchJson(source.url, "S2 snapshot").then(function (payload) {
      if (payload.code !== 200 || !payload.data) throw new Error("S2 snapshot payload");
      return { payload: payload, source: source, sourceIndex: index };
    }).catch(function () {
      return loadS2(index + 1);
    });
  }

  function snapshotState(payload, sourceIndex) {
    var meta = payload && payload._meta;
    if (!meta || !meta.fetchedAt) return "unavailable";
    var age = Date.now() - new Date(meta.fetchedAt).getTime();
    var staleAfter = Number(meta.staleAfterSeconds || 300) * 1000;
    if (meta.status === "stale" || !Number.isFinite(age) || age > staleAfter) return "stale";
    return sourceIndex === 0 ? "live" : "snapshot";
  }

  function setS2State(state) {
    var label = state === "live" ? "LIVE" : state === "snapshot" ? "VERIFIED SNAPSHOT" : state === "stale" ? "STALE SNAPSHOT" : "UNAVAILABLE";
    var hero = document.getElementById("seasons-s2-state");
    var panelTitle = document.getElementById("seasons-s2-panel-title");
    var panelState = document.getElementById("seasons-s2-panel-state");
    if (hero) { hero.textContent = label; hero.className = state === "live" ? "lime" : state === "stale" ? "amber" : state === "snapshot" ? "cyan" : ""; }
    if (panelTitle) panelTitle.textContent = "SEASON 02 / " + label;
    if (panelState) { panelState.textContent = "● " + label; panelState.className = state === "live" ? "lime" : state === "stale" ? "amber" : state === "snapshot" ? "cyan" : ""; }
  }

  function loadS2History(index) {
    if (index >= s2HistorySources.length) return Promise.reject(new Error("Season 2 history unavailable"));
    return fetchJson(s2HistorySources[index], "S2 chain history").then(function (payload) {
      if (payload.code !== 200 || !Array.isArray(payload.points)) throw new Error("S2 history payload");
      return payload;
    }).catch(function () {
      return loadS2History(index + 1);
    });
  }

  Promise.allSettled([
    fetchJson(s1Source, "S1 dashboard"),
    loadS2(0),
    loadS2History(0),
    fetchJson(s2FlowSource, "S2 referral audit"),
  ]).then(function (results) {
    var available = 0;
    var s2SourceLabel = "";
    var s2ChainLabel = "";
    var s2State = "unavailable";

    if (results[0].status === "fulfilled") {
      var s1 = results[0].value.data || {};
      var currentEntries = 100 - Number(s1.nextDrawNeed || 100);
      set("s1-participants", s1.totalParticipants);
      set("s1-entries", Number(s1.totalMobile || 0) * 100 + currentEntries);
      set("s1-units", s1.totalMobile);
      available += 1;
    }

    if (results[1].status === "fulfilled") {
      var sourceResult = results[1].value;
      var payload = sourceResult.payload;
      var s2 = payload.data || {};
      var totalEntries = finite(s2.totalEntries);
      var totalMobile = finite(s2.totalMobile);
      set("s2-entries", totalEntries);
      set("s2-units-left", totalMobile === null ? null : Math.max(0, 1600 - totalMobile));
      setText("s2-entries-label", totalEntries === null ? "Entries · MS2 pending" : "Entries · " + (totalEntries * 10).toLocaleString("en-US") + " MS2 points");

      var fetchedAt = payload._meta && payload._meta.fetchedAt;
      s2SourceLabel = sourceResult.source.label + (fetchedAt ? " · " + new Date(fetchedAt).toLocaleString("zh-Hant", { hour12: false }) : "");
      s2State = snapshotState(payload, sourceResult.sourceIndex);
      setS2State(s2State);
      available += 1;
    }

    if (results[2].status === "fulfilled") {
      var historyPoints = Array.isArray(results[2].value.points) ? results[2].value.points : [];
      var latestHistory = historyPoints[historyPoints.length - 1];
      set("s2-participants", latestHistory && latestHistory.onchainPayers);
      var checkedAt = results[2].value._meta && results[2].value._meta.lastCheckedAt;
      s2ChainLabel = "BSC EVENTS" + (checkedAt ? " · " + new Date(checkedAt).toLocaleString("zh-Hant", { hour12: false }) : "");
    }

    if (results[3].status === "fulfilled") {
      var referral = results[3].value.data && results[3].value.data.referral;
      var referrers = referral ? finite(referral.uniqueRecipients) : null;
      setText("s2-participants-label", referrers === null ? "Unique direct payers" : "Unique direct payers · " + referrers.toLocaleString("en-US") + " referrers");
    } else {
      setText("s2-participants-label", "Unique direct payers");
    }

    if (available === 2) {
      setState("兩季活動資料已載入。 Season 2：" + (s2State === "live" ? "LIVE COLLECTOR" : s2State === "snapshot" ? "VERIFIED SNAPSHOT" : "STALE SNAPSHOT") + " · " + s2SourceLabel + (s2ChainLabel ? "；" + s2ChainLabel : "") + "。", s2State === "live" || s2State === "snapshot");
    } else if (available === 1) {
      setState("部分公開資料來源暫時無法使用；缺失項保持 —。", false);
    } else {
      setS2State("unavailable");
      setState("活動資料來源暫時無法使用；頁面沒有使用範例資料。", false);
    }
  });
})();
