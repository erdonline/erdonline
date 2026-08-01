#!/usr/bin/env bash
# 5 分钟 vision 自迭代心跳：prompt 每次从文件读取，随进度改文件即可，无需重启循环。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROMPT_FILE="${ROOT}/scripts/agent-loop-vision.prompt.md"
INTERVAL="${AGENT_LOOP_VISION_INTERVAL:-300}"

emit() {
  if [[ ! -f "$PROMPT_FILE" ]]; then
    echo "AGENT_LOOP_TICK_VISION {\"prompt\":\"缺少 ${PROMPT_FILE}；请恢复该文件后继续。\"}"
    return
  fi
  # 注入：先读仓库现场选题文件，再执行（避免 payload 写死具体功能）
  local body
  body=$(cat "$PROMPT_FILE")
  local payload
  payload=$(PROMPT_BODY="$body" python3 - <<'PY'
import json, os
body = os.environ["PROMPT_BODY"]
prompt = (
    "执行本仓库 scripts/agent-loop-vision.prompt.md 的完整指令（刚读到的正文如下）。"
    "目标必须从 docs/roadmap.md / CHANGELOG / git 现状现场推导，禁止使用任何写死的功能优先级清单。\n\n"
    + body
)
print(json.dumps({"prompt": prompt}, ensure_ascii=False))
PY
)
  echo "AGENT_LOOP_TICK_VISION ${payload}"
}

while true; do
  sleep "$INTERVAL"
  emit
done
