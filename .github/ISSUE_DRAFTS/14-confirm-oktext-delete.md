# [good first] 树删除确认主按钮文案改为「删除」

> **已合入**（勿再投放）：`okText: '删除'`；E2E 用 `/删\s*除/`（antd 空格）。

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/smoke.spec.ts --project=chromium -g "删除表"
```
