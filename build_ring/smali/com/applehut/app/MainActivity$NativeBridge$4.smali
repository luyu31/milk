.class Lcom/applehut/app/MainActivity$NativeBridge$4;
.super Ljava/lang/Object;
.source "MainActivity.java"

# interfaces
.implements Ljava/lang/Runnable;


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Lcom/applehut/app/MainActivity$NativeBridge;->saveFile(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V
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

    .line 465
    iput-object p1, p0, Lcom/applehut/app/MainActivity$NativeBridge$4;->this$1:Lcom/applehut/app/MainActivity$NativeBridge;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public run()V
    .locals 3

    .line 469
    :try_start_0
    new-instance v0, Landroid/content/Intent;

    const-string v1, "android.intent.action.CREATE_DOCUMENT"

    invoke-direct {v0, v1}, Landroid/content/Intent;-><init>(Ljava/lang/String;)V

    .line 470
    const-string v1, "android.intent.category.OPENABLE"

    invoke-virtual {v0, v1}, Landroid/content/Intent;->addCategory(Ljava/lang/String;)Landroid/content/Intent;

    .line 471
    iget-object v1, p0, Lcom/applehut/app/MainActivity$NativeBridge$4;->this$1:Lcom/applehut/app/MainActivity$NativeBridge;

    iget-object v1, v1, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    invoke-static {v1}, Lcom/applehut/app/MainActivity;->access$800(Lcom/applehut/app/MainActivity;)Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v0, v1}, Landroid/content/Intent;->setType(Ljava/lang/String;)Landroid/content/Intent;

    .line 472
    const-string v1, "android.intent.extra.TITLE"

    iget-object v2, p0, Lcom/applehut/app/MainActivity$NativeBridge$4;->this$1:Lcom/applehut/app/MainActivity$NativeBridge;

    iget-object v2, v2, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    invoke-static {v2}, Lcom/applehut/app/MainActivity;->access$700(Lcom/applehut/app/MainActivity;)Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v0, v1, v2}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Ljava/lang/String;)Landroid/content/Intent;

    .line 473
    iget-object v1, p0, Lcom/applehut/app/MainActivity$NativeBridge$4;->this$1:Lcom/applehut/app/MainActivity$NativeBridge;

    iget-object v1, v1, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    const/16 v2, 0x3ea

    invoke-virtual {v1, v0, v2}, Lcom/applehut/app/MainActivity;->startActivityForResult(Landroid/content/Intent;I)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 476
    goto :goto_0

    .line 474
    :catchall_0
    move-exception v0

    .line 475
    iget-object v0, p0, Lcom/applehut/app/MainActivity$NativeBridge$4;->this$1:Lcom/applehut/app/MainActivity$NativeBridge;

    iget-object v0, v0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    const-string v1, "\u65e0\u6cd5\u6253\u5f00\u4fdd\u5b58\u7a97\u53e3"

    const/4 v2, 0x0

    invoke-static {v0, v1, v2}, Landroid/widget/Toast;->makeText(Landroid/content/Context;Ljava/lang/CharSequence;I)Landroid/widget/Toast;

    move-result-object v0

    invoke-virtual {v0}, Landroid/widget/Toast;->show()V

    .line 477
    :goto_0
    return-void
.end method
