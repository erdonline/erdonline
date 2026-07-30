#!/bin/sh
# 运行时用环境变量重写 env-config.js，让前端指向正确的后端地址。
# 默认走同源（空前缀），由 nginx 反代 /oauth /auth /syst /ncnb 到 backend。
set -e

: "${API_URL:=}"
: "${ERD_API_URL:=${API_URL}}"

cat > /usr/share/nginx/html/env-config.js <<EOF
window._env_ = {
  API_URL: "${API_URL}",
  ERD_API_URL: "${ERD_API_URL}",
}
EOF
