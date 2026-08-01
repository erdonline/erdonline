#!/usr/bin/env bash
# 登录后探测前端常用 /ncnb|/auth 接口：期望非 404/405/500（401 仅匿名场景）
# 用法：./scripts/audit-fe-apis.sh [base=http://localhost:9502] [user=e2e0] [pass=123456]
set -euo pipefail
BASE="${1:-http://localhost:9502}"
USER="${2:-e2e0}"
PASS="${3:-123456}"

TOKEN=$(curl -sS -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"$USER\",\"password\":\"$PASS\"}" \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')

auth=(-H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json')
fail=0
ok=0

probe() {
  local method=$1 path=$2 body=${3:-}
  local tmp code
  tmp=$(mktemp)
  if [[ -n "$body" ]]; then
    code=$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "${auth[@]}" -d "$body" "$BASE$path" || echo 000)
  else
    code=$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "${auth[@]}" "$BASE$path" || echo 000)
  fi
  local msg
  msg=$(python3 -c 'import sys,json;d=json.load(open(sys.argv[1]));print(d.get("msg") or d.get("code") or "")' "$tmp" 2>/dev/null || head -c 80 "$tmp")
  rm -f "$tmp"
  # 业务失败（如 AI 未配置）算 WARN；路由/服务器错误算 FAIL
  if [[ "$code" == "404" || "$code" == "405" || "$code" == "500" || "$code" == "000" ]]; then
    echo "FAIL $code $method $path  $msg"
    fail=$((fail+1))
  else
    echo "OK   $code $method $path  $msg"
    ok=$((ok+1))
  fi
}

echo "== auth + core =="
probe GET  /ncnb/dataSources?size=10\&current=1
probe GET  /ncnb/project/statistic
probe GET  /ncnb/project/page?size=10\&current=1
probe GET  /ncnb/project/recent?size=10\&current=1
probe POST /ncnb/queryHistory '{}'
probe GET  /ncnb/queryInfo/tree?projectId=x
probe GET  /ncnb/license/getServerInfos
probe POST /ncnb/dbChange '{"projectId":"x","size":10,"current":1}'
probe POST /ncnb/connector/ping '{"driverClassName":"com.mysql.cj.jdbc.Driver","url":"jdbc:mysql://127.0.0.1:1/x","username":"x","password":"x"}'
probe POST /ncnb/share/create '{"projectId":"nonexistent"}'

echo "== anonymous =="
anon_code=$(curl -sS -o /tmp/anon.json -w '%{http_code}' -X POST "$BASE/ncnb/project/group/user/register" \
  -H 'Content-Type: application/json' \
  -d '{"username":"__audit_probe_never__","pwd":"Abc12345","email":"a@b.c","phone":"13800000000"}' || echo 000)
# 401=未放行；其它（业务校验/冲突）说明已进 Controller
if [[ "$anon_code" == "401" ]]; then
  echo "FAIL $anon_code POST /ncnb/project/group/user/register  still requires auth"
  fail=$((fail+1))
else
  echo "OK   $anon_code POST /ncnb/project/group/user/register  (not 401)"
  ok=$((ok+1))
fi

echo "== summary: ok=$ok fail=$fail =="
[[ "$fail" -eq 0 ]]
