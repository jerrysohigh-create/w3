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
        summary: "MAGNE.AI made its first public appearance in Kuala Lumpur, recording the starting point of the brand entering the public stage with product demonstrations, on-site communication and moving images.",
        cover: officialAsset + "stories/events/launch-night/01.webp",
        coverAlt: "MAGNE.AI Launch Night stage and live guests",
        href: "article/launch-night-mybw-2025/",
        facts: ["2025.07.20", "KUALA LUMPUR", "4 SELECTED IMAGES", "COMPANY ARCHIVE"],
        sources: [
          { label: "Event preview", url: "https://x.com/Magne_Ai/status/1942974147304534357", publisher: "MAGNE.AI X" },
          { label: "Co-organizers and supporters", url: "https://x.com/Magne_Ai/status/1945432873345094128", publisher: "MAGNE.AI X" },
          { label: "Full Agenda", url: "https://x.com/Magne_Ai/status/1946073548201824309", publisher: "MAGNE.AI X" },
          { label: "Review after the meeting", url: "https://x.com/Magne_Ai/status/1947331133571830200", publisher: "MAGNE.AI X" },
          { label: "Co-sponsor confirmation", url: "https://x.com/BeckerVentures/status/1947335120589131957", publisher: "Becker Ventures X" },
          { label: "Official video review", url: "https://x.com/Magne_Ai/status/1948226297483919778", publisher: "MAGNE.AI X" },
          { label: "MAGNE.AI image file", url: "https://www.magne.ai/en/stories.html#launch-night-2025", publisher: "MAGNE.AI" }
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
        title: "MAG1 Summary of Global Compliance and Certification Milestones",
        summary: "Combine the disclosure status of GMS, Widevine L1, GSMA TAC, FCC, CB, UN38.3, CP65 and CE into the same evidence index.",
        cover: officialAsset + "webx-tokyo.webp",
        coverAlt: "MAGNE.AI Phone Gen1 public event screen",
        href: "trust.html",
        facts: ["08 PUBLIC SIGNALS", "FCC PUBLIC", "GSMA TAC OBTAINED", "NDA FILES EXCLUDED"],
        sources: [
          { label: "Web2 Basic Data Room", url: "https://jerrysohigh-create.github.io/DR/tc/web2-foundation.html", publisher: "MAGNE.AI DD" },
          { label: "MAGNE.AI Product and Certification Overview", url: "https://www.magne.ai/en/compliance.html", publisher: "MAGNE.AI" }
        ]
      },
      {
        slug: "season-1-onchain-record",
        status: "published",
        featured: true,
        date: "2026-07-06",
        category: "ECOSYSTEM",
        sourceType: "Company Release",
        title: "Phone Gen1 Lottery Season 1 On-chain participation record",
        summary: "Season 1 archive records 76,650 independent participating wallet addresses and 100,407 derivative participation records; USDT interactions are only expressed in public Dashboard verified fields.",
        cover: localDataAsset + "season-1-wallet-growth.svg",
        coverAlt: "Season 1 Cumulative growth chart of participating wallet addresses, reaching 76,650 addresses from April 17 to July 6, 2026",
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
        title: "MAGNE L1 and M Hash L2 open development resources",
        summary: "Public code, RPC, browsers and development documents are organized into checkable developer portals; testnet status is not equivalent to mainnet commitment.",
        cover: localDataAsset + "magne-l1-mhash-l2-developer-surface.svg",
        coverAlt: "MAGNE L1 and M Hash L2 test network public development resource relationship diagram",
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
        title: "MAGNE.AI discloses US$10 million in strategic financing",
        summary: "The company channels disclosed US$10 million in strategic financing; the Bitcoin.com page is clearly treated as Sponsored / Syndicated, and the Architect Partners quarterly report is only used as an external data cross-check.",
        cover: localFundingAsset + "strategic-financing-10m.png",
        coverAlt: "MAGNE.AI officially released pictures announcing the completion of US$10 million in strategic financing",
        href: "article/strategic-financing-10m/",
        facts: ["US$10M DISCLOSED", "01 EVENT RECORD", "08 PUBLIC SOURCES", "NO INDEPENDENT ENDORSEMENT"],
        sources: [
          { type: "Company Release", label: "MAGNE.AI Financing Statement", url: "https://www.linkedin.com/posts/magne-ai_magneai-raises-10m-strategic-financing-activity-7365230156128415745-fwey", publisher: "MAGNE.AI LinkedIn", note: "First-party sources for financing statements." },
          { type: "Sponsored / Syndicated", label: "Financing Press Release Distribution Page", url: "https://news.bitcoin.com/magne-ai-raises-10m-strategic-financing-to-accelerate-ai-web3-native-smartphone-and-dual-chain-ecosystem/", publisher: "Bitcoin.com", note: "Treated as a press release/sponsored distribution and not an endorsement by independent media." },
          { type: "Data / Registry Reference", label: "Q3 2025 Crypto M&A and Financing Report", url: "https://architectpartners.com/wp-content/uploads/2025/10/Q3-2025-Crypto-MA-and-Financing-Report.pdf", publisher: "Architect Partners", note: "Quarterly funding data reporting for external cross-checking." },
          { type: "Reference Only", label: "Financing News Briefing", url: "https://www.panewslab.com/en/articles/6a32c509-08c9-4364-8587-21a6b6e07220", publisher: "PANews", note: "The manuscript is explicitly based on official sources." },
          { type: "Reference Only", label: "Financing News", url: "https://www.odaily.news/newsflash/445296", publisher: "Odaily", note: "Reprint/news layer, only for reference of event time and propagation path." },
          { type: "Reference Only", label: "Financing News", url: "https://www.techflowpost.com/en-US/newsletter/96534", publisher: "TechFlow", note: "Reprint/express layer, without adding independent confirmation." },
          { type: "Reference Only", label: "Financing Briefing (Japanese)", url: "https://www.chaincatcher.com/ja/article/2200682", publisher: "ChainCatcher", note: "Reprint/briefing layer." },
          { type: "Reference Only", label: "Crypto VC financing roundup", url: "https://www.gfmreview.com/crypto/crypto-vc-funding-rain-raises-58m-orangex-secures-20m", publisher: "GFM Review", note: "Financing weekly report entry for subordinate cross-checking." }
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
        title: "MAGNE.AI releases company draft for follow-up financing of US$2.64 million",
        summary: "MAGNE.AI disclosed US$2.64M in follow-up strategic financing through Chainwire's press release; US$12.64M is the company's cumulative public financing and is not an independent audit conclusion.",
        cover: localFundingAsset + "additional-financing-264m.png",
        coverAlt: "MAGNE.AI announces the official release image of US$2.64 million in follow-up strategic financing",
        href: "article/follow-on-financing-264m/",
        facts: ["US$2.64M DISCLOSED", "US$12.64M COMPANY TOTAL", "01 PRIMARY RELEASE", "03 REFERENCE SOURCES"],
        sources: [
          { type: "Company Release", label: "Strategic funding company release", url: "https://chainwire.org/2026/08/05/magne-ai-secures-2-64m-strategic-funding-for-edge-ai-agentic-payments-on-chain-infrastructure/", publisher: "Chainwire", note: "The main public page for company press releases." },
          { type: "Reference Only", label: "Funding record", url: "https://cryptorank.io/news/feed/magne-ai-strategic-2026-07-22", publisher: "CryptoRank", note: "Financing database/news aggregation reference." },
          { type: "Reference Only", label: "Funding news take", url: "https://ffnews.com/news/magneai-secures-264m-strategic-funding-to-revolutionize-edge-ai-and-agentic-payments", publisher: "FFNews", note: "The content relies on the company's draft and does not serve as independent financing confirmation." },
          { type: "Reference Only", label: "Weekly financing roundup", url: "https://www.panewslab.com/zh-hant/articles/019fe989-157c-771e-bc3a-e5fd4451ef53", publisher: "PANews", note: "Weekly financing summary for subordinate cross-checking." }
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
        title: "External Review Index: Edge AI, Hardware Endpoints, and Agent Payments",
        summary: "Currently identifies only 2 articles that can be clearly classified as Independent Commentary; they provide opinions and do not constitute independent hardware reviews, performance testing, or financing confirmations.",
        cover: localDataAsset + "external-commentary-index.svg",
        coverAlt: "W3 External review source index map, indicating two independent reviews and zero independent hardware reviews",
        href: "article/external-commentary-index/",
        facts: ["02 COMMENTARY", "00 HARDWARE REVIEWS", "VIEWPOINTS ≠ VERIFICATION", "SOURCE DISCLOSURE"],
        sources: [
          { type: "Independent Commentary", label: "Magne AI Raises $2.64M to Bridge Edge AI Hardware and On-Chain Agent Payments", url: "https://recodex.pro/magne-ai-raises-2-64m-to-bridge-edge-ai-hardware-and-on-chain-agent-payments/", publisher: "RecodeX Pro", note: "External analysis article; individual statements still need to be reviewed with primary sources." },
          { type: "Independent Commentary", label: "Magne AI: Edge Hardware and Agent Payments", url: "https://minia2a.uk/blog/magne-ai-edge-hardware-agent-payments-august-2026", publisher: "minia2a", note: "Comments from an Agent API/hardware endpoint perspective; author ecological proximity needs to be disclosed." }
        ]
      }
    ],
    videos: [
      { id: "ZMhyf6yImOc", title: "Create a new wallet on MAG1", date: "2026", duration: "SHORT", captions: "YouTube", source: "MAGNE.AI YouTube", relation: "WALLET", poster: officialAsset + "stories/wallet-create.jpg" },
      { id: "bcHC_FbMrog", title: "Complete recovery using NFC card", date: "2026", duration: "SHORT", captions: "YouTube", source: "MAGNE.AI YouTube", relation: "RECOVERY", poster: officialAsset + "stories/nfc-recovery.jpg" },
      { id: "1k2nQIyhDsg", title: "Connect wallet to dApp", date: "2026", duration: "SHORT", captions: "YouTube", source: "MAGNE.AI YouTube", relation: "DAPP", poster: officialAsset + "stories/dapp-connect.jpg" },
      { id: "BZOy194iYA8", title: "Hide Private Space", date: "2026", duration: "SHORT", captions: "YouTube", source: "MAGNE.AI YouTube", relation: "PRIVACY", poster: officialAsset + "stories/private-space.jpg" }
    ],
    events: [
      { slug: "launch-night-mybw-2025", date: "2025.07.20", place: "KUALA LUMPUR", title: "MAGNE.AI Launch Night", note: "MYBW 2025 · Product disclosure, on-site demonstration and community communication", article: "../article/launch-night-mybw-2025/", images: ["launch-night/01.webp", "launch-night/02.webp", "launch-night/03.webp", "launch-night/04.webp"] },
      { slug: "new-york-2025", date: "2025.08.24", place: "NEW YORK", title: "Intelligent Assets: AI Meets RWA", note: "Theme sharing, roundtable dialogue and open communication", article: "", source: "https://x.com/Magne_Ai/status/1958353101184004426", assetBase: localEventAsset, images: numberedImages("new-york", 58) },
      { slug: "philadelphia-2026", date: "2026.01.22", place: "PHILADELPHIA", title: "University Engagement Tour", note: "Real-World Assets campus sharing and public discussion", article: "", source: "https://x.com/Magne_Ai/status/2013446389351735506", assetBase: localEventAsset, images: numberedImages("philadelphia", 11) },
      { slug: "webx-tokyo-2026", date: "2026.07", place: "TOKYO", title: "AI Agents Night · WebX Tokyo", note: "GAEA Ventures WebX Series Side Event · Product and Ecosystem Display", article: "", assetBase: localEventAsset, images: numberedImages("webx-tokyo", 12) }
    ],
    eventAssetBase: officialAsset + "stories/events/"
  };
})();
