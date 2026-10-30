package com.applehut.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.StatFs;
import android.provider.Settings;
import android.util.Base64;

import org.json.JSONObject;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends Activity {

    private static final String HOST = "applehut.local";
    private static final String START_URL = "https://" + HOST + "/index.html";
    private static final int REQ_FILE = 1001;
    private static final int REQ_SAVE = 1002;
    private static final int REQ_NOTIFICATIONS = 1003;

    static volatile boolean isForeground = false;

    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private String pendingName = "applehut-file";
    private String pendingMime = "application/octet-stream";
    private String pendingBase64 = "";

    /** 页面 JS 是否已就绪（onPageFinished 置 true） */
    private volatile boolean jsReady = false;

    /** 冷启动时先攒着，等 JS 就绪再投递 */
    private String pendingTapSession = null;
    private String pendingTapMessage = null;

    private static final Map<String, String> MIME = new HashMap<>();

    static {
        MIME.put("html", "text/html");
        MIME.put("htm", "text/html");
        MIME.put("js", "application/javascript");
        MIME.put("css", "text/css");
        MIME.put("json", "application/json");
        MIME.put("png", "image/png");
        MIME.put("jpg", "image/jpeg");
        MIME.put("jpeg", "image/jpeg");
        MIME.put("gif", "image/gif");
        MIME.put("webp", "image/webp");
        MIME.put("svg", "image/svg+xml");
        MIME.put("ico", "image/x-icon");
        MIME.put("woff", "font/woff");
        MIME.put("woff2", "font/woff2");
        MIME.put("ttf", "font/ttf");
        MIME.put("otf", "font/otf");
        MIME.put("mp3", "audio/mpeg");
        MIME.put("wav", "audio/wav");
        MIME.put("ogg", "audio/ogg");
        MIME.put("m4a", "audio/mp4");
        MIME.put("mp4", "video/mp4");
        MIME.put("webm", "video/webm");
        MIME.put("txt", "text/plain");
        MIME.put("xml", "application/xml");
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        NotificationChannels.ensureAll(this);

        Window window = getWindow();
        window.setStatusBarColor(0xFFF8F2E9);
        window.setNavigationBarColor(0xFFF8F2E9);
        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        int flags = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        if (Build.VERSION.SDK_INT >= 26) {
            flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        }
        window.getDecorView().setSystemUiVisibility(flags);

        webView = new WebView(this);
        webView.setBackgroundColor(0xFFFFF6E4);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setTextZoom(100);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        if (Build.VERSION.SDK_INT >= 29) {
            try {
                settings.setForceDark(WebSettings.FORCE_DARK_OFF);
            } catch (Throwable ignored) {
            }
        }
        if (Build.VERSION.SDK_INT >= 33) {
            try {
                settings.setAlgorithmicDarkeningAllowed(false);
            } catch (Throwable ignored) {
            }
        }

        webView.addJavascriptInterface(new NativeBridge(), "AppleHut");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (HOST.equals(uri.getHost())) {
                    return serveAsset(uri.getPath());
                }
                return null;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (HOST.equals(uri.getHost())) {
                    return false;
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (Throwable ignored) {
                }
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                jsReady = true;
                // 冷启动：JS 就绪后把攒着的通知点击事件投递下去
                flushPendingTap();
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (fileCallback != null) {
                    fileCallback.onReceiveValue(null);
                }
                fileCallback = callback;
                try {
                    Intent intent = params.createIntent();
                    startActivityForResult(intent, REQ_FILE);
                    return true;
                } catch (Throwable e) {
                    fileCallback = null;
                    return false;
                }
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.deny();
            }
        });

        webView.loadUrl(START_URL);

        // 冷启动：Activity 由通知点击拉起时，先把 extras 攒起来
        handleTapIntent(getIntent());
    }

    /* ==================== 通知点击精准跳转 ==================== */

    /**
     * 解析 Intent 里的 sessionId / messageId。
     * JS 未就绪时先存字段，等 onPageFinished 再投递。
     */
    private void handleTapIntent(Intent intent) {
        if (intent == null) return;
        try {
            String sid = intent.getStringExtra(PushHelper.EXTRA_SESSION_ID);
            String mid = intent.getStringExtra(PushHelper.EXTRA_MESSAGE_ID);
            boolean fromPush = intent.getBooleanExtra(PushHelper.EXTRA_FROM_PUSH, false);
            if (sid == null && !fromPush) return;
            pendingTapSession = sid;
            pendingTapMessage = mid;
            // 消费掉，避免旋转/重建时重复跳转
            intent.removeExtra(PushHelper.EXTRA_SESSION_ID);
            intent.removeExtra(PushHelper.EXTRA_MESSAGE_ID);
            flushPendingTap();
        } catch (Throwable ignored) {
        }
    }

    /**
     * 把攒着的点击事件投递给 WebView。
     * 优先用精准 payload；没有 sessionId 时退化为让 JS 读 localStorage 标记。
     */
    private void flushPendingTap() {
        if (!jsReady || webView == null) return;
        final String sid = pendingTapSession;
        final String mid = pendingTapMessage;
        if (sid == null && mid == null) return;
        pendingTapSession = null;
        pendingTapMessage = null;

        final String js;
        if (sid != null) {
            js = "(function(){try{var s=" + JSONObject.quote(sid)
                    + ";var m=" + (mid == null ? "null" : JSONObject.quote(mid))
                    + ";"
                    + "if(window.handleNotificationClick){window.handleNotificationClick(s,m);}"
                    + "else if(window.AHNativePushConsumeClick){window.AHNativePushConsumeClick();}"
                    + "}catch(e){}})();";
        } else {
            js = "(function(){try{"
                    + "if(window.handleNotificationClickFromStorage)"
                    + "window.handleNotificationClickFromStorage();"
                    + "}catch(e){}})();";
        }
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (webView != null) webView.evaluateJavascript(js, null);
                } catch (Throwable ignored) {
                }
            }
        });
    }

    /** singleTask 模式下，从通知再次进入会走这里（而不是 onCreate） */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleTapIntent(intent);
    }

    private WebResourceResponse serveAsset(String rawPath) {
        String path = rawPath == null ? "" : rawPath;
        if (path.length() == 0 || path.equals("/")) {
            path = "/index.html";
        }
        try {
            String assetPath = Uri.decode(path.substring(1));
            if (assetPath.contains("..")) {
                return error("403");
            }
            InputStream input = getAssets().open(assetPath);
            String ext = assetPath.contains(".")
                    ? assetPath.substring(assetPath.lastIndexOf('.') + 1).toLowerCase()
                    : "";
            String mime = MIME.containsKey(ext) ? MIME.get(ext) : "application/octet-stream";
            Map<String, String> headers = new HashMap<>();
            headers.put("Cache-Control", "no-cache");
            return new WebResourceResponse(mime, "UTF-8", 200, "OK", headers, input);
        } catch (IOException e) {
            return error("404");
        }
    }

    private WebResourceResponse error(String code) {
        return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found",
                new HashMap<String, String>(),
                new ByteArrayInputStream(code.getBytes()));
    }

    private class NativeBridge {
        @JavascriptInterface
        public void ready() {
        }

        @JavascriptInterface
        public void toast(final String message) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public boolean hasNotificationPermission() {
            return PushHelper.canNotify(MainActivity.this);
        }

        @JavascriptInterface
        public void requestNotificationPermission() {
            if (Build.VERSION.SDK_INT < 33) return;
            if (PushHelper.canNotify(MainActivity.this)) return;
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIFICATIONS);
                    } catch (Throwable ignored) {
                    }
                }
            });
        }

        @JavascriptInterface
        public void notify(String title, String body) {
            PushHelper.post(MainActivity.this, title, body,
                    PushStore.getSessionId(MainActivity.this), null);
        }

        /** 带 payload 的通知：点击后能精准跳到 sessionId 对应会话的 messageId 消息 */
        @JavascriptInterface
        public void notifyWithPayload(String title, String body, String sessionId, String messageId) {
            PushHelper.post(MainActivity.this, title, body, sessionId, messageId);
        }

        /** 前端同步通话状态：通话中不启后台保活 */
        @JavascriptInterface
        public void setInCall(boolean inCall) {
            KeepAliveService.inCall = inCall;
            if (inCall) {
                KeepAliveService.stop(MainActivity.this);
            } else if (!isForeground) {
                KeepAliveService.start(MainActivity.this);
            }
        }

        @JavascriptInterface
        public void startKeepAlive() {
            if (!isForeground) KeepAliveService.start(MainActivity.this);
        }

        @JavascriptInterface
        public void stopKeepAlive() {
            KeepAliveService.stop(MainActivity.this);
        }

        @JavascriptInterface
        public boolean isKeepAliveRunning() {
            return KeepAliveService.isRunning();
        }

        @JavascriptInterface
        public void setPushConfig(String json) {
            PushStore.saveConfig(MainActivity.this, json);
        }

        @JavascriptInterface
        public String consumePendingMessages() {
            try {
                String raw = PushStore.consumeQueue(MainActivity.this);
                PushHelper.clearAll(MainActivity.this);
                return raw;
            } catch (Throwable t) {
                return "[]";
            }
        }

        @JavascriptInterface
        public boolean isNativePushSupported() {
            return true;
        }

        @JavascriptInterface
        public String getStorageInfo() {
            try {
                StatFs stat = new StatFs(getFilesDir().getAbsolutePath());
                JSONObject info = new JSONObject();
                info.put("free", stat.getAvailableBytes());
                info.put("total", stat.getTotalBytes());
                return info.toString();
            } catch (Throwable t) {
                return "{}";
            }
        }

        @JavascriptInterface
        public void openAppSettings() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                        intent.setData(Uri.parse("package:" + getPackageName()));
                        startActivity(intent);
                    } catch (Throwable ignored) {
                    }
                }
            });
        }

        @JavascriptInterface
        public void saveFile(String name, String mime, String base64) {
            pendingName = (name == null || name.trim().isEmpty()) ? "applehut-file" : name;
            pendingMime = (mime == null || mime.trim().isEmpty()) ? "application/octet-stream" : mime;
            pendingBase64 = base64 == null ? "" : base64;
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                        intent.addCategory(Intent.CATEGORY_OPENABLE);
                        intent.setType(pendingMime);
                        intent.putExtra(Intent.EXTRA_TITLE, pendingName);
                        startActivityForResult(intent, REQ_SAVE);
                    } catch (Throwable e) {
                        Toast.makeText(MainActivity.this, "无法打开保存窗口", Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQ_FILE) {
            Uri[] result = null;
            if (resultCode == RESULT_OK && data != null) {
                if (data.getClipData() != null) {
                    int count = data.getClipData().getItemCount();
                    result = new Uri[count];
                    for (int i = 0; i < count; i++) {
                        result[i] = data.getClipData().getItemAt(i).getUri();
                    }
                } else if (data.getData() != null) {
                    result = new Uri[]{data.getData()};
                }
            }
            if (fileCallback != null) {
                fileCallback.onReceiveValue(result);
                fileCallback = null;
            }
            return;
        }

        if (requestCode == REQ_SAVE) {
            if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                try {
                    byte[] bytes = Base64.decode(pendingBase64, Base64.DEFAULT);
                    OutputStream out = getContentResolver().openOutputStream(data.getData());
                    if (out != null) {
                        out.write(bytes);
                        out.flush();
                        out.close();
                    }
                    Toast.makeText(this, "已保存到所选位置", Toast.LENGTH_SHORT).show();
                } catch (Throwable e) {
                    Toast.makeText(this, "保存失败，请重试", Toast.LENGTH_SHORT).show();
                }
            }
            pendingBase64 = "";
            return;
        }

        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onPause() {
        isForeground = false;
        if (webView != null) {
            webView.onPause();
        }
        // 退到后台：拉起常驻保活服务（通话中会自动跳过）
        KeepAliveService.start(this);
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        isForeground = true;
        // 回到前台：停掉常驻保活服务，通知自动消失
        KeepAliveService.stop(this);
        if (webView != null) {
            webView.onResume();
            webView.evaluateJavascript(
                    "window.AHNativePush&&AHNativePush.consumeIntoChat&&AHNativePush.consumeIntoChat();",
                    null);
        }
        // 热启动：回到前台时把之前攒的通知点击事件补投递
        flushPendingTap();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
