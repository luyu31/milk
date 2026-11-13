.class public Lcom/applehut/app/MainActivity;
.super Landroid/app/Activity;
.source "MainActivity.java"


# annotations
.annotation system Ldalvik/annotation/MemberClasses;
    value = {
        Lcom/applehut/app/MainActivity$NativeBridge;
    }
.end annotation


# static fields
.field private static final HOST:Ljava/lang/String; = "applehut.local"

.field private static final MIME:Ljava/util/Map;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Ljava/util/Map<",
            "Ljava/lang/String;",
            "Ljava/lang/String;",
            ">;"
        }
    .end annotation
.end field

.field private static final REQ_FILE:I = 0x3e9

.field private static final REQ_NOTIFICATIONS:I = 0x3eb

.field private static final REQ_SAVE:I = 0x3ea

.field private static final START_URL:Ljava/lang/String; = "https://applehut.local/index.html"

.field static volatile isForeground:Z


# instance fields
.field private fileCallback:Landroid/webkit/ValueCallback;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Landroid/webkit/ValueCallback<",
            "[",
            "Landroid/net/Uri;",
            ">;"
        }
    .end annotation
.end field

.field private volatile inCall:Z

.field private volatile jsReady:Z

.field private pendingBase64:Ljava/lang/String;

.field private pendingMime:Ljava/lang/String;

.field private pendingName:Ljava/lang/String;

.field private final pendingTaps:Ljava/util/ArrayDeque;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Ljava/util/ArrayDeque<",
            "[",
            "Ljava/lang/String;",
            ">;"
        }
    .end annotation
.end field

.field private webView:Landroid/webkit/WebView;


# direct methods
.method static constructor <clinit>()V
    .locals 3

    .line 45
    const/4 v0, 0x0

    sput-boolean v0, Lcom/applehut/app/MainActivity;->isForeground:Z

    .line 65
    new-instance v0, Ljava/util/HashMap;

    invoke-direct {v0}, Ljava/util/HashMap;-><init>()V

    sput-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    .line 68
    sget-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    const-string v1, "html"

    const-string v2, "text/html"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 69
    sget-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    const-string v1, "htm"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 70
    sget-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    const-string v1, "js"

    const-string v2, "application/javascript"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 71
    sget-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    const-string v1, "css"

    const-string v2, "text/css"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 72
    sget-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    const-string v1, "json"

    const-string v2, "application/json"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 73
    sget-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    const-string v1, "png"

    const-string v2, "image/png"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 74
    sget-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    const-string v1, "jpg"

    const-string v2, "image/jpeg"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 75
    sget-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    const-string v1, "jpeg"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 76
    sget-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    const-string v1, "gif"

    const-string v2, "image/gif"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 77
    sget-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    const-string v1, "webp"

    const-string v2, "image/webp"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 78
    sget-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    const-string v1, "svg"

    const-string v2, "image/svg+xml"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 79
    sget-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    const-string v1, "ico"

    const-string v2, "image/x-icon"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 80
    sget-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    const-string v1, "woff"

    const-string v2, "font/woff"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 81
    sget-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    const-string v1, "woff2"

    const-string v2, "font/woff2"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 82
    sget-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    const-string v1, "ttf"

    const-string v2, "font/ttf"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 83
    sget-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    const-string v1, "otf"

    const-string v2, "font/otf"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 84
    sget-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    const-string v1, "mp3"

    const-string v2, "audio/mpeg"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 85
    sget-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    const-string v1, "wav"

    const-string v2, "audio/wav"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 86
    sget-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    const-string v1, "ogg"

    const-string v2, "audio/ogg"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 87
    sget-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    const-string v1, "m4a"

    const-string v2, "audio/mp4"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 88
    sget-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    const-string v1, "mp4"

    const-string v2, "video/mp4"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 89
    sget-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    const-string v1, "webm"

    const-string v2, "video/webm"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 90
    sget-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    const-string v1, "txt"

    const-string v2, "text/plain"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 91
    sget-object v0, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    const-string v1, "xml"

    const-string v2, "application/xml"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 92
    return-void
.end method

.method public constructor <init>()V
    .locals 1

    .line 37
    invoke-direct {p0}, Landroid/app/Activity;-><init>()V

    .line 49
    const-string v0, "applehut-file"

    iput-object v0, p0, Lcom/applehut/app/MainActivity;->pendingName:Ljava/lang/String;

    .line 50
    const-string v0, "application/octet-stream"

    iput-object v0, p0, Lcom/applehut/app/MainActivity;->pendingMime:Ljava/lang/String;

    .line 51
    const-string v0, ""

    iput-object v0, p0, Lcom/applehut/app/MainActivity;->pendingBase64:Ljava/lang/String;

    .line 54
    const/4 v0, 0x0

    iput-boolean v0, p0, Lcom/applehut/app/MainActivity;->jsReady:Z

    .line 57
    iput-boolean v0, p0, Lcom/applehut/app/MainActivity;->inCall:Z

    .line 63
    new-instance v0, Ljava/util/ArrayDeque;

    invoke-direct {v0}, Ljava/util/ArrayDeque;-><init>()V

    iput-object v0, p0, Lcom/applehut/app/MainActivity;->pendingTaps:Ljava/util/ArrayDeque;

    .line 65
    return-void
.end method

.method static synthetic access$100(Lcom/applehut/app/MainActivity;Ljava/lang/String;)Landroid/webkit/WebResourceResponse;
    .locals 0

    .line 37
    invoke-direct {p0, p1}, Lcom/applehut/app/MainActivity;->serveAsset(Ljava/lang/String;)Landroid/webkit/WebResourceResponse;

    move-result-object p0

    return-object p0
.end method

.method static synthetic access$202(Lcom/applehut/app/MainActivity;Z)Z
    .locals 0

    .line 37
    iput-boolean p1, p0, Lcom/applehut/app/MainActivity;->jsReady:Z

    return p1
.end method

.method static synthetic access$300(Lcom/applehut/app/MainActivity;)V
    .locals 0

    .line 37
    invoke-direct {p0}, Lcom/applehut/app/MainActivity;->flushPendingTap()V

    return-void
.end method

.method static synthetic access$400(Lcom/applehut/app/MainActivity;)Landroid/webkit/ValueCallback;
    .locals 0

    .line 37
    iget-object p0, p0, Lcom/applehut/app/MainActivity;->fileCallback:Landroid/webkit/ValueCallback;

    return-object p0
.end method

.method static synthetic access$402(Lcom/applehut/app/MainActivity;Landroid/webkit/ValueCallback;)Landroid/webkit/ValueCallback;
    .locals 0

    .line 37
    iput-object p1, p0, Lcom/applehut/app/MainActivity;->fileCallback:Landroid/webkit/ValueCallback;

    return-object p1
.end method

.method static synthetic access$500(Lcom/applehut/app/MainActivity;)Landroid/webkit/WebView;
    .locals 0

    .line 37
    iget-object p0, p0, Lcom/applehut/app/MainActivity;->webView:Landroid/webkit/WebView;

    return-object p0
.end method

.method static synthetic access$602(Lcom/applehut/app/MainActivity;Z)Z
    .locals 0

    .line 37
    iput-boolean p1, p0, Lcom/applehut/app/MainActivity;->inCall:Z

    return p1
.end method

.method static synthetic access$700(Lcom/applehut/app/MainActivity;)Ljava/lang/String;
    .locals 0

    .line 37
    iget-object p0, p0, Lcom/applehut/app/MainActivity;->pendingName:Ljava/lang/String;

    return-object p0
.end method

.method static synthetic access$702(Lcom/applehut/app/MainActivity;Ljava/lang/String;)Ljava/lang/String;
    .locals 0

    .line 37
    iput-object p1, p0, Lcom/applehut/app/MainActivity;->pendingName:Ljava/lang/String;

    return-object p1
.end method

.method static synthetic access$800(Lcom/applehut/app/MainActivity;)Ljava/lang/String;
    .locals 0

    .line 37
    iget-object p0, p0, Lcom/applehut/app/MainActivity;->pendingMime:Ljava/lang/String;

    return-object p0
.end method

.method static synthetic access$802(Lcom/applehut/app/MainActivity;Ljava/lang/String;)Ljava/lang/String;
    .locals 0

    .line 37
    iput-object p1, p0, Lcom/applehut/app/MainActivity;->pendingMime:Ljava/lang/String;

    return-object p1
.end method

.method static synthetic access$902(Lcom/applehut/app/MainActivity;Ljava/lang/String;)Ljava/lang/String;
    .locals 0

    .line 37
    iput-object p1, p0, Lcom/applehut/app/MainActivity;->pendingBase64:Ljava/lang/String;

    return-object p1
.end method

.method private error(Ljava/lang/String;)Landroid/webkit/WebResourceResponse;
    .locals 8

    .line 308
    new-instance v7, Landroid/webkit/WebResourceResponse;

    new-instance v5, Ljava/util/HashMap;

    invoke-direct {v5}, Ljava/util/HashMap;-><init>()V

    new-instance v6, Ljava/io/ByteArrayInputStream;

    .line 310
    invoke-virtual {p1}, Ljava/lang/String;->getBytes()[B

    move-result-object p1

    invoke-direct {v6, p1}, Ljava/io/ByteArrayInputStream;-><init>([B)V

    const-string v1, "text/plain"

    const-string v2, "UTF-8"

    const/16 v3, 0x194

    const-string v4, "Not Found"

    move-object v0, v7

    invoke-direct/range {v0 .. v6}, Landroid/webkit/WebResourceResponse;-><init>(Ljava/lang/String;Ljava/lang/String;ILjava/lang/String;Ljava/util/Map;Ljava/io/InputStream;)V

    .line 308
    return-object v7
.end method

.method private flushPendingTap()V
    .locals 4

    .line 238
    iget-boolean v0, p0, Lcom/applehut/app/MainActivity;->jsReady:Z

    if-eqz v0, :cond_5

    iget-object v0, p0, Lcom/applehut/app/MainActivity;->webView:Landroid/webkit/WebView;

    if-nez v0, :cond_0

    goto :goto_2

    .line 242
    :cond_0
    iget-object v0, p0, Lcom/applehut/app/MainActivity;->pendingTaps:Ljava/util/ArrayDeque;

    monitor-enter v0

    .line 243
    :try_start_0
    iget-object v1, p0, Lcom/applehut/app/MainActivity;->pendingTaps:Ljava/util/ArrayDeque;

    invoke-virtual {v1}, Ljava/util/ArrayDeque;->isEmpty()Z

    move-result v1

    if-eqz v1, :cond_1

    monitor-exit v0

    return-void

    .line 244
    :cond_1
    iget-object v1, p0, Lcom/applehut/app/MainActivity;->pendingTaps:Ljava/util/ArrayDeque;

    invoke-virtual {v1}, Ljava/util/ArrayDeque;->peekLast()Ljava/lang/Object;

    move-result-object v1

    check-cast v1, [Ljava/lang/String;

    .line 245
    iget-object v2, p0, Lcom/applehut/app/MainActivity;->pendingTaps:Ljava/util/ArrayDeque;

    invoke-virtual {v2}, Ljava/util/ArrayDeque;->clear()V

    .line 246
    monitor-exit v0
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 247
    const/4 v0, 0x0

    aget-object v0, v1, v0

    .line 248
    const/4 v2, 0x1

    aget-object v1, v1, v2

    .line 249
    if-nez v0, :cond_2

    if-nez v1, :cond_2

    return-void

    .line 252
    :cond_2
    if-eqz v0, :cond_4

    .line 253
    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V

    const-string v3, "(function(){try{var s="

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v2

    invoke-static {v0}, Lorg/json/JSONObject;->quote(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    invoke-virtual {v2, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    const-string v2, ";var m="

    invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    .line 254
    if-nez v1, :cond_3

    const-string v1, "null"

    goto :goto_0

    :cond_3
    invoke-static {v1}, Lorg/json/JSONObject;->quote(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v1

    :goto_0
    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    const-string v1, ";if(window.handleNotificationClick){window.handleNotificationClick(s,m);}else if(window.AHNativePushConsumeClick){window.AHNativePushConsumeClick();}}catch(e){}})();"

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    goto :goto_1

    .line 260
    :cond_4
    const-string v0, "(function(){try{if(window.handleNotificationClickFromStorage)window.handleNotificationClickFromStorage();}catch(e){}})();"

    .line 265
    :goto_1
    new-instance v1, Lcom/applehut/app/MainActivity$3;

    invoke-direct {v1, p0, v0}, Lcom/applehut/app/MainActivity$3;-><init>(Lcom/applehut/app/MainActivity;Ljava/lang/String;)V

    invoke-virtual {p0, v1}, Lcom/applehut/app/MainActivity;->runOnUiThread(Ljava/lang/Runnable;)V

    .line 274
    return-void

    .line 246
    :catchall_0
    move-exception v1

    :try_start_1
    monitor-exit v0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    throw v1

    .line 238
    :cond_5
    :goto_2
    return-void
.end method

.method private handleTapIntent(Landroid/content/Intent;)V
    .locals 4

    .line 213
    if-nez p1, :cond_0

    return-void

    .line 215
    :cond_0
    :try_start_0
    const-string v0, "ah_session_id"

    invoke-virtual {p1, v0}, Landroid/content/Intent;->getStringExtra(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    .line 216
    const-string v1, "ah_message_id"

    invoke-virtual {p1, v1}, Landroid/content/Intent;->getStringExtra(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v1

    .line 217
    const-string v2, "from_push"

    const/4 v3, 0x0

    invoke-virtual {p1, v2, v3}, Landroid/content/Intent;->getBooleanExtra(Ljava/lang/String;Z)Z

    move-result v2

    .line 218
    if-nez v0, :cond_1

    if-nez v2, :cond_1

    return-void

    .line 219
    :cond_1
    iget-object v2, p0, Lcom/applehut/app/MainActivity;->pendingTaps:Ljava/util/ArrayDeque;

    monitor-enter v2
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_1

    .line 220
    :try_start_1
    iget-object v3, p0, Lcom/applehut/app/MainActivity;->pendingTaps:Ljava/util/ArrayDeque;

    filled-new-array {v0, v1}, [Ljava/lang/String;

    move-result-object v0

    invoke-virtual {v3, v0}, Ljava/util/ArrayDeque;->addLast(Ljava/lang/Object;)V

    .line 221
    :goto_0
    iget-object v0, p0, Lcom/applehut/app/MainActivity;->pendingTaps:Ljava/util/ArrayDeque;

    invoke-virtual {v0}, Ljava/util/ArrayDeque;->size()I

    move-result v0

    const/4 v1, 0x5

    if-le v0, v1, :cond_2

    .line 222
    iget-object v0, p0, Lcom/applehut/app/MainActivity;->pendingTaps:Ljava/util/ArrayDeque;

    invoke-virtual {v0}, Ljava/util/ArrayDeque;->pollFirst()Ljava/lang/Object;

    goto :goto_0

    .line 224
    :cond_2
    monitor-exit v2
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    .line 226
    :try_start_2
    const-string v0, "ah_session_id"

    invoke-virtual {p1, v0}, Landroid/content/Intent;->removeExtra(Ljava/lang/String;)V

    .line 227
    const-string v0, "ah_message_id"

    invoke-virtual {p1, v0}, Landroid/content/Intent;->removeExtra(Ljava/lang/String;)V

    .line 228
    invoke-direct {p0}, Lcom/applehut/app/MainActivity;->flushPendingTap()V
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_1

    .line 230
    goto :goto_1

    .line 224
    :catchall_0
    move-exception p1

    :try_start_3
    monitor-exit v2
    :try_end_3
    .catchall {:try_start_3 .. :try_end_3} :catchall_0

    :try_start_4
    throw p1
    :try_end_4
    .catchall {:try_start_4 .. :try_end_4} :catchall_1

    .line 229
    :catchall_1
    move-exception p1

    .line 231
    :goto_1
    return-void
.end method

.method private serveAsset(Ljava/lang/String;)Landroid/webkit/WebResourceResponse;
    .locals 10

    .line 285
    const-string v0, ""

    if-nez p1, :cond_0

    move-object p1, v0

    .line 286
    :cond_0
    invoke-virtual {p1}, Ljava/lang/String;->length()I

    move-result v1

    if-eqz v1, :cond_1

    const-string v1, "/"

    invoke-virtual {p1, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v1

    if-eqz v1, :cond_2

    .line 287
    :cond_1
    const-string p1, "/index.html"

    .line 290
    :cond_2
    const/4 v1, 0x1

    :try_start_0
    invoke-virtual {p1, v1}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object p1

    invoke-static {p1}, Landroid/net/Uri;->decode(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p1

    .line 291
    const-string v2, ".."

    invoke-virtual {p1, v2}, Ljava/lang/String;->contains(Ljava/lang/CharSequence;)Z

    move-result v2

    if-eqz v2, :cond_3

    .line 292
    const-string p1, "403"

    invoke-direct {p0, p1}, Lcom/applehut/app/MainActivity;->error(Ljava/lang/String;)Landroid/webkit/WebResourceResponse;

    move-result-object p1

    return-object p1

    .line 294
    :cond_3
    invoke-virtual {p0}, Lcom/applehut/app/MainActivity;->getAssets()Landroid/content/res/AssetManager;

    move-result-object v2

    invoke-virtual {v2, p1}, Landroid/content/res/AssetManager;->open(Ljava/lang/String;)Ljava/io/InputStream;

    move-result-object v9

    .line 295
    const-string v2, "."

    invoke-virtual {p1, v2}, Ljava/lang/String;->contains(Ljava/lang/CharSequence;)Z

    move-result v2

    if-eqz v2, :cond_4

    .line 296
    const/16 v0, 0x2e

    invoke-virtual {p1, v0}, Ljava/lang/String;->lastIndexOf(I)I

    move-result v0

    add-int/2addr v0, v1

    invoke-virtual {p1, v0}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/String;->toLowerCase()Ljava/lang/String;

    move-result-object v0

    goto :goto_0

    .line 297
    :cond_4
    nop

    .line 298
    :goto_0
    sget-object p1, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    invoke-interface {p1, v0}, Ljava/util/Map;->containsKey(Ljava/lang/Object;)Z

    move-result p1

    if-eqz p1, :cond_5

    sget-object p1, Lcom/applehut/app/MainActivity;->MIME:Ljava/util/Map;

    invoke-interface {p1, v0}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p1

    check-cast p1, Ljava/lang/String;

    goto :goto_1

    :cond_5
    const-string p1, "application/octet-stream"

    :goto_1
    move-object v4, p1

    .line 299
    new-instance v8, Ljava/util/HashMap;

    invoke-direct {v8}, Ljava/util/HashMap;-><init>()V

    .line 300
    const-string p1, "Cache-Control"

    const-string v0, "no-cache"

    invoke-interface {v8, p1, v0}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 301
    new-instance p1, Landroid/webkit/WebResourceResponse;

    const-string v5, "UTF-8"

    const-string v7, "OK"

    const/16 v6, 0xc8

    move-object v3, p1

    invoke-direct/range {v3 .. v9}, Landroid/webkit/WebResourceResponse;-><init>(Ljava/lang/String;Ljava/lang/String;ILjava/lang/String;Ljava/util/Map;Ljava/io/InputStream;)V
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_0

    return-object p1

    .line 302
    :catch_0
    move-exception p1

    .line 303
    const-string p1, "404"

    invoke-direct {p0, p1}, Lcom/applehut/app/MainActivity;->error(Ljava/lang/String;)Landroid/webkit/WebResourceResponse;

    move-result-object p1

    return-object p1
.end method


# virtual methods
.method protected onActivityResult(IILandroid/content/Intent;)V
    .locals 3

    .line 484
    const/16 v0, 0x3e9

    const/4 v1, -0x1

    const/4 v2, 0x0

    if-ne p1, v0, :cond_4

    .line 485
    nop

    .line 486
    const/4 p1, 0x0

    if-ne p2, v1, :cond_2

    if-eqz p3, :cond_2

    .line 487
    invoke-virtual {p3}, Landroid/content/Intent;->getClipData()Landroid/content/ClipData;

    move-result-object p2

    if-eqz p2, :cond_1

    .line 488
    invoke-virtual {p3}, Landroid/content/Intent;->getClipData()Landroid/content/ClipData;

    move-result-object p2

    invoke-virtual {p2}, Landroid/content/ClipData;->getItemCount()I

    move-result p2

    .line 489
    new-array v0, p2, [Landroid/net/Uri;

    .line 490
    nop

    :goto_0
    if-ge v2, p2, :cond_0

    .line 491
    invoke-virtual {p3}, Landroid/content/Intent;->getClipData()Landroid/content/ClipData;

    move-result-object v1

    invoke-virtual {v1, v2}, Landroid/content/ClipData;->getItemAt(I)Landroid/content/ClipData$Item;

    move-result-object v1

    invoke-virtual {v1}, Landroid/content/ClipData$Item;->getUri()Landroid/net/Uri;

    move-result-object v1

    aput-object v1, v0, v2

    .line 490
    add-int/lit8 v2, v2, 0x1

    goto :goto_0

    .line 493
    :cond_0
    goto :goto_1

    :cond_1
    invoke-virtual {p3}, Landroid/content/Intent;->getData()Landroid/net/Uri;

    move-result-object p2

    if-eqz p2, :cond_2

    .line 494
    const/4 p2, 0x1

    new-array v0, p2, [Landroid/net/Uri;

    invoke-virtual {p3}, Landroid/content/Intent;->getData()Landroid/net/Uri;

    move-result-object p2

    aput-object p2, v0, v2

    goto :goto_1

    .line 497
    :cond_2
    move-object v0, p1

    :goto_1
    iget-object p2, p0, Lcom/applehut/app/MainActivity;->fileCallback:Landroid/webkit/ValueCallback;

    if-eqz p2, :cond_3

    .line 498
    iget-object p2, p0, Lcom/applehut/app/MainActivity;->fileCallback:Landroid/webkit/ValueCallback;

    invoke-interface {p2, v0}, Landroid/webkit/ValueCallback;->onReceiveValue(Ljava/lang/Object;)V

    .line 499
    iput-object p1, p0, Lcom/applehut/app/MainActivity;->fileCallback:Landroid/webkit/ValueCallback;

    .line 501
    :cond_3
    return-void

    .line 504
    :cond_4
    const/16 v0, 0x3ea

    if-ne p1, v0, :cond_7

    .line 505
    if-ne p2, v1, :cond_6

    if-eqz p3, :cond_6

    invoke-virtual {p3}, Landroid/content/Intent;->getData()Landroid/net/Uri;

    move-result-object p1

    if-eqz p1, :cond_6

    .line 507
    :try_start_0
    iget-object p1, p0, Lcom/applehut/app/MainActivity;->pendingBase64:Ljava/lang/String;

    invoke-static {p1, v2}, Landroid/util/Base64;->decode(Ljava/lang/String;I)[B

    move-result-object p1

    .line 508
    invoke-virtual {p0}, Lcom/applehut/app/MainActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object p2

    invoke-virtual {p3}, Landroid/content/Intent;->getData()Landroid/net/Uri;

    move-result-object p3

    invoke-virtual {p2, p3}, Landroid/content/ContentResolver;->openOutputStream(Landroid/net/Uri;)Ljava/io/OutputStream;

    move-result-object p2

    .line 509
    if-eqz p2, :cond_5

    .line 510
    invoke-virtual {p2, p1}, Ljava/io/OutputStream;->write([B)V

    .line 511
    invoke-virtual {p2}, Ljava/io/OutputStream;->flush()V

    .line 512
    invoke-virtual {p2}, Ljava/io/OutputStream;->close()V

    .line 514
    :cond_5
    const-string p1, "\u5df2\u4fdd\u5b58\u5230\u6240\u9009\u4f4d\u7f6e"

    invoke-static {p0, p1, v2}, Landroid/widget/Toast;->makeText(Landroid/content/Context;Ljava/lang/CharSequence;I)Landroid/widget/Toast;

    move-result-object p1

    invoke-virtual {p1}, Landroid/widget/Toast;->show()V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 517
    goto :goto_2

    .line 515
    :catchall_0
    move-exception p1

    .line 516
    const-string p1, "\u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5"

    invoke-static {p0, p1, v2}, Landroid/widget/Toast;->makeText(Landroid/content/Context;Ljava/lang/CharSequence;I)Landroid/widget/Toast;

    move-result-object p1

    invoke-virtual {p1}, Landroid/widget/Toast;->show()V

    .line 519
    :cond_6
    :goto_2
    const-string p1, ""

    iput-object p1, p0, Lcom/applehut/app/MainActivity;->pendingBase64:Ljava/lang/String;

    .line 520
    return-void

    .line 523
    :cond_7
    invoke-super {p0, p1, p2, p3}, Landroid/app/Activity;->onActivityResult(IILandroid/content/Intent;)V

    .line 524
    return-void
.end method

.method public onBackPressed()V
    .locals 1

    .line 528
    iget-object v0, p0, Lcom/applehut/app/MainActivity;->webView:Landroid/webkit/WebView;

    if-eqz v0, :cond_0

    iget-object v0, p0, Lcom/applehut/app/MainActivity;->webView:Landroid/webkit/WebView;

    invoke-virtual {v0}, Landroid/webkit/WebView;->canGoBack()Z

    move-result v0

    if-eqz v0, :cond_0

    .line 529
    iget-object v0, p0, Lcom/applehut/app/MainActivity;->webView:Landroid/webkit/WebView;

    invoke-virtual {v0}, Landroid/webkit/WebView;->goBack()V

    goto :goto_0

    .line 531
    :cond_0
    invoke-super {p0}, Landroid/app/Activity;->onBackPressed()V

    .line 533
    :goto_0
    return-void
.end method

.method protected onCreate(Landroid/os/Bundle;)V
    .locals 3

    .line 97
    invoke-super {p0, p1}, Landroid/app/Activity;->onCreate(Landroid/os/Bundle;)V

    .line 98
    invoke-static {p0}, Lcom/applehut/app/NotificationChannels;->ensureAll(Landroid/content/Context;)V

    .line 100
    invoke-virtual {p0}, Lcom/applehut/app/MainActivity;->getWindow()Landroid/view/Window;

    move-result-object p1

    .line 101
    const v0, -0x70d17

    invoke-virtual {p1, v0}, Landroid/view/Window;->setStatusBarColor(I)V

    .line 102
    invoke-virtual {p1, v0}, Landroid/view/Window;->setNavigationBarColor(I)V

    .line 103
    const/16 v0, 0x10

    invoke-virtual {p1, v0}, Landroid/view/Window;->setSoftInputMode(I)V

    .line 104
    nop

    .line 105
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v1, 0x1a

    if-lt v0, v1, :cond_0

    .line 106
    const/16 v0, 0x2010

    goto :goto_0

    .line 105
    :cond_0
    const/16 v0, 0x2000

    .line 108
    :goto_0
    invoke-virtual {p1}, Landroid/view/Window;->getDecorView()Landroid/view/View;

    move-result-object p1

    invoke-virtual {p1, v0}, Landroid/view/View;->setSystemUiVisibility(I)V

    .line 110
    new-instance p1, Landroid/webkit/WebView;

    invoke-direct {p1, p0}, Landroid/webkit/WebView;-><init>(Landroid/content/Context;)V

    iput-object p1, p0, Lcom/applehut/app/MainActivity;->webView:Landroid/webkit/WebView;

    .line 111
    iget-object p1, p0, Lcom/applehut/app/MainActivity;->webView:Landroid/webkit/WebView;

    const/16 v0, -0x91c

    invoke-virtual {p1, v0}, Landroid/webkit/WebView;->setBackgroundColor(I)V

    .line 112
    iget-object p1, p0, Lcom/applehut/app/MainActivity;->webView:Landroid/webkit/WebView;

    invoke-virtual {p0, p1}, Lcom/applehut/app/MainActivity;->setContentView(Landroid/view/View;)V

    .line 114
    iget-object p1, p0, Lcom/applehut/app/MainActivity;->webView:Landroid/webkit/WebView;

    invoke-virtual {p1}, Landroid/webkit/WebView;->getSettings()Landroid/webkit/WebSettings;

    move-result-object p1

    .line 115
    const/4 v0, 0x1

    invoke-virtual {p1, v0}, Landroid/webkit/WebSettings;->setJavaScriptEnabled(Z)V

    .line 116
    invoke-virtual {p1, v0}, Landroid/webkit/WebSettings;->setDomStorageEnabled(Z)V

    .line 117
    invoke-virtual {p1, v0}, Landroid/webkit/WebSettings;->setDatabaseEnabled(Z)V

    .line 118
    const/4 v1, 0x0

    invoke-virtual {p1, v1}, Landroid/webkit/WebSettings;->setAllowFileAccess(Z)V

    .line 119
    invoke-virtual {p1, v1}, Landroid/webkit/WebSettings;->setAllowContentAccess(Z)V

    .line 120
    invoke-virtual {p1, v1}, Landroid/webkit/WebSettings;->setMediaPlaybackRequiresUserGesture(Z)V

    .line 121
    invoke-virtual {p1, v1}, Landroid/webkit/WebSettings;->setSupportZoom(Z)V

    .line 122
    invoke-virtual {p1, v1}, Landroid/webkit/WebSettings;->setBuiltInZoomControls(Z)V

    .line 123
    invoke-virtual {p1, v1}, Landroid/webkit/WebSettings;->setDisplayZoomControls(Z)V

    .line 124
    invoke-virtual {p1, v0}, Landroid/webkit/WebSettings;->setLoadWithOverviewMode(Z)V

    .line 125
    invoke-virtual {p1, v0}, Landroid/webkit/WebSettings;->setUseWideViewPort(Z)V

    .line 126
    const/16 v0, 0x64

    invoke-virtual {p1, v0}, Landroid/webkit/WebSettings;->setTextZoom(I)V

    .line 127
    invoke-virtual {p1, v1}, Landroid/webkit/WebSettings;->setMixedContentMode(I)V

    .line 128
    const/4 v0, -0x1

    invoke-virtual {p1, v0}, Landroid/webkit/WebSettings;->setCacheMode(I)V

    .line 129
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v2, 0x1d

    if-lt v0, v2, :cond_1

    .line 131
    :try_start_0
    invoke-virtual {p1, v1}, Landroid/webkit/WebSettings;->setForceDark(I)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 133
    goto :goto_1

    .line 132
    :catchall_0
    move-exception v0

    .line 135
    :cond_1
    :goto_1
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v2, 0x21

    if-lt v0, v2, :cond_2

    .line 137
    :try_start_1
    invoke-virtual {p1, v1}, Landroid/webkit/WebSettings;->setAlgorithmicDarkeningAllowed(Z)V
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_1

    .line 139
    goto :goto_2

    .line 138
    :catchall_1
    move-exception p1

    .line 142
    :cond_2
    :goto_2
    iget-object p1, p0, Lcom/applehut/app/MainActivity;->webView:Landroid/webkit/WebView;

    new-instance v0, Lcom/applehut/app/MainActivity$NativeBridge;

    const/4 v1, 0x0

    invoke-direct {v0, p0, v1}, Lcom/applehut/app/MainActivity$NativeBridge;-><init>(Lcom/applehut/app/MainActivity;Lcom/applehut/app/MainActivity$1;)V

    const-string v1, "AppleHut"

    invoke-virtual {p1, v0, v1}, Landroid/webkit/WebView;->addJavascriptInterface(Ljava/lang/Object;Ljava/lang/String;)V

    .line 144
    iget-object p1, p0, Lcom/applehut/app/MainActivity;->webView:Landroid/webkit/WebView;

    new-instance v0, Lcom/applehut/app/MainActivity$1;

    invoke-direct {v0, p0}, Lcom/applehut/app/MainActivity$1;-><init>(Lcom/applehut/app/MainActivity;)V

    invoke-virtual {p1, v0}, Landroid/webkit/WebView;->setWebViewClient(Landroid/webkit/WebViewClient;)V

    .line 176
    iget-object p1, p0, Lcom/applehut/app/MainActivity;->webView:Landroid/webkit/WebView;

    new-instance v0, Lcom/applehut/app/MainActivity$2;

    invoke-direct {v0, p0}, Lcom/applehut/app/MainActivity$2;-><init>(Lcom/applehut/app/MainActivity;)V

    invoke-virtual {p1, v0}, Landroid/webkit/WebView;->setWebChromeClient(Landroid/webkit/WebChromeClient;)V

    .line 200
    iget-object p1, p0, Lcom/applehut/app/MainActivity;->webView:Landroid/webkit/WebView;

    const-string v0, "https://applehut.local/index.html"

    invoke-virtual {p1, v0}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V

    .line 203
    invoke-virtual {p0}, Lcom/applehut/app/MainActivity;->getIntent()Landroid/content/Intent;

    move-result-object p1

    invoke-direct {p0, p1}, Lcom/applehut/app/MainActivity;->handleTapIntent(Landroid/content/Intent;)V

    .line 204
    return-void
.end method

.method protected onDestroy()V
    .locals 1

    .line 578
    iget-object v0, p0, Lcom/applehut/app/MainActivity;->webView:Landroid/webkit/WebView;

    if-eqz v0, :cond_0

    .line 579
    iget-object v0, p0, Lcom/applehut/app/MainActivity;->webView:Landroid/webkit/WebView;

    invoke-virtual {v0}, Landroid/webkit/WebView;->destroy()V

    .line 580
    const/4 v0, 0x0

    iput-object v0, p0, Lcom/applehut/app/MainActivity;->webView:Landroid/webkit/WebView;

    .line 582
    :cond_0
    invoke-super {p0}, Landroid/app/Activity;->onDestroy()V

    .line 583
    return-void
.end method

.method protected onNewIntent(Landroid/content/Intent;)V
    .locals 0

    .line 279
    invoke-super {p0, p1}, Landroid/app/Activity;->onNewIntent(Landroid/content/Intent;)V

    .line 280
    invoke-virtual {p0, p1}, Lcom/applehut/app/MainActivity;->setIntent(Landroid/content/Intent;)V

    .line 281
    invoke-direct {p0, p1}, Lcom/applehut/app/MainActivity;->handleTapIntent(Landroid/content/Intent;)V

    .line 282
    return-void
.end method

.method protected onPause()V
    .locals 1

    .line 537
    const/4 v0, 0x0

    sput-boolean v0, Lcom/applehut/app/MainActivity;->isForeground:Z

    .line 539
    :try_start_0
    iget-object v0, p0, Lcom/applehut/app/MainActivity;->webView:Landroid/webkit/WebView;

    if-eqz v0, :cond_0

    .line 540
    iget-object v0, p0, Lcom/applehut/app/MainActivity;->webView:Landroid/webkit/WebView;

    invoke-virtual {v0}, Landroid/webkit/WebView;->onPause()V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 543
    :cond_0
    goto :goto_0

    .line 542
    :catchall_0
    move-exception v0

    .line 546
    :goto_0
    :try_start_1
    invoke-virtual {p0}, Lcom/applehut/app/MainActivity;->isFinishing()Z

    move-result v0

    if-nez v0, :cond_1

    invoke-static {p0}, Lcom/applehut/app/KeepAliveService;->start(Landroid/content/Context;)V
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_1

    .line 550
    :cond_1
    goto :goto_1

    .line 549
    :catchall_1
    move-exception v0

    .line 551
    :goto_1
    invoke-super {p0}, Landroid/app/Activity;->onPause()V

    .line 552
    return-void
.end method

.method protected onResume()V
    .locals 3

    .line 556
    invoke-super {p0}, Landroid/app/Activity;->onResume()V

    .line 557
    const/4 v0, 0x1

    sput-boolean v0, Lcom/applehut/app/MainActivity;->isForeground:Z

    .line 560
    :try_start_0
    invoke-static {p0}, Lcom/applehut/app/KeepAliveService;->stop(Landroid/content/Context;)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 562
    goto :goto_0

    .line 561
    :catchall_0
    move-exception v0

    .line 564
    :goto_0
    :try_start_1
    iget-object v0, p0, Lcom/applehut/app/MainActivity;->webView:Landroid/webkit/WebView;

    if-eqz v0, :cond_0

    .line 565
    iget-object v0, p0, Lcom/applehut/app/MainActivity;->webView:Landroid/webkit/WebView;

    invoke-virtual {v0}, Landroid/webkit/WebView;->onResume()V

    .line 566
    iget-object v0, p0, Lcom/applehut/app/MainActivity;->webView:Landroid/webkit/WebView;

    const-string v1, "window.AHNativePush&&AHNativePush.consumeIntoChat&&AHNativePush.consumeIntoChat();"

    const/4 v2, 0x0

    invoke-virtual {v0, v1, v2}, Landroid/webkit/WebView;->evaluateJavascript(Ljava/lang/String;Landroid/webkit/ValueCallback;)V
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_1

    .line 571
    :cond_0
    goto :goto_1

    .line 570
    :catchall_1
    move-exception v0

    .line 573
    :goto_1
    invoke-direct {p0}, Lcom/applehut/app/MainActivity;->flushPendingTap()V

    .line 574
    return-void
.end method
