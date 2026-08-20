(function () {
  "use strict";

  var officialAsset = "https://jerrysohigh-create.github.io/magne-web/MAGNE.AI/assets/images/";
  var siteRoot = document.body.dataset.root || "";
  var localEventAsset = siteRoot + "assets/images/newsroom/events/";
  var localFundingAsset = siteRoot + "assets/images/newsroom/funding/";
  var localDataAsset = siteRoot + "assets/images/newsroom/data/";
  function numberedImages(folder, count) {
    return Array.from({ length: count }, function (_, index) {
      return folder + "/" + String(index + 1).padStart(3, "0") + ".webp";
    });
  }
  window.W3_NEWSROOM = {
    articles: [
      {
        slug: "launch-night-mybw-2025",
        status: "published",
        featured: true,
        date: "2025-07-20",
        modified: "2026-08-20",
        category: "EVENTS",
        sourceType: "Company Release",
        title: "MAGNE.AI Launch Night · MYBW 2025",
        summary: "MAGNE.AI 在吉隆坡完成首次公开亮相，以产品演示、现场交流与活动影像记录品牌进入公开阶段的起点。",
        cover: officialAsset + "stories/events/launch-night/01.webp",
        coverAlt: "MAGNE.AI Launch Night 舞台与现场来宾",
        href: "article/launch-night-mybw-2025/",
        facts: ["2025.07.20", "KUALA LUMPUR", "4 SELECTED IMAGES", "COMPANY ARCHIVE"],
        sources: [
          { label: "活动预告", url: "https://x.com/Magne_Ai/status/1942974147304534357", publisher: "MAGNE.AI X" },
          { label: "联合主办与支持方", url: "https://x.com/Magne_Ai/status/1945432873345094128", publisher: "MAGNE.AI X" },
          { label: "完整议程", url: "https://x.com/Magne_Ai/status/1946073548201824309", publisher: "MAGNE.AI X" },
          { label: "会后回顾", url: "https://x.com/Magne_Ai/status/1947331133571830200", publisher: "MAGNE.AI X" },
          { label: "联合主办方确认", url: "https://x.com/BeckerVentures/status/1947335120589131957", publisher: "Becker Ventures X" },
          { label: "官方视频回顾", url: "https://x.com/Magne_Ai/status/1948226297483919778", publisher: "MAGNE.AI X" },
          { label: "MAGNE.AI 影像档案", url: "https://jerrysohigh-create.github.io/magne-web/MAGNE.AI/stories.html#launch-night-2025", publisher: "MAGNE.AI" }
        ]
      },
      {
        slug: "global-compliance-milestones",
        status: "published",
        featured: false,
        date: "2026-07-14",
        modified: "2026-08-20",
        category: "NEWS",
        sourceType: "Company Release",
        title: "MAG1 全球合规与认证里程碑汇总",
        summary: "将 GMS、Widevine L1、GSMA TAC、FCC、CB、UN38.3、CP65 与 CE 的公开状态集中到同一证据索引。",
        cover: officialAsset + "webx-tokyo.webp",
        coverAlt: "MAGNE.AI Phone Gen1 公开活动画面",
        href: "trust.html",
        facts: ["08 PUBLIC SIGNALS", "FCC PUBLIC", "GSMA TAC OBTAINED", "NDA FILES EXCLUDED"],
        sources: [
          { label: "Web2 基础资料室", url: "https://jerrysohigh-create.github.io/DR/tc/web2-foundation.html", publisher: "MAGNE.AI DD" },
          { label: "MAGNE.AI 产品与认证总览", url: "https://jerrysohigh-create.github.io/magne-web/tc/magne-home.html", publisher: "MAGNE.AI" }
        ]
      },
      {
        slug: "season-1-onchain-record",
        status: "published",
        featured: true,
        date: "2026-07-06",
        category: "ECOSYSTEM",
        sourceType: "Company Release",
        title: "Phone Gen1 Lottery Season 1 链上参与记录",
        summary: "Season 1 归档记录 76,650 个独立参与钱包地址与 100,407 条衍生参与记录；USDT 交互仅按公开 Dashboard 已核实字段表述。",
        cover: localDataAsset + "season-1-wallet-growth.svg",
        coverAlt: "Season 1 累计参与钱包地址增长图，2026年4月17日至7月6日累计达到76,650个地址",
        href: "season-1.html",
        facts: ["76,650 WALLETS", "100,407 ENTRIES", "1,004 UNITS", "CLOSED"],
        sources: [{ label: "W3 Season 1 Dashboard", url: "season-1.html", publisher: "W3 DATA" }]
      },
      {
        slug: "magne-l1-mhash-l2-open-source",
        status: "published",
        featured: true,
        date: "2025-09-09",
        modified: "2026-08-20",
        category: "ECOSYSTEM",
        sourceType: "Company Release",
        title: "MAGNE L1 与 M Hash L2 开放开发资源",
        summary: "公开代码、RPC、浏览器与开发文档被组织为可检查的开发者入口；测试网状态不等同主网承诺。",
        cover: localDataAsset + "magne-l1-mhash-l2-developer-surface.svg",
        coverAlt: "MAGNE L1 与 M Hash L2 测试网公开开发资源关系图",
        href: "article/magne-l1-mhash-l2-open-source/",
        facts: ["L1 + L2", "TESTNET", "PUBLIC DOCS", "SOURCE INDEX"],
        sources: [
          { label: "MAGNE.AI GitHub", url: "https://github.com/magne-ai", publisher: "MAGNE.AI" },
          { label: "W3 Developer Surface", url: "../../../developers.html", publisher: "W3.MAGNE.AI" }
        ]
      },
      {
        slug: "strategic-financing-10m",
        status: "published",
        featured: false,
        date: "2025-08-25",
        modified: "2026-08-21",
        category: "NEWS",
        sourceType: "Company Release / Sponsored Distribution",
        publicationStatus: "PUBLIC / SOURCE-LABELED",
        title: "MAGNE.AI 披露 1,000 万美元战略融资",
        summary: "公司渠道披露 1,000 万美元战略融资；Bitcoin.com 页面明确按 Sponsored / Syndicated 处理，Architect Partners 季报只作为外部数据交叉核验。",
        cover: localFundingAsset + "strategic-financing-10m.png",
        coverAlt: "MAGNE.AI 宣布完成一千万美元战略融资的官方发布图片",
        href: "article/strategic-financing-10m/",
        facts: ["US$10M DISCLOSED", "01 EVENT RECORD", "08 PUBLIC SOURCES", "NO INDEPENDENT ENDORSEMENT"],
        sources: [
          { type: "Company Release", label: "MAGNE.AI 融资声明", url: "https://www.linkedin.com/posts/magne-ai_magneai-raises-10m-strategic-financing-activity-7365230156128415745-fwey", publisher: "MAGNE.AI LinkedIn", note: "融资声明的第一方来源。" },
          { type: "Sponsored / Syndicated", label: "融资新闻稿分发页", url: "https://news.bitcoin.com/magne-ai-raises-10m-strategic-financing-to-accelerate-ai-web3-native-smartphone-and-dual-chain-ecosystem/", publisher: "Bitcoin.com", note: "按新闻稿 / 赞助分发处理，不作为独立媒体背书。" },
          { type: "Data / Registry Reference", label: "Q3 2025 Crypto M&A and Financing Report", url: "https://architectpartners.com/wp-content/uploads/2025/10/Q3-2025-Crypto-MA-and-Financing-Report.pdf", publisher: "Architect Partners", note: "季度融资数据报告，用于外部交叉核验。" },
          { type: "Reference Only", label: "融资新闻简报", url: "https://www.panewslab.com/en/articles/6a32c509-08c9-4364-8587-21a6b6e07220", publisher: "PANews", note: "稿件明确基于官方消息。" },
          { type: "Reference Only", label: "融资快讯", url: "https://www.odaily.news/newsflash/445296", publisher: "Odaily", note: "转载 / 快讯层，只作事件时间与传播路径参考。" },
          { type: "Reference Only", label: "融资快讯", url: "https://www.techflowpost.com/en-US/newsletter/96534", publisher: "TechFlow", note: "转载 / 快讯层，不增加独立确认。" },
          { type: "Reference Only", label: "融资简报（日文）", url: "https://www.chaincatcher.com/ja/article/2200682", publisher: "ChainCatcher", note: "转载 / 简报层。" },
          { type: "Reference Only", label: "Crypto VC financing roundup", url: "https://www.gfmreview.com/crypto/crypto-vc-funding-rain-raises-58m-orangex-secures-20m", publisher: "GFM Review", note: "融资周报条目，用于从属交叉核验。" }
        ]
      },
      {
        slug: "follow-on-financing-264m",
        status: "published",
        featured: false,
        date: "2026-08-05",
        modified: "2026-08-21",
        category: "NEWS",
        sourceType: "Company Press Release",
        publicationStatus: "PUBLIC / SOURCE-LABELED",
        title: "MAGNE.AI 发布 264 万美元后续融资公司稿",
        summary: "MAGNE.AI 通过 Chainwire 公司新闻稿披露 US$2.64M 后续战略融资；US$12.64M 为公司口径累计公开融资，不作为独立审计结论。",
        cover: localFundingAsset + "additional-financing-264m.png",
        coverAlt: "MAGNE.AI 宣布二百六十四万美元后续战略融资的官方发布图片",
        href: "article/follow-on-financing-264m/",
        facts: ["US$2.64M DISCLOSED", "US$12.64M COMPANY TOTAL", "01 PRIMARY RELEASE", "03 REFERENCE SOURCES"],
        sources: [
          { type: "Company Release", label: "Strategic funding company release", url: "https://chainwire.org/2026/08/05/magne-ai-secures-2-64m-strategic-funding-for-edge-ai-agentic-payments-on-chain-infrastructure/", publisher: "Chainwire", note: "公司新闻稿的主要公开页面。" },
          { type: "Reference Only", label: "Funding record", url: "https://cryptorank.io/news/feed/magne-ai-strategic-2026-07-22", publisher: "CryptoRank", note: "融资数据库 / 新闻聚合参考。" },
          { type: "Reference Only", label: "Funding news take", url: "https://ffnews.com/news/magneai-secures-264m-strategic-funding-to-revolutionize-edge-ai-and-agentic-payments", publisher: "FFNews", note: "内容依赖公司稿，不作为独立融资确认。" },
          { type: "Reference Only", label: "Weekly financing roundup", url: "https://www.panewslab.com/zh-hant/articles/019fe989-157c-771e-bc3a-e5fd4451ef53", publisher: "PANews", note: "周度融资汇总，用于从属交叉核验。" }
        ]
      },
      {
        slug: "external-commentary-index",
        status: "published",
        featured: false,
        date: "2026-08-09",
        modified: "2026-08-21",
        category: "NEWS",
        sourceType: "Independent Commentary",
        publicationStatus: "PUBLIC / VIEWPOINT-LABELED",
        title: "外部评论索引：Edge AI、硬件端点与 Agent Payments",
        summary: "目前仅识别出 2 篇可明确归类为 Independent Commentary 的文章；它们提供观点，不构成独立硬件评测、性能测试或融资确认。",
        cover: localDataAsset + "external-commentary-index.svg",
        coverAlt: "W3 外部评论来源索引图，标示两篇独立评论与零篇独立硬件评测",
        href: "article/external-commentary-index/",
        facts: ["02 COMMENTARY", "00 HARDWARE REVIEWS", "VIEWPOINTS ≠ VERIFICATION", "SOURCE DISCLOSURE"],
        sources: [
          { type: "Independent Commentary", label: "Magne AI Raises $2.64M to Bridge Edge AI Hardware and On-Chain Agent Payments", url: "https://recodex.pro/magne-ai-raises-2-64m-to-bridge-edge-ai-hardware-and-on-chain-agent-payments/", publisher: "RecodeX Pro", note: "外部分析文章；个别陈述仍需回到一手资料复核。" },
          { type: "Independent Commentary", label: "Magne AI: Edge Hardware and Agent Payments", url: "https://minia2a.uk/blog/magne-ai-edge-hardware-agent-payments-august-2026", publisher: "minia2a", note: "从 Agent API / 硬件端点视角评论；需披露作者生态邻近性。" }
        ]
      }
    ],
    videos: [
      { id: "ZMhyf6yImOc", title: "在 MAG1 上建立新钱包", date: "2026", duration: "SHORT", captions: "YouTube", source: "MAGNE.AI YouTube", relation: "WALLET", poster: officialAsset + "stories/wallet-create.jpg" },
      { id: "bcHC_FbMrog", title: "使用 NFC 卡完成恢复", date: "2026", duration: "SHORT", captions: "YouTube", source: "MAGNE.AI YouTube", relation: "RECOVERY", poster: officialAsset + "stories/nfc-recovery.jpg" },
      { id: "1k2nQIyhDsg", title: "连接钱包至 dApp", date: "2026", duration: "SHORT", captions: "YouTube", source: "MAGNE.AI YouTube", relation: "DAPP", poster: officialAsset + "stories/dapp-connect.jpg" },
      { id: "BZOy194iYA8", title: "隐藏 Private Space", date: "2026", duration: "SHORT", captions: "YouTube", source: "MAGNE.AI YouTube", relation: "PRIVACY", poster: officialAsset + "stories/private-space.jpg" }
    ],
    events: [
      { slug: "launch-night-mybw-2025", date: "2025.07.20", place: "KUALA LUMPUR", title: "MAGNE.AI Launch Night", note: "MYBW 2025 · 产品公开、现场展示与社群交流", article: "../article/launch-night-mybw-2025/", images: ["launch-night/01.webp", "launch-night/02.webp", "launch-night/03.webp", "launch-night/04.webp"] },
      { slug: "new-york-2025", date: "2025.08.24", place: "NEW YORK", title: "Intelligent Assets: AI Meets RWA", note: "主题分享、圆桌对谈与公开交流", article: "", source: "https://x.com/Magne_Ai/status/1958353101184004426", assetBase: localEventAsset, images: numberedImages("new-york", 58) },
      { slug: "philadelphia-2026", date: "2026.01.22", place: "PHILADELPHIA", title: "University Engagement Tour", note: "Real-World Assets 校园分享与公开讨论", article: "", source: "https://x.com/Magne_Ai/status/2013446389351735506", assetBase: localEventAsset, images: numberedImages("philadelphia", 11) },
      { slug: "webx-tokyo-2026", date: "2026.07", place: "TOKYO", title: "AI Agents Night · WebX Tokyo", note: "GAEA Ventures WebX 系列边会 · 产品与生态展示", article: "", assetBase: localEventAsset, images: numberedImages("webx-tokyo", 12) }
    ],
    eventAssetBase: officialAsset + "stories/events/"
  };
})();
