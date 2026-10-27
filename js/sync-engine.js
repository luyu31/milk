/* Apple Hut 多设备云同步引擎
 * 依赖：Supabase（免费版）+ 邮箱账号 + PostgREST
 * 设计：按数据键增量同步、HLC 时间戳、自动合并、应用云端后安全刷新
 */
(function () {
    'use strict';

    var APP = (typeof APP_PREFIX !== 'undefined') ? APP_PREFIX : 'CHAT_APP_V3_';
    var CONFIG_KEY = 'AH_SYNC_CONFIG';
    var SESSION_KEY = 'AH_SYNC_SESSION';
    var META_KEY = 'AH_SYNC_META';
    var TABLE = 'apple_hut_kv';
    var CHUNK = 8;
    var AUTO_PUSH_DELAY = 2500;
    var AUTO_PULL_INTERVAL = 30000;

    /* ---------- 基础工具 ---------- */
    function loadJson(key) {
        try {
            var raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }
    function saveJson(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
    }
    function makeDeviceId() {
        return 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }
    function clampText(v, n) {
        var s = String(v == null ? '' : v);
        return s.length > n ? s.slice(0, n) + '…' : s;
    }
    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function timeAgo(ts) {
        if (!ts) return '从未同步';
        var diff = Date.now() - ts;
        if (diff < 60000) return '刚刚同步';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前同步';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前同步';
        return new Date(ts).toLocaleString();
    }
    function toast(msg, type) {
        try {
            if (typeof showNotification === 'function') showNotification(msg, type || 'info', 3200);
        } catch (e) {}
    }
    function stableStringify(v) {
        if (v === undefined) return 'undefined';
        if (v === null) return 'null';
        var t = typeof v;
        if (t === 'number' || t === 'boolean') return String(v);
        if (t === 'string') return JSON.stringify(v);
        if (t === 'object') {
            if (v instanceof Date) return JSON.stringify(v.toISOString());
            if (Array.isArray(v)) {
                var arr = [];
                for (var i = 0; i < v.length; i++) arr.push(stableStringify(v[i]));
                return '[' + arr.join(',') + ']';
            }
            var keys = Object.keys(v).sort();
            var parts = [];
            for (var j = 0; j < keys.length; j++) {
                parts.push(JSON.stringify(keys[j]) + ':' + stableStringify(v[keys[j]]));
            }
            return '{' + parts.join(',') + '}';
        }
        return String(v);
    }

    /* ---------- 元数据 ---------- */
    var meta = loadJson(META_KEY) || {};
    if (!meta.deviceId) meta.deviceId = makeDeviceId();
    if (!meta.hlc) meta.hlc = 0;
    if (typeof meta.seq !== 'number') meta.seq = 0;
    if (!meta.dirty) meta.dirty = {};
    if (!meta.remote) meta.remote = {};
    if (typeof meta.initialized !== 'boolean') meta.initialized = false;
    if (typeof meta.auto !== 'boolean') meta.auto = true;

    var config = loadJson(CONFIG_KEY) || { url: '', anonKey: '' };
    var session = loadJson(SESSION_KEY) || null;

    function persistMeta() { saveJson(META_KEY, meta); }

    function nextTs() {
        meta.seq = (meta.seq || 0) + 1;
        var ts = Date.now() * 1000 + (meta.seq % 1000);
        if (ts <= meta.hlc) ts = meta.hlc + 1;
        meta.hlc = ts;
        return ts;
    }

    /* ---------- 同步范围 ---------- */
    var LS_EXACT = {
        'disabledReplyItems': 1,
        'disabledStickerItems': 1,
        'dg_custom_data': 1,
        'dg_status_pool': 1,
        'dg_header_bg': 1,
        'dg_overlay_bg': 1,
        'dg_overlay_bg_tint': 1,
        'immersive_mode': 1,
        'groupChatSettings': 1,
        'diviHistory_v1': 1,
        '_dgUserSalt': 1,
        'pokeSym_my': 1,
        'pokeSym_partner': 1,
        'pokeSym_my_custom': 1,
        'pokeSym_partner_custom': 1,
        'headerAlwaysClear': 1,
        'tiSettings_showAvatar': 1,
        'tiSettings_customText': 1,
        'callFeatureEnabled': 1,
        'callWindowPos': 1,
        'callWindowSize': 1,
        'callPillPos': 1,
        'keepaliveAudioEnabled': 1
    };
    var LS_PREFIXES = ['customWeather_', 'dailyFortuneNotes_'];
    var LS_EXCLUDE_PREFIXES = ['AH_SYNC', 'BACKUP_V1_', 'splashPledgeSigned', 'notifEnabled', 'dailyGreetingShown', 'exportReminderLastShown', '__'];

    function isSyncableLsKey(key) {
        if (!key) return false;
        for (var i = 0; i < LS_EXCLUDE_PREFIXES.length; i++) {
            if (key.indexOf(LS_EXCLUDE_PREFIXES[i]) === 0) return false;
        }
        if (LS_EXACT[key]) return true;
        for (var j = 0; j < LS_PREFIXES.length; j++) {
            if (key.indexOf(LS_PREFIXES[j]) === 0) return true;
        }
        return false;
    }
    function isSyncableLfKey(key) {
        if (!key) return false;
        if (key === APP + 'MIGRATION_V2_DONE') return false;
        if (key === APP + 'lastSessionId') return false;
        if (key.indexOf('AH_SYNC') === 0) return false;
        return true;
    }
    function inferStorage(key) {
        if (!key) return 'ls';
        if (key.indexOf(APP) === 0) return 'lf';
        if (key === 'callBgImageData') return 'lf';
        if (key.indexOf('gca_') === 0) return 'lf';
        return 'ls';
    }

    /* ---------- 包装存储写入，记录改动 ---------- */
    var suppressDepth = 0;
    var pushTimer = null;
    var queued = false;
    var queuedForce = false;
    var syncing = false;
    var pendingApply = false;
    var forceReloadOnce = false;
    var reloadTimer = null;
    var syncState = 'idle';
    var syncError = '';

    var _lfSet = null, _lfGet = null, _lfRemove = null, _lfKeys = null, _lfClear = null;
    var _lsSet = null, _lsGet = null, _lsRemove = null, _lsClear = null;

    function markDirty(key, storage, deleted) {
        if (!key) return;
        if (storage === 'lf' ? !isSyncableLfKey(key) : !isSyncableLsKey(key)) return;
        if (suppressDepth > 0) return;
        var t = nextTs();
        meta.dirty[key] = { t: t, s: storage, d: !!deleted };
        persistMeta();
        updateStatus();
        scheduleSync();
    }

    function scheduleSync() {
        if (!session) return;
        if (meta.auto === false) return;
        if (pushTimer) clearTimeout(pushTimer);
        pushTimer = setTimeout(function () {
            pushTimer = null;
            doSync('write');
        }, AUTO_PUSH_DELAY);
    }

    function installWrappers() {
        if (window.localforage) {
            _lfSet = localforage.setItem.bind(localforage);
            _lfGet = localforage.getItem.bind(localforage);
            _lfRemove = localforage.removeItem.bind(localforage);
            _lfKeys = localforage.keys.bind(localforage);
            _lfClear = localforage.clear.bind(localforage);

            localforage.setItem = function (key, value) {
                if (suppressDepth > 0) return _lfSet(key, value);
                return _lfGet(key).then(function (oldVal) {
                    return _lfSet(key, value).then(function () {
                        try {
                            if (stableStringify(oldVal) !== stableStringify(value)) markDirty(key, 'lf', false);
                        } catch (e) { markDirty(key, 'lf', false); }
                    });
                }, function () {
                    return _lfSet(key, value);
                });
            };
            localforage.removeItem = function (key) {
                return _lfGet(key).then(function (oldVal) {
                    return _lfRemove(key).then(function () {
                        if (oldVal !== null && oldVal !== undefined) markDirty(key, 'lf', true);
                    });
                }, function () {
                    return _lfRemove(key);
                });
            };
            localforage.clear = function () {
                return _lfKeys().then(function (keys) {
                    for (var i = 0; i < keys.length; i++) {
                        if (isSyncableLfKey(keys[i])) markDirty(keys[i], 'lf', true);
                    }
                    return _lfClear();
                }, function () {
                    return _lfClear();
                });
            };
        }

        if (window.Storage && Storage.prototype) {
            _lsSet = Storage.prototype.setItem;
            _lsGet = Storage.prototype.getItem;
            _lsRemove = Storage.prototype.removeItem;
            _lsClear = Storage.prototype.clear;

            Storage.prototype.setItem = function (key, value) {
                var oldVal = null;
                try { oldVal = _lsGet.call(this, key); } catch (e) {}
                var ret = _lsSet.call(this, key, value);
                try {
                    if (this === window.localStorage && String(oldVal) !== String(value)) {
                        markDirty(key, 'ls', false);
                    }
                } catch (e) {}
                return ret;
            };
            Storage.prototype.removeItem = function (key) {
                var oldVal = null;
                try { oldVal = _lsGet.call(this, key); } catch (e) {}
                var ret = _lsRemove.call(this, key);
                try {
                    if (this === window.localStorage && oldVal !== null) markDirty(key, 'ls', true);
                } catch (e) {}
                return ret;
            };
            Storage.prototype.clear = function () {
                if (this !== window.localStorage) return _lsClear.call(this);
                var syncKeys = [];
                var preserved = {};
                try {
                    for (var i = 0; i < this.length; i++) {
                        var k = this.key(i);
                        if (!k) continue;
                        if (k.indexOf('AH_SYNC') === 0) preserved[k] = _lsGet.call(this, k);
                        else if (isSyncableLsKey(k)) syncKeys.push(k);
                    }
                } catch (e) {}
                var ret = _lsClear.call(this);
                Object.keys(preserved).forEach(function (k) {
                    _lsSet.call(window.localStorage, k, preserved[k]);
                });
                for (var j = 0; j < syncKeys.length; j++) markDirty(syncKeys[j], 'ls', true);
                return ret;
            };
        }
    }

    /* ---------- 本地读写 ---------- */
    async function readLocalValue(key, storage) {
        try {
            if (storage === 'lf') {
                if (!_lfGet) return null;
                var v = await _lfGet(key);
                return (v === undefined) ? null : v;
            }
            return localStorage.getItem(key);
        } catch (e) { return null; }
    }

    async function writeLocal(key, storage, value, deleted) {
        suppressDepth++;
        try {
            if (storage === 'lf') {
                if (deleted) await _lfRemove(key);
                else await _lfSet(key, value);
            } else {
                if (deleted) _lsRemove.call(localStorage, key);
                else _lsSet.call(localStorage, key, typeof value === 'string' ? value : JSON.stringify(value));
            }
        } finally {
            suppressDepth--;
        }
    }

    async function collectLocalKeys() {
        var out = [];
        try {
            if (_lfKeys) {
                var keys = await _lfKeys();
                for (var i = 0; i < keys.length; i++) {
                    if (isSyncableLfKey(keys[i])) out.push({ key: keys[i], storage: 'lf' });
                }
            }
        } catch (e) {}
        try {
            for (var j = 0; j < localStorage.length; j++) {
                var k = localStorage.key(j);
                if (k && isSyncableLsKey(k)) out.push({ key: k, storage: 'ls' });
            }
        } catch (e) {}
        return out;
    }

    /* ---------- 合并算法 ---------- */
    function isPlainObject(v) {
        return !!v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date);
    }
    function unionArray(a, b) {
        var list = [];
        var seen = {};
        function add(item) {
            var key;
            if (item && typeof item === 'object' && item.id !== undefined) key = 'id:' + item.id;
            else { try { key = stableStringify(item); } catch (e) { key = String(item); } }
            if (seen[key]) return;
            seen[key] = 1;
            list.push(item);
        }
        if (Array.isArray(a)) a.forEach(add);
        if (Array.isArray(b)) b.forEach(add);
        return list;
    }
    function mergeMessages(a, b) {
        if (!Array.isArray(a)) return Array.isArray(b) ? b : a;
        if (!Array.isArray(b)) return a;
        var map = {};
        var order = [];
        function put(m) {
            if (!m || m.id === undefined) return;
            if (!map[m.id]) { map[m.id] = m; order.push(m.id); }
        }
        a.forEach(put);
        b.forEach(function (m) {
            if (!m || m.id === undefined) return;
            if (!map[m.id]) { map[m.id] = m; order.push(m.id); return; }
            var x = map[m.id];
            var z = {};
            Object.keys(x).forEach(function (k) { z[k] = x[k]; });
            Object.keys(m).forEach(function (k) { z[k] = m[k]; });
            z.favorited = !!(x.favorited || m.favorited);
            if (!m.note && x.note) z.note = x.note;
            if (!m.text && x.text) z.text = x.text;
            if (!m.image && x.image) z.image = x.image;
            map[m.id] = z;
        });
        var out = [];
        order.forEach(function (id) { out.push(map[id]); });
        out.sort(function (x, y) {
            var tx = new Date(x && x.timestamp ? x.timestamp : 0).getTime();
            var ty = new Date(y && y.timestamp ? y.timestamp : 0).getTime();
            return tx - ty;
        });
        return out;
    }
    function mergeSessionList(a, b) {
        var map = {};
        var order = [];
        function add(s) {
            if (!s || !s.id) return;
            if (!map[s.id]) { map[s.id] = s; order.push(s.id); }
        }
        if (Array.isArray(a)) a.forEach(add);
        if (Array.isArray(b)) {
            b.forEach(function (s) {
                if (!s || !s.id) return;
                if (!map[s.id]) { map[s.id] = s; order.push(s.id); return; }
                var z = {};
                Object.keys(map[s.id]).forEach(function (k) { z[k] = map[s.id][k]; });
                Object.keys(s).forEach(function (k) { z[k] = s[k]; });
                map[s.id] = z;
            });
        }
        return order.map(function (id) { return map[id]; });
    }
    function mergeValues(key, localVal, remoteVal) {
        if (/_chatMessages$/.test(key)) return mergeMessages(localVal, remoteVal);
        if (key === APP + 'sessionList') return mergeSessionList(localVal, remoteVal);
        if (key === APP + 'lastSessionId') {
            if (typeof remoteVal === 'string' && remoteVal) return remoteVal;
            return localVal;
        }
        if (Array.isArray(localVal) && Array.isArray(remoteVal)) return unionArray(localVal, remoteVal);
        if (isPlainObject(localVal) && isPlainObject(remoteVal)) {
            var out = {};
            Object.keys(localVal).forEach(function (k) { out[k] = localVal[k]; });
            Object.keys(remoteVal).forEach(function (k) { out[k] = remoteVal[k]; });
            return out;
        }
        return remoteVal;
    }

    /* ---------- 网络 ---------- */
    function apiBase() {
        return String(config.url || '').replace(/\/+$/, '');
    }
    function hasConfig() {
        return !!(config.url && config.anonKey);
    }
    function baseHeaders() {
        return { 'apikey': config.anonKey, 'Content-Type': 'application/json' };
    }
    function friendlyError(err) {
        var msg = String((err && err.message) || err || '未知错误');
        if (navigator.onLine === false) return '网络未连接，请检查网络后重试';
        if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) return '无法连接服务器，请检查网络或 Project URL';
        if (/Invalid login credentials/i.test(msg)) return '邮箱或密码错误';
        if (/Email not confirmed/i.test(msg)) return '邮箱尚未验证：请在 Supabase 关闭 Confirm email 后再登录';
        if (/User already registered/i.test(msg)) return '这个邮箱已经注册过了，请直接登录';
        if (/Password should be at least/i.test(msg)) return '密码太短，至少 6 位';
        if (/Unable to validate email/i.test(msg)) return '邮箱格式不正确';
        if (/JWT|token is expired|invalid claim/i.test(msg)) return '登录已过期，请重新登录';
        return clampText(msg, 160);
    }
    function parseResponse(res, text) {
        var data = null;
        if (text) {
            try { data = JSON.parse(text); } catch (e) { data = text; }
        }
        if (!res.ok) {
            var msg = '';
            if (data && typeof data === 'object') {
                msg = data.msg || data.message || data.error_description || data.error || data.hint || '';
            }
            if (!msg && typeof data === 'string') msg = data;
            var err = new Error(msg || ('HTTP ' + res.status));
            err.status = res.status;
            throw err;
        }
        return data;
    }
    async function authPost(path, body) {
        var res = await fetch(apiBase() + path, {
            method: 'POST',
            headers: baseHeaders(),
            body: JSON.stringify(body)
        });
        var text = await res.text();
        return parseResponse(res, text);
    }
    function storeSession(data) {
        if (!data || !data.access_token) return null;
        session = {
            access_token: data.access_token,
            refresh_token: data.refresh_token || (session && session.refresh_token) || '',
            expires_at: Date.now() + (Number(data.expires_in || 3600) * 1000),
            user: data.user || (session && session.user) || null
        };
        saveJson(SESSION_KEY, session);
        return session;
    }
    async function refreshSession() {
        if (!session || !session.refresh_token) throw new Error('登录已过期，请重新登录');
        var data = await authPost('/auth/v1/token?grant_type=refresh_token', {
            refresh_token: session.refresh_token
        });
        if (!storeSession(data)) throw new Error('登录已过期，请重新登录');
        return session;
    }
    async function ensureSession() {
        if (!session) throw new Error('请先登录');
        if (session.expires_at && Date.now() > session.expires_at - 60000) {
            await refreshSession();
        }
    }
    async function apiRequest(path, options) {
        await ensureSession();
        options = options || {};
        var headers = {};
        Object.keys(baseHeaders()).forEach(function (k) { headers[k] = baseHeaders()[k]; });
        headers['Authorization'] = 'Bearer ' + session.access_token;
        if (options.headers) {
            Object.keys(options.headers).forEach(function (k) { headers[k] = options.headers[k]; });
        }
        var res = await fetch(apiBase() + path, {
            method: options.method || 'GET',
            headers: headers,
            body: options.body
        });
        if (res.status === 401 && session && session.refresh_token) {
            await refreshSession();
            headers['Authorization'] = 'Bearer ' + session.access_token;
            res = await fetch(apiBase() + path, {
                method: options.method || 'GET',
                headers: headers,
                body: options.body
            });
        }
        var text = await res.text();
        return parseResponse(res, text);
    }
    async function pullMeta() {
        var data = await apiRequest('/rest/v1/' + TABLE + '?select=key,updated_at,device_id,deleted&limit=1000');
        return Array.isArray(data) ? data : [];
    }
    function chunk(arr, size) {
        var out = [];
        for (var i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
    }
    async function fetchValues(keys) {
        if (!keys || !keys.length) return [];
        var out = [];
        var groups = chunk(keys, CHUNK);
        for (var i = 0; i < groups.length; i++) {
            var filter = '(' + groups[i].map(function (k) {
                return 'key.eq."' + String(k).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
            }).join(',') + ')';
            var params = new URLSearchParams();
            params.set('select', 'key,value,updated_at,device_id,deleted');
            params.set('or', filter);
            var rows = await apiRequest('/rest/v1/' + TABLE + '?' + params.toString());
            if (Array.isArray(rows)) out = out.concat(rows);
        }
        return out;
    }
    function makeRow(key, ts, value, deleted, storage) {
        return {
            user_id: session && session.user ? session.user.id : null,
            key: key,
            value: deleted ? null : value,
            updated_at: ts,
            device_id: meta.deviceId,
            deleted: !!deleted,
            __storage: storage || inferStorage(key)
        };
    }
    async function pushRows(rows) {
        if (!rows || !rows.length) return;
        var payload = rows.map(function (r) {
            return {
                user_id: r.user_id,
                key: r.key,
                value: r.value,
                updated_at: r.updated_at,
                device_id: r.device_id,
                deleted: r.deleted
            };
        });
        await apiRequest('/rest/v1/' + TABLE + '?on_conflict=user_id,key', {
            method: 'POST',
            headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
            body: JSON.stringify(payload)
        });
    }

    /* ---------- 首次同步 / 增量同步 ---------- */
    function isLocalFresh() {
        try {
            if (typeof messages !== 'undefined' && Array.isArray(messages) && messages.length > 0) return false;
            if (typeof sessionList !== 'undefined' && Array.isArray(sessionList)) {
                if (sessionList.length > 1) return false;
                for (var i = 0; i < sessionList.length; i++) {
                    var nm = String((sessionList[i] && sessionList[i].name) || '');
                    if (nm && !/^会话\s/.test(nm)) return false;
                }
            }
            if (typeof customReplies !== 'undefined' && Array.isArray(customReplies) && customReplies.length) return false;
            if (typeof anniversaries !== 'undefined' && Array.isArray(anniversaries) && anniversaries.length) return false;
            if (typeof stickerLibrary !== 'undefined' && Array.isArray(stickerLibrary) && stickerLibrary.length) return false;
            if (typeof myStickerLibrary !== 'undefined' && Array.isArray(myStickerLibrary) && myStickerLibrary.length) return false;
            return true;
        } catch (e) { return false; }
    }
    function rowValue(vals, remoteMap, key) {
        var row = vals[key] || remoteMap[key];
        if (!row) return undefined;
        if (row.deleted) return undefined;
        if (row.value !== undefined) return row.value;
        return undefined;
    }
    async function firstSync(remoteMap, pushes) {
        var remoteKeys = Object.keys(remoteMap);
        var localKeys = await collectLocalKeys();

        // 云端为空：把本机所有可同步数据推上去
        if (!remoteKeys.length) {
            for (var i = 0; i < localKeys.length; i++) {
                var item = localKeys[i];
                var val = await readLocalValue(item.key, item.storage);
                if (val === null || val === undefined) {
                    if (meta.dirty[item.key] && meta.dirty[item.key].d) delete meta.dirty[item.key];
                    continue;
                }
                var d = meta.dirty[item.key];
                var t = d ? d.t : nextTs();
                pushes.push(makeRow(item.key, t, val, false, item.storage));
            }
            meta.initialized = true;
            persistMeta();
            return;
        }

        var fetched = await fetchValues(remoteKeys);
        var vals = {};
        fetched.forEach(function (r) { vals[r.key] = r; });
        var fresh = isLocalFresh();

        if (fresh) {
            // 新设备首次登录：云端为主，直接覆盖本机
            meta.dirty = {};
            for (var j = 0; j < remoteKeys.length; j++) {
                var key = remoteKeys[j];
                var row = vals[key] || remoteMap[key];
                if (!row) continue;
                if (row.deleted) {
                    if (key === APP + 'sessionList' || key === APP + 'lastSessionId') continue;
                    await writeLocal(key, inferStorage(key), null, true);
                } else if (row.value !== undefined) {
                    await writeLocal(key, inferStorage(key), row.value, false);
                }
                meta.remote[key] = { u: row.updated_at, d: !!row.deleted };
                pendingApply = true;
            }
            var rsl = rowValue(vals, remoteMap, APP + 'sessionList');
            var rlast = rowValue(vals, remoteMap, APP + 'lastSessionId');
            if (Array.isArray(rsl)) await writeLocal(APP + 'sessionList', 'lf', rsl, false);
            if (typeof rlast === 'string' && rlast) await writeLocal(APP + 'lastSessionId', 'lf', rlast, false);
            meta.initialized = true;
            persistMeta();
            return;
        }

        // 本机已有数据：自动合并
        var localMap = {};
        localKeys.forEach(function (x) { localMap[x.key] = x; });

        var localSL = await readLocalValue(APP + 'sessionList', 'lf');
        var remoteSL = rowValue(vals, remoteMap, APP + 'sessionList');
        var mergedSL = mergeSessionList(Array.isArray(localSL) ? localSL : [], Array.isArray(remoteSL) ? remoteSL : []);
        if (mergedSL.length) {
            await writeLocal(APP + 'sessionList', 'lf', mergedSL, false);
            var tSL = nextTs();
            meta.dirty[APP + 'sessionList'] = { t: tSL, s: 'lf', d: false };
            pushes.push(makeRow(APP + 'sessionList', tSL, mergedSL, false, 'lf'));
            meta.remote[APP + 'sessionList'] = { u: remoteMap[APP + 'sessionList'] ? remoteMap[APP + 'sessionList'].updated_at : 0, d: false };
            pendingApply = true;
        }
        var localLast = await readLocalValue(APP + 'lastSessionId', 'lf');
        var remoteLast = rowValue(vals, remoteMap, APP + 'lastSessionId');
        var targetLast = (typeof remoteLast === 'string' && mergedSL.some(function (s) { return s.id === remoteLast; }))
            ? remoteLast : localLast;
        if (typeof targetLast === 'string' && targetLast) {
            await writeLocal(APP + 'lastSessionId', 'lf', targetLast, false);
        }

        var allKeys = {};
        remoteKeys.forEach(function (k) { allKeys[k] = 1; });
        Object.keys(localMap).forEach(function (k) { allKeys[k] = 1; });

        var keys = Object.keys(allKeys);
        for (var n = 0; n < keys.length; n++) {
            var k = keys[n];
            if (k === APP + 'sessionList' || k === APP + 'lastSessionId') continue;
            var lfInfo = localMap[k];
            var remoteRow = vals[k] || remoteMap[k];
            var hasRemoteValue = !!(remoteRow && !remoteRow.deleted && remoteRow.value !== undefined);
            var localVal = lfInfo ? await readLocalValue(k, lfInfo.storage) : null;
            var hasLocalValue = !!(lfInfo && localVal !== null && localVal !== undefined);

            if (hasRemoteValue && hasLocalValue) {
                var merged = mergeValues(k, localVal, remoteRow.value);
                await writeLocal(k, lfInfo.storage, merged, false);
                var tm = nextTs();
                meta.dirty[k] = { t: tm, s: lfInfo.storage, d: false };
                pushes.push(makeRow(k, tm, merged, false, lfInfo.storage));
                meta.remote[k] = { u: remoteRow.updated_at, d: false };
                pendingApply = true;
            } else if (hasRemoteValue && !hasLocalValue) {
                await writeLocal(k, inferStorage(k), remoteRow.value, false);
                meta.remote[k] = { u: remoteRow.updated_at, d: false };
                pendingApply = true;
            } else if (remoteRow && remoteRow.deleted && hasLocalValue) {
                // 云端删除了、本机仍有：保留本机并重新上传（避免误删）
                var td = nextTs();
                meta.dirty[k] = { t: td, s: lfInfo.storage, d: false };
                pushes.push(makeRow(k, td, localVal, false, lfInfo.storage));
                meta.remote[k] = { u: remoteRow.updated_at, d: true };
            } else if (remoteRow && remoteRow.deleted && !hasLocalValue) {
                meta.remote[k] = { u: remoteRow.updated_at, d: true };
            } else if (!remoteRow && hasLocalValue) {
                var tu = nextTs();
                meta.dirty[k] = { t: tu, s: lfInfo.storage, d: false };
                pushes.push(makeRow(k, tu, localVal, false, lfInfo.storage));
            }
        }
        meta.initialized = true;
        persistMeta();
    }

    async function applyRemote(key, row, vals) {
        if (!row) return;
        if (row.deleted) {
            if (key === APP + 'sessionList' || key === APP + 'lastSessionId') return;
            await writeLocal(key, inferStorage(key), null, true);
            return;
        }
        var value = row.value;
        if (value === undefined && vals && vals[key] && vals[key].value !== undefined) value = vals[key].value;
        if (value === undefined) return;

        if (key === APP + 'sessionList') {
            if (Array.isArray(value)) {
                var localSL = await readLocalValue(key, 'lf');
                var merged = mergeSessionList(Array.isArray(localSL) ? localSL : [], value);
                await writeLocal(key, 'lf', merged, false);
                if (stableStringify(merged) !== stableStringify(value)) markDirty(key, 'lf', false);
            }
            return;
        }
        if (key === APP + 'lastSessionId') {
            var sl = await readLocalValue(APP + 'sessionList', 'lf');
            var ok = Array.isArray(sl) && sl.some(function (s) { return s.id === value; });
            if (ok) await writeLocal(key, 'lf', value, false);
            return;
        }
        await writeLocal(key, inferStorage(key), value, false);
    }

    async function incrementalSync(remoteMap, pushes) {
        var toFetch = [];
        Object.keys(remoteMap).forEach(function (k) {
            var r = remoteMap[k];
            var prev = meta.remote[k];
            if (!prev || r.updated_at > prev.u || !!prev.d !== !!r.deleted) toFetch.push(k);
        });
        var fetched = await fetchValues(toFetch);
        var vals = {};
        fetched.forEach(function (r) { vals[r.key] = r; });
        var handled = {};

        for (var i = 0; i < toFetch.length; i++) {
            var key = toFetch[i];
            var row = vals[key] || remoteMap[key];
            if (!row) continue;
            handled[key] = true;
            var d = meta.dirty[key];

            if (!d && row.device_id === meta.deviceId) {
                meta.remote[key] = { u: row.updated_at, d: !!row.deleted };
                continue;
            }

            if (d) {
                var prevSeen = meta.remote[key];
                var remoteChanged = !prevSeen || row.updated_at > prevSeen.u || (!!prevSeen.d !== !!row.deleted);
                if (remoteChanged) {
                    // 冲突：云端在上次同步后也变了，自动合并（与时间先后无关）
                    var localVal = d.d ? null : await readLocalValue(key, d.s);
                    if (d.d && !row.deleted) {
                        await applyRemote(key, row, vals);
                        pendingApply = true;
                    } else if (!d.d && row.deleted) {
                        await applyRemote(key, row, vals);
                        pendingApply = true;
                    } else if (!d.d && !row.deleted && row.value !== undefined) {
                        var merged = mergeValues(key, localVal, row.value);
                        await writeLocal(key, d.s, merged, false);
                        var tm = nextTs();
                        meta.dirty[key] = { t: tm, s: d.s, d: false };
                        pushes.push(makeRow(key, tm, merged, false, d.s));
                        pendingApply = true;
                    }
                } else {
                    // 本机更新更晚：推送本机
                    var lv = d.d ? null : await readLocalValue(key, d.s);
                    if (d.d || lv !== null) {
                        pushes.push(makeRow(key, d.t, d.d ? null : lv, !!d.d, d.s));
                    } else {
                        delete meta.dirty[key];
                    }
                }
                meta.remote[key] = { u: row.updated_at, d: !!row.deleted };
            } else {
                await applyRemote(key, row, vals);
                pendingApply = true;
                meta.remote[key] = { u: row.updated_at, d: !!row.deleted };
            }
        }

        var dirtyKeys = Object.keys(meta.dirty);
        for (var j = 0; j < dirtyKeys.length; j++) {
            var k = dirtyKeys[j];
            if (handled[k]) continue;
            var ent = meta.dirty[k];
            if (!ent) continue;
            var val = ent.d ? null : await readLocalValue(k, ent.s);
            if (!ent.d && (val === null || val === undefined)) {
                delete meta.dirty[k];
                continue;
            }
            pushes.push(makeRow(k, ent.t, val, !!ent.d, ent.s));
        }
    }

    /* ---------- 同步主流程 ---------- */
    async function doSync(reason, opts) {
        opts = opts || {};
        if (opts.forceReload) forceReloadOnce = true;
        if (syncing) {
            queued = true;
            if (opts.forceReload) queuedForce = true;
            return;
        }
        if (!session) { updateStatus(); return; }
        if (navigator.onLine === false) {
            syncState = 'error';
            syncError = '网络未连接';
            updateStatus();
            return;
        }
        syncing = true;
        syncState = 'syncing';
        syncError = '';
        updateStatus();
        try {
            await ensureSession();
            var rows = await pullMeta();
            var remoteMap = {};
            rows.forEach(function (r) { remoteMap[r.key] = r; });

            var pushes = [];
            if (!meta.initialized) await firstSync(remoteMap, pushes);
            else await incrementalSync(remoteMap, pushes);

            if (pushes.length) await pushRows(pushes);
            for (var i = 0; i < pushes.length; i++) {
                var p = pushes[i];
                var dirty = meta.dirty[p.key];
                if (dirty && dirty.t === p.updated_at) delete meta.dirty[p.key];
                meta.remote[p.key] = { u: p.updated_at, d: !!p.deleted };
            }
            meta.initialized = true;
            meta.lastSync = Date.now();
            persistMeta();
            syncState = 'idle';
            updateStatus();
            if (pendingApply) maybeReload();
        } catch (e) {
            syncState = 'error';
            syncError = friendlyError(e);
            if (/登录已过期/.test(syncError)) {
                session = null;
                try { localStorage.removeItem(SESSION_KEY); } catch (e2) {}
            }
            console.warn('[AppleHutSync] 同步失败:', e);
            updateStatus();
        } finally {
            syncing = false;
            if (queued) {
                var force = queuedForce;
                queued = false;
                queuedForce = false;
                setTimeout(function () { doSync('queued', { forceReload: force }); }, 800);
            }
            refreshPanelStatus();
        }
    }

    /* ---------- 安全刷新 ---------- */
    function canReloadSafely(force) {
        try {
            var ae = document.activeElement;
            if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return false;
            if (!force) {
                var modals = document.querySelectorAll('.modal');
                for (var i = 0; i < modals.length; i++) {
                    if (modals[i].id === 'ah-sync-modal') continue;
                    if (modals[i].style.display === 'flex' || modals[i].style.display === 'block') return false;
                }
                var welcome = document.getElementById('welcome-animation');
                if (welcome && !welcome.classList.contains('hidden') && welcome.style.display !== 'none') return false;
            }
            return true;
        } catch (e) { return true; }
    }
    function doReload() {
        try {
            sessionStorage.setItem('AH_SKIP_COVER', '1');
            sessionStorage.setItem('AH_SYNC_APPLIED', '1');
        } catch (e) {}
        try { location.reload(); } catch (e) {}
    }
    function maybeReload() {
        if (!pendingApply) return;
        var force = forceReloadOnce;
        forceReloadOnce = false;
        if (!force && !canReloadSafely(false)) {
            if (!reloadTimer) {
                reloadTimer = setInterval(function () {
                    if (canReloadSafely(false)) {
                        clearInterval(reloadTimer);
                        reloadTimer = null;
                        if (pendingApply) { pendingApply = false; doReload(); }
                    }
                }, 6000);
            }
            return;
        }
        if (!canReloadSafely(true)) {
            toast('云端有更新，请先完成当前输入，稍后会自动刷新', 'info');
            return;
        }
        pendingApply = false;
        closePanel();
        setTimeout(doReload, 260);
    }

    /* ---------- 状态 ---------- */
    function statusText() {
        if (!hasConfig()) return '未配置云同步，点击设置';
        if (!session) return '已配置服务器，登录后开始同步';
        var email = session.user && session.user.email ? session.user.email : '已登录';
        var dirtyCount = Object.keys(meta.dirty || {}).length;
        var tail = meta.lastSync ? timeAgo(meta.lastSync) : '等待首次同步';
        if (dirtyCount > 0) tail += ' · 待同步 ' + dirtyCount + ' 项';
        if (syncState === 'syncing') tail = '正在同步…';
        if (syncState === 'error') tail = '同步失败：' + syncError;
        return email + ' · ' + tail;
    }
    function updateStatus() {
        try {
            var el = document.getElementById('ah-sync-status-text');
            if (el) el.textContent = statusText();
        } catch (e) {}
        refreshPanelStatus();
    }

    /* ---------- 界面 ---------- */
    var editingServer = false;
    var panelMsg = '';
    var panelMsgType = 'info';
    var SCHEMA_SQL = [
        "create table if not exists public.apple_hut_kv (",
        "  user_id uuid not null references auth.users(id) on delete cascade,",
        "  key text not null,",
        "  value jsonb,",
        "  updated_at bigint not null default 0,",
        "  device_id text,",
        "  deleted boolean not null default false,",
        "  synced_at timestamptz not null default now(),",
        "  primary key (user_id, key)",
        ");",
        "create index if not exists apple_hut_kv_user_updated_idx on public.apple_hut_kv (user_id, updated_at desc);",
        "alter table public.apple_hut_kv enable row level security;",
        "alter table public.apple_hut_kv force row level security;",
        "drop policy if exists \"apple_hut_own\" on public.apple_hut_kv;",
        "create policy \"apple_hut_own\" on public.apple_hut_kv for all",
        "  using (auth.uid() = user_id) with check (auth.uid() = user_id);",
        "create or replace function public.apple_hut_touch() returns trigger language plpgsql as $$",
        "begin new.synced_at = now(); return new; end $$;",
        "drop trigger if exists apple_hut_touch on public.apple_hut_kv;",
        "create trigger apple_hut_touch before insert or update on public.apple_hut_kv",
        "for each row execute function public.apple_hut_touch();",
        "grant select, insert, update, delete on public.apple_hut_kv to authenticated;",
        "revoke all on public.apple_hut_kv from anon;"
    ].join('\n');

    function ensureModal() {
        var modal = document.getElementById('ah-sync-modal');
        if (modal) return modal;
        modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'ah-sync-modal';
        modal.innerHTML =
            '<div class="modal-content ah-sync-sheet">' +
              '<div class="ah-sync-topbar">' +
                '<div class="ah-sync-topbar-left">' +
                  '<button class="ah-sync-topbar-back" id="ah-sync-back"><i class="fas fa-arrow-left"></i></button>' +
                  '<span class="ah-sync-topbar-title">多设备同步</span>' +
                '</div>' +
                '<button class="ah-sync-topbar-close" id="ah-sync-close"><i class="fas fa-xmark"></i></button>' +
              '</div>' +
              '<div class="ah-sync-body" id="ah-sync-body"></div>' +
            '</div>';
        document.body.appendChild(modal);

        modal.addEventListener('click', function (e) {
            if (e.target === modal) closePanel();
        });
        var closeBtn = modal.querySelector('#ah-sync-close');
        if (closeBtn) closeBtn.addEventListener('click', closePanel);
        var backBtn = modal.querySelector('#ah-sync-back');
        if (backBtn) backBtn.addEventListener('click', closePanel);
        return modal;
    }

    function renderSetup(body) {
        body.innerHTML =
            '<div class="ah-sync-intro">' +
              '<div class="ah-sync-intro-icon"><i class="fas fa-cloud"></i></div>' +
              '<div><div class="ah-sync-intro-title">连接免费云端</div>' +
              '<div class="ah-sync-intro-desc">使用 Supabase 免费项目，账号密码登录，多台设备自动合并进度。</div></div>' +
            '</div>' +
            '<div class="ah-sync-field"><label>Project URL</label>' +
              '<input id="ah-sync-url" type="url" placeholder="https://xxxx.supabase.co" value="' + escapeHtml(config.url || '') + '"></div>' +
            '<div class="ah-sync-field"><label>anon public key</label>' +
              '<textarea id="ah-sync-key" rows="3" placeholder="eyJhbGciOiJIUzI1NiIs...">' + escapeHtml(config.anonKey || '') + '</textarea></div>' +
            '<button class="ah-sync-primary" id="ah-sync-save-config"><i class="fas fa-plug"></i> 保存服务器</button>' +
            (editingServer ? '<button class="ah-sync-ghost" id="ah-sync-cancel-edit">取消修改</button>' : '') +
            '<div class="ah-sync-msg" id="ah-sync-msg"></div>' +
            '<details class="ah-sync-help">' +
              '<summary><i class="fas fa-circle-question"></i> 没有服务器？三步免费开通</summary>' +
              '<ol class="ah-sync-steps">' +
                '<li>打开 <b>supabase.com</b>，注册并新建一个免费项目。</li>' +
                '<li>进入 <b>SQL Editor</b>，粘贴下方建表 SQL 并运行。</li>' +
                '<li>进入 <b>Authentication → Providers → Email</b>，关闭 <b>Confirm email</b>。</li>' +
                '<li>进入 <b>Project Settings → API</b>，复制 <b>Project URL</b> 和 <b>anon public key</b> 填到上面。</li>' +
              '</ol>' +
              '<button class="ah-sync-copy" id="ah-sync-copy-sql"><i class="fas fa-copy"></i> 复制建表 SQL</button>' +
              '<textarea class="ah-sync-sql" readonly rows="6">' + escapeHtml(SCHEMA_SQL) + '</textarea>' +
            '</details>';

        var saveBtn = body.querySelector('#ah-sync-save-config');
        if (saveBtn) saveBtn.addEventListener('click', function () {
            var url = String((body.querySelector('#ah-sync-url') || {}).value || '').trim();
            var key = String((body.querySelector('#ah-sync-key') || {}).value || '').trim();
            if (!/^https?:\/\//i.test(url)) return showPanelMsg('Project URL 需要以 https:// 开头', 'error');
            if (key.length < 20) return showPanelMsg('anon public key 看起来不完整', 'error');
            config.url = url;
            config.anonKey = key;
            saveJson(CONFIG_KEY, config);
            editingServer = false;
            panelMsg = '';
            renderPanel();
            updateStatus();
            toast('服务器已保存，请登录账号', 'success');
        });
        var copyBtn = body.querySelector('#ah-sync-copy-sql');
        if (copyBtn) copyBtn.addEventListener('click', function () { copyText(SCHEMA_SQL); });
        var cancelEdit = body.querySelector('#ah-sync-cancel-edit');
        if (cancelEdit) cancelEdit.addEventListener('click', function () {
            editingServer = false;
            renderPanel();
        });
    }

    function renderLogin(body) {
        body.innerHTML =
            '<div class="ah-sync-intro">' +
              '<div class="ah-sync-intro-icon green"><i class="fas fa-right-to-bracket"></i></div>' +
              '<div><div class="ah-sync-intro-title">登录 Apple Hut 账号</div>' +
              '<div class="ah-sync-intro-desc">同一个账号登录所有设备，进度自动保持一致。</div></div>' +
            '</div>' +
            '<div class="ah-sync-field"><label>邮箱</label>' +
              '<input id="ah-sync-email" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com"></div>' +
            '<div class="ah-sync-field"><label>密码</label>' +
              '<input id="ah-sync-password" type="password" autocomplete="current-password" placeholder="至少 6 位"></div>' +
            '<div class="ah-sync-row">' +
              '<button class="ah-sync-primary" id="ah-sync-login"><i class="fas fa-right-to-bracket"></i> 登录</button>' +
              '<button class="ah-sync-secondary" id="ah-sync-signup"><i class="fas fa-user-plus"></i> 注册</button>' +
            '</div>' +
            '<div class="ah-sync-msg" id="ah-sync-msg"></div>' +
            '<div class="ah-sync-note"><i class="fas fa-shield-halved"></i> 密码只发送给 Supabase，不会保存在 Apple Hut 的同步数据里。</div>' +
            '<button class="ah-sync-link" id="ah-sync-edit-server">修改服务器地址</button>';

        var loginBtn = body.querySelector('#ah-sync-login');
        var signupBtn = body.querySelector('#ah-sync-signup');
        function getInputs() {
            return {
                email: String((body.querySelector('#ah-sync-email') || {}).value || '').trim(),
                password: String((body.querySelector('#ah-sync-password') || {}).value || '')
            };
        }
        function setBusy(busy) {
            if (loginBtn) loginBtn.disabled = busy;
            if (signupBtn) signupBtn.disabled = busy;
        }
        loginBtn.addEventListener('click', async function () {
            var v = getInputs();
            if (!v.email || !v.password) return showPanelMsg('请填写邮箱和密码', 'error');
            setBusy(true);
            showPanelMsg('正在登录…', 'info');
            try {
                var data = await authPost('/auth/v1/token?grant_type=password', { email: v.email, password: v.password });
                if (!storeSession(data)) throw new Error('登录失败：服务器没有返回会话');
                prepareMetaForUser();
                panelMsg = '';
                renderPanel();
                updateStatus();
                toast('登录成功，正在合并云端进度…', 'success');
                doSync('login', { forceReload: true });
            } catch (e) {
                showPanelMsg(friendlyError(e), 'error');
                setBusy(false);
            }
        });
        signupBtn.addEventListener('click', async function () {
            var v = getInputs();
            if (!v.email || !v.password) return showPanelMsg('请填写邮箱和密码', 'error');
            if (v.password.length < 6) return showPanelMsg('密码至少 6 位', 'error');
            setBusy(true);
            showPanelMsg('正在注册…', 'info');
            try {
                var data = await authPost('/auth/v1/signup', { email: v.email, password: v.password });
                if (data && data.access_token) {
                    storeSession(data);
                    prepareMetaForUser();
                    panelMsg = '';
                    renderPanel();
                    updateStatus();
                    toast('注册成功，正在创建云端同步…', 'success');
                    doSync('signup', { forceReload: true });
                } else {
                    showPanelMsg('注册成功！请先到邮箱确认，或先在 Supabase 关闭 Confirm email 再登录。', 'info');
                    setBusy(false);
                }
            } catch (e) {
                showPanelMsg(friendlyError(e), 'error');
                setBusy(false);
            }
        });
        var edit = body.querySelector('#ah-sync-edit-server');
        if (edit) edit.addEventListener('click', function () {
            editingServer = true;
            renderPanel();
        });
    }

    function renderAccount(body) {
        var email = session.user && session.user.email ? session.user.email : '已登录账号';
        var dirtyCount = Object.keys(meta.dirty || {}).length;
        var autoOn = meta.auto !== false;
        body.innerHTML =
            '<div class="ah-sync-account">' +
              '<div class="ah-sync-account-avatar"><i class="fas fa-apple-whole"></i></div>' +
              '<div class="ah-sync-account-info">' +
                '<div class="ah-sync-account-email">' + escapeHtml(email) + '</div>' +
                '<div class="ah-sync-account-sub">' + escapeHtml(statusText()) + '</div>' +
              '</div>' +
              '<div class="ah-sync-dot ' + (syncState === 'error' ? 'err' : (syncState === 'syncing' ? 'busy' : 'ok')) + '"></div>' +
            '</div>' +
            '<div class="ah-sync-info-grid">' +
              '<div class="ah-sync-info-cell"><span>上次同步</span><b>' + escapeHtml(meta.lastSync ? timeAgo(meta.lastSync) : '尚未同步') + '</b></div>' +
              '<div class="ah-sync-info-cell"><span>待同步</span><b>' + dirtyCount + ' 项</b></div>' +
              '<div class="ah-sync-info-cell"><span>本机设备</span><b>' + escapeHtml(String(meta.deviceId).slice(-6)) + '</b></div>' +
            '</div>' +
            '<div class="ah-sync-actions">' +
              '<button class="ah-sync-primary" id="ah-sync-now"><i class="fas fa-rotate"></i> 立即同步</button>' +
              '<button class="ah-sync-secondary" id="ah-sync-logout"><i class="fas fa-right-from-bracket"></i> 退出登录</button>' +
            '</div>' +
            '<div class="ah-sync-toggle-row">' +
              '<div><div class="ah-sync-toggle-title">自动同步</div>' +
              '<div class="ah-sync-toggle-desc">改动后自动上传，回到前台自动拉取</div></div>' +
              '<label class="dm-toggle-pill"><input type="checkbox" id="ah-sync-auto"' + (autoOn ? ' checked' : '') + '><span class="dm-toggle-slider"></span></label>' +
            '</div>' +
            '<div class="ah-sync-msg" id="ah-sync-msg"></div>' +
            '<div class="ah-sync-note"><i class="fas fa-circle-info"></i> 两台设备都改动了同一项时会自动合并；合并完成后页面会自动刷新。</div>' +
            '<button class="ah-sync-link" id="ah-sync-edit-server">修改服务器地址</button>';

        var nowBtn = body.querySelector('#ah-sync-now');
        if (nowBtn) nowBtn.addEventListener('click', async function () {
            nowBtn.disabled = true;
            showPanelMsg('正在与云端同步…', 'info');
            updateStatus();
            await doSync('manual', { forceReload: true });
            if (document.getElementById('ah-sync-modal').style.display === 'flex') {
                refreshPanelStatus();
                if (syncState === 'error') showPanelMsg('同步失败：' + syncError, 'error');
                else showPanelMsg('同步完成', 'success');
            }
            nowBtn.disabled = false;
        });
        var logoutBtn = body.querySelector('#ah-sync-logout');
        if (logoutBtn) logoutBtn.addEventListener('click', function () {
            if (!confirm('退出登录后，本机数据会保留，但将停止自动同步。确定退出吗？')) return;
            session = null;
            try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
            syncState = 'idle';
            syncError = '';
            panelMsg = '';
            renderPanel();
            updateStatus();
            toast('已退出同步账号', 'info');
        });
        var auto = body.querySelector('#ah-sync-auto');
        if (auto) auto.addEventListener('change', function () {
            meta.auto = !!auto.checked;
            persistMeta();
            updateStatus();
            if (meta.auto) doSync('auto-on');
        });
        var edit = body.querySelector('#ah-sync-edit-server');
        if (edit) edit.addEventListener('click', function () {
            if (!confirm('修改服务器需要重新登录，本机数据会保留。继续吗？')) return;
            session = null;
            try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
            editingServer = true;
            renderPanel();
        });
    }

    function renderPanel() {
        var modal = ensureModal();
        var body = modal.querySelector('#ah-sync-body');
        if (!body) return;
        if (editingServer || !hasConfig()) renderSetup(body);
        else if (!session) renderLogin(body);
        else renderAccount(body);
        if (panelMsg) showPanelMsg(panelMsg, panelMsgType);
    }
    function showPanelMsg(msg, type) {
        panelMsg = msg;
        panelMsgType = type || 'info';
        var el = document.getElementById('ah-sync-msg');
        if (!el) return;
        el.className = 'ah-sync-msg ' + (type || 'info');
        el.innerHTML = (type === 'error' ? '<i class="fas fa-circle-exclamation"></i> ' : '') + escapeHtml(msg);
    }
    function refreshPanelStatus() {
        var modal = document.getElementById('ah-sync-modal');
        if (!modal || modal.style.display !== 'flex') return;
        var emailEl = modal.querySelector('.ah-sync-account-sub');
        if (emailEl && session) emailEl.textContent = statusText();
        var dot = modal.querySelector('.ah-sync-dot');
        if (dot) dot.className = 'ah-sync-dot ' + (syncState === 'error' ? 'err' : (syncState === 'syncing' ? 'busy' : 'ok'));
        var dirtyCell = modal.querySelectorAll('.ah-sync-info-cell b');
        if (dirtyCell && dirtyCell.length >= 2) {
            dirtyCell[0].textContent = meta.lastSync ? timeAgo(meta.lastSync) : '尚未同步';
            dirtyCell[1].textContent = Object.keys(meta.dirty || {}).length + ' 项';
        }
    }
    function openPanel() {
        editingServer = false;
        panelMsg = '';
        var modal = ensureModal();
        renderPanel();
        if (typeof showModal === 'function') showModal(modal);
        else modal.style.display = 'flex';
        updateStatus();
    }
    function closePanel() {
        var modal = document.getElementById('ah-sync-modal');
        if (!modal) return;
        if (typeof hideModal === 'function') hideModal(modal);
        else modal.style.display = 'none';
    }
    function copyText(text) {
        function fallback() {
            try {
                var ta = document.createElement('textarea');
                ta.value = text;
                ta.style.cssText = 'position:fixed;left:-9999px;top:0;';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                toast('已复制建表 SQL', 'success');
            } catch (e) { toast('复制失败，请长按手动复制', 'warning'); }
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                toast('已复制建表 SQL', 'success');
            }, fallback);
        } else fallback();
    }
    function prepareMetaForUser() {
        var uid = session && session.user ? session.user.id : null;
        if (!uid) return;
        if (meta.userId && meta.userId !== uid) {
            var deviceId = meta.deviceId || makeDeviceId();
            var auto = meta.auto !== false;
            meta = {
                deviceId: deviceId,
                hlc: 0,
                seq: 0,
                dirty: {},
                remote: {},
                initialized: false,
                lastSync: 0,
                auto: auto,
                userId: uid
            };
        } else {
            meta.userId = uid;
        }
        persistMeta();
    }

    /* ---------- 自动同步触发 ---------- */
    function ensureTimers() {
        setInterval(function () {
            if (!session || meta.auto === false) return;
            if (document.hidden) return;
            if (syncing) return;
            doSync('interval');
        }, AUTO_PULL_INTERVAL);

        document.addEventListener('visibilitychange', function () {
            if (!session || meta.auto === false) return;
            if (document.visibilityState === 'visible') doSync('resume');
            else if (Object.keys(meta.dirty || {}).length) doSync('hide');
        });
        window.addEventListener('online', function () {
            if (session) doSync('online');
        });
    }

    function boot() {
        installWrappers();
        updateStatus();
        window.addEventListener('load', function () {
            try {
                if (sessionStorage.getItem('AH_SYNC_APPLIED') === '1') {
                    sessionStorage.removeItem('AH_SYNC_APPLIED');
                    setTimeout(function () { toast('已同步云端进度', 'success'); }, 4200);
                }
            } catch (e) {}
            if (session && meta.auto !== false) {
                setTimeout(function () { doSync('startup'); }, 3500);
            }
            ensureTimers();
        });
    }

    window.AppleHutSync = {
        openPanel: openPanel,
        closePanel: closePanel,
        syncNow: function () { return doSync('manual-api', { forceReload: true }); },
        logout: function () {
            session = null;
            try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
            updateStatus();
        },
        statusText: statusText,
        isLoggedIn: function () { return !!session; },
        hasConfig: hasConfig,
        getConfig: function () { return { url: config.url, anonKey: config.anonKey }; }
    };

    boot();
})();
