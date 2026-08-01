# [good first] 设计器项目菜单「版本」入口 E2E

## 背景

`ProjectMenu` 已有「版本」项（切 shortcut 面板）。导入/导出/设置已有 `project-menu.spec.ts`，版本入口尚未覆盖。

## 接受标准

- [ ] Playwright：登录→建个人项目→项目菜单→版本 → 可见版本相关 UI（如「保存版本」/`add-version-btn` 或版本面板文案）
- [ ] 定位用 `getByRole` / 既有 `data-testid`，禁止 `.ant-*`

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/project-menu.spec.ts --project=chromium
```

## 相关文件

- `frontend/src/components/Menu/index.tsx`
- `frontend/tests/e2e/project-menu.spec.ts`
- `frontend/tests/e2e/version.spec.ts`（可复用断言）
