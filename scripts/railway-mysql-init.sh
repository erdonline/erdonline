#!/usr/bin/env bash
# Railway / 远程 MySQL：建单一业务库 `erd` 并导入 schema-only 基线（db/init）。
# 种子 / demo / E2E 账号由后端启动时 Flyway（classpath:db/migration/erd）写入，本脚本不灌。
#
# 用法（在仓库根执行）：
#   MYSQL_URL='mysql://root:PASSWORD@HOST:PORT/railway' ./scripts/railway-mysql-init.sh
#   MYSQLHOST=… MYSQLPORT=3306 MYSQLUSER=root MYSQLPASSWORD=… ./scripts/railway-mysql-init.sh
#   ./scripts/railway-mysql-init.sh --url 'mysql://root:PASSWORD@HOST:PORT/railway'
#   MYSQL_URL='mysql://root:x@example:3306/railway' ./scripts/railway-mysql-init.sh --dry-run
#
# 导入顺序：
#   建库（01_create_database.sql）→ 02_tables.sql（CREATE TABLE only）
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
      echo "WARN: --with-privileges ignored (ADR-0020: no dual-DB privilege script; use root or MYSQL_USER)" >&2
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
if [[ -z "$MYSQL_PASS" ]]; then
  echo "WARN: empty password (MYSQLPASSWORD / --password)" >&2
fi

command -v mysql >/dev/null 2>&1 || die "mysql client not found; install MySQL client and ensure mysql is on PATH"

[[ -d "$INIT_DIR" ]] || die "init directory not found: $INIT_DIR"

IMPORT_FILES=(
  01_create_database.sql
  02_tables.sql
)

for f in "${IMPORT_FILES[@]}"; do
  [[ -f "$INIT_DIR/$f" ]] || die "missing required init file: $INIT_DIR/$f"
done

echo "== railway-mysql-init =="
echo "host=$MYSQL_HOST port=$MYSQL_PORT user=$MYSQL_USER"
echo "init_dir=$INIT_DIR"
echo "database: erd (single DB; seeds via Flyway on App start)"
[[ "$DRY_RUN" -eq 1 ]] && echo "mode: dry-run (no connection)"

run_mysql() {
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

echo "-- verify schema"
count="$(run_mysql -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='erd' AND table_name='sys_user';" 2>/dev/null || true)"
if [[ "$count" != "1" ]]; then
  die "verify failed: erd.sys_user table missing (expected CREATE from 02_tables.sql)"
fi
echo "OK erd.sys_user table exists"
echo "OK schema init complete. Redeploy App so Flyway applies V3+ seeds (see docs/deployment.md / ADR-0020)."
echo "    Set DB_NAME=erd (or rely on default); DB_HOST←MYSQLHOST; same user/password for both JDBC pools."
