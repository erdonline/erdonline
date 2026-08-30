#!/bin/sh
# 本地开发：生成 env-config.js。
# 默认空值 = 前端走同源相对路径，由 Umi dev proxy（config/proxy.ts）代理到 localhost:9502。
# 若需本地 UI 打公网 API：复制 .env.example 为 .env 并设 API_URL（gitignored）。
# CI（CI=true）永不读 .env，避免把本地/误提交的公网 API 带进 e2e-smoke。
set -e

# 不继承父 shell 的 API_URL（GHA / zshrc）；只允许 .env 覆盖。
unset API_URL ERD_API_URL

if [ "${CI:-}" != "true" ] && [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

: "${API_URL:=}"
: "${ERD_API_URL:=${API_URL}}"
: "${LOCALE:=}"

cat > env-config.js <<EOF
window._env_ = {
  API_URL: "${API_URL}",
  ERD_API_URL: "${ERD_API_URL}",
  LOCALE: "${LOCALE}",
}
EOF
