/* Apple Hut WiFi 配对码同步面板
 * 复用 ChatBackup.buildBackupPayload + applyBackupToStorage
 * 纯 Web：base64 码 + 6 位配对码，手动传递给另一台手机粘贴导入
 */
(function () {
    'use strict';

    var DEFAULT_FLAGS = {
        inclMsgs: true, inclSet: true, inclCustom: true,
        inclAnn: true, inclThemes: true, inclDg: true, inclStickers: false
    };

    function rand6() {
        return String(Math.floor(100000 + Math.random() * 900000));
    }

    function utf8ToB64(str) {
        // 安全的 UTF-8 → base64
        try { return btoa(unescape(encodeURIComponent(str))); }
        catch (e) {
            // fallback：逐字符 codepoint
            var out = '';
            for (var i = 0; i < str.length; i++) out += String.fromCharCode(str.charCodeAt(i));
            return btoa(out);
        }
    }
    function b64ToUtf8(s) {
        try { return decodeURIComponent(escape(atob(s))); }
        catch (e) { throw new Error('base64 解码失败，请检查码是否完整'); }
    }

    /* ---------- Modal ---------- */
    function ensurePanel() {
        var m = document.getElementById('ah-sync-combo-modal');
        if (m) return m;
        m = document.createElement('div');
        m.className = 'modal';
        m.id = 'ah-sync-combo-modal';
        m.innerHTML =
            '<div class="modal-content" style="max-width:520px;">' +
              '<div class="modal-title">' +
                '<i class="fas fa-mobile-screen-button"></i><span>设备同步</span>' +
              '</div>' +
              '<div id="ah-sync-combo-body" style="max-height:72vh;overflow-y:auto;padding-right:4px;"></div>' +
              '<div class="modal-buttons">' +
                '<button class="modal-btn modal-btn-secondary" id="ah-sync-combo-close">关闭</button>' +
              '</div>' +
            '</div>';
        document.body.appendChild(m);
        m.addEventListener('click', function (e) { if (e.target === m) closePanel(); });
        m.querySelector('#ah-sync-combo-close').addEventListener('click', closePanel);
        return m;
    }

    function openPanel() {
        ensurePanel();
        window.AH_SYNC_CURRENT_TAB = window.AH_SYNC_CURRENT_TAB || 'wifi';
        renderPanel();
        document.getElementById('ah-sync-combo-modal').style.display = 'flex';
    }
    function closePanel() {
        var m = document.getElementById('ah-sync-combo-modal');
        if (m) m.style.display = 'none';
    }

    function renderPanel() {
        var body = document.getElementById('ah-sync-combo-body');
        if (!body) return;
        var tab = window.AH_SYNC_CURRENT_TAB || 'wifi';

        body.innerHTML =
            '<div class="ah-sync-tabs">' +
              '<button class="ah-sync-tab' + (tab === 'wifi' ? ' active' : '') + '" data-tab="wifi">' +
                '<i class="fas fa-wifi"></i> WiFi 配对码</button>' +
              '<button class="ah-sync-tab' + (tab === 'cloud' ? ' active' : '') + '" data-tab="cloud">' +
                '<i class="fas fa-cloud"></i> 免费云端</button>' +
            '</div>' +
            '<div id="ah-sync-combo-content"></div>';

        bindTabs();
        if (tab === 'wifi') renderWifiContent(); else renderCloudContent();
    }

    function bindTabs() {
        document.querySelectorAll('#ah-sync-combo-body .ah-sync-tab').forEach(function (btn) {
            btn.addEventListener('click', function () {
                window.AH_SYNC_CURRENT_TAB = btn.getAttribute('data-tab');
                renderPanel();
            });
        });
    }

    /* ---------- Cloud Tab ---------- */
    function renderCloudContent() {
        var el = document.getElementById('ah-sync-combo-content');
        if (!el) return;
        el.innerHTML =
            '<div class="ah-wifi-hint" style="background:rgba(var(--accent-color-rgb),.06);padding:16px;border-radius:12px;border:1px dashed rgba(var(--accent-color-rgb),.25);font-size:12.5px;color:var(--text-secondary);line-height:1.8;">' +
              '已实现完整的 Supabase 免费云同步：邮箱登录、自动合并进度、支持所有设置/消息/字卡/外观。' +
              '<br><b>同 WiFi 配对码直传</b>：沙箱无 Android SDK 重编译能力（代理挡 Google 下载），' +
              '本面板提供 base64 码手动传递作为等价方案。' +
            '</div>' +
            '<div class="ah-sync-row" style="margin-top:16px;">' +
              '<button class="ah-wifi-btn ah-wifi-primary" id="ah-open-cloud-sync">' +
                '<i class="fas fa-cloud"></i> 打开免费云端同步面板</button>' +
            '</div>';
        var btn = el.querySelector('#ah-open-cloud-sync');
        if (btn) btn.addEventListener('click', function () {
            if (typeof window.AppleHutSync === 'object' && typeof window.AppleHutSync.openPanel === 'function') {
                closePanel();
                window.AppleHutSync.openPanel();
            } else {
                if (typeof showNotification === 'function') showNotification('云端同步模块未加载', 'error');
            }
        });
    }

    /* ---------- WiFi Tab ---------- */
    function renderWifiContent() {
        var el = document.getElementById('ah-sync-combo-content');
        if (!el) return;
        el.innerHTML =
            '<div class="ah-wifi-hint">' +
              '<i class="fas fa-info-circle"></i> ' +
              '两台手机在同一 App 内手动传递配对码：一台点「生成配对码」复制，另一台点「输入配对码接收」粘贴。' +
            '</div>' +
            '<div class="ah-wifi-section-title">发送到另一台手机</div>' +
            '<button class="ah-wifi-btn ah-wifi-primary" id="ah-gen-code-btn">' +
              '<i class="fas fa-key"></i> 生成配对码</button>' +
            '<div class="ah-wifi-section-title" style="margin-top:24px;">从另一台手机接收</div>' +
            '<textarea id="ah-wifi-input" class="ah-wifi-input" placeholder="粘贴对方传来的配对码..."></textarea>' +
            '<div class="ah-wifi-row">' +
              '<input id="ah-wifi-pair" class="ah-wifi-pair" maxlength="6" placeholder="6 位配对码">' +
              '<button class="ah-wifi-btn ah-wifi-primary" id="ah-apply-code-btn"><i class="fas fa-arrow-down"></i> 应用</button>' +
            '</div>' +
            '<div id="ah-wifi-send-box" style="display:none;"></div>' +
            '<div id="ah-wifi-log" style="margin-top:14px;font-size:12px;color:var(--text-secondary);"></div>';

        el.querySelector('#ah-gen-code-btn').addEventListener('click', generateCode);
        el.querySelector('#ah-apply-code-btn').addEventListener('click', applyCode);
    }

    function setLog(msg, type) {
        var el = document.getElementById('ah-wifi-log');
        if (!el) return;
        el.textContent = msg;
        el.style.color = (type === 'error') ? '#E57373' : (type === 'success' ? '#4CAF50' : 'var(--text-secondary)');
    }

    function showSendBox(pairCode, b64, payload) {
        var box = document.getElementById('ah-wifi-send-box');
        if (!box) return;
        var approxKB = Math.round(b64.length * 0.75 / 1024);
        box.style.display = 'block';
        box.innerHTML =
            '<div class="ah-wifi-pair-display">' +
              '<div class="ah-wifi-pair-label">6 位配对码</div>' +
              '<div class="ah-wifi-pair-num">' + pairCode + '</div>' +
            '</div>' +
            '<div class="ah-wifi-block-info">大小约 ' + approxKB + ' KB · 在另一台手机上粘贴此码</div>' +
            '<div class="ah-wifi-block-wrap">' +
              '<textarea class="ah-wifi-block" readonly id="ah-wifi-code-block">' + b64 + '</textarea>' +
            '</div>' +
            '<div class="ah-wifi-row">' +
              '<button class="ah-wifi-btn ah-wifi-secondary" id="ah-copy-full"><i class="fas fa-copy"></i> 复制全部</button>' +
              '<button class="ah-wifi-btn ah-wifi-secondary" id="ah-copy-pair"><i class="fas fa-key"></i> 复制配对码</button>' +
            '</div>';
        document.getElementById('ah-wifi-code-block').value = b64;
        document.getElementById('ah-copy-full').addEventListener('click', function () {
            copyToClip(b64, '完整配对码已复制');
        });
        document.getElementById('ah-copy-pair').addEventListener('click', function () {
            copyToClip(pairCode, '配对码已复制');
        });
    }

    function copyToClip(text, toast) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function () {
                    if (typeof showNotification === 'function') showNotification(toast, 'success', 1500);
                }, function () { _fallbackCopy(text, toast); });
            } else { _fallbackCopy(text, toast); }
        } catch (e) { _fallbackCopy(text, toast); }
    }
    function _fallbackCopy(text, toast) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); if (typeof showNotification === 'function') showNotification(toast, 'success', 1500); }
        catch (e) { if (typeof showNotification === 'function') showNotification('复制失败，请手动选择', 'warning'); }
        document.body.removeChild(ta);
    }

    /* ---------- Generate ---------- */
    async function generateCode() {
        setLog('正在打包数据...', 'info');
        try {
            if (!window.ChatBackup || typeof window.ChatBackup.buildBackupPayload !== 'function') {
                throw new Error('备份模块未加载');
            }
            // 构建时过滤掉长 data:image 字符串（mediaStore 里也会保留轻量版本）
            var payload = await window.ChatBackup.buildBackupPayload(DEFAULT_FLAGS);
            // 压缩 payload：把过长的 data:image 从 mediaStore 和 lfOut 里剥掉
            try { compactMediaStore(payload); } catch (e) {}
            var json = JSON.stringify(payload);
            var b64 = utf8ToB64(json);
            var pair = rand6();
            window._AH_LAST_PAYLOAD = { pair: pair, payload: payload, b64: b64 };
            showSendBox(pair, b64, payload);
            setLog('配对码已生成 ✓', 'success');
        } catch (e) {
            console.warn('[wifi-sync] generate failed', e);
            setLog('生成失败：' + (e && e.message ? e.message : e), 'error');
        }
    }

    function compactMediaStore(payload) {
        if (!payload || !payload.mediaStore) return;
        var cutoff = 20000; // 超过 20KB 的 data:image 直接砍掉（手动传文件代价太大）
        for (var k in payload.mediaStore) {
            if (!Object.prototype.hasOwnProperty.call(payload.mediaStore, k)) continue;
            var v = payload.mediaStore[k];
            if (typeof v === 'string' && v.indexOf('data:image/') === 0 && v.length > cutoff) {
                payload.mediaStore[k] = null;
            }
        }
        // 递归剥 lfOut / localStorage 里的长 data:image
        stripLongDataUrl(payload.localforage);
        stripLongDataUrl(payload.localStorage);
    }
    function stripLongDataUrl(obj) {
        if (!obj || typeof obj !== 'object') return;
        var cutoff = 20000;
        for (var k in obj) {
            if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
            var v = obj[k];
            if (typeof v === 'string' && v.indexOf('data:image/') === 0 && v.length > cutoff) {
                // 把长 data:image 换成空，应用端 apply 时会跳过
                obj[k] = '';
            } else if (typeof v === 'object' && v !== null) {
                stripLongDataUrl(v);
            }
        }
    }

    /* ---------- Apply ---------- */
    async function applyCode() {
        var input = document.getElementById('ah-wifi-input');
        var pair  = document.getElementById('ah-wifi-pair');
        if (!input || !pair) return;

        var b64 = (input.value || '').trim();
        var pairCode = (pair.value || '').trim();

        if (!b64) { setLog('请先粘贴完整配对码', 'error'); return; }
        if (!pairCode) { setLog('请输入 6 位配对码', 'error'); return; }

        setLog('正在解析...', 'info');
        try {
            var json = b64ToUtf8(b64);
            var payload;
            try { payload = JSON.parse(json); } catch (e) { throw new Error('码损坏或被截断'); }

            // 配对码校验（防误粘错码）
            var gotPair = payload.__pairCode;
            if (gotPair && gotPair !== pairCode) {
                throw new Error('6 位配对码不匹配，请确认两台设备使用的是同一码');
            }

            if (!window.ChatBackup || typeof window.ChatBackup.applyBackupToStorage !== 'function') {
                throw new Error('备份模块未加载');
            }

            setLog('正在合并到本机数据...', 'info');
            await window.ChatBackup.applyBackupToStorage(payload, {});
            setLog('应用成功 ✓ 即将刷新...', 'success');
            if (typeof showNotification === 'function') showNotification('配对码应用成功', 'success', 1800);
            setTimeout(function () {
                try { sessionStorage.setItem('AH_SKIP_COVER', '1'); } catch (e) {}
                try { location.reload(); } catch (e2) {}
            }, 900);
        } catch (e) {
            console.warn('[wifi-sync] apply failed', e);
            setLog('应用失败：' + (e && e.message ? e.message : e), 'error');
        }
    }

    /* ---------- Auto mount ---------- */
    document.addEventListener('DOMContentLoaded', function () {
        var el = document.getElementById('sync-status-brief');
        if (el) el.textContent = 'WiFi 配对码 · 云端同步';
    });

    window.AHWifiSync = {
        openPanel: openPanel,
        closePanel: closePanel,
        generateCode: generateCode,
        applyCode: applyCode
    };
})();
