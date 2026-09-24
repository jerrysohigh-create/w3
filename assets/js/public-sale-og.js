(function () {
  "use strict";

  var body = document.body;
  var assetRoot = body.getAttribute("data-asset-root") || "";
  var sources = [
    "/api/v1/public-sale-og/conversions",
    assetRoot + "assets/data/public-sale-og-conversions.json"
  ];

  function number(value) {
    return new Intl.NumberFormat("en-US").format(value);
  }

  function decimal(value, digits) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(value);
  }

  var busy = false, highestCount = 0;
  function render(payload, fallback) {
    if (!payload || payload.code !== 200 || !payload.data) return false;
    var count = Number(payload.data.convertedWallets);
    var total = Number(payload.data.participatingWallets);
    var baseline = Number(document.getElementById("og-converted-wallets")?.dataset.baseline || 0);
    if (!Number.isFinite(count) || count < Math.max(baseline, highestCount) || !Number.isFinite(total) || total <= 0) return false;
    var rate = count / total * 100;
    highestCount = count;
    var block = Number(payload._meta && payload._meta.lastScannedBlock);
    var allocated = Number(payload.data.totalAllocatedMs2);
    var countNode = document.getElementById("og-converted-wallets");
    var countMeta = document.getElementById("og-conversion-meta");
    var allocatedNode = document.getElementById("og-total-allocated");
    var allocatedMeta = document.getElementById("og-allocation-meta");
    if (countNode) countNode.textContent = number(count);
    if (countMeta) countMeta.textContent = decimal(rate, 2) + "% OF " + number(total) + " OG WALLETS \u00b7 BSC BLOCK " + number(block);
    if (allocatedNode && Number.isFinite(allocated)) allocatedNode.textContent = decimal(allocated, 6) + " MS2";
    if (allocatedMeta) allocatedMeta.textContent = "TOTALALLOCATED() \u00b7 " + (fallback || payload._meta?.lastError || Date.now() - Date.parse(payload._meta?.fetchedAt) > 120000 ? "SNAPSHOT / DELAYED" : "CHAIN SYNCED") + " \u00b7 " + (payload._meta?.fetchedAt || "\u2014");
    return true;
  }

  async function load() {
    if (busy || document.hidden) return;
    busy = true;
    try {
    for (var index = 0; index < sources.length; index += 1) {
      try {
        var separator = sources[index].indexOf("?") === -1 ? "?" : "&";
        var response = await fetch(sources[index] + separator + "t=" + Date.now(), { cache: "no-store", signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error("HTTP " + response.status);
        if (render(await response.json(), index > 0)) return;
      } catch (_) {
        // Keep the verified HTML snapshot and try the next source.
      }
    }
    } finally { busy = false; }
  }

  load();
  window.setInterval(load, 15000);
  window.addEventListener("focus", load);
  window.addEventListener("online", load);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) load();
  });
})();
