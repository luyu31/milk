/* Apple Hut 原生后台推送桥接：Android 通知 + 定时后台消息 */
(function () {
    'use strict';

    var bridge = window.AppleHut;
    var native = !!(bridge && typeof bridge.setPushConfig === 'function'
        && typeof bridge.consumePendingMessages === 'function');

    var DEFAULT_LINES = [
        '在忙吗？突然有点想你。',
        '刚刚路过一家店，想到你了。',
        '记得喝水呀。',
        '今天也要好好吃饭。',
        '我在这里，什么时候都可以找我。',
        '有点困，但还想和你说说话。',
        '看到好看的云，想拍给你。',
        '你那边天气怎么样？',
        '别熬太晚，早点休息。',
        '今天有没有开心的事？',
        '想听你说说今天。',
        '我把想说的话攒了一点点，等你来。',
        '刚才发呆的时候，满脑子都是你。',
        '如果累了，就靠一会儿。',
        '我一直在。',
        '出门记得带伞。',
        '今天风有点大，注意保暖。',
        '突然想听你的声音。',
        '有你在的话，普通的一天也不错。',
        '不用回我，只是想说一声晚安。',
        '早呀，今天也慢慢来。',
        '想和你分享一块糖。',
        '忙完记得回来。',
        '你在我这里，永远是第一位。',
        '刚刚看到一只很可爱的小猫。'
    ];

    function getInterval() {
        var v = parseInt(localStorage.getItem('AH_PUSH_INTERVAL'), 10);
        return (v && v >= 5) ? v : 30;
    }

    function isEnabled() {
        return localStorage.getItem('notifEnabled') === '1';
    }

    function hasPermission() {
        if (!native) return false;
        try {
            return !!bridge.hasNotificationPermission();
        } catch (e) {
            return false;
        }
    }

    function buildPool() {
        var pool = [];
        try {
            if (typeof customReplies !== 'undefined' && Array.isArray(customReplies)) {
                pool = customReplies.filter(function (t) {
                    return typeof t === 'string' && t.trim();
                }).map(function (t) { return t.trim(); }).slice(0, 150);
            }
        } catch (e) {}
        if (!pool.length) pool = DEFAULT_LINES.slice();
        return pool;
    }

    function syncConfig() {
        if (!native) return;
        try {
            var partner = '对方';
            try { if (typeof settings !== 'undefined' && settings.partnerName) partner = settings.partnerName; } catch (e) {}
            var sid = '';
            try { if (typeof SESSION_ID !== 'undefined' && SESSION_ID) sid = SESSION_ID; } catch (e) {}
            bridge.setPushConfig(JSON.stringify({
                enabled: isEnabled() && hasPermission(),
                interval: getInterval(),
                partner: partner,
                sessionId: sid,
                pool: buildPool()
            }));
        } catch (e) {}
    }

    function notify(title, body) {
        if (!native || !hasPermission()) return false;
        try {
            bridge.notify(title || 'Apple Hut', body || '对方发来了消息');
            return true;
        } catch (e) {
            return false;
        }
    }

    /* ---------- 用原生通知替换 Web Notification ---------- */
    var webNotify = window._sendPartnerNotification;
    window._sendPartnerNotification = function (title, body) {
        try {
            if (localStorage.getItem('notifEnabled') !== '1') return;
            if (!document.hidden) return;
            if (native) {
                notify(title, body);
                return;
            }
        } catch (e) {}
        if (typeof webNotify === 'function') webNotify(title, body);
    };

    /* ---------- 开关：原生权限 ---------- */
    var webToggle = window.handleNotifToggle;
    window.handleNotifToggle = function (checkbox) {
        if (!native) {
            if (typeof webToggle === 'function') webToggle(checkbox);
            return;
        }
        var statusEl = document.getElementById('notif-status-text');
        if (checkbox && checkbox.checked) {
            try { bridge.requestNotificationPermission(); } catch (e) {}
            localStorage.setItem('notifEnabled', '1');
            var tries = 0;
            var timer = setInterval(function () {
                tries++;
                if (hasPermission()) {
                    clearInterval(timer);
                    if (statusEl) statusEl.textContent = '✅ 已开启 — 关掉应用也会定时收到消息';
                    notify('Apple Hut 通知已开启 ✨', '后台推送已生效，关掉应用也会收到消息');
                    syncConfig();
                    refreshUI();
                } else if (tries > 60) {
                    clearInterval(timer);
                    if (statusEl) statusEl.textContent = '❌ 系统未允许通知，请到手机设置里打开';
                    if (checkbox) checkbox.checked = false;
                    localStorage.setItem('notifEnabled', '0');
                    syncConfig();
                    refreshUI();
                }
            }, 300);
        } else {
            localStorage.setItem('notifEnabled', '0');
            if (statusEl) statusEl.textContent = '已关闭 — 后台将不再推送';
            syncConfig();
            refreshUI();
        }
    };

    /* ---------- 频率选择 ---------- */
    document.addEventListener('change', function (e) {
        if (!e.target || e.target.id !== 'notif-interval-select') return;
        var v = parseInt(e.target.value, 10) || 30;
        localStorage.setItem('AH_PUSH_INTERVAL', String(v));
        syncConfig();
        if (typeof showNotification === 'function') {
            showNotification('推送频率已改为 ' + v + ' 分钟', 'success');
        }
    });

    document.addEventListener('click', function (e) {
        if (!native || !e.target || !e.target.closest) return;
        if (e.target.closest('#notif-keepalive-row')) {
            try { bridge.openAppSettings(); } catch (err) {}
        }
    });

    function refreshUI() {
        var toggle = document.getElementById('notif-permission-toggle');
        var statusEl = document.getElementById('notif-status-text');
        var row = document.getElementById('notif-interval-row');
        var keepRow = document.getElementById('notif-keepalive-row');
        var select = document.getElementById('notif-interval-select');
        var enabled = isEnabled();
        var granted = hasPermission();
        if (toggle) toggle.checked = enabled && granted;
        if (select) select.value = String(getInterval());
        if (row) row.style.display = (enabled && granted) ? '' : 'none';
        if (keepRow) keepRow.style.display = enabled ? '' : 'none';
        if (statusEl) {
            if (enabled && granted) {
                statusEl.textContent = '✅ 已开启 — 关掉应用也会定时收到消息';
            } else if (enabled) {
                statusEl.textContent = '⚠️ 系统未允许通知，请到手机设置里打开';
            } else {
                statusEl.textContent = '关闭状态 — 开启后关掉应用也能收到消息';
            }
        }
    }

    /* ---------- 消费后台排队的消息 ---------- */
    async function consumeIntoChat() {
        if (!native) return 0;
        try {
            if (typeof SESSION_ID === 'undefined' || !SESSION_ID) return 0;
        } catch (e) {
            return 0;
        }

        var raw = '';
        try { raw = bridge.consumePendingMessages(); } catch (e) { return 0; }
        var list;
        try { list = JSON.parse(raw || '[]'); } catch (e) { return 0; }
        if (!Array.isArray(list) || !list.length) return 0;

        var partnerName = '对方';
        try { if (typeof settings !== 'undefined' && settings.partnerName) partnerName = settings.partnerName; } catch (e) {}

        var added = 0;
        var currentChanged = false;
        for (var i = 0; i < list.length; i++) {
            var item = list[i] || {};
            var text = String(item.text || '').trim();
            if (!text) continue;
            var sid = String(item.sessionId || SESSION_ID);
            var ts = parseInt(item.ts, 10) || Date.now();
            var msg = {
                id: String(ts) + '_push_' + i + '_' + Math.random().toString(36).slice(2, 6),
                sender: item.sender || partnerName,
                text: text,
                timestamp: new Date(ts),
                status: 'received',
                favorited: false,
                note: null,
                type: 'normal'
            };

            if (sid === SESSION_ID) {
                if (typeof messages === 'undefined' || !Array.isArray(messages)) continue;
                messages.push(msg);
                added++;
                currentChanged = true;
            } else {
                try {
                    var key = APP_PREFIX + sid + '_chatMessages';
                    var arr = await localforage.getItem(key);
                    if (!Array.isArray(arr)) arr = [];
                    arr.push(msg);
                    await localforage.setItem(key, arr);
                    added++;
                } catch (e) {}
            }
        }

        if (currentChanged) {
            try { if (typeof renderMessages === 'function') renderMessages(true); } catch (e) {}
            try { if (typeof throttledSaveData === 'function') throttledSaveData(); } catch (e) {}
        }
        return added;
    }

    /* ---------- 页面状态同步 ---------- */
    function bootSync() {
        syncConfig();
        refreshUI();
    }

    document.addEventListener('DOMContentLoaded', function () {
        bootSync();
        setTimeout(bootSync, 1500);
        setTimeout(bootSync, 6000);
    });
    window.addEventListener('load', bootSync);

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') syncConfig();
        else { refreshUI(); }
    });

    setInterval(function () {
        if (document.visibilityState === 'visible') syncConfig();
    }, 600000);

    window.AHNativePush = {
        available: native,
        hasPermission: hasPermission,
        notify: notify,
        sync: syncConfig,
        refreshUI: refreshUI,
        consumeIntoChat: consumeIntoChat,
        getInterval: getInterval
    };
})();
