package com.applehut.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class PushReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            if (!PushStore.isEnabled(context)) return;

            int interval = PushStore.getInterval(context);

            // 应用在前台时不打扰，直接排下一次
            if (MainActivity.isForeground) {
                PushScheduler.schedule(context, interval);
                return;
            }

            String text = PushStore.pickText(context);
            if (text == null) {
                PushScheduler.schedule(context, interval);
                return;
            }

            String partner = PushStore.getPartner(context);
            boolean posted = PushHelper.post(context, partner, text);
            if (posted) {
                PushStore.queueAdd(context, text, System.currentTimeMillis(),
                        PushStore.getSessionId(context), partner);
            }
            PushScheduler.schedule(context, interval);
        } catch (Throwable ignored) {
        }
    }
}
