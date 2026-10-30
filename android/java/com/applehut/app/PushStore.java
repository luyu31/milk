package com.applehut.app;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

public final class PushStore {

    private static final String PREF = "ah_push";
    private static final String K_ENABLED = "enabled";
    private static final String K_INTERVAL = "interval";
    private static final String K_PARTNER = "partner";
    private static final String K_SESSION = "session";
    private static final String K_POOL = "pool";
    private static final String K_QUEUE = "queue";
    private static final String K_LAST_INDEX = "last_index";

    private PushStore() {
    }

    private static SharedPreferences sp(Context ctx) {
        return ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE);
    }

    public static void saveConfig(Context ctx, String json) {
        try {
            JSONObject o = new JSONObject(json == null ? "{}" : json);
            boolean enabled = o.optBoolean("enabled", false);
            int interval = o.optInt("interval", 30);
            if (interval < 5) interval = 5;
            String partner = o.optString("partner", "对方");
            String session = o.optString("sessionId", "");
            JSONArray pool = o.optJSONArray("pool");

            sp(ctx).edit()
                    .putBoolean(K_ENABLED, enabled)
                    .putInt(K_INTERVAL, interval)
                    .putString(K_PARTNER, partner)
                    .putString(K_SESSION, session)
                    .putString(K_POOL, pool == null ? "[]" : pool.toString())
                    .apply();

            if (enabled) {
                PushScheduler.schedule(ctx, interval);
            } else {
                PushScheduler.cancel(ctx);
            }
        } catch (Throwable ignored) {
        }
    }

    public static boolean isEnabled(Context ctx) {
        return sp(ctx).getBoolean(K_ENABLED, false);
    }

    public static int getInterval(Context ctx) {
        return Math.max(5, sp(ctx).getInt(K_INTERVAL, 30));
    }

    public static String getPartner(Context ctx) {
        return sp(ctx).getString(K_PARTNER, "对方");
    }

    public static String getSessionId(Context ctx) {
        return sp(ctx).getString(K_SESSION, "");
    }

    public static String pickText(Context ctx) {
        try {
            JSONArray pool = new JSONArray(sp(ctx).getString(K_POOL, "[]"));
            int n = pool.length();
            if (n == 0) return null;
            int last = sp(ctx).getInt(K_LAST_INDEX, -1);
            int idx = (int) (Math.random() * n);
            if (n > 1 && idx == last) idx = (idx + 1) % n;
            sp(ctx).edit().putInt(K_LAST_INDEX, idx).apply();
            String text = pool.optString(idx, "").trim();
            return text.isEmpty() ? null : text;
        } catch (Throwable t) {
            return null;
        }
    }

    public static synchronized void queueAdd(Context ctx, String text, long ts, String sessionId, String sender) {
        queueAdd(ctx, text, ts, sessionId, sender, null);
    }

    public static synchronized void queueAdd(Context ctx, String text, long ts, String sessionId,
                                             String sender, String messageId) {
        try {
            SharedPreferences prefs = sp(ctx);
            JSONArray queue = new JSONArray(prefs.getString(K_QUEUE, "[]"));
            JSONObject item = new JSONObject();
            item.put("text", text == null ? "" : text);
            item.put("ts", ts);
            item.put("sessionId", sessionId == null ? "" : sessionId);
            item.put("sender", sender == null ? "对方" : sender);
            if (messageId != null && !messageId.isEmpty()) {
                item.put("messageId", messageId);
            }
            queue.put(item);
            while (queue.length() > 10) {
                queue.remove(0);
            }
            prefs.edit().putString(K_QUEUE, queue.toString()).apply();
        } catch (Throwable ignored) {
        }
    }

    public static synchronized String consumeQueue(Context ctx) {
        try {
            SharedPreferences prefs = sp(ctx);
            String raw = prefs.getString(K_QUEUE, "[]");
            prefs.edit().putString(K_QUEUE, "[]").apply();
            return raw;
        } catch (Throwable t) {
            return "[]";
        }
    }
}
