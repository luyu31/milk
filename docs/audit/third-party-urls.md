# 表 A：第三方外部直链清单

- 盘点范围：`js/` 下全部 `.js` 文件
- 扫描方式：逐行正则提取 `http(s)://`，行号来自源文件真实行；不包含 `index.html` / `css/`
- 统计结果：**233 条 URL，8 个去重域名**
- 风险等级说明：**高** = 未授权内容分发或授权高度存疑；**中** = 素材版权/来源不明；**低** = 仅外跳或占位符

## 1. 去重域名汇总表（按风险等级降序）

| 域名 | 条数 | 最高风险等级 | 涉及文件 | 说明 |
|---|---:|---|---|---|
| `files.catbox.moe` | 133 | **高** | js/listeners.js | 音频：音乐播放器曲库（歌曲） |
| `img.heliar.top` | 12 | **高** | js/listeners.js | 音频：音乐播放器曲库（歌曲） |
| `music.163.com` | 6 | **高** | js/listeners.js | 音频：音乐播放器曲库（网易云 outer url） |
| `image.uglycat.cc` | 1 | **高** | js/utils.js | 音频：KakaoTalk 预设提示音 |
| `storage.linkship.net` | 1 | **高** | js/features.js | 音频：保活音轨（keepaliveAudioEnabled） |
| `i.postimg.cc` | 78 | **中** | js/games.js | 图片：塔罗牌面图片 |
| `gallery-cf.milk-gallery.workers.dev` | 1 | **低** | js/listeners.js | 其他：外链入口（window.open） |
| `xxxx.supabase.co` | 1 | **低** | js/sync-engine.js | 接口：云同步配置占位符 |

> 排序规则：风险等级 高 → 中 → 低；同等级内按条数降序。

## 2. 高风险明细（逐条，共 153 条）

> 网易云 outer url、catbox、heliar、uglycat、linkship 均单独成行并标为“高”。

| 文件:行号 | 域名 | 完整 URL | 用途 | 风险 |
|---|---|---|---|---|
| js/listeners.js:1512 | `files.catbox.moe` | https://files.catbox.moe/hzpr94.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1607 | `files.catbox.moe` | https://files.catbox.moe/2lcm70.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1612 | `files.catbox.moe` | https://files.catbox.moe/6s65mp.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1617 | `files.catbox.moe` | https://files.catbox.moe/06k9ra.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1622 | `files.catbox.moe` | https://files.catbox.moe/uvucav.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1627 | `files.catbox.moe` | https://files.catbox.moe/inb22a.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1632 | `files.catbox.moe` | https://files.catbox.moe/hrazjt | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1637 | `files.catbox.moe` | https://files.catbox.moe/syfuon.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1642 | `files.catbox.moe` | https://files.catbox.moe/98quqc.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1647 | `files.catbox.moe` | https://files.catbox.moe/5u5dy0.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1652 | `files.catbox.moe` | https://files.catbox.moe/dxgqsk.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1657 | `files.catbox.moe` | https://files.catbox.moe/a7k5wd.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1662 | `files.catbox.moe` | https://files.catbox.moe/94slcd.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1667 | `files.catbox.moe` | https://files.catbox.moe/958qzg.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1672 | `files.catbox.moe` | https://files.catbox.moe/9yl5ic.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1677 | `files.catbox.moe` | https://files.catbox.moe/co58d7.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1682 | `files.catbox.moe` | https://files.catbox.moe/i3f86b.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1687 | `files.catbox.moe` | https://files.catbox.moe/c57gxs.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1692 | `files.catbox.moe` | https://files.catbox.moe/1fp6eg.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1697 | `files.catbox.moe` | https://files.catbox.moe/a0n0l7.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1702 | `files.catbox.moe` | https://files.catbox.moe/2inae2.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1707 | `files.catbox.moe` | https://files.catbox.moe/0uhmxr.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1712 | `files.catbox.moe` | https://files.catbox.moe/f0e93c.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1717 | `files.catbox.moe` | https://files.catbox.moe/iywfe2.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1722 | `files.catbox.moe` | https://files.catbox.moe/4dl0t2.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1727 | `files.catbox.moe` | https://files.catbox.moe/povyqa.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1732 | `files.catbox.moe` | https://files.catbox.moe/fnwtf8.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1737 | `files.catbox.moe` | https://files.catbox.moe/zqfxvd.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1742 | `files.catbox.moe` | https://files.catbox.moe/4spgo5.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1747 | `files.catbox.moe` | https://files.catbox.moe/bk21gu.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1752 | `files.catbox.moe` | https://files.catbox.moe/sfwsuk.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1757 | `files.catbox.moe` | https://files.catbox.moe/69g4fe.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1762 | `files.catbox.moe` | https://files.catbox.moe/01bmnf.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1767 | `files.catbox.moe` | https://files.catbox.moe/9b4lh7.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1772 | `files.catbox.moe` | https://files.catbox.moe/7ml83u.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1777 | `files.catbox.moe` | https://files.catbox.moe/isqax9.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1782 | `files.catbox.moe` | https://files.catbox.moe/9oud6s.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1787 | `files.catbox.moe` | https://files.catbox.moe/hhjwek.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1792 | `files.catbox.moe` | https://files.catbox.moe/g960ev.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1797 | `files.catbox.moe` | https://files.catbox.moe/a3yjvv.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1802 | `files.catbox.moe` | https://files.catbox.moe/1u8m3r.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1807 | `files.catbox.moe` | https://files.catbox.moe/clsiyi.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1812 | `files.catbox.moe` | https://files.catbox.moe/b8hss3.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1817 | `files.catbox.moe` | https://files.catbox.moe/28mw5d.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1822 | `files.catbox.moe` | https://files.catbox.moe/8n9lhi.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1827 | `files.catbox.moe` | https://files.catbox.moe/zi4gxo.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1832 | `files.catbox.moe` | https://files.catbox.moe/4jtex8.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1837 | `files.catbox.moe` | https://files.catbox.moe/2quy44.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1842 | `files.catbox.moe` | https://files.catbox.moe/utmbqp.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1847 | `files.catbox.moe` | https://files.catbox.moe/0bhl3i.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1852 | `files.catbox.moe` | https://files.catbox.moe/xhwrwy.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1857 | `files.catbox.moe` | https://files.catbox.moe/v1k4h8.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1862 | `files.catbox.moe` | https://files.catbox.moe/6uysqy.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1867 | `files.catbox.moe` | https://files.catbox.moe/wtbdxe.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1872 | `files.catbox.moe` | https://files.catbox.moe/de7g2m.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1877 | `files.catbox.moe` | https://files.catbox.moe/or2hm7.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1882 | `files.catbox.moe` | https://files.catbox.moe/nf8o90.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1887 | `files.catbox.moe` | https://files.catbox.moe/na01cn.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1892 | `files.catbox.moe` | https://files.catbox.moe/bumolx.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1897 | `files.catbox.moe` | https://files.catbox.moe/vcidpc.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1902 | `files.catbox.moe` | https://files.catbox.moe/h1hwo5.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1907 | `files.catbox.moe` | https://files.catbox.moe/jlcvkg.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1912 | `files.catbox.moe` | https://files.catbox.moe/40fm4j.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1917 | `files.catbox.moe` | https://files.catbox.moe/hql6w5.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1922 | `files.catbox.moe` | https://files.catbox.moe/r6btwp.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1927 | `files.catbox.moe` | https://files.catbox.moe/ntcqvr.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1932 | `files.catbox.moe` | https://files.catbox.moe/rptwer.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1937 | `files.catbox.moe` | https://files.catbox.moe/icv2aa.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1942 | `files.catbox.moe` | https://files.catbox.moe/iqairg.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1947 | `files.catbox.moe` | https://files.catbox.moe/242a1h.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1952 | `files.catbox.moe` | https://files.catbox.moe/jc1umm.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1957 | `files.catbox.moe` | https://files.catbox.moe/quqaws.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1962 | `files.catbox.moe` | https://files.catbox.moe/zxepep.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1967 | `files.catbox.moe` | https://files.catbox.moe/erds0n.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1972 | `files.catbox.moe` | https://files.catbox.moe/vb6chf.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1977 | `files.catbox.moe` | https://files.catbox.moe/oc86ih.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1982 | `files.catbox.moe` | https://files.catbox.moe/pegwqb.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1987 | `files.catbox.moe` | https://files.catbox.moe/memi6v.aac | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1992 | `files.catbox.moe` | https://files.catbox.moe/5z67vs.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1997 | `files.catbox.moe` | https://files.catbox.moe/i37f39.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2002 | `files.catbox.moe` | https://files.catbox.moe/arym0i.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2007 | `files.catbox.moe` | https://files.catbox.moe/6rk4gw.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2012 | `files.catbox.moe` | https://files.catbox.moe/ca3rim.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2017 | `files.catbox.moe` | https://files.catbox.moe/xtj8db.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2022 | `files.catbox.moe` | https://files.catbox.moe/wnzxou.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2027 | `files.catbox.moe` | https://files.catbox.moe/q2nx16.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2032 | `files.catbox.moe` | https://files.catbox.moe/3qxads.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2037 | `files.catbox.moe` | https://files.catbox.moe/72ik88.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2042 | `files.catbox.moe` | https://files.catbox.moe/966u00.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2047 | `files.catbox.moe` | https://files.catbox.moe/8bncbu.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2052 | `files.catbox.moe` | https://files.catbox.moe/yzo0f8.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2057 | `files.catbox.moe` | https://files.catbox.moe/soz77u.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2062 | `files.catbox.moe` | https://files.catbox.moe/qvu87r.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2067 | `files.catbox.moe` | https://files.catbox.moe/nktyqi.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2072 | `files.catbox.moe` | https://files.catbox.moe/8t4oca.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2077 | `files.catbox.moe` | https://files.catbox.moe/quoufu.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2082 | `files.catbox.moe` | https://files.catbox.moe/1es15e.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2087 | `files.catbox.moe` | https://files.catbox.moe/bujm9x.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2092 | `files.catbox.moe` | https://files.catbox.moe/ultuhw.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2097 | `files.catbox.moe` | https://files.catbox.moe/mees4p.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2102 | `files.catbox.moe` | https://files.catbox.moe/uk1rzh.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2107 | `files.catbox.moe` | https://files.catbox.moe/j5grzr.aac | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2112 | `files.catbox.moe` | https://files.catbox.moe/63p0x7.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2117 | `files.catbox.moe` | https://files.catbox.moe/9l0uva.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2122 | `files.catbox.moe` | https://files.catbox.moe/l0gpmk.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2127 | `files.catbox.moe` | https://files.catbox.moe/gy3bi9.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2132 | `files.catbox.moe` | https://files.catbox.moe/9o5udi.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2137 | `files.catbox.moe` | https://files.catbox.moe/iv8i2j.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2142 | `files.catbox.moe` | https://files.catbox.moe/b398la.aac | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2147 | `files.catbox.moe` | https://files.catbox.moe/m6j0s1.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2152 | `files.catbox.moe` | https://files.catbox.moe/fkjyuk.aac | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2157 | `files.catbox.moe` | https://files.catbox.moe/24q2xu.aac | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2162 | `files.catbox.moe` | https://files.catbox.moe/brd7c5.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2167 | `files.catbox.moe` | https://files.catbox.moe/f86tc1.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2172 | `files.catbox.moe` | https://files.catbox.moe/11vacs.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2177 | `files.catbox.moe` | https://files.catbox.moe/qpxik8.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2182 | `files.catbox.moe` | https://files.catbox.moe/1tlog4.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2187 | `files.catbox.moe` | https://files.catbox.moe/2k1nmo.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2192 | `files.catbox.moe` | https://files.catbox.moe/kyajap.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2197 | `files.catbox.moe` | https://files.catbox.moe/a3iann.aac | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2202 | `files.catbox.moe` | https://files.catbox.moe/6n36qs.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2207 | `files.catbox.moe` | https://files.catbox.moe/3elexm.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2212 | `files.catbox.moe` | https://files.catbox.moe/bm63nl.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2217 | `files.catbox.moe` | https://files.catbox.moe/x6afqu.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2222 | `files.catbox.moe` | https://files.catbox.moe/qg59ox.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2227 | `files.catbox.moe` | https://files.catbox.moe/puq3bz.aac | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2232 | `files.catbox.moe` | https://files.catbox.moe/37g4kw.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2237 | `files.catbox.moe` | https://files.catbox.moe/964spg.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2242 | `files.catbox.moe` | https://files.catbox.moe/rfoi2l.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2247 | `files.catbox.moe` | https://files.catbox.moe/u8521d.aac | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2252 | `files.catbox.moe` | https://files.catbox.moe/4d4hx2.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2257 | `files.catbox.moe` | https://files.catbox.moe/o3jk7p.aac | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:2262 | `files.catbox.moe` | https://files.catbox.moe/utz24h.aac | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1522 | `img.heliar.top` | https://img.heliar.top/file/1773902740144_下载您的文件_—_Convertio_1425997963.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1527 | `img.heliar.top` | https://img.heliar.top/file/1772964128402_陈粒_-_小半.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1532 | `img.heliar.top` | https://img.heliar.top/file/1772964503074_林俊杰_-_当你.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1537 | `img.heliar.top` | https://img.heliar.top/file/1772965264360_林依晨_-_恶作剧.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1542 | `img.heliar.top` | https://img.heliar.top/file/1772963472128_林依晨_-_孤单北半球.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1547 | `img.heliar.top` | https://img.heliar.top/file/1772970137585_项睿娴_-_Dear_D__亲爱的告诉你_.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1552 | `img.heliar.top` | https://img.heliar.top/file/1773547905373_%EC%B2%AB_%EB%88%88__%E5%88%9D%E9%9B%AA_.m4a | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1557 | `img.heliar.top` | https://img.heliar.top/file/1773547910084_My_Love_Mine_All_Mine.m4a | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1562 | `img.heliar.top` | https://img.heliar.top/file/1773547910130_solitude.m4a | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1567 | `img.heliar.top` | https://img.heliar.top/file/1773544800453_%E6%81%8B%E4%BA%BA.m4a | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1572 | `img.heliar.top` | https://img.heliar.top/file/1773543103115_first_snow.mp3.m4a | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1602 | `img.heliar.top` | https://img.heliar.top/file/1772752066038_红颜.mp3 | 音频：音乐播放器曲库（歌曲） | 高 |
| js/listeners.js:1517 | `music.163.com` | http://music.163.com/song/media/outer/url?id=1940368.mp3 | 音频：音乐播放器曲库（网易云 outer url） | 高 |
| js/listeners.js:1577 | `music.163.com` | http://music.163.com/song/media/outer/url?id=3347121761.mp3 | 音频：音乐播放器曲库（网易云 outer url） | 高 |
| js/listeners.js:1582 | `music.163.com` | https://music.163.com/song/media/outer/url?id=5238992.mp3 | 音频：音乐播放器曲库（网易云 outer url） | 高 |
| js/listeners.js:1587 | `music.163.com` | https://music.163.com/song/media/outer/url?id=2065544118.mp3 | 音频：音乐播放器曲库（网易云 outer url） | 高 |
| js/listeners.js:1592 | `music.163.com` | https://music.163.com/song/media/outer/url?id=1845553824.mp3 | 音频：音乐播放器曲库（网易云 outer url） | 高 |
| js/listeners.js:1597 | `music.163.com` | https://music.163.com/song/media/outer/url?id=2635248857.mp3 | 音频：音乐播放器曲库（网易云 outer url） | 高 |
| js/utils.js:166 | `image.uglycat.cc` | https://image.uglycat.cc/jl5xf9.mp3 | 音频：KakaoTalk 预设提示音 | 高 |
| js/features.js:189 | `storage.linkship.net` | https://storage.linkship.net/shared/audio/0db914b9-a94f-4f58-9759-7e95bf58778c.mp3 | 音频：保活音轨（keepaliveAudioEnabled） | 高 |

## 3. 中低风险汇总

| 域名 | 文件:行号 | 条数 | 完整 URL | 用途 | 风险 |
|---|---|---:|---|---|---|
| `i.postimg.cc` | js/games.js:535-612 | 78 | https://i.postimg.cc/hGv9scYL/96e54bea7c980b53d1f2904d6de1139b.jpg … https://i.postimg.cc/MG5FM6Q0/c8093dafa7eb0921bb16f32c77df51f6.jpg | 图片：塔罗牌面图片 | 中 |
| `gallery-cf.milk-gallery.workers.dev` | js/listeners.js:1314 | 1 | https://gallery-cf.milk-gallery.workers.dev/ | 其他：外链入口（window.open） | 低 |
| `xxxx.supabase.co` | js/sync-engine.js:1030 | 1 | https://xxxx.supabase.co | 接口：云同步配置占位符 | 低 |

## 4. 交叉验证

### 4.1 指定命令输出

```bash
grep -rhoE 'https?://[^"'\'' )]+' js/ | sed -E 's#(https?://[^/]+).*#\1#' | sort | uniq -c | sort -rn
```

```text
    133 https://files.catbox.moe
     78 https://i.postimg.cc
     12 https://img.heliar.top
      4 https://music.163.com
      2 http://music.163.com
      1 https://xxxx.supabase.co
      1 https://storage.linkship.net
      1 https://image.uglycat.cc
      1 https://gallery-cf.milk-gallery.workers.dev
```

说明：该命令按“协议 + 域名”分组，`music.163.com` 因同时存在 `http` 与 `https` 被拆成 4 + 2 两行；合计仍为 6 条，总条数 233。

### 4.2 按 host 归一化后的交叉验证

```bash
grep -rhoE 'https?://[^"'\'' )]+' js/ | sed -E 's#https?://([^/]+).*#\1#' | sort | uniq -c | sort -rn
```

```text
    133 files.catbox.moe
     78 i.postimg.cc
     12 img.heliar.top
      6 music.163.com
      1 xxxx.supabase.co
      1 storage.linkship.net
      1 image.uglycat.cc
      1 gallery-cf.milk-gallery.workers.dev
```

结论：按 host 去重后为 **8 个域名**，与表 A 的去重集合完全一致，无漏扫。

## 5. 范围外附注

`index.html` 还存在以下外部依赖（不在 `js/` 扫描范围内，但会随应用启动发起请求）：

- `index.html:12`、`index.html:14`：`fonts.googleapis.com`（Google Fonts）

## 6. 结论

必须替换或移除：网易云 `music.163.com/song/media/outer/url`、`files.catbox.moe`、`img.heliar.top`、`image.uglycat.cc`、`storage.linkship.net` 五类高风险外链；`i.postimg.cc` 的 78 张塔罗牌面需确认版权并在本地内置，`gallery-cf.milk-gallery.workers.dev` 仅作外跳可保留但需评估目标站点内容，`xxxx.supabase.co` 为占位符、不产生真实请求。
