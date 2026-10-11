/**
 * app-mode.js — remember that this browser session is the app.
 *
 * Capacitor loads your site with a query string you choose (e.g. https://example.com/?app=1).
 * The query disappears on the next navigation, so persist it once. Run this anywhere after load.
 */
(function () {
  try {
    if (location.search.indexOf("app=1") !== -1) localStorage.setItem("app_mode", "1");
  } catch (e) {}
})();
