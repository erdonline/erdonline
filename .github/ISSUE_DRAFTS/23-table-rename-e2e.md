# [good first] 关系图表头改名 E2E

> **已合入**（勿再投放）：`table-rename-btn` + 表名 input aria；改名后用 page 级 textbox（勿挂 rfNode）。

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium -g "改名"
```
