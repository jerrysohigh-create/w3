(function () {
  "use strict";

  var language = document.body.dataset.lang === "zh-Hant" ? "zh-Hant" : "en";
  var peer = document.body.dataset.localePeer;
  if (!peer) return;

  var control = document.createElement("a");
  control.className = "locale-control";
  control.href = peer;
  control.hreflang = language === "en" ? "zh-Hant" : "en";
  control.lang = language === "en" ? "zh-Hant" : "en";
  control.textContent = language === "en" ? "繁中" : "EN";
  control.setAttribute("aria-label", language === "en" ? "Switch to Traditional Chinese" : "Switch to English");

  var status = document.querySelector(".status-meta");
  var homeMenu = document.querySelector(".home-menu-toggle");
  var homeActions = document.querySelector(".nav-actions");
  if (status) status.insertBefore(control, status.firstChild);
  else if (homeMenu) homeMenu.parentNode.insertBefore(control, homeMenu);
  else if (homeActions) homeActions.insertBefore(control, homeActions.firstChild);
  else document.body.appendChild(control);
})();
