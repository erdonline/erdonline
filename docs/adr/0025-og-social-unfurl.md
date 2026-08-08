# ADR-0025：分享链接社交解析（OG 卡片）走后端预渲染

- 状态：已接受
- 日期：2026-08-08
- 相关：[ADR-0007 只读分享](./0007-readonly-project-share.md)、[ADR-0016 体验优先·敢晒的图](./0016-experience-first-shareable-diagram.md)、[ADR-0018 托管拓扑](./0018-hosting-topology-no-vps.md)

## 背景

推广链路的闭环命门是「分享 → 曝光」：用户把只读分享链接 `/s/:token`（或 `/demo`）贴到 HN / Twitter / 微信 / Slack 时，抓取卡片的爬虫**不执行 JS**，而前端是 UmiJS SPA，`index.html` 只有一套通用 meta——于是所有分享链接解析成空白卡片，病毒系数≈0，前端所有引流都不复利。

全仓 `grep og:` 零命中，确认此前从未做过社交解析。

## 决策

**由后端对分享/demo URL 预渲染一张带 Open Graph / Twitter Card meta 的 HTML「揭示页」（unfurl page），仅面向爬虫；真人仍走 SPA 原路。**

- 新增匿名 GET 端点（无网关前缀，Security 放行 `/og/**`）：
  - `GET /og/s/{token}`：按 token 解析项目名 / 描述 / 表数量，输出 `og:*` + `twitter:card=summary_large_image`；失效 token 回落品牌通用卡片（仍 200，不暴露存在性）。
  - `GET /og/demo`：公开演示的固定品牌卡片。
- HTML 内含 `<meta http-equiv=refresh>` + `location.replace()`：真人若直达揭示页则跳回 `/s/{token}` / `/demo`。
- `og:image` 由后端 `GET /og/s/{token}/image.png` **动态渲染**（Java2D，1200×630，无浏览器依赖）：从 projectJSON 画表名/字段网格 + 品牌 + 标语，缺 CJK 字体时按 `canDisplay` 过滤不豆腐。比静态图「敢晒」，且随项目内容变化。
- 生产托管（nginx，同源）按 **爬虫 User-Agent** 把 `/s/*`、`/demo` 反代到后端揭示页；真人 UA 保持 SPA。真人 URL 保持干净的 `/s/:token`，不改分享按钮产物。

## 备选与否决

- **前端 SPA 注入 meta**：爬虫不跑 JS，无效。否决。
- **CF Pages 边缘函数预渲染**：可行但绑定托管侧、本机验不到、与「后端已同源反代」重复。作为 B 方案备选，不首选。
- **改分享 URL 直指后端揭示页**：真人多一跳、URL 变脏。否决——用 UA 分流保干净。

## 后果

- 正面：分享链接在各平台出正规大图卡片，闭合「分享→曝光」回环；后端揭示页可被 `curl` 断言，端到端可本机验证。
- 成本：nginx 需一段 UA 分流（生产）；后端多一个匿名端点（已做 HTML 转义防注入、失效 token 不泄存在性）。
- 约束：动态图为「像 schema 的品牌卡」（表名/字段网格），非画布 1:1 截图；若日后要像素级还原布局，可另起 headless 渲染切片。
