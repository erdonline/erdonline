# [good first] projectJsonSlice eslint warn 清零

## 背景

`frontend/src/store/project/projectJsonSlice.tsx` 仍有约 8 条 eslint warn（`import type`、未用变量、`no-param-reassign`、`ban-types`）。不改行为，只消警告。

## 接受标准

- [ ] `yarn eslint src/store/project/projectJsonSlice.tsx --max-warnings 0`
- [ ] 不改 `fixModules` / encrypt / patch 的对外语义

## 验证命令

```bash
cd frontend && yarn eslint src/store/project/projectJsonSlice.tsx --max-warnings 0
```

## 相关文件

- `frontend/src/store/project/projectJsonSlice.tsx`
