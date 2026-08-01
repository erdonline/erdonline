# 性能预算

> 对照基线，防止「能用但越来越慢」。超预算须在同轮迭代消化或写明豁免理由。

## 预算表（2026-08-01 基线）

| 指标 | 预算 | 当前基线 | 测量方式 |
|---|---|---|---|
| `frontend/dist` 总体积 | ≤ 20 MB | ~14 MB | `du -sh frontend/dist`（`yarn build` 后） |
| 冒烟「登录→新建→进设计器」 | ≤ 30 s | ~10.4 s（本机） | `npx playwright test tests/e2e/smoke.spec.ts -g "登录 → 新建"` |
| 关系图全旅程 E2E | ≤ 60 s | ~26 s（本机） | `npx playwright test tests/e2e/relation.spec.ts` |
| 设计器热路径 `console.log` | 0（全 src `log/debug/info`） | ✅ 已清 | `rg 'console\.(log\|debug\|info)' src` |

## 红线

- 新增依赖使 dist 增长 > 1 MB：PR 须说明收益
- 核心旅程 E2E 连续两轮变慢 > 20%：停下来查回归（见迭代协议漂移防控）
- 禁止在 zustand `set` / 布局 render 路径恢复调试 `console.log`

## 画布规模

| 指标 | 预算 | 当前 |
|---|---|---|
| 视口裁剪阈值 | ≥24 表开启 `onlyRenderVisibleElements` | ✅ |
| 放大后 DOM 节点 | < 逻辑表数 | ✅ `canvas-scale.spec.ts` |

完整虚拟化（表 >100、字段极多）仍可继续压；Lighthouse CI 待 demo 站稳定后接入。
