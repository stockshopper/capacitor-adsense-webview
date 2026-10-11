/**
 * appWebview.ts — the same rules as ads-gate.js, as a module (React / Next.js / Vue ...).
 *
 * Keep the two in sync: ads-gate.js must be inline in <head> (it has to run before adsbygoogle.js,
 * so it can't be a module), and this file is for everything that runs later — e.g. an
 * "please update the app" banner shown only on unregistered (old) app builds.
 */

const OTHER_INAPP = /NAVER|KAKAOTALK|KAKAOSTORY|DaumApps|FBAN|FBAV|Instagram|Line\/|Whale|SamsungBrowser|everytimeApp|BAND\//i;

/** True only inside YOUR app's WebView (not a browser that opened a shared ?app=1 link). */
export function isOurAppWebView(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const app = localStorage.getItem("app_mode") === "1" || window.location.search.indexOf("app=1") !== -1;
    if (!app) return false;
    const ua = navigator.userAgent;
    if (OTHER_INAPP.test(ua)) return false;
    const android = /Android/i.test(ua) && /; wv\)/.test(ua);
    const ios = (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) && !/Safari\//.test(ua);
    return android || ios;
  } catch {
    return false;
  }
}

/** True when this WebView is registered with the Google Mobile Ads SDK (new app build). */
export function isAdsRegisteredWebView(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const w = window as unknown as {
      gmaSdk?: { getQueryInfo?: unknown };
      webkit?: { messageHandlers?: Record<string, unknown> };
      NativeBridge?: { webviewAdsRegistered?: unknown };
    };
    if (w.gmaSdk && typeof w.gmaSdk.getQueryInfo === "function") return true;
    const mh = w.webkit?.messageHandlers;
    if (mh && (mh.getGmaQueryInfo || mh.getGmaSig)) return true;
    if (w.NativeBridge && typeof w.NativeBridge.webviewAdsRegistered === "function") return true;
    return localStorage.getItem("ads_gate_registered") === "1";
  } catch {
    return false;
  }
}

/** Old app build = inside our WebView but not registered. Show your "update the app" prompt here. */
export function isOldAppBuild(): boolean {
  return isOurAppWebView() && !isAdsRegisteredWebView();
}
