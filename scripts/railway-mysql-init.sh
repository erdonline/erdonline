#!/usr/bin/env bash
# Railway / 远程 MySQL：建 martin+erd 并按序导入 db/init 基线（不含 E2E 种子）。
#
# 用法（在仓库根执行）：
#   # 公网 URL（Dashboard → MySQL → Connect / TCP Proxy；勿写入 App 的 DB_HOST）
#   MYSQL_URL='mysql://root:PASSWORD@HOST:PORT/railway' ./scripts/railway-mysql-init.sh
#
#   # 或拆开变量（与 Railway 插件名一致）
#   MYSQLHOST=… MYSQLPORT=3306 MYSQLUSER=root MYSQLPASSWORD=… ./scripts/railway-mysql-init.sh
#
#   # 显式参数（覆盖 env）
#   ./scripts/railway-mysql-init.sh --url 'mysql://root:PASSWORD@HOST:PORT/railway'
#   ./scripts/railway-mysql-init.sh --host HOST --port 3306 --user root --password PASS
#
#   # 仅打印将执行的步骤（不连库）
#   ./scripts/railway-mysql-init.sh --dry-run --help
#   MYSQL_URL='mysql://root:x@example:3306/railway' ./scripts/railway-mysql-init.sh --dry-run
#
# 导入顺序（与 docs/deployment.md 一致；本目录实际文件）：
#   建库（等同 01_schema.sql）→ 02_erd → 03_martin → 06…09
#   跳过 05_e2e_users.sql（公网 demo 勿灌）
#   默认跳过 04_privileges.sql（root 可直接用；非 root 可加 --with-privileges）
#
# 依赖：本机已装 mysql 客户端（mysql --version）。
# 无本机客户端时用：./scripts/railway-mysql-init.docker.sh（同参/同 env）。
# 禁止把密码提交进仓库；本脚本不写任何凭证到磁盘。

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INIT_DIR="${ROOT}/db/init"

MYSQL_HOST="${MYSQLHOST:-${MYSQL_HOST:-}}"
MYSQL_PORT="${MYSQLPORT:-${MYSQL_PORT:-3306}}"
MYSQL_USER="${MYSQLUSER:-${MYSQL_USER:-}}"
MYSQL_PASS="${MYSQLPASSWORD:-${MYSQL_PASSWORD:-${MYSQL_PASS:-}}}"
MYSQL_URL_VAL="${MYSQL_URL:-}"
DRY_RUN=0
WITH_PRIVILEGES=0
SHOW_HELP=0

usage() {
  awk 'NR==1{next} /^#/{sub(/^# ?/,""); print; next} {exit}' "$0"
}

die() {
  echo "ERROR: $*" >&2
  exit 1
}

# Parse mysql://user:pass@host:port/db  or mysql://user:pass@host:port
# Also accepts jdbc:mysql://… (strips jdbc: prefix). Query string (?…) ignored.
parse_mysql_url() {
  local raw="$1"
  raw="${raw#jdbc:}"
  [[ "$raw" == mysql://* ]] || die "MYSQL_URL must start with mysql:// (got: ${raw%%:*}://…)"

  local rest="${raw#mysql://}"
  local creds hostport dbpart user pass host port

  if [[ "$rest" == *"@"* ]]; then
    creds="${rest%%@*}"
    hostport="${rest#*@}"
  else
    creds=""
    hostport="$rest"
  fi

  dbpart="${hostport#*/}"
  if [[ "$hostport" == */* ]]; then
    hostport="${hostport%%/*}"
  else
    dbpart=""
  fi
  hostport="${hostport%%\?*}"
  dbpart="${dbpart%%\?*}"

  if [[ -n "$creds" ]]; then
    user="${creds%%:*}"
    if [[ "$creds" == *:* ]]; then
      pass="${creds#*:}"
      # Prefer MYSQLPASSWORD / --password if URL has %XX-encoded secrets
    else
      pass=""
    fi
  else
    user=""
    pass=""
  fi

  if [[ "$hostport" == *:* ]]; then
    host="${hostport%%:*}"
    port="${hostport##*:}"
  else
    host="$hostport"
    port="3306"
  fi

  [[ -n "$host" ]] || die "could not parse host from MYSQL_URL"
  MYSQL_HOST="$host"
  MYSQL_PORT="$port"
  [[ -n "$user" ]] && MYSQL_USER="$user"
  [[ -n "$pass" ]] && MYSQL_PASS="$pass"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      SHOW_HELP=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --with-privileges)
      WITH_PRIVILEGES=1
      shift
      ;;
    --url)
      [[ $# -ge 2 ]] || die "--url requires a value"
      MYSQL_URL_VAL="$2"
      shift 2
      ;;
    --host)
      [[ $# -ge 2 ]] || die "--host requires a value"
      MYSQL_HOST="$2"
      shift 2
      ;;
    --port)
      [[ $# -ge 2 ]] || die "--port requires a value"
      MYSQL_PORT="$2"
      shift 2
      ;;
    --user)
      [[ $# -ge 2 ]] || die "--user requires a value"
      MYSQL_USER="$2"
      shift 2
      ;;
    --password)
      [[ $# -ge 2 ]] || die "--password requires a value"
      MYSQL_PASS="$2"
      shift 2
      ;;
    *)
      die "unknown argument: $1 (try --help)"
      ;;
  esac
done

if [[ "$SHOW_HELP" -eq 1 ]]; then
  usage
  exit 0
fi

if [[ -n "$MYSQL_URL_VAL" ]]; then
  parse_mysql_url "$MYSQL_URL_VAL"
fi

[[ -n "$MYSQL_HOST" ]] || die "missing host: set MYSQL_URL or MYSQLHOST / --host"
[[ -n "$MYSQL_USER" ]] || die "missing user: set MYSQL_URL or MYSQLUSER / --user"
# Password may be empty for some local setups; warn but allow.
if [[ -z "$MYSQL_PASS" ]]; then
  echo "WARN: empty password (MYSQLPASSWORD / --password)" >&2
fi

command -v mysql >/dev/null 2>&1 || die "mysql client not found; install MySQL client and ensure mysql is on PATH"

[[ -d "$INIT_DIR" ]] || die "init directory not found: $INIT_DIR"

# Ordered imports (actual files under db/init/; skip 05; 04 optional)
IMPORT_FILES=(
  02_erd.sql
  03_martin.sql
  06_project_share.sql
  07_data_sources.sql
  08_public_demo.sql
  09_erd_user_new_privileges.sql
)

for f in "${IMPORT_FILES[@]}"; do
  [[ -f "$INIT_DIR/$f" ]] || die "missing required init file: $INIT_DIR/$f"
done

echo "== railway-mysql-init =="
echo "host=$MYSQL_HOST port=$MYSQL_PORT user=$MYSQL_USER"
echo "init_dir=$INIT_DIR"
echo "skip: 05_e2e_users.sql"
if [[ "$WITH_PRIVILEGES" -eq 1 ]]; then
  echo "privileges: will import 04_privileges.sql"
  [[ -f "$INIT_DIR/04_privileges.sql" ]] || die "missing $INIT_DIR/04_privileges.sql"
else
  echo "privileges: skip 04_privileges.sql (root path; use --with-privileges if needed)"
fi
[[ "$DRY_RUN" -eq 1 ]] && echo "mode: dry-run (no connection)"

run_mysql() {
  # stdin = SQL; args after -- forwarded to mysql
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "DRY-RUN: mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER … $*"
    return 0
  fi
  mysql \
    -h "$MYSQL_HOST" \
    -P "$MYSQL_PORT" \
    -u "$MYSQL_USER" \
    -p"$MYSQL_PASS" \
    --protocol=TCP \
    --connect-timeout=15 \
    --default-character-set=utf8mb4 \
    "$@"
}

echo "-- create databases martin + erd (utf8mb4)"
run_mysql -e "
CREATE DATABASE IF NOT EXISTS \`erd\`    DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE DATABASE IF NOT EXISTS \`martin\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
"

if [[ "$WITH_PRIVILEGES" -eq 1 ]]; then
  echo "-- import 04_privileges.sql"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "DRY-RUN: < $INIT_DIR/04_privileges.sql"
  else
    run_mysql < "$INIT_DIR/04_privileges.sql" || die "failed importing 04_privileges.sql"
  fi
fi

for f in "${IMPORT_FILES[@]}"; do
  echo "-- import $f"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "DRY-RUN: < $INIT_DIR/$f"
  else
    run_mysql < "$INIT_DIR/$f" || die "failed importing $f"
  fi
done

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "OK dry-run complete (no SQL executed)"
  exit 0
fi

echo "-- verify"
count="$(run_mysql -N -e "SELECT COUNT(*) FROM martin.sys_user;" 2>/dev/null || true)"
if [[ -z "$count" || "$count" == "0" ]]; then
  die "verify failed: martin.sys_user count empty/zero (expected seed from 03_martin.sql)"
fi
echo "OK martin.sys_user count=$count"
echo "OK init complete. Redeploy Railway App after DB_HOST/DB_MARTIN/DB_ERD are set (see docs/deployment.md)."
