# [good first] profileSlice eslint warn 清零

## 背景

`frontend/src/store/project/profileSlice.tsx` 仍有 `consistent-type-imports` / 未用参数 / `prefer-const` 等 warn，阻塞「热路径外 eslint 债」清零。

## 接受标准

- [ ] 该文件 `yarn eslint … --max-warnings 0` 通过
- [ ] 不改业务行为（仅类型导入与局部写法）

## 验证命令

```bash
cd frontend && yarn eslint src/store/project/profileSlice.tsx --max-warnings 0
```

## 相关文件

`frontend/src/store/project/profileSlice.tsx`
