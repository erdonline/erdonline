#!/usr/bin/env bash
# 从 CHANGELOG.md 的 [Unreleased] 段生成双周发版笔记（不改 CHANGELOG，除非传 --stamp）。
# 用法：
#   ./scripts/cut-release-notes.sh              # 写入 docs/releases/YYYY-MM-DD.md
#   ./scripts/cut-release-notes.sh 2026-08-15   # 指定日期
#   ./scripts/cut-release-notes.sh --dry-run    # 只打印
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHANGELOG="$ROOT/CHANGELOG.md"
OUT_DIR="$ROOT/docs/releases"
DRY=0
DATE="$(date +%Y-%m-%d)"

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY=1 ;;
    [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]) DATE="$arg" ;;
    -h|--help)
      sed -n '2,7p' "$0"
      exit 0
      ;;
  esac
done

if [[ ! -f "$CHANGELOG" ]]; then
  echo "missing CHANGELOG.md" >&2
  exit 1
fi

BODY=$(python3 - <<'PY' "$CHANGELOG"
import sys, re
text = open(sys.argv[1], encoding="utf-8").read()
# 抓取全部 ## [Unreleased] ... 直到下一个 ## [
parts = re.split(r"(?=^## )", text, flags=re.M)
blocks = [p for p in parts if p.startswith("## [Unreleased]")]
if not blocks:
    print("(CHANGELOG 无 Unreleased 段落)", file=sys.stderr)
    sys.exit(2)
print("\n".join(b.rstrip() for b in blocks))
PY
)

NOTE=$(cat <<EOF
# 发版笔记 ${DATE}

> 面向使用者的双周摘要。工程细节见 \`CHANGELOG.md\` Unreleased；本文件由 \`scripts/cut-release-notes.sh\` 生成。

## 本周期你能感知到的变化

（维护者发版前请把下方工程清单改写成 3–7 条用户语言要点，并删掉本提示。）

## 工程变更摘录（Unreleased）

${BODY}

## 如何验证 / 升级

- 自部署：\`docker-compose up -d\`；已有库按需执行 \`db/init/\` 新增脚本（如 \`07_data_sources.sql\`）
- 接口联调：\`./scripts/audit-fe-apis.sh\`
- 核心 E2E：\`cd frontend && npx playwright test tests/e2e/share.spec.ts --project=chromium\`

## 下一双周候选

见 \`docs/roadmap.md\` P3a / P3b。
EOF
)

if [[ "$DRY" -eq 1 ]]; then
  printf '%s\n' "$NOTE"
  exit 0
fi

mkdir -p "$OUT_DIR"
OUT="$OUT_DIR/${DATE}.md"
if [[ -f "$OUT" ]]; then
  echo "already exists: $OUT (abort; delete or pick another date)" >&2
  exit 1
fi
printf '%s\n' "$NOTE" > "$OUT"
echo "wrote $OUT"
