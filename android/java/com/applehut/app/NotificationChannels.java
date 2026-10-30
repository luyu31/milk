package com.applehut.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;

/**
 * 通知渠道统一管理：App 启动时一次性把所有 Channel 建好。
 *
 * 注意：Channel ID 一旦在系统里创建过就是永久的，绝对不能改 ID，
 * 否则旧通知会丢失、用户设置过的开关也会失效。这里只改「名称」和「描述」。
 */
public final class NotificationChannels {

    /** 社交通讯：真实聊天消息、后台推送。高优先级、有声、震动。 */
    public static final String CHANNEL_MESSAGES = "ah_messages";

    /** 其他：后台常驻保活、测试通知等系统类通知。低优先级、无声、不可滑除。 */
    public static final String CHANNEL_OTHER = "ah_other";

    /** 通话保活：通话中挂一条保活通知，避免与后台保活通知打架。 */
    public static final String CHANNEL_CALL = "ah_call";

    private NotificationChannels() {
    }

    public static void ensureAll(Context ctx) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        try {
            if (nm.getNotificationChannel(CHANNEL_MESSAGES) == null) {
                NotificationChannel ch = new NotificationChannel(
                        CHANNEL_MESSAGES, "社交通讯", NotificationManager.IMPORTANCE_HIGH);
                ch.setDescription("对方发来的消息与后台推送");
                ch.enableVibration(true);
                ch.setShowBadge(true);
                nm.createNotificationChannel(ch);
            } else {
                // 已存在：只更新名称/描述（重要性只能由用户改，代码不能降级）
                NotificationChannel ch = nm.getNotificationChannel(CHANNEL_MESSAGES);
                if (ch != null) {
                    ch.setName("社交通讯");
                    ch.setDescription("对方发来的消息与后台推送");
                    nm.createNotificationChannel(ch);
                }
            }
        } catch (Throwable ignored) {
        }

        try {
            if (nm.getNotificationChannel(CHANNEL_OTHER) == null) {
                NotificationChannel ch = new NotificationChannel(
                        CHANNEL_OTHER, "其他", NotificationManager.IMPORTANCE_LOW);
                ch.setDescription("后台运行保活、系统提示");
                ch.setShowBadge(false);
                ch.enableVibration(false);
                ch.setSound(null, null);
                ch.setLockscreenVisibility(android.app.Notification.VISIBILITY_SECRET);
                nm.createNotificationChannel(ch);
            }
        } catch (Throwable ignored) {
        }

        try {
            if (nm.getNotificationChannel(CHANNEL_CALL) == null) {
                NotificationChannel ch = new NotificationChannel(
                        CHANNEL_CALL, "通话", NotificationManager.IMPORTANCE_HIGH);
                ch.setDescription("通话中的保活通知");
                ch.setShowBadge(false);
                nm.createNotificationChannel(ch);
            }
        } catch (Throwable ignored) {
        }
    }
}
