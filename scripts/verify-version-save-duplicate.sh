#!/usr/bin/env bash
# ADR-0022：db_change 版本号唯一 — 同 project+db_key 重复 version → 409001
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="${ERD_API_URL:-http://127.0.0.1:9502}"

if ! curl -sf "${BASE}/actuator/health" >/dev/null 2>&1; then
  echo "FAIL: backend not up at ${BASE} — run ./backend/dev-ensure.sh first"
  exit 1
fi

LOGIN_JSON=$(curl -sf -X POST "${BASE}/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"123456"}')
TOKEN=$(python3 -c "import json,sys; j=json.load(sys.stdin); print(j.get('access_token') or j.get('data',{}).get('access_token',''))" <<<"$LOGIN_JSON")
if [[ -z "$TOKEN" ]]; then
  echo "FAIL: login — no access_token"
  exit 1
fi

AUTH="Authorization: Bearer ${TOKEN}"
PROJECT_ID=""
TS=$(date +%s)

cleanup() {
  if [[ -n "$PROJECT_ID" && "$PROJECT_ID" != "None" ]]; then
    curl -sf -X POST "${BASE}/ncnb/project/delete" \
      -H "$AUTH" -H 'Content-Type: application/json' \
      -d "{\"id\":\"${PROJECT_ID}\"}" >/dev/null || true
  fi
}
trap cleanup EXIT

ADD_JSON=$(curl -sf -X POST "${BASE}/ncnb/project/add" \
  -H "$AUTH" -H 'Content-Type: application/json' \
  -d "{\"projectName\":\"ver-dup-${TS}\",\"description\":\"version duplicate verify\",\"projectJSON\":{\"modules\":[]}}")
ADD_CODE=$(python3 -c "import json,sys; print(json.load(sys.stdin).get('code'))" <<<"$ADD_JSON")
PROJECT_ID=$(python3 -c "import json,sys; print(json.load(sys.stdin).get('data',''))" <<<"$ADD_JSON")
if [[ "$ADD_CODE" != "200" || -z "$PROJECT_ID" || "$PROJECT_ID" == "None" ]]; then
  echo "FAIL: add project — $ADD_JSON"
  exit 1
fi

VERSION_BODY=$(python3 - <<PY
import json
print(json.dumps({
  "projectId": "$PROJECT_ID",
  "dbKey": "SNAPSHOT",
  "version": "1.0.0",
  "versionDesc": "first",
  "baseVersion": True,
  "changes": [],
  "projectJSON": {"modules": []},
  "versionDate": "2026/8/4 0:0:0",
}))
PY
)

OK_JSON=$(curl -sf -X POST "${BASE}/ncnb/hisProject/save" \
  -H "$AUTH" -H 'Content-Type: application/json' \
  -d "$VERSION_BODY")
OK_CODE=$(python3 -c "import json,sys; print(json.load(sys.stdin).get('code'))" <<<"$OK_JSON")
if [[ "$OK_CODE" != "200" ]]; then
  echo "FAIL: first version save expected 200, got: $OK_JSON"
  exit 1
fi

DUP_JSON=$(curl -sf -X POST "${BASE}/ncnb/hisProject/save" \
  -H "$AUTH" -H 'Content-Type: application/json' \
  -d "$VERSION_BODY")
DUP_CODE=$(python3 -c "import json,sys; print(json.load(sys.stdin).get('code'))" <<<"$DUP_JSON")
if [[ "$DUP_CODE" != "409001" ]]; then
  echo "FAIL: duplicate version expected 409001, got: $DUP_JSON"
  exit 1
fi

echo "OK db_change version unique: first save 200; duplicate → 409001"
