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
    return '<a href="' + escapeHtml(source.url) + '"' + (external ? ' target="_blank" rel="noopener noreferrer"' : '') + " aria-label=\"檢視來源：" + escapeHtml(source.label) + '">' +
      '<span>' + escapeHtml(source.type || article.sourceType) + '</span><strong>' + escapeHtml(source.label) + '</strong>' +
      '<em>' + escapeHtml(source.publisher) + '</em>' + (source.note ? '<p>' + escapeHtml(source.note) + '</p>' : '') + '<small>VERIFY SOURCE ↗</small></a>';
  }).join("");

  var body;
  if (slug === "launch-night-mybw-2025") {
    var gallery = data.events[0].images.map(function (path, index) { return '<a href="' + data.eventAssetBase + path + '" target="_blank" rel="noopener noreferrer"><img src="' + data.eventAssetBase + path + "\" alt=\"MAGNE.AI Launch Night 精選照片 " + (index + 1) + '" loading="lazy"></a>'; }).join("");
    body = '<p class="nr-article-lead">這場活動的意義不在於一次舞臺曝光，而在於 MAGNE.AI 第一次把產品、團隊和使用場景放進同一個公開現場。</p>' +
      '<h2>從內部專案進入公開敘事</h2><p>2025 年 7 月 20 日，MAGNE.AI 在 Kuala Lumpur 的 MYBW 2025 週期內舉辦 Launch Night。現有公司影像檔案確認了現場舞臺、簡報、MAG1 與 NFC 卡展示以及來賓交流。</p>' +
      '<h2>W3 為什麼保留這條記錄</h2><p>Launch Night 是後續 Network、錢包、活動 Dashboard 與生態內容的共同起點。W3 在這裡保留與 Web3、硬體入口和社群連線有關的部分，而不復制手機主站的完整品牌故事。</p>' +
      '<div class="nr-article-gallery">' + gallery + '</div>' +
      '<p class="nr-article-note">影像檔案只承擔現場證據，不替代新聞正文。原始母版與未精選照片不提交到 W3 倉庫。</p>';
  } else if (slug === "magne-l1-mhash-l2-open-source") {
    body = '<p class="nr-article-lead">W3 的價值不來自一句“我們有鏈”，而來自任何開發者都可以檢查的網路入口、程式碼與執行邊界。</p>' +
      '<h2>從白皮書敘事進入開發者表面</h2><p>MAGNE L1 與 M Hash L2 的公開程式碼、測試網、RPC、Explorer 與開發檔案構成 W3 的基礎證據層。當前頁面只描述已經公開的開發資源；測試網狀態不被包裝為主網、商業可用性或安全審計完成。</p>' +
      '<div class="nr-article-metrics"><div><span>NETWORK</span><strong>MAGNE L1</strong></div><div><span>EXECUTION</span><strong>M HASH L2</strong></div><div><span>STATUS</span><strong>TESTNET</strong></div><div><span>ACCESS</span><strong>PUBLIC DOCS</strong></div></div>' +
      '<h2>W3 Newsroom 如何引用網路進展</h2><p>網路事件必須連線到程式碼倉庫、公開 Explorer、開發檔案或雙方公告。計劃中的主網、合作、審計與生態接入會單獨標記為 Planned、Restricted 或 Source Required。</p>' +
      '<p class="nr-article-note">網路參數與可用性可能變化。整合前請以 Developers 頁面和公開倉庫的最新配置為準。</p>';
  } else if (slug === "strategic-financing-10m") {
    body = '<p class="nr-article-lead">這是一條公司披露的融資事件記錄，不是“八家媒體分別確認了融資”。W3 將一個事件與八個傳播、資料和參考頁面歸併為同一來源譜系。</p>' +
      '<h2>已公開的核心事實</h2><p>MAGNE.AI 在第一方渠道披露 1,000 萬美元戰略融資；同一內容經 Bitcoin.com 新聞稿頁面分發，並被多家快訊與融資週報收錄。Architect Partners 的季度融資報告提供了外部資料層的交叉核驗。</p>' +
      '<div class="nr-article-metrics"><div><span>DISCLOSED AMOUNT</span><strong>US$10M</strong></div><div><span>EVENTS</span><strong>01</strong></div><div><span>PUBLIC SOURCES</span><strong>08</strong></div><div><span>INDEPENDENT ENDORSEMENT</span><strong>NO</strong></div></div>' +
      '<h2>來源邊界</h2><p>Bitcoin.com 頁面被明確標註為 Sponsored / Syndicated；PANews、Odaily、TechFlow、ChainCatcher 與 GFM Review 作為從屬參考，不被累計成獨立背書。當前公開材料不能獨立證明交易交割檔案、資金到賬憑證或未公開條款。</p>' +
      '<p class="nr-article-note">本文只歸檔公開披露與來源關係。受 NDA 約束的融資檔案、交易檔案和未公開協議不在 Newsroom 釋出。</p>';
  } else if (slug === "follow-on-financing-264m") {
    body = '<p class="nr-article-lead">MAGNE.AI 通過 Chainwire 公司新聞稿披露 264 萬美元後續戰略融資。W3 保留這條公司記錄，同時把轉載與聚合頁面降級為從屬參考。</p>' +
      '<h2>公司稿披露了什麼</h2><p>新聞稿以 Edge AI、Agentic Payments 與鏈上基礎設施作為資金用途敘事。官方視覺同時標示累計公開融資為 1,264 萬美元；該累計值是公司披露口徑，不等同獨立財務審計。</p>' +
      '<div class="nr-article-metrics"><div><span>FOLLOW-ON</span><strong>US$2.64M</strong></div><div><span>COMPANY TOTAL</span><strong>US$12.64M</strong></div><div><span>PRIMARY RELEASE</span><strong>01</strong></div><div><span>REFERENCE SOURCES</span><strong>03</strong></div></div>' +
      '<h2>沒有被放大的部分</h2><p>CryptoRank、FFNews 與 PANews 用於核對傳播路徑和事件時間，不被寫成三次新的融資確認。新聞稿中的產品路線與資金用途仍屬於 Company Release 敘事。</p>' +
      '<p class="nr-article-note">融資金額、累計融資與資金用途均按公開公司稿標示；Newsroom 不公開 NDA、銀行憑證、交易所材料或未宣佈投資關係。</p>';
  } else if (slug === "external-commentary-index") {
    body = '<p class="nr-article-lead">外部文章的價值在於提供不同觀察角度，而不是替代產品測試。當前公開盤點只識別出兩篇可明確歸入 Independent Commentary 的文章。</p>' +
      '<h2>兩種外部觀察</h2><p>RecodeX Pro 從 Edge AI 硬體與鏈上 Agent Payments 的連線方式切入；minia2a 從硬體端點、金鑰託管與 Agent API 生態切入。兩篇文章都應作為觀點閱讀，文章內的具體斷言仍需回到一手資料。</p>' +
      '<div class="nr-article-metrics"><div><span>COMMENTARY</span><strong>02</strong></div><div><span>HARDWARE REVIEWS</span><strong>00</strong></div><div><span>PERFORMANCE TESTS</span><strong>00</strong></div><div><span>EDITORIAL MODE</span><strong>DISCLOSED</strong></div></div>' +
      '<h2>現階段缺少什麼</h2><p>目前沒有找到足夠證據的獨立硬體評測、端側模型效能測試、續航測試或安全實驗室複測。W3 不會把融資新聞稿、合作稿或轉載文章改寫為產品評測。</p>' +
      '<p class="nr-article-note">Independent Commentary 表示編輯觀點相對獨立，不表示每個事實陳述均已由 W3 驗證，也不構成投資或採購建議。</p>';
  }

  mount.innerHTML = '<header class="nr-article-header"><div class="nr-meta"><time datetime="' + article.date + '">' + article.date + '</time><span>' + article.category + '</span><span>' + article.sourceType + '</span></div><h1>' + article.title + '</h1><p>' + article.summary + '</p><div class="nr-factline">' + article.facts.map(function (fact) { return '<span>' + fact + '</span>'; }).join("") + '</div></header>' +
    '<figure class="nr-article-cover"><img src="' + article.cover + '" alt="' + article.coverAlt + '" width="1600" height="900"><figcaption>16:9 / COMPANY ARCHIVE / SOURCE-BOUND</figcaption></figure>' +
    '<div class="nr-article-layout"><article class="nr-article-body">' + body + '</article><aside><span class="nr-aside-label">SOURCE REGISTER</span><div class="nr-source-register">' + sourceLinks + '</div><dl class="nr-publish-ledger"><div><dt>PUBLISHED</dt><dd>' + article.date + '</dd></div><div><dt>MODIFIED</dt><dd>' + article.modified + '</dd></div><div><dt>SOURCE TYPE</dt><dd>' + article.sourceType + '</dd></div><div><dt>STATUS</dt><dd>' + (article.publicationStatus || "VERIFIED PUBLIC") + '</dd></div></dl></aside></div>' +
    '<nav class="nr-article-nav" aria-label="相關文章"><a href="../../news/">← NEWS INDEX</a><a href="../../events/">EVENTS INDEX →</a></nav>';
})();
