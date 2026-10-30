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
            String sessionId = PushStore.getSessionId(context);
            // messageId 用时间戳生成，必须和 queueAdd 里写入队列的 id 一致，
            // 这样前端点通知时能靠这个 id 定位到那条消息
            long ts = System.currentTimeMillis();
            String messageId = ts + "_push_0";

            boolean posted = PushHelper.post(context, partner, text, sessionId, messageId);
            if (posted) {
                PushStore.queueAdd(context, text, ts, sessionId, partner, messageId);
            }
            PushScheduler.schedule(context, interval);
        } catch (Throwable ignored) {
        }
    }
}
