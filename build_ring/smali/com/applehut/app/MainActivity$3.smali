.class Lcom/applehut/app/MainActivity$3;
.super Ljava/lang/Object;
.source "MainActivity.java"

# interfaces
.implements Ljava/lang/Runnable;


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Lcom/applehut/app/MainActivity;->flushPendingTap()V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation


# instance fields
.field final synthetic this$0:Lcom/applehut/app/MainActivity;

.field final synthetic val$js:Ljava/lang/String;


# direct methods
.method constructor <init>(Lcom/applehut/app/MainActivity;Ljava/lang/String;)V
    .locals 0
    .annotation system Ldalvik/annotation/MethodParameters;
        accessFlags = {
            0x8010,
            0x1010
        }
        names = {
            null,
            null
        }
    .end annotation

    .annotation system Ldalvik/annotation/Signature;
        value = {
            "()V"
        }
    .end annotation

    .line 265
    iput-object p2, p0, Lcom/applehut/app/MainActivity$3;->val$js:Ljava/lang/String;

    iput-object p1, p0, Lcom/applehut/app/MainActivity$3;->this$0:Lcom/applehut/app/MainActivity;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public run()V
    .locals 3

    .line 269
    :try_start_0
    iget-object v0, p0, Lcom/applehut/app/MainActivity$3;->this$0:Lcom/applehut/app/MainActivity;

    invoke-static {v0}, Lcom/applehut/app/MainActivity;->access$500(Lcom/applehut/app/MainActivity;)Landroid/webkit/WebView;

    move-result-object v0

    if-eqz v0, :cond_0

    iget-object v0, p0, Lcom/applehut/app/MainActivity$3;->this$0:Lcom/applehut/app/MainActivity;

    invoke-static {v0}, Lcom/applehut/app/MainActivity;->access$500(Lcom/applehut/app/MainActivity;)Landroid/webkit/WebView;

    move-result-object v0

    iget-object v1, p0, Lcom/applehut/app/MainActivity$3;->val$js:Ljava/lang/String;

    const/4 v2, 0x0

    invoke-virtual {v0, v1, v2}, Landroid/webkit/WebView;->evaluateJavascript(Ljava/lang/String;Landroid/webkit/ValueCallback;)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 271
    :cond_0
    goto :goto_0

    .line 270
    :catchall_0
    move-exception v0

    .line 272
    :goto_0
    return-void
.end method
