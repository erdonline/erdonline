# ADR-0034：locale 路由只做营销页 `/en/*`，应用内页不做

- 状态：**已接受**（2026-08-12）
- 前置：[ADR-0023](./0023-i18n-foundation.md)（默认 zh-CN + `baseNavigator`）、[ADR-0033](./0033-app-i18n-extraction-conventions.md)（批量 i18n 约定）
- 相关：[ADR-0025](./0025-og-social-unfurl.md)（爬虫 UA 分流 / OG 揭示页）、[ADR-0018](./0018-hosting-topology-no-vps.md)（CF Pages 托管）、[ADR-0003](./0003-docs-docusaurus.md)（文档站已有 `/en/`）

## 背景

`www.erdonline.com` 是纯 CSR SPA，中英文**共用同一 URL**，语言由 `umi_locale` / 浏览器语言决定。对搜索引擎而言一个 URL 只有一个语言版本，因此：英文内容实际不可被索引，hreflang 无 URL 可指，"英文关键词自然流量" 这条获客路径是断的（实测线上英文态无 canonical、无 hreflang）。

全站路径化的影响面（动手前实测，非估算）：

| 面 | 量 |
|---|---|
| `config/routes.ts` 路由条目 | 60 |
| `history.push/replace` 调用点 | 76（39 个文件） |
| `<Link>` 使用点 | 35 |
| `<a href="/…">` / `window.location` | 4 / 2 |
| E2E `page.goto()` | 236 |
| 后端含前端 URL 的类/配置 | 16 个文件（Google/GitHub/微信回调、OIDC issuer 与 discovery、`/oauth/authorize`、`/og/**`） |
| nginx 规则 | `/s/:token`、`/demo` 的 bot 分流 + `/_og` 内部反代 |
| 站外已发出的只读分享短链 `/s/:token` | 不可变，破坏即事故 |

对照收益：需要登录才可达的应用内页（`/project/**`、`/design/**`、`/home`）**没有 SEO 价值**；有价值的只有 `/`、`/compare`、`/catalog`。营销页的内部链接点仅 ~21 处（`pages/landing`），是全站的一个零头。

## 决策

**只对营销页引入 `/en` 路径前缀；应用内页、`/s/:token`、`/demo` 一律不做路径化。**

| 项 | 决策 |
|---|---|
| 路径化范围 | 切片一：`/en`（落地）、`/en/compare`；切片二：`/en/catalog`（列表页；`/catalog/:id` 是用户数据，不做） |
| 实现 | `config/routes.ts` 显式新增英文路由，`component` 复用同一组件；外层 `LocaleRoute` 包装：挂载时按前缀强制 `setLocale('en-US', false)`（`/` 侧强制 `zh-CN`），**locale 由路径决定，压过 localStorage 与浏览器语言** |
| 应用内页 | 不加前缀，语言仍由 `umi_locale` / `baseNavigator` 决定；76 处 `history.push`、236 处 `page.goto` **零改动** |
| 首访体验 | `/` 上若无显式 `umi_locale` 且浏览器语言为 en 且 **UA 非爬虫**（复用 `nginx.conf` 里 `$og_is_bot` 的同一份正则）→ 客户端一次性 `history.replace('/en')`；用户显式切换后写 `umi_locale`，不再自动跳 |
| 语言切换器 | 营销页上的 `LocaleSwitcher` 改为**跳路径**（`/compare` ↔ `/en/compare`）并同时 `setLocale`；应用内页保持原 `setLocale` 行为 |
| SEO 标记 | `usePageSeo` 增加：`<link rel=canonical>` 指向本语言 URL、`hreflang=zh-CN` / `en` / `x-default`（x-default → 中文根）、`og:locale`；新增 `frontend/public/sitemap.xml` 同时登记两语言 URL |
| 预渲染 | **暂不做**。Googlebot 会执行 JS，先靠 sitemap + hreflang 走 CSR；**验收门**：上线 90 天后若 Search Console 中 `/en` 未被索引，再上 umi `exportStatic` 仅导出营销路由（届时另起切片，不改本 ADR 结论） |
| nginx / 后端 | 零改动：`/en*` 落在既有 SPA fallback；OG 揭示页、OAuth 回调、短链全部不受影响 |

## 备选与否决

- **全站 `/en/*`**：改造面 ~150 个调用点 + 236 条 E2E + 后端回调 + 短链兼容层，风险与工期与收益严重不成比例（应用内页无 SEO 价值）。**否决**。
- **保持现状，英文只靠外链与文档站**：文档站（Docusaurus `/en/`）确实可索引且英文完整，但它只承接「已经知道这个项目的人」，主站产品页拿不到英文关键词。作为兜底而非方案。**否决**。
- **只给 `/s/:token`、`/demo` 做多语言 URL**：这些是用户内容/演示，无关键词价值，且 ADR-0025 的 UA 分流已覆盖社交曝光。**不做**。
- **服务端按 Accept-Language 返回不同内容（同一 URL）**：等价于 cloaking 风险，且 CF Pages 静态托管做不了。**否决**。

## 与批量 i18n 的关系

**无阻塞依赖，可并行。** 营销页已 100% key 化，本 ADR 可立即执行；ADR-0033 的应用主体抽取解决的是「英文用户点进产品后不掉链子」，是留存问题不是索引问题。建议顺序：本 ADR 切片一（拿索引，见效慢需要提前起跑）→ ADR-0033 批量抽取 → 本 ADR 切片二（`/en/catalog`）。

## 后果

- 正面：英文内容首次拥有独立可索引 URL，hreflang 有落点；改动面收敛在 `pages/landing` + `config/routes.ts` + `usePageSeo`，可在一个切片内验证完。
- 代价：营销页多一层 `LocaleRoute` 与「路径压过 localStorage」的特例；营销页与应用页的语言决定机制不一致（须在 `docs/development.md` 写清）；新增 sitemap 需随营销路由维护。
- 风险：客户端跳转依赖 UA 判定爬虫，正则需与 `nginx.conf` 保持同步（同一份常量，写进注释交叉引用）；CSR 索引若 90 天不达标则触发 SSG 切片。
- 验证点：`curl -A Googlebot https://.../en` 返回 200 且 SPA 壳内 `hreflang` 齐全；E2E 断言 `/en` 渲染英文且 `<html lang="en">`、`/` 渲染中文且 `<html lang="zh-CN">`、英文浏览器首访 `/` 自动到 `/en` 且显式切回中文后不再跳。
