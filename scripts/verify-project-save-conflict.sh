#!/usr/bin/env bash
# ADR-0022：project/save 乐观锁 — 陈旧 updateTime → 409；匹配 → 200 + 新 updateTime
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="${ERD_API_URL:-http://127.0.0.1:9502}"

if ! curl -sf "${BASE}/actuator/health" >/dev/null 2>&1; then
  echo "FAIL: backend not up at ${BASE} — run ./backend/dev-ensure.sh first"
  exit 1
fi

# 登录拿 JWT（默认 smoke 账号）
LOGIN_JSON=$(curl -sf -X POST "${BASE}/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"123456"}')
TOKEN=$(python3 -c "import json,sys; j=json.load(sys.stdin); print(j.get('access_token') or j.get('data',{}).get('access_token',''))" <<<"$LOGIN_JSON")
if [[ -z "$TOKEN" ]]; then
  echo "FAIL: login — no access_token"
  exit 1
fi

AUTH="Authorization: Bearer ${TOKEN}"

# 建临时项目
ADD_JSON=$(curl -sf -X POST "${BASE}/ncnb/project/add" \
  -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"projectName":"optlock-verify-'"$(date +%s)"'","description":"optimistic lock verify","projectJSON":{"modules":[]}}')
ADD_CODE=$(python3 -c "import json,sys; print(json.load(sys.stdin).get('code'))" <<<"$ADD_JSON")
PROJECT_ID=$(python3 -c "import json,sys; print(json.load(sys.stdin).get('data',''))" <<<"$ADD_JSON")
if [[ "$ADD_CODE" != "200" || -z "$PROJECT_ID" || "$PROJECT_ID" == "None" ]]; then
  echo "FAIL: add project — $ADD_JSON"
  exit 1
fi

INFO_JSON=$(curl -sf -X GET "${BASE}/ncnb/project/info/${PROJECT_ID}" -H "$AUTH")
UPDATE_TIME=$(python3 -c "import json,sys; print(json.load(sys.stdin).get('data',{}).get('updateTime',''))" <<<"$INFO_JSON")
if [[ -z "$UPDATE_TIME" || "$UPDATE_TIME" == "None" ]]; then
  echo "FAIL: info missing updateTime"
  exit 1
fi

# 成功保存（匹配 revision）
OK_JSON=$(curl -sf -X POST "${BASE}/ncnb/project/save" \
  -H "$AUTH" -H 'Content-Type: application/json' \
  -d "$(python3 - <<PY
import json
print(json.dumps({
  "id": "$PROJECT_ID",
  "updateTime": "$UPDATE_TIME",
  "projectJSON": {"modules": [{"name": "M1", "entities": []}]},
}))
PY
)")
OK_CODE=$(python3 -c "import json,sys; print(json.load(sys.stdin).get('code'))" <<<"$OK_JSON")
NEW_TIME=$(python3 -c "import json,sys; print(json.load(sys.stdin).get('data',{}).get('updateTime',''))" <<<"$OK_JSON")
if [[ "$OK_CODE" != "200" || -z "$NEW_TIME" || "$NEW_TIME" == "None" ]]; then
  echo "FAIL: expected 200 + new updateTime, got: $OK_JSON"
  exit 1
fi

# 冲突保存（陈旧 revision）
CONFLICT_JSON=$(curl -sf -X POST "${BASE}/ncnb/project/save" \
  -H "$AUTH" -H 'Content-Type: application/json' \
  -d "$(python3 - <<PY
import json
print(json.dumps({
  "id": "$PROJECT_ID",
  "updateTime": "$UPDATE_TIME",
  "projectJSON": {"modules": [{"name": "Stale", "entities": []}]},
}))
PY
)")
CONFLICT_CODE=$(python3 -c "import json,sys; print(json.load(sys.stdin).get('code'))" <<<"$CONFLICT_JSON")
if [[ "$CONFLICT_CODE" != "409" ]]; then
  echo "FAIL: expected 409 on stale updateTime, got: $CONFLICT_JSON"
  exit 1
fi

# 清理
curl -sf -X POST "${BASE}/ncnb/project/delete" \
  -H "$AUTH" -H 'Content-Type: application/json' \
  -d "{\"id\":\"${PROJECT_ID}\"}" >/dev/null

echo "OK project optimistic lock: 200+new updateTime; stale → 409"
