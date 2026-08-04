#!/bin/sh
# 生产构建：用环境变量生成 env-config.js。
# 留空 = 同源，由 nginx 反代 /oauth /auth /syst /ncnb 到后端（与 docker-entrypoint.sh 行为一致）。
# 静态 CDN / CF Pages demo：构建前设 ERD_REQUIRE_REMOTE_API=1，空 API_URL 将 fail-fast。
set -e

: "${API_URL:=}"
: "${ERD_API_URL:=${API_URL}}"
: "${DEMO_API_URL:=}"
: "${LOCALE:=}"

if [ "${ERD_REQUIRE_REMOTE_API:-}" = "1" ]; then
  effective="${ERD_API_URL:-${API_URL:-${DEMO_API_URL}}}"
  if [ -z "$effective" ]; then
    echo "env.sh: ERD_REQUIRE_REMOTE_API=1 but API_URL, ERD_API_URL, and DEMO_API_URL are all empty" >&2
    echo "env.sh: set GitHub Actions Variable DEMO_API_URL (or export API_URL) before yarn build:prod" >&2
    exit 1
  fi
  case "$effective" in
    http://*|https://*) ;;
    *)
      echo "env.sh: remote API URL must start with http:// or https://" >&2
      exit 1
      ;;
  esac
  host=$(printf '%s' "$effective" | sed -E 's|^https?://([^/@?#]+).*|\1|')
  echo "env.sh: remote API host=${host}"
fi

cat > env-config.js <<EOF
window._env_ = {
  API_URL: "${API_URL}",
  ERD_API_URL: "${ERD_API_URL}",
  LOCALE: "${LOCALE}",
}
EOF
