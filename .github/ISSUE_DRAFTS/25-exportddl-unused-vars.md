# [good first] ExportDDL.tsx 剩余 eslint warn 清零

## 背景

`ExportDDL.tsx` 在 ADR-0008 改造后仍可能有 `consistent-type-imports` / unused `props` 等 warn。

## 接受标准

- [ ] `yarn eslint src/components/dialog/export/ExportDDL.tsx --max-warnings 0`
- [ ] `project-menu`「导出」2 条绿

## 验证命令

```bash
cd frontend && yarn eslint src/components/dialog/export/ExportDDL.tsx --max-warnings 0
npx playwright test tests/e2e/project-menu.spec.ts --project=chromium -g "导出"
```

## 相关文件

- `frontend/src/components/dialog/export/ExportDDL.tsx`
