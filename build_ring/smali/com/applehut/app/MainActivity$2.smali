.class Lcom/applehut/app/MainActivity$2;
.super Landroid/webkit/WebChromeClient;
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

    .line 176
    iput-object p1, p0, Lcom/applehut/app/MainActivity$2;->this$0:Lcom/applehut/app/MainActivity;

    invoke-direct {p0}, Landroid/webkit/WebChromeClient;-><init>()V

    return-void
.end method


# virtual methods
.method public onPermissionRequest(Landroid/webkit/PermissionRequest;)V
    .locals 0

    .line 196
    invoke-virtual {p1}, Landroid/webkit/PermissionRequest;->deny()V

    .line 197
    return-void
.end method

.method public onShowFileChooser(Landroid/webkit/WebView;Landroid/webkit/ValueCallback;Landroid/webkit/WebChromeClient$FileChooserParams;)Z
    .locals 1
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Landroid/webkit/WebView;",
            "Landroid/webkit/ValueCallback<",
            "[",
            "Landroid/net/Uri;",
            ">;",
            "Landroid/webkit/WebChromeClient$FileChooserParams;",
            ")Z"
        }
    .end annotation

    .line 180
    iget-object p1, p0, Lcom/applehut/app/MainActivity$2;->this$0:Lcom/applehut/app/MainActivity;

    invoke-static {p1}, Lcom/applehut/app/MainActivity;->access$400(Lcom/applehut/app/MainActivity;)Landroid/webkit/ValueCallback;

    move-result-object p1

    const/4 v0, 0x0

    if-eqz p1, :cond_0

    .line 181
    iget-object p1, p0, Lcom/applehut/app/MainActivity$2;->this$0:Lcom/applehut/app/MainActivity;

    invoke-static {p1}, Lcom/applehut/app/MainActivity;->access$400(Lcom/applehut/app/MainActivity;)Landroid/webkit/ValueCallback;

    move-result-object p1

    invoke-interface {p1, v0}, Landroid/webkit/ValueCallback;->onReceiveValue(Ljava/lang/Object;)V

    .line 183
    :cond_0
    iget-object p1, p0, Lcom/applehut/app/MainActivity$2;->this$0:Lcom/applehut/app/MainActivity;

    invoke-static {p1, p2}, Lcom/applehut/app/MainActivity;->access$402(Lcom/applehut/app/MainActivity;Landroid/webkit/ValueCallback;)Landroid/webkit/ValueCallback;

    .line 185
    :try_start_0
    invoke-virtual {p3}, Landroid/webkit/WebChromeClient$FileChooserParams;->createIntent()Landroid/content/Intent;

    move-result-object p1

    .line 186
    iget-object p2, p0, Lcom/applehut/app/MainActivity$2;->this$0:Lcom/applehut/app/MainActivity;

    const/16 p3, 0x3e9

    invoke-virtual {p2, p1, p3}, Lcom/applehut/app/MainActivity;->startActivityForResult(Landroid/content/Intent;I)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 187
    const/4 p1, 0x1

    return p1

    .line 188
    :catchall_0
    move-exception p1

    .line 189
    iget-object p1, p0, Lcom/applehut/app/MainActivity$2;->this$0:Lcom/applehut/app/MainActivity;

    invoke-static {p1, v0}, Lcom/applehut/app/MainActivity;->access$402(Lcom/applehut/app/MainActivity;Landroid/webkit/ValueCallback;)Landroid/webkit/ValueCallback;

    .line 190
    const/4 p1, 0x0

    return p1
.end method
