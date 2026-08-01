# [good first] 导出 DDL 向导步骤按钮补 aria-label

## 背景

`ExportDDL` StepsForm 的「下一步 / 上一步」等可能仅有可见文案；为 E2E 与读屏稳定，给提交区按钮补 `aria-label`（与项目菜单其它入口一致）。

## 接受标准

- [ ] 导出 DDL 弹窗内主导航按钮有稳定可访问名
- [ ] `project-menu.spec.ts` 导出用例可点到第二步（若有）或至少断言按钮名

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/project-menu.spec.ts --project=chromium -g "导出"
```

## 相关文件

- `frontend/src/components/dialog/export/ExportDDL.tsx`
- `frontend/tests/e2e/project-menu.spec.ts`
