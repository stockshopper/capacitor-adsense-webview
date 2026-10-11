package com.example.app;   // ← your package

import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.google.android.gms.ads.MobileAds;

/**
 * AdSense "WebView API for Ads" registration for a Capacitor app.
 *
 * Without this, every AdSense request made from inside the app's WebView is
 * flagged in Policy Center as "Ads in unapproved WebViews" and mobile CPC collapses.
 *
 * Pair with AndroidManifest.snippet.xml (INTEGRATION_MANAGER=webview) and
 * build.gradle.snippet (play-services-ads). Missing the manifest entry throws at startup.
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        if (webView == null) return;

        // Settings Google's docs require BEFORE registering the WebView.
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);

        // The actual registration. After this, the GMA SDK injects `window.gmaSdk`
        // into pages loaded in this WebView — that's the signal web/ads-gate.js looks for.
        MobileAds.registerWebView(webView);

        // Optional: an explicit marker the web can also read. Older app builds don't have it.
        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public boolean webviewAdsRegistered() { return true; }
        }, "NativeBridge");
    }
}
