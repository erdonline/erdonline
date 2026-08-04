#!/usr/bin/env bash
# Vision 5m 心跳：永久 tick。Agent 回报 idle / 失败 / 空转也绝不退出；
# 每次重新读 prompt 文件，改文件即生效，无需重启本进程。
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROMPT_FILE="${ROOT}/scripts/agent-loop-vision.prompt.md"
INTERVAL="${AGENT_LOOP_VISION_INTERVAL:-300}"
# 模型路由：think 强模型 / exec 便宜模型（见 prompt.md「模型路由」节）。
# 仅用于拼进下方提示词提醒协调者，不强制生效；协调者仍需按 model-routing.mdc 白名单起 Task。
THINK_MODEL="${VISION_THINK_MODEL:-claude-sonnet-5-thinking-high}"
EXEC_MODEL="${VISION_EXEC_MODEL:-composer-2.5-fast}"

# 永不因单次 emit 失败而退出循环（禁用 set -e 对本脚本主体的影响）
emit() {
  if [[ ! -f "$PROMPT_FILE" ]]; then
    echo "AGENT_LOOP_TICK_VISION {\"prompt\":\"缺少 ${PROMPT_FILE}；请恢复该文件。循环继续，下一 tick 再试。\"}"
    return 0
  fi
  local body payload
  if ! body=$(cat "$PROMPT_FILE" 2>/dev/null); then
    echo "AGENT_LOOP_TICK_VISION {\"prompt\":\"无法读取 ${PROMPT_FILE}；循环继续。\"}"
    return 0
  fi
  if ! payload=$(PROMPT_BODY="$body" THINK_MODEL="$THINK_MODEL" EXEC_MODEL="$EXEC_MODEL" python3 - <<'PY'
import json, os
body = os.environ["PROMPT_BODY"]
think_model = os.environ["THINK_MODEL"]
exec_model = os.environ["EXEC_MODEL"]
prompt = (
    "你是 ERD Online 的产品经理循环（Vision 5m）。"
    "常驻指令：主题锁定「双层一致性与可信保存」（ADR-0022），持续优化不要停；"
    "每 tick 交付主题内一刀（状态可见 / 并发不丢数据 / 实库五态）。"
    "执行 scripts/agent-loop-vision.prompt.md 的完整指令（正文附后）。"
    "本 tick 必须交付一个可验证切片；禁止以 idle / 没事可做 / 队列做完了 结束。"
    "选题优先读 prompt 内切片队列，其次 docs/roadmap.md 双层一致性区与 git 现场。"
    "Agent 回报 idle 不会停止本 shell——下一轮 5m 仍会唤醒；你应直接开工而非空转。"
    f"模型路由（思考用强模型、执行用便宜模型，细则见正文「模型路由」节）：决策类子步骤用 Task 起 think（默认 {think_model}），"
    f"代码落地/测试/commit 用 Task 起 exec（默认 {exec_model}）；不要用同一次昂贵调用既想又写大段代码。\n\n"
    + body
)
print(json.dumps({"prompt": prompt}, ensure_ascii=False))
PY
  ); then
    echo "AGENT_LOOP_TICK_VISION {\"prompt\":\"emit 编码失败；循环继续，下一 tick 再试。\"}"
    return 0
  fi
  echo "AGENT_LOOP_TICK_VISION ${payload}"
  return 0
}

# 忽略常见终止信号以外的逻辑：本循环刻意常驻；仅 SIGTERM/SIGINT 由运维显式杀掉
trap '' SIGHUP

echo "agent-loop-vision: started interval=${INTERVAL}s prompt=${PROMPT_FILE} (never exits on agent idle)" >&2

while true; do
  sleep "$INTERVAL" || true
  emit || true
done
