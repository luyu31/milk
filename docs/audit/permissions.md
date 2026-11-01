# 表 B：权限与敏感能力清单

- 盘点对象：`android/AndroidManifest.xml`、`android/java/com/applehut/app/`
- 只读盘点，未修改任何业务代码或配置
- 未声明的高敏权限：CAMERA、RECORD_AUDIO、位置、通讯录、外部存储、电话状态均未出现

## (a) 所有 uses-permission

| 权限 | 声明位置 | 是否 dangerous | 调用位置 |
|---|---|---|---|
| `INTERNET` | `AndroidManifest.xml:9` | 否（normal） | `MainActivity.java:200`（`loadUrl`）；JS 外部资源请求 |
| `POST_NOTIFICATIONS` | `AndroidManifest.xml:10` | 是（dangerous，API 33+ 运行时） | `MainActivity.java:329-346`；`PushHelper.java:31-40`、`61` |
| `RECEIVE_BOOT_COMPLETED` | `AndroidManifest.xml:11` | 否（normal，受保护广播） | `BootReceiver.java:11-21` |
| `WAKE_LOCK` | `AndroidManifest.xml:12` | 否（normal） | 未找到调用（`WakeLock` / `PowerManager` 均无引用） |
| `FOREGROUND_SERVICE` | `AndroidManifest.xml:13` | 否（normal） | `KeepAliveService.java:43`；`MainActivity.java:377`、`386`、`547` |
| `FOREGROUND_SERVICE_DATA_SYNC` | `AndroidManifest.xml:14` | 否（normal） | `KeepAliveService.java:86`；`AndroidManifest.xml:64` |

补充：`POST_NOTIFICATIONS` 仅在运行时由 Web 页调用桥接方法触发（`MainActivity.java:334`），Android 13 以下直接返回。未声明 `SCHEDULE_EXACT_ALARM`，推送排程使用普通 Alarm/Handler 路径。

## (b) exported=true 的组件

| 组件 | 类型 | 是否有 intent-filter | 是否有权限保护 | 声明位置 |
|---|---|---|---|---|
| `MainActivity` | Activity | 是：`android.intent.action.MAIN` + `android.intent.category.LAUNCHER` | 否（启动入口，必须导出） | `AndroidManifest.xml:27-39`（`exported` 在 30 行） |
| `BootReceiver` | BroadcastReceiver | 是：`BOOT_COMPLETED`、`MY_PACKAGE_REPLACED`、`QUICKBOOT_POWERON` | 否（未声明 `android:permission`） | `AndroidManifest.xml:49-58`（`exported` 在 52 行） |

其余组件均不导出：

| 组件 | 类型 | exported | 声明位置 |
|---|---|---|---|
| `PushReceiver` | BroadcastReceiver | false | `AndroidManifest.xml:41-47`（`exported` 在 43 行） |
| `KeepAliveService` | Service | false | `AndroidManifest.xml:60-65`（`exported` 在 63 行，`foregroundServiceType="dataSync"` 在 64 行） |

导出风险说明：

- `MainActivity` 是启动入口，`exported=true` 是系统要求；同时设置了 `launchMode="singleTask"`、`screenOrientation="portrait"`。
- `BootReceiver` 没有自定义权限保护。它只处理系统受保护广播，但任意应用可以发送同名显式广播触发重新排程（`PushScheduler.schedule`，`BootReceiver.java:21`）。该能力与“开机自启 + 模拟消息通知”组合，属于商店审核敏感项。

## (c) WebView 设置

| 设置项 | 实际值 | 代码位置 | 说明 |
|---|---|---|---|
| JavaScript | 开启 | `MainActivity.java:115` | `setJavaScriptEnabled(true)` |
| DOM Storage | 开启 | `MainActivity.java:116` | `setDomStorageEnabled(true)` |
| Database | 开启 | `MainActivity.java:117` | `setDatabaseEnabled(true)` |
| `file://` 访问 | **禁止** | `MainActivity.java:118` | `setAllowFileAccess(false)` |
| `content://` 访问 | 禁止 | `MainActivity.java:119` | `setAllowContentAccess(false)` |
| universal access from file URLs | **未显式设置，默认关闭** | 无设置代码 | targetSdk 34 下 `setAllowUniversalAccessFromFileURLs` 默认 false；且 `file://` 已被 `setAllowFileAccess(false)` 关闭 |
| file URL 跨源访问 | 未显式设置，默认关闭 | 无设置代码 | `setAllowFileAccessFromFileURLs` 默认 false（targetSdk ≥ 16） |
| 混合内容 | **始终允许** | `MainActivity.java:127` | `MIXED_CONTENT_ALWAYS_ALLOW`，配合清单 `usesCleartextTraffic=true` 可加载 http 外链 |
| 媒体自动播放 | 不要求用户手势 | `MainActivity.java:120` | `setMediaPlaybackRequiresUserGesture(false)` |
| JS 原生桥 | 已注入 | `MainActivity.java:142` | `addJavascriptInterface(new NativeBridge(), "AppleHut")` |
| 本地资源拦截 | 已处理 | `MainActivity.java:146-152` | 仅 `applehut.local` 走 `serveAsset`，其余返回 null |
| `shouldOverrideUrlLoading` | **已处理，所有非本域 URI 交给系统** | `MainActivity.java:155-165` | `startActivity(new Intent(ACTION_VIEW, uri))`，**无 scheme 白名单**，`intent://`、自定义 scheme 也会被尝试打开 |
| 文件选择 | 已处理 | `MainActivity.java:178-192` | 走系统 `createIntent()` + SAF，不直接读取本地路径 |
| 网页权限请求 | 全部拒绝 | `MainActivity.java:195-197` | `onPermissionRequest` 直接 `request.deny()`，不会授予相机/麦克风 |
| 启动 URL | `https://applehut.local/index.html` | `MainActivity.java:40`、`200` | `START_URL` 常量为 `https://` + HOST + `/index.html` |
| 明文流量 | 允许 | `AndroidManifest.xml:25` | `usesCleartextTraffic="true"` |
| 备份 | 允许 | `AndroidManifest.xml:17` | `allowBackup="true"`（非 WebView 项，但涉及本地聊天数据） |

补充：

- 未设置 `setSafeBrowsingEnabled`、`setAllowFileAccessFromFileURLs`、`setAllowUniversalAccessFromFileURLs`，也未实现 `onReceivedError` / `onReceivedSslError` 回调。
- WebView 只加载本地 `applehut.local` 资源；页面内引用的第三方图片、音频、字体仍会发起真实外网请求（见 `docs/audit/third-party-urls.md`）。
- `NativeBridge` 暴露了通知、文件保存、设置、保活等方法；由于页面只加载本地资源，主要风险来自外部链接或注入内容触达该桥。
