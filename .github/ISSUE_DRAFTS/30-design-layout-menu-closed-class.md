# [good first] 项目菜单关闭态用 CSS class 替代内联 opacity

## 背景

`DesignLayout` 项目下拉 `destroyPopupOnHide={false}` 时用内联 `opacity`/`pointerEvents` 禁点击。可抽成 `erd-project-menu--closed` class，便于主题与调试。

## 接受标准

- [ ] 关闭态 class 生效；打开弹窗后菜单不再挡操作
- [ ] `project-menu`「导出」E2E 仍绿

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/project-menu.spec.ts --project=chromium -g "导出"
```

## 相关文件

- `frontend/src/layouts/DesignLayout/index.tsx`
