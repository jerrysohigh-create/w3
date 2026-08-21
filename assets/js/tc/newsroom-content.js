(function () {
  "use strict";

  var officialAsset = "https://www.magne.ai/assets/images/";
  var siteRoot = document.body.dataset.root || "";
  var assetRoot = document.body.dataset.assetRoot || siteRoot;
  var localEventAsset = assetRoot + "assets/images/newsroom/events/";
  var localFundingAsset = assetRoot + "assets/images/newsroom/funding/";
  var localDataAsset = assetRoot + "assets/images/newsroom/data/";
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
        summary: "MAGNE.AI 在吉隆坡完成首次公開亮相，以產品展示、現場交流與活動影像記錄品牌進入公開階段的起點。",
        cover: officialAsset + "stories/events/launch-night/01.webp",
        coverAlt: "MAGNE.AI Launch Night 舞臺與現場賓客",
        href: "article/launch-night-mybw-2025/",
        facts: ["2025.07.20", "KUALA LUMPUR", "4 SELECTED IMAGES", "COMPANY ARCHIVE"],
        sources: [
          { label: "活動預告", url: "https://x.com/Magne_Ai/status/1942974147304534357", publisher: "MAGNE.AI X" },
          { label: "共同主辦與支援方", url: "https://x.com/Magne_Ai/status/1945432873345094128", publisher: "MAGNE.AI X" },
          { label: "完整議程", url: "https://x.com/Magne_Ai/status/1946073548201824309", publisher: "MAGNE.AI X" },
          { label: "會後回顧", url: "https://x.com/Magne_Ai/status/1947331133571830200", publisher: "MAGNE.AI X" },
          { label: "共同主辦單位確認", url: "https://x.com/BeckerVentures/status/1947335120589131957", publisher: "Becker Ventures X" },
          { label: "官方影片回顧", url: "https://x.com/Magne_Ai/status/1948226297483919778", publisher: "MAGNE.AI X" },
          { label: "MAGNE.AI 影像檔案", url: "https://www.magne.ai/en/stories.html#launch-night-2025", publisher: "MAGNE.AI" }
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
        title: "MAG1 全球合規與認證里程碑總合",
        summary: "將 GMS、Widevine L1、GSMA TAC、FCC、CB、UN38.3、CP65 與 CE 的公開狀態集中到同一證據索引。",
        cover: officialAsset + "webx-tokyo.webp",
        coverAlt: "MAGNE.AI Phone Gen1 公開活動畫面",
        href: "trust.html",
        facts: ["08 PUBLIC SIGNALS", "FCC PUBLIC", "GSMA TAC OBTAINED", "NDA FILES EXCLUDED"],
        sources: [
          { label: "Web2 基礎資料室", url: "https://jerrysohigh-create.github.io/DR/tc/web2-foundation.html", publisher: "MAGNE.AI DD" },
          { label: "MAGNE.AI 產品與認證總覽", url: "https://www.magne.ai/en/compliance.html", publisher: "MAGNE.AI" }
        ]
      },
      {
        slug: "season-1-onchain-record",
        status: "published",
        featured: true,
        date: "2026-07-06",
        category: "ECOSYSTEM",
        sourceType: "Company Release",
        title: "Phone Gen1 Lottery Season 1 鏈上參與記錄",
        summary: "Season 1 歸檔記錄 76,650 個獨立參與錢包位址與 100,407 筆衍生參與記錄；USDT 互動僅按公開 Dashboard 已核實欄位表述。",
        cover: localDataAsset + "season-1-wallet-growth.svg",
        coverAlt: "Season 1 累計參與錢包位址成長圖，2026年4月17日至7月6日累計達到76,650個位址",
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
        title: "MAGNE L1 與 M Hash L2 開放開發資源",
        summary: "公開程式碼、RPC、瀏覽器與開發檔案被組織為可檢查的開發者入口；測試網狀態不等同主網承諾。",
        cover: localDataAsset + "magne-l1-mhash-l2-developer-surface.svg",
        coverAlt: "MAGNE L1 與 M Hash L2 測試網公開開發資源關係圖",
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
        title: "MAGNE.AI 揭露 1,000 萬美元策略融資",
        summary: "公司通路揭露 1,000 萬美元策略融資；Bitcoin.com 頁面明確按 Sponsored / Syndicated 處理，Architect Partners 季度報只作為外部資料交叉核驗。",
        cover: localFundingAsset + "strategic-financing-10m.png",
        coverAlt: "MAGNE.AI 宣佈完成一千萬美元策略融資的官方發布圖片",
        href: "article/strategic-financing-10m/",
        facts: ["US$10M DISCLOSED", "01 EVENT RECORD", "08 PUBLIC SOURCES", "NO INDEPENDENT ENDORSEMENT"],
        sources: [
          { type: "Company Release", label: "MAGNE.AI 融資宣告", url: "https://www.linkedin.com/posts/magne-ai_magneai-raises-10m-strategic-financing-activity-7365230156128415745-fwey", publisher: "MAGNE.AI LinkedIn", note: "融資宣告的第一方來源。" },
          { type: "Sponsored / Syndicated", label: "融資新聞稿發行頁", url: "https://news.bitcoin.com/magne-ai-raises-10m-strategic-financing-to-accelerate-ai-web3-native-smartphone-and-dual-chain-ecosystem/", publisher: "Bitcoin.com", note: "依新聞稿 / 贊助分送處理，不以獨立媒體背書。" },
          { type: "Data / Registry Reference", label: "Q3 2025 Crypto M&A and Financing Report", url: "https://architectpartners.com/wp-content/uploads/2025/10/Q3-2025-Crypto-MA-and-Financing-Report.pdf", publisher: "Architect Partners", note: "季度融資資料報告，用於外部交叉核驗。" },
          { type: "Reference Only", label: "融資新聞簡報", url: "https://www.panewslab.com/en/articles/6a32c509-08c9-4364-8587-21a6b6e07220", publisher: "PANews", note: "稿件明確地基於官方訊息。" },
          { type: "Reference Only", label: "融資快訊", url: "https://www.odaily.news/newsflash/445296", publisher: "Odaily", note: "轉載 / 快訊層，只作事件時間與傳播路徑參考。" },
          { type: "Reference Only", label: "融資快訊", url: "https://www.techflowpost.com/en-US/newsletter/96534", publisher: "TechFlow", note: "轉載 / 快訊層，不增加獨立確認。" },
          { type: "Reference Only", label: "融資簡報（日文）", url: "https://www.chaincatcher.com/ja/article/2200682", publisher: "ChainCatcher", note: "轉載 / 簡報層。" },
          { type: "Reference Only", label: "Crypto VC financing roundup", url: "https://www.gfmreview.com/crypto/crypto-vc-funding-rain-raises-58m-orangex-secures-20m", publisher: "GFM Review", note: "融資週報條目，用於從屬交叉核驗。" }
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
        title: "MAGNE.AI 發布 264 萬美元後續融資公司稿",
        summary: "MAGNE.AI 透過 Chainwire 公司新聞稿揭露 US$2.64M 後續策略融資；US$12.64M 為公司口徑累計公開融資，不作為獨立審計結論。",
        cover: localFundingAsset + "additional-financing-264m.png",
        coverAlt: "MAGNE.AI 宣佈二百六十四萬美元後續策略融資的官方發布圖片",
        href: "article/follow-on-financing-264m/",
        facts: ["US$2.64M DISCLOSED", "US$12.64M COMPANY TOTAL", "01 PRIMARY RELEASE", "03 REFERENCE SOURCES"],
        sources: [
          { type: "Company Release", label: "Strategic funding company release", url: "https://chainwire.org/2026/08/05/magne-ai-secures-2-64m-strategic-funding-for-edge-ai-agentic-payments-on-chain-infrastructure/", publisher: "Chainwire", note: "公司新聞稿的主要公開頁面。" },
          { type: "Reference Only", label: "Funding record", url: "https://cryptorank.io/news/feed/magne-ai-strategic-2026-07-22", publisher: "CryptoRank", note: "融資資料庫 / 新聞聚合參考。" },
          { type: "Reference Only", label: "Funding news take", url: "https://ffnews.com/news/magneai-secures-264m-strategic-funding-to-revolutionize-edge-ai-and-agentic-payments", publisher: "FFNews", note: "內容依賴公司稿，不作為獨立融資確認。" },
          { type: "Reference Only", label: "Weekly financing roundup", url: "https://www.panewslab.com/zh-hant/articles/019fe989-157c-771e-bc3a-e5fd4451ef53", publisher: "PANews", note: "週度融資匯總，用於從屬交叉核驗。" }
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
        title: "外部評論索引：Edge AI、硬體端點與 Agent Payments",
        summary: "目前僅識別出 2 篇可明確歸類為 Independent Commentary 的文章；它們提供觀點，不構成獨立硬體評測、效能測試或融資確認。",
        cover: localDataAsset + "external-commentary-index.svg",
        coverAlt: "W3 外部評論來源索引圖，標示兩篇獨立評論與零篇獨立硬體評測",
        href: "article/external-commentary-index/",
        facts: ["02 COMMENTARY", "00 HARDWARE REVIEWS", "VIEWPOINTS ≠ VERIFICATION", "SOURCE DISCLOSURE"],
        sources: [
          { type: "Independent Commentary", label: "Magne AI Raises $2.64M to Bridge Edge AI Hardware and On-Chain Agent Payments", url: "https://recodex.pro/magne-ai-raises-2-64m-to-bridge-edge-ai-hardware-and-on-chain-agent-payments/", publisher: "RecodeX Pro", note: "外部分析文章；個別陳述仍需回到一手資料複查。" },
          { type: "Independent Commentary", label: "Magne AI: Edge Hardware and Agent Payments", url: "https://minia2a.uk/blog/magne-ai-edge-hardware-agent-payments-august-2026", publisher: "minia2a", note: "從 Agent API / 硬體端點視角評論；需揭露作者生態鄰近性。" }
        ]
      }
    ],
    videos: [
      { id: "ZMhyf6yImOc", title: "在 MAG1 上建立新錢包", date: "2026", duration: "SHORT", captions: "YouTube", source: "MAGNE.AI YouTube", relation: "WALLET", poster: officialAsset + "stories/wallet-create.jpg" },
      { id: "bcHC_FbMrog", title: "使用 NFC 卡完成恢復", date: "2026", duration: "SHORT", captions: "YouTube", source: "MAGNE.AI YouTube", relation: "RECOVERY", poster: officialAsset + "stories/nfc-recovery.jpg" },
      { id: "1k2nQIyhDsg", title: "連線錢包至 dApp", date: "2026", duration: "SHORT", captions: "YouTube", source: "MAGNE.AI YouTube", relation: "DAPP", poster: officialAsset + "stories/dapp-connect.jpg" },
      { id: "BZOy194iYA8", title: "隱藏 Private Space", date: "2026", duration: "SHORT", captions: "YouTube", source: "MAGNE.AI YouTube", relation: "PRIVACY", poster: officialAsset + "stories/private-space.jpg" }
    ],
    events: [
      { slug: "launch-night-mybw-2025", date: "2025.07.20", place: "KUALA LUMPUR", title: "MAGNE.AI Launch Night", note: "MYBW 2025 · 產品公開、現場展示與社群交流", article: "../article/launch-night-mybw-2025/", images: ["launch-night/01.webp", "launch-night/02.webp", "launch-night/03.webp", "launch-night/04.webp"] },
      { slug: "new-york-2025", date: "2025.08.24", place: "NEW YORK", title: "Intelligent Assets: AI Meets RWA", note: "主題分享、圓桌對談與公開交流", article: "", source: "https://x.com/Magne_Ai/status/1958353101184004426", assetBase: localEventAsset, images: numberedImages("new-york", 58) },
      { slug: "philadelphia-2026", date: "2026.01.22", place: "PHILADELPHIA", title: "University Engagement Tour", note: "Real-World Assets 校園分享與公開討論", article: "", source: "https://x.com/Magne_Ai/status/2013446389351735506", assetBase: localEventAsset, images: numberedImages("philadelphia", 11) },
      { slug: "webx-tokyo-2026", date: "2026.07", place: "TOKYO", title: "AI Agents Night · WebX Tokyo", note: "GAEA Ventures WebX 系列邊會 · 產品與生態展示", article: "", assetBase: localEventAsset, images: numberedImages("webx-tokyo", 12) }
    ],
    eventAssetBase: officialAsset + "stories/events/"
  };
})();
