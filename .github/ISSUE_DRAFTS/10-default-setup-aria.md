# [good first] 默认项设置「确定」保存后有成功反馈

> **已合入**（勿再投放）：`updateProfile` 已有「设置成功」；E2E 见 `project-menu.spec.ts`。

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/project-menu.spec.ts --project=chromium -g "保存有成功提示"
```
