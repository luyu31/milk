/**
 * SummerDaylight / 夏日白昼 —— 可选主题叠加层
 * 设计：
 *   - 默认不启用（首次安装无 data-summer 属性）
 *   - 开关开启：html[data-summer="1"] + localStorage.summerDaylight="1"
 *   - 开关关闭：仅移除 data-summer 属性 + 清 localStorage，**不碰 data-color-theme**
 *     即——用户关掉叠加层，立即回到他原来选的 gold/blue/purple/xia-yizhou 等主题
 *   - 启动时读 localStorage，仅当值为 "1" 时启用，绝不主动开启
 */
(function () {
    'use strict';

    const LS_KEY = 'summerDaylight';
    const ATTR   = 'data-summer';

    function isEnabled() {
        return localStorage.getItem(LS_KEY) === '1';
    }

    function apply(enabled) {
        if (enabled) {
            document.documentElement.setAttribute(ATTR, '1');
            localStorage.setItem(LS_KEY, '1');
        } else {
            document.documentElement.removeAttribute(ATTR);
            localStorage.removeItem(LS_KEY);
        }
        // 同步设置页开关 UI（如果存在）
        const tog = document.getElementById('summer-daylight-toggle');
        if (tog && tog.checked !== !!enabled) {
            tog.checked = !!enabled;
        }
        // 同步"夏日白昼"预览卡激活态
        const card = document.getElementById('summer-daylight-card');
        if (card) {
            if (enabled) card.classList.add('summer-active');
            else         card.classList.remove('summer-active');
        }
    }

    function enable()  { apply(true); }
    function disable() { apply(false); }
    function toggle()  { apply(!isEnabled()); }

    function boot() {
        // 仅当 localStorage 显式为 "1" 时才开启；否则保持原样
        if (isEnabled()) apply(true);
        // 其他残留（任何老版本遗留属性）一律清
        if (localStorage.getItem(LS_KEY) === '0') {
            localStorage.removeItem(LS_KEY);
        }
    }

    function wireUI() {
        // 设置页开关
        const tog = document.getElementById('summer-daylight-toggle');
        if (tog) {
            tog.checked = isEnabled();
            tog.addEventListener('change', function () { apply(tog.checked); });
        }
        // 预览卡点击 = 开关
        const card = document.getElementById('summer-daylight-card');
        if (card) {
            const clickable = card;
            const onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                apply(!isEnabled());
            };
            clickable.addEventListener('click', onclick);
            clickable.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onclick(e); }
            });
            // 初始激活态
            if (isEnabled()) card.classList.add('summer-active');
        }
    }

    // 暴露到全局（给设置页 toggle / 主题编辑器调用）
    window.SummerDaylight = { enable, disable, toggle, isEnabled, boot, apply };

    // 启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            boot();
            // UI 可能在稍后注入，等一下
            setTimeout(wireUI, 600);
            setTimeout(wireUI, 1600);
        });
    } else {
        boot();
        setTimeout(wireUI, 300);
        setTimeout(wireUI, 1200);
    }
})();
