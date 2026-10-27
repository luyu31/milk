package com.applehut.app;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

public final class PushHelper {

    public static final String CHANNEL_ID = "ah_messages";
    private static final String GROUP_KEY = "ah_messages_group";
    private static final int TAP_REQUEST = 1001;

    private PushHelper() {
    }

    public static void ensureChannel(Context ctx) {
        if (Build.VERSION.SDK_INT < 26) return;
        try {
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null || nm.getNotificationChannel(CHANNEL_ID) != null) return;
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID, "Apple Hut 消息", NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("对方发来的消息与后台推送");
            ch.enableVibration(true);
            ch.setShowBadge(true);
            nm.createNotificationChannel(ch);
        } catch (Throwable ignored) {
        }
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
        if (!canNotify(ctx)) return false;
        ensureChannel(ctx);
        try {
            Intent intent = new Intent(ctx, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                    | Intent.FLAG_ACTIVITY_CLEAR_TOP
                    | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            intent.putExtra("from_push", true);
            int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= 23) piFlags |= PendingIntent.FLAG_IMMUTABLE;
            PendingIntent pi = PendingIntent.getActivity(ctx, TAP_REQUEST, intent, piFlags);

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
            int id = (int) (System.currentTimeMillis() % 1000000) + 1000;
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
