# [good first] 导出 DDL 向导进到第二步的 E2E

## 背景

`project-menu.spec.ts` 已断言弹窗与「下一步」可见；尚未覆盖选数据源/表后进入「导出配置」步。

## 接受标准

- [ ] 用例：打开导出 DDL → 选数据源与至少一张表（或项目已有默认）→ 点「下一步」→ 见「导出配置」或「上一步」「导出」按钮
- [ ] 定位遵守 role / label，不用 `.ant-*`

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/project-menu.spec.ts --project=chromium -g "导出"
```

## 相关文件

- `frontend/tests/e2e/project-menu.spec.ts`
- `frontend/src/components/dialog/export/ExportDDL.tsx`
