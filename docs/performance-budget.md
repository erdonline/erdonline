# 性能预算

> 对照基线，防止「能用但越来越慢」。超预算须在同轮迭代消化或写明豁免理由。

## 预算表（2026-08-01 基线）

| 指标 | 预算 | 当前基线 | 测量方式 |
|---|---|---|---|
| `frontend/dist` 总体积 | ≤ 20 MB | ~14 MB | `du -sh frontend/dist`（`yarn build` 后） |
| 冒烟「登录→新建→进设计器」 | ≤ 30 s | ~10.4 s（本机） | `npx playwright test tests/e2e/smoke.spec.ts -g "登录 → 新建"` |
| 关系图全旅程 E2E | ≤ 60 s | ~26 s（本机） | `npx playwright test tests/e2e/relation.spec.ts` |
| 设计器热路径 `console.log` | 0（store immer/set、DesignLayout 渲染） | ✅ 已清 | `rg console.log src/store/project/useProjectStore.tsx src/layouts/DesignLayout` |

## 红线

- 新增依赖使 dist 增长 > 1 MB：PR 须说明收益
- 核心旅程 E2E 连续两轮变慢 > 20%：停下来查回归（见迭代协议漂移防控）
- 禁止在 zustand `set` / 布局 render 路径恢复调试 `console.log`

## 尚未立项（大项目）

- 画布节点虚拟化（表数量 > 100）：见 roadmap「画布大项目虚拟化」
- Lighthouse CI：待文档站/demo 稳定后接入
