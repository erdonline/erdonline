#!/bin/sh
# 生产构建：用环境变量生成 env-config.js。
# 留空 = 同源，由 nginx 反代 /oauth /auth /syst /ncnb 到后端（与 docker-entrypoint.sh 行为一致）。
set -e

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
