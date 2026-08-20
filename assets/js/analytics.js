(function () {
  "use strict";

  var measurementId = "G-NGKT224G39";
  var storageKey = "w3_analytics_consent";

  function loadAnalytics() {
    if (window.__w3AnalyticsLoaded) return;
    window.__w3AnalyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
    document.head.appendChild(script);
  }

  function remember(value) {
    try { localStorage.setItem(storageKey, value); } catch (error) { /* Storage can be unavailable in private contexts. */ }
  }

  function storedChoice() {
    try { return localStorage.getItem(storageKey); } catch (error) { return null; }
  }

  function showConsent() {
    if (document.querySelector(".analytics-consent")) return;
    var panel = document.createElement("aside");
    panel.className = "analytics-consent";
    panel.setAttribute("aria-label", "Analytics consent");
    panel.innerHTML = '<strong>PRIVACY / OPTIONAL ANALYTICS</strong><p>W3 loads GA4 only after consent to measure page visits and internal journeys. Declining does not affect site functions. See the <a href="' + (document.body.dataset.root || "") + 'privacy-policy.html">Privacy Policy</a>.</p><div class="analytics-consent__actions"><button type="button" data-analytics-accept>ALLOW ANALYTICS</button><button type="button" data-analytics-reject>CONTINUE WITHOUT</button></div>';
    panel.querySelector("[data-analytics-accept]").addEventListener("click", function () {
      remember("granted");
      panel.remove();
      loadAnalytics();
    });
    panel.querySelector("[data-analytics-reject]").addEventListener("click", function () {
      remember("denied");
      panel.remove();
    });
    document.body.appendChild(panel);
  }

  function start() {
    var choice = storedChoice();
    if (choice === "granted") loadAnalytics();
    else if (choice !== "denied") showConsent();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
