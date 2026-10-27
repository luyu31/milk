package com.applehut.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class BootReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            String action = intent == null ? "" : intent.getAction();
            if (!Intent.ACTION_BOOT_COMPLETED.equals(action)
                    && !Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)
                    && !"android.intent.action.QUICKBOOT_POWERON".equals(action)) {
                return;
            }
            PushHelper.ensureChannel(context);
            if (PushStore.isEnabled(context)) {
                PushScheduler.schedule(context, PushStore.getInterval(context));
            }
        } catch (Throwable ignored) {
        }
    }
}
