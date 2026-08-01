# [good first] ExportDDL.tsx 剩余 eslint warn 清零

> **已合入**（勿再投放）：`import type` 分离 ProFormInstance / RadioChangeEvent。

## 验证命令

```bash
cd frontend && yarn eslint src/components/dialog/export/ExportDDL.tsx --max-warnings 0
npx playwright test tests/e2e/project-menu.spec.ts --project=chromium -g "导出"
```
