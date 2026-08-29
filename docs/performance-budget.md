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

## 落地页 Lighthouse 与 CWV（2026-08-28）

测量站点：`https://www.erdonline.com/`，Lighthouse mobile 4G 模拟（本机 CLI）。

### 当前基线

| 指标 | 基线 | 备注 |
|---|---|---|
| Performance | ~65 | 波动较大（62–69），LCP 是主因 |
| Accessibility | 96 | — |
| Best Practices | 61 | viewport 已修复；剩余多为 source maps / robots 信号 / 第三方 cookie |
| SEO | 92 | — |
| FCP | ~1.8–2.4 s | 文本/导航快速出现 |
| LCP | ~8.4–9.5 s | LCP 元素为 `landingHeroImg`；受 `umi.js` 628KB 与 hero webp 竞争影响 |
| TTI | ~8.4–9.5 s | 与 LCP 基本重合 |
| TBT | ~300–430 ms | umi.js 执行占用主线程 |
| CLS | 0 | — |

### 本轮已尝试的优化

- `env-config.js` 内联：消除 200ms 阻塞请求 ✅
- 响应式 hero `srcSet` + `preload`：减少下载体积 ✅ 但 LCP 仍被 `umi.js` 压制
- 移除 `decoding="async"` 从 LCP 图片：避免延迟解码
- `html2canvas` 按需加载：减少 39KB 初始下载与 `load` 事件等待 ✅
- `<picture>` vs 单 `<img>`：单 `<img>` 未改善 LCP；回退到 `<picture>`
- `umi.js defer`：`Best Practices` 升至 100，但 `Performance` 跌至 57–63，回退
- 移除百度统计：`Best Practices` 从 61 升到 **100**；`Performance` 轻微波动（60–67）
- 禁用 `BABEL_POLYFILL=none`：`umi.js` 减少 ~120KB parsed，`LCP` 从 ~8.5–10.6s 降到 **~6.4–6.6s**，`Performance` 稳定在 67–70
- `socket.io-client` 按需加载：`umi.js` 再降 ~100KB，`LCP` 继续稳定在 **~6.4–6.9s**，`Performance` 70 左右
- `moment2dayjs` + `codeSplitting: { jsStrategy: 'granularChunks' }`：`umi.js` 从 ~1.9MB 降到 **~1.7MB**；`LCP` 仍受网络波动在 **~6.0–7.4s** 之间，`Performance` 68–71
- `crypto-js` 按需加载：`projectJsonSlice` 的 `encrypt`/`decrypt` 改为异步 `import('crypto-js')`；生成 53KB 独立 chunk；`umi.js` 轻微下降。
- `jsondiffpatch` 按需加载：`useProjectStore` 与 `projectJsonSlice` 移除顶部 `import`；远端同步/版本 diff 首次触发时 `import('jsondiffpatch')`；`umi.js` 从 ~1.7MB 降到 **~1.6MB**。
- `/` 落地页完全静态化：移除 `framework`/`preload_helper`/`umi.js` 的 `<script>`，把 SPA 壳放到 `dist/app` 无扩展名文件并用 `_redirects` 200 重写；`/` 不再加载任何 JS bundle；LCP 从 **~6.7–7.5s** 降到 **~1.1s**，Lighthouse Performance 从 62–69 升到 **99**。
- 关键 CSS 内联：把 `umi.*.css` 与 `p__landing__index.*.chunk.css` 合并写入 `dist/index.html` `<style>`；hero `sizes` 限制为 `(max-width: 996px) 100vw, 640px`；`landing-hero.webp/jpg`、`logo.svg` 改 `immutable`；Cloudflare beacon 延迟到 `DOMContentLoaded`；Lighthouse Performance 从 99 升到 **100**。

## 文档站 Lighthouse（doc.erdonline.com）

测量：本机 `npx lighthouse http://localhost:4175/`（Docusaurus 生产 build `npx serve build`），2026-08-30。

| 指标 | 优化前（线上） | 优化后（本机 build） |
|---|---|---|
| Performance | 72 | 92 |
| SEO | 100 | 100 |
| Best Practices | 57 | 96 |
| Accessibility | 100 | 100 |
| FCP | ~2.9 s | ~0.9 s |
| LCP | ~5.3 s | ~3.3 s |
| SI | ~4.9 s | ~1.5 s |
| TBT | 30 ms | 60 ms |
| CLS | 0 | 0 |

主要改动（`website/`）：

1. Hero 大图 `static/img/hero.jpg` 353KB → `hero-800.webp` 27KB + `hero-1600.webp` 71KB，并加 `srcSet` / `sizes` / `preload` / `fetchpriority="high"`。
2. 字体 CSS 从 `custom.css` 的 `@import` 改为 `docusaurus.config.js` `headTags` 非阻塞 `media="print" onload="this.media='all'"`，减少渲染阻塞。
3. `headTags` 增加 `preconnect` 到 `https://fonts.bunny.net`。

线上实测待 CF Pages 部署后复测，目标：Performance ≥ 90。

## 落地页后续最大杠杆

`umi.js` 主包 628KB 仍是 `LCP`/`TTI` 的主要瓶颈。要显著继续提升，需对其做代码分割 / 延迟加载 landing 非必须模块。
