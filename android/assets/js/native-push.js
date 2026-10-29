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

    /* ---------- 通知点击精准跳转：localStorage 标记桥接 ----------
     *
     * 纯 JS 层方案（不改原生代码）：
     *   - 发原生通知前，把 sessionId / messageId 存进 localStorage 标记
     *   - 冷启动（JS 加载完）或热启动（visibilitychange visible）时，检查标记
     *     → 有标记且在最近 10 分钟内 → 切会话 + 定位消息 + 高亮 1.5s
     *     → 无标记或过期 → 跳过（是用户手动切回 App）
     *   - 所有 bridge 调用都 try-catch 静默降级，绝不崩溃
     */
    var PENDING_KEY = 'AH_PENDING_NOTIF';
    var PENDING_TTL_MS = 10 * 60 * 1000; // 10 分钟有效

    function writePendingClick(payload) {
        if (!payload || !payload.sessionId) return;
        try {
            localStorage.setItem(PENDING_KEY, JSON.stringify({
                sessionId: payload.sessionId,
                messageId: payload.messageId || null,
                at: Date.now()
            }));
        } catch (e) {}
    }

    function readPendingClick() {
        try {
            var raw = localStorage.getItem(PENDING_KEY);
            if (!raw) return null;
            var obj = JSON.parse(raw);
            if (!obj || !obj.sessionId) return null;
            // TTL 检查：10 分钟外的过期标记清除掉
            if (obj.at && (Date.now() - obj.at) > PENDING_TTL_MS) {
                try { localStorage.removeItem(PENDING_KEY); } catch (e) {}
                return null;
            }
            return obj;
        } catch (e) { return null; }
    }

    function clearPendingClick() {
        try { localStorage.removeItem(PENDING_KEY); } catch (e) {}
    }

    /**
     * 执行通知点击跳转：切会话 + 滚动定位 + 高亮
     * 不依赖任何原生能力，纯 DOM 操作
     */
    function doNavigateToMessage(payload) {
        if (!payload || !payload.sessionId) return false;
        var sid = payload.sessionId;
        var mid = payload.messageId;
        var navigated = false;

        try {
            // 1. 切换会话（如果当前不是目标会话）
            var currentSid = null;
            try { currentSid = (typeof SESSION_ID !== 'undefined') ? SESSION_ID : null; } catch (e) {}

            if (currentSid && currentSid !== sid) {
                // 调用 App 里已有的切换会话逻辑
                var sw = typeof window.switchSession === 'function' ? window.switchSession
                       : (typeof window.AppCore !== 'undefined' && window.AppCore.switchSession) || null;
                if (sw) {
                    try { sw(sid); navigated = true; } catch (e) { navigated = false; }
                }
            } else if (currentSid === sid) {
                navigated = true;
            }
        } catch (e) {}

        // 2. 如果 mid 有值 → 滚动定位 + 高亮
        if (mid && navigated) {
            setTimeout(function () {
                highlightAndScrollTo(mid);
            }, 350); // 给会话切换 + renderMessages 一点时间
        }

        // 3. 同时派发 AppCore.events（如果存在）
        try {
            if (window.AppCore && window.AppCore.events) {
                window.AppCore.events.emit('notification-click', payload);
            }
        } catch (e) {}

        return navigated;
    }

    function highlightAndScrollTo(messageId) {
        // 先从 DOM 里找（messageId 可能作为 data 属性）
        var node = null;
        var selectors = [
            '[data-message-id="' + messageId + '"]',
            '[data-id="' + messageId + '"]',
            '[data-msg-id="' + messageId + '"]'
        ];
        for (var i = 0; i < selectors.length && !node; i++) {
            try { node = document.querySelector(selectors[i]); } catch (e) {}
        }
        // 退一步：用 messageId 包含的内容（比如时间戳 id）匹配文本
        if (!node) {
            try {
                var allMsgs = document.querySelectorAll('[class*="message"]');
                for (var j = 0; j < allMsgs.length; j++) {
                    var el = allMsgs[j];
                    if (el.id && String(el.id).indexOf(messageId) !== -1) { node = el; break; }
                }
            } catch (e) {}
        }
        if (!node) {
            // 最后：滚动到聊天容器底部（最常见的"定位到最新消息"场景）
            try {
                var container = document.getElementById('chat-container')
                             || document.querySelector('.chat-container')
                             || document.querySelector('[class*="chat-container"]');
                if (container) container.scrollTop = container.scrollHeight;
            } catch (e) {}
            return;
        }
        try {
            node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (e) {}
        // 高亮闪烁 1.5s
        try {
            node.style.transition = 'box-shadow .15s';
            node.style.boxShadow = '0 0 0 3px rgba(var(--accent-color-rgb),.45)';
            setTimeout(function () {
                try { node.style.boxShadow = 'none'; } catch (e) {}
            }, 1500);
        } catch (e) {}
    }

    /**
     * 对外暴露：消费待投递的通知点击事件
     * 入口：冷启动后 DOMContentLoaded 调一次，热启动 visibilitychange visible 调一次
     */
    function consumePendingNotificationClick() {
        var p = readPendingClick();
        if (!p) return false;
        // 先清标记（防止递归）
        clearPendingClick();
        // 再执行跳转（内部会 emit AppCore.events）
        try { return doNavigateToMessage(p); } catch (e) { return false; }
    }

    // 全局暴露：让任何 JS 都能手动触发（比如未来原生层真能推带 payload 的 intent extras）
    window.handleNotificationClickFromStorage = consumePendingNotificationClick;
    window.AHNativePushConsumeClick = consumePendingNotificationClick;

    // 也让原生桥接层（如果未来 Java 侧补了 payload 回传）能直接调
    window.handleNotificationClick = function (sessionId, messageId) {
        return doNavigateToMessage({ sessionId: sessionId, messageId: messageId });
    };

    /* ---------- notify 增强：带 payload 写入 localStorage ---------- */
    function notify(title, body, opt) {
        opt = opt || {};
        // 兜底：没传 sessionId 但全局 SESSION_ID 有值 → 自动用
        var sid = opt.sessionId;
        var mid = opt.messageId;
        if (!sid) {
            try { sid = (typeof SESSION_ID !== 'undefined') ? SESSION_ID : null; } catch (e) { sid = null; }
        }
        // 先发通知
        var ok = false;
        try {
            if (native && hasPermission()) {
                bridge.notify(title || 'Apple Hut', body || '对方发来了消息');
                ok = true;
            }
        } catch (e) { ok = false; }
        // 无论原生通知有没有发成功，只要有 sessionId 就写标记
        // （万一 Web Notification 走 fallback，也能支持跳转）
        if (sid) {
            writePendingClick({
                sessionId: sid,
                messageId: mid || null
            });
        }
        return ok;
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
            // 同时管理持续时长计时
            (getDuration() > 0 ? markPushStarted() : clearPushStarted());
            var tries = 0;
            var timer = setInterval(function () {
                tries++;
                if (hasPermission()) {
                    clearInterval(timer);
                    if (statusEl) statusEl.textContent = '✅ 已开启 — 关掉应用也会定时收到消息';
                    notify('Apple Hut 通知已开启 ✨', '后台推送已生效，关掉应用也会收到消息');
                    syncConfig();
                    refreshUI();
                    refreshPushBrief();
                } else if (tries > 60) {
                    clearInterval(timer);
                    if (statusEl) statusEl.textContent = '❌ 系统未允许通知，请到手机设置里打开';
                    if (checkbox) checkbox.checked = false;
                    localStorage.setItem('notifEnabled', '0');
                    clearPushStarted();
                    syncConfig();
                    refreshUI();
                    refreshPushBrief();
                }
            }, 300);
        } else {
            localStorage.setItem('notifEnabled', '0');
            clearPushStarted();
            if (statusEl) statusEl.textContent = '已关闭 — 后台将不再推送';
            syncConfig();
            refreshUI();
            refreshPushBrief();
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

    /* ---------- 持续时长：到时自动关闭 ---------- */
    var DURATION_START_KEY = 'AH_PUSH_STARTED_AT';

    function markPushStarted() {
        localStorage.setItem(DURATION_START_KEY, String(Date.now()));
    }
    function clearPushStarted() {
        try { localStorage.removeItem(DURATION_START_KEY); } catch (e) {}
    }
    function checkDurationExpiry() {
        if (localStorage.getItem('notifEnabled') !== '1') return;
        var dur = getDuration();
        if (dur <= 0) return; // 0 = 一直
        var started = parseInt(localStorage.getItem(DURATION_START_KEY) || '0', 10);
        if (!started) { markPushStarted(); return; }
        var elapsed = Date.now() - started;
        var msCap = dur * 3600 * 1000;
        if (elapsed >= msCap) {
            localStorage.setItem('notifEnabled', '0');
            clearPushStarted();
            syncConfig();
            refreshUI();
            refreshPushBrief();
            if (typeof showNotification === 'function') {
                showNotification('已到达持续时长，后台提醒自动关闭', 'info', 2800);
            }
        }
    }

    /* ---------- 页面状态同步 ---------- */
    function bootSync() {
        checkDurationExpiry();
        syncConfig();
        refreshUI();
    }

    document.addEventListener('DOMContentLoaded', function () {
        bootSync();
        setTimeout(bootSync, 1500);
        setTimeout(bootSync, 6000);
        // 冷启动：如果用户之前点了通知，标记可能还在
        setTimeout(function () { try { consumePendingNotificationClick(); } catch (e) {} }, 2500);
    });
    window.addEventListener('load', bootSync);

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') syncConfig();
        else {
            bootSync();
            // 热启动：用户可能刚点了通知切回来
            try { consumePendingNotificationClick(); } catch (e) {}
        }
    });

    setInterval(function () {
        if (document.visibilityState === 'visible') {
            checkDurationExpiry();
            syncConfig();
        }
    }, 60000); // 每分钟巡检（之前是 600s 太长）

    window.AHNativePush = {
        available: native,
        hasPermission: hasPermission,
        notify: notify,
        sync: syncConfig,
        refreshUI: refreshUI,
        consumeIntoChat: consumeIntoChat,
        consumePendingNotificationClick: consumePendingNotificationClick,
        writePendingClick: writePendingClick,
        readPendingClick: readPendingClick,
        clearPendingClick: clearPendingClick,
        navigateToMessage: doNavigateToMessage,
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
                var was = getDuration();
                setDuration(v);
                // 推送已开时：切换 duration 会重置计时（给用户"重新开始计时"的直观感受）
                if (localStorage.getItem('notifEnabled') === '1') {
                    if (v > 0) markPushStarted();
                    else clearPushStarted();
                } else {
                    // 推送没开时：duration 改 0 也清掉残留的 started
                    if (v === 0) clearPushStarted();
                }
                renderPushPanel();
                if (typeof showNotification === 'function') {
                    var label = v === 0 ? '一直' : v + ' 小时';
                    showNotification('持续时长已设为 ' + label + (v > 0 && localStorage.getItem('notifEnabled') === '1' ? '，计时已重置' : ''), 'success', 1400);
                }
            });
        });

        // 开启
        var enableBtn = body.querySelector('#ah-push-enable');
        if (enableBtn) enableBtn.addEventListener('click', function () {
            localStorage.setItem('notifEnabled', '1');
            var dur = getDuration();
            if (dur > 0) markPushStarted(); else clearPushStarted();
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
                        clearPushStarted();
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
            clearPushStarted();
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
