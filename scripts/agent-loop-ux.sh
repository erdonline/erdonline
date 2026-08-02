#!/usr/bin/env bash
# UX 进化心跳：默认 30m（UX 走查 + Playwright 切片耗时远超 5m，5m 心跳会撞在切片中途）。
# 与 agent-loop-vision.sh 互补：Vision=产品交付节奏；本循环=旅程走查与摩擦消除。
# 每次重新读 prompt 文件，改文件即生效；agent 回报 idle 也不退出（走查本身就是交付）。
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROMPT_FILE="${ROOT}/scripts/agent-loop-ux.prompt.md"
INTERVAL="${AGENT_LOOP_UX_INTERVAL:-1800}"

emit() {
  if [[ ! -f "$PROMPT_FILE" ]]; then
    echo "AGENT_LOOP_TICK_UX {\"prompt\":\"缺少 ${PROMPT_FILE}；请恢复该文件。循环继续，下一 tick 再试。\"}"
    return 0
  fi
  local body payload
  if ! body=$(cat "$PROMPT_FILE" 2>/dev/null); then
    echo "AGENT_LOOP_TICK_UX {\"prompt\":\"无法读取 ${PROMPT_FILE}；循环继续。\"}"
    return 0
  fi
  if ! payload=$(PROMPT_BODY="$body" python3 - <<'PY'
import json, os
body = os.environ["PROMPT_BODY"]
prompt = (
    "你是 ERD Online 的 UX 进化循环（UX 30m）。"
    "执行 scripts/agent-loop-ux.prompt.md 的完整指令（正文附后）。"
    "本 tick 至少交付：一条真实旅程走查（截图）+ 一个摩擦的最小切片（或摩擦登记）。"
    "禁止以 idle / 只剩化妆品 结束；选题必须挂在北极星杠杆上。"
    "勿与并行 implementer 抢改同一未提交大块（尤其 DesignLayout）。\n\n"
    + body
)
print(json.dumps({"prompt": prompt}, ensure_ascii=False))
PY
  ); then
    echo "AGENT_LOOP_TICK_UX {\"prompt\":\"emit 编码失败；循环继续，下一 tick 再试。\"}"
    return 0
  fi
  echo "AGENT_LOOP_TICK_UX ${payload}"
  return 0
}

trap '' SIGHUP

echo "agent-loop-ux: started interval=${INTERVAL}s prompt=${PROMPT_FILE} (never exits on agent idle)" >&2

while true; do
  sleep "$INTERVAL" || true
  emit || true
done
