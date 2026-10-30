package com.applehut.app;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;

public final class PushHelper {

    public static final String CHANNEL_ID = NotificationChannels.CHANNEL_MESSAGES;
    private static final String GROUP_KEY = "ah_messages_group";
    private static final int TAP_REQUEST = 1001;

    /** 通知点击回传的 Intent extras key，MainActivity 靠这两个 key 精准跳转 */
    public static final String EXTRA_SESSION_ID = "ah_session_id";
    public static final String EXTRA_MESSAGE_ID = "ah_message_id";
    public static final String EXTRA_FROM_PUSH = "from_push";

    private PushHelper() {
    }

    public static void ensureChannel(Context ctx) {
        NotificationChannels.ensureAll(ctx);
    }

    public static boolean canNotify(Context ctx) {
        try {
            if (Build.VERSION.SDK_INT >= 33
                    && ctx.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
            if (Build.VERSION.SDK_INT >= 24) {
                NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
                return nm == null || nm.areNotificationsEnabled();
            }
            return true;
        } catch (Throwable t) {
            return false;
        }
    }

    public static boolean post(Context ctx, String title, String body) {
        return post(ctx, title, body, null, null);
    }

    /**
     * 发通知，并把 sessionId / messageId 塞进点击 Intent。
     *
     * 关键点：PendingIntent 的 requestCode 必须每条通知不同，
     * 否则 FLAG_UPDATE_CURRENT 会让所有通知共享同一份 extras，
     * 用户点旧通知会跳到最新那条消息（典型的"幽灵通知"）。
     */
    public static boolean post(Context ctx, String title, String body,
                               String sessionId, String messageId) {
        if (!canNotify(ctx)) return false;
        ensureChannel(ctx);
        try {
            int id = (int) (System.currentTimeMillis() % 1000000) + 1000;

            Intent intent = new Intent(ctx, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                    | Intent.FLAG_ACTIVITY_CLEAR_TOP
                    | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            intent.putExtra(EXTRA_FROM_PUSH, true);
            if (sessionId != null && !sessionId.isEmpty()) {
                intent.putExtra(EXTRA_SESSION_ID, sessionId);
            }
            if (messageId != null && !messageId.isEmpty()) {
                intent.putExtra(EXTRA_MESSAGE_ID, messageId);
            }
            // 每条通知带唯一的 data URI，让 PendingIntent 天然互不冲突（第二道保险）
            intent.setData(Uri.parse("ah://msg/"
                    + (messageId != null && !messageId.isEmpty() ? messageId : String.valueOf(id))));

            int piFlags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
            // requestCode 用 id，保证每条通知的 extras 独立
            PendingIntent pi = PendingIntent.getActivity(ctx, id, intent, piFlags);

            Notification.Builder builder;
            if (Build.VERSION.SDK_INT >= 26) {
                builder = new Notification.Builder(ctx, CHANNEL_ID);
            } else {
                builder = new Notification.Builder(ctx);
            }
            builder.setSmallIcon(R.drawable.ic_stat_apple)
                    .setContentTitle(title == null || title.isEmpty() ? "Apple Hut" : title)
                    .setContentText(body == null ? "" : body)
                    .setStyle(new Notification.BigTextStyle().bigText(body == null ? "" : body))
                    .setAutoCancel(true)
                    .setShowWhen(true)
                    .setWhen(System.currentTimeMillis())
                    .setPriority(Notification.PRIORITY_HIGH)
                    .setCategory(Notification.CATEGORY_MESSAGE)
                    .setColor(0xFFEE8A4F)
                    .setContentIntent(pi);
            if (Build.VERSION.SDK_INT >= 24) {
                builder.setGroup(GROUP_KEY);
            }

            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return false;
            nm.notify(id, builder.build());
            return true;
        } catch (Throwable t) {
            return false;
        }
    }

    public static void clearAll(Context ctx) {
        try {
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.cancelAll();
        } catch (Throwable ignored) {
        }
    }
}
