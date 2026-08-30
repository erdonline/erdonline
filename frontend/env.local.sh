#!/bin/sh
# 本地开发：生成 env-config.js。
# 默认空值 = 前端走同源相对路径，由 Umi dev proxy（config/proxy.ts）代理到 localhost:9502。
# 若需本地 UI 打公网 API：在 frontend/.env 设 API_URL=https://api.erdonline.com（gitignored）。
set -e

if [ -f .env ]; then
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
