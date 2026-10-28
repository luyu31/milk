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
        getInterval: getInterval,
        syncConfig: syncConfig,
        toggleEnabled: function (on) {
            if (on === undefined) on = localStorage.getItem('notifEnabled') !== '1';
            localStorage.setItem('notifEnabled', on ? '1' : '0');
            var cb = document.getElementById('notif-permission-toggle');
            if (cb) cb.checked = on;
            syncConfig();
            refreshUI();
            refreshPushBrief();
        }
    };

    /* ---------- 设置面板里的副标题状态 ---------- */
    function refreshPushBrief() {
        var el = document.getElementById('push-status-brief');
        if (!el) return;
        var enabled = localStorage.getItem('notifEnabled') === '1';
        var perm = hasPermission();
        if (!enabled) el.textContent = '后台提醒已关闭';
        else if (!perm) el.textContent = '通知权限未开启';
        else {
            var m = getInterval();
            el.textContent = '每 ' + m + ' 分钟提醒一次 · 运行中';
        }
    }

    /* ---------- 推送面板 UI ---------- */
    var PUSH_INTERVALS = [
        { v: 5,   l: '5分钟',  s: '更频繁' },
        { v: 15,  l: '15分钟', s: '适中' },
        { v: 30,  l: '30分钟', s: '推荐' },
        { v: 60,  l: '60分钟', s: '更安静' }
    ];
    var PUSH_DURATIONS = [
        { v: 6,   l: '6小时',   s: '短时段' },
        { v: 24,  l: '24小时',  s: '一整天' },
        { v: 168, l: '7天',     s: '一周' },
        { v: 0,   l: '一直',    s: '不会自动停' }
    ];

    function getDuration() {
        var v = parseInt(localStorage.getItem('AH_PUSH_DURATION'), 10);
        if (isNaN(v)) v = 0;
        return v;
    }
    function setDuration(hours) {
        localStorage.setItem('AH_PUSH_DURATION', String(hours));
    }

    function ensurePushPanel() {
        var modal = document.getElementById('ah-push-modal');
        if (modal) return modal;
        modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'ah-push-modal';
        modal.innerHTML =
            '<div class="modal-content" style="max-width:460px;">' +
              '<div class="modal-title">' +
                '<i class="fas fa-bell"></i><span>消息推送</span>' +
              '</div>' +
              '<div id="ah-push-body" style="max-height:70vh;overflow-y:auto;padding-right:4px;"></div>' +
              '<div class="modal-buttons">' +
                '<button class="modal-btn modal-btn-secondary" id="ah-push-close">关闭</button>' +
              '</div>' +
            '</div>';
        document.body.appendChild(modal);
        modal.addEventListener('click', function (e) { if (e.target === modal) closePushPanel(); });
        var closeBtn = modal.querySelector('#ah-push-close');
        if (closeBtn) closeBtn.addEventListener('click', closePushPanel);
        return modal;
    }

    function renderPushPanel() {
        var body = document.getElementById('ah-push-body');
        if (!body) return;
        var enabled = localStorage.getItem('notifEnabled') === '1';
        var perm = hasPermission();
        var interval = getInterval();
        var duration = getDuration();

        // 状态条
        var statusClass = 'push-panel-status-bar';
        var statusIcon = '';
        var statusTitle = '';
        var statusDesc = '';
        if (!enabled) {
            statusClass += ' warn';
            statusIcon = '<i class="fas fa-bell-slash"></i>';
            statusTitle = '后台提醒已关闭';
            statusDesc = '开启后，关掉 App 也会按间隔收到消息。';
        } else if (!perm) {
            statusClass += ' warn';
            statusIcon = '<i class="fas fa-triangle-exclamation"></i>';
            statusTitle = '通知权限未开启';
            statusDesc = '系统没有允许 Apple Hut 发通知，请到手机设置里打开。';
        } else {
            statusClass += ' ok';
            statusIcon = '<i class="fas fa-bell"></i>';
            statusTitle = '通知权限正常';
            var durLabel = duration === 0 ? '一直' : duration + ' 小时';
            statusDesc = '退到后台后每 ' + interval + ' 分钟提醒一次，持续 ' + durLabel + '；锁屏、清理后台、重启手机都会继续。';
        }

        // 频率 chips
        var intervalChips = PUSH_INTERVALS.map(function (it) {
            var active = it.v === interval;
            return '<button class="push-panel-chip' + (active ? ' active' : '') + '" data-int="' + it.v + '">' +
                '<div class="chip-label">' + it.l + '</div>' +
                (it.s ? '<div class="chip-sub">' + it.s + '</div>' : '') +
                '</button>';
        }).join('');

        // 时长 chips
        var durationChips = PUSH_DURATIONS.map(function (it) {
            var active = it.v === duration;
            return '<button class="push-panel-chip' + (active ? ' active' : '') + '" data-dur="' + it.v + '">' +
                '<div class="chip-label">' + it.l + '</div>' +
                (it.s ? '<div class="chip-sub">' + it.s + '</div>' : '') +
                '</button>';
        }).join('');

        // 主按钮：开启/关闭开关（大 button）
        var mainBtnHtml;
        if (!enabled) {
            mainBtnHtml = '<button class="push-panel-btn primary" id="ah-push-enable">' +
                '<i class="fas fa-toggle-on"></i> 开启后台提醒</button>' +
                '<button class="push-panel-btn secondary" id="ah-push-test">' +
                '<i class="fas fa-paper-plane"></i> 发送测试通知</button>';
        } else {
            mainBtnHtml = '<button class="push-panel-btn primary" id="ah-push-test">' +
                '<i class="fas fa-paper-plane"></i> 发送测试通知</button>' +
                '<button class="push-panel-btn secondary" id="ah-push-optimize">' +
                '<i class="fas fa-shield-halved"></i> 关闭电池优化</button>';
        }

        body.innerHTML =
            '<div class="' + statusClass + '">' +
              '<div class="pps-icon">' + statusIcon + '</div>' +
              '<div class="pps-status-text">' +
                '<div class="pps-title">' + statusTitle + '</div>' +
                '<div class="pps-desc">' + statusDesc + '</div>' +
              '</div>' +
            '</div>' +

            '<div class="push-panel-section">' +
              '<div class="push-panel-section-title">提醒频率</div>' +
              '<div class="push-panel-chip-row" id="ah-push-interval-row">' + intervalChips + '</div>' +
            '</div>' +

            '<div class="push-panel-section">' +
              '<div class="push-panel-section-title">持续时长</div>' +
              '<div class="push-panel-chip-row" id="ah-push-duration-row">' + durationChips + '</div>' +
            '</div>' +

            '<div class="push-panel-btn-row">' + mainBtnHtml + '</div>' +

            (enabled ?
                '<div class="push-panel-btn-row">' +
                  '<button class="push-panel-btn danger" id="ah-push-disable">' +
                    '<i class="fas fa-bell-slash"></i> 关闭后台提醒</button>' +
                '</div>' : '') +

            '<div class="push-panel-note">' +
              '这是本机定时提醒，不需要联网。华为 / 荣耀手机建议在「应用启动管理」里允许自启动，并关闭电池优化。' +
            '</div>';

        // 绑定
        bindPushPanelEvents();
    }

    function bindPushPanelEvents() {
        var body = document.getElementById('ah-push-body');
        if (!body) return;

        // 频率选择
        body.querySelectorAll('#ah-push-interval-row .push-panel-chip').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var v = parseInt(btn.getAttribute('data-int'), 10);
                localStorage.setItem('AH_PUSH_INTERVAL', String(v));
                syncConfig();
                refreshPushBrief();
                renderPushPanel();
                if (typeof showNotification === 'function') showNotification('推送频率已改为 ' + v + ' 分钟', 'success', 1800);
            });
        });

        // 时长选择
        body.querySelectorAll('#ah-push-duration-row .push-panel-chip').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var v = parseInt(btn.getAttribute('data-dur'), 10);
                setDuration(v);
                renderPushPanel();
                if (typeof showNotification === 'function') {
                    var label = v === 0 ? '一直' : v + ' 小时';
                    showNotification('持续时长已设为 ' + label, 'success', 1400);
                }
            });
        });

        // 开启
        var enableBtn = body.querySelector('#ah-push-enable');
        if (enableBtn) enableBtn.addEventListener('click', function () {
            localStorage.setItem('notifEnabled', '1');
            if (native) {
                try { bridge.requestNotificationPermission(); } catch (e) {}
                var tries = 0;
                var timer = setInterval(function () {
                    tries++;
                    if (hasPermission()) {
                        clearInterval(timer);
                        syncConfig();
                        refreshPushBrief();
                        renderPushPanel();
                        notify('Apple Hut 通知已开启 ✨', '后台推送已生效，关掉应用也会收到消息');
                        if (typeof showNotification === 'function') showNotification('后台提醒已开启', 'success', 1800);
                    } else if (tries > 40) {
                        clearInterval(timer);
                        localStorage.setItem('notifEnabled', '0');
                        refreshPushBrief();
                        renderPushPanel();
                        if (typeof showNotification === 'function') showNotification('系统未允许通知权限', 'error', 2200);
                    }
                }, 300);
            } else {
                syncConfig();
                refreshPushBrief();
                renderPushPanel();
                if (typeof showNotification === 'function') showNotification('后台提醒已开启（网页模式）', 'success', 1800);
            }
        });

        // 发送测试通知
        var testBtn = body.querySelector('#ah-push-test');
        if (testBtn) testBtn.addEventListener('click', function () {
            if (!native) {
                if (typeof showNotification === 'function') showNotification('仅在 App 内可发送测试通知', 'warning');
                return;
            }
            var sent = notify('Apple Hut 测试通知 ✨', '这是一条测试消息，确认后台推送已正常工作。');
            if (typeof showNotification === 'function') {
                showNotification(sent ? '测试通知已发送 ✓' : '发送失败，请检查通知权限', sent ? 'success' : 'error', 1800);
            }
        });

        // 关闭电池优化
        var optBtn = body.querySelector('#ah-push-optimize');
        if (optBtn) optBtn.addEventListener('click', function () {
            if (!native) return;
            try { bridge.openAppSettings(); } catch (e) {}
        });

        // 关闭后台提醒
        var disableBtn = body.querySelector('#ah-push-disable');
        if (disableBtn) disableBtn.addEventListener('click', function () {
            localStorage.setItem('notifEnabled', '0');
            syncConfig();
            refreshPushBrief();
            renderPushPanel();
            if (typeof showNotification === 'function') showNotification('后台提醒已关闭', 'info', 1600);
        });
    }

    window.openPushPanel = function () {
        var modal = ensurePushPanel();
        modal.style.display = 'flex';
        renderPushPanel();
        refreshPushBrief();
    };
    window.closePushPanel = function () {
        var modal = document.getElementById('ah-push-modal');
        if (modal) modal.style.display = 'none';
    };
    window.refreshPushBrief = refreshPushBrief;

    // 页面加载时更新设置面板里的副标题
    document.addEventListener('DOMContentLoaded', function () {
        refreshPushBrief();
        setTimeout(refreshPushBrief, 1500);
    });
})();
