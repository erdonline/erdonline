# [good first] 侧栏「版本管理」与项目菜单「版本」行为对齐说明

## 背景

项目菜单「版本」已跳转 `/design/table/version/all`。侧栏 ProLayout 路由亦有「版本 / 版本管理」。可补一句空态/文档，避免双入口叙事不一致。

## 接受标准

- [ ] `docs/` 或版本页空态注明：项目菜单「版本」= 版本管理
- [ ] 可选：E2E 侧栏入口打开同一 URL（若侧栏 overflow 稳定）

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/project-menu.spec.ts --project=chromium -g "版本"
```

## 相关文件

- `frontend/src/layouts/DesignLayout/_defaultProps.tsx`
- `frontend/src/components/Menu/index.tsx`
- `docs/development.md` 或版本使用说明
