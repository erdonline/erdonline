# [good first] version.spec 抽取 openVersionPage 到 helpers

> **已合入**（勿再投放）：`gotoVersionSub` / `openVersionPage` / `gotoDesignModel`；回滚落库。

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/version.spec.ts tests/e2e/approval.spec.ts --project=chromium
```
