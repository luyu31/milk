.class public Lcom/applehut/app/PushReceiver;
.super Landroid/content/BroadcastReceiver;
.source "PushReceiver.java"


# direct methods
.method public constructor <init>()V
    .locals 0

    .line 7
    invoke-direct {p0}, Landroid/content/BroadcastReceiver;-><init>()V

    return-void
.end method


# virtual methods
.method public onReceive(Landroid/content/Context;Landroid/content/Intent;)V
    .locals 7

    .line 12
    :try_start_0
    invoke-static {p1}, Lcom/applehut/app/PushStore;->isEnabled(Landroid/content/Context;)Z

    move-result p2

    if-nez p2, :cond_0

    return-void

    .line 14
    :cond_0
    invoke-static {p1}, Lcom/applehut/app/PushStore;->getInterval(Landroid/content/Context;)I

    move-result p2

    .line 17
    sget-boolean v0, Lcom/applehut/app/MainActivity;->isForeground:Z

    if-eqz v0, :cond_1

    .line 18
    invoke-static {p1, p2}, Lcom/applehut/app/PushScheduler;->schedule(Landroid/content/Context;I)V

    .line 19
    return-void

    .line 22
    :cond_1
    invoke-static {p1}, Lcom/applehut/app/PushStore;->pickText(Landroid/content/Context;)Ljava/lang/String;

    move-result-object v1

    .line 23
    if-nez v1, :cond_2

    .line 24
    invoke-static {p1, p2}, Lcom/applehut/app/PushScheduler;->schedule(Landroid/content/Context;I)V

    .line 25
    return-void

    .line 28
    :cond_2
    invoke-static {p1}, Lcom/applehut/app/PushStore;->getPartner(Landroid/content/Context;)Ljava/lang/String;

    move-result-object v5

    .line 29
    invoke-static {p1}, Lcom/applehut/app/PushStore;->getSessionId(Landroid/content/Context;)Ljava/lang/String;

    move-result-object v4

    .line 32
    invoke-static {}, Ljava/lang/System;->currentTimeMillis()J

    move-result-wide v2

    .line 33
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {v0, v2, v3}, Ljava/lang/StringBuilder;->append(J)Ljava/lang/StringBuilder;

    move-result-object v0

    const-string v6, "_push_0"

    invoke-virtual {v0, v6}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v6

    .line 35
    invoke-static {p1, v5, v1, v4, v6}, Lcom/applehut/app/PushHelper;->post(Landroid/content/Context;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Z

    move-result v0

    .line 36
    if-eqz v0, :cond_3

    .line 37
    move-object v0, p1

    invoke-static/range {v0 .. v6}, Lcom/applehut/app/PushStore;->queueAdd(Landroid/content/Context;Ljava/lang/String;JLjava/lang/String;Ljava/lang/String;Ljava/lang/String;)V

    .line 39
    :cond_3
    invoke-static {p1, p2}, Lcom/applehut/app/PushScheduler;->schedule(Landroid/content/Context;I)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 41
    goto :goto_0

    .line 40
    :catchall_0
    move-exception p1

    .line 42
    :goto_0
    return-void
.end method
