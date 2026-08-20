(function () {
  "use strict";

  var measurementId = "G-NGKT224G39";
  var storageKey = "w3_consent_preferences_v2";
  var legacyStorageKey = "w3_analytics_consent";
  var preferenceLifetime = 180 * 24 * 60 * 60 * 1000;
  var root = document.body ? (document.body.dataset.root || "") : "";

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    functionality_storage: "granted",
    security_storage: "granted",
    personalization_storage: "denied",
    wait_for_update: 500
  });
  window.gtag("set", "ads_data_redaction", true);

  function isProductionHost() { return location.hostname === "w3.magne.ai"; }
  function updateConsent(granted) {
    window.gtag("consent", "update", {
      analytics_storage: granted ? "granted" : "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
  }
  function loadAnalytics() {
    if (window.__w3AnalyticsLoaded || !isProductionHost()) return;
    window.__w3AnalyticsLoaded = true;
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_domain: "auto"
    });
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
    document.head.appendChild(script);
  }
  function clearAnalyticsCookies() {
    document.cookie.split(";").forEach(function (item) {
      var name = item.split("=")[0].trim();
      if (!/^_ga(?:_|$)/.test(name)) return;
      var expiry = "=; Max-Age=0; path=/; SameSite=Lax";
      document.cookie = name + expiry;
      document.cookie = name + expiry + "; domain=.magne.ai";
      document.cookie = name + expiry + "; domain=" + location.hostname;
    });
  }
  function readPreference() {
    try {
      var saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved && saved.version === 2 && Date.now() - saved.savedAt < preferenceLifetime) return saved;
      var legacy = localStorage.getItem(legacyStorageKey);
      if (legacy === "granted" || legacy === "denied") {
        var migrated = { version: 2, analytics: legacy === "granted", savedAt: Date.now() };
        localStorage.setItem(storageKey, JSON.stringify(migrated));
        localStorage.removeItem(legacyStorageKey);
        return migrated;
      }
    } catch (error) { /* Storage can be unavailable in private contexts. */ }
    return null;
  }
  function savePreference(analytics) {
    var preference = { version: 2, analytics: Boolean(analytics), savedAt: Date.now() };
    try {
      localStorage.setItem(storageKey, JSON.stringify(preference));
      localStorage.removeItem(legacyStorageKey);
    } catch (error) { /* Storage can be unavailable in private contexts. */ }
    updateConsent(preference.analytics);
    if (preference.analytics) loadAnalytics(); else clearAnalyticsCookies();
    return preference;
  }
  function closeConsentUi() {
    var banner = document.querySelector(".analytics-consent");
    var manager = document.querySelector(".consent-manager");
    if (banner) banner.remove();
    if (manager) manager.remove();
    document.documentElement.classList.remove("consent-manager-open");
  }
  function showPreferences() {
    var existing = document.querySelector(".consent-manager");
    if (existing) { existing.querySelector("[data-consent-analytics]").focus(); return; }
    var current = readPreference();
    var manager = document.createElement("div");
    manager.className = "consent-manager";
    manager.innerHTML = '<section class="consent-manager__panel" role="dialog" aria-modal="true" aria-labelledby="consent-title"><div class="consent-manager__header"><div><span>PRIVACY CONTROL / W3</span><h2 id="consent-title">COOKIE PREFERENCES</h2></div><button type="button" class="consent-manager__close" data-consent-close aria-label="Close cookie preferences">×</button></div><p class="consent-manager__intro">Necessary storage keeps your privacy choice. Optional analytics helps us understand page visits and journeys only after you allow it.</p><div class="consent-manager__rows"><label><span><strong>NECESSARY</strong><small>Consent record and essential site operation. Always active.</small></span><input type="checkbox" checked disabled aria-label="Necessary storage always active"></label><label><span><strong>ANALYTICS</strong><small>Google Analytics 4 · G-NGKT224G39. No advertising personalization.</small></span><input type="checkbox" data-consent-analytics aria-label="Allow analytics storage"></label></div><p class="consent-manager__links"><a href="' + root + 'cookie-policy.html">Cookie Policy</a><a href="' + root + 'privacy-policy.html">Privacy Policy</a></p><div class="consent-manager__actions"><button type="button" data-consent-save>SAVE PREFERENCES</button><button type="button" class="primary" data-consent-accept>ACCEPT ALL</button></div></section>';
    document.body.appendChild(manager);
    document.documentElement.classList.add("consent-manager-open");
    var analyticsToggle = manager.querySelector("[data-consent-analytics]");
    analyticsToggle.checked = Boolean(current && current.analytics);
    manager.querySelector("[data-consent-close]").addEventListener("click", function () { manager.remove(); document.documentElement.classList.remove("consent-manager-open"); });
    manager.querySelector("[data-consent-save]").addEventListener("click", function () { savePreference(analyticsToggle.checked); closeConsentUi(); });
    manager.querySelector("[data-consent-accept]").addEventListener("click", function () { savePreference(true); closeConsentUi(); });
    manager.addEventListener("click", function (event) { if (event.target === manager && readPreference()) closeConsentUi(); });
    manager.addEventListener("keydown", function (event) { if (event.key === "Escape" && readPreference()) closeConsentUi(); });
    analyticsToggle.focus();
  }
  function showConsent() {
    if (document.querySelector(".analytics-consent")) return;
    var panel = document.createElement("aside");
    panel.className = "analytics-consent";
    panel.setAttribute("aria-label", "Cookie choices");
    panel.innerHTML = '<span class="analytics-consent__index">PRIVACY / 01</span><strong>YOU CONTROL OPTIONAL COOKIES.</strong><p>Necessary storage keeps the site working and remembers your choice. GA4 analytics stays off until you allow it. Refusing optional cookies does not affect browsing.</p><p class="analytics-consent__links"><a href="' + root + 'cookie-policy.html">Cookie Policy</a><a href="' + root + 'privacy-policy.html">Privacy Policy</a></p><div class="analytics-consent__actions"><button type="button" data-consent-accept>ACCEPT ALL</button><button type="button" data-consent-necessary>NECESSARY ONLY</button><button type="button" data-consent-manage>MANAGE PREFERENCES</button></div>';
    panel.querySelector("[data-consent-accept]").addEventListener("click", function () { savePreference(true); closeConsentUi(); });
    panel.querySelector("[data-consent-necessary]").addEventListener("click", function () { savePreference(false); closeConsentUi(); });
    panel.querySelector("[data-consent-manage]").addEventListener("click", showPreferences);
    document.body.appendChild(panel);
  }
  function start() {
    var current = readPreference();
    if (current) { updateConsent(current.analytics); if (current.analytics) loadAnalytics(); } else showConsent();
    document.addEventListener("click", function (event) {
      var trigger = event.target.closest("[data-cookie-settings]");
      if (!trigger) return;
      event.preventDefault();
      showPreferences();
    });
  }
  window.W3Consent = { openPreferences: showPreferences, getPreference: readPreference };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true }); else start();
})();
