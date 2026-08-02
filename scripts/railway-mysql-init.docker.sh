#!/usr/bin/env bash
# Railway / 远程 MySQL：在 mysql 客户端容器内执行 railway-mysql-init.sh（无需本机 mysql）。
#
# 用法（在仓库根执行；密码勿写入仓库）：
#   MYSQL_URL='mysql://root:PASSWORD@HOST:PORT/railway' ./scripts/railway-mysql-init.docker.sh
#
#   # 或拆开变量
#   MYSQLHOST=… MYSQLPORT=3306 MYSQLUSER=root MYSQLPASSWORD=… ./scripts/railway-mysql-init.docker.sh
#
#   # 可选：连接信息未在 env 中时，从仓库根 .env 加载（/.env 已 gitignore；勿 commit）
#   #   echo 'MYSQL_URL=mysql://root:…@HOST:PORT/railway' >> .env
#   ./scripts/railway-mysql-init.docker.sh
#
#   # 透传参数给内层脚本
#   MYSQL_URL='mysql://root:x@example:3306/railway' ./scripts/railway-mysql-init.docker.sh --dry-run
#
# 依赖：Docker；镜像默认 mysql:8（可用 MYSQL_DOCKER_IMAGE 覆盖）。
# 说明：本地 docker-compose 空卷首启已挂载 db/init，不必跑本脚本；本脚本面向 Railway 等远程实例。

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INNER="$ROOT/scripts/railway-mysql-init.sh"
IMAGE="${MYSQL_DOCKER_IMAGE:-mysql:8}"

die() {
  echo "ERROR: $*" >&2
  exit 1
}

command -v docker >/dev/null 2>&1 || die "docker not found; install Docker Desktop / Engine"
[[ -f "$INNER" ]] || die "missing $INNER"
[[ -d "$ROOT/db/init" ]] || die "missing $ROOT/db/init"

# Load .env only when connection host/url not already in the environment (CLI wins).
if [[ -z "${MYSQL_URL:-}${MYSQLHOST:-}${MYSQL_HOST:-}" && -f "$ROOT/.env" ]]; then
  echo "== loading $ROOT/.env (local only; do not commit) =="
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

[[ -n "${MYSQL_URL:-}${MYSQLHOST:-}${MYSQL_HOST:-}" ]] \
  || die "missing connection: set MYSQL_URL or MYSQLHOST (env / .env), then re-run"

env_args=()
for v in MYSQL_URL MYSQLHOST MYSQLPORT MYSQLUSER MYSQLPASSWORD \
         MYSQL_HOST MYSQL_PORT MYSQL_USER MYSQL_PASSWORD MYSQL_PASS; do
  if [[ -n "${!v:-}" ]]; then
    env_args+=(-e "$v")
  fi
done

echo "== railway-mysql-init.docker =="
echo "image=$IMAGE"
echo "mount=$ROOT → /work (ro)"

# mysql:8 includes bash + mysql client; default bridge reaches Railway TCP Proxy.
exec docker run --rm -i \
  -v "$ROOT:/work:ro" \
  -w /work \
  "${env_args[@]}" \
  "$IMAGE" \
  bash /work/scripts/railway-mysql-init.sh "$@"
