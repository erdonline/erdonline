#!/bin/sh
# 幂等保证后端常驻（tmux 会话 erd-be），模型/人都只调这一个入口。
#
# 为什么用 tmux：IDE/agent 的 shell 会话结束会杀掉其子进程，
# nohup 后台化会被误杀；tmux 守护进程独立于任何终端生命周期。
#
# 用法：
#   ./dev-ensure.sh           # 健康则秒退；不健康则在 tmux 中启动 dev-restart.sh
#   ./dev-ensure.sh --restart # 改了 Java/yml/mapper 后强制重启（幂等，可反复调）
#   ./dev-ensure.sh --logs    # 查看最近日志
set -e
cd "$(dirname "$0")"

HEALTH="http://localhost:9502/actuator/health"
SESSION="erd-be"
LOG="/tmp/erd-be.log"

healthy() { curl -sf "$HEALTH" >/dev/null 2>&1; }

start_tmux() {
  tmux kill-session -t "$SESSION" 2>/dev/null || true
  # dev-restart.sh 前台 exec java；tmux 托管生命周期，日志 tee 到文件
  tmux new-session -d -s "$SESSION" "cd '$PWD' && ./dev-restart.sh 2>&1 | tee '$LOG'"
}

wait_up() {
  i=0
  while [ $i -lt 25 ]; do
    healthy && { echo "backend UP ($HEALTH)"; exit 0; }
    i=$((i + 1)); sleep 2
  done
  echo "backend 启动超时，最近日志：" >&2
  tail -30 "$LOG" >&2 || true
  exit 1
}

case "${1:-}" in
  --restart)
    start_tmux
    wait_up
    ;;
  --logs)
    tail -50 "$LOG" 2>/dev/null || tmux capture-pane -t "$SESSION" -p 2>/dev/null | tail -50
    ;;
  "")
    healthy && exit 0
    # tmux 会话还在但健康检查失败：直接复用会话重启（kill 会话重来最干净）
    start_tmux
    wait_up
    ;;
  *)
    echo "usage: $0 [--restart|--logs]" >&2
    exit 2
    ;;
esac
