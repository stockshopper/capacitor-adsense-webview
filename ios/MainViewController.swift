import UIKit
import WebKit
import Capacitor
import GoogleMobileAds   // Swift Package: https://github.com/googleads/swift-package-manager-google-mobile-ads (12.x)

/// AdSense "WebView API for Ads" registration for a Capacitor iOS app.
///
/// Set this class as the storyboard's initial view controller (customClass="MainViewController").
/// Pair with Info.plist.snippet (GADIntegrationManager=webview + GADApplicationIdentifier).
///
/// ⚠️ Check that THIS file is the one in the Xcode target. Capacitor projects can end up with two
///    files of the same name (ios/App/MainViewController.swift vs ios/App/App/MainViewController.swift);
///    editing the one that isn't compiled changes nothing. See docs/pitfalls.md.
class MainViewController: CAPBridgeViewController {

    // Google's docs require inline playback + autoplay to be configured before the WKWebView exists.
    override open func webViewConfiguration(for instanceConfiguration: InstanceConfiguration) -> WKWebViewConfiguration {
        let config = super.webViewConfiguration(for: instanceConfiguration)
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        return config
    }

    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        if let wv = webView {
            // After this, pages get `webkit.messageHandlers.getGmaQueryInfo` / `getGmaSig`
            // — the signal web/ads-gate.js looks for.
            MobileAds.shared.register(wv)
        }
    }
}
