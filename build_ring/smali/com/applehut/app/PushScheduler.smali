.class public final Lcom/applehut/app/PushScheduler;
.super Ljava/lang/Object;
.source "PushScheduler.java"


# static fields
.field public static final ACTION:Ljava/lang/String; = "com.applehut.app.PUSH_TICK"

.field private static final REQUEST_CODE:I = 0x7d1


# direct methods
.method private constructor <init>()V
    .locals 0

    .line 14
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 15
    return-void
.end method

.method public static cancel(Landroid/content/Context;)V
    .locals 1

    .line 57
    :try_start_0
    const-string v0, "alarm"

    invoke-virtual {p0, v0}, Landroid/content/Context;->getSystemService(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Landroid/app/AlarmManager;

    .line 58
    if-eqz v0, :cond_0

    invoke-static {p0}, Lcom/applehut/app/PushScheduler;->pendingIntent(Landroid/content/Context;)Landroid/app/PendingIntent;

    move-result-object p0

    invoke-virtual {v0, p0}, Landroid/app/AlarmManager;->cancel(Landroid/app/PendingIntent;)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 60
    :cond_0
    goto :goto_0

    .line 59
    :catchall_0
    move-exception p0

    .line 61
    :goto_0
    return-void
.end method

.method private static pendingIntent(Landroid/content/Context;)Landroid/app/PendingIntent;
    .locals 3

    .line 18
    new-instance v0, Landroid/content/Intent;

    const-class v1, Lcom/applehut/app/PushReceiver;

    invoke-direct {v0, p0, v1}, Landroid/content/Intent;-><init>(Landroid/content/Context;Ljava/lang/Class;)V

    .line 19
    const-string v1, "com.applehut.app.PUSH_TICK"

    invoke-virtual {v0, v1}, Landroid/content/Intent;->setAction(Ljava/lang/String;)Landroid/content/Intent;

    .line 20
    nop

    .line 21
    nop

    .line 22
    const/16 v1, 0x7d1

    const/high16 v2, 0xc000000

    invoke-static {p0, v1, v0, v2}, Landroid/app/PendingIntent;->getBroadcast(Landroid/content/Context;ILandroid/content/Intent;I)Landroid/app/PendingIntent;

    move-result-object p0

    return-object p0
.end method

.method public static schedule(Landroid/content/Context;I)V
    .locals 13

    .line 26
    const-string v0, "alarm"

    if-gtz p1, :cond_0

    return-void

    .line 28
    :cond_0
    const/4 v1, 0x0

    const/4 v2, 0x5

    const-wide/32 v3, 0xea60

    :try_start_0
    invoke-virtual {p0, v0}, Landroid/content/Context;->getSystemService(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object v5

    check-cast v5, Landroid/app/AlarmManager;

    .line 29
    if-nez v5, :cond_1

    return-void

    .line 30
    :cond_1
    invoke-static {p0}, Lcom/applehut/app/PushScheduler;->pendingIntent(Landroid/content/Context;)Landroid/app/PendingIntent;

    move-result-object v6

    .line 31
    invoke-virtual {v5, v6}, Landroid/app/AlarmManager;->cancel(Landroid/app/PendingIntent;)V

    .line 33
    invoke-static {v2, p1}, Ljava/lang/Math;->max(II)I

    move-result v7

    int-to-long v7, v7

    mul-long/2addr v7, v3

    .line 34
    long-to-double v7, v7

    invoke-static {}, Ljava/lang/Math;->random()D

    move-result-wide v9

    const-wide v11, 0x3fd3333333333333L    # 0.3

    mul-double/2addr v9, v11

    const-wide v11, 0x3feb333333333333L    # 0.85

    add-double/2addr v9, v11

    mul-double/2addr v7, v9

    double-to-long v7, v7

    .line 35
    invoke-static {}, Ljava/lang/System;->currentTimeMillis()J

    move-result-wide v9

    invoke-static {v3, v4, v7, v8}, Ljava/lang/Math;->max(JJ)J

    move-result-wide v7

    add-long/2addr v9, v7

    .line 37
    nop

    .line 38
    invoke-virtual {v5, v1, v9, v10, v6}, Landroid/app/AlarmManager;->setAndAllowWhileIdle(IJLandroid/app/PendingIntent;)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 52
    goto :goto_0

    .line 42
    :catchall_0
    move-exception v5

    .line 44
    :try_start_1
    invoke-virtual {p0, v0}, Landroid/content/Context;->getSystemService(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Landroid/app/AlarmManager;

    .line 45
    if-eqz v0, :cond_2

    .line 46
    nop

    .line 47
    invoke-static {}, Ljava/lang/System;->currentTimeMillis()J

    move-result-wide v5

    invoke-static {v2, p1}, Ljava/lang/Math;->max(II)I

    move-result p1

    int-to-long v7, p1

    mul-long/2addr v7, v3

    add-long/2addr v5, v7

    .line 48
    invoke-static {p0}, Lcom/applehut/app/PushScheduler;->pendingIntent(Landroid/content/Context;)Landroid/app/PendingIntent;

    move-result-object p0

    .line 46
    invoke-virtual {v0, v1, v5, v6, p0}, Landroid/app/AlarmManager;->set(IJLandroid/app/PendingIntent;)V
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_1

    .line 51
    :cond_2
    goto :goto_0

    .line 50
    :catchall_1
    move-exception p0

    .line 53
    :goto_0
    return-void
.end method
