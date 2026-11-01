# Apple Hut (milk)

Android WebView 壳 + 本地网页应用。仓库内**不应包含任何签名密钥**。

## ⚠️ 安全提醒：Git 历史中的密钥已泄露

`android/debug.keystore` 与 `android/applehut-release.jks` 曾经被提交到 Git，现有 1.8.x APK 就是用 `debug.keystore` 中 `applehut` 条目签名的——这等同于私钥公开。

本次已完成的处理：

- 从**工作区**删除上述两个密钥库（未提交、未推送）。
- 新增根目录 `.gitignore`，忽略 `*.jks`、`*.keystore`、`keystore.properties`、`*.b64`，防止再次误提交。

**Git 历史中的密钥文件仍然存在。** 任何能克隆仓库的人都可以提取旧私钥，并用它签名“看起来来自本应用”的更新包。请仓库维护者自行决定是否使用 `git filter-repo`（或 BFG）清理历史。该操作会重写提交历史，清理后所有协作者都需要重新克隆仓库；本仓库**没有执行**任何历史重写或 push。

```bash
# 由仓库维护者自行评估后执行，示例：
# git filter-repo --path android/debug.keystore --path android/applehut-release.jks --invert-paths
```

其他必须知道的影响：

- 旧密钥应立即视为作废。如果应用已经上架或已有用户，请不要直接换钥匙发布：按对应商店的密钥轮换流程处理（Google Play 使用 Play App Signing 的上传密钥轮换；国内商店走签名变更流程）。
- 换新密钥后，已安装旧包的用户无法覆盖升级，必须先卸载再安装新包。
- 仓库根目录中历史版本的 APK 仍由旧密钥签名，仅供存档，不要再分发给用户。
- 如果只是本地调试，删除 `debug.keystore` 后 Android Studio / Gradle 会自动生成新的调试密钥，无需恢复旧文件。

## 生成新的发布密钥

```bash
./scripts/gen-keystore.sh
```

脚本参数通过环境变量占位，密码由 `keytool` 在终端中交互输入，不写入任何文件：

| 变量 | 默认值 | 说明 |
|---|---|---|
| `KEYSTORE_FILE` | `keystore/applehut-release.jks` | 输出路径（已被 `.gitignore` 忽略） |
| `KEY_ALIAS` | `applehut` | 密钥别名 |
| `KEY_ALG` | `RSA` | 密钥算法 |
| `KEY_SIZE` | `4096` | 密钥长度 |
| `VALIDITY_DAYS` | `10000` | 有效期（天） |
| `DNAME_CN` / `DNAME_OU` / `DNAME_O` / `DNAME_L` / `DNAME_ST` / `DNAME_C` | `Apple Hut` / `Personal` / `AppleHut` / `CN` / `CN` / `CN` | 证书主题 |

示例：

```bash
KEY_ALIAS=release KEY_SIZE=4096 VALIDITY_DAYS=36500 ./scripts/gen-keystore.sh
```

生成后请立刻把 keystore 文件和密码备份到离线安全位置（密码管理器、加密 U 盘）。**丢失密钥将无法再更新已发布的应用。**

## 本地签名配置

```bash
cp keystore.properties.template keystore.properties
# 编辑 keystore.properties：填写 keystore 的真实路径、storePassword、keyAlias、keyPassword
```

`keystore.properties` 已被 `.gitignore` 忽略，**不要提交**。模板内容见 [keystore.properties.template](keystore.properties.template)。

## Gradle 签名片段（Groovy DSL）

仓库目前是手工打包，没有 Gradle 工程。迁移到 Gradle 后，可在 `android/app/build.gradle` 中使用：

```groovy
// 优先读取 keystore.properties；不存在时回退到 CI 环境变量
def keystorePropsFile = rootProject.file("keystore.properties")
def keystoreProps = new Properties()
if (keystorePropsFile.exists()) {
    keystorePropsFile.withInputStream { keystoreProps.load(it) }
}

def releaseStoreFile = keystoreProps.getProperty("storeFile") ?: System.getenv("KEYSTORE_FILE")
def releaseStorePassword = keystoreProps.getProperty("storePassword") ?: System.getenv("KEYSTORE_PASSWORD")
def releaseKeyAlias = keystoreProps.getProperty("keyAlias") ?: System.getenv("KEY_ALIAS")
def releaseKeyPassword = keystoreProps.getProperty("keyPassword") ?: System.getenv("KEY_PASSWORD")

android {
    signingConfigs {
        release {
            storeFile file(releaseStoreFile)
            storePassword releaseStorePassword
            keyAlias releaseKeyAlias
            keyPassword releaseKeyPassword
            enableV1Signing true   // 兼容 minSdk 23
            enableV2Signing true
            enableV3Signing true
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}

// 只在真正构建 release 时校验，避免影响 debug 构建
gradle.taskGraph.whenReady { graph ->
    if (graph.hasTask(":app:assembleRelease")
            && !(releaseStoreFile && releaseStorePassword && releaseKeyAlias && releaseKeyPassword)) {
        throw new GradleException(
                "缺少签名配置：请创建 keystore.properties，或设置 KEYSTORE_FILE / KEYSTORE_PASSWORD / KEY_ALIAS / KEY_PASSWORD")
    }
}
```

## GitHub Actions 还原 keystore 并签名（片段）

先把 keystore 转为 base64 并保存到仓库 Secrets：

```bash
# Linux
base64 -w0 keystore/applehut-release.jks
# macOS
base64 -i keystore/applehut-release.jks | tr -d '\n'
```

需要配置的 Secrets：

| Secret | 内容 |
|---|---|
| `KEYSTORE_BASE64` | keystore 文件的 base64（单行，无换行） |
| `KEYSTORE_PASSWORD` | keystore 密码 |
| `KEY_ALIAS` | 密钥别名 |
| `KEY_PASSWORD` | 密钥密码 |

```yaml
name: android-release

on:
  workflow_dispatch:
  push:
    tags: ["v*"]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: "17"

      - name: Restore signing keystore
        env:
          KEYSTORE_BASE64: ${{ secrets.KEYSTORE_BASE64 }}
        run: |
          umask 077
          mkdir -p "$RUNNER_TEMP/keystore"
          printf '%s' "$KEYSTORE_BASE64" | base64 --decode > "$RUNNER_TEMP/keystore/release.jks"

      - name: Assemble release
        env:
          KEYSTORE_FILE: ${{ runner.temp }}/keystore/release.jks
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
        run: ./gradlew :app:assembleRelease

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: release-apk
          path: app/build/outputs/apk/release/*.apk

      - name: Remove keystore
        if: always()
        run: rm -f "$RUNNER_TEMP/keystore/release.jks"
```

注意：

- 不要在 workflow 里把 keystore 或密码 `echo` 出来，也不要把 Secret 写进构建产物。
- 如果使用 Google Play，建议启用 Play App Signing：CI 中的 keystore 只是“上传密钥”，可在 Play Console 轮换，不直接影响用户已安装应用的签名。
