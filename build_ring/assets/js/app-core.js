/**
 * app-core.js —— Apple Hut 应用核心命名空间（地基 v1.0）
 *
 * 设计目标：
 *   1. 命名空间隔离：window.AppCore = { state, datastore, events, perf }
 *   2. 纯壳：目前只是把 state.js 里散的裸变量**映射**到 AppCore.state（不搬迁、不改 state.js 本体）
 *   3. 后续：新业务模块只从 AppCore 读状态，老代码继续从全局 let 变量读（桥接兼容）
 *
 * 零业务逻辑，零副作用。
 */
(function (global) {
    'use strict';

    var AppCore = global.AppCore || (global.AppCore = {});

    // ------------------------------------------------------------------
    // 状态壳（目前是 accessor 映射，不存副本、不改 state.js 裸变量）
    // ------------------------------------------------------------------
    AppCore.state = {
        // —— 会话相关（state.js 里的 SESSION_ID / sessionList / messages / settings）——
        get sessionId()         { return global.SESSION_ID; },
        set sessionId(v)        { global.SESSION_ID = v; },

        get sessionList()       { return global.sessionList; },

        get currentSession()    { return global.currentSession; },
        set currentSession(v)   { global.currentSession = v; },

        // —— 消息相关 ——
        get messages()          { return global.messages; },

        get displayedCount()    { return global.displayedMessageCount; },
        set displayedCount(v)   { global.displayedMessageCount = v; },

        // —— 设置 ——
        get settings()          { return global.settings; },
        set settings(v)         { global.settings = v; },

        // —— UI 状态 ——
        get isLoadingHistory()  { return global.isLoadingHistory; },
        get isBatchMode()       { return global.isBatchMode; },

        // —— 定时任务 ——
        get autoSendTimer()     { return global.autoSendTimer; },
        set autoSendTimer(v)    { global.autoSendTimer = v; },

        get saveTimeout()       { return global.saveTimeout; },
        set saveTimeout(v)      { global.saveTimeout = v; }
    };

    // ------------------------------------------------------------------
    // 事件总线（轻量，基于 datastore.subscribe 扩展）
    // ------------------------------------------------------------------
    AppCore.events = {
        _handlers: Object.create(null),

        on: function (event, fn) {
            if (!this._handlers[event]) this._handlers[event] = [];
            this._handlers[event].push(fn);
            var self = this;
            return function () { self.off(event, fn); };
        },

        off: function (event, fn) {
            if (!this._handlers[event]) return;
            if (!fn) { this._handlers[event] = []; return; }
            var list = this._handlers[event];
            var idx = list.indexOf(fn);
            if (idx >= 0) list.splice(idx, 1);
        },

        emit: function (event, payload) {
            var list = this._handlers[event] || [];
            for (var i = 0; i < list.length; i++) {
                try { list[i](payload); } catch (e) {}
            }
            // 同时派发 DOM CustomEvent（让老代码也能监听，通过 addEventListener 进）
            try {
                if (typeof global.dispatchEvent === 'function') {
                    global.dispatchEvent(new global.CustomEvent('ah-' + event, { detail: payload }));
                }
            } catch (e2) {}
        }
    };

    // ------------------------------------------------------------------
    // 性能探针快捷入口（转发到 utils.js 里已有的 __AH_PERF__）
    // ------------------------------------------------------------------
    AppCore.perf = {
        enable:   function () { if (global.__AH_PERF__) global.__AH_PERF__.enable(); },
        disable:  function () { if (global.__AH_PERF__) global.__AH_PERF__.disable(); },
        mark:     function (name, t) { if (global.__AH_PERF__) global.__AH_PERF__.mark(name, t); },
        report:   function () { return global.__AH_PERF__ ? global.__AH_PERF__.report() : null; },
        reset:    function () { if (global.__AH_PERF__) global.__AH_PERF__.reset(); }
    };

    // ------------------------------------------------------------------
    // 版本
    // ------------------------------------------------------------------
    AppCore.version = '1.0.0';
    AppCore.builtAt = '2026-10-29';

})(typeof window !== 'undefined' ? window : globalThis);
