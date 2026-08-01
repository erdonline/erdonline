# [good first] 版本排序页 eslint warn 清零

## 背景

`frontend/src/pages/design/version/order/index.tsx` 仍有 `ban-types`（`{}` props）、unused `props`、`no-use-before-define`（tempWidth/tempHeight）。

## 接受标准

- [ ] 对该文件 `yarn eslint src/pages/design/version/order --max-warnings 0` 通过
- [ ] 不改业务行为；页面可打开

## 验证命令

```bash
cd frontend && yarn eslint src/pages/design/version/order --max-warnings 0
```

## 相关文件

- `frontend/src/pages/design/version/order/index.tsx`
