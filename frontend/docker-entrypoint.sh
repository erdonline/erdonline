#!/bin/sh
# 运行时用环境变量重写 index.html 中内联的 window._env_，让前端指向正确的后端地址。
# 默认走同源（空前缀），由 nginx 反代 /oauth /auth /syst /ncnb 到 backend。
set -e

: "${API_URL:=}"
: "${ERD_API_URL:=${API_URL}}"
: "${LOCALE:=}"

# Escape & so sed replacement treats it as literal.
escape_sed_amp() {
  printf '%s' "$1" | sed 's/&/\\&/g'
}

API_URL_ESC=$(escape_sed_amp "$API_URL")
ERD_API_URL_ESC=$(escape_sed_amp "$ERD_API_URL")
LOCALE_ESC=$(escape_sed_amp "$LOCALE")

# 同时保留 env-config.js 文件，供可能直接请求它的场景使用。
cat > /usr/share/nginx/html/env-config.js <<EOF
window._env_ = {
  API_URL: "${API_URL}",
  ERD_API_URL: "${ERD_API_URL}",
  LOCALE: "${LOCALE}",
}
EOF

# 重写所有 HTML 壳里内联的 window._env_
find /usr/share/nginx/html -name 'index.html' -type f -exec \
  sed -i "s~window\._env_ = {[^}]*}~window._env_ = { API_URL: \"${API_URL_ESC}\", ERD_API_URL: \"${ERD_API_URL_ESC}\", LOCALE: \"${LOCALE_ESC}\", }~g" {} +
