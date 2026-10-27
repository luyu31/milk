/* Apple Hut：像素封面交互 + 安卓本地保存桥接 */
(function () {
    'use strict';

    /* ---------- 封面 ---------- */
    var cover = document.getElementById('applehut-cover');
    var closed = false;

    function closeCover() {
        if (closed || !cover) return;
        closed = true;
        cover.classList.add('applehut-cover-out');
        setTimeout(function () {
            if (cover && cover.parentNode) cover.parentNode.removeChild(cover);
        }, 650);
        // 进入后提示一次可左右滑动/长按复制
        try {
            if (window.AppleHut && window.AppleHut.toast) {
                window.AppleHut.toast('欢迎回到 Apple Hut');
            }
        } catch (e) {}
    }

    if (cover) {
        cover.addEventListener('click', closeCover);
        cover.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') closeCover();
        });
    }

    /* ---------- 安卓端保存文件 ---------- */
    // WebView 里 blob: 链接无法直接下载，改为交给原生保存到“文件/下载”
    var nativeClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
        var self = this;
        try {
            var href = this.href || '';
            var name = this.download || '';
            if (window.AppleHut && window.AppleHut.saveFile && href.indexOf('blob:') === 0 && name) {
                var mime = 'application/octet-stream';
                fetch(href).then(function (res) {
                    return res.blob();
                }).then(function (blob) {
                    mime = blob.type || mime;
                    var reader = new FileReader();
                    reader.onloadend = function () {
                        var result = String(reader.result || '');
                        var base64 = result.indexOf(',') >= 0 ? result.split(',')[1] : '';
                        if (base64) window.AppleHut.saveFile(name, mime, base64);
                    };
                    reader.readAsDataURL(blob);
                }).catch(function () {
                    nativeClick.call(self);
                });
                return;
            }
        } catch (e) {
            // 出错时仍走原生逻辑
        }
        return nativeClick.apply(this, arguments);
    };

    // 让原生知道页面已就绪
    try {
        if (window.AppleHut && window.AppleHut.ready) window.AppleHut.ready();
    } catch (e) {}
})();
