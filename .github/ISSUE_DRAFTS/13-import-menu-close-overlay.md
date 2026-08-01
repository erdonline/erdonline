# [good first] 项目菜单导入/导出弹窗打开时关闭下拉遮罩

> **已合入**（勿再投放）：导入三项 + 导出五项触发时 `closeProjectMenu()`。

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/project-menu.spec.ts --project=chromium -g "导入"
```
