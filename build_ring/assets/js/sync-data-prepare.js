/**
 * sync-data-prepare.js —— 同步数据准备中间层
 * 独立于具体同步引擎（Supabase / OSS / P2P），只做：
 *   collectTextData()   遍历 localforage + localStorage 按分类组装快照
 *   sanitizeBase64Fields()  按策略清洗 payload 里的 data:image base64 大字段
 *   restoreTextData()      将 payload 安全写回本地存储（逐键 try/catch）
 *
 * 设计原则：
 *   - 零外部依赖，仅依赖全局 localforage / localStorage
 *   - 所有函数都是 pure-ish（collectTextData / restoreTextData 是 async IO，返回结构化 payload）
 *   - sanitizeBase64Fields 是纯函数，输入 payload → 返回清洗后的 payload
 *   - 分类常量按盘点报告硬编码，后续可增删（豁免键列表可动态传参）
 */
(function (global) {
    'use strict';

    // =========================================================================
    // 常量区（从盘点报告整理而来）
    // =========================================================================

    /** 角色独立的 localforage baseKey（带 {SESSION_ID} 前缀隔离） */
    var SESSION_NEEDLES = [
        'chatMessages',
        'chatSettings',
        'chatBackground',
        'backgroundGallery',
        'partnerAvatar',
        'myAvatar',
        'partnerPersonas',
        'showPartnerNameInChat',
        'customReplies',
        'customReplyGroups',
        'customPokes',
        'customPokeGroups',
        'customStatuses',
        'customStatusGroups',
        'customMottos',
        'customIntros',
        'customEmojis',
        'anniversaries',
        'stickerLibrary',
        'myStickerLibrary',
        'moodCalendar',
        'customMoodOptions',
        'moodTrash',
        'envelopeData',
        'pending_envelope',
        'chatAvatar',
        'chatMood',
        'chatCustomData',
        'dg_custom_data',
        'dg_status_pool',
        'dg_header_bg',
        'dg_overlay_bg',
        'dg_overlay_bg_tint',
        'pokeSym_my',
        'pokeSym_partner',
        'pokeSym_my_custom',
        'pokeSym_partner_custom',
        'headerAlwaysClear',
        'tiSettings_showAvatar',
        'tiSettings_customText',
        'callFeatureEnabled',
        'callWindowPos',
        'callWindowSize',
        'callPillPos',
        'keepaliveAudioEnabled'
    ];

    /** 全局共享的 localforage 键（不带 SESSION_ID，直接 APP_PREFIX 拼接） */
    var GLOBAL_LF = [
        'sessionList',
        'lastSessionId',
        'customThemes',
        'themeSchemes',
        'immersive_mode',
        'tiSettings_showAvatar',
        'tiSettings_customText',
        'groupChatSettings',
        'diviHistory_v1',
        '_dgUserSalt',
        'pokeSym_my',
        'pokeSym_partner',
        'pokeSym_my_custom',
        'pokeSym_partner_custom'
    ];

    /** 全局 localforage 排除列表（技术字段 / 本地临时标记） */
    var GLOBAL_LF_EXCLUDES = [
        'tour_seen',
        'MIGRATION_V2_DONE',
        'playerCover',
        'customSongs'
    ];

    /** localStorage 需要同步的键 */
    var LS_INCLUDE = [
        'notifEnabled',
        'AH_PUSH_INTERVAL',
        'AH_PUSH_DURATION',
        'disabledReplyItems',
        'disabledStickerItems',
        'dg_custom_data',
        'dg_status_pool',
        'groupChatSettings',
        'immersive_mode',
        'tiSettings_showAvatar',
        'tiSettings_customText',
        'callFeatureEnabled',
        'callWindowPos',
        'callWindowSize',
        'callPillPos',
        'keepaliveAudioEnabled',
        'pokeSym_my',
        'pokeSym_partner',
        'pokeSym_my_custom',
        'pokeSym_partner_custom',
        'headerAlwaysClear'
    ];

    /** localStorage 排除列表（临时标记 / 引擎专属配置） */
    var LS_EXCLUDES = [
        'BACKUP_V1_critical',
        'BACKUP_V1_timestamp',
        'AH_SYNC_CONFIG',
        'AH_SYNC_SESSION',
        'AH_SYNC_META',
        'AH_SYNC_CURRENT_TAB',
        'AH_SYNC_ENABLED',
        'AH_PUSH_STARTED_AT',
        'dailyGreetingShown',
        'exportReminderLastShown',
        'splashPledgeSigned',
        '__ah_perf',
        'ah_perf',
        'AH_OSS_CONFIG',
        'AH_OSS_META',
        'AH_OSS_ENABLED',
        'AH_OSS_CURRENT_TAB',
        // 任何 __ 开头的技术字段
        '__'
    ];

    /** 豁免：以下 baseKey **绝对保留 data:image base64 原图**（用户资产） */
    var BASE64_PRESERVE_NEEDLES = {
        'partnerAvatar': 1,
        'myAvatar': 1,
        'stickerLibrary': 1,
        'myStickerLibrary': 1
    };

    // =========================================================================
    // 工具函数
    // =========================================================================

    function getAppPrefix() {
        if (typeof APP_PREFIX !== 'undefined' && APP_PREFIX) return APP_PREFIX;
        try { return localStorage.getItem('APP_PREFIX') || 'CHAT_APP_V3_'; } catch (e) {}
        return 'CHAT_APP_V3_';
    }

    function isDataMediaUrl(s) {
        return typeof s === 'string' && s.length > 30 && /^data:(image|video)\//i.test(s);
    }

    function isOssRef(s) {
        return typeof s === 'string' && s.indexOf('oss://') === 0;
    }

    function deepClone(obj) {
        try { return JSON.parse(JSON.stringify(obj)); } catch (e) { return obj; }
    }

    /** 从完整 localforage 键反向解析出 { appPrefix, sessionId?, baseKey? } */
    function parseStorageKey(fullKey, appPrefix) {
        appPrefix = appPrefix || getAppPrefix();
        if (fullKey.indexOf(appPrefix) !== 0) {
            // 不是这个 App 的键，原样返回
            return { appPrefix: '', sessionId: null, baseKey: fullKey };
        }
        var rest = fullKey.slice(appPrefix.length);
        // rest 可能是： 直接 baseKey（global） 或  sessionId_baseKey（needle）
        // sessionId 是随机 hash（通常长字符串），baseKey 是驼峰英文
        var us = rest.indexOf('_');
        if (us === -1) {
            return { appPrefix: appPrefix, sessionId: null, baseKey: rest };
        }
        var first = rest.slice(0, us);
        var second = rest.slice(us + 1);
        // 启发式：如果 first 包含非 [a-zA-Z0-9_-] 的字符多，倾向于 sessionId
        // 实际上更简单：所有已知的 baseKey 都在 NEEDLES / GLOBAL_LF 里
        var knownNeedle = SESSION_NEEDLES.indexOf(second) >= 0;
        var knownGlobal = GLOBAL_LF.indexOf(second) >= 0;
        var knownBase = knownNeedle || knownGlobal || SESSION_NEEDLES.indexOf(first) >= 0;

        if (knownNeedle || knownBase) {
            // 第二部分是已知 baseKey → 第一部分是 sessionId
            return { appPrefix: appPrefix, sessionId: first, baseKey: second };
        }
        // 否则当作 global key
        return { appPrefix: appPrefix, sessionId: null, baseKey: rest };
    }

    // =========================================================================
    // collectTextData —— 遍历存储按分类组装快照
    // =========================================================================

    async function collectTextData(opts) {
        opts = opts || {};
        var appPrefix = getAppPrefix();
        var includeGLOBAL = opts.includeGLOBAL !== false;
        var includeLS = opts.includeLS !== false;
        var sessionWhitelist = opts.sessionWhitelist || null; // 可选：只拉特定 session

        var result = {
            appPrefix: appPrefix,
            timestamp: new Date().toISOString(),
            sessions: {},       // sessionId -> { localforage: {...} }
            globalLf: {},       // baseKey -> value
            localStorage: {}    // key -> value
        };

        // --- 1. 遍历 localforage ---
        if (typeof localforage === 'undefined') {
            console.warn('[sync-data-prepare] localforage 未定义');
            return result;
        }
        try {
            var allKeys = await localforage.keys();
            for (var i = 0; i < allKeys.length; i++) {
                var fk = allKeys[i];
                if (fk.indexOf(appPrefix) !== 0) continue; // 非本 App 的键跳过

                var parsed = parseStorageKey(fk, appPrefix);
                var baseKey = parsed.baseKey;

                // 排除列表里的 global 键直接跳过
                if (!parsed.sessionId && GLOBAL_LF_EXCLUDES.indexOf(baseKey) >= 0) continue;

                // 分类：needle（带 sessionId） vs global（不带）
                if (parsed.sessionId) {
                    // 只收集 SESSION_NEEDLES 里的 baseKey
                    if (SESSION_NEEDLES.indexOf(baseKey) < 0) continue;
                    if (sessionWhitelist && sessionWhitelist.indexOf(parsed.sessionId) < 0) continue;

                    if (!result.sessions[parsed.sessionId]) {
                        result.sessions[parsed.sessionId] = { localforage: {} };
                    }
                    try {
                        var v = await localforage.getItem(fk);
                        if (v !== null && v !== undefined) {
                            result.sessions[parsed.sessionId].localforage[baseKey] = deepClone(v);
                        }
                    } catch (e) {
                        console.warn('[sync-data-prepare] 读取失败', fk, e);
                    }
                } else if (includeGLOBAL) {
                    // global 键只收集 GLOBAL_LF 里的
                    if (GLOBAL_LF.indexOf(baseKey) < 0) continue;
                    try {
                        var gv = await localforage.getItem(fk);
                        if (gv !== null && gv !== undefined) {
                            result.globalLf[baseKey] = deepClone(gv);
                        }
                    } catch (e2) {
                        console.warn('[sync-data-prepare] global 读取失败', fk, e2);
                    }
                }
            }
        } catch (err) {
            console.error('[sync-data-prepare] localforage.keys 失败', err);
        }

        // --- 2. localStorage ---
        if (includeLS) {
            try {
                for (var j = 0; j < localStorage.length; j++) {
                    var lk = localStorage.key(j);
                    if (!lk) continue;
                    // 排除前缀匹配
                    var skip = false;
                    for (var e = 0; e < LS_EXCLUDES.length; e++) {
                        if (LS_EXCLUDES[e] === lk) { skip = true; break; }
                        if (LS_EXCLUDES[e].indexOf('__') === 0 && lk.indexOf(LS_EXCLUDES[e]) === 0) { skip = true; break; }
                    }
                    if (skip) continue;
                    if (LS_INCLUDE.indexOf(lk) < 0) continue; // 只收集白名单里的

                    var lv = localStorage.getItem(lk);
                    if (lv !== null) result.localStorage[lk] = lv;
                }
            } catch (err3) {
                console.error('[sync-data-prepare] localStorage 遍历失败', err3);
            }
        }

        return result;
    }

    // =========================================================================
    // sanitizeBase64Fields —— 按策略清洗 payload（纯函数，返回新对象）
    //
    // 策略（按用户确认）：
    //   ✅ partnerAvatar / myAvatar / stickerLibrary / myStickerLibrary
    //      → 豁免，原样保留 data:image base64
    //
    //   ❌ 其他所有位置（chatMessages 里的 imgSrc、chatBackground、
    //      chatBg、customEmojis 里的图片、backgroundGallery 纯 base64 项…）
    //      → data:image / data:video 字符串直接替换为占位符或跳过
    //
    //   ⚠️ oss:// 引用字符串 → 原样保留（无论在哪）
    // =========================================================================

    /**
     * 递归清洗一个值。
     * @param {*} val 当前节点
     * @param {string} curKey 当前节点的"字段路径片段"（用于豁免判断，只有最顶层 baseKey 有意义）
     * @param {boolean} preserveCurrent 当前字段是否豁免（由上层决定）
     * @returns {*} 清洗后的值
     */
    function sanitizeNode(val, curKey, preserveCurrent) {
        if (val === null || val === undefined) return val;

        // --- 字符串 ---
        if (typeof val === 'string') {
            if (isDataMediaUrl(val)) {
                if (preserveCurrent) return val; // 豁免键 → 原样保留
                // 非豁免 → 替换为占位符
                return '[媒体已跳过]';
            }
            // oss:// 引用 → 原样保留
            if (isOssRef(val)) return val;
            return val;
        }

        // --- 数组 ---
        if (Array.isArray(val)) {
            if (preserveCurrent) {
                // 整个数组豁免 → 原样保留（stickerLibrary / myStickerLibrary）
                return val.slice(); // 浅拷贝一份，caller 得到干净的新对象
            }
            // 非豁免数组 → 递归每个元素，同时剔除整项（如果元素是 data:image 字符串）
            var outArr = [];
            for (var i = 0; i < val.length; i++) {
                var item = val[i];
                if (typeof item === 'string' && isDataMediaUrl(item)) {
                    // 数组项本身就是 base64 字符串 → 跳过该项
                    continue;
                }
                outArr.push(sanitizeNode(item, curKey, false));
            }
            return outArr;
        }

        // --- 对象 ---
        if (typeof val === 'object') {
            if (val instanceof Date) return val.toISOString();
            var outObj = {};
            for (var k in val) {
                if (!Object.prototype.hasOwnProperty.call(val, k)) continue;
                var child = val[k];

                // 子字段本身是 data:image 字符串
                if (typeof child === 'string' && isDataMediaUrl(child)) {
                    if (preserveCurrent) {
                        outObj[k] = child; // 父对象豁免 → 保留
                    } else {
                        // 非豁免 → 替换占位符（不删除 key，避免 JSON schema 变化）
                        outObj[k] = '[媒体已跳过]';
                    }
                    continue;
                }
                outObj[k] = sanitizeNode(child, k, preserveCurrent);
            }
            return outObj;
        }

        return val;
    }

    function sanitizeBase64Fields(payload) {
        if (!payload || typeof payload !== 'object') return payload;
        var result = deepClone(payload); // 先克隆，不污染 caller

        // --- sessions 里的 localforage ---
        if (result.sessions && typeof result.sessions === 'object') {
            var sessionIds = Object.keys(result.sessions);
            for (var s = 0; s < sessionIds.length; s++) {
                var sid = sessionIds[s];
                var lf = result.sessions[sid].localforage;
                if (!lf) continue;
                var baseKeys = Object.keys(lf);
                for (var b = 0; b < baseKeys.length; b++) {
                    var bk = baseKeys[b];
                    // 判断该 baseKey 是否在豁免列表
                    var preserved = !!BASE64_PRESERVE_NEEDLES[bk];
                    lf[bk] = sanitizeNode(lf[bk], bk, preserved);
                }
            }
        }

        // --- globalLf ---
        if (result.globalLf && typeof result.globalLf === 'object') {
            var gk = Object.keys(result.globalLf);
            for (var g = 0; g < gk.length; g++) {
                // global 里目前没有需要豁免 base64 的键（playerCover/customSongs 已排除）
                result.globalLf[gk[g]] = sanitizeNode(result.globalLf[gk[g]], gk[g], false);
            }
        }

        // --- localStorage（全是小配置，不应该有 base64，但保险起见）---
        if (result.localStorage && typeof result.localStorage === 'object') {
            var lsk = Object.keys(result.localStorage);
            for (var l = 0; l < lsk.length; l++) {
                var lv2 = result.localStorage[lsk[l]];
                if (typeof lv2 === 'string' && isDataMediaUrl(lv2)) {
                    result.localStorage[lsk[l]] = '[媒体已跳过]';
                }
            }
        }

        return result;
    }

    // =========================================================================
    // restoreTextData —— 将 payload 写回本地存储（逐键 try/catch）
    //
    // 写入策略：
    //   - sessions.{sid}.localforage.{baseKey} → localforage.setItem(APP_PREFIX + sid + '_' + baseKey, val)
    //   - globalLf.{baseKey} → localforage.setItem(APP_PREFIX + baseKey, val)
    //   - localStorage.{key} → localStorage.setItem(key, val)
    //   - 对于 payload 里 sessions 有但本地没有的 session → 直接创建（新设备拉取场景）
    //   - 对于本地有但 payload 里没有的 session → **不动**（不删用户其他角色的数据）
    // =========================================================================

    async function restoreTextData(payload, opts) {
        opts = opts || {};
        var appPrefix = payload.appPrefix || getAppPrefix();
        var failed = [];
        var restoredCount = 0;

        if (typeof localforage === 'undefined') {
            console.error('[sync-data-prepare] localforage 未定义，无法恢复');
            return { ok: false, restored: 0, failed: ['localforage 不可用'] };
        }

        // --- 1. sessions ---
        if (payload.sessions) {
            var sids = Object.keys(payload.sessions);
            for (var si = 0; si < sids.length; si++) {
                var sid = sids[si];
                var lf = payload.sessions[sid] && payload.sessions[sid].localforage;
                if (!lf) continue;
                var bkeys = Object.keys(lf);
                for (var bi = 0; bi < bkeys.length; bi++) {
                    var bk = bkeys[bi];
                    var fk = appPrefix + sid + '_' + bk;
                    try {
                        await localforage.setItem(fk, lf[bk]);
                        restoredCount++;
                    } catch (e) {
                        failed.push({ key: fk, err: String(e && e.message || e) });
                        console.warn('[sync-data-prepare] 恢复失败', fk, e);
                    }
                }
            }
        }

        // --- 2. globalLf ---
        if (payload.globalLf) {
            var gbkeys = Object.keys(payload.globalLf);
            for (var gi = 0; gi < gbkeys.length; gi++) {
                var gbk = gbkeys[gi];
                var gfk = appPrefix + gbk;
                try {
                    await localforage.setItem(gfk, payload.globalLf[gbk]);
                    restoredCount++;
                } catch (e2) {
                    failed.push({ key: gfk, err: String(e2 && e2.message || e2) });
                    console.warn('[sync-data-prepare] global 恢复失败', gfk, e2);
                }
            }
        }

        // --- 3. localStorage ---
        if (payload.localStorage) {
            var lk = Object.keys(payload.localStorage);
            for (var li = 0; li < lk.length; li++) {
                try {
                    localStorage.setItem(lk[li], payload.localStorage[lk[li]]);
                    restoredCount++;
                } catch (e3) {
                    failed.push({ key: lk[li], err: String(e3 && e3.message || e3) });
                    console.warn('[sync-data-prepare] localStorage 恢复失败', lk[li], e3);
                }
            }
        }

        return {
            ok: true,
            restored: restoredCount,
            failed: failed
        };
    }

    // =========================================================================
    // 导出（挂载到 global.ChatSyncData，和 backup-engine.js 的 ChatBackup 风格一致）
    // =========================================================================

    global.ChatSyncData = {
        version: 1,
        // 核心 API
        collectTextData: collectTextData,
        sanitizeBase64Fields: sanitizeBase64Fields,
        restoreTextData: restoreTextData,
        // 常量（供调用方参考哪些键会被纳入）
        NEEDLES: SESSION_NEEDLES.slice(),
        GLOBAL_LF: GLOBAL_LF.slice(),
        LS_INCLUDE: LS_INCLUDE.slice(),
        BASE64_PRESERVE: Object.keys(BASE64_PRESERVE_NEEDLES)
    };

})(typeof window !== 'undefined' ? window : this);
