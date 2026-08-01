# [good first] 版本管理页 eslint warn 定点清零

## 背景

`frontend/src/pages/design/version/index.tsx` 仍有 unused import、`ban-types`（`{}` props）等 warn；行为不变前提下清零。

## 接受标准

- [ ] `yarn eslint src/pages/design/version/index.tsx --max-warnings 0`
- [ ] `project-menu`「版本」或 `version.spec` 相关用例仍绿

## 验证命令

```bash
cd frontend && yarn eslint src/pages/design/version/index.tsx --max-warnings 0
npx playwright test tests/e2e/project-menu.spec.ts --project=chromium -g "版本"
```

## 相关文件

- `frontend/src/pages/design/version/index.tsx`
