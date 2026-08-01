#!/bin/sh
# 本地开发：生成 env-config.js。
# 空值 = 前端走同源相对路径，由 Umi dev proxy（config/proxy.ts）代理到后端，避免跨域。
set -e

cat > env-config.js <<EOF
window._env_ = {
  API_URL: "",
  ERD_API_URL: "",
}
EOF
