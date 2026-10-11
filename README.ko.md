# capacitor-adsense-webview

**애드센스 정책 센터의 "승인되지 않은 WebView의 광고"를 Capacitor 앱에서 해결하는 방법: 안드로이드 + iOS 등록, 그리고 아직 업데이트 안 한 사용자를 위한 안전한 배포 순서.**

[English README](./README.md)

![웹 판별 스크립트가 애드센스를 켤지 멈출지 정하는 흐름](assets/flow.svg)

Capacitor(또는 어떤 WebView 앱이든)로 자기 사이트를 띄우고, 그 사이트에 애드센스가 붙어 있다면: 앱 안에서 나가는 광고 요청은 전부 **승인되지 않은 WebView 요청**입니다. WebView 를 Google Mobile Ads SDK 에 등록하지 않는 한 그렇습니다. 구글이 이걸 강하게 적용하기 시작했습니다. 정책 센터에 위반이 쌓이고, 광고는 계속 나오는데 모바일 클릭당 단가만 무너집니다.

이 저장소는 [ETF쇼핑](https://etfshopping.com)(한국·일본 ETF 정보 사이트, 양 스토어에 Capacitor 앱 운영)에서 실제로 쓰는 해결책 전체입니다. 구글 문서에 없는 부분까지 담았습니다: 업데이트 안 한 사용자를 위한 웹 쪽 차단, WebView 가 등록됐는지 실제로 알려 주는 신호, 그리고 우리가 빠졌던 함정들.

## 걸렸을 때 보이는 모습

장애도 오류도 없습니다. 그래서 위험합니다:

| 신호 | 보이는 것 |
|---|---|
| 정책 센터 | 주소들이 "승인되지 않은 WebView의 광고"로 올라오고 상태는 "광고 게재 제한됨" |
| 광고 요청·노출 | 거의 그대로 |
| 모바일 클릭 | 그대로이거나 오히려 늘어남 |
| 모바일 클릭당 단가 | 크게 떨어짐, 평소의 일부 수준까지 |
| PC | 영향 없음 |

광고는 계속 나갑니다. 제한된 지면에는 싼 광고만 입찰할 수 있을 뿐입니다. 노출이나 클릭만 보면 알아채지 못합니다. 애드센스 보고서를 **플랫폼**별로 나누고 모바일 클릭당 단가를 보세요.

**내 숫자 확인법:** 애드센스 → 보고서 → 플랫폼별 → 정책 센터에 처음 올라온 날 앞뒤 한 주의 모바일 클릭당 단가 비교.

## 세 부분으로 된 해결책

### 1. 안드로이드: WebView 등록

[`android/MainActivity.java`](android/MainActivity.java) · [`android/AndroidManifest.snippet.xml`](android/AndroidManifest.snippet.xml) · [`android/build.gradle.snippet`](android/build.gradle.snippet)

```java
CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
webView.getSettings().setJavaScriptEnabled(true);
webView.getSettings().setDomStorageEnabled(true);
webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
MobileAds.registerWebView(webView);
```

그리고 매니페스트에 `INTEGRATION_MANAGER = webview` (없으면 시작할 때 예외가 납니다).

### 2. iOS: WKWebView 등록

[`ios/MainViewController.swift`](ios/MainViewController.swift) · [`ios/Info.plist.snippet`](ios/Info.plist.snippet)

```swift
override open func capacitorDidLoad() {
    super.capacitorDidLoad()
    if let wv = webView { MobileAds.shared.register(wv) }
}
```

그리고 인라인 재생 설정과 Info.plist 의 `GADIntegrationManager = webview`.

둘 다 앱 안에서 구글 시험 페이지로 확인합니다: `https://google.github.io/webview-ads/test` → "WebView connected to GMA SDK".

### 3. 웹사이트: 옛 앱 빌드의 요청 멈추기

[`web/ads-gate.js`](web/ads-gate.js) (`<head>` 안에 인라인으로, `adsbygoogle.js` 보다 먼저) · [`web/ads-gate.css`](web/ads-gate.css) · [`web/app-mode.js`](web/app-mode.js) · [`web/appWebview.ts`](web/appWebview.ts)

새 앱을 올려도 위반은 멈추지 않습니다. 옛 빌드를 쓰는 사용자가 몇 주 동안 계속 승인되지 않은 요청을 만듭니다. 이 스크립트는 "우리 앱의 WebView 안인데 등록이 안 됨"을 알아내서 거기서만 애드센스를 멈춥니다:

```js
(window.adsbygoogle = window.adsbygoogle || []).pauseAdRequests = 1;
document.documentElement.classList.add("ads-gate-off");
```

"등록됨"은 GMA SDK 가 직접 심는 신호로 판별합니다. 안드로이드는 `window.gmaSdk.getQueryInfo`, iOS 는 `webkit.messageHandlers.getGmaQueryInfo` / `getGmaSig`. 그래서 사용자가 업데이트하는 순간 추가 배포 없이 광고가 돌아옵니다. 그 밖의 경우(일반 브라우저, 다른 앱의 인앱 브라우저)는 건드리지 않습니다.

## 배포 전에 꼭 읽을 것

- [docs/pitfalls.md](docs/pitfalls.md) — 실제로 우리를 물었던 여덟 가지 (컴파일되지 않는 Swift 파일을 고친 일, Capacitor 가 조용히 버리는 `WKUserScript` 표시, 앱처럼 보이는 공유 링크, 늦게 붙는 브릿지, `push()` 를 가로채는 숨은 `<ins>` ...)
- [docs/rollout.md](docs/rollout.md) — 작업 순서, 정책 재검토를 요청할 시점, 보고서에서 회복이 어떻게 보이는지

## 요구 사항

- Capacitor 6 이상 (우리는 8), 안드로이드 `play-services-ads` 24.x, iOS Google Mobile Ads SDK 12.x (Swift Package Manager)
- 플랫폼별 AdMob 앱 ID (무료, AdMob 광고를 안 내보내도 필요)
- 앱이 사이트를 표시 쿼리와 함께 열 것 (우리는 `?app=1`). 웹이 앱인지 알 수 있어야 합니다

## 다루지 않는 것

- Capacitor 없는 Cordova/Ionic: 네이티브 호출은 같고 훅만 다릅니다
- AdMob 네이티브 광고 단위: 이 저장소는 WebView 안의 애드센스 웹 광고만 다룹니다
- 동의(GDPR/UMP): 이 작업과 무관합니다. 하던 대로 유지하세요

## 만든 곳

[ETF쇼핑](https://etfshopping.com) · [ETFショッピング](https://ja.etfshopping.com) 에서 만들고 실제로 씁니다. 한국·일본 투자자를 위한 ETF·주식·배당 정보 사이트입니다. 쇼퍼스랩.

MIT License.
