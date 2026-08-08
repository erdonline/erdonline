#!/usr/bin/env bash
# 增长巡检：stars / 社区 Issue（非 PR）计数；供 cron 自动化判断是否达成「第一个 star / issue」。
# 用法：REPO=owner/name ./scripts/growth-pulse.sh
# 退出码：0=已达成任一里程碑；1=均未达成；2=依赖/API 失败
set -euo pipefail

REPO="${REPO:-erdonline/erdonline}"
GOAL_STARS="${GOAL_STARS:-1}"
GOAL_ISSUES="${GOAL_ISSUES:-1}"

if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: gh CLI required." >&2
  exit 2
fi

stars="$(gh api "repos/${REPO}" --jq '.stargazers_count' 2>/dev/null || true)"
if [[ -z "$stars" ]]; then
  echo "ERROR: failed to fetch repo stats for ${REPO}" >&2
  exit 2
fi

# 社区 Issue = 非 Pull Request 的 open issue
issues="$(gh api "repos/${REPO}/issues?state=open&per_page=100" --jq '[.[] | select(.pull_request == null)] | length' 2>/dev/null || true)"
if [[ -z "$issues" ]]; then
  echo "ERROR: failed to fetch issues for ${REPO}" >&2
  exit 2
fi

echo "repo=${REPO} stars=${stars} community_issues=${issues} goal_stars=${GOAL_STARS} goal_issues=${GOAL_ISSUES}"

star_ok=0
issue_ok=0
[[ "$stars" -ge "$GOAL_STARS" ]] && star_ok=1
[[ "$issues" -ge "$GOAL_ISSUES" ]] && issue_ok=1

if [[ "$star_ok" -eq 1 || "$issue_ok" -eq 1 ]]; then
  [[ "$star_ok" -eq 1 ]] && echo "MILESTONE: first star reached (${stars})"
  [[ "$issue_ok" -eq 1 ]] && echo "MILESTONE: first community issue reached (${issues})"
  exit 0
fi

echo "PENDING: awaiting first external star and/or community issue"
exit 1
