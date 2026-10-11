# Rollout order (what to do in which order, and why)

The trap: the fix is in the *app*, but the policy violation is counted on the *website*.
Users who don't update keep generating unapproved requests for weeks, and Policy Center
keeps counting them against your site. So you need two things, not one.

## Day 0: ship both sides together

1. **App builds** with the WebView registered (`android/`, `ios/`).
   Verify on an emulator/simulator with Google's test page:
   `https://google.github.io/webview-ads/test` → should say "WebView connected to GMA SDK".
2. **Website** with `web/ads-gate.js` in `<head>` before `adsbygoogle.js`, plus
   `web/ads-gate.css` and the `ad-slot` class on your ad wrappers.
   Deploy this *before* the app builds go live — it does nothing on registered builds,
   and immediately stops violations from old builds.

## While the stores review (1 day Android, 1-3 days iOS)

- Old app builds: no ad requests at all (the gate). Yes, this costs the app's ad revenue
  for a few days. The alternative is more violations and a longer restriction.
- Optional: show an "update the app" banner only on old builds (`isOldAppBuild()` in
  `web/appWebview.ts`). Ours remembers "later" for 24 hours.
- Check that nothing else broke on old builds: login, push, deep links. The gate only
  touches AdSense.

## When both stores are live

- Open **Policy Center** → the "Ads in unapproved WebViews" rows → **Request review**.
  Do this only after *both* platforms are live; a review requested while an unregistered
  build is still the only one available will just fail.
- Rows show "ad requests, last 7 days". Expect the number to fall day by day as old
  requests age out of the window and old builds update. Rows disappear when they hit 0.

## What to measure

In AdSense reports, split by **Platform** (`PLATFORM_TYPE_NAME` in the API):

| Metric | Before | During | What recovery looks like |
|---|---|---|---|
| Mobile CPC | normal | a small fraction of normal | back toward normal within days of approval |
| Mobile clicks | normal | often *higher* | ads still serve, just cheap ones |
| Desktop | unchanged | unchanged | unchanged |

The restriction is on the *inventory* ("ad serving limited"), not on your account.
Impressions and clicks keep flowing; only the price collapses. Don't be fooled by the
click count.

## Checklist

- [ ] Android: `registerWebView` + `INTEGRATION_MANAGER` + `play-services-ads`
- [ ] iOS: `MobileAds.shared.register` + `GADIntegrationManager` + SPM package, in the file
      that is actually in the target
- [ ] Both verified on Google's test page
- [ ] Web: `ads-gate.js` inline in `<head>` before `adsbygoogle.js`
- [ ] Web: `ad-slot` class on every ad wrapper, `ads-gate.css` included
- [ ] Web: app persists `app_mode` (`web/app-mode.js`)
- [ ] Both app builds live in the stores
- [ ] Policy Center → Request review
- [ ] Watch mobile CPC by platform for 1-2 weeks
