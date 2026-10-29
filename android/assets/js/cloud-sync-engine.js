/**
 * cloud-sync-engine.js —— 阿里云 OSS 云端同步状态机
 * 组合步骤1 ChatSyncData + 步骤2 OSSV4，实现完整 Push / Pull / Restore 状态机。
 *
 * 与 sync-engine.js（Supabase）共存：两个引擎独立运行，互不干扰，
 * 通过 AH_OSS_ENABLED / AH_SYNC_ENABLED 各自的开关控制。
 *
 * 状态：idle → pushing/pulling → idle | error
 * 关键锁：restoreInProgress 期间挂起所有 debounced push
 */
(function (global) {
    'use strict';

    // =========================================================================
    // 依赖 & 常量
    // =========================================================================

    var ChatSyncData = global.ChatSyncData;
    var OSSV4 = global.OSSV4;

    if (!ChatSyncData) {
        console.error('[CloudSync] sync-data-prepare.js 未加载');
    }
    if (!OSSV4) {
        console.error('[CloudSync] oss-v4.js 未加载');
    }

    var CONFIG_KEY = 'AH_OSS_CONFIG';
    var META_KEY = 'AH_OSS_META';
    var ENABLED_KEY = 'AH_OSS_ENABLED';
    var PUSH_DEBOUNCE_MS = 3000;
    var FAIL_THRESHOLD = 3;
    var OSS_PREFIX = 'sync';

    // =========================================================================
    // 本地 Meta 读写
    // =========================================================================

    function loadMeta() {
        try {
            var raw = localStorage.getItem(META_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return {
            lastPushAt: 0,
            lastPullAt: 0,
            consecutiveFails: 0,
            dirty: false,
            restoreInProgress: false,
            lastError: null
        };
    }

    function saveMeta(meta) {
        try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {}
    }

    function isEnabled() {
        try { return localStorage.getItem(ENABLED_KEY) === '1'; } catch (e) { return false; }
    }

    function loadConfig() {
        try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null'); } catch (e) { return null; }
    }

    // =========================================================================
    // 状态
    // =========================================================================

    var state = {
        phase: 'idle',          // idle | pushing | pulling | error
        restoreInProgress: false, // 恢复锁
        debounceTimer: null,
        meta: null              // 延迟初始化
    };

    function refreshMeta() { state.meta = loadMeta(); }
    refreshMeta();

    function setState(phase) {
        state.phase = phase;
        try {
            if (typeof CloudSync !== 'undefined' && CloudSync.onStateChange) {
                CloudSync.onStateChange(phase);
            }
        } catch (e) {}
    }

    // =========================================================================
    // 工具函数
    // =========================================================================

    function log() {
        console.log.apply(console, ['[CloudSync]'].concat(Array.prototype.slice.call(arguments)));
    }

    // 从 localforage 读取 session 名称（用于写 index.json）
    async function getSessionDisplayName(sessionId) {
        try {
            var list = await localforage.getItem('sessionList');
            if (Array.isArray(list)) {
                for (var i = 0; i < list.length; i++) {
                    if (list[i].id === sessionId) return list[i].name || sessionId;
                }
            }
        } catch (e) {}
        return sessionId;
    }

    // 从 index.json 里更新某个 session 的条目
    async function upsertIndex(sessionId, sessionName, timestamp) {
        var indexObj;
        try {
            var resp = await OSSV4.ossGet({ path: '/' + OSS_PREFIX + '/index.json' });
            if (resp === null) {
                indexObj = { sessions: {} };
            } else {
                indexObj = await resp.json();
                if (!indexObj || !indexObj.sessions) indexObj = { sessions: {} };
            }
        } catch (e) {
            log('读取 index.json 失败，将创建新的', e && e.message);
            indexObj = { sessions: {} };
        }

        indexObj.sessions[sessionId] = {
            sessionId: sessionId,
            name: sessionName || sessionId,
            lastSyncAt: timestamp || new Date().toISOString()
        };

        // 写回
        await OSSV4.ossPut({
            path: '/' + OSS_PREFIX + '/index.json',
            body: JSON.stringify(indexObj),
            contentType: 'application/json; charset=utf-8'
        });
        return indexObj;
    }

    // =========================================================================
    // Push 实现
    // =========================================================================

    /**
     * 触发 Push（进入 3s debounce）。
     * - 如果 restoreInProgress 锁开着：**直接跳过，不启动 debounce**
     * - 如果引擎未启用 / 未配 AK：**静默返回**
     */
    function triggerPush(delay) {
        delay = typeof delay === 'number' ? delay : PUSH_DEBOUNCE_MS;

        if (!isEnabled()) return;
        if (state.restoreInProgress) {
            log('restoreInProgress 锁开着，跳过本次 push 触发');
            // 但把 meta.dirty 设为 true，等恢复完再触发
            state.meta.dirty = true;
            saveMeta(state.meta);
            return;
        }
        if (!loadConfig()) {
            log('OSS 未配置，跳过 push');
            return;
        }

        // 标记 dirty
        state.meta.dirty = true;
        saveMeta(state.meta);

        // 清掉上一个 debounce
        if (state.debounceTimer) clearTimeout(state.debounceTimer);

        state.debounceTimer = setTimeout(function () {
            state.debounceTimer = null;
            _doPush().catch(function (e) {
                // _doPush 内部已处理错误；兜底防止 unhandled rejection
                log('push 异常:', e && e.message || e);
            });
        }, delay);
        log('push 已触发（' + delay + 'ms 防抖）');
    }

    /** 立即 push（跳过防抖，visibilitychange / 启动场景用） */
    function triggerPushNow() {
        triggerPush(0);
    }

    async function _doPush() {
        if (state.restoreInProgress) { log('restore 锁中，放弃 push'); return; }
        if (state.phase === 'pushing') { log('已在 push，跳过'); return; }
        if (!isEnabled() || !loadConfig()) return;

        setState('pushing');

        try {
            // 1. 收集
            var payload = await ChatSyncData.collectTextData();
            // 2. 清洗
            payload = ChatSyncData.sanitizeBase64Fields(payload);

            // 3. 上传每个 session
            var sessionIds = Object.keys(payload.sessions || {});
            for (var i = 0; i < sessionIds.length; i++) {
                var sid = sessionIds[i];
                var sessionPayload = {
                    appPrefix: payload.appPrefix,
                    timestamp: payload.timestamp,
                    sessionId: sid,
                    sessions: {
                        [sid]: payload.sessions[sid]
                    },
                    // globalLf + localStorage 只需要同步一次（附在第一个 session 上）
                    globalLf: (i === 0) ? payload.globalLf : undefined,
                    localStorage: (i === 0) ? payload.localStorage : undefined
                };
                var path = '/' + OSS_PREFIX + '/' + sid + '/text-data.json';
                await OSSV4.ossPut({
                    path: path,
                    body: JSON.stringify(sessionPayload),
                    contentType: 'application/json; charset=utf-8'
                });

                // 4. 更新 index.json
                var name = await getSessionDisplayName(sid);
                await upsertIndex(sid, name, new Date().toISOString());
            }

            // 5. 如果没有任何 session（空 payload），也上传一次 globalLf
            if (sessionIds.length === 0 && payload.globalLf && Object.keys(payload.globalLf).length > 0) {
                await OSSV4.ossPut({
                    path: '/' + OSS_PREFIX + '/_global/text-data.json',
                    body: JSON.stringify({
                        appPrefix: payload.appPrefix,
                        timestamp: payload.timestamp,
                        globalLf: payload.globalLf,
                        localStorage: payload.localStorage
                    }),
                    contentType: 'application/json; charset=utf-8'
                });
            }

            // 6. 更新 meta
            state.meta.lastPushAt = Date.now();
            state.meta.dirty = false;
            state.meta.consecutiveFails = 0; // 成功 → 清零
            state.meta.lastError = null;
            saveMeta(state.meta);
            setState('idle');
            log('push 完成，' + sessionIds.length + ' 个 session');
            return { ok: true, sessions: sessionIds };

        } catch (err) {
            log('push 失败:', err && err.message || err);
            state.meta.consecutiveFails = (state.meta.consecutiveFails || 0) + 1;
            state.meta.lastError = String(err && err.message || err);
            saveMeta(state.meta);
            setState('error');

            if (state.meta.consecutiveFails >= FAIL_THRESHOLD) {
                // 红点告警（fire 全局事件，UI 层可以监听）
                try {
                    global.dispatchEvent(new CustomEvent('cloud-sync-fail-threshold', {
                        detail: { fails: state.meta.consecutiveFails, error: state.meta.lastError }
                    }));
                } catch (e) {}
                log('⚠️ 连续失败 ' + state.meta.consecutiveFails + ' 次，触发红点告警');
            }

            // 状态恢复（不保持 error 太久，否则下次 triggerPushNow 会被 phase==='pushing' 挡住）
            setTimeout(function () {
                if (state.phase === 'error') setState('idle');
            }, 3000);

            return { ok: false, error: err };
        }
    }

    // =========================================================================
    // Pull 实现
    // =========================================================================

    /**
     * 检查新设备状态：拉取 index.json。
     * 返回 { ok: true, sessions: [...] } 或 { ok: false, error: ... }
     * sessions 数组供 UI 弹窗展示。
     */
    async function fetchRemoteSessions() {
        if (!isEnabled() || !loadConfig()) {
            return { ok: false, error: 'OSS 未启用或未配置' };
        }

        try {
            var resp = await OSSV4.ossGet({ path: '/' + OSS_PREFIX + '/index.json' });
            if (resp === null) {
                return { ok: true, sessions: [] }; // 云端没任何同步数据
            }
            var index = await resp.json();
            var list = [];
            if (index && index.sessions) {
                var sids = Object.keys(index.sessions);
                for (var i = 0; i < sids.length; i++) {
                    list.push(index.sessions[sids[i]]);
                }
            }
            return { ok: true, sessions: list };
        } catch (err) {
            return { ok: false, error: String(err && err.message || err) };
        }
    }

    /**
     * 拉取单个 session 的 text-data.json 并恢复到本地。
     * 设置 restoreInProgress 锁防止 push 覆盖。
     */
    async function restoreSession(sessionId) {
        if (!isEnabled() || !loadConfig()) {
            return { ok: false, error: 'OSS 未启用或未配置' };
        }

        setState('pulling');
        state.restoreInProgress = true; // 🔒 上锁
        state.meta.restoreInProgress = true;
        saveMeta(state.meta);
        log('🔒 restoreInProgress 锁开启，开始拉取 session ' + sessionId);

        // 如果有悬而未决的 debounced push，先清掉
        if (state.debounceTimer) {
            clearTimeout(state.debounceTimer);
            state.debounceTimer = null;
        }

        var restoreResult = null;

        try {
            // 1. 拉取数据
            var path = '/' + OSS_PREFIX + '/' + sessionId + '/text-data.json';
            var resp = await OSSV4.ossGet({ path: path });
            if (resp === null) {
                throw new Error('OSS 上找不到 ' + path);
            }
            var remotePayload = await resp.json();

            // 2. 拉取 global/_global（如果 payload 里没带）
            if (!remotePayload.globalLf || Object.keys(remotePayload.globalLf).length === 0) {
                try {
                    var gResp = await OSSV4.ossGet({ path: '/' + OSS_PREFIX + '/_global/text-data.json' });
                    if (gResp) {
                        var gPayload = await gResp.json();
                        if (gPayload.globalLf) remotePayload.globalLf = gPayload.globalLf;
                        if (gPayload.localStorage && !remotePayload.localStorage) {
                            remotePayload.localStorage = gPayload.localStorage;
                        }
                    }
                } catch (ge) { /* 可选，忽略 */ }
            }

            // 3. 恢复（ChatSyncData.restoreTextData 已实现逐键 try/catch）
            restoreResult = await ChatSyncData.restoreTextData(remotePayload);
            log('restore 完成：' + (restoreResult.restored || 0) + ' 键恢复，' + (restoreResult.failed || []).length + ' 键失败');

            // 4. 更新 meta
            state.meta.lastPullAt = Date.now();
            state.meta.consecutiveFails = 0;
            state.meta.lastError = null;
            state.meta.restoreInProgress = false;
            state.meta.dirty = true; // 恢复了新数据 → 标记 dirty → 下次 push 覆盖云端
            saveMeta(state.meta);

            setState('idle');
            state.restoreInProgress = false; // 🔓 解锁
            log('🔓 restoreInProgress 锁关闭');

            // 5. 解锁后立即触发一次 push（让新设备本地覆盖回云端，确保两端一致）
            //    但加 1s 延迟，等 restore 完成后所有数据都在 IndexedDB 里
            if (state.meta.dirty) {
                log('恢复后有 dirty 标记，1s 后触发 push 回云端');
                setTimeout(function () {
                    triggerPushNow();
                }, 1000);
            }

            return { ok: true, restoreResult: restoreResult };

        } catch (err) {
            log('restore 失败:', err && err.message || err);
            state.meta.lastError = String(err && err.message || err);
            state.meta.restoreInProgress = false;
            saveMeta(state.meta);
            state.restoreInProgress = false; // 🔓 出错也要解锁
            setState('error');
            setTimeout(function () { if (state.phase === 'error') setState('idle'); }, 3000);
            return { ok: false, error: err, restoreResult: restoreResult };
        }
    }

    // =========================================================================
    // Hooks：监听页面隐藏 / 启动检测
    // =========================================================================

    function installHooks() {
        try {
            // visibilitychange → 页面隐藏时立刻 push
            document.addEventListener('visibilitychange', function () {
                if (document.visibilityState === 'hidden' && isEnabled()) {
                    log('visibilitychange hidden → 触发 push');
                    triggerPushNow();
                }
            });
        } catch (e) {}

        try {
            // 启动后检查 dirty → push
            window.addEventListener('load', function () {
                setTimeout(function () {
                    refreshMeta();
                    if (state.meta.dirty && isEnabled() && !state.restoreInProgress) {
                        log('启动检测到 dirty，触发 push');
                        triggerPush(2000);
                    }
                }, 2000);
            });
        } catch (e) {}
    }

    // =========================================================================
    // 外部 API（导出）
    // =========================================================================

    var CloudSync = {
        version: 1,
        // 状态查询
        get phase() { return state.phase; },
        get restoreInProgress() { return state.restoreInProgress; },
        get meta() { return loadMeta(); },
        isEnabled: isEnabled,

        // 开关（UI 调用）
        enable: function () { localStorage.setItem(ENABLED_KEY, '1'); },
        disable: function () { localStorage.setItem(ENABLED_KEY, '0'); },

        // 配置（UI 调用）
        setConfig: function (cfg) {
            localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
        },
        getConfig: function () { return loadConfig(); },
        clearConfig: function () {
            localStorage.removeItem(CONFIG_KEY);
        },

        // Push API
        triggerPush: triggerPush,
        triggerPushNow: triggerPushNow,
        push: _doPush,            // 暴露立即 push（手动触发）

        // Pull API
        fetchRemoteSessions: fetchRemoteSessions,
        restoreSession: restoreSession,

        // 事件监听（UI 层可以订阅）
        onStateChange: null,

        // 初始化
        boot: function () {
            if (CloudSync._booted) return;
            CloudSync._booted = true;
            installHooks();
            refreshMeta();
            // 如果上次异常中断导致 restoreInProgress 没清 → 解锁
            if (state.meta.restoreInProgress) {
                log('发现上次 restoreInProgress 未清理，解锁');
                state.restoreInProgress = false;
                state.meta.restoreInProgress = false;
                saveMeta(state.meta);
            }
            log('CloudSync boot 完成');
        }
    };

    // 自动 boot（DOMContentLoaded 之后）
    try {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', CloudSync.boot);
        } else {
            CloudSync.boot();
        }
    } catch (e) {
        // Node / 非浏览器环境：手动调用
    }

    global.CloudSync = CloudSync;

})(typeof window !== 'undefined' ? window : this);
