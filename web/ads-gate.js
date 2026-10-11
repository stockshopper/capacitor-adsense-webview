/**
 * ads-gate.js — put this inline in <head>, BEFORE adsbygoogle.js.
 *
 * What it does:
 *   If the page is running inside YOUR app's WebView and that WebView is NOT registered with the
 *   Google Mobile Ads SDK (i.e. the user still has an old app build), it pauses all AdSense requests
 *   (`pauseAdRequests` — covers auto ads and vignettes too) and adds `html.ads-gate-off` so you can
 *   hide the ad containers with CSS. Everything else (normal browsers, in-app browsers of other apps,
 *   registered app builds) is untouched.
 *
 * Why not just ship the new app build and stop? Because users on the old build keep generating
 * "unapproved WebView" requests for weeks, and the policy violation keeps stacking up.
 *
 * How "registered" is detected (in order):
 *   1. Official signals the GMA SDK injects itself — the most reliable:
 *        Android: window.gmaSdk.getQueryInfo        iOS: webkit.messageHandlers.getGmaQueryInfo / getGmaSig
 *   2. Your own optional marker (NativeBridge.webviewAdsRegistered from android/MainActivity.java)
 *   3. A localStorage memo from a previous successful check (the native bridge can attach late on the
 *      very first page; the memo makes every later page certain).
 *
 * How "inside your app" is detected:
 *   - the app must mark itself: load the site with ?app=1 (and persist it, see web/app-mode.js), AND
 *   - the UA must look like an app WebView: Android "; wv)" or iOS without "Safari/" (Safari and Chrome
 *     on iOS both include "Safari/"). This second check matters: a link shared from the app carries
 *     ?app=1 and may be opened in the phone's real browser — that is NOT a WebView.
 *   - in-app browsers of other apps (Naver, Kakao, Instagram, Facebook, LINE, Samsung, ...) are excluded.
 *
 * Late signal: on the first screen the SDK bridge may not be attached yet when this runs. The gate
 * re-checks at 1.5s and 4s and, if the signal appears, resumes ads and dispatches "ads-gate-resumed"
 * so your ad components can re-measure (see web/AdBanner.snippet.tsx).
 */
(function () {
  try {
    var GATE = true; // set false to disable the gate without removing the script
    var d = document.documentElement;
    var app = localStorage.getItem("app_mode") === "1" || location.search.indexOf("app=1") !== -1;
    var ua = navigator.userAgent;
    if (!app) return;
    if (/NAVER|KAKAOTALK|KAKAOSTORY|DaumApps|FBAN|FBAV|Instagram|Line\/|Whale|SamsungBrowser|everytimeApp|BAND\//i.test(ua)) return;

    var inApp =
      (/Android/i.test(ua) && /; wv\)/.test(ua)) ||
      ((/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) && !/Safari\//.test(ua));
    if (!inApp) return;

    function registered() {
      var w = window;
      try {
        if (w.gmaSdk && typeof w.gmaSdk.getQueryInfo === "function") return true;
        var mh = w.webkit && w.webkit.messageHandlers;
        if (mh && (mh.getGmaQueryInfo || mh.getGmaSig)) return true;
        var nb = w.NativeBridge;
        if (nb && typeof nb.webviewAdsRegistered === "function") return true;
      } catch (e) {}
      return false;
    }

    var ok = registered();
    if (ok) {
      localStorage.setItem("ads_gate_registered", "1");
    } else if (localStorage.getItem("ads_gate_registered") === "1") {
      ok = true;
    }

    if (!ok && GATE) {
      (window.adsbygoogle = window.adsbygoogle || []).pauseAdRequests = 1;
      d.classList.add("ads-gate-off");
      [1500, 4000].forEach(function (t) {
        setTimeout(function () {
          if (d.classList.contains("ads-gate-off") && registered()) {
            localStorage.setItem("ads_gate_registered", "1");
            d.classList.remove("ads-gate-off");
            (window.adsbygoogle = window.adsbygoogle || []).pauseAdRequests = 0;
            window.dispatchEvent(new Event("ads-gate-resumed"));
          }
        }, t);
      });
    }
  } catch (e) {}
})();
