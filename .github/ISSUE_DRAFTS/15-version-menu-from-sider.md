# [good first] 侧栏「版本管理」与项目菜单「版本」行为对齐说明

> **已合入**（勿再投放）：版本页提示 + `docs/development.md` 双入口说明。

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/project-menu.spec.ts --project=chromium -g "版本"
```
