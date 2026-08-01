# [good first] entitiesSlice 定点清 eslint warn（import type）

## 背景

`entitiesSlice.tsx` 仍有十余条 warn；可先只清 `consistent-type-imports`，避免一次改太多。

## 接受标准

- [ ] 文件顶部 zustand / ProjectState 改为 `import type`
- [ ] 不扩大行为变更；`yarn eslint` 对该文件 warn 数下降

## 验证命令

```bash
cd frontend && yarn eslint src/store/project/entitiesSlice.tsx --max-warnings 999
```

## 相关文件

`frontend/src/store/project/entitiesSlice.tsx`
