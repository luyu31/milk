.class public final Lcom/applehut/app/NotificationChannels;
.super Ljava/lang/Object;
.source "NotificationChannels.java"


# static fields
.field public static final CHANNEL_CALL:Ljava/lang/String; = "ah_call"

.field public static final CHANNEL_MESSAGES:Ljava/lang/String; = "ah_messages"

.field public static final CHANNEL_OTHER:Ljava/lang/String; = "ah_other"


# direct methods
.method private constructor <init>()V
    .locals 0

    .line 25
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 26
    return-void
.end method

.method public static ensureAll(Landroid/content/Context;)V
    .locals 7

    .line 29
    const-string v0, "ah_call"

    const-string v1, "ah_other"

    const-string v2, "ah_messages"

    sget v3, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v4, 0x1a

    if-ge v3, v4, :cond_0

    return-void

    .line 30
    :cond_0
    const-string v3, "notification"

    invoke-virtual {p0, v3}, Landroid/content/Context;->getSystemService(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object p0

    check-cast p0, Landroid/app/NotificationManager;

    .line 31
    if-nez p0, :cond_1

    return-void

    .line 34
    :cond_1
    const/4 v3, 0x4

    :try_start_0
    invoke-virtual {p0, v2}, Landroid/app/NotificationManager;->getNotificationChannel(Ljava/lang/String;)Landroid/app/NotificationChannel;

    move-result-object v4
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    const-string v5, "\u5bf9\u65b9\u53d1\u6765\u7684\u6d88\u606f\u4e0e\u540e\u53f0\u63a8\u9001"

    const-string v6, "\u793e\u4ea4\u901a\u8baf"

    if-nez v4, :cond_2

    .line 35
    :try_start_1
    new-instance v4, Landroid/app/NotificationChannel;

    invoke-direct {v4, v2, v6, v3}, Landroid/app/NotificationChannel;-><init>(Ljava/lang/String;Ljava/lang/CharSequence;I)V

    .line 37
    invoke-virtual {v4, v5}, Landroid/app/NotificationChannel;->setDescription(Ljava/lang/String;)V

    .line 38
    const/4 v2, 0x1

    invoke-virtual {v4, v2}, Landroid/app/NotificationChannel;->enableVibration(Z)V

    .line 39
    invoke-virtual {v4, v2}, Landroid/app/NotificationChannel;->setShowBadge(Z)V

    .line 40
    invoke-virtual {p0, v4}, Landroid/app/NotificationManager;->createNotificationChannel(Landroid/app/NotificationChannel;)V

    .line 41
    goto :goto_0

    .line 43
    :cond_2
    invoke-virtual {p0, v2}, Landroid/app/NotificationManager;->getNotificationChannel(Ljava/lang/String;)Landroid/app/NotificationChannel;

    move-result-object v2

    .line 44
    if-eqz v2, :cond_3

    .line 45
    invoke-virtual {v2, v6}, Landroid/app/NotificationChannel;->setName(Ljava/lang/CharSequence;)V

    .line 46
    invoke-virtual {v2, v5}, Landroid/app/NotificationChannel;->setDescription(Ljava/lang/String;)V

    .line 47
    invoke-virtual {p0, v2}, Landroid/app/NotificationManager;->createNotificationChannel(Landroid/app/NotificationChannel;)V
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    .line 51
    :cond_3
    :goto_0
    goto :goto_1

    .line 50
    :catchall_0
    move-exception v2

    .line 54
    :goto_1
    const/4 v2, 0x0

    :try_start_2
    invoke-virtual {p0, v1}, Landroid/app/NotificationManager;->getNotificationChannel(Ljava/lang/String;)Landroid/app/NotificationChannel;

    move-result-object v4

    if-nez v4, :cond_4

    .line 55
    new-instance v4, Landroid/app/NotificationChannel;

    const-string v5, "\u5176\u4ed6"

    const/4 v6, 0x2

    invoke-direct {v4, v1, v5, v6}, Landroid/app/NotificationChannel;-><init>(Ljava/lang/String;Ljava/lang/CharSequence;I)V

    .line 57
    const-string v1, "\u540e\u53f0\u8fd0\u884c\u4fdd\u6d3b\u3001\u7cfb\u7edf\u63d0\u793a"

    invoke-virtual {v4, v1}, Landroid/app/NotificationChannel;->setDescription(Ljava/lang/String;)V

    .line 58
    invoke-virtual {v4, v2}, Landroid/app/NotificationChannel;->setShowBadge(Z)V

    .line 59
    invoke-virtual {v4, v2}, Landroid/app/NotificationChannel;->enableVibration(Z)V

    .line 60
    const/4 v1, 0x0

    invoke-virtual {v4, v1, v1}, Landroid/app/NotificationChannel;->setSound(Landroid/net/Uri;Landroid/media/AudioAttributes;)V

    .line 61
    const/4 v1, -0x1

    invoke-virtual {v4, v1}, Landroid/app/NotificationChannel;->setLockscreenVisibility(I)V

    .line 62
    invoke-virtual {p0, v4}, Landroid/app/NotificationManager;->createNotificationChannel(Landroid/app/NotificationChannel;)V
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_1

    .line 65
    :cond_4
    goto :goto_2

    .line 64
    :catchall_1
    move-exception v1

    .line 68
    :goto_2
    :try_start_3
    invoke-virtual {p0, v0}, Landroid/app/NotificationManager;->getNotificationChannel(Ljava/lang/String;)Landroid/app/NotificationChannel;

    move-result-object v1

    if-nez v1, :cond_5

    .line 69
    new-instance v1, Landroid/app/NotificationChannel;

    const-string v4, "\u901a\u8bdd"

    invoke-direct {v1, v0, v4, v3}, Landroid/app/NotificationChannel;-><init>(Ljava/lang/String;Ljava/lang/CharSequence;I)V

    .line 71
    const-string v0, "\u901a\u8bdd\u4e2d\u7684\u4fdd\u6d3b\u901a\u77e5"

    invoke-virtual {v1, v0}, Landroid/app/NotificationChannel;->setDescription(Ljava/lang/String;)V

    .line 72
    invoke-virtual {v1, v2}, Landroid/app/NotificationChannel;->setShowBadge(Z)V

    .line 73
    invoke-virtual {p0, v1}, Landroid/app/NotificationManager;->createNotificationChannel(Landroid/app/NotificationChannel;)V
    :try_end_3
    .catchall {:try_start_3 .. :try_end_3} :catchall_2

    .line 76
    :cond_5
    goto :goto_3

    .line 75
    :catchall_2
    move-exception p0

    .line 77
    :goto_3
    return-void
.end method
