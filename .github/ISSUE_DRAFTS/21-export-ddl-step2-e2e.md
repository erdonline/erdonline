# [good first] 导出 DDL 向导进到第二步的 E2E

> **已合入**（勿再投放）：ExportDDL 读 `/ncnb/dataSources`；菜单关闭禁点击；第二步 E2E。

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/project-menu.spec.ts --project=chromium -g "导出"
```
