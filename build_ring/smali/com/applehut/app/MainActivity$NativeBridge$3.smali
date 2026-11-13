.class Lcom/applehut/app/MainActivity$NativeBridge$3;
.super Ljava/lang/Object;
.source "MainActivity.java"

# interfaces
.implements Ljava/lang/Runnable;


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Lcom/applehut/app/MainActivity$NativeBridge;->openAppSettings()V
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

    .line 447
    iput-object p1, p0, Lcom/applehut/app/MainActivity$NativeBridge$3;->this$1:Lcom/applehut/app/MainActivity$NativeBridge;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public run()V
    .locals 3

    .line 451
    :try_start_0
    new-instance v0, Landroid/content/Intent;

    const-string v1, "android.settings.APPLICATION_DETAILS_SETTINGS"

    invoke-direct {v0, v1}, Landroid/content/Intent;-><init>(Ljava/lang/String;)V

    .line 452
    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "package:"

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    iget-object v2, p0, Lcom/applehut/app/MainActivity$NativeBridge$3;->this$1:Lcom/applehut/app/MainActivity$NativeBridge;

    iget-object v2, v2, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    invoke-virtual {v2}, Lcom/applehut/app/MainActivity;->getPackageName()Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v1

    invoke-static {v1}, Landroid/net/Uri;->parse(Ljava/lang/String;)Landroid/net/Uri;

    move-result-object v1

    invoke-virtual {v0, v1}, Landroid/content/Intent;->setData(Landroid/net/Uri;)Landroid/content/Intent;

    .line 453
    iget-object v1, p0, Lcom/applehut/app/MainActivity$NativeBridge$3;->this$1:Lcom/applehut/app/MainActivity$NativeBridge;

    iget-object v1, v1, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    invoke-virtual {v1, v0}, Lcom/applehut/app/MainActivity;->startActivity(Landroid/content/Intent;)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 455
    goto :goto_0

    .line 454
    :catchall_0
    move-exception v0

    .line 456
    :goto_0
    return-void
.end method
