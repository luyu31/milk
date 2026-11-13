.class Lcom/applehut/app/MainActivity$NativeBridge$1;
.super Ljava/lang/Object;
.source "MainActivity.java"

# interfaces
.implements Ljava/lang/Runnable;


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Lcom/applehut/app/MainActivity$NativeBridge;->toast(Ljava/lang/String;)V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation


# instance fields
.field final synthetic this$1:Lcom/applehut/app/MainActivity$NativeBridge;

.field final synthetic val$message:Ljava/lang/String;


# direct methods
.method constructor <init>(Lcom/applehut/app/MainActivity$NativeBridge;Ljava/lang/String;)V
    .locals 0
    .annotation system Ldalvik/annotation/MethodParameters;
        accessFlags = {
            0x8010,
            0x1010
        }
        names = {
            null,
            null
        }
    .end annotation

    .annotation system Ldalvik/annotation/Signature;
        value = {
            "()V"
        }
    .end annotation

    .line 320
    iput-object p2, p0, Lcom/applehut/app/MainActivity$NativeBridge$1;->val$message:Ljava/lang/String;

    iput-object p1, p0, Lcom/applehut/app/MainActivity$NativeBridge$1;->this$1:Lcom/applehut/app/MainActivity$NativeBridge;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public run()V
    .locals 3

    .line 323
    iget-object v0, p0, Lcom/applehut/app/MainActivity$NativeBridge$1;->this$1:Lcom/applehut/app/MainActivity$NativeBridge;

    iget-object v0, v0, Lcom/applehut/app/MainActivity$NativeBridge;->this$0:Lcom/applehut/app/MainActivity;

    iget-object v1, p0, Lcom/applehut/app/MainActivity$NativeBridge$1;->val$message:Ljava/lang/String;

    const/4 v2, 0x0

    invoke-static {v0, v1, v2}, Landroid/widget/Toast;->makeText(Landroid/content/Context;Ljava/lang/CharSequence;I)Landroid/widget/Toast;

    move-result-object v0

    invoke-virtual {v0}, Landroid/widget/Toast;->show()V

    .line 324
    return-void
.end method
