# [good first] useProjectStore eslint warn 清零

## 背景

`frontend/src/store/project/useProjectStore.tsx` 仍有 `import type`、`no-param-reassign`、未用参数等 warn。协作 socket / autosave 逻辑勿改行为。

## 接受标准

- [ ] `yarn eslint src/store/project/useProjectStore.tsx --max-warnings 0`
- [ ] `npx playwright test tests/e2e/sync-toast.spec.ts --project=chromium` 仍绿（防回归）

## 验证命令

```bash
cd frontend && yarn eslint src/store/project/useProjectStore.tsx --max-warnings 0
cd frontend && npx playwright test tests/e2e/sync-toast.spec.ts --project=chromium
```

## 相关文件

- `frontend/src/store/project/useProjectStore.tsx`
