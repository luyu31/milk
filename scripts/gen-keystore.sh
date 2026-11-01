#!/usr/bin/env bash
# 生成新的 Android 发布签名密钥库。
#
# 设计原则：
#   - 密码不落盘、不写死：由 keytool 在终端交互式提示输入。
#   - 生成的 keystore 默认位于 keystore/ 下，已被 .gitignore 忽略。
#   - 生成后立刻离线备份；丢失密钥将无法更新已发布的应用。
#
# 可通过环境变量覆盖以下参数：
#   KEYSTORE_FILE  密钥库输出路径（默认 keystore/applehut-release.jks）
#   KEY_ALIAS      密钥别名（默认 applehut）
#   KEY_ALG        密钥算法（默认 RSA）
#   KEY_SIZE       密钥长度（默认 4096）
#   VALIDITY_DAYS  有效期天数（默认 10000）
#   DNAME_CN / DNAME_OU / DNAME_O / DNAME_L / DNAME_ST / DNAME_C  证书主题信息

set -euo pipefail
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

KEYSTORE_FILE="${KEYSTORE_FILE:-keystore/applehut-release.jks}"
KEY_ALIAS="${KEY_ALIAS:-applehut}"
KEY_ALG="${KEY_ALG:-RSA}"
KEY_SIZE="${KEY_SIZE:-4096}"
VALIDITY_DAYS="${VALIDITY_DAYS:-10000}"

DNAME_CN="${DNAME_CN:-Apple Hut}"
DNAME_OU="${DNAME_OU:-Personal}"
DNAME_O="${DNAME_O:-AppleHut}"
DNAME_L="${DNAME_L:-CN}"
DNAME_ST="${DNAME_ST:-CN}"
DNAME_C="${DNAME_C:-CN}"

if ! command -v keytool >/dev/null 2>&1; then
    echo "错误：找不到 keytool，请先安装 JDK 并确保 keytool 在 PATH 中。" >&2
    exit 1
fi

if [ ! -t 0 ]; then
    echo "错误：需要交互式终端来输入密码。CI 中请使用 GitHub Secrets 还原已有 keystore，而不是现场生成。" >&2
    exit 1
fi

if [ -e "$KEYSTORE_FILE" ]; then
    echo "错误：$KEYSTORE_FILE 已存在。" >&2
    echo "如需轮换密钥，请先自行离线备份并移走旧文件，不要直接覆盖。" >&2
    exit 1
fi

mkdir -p "$(dirname "$KEYSTORE_FILE")"

echo "即将生成发布密钥库："
echo "  文件    : $KEYSTORE_FILE"
echo "  别名    : $KEY_ALIAS"
echo "  算法    : $KEY_ALG $KEY_SIZE"
echo "  有效期  : $VALIDITY_DAYS 天"
echo "  DN      : CN=$DNAME_CN, OU=$DNAME_OU, O=$DNAME_O, L=$DNAME_L, ST=$DNAME_ST, C=$DNAME_C"
echo
echo "接下来 keytool 会提示输入两次 keystore 密码（以及 key 密码，PKCS12 下通常与 keystore 密码相同）。"
echo "密码只保存在终端会话中，不会写入本仓库的任何文件。"
echo

keytool -genkeypair -v \
    -keystore "$KEYSTORE_FILE" \
    -alias "$KEY_ALIAS" \
    -keyalg "$KEY_ALG" \
    -keysize "$KEY_SIZE" \
    -validity "$VALIDITY_DAYS" \
    -storetype PKCS12 \
    -dname "CN=$DNAME_CN, OU=$DNAME_OU, O=$DNAME_O, L=$DNAME_L, ST=$DNAME_ST, C=$DNAME_C"

echo
echo "已生成：$KEYSTORE_FILE"
echo "下一步："
echo "  1. 立即把 $KEYSTORE_FILE 和密码备份到离线安全位置（密码管理器 / 加密 U 盘）。"
echo "  2. cp keystore.properties.template keystore.properties，然后填写真实路径与密码。"
echo "  3. 确认 $KEYSTORE_FILE 与 keystore.properties 都没有被 git 跟踪（已被 .gitignore 忽略）。"
echo "  4. 如需 CI：base64 -w0 \"$KEYSTORE_FILE\" 的输出放入 GitHub Secret（例如 KEYSTORE_BASE64）。"
