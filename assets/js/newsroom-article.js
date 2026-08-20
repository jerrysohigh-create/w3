(function () {
  "use strict";
  var data = window.W3_NEWSROOM;
  var slug = document.body.dataset.article;
  var article = data.articles.find(function (item) { return item.slug === slug; });
  var mount = document.getElementById("newsroom-article");
  if (!article || !mount) return;

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character];
    });
  }

  var sourceLinks = (article.sources || []).map(function (source) {
    var external = /^https?:/.test(source.url);
    return '<a href="' + escapeHtml(source.url) + '"' + (external ? ' target="_blank" rel="noopener noreferrer"' : '') + ' aria-label="View source: ' + escapeHtml(source.label) + '">' +
      '<span>' + escapeHtml(source.type || article.sourceType) + '</span><strong>' + escapeHtml(source.label) + '</strong>' +
      '<em>' + escapeHtml(source.publisher) + '</em>' + (source.note ? '<p>' + escapeHtml(source.note) + '</p>' : '') + '<small>VERIFY SOURCE ↗</small></a>';
  }).join("");

  var body;
  if (slug === "launch-night-mybw-2025") {
    var gallery = data.events[0].images.map(function (path, index) { return '<a href="' + data.eventAssetBase + path + '" target="_blank" rel="noopener noreferrer"><img src="' + data.eventAssetBase + path + '" alt="MAGNE.AI Launch Night selected photo ' + (index + 1) + '" loading="lazy"></a>'; }).join("");
    body = '<p class="nr-article-lead">The significance of this event is not a single moment of stage exposure. It is the first time MAGNE.AI placed its product, team and use cases within one public setting.</p>' +
      '<h2>From an internal project to a public narrative</h2><p>On July 20, 2025, MAGNE.AI held Launch Night during MYBW 2025 in Kuala Lumpur. The existing company image archive confirms the stage, presentation, MAG1 and NFC card demonstrations, and guest interaction.</p>' +
      '<h2>Why W3 preserves this record</h2><p>Launch Night is a shared starting point for the Network, wallet, campaign Dashboard and ecosystem records that followed. W3 preserves the Web3, hardware-entry and community-connectivity evidence without reproducing the full brand story of the phone website.</p>' +
      '<div class="nr-article-gallery">' + gallery + '</div>' +
      '<p class="nr-article-note">The image archive provides on-site evidence; it does not replace the article. Original masters and unselected photos are not committed to the W3 repository.</p>';
  } else if (slug === "magne-l1-mhash-l2-open-source") {
    body = '<p class="nr-article-lead">W3 derives its value from network endpoints, code and operational boundaries that any developer can inspect—not from simply claiming to have a chain.</p>' +
      '<h2>From a whitepaper narrative to a developer surface</h2><p>Public code, testnets, RPC endpoints, explorers and developer documentation for MAGNE L1 and M Hash L2 form W3\'s foundational evidence layer. This page describes only public development resources; testnet status is not presented as mainnet readiness, commercial availability or completion of a security audit.</p>' +
      '<div class="nr-article-metrics"><div><span>NETWORK</span><strong>MAGNE L1</strong></div><div><span>EXECUTION</span><strong>M HASH L2</strong></div><div><span>STATUS</span><strong>TESTNET</strong></div><div><span>ACCESS</span><strong>PUBLIC DOCS</strong></div></div>' +
      '<h2>How W3 Newsroom cites network progress</h2><p>Every network event must link to a code repository, public explorer, developer documentation or bilateral announcement. Planned mainnet work, partnerships, audits and ecosystem integrations are separately labelled Planned, Restricted or Source Required.</p>' +
      '<p class="nr-article-note">Network parameters and availability may change. Check the Developers page and public repositories for the latest configuration before integration.</p>';
  } else if (slug === "strategic-financing-10m") {
    body = '<p class="nr-article-lead">This is a company-disclosed financing event—not eight separate media confirmations. W3 groups one event and its eight distribution, data and reference pages into a single source lineage.</p>' +
      '<h2>Core facts in the public record</h2><p>MAGNE.AI disclosed a US$10 million strategic financing through first-party channels. The same release was distributed through Bitcoin.com and cited by several news feeds and financing roundups. Architect Partners\' quarterly financing report provides an external data point for cross-checking.</p>' +
      '<div class="nr-article-metrics"><div><span>DISCLOSED AMOUNT</span><strong>US$10M</strong></div><div><span>EVENTS</span><strong>01</strong></div><div><span>PUBLIC SOURCES</span><strong>08</strong></div><div><span>INDEPENDENT ENDORSEMENT</span><strong>NO</strong></div></div>' +
      '<h2>Source boundary</h2><p>The Bitcoin.com page is explicitly labelled Sponsored / Syndicated. PANews, Odaily, TechFlow, ChainCatcher and GFM Review are subordinate references, not cumulative independent endorsements. The public material does not independently establish closing documents, proof of funds received or undisclosed terms.</p>' +
      '<p class="nr-article-note">This article archives public disclosures and their source relationships only. Financing documents, transaction records and non-public agreements subject to NDA are not published in the Newsroom.</p>';
  } else if (slug === "follow-on-financing-264m") {
    body = '<p class="nr-article-lead">MAGNE.AI disclosed a US$2.64 million follow-on strategic financing through a Chainwire company release. W3 preserves the company record while treating republications and aggregator pages as subordinate references.</p>' +
      '<h2>What the company release states</h2><p>The release frames Edge AI, Agentic Payments and on-chain infrastructure as uses of proceeds. The official visual also states total publicly disclosed financing of US$12.64 million; this cumulative figure is a company-disclosed amount, not an independent financial audit.</p>' +
      '<div class="nr-article-metrics"><div><span>FOLLOW-ON</span><strong>US$2.64M</strong></div><div><span>COMPANY TOTAL</span><strong>US$12.64M</strong></div><div><span>PRIMARY RELEASE</span><strong>01</strong></div><div><span>REFERENCE SOURCES</span><strong>03</strong></div></div>' +
      '<h2>What is not amplified</h2><p>CryptoRank, FFNews and PANews are used to check distribution paths and timing; they are not presented as three new confirmations. Product roadmaps and uses of proceeds in the release remain Company Release claims.</p>' +
      '<p class="nr-article-note">Financing amounts, cumulative financing and uses of proceeds are labelled according to the public company release. The Newsroom does not publish NDAs, bank records, exchange materials or unannounced investment relationships.</p>';
  } else if (slug === "external-commentary-index") {
    body = '<p class="nr-article-lead">External articles provide different perspectives; they do not substitute for product testing. The current public-source review identified only two articles that clearly qualify as Independent Commentary.</p>' +
      '<h2>Two external perspectives</h2><p>RecodeX Pro examines the connection between Edge AI hardware and on-chain Agent Payments. minia2a approaches the topic through hardware endpoints, key custody and the Agent API ecosystem. Both should be read as viewpoints, with specific claims checked against primary sources.</p>' +
      '<div class="nr-article-metrics"><div><span>COMMENTARY</span><strong>02</strong></div><div><span>HARDWARE REVIEWS</span><strong>00</strong></div><div><span>PERFORMANCE TESTS</span><strong>00</strong></div><div><span>EDITORIAL MODE</span><strong>DISCLOSED</strong></div></div>' +
      '<h2>What is still missing</h2><p>We have not found adequately evidenced independent hardware reviews, on-device model benchmarks, battery tests or security-lab retests. W3 will not recast financing releases, partnership releases or syndicated articles as product reviews.</p>' +
      '<p class="nr-article-note">Independent Commentary means the editorial viewpoint is comparatively independent. It does not mean W3 has verified every factual claim, and it is not investment or purchasing advice.</p>';
  }

  mount.innerHTML = '<header class="nr-article-header"><div class="nr-meta"><time datetime="' + article.date + '">' + article.date + '</time><span>' + article.category + '</span><span>' + article.sourceType + '</span></div><h1>' + article.title + '</h1><p>' + article.summary + '</p><div class="nr-factline">' + article.facts.map(function (fact) { return '<span>' + fact + '</span>'; }).join("") + '</div></header>' +
    '<figure class="nr-article-cover"><img src="' + article.cover + '" alt="' + article.coverAlt + '" width="1600" height="900"><figcaption>16:9 / COMPANY ARCHIVE / SOURCE-BOUND</figcaption></figure>' +
    '<div class="nr-article-layout"><article class="nr-article-body">' + body + '</article><aside><span class="nr-aside-label">SOURCE REGISTER</span><div class="nr-source-register">' + sourceLinks + '</div><dl class="nr-publish-ledger"><div><dt>PUBLISHED</dt><dd>' + article.date + '</dd></div><div><dt>MODIFIED</dt><dd>' + article.modified + '</dd></div><div><dt>SOURCE TYPE</dt><dd>' + article.sourceType + '</dd></div><div><dt>STATUS</dt><dd>' + (article.publicationStatus || "VERIFIED PUBLIC") + '</dd></div></dl></aside></div>' +
    '<nav class="nr-article-nav" aria-label="Related articles"><a href="../../news/">← NEWS INDEX</a><a href="../../events/">EVENTS INDEX →</a></nav>';
})();
