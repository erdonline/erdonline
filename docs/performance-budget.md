# 性能预算

> 对照基线，防止「能用但越来越慢」。超预算须在同轮迭代消化或写明豁免理由。

## 预算表（2026-08-01 基线）

| 指标 | 预算 | 当前基线 | 测量方式 |
|---|---|---|---|
| `frontend/dist` 总体积 | ≤ 20 MB | ~14 MB | `du -sh frontend/dist`（`yarn build` 后） |
| 冒烟「登录→新建→进设计器」 | ≤ 30 s | ~10.4 s（本机） | `npx playwright test tests/e2e/smoke.spec.ts -g "登录 → 新建"` |
| 关系图全旅程 E2E | ≤ 60 s | ~26 s（本机） | `npx playwright test tests/e2e/relation.spec.ts` |
| **激活：落地→demo→登录→示例→首版本** | ≤ 30 s（墙钟，计时段） | **~3.5 s**（本机 2026-08-02） | `npx playwright test tests/e2e/activation-30s.spec.ts --project=chromium` |
| 设计器热路径 `console.log` | 0（全 src `log/debug/info`） | ✅ 已清 | `rg 'console\.(log\|debug\|info)' src` |

### 激活旅程分段基线（2026-08-02，本机 chromium）

产品叙事「30 秒进版本保存」= 真人冷启动体感目标；E2E 量的是自动化墙钟（不含预热清库/登出）。

| 分段 | 基线 (ms) | 说明 |
|---|---|---|
| `landing` | ~56 | `/` 品牌 + 主标题可见 |
| `demo` | ~1.5k | CTA → `/demo` 关系图可见 |
| `login` | ~0.3k | 种子账号登录（不含真人注册填表） |
| `example_ready` | ~0.3k | `/home` 一键示例 → 就绪 toast |
| `save_version` | ~1.4k | CTA → 新增版本 → `1.0.0` 行可见 |
| **合计（计时段）** | **~3.5 s** | 断言 ≤ 30 s；连跑 2 次均绿 |

用例整段（含预热清理）约 ~10 s，不计入 30s 预算。CI 若偶发变慢：先查 FE/BE 健康与锁竞争，连续两轮超预算 >20% 按漂移防控停议。

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
