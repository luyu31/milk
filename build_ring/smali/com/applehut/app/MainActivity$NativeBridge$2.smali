.class Lcom/applehut/app/MainActivity$NativeBridge$2;
.super Ljava/lang/Object;
.source "MainActivity.java"

# interfaces
.implements Ljava/lang/Runnable;


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Lcom/applehut/app/MainActivity$NativeBridge;->requestNotificationPermission()V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation


# instance fields
.field final synthetic this$1:Lcom/applehut/app/MainActivity$NativeBridge;


# direct methods
.method constructor <init>(Lcom/applehut/app/MainActivity$NativeBridge;)V
    .locals 0
    .annotation system Ldalvik/annotation/MethodParameters;
        accessFlags = {
            0x8010
        }
        names = {
            null
        }
    .end annotation

    .line 341
    iput-object p1, p0, Lcom/applehut/app/MainActivity$NativeBridge$2;->this$1:Lcom/applehut/app/MainActivity$NativeBridge;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public run()V
    .locals 3

    .line 345
    :try_start_0
    iget-object v0, p0, Lcom/applehut/app/MainActivity$NativeBridge$2;->this$1:Lcom/applehut/app/MainActivity$NativeBridge;

    iget-object v0, v0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    invoke-virtual {v0}, Lcom/applehut/app/MainActivity;->isFinishing()Z

    move-result v0

    if-nez v0, :cond_1

    iget-object v0, p0, Lcom/applehut/app/MainActivity$NativeBridge$2;->this$1:Lcom/applehut/app/MainActivity$NativeBridge;

    iget-object v0, v0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    invoke-virtual {v0}, Lcom/applehut/app/MainActivity;->isDestroyed()Z

    move-result v0

    if-eqz v0, :cond_0

    goto :goto_0

    .line 346
    :cond_0
    iget-object v0, p0, Lcom/applehut/app/MainActivity$NativeBridge$2;->this$1:Lcom/applehut/app/MainActivity$NativeBridge;

    iget-object v0, v0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    const-string v1, "android.permission.POST_NOTIFICATIONS"

    filled-new-array {v1}, [Ljava/lang/String;

    move-result-object v1

    const/16 v2, 0x3eb

    invoke-virtual {v0, v1, v2}, Lcom/applehut/app/MainActivity;->requestPermissions([Ljava/lang/String;I)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 348
    goto :goto_1

    .line 345
    :cond_1
    :goto_0
    return-void

    .line 347
    :catchall_0
    move-exception v0

    .line 349
    :goto_1
    return-void
.end method
