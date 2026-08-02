#!/usr/bin/env bash
# 自部署验收：对已拉起的栈做 curl / 可选 Flyway 断言（本地 yarn/dev-ensure 或 docker compose 均可）。
# 用法：
#   ./scripts/verify-self-deploy.sh
#   API_BASE=http://127.0.0.1:9502 FE_BASE=http://127.0.0.1:8000 ./scripts/verify-self-deploy.sh
#   SKIP_FE=1 SKIP_FLYWAY=1 ./scripts/verify-self-deploy.sh
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:9502}"
FE_BASE="${FE_BASE:-http://localhost:8000}"
MYSQL_CONTAINER="${MYSQL_CONTAINER:-erd-mysql}"
DB_ERD="${DB_ERD:-erd}"
DB_ERD_USERNAME="${DB_ERD_USERNAME:-erd}"
DB_ERD_PASSWORD="${DB_ERD_PASSWORD:-erd}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-root}"
SKIP_FE="${SKIP_FE:-0}"
SKIP_FLYWAY="${SKIP_FLYWAY:-0}"

fail=0
ok=0

pass() {
  echo "OK   $*"
  ok=$((ok + 1))
}

die() {
  echo "FAIL $*"
  fail=$((fail + 1))
}

echo "== self-deploy acceptance =="
echo "API_BASE=$API_BASE  FE_BASE=$FE_BASE"

# --- health ---
health_tmp=$(mktemp)
health_code=$(curl -sS -o "$health_tmp" -w '%{http_code}' "$API_BASE/actuator/health" || echo 000)
if [[ "$health_code" == "200" ]] && grep -q '"status"[[:space:]]*:[[:space:]]*"UP"' "$health_tmp"; then
  pass "GET /actuator/health → UP"
else
  die "GET /actuator/health → HTTP $health_code $(head -c 120 "$health_tmp")"
fi
rm -f "$health_tmp"

# --- info ---
info_tmp=$(mktemp)
info_code=$(curl -sS -o "$info_tmp" -w '%{http_code}' "$API_BASE/actuator/info" || echo 000)
if [[ "$info_code" == "200" ]] \
  && grep -q '"name"[[:space:]]*:[[:space:]]*"erd-online"' "$info_tmp" \
  && grep -q '"version"' "$info_tmp"; then
  pass "GET /actuator/info → app.name=erd-online + version"
else
  die "GET /actuator/info → HTTP $info_code $(head -c 160 "$info_tmp")"
fi
rm -f "$info_tmp"

# --- unexposed actuator must 404 ---
env_code=$(curl -sS -o /dev/null -w '%{http_code}' "$API_BASE/actuator/env" || echo 000)
if [[ "$env_code" == "404" ]]; then
  pass "GET /actuator/env → 404 (not exposed)"
else
  die "GET /actuator/env → HTTP $env_code (expected 404)"
fi

# --- frontend ---
if [[ "$SKIP_FE" != "1" ]]; then
  fe_code=$(curl -sS -o /dev/null -w '%{http_code}' "$FE_BASE/" || echo 000)
  if [[ "$fe_code" == "200" ]]; then
    pass "GET FE / → 200"
  else
    die "GET FE / → HTTP $fe_code (set SKIP_FE=1 to skip)"
  fi
else
  echo "SKIP FE check (SKIP_FE=1)"
fi

# --- Flyway on erd (optional; needs docker + erd-mysql) ---
if [[ "$SKIP_FLYWAY" != "1" ]]; then
  if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -qx "$MYSQL_CONTAINER"; then
    # Prefer app user; fall back to root if grants differ
    flyway_out=$(docker exec "$MYSQL_CONTAINER" mysql -N -u"$DB_ERD_USERNAME" -p"$DB_ERD_PASSWORD" "$DB_ERD" \
      -e "SELECT version FROM flyway_schema_history WHERE success=1 ORDER BY installed_rank DESC LIMIT 1;" 2>/dev/null \
      || docker exec "$MYSQL_CONTAINER" mysql -N -uroot -p"$MYSQL_ROOT_PASSWORD" "$DB_ERD" \
      -e "SELECT version FROM flyway_schema_history WHERE success=1 ORDER BY installed_rank DESC LIMIT 1;" 2>/dev/null \
      || true)
    flyway_ver=$(echo "$flyway_out" | tr -d '[:space:]')
    if [[ -n "$flyway_ver" ]]; then
      pass "erd.flyway_schema_history latest success version=$flyway_ver"
    else
      die "erd.flyway_schema_history empty/missing (backend migrate not applied?)"
    fi
  else
    echo "SKIP Flyway (no docker container $MYSQL_CONTAINER; set SKIP_FLYWAY=1 to silence)"
  fi
else
  echo "SKIP Flyway check (SKIP_FLYWAY=1)"
fi

echo "== summary: ok=$ok fail=$fail =="
if [[ "$fail" -gt 0 ]]; then
  exit 1
fi
exit 0
