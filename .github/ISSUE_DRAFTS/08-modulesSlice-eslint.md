# [good first] modulesSlice eslint warn 清零

## 背景

`frontend/src/store/project/modulesSlice.tsx` 仍有未用变量、`prefer-const`、`no-loop-func` 等 warn（约十余条）。改写时保持模块/实体树行为不变。

## 接受标准

- [ ] `yarn eslint src/store/project/modulesSlice.tsx --max-warnings 0`
- [ ] `npx playwright test tests/e2e/empty-projectjson.spec.ts --project=chromium` 仍绿

## 验证命令

```bash
cd frontend && yarn eslint src/store/project/modulesSlice.tsx --max-warnings 0
cd frontend && npx playwright test tests/e2e/empty-projectjson.spec.ts --project=chromium
```

## 相关文件

- `frontend/src/store/project/modulesSlice.tsx`
