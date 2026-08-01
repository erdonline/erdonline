# [good first] 加载骨架页补 aria-busy / 可访问名

> **已合入**（勿再投放）：`role="status"` + `aria-busy` + `aria-label="页面加载中"`；loading E2E 断言。

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/loading.spec.ts --project=chromium -g "设计器"
```
