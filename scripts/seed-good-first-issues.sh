#!/usr/bin/env bash
# 将 .github/ISSUE_DRAFTS/*.md 投放到 GitHub Issues（good first issue）。
# 用法：
#   REPO=owner/name ./scripts/seed-good-first-issues.sh
#   DRY_RUN=1 REPO=owner/name ./scripts/seed-good-first-issues.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DRAFT_DIR="$ROOT/.github/ISSUE_DRAFTS"
REPO="${REPO:-}"
DRY_RUN="${DRY_RUN:-0}"
LABELS="${LABELS:-good first issue}"

if [[ -z "$REPO" ]]; then
  echo "ERROR: set REPO=owner/name (official GitHub repo)." >&2
  exit 1
fi

if [[ "$DRY_RUN" != "1" ]] && ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: gh CLI required." >&2
  exit 1
fi

shopt -s nullglob
files=("$DRAFT_DIR"/[0-9]*.md)
if [[ ${#files[@]} -eq 0 ]]; then
  echo "No numbered drafts in $DRAFT_DIR"
  exit 0
fi

created=0
for f in "${files[@]}"; do
  if grep -q '\*\*已合入\*\*' "$f"; then
    echo "SKIP (done): $(basename "$f")"
    continue
  fi
  title="$(head -n 1 "$f" | sed -E 's/^#[[:space:]]*//' | sed -E 's/^[[:space:]]+|[[:space:]]+$//g')"
  body="$(tail -n +2 "$f")"
  if [[ -z "$title" ]]; then
    echo "SKIP (no title): $f" >&2
    continue
  fi
  echo "==> $title"
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "    (dry-run) would create on $REPO with labels: $LABELS"
    created=$((created + 1))
    continue
  fi
  # shellcheck disable=SC2086
  gh issue create -R "$REPO" --title "$title" --body "$body" --label $LABELS
  created=$((created + 1))
done

echo "Done: $created issue(s) on $REPO"
