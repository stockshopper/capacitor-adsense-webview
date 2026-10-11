# Pitfalls we actually hit

Everything here cost us real time. Read before you ship.

## 1. iOS: you may be editing a file that isn't compiled

Capacitor iOS projects can end up with two files of the same name:

```
ios/App/MainViewController.swift        ← in the Xcode target (compiled)
ios/App/App/MainViewController.swift    ← leftover copy, NOT in the target
```

We registered the WebView in the second one, archived, submitted — and nothing changed.
Check which file is really in the target: open the `.d` dependency files under
`DerivedData/.../Objects-normal/arm64/` or simply select the file in Xcode and look at
**Target Membership** in the File Inspector.

## 2. iOS: a `WKUserScript` marker never reached the page

Our first plan was to inject `window.__appAdsRegistered = true` with a `WKUserScript` in
`webViewConfiguration(for:)`. It never showed up in the page: Capacitor swaps parts of the
configuration after that hook, and the script was gone.

Fix: don't rely on your own marker. Use the signals the GMA SDK injects itself:

| Platform | Signal |
|---|---|
| Android | `window.gmaSdk.getQueryInfo` (function) |
| iOS | `webkit.messageHandlers.getGmaQueryInfo` or `getGmaSig` |

These are what Google's own test page (`google.github.io/webview-ads/test`) checks.
`web/ads-gate.js` looks at them first; your own marker is only a fallback.

## 3. A shared link opened in a real browser looked like "the app"

We detected "inside the app" by a `?app=1` query the app adds on load and persists in
`localStorage`. But users share links *from* the app, and those links carry `?app=1`.
Open one in Chrome on a phone and that browser now thinks it is the app — and the gate
turned ads off for a normal browser user.

Fix: also require the UA to be a WebView:

- Android WebView UA contains `; wv)`
- iOS WKWebView UA does **not** contain `Safari/` (Safari and Chrome on iOS both do)
- iPad in "Request Desktop Website" mode reports `Macintosh` — catch it with
  `navigator.maxTouchPoints > 1`

## 4. In-app browsers of other apps are not your WebView

Naver, KakaoTalk, Instagram, Facebook, LINE, Samsung Internet... all open your site in
their own WebView. They have their own names in the UA; exclude them, otherwise the gate
turns your ads off for all that traffic.

## 5. The native bridge can attach late on the first screen

On the very first page after app launch, `gmaSdk` / `messageHandlers` may not exist yet
when an inline `<head>` script runs. If you gate strictly, the first screen of a *new* app
build shows no ads.

Fix: re-check at 1.5s and 4s, resume (`pauseAdRequests = 0`), dispatch an event so ad
components re-measure, and remember the result in `localStorage` so every later page is
certain from the start.

## 6. Hidden `<ins>` elements steal `push()` calls

If you hide an ad container with CSS but still render `<ins class="adsbygoogle">`, the
next `adsbygoogle.push({})` can be consumed by the hidden slot and a visible one stays
empty. Only render `<ins>` when the container has a non-empty `getClientRects()`.

## 7. `pauseAdRequests` must be set before `adsbygoogle.js` loads

That is why `ads-gate.js` is inline in `<head>` and not a module. It also covers Auto ads
and vignettes, which a per-slot approach misses.

## 8. The manifest meta-data is not optional

`MobileAds.registerWebView()` without
`com.google.android.gms.ads.INTEGRATION_MANAGER = webview` in the manifest throws at
startup. Both or neither.
