package com.applehut.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public final class PushScheduler {

    public static final String ACTION = "com.applehut.app.PUSH_TICK";
    private static final int REQUEST_CODE = 2001;

    private PushScheduler() {
    }

    private static PendingIntent pendingIntent(Context ctx) {
        Intent intent = new Intent(ctx, PushReceiver.class);
        intent.setAction(ACTION);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(ctx, REQUEST_CODE, intent, flags);
    }

    public static void schedule(Context ctx, int minutes) {
        if (minutes <= 0) return;
        try {
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;
            PendingIntent pi = pendingIntent(ctx);
            am.cancel(pi);

            long base = Math.max(5, minutes) * 60_000L;
            long jitter = (long) (base * (0.85 + Math.random() * 0.3));
            long triggerAt = System.currentTimeMillis() + Math.max(60_000L, jitter);

            if (Build.VERSION.SDK_INT >= 23) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            } else {
                am.set(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            }
        } catch (Throwable ignored) {
            try {
                AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
                if (am != null) {
                    am.set(AlarmManager.RTC_WAKEUP,
                            System.currentTimeMillis() + Math.max(5, minutes) * 60_000L,
                            pendingIntent(ctx));
                }
            } catch (Throwable ignored2) {
            }
        }
    }

    public static void cancel(Context ctx) {
        try {
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (am != null) am.cancel(pendingIntent(ctx));
        } catch (Throwable ignored) {
        }
    }
}
