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
    return '<a href="' + escapeHtml(source.url) + '"' + (external ? ' target="_blank" rel="noopener noreferrer"' : '') + ' aria-label="查看来源：' + escapeHtml(source.label) + '">' +
      '<span>' + escapeHtml(source.type || article.sourceType) + '</span><strong>' + escapeHtml(source.label) + '</strong>' +
      '<em>' + escapeHtml(source.publisher) + '</em>' + (source.note ? '<p>' + escapeHtml(source.note) + '</p>' : '') + '<small>VERIFY SOURCE ↗</small></a>';
  }).join("");

  var body;
  if (slug === "launch-night-mybw-2025") {
    var gallery = data.events[0].images.map(function (path, index) { return '<a href="' + data.eventAssetBase + path + '" target="_blank" rel="noopener noreferrer"><img src="' + data.eventAssetBase + path + '" alt="MAGNE.AI Launch Night 精选照片 ' + (index + 1) + '" loading="lazy"></a>'; }).join("");
    body = '<p class="nr-article-lead">这场活动的意义不在于一次舞台曝光，而在于 MAGNE.AI 第一次把产品、团队和使用场景放进同一个公开现场。</p>' +
      '<h2>从内部项目进入公开叙事</h2><p>2025 年 7 月 20 日，MAGNE.AI 在 Kuala Lumpur 的 MYBW 2025 周期内举办 Launch Night。现有公司影像档案确认了现场舞台、简报、MAG1 与 NFC 卡展示以及来宾交流。</p>' +
      '<h2>W3 为什么保留这条记录</h2><p>Launch Night 是后续 Network、钱包、活动 Dashboard 与生态内容的共同起点。W3 在这里保留与 Web3、硬件入口和社区连接有关的部分，而不复制手机主站的完整品牌故事。</p>' +
      '<div class="nr-article-gallery">' + gallery + '</div>' +
      '<p class="nr-article-note">影像档案只承担现场证据，不替代新闻正文。原始母版与未精选照片不提交到 W3 仓库。</p>';
  } else if (slug === "magne-l1-mhash-l2-open-source") {
    body = '<p class="nr-article-lead">W3 的价值不来自一句“我们有链”，而来自任何开发者都可以检查的网络入口、代码与运行边界。</p>' +
      '<h2>从白皮书叙事进入开发者表面</h2><p>MAGNE L1 与 M Hash L2 的公开代码、测试网、RPC、Explorer 与开发文档构成 W3 的基础证据层。当前页面只描述已经公开的开发资源；测试网状态不被包装为主网、商业可用性或安全审计完成。</p>' +
      '<div class="nr-article-metrics"><div><span>NETWORK</span><strong>MAGNE L1</strong></div><div><span>EXECUTION</span><strong>M HASH L2</strong></div><div><span>STATUS</span><strong>TESTNET</strong></div><div><span>ACCESS</span><strong>PUBLIC DOCS</strong></div></div>' +
      '<h2>W3 Newsroom 如何引用网络进展</h2><p>网络事件必须连接到代码仓库、公开 Explorer、开发文档或双方公告。计划中的主网、合作、审计与生态接入会单独标记为 Planned、Restricted 或 Source Required。</p>' +
      '<p class="nr-article-note">网络参数与可用性可能变化。集成前请以 Developers 页面和公开仓库的最新配置为准。</p>';
  } else if (slug === "strategic-financing-10m") {
    body = '<p class="nr-article-lead">这是一条公司披露的融资事件记录，不是“八家媒体分别确认了融资”。W3 将一个事件与八个传播、数据和参考页面归并为同一来源谱系。</p>' +
      '<h2>已公开的核心事实</h2><p>MAGNE.AI 在第一方渠道披露 1,000 万美元战略融资；同一内容经 Bitcoin.com 新闻稿页面分发，并被多家快讯与融资周报收录。Architect Partners 的季度融资报告提供了外部数据层的交叉核验。</p>' +
      '<div class="nr-article-metrics"><div><span>DISCLOSED AMOUNT</span><strong>US$10M</strong></div><div><span>EVENTS</span><strong>01</strong></div><div><span>PUBLIC SOURCES</span><strong>08</strong></div><div><span>INDEPENDENT ENDORSEMENT</span><strong>NO</strong></div></div>' +
      '<h2>来源边界</h2><p>Bitcoin.com 页面被明确标注为 Sponsored / Syndicated；PANews、Odaily、TechFlow、ChainCatcher 与 GFM Review 作为从属参考，不被累计成独立背书。当前公开材料不能独立证明交易交割文件、资金到账凭证或未公开条款。</p>' +
      '<p class="nr-article-note">本文只归档公开披露与来源关系。受 NDA 约束的融资文件、交易文件和未公开协议不在 Newsroom 发布。</p>';
  } else if (slug === "follow-on-financing-264m") {
    body = '<p class="nr-article-lead">MAGNE.AI 通过 Chainwire 公司新闻稿披露 264 万美元后续战略融资。W3 保留这条公司记录，同时把转载与聚合页面降级为从属参考。</p>' +
      '<h2>公司稿披露了什么</h2><p>新闻稿以 Edge AI、Agentic Payments 与链上基础设施作为资金用途叙事。官方视觉同时标示累计公开融资为 1,264 万美元；该累计值是公司披露口径，不等同独立财务审计。</p>' +
      '<div class="nr-article-metrics"><div><span>FOLLOW-ON</span><strong>US$2.64M</strong></div><div><span>COMPANY TOTAL</span><strong>US$12.64M</strong></div><div><span>PRIMARY RELEASE</span><strong>01</strong></div><div><span>REFERENCE SOURCES</span><strong>03</strong></div></div>' +
      '<h2>没有被放大的部分</h2><p>CryptoRank、FFNews 与 PANews 用于核对传播路径和事件时间，不被写成三次新的融资确认。新闻稿中的产品路线与资金用途仍属于 Company Release 叙事。</p>' +
      '<p class="nr-article-note">融资金额、累计融资与资金用途均按公开公司稿标示；Newsroom 不公开 NDA、银行凭证、交易所材料或未宣布投资关系。</p>';
  } else if (slug === "external-commentary-index") {
    body = '<p class="nr-article-lead">外部文章的价值在于提供不同观察角度，而不是替代产品测试。当前公开盘点只识别出两篇可明确归入 Independent Commentary 的文章。</p>' +
      '<h2>两种外部观察</h2><p>RecodeX Pro 从 Edge AI 硬件与链上 Agent Payments 的连接方式切入；minia2a 从硬件端点、密钥托管与 Agent API 生态切入。两篇文章都应作为观点阅读，文章内的具体断言仍需回到一手资料。</p>' +
      '<div class="nr-article-metrics"><div><span>COMMENTARY</span><strong>02</strong></div><div><span>HARDWARE REVIEWS</span><strong>00</strong></div><div><span>PERFORMANCE TESTS</span><strong>00</strong></div><div><span>EDITORIAL MODE</span><strong>DISCLOSED</strong></div></div>' +
      '<h2>现阶段缺少什么</h2><p>目前没有找到足够证据的独立硬件评测、端侧模型性能测试、续航测试或安全实验室复测。W3 不会把融资新闻稿、合作稿或转载文章改写为产品评测。</p>' +
      '<p class="nr-article-note">Independent Commentary 表示编辑观点相对独立，不表示每个事实陈述均已由 W3 验证，也不构成投资或采购建议。</p>';
  }

  mount.innerHTML = '<header class="nr-article-header"><div class="nr-meta"><time datetime="' + article.date + '">' + article.date + '</time><span>' + article.category + '</span><span>' + article.sourceType + '</span></div><h1>' + article.title + '</h1><p>' + article.summary + '</p><div class="nr-factline">' + article.facts.map(function (fact) { return '<span>' + fact + '</span>'; }).join("") + '</div></header>' +
    '<figure class="nr-article-cover"><img src="' + article.cover + '" alt="' + article.coverAlt + '" width="1600" height="900"><figcaption>16:9 / COMPANY ARCHIVE / SOURCE-BOUND</figcaption></figure>' +
    '<div class="nr-article-layout"><article class="nr-article-body">' + body + '</article><aside><span class="nr-aside-label">SOURCE REGISTER</span><div class="nr-source-register">' + sourceLinks + '</div><dl class="nr-publish-ledger"><div><dt>PUBLISHED</dt><dd>' + article.date + '</dd></div><div><dt>MODIFIED</dt><dd>' + article.modified + '</dd></div><div><dt>SOURCE TYPE</dt><dd>' + article.sourceType + '</dd></div><div><dt>STATUS</dt><dd>' + (article.publicationStatus || "VERIFIED PUBLIC") + '</dd></div></dl></aside></div>' +
    '<nav class="nr-article-nav" aria-label="相关文章"><a href="../../news/">← NEWS INDEX</a><a href="../../events/">EVENTS INDEX →</a></nav>';
})();
