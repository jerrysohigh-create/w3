(function () {
  var page = document.body.dataset.page || "home";
  var root = document.body.dataset.root || "";
  var nav = [
    ["system", "SYSTEM", "system.html"],
    ["agentpay", "AGENTPAY", "agentpay.html"],
    ["ai-box", "AI BOX", "ai-box.html"],
    ["network", "NETWORK", "network.html"],
    ["developers", "BUILD", "developers.html"],
    ["seasons", "SEASONS", "seasons.html"],
    ["trust", "TRUST", "trust.html"],
    ["newsroom", "NEWS", "newsroom/"]
  ];
  var header = document.getElementById("site-header");
  if (header) {
    header.innerHTML =
      '<div class="statusbar"><div class="wrap"><span class="status-preview">W3 SYSTEM / PREVIEW</span><div class="status-meta"><a href="https://www.magne.ai/" target="_blank" rel="noopener noreferrer" aria-label="在新視窗開啟 MAGNE.AI 產品主站">MAGNE.AI ↗</a><a href="https://web3.magne.ai/" target="_blank" rel="noopener noreferrer" aria-label="在新視窗開啟 WEB3.MAGNE.AI 歷史白皮書">WHITEPAPER ↗</a><a class="status-s2 is-checking" data-s2-global-status href="' + root + 'season-2.html" aria-label="正在檢查 Season 2 資料狀態">S2: CHECKING</a><span id="site-clock">--:--:--</span></div></div></div>' +
      '<nav class="site-nav" aria-label="W3 主要導覽"><div class="wrap"><a class="brand" href="' + root + 'index.html" aria-label="W3 首頁"><span class="brand-mark">W</span><span>W3.MAGNE.AI</span><span class="brand-sub">// AGENT LAYER</span></a>' +
      '<ul class="primary-nav" id="primary-nav">' + nav.map(function (item, index) {
        return '<li><a href="' + root + item[2] + '"' + ((page === item[0] || (page === "terminal" && item[0] === "system")) ? ' aria-current="page"' : '') + '><span class="n">0' + (index + 1) + '</span>' + item[1] + '</a></li>';
      }).join("") + '</ul><a class="nav-action nav-action-live is-checking" data-s2-global-action href="https://payment.magne.ai/lottery" target="_blank" rel="noopener noreferrer">$ 參加 Season 2 ↗</a><button class="menu-toggle" type="button" aria-label="開啟或關閉主要導覽" aria-controls="primary-nav" aria-expanded="false">$ 選單</button></div></nav>';
  }

  var footer = document.getElementById("site-footer");
  if (footer) {
    footer.className = "site-footer";
    footer.innerHTML = '<div class="wrap"><div class="footer-grid"><div class="footer-brand"><a class="brand" href="' + root + 'index.html"><span class="brand-mark">W</span><span>W3.MAGNE.AI</span></a><p class="footer-note">AI Agent 的身份、策略、受控執行、支付與可驗證收據層。公開資訊與受控盡調資料在同一證據架構下分層呈現。</p><div class="footer-socials"><a href="https://x.com/Magne_Ai" target="_blank" rel="noopener noreferrer">X ↗</a><a href="https://t.me/MagneAI" target="_blank" rel="noopener noreferrer">TELEGRAM ↗</a><a href="https://github.com/magne-ai" target="_blank" rel="noopener noreferrer">GITHUB ↗</a></div></div><div class="footer-col"><h4>// 系統</h4><a href="' + root + 'system.html">控制平面</a><a href="' + root + 'agentpay.html">AgentPay</a><a href="' + root + 'terminal.html">沙盒</a></div><div class="footer-col"><h4>// 計畫</h4><a href="' + root + 'ai-box.html">AI Box</a><a href="' + root + 'seasons.html">活動季度</a><a href="' + root + 'newsroom/">新聞中心</a></div><div class="footer-col"><h4>// 證據</h4><a href="' + root + 'network.html">網路</a><a href="' + root + 'developers.html">開發者</a><a href="' + root + 'token.html">代幣披露</a><a href="' + root + 'trust.html">信任中心</a><a href="' + root + 'due-diligence.html">盡職調查</a></div><div class="footer-col footer-network"><h4>// MAGNE 網路</h4><a href="https://www.magne.ai/" target="_blank" rel="noopener noreferrer">MAGNE.AI 產品主站 ↗</a><a href="https://web3.magne.ai/" target="_blank" rel="noopener noreferrer">Web3 白皮書 · 封存 ↗</a><a class="footer-live-link" href="' + root + 'season-2.html">Season 2 資料</a><a href="https://payment.magne.ai/lottery" target="_blank" rel="noopener noreferrer">$ 參加 Season 2 ↗</a><a href="' + root + 'media-kit.html">媒體資料包</a><a href="' + root + 'magne-contact.html">聯絡我們</a><a href="' + root + 'privacy-policy.html">隱私權政策</a><a href="' + root + 'cookie-policy.html">Cookie 政策</a><button type="button" class="footer-cookie-settings" data-cookie-settings>Cookie 設定</button></div></div><div class="footer-bottom"><span>© 2026 MAGNE.AI · W3 SYSTEM</span><span>預覽環境 · 所有陳述均受來源約束</span></div></div>';
  }

  function tick() {
    var clock = document.getElementById("site-clock");
    if (clock) clock.textContent = new Date().toLocaleTimeString("en-GB", { hour12: false });
  }
  tick();
  setInterval(tick, 1000);

  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("primary-nav");
  function setMenu(open) {
    if (!toggle || !menu) return;
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "$ 關閉" : "$ 選單";
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () { setMenu(!menu.classList.contains("is-open")); });
    menu.addEventListener("click", function (event) { if (event.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (event) { if (event.key === "Escape") { setMenu(false); toggle.focus(); } });
  }

  var items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    items.forEach(function (el) { observer.observe(el); });
  }
})();
