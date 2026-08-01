# [good first] 版本排序页 eslint warn 清零

> **已合入**（勿再投放）：去掉 `{}` props；`tempWidth`/`tempHeight` 提前定义。

## 验证命令

```bash
cd frontend && yarn eslint src/pages/design/version/order --max-warnings 0
npx playwright test tests/e2e/approval.spec.ts --project=chromium -g "工单"
```
