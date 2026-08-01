# [good first] share.spec 失败时清理项目更稳

> **已合入**（勿再投放）：finally 双次 `deleteOwnPersonProjects` + 断言列表无本次项目名/副本。

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/share.spec.ts --project=chromium
```
