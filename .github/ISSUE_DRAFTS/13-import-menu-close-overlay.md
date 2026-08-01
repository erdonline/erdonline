# [good first] 项目菜单导入/导出弹窗打开时关闭下拉遮罩

## 背景

设置类 Modal（数据源/默认项）已通过 `ProjectMenuCloseContext` 关闭项目下拉。导入/导出同类弹窗仍可能被 SubMenu 层挡住（需 force/DOM click）。

## 接受标准

- [ ] 导入三项、导出 DDL 等 ModalForm/Dialog 打开时调用 `closeProjectMenu()`
- [ ] `project-menu.spec.ts` 无需 force/evaluate 即可点到弹窗内控件（至少一项）
- [ ] `destroyPopupOnHide={false}` 行为保持（Modal 不随下拉卸载）

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/project-menu.spec.ts --project=chromium
```

## 相关文件

- `frontend/src/components/dialog/import/`
- `frontend/src/components/dialog/export/`
- `frontend/src/components/Menu/projectMenuClose.tsx`
