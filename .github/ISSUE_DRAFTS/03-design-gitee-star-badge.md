# [good first] 设计器顶栏 star 徽章指向更新

> **已合入**（勿再投放）：顶栏改为 GitHub `erdonline/erdonline`；`presence.spec` 回归。

## 背景

设计器顶栏曾链到旧 Gitee `MARTIN-88/erd-online`。

## 接受标准

- [x] 顶栏指向 GitHub 正式仓叙事
- [x] `presence.spec` 断言无旧 Gitee 链

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/presence.spec.ts --project=chromium
```

## 相关文件

`frontend/src/layouts/DesignLayout/index.tsx`
