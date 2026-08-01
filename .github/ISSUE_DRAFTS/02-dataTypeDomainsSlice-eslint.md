# [good first] dataTypeDomainsSlice eslint warn 清零

## 背景

`dataTypeDomainsSlice.tsx` 有 unused `_`、loop-func、prefer-const 等 warn；可与已完成的 `configJsonSlice` / `exportSlice` 清零同模式处理。

## 接受标准

- [ ] 该文件 eslint warn=0
- [ ] 不改数据类型域业务语义

## 验证命令

```bash
cd frontend && yarn eslint src/store/project/dataTypeDomainsSlice.tsx --max-warnings 0
```

## 相关文件

`frontend/src/store/project/dataTypeDomainsSlice.tsx`
