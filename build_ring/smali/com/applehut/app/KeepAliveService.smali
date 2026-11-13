.class public Lcom/applehut/app/KeepAliveService;
.super Landroid/app/Service;
.source "KeepAliveService.java"


# static fields
.field public static final NOTIF_ID:I = 0x182b9

.field static volatile inCall:Z

.field private static volatile running:Z


# direct methods
.method static constructor <clinit>()V
    .locals 1

    .line 30
    const/4 v0, 0x0

    sput-boolean v0, Lcom/applehut/app/KeepAliveService;->inCall:Z

    .line 32
    sput-boolean v0, Lcom/applehut/app/KeepAliveService;->running:Z

    return-void
.end method

.method public constructor <init>()V
    .locals 0

    .line 25
    invoke-direct {p0}, Landroid/app/Service;-><init>()V

    return-void
.end method

.method private buildNotification()Landroid/app/Notification;
    .locals 6

    new-instance v0, Landroid/content/Intent;

    const-class v1, Lcom/applehut/app/MainActivity;

    invoke-direct {v0, p0, v1}, Landroid/content/Intent;-><init>(Landroid/content/Context;Ljava/lang/Class;)V

    const/high16 v1, 0x34000000

    invoke-virtual {v0, v1}, Landroid/content/Intent;->setFlags(I)Landroid/content/Intent;

    const/4 v1, 0x0

    const/high16 v2, 0xc000000

    :try_start_0
    invoke-static {p0, v1, v0, v2}, Landroid/app/PendingIntent;->getActivity(Landroid/content/Context;ILandroid/content/Intent;I)Landroid/app/PendingIntent;

    move-result-object v0
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    goto :goto_0

    :catchall_0
    move-exception v0

    const/4 v0, 0x0

    :goto_0
    sget-boolean v1, Lcom/applehut/app/KeepAliveService;->inCall:Z

    if-eqz v1, :cond_call
    const-string v1, "ah_call"

    const-string v2, "Apple Hut · 通话中"

    const-string v3, "点按回到通话界面"

    const/4 v4, 0x1

    const-string v5, "call"

    goto :goto_channel

    :cond_call
    const-string v1, "ah_other"

    const-string v2, "Apple Hut 正在后台运行"

    const-string v3, "保持连接，随时接收新消息"

    const/4 v4, -0x1

    const-string v5, "service"

    :goto_channel
    sget p1, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 p2, 0x1a

    if-lt p1, p2, :cond_newbuilder

    new-instance p1, Landroid/app/Notification$Builder;

    invoke-direct {p1, p0, v1}, Landroid/app/Notification$Builder;-><init>(Landroid/content/Context;Ljava/lang/String;)V

    goto :goto_builder

    :cond_newbuilder
    new-instance p1, Landroid/app/Notification$Builder;

    invoke-direct {p1, p0}, Landroid/app/Notification$Builder;-><init>(Landroid/content/Context;)V

    :goto_builder
    const/high16 p2, 0x7f020000

    invoke-virtual {p1, p2}, Landroid/app/Notification$Builder;->setSmallIcon(I)Landroid/app/Notification$Builder;

    move-result-object p1

    invoke-virtual {p1, v2}, Landroid/app/Notification$Builder;->setContentTitle(Ljava/lang/CharSequence;)Landroid/app/Notification$Builder;

    move-result-object p1

    invoke-virtual {p1, v3}, Landroid/app/Notification$Builder;->setContentText(Ljava/lang/CharSequence;)Landroid/app/Notification$Builder;

    move-result-object p1

    const/4 p2, 0x1

    invoke-virtual {p1, p2}, Landroid/app/Notification$Builder;->setOngoing(Z)Landroid/app/Notification$Builder;

    move-result-object p1

    const/4 p2, 0x0

    invoke-virtual {p1, p2}, Landroid/app/Notification$Builder;->setAutoCancel(Z)Landroid/app/Notification$Builder;

    move-result-object p1

    invoke-virtual {p1, p2}, Landroid/app/Notification$Builder;->setShowWhen(Z)Landroid/app/Notification$Builder;

    move-result-object p1

    invoke-virtual {p1, v4}, Landroid/app/Notification$Builder;->setPriority(I)Landroid/app/Notification$Builder;

    move-result-object p1

    invoke-virtual {p1, v5}, Landroid/app/Notification$Builder;->setCategory(Ljava/lang/String;)Landroid/app/Notification$Builder;

    if-eqz v0, :cond_no_pi

    invoke-virtual {p1, v0}, Landroid/app/Notification$Builder;->setContentIntent(Landroid/app/PendingIntent;)Landroid/app/Notification$Builder;

    :cond_no_pi
    const/4 p2, -0x1

    invoke-virtual {p1, p2}, Landroid/app/Notification$Builder;->setVisibility(I)Landroid/app/Notification$Builder;

    invoke-virtual {p1}, Landroid/app/Notification$Builder;->build()Landroid/app/Notification;

    move-result-object v0

    return-object v0
.end method

.method public static isRunning()Z
    .locals 1

    .line 35
    sget-boolean v0, Lcom/applehut/app/KeepAliveService;->running:Z

    return v0
.end method

.method public static start(Landroid/content/Context;)V
    .locals 4

    .line 39
    const-class v0, Lcom/applehut/app/KeepAliveService;
    :try_start_0
    new-instance v1, Landroid/content/Intent;

    invoke-direct {v1, p0, v0}, Landroid/content/Intent;-><init>(Landroid/content/Context;Ljava/lang/Class;)V

    .line 42
    sget v2, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v3, 0x1a

    if-lt v2, v3, :cond_1

    .line 43
    invoke-virtual {p0, v1}, Landroid/content/Context;->startForegroundService(Landroid/content/Intent;)Landroid/content/ComponentName;

    goto :goto_0

    .line 45
    :cond_1
    invoke-virtual {p0, v1}, Landroid/content/Context;->startService(Landroid/content/Intent;)Landroid/content/ComponentName;
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 53
    :goto_0
    goto :goto_1

    .line 47
    :catchall_0
    move-exception v1

    .line 50
    :try_start_1
    new-instance v1, Landroid/content/Intent;

    invoke-direct {v1, p0, v0}, Landroid/content/Intent;-><init>(Landroid/content/Context;Ljava/lang/Class;)V

    invoke-virtual {p0, v1}, Landroid/content/Context;->startService(Landroid/content/Intent;)Landroid/content/ComponentName;
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_1

    .line 52
    goto :goto_1

    .line 51
    :catchall_1
    move-exception p0

    .line 54
    :goto_1
    return-void
.end method

.method public static stop(Landroid/content/Context;)V
    .locals 2

    .line 58
    :try_start_0
    new-instance v0, Landroid/content/Intent;

    const-class v1, Lcom/applehut/app/KeepAliveService;

    invoke-direct {v0, p0, v1}, Landroid/content/Intent;-><init>(Landroid/content/Context;Ljava/lang/Class;)V

    invoke-virtual {p0, v0}, Landroid/content/Context;->stopService(Landroid/content/Intent;)Z
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 60
    goto :goto_0

    .line 59
    :catchall_0
    move-exception p0

    .line 61
    :goto_0
    return-void
.end method


# virtual methods
.method public onBind(Landroid/content/Intent;)Landroid/os/IBinder;
    .locals 0

    .line 160
    const/4 p1, 0x0

    return-object p1
.end method

.method public onCreate()V
    .locals 1

    .line 65
    invoke-super {p0}, Landroid/app/Service;->onCreate()V

    .line 66
    const/4 v0, 0x1

    sput-boolean v0, Lcom/applehut/app/KeepAliveService;->running:Z

    .line 67
    return-void
.end method

.method public onDestroy()V
    .locals 1

    .line 144
    const/4 v0, 0x0

    sput-boolean v0, Lcom/applehut/app/KeepAliveService;->running:Z

    .line 146
    const/4 v0, 0x1

    :try_start_0
    invoke-virtual {p0, v0}, Lcom/applehut/app/KeepAliveService;->stopForeground(Z)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 148
    goto :goto_0

    .line 147
    :catchall_0
    move-exception v0

    .line 149
    :goto_0
    invoke-super {p0}, Landroid/app/Service;->onDestroy()V

    .line 150
    return-void
.end method

.method public onStartCommand(Landroid/content/Intent;II)I
    .locals 3

    .line 74
    nop

    .line 76
    :try_start_0
    invoke-static {p0}, Lcom/applehut/app/NotificationChannels;->ensureAll(Landroid/content/Context;)V

    .line 77
    invoke-direct {p0}, Lcom/applehut/app/KeepAliveService;->buildNotification()Landroid/app/Notification;

    move-result-object p1
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 79
    goto :goto_0

    .line 78
    :catchall_0
    move-exception p1

    const/4 p1, 0x0

    .line 80
    :goto_0
    const/4 p2, 0x2

    if-nez p1, :cond_0

    .line 81
    invoke-virtual {p0}, Lcom/applehut/app/KeepAliveService;->stopSelf()V

    .line 82
    return p2

    .line 85
    :cond_0
    const p3, 0x182b9

    :try_start_1
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v1, 0x22

    const/4 v2, 0x1

    if-lt v0, v1, :cond_1

    .line 86
    invoke-virtual {p0, p3, p1, v2}, Lcom/applehut/app/KeepAliveService;->startForeground(ILandroid/app/Notification;I)V

    goto :goto_1

    .line 88
    :cond_1
    invoke-virtual {p0, p3, p1}, Lcom/applehut/app/KeepAliveService;->startForeground(ILandroid/app/Notification;)V
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_1

    .line 98
    :goto_1
    nop

    return v2

    .line 90
    :catchall_1
    move-exception v0

    .line 93
    :try_start_2
    invoke-virtual {p0, p3, p1}, Lcom/applehut/app/KeepAliveService;->startForeground(ILandroid/app/Notification;)V
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_2

    .line 95
    goto :goto_2

    .line 94
    :catchall_2
    move-exception p1

    .line 96
    :goto_2
    invoke-virtual {p0}, Lcom/applehut/app/KeepAliveService;->stopSelf()V

    .line 97
    return p2
.end method

.method public onTaskRemoved(Landroid/content/Intent;)V
    .locals 0

    .line 155
    invoke-super {p0, p1}, Landroid/app/Service;->onTaskRemoved(Landroid/content/Intent;)V

    .line 156
    return-void
.end method
