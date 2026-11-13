.class Lcom/applehut/app/MainActivity$1;
.super Landroid/webkit/WebViewClient;
.source "MainActivity.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Lcom/applehut/app/MainActivity;->onCreate(Landroid/os/Bundle;)V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation


# instance fields
.field final synthetic this$0:Lcom/applehut/app/MainActivity;


# direct methods
.method constructor <init>(Lcom/applehut/app/MainActivity;)V
    .locals 0
    .annotation system Ldalvik/annotation/MethodParameters;
        accessFlags = {
            0x8010
        }
        names = {
            null
        }
    .end annotation

    .line 144
    iput-object p1, p0, Lcom/applehut/app/MainActivity$1;->this$0:Lcom/applehut/app/MainActivity;

    invoke-direct {p0}, Landroid/webkit/WebViewClient;-><init>()V

    return-void
.end method


# virtual methods
.method public onPageFinished(Landroid/webkit/WebView;Ljava/lang/String;)V
    .locals 0

    .line 169
    invoke-super {p0, p1, p2}, Landroid/webkit/WebViewClient;->onPageFinished(Landroid/webkit/WebView;Ljava/lang/String;)V

    .line 170
    iget-object p1, p0, Lcom/applehut/app/MainActivity$1;->this$0:Lcom/applehut/app/MainActivity;

    const/4 p2, 0x1

    invoke-static {p1, p2}, Lcom/applehut/app/MainActivity;->access$202(Lcom/applehut/app/MainActivity;Z)Z

    .line 172
    iget-object p1, p0, Lcom/applehut/app/MainActivity$1;->this$0:Lcom/applehut/app/MainActivity;

    invoke-static {p1}, Lcom/applehut/app/MainActivity;->access$300(Lcom/applehut/app/MainActivity;)V

    .line 173
    return-void
.end method

.method public shouldInterceptRequest(Landroid/webkit/WebView;Landroid/webkit/WebResourceRequest;)Landroid/webkit/WebResourceResponse;
    .locals 1

    .line 147
    invoke-interface {p2}, Landroid/webkit/WebResourceRequest;->getUrl()Landroid/net/Uri;

    move-result-object p1

    .line 148
    const-string p2, "applehut.local"

    invoke-virtual {p1}, Landroid/net/Uri;->getHost()Ljava/lang/String;

    move-result-object v0

    invoke-virtual {p2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result p2

    if-eqz p2, :cond_0

    .line 149
    iget-object p2, p0, Lcom/applehut/app/MainActivity$1;->this$0:Lcom/applehut/app/MainActivity;

    invoke-virtual {p1}, Landroid/net/Uri;->getPath()Ljava/lang/String;

    move-result-object p1

    invoke-static {p2, p1}, Lcom/applehut/app/MainActivity;->access$100(Lcom/applehut/app/MainActivity;Ljava/lang/String;)Landroid/webkit/WebResourceResponse;

    move-result-object p1

    return-object p1

    .line 151
    :cond_0
    const/4 p1, 0x0

    return-object p1
.end method

.method public shouldOverrideUrlLoading(Landroid/webkit/WebView;Landroid/webkit/WebResourceRequest;)Z
    .locals 2

    .line 156
    invoke-interface {p2}, Landroid/webkit/WebResourceRequest;->getUrl()Landroid/net/Uri;

    move-result-object p1

    .line 157
    const-string p2, "applehut.local"

    invoke-virtual {p1}, Landroid/net/Uri;->getHost()Ljava/lang/String;

    move-result-object v0

    invoke-virtual {p2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result p2

    if-eqz p2, :cond_0

    .line 158
    const/4 p1, 0x0

    return p1

    .line 161
    :cond_0
    :try_start_0
    iget-object p2, p0, Lcom/applehut/app/MainActivity$1;->this$0:Lcom/applehut/app/MainActivity;

    new-instance v0, Landroid/content/Intent;

    const-string v1, "android.intent.action.VIEW"

    invoke-direct {v0, v1, p1}, Landroid/content/Intent;-><init>(Ljava/lang/String;Landroid/net/Uri;)V

    invoke-virtual {p2, v0}, Lcom/applehut/app/MainActivity;->startActivity(Landroid/content/Intent;)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 163
    goto :goto_0

    .line 162
    :catchall_0
    move-exception p1

    .line 164
    :goto_0
    const/4 p1, 0x1

    return p1
.end method
