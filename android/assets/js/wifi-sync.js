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

    /* ---------- Cloud Tab（二级 Tab：轻量 / 私有存储 OSS）---------- */
    var AH_CLOUD_SUBTAB_KEY = 'ah-cloud-subtab';

    function renderCloudContent() {
        var el = document.getElementById('ah-sync-combo-content');
        if (!el) return;
        var subTab = (localStorage.getItem(AH_CLOUD_SUBTAB_KEY) || 'supabase');

        el.innerHTML =
            '<div class="ah-sync-tabs" style="margin-bottom:14px;">' +
              '<button class="ah-sync-tab' + (subTab === 'supabase' ? ' active' : '') + '" data-subtab="supabase">' +
                '<i class="fas fa-feather-pointed"></i> 轻量同步</button>' +
              '<button class="ah-sync-tab' + (subTab === 'oss' ? ' active' : '') + '" data-subtab="oss">' +
                '<i class="fas fa-vault"></i> 私有存储 OSS</button>' +
            '</div>' +
            '<div id="ah-cloud-sub-content"></div>';

        // 绑定二级 Tab
        el.querySelectorAll('.ah-sync-tab').forEach(function (btn) {
            btn.addEventListener('click', function () {
                localStorage.setItem(AH_CLOUD_SUBTAB_KEY, btn.getAttribute('data-subtab'));
                renderCloudContent(); // 重绘
            });
        });

        if (subTab === 'oss') {
            renderOssSubContent();
        } else {
            renderSupabaseSubContent();
        }
    }

    function renderSupabaseSubContent() {
        var el = document.getElementById('ah-cloud-sub-content');
        if (!el) return;
        el.innerHTML =
            '<div class="ah-wifi-hint" style="background:rgba(var(--accent-color-rgb),.06);padding:14px;border-radius:12px;border:1px dashed rgba(var(--accent-color-rgb),.25);font-size:12px;color:var(--text-secondary);line-height:1.8;">' +
              '<b>免费轻量同步</b>：基于 Supabase 邮箱登录，自动合并、支持多设备。' +
              '<br><b>局域网直传</b>：使用上面 WiFi 配对码 tab 手动传递。' +
            '</div>' +
            '<div class="ah-sync-row" style="margin-top:14px;">' +
              '<button class="ah-wifi-btn ah-wifi-primary" id="ah-open-cloud-sync">' +
                '<i class="fas fa-cloud"></i> 打开轻量同步面板</button>' +
            '</div>';
        var btn = el.querySelector('#ah-open-cloud-sync');
        if (btn) btn.addEventListener('click', function () {
            if (typeof window.AppleHutSync === 'object' && typeof window.AppleHutSync.openPanel === 'function') {
                closePanel();
                window.AppleHutSync.openPanel();
            } else {
                if (typeof showNotification === 'function') showNotification('轻量同步模块未加载', 'error');
            }
        });
    }

    /* ---------- OSS Sub Tab ---------- */
    var AH_OSS_REGIONS = [
        { label: '华东 1（杭州）', value: 'oss-cn-hangzhou' },
        { label: '华东 2（上海）', value: 'oss-cn-shanghai' },
        { label: '华东 5（温州）', value: 'oss-cn-wenzhou' },
        { label: '华南 1（深圳）', value: 'oss-cn-shenzhen' },
        { label: '华南 2（广州）', value: 'oss-cn-guangzhou' },
        { label: '华北 2（北京）', value: 'oss-cn-beijing' },
        { label: '华北 3（张家口）', value: 'oss-cn-zhangjiakou' },
        { label: '华北 5（呼和浩特）', value: 'oss-cn-huhehaote' },
        { label: '西南 1（成都）', value: 'oss-cn-chengdu' },
        { label: '西南 2（重庆）', value: 'oss-cn-chongqing' },
        { label: '香港', value: 'oss-cn-hongkong' },
        { label: '新加坡', value: 'oss-ap-southeast-1' },
        { label: '东京', value: 'oss-ap-northeast-1' },
        { label: '美西（弗吉尼亚）', value: 'oss-us-east-1' },
        { label: '美东（硅谷）', value: 'oss-us-west-1' }
    ];

    function renderOssSubContent() {
        var el = document.getElementById('ah-cloud-sub-content');
        if (!el) return;

        var cfg = (typeof window.CloudSync !== 'undefined') ? window.CloudSync.getConfig() : null;
        var meta = (typeof window.CloudSync !== 'undefined') ? window.CloudSync.meta : {};
        if (!cfg) cfg = {};

        // 默认 endpoint
        var endpoint = cfg.endpoint || 'oss-cn-hangzhou.aliyuncs.com';
        var bucket = cfg.bucket || '';
        var accessKeyId = cfg.accessKeyId || '';
        var secretAccessKey = cfg.secretAccessKey ? '••••••••••••••' : '';
        var region = cfg.region || 'cn-hangzhou';

        var connected = (meta.connectedAt || 0) > 0;
        var connTime = connected ? formatTimeAgo(meta.connectedAt) : '未连接';
        var pushTime = meta.lastPushAt ? formatTimeAgo(meta.lastPushAt) : '从未';
        var pullTime = meta.lastPullAt ? formatTimeAgo(meta.lastPullAt) : '从未';
        var dirty = !!meta.dirty;
        var failCount = meta.consecutiveFails || 0;
        var phase = (typeof window.CloudSync !== 'undefined') ? window.CloudSync.phase : 'idle';

        // 状态色
        var statusDotColor = connected ? '#10b981' : '#94a3b8';
        var statusText = connected ? '已连接' : '未连接';
        if (failCount >= 3) { statusDotColor = '#ef4444'; statusText = '连续失败 ' + failCount + ' 次'; }

        // Region select 生成
        var regionOpts = AH_OSS_REGIONS.map(function (r) {
            return '<option value="' + r.value + '"' + (r.value === endpoint ? ' selected' : '') + '>' + r.label + '</option>';
        }).join('');

        el.innerHTML =
            // 状态区
            '<div class="ah-oss-status-row">' +
              '<div class="ah-oss-status-dot" style="background:' + statusDotColor + '"></div>' +
              '<div class="ah-oss-status-text">' + statusText + '</div>' +
              (connected ? '<div class="ah-oss-status-sub">上次测试：' + connTime + '</div>' : '') +
            '</div>' +
            '<div class="ah-oss-meta-grid">' +
              '<div class="ah-oss-meta-item"><div class="ah-oss-meta-label">上次 Push</div><div class="ah-oss-meta-val">' + pushTime + '</div></div>' +
              '<div class="ah-oss-meta-item"><div class="ah-oss-meta-label">上次 Pull</div><div class="ah-oss-meta-val">' + pullTime + '</div></div>' +
              '<div class="ah-oss-meta-item"><div class="ah-oss-meta-label">待同步</div><div class="ah-oss-meta-val" style="color:' + (dirty ? '#f59e0b' : 'var(--text-secondary)') + '">' + (dirty ? '是 ⚠' : '否') + '</div></div>' +
              '<div class="ah-oss-meta-item"><div class="ah-oss-meta-label">状态</div><div class="ah-oss-meta-val">' + phaseLabel(phase) + '</div></div>' +
            '</div>' +

            // 配置表单
            '<div class="ah-oss-section-title">连接配置</div>' +
            '<div class="ah-oss-field"><label>Bucket 名称</label>' +
              '<input id="ah-oss-bucket" type="text" placeholder="apple-hut-sync" value="' + escapeHtml(bucket) + '"></div>' +
            '<div class="ah-oss-field"><label>地区</label>' +
              '<select id="ah-oss-region">' + regionOpts + '</select>' +
              '<div class="ah-oss-field-hint">选择 Bucket 创建时所在的地区</div>' +
            '</div>' +
            '<div class="ah-oss-field"><label>AccessKey ID</label>' +
              '<input id="ah-oss-ak" type="text" placeholder="LTAI5t..." value="' + escapeHtml(accessKeyId) + '"></div>' +
            '<div class="ah-oss-field"><label>AccessKey Secret</label>' +
              '<input id="ah-oss-sk" type="password" placeholder="••••••••" value="' + escapeHtml(secretAccessKey) + '"></div>' +
            '<div class="ah-oss-warn-box">💡 建议使用阿里云 RAM 子账号，只授予该 Bucket 的 GetObject/PutObject/DeleteObject/ListObjects 最小权限</div>' +

            '<div class="ah-oss-row">' +
              '<button class="ah-wifi-btn ah-wifi-secondary" id="ah-oss-save-cfg"><i class="fas fa-save"></i> 保存配置</button>' +
              '<button class="ah-wifi-btn ah-wifi-primary" id="ah-oss-test"><i class="fas fa-paper-plane"></i> 测试连接</button>' +
            '</div>' +

            // 错误提示区
            '<div id="ah-oss-error-box" class="ah-oss-error-box" style="display:none;"></div>' +
            '<div id="ah-oss-ok-box" class="ah-oss-ok-box" style="display:none;"></div>' +

            // 操作按钮
            '<div class="ah-oss-section-title" style="margin-top:20px;">数据同步</div>' +
            '<div class="ah-oss-row">' +
              '<button class="ah-wifi-btn ah-wifi-primary" id="ah-oss-push" ' + (phase !== 'idle' || !connected ? 'disabled' : '') + '>' +
                '<i class="fas fa-cloud-arrow-up"></i> 立即上传</button>' +
              '<button class="ah-wifi-btn ah-wifi-primary" id="ah-oss-pull" ' + (phase !== 'idle' ? 'disabled' : '') + '>' +
                '<i class="fas fa-cloud-arrow-down"></i> 拉取云端备份</button>' +
              '<button class="ah-wifi-btn ah-wifi-secondary" id="ah-oss-toggle-enable">' +
                (window.CloudSync && window.CloudSync.isEnabled() ? '<i class="fas fa-toggle-on"></i> 自动同步已开' : '<i class="fas fa-toggle-off"></i> 自动同步已关') +
              '</button>' +
            '</div>' +

            // 提示
            '<div class="ah-wifi-hint" style="margin-top:14px;">' +
              '<i class="fas fa-info-circle"></i> ' +
              '私有存储模式：数据上传到你自己的阿里云 OSS Bucket，Bucket 内容为 JSON 明文。' +
              '同步包大小通常在 200-500KB（已剔除聊天图片等大 base64 字段，头像和表情包原样保留）。' +
            '</div>';

        bindOssForm();
        bindOssActions();
    }

    function phaseLabel(phase) {
        switch (phase) {
            case 'pushing': return '上传中...';
            case 'pulling': return '恢复中...';
            case 'error': return '错误';
            default: return '空闲';
        }
    }

    function formatTimeAgo(ts) {
        if (!ts) return '从未';
        var diff = Date.now() - ts;
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';
        return new Date(ts).toLocaleString();
    }

    function escapeHtml(s) {
        return String(s || '').replace(/[&<>"']/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
        });
    }

    function getOssFormValues() {
        var bucket = (document.getElementById('ah-oss-bucket') || {}).value || '';
        var endpoint = (document.getElementById('ah-oss-region') || {}).value || 'oss-cn-hangzhou.aliyuncs.com';
        var ak = (document.getElementById('ah-oss-ak') || {}).value || '';
        var skEl = document.getElementById('ah-oss-sk');
        var skValue = skEl ? skEl.value : '';
        var skActual = skValue && skValue.indexOf('••') === 0 ? null : skValue; // 遮罩 → 不覆盖原来的
        // 构造 config
        var cfg = {
            accessKeyId: ak.trim(),
            secretAccessKey: skActual !== null ? skActual.trim() : null,
            bucket: bucket.trim(),
            endpoint: endpoint + '.aliyuncs.com',
            region: endpoint.replace('oss-', '')
        };
        return cfg;
    }

    function showOssOk(msg) {
        var box = document.getElementById('ah-oss-ok-box');
        var errBox = document.getElementById('ah-oss-error-box');
        if (!box) return;
        errBox.style.display = 'none';
        box.innerHTML = '✅ ' + msg;
        box.style.display = 'block';
        setTimeout(function () { box.style.display = 'none'; }, 3000);
    }

    function showOssErr(msg, hint) {
        var box = document.getElementById('ah-oss-error-box');
        var okBox = document.getElementById('ah-oss-ok-box');
        if (!box) return;
        okBox.style.display = 'none';
        box.innerHTML = '❌ ' + msg + (hint ? '<br><span style="font-size:11px;color:var(--text-secondary);">💡 ' + hint + '</span>' : '');
        box.style.display = 'block';
    }

    function bindOssForm() {
        var saveBtn = document.getElementById('ah-oss-save-cfg');
        if (saveBtn) {
            saveBtn.addEventListener('click', function () {
                var cfg = getOssFormValues();
                if (!cfg.accessKeyId || !cfg.bucket || !cfg.secretAccessKey) {
                    showOssErr('请填写完整配置（AK / Bucket / Secret）');
                    return;
                }
                CloudSync.setConfig(cfg);
                showOssOk('配置已保存');
            });
        }
    }

    function bindOssActions() {
        var testBtn = document.getElementById('ah-oss-test');
        var pushBtn = document.getElementById('ah-oss-push');
        var pullBtn = document.getElementById('ah-oss-pull');
        var toggleBtn = document.getElementById('ah-oss-toggle-enable');

        if (testBtn) {
            testBtn.addEventListener('click', async function () {
                testBtn.disabled = true; testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 测试中...';
                var cfg = getOssFormValues();
                // Secret 遮罩时用已存的
                if (!cfg.secretAccessKey) {
                    var existing = CloudSync.getConfig();
                    if (existing && existing.secretAccessKey) cfg.secretAccessKey = existing.secretAccessKey;
                }
                if (!cfg.accessKeyId || !cfg.bucket || !cfg.secretAccessKey) {
                    showOssErr('请先填写完整配置并保存');
                    testBtn.disabled = false; testBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 测试连接';
                    return;
                }
                var res = await CloudSync.testConnection(cfg);
                testBtn.disabled = false; testBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 测试连接';
                if (res.ok) {
                    CloudSync.setConfig(cfg); // 连接成功 → 持久化 config + connectedAt
                    showOssOk('连接成功 ✅ Bucket 可访问');
                    renderOssSubContent(); // 重绘刷新状态
                } else {
                    showOssErr(res.hint || '连接失败', res.isOssError ? res.code : null);
                }
            });
        }

        if (pushBtn) {
            pushBtn.addEventListener('click', async function () {
                if (!CloudSync.isEnabled()) CloudSync.enable();
                CloudSync.triggerPushNow();
                showOssOk('已触发上传');
                setTimeout(renderOssSubContent, 500);
            });
        }

        if (pullBtn) {
            pullBtn.addEventListener('click', async function () {
                pullBtn.disabled = true; pullBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 拉取中...';
                var res = await CloudSync.fetchRemoteSessions();
                pullBtn.disabled = false; pullBtn.innerHTML = '<i class="fas fa-cloud-arrow-down"></i> 拉取云端备份';
                if (!res.ok) {
                    showOssErr(res.error || '拉取失败');
                    return;
                }
                if (!res.sessions || res.sessions.length === 0) {
                    showOssOk('云端还没有任何备份');
                    return;
                }
                // 弹窗让用户选角色
                showRestoreDialog(res.sessions);
            });
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', function () {
                if (CloudSync.isEnabled()) CloudSync.disable();
                else CloudSync.enable();
                renderOssSubContent();
            });
        }

        // 监听 CloudSync 状态变化 → 自动刷新面板
        CloudSync.onStateChange = function () { setTimeout(renderOssSubContent, 50); };
    }

    /* ---------- Restore Dialog（新设备引导）---------- */
    function showRestoreDialog(sessions) {
        var existing = document.getElementById('ah-oss-restore-modal');
        if (existing) existing.remove();

        var html =
            '<div id="ah-oss-restore-modal" class="modal" style="display:flex;">' +
              '<div class="modal-content" style="max-width:480px;">' +
                '<div class="modal-title"><i class="fas fa-cloud-arrow-down"></i><span>发现云端备份</span></div>' +
                '<div style="padding:16px 20px 8px;color:var(--text-secondary);font-size:12.5px;line-height:1.7;">' +
                  '云端共有 <b>' + sessions.length + '</b> 个角色备份。选择一个恢复到本地：恢复过程中请勿关闭 App，完成后会自动刷新。' +
                '</div>' +
                '<div id="ah-oss-restore-list" style="padding:8px 16px;max-height:45vh;overflow-y:auto;"></div>' +
                '<div class="modal-buttons" style="padding:14px 20px;">' +
                  '<button class="modal-btn modal-btn-secondary" id="ah-oss-restore-cancel">取消</button>' +
                '</div>' +
              '</div>' +
            '</div>';

        var wrapper = document.createElement('div');
        wrapper.innerHTML = html.trim();
        document.body.appendChild(wrapper.firstChild);

        var listEl = document.getElementById('ah-oss-restore-list');
        sessions.forEach(function (s) {
            var div = document.createElement('div');
            div.className = 'ah-oss-restore-item';
            div.innerHTML =
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-radius:10px;cursor:pointer;' +
                'border:1px solid rgba(var(--accent-color-rgb),0.15);margin-bottom:8px;transition:.15s;"' +
                'onmouseover="this.style.background=\'rgba(var(--accent-color-rgb),.06)\'"' +
                'onmouseout="this.style.background=\'transparent\'">' +
                  '<div><div style="font-weight:600;color:var(--text-primary);">' + escapeHtml(s.name || s.sessionId) + '</div>' +
                  '<div style="font-size:11.5px;color:var(--text-secondary);margin-top:2px;">' +
                    (s.lastSyncAt ? '上次同步：' + formatCloudTime(s.lastSyncAt) : '未知时间') +
                  '</div></div>' +
                  '<i class="fas fa-arrow-right" style="color:var(--text-secondary);font-size:13px;"></i>' +
                '</div>';
            div.addEventListener('click', function () {
                restoreOneSession(s.sessionId, s.name);
            });
            listEl.appendChild(div);
        });

        document.getElementById('ah-oss-restore-cancel').addEventListener('click', function () {
            document.getElementById('ah-oss-restore-modal').remove();
        });
    }

    function formatCloudTime(iso) {
        if (!iso) return '';
        try { return new Date(iso).toLocaleString(); } catch (e) { return iso; }
    }

    async function restoreOneSession(sessionId, sessionName) {
        var modal = document.getElementById('ah-oss-restore-modal');
        if (modal) modal.remove();

        // Loading 遮罩
        var loadingModal = document.createElement('div');
        loadingModal.className = 'modal';
        loadingModal.style.display = 'flex';
        loadingModal.innerHTML =
            '<div class="modal-content" style="max-width:380px;text-align:center;">' +
              '<div class="fa-4x" style="margin:18px 0;"><i class="fas fa-spinner fa-spin" style="color:var(--accent-color);"></i></div>' +
              '<div style="font-weight:600;color:var(--text-primary);font-size:15px;margin-bottom:8px;">正在恢复 ' + escapeHtml(sessionName || sessionId) + '</div>' +
              '<div style="color:var(--text-secondary);font-size:12px;">请勿关闭 App，恢复期间所有同步操作已暂停</div>' +
            '</div>';
        document.body.appendChild(loadingModal);

        var res = await CloudSync.restoreSession(sessionId);
        loadingModal.remove();

        if (!res.ok) {
            showOssErr('恢复失败：' + (res.error && res.error.message ? res.error.message : res.error));
            return;
        }

        // 成功弹窗
        var okModal = document.createElement('div');
        okModal.className = 'modal';
        okModal.style.display = 'flex';
        okModal.innerHTML =
            '<div class="modal-content" style="max-width:360px;text-align:center;">' +
              '<div class="fa-4x" style="margin:18px 0;color:#10b981;"><i class="fas fa-check-circle"></i></div>' +
              '<div style="font-weight:600;color:var(--text-primary);font-size:15px;margin-bottom:8px;">恢复成功！</div>' +
              '<div style="color:var(--text-secondary);font-size:12px;margin-bottom:16px;">' +
                (res.restoreResult && res.restoreResult.restored ? res.restoreResult.restored : 0) +
                ' 项数据已写入本地。即将刷新页面...' +
              '</div>' +
              '<button class="ah-wifi-btn ah-wifi-primary" onclick="document.body.removeChild(this.closest(\'.modal\'));setTimeout(function(){location.reload();},200);" style="width:100%;">立即进入</button>' +
            '</div>';
        document.body.appendChild(okModal);
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
