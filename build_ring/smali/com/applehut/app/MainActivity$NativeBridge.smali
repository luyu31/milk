.class Lcom/applehut/app/MainActivity$NativeBridge;
.super Ljava/lang/Object;
.source "MainActivity.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Lcom/applehut/app/MainActivity;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x2
    name = "NativeBridge"
.end annotation


# instance fields
.field final synthetic this$0:Lcom/applehut/app/MainActivity;


# direct methods
.method private constructor <init>(Lcom/applehut/app/MainActivity;)V
    .locals 0
    .annotation system Ldalvik/annotation/MethodParameters;
        accessFlags = {
            0x1010
        }
        names = {
            null
        }
    .end annotation

    .line 313
    iput-object p1, p0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method

.method synthetic constructor <init>(Lcom/applehut/app/MainActivity;Lcom/applehut/app/MainActivity$1;)V
    .locals 0

    .line 313
    invoke-direct {p0, p1}, Lcom/applehut/app/MainActivity$NativeBridge;-><init>(Lcom/applehut/app/MainActivity;)V

    return-void
.end method


# virtual methods
.method public consumePendingMessages()Ljava/lang/String;
    .locals 2
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 419
    :try_start_0
    iget-object v0, p0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    invoke-static {v0}, Lcom/applehut/app/PushStore;->consumeQueue(Landroid/content/Context;)Ljava/lang/String;

    move-result-object v0

    .line 420
    iget-object v1, p0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    invoke-static {v1}, Lcom/applehut/app/PushHelper;->clearAll(Landroid/content/Context;)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 421
    return-object v0

    .line 422
    :catchall_0
    move-exception v0

    .line 423
    const-string v0, "[]"

    return-object v0
.end method

.method public getStorageInfo()Ljava/lang/String;
    .locals 5
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 435
    :try_start_0
    new-instance v0, Landroid/os/StatFs;

    iget-object v1, p0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    invoke-virtual {v1}, Lcom/applehut/app/MainActivity;->getFilesDir()Ljava/io/File;

    move-result-object v1

    invoke-virtual {v1}, Ljava/io/File;->getAbsolutePath()Ljava/lang/String;

    move-result-object v1

    invoke-direct {v0, v1}, Landroid/os/StatFs;-><init>(Ljava/lang/String;)V

    .line 436
    new-instance v1, Lorg/json/JSONObject;

    invoke-direct {v1}, Lorg/json/JSONObject;-><init>()V

    .line 437
    const-string v2, "free"

    invoke-virtual {v0}, Landroid/os/StatFs;->getAvailableBytes()J

    move-result-wide v3

    invoke-virtual {v1, v2, v3, v4}, Lorg/json/JSONObject;->put(Ljava/lang/String;J)Lorg/json/JSONObject;

    .line 438
    const-string v2, "total"

    invoke-virtual {v0}, Landroid/os/StatFs;->getTotalBytes()J

    move-result-wide v3

    invoke-virtual {v1, v2, v3, v4}, Lorg/json/JSONObject;->put(Ljava/lang/String;J)Lorg/json/JSONObject;

    .line 439
    invoke-virtual {v1}, Lorg/json/JSONObject;->toString()Ljava/lang/String;

    move-result-object v0
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    return-object v0

    .line 440
    :catchall_0
    move-exception v0

    .line 441
    const-string v0, "{}"

    return-object v0
.end method

.method public hasNotificationPermission()Z
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 330
    iget-object v0, p0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    invoke-static {v0}, Lcom/applehut/app/PushHelper;->canNotify(Landroid/content/Context;)Z

    move-result v0

    return v0
.end method

.method public isKeepAliveRunning()Z
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 402
    :try_start_0
    invoke-static {}, Lcom/applehut/app/KeepAliveService;->isRunning()Z

    move-result v0
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    return v0

    .line 403
    :catchall_0
    move-exception v0

    .line 404
    const/4 v0, 0x0

    return v0
.end method

.method public isNativePushSupported()Z
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 429
    const/4 v0, 0x1

    return v0
.end method

.method public notify(Ljava/lang/String;Ljava/lang/String;)V
    .locals 3
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 355
    iget-object v0, p0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    iget-object v1, p0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    .line 356
    invoke-static {v1}, Lcom/applehut/app/PushStore;->getSessionId(Landroid/content/Context;)Ljava/lang/String;

    move-result-object v1

    .line 355
    const/4 v2, 0x0

    invoke-static {v0, p1, p2, v1, v2}, Lcom/applehut/app/PushHelper;->post(Landroid/content/Context;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Z

    .line 357
    return-void
.end method

.method public notifyWithPayload(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 363
    :try_start_0
    iget-object v0, p0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    invoke-static {v0, p1, p2, p3, p4}, Lcom/applehut/app/PushHelper;->post(Landroid/content/Context;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Z
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 365
    goto :goto_0

    .line 364
    :catchall_0
    move-exception p1

    .line 366
    :goto_0
    return-void
.end method

.method public openAppSettings()V
    .locals 2
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 447
    iget-object v0, p0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    new-instance v1, Lcom/applehut/app/MainActivity$NativeBridge$3;

    invoke-direct {v1, p0}, Lcom/applehut/app/MainActivity$NativeBridge$3;-><init>(Lcom/applehut/app/MainActivity$NativeBridge;)V

    invoke-virtual {v0, v1}, Lcom/applehut/app/MainActivity;->runOnUiThread(Ljava/lang/Runnable;)V

    .line 458
    return-void
.end method

.method public ready()V
    .locals 0
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 316
    return-void
.end method

.method public requestNotificationPermission()V
    .locals 2
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 335
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v1, 0x21

    if-ge v0, v1, :cond_0

    return-void

    .line 337
    :cond_0
    :try_start_0
    iget-object v0, p0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    invoke-static {v0}, Lcom/applehut/app/PushHelper;->canNotify(Landroid/content/Context;)Z

    move-result v0
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    if-eqz v0, :cond_1

    return-void

    .line 340
    :cond_1
    nop

    .line 341
    iget-object v0, p0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    new-instance v1, Lcom/applehut/app/MainActivity$NativeBridge$2;

    invoke-direct {v1, p0}, Lcom/applehut/app/MainActivity$NativeBridge$2;-><init>(Lcom/applehut/app/MainActivity$NativeBridge;)V

    invoke-virtual {v0, v1}, Lcom/applehut/app/MainActivity;->runOnUiThread(Ljava/lang/Runnable;)V

    .line 351
    return-void

    .line 338
    :catchall_0
    move-exception v0

    .line 339
    return-void
.end method

.method public saveFile(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V
    .locals 2
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 462
    iget-object v0, p0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    if-eqz p1, :cond_0

    invoke-virtual {p1}, Ljava/lang/String;->trim()Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v1}, Ljava/lang/String;->isEmpty()Z

    move-result v1

    if-eqz v1, :cond_1

    :cond_0
    const-string p1, "applehut-file"

    :cond_1
    invoke-static {v0, p1}, Lcom/applehut/app/MainActivity;->access$702(Lcom/applehut/app/MainActivity;Ljava/lang/String;)Ljava/lang/String;

    .line 463
    iget-object p1, p0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    if-eqz p2, :cond_2

    invoke-virtual {p2}, Ljava/lang/String;->trim()Ljava/lang/String;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/String;->isEmpty()Z

    move-result v0

    if-eqz v0, :cond_3

    :cond_2
    const-string p2, "application/octet-stream"

    :cond_3
    invoke-static {p1, p2}, Lcom/applehut/app/MainActivity;->access$802(Lcom/applehut/app/MainActivity;Ljava/lang/String;)Ljava/lang/String;

    .line 464
    iget-object p1, p0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    if-nez p3, :cond_4

    const-string p3, ""

    :cond_4
    invoke-static {p1, p3}, Lcom/applehut/app/MainActivity;->access$902(Lcom/applehut/app/MainActivity;Ljava/lang/String;)Ljava/lang/String;

    .line 465
    iget-object p1, p0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    new-instance p2, Lcom/applehut/app/MainActivity$NativeBridge$4;

    invoke-direct {p2, p0}, Lcom/applehut/app/MainActivity$NativeBridge$4;-><init>(Lcom/applehut/app/MainActivity$NativeBridge;)V

    invoke-virtual {p1, p2}, Lcom/applehut/app/MainActivity;->runOnUiThread(Ljava/lang/Runnable;)V

    .line 479
    return-void
.end method

.method public setInCall(Z)V
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    :try_start_0
    iget-object v0, p0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    invoke-static {v0, p1}, Lcom/applehut/app/MainActivity;->access$602(Lcom/applehut/app/MainActivity;Z)Z

    sput-boolean p1, Lcom/applehut/app/KeepAliveService;->inCall:Z

    sget-boolean p1, Lcom/applehut/app/MainActivity;->isForeground:Z

    if-nez p1, :cond_0

    iget-object p1, p0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    invoke-static {p1}, Lcom/applehut/app/KeepAliveService;->start(Landroid/content/Context;)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    :cond_0
    goto :goto_0

    :catchall_0
    move-exception p1

    :goto_0
    return-void
.end method

.method public setPushConfig(Ljava/lang/String;)V
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 411
    :try_start_0
    iget-object v0, p0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    invoke-static {v0, p1}, Lcom/applehut/app/PushStore;->saveConfig(Landroid/content/Context;Ljava/lang/String;)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 413
    goto :goto_0

    .line 412
    :catchall_0
    move-exception p1

    .line 414
    :goto_0
    return-void
.end method

.method public startKeepAlive()V
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 386
    :try_start_0
    sget-boolean v0, Lcom/applehut/app/MainActivity;->isForeground:Z

    if-nez v0, :cond_0

    iget-object v0, p0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    invoke-static {v0}, Lcom/applehut/app/KeepAliveService;->start(Landroid/content/Context;)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 388
    :cond_0
    goto :goto_0

    .line 387
    :catchall_0
    move-exception v0

    .line 389
    :goto_0
    return-void
.end method

.method public stopKeepAlive()V
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 394
    :try_start_0
    iget-object v0, p0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    invoke-static {v0}, Lcom/applehut/app/KeepAliveService;->stop(Landroid/content/Context;)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 396
    goto :goto_0

    .line 395
    :catchall_0
    move-exception v0

    .line 397
    :goto_0
    return-void
.end method

.method public toast(Ljava/lang/String;)V
    .locals 2
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 320
    iget-object v0, p0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    new-instance v1, Lcom/applehut/app/MainActivity$NativeBridge$1;

    invoke-direct {v1, p0, p1}, Lcom/applehut/app/MainActivity$NativeBridge$1;-><init>(Lcom/applehut/app/MainActivity$NativeBridge;Ljava/lang/String;)V

    invoke-virtual {v0, v1}, Lcom/applehut/app/MainActivity;->runOnUiThread(Ljava/lang/Runnable;)V

    .line 326
    return-void
.end method

.method public isForeground()Z
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    sget v0, Lcom/applehut/app/MainActivity;->isForeground:Z

    return v0
.end method

.method public showIncomingCallNotification(Ljava/lang/String;)V
    .locals 5
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    :try_start_0
    iget-object v0, p0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    const-string v1, "notification"

    invoke-virtual {v0, v1}, Landroid/content/Context;->getSystemService(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Landroid/app/NotificationManager;

    if-eqz v0, :cond_fail

    new-instance v2, Landroid/content/Intent;

    const-class v3, Lcom/applehut/app/MainActivity;

    invoke-direct {v2, p0, v3}, Landroid/content/Intent;-><init>(Landroid/content/Context;Ljava/lang/Class;)V

    const/high16 v3, 0x34000000

    invoke-virtual {v2, v3}, Landroid/content/Intent;->setFlags(I)Landroid/content/Intent;

    const/4 v1, 0x0

    const/high16 v3, 0xc000000

    invoke-static {p0, v1, v2, v3}, Landroid/app/PendingIntent;->getActivity(Landroid/content/Context;ILandroid/content/Intent;I)Landroid/app/PendingIntent;

    move-result-object v1

    new-instance v2, Landroid/app/Notification$Builder;

    const-string v3, "ah_incoming_call"

    invoke-direct {v2, p0, v3}, Landroid/app/Notification$Builder;-><init>(Landroid/content/Context;Ljava/lang/String;)V

    const/high16 v3, 0x7f020000

    invoke-virtual {v2, v3}, Landroid/app/Notification$Builder;->setSmallIcon(I)Landroid/app/Notification$Builder;

    move-result-object v3

    const-string v4, "Apple Hut 通话来电"

    invoke-virtual {v3, v4}, Landroid/app/Notification$Builder;->setContentTitle(Ljava/lang/CharSequence;)Landroid/app/Notification$Builder;

    move-result-object v3

    invoke-virtual {v3, p1}, Landroid/app/Notification$Builder;->setContentText(Ljava/lang/CharSequence;)Landroid/app/Notification$Builder;

    move-result-object v3

    const/4 p1, 0x1

    invoke-virtual {v3, p1}, Landroid/app/Notification$Builder;->setOngoing(Z)Landroid/app/Notification$Builder;

    move-result-object v3

    const/4 p1, -0x1

    invoke-virtual {v3, p1}, Landroid/app/Notification$Builder;->setPriority(I)Landroid/app/Notification$Builder;

    move-result-object p1

    const-string p2, "call"

    invoke-virtual {p1, p2}, Landroid/app/Notification$Builder;->setCategory(Ljava/lang/String;)Landroid/app/Notification$Builder;

    move-result-object p1

    const p2, -0x1175b1

    invoke-virtual {p1, p2}, Landroid/app/Notification$Builder;->setColor(I)Landroid/app/Notification$Builder;

    move-result-object p1

    invoke-virtual {p1}, Landroid/app/Notification$Builder;->build()Landroid/app/Notification;

    move-result-object p1

    const/16 v2, 0x3e9

    invoke-virtual {v0, v2, p1}, Landroid/app/NotificationManager;->notify(ILandroid/app/Notification;)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_fail

    :cond_fail
    :catchall_fail
    return-void
.end method

.method public stopIncomingCallNotification()V
    .locals 2
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    :try_start_0
    iget-object v0, p0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    const-string v1, "notification"

    invoke-virtual {v0, v1}, Landroid/content/Context;->getSystemService(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Landroid/app/NotificationManager;

    if-eqz v0, :cond_done

    const/16 v1, 0x3e9

    invoke-virtual {v0, v1}, Landroid/app/NotificationManager;->cancel(I)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_fail

    :cond_done
    :catchall_fail
    return-void
.end method

