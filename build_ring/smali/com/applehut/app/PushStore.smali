.class public final Lcom/applehut/app/PushStore;
.super Ljava/lang/Object;
.source "PushStore.java"


# static fields
.field private static final K_ENABLED:Ljava/lang/String; = "enabled"

.field private static final K_INTERVAL:Ljava/lang/String; = "interval"

.field private static final K_LAST_INDEX:Ljava/lang/String; = "last_index"

.field private static final K_PARTNER:Ljava/lang/String; = "partner"

.field private static final K_POOL:Ljava/lang/String; = "pool"

.field private static final K_QUEUE:Ljava/lang/String; = "queue"

.field private static final K_SESSION:Ljava/lang/String; = "session"

.field private static final PREF:Ljava/lang/String; = "ah_push"


# direct methods
.method private constructor <init>()V
    .locals 0

    .line 20
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 21
    return-void
.end method

.method public static declared-synchronized consumeQueue(Landroid/content/Context;)Ljava/lang/String;
    .locals 4

    const-class v0, Lcom/applehut/app/PushStore;

    monitor-enter v0

    .line 114
    :try_start_0
    invoke-static {p0}, Lcom/applehut/app/PushStore;->sp(Landroid/content/Context;)Landroid/content/SharedPreferences;

    move-result-object p0

    .line 115
    const-string v1, "queue"

    const-string v2, "[]"

    invoke-interface {p0, v1, v2}, Landroid/content/SharedPreferences;->getString(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v1

    .line 116
    invoke-interface {p0}, Landroid/content/SharedPreferences;->edit()Landroid/content/SharedPreferences$Editor;

    move-result-object p0

    const-string v2, "queue"

    const-string v3, "[]"

    invoke-interface {p0, v2, v3}, Landroid/content/SharedPreferences$Editor;->putString(Ljava/lang/String;Ljava/lang/String;)Landroid/content/SharedPreferences$Editor;

    move-result-object p0

    invoke-interface {p0}, Landroid/content/SharedPreferences$Editor;->apply()V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 117
    monitor-exit v0

    return-object v1

    .line 118
    :catchall_0
    move-exception p0

    .line 119
    :try_start_1
    const-string p0, "[]"
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_1

    monitor-exit v0

    return-object p0

    .line 113
    :catchall_1
    move-exception p0

    :try_start_2
    monitor-exit v0
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_1

    throw p0
.end method

.method public static getInterval(Landroid/content/Context;)I
    .locals 2

    .line 59
    invoke-static {p0}, Lcom/applehut/app/PushStore;->sp(Landroid/content/Context;)Landroid/content/SharedPreferences;

    move-result-object p0

    const-string v0, "interval"

    const/16 v1, 0x1e

    invoke-interface {p0, v0, v1}, Landroid/content/SharedPreferences;->getInt(Ljava/lang/String;I)I

    move-result p0

    const/4 v0, 0x5

    invoke-static {v0, p0}, Ljava/lang/Math;->max(II)I

    move-result p0

    return p0
.end method

.method public static getPartner(Landroid/content/Context;)Ljava/lang/String;
    .locals 2

    .line 63
    invoke-static {p0}, Lcom/applehut/app/PushStore;->sp(Landroid/content/Context;)Landroid/content/SharedPreferences;

    move-result-object p0

    const-string v0, "partner"

    const-string v1, "\u5bf9\u65b9"

    invoke-interface {p0, v0, v1}, Landroid/content/SharedPreferences;->getString(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object p0

    return-object p0
.end method

.method public static getSessionId(Landroid/content/Context;)Ljava/lang/String;
    .locals 2

    .line 67
    invoke-static {p0}, Lcom/applehut/app/PushStore;->sp(Landroid/content/Context;)Landroid/content/SharedPreferences;

    move-result-object p0

    const-string v0, "session"

    const-string v1, ""

    invoke-interface {p0, v0, v1}, Landroid/content/SharedPreferences;->getString(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object p0

    return-object p0
.end method

.method public static isEnabled(Landroid/content/Context;)Z
    .locals 2

    .line 55
    invoke-static {p0}, Lcom/applehut/app/PushStore;->sp(Landroid/content/Context;)Landroid/content/SharedPreferences;

    move-result-object p0

    const-string v0, "enabled"

    const/4 v1, 0x0

    invoke-interface {p0, v0, v1}, Landroid/content/SharedPreferences;->getBoolean(Ljava/lang/String;Z)Z

    move-result p0

    return p0
.end method

.method public static pickText(Landroid/content/Context;)Ljava/lang/String;
    .locals 9

    .line 72
    const-string v0, "last_index"

    const/4 v1, 0x0

    :try_start_0
    new-instance v2, Lorg/json/JSONArray;

    invoke-static {p0}, Lcom/applehut/app/PushStore;->sp(Landroid/content/Context;)Landroid/content/SharedPreferences;

    move-result-object v3

    const-string v4, "pool"

    const-string v5, "[]"

    invoke-interface {v3, v4, v5}, Landroid/content/SharedPreferences;->getString(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v3

    invoke-direct {v2, v3}, Lorg/json/JSONArray;-><init>(Ljava/lang/String;)V

    .line 73
    invoke-virtual {v2}, Lorg/json/JSONArray;->length()I

    move-result v3

    .line 74
    if-nez v3, :cond_0

    return-object v1

    .line 75
    :cond_0
    invoke-static {p0}, Lcom/applehut/app/PushStore;->sp(Landroid/content/Context;)Landroid/content/SharedPreferences;

    move-result-object v4

    const/4 v5, -0x1

    invoke-interface {v4, v0, v5}, Landroid/content/SharedPreferences;->getInt(Ljava/lang/String;I)I

    move-result v4

    .line 76
    invoke-static {}, Ljava/lang/Math;->random()D

    move-result-wide v5

    int-to-double v7, v3

    mul-double/2addr v5, v7

    double-to-int v5, v5

    .line 77
    const/4 v6, 0x1

    if-le v3, v6, :cond_1

    if-ne v5, v4, :cond_1

    add-int/lit8 v5, v5, 0x1

    rem-int/2addr v5, v3

    .line 78
    :cond_1
    invoke-static {p0}, Lcom/applehut/app/PushStore;->sp(Landroid/content/Context;)Landroid/content/SharedPreferences;

    move-result-object p0

    invoke-interface {p0}, Landroid/content/SharedPreferences;->edit()Landroid/content/SharedPreferences$Editor;

    move-result-object p0

    invoke-interface {p0, v0, v5}, Landroid/content/SharedPreferences$Editor;->putInt(Ljava/lang/String;I)Landroid/content/SharedPreferences$Editor;

    move-result-object p0

    invoke-interface {p0}, Landroid/content/SharedPreferences$Editor;->apply()V

    .line 79
    const-string p0, ""

    invoke-virtual {v2, v5, p0}, Lorg/json/JSONArray;->optString(ILjava/lang/String;)Ljava/lang/String;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/String;->trim()Ljava/lang/String;

    move-result-object p0

    .line 80
    invoke-virtual {p0}, Ljava/lang/String;->isEmpty()Z

    move-result v0
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    if-eqz v0, :cond_2

    goto :goto_0

    :cond_2
    move-object v1, p0

    :goto_0
    return-object v1

    .line 81
    :catchall_0
    move-exception p0

    .line 82
    return-object v1
.end method

.method public static declared-synchronized queueAdd(Landroid/content/Context;Ljava/lang/String;JLjava/lang/String;Ljava/lang/String;)V
    .locals 8

    const-class v0, Lcom/applehut/app/PushStore;

    monitor-enter v0

    .line 87
    const/4 v7, 0x0

    move-object v1, p0

    move-object v2, p1

    move-wide v3, p2

    move-object v5, p4

    move-object v6, p5

    :try_start_0
    invoke-static/range {v1 .. v7}, Lcom/applehut/app/PushStore;->queueAdd(Landroid/content/Context;Ljava/lang/String;JLjava/lang/String;Ljava/lang/String;Ljava/lang/String;)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 88
    monitor-exit v0

    return-void

    .line 86
    :catchall_0
    move-exception p0

    :try_start_1
    monitor-exit v0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    throw p0
.end method

.method public static declared-synchronized queueAdd(Landroid/content/Context;Ljava/lang/String;JLjava/lang/String;Ljava/lang/String;Ljava/lang/String;)V
    .locals 4

    const-class v0, Lcom/applehut/app/PushStore;

    monitor-enter v0

    .line 93
    :try_start_0
    invoke-static {p0}, Lcom/applehut/app/PushStore;->sp(Landroid/content/Context;)Landroid/content/SharedPreferences;

    move-result-object p0

    .line 94
    new-instance v1, Lorg/json/JSONArray;

    const-string v2, "queue"

    const-string v3, "[]"

    invoke-interface {p0, v2, v3}, Landroid/content/SharedPreferences;->getString(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v2

    invoke-direct {v1, v2}, Lorg/json/JSONArray;-><init>(Ljava/lang/String;)V

    .line 95
    new-instance v2, Lorg/json/JSONObject;

    invoke-direct {v2}, Lorg/json/JSONObject;-><init>()V

    .line 96
    const-string v3, "text"

    if-nez p1, :cond_0

    const-string p1, ""

    :cond_0
    invoke-virtual {v2, v3, p1}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 97
    const-string p1, "ts"

    invoke-virtual {v2, p1, p2, p3}, Lorg/json/JSONObject;->put(Ljava/lang/String;J)Lorg/json/JSONObject;

    .line 98
    const-string p1, "sessionId"

    if-nez p4, :cond_1

    const-string p4, ""

    :cond_1
    invoke-virtual {v2, p1, p4}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 99
    const-string p1, "sender"

    if-nez p5, :cond_2

    const-string p5, "\u5bf9\u65b9"

    :cond_2
    invoke-virtual {v2, p1, p5}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 100
    if-eqz p6, :cond_3

    invoke-virtual {p6}, Ljava/lang/String;->isEmpty()Z

    move-result p1

    if-nez p1, :cond_3

    .line 101
    const-string p1, "messageId"

    invoke-virtual {v2, p1, p6}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 103
    :cond_3
    invoke-virtual {v1, v2}, Lorg/json/JSONArray;->put(Ljava/lang/Object;)Lorg/json/JSONArray;

    .line 104
    :goto_0
    invoke-virtual {v1}, Lorg/json/JSONArray;->length()I

    move-result p1

    const/16 p2, 0xa

    if-le p1, p2, :cond_4

    .line 105
    const/4 p1, 0x0

    invoke-virtual {v1, p1}, Lorg/json/JSONArray;->remove(I)Ljava/lang/Object;

    goto :goto_0

    .line 107
    :cond_4
    invoke-interface {p0}, Landroid/content/SharedPreferences;->edit()Landroid/content/SharedPreferences$Editor;

    move-result-object p0

    const-string p1, "queue"

    invoke-virtual {v1}, Lorg/json/JSONArray;->toString()Ljava/lang/String;

    move-result-object p2

    invoke-interface {p0, p1, p2}, Landroid/content/SharedPreferences$Editor;->putString(Ljava/lang/String;Ljava/lang/String;)Landroid/content/SharedPreferences$Editor;

    move-result-object p0

    invoke-interface {p0}, Landroid/content/SharedPreferences$Editor;->apply()V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 109
    goto :goto_1

    .line 108
    :catchall_0
    move-exception p0

    .line 110
    :goto_1
    monitor-exit v0

    return-void
.end method

.method public static saveConfig(Landroid/content/Context;Ljava/lang/String;)V
    .locals 9

    .line 29
    const-string v0, "pool"

    const-string v1, "partner"

    const-string v2, "interval"

    const-string v3, "enabled"

    :try_start_0
    new-instance v4, Lorg/json/JSONObject;

    if-nez p1, :cond_0

    const-string p1, "{}"

    :cond_0
    invoke-direct {v4, p1}, Lorg/json/JSONObject;-><init>(Ljava/lang/String;)V

    .line 30
    const/4 p1, 0x0

    invoke-virtual {v4, v3, p1}, Lorg/json/JSONObject;->optBoolean(Ljava/lang/String;Z)Z

    move-result p1

    .line 31
    const/16 v5, 0x1e

    invoke-virtual {v4, v2, v5}, Lorg/json/JSONObject;->optInt(Ljava/lang/String;I)I

    move-result v5

    .line 32
    const/4 v6, 0x5

    if-ge v5, v6, :cond_1

    move v5, v6

    .line 33
    :cond_1
    const-string v6, "\u5bf9\u65b9"

    invoke-virtual {v4, v1, v6}, Lorg/json/JSONObject;->optString(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v6

    .line 34
    const-string v7, "sessionId"

    const-string v8, ""

    invoke-virtual {v4, v7, v8}, Lorg/json/JSONObject;->optString(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v7

    .line 35
    invoke-virtual {v4, v0}, Lorg/json/JSONObject;->optJSONArray(Ljava/lang/String;)Lorg/json/JSONArray;

    move-result-object v4

    .line 37
    invoke-static {p0}, Lcom/applehut/app/PushStore;->sp(Landroid/content/Context;)Landroid/content/SharedPreferences;

    move-result-object v8

    invoke-interface {v8}, Landroid/content/SharedPreferences;->edit()Landroid/content/SharedPreferences$Editor;

    move-result-object v8

    .line 38
    invoke-interface {v8, v3, p1}, Landroid/content/SharedPreferences$Editor;->putBoolean(Ljava/lang/String;Z)Landroid/content/SharedPreferences$Editor;

    move-result-object v3

    .line 39
    invoke-interface {v3, v2, v5}, Landroid/content/SharedPreferences$Editor;->putInt(Ljava/lang/String;I)Landroid/content/SharedPreferences$Editor;

    move-result-object v2

    .line 40
    invoke-interface {v2, v1, v6}, Landroid/content/SharedPreferences$Editor;->putString(Ljava/lang/String;Ljava/lang/String;)Landroid/content/SharedPreferences$Editor;

    move-result-object v1

    const-string v2, "session"

    .line 41
    invoke-interface {v1, v2, v7}, Landroid/content/SharedPreferences$Editor;->putString(Ljava/lang/String;Ljava/lang/String;)Landroid/content/SharedPreferences$Editor;

    move-result-object v1

    .line 42
    if-nez v4, :cond_2

    const-string v2, "[]"

    goto :goto_0

    :cond_2
    invoke-virtual {v4}, Lorg/json/JSONArray;->toString()Ljava/lang/String;

    move-result-object v2

    :goto_0
    invoke-interface {v1, v0, v2}, Landroid/content/SharedPreferences$Editor;->putString(Ljava/lang/String;Ljava/lang/String;)Landroid/content/SharedPreferences$Editor;

    move-result-object v0

    .line 43
    invoke-interface {v0}, Landroid/content/SharedPreferences$Editor;->apply()V

    .line 45
    if-eqz p1, :cond_3

    .line 46
    invoke-static {p0, v5}, Lcom/applehut/app/PushScheduler;->schedule(Landroid/content/Context;I)V

    goto :goto_1

    .line 48
    :cond_3
    invoke-static {p0}, Lcom/applehut/app/PushScheduler;->cancel(Landroid/content/Context;)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 51
    :goto_1
    goto :goto_2

    .line 50
    :catchall_0
    move-exception p0

    .line 52
    :goto_2
    return-void
.end method

.method private static sp(Landroid/content/Context;)Landroid/content/SharedPreferences;
    .locals 2

    .line 24
    const-string v0, "ah_push"

    const/4 v1, 0x0

    invoke-virtual {p0, v0, v1}, Landroid/content/Context;->getSharedPreferences(Ljava/lang/String;I)Landroid/content/SharedPreferences;

    move-result-object p0

    return-object p0
.end method
