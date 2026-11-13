/**
 * datastore.js —— Apple Hut 统一数据层（v1.0 地基版）
 *
 * 设计目标：
 *   1. 桥接兼容：写入时同步到 localStorage + localforage（老代码全部读得到）
 *   2. 存量冻结：现有 14 个直调 localforage / 15 个直调 localStorage 的文件一行不动
 *   3. 增量隔离：新增业务模块只走 DataStore，不直接碰底层存储
 *   4. 类型保持：localStorage 只能存字符串，写入时在本地缓存 + localforage 保留原始类型
 *
 * 双层 API：
 *   - DataStore.getSync(key) / .setSync(key, val)  ← 同步层（localStorage 路径）
 *   - DataStore.get(key)   / .set(key, val)        ← 异步层（localforage 路径）
 *   - DataStore.bulkGet / .bulkSet / .bulkDelete   ← 批量
 *   - DataStore.subscribe(key, fn) / .unsubscribe   ← 事件订阅
 *
 * 桥接流程：
 *   DataStore.set('foo', 42)
 *     → 内存缓存更新 {foo: 42}
 *     → localStorage.setItem('foo', JSON.stringify(42))   ← 老代码同步读得到
 *     → localforage.setItem('foo', 42)                    ← 老代码异步读得到
 *     → 触发订阅者 ('change:foo', {key:'foo', value:42, source:'datastore'})
 *
 * 读取优先级（get）：
 *   内存缓存 → localforage → localStorage → defaultValue
 *
 * 读取优先级（getSync）：
 *   内存缓存 → localStorage → defaultValue
 *
 * 命名空间：window.AppCore = { datastore, events }
 */
(function (global) {
    'use strict';

    // ------------------------------------------------------------------
    // 内部状态
    // ------------------------------------------------------------------
    var memoryCache = Object.create(null);
    var subscribers = Object.create(null); // key → [fn, fn, ...]  null → 全局订阅
    var LS_PRESENCE_KEY = '__AH_DS_LS_';   // localStorage 里做"此 key 存在"的哨兵

    function getLS() { return global.localStorage; }
    function getLF() { return global.localforage; }

    // ------------------------------------------------------------------
    // 同步工具
    // ------------------------------------------------------------------
    function safeParse(s, fallback) {
        if (s === null || s === undefined) return fallback;
        try { return JSON.parse(s); }
        catch (e) { return fallback !== undefined ? fallback : s; }
    }

    function emit(key, value, source) {
        var list = subscribers[key] || [];
        var globs = subscribers[null] || [];
        var i;
        for (i = 0; i < list.length; i++) { try { list[i](key, value, source); } catch (e) { /* 吞异常，不让订阅者崩影响其他 */ } }
        for (i = 0; i < globs.length; i++) { try { globs[i](key, value, source); } catch (e) {} }
    }

    function writeSync(key, value) {
        // 始终写 localStorage（老代码同步读得到）
        try {
            getLS().setItem(key, JSON.stringify(value));
        } catch (e) { /* quota 满、隐私模式等静默失败 */ }
        // 写一个哨兵标记，getSync 可以区分 null(存在但值为null) vs undefined(不存在)
        try {
            getLS().setItem(LS_PRESENCE_KEY + key, '1');
        } catch (e2) {}
    }

    function readSync(key) {
        var sentinelKey = LS_PRESENCE_KEY + key;
        // 有哨兵 → 说明 DataStore 写过这个 key（哪怕值本身是 null）
        var raw;
        try { raw = getLS().getItem(key); } catch (e) { return undefined; }
        if (raw === null) {
            // 可能压根没写过，也可能值就是 null —— 用哨兵判断
            try {
                if (getLS().getItem(sentinelKey) !== null) return null;
            } catch (e2) {}
            return undefined;
        }
        return safeParse(raw, undefined);
    }

    // ------------------------------------------------------------------
    // 公开 API
    // ------------------------------------------------------------------
    var DataStore = {
        // ---------- 同步层 ----------
        getSync: function (key, defaultValue) {
            if (key == null) return defaultValue;
            // 1. 内存缓存（最高优先级，保留原始类型）
            if (Object.prototype.hasOwnProperty.call(memoryCache, key)) return memoryCache[key];
            // 2. localStorage
            var v = readSync(key);
            if (v !== undefined) {
                memoryCache[key] = v;
                return v;
            }
            return defaultValue;
        },

        setSync: function (key, value) {
            if (key == null) return value;
            memoryCache[key] = value;
            writeSync(key, value);
            emit(key, value, 'datastore-sync');
            return value;
        },

        deleteSync: function (key) {
            if (key == null) return;
            delete memoryCache[key];
            try { getLS().removeItem(key); } catch (e) {}
            try { getLS().removeItem(LS_PRESENCE_KEY + key); } catch (e) {}
            emit(key, undefined, 'datastore-delete-sync');
        },

        // ---------- 异步层（localforage 路径）----------
        get: async function (key, defaultValue) {
            if (key == null) return defaultValue;
            // 1. 内存缓存
            if (Object.prototype.hasOwnProperty.call(memoryCache, key)) return memoryCache[key];
            // 2. localforage（异步，优先，保留原始类型）
            try {
                var lf = getLF();
                if (lf && typeof lf.getItem === 'function') {
                    var v = await lf.getItem(key);
                    if (v !== null && v !== undefined) {
                        memoryCache[key] = v;
                        return v;
                    }
                }
            } catch (e) { /* localforage 不可用 → 降级到 localStorage */ }
            // 3. localStorage 降级
            var lsVal = readSync(key);
            if (lsVal !== undefined) {
                memoryCache[key] = lsVal;
                return lsVal;
            }
            return defaultValue;
        },

        set: async function (key, value) {
            if (key == null) return value;
            memoryCache[key] = value;
            // 同步写 localStorage（老代码读得到）
            writeSync(key, value);
            // 异步写 localforage（老代码异步读得到）
            try {
                var lf = getLF();
                if (lf && typeof lf.setItem === 'function') {
                    await lf.setItem(key, value);
                }
            } catch (e) { /* 静默，localStorage 那边已经成功了 */ }
            emit(key, value, 'datastore');
            return value;
        },

        delete: async function (key) {
            if (key == null) return;
            delete memoryCache[key];
            try { getLS().removeItem(key); } catch (e) {}
            try { getLS().removeItem(LS_PRESENCE_KEY + key); } catch (e) {}
            try {
                var lf = getLF();
                if (lf && typeof lf.removeItem === 'function') await lf.removeItem(key);
            } catch (e) {}
            emit(key, undefined, 'datastore-delete');
        },

        // ---------- 批量 ----------
        bulkGet: async function (keys, defaultValue) {
            var out = {};
            if (!keys || !keys.length) return out;
            // 优先用 localforage.keys + multiGet（如果有的话），否则并发逐个 get
            var lf = getLF();
            if (lf && typeof lf.multiGet === 'function') {
                try {
                    var pairs = await lf.multiGet(keys);
                    for (var i = 0; i < pairs.length; i++) {
                        var k = pairs[i][0], v = pairs[i][1];
                        out[k] = (v === null || v === undefined) ? defaultValue : v;
                        if (out[k] !== defaultValue) memoryCache[k] = out[k];
                    }
                    return out;
                } catch (e) { /* 降级 */ }
            }
            // 逐个 get
            for (var j = 0; j < keys.length; j++) {
                out[keys[j]] = await DataStore.get(keys[j], defaultValue);
            }
            return out;
        },

        bulkSet: async function (entries) {
            if (!entries || !entries.length) return;
            var lf = getLF();
            // localStorage 逐个同步写
            for (var i = 0; i < entries.length; i++) {
                var key = entries[i].key, value = entries[i].value;
                if (key == null) continue;
                memoryCache[key] = value;
                writeSync(key, value);
                emit(key, value, 'datastore-bulk');
            }
            // localforage 批量或逐个异步写
            try {
                if (lf && typeof lf.multiSet === 'function') {
                    await lf.multiSet(entries.map(function (e) { return [e.key, e.value]; }));
                } else if (lf && typeof lf.setItem === 'function') {
                    await Promise.all(entries.map(function (e) { return lf.setItem(e.key, e.value); }));
                }
            } catch (e) {}
        },

        bulkDelete: async function (keys) {
            if (!keys || !keys.length) return;
            for (var i = 0; i < keys.length; i++) {
                delete memoryCache[keys[i]];
                try { getLS().removeItem(keys[i]); } catch (e) {}
                try { getLS().removeItem(LS_PRESENCE_KEY + keys[i]); } catch (e) {}
                emit(keys[i], undefined, 'datastore-bulk-delete');
            }
            try {
                var lf = getLF();
                if (lf && typeof lf.multiRemove === 'function') {
                    await lf.multiRemove(keys);
                } else if (lf && typeof lf.removeItem === 'function') {
                    await Promise.all(keys.map(function (k) { return lf.removeItem(k); }));
                }
            } catch (e) {}
        },

        // ---------- 订阅 ----------
        subscribe: function (key, fn) {
            if (typeof fn !== 'function') return function () {};
            if (key == null) {
                subscribers[null] = subscribers[null] || [];
                subscribers[null].push(fn);
            } else {
                subscribers[key] = subscribers[key] || [];
                subscribers[key].push(fn);
            }
            // 返回 unsubscribe
            return function () {
                var list = (key == null) ? subscribers[null] : subscribers[key];
                if (!list) return;
                var idx = list.indexOf(fn);
                if (idx >= 0) list.splice(idx, 1);
            };
        },

        unsubscribe: function (key, fn) {
            if (key == null) { subscribers[null] = []; return; }
            subscribers[key] = [];
        },

        // ---------- 内部（给 DataStore 自身调试用）----------
        _memorySnapshot: function () { return JSON.parse(JSON.stringify(memoryCache)); },
        _subscriberCount: function () {
            var n = (subscribers[null] || []).length;
            Object.keys(subscribers).forEach(function (k) { if (k !== null) n += subscribers[k].length; });
            return n;
        },

        // ---------- 从 localStorage/localforage 反向拉取（新设备 restore 后同步缓存）----------
        invalidateKey: function (key) {
            if (key != null) delete memoryCache[key];
        },

        invalidateAll: async function () {
            // 清内存缓存，下次读会从 localforage/localStorage 重新拉
            memoryCache = Object.create(null);
        }
    };

    // ------------------------------------------------------------------
    // 挂载到 AppCore 命名空间
    // ------------------------------------------------------------------
    global.AppCore = global.AppCore || {};
    global.AppCore.datastore = DataStore;

    // 便捷导出（怕有人习惯用 DataStore 直接访问）
    global.DataStore = DataStore;

})(typeof window !== 'undefined' ? window : globalThis);
