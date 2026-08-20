(function () {
  "use strict";
  var data = window.W3_NEWSROOM;
  var root = document.body.dataset.root || "";
  var evidence = window.W3_ECOSYSTEM_EVIDENCE || null;
  var sourceMap = window.W3_NEWSROOM_SOURCE_MAP || null;

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character];
    });
  }

  function articleHref(item) {
    if (!item.href) return "";
    if (/^https?:/.test(item.href)) return item.href;
    if (/\.html(?:#.*)?$/.test(item.href)) return root + item.href;
    return root + "newsroom/" + item.href;
  }

  function articleRow(item) {
    var unavailable = item.status !== "published";
    var tag = unavailable ? (item.pendingLabel || "SOURCE REQUIRED") : item.sourceType.toUpperCase();
    var body = '<article class="nr-story-row' + (unavailable ? ' is-pending' : '') + (item.cover ? ' has-cover' : '') + '">' +
      '<div class="nr-story-media">' + (item.cover ? '<img src="' + item.cover + '" alt="' + item.coverAlt + '" loading="lazy" width="1600" height="900">' : '<span>EDITORIAL<br>QUEUE</span>') + '</div>' +
      '<div class="nr-story-copy"><div class="nr-meta"><time>' + item.date + '</time><span>' + item.category + '</span><span>' + tag + '</span></div>' +
      '<h2>' + item.title + '</h2><p>' + item.summary + '</p><div class="nr-factline">' + item.facts.map(function (fact) { return '<span>' + fact + '</span>'; }).join("") + '</div></div>' +
      (unavailable ? '<span class="nr-story-action">NOT PUBLISHED</span>' : '<a class="nr-story-action" href="' + articleHref(item) + '">OPEN RECORD ↗</a>') + '</article>';
    return body;
  }

  function renderStories(container, category, limit, includePending, featuredOnly, statusOnly) {
    var items = data.articles.filter(function (item) {
      return (!category || item.category === category) &&
        (includePending || item.status === "published") &&
        (!featuredOnly || item.featured) &&
        (!statusOnly || item.status === statusOnly);
    });
    if (limit) items = items.slice(0, limit);
    container.innerHTML = items.map(articleRow).join("");
  }

  function renderVideos(container, limit) {
    var items = limit ? data.videos.slice(0, limit) : data.videos;
    container.innerHTML = items.map(function (item) {
      return '<article class="nr-video-item"><button class="nr-video-poster" type="button" data-youtube-id="' + item.id + '" data-video-title="' + item.title + '"><img src="' + item.poster + '" alt="' + item.title + ' 影片封面" loading="lazy" width="1280" height="720"><span aria-hidden="true">▶</span><b class="sr-only">播放：' + item.title + '</b></button><div class="nr-video-copy"><span>' + item.relation + ' / ' + item.date + '</span><h2>' + item.title + '</h2><dl><div><dt>DURATION</dt><dd>' + item.duration + '</dd></div><div><dt>CAPTIONS</dt><dd>' + item.captions + '</dd></div><div><dt>SOURCE</dt><dd>' + item.source + '</dd></div></dl></div></article>';
    }).join("");
  }

  function renderEvents(container, limit) {
    var items = limit ? data.events.slice(0, limit) : data.events;
    container.innerHTML = items.map(function (item, index) {
      var assetBase = item.assetBase || data.eventAssetBase;
      var dateParts = item.date.split(".");
      var year = dateParts.shift();
      var monthDay = dateParts.join(".");
      var datePrecision = dateParts.length === 1 ? "MONTH ONLY" : "FULL DATE";
      var isoDate = item.date.replace(/\./g, "-");
      var images = item.images.map(function (path, imageIndex) {
        return '<a href="' + assetBase + path + '" target="_blank" rel="noopener noreferrer" aria-label="查看 ' + item.title + ' 照片 ' + (imageIndex + 1) + '"><img src="' + assetBase + path + '" alt="' + item.title + ' 照片 ' + (imageIndex + 1) + '" loading="lazy"></a>';
      }).join("");
      var duplicateImages = item.images.map(function (path) {
        return '<a href="' + assetBase + path + '" target="_blank" rel="noopener noreferrer" tabindex="-1"><img src="' + assetBase + path + '" alt="" loading="lazy"></a>';
      }).join("");
      var action = item.article
        ? '<a href="' + item.article + '">OPEN EVENT FILE ↗</a>'
        : (item.source
          ? '<a href="' + item.source + '" target="_blank" rel="noopener noreferrer" aria-label="在新窗口打开 ' + item.title + ' 的官方来源">SOURCE RECORD ↗</a>'
          : '<span>DETAIL SOURCE PENDING</span>');
      return '<article class="nr-event-row" id="' + escapeHtml(item.slug) + '"><header><time class="nr-event-date" datetime="' + isoDate + '"><span>0' + (index + 1) + '</span><b>' + year + '</b><em>' + monthDay + '</em><small>' + datePrecision + '</small></time><div><p>LOCATION / ' + item.place + '</p><h2>' + item.title + '</h2><small>' + item.note + '</small></div>' + action + '</header>' +
        '<div class="nr-event-motion-meta"><span>ALL ' + String(item.images.length).padStart(2, "0") + ' PUBLIC IMAGES / AUTO LOOP</span><button type="button" class="nr-event-motion-control" aria-pressed="false">PAUSE LOOP</button></div>' +
        '<div class="nr-event-strip" tabindex="0" aria-label="' + item.title + ' 自动滚动照片，可手动横向滚动" style="--nr-scroll-duration:' + Math.max(18, item.images.length * 6) + 's"><div class="nr-event-track"><div class="nr-event-group">' + images + '</div><div class="nr-event-group" aria-hidden="true">' + duplicateImages + '</div></div></div></article>';
    }).join("");
  }

  function sourceStatus(record) {
    if (record.publish_status === "PUBLISHABLE_WITH_LABEL") return { group: "publishable", label: "PUBLISHABLE / LABELED", className: "is-publishable" };
    if (record.publish_status === "NEEDS_TWO_SIDED_CONFIRMATION") return { group: "confirmation", label: "BILATERAL CHECK REQUIRED", className: "is-confirmation" };
    return { group: "reference", label: "REFERENCE ONLY", className: "is-reference" };
  }

  function sourceClass(record) {
    var label = record.source_label || "";
    if (/Company/i.test(label)) return "Company Release";
    if (/Partner|Investor/i.test(label)) return "Partner Announcement";
    if (label === "Independent Commentary") return "Independent Commentary";
    if (/Sponsored|Syndicated/i.test(label)) return "Sponsored / Syndicated";
    if (/Data|Registry|Report/i.test(label)) return "Data / Registry Reference";
    if (/Independent Coverage/i.test(label)) return "Independent Coverage";
    return "Reference Only";
  }

  function sourceRow(record) {
    var status = sourceStatus(record);
    return '<article class="nr-source-row ' + status.className + '" data-source-status="' + status.group + '" data-source-commentary="' + (record.source_label === "Independent Commentary" ? "true" : "false") + '" data-source-search="' + escapeHtml((record.title + " " + record.outlet + " " + record.cluster + " " + record.source_label).toLowerCase()) + '">' +
      '<time datetime="' + escapeHtml(record.date) + '">' + escapeHtml(record.date) + '</time>' +
      '<div class="nr-source-title"><span>' + escapeHtml(record.cluster.replace(/_/g, " / ")) + '</span><strong>' + escapeHtml(record.title) + '</strong><small>' + escapeHtml(record.editorial_note) + '</small></div>' +
      '<div class="nr-source-outlet"><span>' + escapeHtml(sourceClass(record)) + '</span><strong>' + escapeHtml(record.outlet) + '</strong><small>' + escapeHtml(record.source_label) + '</small></div>' +
      '<div class="nr-source-status"><span>' + status.label + '</span><small>RISK / ' + escapeHtml(record.factual_risk || "UNSET") + '</small></div>' +
      '<a href="' + escapeHtml(record.url) + '" target="_blank" rel="noopener noreferrer" aria-label="在新窗口打开来源：' + escapeHtml(record.title) + '">SOURCE ↗</a>' +
      '</article>';
  }

  function applySourceFilter(container) {
    var active = container.dataset.activeSourceFilter || "all";
    var query = (container.dataset.sourceSearchQuery || "").trim().toLowerCase();
    var visible = 0;
    container.querySelectorAll(".nr-source-row").forEach(function (row) {
      var filterMatch = active === "all" || row.dataset.sourceStatus === active || (active === "commentary" && row.dataset.sourceCommentary === "true");
      var searchMatch = !query || row.dataset.sourceSearch.indexOf(query) !== -1;
      row.hidden = !(filterMatch && searchMatch);
      if (!row.hidden) visible += 1;
    });
    var scope = container.closest("[data-source-register]") || document;
    var counter = scope.querySelector("[data-source-count]");
    if (counter) counter.textContent = visible + " / " + sourceMap.counts.publicIndexed + " PUBLIC SOURCES";
  }

  function renderSourceLedger(container) {
    if (!sourceMap) return;
    container.dataset.activeSourceFilter = "all";
    container.innerHTML = sourceMap.records.map(sourceRow).join("");
    applySourceFilter(container);
  }

  function verificationStatus(item) {
    var type = item.verification;
    if (type === "dual-post") return { group: "bilateral", label: "BILATERAL / DUAL POST", detail: "双方各自 X 原帖已锁定", className: "is-dual" };
    if (type === "dual-capital") return { group: "bilateral", label: "BILATERAL / CAPITAL", detail: "双方官方帖确认资本关系", className: "is-dual" };
    if (type === "reply-confirmed") return { group: "bilateral", label: "BILATERAL / REPLY", detail: "单方发文 + 对方官方确认", className: "is-dual" };
    if (type === "repost-confirmed") return { group: "bilateral", label: "BILATERAL / REPOST", detail: "单方发文 + 对方官方转发", className: "is-dual" };
    if (type === "partner-quote-confirmed") return { group: "bilateral", label: "BILATERAL / PARTNER QUOTE", detail: "合作方官方帖引用 MAGNE 原帖", className: "is-dual" };
    if (type === "quote-confirmed") return { group: "bilateral", label: "BILATERAL / QUOTE · ACTIVATION", detail: "合作方原帖 + MAGNE 官方引用", className: "is-dual" };
    if (type === "bilateral-confirmed-pending") return { group: "bilateral", label: "BILATERAL / OFFICIAL CONFIRMATION", detail: "双方官方确认成立；部分 status ID 待回收", className: "is-dual" };
    if (type === "reply-confirmed-pending") return { group: "bilateral", label: "BILATERAL / OFFICIAL RESPONSE", detail: "合作声明 + 对方官方回应；status ID 待回收", className: "is-dual" };
    if (type === "repost-confirmed-pending") return { group: "bilateral", label: "BILATERAL / OFFICIAL REPOST", detail: "合作公告 + 对方官方转发；status ID 待回收", className: "is-dual" };
    if (type === "joint-activation-confirmed") return { group: "bilateral", label: "BILATERAL / JOINT ACTIVATION", detail: "双方联合活动与有效官方账号已确认", className: "is-dual" };
    if (type === "platform-listing-confirmed") return { group: "bilateral", label: "BILATERAL / PLATFORM LISTING", detail: "MAGNE 原帖 + 官方平台项目收录", className: "is-dual" };
    if (type === "capital-magne") return { group: "single", label: "ONE X URL / CAPITAL", detail: "MAGNE 公告的战略投资关系", className: "is-magne" };
    if (type === "single-magne") return { group: "single", label: "ONE X URL / MAGNE", detail: "MAGNE 原帖已锁定；对方动作未索引", className: "is-magne" };
    if (type === "single-partner") return { group: "single", label: "ONE X URL / PARTNER", detail: "合作方原帖已锁定；MAGNE 动作未索引", className: "is-partner" };
    if (type === "source-conflict") return { group: "coverage", label: "SOURCE CONFLICT", detail: "原始链接与对象不一致", className: "is-conflict" };
    if (type === "source-inaccessible") return { group: "pending", label: "SOURCE INACCESSIBLE / RECHECK", detail: "历史地址已保留；X 当前明确返回不可用", className: "is-mirror" };
    if (type === "coverage-only") return { group: "coverage", label: "COVERAGE ONLY", detail: "仅作发现线索，不计双方确认", className: "is-coverage" };
    if (type === "repost-pending") return { group: "pending", label: "REPOST OBSERVED / X PENDING", detail: "官方账号已列出，原帖 ID 待回收", className: "is-mirror" };
    if (type === "reply-pending") return { group: "pending", label: "REPLY OBSERVED / X PENDING", detail: "官方账号已列出，确认帖 ID 待回收", className: "is-mirror" };
    if (type === "dual-pending") return { group: "pending", label: "DUAL POSTS / X PENDING", detail: "双方账号已列出，原帖 ID 待回收", className: "is-mirror" };
    return { group: "pending", label: "POST ID PENDING", detail: "官方 X 地址已列出，原始贴文 status ID 待回收", className: "is-mirror" };
  }

  function unifiedTimeline() {
    if (!evidence) return [];
    var historical = evidence.records.map(function (item) {
      var verification = item.verification || (item.source === "conflict" ? "source-conflict" : (item.source === "magne" ? "single-magne" : "single-partner"));
      return Object.assign({ layer: "HISTORICAL INDEX", verification: verification }, item);
    });
    var updates = evidence.webUpdates.map(function (item) {
      return Object.assign({ layer: "PUBLIC WEB SWEEP" }, item);
    });
    return updates.concat(historical).sort(function (a, b) {
      return String(b.date).localeCompare(String(a.date)) || String(a.partner).localeCompare(String(b.partner));
    });
  }

  function renderEvidenceStats(container) {
    var items = unifiedTimeline();
    if (!items.length) return;
    var counts = items.reduce(function (result, item) {
      var group = verificationStatus(item).group;
      result[group] = (result[group] || 0) + 1;
      return result;
    }, {});
    var stats = [
      [String(items.length).padStart(2, "0"), "TIMELINE RECORDS", "历史基线 + 公开补录"],
      [String(counts.bilateral || 0).padStart(2, "0"), "BILATERAL CONFIRMED", "双方官方互动确认；部分 ID 待回收"],
      [String(counts.single || 0).padStart(2, "0"), "ONE X URL", "已锁定一条原帖；不等于事实单边"],
      [String(counts.pending || 0).padStart(2, "0"), "X ID PENDING", "已发现，待回收原帖"],
      [String(counts.coverage || 0).padStart(2, "0"), "COVERAGE / CONFLICT", "不计双方确认"]
    ];
    container.innerHTML = stats.map(function (item) {
      return '<div><strong>' + item[0] + '</strong><span>' + item[1] + '</span><small>' + item[2] + '</small></div>';
    }).join("");
  }

  function sourceLinks(item) {
    var links = [];
    [
      [item.url, item.linkLabel, "source"],
      [item.secondaryUrl, item.secondaryLabel, item.secondaryKind || "source"],
      [item.tertiaryUrl, item.tertiaryLabel, item.tertiaryKind || "source"],
      [item.profileUrl, item.profileLabel, "profile"],
      [item.secondaryProfileUrl, item.secondaryProfileLabel, "profile"]
    ].forEach(function (candidate) {
      var url = candidate[0];
      if (!url) return;
      var isXStatus = /^https:\/\/x\.com\/[A-Za-z0-9_]+\/status\/\d+/.test(url);
      var isXProfile = /^https:\/\/x\.com\/[A-Za-z0-9_]+\/?$/.test(url);
      var isCoverage = (item.verification === "coverage-only" || candidate[2] === "coverage") && /^https:\/\//.test(url);
      var isPlatform = candidate[2] === "platform" && /^https:\/\//.test(url);
      if (!isXStatus && !isXProfile && !isCoverage && !isPlatform) return;
      var label = candidate[1] || (isXStatus ? (links.length ? "SECOND X ↗" : "X SOURCE ↗") : (isXProfile ? "OFFICIAL X ↗" : (isPlatform ? "PLATFORM RECORD ↗" : "REPORT ↗")));
      var ariaType = isXStatus ? " 的 X 原帖" : (isXProfile ? " 的官方 X 账号" : (isPlatform ? " 的官方平台项目页" : " 的独立报道"));
      links.push('<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer" aria-label="在新窗口打开 ' + escapeHtml(item.partner) + ariaType + '">' + escapeHtml(label) + '</a>');
    });
    return links.length ? links.join("") : '<span class="nr-source-pending">OFFICIAL X ADDRESS PENDING</span>';
  }

  function evidenceRow(item) {
    var status = verificationStatus(item);
    var note = item.note ? '<p>' + escapeHtml(item.note) + '</p>' : '';
    return '<article class="nr-evidence-row ' + status.className + '" data-evidence-source="' + status.group + '" data-evidence-search="' + escapeHtml((item.partner + " " + item.publisher + " " + item.handle + " " + item.layer).toLowerCase()) + '">' +
      '<time datetime="' + escapeHtml(item.date) + '">' + escapeHtml(item.date) + '</time>' +
      '<div class="nr-evidence-party"><strong>' + escapeHtml(item.partner) + '</strong>' + note + '</div>' +
      '<div class="nr-evidence-publisher"><span>' + escapeHtml(item.layer) + '</span><strong>' + escapeHtml(item.publisher) + '</strong><small>' + escapeHtml(item.handle) + '</small></div>' +
      '<div class="nr-evidence-status"><span>' + status.label + '</span><small>' + status.detail + '</small></div>' +
      '<div class="nr-evidence-links">' + sourceLinks(item) + '</div>' +
      '</article>';
  }

  function applyEvidenceFilter(container) {
    var active = container.dataset.activeFilter || "all";
    var query = (container.dataset.searchQuery || "").trim().toLowerCase();
    var visible = 0;
    container.querySelectorAll(".nr-evidence-row").forEach(function (row) {
      var sourceMatch = active === "all" || row.dataset.evidenceSource === active;
      var searchMatch = !query || row.dataset.evidenceSearch.indexOf(query) !== -1;
      row.hidden = !(sourceMatch && searchMatch);
      if (!row.hidden) visible += 1;
    });
    var counter = document.querySelector("[data-evidence-count]");
    if (counter) counter.textContent = String(visible).padStart(2, "0") + " RECORDS SHOWN";
  }

  function renderEvidenceLedger(container) {
    var items = unifiedTimeline();
    if (!items.length) return;
    container.dataset.activeFilter = "all";
    container.innerHTML = items.map(evidenceRow).join("");
    applyEvidenceFilter(container);
  }

  function renderEvidenceActivities(container) {
    if (!evidence) return;
    container.innerHTML = evidence.activities.map(function (item, index) {
      var replay = item.replayUrl ? '<a href="' + escapeHtml(item.replayUrl) + '" target="_blank" rel="noopener noreferrer" aria-label="在新窗口打开 ' + escapeHtml(item.title) + ' 的 X Space">SPACE ↗</a>' : '';
      return '<article data-activity-format="' + escapeHtml(item.format) + '" data-activity-status="' + escapeHtml(item.status) + '" data-activity-search="' + escapeHtml((item.title + " " + item.publisher + " " + item.handle).toLowerCase()) + '">' +
        '<b>' + String(index + 1).padStart(2, "0") + '</b>' +
        '<time datetime="' + escapeHtml(item.date) + '">' + escapeHtml(item.date) + '<small>' + escapeHtml(item.dateNote) + '</small></time>' +
        '<div><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.publisher) + ' · ' + escapeHtml(item.handle) + '</small><span class="nr-activity-status">' + escapeHtml(item.statusLabel) + '</span></div>' +
        '<div class="nr-activity-links"><a href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener noreferrer" aria-label="在新窗口打开 ' + escapeHtml(item.title) + ' 的原始 X 记录">SOURCE ↗</a>' + replay + '</div>' +
      '</article>';
    }).join("");
    applyActivityFilter(container);
  }

  function applyActivityFilter(container) {
    var active = container.dataset.activeActivityFilter || "all";
    var query = (container.dataset.activitySearchQuery || "").trim().toLowerCase();
    var visible = 0;
    container.querySelectorAll("article").forEach(function (row) {
      var filterMatch = active === "all" || row.dataset.activityFormat === active || (active === "replay" && row.dataset.activityStatus === "replay");
      var searchMatch = !query || row.dataset.activitySearch.indexOf(query) !== -1;
      row.hidden = !(filterMatch && searchMatch);
      if (!row.hidden) visible += 1;
    });
    var scope = container.closest("[data-activity-register]") || document;
    var counter = scope.querySelector("[data-activity-count]");
    if (counter) counter.textContent = visible + " / " + evidence.activities.length + " RECORDS";
  }

  document.querySelectorAll("[data-newsroom-stories]").forEach(function (container) {
    renderStories(container, container.dataset.newsroomStories || "", Number(container.dataset.limit || 0), container.dataset.pending === "true", container.dataset.featured === "true", container.dataset.status || "");
  });
  document.querySelectorAll("[data-newsroom-videos]").forEach(function (container) { renderVideos(container, Number(container.dataset.limit || 0)); });
  document.querySelectorAll("[data-newsroom-events]").forEach(function (container) { renderEvents(container, Number(container.dataset.limit || 0)); });
  document.querySelectorAll("[data-newsroom-source-ledger]").forEach(renderSourceLedger);
  document.querySelectorAll("[data-ecosystem-stats]").forEach(renderEvidenceStats);
  document.querySelectorAll("[data-ecosystem-ledger]").forEach(renderEvidenceLedger);
  document.querySelectorAll("[data-ecosystem-activities]").forEach(renderEvidenceActivities);

  document.addEventListener("click", function (event) {
    var motionControl = event.target.closest(".nr-event-motion-control");
    if (motionControl) {
      var strip = motionControl.closest(".nr-event-row").querySelector(".nr-event-strip");
      var paused = strip.classList.toggle("is-paused");
      motionControl.setAttribute("aria-pressed", String(paused));
      motionControl.textContent = paused ? "RESUME LOOP" : "PAUSE LOOP";
      return;
    }
    var evidenceFilter = event.target.closest("[data-evidence-filter]");
    if (evidenceFilter) {
      var ledger = document.querySelector("[data-ecosystem-ledger]");
      if (!ledger) return;
      ledger.dataset.activeFilter = evidenceFilter.dataset.evidenceFilter;
      document.querySelectorAll("[data-evidence-filter]").forEach(function (button) {
        var selected = button === evidenceFilter;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      applyEvidenceFilter(ledger);
      return;
    }
    var sourceFilter = event.target.closest("[data-source-filter]");
    if (sourceFilter) {
      var sourceRegister = sourceFilter.closest("[data-source-register]");
      var sourceLedger = sourceRegister && sourceRegister.querySelector("[data-newsroom-source-ledger]");
      if (!sourceLedger) return;
      sourceLedger.dataset.activeSourceFilter = sourceFilter.dataset.sourceFilter;
      sourceRegister.querySelectorAll("[data-source-filter]").forEach(function (button) {
        var selected = button === sourceFilter;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      applySourceFilter(sourceLedger);
      return;
    }
    var activityFilter = event.target.closest("[data-activity-filter]");
    if (activityFilter) {
      var activityRegister = activityFilter.closest("[data-activity-register]");
      var activityLedger = activityRegister && activityRegister.querySelector("[data-ecosystem-activities]");
      if (!activityLedger) return;
      activityLedger.dataset.activeActivityFilter = activityFilter.dataset.activityFilter;
      activityRegister.querySelectorAll("[data-activity-filter]").forEach(function (button) {
        var selected = button === activityFilter;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      applyActivityFilter(activityLedger);
      return;
    }
    var trigger = event.target.closest(".nr-video-poster");
    if (!trigger) return;
    var iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube-nocookie.com/embed/" + trigger.dataset.youtubeId + "?autoplay=1&rel=0";
    iframe.title = trigger.dataset.videoTitle;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    trigger.replaceWith(iframe);
  });

  document.addEventListener("input", function (event) {
    if (event.target.matches("[data-source-search]")) {
      var sourceRegister = event.target.closest("[data-source-register]");
      var sourceLedger = sourceRegister && sourceRegister.querySelector("[data-newsroom-source-ledger]");
      if (!sourceLedger) return;
      sourceLedger.dataset.sourceSearchQuery = event.target.value;
      applySourceFilter(sourceLedger);
      return;
    }
    if (event.target.matches("[data-activity-search]")) {
      var activityRegister = event.target.closest("[data-activity-register]");
      var activityLedger = activityRegister && activityRegister.querySelector("[data-ecosystem-activities]");
      if (!activityLedger) return;
      activityLedger.dataset.activitySearchQuery = event.target.value;
      applyActivityFilter(activityLedger);
      return;
    }
    if (!event.target.matches("[data-evidence-search]")) return;
    var ledger = document.querySelector("[data-ecosystem-ledger]");
    if (!ledger) return;
    ledger.dataset.searchQuery = event.target.value;
    applyEvidenceFilter(ledger);
  });

  document.addEventListener("pointerdown", function (event) {
    var strip = event.target.closest(".nr-event-strip");
    if (strip && event.pointerType !== "mouse") {
      strip.classList.add("is-paused");
      var control = strip.closest(".nr-event-row").querySelector(".nr-event-motion-control");
      if (control) {
        control.setAttribute("aria-pressed", "true");
        control.textContent = "RESUME LOOP";
      }
    }
  });
})();
