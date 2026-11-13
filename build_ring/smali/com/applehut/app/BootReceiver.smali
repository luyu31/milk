.class public Lcom/applehut/app/BootReceiver;
.super Landroid/content/BroadcastReceiver;
.source "BootReceiver.java"


# direct methods
.method public constructor <init>()V
    .locals 0

    .line 8
    invoke-direct {p0}, Landroid/content/BroadcastReceiver;-><init>()V

    return-void
.end method


# virtual methods
.method public onReceive(Landroid/content/Context;Landroid/content/Intent;)V
    .locals 1

    .line 13
    if-nez p2, :cond_0

    :try_start_0
    const-string p2, ""

    goto :goto_0

    :cond_0
    invoke-virtual {p2}, Landroid/content/Intent;->getAction()Ljava/lang/String;

    move-result-object p2

    .line 14
    :goto_0
    const-string v0, "android.intent.action.BOOT_COMPLETED"

    invoke-virtual {v0, p2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-nez v0, :cond_1

    const-string v0, "android.intent.action.MY_PACKAGE_REPLACED"

    .line 15
    invoke-virtual {v0, p2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-nez v0, :cond_1

    const-string v0, "android.intent.action.QUICKBOOT_POWERON"

    .line 16
    invoke-virtual {v0, p2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result p2

    if-nez p2, :cond_1

    .line 17
    return-void

    .line 19
    :cond_1
    invoke-static {p1}, Lcom/applehut/app/PushHelper;->ensureChannel(Landroid/content/Context;)V

    .line 20
    invoke-static {p1}, Lcom/applehut/app/PushStore;->isEnabled(Landroid/content/Context;)Z

    move-result p2

    if-eqz p2, :cond_2

    .line 21
    invoke-static {p1}, Lcom/applehut/app/PushStore;->getInterval(Landroid/content/Context;)I

    move-result p2

    invoke-static {p1, p2}, Lcom/applehut/app/PushScheduler;->schedule(Landroid/content/Context;I)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 24
    :cond_2
    goto :goto_1

    .line 23
    :catchall_0
    move-exception p1

    .line 25
    :goto_1
    return-void
.end method
