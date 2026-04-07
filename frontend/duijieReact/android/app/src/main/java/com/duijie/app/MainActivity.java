package com.duijie.app;

import androidx.activity.OnBackPressedCallback;
import androidx.core.view.WindowCompat;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.view.KeyEvent;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);

        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.setFitsSystemWindows(true);
            WebSettings settings = webView.getSettings();
            settings.setDomStorageEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setSupportZoom(false);
            settings.setBuiltInZoomControls(false);
            settings.setDisplayZoomControls(false);
            settings.setUseWideViewPort(true);
            settings.setLoadWithOverviewMode(true);
            settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
            webView.clearCache(true);
            webView.setOverScrollMode(WebView.OVER_SCROLL_ALWAYS);
            webView.setVerticalScrollBarEnabled(true);
            webView.setHorizontalScrollBarEnabled(false);
        }

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView activeWebView = getBridge().getWebView();
                if (activeWebView != null && activeWebView.canGoBack()) {
                    activeWebView.goBack();
                    return;
                }
                finish();
            }
        });
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        WebView webView = getBridge().getWebView();
        if (keyCode == KeyEvent.KEYCODE_BACK && webView != null && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
