/**
 * oss-v4.js —— 阿里云 OSS V4 签名工具层
 * 纯工具，不涉及任何同步业务逻辑；仅签名 + fetch 封装。
 *
 * 依赖：Web Crypto API（浏览器 window.crypto.subtle 或 Node crypto）
 *       —— 不引入 CryptoJS（太肥），零外部依赖
 *
 * 规范：
 *   阿里云 OSS V4 签名 ≈ AWS Signature V4
 *   Canonical Request:
 *     METHOD + "\n" + Path + "\n" + QueryString + "\n" + CanonicalHeaders + "\n" + SignedHeaders + "\n" + BodySHA256
 *   Signing Key 派生：
 *     AWS4 + SK → HMAC(date) → HMAC(region) → HMAC("oss") → HMAC("aliyun")
 *
 *   阿里云特有头：
 *     x-oss-date            时间戳（ISO8601 UTC）
 *     x-oss-content-sha256  body 的 SHA256 hex（空 body 时用空串 hash）
 *   Authorization 头格式：
 *     AWS4-HMAC-SHA256 Credential=AK/{date}/{region}/oss/aliyun, SignedHeaders={headers}, Signature={hex}
 */
(function (global) {
    'use strict';

    // =========================================================================
    // 底层加密：同时支持浏览器 Web Crypto 和 Node crypto
    // =========================================================================

    var _crypto = null;
    var _useNodeCrypto = false;

    if (typeof global !== 'undefined' && global.crypto && global.crypto.subtle) {
        _crypto = global.crypto.subtle;
        _useNodeCrypto = false;
    } else if (typeof require === 'function') {
        // Node 环境
        try {
            var nodeCrypto = require('crypto');
            _crypto = nodeCrypto;
            _useNodeCrypto = true;
        } catch (e) { /* ignore */ }
    }

    if (!_crypto) {
        console.error('[oss-v4] 加密 API 不可用（浏览器需要 window.crypto.subtle）');
    }

    /** SHA-256 hash，返回 hex 字符串 */
    async function sha256Hex(input) {
        if (_useNodeCrypto) {
            return _crypto.createHash('sha256').update(typeof input === 'string' ? input : Buffer.from(input)).digest('hex');
        }
        // Web Crypto
        var buf;
        if (typeof input === 'string') {
            buf = new TextEncoder().encode(input);
        } else if (input instanceof Uint8Array) {
            buf = input;
        } else {
            buf = new Uint8Array(input);
        }
        var digest = await _crypto.digest({ name: 'SHA-256' }, buf);
        return arrayBufferToHex(digest);
    }

    /** HMAC-SHA256 签名，返回 ArrayBuffer/Uint8Array（Node 返回 Buffer） */
    async function hmac(key, data) {
        if (_useNodeCrypto) {
            // key 和 data 都转 Buffer
            var k = Buffer.isBuffer(key) ? key : Buffer.from(key);
            return _crypto.createHmac('sha256', k).update(typeof data === 'string' ? data : Buffer.from(data)).digest();
        }
        // Web Crypto —— 需要先 importKey 再 sign
        var keyBuf;
        if (typeof key === 'string') {
            keyBuf = new TextEncoder().encode(key);
        } else if (key instanceof Uint8Array) {
            keyBuf = key;
        } else {
            keyBuf = new Uint8Array(key);
        }
        var dataBuf;
        if (typeof data === 'string') {
            dataBuf = new TextEncoder().encode(data);
        } else if (data instanceof Uint8Array) {
            dataBuf = data;
        } else {
            dataBuf = new Uint8Array(data);
        }
        var cryptoKey = await _crypto.importKey(
            'raw', keyBuf, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
        );
        return await _crypto.sign({ name: 'HMAC' }, cryptoKey, dataBuf);
    }

    function arrayBufferToHex(ab) {
        var bytes = new Uint8Array(ab);
        var hex = '';
        for (var i = 0; i < bytes.length; i++) {
            hex += ('0' + bytes[i].toString(16)).slice(-2);
        }
        return hex;
    }

    async function hmacHex(key, data) {
        var raw = await hmac(key, data);
        if (_useNodeCrypto) {
            // Node Buffer → hex
            return raw.toString('hex');
        }
        return arrayBufferToHex(raw);
    }

    // =========================================================================
    // Signing Key 派生链
    //   AWS4 + Secret → HMAC(date) → HMAC(region) → HMAC("oss") → HMAC("aliyun")
    // =========================================================================

    async function deriveSigningKey(secretAccessKey, dateStamp, region) {
        var kDate = await hmac('AWS4' + secretAccessKey, dateStamp);
        var kRegion = await hmac(kDate, region);
        var kService = await hmac(kRegion, 'oss');
        var kSigning = await hmac(kService, 'aliyun');
        return kSigning;
    }

    // =========================================================================
    // 时间戳 / 配置读取
    // =========================================================================

    function nowISO() {
        // YYYYMMDDTHHMMSSZ —— 阿里云要求
        var d = new Date();
        var y = d.getUTCFullYear();
        var m = ('0' + (d.getUTCMonth() + 1)).slice(-2);
        var day = ('0' + d.getUTCDate()).slice(-2);
        var hh = ('0' + d.getUTCHours()).slice(-2);
        var mm = ('0' + d.getUTCMinutes()).slice(-2);
        var ss = ('0' + d.getUTCSeconds()).slice(-2);
        return '' + y + m + day + 'T' + hh + mm + ss + 'Z';
    }

    function getDateStamp(timestamp) {
        // timestamp = YYYYMMDDTHHMMSSZ → dateStamp = YYYYMMDD
        return timestamp.slice(0, 8);
    }

    /** 从 localStorage 读取用户自填的 OSS 配置（方案 B） */
    function loadConfig() {
        try {
            var raw = localStorage.getItem('AH_OSS_CONFIG');
            if (!raw) throw new Error('OSS 未配置：请先在设置里填写 AccessKeyId / SecretAccessKey / Bucket / Endpoint');
            var cfg = JSON.parse(raw);
            if (!cfg.accessKeyId) throw new Error('OSS 配置缺少 accessKeyId');
            if (!cfg.secretAccessKey) throw new Error('OSS 配置缺少 secretAccessKey');
            if (!cfg.bucket) throw new Error('OSS 配置缺少 bucket');
            if (!cfg.endpoint) throw new Error('OSS 配置缺少 endpoint（如 oss-cn-hangzhou.aliyuncs.com）');
            // 自动推断 region（endpoint 里 oss-cn-xxx → cn-xxx）
            if (!cfg.region) {
                var m = /oss-([\w-]+)\.aliyuncs\.com$/i.exec(cfg.endpoint);
                cfg.region = m ? m[1] : 'cn-hangzhou';
            }
            return cfg;
        } catch (e) {
            throw e;
        }
    }

    // =========================================================================
    // 签名主函数
    // =========================================================================

    /**
     * 生成 Authorization 头 + 附带头（x-oss-date / x-oss-content-sha256 / host）
     *
     * @param {Object} params
     *   method    HTTP method: 'PUT' | 'GET' | 'DELETE'
     *   path      请求路径: '/sync/test.json'
     *   body      字符串（或空字符串）
     *   headers   额外 headers（小写 key），如 { 'content-type': '...' }
     *   region    可选，覆盖 config.region
     * @param {Object} config  OSS 配置（可选，不传则从 localStorage 读）
     * @returns {Promise<{headers:{}}>} 可直接用于 fetch 的 headers 对象（包含 Authorization）
     */
    async function signCanonicalRequest(params, config) {
        config = config || loadConfig();

        var method = (params.method || 'GET').toUpperCase();
        var path = params.path || '/';
        var body = params.body == null ? '' : params.body;
        var extraHeaders = params.headers || {};

        // --- 1. 标准化 content-type（小写化，防 Safari charset 大小写陷阱）---
        if (extraHeaders['content-type'] && typeof extraHeaders['content-type'] === 'string') {
            extraHeaders['content-type'] = extraHeaders['content-type'].toLowerCase();
        }

        // --- 2. 时间戳 ---
        var timestamp = nowISO();
        var dateStamp = getDateStamp(timestamp);

        // --- 3. 计算 body SHA256 ---
        var bodyHash = await sha256Hex(body);

        // --- 4. 组装参与签名的 canonical headers ---
        var canonicalHeadersMap = {};
        canonicalHeadersMap['host'] = config.endpoint;
        canonicalHeadersMap['x-oss-date'] = timestamp;
        canonicalHeadersMap['x-oss-content-sha256'] = bodyHash;
        // 用户额外 headers 合并（key 全部转小写）
        for (var k in extraHeaders) {
            if (!Object.prototype.hasOwnProperty.call(extraHeaders, k)) continue;
            var lk = k.toLowerCase();
            canonicalHeadersMap[lk] = String(extraHeaders[k]).trim();
        }

        // canonical headers 按 key 字典序排序，key:value + "\n"
        var sortedKeys = Object.keys(canonicalHeadersMap).sort();
        var canonicalHeadersStr = '';
        for (var i = 0; i < sortedKeys.length; i++) {
            canonicalHeadersStr += sortedKeys[i] + ':' + canonicalHeadersMap[sortedKeys[i]] + '\n';
        }
        var signedHeaders = sortedKeys.join(';');

        // --- 5. Canonical Request ---
        var canonicalRequest = method + '\n' +
                               path + '\n' +
                               '' + '\n' +   // Query String（空）
                               canonicalHeadersStr + '\n' +
                               signedHeaders + '\n' +
                               bodyHash;

        // --- 6. String to Sign ---
        var canonicalHashHex = await sha256Hex(canonicalRequest);
        var stringToSign = 'AWS4-HMAC-SHA256\n' +
                           timestamp + '\n' +
                           dateStamp + '/' + config.region + '/oss/aliyun\n' +
                           canonicalHashHex;

        // --- 7. Signing Key 派生 ---
        var kSigning = await deriveSigningKey(config.secretAccessKey, dateStamp, config.region);

        // --- 8. 签名 ---
        var signatureHex = await hmacHex(kSigning, stringToSign);

        // --- 9. Authorization 头 ---
        var authHeader = 'AWS4-HMAC-SHA256 ' +
            'Credential=' + config.accessKeyId + '/' + dateStamp + '/' + config.region + '/oss/aliyun, ' +
            'SignedHeaders=' + signedHeaders + ', ' +
            'Signature=' + signatureHex;

        // --- 10. 组装最终 headers（含 Authorization 和 canonical headers 里的全部）---
        var outHeaders = {
            'Authorization': authHeader
        };
        for (var j = 0; j < sortedKeys.length; j++) {
            outHeaders[sortedKeys[j]] = canonicalHeadersMap[sortedKeys[j]];
        }

        return { headers: outHeaders };
    }

    // =========================================================================
    // 基础 fetch 封装
    // =========================================================================

    function buildOssUrl(config, path) {
        // 阿里云 OSS 路径式 URL: https://{bucket}.{endpoint}{path}
        // path 必须以 / 开头
        if (path.charAt(0) !== '/') path = '/' + path;
        return 'https://' + config.bucket + '.' + config.endpoint + path;
    }

    async function ossPut(params, config) {
        config = config || loadConfig();
        var path = params.path;
        var body = params.body == null ? '' : params.body;
        var contentType = (params.contentType || 'application/json; charset=utf-8').toLowerCase();
        var opts = await signCanonicalRequest({
            method: 'PUT',
            path: path,
            body: body,
            headers: { 'content-type': contentType }
        }, config);

        var url = buildOssUrl(config, path);
        var resp = await fetch(url, {
            method: 'PUT',
            headers: opts.headers,
            body: body,
            mode: 'cors'
        });
        if (!resp.ok) {
            var errText = await resp.text().catch(function () { return ''; });
            throw new Error('OSS PUT ' + path + ' 失败 HTTP ' + resp.status + ': ' + errText.slice(0, 200));
        }
        return resp;
    }

    async function ossGet(params, config) {
        config = config || loadConfig();
        var path = params.path;
        var opts = await signCanonicalRequest({
            method: 'GET',
            path: path,
            body: '',
            headers: {}
        }, config);

        var url = buildOssUrl(config, path);
        var resp = await fetch(url, {
            method: 'GET',
            headers: opts.headers,
            mode: 'cors'
        });
        if (!resp.ok) {
            var errText = await resp.text().catch(function () { return ''; });
            if (resp.status === 404) return null; // 对象不存在 → 返回 null
            throw new Error('OSS GET ' + path + ' 失败 HTTP ' + resp.status + ': ' + errText.slice(0, 200));
        }
        return resp;
    }

    async function ossDelete(params, config) {
        config = config || loadConfig();
        var path = params.path;
        var opts = await signCanonicalRequest({
            method: 'DELETE',
            path: path,
            body: '',
            headers: {}
        }, config);

        var url = buildOssUrl(config, path);
        var resp = await fetch(url, {
            method: 'DELETE',
            headers: opts.headers,
            mode: 'cors'
        });
        if (!resp.ok) {
            var errText = await resp.text().catch(function () { return ''; });
            throw parseOssHttpError(resp.status, errText, 'DELETE ' + path);
        }
        return resp;
    }

    // =========================================================================
    // 测试连接 + 错误解析（给 UI 用）
    // =========================================================================

    /**
     * GET Bucket 列表对象（max-keys=1）——阿里云 OSS REST API 规定
     * 返回最多 1 条对象；成功即 AK/SK/Bucket/Region/CORS 全部正确。
     */
    async function ossTestConnection(config) {
        config = config || loadConfig();
        var opts = await signCanonicalRequest({
            method: 'GET',
            path: '/',
            body: '',
            // ListBucket 的 query 字符串不参与签名（阿里云 OSS V4 简化规则）
            headers: {}
        }, config);

        var url = buildOssUrl(config, '/') + '?max-keys=1';
        var resp = await fetch(url, {
            method: 'GET',
            headers: opts.headers,
            mode: 'cors'
        });
        if (!resp.ok) {
            var errText = await resp.text().catch(function () { return ''; });
            throw parseOssHttpError(resp.status, errText, 'Test connection GET /');
        }
        return { ok: true };
    }

    /**
     * 解析阿里云 OSS 错误 XML 响应 → 结构化 {code, message, hint}
     * UI 层直接显示 hint，用户看得懂。
     */
    function parseOssHttpError(status, body, ctx) {
        // 先抓 XML 里的 <Code>...</Code>
        var code = null, message = null;
        if (body && body.indexOf('<Error') !== -1) {
            var cm = /<Code>([^<]+)<\/Code>/.exec(body);
            var mm = /<Message>([^<]+)<\/Message>/.exec(body);
            if (cm) code = cm[1];
            if (mm) message = mm[1];
        }

        // 网络层错误（CORS / DNS / 连接超时）
        if (status === 0) {
            return makeFriendlyError('NetworkError', '请求被浏览器拦截（可能是 CORS 跨域未配置）',
                '必须在阿里云 OSS Bucket 控制台配置 CORS：来源填 `*`，Methods 勾选 `PUT,GET,DELETE,HEAD`，Allow-Headers 包含 `Authorization,Content-Type,x-oss-date,x-oss-content-sha256`');
        }

        // 根据 Code 映射友好提示
        var hintMap = {
            'InvalidAccessKeyId': 'AccessKey ID 不存在，请检查拼写或是否已删除',
            'InvalidSignature': '签名校验失败，请确认 SecretAccessKey 正确',
            'SignatureDoesNotMatch': '签名不匹配。常见原因：① SecretAccessKey 填错；② 手机系统时间与 UTC 偏差超过 15 分钟（请自动校准时间）',
            'NoSuchBucket': 'Bucket 不存在，或 Bucket 名与地区不匹配（请确认 Bucket 所在 Region 和上面选的一致）',
            'AccessDenied': 'RAM 权限不足。请给该子账号授予目标 Bucket 的 GetObject/PutObject/DeleteObject/ListObjects 权限',
            'BucketAlreadyExists': 'Bucket 已存在但所有者不同（阿里云全局唯一）',
            'AccessKeyForbidden': 'AccessKey 已被禁用',
            'RequestTimeTooSkewed': '手机时间偏差超过 15 分钟，请开启自动校准时间',
            'MalformedXML': 'OSS 返回格式异常，通常是 Bucket 或 Region 配置不对'
        };

        if (code && hintMap[code]) {
            return makeFriendlyError(code, message || hintMap[code], hintMap[code]);
        }
        if (code) {
            return makeFriendlyError(code, message || 'OSS 返回错误', '错误码 ' + code + '，请对照阿里云文档排查');
        }
        // 无 XML Code，用 HTTP status 兜底
        switch (status) {
            case 401: return makeFriendlyError('401', '认证失败', 'AccessKey 或 Secret 不正确');
            case 403: return makeFriendlyError('403', '权限被拒', 'RAM 权限不足或 Bucket ACL 限制');
            case 404: return makeFriendlyError('404', 'Bucket 不存在', '请确认 Bucket 名和 Region 都正确');
            case 405: return makeFriendlyError('405', '方法不允许', '可能是 CORS 未配置该 HTTP 方法');
            default: return makeFriendlyError('HTTP_' + status, '请求失败', ctx + ' → HTTP ' + status + '，原始响应：' + (body || '').slice(0, 200));
        }
    }

    function makeFriendlyError(code, message, hint) {
        var err = new Error(hint || message || code);
        err.code = code;
        err.message = message;
        err.hint = hint || message;
        err.isOssError = true;
        return err;
    }

    // =========================================================================
    // 导出
    // =========================================================================

    global.OSSV4 = {
        version: 2,
        // 签名核心（暴露，便于测试）
        signCanonicalRequest: signCanonicalRequest,
        deriveSigningKey: deriveSigningKey,
        sha256Hex: sha256Hex,
        hmacHex: hmacHex,
        // 业务 API
        ossPut: ossPut,
        ossGet: ossGet,
        ossDelete: ossDelete,
        ossTestConnection: ossTestConnection,
        // 错误
        parseOssHttpError: parseOssHttpError,
        // 工具
        loadConfig: loadConfig,
        buildOssUrl: buildOssUrl,
        nowISO: nowISO
    };

})(typeof window !== 'undefined' ? window : this);
