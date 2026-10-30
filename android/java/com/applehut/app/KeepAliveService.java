package com.applehut.app;

import android.app.Notification;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;

/**
 * 后台常驻保活服务（微信式通知栏常驻）。
 *
 * 行为：
 *   - App 退到后台（Activity onPause）时拉起，通知栏挂一条不可滑除的常驻通知
 *   - App 回到前台（Activity onResume）时停止，通知自动消失
 *   - 通话中不启（通话有自己的保活通知，避免两条常驻打架）
 *
 * 系统约束：
 *   - Android 8.0+ 必须走 startForeground，5 秒内挂通知
 *   - Android 14 (API 34) 必须声明 foregroundServiceType，且需对应权限
 *   - Android 12+ 禁止从后台启动 FGS；我们从 onPause 启动（此时仍属前台态）规避限制
 */
public class KeepAliveService extends Service {

    public static final int NOTIF_ID = 99001;

    /** 当前是否在通话中（由前端通过 AppleHut.setInCall 同步过来） */
    static volatile boolean inCall = false;

    private static volatile boolean running = false;

    public static boolean isRunning() {
        return running;
    }

    public static void start(Context ctx) {
        if (inCall) return; // 通话中不启后台保活
        try {
            Intent i = new Intent(ctx, KeepAliveService.class);
            if (Build.VERSION.SDK_INT >= 26) {
                ctx.startForegroundService(i);
            } else {
                ctx.startService(i);
            }
        } catch (Throwable ignored) {
            // Android 12+ 后台启动限制 / 系统限制时静默失败，不影响主功能
            try {
                ctx.startService(new Intent(ctx, KeepAliveService.class));
            } catch (Throwable ignored2) {
            }
        }
    }

    public static void stop(Context ctx) {
        try {
            ctx.stopService(new Intent(ctx, KeepAliveService.class));
        } catch (Throwable ignored) {
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        running = true;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        NotificationChannels.ensureAll(this);
        if (inCall) {
            // 通话中：不进前台，直接退出
            stopSelf();
            return START_NOT_STICKY;
        }
        try {
            Notification n = buildNotification();
            if (Build.VERSION.SDK_INT >= 34) {
                startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
            } else {
                startForeground(NOTIF_ID, n);
            }
        } catch (Throwable t) {
            // 前台服务启动失败（权限/系统限制），静默退出
            stopSelf();
            return START_NOT_STICKY;
        }
        return START_STICKY;
    }

    private Notification buildNotification() {
        Intent open = new Intent(this, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_CLEAR_TOP
                | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) piFlags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = PendingIntent.getActivity(this, 0, open, piFlags);

        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= 26) {
            b = new Notification.Builder(this, NotificationChannels.CHANNEL_OTHER);
        } else {
            b = new Notification.Builder(this);
        }
        b.setSmallIcon(R.drawable.ic_stat_apple)
                .setContentTitle("Apple Hut 正在后台运行")
                .setContentText("保持连接，随时接收新消息")
                .setOngoing(true)                        // 不可被用户滑动清除
                .setAutoCancel(false)
                .setShowWhen(false)
                .setPriority(Notification.PRIORITY_LOW)
                .setCategory(Notification.CATEGORY_SERVICE)
                .setContentIntent(pi);
        if (Build.VERSION.SDK_INT >= 21) {
            b.setVisibility(Notification.VISIBILITY_SECRET);
        }
        return b.build();
    }

    @Override
    public void onDestroy() {
        running = false;
        try {
            stopForeground(true);
        } catch (Throwable ignored) {
        }
        super.onDestroy();
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // 用户从最近任务里划掉 App：服务已被系统杀死，这里不做事（重启由 START_STICKY 兜底）
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
