# [good first] 版本管理页 eslint warn 定点清零

> **已合入**（勿再投放）：清 unused import/死函数；去掉空 `{}` props。

## 验证命令

```bash
cd frontend && yarn eslint src/pages/design/version/index.tsx --max-warnings 0
npx playwright test tests/e2e/project-menu.spec.ts --project=chromium -g "版本"
```
