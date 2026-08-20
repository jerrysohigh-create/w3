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
      return '<article class="nr-video-item"><button class="nr-video-poster" type="button" data-youtube-id="' + item.id + '" data-video-title="' + item.title + '"><img src="' + item.poster + '" alt="' + item.title + ' video poster" loading="lazy" width="1280" height="720"><span aria-hidden="true">▶</span><b class="sr-only">Play: ' + item.title + '</b></button><div class="nr-video-copy"><span>' + item.relation + ' / ' + item.date + '</span><h2>' + item.title + '</h2><dl><div><dt>DURATION</dt><dd>' + item.duration + '</dd></div><div><dt>CAPTIONS</dt><dd>' + item.captions + '</dd></div><div><dt>SOURCE</dt><dd>' + item.source + '</dd></div></dl></div></article>';
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
        return '<a href="' + assetBase + path + "\" target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"View" + item.title + "Photos" + (imageIndex + 1) + '"><img src="' + assetBase + path + '" alt="' + item.title + "Photos" + (imageIndex + 1) + '" loading="lazy"></a>';
      }).join("");
      var duplicateImages = item.images.map(function (path) {
        return '<a href="' + assetBase + path + '" target="_blank" rel="noopener noreferrer" tabindex="-1"><img src="' + assetBase + path + '" alt="" loading="lazy"></a>';
      }).join("");
      var action = item.article
        ? '<a href="' + item.article + '">OPEN EVENT FILE ↗</a>'
        : (item.source
          ? '<a href="' + item.source + '" target="_blank" rel="noopener noreferrer" aria-label="Open the official source for ' + item.title + ' in a new window">SOURCE RECORD ↗</a>'
          : '<span>DETAIL SOURCE PENDING</span>');
      return '<article class="nr-event-row" id="' + escapeHtml(item.slug) + '"><header><time class="nr-event-date" datetime="' + isoDate + '"><span>0' + (index + 1) + '</span><b>' + year + '</b><em>' + monthDay + '</em><small>' + datePrecision + '</small></time><div><p>LOCATION / ' + item.place + '</p><h2>' + item.title + '</h2><small>' + item.note + '</small></div>' + action + '</header>' +
        '<div class="nr-event-motion-meta"><span>ALL ' + String(item.images.length).padStart(2, "0") + ' PUBLIC IMAGES / AUTO LOOP</span><button type="button" class="nr-event-motion-control" aria-pressed="false">PAUSE LOOP</button></div>' +
        '<div class="nr-event-strip" tabindex="0" aria-label="' + item.title + "Automatically scroll photos, with manual horizontal scrolling\" style=\"--nr-scroll-duration:" + Math.max(18, item.images.length * 6) + 's"><div class="nr-event-track"><div class="nr-event-group">' + images + '</div><div class="nr-event-group" aria-hidden="true">' + duplicateImages + '</div></div></div></article>';
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
      '<a href="' + escapeHtml(record.url) + "\" target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"Open source in new window:" + escapeHtml(record.title) + '">SOURCE ↗</a>' +
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
    if (type === "dual-post") return { group: "bilateral", label: "BILATERAL / DUAL POST", detail: "Original X posts from both parties are indexed", className: "is-dual" };
    if (type === "dual-capital") return { group: "bilateral", label: "BILATERAL / CAPITAL", detail: "Official posts from both parties confirm the capital relationship", className: "is-dual" };
    if (type === "reply-confirmed") return { group: "bilateral", label: "BILATERAL / REPLY", detail: "Unilateral announcement + official confirmation from the other party", className: "is-dual" };
    if (type === "repost-confirmed") return { group: "bilateral", label: "BILATERAL / REPOST", detail: "Unilateral post + other party’s official forwarding", className: "is-dual" };
    if (type === "partner-quote-confirmed") return { group: "bilateral", label: "BILATERAL / PARTNER QUOTE", detail: "The official post of the partner quoted MAGNE’s original post", className: "is-dual" };
    if (type === "quote-confirmed") return { group: "bilateral", label: "BILATERAL / QUOTE · ACTIVATION", detail: "Partner’s original post + MAGNE official quote", className: "is-dual" };
    if (type === "bilateral-confirmed-pending") return { group: "bilateral", label: "BILATERAL / OFFICIAL CONFIRMATION", detail: "Both parties confirmed the relationship; some supporting X IDs remain unrecovered", className: "is-dual" };
    if (type === "reply-confirmed-pending") return { group: "bilateral", label: "BILATERAL / OFFICIAL RESPONSE", detail: "Cooperation statement + official response from the other party; status ID to be recycled", className: "is-dual" };
    if (type === "repost-confirmed-pending") return { group: "bilateral", label: "BILATERAL / OFFICIAL REPOST", detail: "Cooperation announcement + official forwarding by the other party; status ID to be recycled", className: "is-dual" };
    if (type === "joint-activation-confirmed") return { group: "bilateral", label: "BILATERAL / JOINT ACTIVATION", detail: "Joint activities and valid official accounts of both parties have been confirmed", className: "is-dual" };
    if (type === "platform-listing-confirmed") return { group: "bilateral", label: "BILATERAL / PLATFORM LISTING", detail: "MAGNE original post + official platform project included", className: "is-dual" };
    if (type === "capital-magne") return { group: "single", label: "ONE X URL / CAPITAL", detail: "Strategic investment relationship announced by MAGNE", className: "is-magne" };
    if (type === "single-magne") return { group: "single", label: "ONE X URL / MAGNE", detail: "MAGNE's original post is indexed; no partner-side action is linked", className: "is-magne" };
    if (type === "single-partner") return { group: "single", label: "ONE X URL / PARTNER", detail: "The original post of the partner is locked; the MAGNE action is not indexed", className: "is-partner" };
    if (type === "source-conflict") return { group: "coverage", label: "SOURCE CONFLICT", detail: "The original link is inconsistent with the object", className: "is-conflict" };
    if (type === "source-inaccessible") return { group: "pending", label: "SOURCE INACCESSIBLE / RECHECK", detail: "Historical address has been retained; X is currently unavailable for explicit return", className: "is-mirror" };
    if (type === "coverage-only") return { group: "coverage", label: "COVERAGE ONLY", detail: "is only for discovery clues and does not count for confirmation by both parties.", className: "is-coverage" };
    if (type === "repost-pending") return { group: "pending", label: "REPOST OBSERVED / X PENDING", detail: "The official account has been listed, the original post ID needs to be recycled", className: "is-mirror" };
    if (type === "reply-pending") return { group: "pending", label: "REPLY OBSERVED / X PENDING", detail: "The official account has been listed, and the confirmation post ID needs to be recycled", className: "is-mirror" };
    if (type === "dual-pending") return { group: "pending", label: "DUAL POSTS / X PENDING", detail: "The accounts of both parties have been listed, and the original post ID needs to be recycled.", className: "is-mirror" };
    return { group: "pending", label: "POST ID PENDING", detail: "Official X address has been listed, the original post status ID is to be recycled", className: "is-mirror" };
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
      [String(items.length).padStart(2, "0"), "TIMELINE RECORDS", "Historical baseline plus public-source additions"],
      [String(counts.bilateral || 0).padStart(2, "0"), "BILATERAL CONFIRMED", "Partner-side official interaction is recorded; any missing X ID is disclosed"],
      [String(counts.single || 0).padStart(2, "0"), "ONE X URL", "One original post is indexed; this does not prove the relationship was unilateral"],
      [String(counts.pending || 0).padStart(2, "0"), "X ID PENDING", "An official action was identified, but its exact X status URL is not yet recovered"],
      [String(counts.coverage || 0).padStart(2, "0"), "COVERAGE / CONFLICT", "Coverage-only or conflicting records are separated from bilateral confirmation"]
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
      var ariaType = isXStatus ? " original X post" : (isXProfile ? " official X account" : (isPlatform ? " official platform project page" : " independent coverage"));
      links.push('<a href="' + escapeHtml(url) + "\" target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"Open in new window" + escapeHtml(item.partner) + ariaType + '">' + escapeHtml(label) + '</a>');
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
    var limit = Number(container.dataset.visibleLimit || 20);
    var matches = 0;
    var visible = 0;
    container.querySelectorAll(".nr-evidence-row").forEach(function (row) {
      var sourceMatch = active === "all" || row.dataset.evidenceSource === active;
      var searchMatch = !query || row.dataset.evidenceSearch.indexOf(query) !== -1;
      var matched = sourceMatch && searchMatch;
      if (matched) matches += 1;
      row.hidden = !matched || matches > limit;
      if (!row.hidden) visible += 1;
    });
    var counter = document.querySelector("[data-evidence-count]");
    if (counter) counter.textContent = String(visible).padStart(2, "0") + " OF " + String(matches).padStart(2, "0") + " RECORDS";
    var more = document.querySelector("[data-evidence-more]");
    if (more) {
      more.hidden = visible >= matches;
      more.textContent = "$ SHOW 20 MORE →";
    }
  }

  function renderEvidenceLedger(container) {
    var items = unifiedTimeline();
    if (!items.length) return;
    container.dataset.activeFilter = "all";
    container.dataset.visibleLimit = "20";
    container.innerHTML = items.map(evidenceRow).join("");
    var more = document.createElement("button");
    more.type = "button";
    more.className = "btn nr-evidence-more";
    more.setAttribute("data-evidence-more", "");
    container.insertAdjacentElement("afterend", more);
    applyEvidenceFilter(container);
  }

  function renderEvidenceActivities(container) {
    if (!evidence) return;
    container.innerHTML = evidence.activities.map(function (item, index) {
      var replay = item.replayUrl ? '<a href="' + escapeHtml(item.replayUrl) + '" target="_blank" rel="noopener noreferrer" aria-label="Open the X Space for ' + escapeHtml(item.title) + ' in a new window">SPACE ↗</a>' : '';
      return '<article data-activity-format="' + escapeHtml(item.format) + '" data-activity-status="' + escapeHtml(item.status) + '" data-activity-search="' + escapeHtml((item.title + " " + item.publisher + " " + item.handle).toLowerCase()) + '">' +
        '<b>' + String(index + 1).padStart(2, "0") + '</b>' +
        '<time datetime="' + escapeHtml(item.date) + '">' + escapeHtml(item.date) + '<small>' + escapeHtml(item.dateNote) + '</small></time>' +
        '<div><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.publisher) + ' · ' + escapeHtml(item.handle) + '</small><span class="nr-activity-status">' + escapeHtml(item.statusLabel) + '</span></div>' +
        '<div class="nr-activity-links"><a href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener noreferrer" aria-label="Open the original X record for ' + escapeHtml(item.title) + ' in a new window">SOURCE ↗</a>' + replay + '</div>' +
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
      ledger.dataset.visibleLimit = "20";
      document.querySelectorAll("[data-evidence-filter]").forEach(function (button) {
        var selected = button === evidenceFilter;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      applyEvidenceFilter(ledger);
      return;
    }
    var evidenceMore = event.target.closest("[data-evidence-more]");
    if (evidenceMore) {
      var evidenceLedger = document.querySelector("[data-ecosystem-ledger]");
      if (!evidenceLedger) return;
      evidenceLedger.dataset.visibleLimit = String(Number(evidenceLedger.dataset.visibleLimit || 20) + 20);
      applyEvidenceFilter(evidenceLedger);
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
    ledger.dataset.visibleLimit = "20";
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
