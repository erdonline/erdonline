# Changelog

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)；每个迭代轮的验证方式见 `docs/roadmap.md`。

> **维护约定**：`[Unreleased]` 下按日用 `### YYYY-MM-DD` 分组；同日多轮迭代保留为该日下的 `####` 小节，**勿丢「验证点」**；发版时将段落迁入 `## [x.y.z] — YYYY-MM-DD`，勿改已发版历史。

## [Unreleased]

### 2026-08-09

#### 产品 Chrome IA（ADR-0027）

- **M0**：`app.tsx` `rootContainer` 注入 `erdTheme`；登录主钮品牌红（禁 antd 蓝）
- **M1**：`/dataModels` 对齐 `project-list` 密度；`ProjectTypeBadge`；Home「全部模型」落点 `/dataModels`
- **M2**：设计器 `StatusInstrument`（落盘 / vX / DB 胶囊）；工单/审批图标化
- **M2.1**：仪器盘挂载即拉 A 层版本基线；未探测实库显示 `DB ·`；落盘文案「已落盘」；登录右栏减噪
- **M2.2**：进页有 JDBC 则自动探库水合 DB；**去掉顶栏「保存版本」主钮**（改点版本胶囊 / 版本页）；修订 ADR-0022/0027；仪器盘去掉外层灰底框（禁框中框）
- **M2.3**：地标 Skip 目标去掉 `:focus`+品牌红描边（关签/`focus()` 会整壳套红框）；仅 `:focus-visible` + 中性环
- **M2.4**：左树「关系」→「关系图」；点图叶子只切签开画布（禁 `setCurrentEntity` 误报「表不存在」）
- **M2.5**：进设计器 `refreshDataSources` 再拉版本基线 / 自动探库（禁空 `dbs` 假「无 JDBC」→ 永久 `DB ·`）
- **M3**：表设计表名 + 四签合并单行 chrome（Segmented 式 tab）
- **M4**：左树去掉全局新建下拉；文件夹 inline +；右键菜单分段
- 验证点：
  - `yarn test:e2e --project=chromium tests/e2e/smoke.spec.ts --grep "登录页渲染"` → brand 主钮
  - `… schema-probe.spec.ts` / `version-dirty-chip.spec.ts` → 仪器盘状态
  - Home/设计器：脚本 `focus()` 地标后无品牌红 outline；键盘 Tab Skip 仍可见中性环
  - `… multi-diagram.spec.ts --grep "新建/重命名"` → 文件夹「关系图」；点叶子无「表不存在」
  - `… schema-probe.spec.ts --grep "parity"` → 模型页进页即 `DB ✓`（不依赖先开版本页）

#### 精密工具站：前端壳层升级（ADR-0026）

- **S0**：`--erd-void` / `--erd-hairline` / `--erd-chrome-blur` / kicker；`docs/adr/0026-precision-tooling-visual-language.md`；`design-principles` §8；全局 IBM Plex（`document.ejs`）
- **S1**：AuthBrandShell 对齐落地——void + 细网格 + kicker + `landing-hero` 窗 + 品牌红 CTA（≠ 全局暗色）
- **S2**：Home/项目列表浅色精密化——玻璃顶栏、hairline 项目卡、mono 元数据
- **S3**：DesignLayout 侧栏 hairline + 状态簇 mono chip；画布空态弱阴影；**节点/边皮肤不动**
- **键盘**：AuthBrandShell Skip 链恢复为壳内首个 Tab 停（LocaleSwitcher 其后）
- 验证点：
  - `cd frontend && yarn test:e2e --project=chromium tests/e2e/landing.spec.ts tests/e2e/smoke.spec.ts --grep "加载可见品牌|登录页渲染" --workers=1 --retries=0` → 2 passed
  - `… session/share/not-found --grep "登录壳键盘|注册壳键盘|分享失效门键盘|未知路径见品牌壳"` → 4 passed
  - `… layout-outlet.spec.ts --grep "三壳同语言|项目卡密度"` → 2 passed
  - `… share.spec.ts --grep "失效|品牌壳"` → 3 passed

#### 文档：用户手册再打磨 + 统计 + i18n

- **文案**：guide 改成带入式路径（场景开场）；修正 Demo **只读** → **复制到我的项目** 再存版
- **首页**：文档站首页 CTA 改为 Demo / 从这里开始 + 三条路径卡（不再默认推愿景/本地开发）
- **统计**：接入与产品同 ID 的百度统计；`clientModules` 对 SPA 路由 `_trackPageview`
- **i18n**：`zh-Hans` + `en`；Navbar 语言切换；用户 guide 英文译本在 `website/i18n/en/.../guide/`
- **i18n 补全**：自托管三篇、贡献区七篇、全部 ADR 英译；修正 ADR 绝对链接勿带数字前缀（Docusaurus 会剥离）
- **首页观感**：文档站与产品落地页统一为精密工具站语言——去掉 Syne/模糊全幅；网格氛围 + 右侧锐利产品窗；IBM Plex；品牌红 CTA
- **落地对齐文档站**：`:8000/` hero 改为与 `:3000/erdonline/` 同构图（kicker + 双栏 + chrome 窗）；底色 `#070d14`
- **科技感加深**：落地次屏编号面板 / 对照表壳 / 玻璃顶栏；文档首页 signal 条（MIT · version/diff · compose · API/MCP）
- **Hero 实例图**：v3 深色关系图（Synced/v1.0.4 芯片 + 更清晰 FK）；去掉双重 chrome；窗体光扫 + 底光脉冲 + hover 浮起
- 验证点：硬刷 `:8000/?` 与 `:3000/erdonline/?`（`?v=20260809c`）；`yarn build` 绿

#### 文档：精致完备用户站（intro + 指南加厚 + 导航收口）

- **首页**：`docs/guide/intro.md`「从这里开始」；Navbar「文档」直达该页
- **加厚**：七篇 guide 统一「目标/步骤/成功态/排障/下一步」
- **导航**：贡献与工程默认折叠；Footer 补 Demo/对照/GitHub；搜索 `indexBlog: true`
- **验收**：`docs/guide/docs-qa-checklist.md`（维护者，侧栏贡献区末项）
- 验证点：`cd website && yarn build` 绿；本地 `yarn serve` 按 checklist A/B 走查

#### 文档：用户视角重构（guide + 侧栏分流 + blog 索引）

- **指南**：新增 `docs/guide/`（是什么 / 存版 diff / DBML / 逆向 / 角色审批 / 五分钟自托管 / API·MCP）
- **导航**：`website/sidebars.js` 三分「使用指南 / 自托管与开放 / 贡献与工程」；`growth`、回归清单、UI 过程稿等撤出默认侧栏
- **Blog**：启用 Docusaurus blog；索引帖 `website/blog/2026-08-09-guides-and-articles.md`；Navbar 增加「指南索引」「试用 Demo」
- **语气**：vision / roadmap / design-principles / growth / community 加读者 callout；deployment / data-format 文首「你将得到什么」
- **增长**：选题表增加「指南页」列；`content/articles` frontmatter 约定可选 `guide:`
- 验证点：`cd website && yarn build` 绿（死链门禁）

#### 增长：2026-08-09 全量同步台账

- **记录**：`content/articles/publish-status-2026-08-09.md` + `.json`（成功 50 / 失败 34；含各平台草稿 URL）
- **成功**：掘金/开源中国/小红书/微信 各 12；CSDN 2
- **失败**：知乎 12（403）、思否 12（未登录）、CSDN 10（频控）
- 验证点：打开台账核对掘金草稿链接可达；失败项按台账「处理建议」重试

#### 增长：公开稿禁止仓库内路径 + 排版纪律

- **改法**：稿件 `{{DOC:page}}` / `{{GH:path}}` / `{{GH_TREE:path}}` 展开为文档站或 GitHub 公开 URL；12 篇去掉 `docs/*.md` 等读者打不开的相对路径；文末链接独立列表行；`website/sidebars.js` 补 `data-format`
- 验证点：`build-package --all` 后 `g6-to-reactflow-strangler/juejin.md` 含 `docs/data-format?utm_` 公开链，无裸 `docs/data-format.md`

#### 增长：选题包 12 篇全部 ready + 全量发布包

- **正文**：`content/articles/` 补齐 #1/#2/#5–#12（#3/#4 已有）；一律 `status=ready`；默认同步 `juejin,csdn,oschina,xiaohongshu`（#2/#10 含 v2ex；#9 含 segmentfault）；运营排除 weixin/zhihu
- **流水线**：`build-package` CTA 文案按 `demo/compare/docs/deploy/repo` 区分；小红书包按篇生成（`xhs_title`）
- **文档**：`docs/growth.md` 选题表改为 slug + ✅ ready
- 验证点：`node scripts/growth/build-package.mjs --all` → 12 篇均出 `content/dist/<slug>/`

#### 增长：选题 #4 from-dbdiagram-in-5-min（DBML 搬家）+ 小红书包按篇生成

- **正文**：`content/articles/from-dbdiagram-in-5-min.md`（`status=ready`）；平台 `juejin,csdn,oschina,xiaohongshu`（按运营要求排除 weixin/zhihu）
- **改法**：`build-package.mjs` 的 `renderXiaohongshu` 不再写死 #3 文案，改为从正文抽导语/要点；支持可选 `xhs_title`
- 验证点：
  - `node scripts/growth/build-package.mjs from-dbdiagram-in-5-min` → 小红书稿含「dbdiagram / DBML」，UTM `utm_content=from-dbdiagram-in-5-min`
  - Wechatsync 草稿：juejin / csdn / oschina / xiaohongshu

#### 产品 URL：demo 域名统一为 www.erdonline.com

- **改法**：面向用户的 demo / CTA / CORS 示例由 `erdonline-demo.pages.dev` 换为 `https://www.erdonline.com`；`scripts/growth/lib/utm.mjs` 单一事实源；重跑 `build-package.mjs git-style-version-diff` 刷新各平台包；`docs/deployment.md` 保留 CF Pages 默认别名 `erdonline-demo.pages.dev` 作运维说明
- **未动**：`DEMO_API_URL`（Railway 后端 API）、CF Pages 项目名 `erdonline-demo`、workflow 部署目标
- **运维提醒**：Railway `ERD_UI_URL` 须同步改为 `https://app.erdonline.com,https://www.erdonline.com` 并 Redeploy，否则 www 域 CORS 预检会 403
- 验证点：
  - `curl -sI https://www.erdonline.com` / `/demo` → 200
  - `grep -r erdonline-demo.pages.dev --include='*.md' --include='*.mjs' --include='*.java' .` 仅剩 deployment 运维别名与 CHANGELOG 历史
  - 已同步各平台草稿的文章 CTA 需用户重跑 `sync-wechatsync.mjs` 更新线上链接

#### 增长：首发文章 #3 git-style-version-diff（版本 diff 主打篇）

- **正文**：`content/articles/git-style-version-diff.md` 写满全 H2（事故开场 → 机制对比 → 版本/diff 卖点 → 30s demo CTA → 协作/自部署/参与）；`status=ready`；平台 `juejin,zhihu,weixin,csdn,oschina`
- **流水线**：`PLATFORMS` / `build-package` / `wechatsync` 补 `weixin`、`csdn`；Wechatsync 平台 ID 修正 `weixin`（非 `wechat`）
- 验证点：
  - `node scripts/growth/build-package.mjs git-style-version-diff` 出 5 平台包 + checklist
  - Wechatsync 草稿同步：juejin ✓、weixin ✓、csdn ✓、oschina ✓；zhihu ✗（403 没有对应的权限，需账号侧排查）

#### 增长：Wechatsync 多平台草稿同步（sync-wechatsync.mjs）

- **识别**：用户所称 WebChatSync = 开源 [Wechatsync / 文章同步助手](https://github.com/wechatsync/Wechatsync)（Chrome 扩展 + `@wechatsync/cli`，经 WebSocket 调浏览器内已登录态的平台 Web API，默认草稿）
- **改法**：新增 `scripts/growth/sync-wechatsync.mjs` + `lib/wechatsync.mjs`（按平台 sync `content/dist/<slug>/*.md`，跳过 v2ex）；`scripts/growth/package.json` pin `@wechatsync/cli@1.1.0` + CJS overrides（Node 20 兼容）；`.env.example` 增 `WECHATSYNC_TOKEN` / `SYNC_WS_PORT`；`docs/growth.md` / `content/articles/README.md` / publish-checklist 补接入说明
- **边界**：实同步需本机 Chrome 扩展 + Token；CI 不跑；仍不做无扩展 cookie/Playwright 发帖；V2EX 人工
- 验证点：
  - `cd scripts/growth && npm install` 成功
  - `node scripts/growth/sync-wechatsync.mjs git-style-version-diff --dry-run` 对 juejin/zhihu/wechat 三平台 dry-run 绿（标题/UTM 正确）
  - 缺 `WECHATSYNC_TOKEN` 实跑 exit 1 并提示；`--check-auth` 需 Token（扩展连接后可用）

#### 增长：文章发布流水线（content/articles + scripts/growth + growth-publish Action）

- **改法**：新增 `content/articles/`（frontmatter 草稿：`title/slug/status/platforms/cta/utm_campaign`）+ `scripts/growth/new-article.mjs`（模板开稿）+ `scripts/growth/build-package.mjs`（按平台出可粘贴包：juejin/zhihu/wechat/segmentfault/oschina 为 `.md`、v2ex 为精简 `.txt`，外加 `publish-checklist.md`）；UTM 链接统一由 `scripts/growth/lib/utm.mjs` 注入（demo 主 CTA，source=平台、content=slug）；`.github/workflows/growth-publish.yml` 在 PR 打 `growth-publish` 标签时构建并上传 artifact
- **边界**：发布动作保持人工（掘金/知乎/V2EX/公众号无官方发布 API，登录态自动化违反 ToS 且易碎，明确不做）；Phase 2 仅预留「官方 API token + adapter」口径
- **文档**：增长方案蒸馏至 `docs/growth.md`（漏斗/渠道 ROI/12 选题包/度量判据/4 周节奏）并挂入文档站侧栏；种子草稿 `git-style-version-diff.md`（选题 #3 大纲，status=draft）
- 验证点：
  - `node scripts/growth/new-article.mjs --slug smoke-test-article ...` 建稿成功；重复 slug / 非法 slug / 未知平台与 cta 均被拒（exit 1）
  - `node scripts/growth/build-package.mjs --all --status draft` 出包：juejin.md 含 `utm_source=juejin&...&utm_content=git-style-version-diff` 的 demo 主 CTA；README.md 不参与 `--all`
  - `cd website && yarn build` 绿（growth.md 已按 MDX 规则转义 `<`）
  - `npx js-yaml .github/workflows/growth-publish.yml` 解析通过

### 2026-08-08

#### 推广链路：分享/演示链接社交解析 OG 卡片（ADR-0025）

- **改法**：新增后端匿名揭示页 `OgUnfurlController`（`GET /og/s/{token}`、`GET /og/demo`），按 token 输出 `og:*` + `twitter:card=summary_large_image`（项目名/描述/表数量），HTML 全转义防注入，失效 token 回落品牌卡片；`ErdSecurityConfiguration` 放行 `GET /og/**`
- **动态图**：`GET /og/s/{token}/image.png`、`/og/demo/image.png` 由 `OgImageRenderer`（Java2D，无浏览器）从 projectJSON 渲染 1200×630 ER 缩略图（表名/字段网格 + 品牌 + 标语），缺 CJK 字体时按 `canDisplay` 过滤不豆腐；`og:image` 指向该动态图
- **托管**：`frontend/nginx.conf` 按爬虫 UA 把 `/s/:token`、`/demo` rewrite 到内部 `/_og` 反代揭示页；`/og/**`（含 og:image 抓取，任意 UA）恒反代后端；真人保持 SPA
- 验证点：
  - `mvn -Dtest=OgUnfurlControllerTest,OgImageRendererTest test` 绿（OG：per-project/XSS/失效回落/多源取首；图：合法 PNG + 1200×630）
  - `curl -H 'User-Agent: Twitterbot' /og/s/{token}` 含正确 `og:title` 与「N 张表」、`og:image` 指向动态图；`curl /og/s/invalid` 回落品牌卡片（均本机跑过）
  - `curl /og/s/{token}/image.png` → `image/png` 1200×630（真实项目缩略图，含表名网格）；经 nginx 抓 og:image 返回 PNG（均本机跑过）
  - `nginx -t` 通过；本机起 nginx：bot `/s/{token}`→OG HTML、真人→SPA、`/og/**`→后端图（均跑过）

#### 修复：docusaurus 文档站构建（死链 + MDX 花括号）

- **改法**：3 处 `../mcp/README.md` 死链改指 GitHub URL；`control-matrix`/`regression-checklist`/`ui-layout-redesign` 中裸 `{username}`/`{表名}` 占位符加反引号，避免 MDX v3 当 JS 表达式求值
- 验证点：`cd website && yarn build` → SUCCESS（此前 `main` 常年红）

#### 推广链路·度量：漏斗埋点 + 首触 UTM 归因

- **改法**：新增 `frontend/src/utils/analytics.ts`——首触（first-touch）UTM/referrer 归因落 `localStorage`（幂等不覆盖），`track()` 落 `window.__erdFunnel`（供 E2E）并转发已接入的百度统计 `_hmt`；埋点绝不影响主流程（全程 try/catch）。
- **挂点**：`app.tsx` 引导时 `captureAttribution()`；落地页 `landing_view`；只读分享/演示页 `demo_open`/`share_view`；版本保存成功处（`versionSaveConflict.handleVersionSaveResponse`）`version_save`（北极星）。
- 验证点：
  - `npx tsx src/utils/analytics.test.ts` 绿（首触幂等 / 直达无 utm 不建归因 / 外部 referrer 归因 / track 落盘）
  - 运行态 Playwright：`/?utm_source=hn&...` → `localStorage['erd:attribution'].utm_source==='hn'` 且触发 `landing_view`；`/demo` 触发 `demo_open`（本机跑过 `WIRING_OK`）
  - `yarn lint:js:ci` 0 error、`yarn build` 绿

### 2026-08-06

#### UI：Home / Group 顶栏补「通知」入口（ChromeNotificationsButton）

- **改法**：从 DesignLayout 工作流条抽取共用 `ChromeNotificationsButton`（`BellOutlined` + 跳转 `/project/notice`）；HomeLayout / GroupLayout 顶栏用户菜单左侧挂载；DesignLayout 改用同一组件（`data-testid="design-workflow-notifications"` 不变）
- **i18n**：新增 `chrome.notifications`（zh/en）；移除仅设计器使用的 `designLayout.workflow.notifications`
- 验证点：
  - `cd frontend && yarn build` 绿
  - 登录后 `/home` 顶栏可见「通知」，点击进 `/project/notice`
  - `yarn test:e2e --project=chromium tests/e2e/i18n.spec.ts --grep "HomeLayout 与 GroupLayout"` 绿

#### 前端：图标统一为 @ant-design/icons

- **范围**：移除 Icon Park（`@icon-park/react`）与 iconfont `MyIcon`；三壳菜单、导出/导入对话框、数据类型树、关系图画布控件等全部改用 `@ant-design/icons`
- **清理**：删除 `package.json` 中 `@icon-park/react` 依赖；移除 `Menu/index.tsx` 的 `createFromIconfontCN` / `MyIcon` 导出
- **保留**：品牌 logo（`/logo.svg`）、空态插图（`/empty.svg`）等非 UI chrome 资源不动
- 验证点：
  - `rg '@icon-park|MyIcon|createFromIconfontCN' frontend/src` → 无命中
  - `cd frontend && yarn build` 绿

#### UI：顶栏头像 + 用户名视觉对齐（ChromeUserMenu）

- **根因**：三壳顶栏用 Icon Park `Me`（品牌红填充 + 细描边圆）作占位头像；`.erd-chrome-header` 的 `line-height: 64px` 继承到用户名，导致文字相对 28px 图标偏上；gap 6px 显松
- **改法**：抽取 `ChromeUserMenu`（Home / Group / Design 共用）；中性灰底圆 + `UserOutlined`；用户名 `line-height: 1` + 4px gap；hover 时 avatar 淡 brand 底
- 验证点：
  - `cd frontend && yarn build` 绿
  - 登录后 `/home`、设计器、Group 顶栏右上角 avatar+name 垂直居中、无红描边环

#### 链接：社区与文档 URL 统一

- **社区/论坛**：产品面全部改为 `https://github.com/erdonline/erdonline/issues`（落地页 footer、HomeLayout/GroupLayout 论坛菜单、Issue 模板 contact_links、历史公告 Flyway `V19`）
- **文档**：产品面统一 `https://erdonline.github.io/erdonline/`（README、落地页 Roadmap 深链 `/docs/roadmap`、部署验收表主行）；CF `erdonline-docs.pages.dev` 保留为运维镜像说明
- 验证点：
  - `rg 'www-zerocode|/discussions' frontend .github/ISSUE_TEMPLATE docs/roadmap.md README.md` → 无产品面命中（V3 基线 seed + 迁移 WHERE 除外）
  - `cd frontend && yarn build` 绿
  - `gh api repos/erdonline/erdonline --jq .has_issues` → 期望 `true`（若 false，请在 GitHub Settings 开放 Issues）


- **改法**：`frontend/config/config.ts` 在 `UMI_ENV=prod` 时经 `headScripts` 内联 IIFE 注入 Cloudflare beacon（token `4df015bf119f48ff9b03f302f6a3e40a` 硬编码；Umi 无法直接写带 JSON 的 `data-cf-beacon` 属性）
- **保留**：`analytics.baidu` 不变
- 验证点：
  - `cd frontend && API_URL=https://example.com yarn build:prod` 绿；`grep -E 'cloudflareinsights|4df015bf119f48ff9b03f302f6a3e40a' dist/index.html` 命中
  - `cd frontend && yarn build`（dev）绿；上述 grep 无输出
  - 部署后 `curl -sL https://erdonline-demo.pages.dev | grep cloudflareinsights` 命中

#### 前端：百度统计 ID 硬编码（Umi analytics.baidu）

- **改法**：`frontend/config/config.ts` 固定 `analytics.baidu: bd50dd978c8d8d94792f4e987c4a7aaf`；撤销 `377ac03` 的 `BAIDU_TONGJI_ID` 环境变量门闸（工作流 / Dockerfile / `.env.example`）
- **SPA**：hash 路由，hm.js 自动跟踪 hash 变化，无需额外 route listener
- 验证点：
  - `cd frontend && yarn build:prod` 绿；`grep -r hm.baidu.com dist/index.html` 命中
  - `cd frontend && yarn build`（dev）绿；`grep hm.baidu dist/index.html` 无输出

### 2026-08-05

#### UI：输入类控件 focus 环全局柔化（Plan A · 保留 brand 主色）

- **范围**：工作台主题页 Input / Select / TextArea 的 focus 描边与光晕；按钮/链接/Tab 等交互仍保留 `--erd-brand` focus-visible 环
- **改法**：`theme/tokens.ts` 为 Input/Select 覆写 `hoverBorderColor` / `activeBorderColor` / `activeShadow` 为中性灰；`css-vars.less` 新增 `--erd-control-focus-outline` / `--erd-control-focus-shadow`；Home/Design/Group/Auth 壳与账号设置页将 input/select/textarea 的 `:focus-visible` 从 brand 改为中性 outline
- **保留**：`--erd-brand` / `colorPrimary` 不变；invalid 态仍走 antd `colorError` 红环
- 验证点：
  - `cd frontend && yarn build` 绿
  - `yarn test:e2e --project=chromium tests/e2e/group-keyboard.spec.ts --grep "focus-visible"` 绿（按钮 brand 环未回归）
  - `yarn test:e2e --project=chromium tests/e2e/common-tabs-keyboard.spec.ts --grep "focus-visible"` 绿

#### UI：版本页移除顶栏「返回模型 / 我的工单 / 我的审批」入口

- **范围**：设计器版本列表页（`/design/table/version/all`）`version-page__bar` 内三个 link 按钮；侧栏与顶栏主 tab 导航不变
- **保留**：版本状态 Tag（版本一致等）、工具条、保存/对比等操作；无数据源时仍显示 hint
- 验证点：
  - `cd frontend && yarn build` 绿
  - `yarn test:e2e --project=chromium version.spec.ts --grep "版本页不再显示顶栏返回"` 绿

#### UI：设计器顶栏状态簇样式统一（用户反馈「这块区域太丑」）

- **范围**：`SaveStatus` / `VersionDirtyChip` / `SchemaProbeControl`（chrome 模式）顶栏状态区；行为与 i18n 文案不变
- **改法**：新增共用 `erd-status-chip` + `erd-chrome-status-cluster` 容器——统一 22px pill、11px 字重、语义色走 `--erd-*` token；警告态改为 8% 浅 tint 替代大块 `#fffbe6`；「保存版本」主按钮与状态簇视觉分离
- 验证点：
  - `cd frontend && yarn build` 绿
  - Playwright 打开 `http://localhost:8000/design/table/model?projectId=…` 截图核对顶栏：状态 chip 等高、无 header line-height 撑高、主按钮层级清晰

#### 安全：`data_sources.username`/`password` 落库加密（R-DATA-06 · ADR-0024）

- **根因**：ADR-0008 把 JDBC 机密收敛到唯一事实源表 `data_sources` 后，该表本身仍以明文存 `username`/`password`——MySQL 备份/慢查询日志/拿到数据卷者可直接读到用户下游数据库口令
- **改法**：新增 `DataSourceCredentialCipher`（AES-256-GCM，密文前缀 `enc:v1:`）；`DataSourcesServiceImpl`（覆盖 `save`/`updateById`/`update`/`getById`/`list`/`page`，间接覆盖 `getPage`/`tree`）与 `DataSourceAcl`（唯一绕过 Service 直查 mapper 的路径）落库前加密、取出后解密；Controller/`ConnectorCredentialResolver`/前端表单完全透明，仍收发明文，API 行为零变化
- **向后兼容**：`decrypt()` 对无 `enc:v1:` 前缀的存量明文直接透传，不报错；用户下次编辑保存该连接（username/password 表单必填）时 `encrypt()` 自动补加密——渐进迁移，无需批量改写脚本或停机窗口
- **密钥**：`ERD_DB_CONFIG_SECRET`（`erd.datasource-secret.key`），本地/dev 仓库弱默认，prod 缺失 fail-fast 且拒绝仍等于默认值（同 `JwtConfig` 套路）；已写入 `.env.example` / `docker-compose.yml`
- **Schema**：新增 `V18__data_sources_credential_widen.sql`，把 `username` 加宽到 `varchar(255)`、`password` 加宽到 `varchar(500)`，覆盖密文膨胀（+base64 ~33% +28B +前缀）
- 验证点：
  - `DataSourceCredentialCipherTest`（13 例：roundtrip、IV 随机性、幂等、存量明文透传、篡改/错密钥抛异常、prod fail-fast）全绿
  - `mvn test` 全量通过（唯一失败 `OracleReverseDialectCommentTest` 经 `git stash` 验证为 main 既有失败，与本改动无关）
  - `curl` 手工验证：`POST /ncnb/dataSources` 后直查 MySQL 见 `password` 为 `enc:v1:...`；`GET /ncnb/dataSources/{id}` 与分页列表仍返回明文；手工插入明文行 → `GET` 可读 → `PATCH` 重新保存 → MySQL 中变为密文
  - `./backend/dev-ensure.sh --restart` 后 `flyway_schema_history` 见 `18 | data sources credential widen | 1`

#### 修复：public-demo 布局改用 dagre 算法生成，弃手排 x/y（用户反馈 `7bbcbfa` 手排重叠失败）

- **根因**：`7bbcbfa` 手排布局的估算节点高度与真实字段数不符，导致 `sys_role_permission` 被邻居遮挡、`sys_user_role` 与相邻卡重叠、Frame 手感画框未按真实包围盒算，边穿卡、1:n 标签落在绕线上——用户反馈截图证实（见对比图）
- **改法**：不新写布局算法，产品设计器/DBML 导入早已有的 `frontend/src/utils/graphLayout.ts`（dagre 分层 + `estimateNodeHeight` 按真实字段数算高）本就是唯一真相源；新增一次性生成脚本 `frontend/scripts/gen-demo-layout.ts` 调用同一 `dagrePositions()`，对 8 表 + 7 关联重算坐标（主图 TB 分层、第二视图 LR 分层），并用 `diagram.ts` 的 `computeFrameBoundsFromNodes()` 按 dagre 分层结果（rank）聚类后烘焙 Frame 包围盒（自动跳过任何会侵入非成员节点的候选框）——Frame 不再是手感画的语义框（主体/RBAC/会话审计/业务 4 个），改成贴合布局真相的 2 个「关联与明细」「核心实体」
- **落地**：`schema/examples/demo.projectjson.json` 重写 → `node scripts/sync-demo-projectjson.mjs`（脚本改指向新增 Flyway，V16 已上线不可覆写）→ 新增 `V17__public_demo_layout_dagre.sql`；i18n 键随 Frame 改名同步（`demo.group.subject/rbac/sessionAudit/business` → `demo.group.detail/core`；`demo.diagram.d_session` 「会话与审计」→「纵向视图」，因第二视图已是通用备选朝向非会话叙事）
- **回归测试**：`graphLayout.test.ts` 新增「demo 主图坐标来自 dagre 重算结果」（回归到手排会挂）+「主图/会话图节点两两不重叠」（真实字段高度矩形 AABB 断言，代替过时的手排 x 跨度魔数）
- 验证点：
  - `./backend/dev-ensure.sh --restart` 后 `flyway_schema_history` 见 `17 | public demo layout dagre | 1`
  - `cd frontend && npx tsx src/utils/graphLayout.test.ts` 全绿（含新增两条重叠回归）
  - `cd frontend && yarn playwright test tests/e2e/demo.spec.ts --project=chromium` 2 passed
  - Playwright MCP 打开 `http://localhost:8000/s/public-demo` 截图核对：8 表两两不重叠、边不穿卡、Frame 边界贴合成员、1:n 标签落在直段上（对比 `7bbcbfa` 截图有明显改善）

#### 演示：public-demo 关系图布局优化 + 分享页 i18n

- **布局**：真相源 `schema/examples/demo.projectjson.json` 主图改为左→右叙事列——`sys_user`（主体）→ 中间表 `sys_user_role`/`sys_role_permission` 夹在实体之间 → RBAC 链 → 会话/审计 → 业务；junction 不再堆在 RBAC 区右侧，减少长绕线与交叉；第二图「会话与审计」独立手排；Frame 包围盒同步烘焙；Flyway `V16__public_demo_layout.sql` 增量更新已有库
- **i18n**：`/s/public-demo` 渲染层映射（`demoShareI18n.ts`）——项目名/描述、模块与关系图 Segmented、分组 Frame 标题、表中文名、Frame meta「N 张表」；分享顶栏补 `LocaleSwitcher`；新增 `demo.*` / `share.frame.*` / `share.badge.*` 键
- 验证点：`./backend/dev-ensure.sh --restart`；`npx playwright test tests/e2e/demo.spec.ts --project=chromium` 绿（含 LocaleSwitcher 英文断言）；`npx tsx src/utils/graphLayout.test.ts` 绿；`yarn build` 绿；浏览器打开 `http://localhost:8000/s/public-demo` 见清晰 LR 布局 + 语言切换


- 决策：`DesignLayout` 工作流/skip-nav i18n 已在 #6/`1c63853` 完成，不重复；Pull/Push（#16）仍须用户开闸；#23–#32 E2E 续跑已全部 ✅（末刀 `76d1a1a`）
- 改动：`agent-loop-vision.prompt.md` 标记 awaiting theme + 下一刀开闸表；`roadmap.md` 同步 i18n/队列状态；`regression-checklist.md` 补 #32 双人 B localDirty 项

验证点：grep `designLayout.workflow` 键存在；prompt/roadmap 无「下一刀 DesignLayout workflow」漂移

#### 可信保存：双人协作 B localDirty 时离开补枪不覆写 E2E（Vision #32 · ADR-0022）

- 缺口：#31 仅覆盖 B 已落盘（clean）态；未覆盖 B 含 localDirty（阻断 save）时 A 失败离开补枪不得静默覆写 B 已落库 + 未保存改动
- 改动：`leave-designer-save.spec.ts` 复用 sync-toast 双 context + #31 冲突刷新模式；B 先落盘字段再阻断 save 加 dirty 字段 → A 失败离开补枪 → 断言 B 已落库字段 + localStorage 草稿 + 无 A 脏表；reload 草稿恢复后双字段仍可见
- 队列：`agent-loop-vision.prompt.md` 一致性续跑 #32 ✅

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/leave-designer-save.spec.ts --grep "B 未保存与已落库"`

#### 可信保存：双人协作离开补枪不覆写对方落库 E2E（Vision #31 · ADR-0022）

- 缺口：#28–#30 均为单 context 个人项目；未覆盖团队项目双人同屏时 A 落库失败离开补枪不得静默覆写 B 已落库改动
- 改动：`leave-designer-save.spec.ts` 复用 `sync-toast.spec.ts` 双 browser context（owner + peer）；B 建模块落盘 → A 409 刷新对齐 → 阻断 A `group/save` → A 失败编辑后离开补枪 → 断言 B 仍见 T_TABLE_1、无 T_TABLE_2、reload 后可续编落盘
- 队列：`agent-loop-vision.prompt.md` 一致性续跑 #31 ✅

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/leave-designer-save.spec.ts --grep "A 落库失败离开后"`

#### 可信保存：beforeunload + 落库失败草稿守卫 E2E（Vision #30 · ADR-0022）

- 缺口：#28/#29 覆盖 SPA 内链离开（`closeSocket` 补枪）；未覆盖浏览器级离开（reload / 关页）时 `useProjectDraftGuard` 不覆写失败态草稿
- 改动：`leave-designer-save.spec.ts` 新增 2 用例——reload 后 localStorage 仍含失败字段 + 草稿恢复弹窗；关页重开可恢复 + 顶栏重试 CTA；**不对 Playwright `beforeunload` native dialog 做硬断言**（Chromium 空文案 + dismiss/accept 时序脆），以 draft 持久化为验收口径
- 队列：`agent-loop-vision.prompt.md` 一致性续跑 #30 ✅

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/leave-designer-save.spec.ts`

#### 可信保存：防抖窗口内离开补枪 E2E（Vision #29 · ADR-0022）

- 缺口：#28 覆盖失败态离开补枪 + 顶栏重试；未覆盖「编辑后见保存中即离开（<600ms 窗）→ 补枪成功/失败可见」
- 改动：`leave-designer-save.spec.ts` 新增 2 用例——成功：保存中离开 → waitForResponse → 重进无草稿 + T_TABLE_2；失败：abort save + 未落盘离开 → 草稿恢复 + 顶栏重试 CTA
- 队列：`agent-loop-vision.prompt.md` 一致性续跑 #29 ✅

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/leave-designer-save.spec.ts`

#### 可信保存：离开设计器失败态补枪 + 顶栏重试 E2E（Vision #28 · ADR-0022）

- 缺口：#27 已覆盖顶栏重试 seq；离开路径仅断言「补一枪」，未串联「失败 → 离开补枪 → 回设计器重试 → 干净离开」
- 改动：`leave-designer-save.spec.ts` 新增用例——mock 500×2（autosave + closeSocket 补枪）→ 草稿恢复 → 顶栏重试 → 已落盘 → 二次离开零 save；旧用例 aria 对齐 `failedAria`
- 队列：`agent-loop-vision.prompt.md` 一致性续跑 #28 ✅

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/leave-designer-save.spec.ts`

#### 可信保存：顶栏重试 seq 对齐，不卡「保存中…」（Vision #27 · ADR-0022）

- 根因：`retryAutosave` 经 `preemptAutosave()` 传 `autosaveSeq`，`persistAutosave` 仅校验 `debounceSeq` → 重试结果被丢弃且 `saving` 未清
- 改动：`projectAutosave.isPersistAutosaveCurrent`（debounce ∨ autosave）；`persistAutosave` 成功/失败/catch 均用该判据；`save-status-failure-routing.spec.ts` 补「mock 失败 → 点顶栏重试 → 已落盘」
- 队列：`agent-loop-vision.prompt.md` 一致性续跑 #27 ✅

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/save-status-failure-routing.spec.ts`

#### 可信保存：落库失败 vs 409 冲突顶栏态分流 E2E（Vision #26 · ADR-0022）

- 缺口：`save-failure.spec.ts` 与 `project-save-conflict.spec.ts` 各测一路，未显式断言两种顶栏失败态不得混用（重试 CTA vs 冲突 Modal）
- 改动：新增 `save-status-failure-routing.spec.ts`——mock 500 断言「保存失败，点击重试」+ 无冲突 Modal/文案；mock 409 断言冲突 Modal +「保存冲突，点击查看选项」+ 无失败重试 aria/文案
- 队列：`agent-loop-vision.prompt.md` 一致性续跑 #26 ✅

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/save-status-failure-routing.spec.ts`

#### 可信保存：409 冲突 Modal 决策路径 E2E + 静态 Modal i18n 修复（Vision #25 · ADR-0022）

- 缺口：E2E 仅断言 409 Modal 出现，未覆盖「刷新项目 / 另存为新项目」决策；i18n #19 后 `Modal.warning` 内 `useIntl()` 无 IntlProvider 致 Modal 崩溃（顶栏冲突态有、对话框无）
- 改动：`project-save-conflict.spec.ts` 新增 refresh/fork 用例（testid 点击 + toast/URL/草稿断言）；`ProjectSaveConflictModal` 改 `appFormat()` + `VersionDiffPanelStatic`；Modal 重开 guard、`fork` 后 `destroyAll`；`forkLocalProjectAsCopy` 跳转修正为 `/design/table/model`
- 队列：`agent-loop-vision.prompt.md` 一致性续跑 #25 ✅

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/project-save-conflict.spec.ts`

#### 可信保存：本地草稿「丢弃」路径 E2E + 稳定 testid（Vision #24 · ADR-0022）

- 缺口：回归清单要求「恢复草稿/丢弃草稿」双路径，E2E 仅覆盖恢复；Modal 按钮无稳定 testid
- 改动：`projectDraftRecovery.ts` 补 `project-draft-recovery-content/restore/discard` testid；`project-local-draft.spec.ts` 新增丢弃用例——落库失败写草稿 → 重进点丢弃 → localStorage 清、画布无未落库字段、再次进入不弹窗
- 队列：`agent-loop-vision.prompt.md` 一致性续跑 #24 ✅

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/project-local-draft.spec.ts --grep "丢弃草稿"`

#### 可信保存：基线查询失败 E2E + 失败态不沿用旧基线（Vision #23 · ADR-0022）

- 缺口：回归清单「基线查询失败为未知」仅手工 + 单测；`fetchVersionBaseline` catch 未清 `baselineLoaded`；业务码非 200 被误判为「尚无版本」
- 改动：`fetchVersionBaseline` 校验 `res.code===200`、失败显式 `baselineLoaded=false`；`version-baseline.spec.ts` 新增用例——mock `dbChange` size=1 网络中断 → 顶栏 `version-dirty-chip-unknown` + 版本页 `version-baseline-unknown` → 解除拦截点击重试恢复「版本一致」
- 队列：`agent-loop-vision.prompt.md` 一致性续跑 #23 ✅；i18n post-MVP 暂停，回归双层主线

验证点：
- `cd frontend && npx tsx src/utils/versionDirtyStatus.test.ts`
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/version-baseline.spec.ts --grep "基线查询失败"`

#### i18n：Design 版本 store confirm（useVersionStore confirmDestructive）

- `useVersionStore.tsx`：sync/markSync/rebuild 三处 `confirmDestructive` 标题/正文/OK·取消改 `appFormat()`
- 语料：新增 `versionStore.confirm.*` 9 key × EN+ZH
- 队列：`agent-loop-vision.prompt.md` i18n post-MVP #22 ✅；post-MVP i18n 队列 #17–#22 全部完成

验证点：
- `cd frontend && yarn build`
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/version-rebuild-confirm-keyboard.spec.ts`
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/version-sync-result-keyboard.spec.ts --grep "同步确认"`

#### i18n：Design 版本 store toast（useVersionStore message.*）

- `useVersionStore.tsx`：`message.*` / sync 失败 fallback 全部改 `appFormat()`；复用 #19–#20 的 `versionModal.*` 校验/跨版本 key
- 语料：新增 `versionStore.*` 31 key × EN+ZH
- 队列：`agent-loop-vision.prompt.md` i18n post-MVP #21 ✅

验证点：
- `cd frontend && yarn build`
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/i18n.spec.ts --grep "Design 版本页 Modal"`

#### i18n：Design 版本页其余 Modal（Init / Rename / Revert / Remove / Sync / Rebuild）

- `InitVersion.tsx` / `RebuildVersion.tsx`：工具栏按钮 + Modal 表单 key 化；`appFormat()` 供 init 成功/无数据源 toast
- `RenameVersion.tsx`：编辑按钮/Modal/校验 toast key 化
- `RevertVersion.tsx` / `RemoveVersion.tsx`：确认 Modal 标题/正文/是·否 key 化
- `SyncVersion.tsx`：同步按钮与 aria key 化
- 语料：新增 `versionModal.*` 38 key × EN+ZH（复用 #19 校验/表单 label）
- 队列：`agent-loop-vision.prompt.md` i18n post-MVP #20 ✅

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/i18n.spec.ts --grep "Design 版本页 Modal"`

#### i18n：Design 版本页 Modal（SaveVersion / AddVersion / Compare / SyncConfig / conflict / diff）

- `SaveVersionButton.tsx`：顶栏「保存版本」key 化
- `AddVersion.tsx` / `SyncConfig.tsx` / `CompareVersion.tsx`：Modal 标题/表单/按钮/toast key 化
- `VersionDiffPanel.tsx`：空态/类型/操作/摘要 key 化；`changeSummaryTags` 支持 `MessageFormatFn`
- `ProjectSaveConflictModal.tsx`：409 冲突 Modal 全文 key 化；新增 `appFormat()` 供 imperative Modal
- 语料：`versionModal.*` 共 72 key × EN+ZH
- 队列：`agent-loop-vision.prompt.md` i18n post-MVP #19 ✅

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/i18n.spec.ts --grep "Design 版本页 Modal"`

#### i18n：Group 设置子页正文（基本设置 / 用户组 / Modal）

- `project/group/component/BasicSetting.tsx`：表单 label/placeholder/校验/toast/删区 key 化
- `GroupSetting.tsx` / `GroupPermission.tsx`：页标题/嵌套 tab/权限工具栏 key 化
- `AddUser.tsx` / `GroupUser.tsx` / `RemoveGroupProject.tsx`：Modal/搜索/移除/删除确认 key 化
- 语料：`groupSetting.*` 共 58 key × EN+ZH
- 队列：`agent-loop-vision.prompt.md` i18n post-MVP #18 ✅

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/i18n.spec.ts --grep "Group 设置子页正文"`

#### i18n：Design 版本页正文（空态 / 标签筛选 / 推送态 / 工具栏）

- `design/version/index.tsx`：空态/标签筛选/推送书签态/工具栏/顶栏导航/行 meta 可见文案 key 化（`VersionLayerStatusTag` / `DualLayerLegend` / 顶栏 SchemaProbe 已在 #5 完成，本切片不重复）
- 语料：`versionPage.*` 共 28 key × EN+ZH
- 队列：`agent-loop-vision.prompt.md` i18n post-MVP #17 ✅

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/i18n.spec.ts --grep "版本页正文"`

#### i18n：Group/Design 高流量页正文（团队列表 + 表设计工作区）

- `project/group/index.tsx`：页标题/搜索/错误 toast key 化（复用 `projectList.*` + 新增 `projectList.group.title`）
- `design/table/index.tsx`：工作区空态（无 tab / 无模型 / 兜底）全文 key 化
- `design/table/component/tab/TableTab.tsx`：字段/索引/元数据应用/触发器签 key 化
- `EmptyStateAnimation`：移除硬编码中文默认 title
- 语料：`projectList.group.title` + `designTable.*` 共 11 key × EN+ZH
- 队列：`agent-loop-vision.prompt.md` i18n #16 ✅；i18n MVP 队列 #1–#16 全部完成

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/i18n.spec.ts --grep "团队项目列表与设计器表设计签"`

#### i18n：Home 高流量页正文（仪表盘 + 项目列表）

- `home/index.tsx`：欢迎语/统计/CTA/二级导航/进行中项目/公告区全文 `formatMessage` key 化
- `project/person` + `project/recent`：页标题/搜索/空态/错误 toast key 化
- 语料：`homePage.*` + `projectList.*` 共 33 key × EN+ZH
- 队列：`agent-loop-vision.prompt.md` i18n #15 ✅

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/i18n.spec.ts --grep "Home 仪表盘"`

#### i18n：账号设置「授权类型」子页

- `identification.tsx`：开源版/已取得授权标题 + MIT/授权详情副文案 `formatMessage` key 化
- 语料：`accountSettings.identification.*` 4 key × EN+ZH
- 队列：`agent-loop-vision.prompt.md` i18n #14 ✅

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/i18n.spec.ts --grep "授权类型"`

#### i18n：账号设置 PAT/OAuth/联邦绑定 Modal + ResetPassword

- `personalAccessTokens` / `oauthClients` / `federatedAccounts`：列表、工具栏、铸造/注册 Modal、凭证揭示 Modal、吊销确认 key 化
- `ResetPassword`：触发器、Modal 标题/表单/校验/成功失败 toast key 化
- 语料：`zh-CN.ts` / `en-US.ts` 同步 ~120 个 `accountSettings.*` key（含 `common.cancel/revoke/copy/saved`）
- 队列：`agent-loop-vision.prompt.md` i18n #13 ✅

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/i18n.spec.ts --grep "PAT/OAuth Modal|ResetPassword"`

#### i18n：OAuth 授权页正文 + 账号设置基本/安全表单 + Landing SEO

- `oauth/authorize`：title/subtitle/加载/错误/同意 meta/Allow·Deny/footnote 全量 `formatMessage`
- `account/settings/components/base` + `security`：表单 label/校验/提交/密码强度/第三方登录分隔 key 化
- `landing/index` + `compare`：`usePageSeo` hook 设置 document.title + meta description（随 locale）
- 语料：`zh-CN.ts` / `en-US.ts` 同步 ~40 个新 key
- 队列：`agent-loop-vision.prompt.md` #12 ✅

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/i18n.spec.ts --grep "账号设置侧栏|Landing SEO"`
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/oauth-consent.spec.ts`

#### i18n：Landing/Share/异常正文与 CTA + OAuth skip + 账号设置侧栏

- `landing/*`（`LandingChrome` / `index` / `compare`）：Hero、卖点、demo 带、对照表、顶栏/页脚 CTA 全量 `formatMessage`
- `share/index` + `ShareEmptyState`：加载/失效门/顶栏/fork/表清单等正文与 CTA key 化
- `403` / `404`：title/subtitle/CTA 改 `exception.*`
- `oauth/authorize`：skip 改 `oauth.skipLabel`（正文留下一刀）
- `account/settings`：侧栏路由名 + menu aria 改 `accountSettings.route.*`
- 语料：`zh-CN.ts` / `en-US.ts` 同步 ~90 个新 key
- 队列：`agent-loop-vision.prompt.md` #11 ✅

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/i18n.spec.ts --grep "Landing / 404 skip|账号设置侧栏"`

#### i18n：Landing/Share/异常 skip + Layout 路由名 key 化

- `LandingChrome` / `share/index` / `403` / `404`：skip 链接改 `common.skipMainAction` / `share.skip.canvas`
- `HomeLayout` / `GroupLayout` / `DesignLayout` `_defaultProps`：`name` → `nameKey`；`resolveRouteLabel()` 统一解析
- 语料：`zh-CN.ts` / `en-US.ts` 同步 22 个 route/skip key
- 队列：`agent-loop-vision.prompt.md` #10 ✅

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/i18n.spec.ts --grep "Landing / 404 skip"`
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/i18n.spec.ts --grep "HomeLayout 与 GroupLayout|DesignLayout 工作流"`

#### i18n：HomeLayout skip / chrome / 用户菜单 + GroupLayout skip key 化

- `HomeLayout/index.tsx`：`getHomeRightContent` / `getMenuHeaderDropdown` 工厂（公众号/GitHub aria、个人中心/授权/退出）；skip 链接改 `homeLayout.skip.*`；补 `user-menu-dropdown` testid
- `GroupLayout/index.tsx`：skip 复用 `homeLayout.skip.main`；`getHeadRightContent` + `getMenuHeaderDropdown`
- `DesignLayout/index.tsx`：`headRightContent` → `getHeadRightContent`；ChromeOverflow / 用户菜单随 locale
- 语料：`zh-CN.ts` / `en-US.ts` 同步 8 个 `homeLayout.*` key
- 队列：`agent-loop-vision.prompt.md` #9 ✅

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/i18n.spec.ts --grep "HomeLayout 与 GroupLayout"`

#### i18n：HomeLayout / GroupLayout 顶栏 aria key 化

- `HomeLayout/index.tsx`：品牌首页、主导航、用户菜单 aria 改走 `useIntl`（复用 `auth.brand.homeAria` / `designLayout.user.menuAria`；新增 `homeLayout.mainNavAria`）；品牌补 `erd-chrome-brand` testid
- `GroupLayout/index.tsx`：品牌首页、用户菜单、侧栏导航 aria 同上（新增 `groupLayout.siderNavAria`）；品牌补 `erd-chrome-brand` testid
- 语料：`zh-CN.ts` / `en-US.ts` 同步 2 个新 key
- 队列：`agent-loop-vision.prompt.md` Home/Group 顶栏 aria ✅

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/i18n.spec.ts --grep "HomeLayout 与 GroupLayout"`

#### i18n：DesignLayout 其余 aria/label key 化

- `DesignLayout/index.tsx`：项目菜单 fallback/aria、overflow「更多」、品牌首页、用户菜单、侧栏导航、主工作区 label 改走 `useIntl`（`designLayout.*` + 复用 `auth.brand.homeAria`）；补 `project-menu-trigger` / `design-chrome-overflow` / `erd-chrome-brand` testid
- 语料：`zh-CN.ts` / `en-US.ts` 同步 6 个 `designLayout.*` key
- 队列：`agent-loop-vision.prompt.md` #7 ✅；i18n MVP #1–#7 全部完成

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/i18n.spec.ts`（含 DesignLayout aria 切换 + 版本页侧栏 nav aria）

#### i18n：DesignLayout 工作流按钮 + skip-nav key 化

- `DesignLayout/index.tsx`：skip 链接（模型树/主工作区）+ 顶栏工作流三按钮（我的工单/待审批/通知）改走 `useIntl`（`designLayout.*` keys）；工作流按钮补 `data-testid` 供 E2E 定位与文案分离
- 语料：`zh-CN.ts` / `en-US.ts` 同步 6 个 `designLayout.*` key
- 队列：`agent-loop-vision.prompt.md` #6 ✅；下一刀：DesignLayout 其余硬编码 aria（项目菜单/overflow/侧栏）

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/i18n.spec.ts`（4 项全绿，含 DesignLayout 工作流 + skip-nav 切换断言）

#### i18n：设计器顶栏 chrome key 化

- `SaveStatus` / `VersionDirtyChip` / `SchemaProbeControl` / `DualLayerLegend` + `VersionLayerStatusTag`：可见文案与 aria/tooltip 改走 `useIntl`（`designer.*` keys）
- 共享：`messageFormat.ts`（`intlFormat` / `zhCnFormat`）；`dualLayerTokens` / `schemaProbeCopy` / `versionDirtyCopy` 接受 `MessageFormatFn`，单测默认 zh-CN 语料
- 配置：恢复 `locale.baseNavigator: true`（浏览器首访自动匹配 + LocaleSwitcher 显式覆盖）；E2E 仍固定 `locale: zh-CN`
- 队列：`agent-loop-vision.prompt.md` #5 ✅

验证点：
- `cd frontend && npx tsx src/utils/dualLayerTokens.test.ts` + `schemaProbeCopy.test.ts` + `versionDirtyStatus.test.ts` 全绿
- `cd frontend && yarn build` 绿
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/i18n.spec.ts`（含 save-status 切换断言）

#### i18n：baseNavigator 红线复核（结论：维持 `true`，非本条目最初判断）

- 本条目原计划将 `locale.baseNavigator` 由 `true` 改回 `false`：`d838b85` 落地时，浏览器语言为 `en*` 的用户首访会自动看到英文界面，字面看似与 [ADR-0023](./docs/adr/0023-i18n-foundation.md)「产品默认 zh-CN 不变」冲突
- 复核后维持现状 `true`：与并行会话交叉确认，用户已就此明确表态保留 `baseNavigator:true`（浏览器自动匹配）+ `LocaleSwitcher` 手动覆盖并持久化（`umi_locale`）作为最终方案，故本条目**不做代码改动**；`config.ts` / `getAppLocale()` / `docs/roadmap.md` 均保持「首访按浏览器语言匹配，用户可显式覆盖」的既有实现
- 记录本次复核过程，避免后续误读「baseNavigator 曾被改成 false」——该改动从未实际落地生效

验证点：
- `cd frontend && npx tsx src/utils/getAntdLocale.test.ts`（5 项全绿，含默认 zh-CN 回退语义）
- `cd frontend && yarn build` 绿

#### i18n：注册页 key 化

- `register/index.tsx`：表单标签/占位/tooltip/校验/提交/成功与密码不一致提示 + footer 链改走 `useIntl`（`register.*` keys）；演示链复用 `login.footer.demo*`
- 语料：`zh-CN.ts` + `en-US.ts` 同步新增 32 key（`register.*`）
- 队列：`agent-loop-vision.prompt.md` #4 ✅；下一刀：设计器顶栏 chrome key 化
- E2E：`i18n.spec.ts` 增 `register-submit` testid 文案切换断言

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/i18n.spec.ts`
- `cd frontend && yarn build`

#### i18n：落地页顶栏 LocaleSwitcher

- `LandingChrome`：`landingNavLinks` 内 GitHub 与登录 CTA 之间复用 `LocaleSwitcher`（`variant="chrome"` + `data-testid="locale-switcher"`）；`/compare` 子页同壳同步可见
- 样式：`index.less` 深色顶栏半透明描边，不侵入 hero CTA
- E2E：`landing.spec.ts` 断言 `locale-switcher` 可见

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/landing.spec.ts --grep "加载可见品牌"`
- `cd frontend && yarn build`

#### i18n：登录/联邦登录 + AuthBrandShell 品牌面板 key 化

- `AuthBrandShell`：品牌标题/导语/CTA、`auth.subtitle.default` / `auth.skip.default` 改走 `useIntl`
- `login/index.tsx`：表单标签/占位/校验/提交/ footer 链 + 联邦按钮/未配置提示（`login.*` keys）
- `login/federate.tsx`：状态文案/失败引导/返回按钮（`federate.*` keys）；`federate-back-to-login` testid
- 语料：`zh-CN.ts` + `en-US.ts` 同步新增 38 key（`auth.*` / `login.*` / `federate.*`）
- E2E：`i18n.spec.ts` 增 `login-submit` testid 文案切换断言（定位与文案分离）

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/i18n.spec.ts`
- `cd frontend && yarn build`

#### i18n：手动语言切换 LocaleSwitcher

- 新增共享组件 `LocaleSwitcher`（`data-testid="locale-switcher"` + `aria-label`）：`setLocale(lang, false)` + umi `useLocalStorage`（`umi_locale`）持久化，覆盖 `baseNavigator`
- 登录/注册/403/404/分享失效等 **AuthBrandShell** 右上角；已登录 **Home / Design / Group** 顶栏 `erd-chrome-actions`（头像左侧，经 `homeRightContent` 复用）
- 语料：`locale.switcher.label` / `locale.option.zh-CN` / `locale.option.en-US`（zh-CN.ts + en-US.ts）
- E2E：`i18n.spec.ts` 改走 UI 切换 → 断言 skip-nav `aria-label` 英文 → reload 持久化 → 切回中文

验证点：
- `cd frontend && yarn test:e2e --project=chromium tests/e2e/i18n.spec.ts`
- `cd frontend && yarn build`

#### i18n：启用浏览器语言自动匹配（baseNavigator）

- `frontend/config/config.ts`：`baseNavigator: true` — 首访按 `navigator.language` 匹配 `zh-CN` / `en-US`；未知语言回退 `default: zh-CN`；`useLocalStorage: true` 保留，用户显式切换仍优先
- `getAntdLocale()` / `Theme`：读取 umi `getLocale()`（在 env `LOCALE` 非空覆盖之后），`useIntl().locale` 驱动 antd Modal OK/Cancel 同步
- `resolveAppLocale`：`zh*` / `en*` 前缀映射；空 env `LOCALE` 不再硬锁 zh-CN，交给 umi
- E2E：`playwright.config.ts` 固定 `locale: 'zh-CN'`，避免 CI 英文浏览器导致中文断言失败
- ADR-0023 / `docs/roadmap.md` / `docs/development.md`：更新「禁止浏览器自动切换」为「自动检测 + localStorage 用户覆盖」

验证点：
- `cd frontend && npx tsx src/utils/getAntdLocale.test.ts`
- `cd frontend && yarn build`

#### 修复：Google 联邦登录「解绑 → 重新登录」报裸 JSON `code:500 「google-xxx」已存在`

- 现象：用户首次 Google 登录成功建号 → 在账号设置解除绑定 → 再次 Google 登录时，浏览器 OAuth 回调页直出裸 JSON `{"code":500,"data":null,"msg":"「google-113298977828932750600」已存在"}`，而不是正常登录或友好错误页
- 根因（两层，均命中）：
  1. **DB 唯一键不识别逻辑删除**：`user_identity_link` 全局走 MyBatis-Plus `delFlag` 逻辑删除（`application.yml: logic-delete-field: delFlag`），旧 `FederateUserService#unlink` 用 `linkMapper.deleteById(...)`——被 MP 拦截改写成 `UPDATE del_flag=1`，物理行仍占着 `uk_identity_provider_subject (provider, subject)` 唯一键；而该唯一键**不区分 del_flag**。用 SQL 直接复现：`INSERT` 一行 → 逻辑删除（`UPDATE del_flag=1`）→ 再 `INSERT` 同 `(provider,subject)` → `ERROR 1062: Duplicate entry 'google-sim-sub-1' for key 'user_identity_link.uk_identity_provider_subject'`，与用户报的错误消息格式完全一致（MySQL 复合唯一键的 entry 值是多列值按 `-` 拼接，恰好撞上 `google` + subject 数字串正好长得像一个「用户名」）
  2. **重新登录时没有「重新挂接」路径**：`resolveForLogin` 找不到链接（已被删）时只会「按邮箱找已有用户」或直接「新建用户」，没有「按约定用户名/其它信号识别孤儿账号」的分支；对无邮箱场景（微信天生无邮箱；Google 未开邮箱 scope）尤其致命——即便 1 的唯一键 bug 修掉，仍会因为约定用户名 `google_<sub>` 已被孤儿账号占用而在 `sys_user.username` 上再撞一次「已存在」
  3. 上述 `DuplicateKeyException` 由 `handleCallback` 内部抛出，`FederateController#callback` 只 `catch FederateException/IllegalArgumentException`，未被捕获时直接冒泡到 `GlobalExceptionHandler` 的全局 `DuplicateKeyException` 兜底（`@ResponseStatus 500`），把 OAuth 回调本该走的 302 跳转变成了裸 JSON 抛给浏览器
- 修复设计：产品语义拍板为「解绑仅收回第三方绑定权，本地账号保留；下次同身份登录自动重新挂接，不当新用户」：
  - `UserIdentityLinkMapper` 新增 `physicalDeleteById`（`@Delete` 原生 SQL，绕开 MP 逻辑删除拦截）；`unlink()` 改用它做真删除，彻底释放 `(provider,subject)` 坑位
  - `resolveForLogin` 新增「按约定用户名重新挂接」分支（用户名规则与 `allocateUsername` 无邮箱分支保持一致，含同样的 24 字符截断，否则两处算出的串不一致导致找不到孤儿账号），排在邮箱匹配之前；两个重新挂接分支都加 `canRelink` 防劫持检查（候选账号若已挂着同 provider 的别的 subject，说明不是孤儿账号，拒绝挂接）
  - 兜底：`resolveForLogin` 整体包一层 `catch (DuplicateKeyException e)` 转 `FederateException(409, "账号信息冲突，请重新尝试登录")`——即便极端并发下仍撞库，也走回调既有的「302 到 `/login/federate?error=`」友好路径，不再裸 500
  - Flyway `V15__user_identity_link_purge_soft_deleted.sql`：物理清掉存量软删行（`del_flag <> '0'`），释放已被历史 bug 卡住坑位的旧 provider+subject，无需等下次自然触发才修复
- 前端顺带修：`federatedAccounts.tsx` 解绑失败分支去掉多余的 `message.error('解绑失败')`——`utils/request.js` 的响应/错误拦截器已按后端真实 `msg` 统一弹过一次 toast，本地再弹会同一失败重复两条（`playwright-ux-audit.mdc`「重复反馈」）
- 新增 `FederateUserServiceTest`（10 例）：绑定新建、开放注册关闭拒绝、按约定用户名重新挂接（无邮箱）、按邮箱重新挂接、防劫持不重新挂接、`DuplicateKeyException→409`、`unlink` 走物理删除非 `deleteById`、`unlink` 未绑定报 404、`linkToUser` 冲突 409、`listLinks`

验证点：
- `cd backend && mvn -q test -Dtest=FederateUserServiceTest,FederateAuthServiceTest,FederateControllerTest -Djacoco.skip=true`：19 例全绿
- SQL 直接复现根因 1（本机 docker MySQL）：`INSERT` 链接 → `UPDATE del_flag='1'`（模拟旧 `unlink`）→ 再 `INSERT` 同 `provider+subject` → `ERROR 1062 Duplicate entry 'google-sim-sub-1' for key 'user_identity_link.uk_identity_provider_subject'`（与用户报错格式一致）；改成先物理 `DELETE` 再 `INSERT` → 成功，`del_flag='0'` 新行落地
- `./backend/dev-ensure.sh --restart` 后日志确认 `Migrating schema erd to version "15 - user identity link purge soft deleted"` 成功（`DbMigrate: Successfully applied 1 migration ... now at version v15`）；`SELECT COUNT(*) FROM user_identity_link WHERE del_flag<>'0'` = 0

#### 修复：联邦登录 redirect 带嵌套 query（`/s/public-demo?autofork=1`）时回调炸 `IllegalArgumentException`，落到 `/login/federate?error=Invalid character '='...`

- 现象：从 demo 分享页 `autofork=1` 触发登录 → 走 Federate（Google/GitHub）→ 授权成功回调时后端 500 内部抛异常被 `IllegalArgumentException` 分支兜住，302 到 `/login/federate?error=Invalid%20character%20%27%3D%27%20for%20QUERY_PARAM%20in%20%22/s/public-demo?autofork%3D1%22`；用户看到的是「登录失败」错误页而非真正落地页，一头雾水
- 根因：`FederateAuthService#buildUiRedirect` 拼最终 UI 跳转 Location 时用了 `UriComponentsBuilder.build(true)`——该重载**假定所有组件已完成编码**，只做合法性校验、不再编码；而 `appRedirect`（如 `/s/public-demo?autofork=1`，来自 `sanitizeRedirect` 允许透传的原始未编码值）里的裸 `?`/`=` 对 `QUERY_PARAM` 类型是非法字符，直接抛 `IllegalArgumentException: Invalid character '=' for QUERY_PARAM in "..."`；该异常被 `FederateController#callback` 的 `catch (IllegalArgumentException iae)` 捕获，异常消息本身被当作 `error` 文案二次编码后放进 `/login/federate?error=`，于是错误页 URL 里出现的正是这段 Java 异常消息（并非真正的第三方登录失败）
- 改动：`buildUiRedirect` 把 `b.build(true)` 换成 `b.build().encode()`——与同文件 `buildFailureRedirect` 一致的「先立 raw 组件、再统一 percent-encode」写法，`ticket`/`redirect` 里的 `?`/`=`/`/` 等字符正确编码进 query value，前端 `URLSearchParams.get('redirect')` 解码一次即拿回原始路径
- 新增回归测试 `FederateAuthServiceTest#handleCallback_encodesRedirectWithNestedQueryString`：mock 完整登录回调链路，redirect=`/s/public-demo?autofork=1`，断言不再抛异常且最终 Location 的 `redirect` query 参数解码后与原值一致

验证点：
- `cd backend && mvn -q test -Dtest=FederateAuthServiceTest,FederateControllerTest -Djacoco.skip=true` 绿（`handleCallback_encodesRedirectWithNestedQueryString` 在改动前会因 `IllegalArgumentException` 直接失败，改动后通过）
- `./backend/dev-ensure.sh --restart` 后 `curl http://localhost:9502/auth/federate/providers` 200

#### 修复：Google 联邦登录「开放注册已关闭」误报 code=500 + 回调裸 JSON

- 根因：`FederateUserService.resolveForLogin` 在 `ERD_ALLOW_OPEN_REGISTER=false` 且无已有绑定/邮箱匹配用户时抛 `FederateException(403, …)`；`FederateController` 却用 `R.failed(msg)`（业务码固定 500），浏览器 OAuth 回调直接展示 JSON
- 改动：`FederateException` 统一 `R.failed(status, msg)` 对齐 HTTP/业务码；OAuth 回调失败 302 至 `/login/federate?error=`；落地页展示可操作建议（先登录再绑定 / 联系管理员）
- 未改 prod 默认 `ERD_ALLOW_OPEN_REGISTER=false`

验证点：
- `cd backend && mvn -q test -Dtest=FederateControllerTest,FederateAuthServiceTest` 绿

#### 修复：容器 `ERD_ALLOW_OPEN_REGISTER=true` 在 prod 不生效，Google 联邦仍报「开放注册已关闭」（R-CFG-07）

- 根因：`application-prod.yml` 把 `erd.security.allow-open-register` / `allow-demo-admin` 写成**字面量** `false`（非 `${VAR:false}` 占位符）。Spring Boot 的 profile 专属文档（`application-prod.yml`）在配置数据解析中优先级高于默认文档（`application.yml`），所以只要激活 `prod` profile，这两个字面量 `false` 就会**无条件覆盖**掉 `application.yml` 里 `${ERD_ALLOW_OPEN_REGISTER:false}` / `${ERD_ALLOW_DEMO_ADMIN:false}` 对同一属性的求值结果——不管容器里 `ERD_ALLOW_OPEN_REGISTER` 设成什么，prod 生效值永远是 `false`；docs 里写的「逃生阀」从 2026-08-03 引入起就没真正生效过
- 影响面：仅 `allow-open-register`（含联邦首次建号门控）与 `allow-demo-admin` 两个开关；`e2e-accounts-enabled` 本就按设计无逃生阀，不受影响
- 改动：`application-prod.yml` 改为 `allow-demo-admin: ${ERD_ALLOW_DEMO_ADMIN:false}` / `allow-open-register: ${ERD_ALLOW_OPEN_REGISTER:false}`，与 `application.yml` 同占位符键，容器设 `ERD_ALLOW_OPEN_REGISTER=true` 后才真正在 prod 生效；`FederateUserService` 拒绝开放注册时补一条安全日志（打印 provider + 生效布尔值，不含密钥），方便运维直接从日志确认生效值而非猜测
- 排查建议（Railway 等看不到 actuator/env 的场景）：改完部署后触发一次 Google 登录，看后端日志有无出现 `federate rejected open register provider=google (erd.security.allow-open-register=...)`；若日志里该值仍是 `false` 但容器 `echo $ERD_ALLOW_OPEN_REGISTER` 是 `true`，先确认 `SPRING_PROFILES_ACTIVE=prod` 已设置且该变量确实注入到了应用进程（而不是仅在调试 shell 里 `export` 的临时值）

验证点：
- `cd backend && mvn -q test -Dtest=ProdSecurityEscapeHatchBindingTest` 绿；该测试直接加载 classpath 下真实的 `application.yml`+`application-prod.yml`，用 `SPRING_PROFILES_ACTIVE=prod` + `ERD_ALLOW_OPEN_REGISTER=true`/`ERD_ALLOW_DEMO_ADMIN=true` 验证生效值为 `true`，且回退验证前置于本次修复的旧配置会导致该测试失败（复现原 bug）
- `mvn -q test -Dtest=FederateControllerTest,FederateAuthServiceTest,UserExtensionServiceImplRegisterGateTest,ProdSecurityEscapeHatchBindingTest -Djacoco.skip=true` 绿

#### 修复：CF Pages demo 分享页「分享不可用」（`Unexpected token '<'`）

- 根因：`pages/share/index.tsx` 用裸 `fetch('/ncnb/share/{token}')`（含 fork）相对路径请求，未走全站统一的 `request`/`buildApiHref` 基址前缀；CF Pages 静态托管对未知路径走 SPA `historyApiFallback` 返回 `index.html`（200 + `text/html`），前端 `res.json()` 解析 `<!DOCTYPE html>` 炸出 `Unexpected token '<'`，落到 `AuthBrandShell` 失效态「分享不可用」
- 验证：`curl https://erdonline-demo.pages.dev/env-config.js` 确认 `API_URL` 本身已正确指向 Railway；`curl https://erdonline-demo.pages.dev/ncnb/share/public-demo` 返回 HTML；同 token 直打 `https://erdonline-production.up.railway.app/ncnb/share/public-demo`（带 Origin）返回正常 JSON——证明后端与 token 种子均无问题，纯前端相对路径 bug，与「federate href 打到 SPA」（本日上一条）同类但路径不同（一是 `<a href>` 导航，一是 `fetch`）
- 改动：分享页两处 `fetch` 套 `buildApiHref`（与 `request.js` 的 `window._env_.API_URL || API_URL` 同源；本地 dev 因 `config.dev.ts` 置空回落相对路径，走既有 proxy）

验证点：
- `cd frontend && npx playwright test tests/e2e/share.spec.ts tests/e2e/share-revoke-keyboard.spec.ts tests/e2e/share-create-failure.spec.ts tests/e2e/share-project-keyboard.spec.ts --project=chromium` 10 例全绿
- CF Pages 已重新部署（GitHub Actions `Frontend demo site` run 30968062209 success，`env-config.js` 时间戳已刷新）；Playwright 实测 `https://erdonline-demo.pages.dev/s/public-demo` 正常渲染「功能鉴权示例」RBAC 关系图（非「分享不可用」）

#### 修复：CF Pages demo 第三方登录按钮 href 打到 SPA 而非 Railway API

- 根因：登录页 `<Button href="/auth/federate/{provider}">` 为相对路径；XHR 走 `API_URL` prefix，浏览器导航不走——静态托管把 `/auth/…` 当 SPA 路由
- 改动：`buildApiHref`（与 `request.js` 同源 `window._env_.API_URL || API_URL`）；空基址保留相对路径（本地 dev 代理）；账号绑定仍经 XHR `GET …/links/{p}/start` 取 IdP 绝对 URL，无 href 问题

验证点：
- `cd frontend && npx tsx src/utils/apiHref.test.ts` 绿
- `yarn test:e2e --project=chromium frontend/tests/e2e/federate-login.spec.ts` mock providers 时 GitHub/Google `href` 为 `/auth/federate/{provider}`

#### 修复：Railway Redeploy 后 Tomcat 起不来（`oidcIdTokenService` 初始化失败）+ 加固畸形 Origin

- 根因排查：日志 `Error creating bean with name 'oidcIdTokenService': Invocation of init method failed → UnsatisfiedDependency → patAuthenticationFilter → Unable to start embedded Tomcat` **不是** `ERD_UI_URL` 双源 CSV 本身的问题——`CrossOriginPolicy`（CORS）与 `OidcConfig.resolveIssuer`（OIDC issuer 取首个合法条目）此前已正确处理逗号分隔（`88d71f2` 已验证）。真根因是 `OidcIdTokenService.@PostConstruct` 经 `OidcRsaKeySupport.load` 在 prod 强制要求 RS256 私钥（`ERD_OIDC_RSA_PRIVATE_KEY`/`_PATH`/`_KEYSTORE_PATH`），缺失即 fail-fast；异常沿 `OAuthApiClientServiceImpl`（构造依赖 `OidcIdTokenService`）→ `patAuthenticationFilter`（依赖 `OAuthApiClientService`）向上抛，表现为「改了 `ERD_UI_URL` 就崩」，实为同一次 Redeploy 顺带重新触发该校验（该 RS256 门禁 `e2036de` 与 CORS CSV 修复 `88d71f2` 同日落地，此前部署未必命中过）
- 加固（防「`ttps://` 掉字母」类畸形 Origin 静默失败）：`CrossOriginPolicy` 新增 `isWellFormedHttpOrigin` / `assertWellFormed`——prod 下 `ERD_UI_URL` 任一逗号条目缺 `http(s)://` 前缀即 fail-fast 并点名具体值；非 prod 仅 warn 日志放行（不阻断本地调试）。`OidcConfig.resolveIssuer` 同步加固：CSV 取**第一个合法**条目做 issuer（不再是裸取首项），全部畸形时 prod fail-fast、非 prod 回落 `localhost:8000`
- 结论：CORS 多源与 OIDC 单源 issuer 的设计（CORS 用全部、issuer 用首个合法值）此前已实现，无需改动；本轮只补齐了「畸形值不再静默通过」的缺口，并把 RS256 私钥缺失的排障路径写进 `docs/deployment.md`

验证点：
- `cd backend && mvn -q -Dtest=CrossOriginPolicyTest,OidcConfigTest,OidcIdTokenServiceTest,CorsPreflightFilterTest test -Djacoco.skip=true` 绿（新增 `OidcConfigTest` 6 例 + `CrossOriginPolicyTest` 新增 6 例畸形 Origin 回归）
- `cd backend && mvn -q test -Djacoco.skip=true`：306 例中仅 1 例 `OracleReverseDialectCommentTest` 失败，已确认为改动前既存、与本轮无关（`git stash` 验证同样失败）
- Railway 实际修复：确认/补回 `ERD_OIDC_RSA_PRIVATE_KEY`（或 `_PATH`），`ERD_UI_URL` 维持 `https://app.erdonline.com,https://erdonline-demo.pages.dev`，Redeploy 后 `actuator/health` 应转 UP

### 2026-08-04

#### 修复：Railway CORS 403（demo → production API）

- 根因：Railway `ERD_UI_URL` 未含 `https://erdonline-demo.pages.dev`（或非浏览器 Origin）；Spring `CorsFilter` 返回 403 `Invalid CORS request`、无 `Access-Control-Allow-Origin`——**非** CSRF/Security 拦截 OPTIONS（Security 已 `permitAll` OPTIONS；无 Origin 预检走业务 404）
- 代码：`CrossOriginPolicy` / `CorsConfig` 已支持逗号分隔多 Origin；新增 `CorsPreflightFilterTest` 回归 prod 双源预检
- 运维：`.env.example` + `docs/deployment.md` 写明推荐值 `https://app.erdonline.com,https://erdonline-demo.pages.dev` 与 `railway variables set …` + Redeploy

验证点：
- `cd backend && mvn -q -Dtest=CorsPreflightFilterTest,CrossOriginPolicyTest test -Djacoco.skip=true` 绿
- 改 Railway 变量后：`curl -sI -X OPTIONS 'https://erdonline-production.up.railway.app/auth/federate/providers' -H 'Origin: https://erdonline-demo.pages.dev' -H 'Access-Control-Request-Method: GET'` → 200 + `access-control-allow-origin`

#### CI：demo 构建空 API_URL fail-fast

- 问题：CF Pages 工作流在 `DEMO_API_URL` 未设或竞态读到空值时仍 `yarn build:prod` 成功，产物 `env-config.js` 的 `API_URL` 为空，浏览器 API 打回 Pages SPA HTML
- 改动：`frontend-demo-site.yml` 构建前校验 Variable `DEMO_API_URL` 非空并 echo 脱敏 host；`env.sh` 在 `ERD_REQUIRE_REMOTE_API=1` 时校验 `API_URL`/`ERD_API_URL`/`DEMO_API_URL` 须为 `http(s)://` URL；本地 `yarn start` / `env.local.sh` 与 Docker 空值 bake-in 不受影响

验证点：
- `ERD_REQUIRE_REMOTE_API=1 API_URL= ./frontend/env.sh` → exit 1
- `ERD_REQUIRE_REMOTE_API=1 API_URL=https://example.com ./frontend/env.sh` → 输出 `remote API host=example.com` 并生成 env-config.js
- `./frontend/env.sh`（无 flag、空 API）仍成功

#### 性能：demo 站诊断——静态资源缺长缓存 + API_URL 构建竞态

- 诊断（`erdonline-demo.pages.dev` 反馈"慢"）：
  1. **[已修复]** `frontend/public/_headers` 只处理 `env-config.js`，带内容哈希的 `umi.*.js/css`、`preload_helper.*.js`、路由 `*.async.js`/`*.chunk.css` 均落 CF Pages 默认 `Cache-Control: public, max-age=0, must-revalidate`——重复访问/路由切换本可直接读浏览器缓存，却每次都发 304 校验往返
  2. **[已修复，运维]** `DEMO_API_URL` 仓库变量更新（11:09:45）与触发部署的 push（11:09:15）几乎同时发生，工作流读到的是更新前的空值——构建日志证实 `API_URL: ""`，导致线上 demo 所有 API 请求打到 Pages 自身域名，被 `_redirects` SPA fallback 重写成 `index.html`（200 但非 JSON），前端表现为请求"卡住"直到超时，而非单纯资源慢；已 `workflow_dispatch` 重新触发部署修正
  3. **[结构性，未动]** 主入口 `umi.*.js` 未拆 vendor/app chunk，落地页与设计器共背同一个 ~1.86MB（brotli ~455KB）JS，其中包含仅设计器用到的 antd 全量 + ReactFlow + socket.io-client；落地页本不需要这些
  4. **[结构性，未动]** `<head>` 内 `html2canvas.min.js`（166KB，仅设计器导出图片用）以阻塞脚本方式随每个页面加载，延迟后续脚本发现
- 改动：`frontend/public/_headers` 为哈希资源加 `immutable, max-age=31536000`；模式刻意避开 `/env-config.js` 与未哈希的 `/js/html2canvas.min.js`（CF Pages 对同一 header 多规则命中会用逗号拼接而非覆盖，需保证图案互斥）

验证点：
- `curl -sI https://erdonline-demo.pages.dev/umi.*.js`（本地 dist 建后取真实文件名）应见 `cache-control: public, max-age=31536000, immutable`；`env-config.js` 仍为 `no-store`
- `curl -s https://erdonline-demo.pages.dev/env-config.js` 应见 `API_URL: "https://erdonline-production.up.railway.app"`（原为空串）
- 结构性两项（vendor 拆包、html2canvas 懒加载）留待下一轮排期，暂记 `docs/roadmap.md` P1

#### 配置：生产前端 API 指向 Railway 公网后端

- 问题：`config.prod.ts` / `frontend/.env` 误把 `API_URL`/`ERD_API_URL`/`SOCKETIO_URL` 设为 UI 域名 `https://app.erdonline.com`，浏览器会把 API 请求打回前端自身
- 改动：统一为 `https://erdonline-production.up.railway.app`（无尾斜杠）；`docs/deployment.md` 示例与 `DEMO_API_URL` 对照表同步；补充 CORS 说明（Railway `ERD_UI_URL` = 前端 Origin，非 API 域名）
- GitHub Actions Variable `DEMO_API_URL` 仍须在仓库 Settings 手动设为同 URL，workflow 才会在 CF Pages 构建时注入

验证点：
- 手工：`grep erdonline-production frontend/config/config.prod.ts frontend/.env docs/deployment.md`
- CF Pages 部署后 Network 确认请求 Host 为 `erdonline-production.up.railway.app`；Railway 须已设 `ERD_UI_URL` 为实际前端 Origin

#### 测试：双层五态 + dirty chip E2E 补盘（Vision #15 · ADR-0022）

- 缺口：`schema-probe.spec.ts` 仅覆盖 UNKNOWN 三路 + mock AHEAD/PERMISSION；缺 SYNCED/BEHIND/DIVERGED/CONNECTION_FAILED；`version-dirty-chip.spec.ts` 缺基线失败未知态；smoke/ux-audit 无 probe 专项（由 focused spec 承担）
- 改动：扩展 `schema-probe.spec.ts`「有 JDBC」用例——逐态 inline mock 覆盖 B 层五态（SYNCED/AHEAD/BEHIND/DIVERGED）+ 未知四路（NOT_PROBED/NO_DATASOURCE 分拆、NO_PERMISSION、CONNECTION_FAILED）+ 延迟 mock 探测 + 版本页 `dual-layer-legend`；A 层 `version-dirty-chip-unknown` 仍登记手工清单（E2E route 与 umi-request 拦截不稳）
- 定位纪律：新断言优先 `data-probe-status` / `data-testid`；中文 copy 仅作 hint 可见性辅证

验证点：
- `yarn playwright test tests/e2e/schema-probe.spec.ts tests/e2e/version-dirty-chip.spec.ts --project=chromium`

#### 体验：B 层探测入口收敛至设计器顶栏（Vision #14 · ADR-0022）

- 问题：探测按钮仅在版本页 toolbar，画布内编辑时看不到实库落差；与顶栏 A 层 dirty chip 分裂
- 改动：`SchemaProbeControl` 迁入 `DesignLayout` 顶栏（`VersionDirtyChip` 旁，`variant="chrome"` icon-only）；版本页 toolbar 移除重复探测控件；`dualLayerTokens` 图例「与库」指向顶栏雷达；分享访客/ACL 逻辑不变
- 红线：仍仅显式探测，无 Pull/Push、无进页自动 probe

验证点：
- `yarn build` 绿
- `yarn playwright test tests/e2e/schema-probe.spec.ts --project=chromium` 3/3 绿

#### 体验：project 409 冲突最小 diff 预览（Vision #13 · ADR-0022）

- 问题：乐观锁 409 仅弹「刷新项目 / 另存为新项目」二选一，用户看不到本地与服务器差在哪，决策缺证据
- 改动：`ProjectSaveConflictModal` 409 时异步拉 `/ncnb/project/info`（失败回退 last known 快照）；`versionStructuralDiff` + 复用 `VersionDiffPanel` 展示「本地工作区 vs 服务器」结构化 diff；保留刷新/另存 CTA 与 `data-testid`；打开项目时 `rememberServerProjectJSON` 缓存 fallback
- `VersionDiffPanel` 新增可选 `summaryHint`（冲突 Modal 用「本地工作区 vs 服务器」）

验证点：
- `npx tsx src/utils/projectSaveConflictPreview.test.ts` 绿
- `yarn build` 绿
- `yarn playwright test tests/e2e/project-save-conflict.spec.ts --project=chromium` 1/1 绿

#### 体验：A/B 层 diff 视觉/文案统一（Vision #12 · ADR-0022）

- 问题：A 层版本 diff（工作区 ↔ 版本）与 B 层实库探测各自一套颜色/措辞——A「一致」用蓝、B「一致」用绿；版本页 toolbar 写「未保存变更」而顶栏 chip 写「未存版本」，用户易混淆「模型内改动」与「模型 vs 库落差」
- 改动：新增 `dualLayerTokens.ts` 统一 parity 动词（一致/领先/落后/分叉/未知）与 Tag 色（绿/蓝/橙/红/灰）；`versionDirtyStatus` / `schemaProbeCopy` 改从 token 派生；A 层 clean→「版本一致」绿、dirty→「未存版本」蓝（领先语义）；版本页 `VersionLayerStatusTag` 与顶栏 chip 同源；`DualLayerLegend` 图例区分顶栏三信号（落盘/未存版本/与库）；`VersionDiffPanel` 摘要 Tag 共用 `CHANGE_OPT`
- 顶栏 SaveStatus（落盘）语义不变；B 层五态文案不变（实库一致/模型领先…）

验证点：
- `npx tsx src/utils/dualLayerTokens.test.ts` + `versionDirtyStatus.test.ts` + `schemaProbeCopy.test.ts` 全绿
- `yarn build` 绿
- `yarn playwright test tests/e2e/version-baseline.spec.ts tests/e2e/schema-probe.spec.ts tests/e2e/version-dirty-chip.spec.ts --project=chromium`：6/7 绿（profile 默认字段旅程 `openRelationFromEmpty` 树节点 flake，与本次文案无关）

#### 运维：Vision 5m 循环改文件落盘，根治 stdout 管道卡死

- 根因复核（承接 `e5842d5`）：旧版本把整段 tick payload（含 prompt 全文，数 KB）打到 stdout，靠某个 Cursor Shell 工具持续「读」这条管道才不阻塞；聊天结束后没人再读，OS 管道缓冲区几轮内写满，`emit()` 内 `echo` 卡在 `write()` —— 进程存活（`ps` 可见）但 tick 名存实亡，「活着但卡死」
- 已评估 Cursor Automations（cron 触发）替代方案：**不采用**——(1) 当前会话无 `open_automation`/`open_resource` 编辑器句柄，无法从对话内直接创建；(2) 即使能创建，云端 cron 每 tick 都是全新沙箱，需重建 Colima/`docker-compose`/`dev-ensure.sh` 才能验证，与本仓「前后端进程常驻、永不重启」的开发回路速度纪律冲突，且验证不到本机 9502/8000 上真实跑着的实例，只适合纯代码/文档切片
- 改动：`scripts/agent-loop-vision.sh` 改为 tick 主体直接 append 写文件（`TICK_FILE`，默认 `/tmp/erd-vision-tick.log`；超过 `AGENT_LOOP_VISION_TICK_MAX_LINES`＝500 行自动裁剪保留最近 tick），stdout 只留一行定长心跳（不含 prompt 正文），常年不可能写满管道；改用 tmux 会话 `erd-vision` 常驻（对齐 `dev-entrypoints.mdc` 后端 `erd-be` 的持久化模式），不再依赖任何 Cursor Shell/聊天会话保持连接；`docs/development.md`「5 分钟 Vision 自迭代」节 + `scripts/agent-loop-vision.prompt.md` 头部补齐根因、复活命令与边界说明（诚实标注：文件落盘只解决「进程会不会卡死」，不解决「谁来读文件并真正开工」，纯无人值守云端唤起仍需用户自行在 Agents Window 用 `automate` 技能建 Automation）
- 旧进程状态：本轮检查时旧 `agent-loop-vision.sh` 进程已不存在（`ps aux` 无匹配），无需额外 kill；直接以新版本重新常驻

验证点：
- 本地 `AGENT_LOOP_VISION_INTERVAL=1 AGENT_LOOP_VISION_TICK_MAX_LINES=3` 跑 5s 冒烟：4 次 tick 全部写入文件且裁剪后仅保留 3 行，stdout 每行 <100 字节（验证不阻塞、裁剪生效）
- `tmux new-session -d -s erd-vision '.../agent-loop-vision.sh'` 后 `tmux capture-pane -t erd-vision -p` 看到启动横幅 `tick_file=/tmp/erd-vision-tick.log`；`tmux has-session -t erd-vision` 为真
- 5 分钟后应可见 `tail -n 1 /tmp/erd-vision-tick.log` 产出含最新 `agent-loop-vision.prompt.md`（含续跑队列 #12–#16）内容的 JSON 行

#### 体验：/demo 引流页视觉升级（品牌氛围 + 工具条合并）

- 问题：`/demo`（→ `/s/public-demo` 只读分享，落地页「在线试用」主 CTA 落点）作为引流页，chrome/meta 区观感偏行政化——hint 与切图 Segmented 分两行悬浮、页面纯灰平面无品牌氛围、画布贴底无装裱感，与「Figma-for-DB 惊艳时刻」定位不符
- 改动（`frontend/src/pages/share/index.tsx` + `index.less`，未碰 `ShareRelationCanvas` 画布内部 token，ADR-0016 像素基线保持不变）：
  - meta 区合并为单行工具条（hint 左 + 模块/关系图切换群组右），省一行还给画布，`metaH` 42px（原 ~54–58px，仍 ≤60 预算）
  - 页面外壳新增品牌色 + success 色柔光渐变（`--erd-brand-a12` / `--erd-frame-fill`），替换纯 `--erd-surface-sunk` 平面；顶栏底部新增品牌渐变收边线（绝对定位，不占 64px 高度）
  - 「只读」Tag 与「匿名只读」首字改为品牌红强调；切图 Segmented 选中态品牌红高亮；画布容器加装裱阴影（浮于氛围底色之上）；复制 CTA 加图标
- 影响范围仅 `.share-page__*` 局部选择器（`.share-page .erd-chrome-header` 特异性覆盖），不影响 Home/Group/Design 三壳共用 `erd-chrome.less`

验证点：
- `cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --workers=1`（1 passed，全部像素基线断言含 chrome 64px / metaGap≤2 / canvas≥55%vh 均通过且余量更大）
- `cd frontend && npx playwright test tests/e2e/share.spec.ts --project=chromium --workers=1`（6 passed，多模块/多图切换回归无损）
- 手工：`http://localhost:8000/demo` 截图前后对比，画布占比从 ~78% 提升至 ~84% vh

#### 运维：Vision 5m 循环卡死重启 + 双层一致性续跑队列（#12–#16）

- 根因：`agent-loop-vision.sh` 后台进程未死，但其 stdout 管道的读端（此前一轮对话的 `AwaitShell` 监听）已断开且无人重新接管，`echo AGENT_LOOP_TICK_VISION` 写满管道后阻塞在 write()；进程 31+ 小时 CPU 时间未增长（卡在同一轮 tick，仅重复吐出旧版「UI/UX 优化」prompt，未反映已合并的双层一致性内容），tick 名存实亡
- 改动：`pkill -f agent-loop-vision.sh` 后重新前台常驻拉起；`scripts/agent-loop-vision.prompt.md` 双层一致性 MVP #1–#11 闭环后补齐续跑队列 #12–#16（diff 同语言 → 冲突可视化 → 探测入口收敛 → E2E 补盘 → Pull/Push 明确标「需用户开闸」不得自动开工）；`docs/roadmap.md` 指针同步指向新队列

验证点：
- `ps aux \| grep agent-loop-vision.sh` 确认旧 pid 已终止、新 pid 存活
- `AwaitShell` 重新监听新进程，310s 内命中含「双层一致性」新 prompt 内容的 tick（证明 emit() 已按最新 `agent-loop-vision.prompt.md` 出活，非卡死重复旧内容）

#### 修复：打开项目 hydrate 竞态致 E2E create-table 旅程失败

- 根因：`fetch` 先 `set(project)` 再 `fixProject` 二次写 store → subscribe 触发 debounced autosave，与 `addModule`/`addEntity` 的 `persistProjectNow` 并发 CAS 同一 `updateTime` → 409 冲突或落库失败；另 **`patchProjectRevision` 对 immer 冻结 draft 整对象赋值**（`state.project = next`）第二次 persist 抛 `Cannot assign to read only property 'project'`，HTTP 200 仍显示「保存失败」且表不上图
- 改动：`hydrateFetchedProject` 单次 hydrate；`patchProjectRevision` 改为 `setState({ project: next })`；debounce/autosave 分轨 `debounceSeq`/`autosaveSeq` + echo suppress；`addModule`/`addEntity` persist 后不再二次写 JSON；`openRelationFromEmpty` 等模块落盘

验证点：
- `cd frontend && npx playwright test --project=chromium tests/e2e/version-dirty-chip.spec.ts tests/e2e/project-save-conflict.spec.ts tests/e2e/relation.spec.ts --grep "工具栏新建表|顶栏版本 dirty chip|409" --retries=0`（5 passed 并行）
- 回归：`project-local-draft.spec.ts` 恢复后 `DRAFT_FIELD` 在「已隐藏」区，断言待另开（非 create-table 主因）

#### 修复：beforeunload 勿用 stale store 覆盖落库失败草稿

- 根因：`persistProjectNow` 失败时已 `writeProjectDraft(next)`，但 store 未 apply；`page.goto`/离开触发 `useProjectDraftGuard` 用无新字段的 store 覆写 localStorage 草稿 → 恢复后模型缺字段
- 改动：`beforeunload` 若现有 draft 比当前 store 更新则跳过写入；E2E 用 `field-hidden-toggle` +「显示」兜底

验证点：
- `cd frontend && npx playwright test --project=chromium tests/e2e/project-local-draft.spec.ts`（1 passed）

#### i18n 奠基（ADR-0023）

- `getAntdLocale()` / `getAppLocale()`：`window._env_.LOCALE` 或 `ERD_LOCALE` 构建变量；未设或未知 → **zh-CN**；Theme `ConfigProvider` 不再硬编码 `zhCN`
- 删死 `frontend/src/locales/`（63 文件 Pro 骨架，零 `useIntl` 引用）；移除 `i18n-remove` script
- `env.local.sh` / `env.sh` / `docker-entrypoint.sh` 注入可选 `LOCALE`
- `e2e-locators.mdc` 反脆弱段更新为「奠基后」

验证点：
- `cd frontend && npx tsx src/utils/getAntdLocale.test.ts`
- `cd frontend && yarn build`
- `cd frontend && npx playwright test --project=chromium tests/e2e/smoke.spec.ts --grep "登录 → 新建项目"`

#### B 层：分享访客隐藏实库探测（ADR-0022 切片 11）

- 前端：`isShareGuestContext()` + `canErdConnectorSchemaProbe`（同逆向解析权）；版本页 `Access` 包裹 `SchemaProbeControl`；分享页无 B 层控件；`save.schemaProbe` 分享路由拒绝调用
- 后端：`SchemaProbeAccessGuard`（项目成员 + 团队角色须 `erd_connector_dbReverseParse`）；`applyProbe` 强制 `dataSourceId`；403 响应带 `PROBE_ACL_DENIED` reason

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn test -Dtest=SchemaProbeAccessGuardTest,ConnectorCredentialResolverTest -Djacoco.skip=true`
- `cd frontend && npx playwright test --project=chromium tests/e2e/share.spec.ts --grep "设计器分享后匿名打开可见只读关系图"`

#### B 层：五态 + 未知四路文案（ADR-0022 切片 10）

- 后端 `SchemaFingerprintDiff`：结构 IR diff 将指纹差异细分为 `synced` / `ahead`（模型领先）/ `behind`（实库领先）/ `diverged`（双向分叉）；连接失败区分 `PROBE_CONNECTION_FAILED` vs `PROBE_NO_PERMISSION`
- 前端 `SchemaProbeControl`：进页默认 `PROBE_NOT_PROBED`（不伪装一致）；探测中 Tag「探测中…」+ Button loading；失败显式 UNKNOWN + 四路可行动 copy（`schema-probe-unknown-hint`）；`data-probe-status` / `data-probe-reason` 供 E2E
- `DataSourceSelect` 补 `data-testid="datasource-select"`

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn test -Dtest=SchemaFingerprintTest -Djacoco.skip=true`
- `cd frontend && npx tsx src/utils/schemaProbeCopy.test.ts`
- `cd frontend && npx playwright test --project=chromium tests/e2e/schema-probe.spec.ts`
- `./backend/dev-ensure.sh --restart`

#### B 层：版本号比较诚实化（ADR-0022 切片 9）

- `stringVersion.ts`：`compareStringVersion` 仅接受数字段 semver（可选 `v` 前缀）；空段 / 非数字 / null → 返回 `null`（不可比），不再因 `NaN` 误判「已推送/一致」
- 版本行 tag「书签未知」（`version-push-bookmark-unknown-tag`）；Compare 详情「书签未知」文案；跨版本同步/保存/重命名在不可比时阻断或保守处理
- 单测：`1.10` vs `1.9`、empty、null、`v1.0`、非法段

验证点：
- `cd frontend && npx tsx src/utils/stringVersion.test.ts`
- `cd frontend && yarn build`

#### B 层：实库 schema 指纹探测（ADR-0022 切片 8）

- 后端 `POST /ncnb/connector/schema/probe`：复用逆向 dialect  introspect 活库 → 规范化 IR（表/列/PK/索引/FK，忽略 `db_version` 等基建表）→ SHA-256 指纹；与请求体 `projectJSON` 对比得 `synced` / `different` / `unknown`（含 `reason`）
- 版本页工具栏「探测实库」按钮（`data-testid="schema-probe-btn"`）+ 结果 chip（`schema-probe-status`）；**不在**进页时自动探库
- `db_version` 书签 UX 降级：版本行 tag「已推送/未推送」；tooltip 明示非实库真相；获取书签 toast 改「版本书签」

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn test -Dtest=SchemaFingerprintTest -Djacoco.skip=true`
- `./backend/dev-ensure.sh --restart` 后 endpoint 可达（需登录 + JDBC 数据源）

#### 文档：i18n 审查结论锁定（ADR-0023；B 层后奠基；E2E 反脆弱）

- roadmap「i18n 奠基（B 层后）」+ Vision loop 约束 + `e2e-locators` 反脆弱小节；**未**启用 umi locale / 未改产品代码

验证点：文档与规则 diff 审阅

#### 可信保存：诚实持久化 — 本地草稿 + beforeunload（ADR-0022 切片 7）

- 落库失败（网络/非 200/非 409 冲突）：`projectLocalDraft` 将 working `projectJSON` + `updateTime` 写入 localStorage（`erd:project-draft:{projectId}`）；成功落库 / 刷新项目 / 丢弃草稿时清除
- `beforeunload`：脏态且未落库时同步写草稿 + 浏览器原生离开确认
- 再次进入设计器：`fetch` 后若草稿与服务器模型不同 → Modal「恢复草稿 / 丢弃草稿」
- `SaveStatus` 失败态 title/aria 对齐「改动已存本地」；不假装「已落盘」

验证点：
- `cd frontend && npx tsx src/utils/projectLocalDraft.test.ts`
- `cd frontend && npx playwright test --project=chromium tests/e2e/project-local-draft.spec.ts`
- 回归：`npx playwright test --project=chromium tests/e2e/save-failure.spec.ts`

#### 可信保存：db_change 版本号唯一约束（ADR-0022 切片 6）

- 根因：并发存版时前端页内唯一校验不足，两窗口可同时写入相同 `version` → 重复历史版本
- Flyway V14：存量 `(project_id, db_key, version)` 重复保留 id 最小行；幂等加 `uk_db_change_project_dbkey_version`（init 已有 `uni_versin_projectid_dbkey` 则跳过）
- 后端：`saveVersion` 捕获唯一索引冲突 → `409001 VERSION_SAVE_DUPLICATE`（非 500 栈）
- 前端：409001 → Modal「刷新版本列表」；request 层跳过重复 toast
- 验证脚本：`scripts/verify-version-save-duplicate.sh`

验证点：
- `cd backend && mvn -Dtest=DbChangeServiceImplDuplicateTest -Djacoco.skip=true test`
- `scripts/verify-version-save-duplicate.sh`（首存 200；同 version 再存 → 409001）
- `cd frontend && npx playwright test --project=chromium tests/e2e/version-save-duplicate.spec.ts`
- `./backend/dev-ensure.sh --restart` 后 Flyway V14 绿

#### 可信保存：project 乐观锁（ADR-0022 切片 5）

- 根因：`/ncnb/project/save` 无条件 UPDATE → 多标签/协作者并发写 projectJSON 时后写覆盖先写，且无冲突反馈
- 后端：`ProjectDto.updateTime` + `UPDATE … WHERE id=? AND update_time=?`；不匹配 → `409 PROJECT_SAVE_CONFLICT`；成功返回 `{ updateTime }` 供客户端持有
- 前端：load/save 成功回写 `updateTime`；409 → Modal（刷新项目 / 另存为新项目）+ 顶栏「保存冲突」态；`persistProjectNow` / autosave / 离开补枪同路径；409 跳过 request 重复 toast
- 验证脚本：`scripts/verify-project-save-conflict.sh`

验证点：
- `cd backend && mvn -Dtest=ProjectSaveOptimisticLockTest -Djacoco.skip=true test`
- `scripts/verify-project-save-conflict.sh`（匹配 save→200+新 updateTime；陈旧 updateTime→409）
- `cd frontend && npx playwright test --project=chromium tests/e2e/project-save-conflict.spec.ts`
- `./backend/dev-ensure.sh --restart` 后 curl 脚本绿

#### 可信保存：A 层全量 structural diff（ADR-0022 切片 3）

- 根因：`checkVersionData` 仅比 modules 内表/字段/索引，改关联、关系图布局、默认字段、数据类型域时 dirty chip 仍显示「与版本一致」
- 改动：新增 `frontend/src/utils/versionStructuralDiff.ts`（associations / diagrams / graphCanvas / profile 建模键 / dataTypeDomains）；`useVersionStore.checkVersionData` 与 `dbversionutils` 统一走该模块；`baselineProjectJSON` 与存版快照 `snapshotProjectJSONForVersion` 含 profile + domains；空 diff 存版 `message.warning` 且不阻塞（北极星口径排除空 changes）
- `VersionDiffPanel` / `formatVersionDiffMarkdown` 增 association / diagram / profile / datatype / module 类型标签

验证点：
- `cd frontend && npx tsx src/utils/versionStructuralDiff.test.ts`
- `cd frontend && yarn test:unit:version-baseline`（含 baseline 快照扩展）
- `cd frontend && npx playwright test --project=chromium tests/e2e/version-dirty-chip.spec.ts`（profile 改默认字段 + 画布连线 → 未存版本）

#### 可信保存：顶栏 A 层 dirty chip（ADR-0022 切片 2）

- 设计器顶栏新增 `VersionDirtyChip`：四态——与版本一致 / 未存版本（+N −M ~U 摘要）/ 基线未知（点击重试）/ 尚无版本（引导存版）；点击脏态或无基线 → 版本页，未知 → 重拉基线
- `SaveStatus` 文案「已保存」→「已落盘」，与 A 层版本 dirty 语义分离（落盘=autosave，chip=相对最新版本）
- `recalculateChanges` 订阅加 300ms 防抖；`fetchVersionBaseline` / 存版成功后刷新基线并重算 diff
- 纯函数 `versionDirtyStatus.ts` 供 chip 与版本页共用判态逻辑

验证点：
- `cd frontend && yarn test:unit:version-baseline`（含 `versionDirtyStatus.test.ts`）
- `cd frontend && npx playwright test --project=chromium tests/e2e/version-dirty-chip.spec.ts`（尚无版本→+摘要→存版一致→再改未存版本）
- 回归：`npx playwright test --project=chromium tests/e2e/version-baseline.spec.ts tests/e2e/save-failure.spec.ts`

#### 可信保存：A 层基线改为独立查询最新版本（ADR-0022 切片 1）

- 根因：dirty 判定的基线取自**分页**版本列表的 `versions[0]`——翻页/换排序即漂移；且列表按 `version` 字符串倒序，`9.0.0` 会排在 `10.0.0` 之前，"最新版本"本身就可能是错的；`versions` 为空时 `recalculateChanges` 直接跳过，首次建模被显示为「已与最新版本一致」（静默无差异）
- 改动：新增 `frontend/src/utils/versionBaseline.ts`（纯函数：dbKey 解析、`size:1` + `create_time` 倒序查询体、无基线 → 空模型 diff）；`useVersionStore` 增 `versionBaseline` / `baselineLoaded` 与 `fetchVersionBaseline`，`calcChanges` / `recalculateChanges` 一律比基线；打开项目（`useProjectStore.fetch`）即独立拉一次基线，不再依赖版本页
- 连带修正同类污染：`saveNewVersion` 的「新版本必须更大」校验与 `baseVersion` 首版判定、`AddVersion` 建议版本号改用基线（列表第 N 页不再顶高/拦截保存）；删版本后 `changes` 不再被塞进 Promise（原来会让 `changes.length` 为 undefined → 假「已一致」）
- 无基线态在版本页显式呈现：`version-no-baseline`（尚无版本基线，建议先保存第一个版本）与 `version-baseline-unknown`（基线查询失败 → 未知，不伪装一致）
- 顺带清死代码：写而不读的 `currentChanges`、未使用的 `PAGE` / `fetchDatabaseConfigs` 导入；`recalculateChanges` 不再覆盖版本详情弹窗的 `messages`

验证点：
- `cd frontend && yarn test:unit:version-baseline`（查询体 size/排序、dbKey 优先级、无基线=全部未提交）
- `cd frontend && npx playwright test --project=chromium tests/e2e/version-baseline.spec.ts`（无版本→无基线提示；存版本→一致；把列表首条伪造成空模型的 `9.9.9` 后仍判一致且建议版本号仍为 `1.0.1`）
- 排序真相 curl（同一项目先存 `9.0.0` 再存 `10.0.0`）：`orders=[createTime desc]` → `10.0.0`；旧的 `orders=[version desc]` → `9.0.0`；`current:2,size:1` → `9.0.0`（分页污染源）
- 回归：`npx playwright test --project=chromium tests/e2e/version.spec.ts tests/e2e/version-save-failure.spec.ts tests/e2e/compare.spec.ts tests/e2e/version-revert-failure.spec.ts` 15 passed

#### 测试：`save-failure.spec.ts` 按诚实持久化重写（消除 main 上的红）

- 根因：用例沿用旧的乐观落行断言（`addFieldInline` 要求 Enter 后字段立即出现），而画布内联编辑早已改为「仅 `project/save` code===200 才写 store / 关编辑态」；阻断保存时字段本就不该落行，用例因此必红
- 改动：改断言为落库失败时草稿留在编辑行 + 模型无该字段 + toast/顶栏重试可见；放开保存后在编辑行再按 Enter 才落行并回到「已保存」

验证点：`cd frontend && npx playwright test --project=chromium tests/e2e/save-failure.spec.ts` 2 passed

#### 流程：Vision 循环 & 全局模型路由改为「think 强模型 / exec 便宜模型」

- 落实用户规则「思考用强模型，执行用便宜模型」：`.cursor/rules/model-routing.mdc` 路由表与可用 slug 全量更新（think 默认 `claude-sonnet-5-thinking-high`，exec 默认 `composer-2.5-fast`）；`scripts/agent-loop-vision.prompt.md` 新增「模型路由」节；`scripts/agent-loop-vision.sh` 新增 `VISION_THINK_MODEL`/`VISION_EXEC_MODEL` 环境变量并拼入 emit 提示词；`docs/development.md` 同步一段说明
- 未重启常驻的 `agent-loop-vision.sh` 心跳（脚本已在 tmux/后台运行中），改动对下一次进程启动生效，不打断本轮循环

验证点：`bash -n scripts/agent-loop-vision.sh` 通过；`scripts/agent-loop-vision.prompt.md` / `.cursor/rules/model-routing.mdc` 人工通读确认 think/exec slug 与用户给定清单一致

#### 可信保存：离开设计器不再盲存（ADR-0022 切片）

- 选题：Vision 5m 循环主题重定向为「双层一致性与可信保存」（[ADR-0022](docs/adr/0022-dual-layer-consistency.md)）；队列首刀取并发底座里最快的一刀
- 根因：`closeSocket` 在卸载时无条件 `Save.saveProject(project)` 且丢弃结果 → 干净态也写库（可覆盖他人变更）、失败无声
- 改动：仅当 `needSave && !saved`（确有未落库改动/上次落库失败）才补一枪，走 `persistProjectNow` → 失败有 toast + 顶栏失败态；干净态零请求
- 循环重定向：`scripts/agent-loop-vision.prompt.md` 换主题 + ROI 切片队列（A 工作区 → 并发/持久化底座 → B 实库五态）；`scripts/agent-loop-vision.sh` 提示词同步；roadmap 新增「双层一致性与可信保存 🚧」
- 顺带发现（未修，下一刀候选）：`/ncnb/project/save` 失败时画布内联加字段停在编辑态不落行 → `save-failure.spec.ts` 在 main 上已红（与本改动无关，已 stash 复验）

验证点：
- `cd frontend && yarn playwright test --project=chromium tests/e2e/leave-designer-save.spec.ts`（干净态离开零 `project/save` 请求；失败态离开补一枪）
- `cd frontend && npx eslint src/store/project/useProjectStore.tsx tests/e2e/leave-designer-save.spec.ts`

#### 体验：登录页第三方未配置时一行提示

- 根因：未设 `GITHUB_*` / `GOOGLE_*` / `WECHAT_*` 时 `/auth/federate/providers` 均为 false，登录页按设计隐藏按钮（非接线故障）；本机无已配未加载的 env
- 改动：全部禁用时显示静默一行「第三方登录未配置」（`login-federate-unconfigured`）；不伪造启用按钮
- 启用：在跑后端的 shell 导出对应三项（见 `.env.example`）后 `./backend/dev-ensure.sh --restart`；`curl /auth/federate/providers` 对应 key 为 true

验证点：
- `curl -sS http://127.0.0.1:9502/auth/federate/providers` → `github/google/wechat` 均为 false
- `cd frontend && yarn playwright test --project=chromium tests/e2e/federate-login.spec.ts`

#### 开放：ADR-0021 — GitHub OAuth + 三方登录闭环加固

- 选题：联邦扩到 GitHub；登录 → 会话 home → 登出形成闭环；设置页三方均可绑定/解绑
- GitHub：OAuth App（`read:user user:email`）；`GITHUB_CLIENT_ID/SECRET/REDIRECT_URI`；subject=`id`；已验证邮箱可按邮箱绑定；缺 env → provider 关闭
- 登录页：`/auth/federate/providers` 为 true 时显示 GitHub/Google/微信按钮；首登按 `allow-open-register` 建号或引导密码登录后绑定
- 落地 `/login/federate` 换票；Header 退出清 JWT（与账密同源）
- ADR-0021 / 部署 / 安全模型文档同步

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Dtest=FederateAuthServiceTest,DeadSecurityConfigContractTest test -Djacoco.skip=true`
- `./backend/dev-ensure.sh --restart`；`curl -sS http://127.0.0.1:9502/auth/federate/providers` → `github/google/wechat` 均为 false（无凭证时）；`curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:9502/auth/federate/github` → 404
- `cd frontend && yarn playwright test --project=chromium tests/e2e/federate-login.spec.ts`

#### 开放：ADR-0021 — 第三方登录 IdP 联邦（Google + 微信扫码）

- 选题：OIDC RS256 后接会话面联邦；不复活 password-grant / `/login/success` / 旧微信绑定页
- Google：Authorization Code + OIDC（`openid email profile`）；`GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI`；验 `email_verified`；邮箱匹配绑定或（开注册时）建号
- 微信：开放平台网站应用扫码（`snsapi_login`）；`WECHAT_APP_ID/SECRET/REDIRECT_URI`；subject=`unionid`∥`openid`
- 会话：复用 `JwtTokenService`；回调 Redis 短票 → `/login/federate` → `POST /auth/federate/session`（JWT 不进 URL）
- 表：Flyway `V13` `user_identity_link`；账号设置「安全」绑定/解绑；登录页条件按钮（antd + aria）
- 缺 env → provider 关闭、启动不崩；删死键 `martin.social.enabled`
- ADR-0021；ADR-0013「不做联邦」条目专项解封

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Dtest=FederateAuthServiceTest,DeadSecurityConfigContractTest test -Djacoco.skip=true`
- `./backend/dev-ensure.sh --restart`；`curl -sS http://127.0.0.1:9502/auth/federate/providers` → `google/wechat` 均为 false（无凭证时）；`curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:9502/auth/federate/google` → 404
- Flyway 含 `V13`；`POST /auth/login` 账密仍 200

#### 开放：ADR-0013 — OIDC RS256 + JWKS（废 HMAC）

- 选题：nonce/at_hash 后，公开 RP 需标准 JWKS 验签；硬切 RS256（不保留 HS256 fallback）
- 密钥：`ERD_OIDC_RSA_PRIVATE_KEY`（PEM）→ `ERD_OIDC_RSA_PRIVATE_KEY_PATH` → PKCS12（`ERD_OIDC_RSA_KEYSTORE_*`）；prod 缺则 fail-fast；非 prod 自动生成 `~/.erdonline/oidc-rsa-private.pem`（仓外，gitignore `.secrets/`）
- `GET /.well-known/jwks.json` 发布 RSA 公钥（`kid`=thumbprint 或 `ERD_OIDC_RSA_KID`）；discovery `id_token_signing_alg_values_supported=["RS256"]`
- `id_token` 以 RS256 签发（header 含 `kid`）；`at_hash` 仍 SHA-256 左半（与 RS256 对齐）
- 已废：`ERD_OIDC_HMAC` / HS256 空 JWKS
- 未做：第三方 IdP 联邦

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Dtest=OidcIdTokenServiceTest,OAuthRefreshTokenServiceTest test -Djacoco.skip=true`
- `./backend/dev-ensure.sh --restart` 后 curl：`/.well-known/jwks.json` 含 `kty=RSA`+`kid`；mint 的 `id_token` alg=RS256；用 JWKS 公钥验签通过

#### 开放：ADR-0013 — OIDC nonce + at_hash

- 选题：薄 MVP 后 RP 需防重放 / 绑定 access_token；本刀不引入 RSA
- `GET/POST /oauth/authorize` 可选 `nonce`（≤255）→ 绑定 `oauth_authorization_code.nonce`（Flyway `V12`）→ `authorization_code` 换票 `id_token` 回显
- `id_token.at_hash`：按同响应 access_token 计算（OIDC Core：SHA-256 左半 + base64url）；auth code 与 refresh 均带
- **refresh** 续期 `id_token`：**不带 nonce**（OIDC Core §12.2）；同意页透传 query `nonce`
- 未做：RSA·真 JWKS / 第三方 IdP 联邦

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Dtest=OidcIdTokenServiceTest,OAuthRefreshTokenServiceTest test -Djacoco.skip=true`
- `./backend/dev-ensure.sh --restart` 后 curl：authorize+nonce → code 换票 `id_token` 含 nonce+at_hash；refresh 换票 `id_token` 有 at_hash、无 nonce

#### 开放：ADR-0013 — OIDC 薄 MVP（discovery / id_token HS256 / userinfo）

- 选题：refresh 已交付；OIDC 解耦切片（不引入 RSA 密钥机；无既有非对称密钥）
- `GET /.well-known/openid-configuration`：issuer=`ERD_OIDC_ISSUER` 或回落 `ERD_UI_URL`（`martin.ui.url`）
- `GET /.well-known/jwks.json`：空 keys（HS256 共享密钥 **永不** 进 JWKS）；`ERD_OIDC_HMAC` prod fail-fast（对齐 JWT_SECRET）
- `openid` 入 `PatScopes`；auth code / refresh 换票且授予 openid → 响应 `id_token`；`client_credentials` **不**发
- `GET /oauth/userinfo`（兼 `/auth/oauth/userinfo`）：Bearer `erd_oat_` + openid；拒 PAT / 会话 JWT；独立 SecurityFilterChain（Order 0）避免 Resource Server 把 OAT 当 JWT
- nginx / umi proxy：`/.well-known/`；OAuth UI scope 可选 openid
- ~~未做：nonce / at_hash~~ → 见上节；仍未做 RSA·JWKS / IdP 联邦

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Dtest=OidcIdTokenServiceTest,PatScopesTest,OAuthRefreshTokenServiceTest,DeadSecurityConfigContractTest test -Djacoco.skip=true`
- `./backend/dev-ensure.sh --restart` 后 curl：discovery issuer；含 openid 的 auth code 换票有 `id_token`（alg HS256）；`/oauth/userinfo` 200；无 openid → 403 `insufficient_scope`；`client_credentials` 无 `id_token`

#### 开放：ADR-0013 — OAuth refresh_token（轮换 + 吊销）

- 选题：MVP 同意页后浏览器客户端需续期；优先 refresh，OIDC 后置
- Flyway `V11`：表 `oauth_refresh_token`（仅 SHA-256）；`oauth_access_token.family_id`
- 仅 `authorization_code` 换票签发 `erd_ort_`（`client_credentials` 不发）；TTL `ERD_PUBLIC_API_OAUTH_REFRESH_TTL`（默认 30 天）
- `POST /oauth/token` `grant_type=refresh_token`：**轮换**（旧票吊销 + 新 access/refresh 同 family）；复用已吊销 refresh → 整族 OAT/ORT 吊销
- `POST /oauth/revoke`（RFC 7009 风格）+ 吊销 client 一并失效 refresh；ignore-urls 同步
- ~~未做：OIDC discovery / id_token / userinfo（下一切片）~~ → 见上节 OIDC 薄 MVP

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Dtest=OAuthClientCodecTest,OAuthRefreshTokenServiceTest,DeadSecurityConfigContractTest test -Djacoco.skip=true`
- `./backend/dev-ensure.sh --restart` 后 curl：auth code → 响应含 `refresh_token`；refresh 轮换 → 新 OAT 调 `/api/v1/me` 200；旧 ORT 再刷 → `invalid_grant`；revoke → 再刷失败；`client_credentials` 响应无 refresh

#### 开放：ADR-0013 — OAuth 同意页（Allow/Deny）

- 选题：切片 B 薄同意「已登录即签」；MVP 收口需显式同意
- 后端：`GET /oauth/authorize` → 同意预览 JSON（clientName / scopes / redirectHost；不签发 code）；`POST decision=allow|deny` — 仅 allow 签发 `erd_ac_`；deny → `error=access_denied`；`Accept: application/json` → `{redirect_to}`
- 前端：`/oauth/authorize` AuthBrandShell；登录深链带回 query；键盘/aria
- ADR-0013 / roadmap Openness → ✅ MVP
- 验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Dtest=OAuthClientCodecTest test -Djacoco.skip=true`
- `./backend/dev-ensure.sh --restart` 后 curl：GET 预览无 code → POST allow → Location `erd_ac_`；POST deny → `access_denied`
- `cd frontend && yarn playwright test tests/e2e/oauth-consent.spec.ts --project=chromium`

#### 开放：ADR-0013 — PAT 管理 UI

- 选题：切片 1 铸造/列表/吊销 API 已就绪；产品内缺可见闭环（明文一次揭示）
- `/account/settings?selectKey=personalAccessTokens`：列表 / 铸造（scopes + 可选过期）/ 明文一次揭示告警 / 吊销确认
- 密度 ADR-0016（22–28 chrome）；键盘/aria；E2E 禁 `.ant-*`
- 未做：~~同意页打磨~~（已交付，见上节）

验证点：
- `cd frontend && yarn playwright test tests/e2e/personal-access-tokens.spec.ts --project=chromium`
- 页签切换覆盖：`account-settings.spec.ts`「security / identification」含访问令牌

#### 开放：ADR-0013 — OAuth client 管理 UI

- 选题：API-first 注册/列表/吊销已就绪；产品内缺可见闭环（secret 一次揭示）
- `/account/settings?selectKey=oauthClients`：列表 / 注册（confidential|public + scopes + redirect）/ 复制 `client_id` / 创建后 secret 一次揭示告警 / 吊销确认
- 密度 ADR-0016（22–28 chrome）；键盘/aria；E2E 禁 `.ant-*`
- 未做：~~同意页打磨~~；~~PAT 管理 UI~~（已交付）

验证点：
- `cd frontend && yarn playwright test tests/e2e/oauth-clients.spec.ts --project=chromium`
- 页签切换覆盖：`account-settings.spec.ts`「security / identification」含 OAuth 客户端

#### 开放：ADR-0013 — OAuth 切片 B（Authorization Code + PKCE S256）
- Flyway `V10`：`oauth_api_client.client_type` / `redirect_uris`；表 `oauth_authorization_code`（仅 SHA-256）
- `GET|POST /oauth/authorize`（会话 JWT）：`response_type=code` + `state` + PKCE S256；同意页后 POST allow → 302 `erd_ac_`（见上节「同意页」）
- `POST /oauth/token` `grant_type=authorization_code` + `code_verifier`；public 无 secret / confidential 须 secret
- 硬化：redirect 精确匹配、未注册不 302、code 单次+短 TTL（`ERD_PUBLIC_API_OAUTH_CODE_TTL`）、常量时间 hash 比较、public 禁 `client_credentials`
- 验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Dtest=OAuthClientCodecTest,DeadSecurityConfigContractTest test -Djacoco.skip=true`
- `./backend/dev-ensure.sh --restart` 后 curl：注册 public → POST allow → token → `GET /api/v1/me` 200；坏 verifier / 重放 → `invalid_grant`；未登录 authorize → 401

#### 开放：ADR-0013 — OAuth 切片 A（client 注册 + `client_credentials`）

- 选题：PAT 适合个人/脚本；第三方机器接入需独立 client；全量 Authorization Code 过大，先落地 M2M
- 表：`oauth_api_client` / `oauth_access_token`（Flyway `V9`）；`client_secret` / `access_token` 仅 SHA-256；明文一次性
- 管理：会话 JWT → `POST|GET|DELETE /auth/oauth-clients`（前缀剥离 `/oauth-clients`）
- 换票：匿名 `POST /oauth/token`（及 `/auth/oauth/token`）`grant_type=client_credentials` → `erd_oat_…`（TTL `ERD_PUBLIC_API_OAUTH_TTL` 默认 3600）
- `/api/v1/**` Bearer 同时接受 `erd_pat_` 与 `erd_oat_`（OAT 以注册人身份 + PatScopes）；吊销 client 使未过期票失效
- **后置切片 B**：Authorization Code + 可选 PKCE；本刀不放宽 CORS

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Dtest=OAuthClientCodecTest,DeadSecurityConfigContractTest,PatTokenCodecTest test -Djacoco.skip=true`
- `./backend/dev-ensure.sh --restart` 后：登录 → 注册 client → `client_credentials` → `GET /api/v1/me` 200；坏 secret → 401；JWT 调 `/api/v1/me` → 401

#### 开放：ADR-0013 — MCP `projects:write` tools（`update_project` + `put_project_json`）

- 选题：REST PATCH/PUT 已有（`63f128a`）；agent MCP 面仍缺元数据/工作区 JSON 写
- MCP：`update_project` → `PATCH /api/v1/projects/{id}`；`put_project_json` → `PUT …/projectJSON`；缺 `projects:write` → API 403
- `erd-api` 增 PATCH/PUT；dogfood 覆盖写 PATH + 只读拒绝；未做 OAuth

验证点：
- `cd mcp && yarn build && yarn dogfood`（写 PAT 含 `projects:write` → REST/MCP update + put；只读 PAT 403）

#### 开放：ADR-0013 — Redis 集群限流（替换进程内骨架）

- 选题：进程内滑动窗口在多实例下配额不共享；ADR 下一候选为 Redis 限流（本刀不做 OAuth）
- `PublicApiRateLimiter`：复用既有 `RedissonClient`，`RRateLimiter` key `erd:public-api:rl:<pat|ip>`；默认仍 60/min（`ERD_PUBLIC_API_RATE_LIMIT`）
- 失效策略：**fail-closed** — Redis 异常 → HTTP 503（不回落进程内存，避免多实例旁路）；超配额仍 429 + `Retry-After`
- 单测：mock Redisson（无 Testcontainers）；未做 OAuth / MCP `projects:write` tools

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Dtest=PublicApiRateLimiterTest test -Djacoco.skip=true`
- `./backend/dev-ensure.sh --restart` 后：`GET /api/v1/me` 无 token → 401（限流链未误伤）；有效 PAT → 200

#### 开放：ADR-0013 — `projects:write` REST（PATCH 元数据 + PUT projectJSON）

- 选题：切片 5 后 `projects:write` 可铸造但无对应 REST；agent 无法改项目名/工作区 fact
- `PATCH /api/v1/projects/{id}`：需 `projects:write` + 成员；body 可选 `projectName`/`name`、`description`、`tags`（至少一项）
- `PUT /api/v1/projects/{id}/projectJSON`：需 `projects:write` + 成员；body `projectJSON`（别名 `projectJson`/`snapshot`）；写入前清空 `profile.dbs`；补齐 `modules=[]`
- 返回清洗后详情；创建日志审计；未做 MCP 写 tool / OAuth / Redis 限流

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Dtest=PublicApiProjectServiceTest,PatScopesTest test -Djacoco.skip=true`
- `./backend/dev-ensure.sh --restart` 后：铸造含 `projects:write` 的 PAT → PATCH 改名 200；PUT 含 `profile.dbs` → GET 详情 `dbs=[]`；缺 scope → 403

#### 开放：ADR-0013 切片 5 — 写 scope + `POST …/versions` + MCP `create_version`

- 选题：切片 4 只读 MCP 后，agent 仍无法提交版本（北极星「API 产生的版本保存」无挂点）
- Scope：解锁铸造 `projects:write` / `versions:write`（默认仍只读）；`POST` 需 `versions:write`
- `POST /api/v1/projects/{id}/versions`：成员 ACL；body `dbKey`/`version`/`versionDesc` + `projectJSON`（别名 `projectJson`/`snapshot`）；写入前清空 `profile.dbs`；仅 insert；返回清洗后详情；创建日志审计；读写共用 60rpm 配额
- MCP：`create_version` → 上列 REST；`mcp` dogfood 覆盖写路径与缺 scope 拒绝
- 未做：OAuth、集群 Redis 限流

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Dtest=PatScopesTest,PublicApiVersionServiceTest,PublicApiProjectServiceTest test -Djacoco.skip=true`
- `./backend/dev-ensure.sh --restart` 后：`cd mcp && yarn dogfood`（写 PAT → REST create + MCP `create_version`；只读 PAT 拒绝写）

#### 开放：ADR-0013 切片 4 — MCP 只读骨架（`mcp/`）

- 选题：切片 3 只读 REST 稳定后，agent 缺一等 MCP 面；本刀只读、无写
- 包：`mcp/`（`@erdonline/mcp`，`@modelcontextprotocol/sdk`）：tools `list_projects` / `get_project` / `get_project_schema` / `list_versions` / `get_version` → `/api/v1/**` + `ERD_PAT`
- 传输：stdio（默认，Cursor）+ Streamable HTTP（`--http` / `ERD_MCP_TRANSPORT=http`，`ERD_MCP_PORT` 默认 3920）
- 文档：`mcp/README.md`；development / deployment / security-model / ADR-0013 / roadmap
- 未做：写 scope、`POST …/versions`、写 tools

验证点：
- `cd mcp && yarn install && yarn build && yarn dogfood`（登录铸造 PAT → REST + stdio `tools/list` + `list_projects` / `get_project_schema`；无写 tool）

#### 开放：ADR-0013 切片 3 — `GET /api/v1/projects/{id}/versions[+/{versionId}]`

- 选题：切片 2 后 agent 仍缺版本时间线只读事实源
- `GET /api/v1/projects/{id}/versions`：分页（可选 `dbKey`）；复用 `db_change` / `DbChangeService`；需 `versions:read` + 成员 ACL；列表不含 `projectJSON`
- `GET /api/v1/projects/{id}/versions/{versionId}`：详情含 `changes` + 清洗后的 `projectJSON`（清空 `profile.dbs`，ADR-0008）；异项目 versionId → 404
- 未做：MCP、写 scope / `POST …/versions`

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Dtest=PublicApiVersionServiceTest,PublicApiProjectServiceTest,PatScopesTest test -Djacoco.skip=true`
- `./backend/dev-ensure.sh --restart` 后：铸造 PAT → `GET …/versions` 200；详情 `profile.dbs=[]`；无 token → 401

#### 开放：ADR-0013 切片 2 — `GET /api/v1/projects[+/{id}]`

- 选题：切片 1 PAT 落地后，agent 仍缺成员项目只读事实源
- `GET /api/v1/projects`：分页列出当前 PAT 用户在 `project_user` 内的项目（复用 `projectPage`）
- `GET /api/v1/projects/{id}`：成员 ACL + `projects:read`；`projectJSON` 清空 `profile.dbs`（ADR-0008）
- 无 PAT / 非 `erd_pat_` / 缺 scope / 非成员 → 401/403；会话 JWT 不进 `/api/v1`
- 未做：versions 只读、MCP、写 scope

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Dtest=PatScopesTest,PublicApiProjectServiceTest,PersonalAccessTokenAuthTest,ProjectShareSanitizeTest test -Djacoco.skip=true`
- `./backend/dev-ensure.sh --restart` 后：铸造 PAT → `GET /api/v1/projects` 200；无 token → 401；JWT → 401；详情 `profile.dbs=[]`

#### 开放：ADR-0013 切片 1 — PAT 哈希 + `/api/v1/me` + 限流骨架

- 选题：Vision 暂停点 `785d699` 后人工选择 ADR-0013；先拍板 adopt-first 默认（PAT / 只读 scope / 60rpm）再落非争议 plumbing
- Flyway `V7__personal_access_token`：只存 SHA-256，无明文列；`V8__pat_token_hint_widen` 扩 `token_hint`
- 会话 JWT：`POST/GET/DELETE /auth/personal-access-tokens` 铸造/列表/吊销（明文仅铸造一次）
- 公开面：`GET /api/v1/me`（Bearer `erd_pat_…`）；独立 SecurityFilterChain；进程内限流骨架
- springdoc 分组 `public-v1`（仍受 prod `springdoc.*.enabled=false` 门控）
- 文档：ADR-0013 决策表 + 切片 backlog；roadmap 开放 📋→🚧；security-model PAT 节；ADR-0016 专项解封本里程碑
- 未做：projects/versions 只读 REST、MCP server、写 scope

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Dtest=PatScopesTest,PatTokenCodecTest,PublicApiRateLimiterTest,PersonalAccessTokenAuthTest test`
- `./backend/dev-ensure.sh --restart` 后：`curl -sS http://127.0.0.1:9502/api/v1/me` → 401；登录铸造 PAT → `curl -H "Authorization: Bearer $PAT" http://127.0.0.1:9502/api/v1/me` → 200 + scopes
- 库内：`SELECT token_hash, token_hint FROM personal_access_token` 无明文前缀外的密钥体

### 2026-08-03

#### 状态：Vision 自动轨暂停（仅人工 next）

- 扫描锚点：`d94f1fd`（画布 FK `constraintName` 可编辑）之后
- 结论：无未锁定高 ROI P0/P1 Vision 刀；禁止为 idle 再 densify 已密 chrome / Auth logo
- Human next：ADR-0013 拍板 · P4 Railway demo 拉起 · DBML Trigger（等官方块）· ADR-0011 `fields[]`（FE 多字段边协议）
- 文档：`docs/roadmap.md`「Vision 自动轨暂停点」

验证点：
- 本条为状态记录，无产品行为变更

#### 体验：画布边 FK 约束名可编辑（对称 ON DELETE/UPDATE）

- 选题：`d198079`/`94fa593` 后 chip 可改参照动作，逆向/`Ref name` 已有 `constraintName` 却画布只读 → 新建边控不了 DDL 约束名（对称缺口）
- `updateAssociationFkMeta` 支持 `constraintName`；同旧名拆边同步改名；重名拦截；persist-on-200
- `ErdRelationEdge` 编辑器增加约束名 Input（Esc 丢草稿不落盘）
- E2E：`canvas-fk-meta-edit` 覆盖约束名落盘 + 刷新残留（保留既有规则失败重试）
- 未做：ADR-0013 / P4 Railway / DBML Trigger / ADR-0011 `fields[]`（人工/延期）

验证点：
- `cd frontend && npx --yes tsx src/utils/relationEdges.test.ts`
- `cd frontend && npx playwright test tests/e2e/canvas-fk-meta-edit.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：触发器签可编辑已有行（对称字段/索引）

- 选题：`1dc3297` 画布 open-trigger 后，签内仍只能新增/删除/只读看 DDL → 逆向 triggers[] 改语句体要删重建（多余步骤 + 与索引签不对称）
- `TableTriggerEdit`：行「编辑」→「编辑触发器」弹层；结构字段变而 DDL 未改时强制重建；persist-on-200；失败不关窗可重试；首焦名称 + Esc/Tab
- E2E：`table-triggers` 编辑落盘 + 刷新残留 + 失败可重试
- 未做：DBML Trigger（等官方块）；ADR-0013 / P4 Railway / ADR-0011 `fields[]`（人工/延期）

验证点：
- `cd frontend && npx playwright test tests/e2e/table-triggers.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：画布底栏直达触发器签

- 选题：`3bca440` FK 导出后，触发器签仅签头/`Cmd+4` 可达 → 画布相对字段/索引/元数据缺对称入口（CHANGELOG 登记「未做」）
- 表节点底栏并排「触发器」`canvas-open-trigger` → `designPane: 'trigger'`；`aria-label=打开触发器`
- E2E：`relation`「画布打开触发器签」直达 + 非粘滞重入；`table-triggers` 走底栏入口
- 未做：DBML Trigger（等官方块）；ADR-0013 / P4 Railway / ADR-0011 `fields[]`（人工/延期）

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "画布打开触发器签" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/table-triggers.spec.ts --project=chromium --workers=1 --retries=0`

#### 导出：FK `ON DELETE` / `ON UPDATE` → DDL FOREIGN KEY（+ DBML Ref settings）

- 选题：`d198079` 画布可编参照动作；DDL 导出仍丢 associations FK
- `renderCreateForeignKeySql` / `rebuildForeignKeyDdl`：四库 `ALTER TABLE … ADD CONSTRAINT … FOREIGN KEY`；同名 `constraintName` 聚复合列；缺名生成 `fk_<表>_<列>`；Oracle 省略 `ON UPDATE`
- 片段键 `createForeignKey`；导出弹层可勾选「建外键语句」；全部导出默认含 FK
- DBML：官方 `Ref name: … [delete: …, update: …]` 往返（不污染 Note）
- 未做：E2E 导出 UI（单测覆盖生成路径）；ADR-0011 `fields[]`

验证点：
- `cd frontend && npx --yes tsx src/utils/json2code.fk.test.ts`
- `cd frontend && yarn test:unit:dbml`

#### 体验：画布边 ON DELETE / ON UPDATE 可编辑

- 选题：`2725227` 逆向已落 `deleteRule`/`updateRule`；chip 仅 title 可读 → 新建边无法设 CASCADE
- `ErdRelationEdge`：点 chip 编辑器 = 基数 + ON DELETE/UPDATE（空=方言默认）；Esc/点外关闭
- `updateAssociationFkMeta`：persist-on-200；同 `constraintName` 拆边同步（ADR-0011）；失败保持原值
- E2E：`canvas-fk-meta-edit`（失败回滚 → CASCADE/RESTRICT 落盘 + 刷新）；基数用例适配 Esc 关编辑器
- 未做：DDL `FOREIGN KEY` 回写；复合 `fields[]`（ADR-0011）

验证点：
- `cd frontend && npx --yes tsx src/utils/relationEdges.test.ts`
- `cd frontend && npx playwright test tests/e2e/canvas-fk-meta-edit.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/canvas-cardinality-failure.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：数据类型字典逻辑类型 apply 方言可视化编辑

- 选题：`4dab9a5`/`2c3e3cc` 枚举与选型已闭环；逻辑类型 Modal 仍静默沿用/空 `apply`，无法按 MYSQL/PG/… 填物理类型
- `DataTypeDomains`：逻辑种类密表「库方言映射」行（方言 code + 物理类型 Input）；保存写入 `apply[code].type`；枚举仍 `buildEnumApply`、不展示 apply 编辑器；persist-on-200
- E2E：`datatype-apply-ux`（新增落盘 → 编辑改 MYSQL → 枚举弹层无 apply）

验证点：
- `cd frontend && npx playwright test tests/e2e/datatype-apply-ux.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/datatype-enum-ux.spec.ts tests/e2e/datatype-domains-failure.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：字段类型下拉区分枚举（画布 + 表设计）

- 选题：`4dab9a5` 字典可建 `kind=enum`；画布仍硬编码 `FIELD_TYPES`、JExcel 扁平 name 列表 → 建完枚举不好挑
- `fieldTypeOptions`：拆「逻辑类型 | 枚举」；画布 `<select>` optgroup + 浏览态枚举徽章；表设计/默认字段 JExcel dropdown `group`（jsuites）；值写 `fields[].type=code`
- 纪律：不改 persist 闸；遗留快捷码（如 `String`）仍进逻辑组，防旧 E2E/字段失选
- E2E：`field-type-enum-picker`（建枚举 → optgroup → 选 code 落盘 + 徽章）

验证点：
- `cd frontend && npx --yes tsx --test src/utils/fieldTypeOptions.test.ts`
- `cd frontend && npx playwright test tests/e2e/field-type-enum-picker.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：数据类型字典枚举域 UX（kind=enum / values[]）

- 选题：`2d42004` DBML Enum 已入库；`e823bf5` CRUD persist-on-200；设置页仍只改 name/code → 枚举不可见/不可编
- `DataTypeDomains`：种类「逻辑 | 枚举」；枚举 Form.List 编 `values[]`（名 + 可选显示名）；`buildEnumApply` 写方言 apply；「新增枚举」快捷入口；列表种类/取值密列；空态双 CTA
- 纪律：仅 save code===200 关窗+toast；Modal Esc / 首焦名称 / `focusTriggerAfterClose`
- E2E：`datatype-enum-ux`（新增→落盘 kind/values→编辑追加取值）；键盘/失败用例仍走逻辑路径

验证点：
- `cd frontend && npx playwright test tests/e2e/datatype-enum-ux.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/datatype-domains-keyboard.spec.ts tests/e2e/datatype-domains-failure.spec.ts --project=chromium --workers=1 --retries=0`

#### 导出：`triggers[]` → DDL CREATE TRIGGER（方言回写）

- 选题：`6ad74f4` filter 导出后，最高缺口 = 逆向/UI 已有 `entity.triggers[]`，DDL 导出仍丢触发器
- `renderCreateTriggerSql` / `rebuildTriggerDdl`：优先 `ddl` 原样；否则按方言重建（对齐后端 `TriggerResultSetMapper`：MySQL/PG/SQL Server/Oracle）
- `getAllDataSQL` / `getAllDataSQLByFilter` 片段键 `createTrigger`（建表/索引后）；导出弹层自定义勾选「建触发器语句」；全部导出默认含触发器
- DBML：仍不映射（`@dbml/core` 无 Trigger 块）
- 未做：E2E 导出 UI（单测覆盖生成路径）；DBML Trigger 互导

验证点：
- `cd frontend && npx --yes tsx src/utils/json2code.trigger.test.ts`
- `cd frontend && yarn test:unit:dbml`

#### 导出：`indexs[].filter` → DDL WHERE / DBML note 约定

- 选题：`b95e42f` 逆向已落 `filter`；DDL/DBML 导出仍丢部分·过滤谓词
- DDL：`renderCreateIndexSql` — PG/SQL Server 有 `filter` 时规范输出 `CREATE … INDEX … WHERE …`（覆盖存量 ALTER ADD INDEX 模板）；MySQL/Oracle 忽略 filter
- 导出弹层：`getAllDataSQLByFilter` / `getAllDataSQL` 按所选方言 `code` 取模板（非仅 defaultDatabase）
- 默认模板：`defaultData.json` PostgreSQL + `project.json` PG/SQLServer `createIndexTemplate` 带可选 `{{? it.index.filter}} WHERE …`
- DBML：`@dbml/core` 拒 `where:` → 用索引 `note: 'filter: <pred>'` 往返；单测 round-trip
- 未做：E2E 导出 UI（单测覆盖生成路径）；MySQL/Oracle 无对等 WHERE

验证点：
- `cd frontend && npx --yes tsx src/utils/json2code.indexFilter.test.ts`
- `cd frontend && yarn test:unit:dbml`

#### 逆向：PG/SQL Server 部分·过滤索引谓词 → `indexs[].filter`

- 选题：四库表达式索引闭环（`9f75499`）后下一刀 = 过滤/部分索引谓词仍丢失
- 模型：`Index.filter`（projectJSON `indexs[].filter`）；谓词不进 `fields[]`
- PG：`pg_get_expr(ix.indpred, ix.indrelid) AS filter`
- SQL Server：`i.filter_definition AS filter`（含 computed 回退 SQL）
- Mapper：`FILTER`/`FILTER_DEFINITION` 复合索引首行写入；无谓词保持 null
- FE：索引签「过滤条件」文本列读写 `filter`（HMR）
- 未做：~~DDL 模板 WHERE 回写、DBML filter~~（本切片已做）、MySQL/Oracle（无对等）
- 单测 mock JDBC；文档 data-format / schema / ADR-0006 / roadmap

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Dtest=IndexResultSetMapperTest,PostgresqlReverseDialectExpressionIndexTest,SqlServerReverseDialectExpressionIndexTest test -Djacoco.skip=true`
- `./backend/dev-ensure.sh --restart`

#### 逆向：Oracle/SQL Server 函数·计算列索引 → `indexs[].fields[]`

- 选题：PG/MySQL（`8788e5c`）+ 索引签编辑（`cddbbf8`）后，P0 四库缺口 = Oracle `SYS_NC$` / SQL Server 计算列仍只出列名
- Oracle：`LEFT JOIN ALL_IND_EXPRESSIONS`；mapper 优先 `EXPRESSION`（LONG 须行首读）；无视图回退列名-only
- SQL Server：`LEFT JOIN sys.computed_columns`；`definition` → `EXPRESSION`；无表回退列名-only；（过滤谓词另切片 → `filter`）
- Mapper：EXPRESSION 优先于 COLUMN_NAME（覆盖 SYS_NC$）；空键软跳过；不做 ADR-0013
- 单测 mock JDBC；文档 data-format / ADR-0006 / roadmap

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Dtest=IndexResultSetMapperTest,OracleReverseDialectExpressionIndexTest,SqlServerReverseDialectExpressionIndexTest,PostgresqlReverseDialectExpressionIndexTest,MysqlReverseDialectExpressionIndexTest test -Djacoco.skip=true`
- `./backend/dev-ensure.sh --restart`

#### 体验：索引签字段/表达式可编辑（`indexs[].fields[]`）

- 选题：DBML（`1e4a1bf`）+ 逆向（`8788e5c`）已把表达式写入 `fields[]`；索引签 JExcel 仍是列名-only `dropdown` → 看不见/改不了
- `TableIndexEdit`：`fields` 列改 `text`「字段/表达式*」；分号混写列名/表达式；`parseIndexFieldsCell` / `formatIndexFieldsCell`；既有 `persist:true` / 失败 `sheetEpoch` 重挂
- Hint：`aria-label=索引字段编辑说明` + 分号约定 + 可选列提示；密 chrome 不动
- E2E：`index-expression-edit`（失败回滚 → 混写落盘 + Esc 停签）
- 未做：~~Oracle / SQL Server 函数索引逆向~~✅（编辑器已通，字典本切片闭环）
- 文档：data-format / ui-layout / roadmap / regression / control-matrix / design-principles

验证点：
- `cd frontend && npx --yes tsx src/pages/design/table/component/table/indexFieldsCell.test.ts`
- `cd frontend && npx playwright test tests/e2e/index-expression-edit.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/jexcel-index-failure.spec.ts --project=chromium --workers=1 --retries=0`

#### 逆向：PG/MySQL 表达式·函数索引 → `indexs[].fields[]`

- 选题：DBML 表达式索引（`1e4a1bf`）后最高缺口 = 字典逆向仍只出列名；PG `INNER JOIN pg_attribute` 整丢 `indkey=0` 行
- PG：`LEFT JOIN` + `pg_get_indexdef(indexrelid, ord, true)` 写入表达式原样
- MySQL 8：`STATISTICS` `COLUMN_NAME` 空则读 `EXPRESSION`；无列回退 legacy SQL（MariaDB/旧版）
- Mapper：空键位软跳过；表达式不做大小写折叠；与 DBML 同槽无 schema 加法
- 未做：~~Oracle / SQL Server 函数索引~~✅；ADR-0013
- 单测 mock JDBC；文档 data-format / ADR-0006 / roadmap

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Dtest=IndexResultSetMapperTest,PostgresqlReverseDialectExpressionIndexTest,MysqlReverseDialectExpressionIndexTest test -Djacoco.skip=true`
- `./backend/dev-ensure.sh --restart`

#### 互通：DBML 表达式索引 ↔ `indexs[].fields[]`

- 选题：Enum 闭环（`2d42004`）后下一刀 = 表达式/函数索引往返（roadmap 显式「另切片」）
- 模型：不加新字段；`indexs[].fields[]` 既可放列名也可放表达式原样（如 `LOWER(email)`）
- 导入：`@dbml/core` `columns[].type=expression` 不再丢弃，写入 `fields[]`
- 导出：纯 ident → 列引用；其余 → `` `expr` ``（混列同块）
- DDL：既有 `createIndexTemplate` 对 `fields` join，表达式可进 `CREATE INDEX … (LOWER(email))`
- 未做：~~索引签 UI 表达式编辑器~~✅；~~Oracle/SQL Server 函数索引字典~~✅（PG/MySQL 见上；Oracle/SQL Server 见本日前置小节）
- 单测 + fixture `expression-index.dbml` round-trip；E2E `dbml-export`「表达式索引」
- 文档：data-format Index + DBML 表；roadmap / regression-checklist

验证点：
- `cd frontend && yarn test:unit:dbml`
- `cd frontend && npx playwright test tests/e2e/dbml-export.spec.ts --project=chromium --grep "表达式索引" --workers=1 --retries=0`

#### 互通：DBML Enum ↔ dataTypeDomains

- 选题：触发器签（`325bf2a`）后 DBML Trigger 仍无家；下一刀 = Enum（`@dbml/core` 已支持，原文档「不映射」）
- 导入：`schema.enums` → `dataTypeDomains.datatype[]`（`kind:'enum'` / `code`=名 / `values[{name,chnname?}]` / `apply.MYSQL=ENUM(...)`）；列 `_enum`/类型名 → `fields[].type=code`
- 导出：`kind:enum|values[]` → `Enum` 块（值级 note）；字段类型优先写枚举 ident
- 缺口保留：Enum **级** Note（core 9.x 不解析）；Trigger 仍延期
- 单测 + fixture `enum.dbml` round-trip；E2E `dbml-export`「Enum fixture」
- 文档：data-format / roadmap / ui-layout / regression-checklist

验证点：
- `cd frontend && yarn test:unit:dbml`
- `cd frontend && npx playwright test tests/e2e/dbml-export.spec.ts --project=chromium --grep "Enum fixture" --workers=1 --retries=0`

#### 体验：表设计触发器签（`entity.triggers[]`）

- 选题：`71d9f1c` 分享表清单分页后，UI 水位下一刀 = 设计器内暴露逆向已写入的 `triggers[]`（非 CommonTabs densify）
- 表设计：新增「触发器」内签（列表 + 查看 DDL + 添加/删除）；密 chrome（~28 行 / hint ~24）；`Cmd/Ctrl+4` 直切
- Store：`updateEntityTriggers` 仅 `saveProject` code===200 写 store（禁假成功）；名重复拒写
- E2E：`table-triggers.spec` 添加→DDL→删除；`relation.spec` 签页快捷键/速查文案扩到 4
- 文档：data-format Trigger UI 入口；roadmap / ui-layout / regression-checklist
- 未做：DBML `triggers[]` 互导（`@dbml/core` 无块）；~~画布打开触发器签入口~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/table-triggers.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "Cmd/Ctrl\\+1/2/3/4|快捷键速查" --workers=1 --retries=0`

#### 体验：分享页表清单分页

- 选题：量测 DBML 触发器互导 — `@dbml/core` 9.x **无**合法 `Trigger` 块；`Note` 已专用于 `chnname`，塞 `triggers[]` 会污染显示名且非官方语义家 → 文档缺口后改切最高 ROI UX：分享只读表清单 `pagination={false}` 大图撑屏
- 分享：默认 `pageSize=5` + SizeChanger（5/10/20/50）+「共 N 张表」；单页隐藏分页；页码随表数夹紧；分页 chrome 次密（24）
- E2E：`demo.spec` demo 8 表翻页见 `biz_order`；密度锁不退
- 文档：`data-format` Trigger/DBML 缺口成文；roadmap / ui-layout / regression-checklist
- 未做：DBML `triggers[]` 互导（等官方块）；设计器内其它表清单；ADR-0011 `fields[]`

验证点：
- `cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --grep "免登录" --workers=1 --retries=0`

#### 逆向：FK 约束名 + ON DELETE/UPDATE（ADR-0011 旁路加法）

- 选题：Oracle 触发器收口后复查 ADR-0011：`fields[]` **仍延期**（解封=FE 多字段边协议）；薄切片 = ADR 负面项「约束名/ON DELETE 未进模型」
- 模型：`Association.constraintName` / `deleteRule` / `updateRule`（仅加法；`@JsonInclude(NON_NULL)`）；复合仍按列拆边，同约束共享 `constraintName`
- 逆向：`ForeignKeyAssociationMapper` 读 JDBC `FK_NAME`/`DELETE_RULE`/`UPDATE_RULE`；字典补规则列（MySQL `REFERENTIAL_CONSTRAINTS`、PG `referential_constraints`、SQL Server `*_referential_action_desc`、Oracle `DELETE_RULE`）
- UI：边 chip `title`/`aria-label` 附带元数据；`data-testid=erd-edge-fk-meta`（勿扫 `.ant-*`）
- 单测：`ForeignKeyAssociationMapperTest` + `relationEdges.test.ts` 透传/格式化
- 文档：ADR-0011 解封条件成文；data-format / schema / ADR-0006 / roadmap / regression-checklist
- 未做：`from.fields[]`/`to.fields[]` 聚合；DBML Ref 规则互导；表清单分页（本条后已切）

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=ForeignKeyAssociationMapperTest test`
- `cd frontend && npx tsx src/utils/relationEdges.test.ts`
- `./backend/dev-ensure.sh --restart`

#### 逆向：Oracle 触发器 → `entity.triggers[]`

- 选题：`22b8dd9` SQL Server 触发器后，收口四库循环最后一刀 = Oracle `ALL_TRIGGERS`/`ALL_SOURCE`
- Oracle：`OracleReverseDialect.supportsTrigger=true`；字典 `ALL_TRIGGERS` + `ALL_SOURCE`（多事件拆行）→ `name`/`timing`(BEFORE|AFTER|INSTEAD OF)/`event`/`orientation`(ROW|STATEMENT)/`statement`；完整 CREATE 或 `TRIGGER …` 源码作 `ddl`，否则双引号重建（`TriggerResultSetMapper.mapFromOracleAllTriggers`）；失败 warn 跳过
- 单测：`OracleReverseDialectTriggerTest` + mapper Oracle DDL + Registry `supportsTrigger`（P0 四库全 true）
- 文档：ADR-0006 / roadmap 逆向保真 Oracle 触发器 ✅；四库触发器闭环
- 未做：触发器 UI / DBML / ADR-0011（本轮不启）

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=TriggerResultSetMapperTest,OracleReverseDialectTriggerTest,SqlServerReverseDialectTriggerTest,PostgresqlReverseDialectTriggerTest,MysqlReverseDialectTriggerTest,ReverseDialectRegistryTest test`
- `./backend/dev-ensure.sh --restart` 后 Registry/meta：`Oracle` → `supportsTrigger=true`

#### 逆向：SQL Server 触发器 → `entity.triggers[]`

- 选题：`2744897` PG 触发器后，最高缺口 = SQL Server `sys.triggers`（共享 `Trigger` / `supportsTrigger` 已齐）
- SQL Server：`SqlServerReverseDialect.supportsTrigger=true`；字典 `sys.triggers`/`sys.trigger_events` + `OBJECT_DEFINITION` → `name`/`timing`(AFTER|INSTEAD OF)/`event`/`orientation`/`statement`；完整 CREATE 作 `ddl`，否则方括号重建（`TriggerResultSetMapper.mapFromSqlServerSys`）；失败 warn 跳过
- 单测：`SqlServerReverseDialectTriggerTest` + mapper SQL Server DDL + Registry `supportsTrigger`
- 文档：ADR-0006 / roadmap 逆向保真 SQL Server 触发器 ✅；Oracle 触发器另切片
- 未做：触发器 UI / DBML / Oracle 字典 / ADR-0011

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=TriggerResultSetMapperTest,SqlServerReverseDialectTriggerTest,PostgresqlReverseDialectTriggerTest,MysqlReverseDialectTriggerTest,ReverseDialectRegistryTest test`
- `./backend/dev-ensure.sh --restart` 后 Registry/meta：`Microsoft SQL Server` → `supportsTrigger=true`

#### 逆向：PostgreSQL 触发器 → `entity.triggers[]`

- 选题：`2abaeb7` MySQL 触发器后，最高缺口 = PG `information_schema.triggers`（共享 `Trigger` / `supportsTrigger` 已齐）
- PG：`PostgresqlReverseDialect.supportsTrigger=true`；字典 `information_schema.triggers` → `name`/`timing`/`event`/`orientation`/`statement` + 双引号重建 `ddl`（`TriggerResultSetMapper.mapFromPostgresInformationSchema`）；失败 warn 跳过（同注释）
- 单测：`PostgresqlReverseDialectTriggerTest` + mapper PG DDL + Registry `supportsTrigger`
- 文档：ADR-0006 / roadmap 逆向保真 PG 触发器 ✅；SQL Server/Oracle 触发器另切片
- 未做：触发器 UI / DBML / SQL Server·Oracle 字典 / `pg_get_triggerdef` 字节克隆

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=TriggerResultSetMapperTest,PostgresqlReverseDialectTriggerTest,MysqlReverseDialectTriggerTest,ReverseDialectRegistryTest test`
- `./backend/dev-ensure.sh --restart` 后 Registry/meta：`PostgreSQL` → `supportsTrigger=true`

#### 逆向：MySQL 触发器 → `entity.triggers[]`

- 选题：`efd0120` Oracle 注释后，度量四库触发器捕获均为 0、projectJSON 无 `triggers` 槽；最高缺口 = 共享模型 + MySQL（本机 Colima 热库）
- SPI：`Trigger` 模型、`DialectCapability.supportsTrigger`、`AbstractJdbcReverseDialect.loadTriggers`、`dbReverseMeta.supportsTrigger`；schema/data-format 加法字段
- MySQL：`INFORMATION_SCHEMA.TRIGGERS` → `name`/`timing`/`event`/`orientation`/`statement` + 重建 `ddl`（`TriggerResultSetMapper`）；失败 warn 跳过
- 单测：`TriggerResultSetMapperTest` + `MysqlReverseDialectTriggerTest`（mock JDBC）+ Registry `supportsTrigger`
- 文档：ADR-0006 / roadmap 逆向保真 MySQL 触发器 ✅；PG/SQL Server/Oracle 触发器另切片
- 未做：触发器 UI / DBML 映射 / 其它方言字典

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=TriggerResultSetMapperTest,MysqlReverseDialectTriggerTest,ReverseDialectRegistryTest test`

#### 逆向：Oracle 表/列注释 → chnname

- 选题：键盘 UX 扫余后最高 Vision ROI = roadmap 逆向保真 Oracle 注释（PG/SQL Server 已字典化）
- `OracleReverseDialect`：`supportsComment=true`；`ALL_TAB_COMMENTS` / `ALL_COL_COMMENTS` → `listTables`/`fillEntity` 回填 `entity.chnname` / `fields[].chnname`；失败 warn+回退 JDBC；`JdbcKit.remarksReporting` 仍保留作兜底
- 单测：`OracleReverseDialectCommentTest`（mock JDBC）+ `CommentResultSetMapper` Oracle 大写标识符形态 + Registry `supportsComment`
- 文档：ADR-0006 / roadmap 逆向保真 Oracle 注释 ✅；regression-checklist；下一刀 → ~~触发器逆向~~✅（MySQL）

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=OracleReverseDialectCommentTest,CommentResultSetMapperTest,ReverseDialectRegistryTest test`

#### 体验：版本同步结果 Modal 键盘 + 行绑定修炸

- 选题：JExcel Escape/快捷操作键盘已收口（`b57bc3d`）；扫余 = 版本「同步」结果 Modal 缺键盘环；走查发现 Sync 只靠 List `onMouseEnter` 写 `currentVersion`，无悬停/`modules` 空 → 页错「Cannot read … modules」、dbsync 永不发
- `SyncVersion`：必传行 `version`；点击先 `setCurrentVersion` 再 `readDb`（禁鼠标 enter 隐式态）；`showSyncResultModal` 首焦「知道了」/Esc 归还/Tab trap；打开前钉回 `version-sync-btn`
- E2E：`version-sync-result-keyboard` 挂 JDBC + mock dbversion/dbsync；成功/失败键盘闭环（勿依赖 hover）；定位 role/testid
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~Oracle 逆向注释保真~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/version-sync-result-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：表设计 JExcel Escape 退格 + 快捷操作 Modal 键盘

- 选题：databaseConfig Drawer 键盘已收口（`1f97b39`）；量测工具栏 Tab/网格入口已齐；残余 = Escape 退格后焦点落隐藏 `#jexcel_textarea`、工具栏「快捷操作」`Modal.info` 缺 Esc/首焦/归还
- `JExcel`：编辑态 Escape → `closeEditor(false)` 丢弃草稿 + `rAF` 焦点归还 `jexcel-grid`；工具栏 `role=toolbar`「表格编辑工具栏」；快捷操作 `keyboard` + `autoFocusButton=ok` + `focusTriggerAfterClose` + `okText=知道了`；修彩蛋文案乱码
- E2E：`jexcel-grid-keyboard` Escape 归还网格（草稿不落盘）+ 快捷操作首焦「知道了」/ Esc 归还 / Tab trap；定位 role/aria/testid（勿扫 `.ant-*`）
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~版本同步结果 Modal 键盘~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/jexcel-grid-keyboard.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/jexcel-toolbar-delete-keyboard.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --workers=1 --retries=0 --grep "工具栏 Tab 可达|半成品行不静默丢字段"`

#### 体验：工作台 databaseConfig Drawer 键盘闭环

- 选题：导入跳过校验键盘已收口（`9a20b19`）；扫余最高项 = `/databaseConfig` 新建/编辑 Drawer 缺显式 Esc/首焦/关后归还触发器（antd Drawer 无 `focusTriggerAfterClose`）
- Drawer：`keyboard` + `autoFocus={false}` + `afterOpenChange` 首焦 `#database-config-name`；关后手动 `trigger.focus()`；连接名称 `aria-label`；打开路径统一 `openDrawer` 记触发器
- E2E：`database-config-drawer-keyboard` 新建/编辑 → 首焦「连接名称」→ Tab trap → Esc 归还「新建连接」/「编辑」；定位 role/label（勿扫 `.ant-*`）
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~JExcel Escape 退格 + 快捷操作 Modal~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/database-config-drawer-keyboard.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/adr0008-datasource.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：导入跳过校验 Modal.warning 键盘闭环

- 选题：扫余最高项——导入校验 `Modal.warning`（DBML/ERD/PdMan，6 处）缺 `keyboard`/`autoFocusButton`/`focusTriggerAfterClose`（键盘用户关提示后焦点易坠 body）；较 databaseConfig Drawer（antd 默认可 Esc）ROI 更高
- `showImportSkipWarning`：`keyboard` + `autoFocusButton=ok` + `focusTriggerAfterClose` + `okText=知道了`；dialog + 次屏导入共用
- E2E：`import-skip-warning-keyboard` 二次导入全跳过 → 首焦「知道了」→ Tab trap → Esc/OK 归还「解析并导入」；定位 `role=dialog`/`role=button`/`getByLabel`（勿扫 `.ant-*`）
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~`databaseConfig` Drawer~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/import-skip-warning-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：审批/工单 SQL 明细 Modal.info 键盘闭环

- 选题：CommonTabs 扫余最高项——审批/工单「查看」`Modal.info` 缺显式 `keyboard`/`focusTriggerAfterClose`/首焦 OK（Esc 后焦点易坠 body）
- `showSqlDetailModal`：`keyboard` + `autoFocusButton=ok` + `focusTriggerAfterClose` + `okText=知道了`；审批/工单共用；触发钮 `aria-label=查看SQL`
- E2E：`sql-detail-keyboard` 首焦「知道了」→ Tab trap → Esc/OK 归还「查看SQL」（审批+工单）；定位 `role=button`/`role=dialog`（勿扫 `.ant-*`）
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~`Modal.warning` 导入校验~~✅ / `databaseConfig` Drawer

验证点：
- `cd frontend && npx playwright test tests/e2e/sql-detail-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：CommonTabs 签头键盘闭环

- 选题：设计器 Skip / Cmd+1/2/3 已收口；签头最高摩擦 = 关闭钮英文 `remove`、方向键无 E2E、关签焦点坠 body
- `CommonTabs`：`locale.removeAriaLabel` + 按实体刷 `aria-label=关闭 {表名}` / `testid=common-tab-close-*`；关签后焦点归还下一签或主工作区；`navigation`「已打开的签页」
- E2E：`common-tabs-keyboard` ←/→ 移焦 + Enter 激活；关闭可及名 + focus-visible；关签焦点不落 body；内签同构；定位 role/testid（勿扫 `.ant-*`）
- 扫余未登记弹层：矩阵已登记 `<Modal` 主路径均有 `focusTriggerAfterClose`/`confirmDestructive`；余量仅为 `Modal.info`（审批/工单 SQL 明细）/ `Modal.warning`（导入校验）/ `databaseConfig` Drawer——非主建模摩擦，下一切片另排
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → 审批/工单 SQL 明细 `Modal.info` 焦点归还，或 Vision 矩阵 📋

验证点：
- `cd frontend && npx playwright test tests/e2e/common-tabs-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：数据类型字典弹层键盘闭环

- 选题：画布关系图弹层键盘已收口（`4ae6135`）；设置页「新增/编辑字段类型」Modal 有首焦名称，但缺显式 `keyboard`/`focusTriggerAfterClose`（Esc 后焦点不归还触发器）
- `DataTypeDomains`：`keyboard={!submitting}` + `focusTriggerAfterClose`；`afterOpenChange` 重试首焦「类型名称」；提交流程/失败 keep 窗不变
- E2E：`datatype-domains-keyboard` 首焦名称 → Tab trap → Esc 归还「新增字段类型」；定位 `role=button`/`role=dialog`/`role=textbox`（勿扫 `.ant-*`）
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~设计器壳 Skip/表设计签头键盘~~✅（CommonTabs 关签/可及名）

验证点：
- `cd frontend && npx playwright test tests/e2e/datatype-domains-keyboard.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/datatype-domains-failure.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：画布关系图弹层键盘闭环

- 选题：假成功高 ROI 扫完——Word/模板 ZIP 闸、DDL/DBML/版本 diff 空内容闸、审批 `code===200` 已收口；PDF `gendocx` 无 UI 入口；HTML/MD 本地生成难出空体。切**键盘摩擦**：画布「新建/重命名关系图」Modal 缺首焦/Esc 归还/Tab trap（「加入分组」同源补齐）
- `ReactFlowRelation`：两 Modal `keyboard` + `focusTriggerAfterClose` + `afterOpenChange` 首焦「关系图名称」/「选择分组」；提交中禁 Esc 关新建窗
- E2E：`diagram-modal-keyboard` 首焦名称 → Tab trap → Esc 归还「新建关系图」；定位 `role=button`/`role=dialog`/`role=textbox`（勿扫 `.ant-*`）
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~数据类型字典 Modal `focusTriggerAfterClose`~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/diagram-modal-keyboard.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/diagram-modal-failure.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：Word gendocx 导出假成功

- 选题：`downloadWordTemplate` ZIP 闸已收口（`99d8406`）；`exportFile('Word')`→`POST /ncnb/doc/gendocx` 仅拒 `content-type: json`，空体 / `octet-stream` 包 JSON / 非 ZIP 仍 `saveByBlob` → 假 `.doc` 下载
- `exportSlice` Word 路径复用 `docxBlobGate`（非空 + ZIP `PK`）；失败 toast「Word导出失败!请重试！出错原因：…」、不落盘；`profileSlice` 模板下载改走同一闸；删 `save.js` 零引用 `gendocx` 死代码
- E2E：`word-gendocx-download-failure` mock JSON / 空 blob / 非 ZIP → toast + 无 `download`；定位 `role=button`「导出Word」/`testid=export-common-page`（勿扫 `.ant-*`）
- 文档：design-principles §1 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~扫描余假成功～切画布关系图弹层键盘~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/word-gendocx-download-failure.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：WORD 模板下载假成功

- 选题：版本回滚假成功已收口（`202d7c5`）；`downloadWordTemplate` 对任意 blob（含空体 / `application/json` 错误体）直接 `saveByBlob(...docx)` → 用户像下到模板实为垃圾/JSON
- `downloadWordTemplate`：校验非空 + ZIP 魔数 `PK`；`json`/窥探 JSON 错误体则失败 toast、不落盘；HTTP 错误 `errorHandler` 重抛防 resolve(undefined)
- E2E：`word-template-download-failure` mock JSON/空 blob → toast + 无 `download` 事件；定位 `role=dialog`「默认项设置」/ `role=button`「下载模板」（勿扫 `.ant-*`）
- 文档：design-principles §1 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~Word `gendocx` 空/JSON/非 ZIP 假下载~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/word-template-download-failure.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：版本回滚假成功

- 扫描结论：dbsync 同步失败 / Word `gendocx` 导出失败已收口；下一高 ROI 为 **版本回滚**——`revertVersionData` 先 `setModules` 再异步 save，且弹层无条件关窗 → 落盘失败仍像已回滚
- `revertVersionData`：仅 `saveProject` code===200 写 store + toast「成功回滚」；失败 toast、不写 store；`RevertVersion` 失败不关窗可重试（`confirmLoading`）
- E2E：`version-revert-failure` 首拒窗仍开、画布仍有 REMARK → 重试成功字段消失；定位 `role=dialog`「回滚版本」/ `aria-label=回滚版本`（勿扫 `.ant-*`）
- 文档：design-principles §1 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~`downloadWordTemplate` 静默/JSON blob 假下载~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/version-revert-failure.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/version.spec.ts --project=chromium --grep "可视化 diff" --workers=1 --retries=0`

#### 体验：默认数据源 / WORD 模板假成功

- 选题：逆向导入假成功已收口（`1ca6d59`）；`setDefaultDb` / `updateWordTemplateConfig` 仍本地 mutate，且 `needSave=false` 时 autosave 不触发 → 切默认库 / 上传模板像已生效实未落盘
- `setDefaultDb` / `updateWordTemplateConfig`：仅 `saveProject` code===200 写 store（模板另 toast「WORD模板已更新」）；失败 toast、不写 store；数据源 Radio / 版本页 Select 失败回滚
- 顺手：删 `databaseDomainsSlice` 零挂载 CRUD（仅留 `getDefaultDatabase*` 供默认字段映射）
- E2E：`default-db-failure` 首拒「当前使用」仍第一源 → 重试切到第二源；定位 `role=radio`「设为默认数据源 …」（勿扫 `.ant-*`）
- 文档：design-principles §1 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~版本回滚假成功~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/default-db-failure.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/database-setup-failure.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：逆向导入 setProjectJson / importReverseTable 假成功

- 选题：数据类型字典假成功已收口（`e823bf5`）；逆向选表 `importReverseTable` 与文件导入 `setProjectJson`/`importModuleAndProfile`（含 dataTypeDomains 合并）仍本地 mutate 即「操作/导入成功」，autosave 失败像已导入
- `setProjectJson({persist:true})` / `importReverseTable`：仅 `saveProject` code===200 写 store + 成功 toast；失败 toast、不写 store；覆盖确认窗失败拒关可重试
- ERD/PdMan/DBML 弹层与次屏统一走 `importModuleAndProfile` persist；失败窗/页保持可重传
- E2E：`import-erd-failure` 首拒窗仍开、树无模块 → 重试成功入树；定位 `role=dialog` / `项目菜单` / complementary（勿扫 `.ant-*`）
- 文档：design-principles §1 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~默认数据源 / WORD 模板假成功~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/import-erd-failure.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/import-erd.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：数据类型字典 CRUD 假成功

- 选题：基数假成功已收口（`173c456`）；`dataTypeDomainsSlice` 本地 mutate 即「提交成功」，且设置页 CRUD UI 已在 W4 删掉（零挂载）
- `addDatatype`/`updateDatatype`/`removeDatatype` 支持 `persist:true`；仅 `saveProject` code===200 写 store + 成功 toast；失败 toast、不写 store；清零剪贴板假成功 dead CRUD
- 设置页：`/design/table/setting/dataType` 列表 + Modal 新增/编辑；删确认失败拒关窗；侧栏复用默认字段权限
- E2E：`datatype-domains-failure` 首拒窗仍开、表无新行 → 重试成功入表；定位 `datatype-domains-page` / `role=dialog` / `aria-label`（勿扫 `.ant-*`）
- 文档：design-principles §1 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~逆向导入 `setProjectJson`/`importReverseTable` 假成功~~✅

验证点：
- `cd frontend && npx tsx src/store/project/dataTypeDomainsSlice.test.ts`
- `cd frontend && npx playwright test tests/e2e/datatype-domains-failure.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：画布改边基数假成功

- 选题：连线建关联假成功已收口（`bde9210`）；`updateAssociationRelation` / 基数 Select 仍本地 mutate 即换 chip，autosave 失败像已改基数
- `updateAssociationRelation` 支持 `persist:true`；仅 `saveProject` code===200 写 store；失败 toast、chip/Crow's foot 保持原基数；可再选重试
- E2E：`canvas-cardinality-failure` 首拒仍 `n:1` → 重试成功 `1:1`；定位 `erd-edge-label` / `erd-edge-cardinality` / `role=option`（勿扫 `.ant-*`）；happy `relation` PK/FK 基数路径不变
- 文档：design-principles §1 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~数据类型字典 CRUD 假成功~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/canvas-cardinality-failure.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "表节点视觉：PK/FK" --workers=1 --retries=0`

#### 体验：画布连线建关联假成功

- 选题：Frame 新建/成员假成功已收口（`041af64`）；`addAssociation` / 拖连线仍本地 mutate 即上边，autosave 失败像已建关联
- `addAssociation` 支持 `persist:true`；仅 `saveProject` code===200 写 store；失败 toast、associations 不变（边由 associations 派生 → 不上边）；可再拖重试
- E2E：`canvas-connect-edge-failure` 首拒不上边 → 重试成功；定位 `rfNode` / `data-handleid` / `erd-edge-label`（勿扫 `.ant-*`）；happy `relation` PK/FK 路径不变
- 文档：design-principles §1 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~`updateAssociationRelation` 基数改假成功~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/canvas-connect-edge-failure.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "表节点视觉：PK/FK" --workers=1 --retries=0`

#### 体验：Frame 新建/成员加减假成功

- 选题：Frame 改名/bounds 假成功已收口（`562914d`）；`createFrame` / `addFrameMembers` / `removeFrameMembers` 仍本地 mutate 即 toast，autosave 失败像已建组/已加减成员
- 三路径支持 `persist:true`；仅 `saveProject` code===200 写 store + 成功 toast；失败 toast、store 不变；「加入」Modal 失败 `Promise.reject` 拒关窗；拖表入/出框同构；扩边仅成员落盘成功后执行
- E2E：`canvas-frame-members-failure` 新建首拒不上图、加入首拒成员仍 0 → 重试成功；定位 `role=button`「新建分组」/「加入分组」/ `diagram-frame`（勿扫 `.ant-*`）
- 文档：design-principles §1 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~`addAssociation` 连线假成功~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/canvas-frame-members-failure.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：Frame 改名/bounds 假成功

- 选题：对齐/自动布局假成功已收口（`e18a7bb`）；Frame `renameFrame` / 缩放 /「适应成员」/扩边仍本地 mutate，适应成员还先 toast「已适应成员」
- `renameFrame` / `updateFrameBounds` 支持 `persist:true`；改名仅 save code===200 关编辑态；缩放·适应成员·扩边走 `commitDiagramGeometry` `persist:true`；失败 toast + 草稿保留 / RF 回滚；成功才 toast「已适应成员」
- E2E：`canvas-frame-rename-bounds-failure` 改名首拒草稿保留、适应成员首拒 RF+store 回滚 → 重试成功；定位 `frame-rename-*` / `diagram-frame` / `role=button`「适应成员」（勿扫 `.ant-*`）
- 文档：design-principles §1 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~Frame 新建·成员加减假成功~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/canvas-frame-rename-bounds-failure.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：画布对齐/自动布局假成功

- 选题：拖表坐标假成功已收口（`227c2c0`）；对齐 / 自动布局仍本地 `updateGraphCanvasLayout` 即写 store，autosave 失败像坐标已落盘
- `alignSelected` / `autoLayout` → `commitDiagramGeometry` `persist:true`；仅 `saveProject` code===200 写 store；失败 toast + RF 回滚；成功后才 `fitView`
- E2E：`canvas-align-layout-failure` 左齐/自动布局首拒 transform 回滚 → 重试成功；定位 `align-left` / `aria-label=自动布局` / `rfNode`（勿扫 `.ant-*`）
- 文档：design-principles §1 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~Frame 改名 / Frame bounds（适应成员·缩放）假成功~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/canvas-align-layout-failure.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：画布拖表坐标假成功

- 选题：剪贴/粘贴假成功已收口（`e36fcfc`）；左树改名模型/关系图已 `persist:true`（clean）；画布 `onNodeDragStop` 仍本地 `updateGraphCanvasLayout`/`updateFrameBounds` 即写 store，autosave 失败像坐标已落盘
- `commitDiagramGeometry`：表坐标 + Frame bounds 一次 produce；`persist:true` 仅 `saveProject` code===200 写 store；失败 toast；RF 回滚到 store 坐标可再拖
- E2E：`canvas-drag-reposition-failure` 首拒 transform 回滚 → 重试拖动成功；定位 `rfNode`/`save-status`（勿扫 `.ant-*`）
- 文档：design-principles §1·§5 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~对齐·自动布局~~✅ → Frame 改名 / 缩放 bounds

验证点：
- `cd frontend && npx playwright test tests/e2e/canvas-drag-reposition-failure.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：左树剪切/粘贴假成功

- 选题：画布删边/Frame 假成功已收口（`e23802a`）；左树 `cutEntity`/`pastEntity`/`cutModule`/`pastModule` 仍本地 mutate 即成功 toast（`DataTable` 剪切还叠「剪切成功」），autosave 失败像已剪/已粘；复制仅本地剪贴板无需落盘
- `cut*`/`past*` 支持 `persist:true`；仅 `saveProject` code===200 写剪贴板与移出/写入 + 成功 toast；失败 toast、保留先前状态；左树一律 `persist:true`；去掉多余「剪切成功」
- E2E：`tree-cut-paste-failure` 粘贴首拒无副本/剪切首拒表仍在、无成功 toast → 重试成功；定位 `表操作` aria + menuitem（勿扫 `.ant-*`）
- 文档：design-principles §1·§5 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~改名模型/关系图~~已 clean → ~~拖拽 reposition~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/tree-cut-paste-failure.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：画布删边/删分组假成功

- 选题：左树删模型/图假成功已收口（`b7367b2`）；画布 `removeAssociation` / `removeFrame` 仍本地 mutate 即成功（分组 toast / 边无落盘门闩），autosave 失败像已删
- `removeAssociation` / `removeFrame` 支持 `persist:true`（单/多一次落盘）；仅 `saveProject` code===200 写 store + 成功 toast；确认 `async onOk` 失败 `Promise.reject` 拒关窗可重试（RF Delete / 基数 chip Delete 同构）
- E2E：`canvas-delete-edge-frame-failure` 首拒仍保留边/框+确认窗、无成功 toast → 重试移出；定位 `erd-edge-label` / `diagram-frame` / dialog role（勿扫 `.ant-*`）
- 文档：design-principles §1 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~剪贴粘贴假成功~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/canvas-delete-edge-frame-failure.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/canvas-delete-edge-frame-keyboard.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/diagram-frame.spec.ts --project=chromium --grep "删除分组二次确认" --workers=1 --retries=0`

#### 体验：左树删模型/关系图假成功

- 选题：删表假成功已收口（`a9d0a89`）；左树 `removeModule` / `removeDiagram` 仍本地 mutate 即 toast，autosave 失败像已删
- `removeModule` / `removeDiagram` 支持 `persist:true`；仅 `saveProject` code===200 写 store + 成功 toast；左树确认 `async onOk` 失败 `Promise.reject` 拒关窗可重试
- E2E：`tree-delete-module-diagram-failure` 首拒仍保留树/表+确认窗、无成功 toast → 重试移出；定位 role/aria（勿扫 `.ant-*`）
- 文档：design-principles §1 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~画布删边·分组 Frame~~✅ / 剪贴粘贴假成功

验证点：
- `cd frontend && npx playwright test tests/e2e/tree-delete-module-diagram-failure.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/multi-diagram.spec.ts --project=chromium --grep "左树删除关系图/模型二次确认" --workers=1 --retries=0`

#### 体验：画布/左树删表假成功

- 选题：denseify 剪影已尽（`9472276`）；建模假成功残口：`removeEntity` 本地 mutate 即 toast「表删除成功」，autosave 失败像已删表（字段删已 `persist:true`，表删未对齐）
- `removeEntity` 支持 `persist:true`（单/多 title 一次落盘）；仅 `saveProject` code===200 写 store + 成功 toast；画布 Delete / 左树「删除表」确认 `async onOk` 失败 `Promise.reject` 拒关窗可重试
- E2E：`canvas-delete-table-failure` 首拒仍保留节点+确认窗、无成功 toast → 重试移出；定位 dialog role + `rfNode` / Delete（勿扫 `.ant-*`）
- 文档：design-principles §1 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~左树删模型·删关系图~~✅ / 剪贴粘贴假成功，或画布删边·分组 Frame 假成功

验证点：
- `cd frontend && npx playwright test tests/e2e/canvas-delete-table-failure.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "画布删表/删边二次确认" --workers=1 --retries=0`

#### 体验：空态剪影 compact 碎距

- 选题：量测 Controls/工具栏 panel margin 已 8；空态 CTA/panel/纵节奏/links 已密；Auth logo 48 / 欢迎 pad~20×16 标 diminishing → 优先压画布 `ErdEmptyDiagram` compact 仍 **132**（相对已密 chrome 偏大）
- before：compact 宽 **132**（高≈95）；after：**112**（高≈81）；hero 176 / Auth logo / 欢迎 pad / Controls·工具栏 margin / 边标签 / MiniMap 尺寸 / 版本工具条 / 弹层头身脚不动
- E2E：`relation`「空态构图」锁 svgW≈112∈[96,120]；定位 `testid=erd-empty-diagram` / `canvas-empty-state`（勿扫 `.ant-*`）；截图 `diagram-empty-composition.png`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → densify ROI 趋尽（Auth logo 48 diminishing）或 Vision 刀（假成功残口 / 键盘摩擦）

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "空态构图" --workers=1 --retries=0`

#### 体验：Controls / 工具栏 Panel margin 碎距

- 选题：量测基数 Select **24** / EntityModal 项 mb **12**·控件 **28** 已贴 ADR-0016（锁禁回退）；跳过边标签 / MiniMap 尺寸 / 版本工具条 / 弹层头身脚 → 改压画布 RF panel 余松：Controls + 顶栏工具栏仍 **margin 15**（MiniMap 已 8）
- before：Controls / 工具栏 Panel **margin 15**；after：**margin 8**（对齐 MiniMap）；按钮 22 / surface 不改
- E2E：`relation`「Controls」+「PK/FK」+「实体新建弹层密度」锁 Controls/工具栏 margin ∈[8,12] + 基数 Select 高≤28 + 实体项 mb≤12 / 输入≤28；`demo` Controls margin；定位 role/testid（勿扫 `.ant-*` 业务语义）；截图既有 dense png
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~空态剪影 compact 132~~✅（跳过 Auth logo 48 / 欢迎 pad）

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "Controls：中文|表节点视觉：PK/FK|实体新建弹层密度" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --grep "免登录|/demo" --workers=1 --retries=0`

#### 体验：io-modal / EntityModal 头脚碎距

- 选题：body 已 8×12；量测两族 header **10×14×8** / footer **8×14** 相对 body 偏松；跳过 MiniMap 尺寸 / 边标签 / 版本工具条 / body pad（已密）
- before：header **10×14×8**、footer **8×14**、close top **10**；after：header/footer **8×12**、close top **8**；标题 13/22 · OK≥28 不动；两族对齐
- E2E：`relation`「实体新建弹层密度」+ `dbml-import`「导入弹层密度」+ `dbml-export`「导出弹层密度」锁 header padT/B≤8 · padX≤12 + footer padT≤8 · padX≤12 + OK≥28；dialog role + testid/label/combobox；截图既有 dense png
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~基数 Select / Form mb~~量测已密 / ~~Controls·工具栏 panel margin~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "实体新建弹层密度" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/dbml-import.spec.ts --project=chromium --grep "导入弹层密度" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/dbml-export.spec.ts --project=chromium --grep "导出弹层密度" --workers=1 --retries=0`

#### 体验：EntityModal body 碎距

- 选题：量测 `.erd-entity-modal` body 仍 **12×14**，相对已密 `.erd-io-modal` / 次屏 8–12 族偏松；跳过边标签 / MiniMap 尺寸 / 版本工具条 / Auth/欢迎
- before：body pad **12×14**（padY 合计 24）；after：**8×12**；头脚/表单项 margin12 / 输入·OK 28 不动
- E2E：`relation`「实体新建弹层密度」锁 body padT≤8 / padX≤12 / padY≤16；dialog role「新增表」+ `testid=entity-modal-name`/`ok`；截图 `diagram-entity-modal-dense.png`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~io-modal header·footer~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "实体新建弹层密度" --workers=1 --retries=0`

#### 体验：导入弹层 body 碎距

- 选题：量测边标签 `.erd-edge-label` pad **[4,2]** / font **12**/600 / radius **3** / `EDGE_LABEL_COLLISION_GAP` **4** / chip **40×20** 已贴 ADR-0016 可读下限（再压伤 FK 扫读）；跳过 MiniMap 尺寸 / 版本工具条 / Auth/欢迎 → 改压 `.erd-io-modal` body
- before：body pad **12×14**（padY 合计 24）；after：**8×12**（对齐次屏 / 8–12 族）；头脚/Steps/控件 28 不动；导出弹层同源
- E2E：`dbml-import`「导入弹层密度」+ `dbml-export`「导出弹层密度」锁 body padT≤8 / padX≤12 / padY≤16；dialog role + label/`combobox`；截图 `diagram-import-modal-dense.png` / `diagram-export-modal-dense.png`；`relation` PK/FK chip 既有 densify 不退
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~EntityModal body~~✅ / ~~io-modal header·footer~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/dbml-import.spec.ts --project=chromium --grep "导入弹层密度" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/dbml-export.spec.ts --project=chromium --grep "导出弹层密度" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "表节点视觉：PK/FK" --workers=1 --retries=0`

#### 体验：MiniMap chrome margin 碎距

- 选题：量测 MiniMap **128×96** / pad **0** / sunk 底已贴 ADR-0016 概览下限；RF panel 默认 **margin 15** 相对 8–12 族偏松；勿缩尺寸伤概览；跳过 Controls 按钮/版本工具条/Auth/欢迎
- before：panel margin **15**（底/右偏 15）；after：margin **8**；宽高仍 **128×96**；`getByRole('img', { name: '画布缩略图' })`
- E2E：`relation`「MiniMap」+ `demo` 锁 marginB/R ∈[8,12] + 既有 sunk/尺寸；截图 `diagram-minimap-sunk.png`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~边标签避让~~量测已密 / ~~导入弹层 body~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "MiniMap" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --grep "免登录|/demo" --workers=1 --retries=0`

#### 体验：左树/右键菜单 border-box 实密

- 选题：量测 `.erd-dense-menu` CSS height/lh **28** 已写，但 antd dropdown 项默认 `box-sizing:content-box` + padY **5** → 命中高 **~33**，未贴 ADR-0016 ~28；版本列表工具条控件已 **24** 跳过；勿动 Auth/欢迎/Controls/审批/导出
- before：项计算高 **~33**（height28 + padY5 content-box）；pad-inline 8；after：`border-box` + padY **0** / padX **8**；命中高 **≈28**；menuitem / ArrowDown / Esc 不弱化
- E2E：`model-design-ux`「右键/树操作菜单密度」锁 h∈[26,30] / padY≤2 / border-box + 既有 clip/键盘；截图 `diagram-context-menu-dense.png`；定位 `getByLabel('表操作')` / `getByRole('menuitem')` / `testid=tree-node-menu`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~MiniMap chrome~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/model-design-ux.spec.ts --project=chromium --grep "右键/树操作菜单密度" --workers=1 --retries=0`

#### 体验：表节点底栏 / 空表井 chrome 碎距

- 选题：量测表头 pad **6** / 字段 minH **20** / lh15 / pad1 已贴 ADR-0016 密表下限（再压伤扫读/命中）；底栏「添加字段」margin 8×4 + 空表虚线井 pad **10**/margin **6×8** 仍松；勿动建模 persist / fake-success；跳过 Auth/欢迎/空态 panel/审批/导出（已密）
- before：空表井 pad **10×8** / gap **6** / margin **6×8×8**；添加 margin **2×8×4**；打开表设计 margin **0×8×6** / btn pad **2**（无 minH）；`NODE_FOOTER_H` **32**
- after：空表井 pad **6** / gap **4** / margin **4×6×6**；添加 margin **2×6** + minH **22**；CTA minH **26**；打开表设计 margin **0×6×4** / btn minH **22**；`NODE_FOOTER_H` **28**；表头/字段行锁密不动
- E2E：`relation`「PK/FK」锁底栏 margin/minH + 既有表头/字段；`table-field-empty`「画布空表 CTA」锁井 densify；截图 `diagram-table-node-density.png` / `diagram-table-fields-empty-dense.png`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~左树右键菜单再压~~✅

验证点：
- `cd frontend && npx tsx src/utils/graphLayout.test.ts`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "表节点视觉：PK/FK" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/table-field-empty.spec.ts --project=chromium --grep "画布空表 CTA" --workers=1 --retries=0`

#### 体验：表设计签头 / 内签 gutter 碎距

- 选题：empty-links 已锁；量测 CommonTabs/`--erd-tabs-h` **24** 已密；表设计签头仍 pad 2×10 / gap6，内签 tab marginR **8** 相对子签/CommonTabs gutter 偏松；勿动 Auth logo / 欢迎 pad / 空态 panel 栈
- before：header pad **2×10** / gap **6**；内签 marginR **8**；after：pad **2×8** / gap **4**；marginR/`tabBarGutter` **2**（对齐 CodeTab/DbTab）；`testid=table-design-header` / `table-design-tabs` / `common-tabs`
- E2E：`model-design-ux`「表设计三签」+「表设计内签」锁 padX≤8 / gap≤4 / gutter≤2 + Cmd+1/2/3；截图 `diagram-common-tabs-dense.png`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~画布表节点 chrome~~✅（底栏/空表井）

验证点：
- `cd frontend && npx playwright test tests/e2e/model-design-ux.spec.ts --project=chromium --grep "表设计三签|表设计内签" --workers=1 --retries=0`

#### 体验：画布空态次链区 mt10 锁密

- 选题：纵节奏 title/desc 已锁；量测 Controls chrome → **22×22 / pad0** 已贴 ADR-0016，不再次密；改锁 `.erd-empty-links` mt10；勿动 Auth logo / 欢迎 pad / CTA pad / panel 顶距 / title·desc
- measure：Controls btn **22** + panel/btn pad **0**；links mt **10** 已贴 8–12 族 → CSS 不改；after：E2E 锁 linksMt≈10∈[8,12] + Controls pad0；`testid=canvas-empty-links` / role「导入 DBML」「从数据源逆向」
- E2E：`relation`「空态构图」+「Controls」；截图 `diagram-empty-composition.png` / `diagram-controls-dense.png`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~表设计签头 / CommonTabs 碎距~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "空态构图|Controls：中文" --workers=1 --retries=0`

#### 体验：画布空态纵节奏（title/desc）锁密

- 选题：panel 顶距已密；纵节奏 `.erd-empty-title` mt / `.erd-empty-desc` mb 对照 ADR-0016 8–12 量测；勿动 Auth logo / 欢迎 pad / CTA pad 10×12 / panel 顶距
- measure：title mt **8**、desc mb **12**（历史 16 / 8×18 已在空态次密收过）→ 已贴族，CSS 不改；after：E2E 锁 titleMt≈8∈[6,10]、descMb≈12∈[8,12]、descMt≤8；`testid=canvas-empty-state` / role「新建第一张表」
- E2E：`relation`「空态构图」锁纵节奏 + 既有 panel/CTA pad/hit；截图 `diagram-empty-composition.png`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~Controls 次密或 `.erd-empty-links` mt10~~✅（Controls 已密 → links 锁）

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "空态构图" --workers=1 --retries=0`

#### 体验：画布空态 panel 顶距次密

- 选题：CTA pad 已密；`.erd-empty-panel` 仍 `min(10vh, 88)`，首屏空态顶区偏松；勿动 Auth logo / 欢迎 pad；勿再调 CTA pad 10×12
- before：顶距 **min(10vh, 88)**；after：**min(8vh, 64)**；`testid=canvas-empty-panel` / `canvas-empty-state` / role「新建第一张表」
- E2E：`relation`「空态构图」锁 panel mt ≈ min(8vh,64) 且 ∈[32,64] + 既有 CTA pad/hit；截图 `diagram-empty-composition.png`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~空态纵节奏（title mt8 / desc mb12）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "空态构图" --workers=1 --retries=0`

#### 体验：画布空态 CTA pad 次密

- 选题：notice-row 已密；`.erd-empty-cta` 仍 pad 14×18×12，相对 ADR-0016 8–12 族偏松；勿动 Auth logo 48 / 欢迎 pad；主 CTA hit ~28 不弱化
- before：pad **14×18×12**；after：pad **10×12**；`testid=canvas-empty-state` / role「新建第一张表」
- E2E：`relation`「空态构图」锁 pad ∈[8,12] + btnH ∈[26,28]；截图 `diagram-empty-composition.png`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~`.erd-empty-panel` 顶距 `min(10vh, 88)`~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "空态构图" --workers=1 --retries=0`

#### 体验：公告列表 notice-row gap 次密

- 选题：Cmd+K footer 已密；`/project/notice` `.project-list-page__notice-row` 仍 gap12，相对行 pad 4×8 / ADR-0016 8–12 族偏松；勿再 densify 项目列表工具条
- before：notice-row gap **12**；after：gap **8**；`testid=project-notice-row`
- E2E：`project-notice`「公告列表行密度」锁 gap≤8≥8 + 既有 pad/标题/工具条；截图 `project-notice-list-dense.png`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~画布空态 CTA `.erd-empty-cta` pad~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/project-notice.spec.ts --project=chromium --grep "公告列表行密度" --workers=1 --retries=0`

#### 体验：Cmd+K footer 次密

- 选题：版本空态已密；Cmd+K footer 仍 pad 6×10，相对 `?` 速查 footer 4×8 / ADR-0016 族偏松；勿动 notice；勿弱化 ↑↓/Enter/Esc/Tab trap
- before：`.erd-cmd-footer` pad 6×10；after：pad 4×8 + lh 1.3 + `--erd-font-ui`（对齐 `.erd-help-footer`）
- E2E：`relation`「命令面板」锁 footer padY≤8 / padX≤8 / font≤11 + 快捷提示可见；截图 `diagram-cmd-palette-dense.png`；键盘闭环不回归
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~notice 列表碎片~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "命令面板：Cmd" --workers=1 --retries=0`

#### 体验：版本列表空态井次密

- 选题：设计器侧栏 nav 已密；版本 List 空态仍 pad 16×12，相对工作台列表空态 12×8 / ADR-0016 8–12 族偏松；勿动 Cmd+K / notice；勿弱化「保存第一个版本」CTA
- before：`.ant-list-empty-text` pad 16×12；after：pad 12×8（对齐 `.project-list-page`）；`testid=version-empty` + role 按钮「保存第一个版本」
- E2E：`version`「无数据源也可新增版本」锁 padY≤12 / padX≤8 + 截图 `version-empty-dense.png`；保存后空态消失不回归
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~Cmd+K footer~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/version.spec.ts --project=chromium --grep "无数据源也可新增版本" --workers=1 --retries=0`

#### 体验：设计器侧栏 nav 行距次密

- 选题：Auth logo 48 ROI 低跳过；版本/导入/导出/设置侧栏 Menu 仍 antd 默认 ~40 + 松 pad，相对 Group 侧栏 28·12 / ADR-0016 8–12 族偏松；勿弱化命中/键盘
- before：项高 ~40 + 默认 pad≈24；after：项高 28 / padX 12 / marginY 2 / 字 12；`testid=design-layout-sider-menu` + `aria-label=设计器侧栏导航`
- E2E：`layout-outlet`「顶栏动作与子路由出口」锁 densify + 侧栏 menuitem/link focus+Enter；截图 `design-sider-nav-dense.png`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~版本空态 pad 16×12~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/layout-outlet.spec.ts --project=chromium --grep "顶栏动作与子路由出口" --workers=1 --retries=0`

#### 体验：AuthBrandShell 表单 body 碎距

- 选题：门头/gap 已 12；表单 Title 仍 mt10、Form 项 antd 默认 mb≈24、登录 `size=large`≈40，相对 ADR-0016 / `.setting-common-form` 偏松；勿改 pad 20×16 / 门头 mb12 / brand gap12 / Skip·Tab
- before：Title mt10 + 项 mb≈24 + Input/钮 large≈40；after：Title mt6 + `.auth-shell-form` 项 mb12 / Input·钮 28 / label 12；`testid=auth-shell-form`
- E2E：`smoke`「登录页渲染」+ `session`「去注册」+「登录壳键盘」+「注册壳键盘」锁 Title mt≤8 / 项 mb∈[8,16] / 控件 ∈[24,32]
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~设计器侧栏 nav 行距~~✅（跳过 Auth logo 48）

验证点：
- `cd frontend && npx playwright test tests/e2e/smoke.spec.ts --project=chromium --grep "登录页渲染" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/session.spec.ts --project=chromium --grep "去注册|登录壳键盘|注册壳键盘" --workers=1 --retries=0`

#### 体验：AuthBrandShell 门头/brand gap 三压

- 选题：品牌/表单井已 20×16；门头仍 mb16、品牌栈 gap14，相对 ADR-0016 / 8–12 族偏松；勿改 pad 井 / 品牌字号·色·层次 / Skip·Tab
- before：门头 mb16 + brand gap14；after：门头 mb12 + brand gap12；pad 20×16 / thumb / 字号 / 渐变 / ~40% 不动；`testid=auth-form-header`
- E2E：`smoke`「登录页渲染」+ `session`「去注册」+「登录壳键盘」锁 gap∈[8,12] / 门头 mb∈[8,12]；`share` 失效门同源 densify
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~AuthBrandShell 表单 Title mt10 / Form 项 antd 默认 mb~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/smoke.spec.ts --project=chromium --grep "登录页渲染" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/session.spec.ts --project=chromium --grep "去注册|登录壳键盘" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/share.spec.ts --project=chromium --grep "无效 token" --workers=1 --retries=0`

#### 体验：AuthBrandShell 品牌/表单井碎距二压

- 选题：欢迎空态内井已 20×16；`AuthBrandShell` 品牌/表单仍 pad32，相对 ADR-0016 / 欢迎井 / 壳 content 12×16 偏松；勿弱化品牌字号/~40%/Skip·Tab
- before：品牌 pad 32×28 + 表单 pad 32；after：品牌/表单 pad 20×16（窄屏同阶）；gap14 / 门头 mb16 / thumb / 字号 / 渐变不动；`testid=auth-form-panel`
- E2E：`smoke`「登录页渲染」+ `share` 失效门 + `session`「去注册」锁 padY≤20 / padX≤16；`session` 登录壳键盘回归
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~AuthBrandShell 门头 mb16 / brand gap14 三压~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/smoke.spec.ts --project=chromium --grep "登录页渲染" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/share.spec.ts --project=chromium --grep "无效 token" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/session.spec.ts --project=chromium --grep "去注册|登录壳键盘" --workers=1 --retries=0`

#### 体验：欢迎空态内井碎距

- 选题：标题已 18/mt12；`.erd-welcome-empty__inner` 仍 pad 32×24，相对 ADR-0016 / 壳井 8–12·content 12×16 偏松；勿压成画布空态 14/18
- before：内井 pad 32×24；after：20×16；标题字号/mt/lh / hero / 逆向链 / 左树「新增模型」不动；`testid=designer-welcome-empty-inner`
- E2E：`model-design-ux`「欢迎空态次密距」锁 padY≤20 / padX≤16 + 标题碎距 + 截图 `diagram-welcome-empty-dense.png`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~AuthBrandShell 品牌/表单 pad32 二压（对齐 20 井）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/model-design-ux.spec.ts --project=chromium --grep "欢迎空态次密距" --workers=1 --retries=0`

#### 体验：欢迎空态标题碎距

- 选题：欢迎空态内井已次密；标题仍 20/mt14·lh≈26，相对 ADR-0016 / 8–12 / page-title 13/22 族偏松；勿压成画布空态 14
- before：标题 20 / mt14 / lh≈26；after：18 / mt12 / lh22；pad / hero / 逆向链 / 左树「新增模型」不动
- E2E：`model-design-ux`「欢迎空态次密距」锁 titleMt∈[8,12]、字∈[16,18]、lh≈22 + 截图 `diagram-welcome-empty-dense.png`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~欢迎空态内井 pad32~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/model-design-ux.spec.ts --project=chromium --grep "欢迎空态次密距" --workers=1 --retries=0`

#### 体验：Group 基本设置删区碎片

- 选题：Form 已 12/28；删区仍 antd `Divider` 默认 mt/mb≈24 + `Space` 叠标题 mb8 + `Typography.Text` 14，相对 ADR-0016 / 8–12 族偏松
- before：Divider≈24、Space 叠标题 mb、次文≈14/22；after：Divider 12、body gap8、标题 mb0、次文 12/18；`testid=basic-setting-delete-zone`；确认弹层/删钮 aria 行为不改
- E2E：`group-basic-setting` 删区 densify + 截图 `group-basic-setting-dense.png`；`group-project-delete-keyboard` / `group-layout-nav` 回归
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~欢迎空态标题 mt20 / 22 字碎距~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/group-basic-setting.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/group-project-delete-keyboard.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/group-layout-nav.spec.ts --project=chromium --grep "返回项目列表" --workers=1 --retries=0`

#### 体验：Group 基本设置 Form 项/控件碎距

- 选题：页头已 13/22；`BasicSetting` Form 仍 antd 默认项 mb24 / 控件 32，相对 ADR-0016 / `.setting-common-form` 偏松
- before：表单项 mb≈24、Input/Select/钮高≈32、label 默认 14；after：`.basic-setting-form` 项 mb12、Input/Select minH·钮 28、label 12/padB2、textarea pad 6×8；页头不动；键盘/保存 toast 不弱化
- E2E：`group-basic-setting` 表单 densify + 截图 `group-basic-setting-dense.png`；`group-layout-nav` / `group-keyboard` 回归
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~Group 基本设置删区碎片（Divider/Space/次文）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/group-basic-setting.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/group-layout-nav.spec.ts --project=chromium --grep "返回项目列表" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/group-keyboard.spec.ts --project=chromium --grep "Group 键盘" --workers=1 --retries=0`

#### 体验：Group 基本设置页头碎距

- 选题：用户组页头已 13/22；`BasicSetting` 仍 `Title level={4}`，相对 ADR-0016 / `.group-setting-page` 偏松
- before：页头「基本设置」20/28（antd Title mt≈27·mb10）；同文件「删除项目」同级 Title4；after：h2 13/22·mt0·mb8；删区标题同阶以免反超页头；`testid=basic-setting-page`；键盘/保存 toast 不弱化
- E2E：`group-basic-setting` 页头 densify + 截图 `group-basic-setting-dense.png`；`group-layout-nav` / `group-keyboard` 回归
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~Group 基本设置 Form 项间距/控件 28~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/group-basic-setting.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/group-layout-nav.spec.ts --project=chromium --grep "返回项目列表" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/group-keyboard.spec.ts --project=chromium --grep "Group 键盘" --workers=1 --retries=0`

#### 体验：Group 用户组 Title/左角色签碎距

- 选题：团队成员工具条已 28；`GroupSetting` 仍 `Title level={4}` + `Space large` + `<br>` + 左 Tabs padX24·高38，相对项目列表 13/22·28 / 8–12 族偏松
- before：标题 20/28（mt≈27·mb10）、Space large gap24 + br、左签 padX24·高38·字14；after：标题 13/22·mb8、去掉 Space/br、左签 padX12·高28·字12；`testid=group-setting-page` / `group-setting-role-tabs`；键盘不弱化
- E2E：`group-layout-nav` 页头/左签 densify + 截图 `group-setting-page-dense.png`；`group-keyboard` / `add-user-keyboard` 回归
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~Group 基本设置 Title level4~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/group-layout-nav.spec.ts --project=chromium --grep "权限组：角色与用户组成员" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/group-keyboard.spec.ts --project=chromium --grep "Group 键盘" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/add-user-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：团队成员工具条碎距

- 选题：项目列表工具条已 28；`GroupUser` 仍 `marginBottom:16` + Search 默认 32，相对 8–12 / 22–28 族偏松
- before：工具条 mb16、Search affix 32、工具条高 ~34、钮 padX ~15（antd 默认）、Space 默认 small；after：mb8、Search/钮/工具条 28、Space `size={8}` + CSS gap 8、钮 padX 8；`data-testid=group-user-toolbar`；命中/键盘不弱化
- E2E：`group-layout-nav` 工具条 densify + 截图 `group-user-toolbar-dense.png`；`group-keyboard` / `add-user-keyboard` 回归
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~Group 用户组 Title/页签碎距~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/group-layout-nav.spec.ts --project=chromium --grep "权限组：角色与用户组成员" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/group-keyboard.spec.ts --project=chromium --grep "Group 键盘" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/add-user-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：项目列表工具条碎距

- 选题：行 pad 已 4×8 / 打开钮 28；工具条 Search 仍 antd 默认高 32（撑工具条 34），相对 22–28 chrome / 8–12 族偏松；Space 显式锁 8
- before：Search affix 32、工具条高 34、钮 padX 12、Space 默认 small；after：Search/钮/工具条 28、Space `size={8}` + CSS gap 8、钮 padX 8；`data-testid=project-list-toolbar`；命中/键盘不弱化
- E2E：`project-surface` 工具条高 ≤32 + Search ≤28 + Space gap∈[8,12] + 截图；`project-list-keyboard` 回归
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~团队成员工具条碎距~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/project-surface.spec.ts --project=chromium --grep "列表行密度|团队项目列表行密度" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/project-list-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：Group 侧栏 nav 行距次密

- 选题：Home 水平 Menu 已 padX12；Group 侧栏 inline Menu 仍高 40 / padL24·padR16 / marginY4 / 字 14（antd 默认），相对账号左栏 28·12 与 8–12 族偏松
- before：项高 40、padX 24/16、marginY 4、字 14；after：项高 28、padX 12、marginY 2、字 12（8–12 / 22–28 族）；`data-testid=group-layout-sider-menu` + `aria-label=团队设置导航`；命中 ≥28 / Skip·`group-keyboard` 不弱化
- E2E：`layout-outlet` Group 侧栏 padX∈[8,12] + h∈[28,32] + 截图 `group-sider-nav-dense.png`；`group-keyboard` 回归
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~项目列表工具条碎距~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/layout-outlet.spec.ts --project=chromium --grep "GroupLayout：/project/group" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/group-keyboard.spec.ts --project=chromium --grep "Group 键盘" --workers=1 --retries=0`

#### 体验：Home 水平导航 Menu 项次密

- 选题：顶栏 header 已 padX16 / brand–nav gap12；`.home-layout__menu` 水平项仍 padX16（antd 默认族），相对 8–12 族偏松
- before：Menu 项 `padding-inline: 16px`；after：`12px`（8–12 族）；项高仍 64；`data-testid=home-layout-menu` + `aria-label=主导航`；命中宽 ≥44 / Skip·键盘不弱化
- E2E：`layout-outlet` Menu 项 padX∈[8,12] + h=64 + 截图 `home-nav-menu-dense.png`；`home-keyboard` 回归
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~Group 侧栏 nav 行距~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/layout-outlet.spec.ts --project=chromium --grep "HomeLayout：/home" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/home-keyboard.spec.ts --project=chromium --grep "Home 键盘" --workers=1 --retries=0`

#### 体验：顶栏 `erd-chrome-header` pad / brand–nav 次密

- 选题：actions 已 gap12；顶栏仍 padX20 + brand–nav gap16，相对壳外井 12×16 / brand 内 gap8 偏松
- before：header `padding: 0 20px`、`gap: 16px`（Home 覆写同 20；Group 右井 20）；after：`padding: 0 16px`、`gap: 12px`（8–12 / 12×16 族）；Home/Group 覆写对齐；Design 仍 gap8 / 右 16；`data-testid=erd-chrome-header`；顶栏 64 / Skip / 用户菜单不弱化
- E2E：`layout-outlet` Home padX≤16 + gap∈[8,12] + Design ≤8 + 截图 `chrome-header-dense.png`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~Home 水平导航 Menu 项水平松距~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/layout-outlet.spec.ts --project=chromium --grep "HomeLayout：/home|三壳同语言|DesignLayout：顶栏动作" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/home-keyboard.spec.ts --project=chromium --grep "Home 键盘" --workers=1 --retries=0`

#### 体验：顶栏 `erd-chrome-actions` 次密

- 选题：BaseView 列 gap 已 16；Home/Group/分享顶栏 `.erd-chrome-actions` 仍 gap16，相对 header brand gap8 / Design 覆写 gap8 偏松
- before：actions `gap: 16px`；after：`gap: 12px`（8–12 族）；DesignLayout 仍覆写 8；`data-testid=erd-chrome-actions`；顶栏 64 / 用户菜单 / Skip 不弱化
- E2E：`layout-outlet` Home gap≤12 + Design ≤8 + 截图 `chrome-actions-dense.png`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~顶栏 header pad 20 / brand–nav gap16~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/layout-outlet.spec.ts --project=chromium --grep "HomeLayout：/home|DesignLayout：顶栏动作" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/home-keyboard.spec.ts --project=chromium --grep "Home 键盘" --workers=1 --retries=0`

#### 体验：账号 BaseView 左右列次密

- 选题：工作台壳外井已 12×16；账号基本资料 `.baseView` 表单/头像列仍 gap24，与壳次密不同阶
- `BaseView`：桌面 gap 24→16、窄屏 16→12；`data-testid=account-settings-base-view`；表单项 12 / 控件 28 不改
- E2E：`account-settings` densify 断言 gap≤16 + 截图 `account-settings-page-dense.png`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~顶栏 `erd-chrome-actions` gap16~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/account-settings.spec.ts --project=chromium --grep "页密度" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/account-settings-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：工作台壳（Home/Group）外井次密

- 选题：页内 `.project-list-page` / setting / database 已 pad 8×12；HomeLayout shell 24×24 + body 20×24、GroupLayout content/body 24/20 仍叠双松井，覆盖 Home/项目列表/账号/数据源/公告/团队设置全工作台
- `HomeLayout`：shell 12×16×10、body 12×16、footer 10×6；`GroupLayout`：content/body 12×16；列表空态 pad 12×8；禁 24/20 外井
- E2E：`layout-outlet` Home/个人项目 + Group 基本设置 densify + 截图 `workspace-shell-dense.png` / `group-shell-dense.png`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~账号 BaseView 左右 gap24~~✅ / 顶栏 actions gap16（视 ROI）

验证点：
- `cd frontend && npx playwright test tests/e2e/layout-outlet.spec.ts --project=chromium --grep "HomeLayout：/home|GroupLayout：/project/group" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/home-keyboard.spec.ts tests/e2e/group-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：默认字段落盘失败可重试

- 选题：默认字段 JExcel / 弹窗 HotTable `updateDefaultFields` 本地 mutate 即 debounce toast「默认字段已更新」；autosave 失败像已改模板；死代码 `moveField` / `addDefaultFields` / `removeDefaultFields` 零引用且本地 mutate 即成功
- `updateDefaultFields` 支持 `persist:true`；设置页与默认项弹窗队列 latest-wins，仅 code===200 写 store + 成功 toast；失败 toast + `sheetEpoch` 重挂回滚；`aria-busy`
- 清死代码：实体 `moveField`（行序改动已由 JExcel `onmoverow` → `updateEntityFields` persist 覆盖）；profile `addDefaultFields` / `removeDefaultFields`
- E2E：`default-field-failure.spec.ts` mock save → toast + 回滚 `id` → 重试成功 + 新表带重命名默认字段
- 文档：regression-checklist / control-matrix / design-principles / ui-layout-redesign；下一刀 → ~~工作台壳外井 densify~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/default-field-failure.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/default-field.spec.ts --project=chromium --workers=1 --retries=0 --grep "编辑保存有 toast"`

#### 体验：表设计索引签落盘失败可重试

- 选题：索引签 `updateEntityIndex`（空态添加 / JExcel 改名·字段·唯一 / 再加一行 / 删除）本地 mutate 即 toast「索引更新成功」；autosave 失败像已改索引
- `updateEntityIndex` 支持 `persist:true`；`TableIndexEdit` 全路径 await save；仅 code===200 写 store + 成功 toast；失败 toast + 空态保留或 `sheetEpoch` 重挂回滚；删索引确认失败拒关窗；`aria-busy`
- E2E：`jexcel-index-failure.spec.ts` mock save（添加 / 勾是否唯一）→ toast + 回滚 → 重试成功 + 画布 UK
- 文档：regression-checklist / control-matrix / design-principles / ui-layout-redesign；下一刀 → ~~默认字段假成功~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/jexcel-index-failure.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --workers=1 --retries=0 --grep "索引签空态 CTA|索引签再加一行|索引签删除二次确认|字段级 unique"`
- `cd frontend && npx playwright test tests/e2e/table-index-delete-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：表设计 JExcel 字段 meta 落盘失败可重试

- 选题：表设计字段签 JExcel（类型/PK/NN/AI/隐藏等）`updateEntityFields` 无 persist 本地 mutate 即成功；autosave 失败像已改 meta
- `TableInfoEdit`：`afterChange` / 空态「添加第一个字段」走 `persist:true`；仅 code===200 写 store；失败 toast + `sheetEpoch` 重挂网格回滚草稿；落盘队列 latest-wins；`aria-busy`
- E2E：`jexcel-field-meta-failure.spec.ts` mock save（PK / 隐藏）→ toast + 勾选回滚 → 重试成功 + 画布对齐
- 文档：regression-checklist / control-matrix / design-principles / ui-layout-redesign；下一刀 → ~~表设计索引签 JExcel 假成功~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/jexcel-field-meta-failure.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --workers=1 --retries=0 --grep "JExcel 工具栏删除二次确认|半成品行不静默丢字段"`
- `cd frontend && npx playwright test tests/e2e/table-field-empty.spec.ts --project=chromium --workers=1 --retries=0 --grep "表设计字段签空态"`

#### 体验：画布字段 meta（类型/PK/隐藏）落盘失败可重试

- 选题：编辑态类型/PK/非空/自增/隐藏与浏览态 PK 本地 mutate 即成功；autosave 失败像已改 meta/已隐藏
- `persistFieldMeta` / `persistHideOnCanvas` / `unhideOnCanvas` / `togglePk`：`updateEntityFields` `persist:true`；仅 code===200 写 store；编辑态乐观草稿失败回滚；隐藏失败不退出编辑、不 toast「已隐藏」；落盘中禁二次改 meta
- E2E：`canvas-field-meta-failure.spec.ts` mock save → toast + 回滚/行仍在 → 重试成功
- 文档：regression-checklist / control-matrix / design-principles / ui-layout-redesign；下一刀 → ~~表设计 JExcel 字段 meta 假成功~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/canvas-field-meta-failure.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --workers=1 --retries=0 --grep "编辑态 PK 勾选即时|编辑态隐藏|PK 徽标可取消"`

#### 文档：生产 UI `app.erdonline.com` 与 API 对齐说明

- 选题：正式登录页在 `https://app.erdonline.com/auth/login`；`ERD_UI_URL` 示例仍只写 `erdonline-demo.pages.dev`，易把 CORS/前端 API 指错
- `docs/deployment.md`：`ERD_UI_URL` 示例改为生产 `https://app.erdonline.com`（demo 表面保留 pages.dev）；新增「UI Origin vs Railway API」对照；强调勿把 `API_URL`/`ERD_API_URL`/`DEMO_API_URL` 设成 UI 域名

验证点：
- 文档表：`ERD_UI_URL=https://app.erdonline.com`；前端 `DEMO_API_URL`/`API_URL` = Railway 公网根（手工对照即可）

#### 体验：画布字段改名/删字段落盘失败可重试

- 选题：既有字段行内改名 / `removeField` 本地 mutate 即退出编辑或移出行；autosave 失败像已改名/已删
- `TableNode` 既有字段 `commit` 与新建同构：`updateEntityFields` `persist:true`；仅 code===200 退出编辑；失败草稿保留；落盘中禁 Escape/二次提交
- 删字段：二次确认保留；`onOk` 先 persist，仅成功关窗移出；失败 toast + Promise.reject 窗仍开可再点「删除」
- E2E：`canvas-field-rename-delete-failure.spec.ts` mock save → toast + 仍编辑/行仍在 → 重试成功
- 文档：regression-checklist / control-matrix / design-principles / ui-layout-redesign；下一刀 → ~~字段 meta（类型/PK/隐藏）即时伪造成功~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/canvas-field-rename-delete-failure.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --workers=1 --retries=0 --grep "字段 ✎ 可改名|删除字段：按钮二次确认"`

#### 体验：画布建表/行内加字段落盘失败可重试

- 选题：画布 `addEntity` / 行内 `__NEW__` 加字段无 persist 本地 mutate 即成功；autosave 失败像已建表/加字段
- `createFirstTable`：`addEntity` `persist:true`；仅 code===200 上图 +「表添加成功」；失败 toast、不写 store、按钮可重试
- `updateEntityFields` 支持 `persist:true`；`TableNode` 新建字段仅 save 成功退出编辑；失败草稿保留；落盘中禁 Escape/二次提交；空名 toast / 空字段 CTA 保留
- E2E：`canvas-create-field-failure.spec.ts` mock save → toast + 无节点/仍编辑 → 重试成功
- 文档：regression-checklist / control-matrix / design-principles / ui-layout-redesign；下一刀 → ~~字段改名/删字段伪造成功~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/canvas-create-field-failure.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --workers=1 --retries=0 --grep "工具栏新建表|字段 ✎ 可改名"`
- `cd frontend && npx playwright test tests/e2e/table-field-empty.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：画布表头改名落盘失败不退出编辑

- 选题：画布表头 `renameEntity`（无 persist）本地 mutate 即退出编辑；autosave 失败像已改名；且 `persist:true` 路径误把 store 形 `applyRename` 套在 project draft 上导致改名抛错
- `renameEntity` persist：`applyRename({ project: draft })`；`TableNode` commitHeader 仅 code===200 退出编辑；失败 toast 可读、草稿保留；落盘中禁重复提交 / Escape
- E2E：`table-rename-failure.spec.ts` mock save（entities 含新表名）→ toast + 编辑态仍开（`data-id` 仍旧）→ 重试成功改节点 id
- 文档：regression-checklist / control-matrix / design-principles / ui-layout-redesign；下一刀 → ~~画布建表/字段行内伪造成功~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/table-rename-failure.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --workers=1 --retries=0 --grep "表头 ✎ 可改名"`

#### 体验：画布关系图弹层落盘失败不关窗

- 选题：画布「新建/重命名关系图」本地 `createDiagram`/`renameDiagram`（无 persist）即关窗；autosave 失败像已建图
- `ReactFlowRelation` diagram Modal：`persist:true`；仅 `saveProject` code===200 关窗（创建成功 toast「已新建关系图」）；失败 toast 可读、不关窗；`confirmLoading`
- E2E：`diagram-modal-failure.spec.ts` mock save（diagrams 含新图名）→ toast + 窗仍开 → 重试成功关窗 + switcher
- 文档：regression-checklist / control-matrix / design-principles / ui-layout-redesign；下一刀 → ~~画布表头改名伪造成功~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/diagram-modal-failure.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：EntityModal 落盘失败不关窗

- 选题：模块树 EntityModal 本地 mutate 即 toast「模型添加成功」并无条件关窗；autosave 失败像已保存
- `projectAutosave`：抽出防抖序号；`persistProjectNow` / `ackManualPersist` 供手动先 Save
- `addModule`/`renameModule`/`addEntity`/`renameEntity`/`createDiagram`/`renameDiagram`：`persist:true` 时先 `saveProject`（仅 code===200）再写 store + 成功 toast；失败不写 store
- `DataTable` EntityModal：一律 `persist:true`；仅成功关窗；`confirmLoading`
- E2E：`entity-modal-failure.spec.ts` mock save → toast + 窗仍开 → 重试成功；键盘 `entity-modal-keyboard` 不回归
- 文档：regression-checklist / control-matrix / design-principles / ui-layout-redesign；下一刀 → ~~画布 diagram modal 同构~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/entity-modal-failure.spec.ts tests/e2e/entity-modal-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：数据源设置确定失败不关窗

- 选题：`DatabaseSetUp`「确定」无条件 toast「保存成功！」且不落盘右侧表单；失焦才写、失败仍像已保存
- `updateDbs`/`addDbs`/`removeDbs`：返回 `Promise<boolean>`；仅 API 成功为 true；业务失败靠 `request` toast、禁叠弹
- `DatabaseSetUp`：确定校验后 `updateDbs` 刷盘；仅成功 toast「保存成功！」+ 关窗；`loading`；无数据源则静默关窗
- E2E：`database-setup-failure.spec.ts` mock PUT `dataSources` → toast + 窗仍开 → 重试成功关窗
- 文档：regression-checklist / control-matrix / design-principles / ui-layout-redesign；下一刀 → EntityModal/模块树本地成功 vs autosave、或 densify ROI

验证点：
- `cd frontend && npx playwright test tests/e2e/database-setup-failure.spec.ts tests/e2e/database-setup-keyboard.spec.ts tests/e2e/database-setup-delete-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：默认项设置失败不关窗

- 选题：`updateProfile` 仅本地改 profile 即 toast「设置成功」；`DefaultSetUp` 无条件关窗，落库失败像已设置
- `updateProfile`：先 `saveProject`，仅 `code===200` 写 store；失败靠 `request` toast、兜底「设置失败」、不写 store
- dialog / 设置页 `DefaultSetUp`：仅成功才 toast「设置成功」；dialog 成功才关窗 + `confirmLoading`；键盘闭环不变
- E2E：`default-setup-failure.spec.ts` mock `project/save`（sqlConfig 标记）→ toast + 窗仍开 → 重试成功关窗
- 文档：regression-checklist / control-matrix / design-principles / ui-layout-redesign；下一刀 → ~~数据源设置确定伪造成功~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/default-setup-failure.spec.ts tests/e2e/default-setup-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：同步配置失败不关窗

- 选题：`setUpgradeType` 仅本地改 `upgradeType` 即 toast「设置成功」；`SyncConfig` 无条件关窗，落库失败像已设置
- `setUpgradeType`：先 `saveProject`，仅 `code===200` 写 store；失败靠 `request` toast、兜底「设置失败」、不写 store
- `SyncConfig`：仅成功才 toast「设置成功」+ 关窗；`confirmLoading`；键盘闭环不变
- E2E：`sync-config-failure.spec.ts` mock `project/save`（rebuild）→ toast + 窗仍开 → 重试成功关窗
- 文档：regression-checklist / control-matrix / design-principles / ui-layout-redesign；下一刀 → ~~DefaultSetUp 伪造成功~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/sync-config-failure.spec.ts tests/e2e/version-sync-rebuild-keyboard.spec.ts --project=chromium --workers=1 --retries=0 --grep "同步配置"`

#### 体验：修改密码失败不关窗

- 选题：`ResetPassword` 接口非 200 仍 `setOpen(false)`，漏 toast 时像改密成功
- `ResetPassword`：仅 `code===200` 关窗+成功 toast；失败靠 `request` toast、兜底「更新密码失败」、不关窗可重试；`confirmLoading`；键盘闭环不变
- E2E：`reset-password-failure.spec.ts` mock update → toast + 窗仍开 → 重试成功关窗
- 文档：regression-checklist / control-matrix / design-principles / ui-layout-redesign；下一刀 → ~~SyncConfig 伪造成功~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/reset-password-failure.spec.ts tests/e2e/reset-password-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：只读分享创建失败可重试

- 选题：创建失败后主钮 `disabled`（无 URL），关窗重开才能再试；业务失败再叠 toast
- `ShareProjectButton`：失败靠 `request` toast、不叠弹；空链时主钮「重新生成」可重试；吊销失败不叠弹不关窗
- E2E：`share-create-failure.spec.ts` mock create → toast + 空链 +「重新生成」→ 成功出 `/s/` +「复制链接」
- 文档：regression-checklist / control-matrix / design-principles / ui-layout-redesign；下一刀 → ~~修改密码失败静默关窗~~✅ / SyncConfig 伪造成功

验证点：
- `cd frontend && npx playwright test tests/e2e/share-create-failure.spec.ts --project=chromium --workers=1 --retries=0`

#### 配置：Origin 单一 `ERD_UI_URL`（去嵌套别名）

- 选题：prod `SOCKETIO_ORIGIN`⇄`ERD_UI_URL` 互套 + `CORS_ALLOWED_ORIGINS` 第三入口，与 MYSQL*/REDIS*「一关注一点」不一致
- `application-prod.yml`：`martin.socketio.origin` / `martin.ui.url` 均 `${ERD_UI_URL}`（无默认、无 `${A:${B}}`）
- `CrossOriginPolicy`：HTTP CORS 只读 `martin.ui.url`；删 `CORS_ALLOWED_ORIGINS`/`SOCKETIO_ORIGIN` 兼容路径；prod 文案指向 `ERD_UI_URL`
- 单测：`OriginBindingTest` / `CrossOriginPolicyTest` 对齐
- 文档：deployment / security-model R-CFG-04 / `.env.example` / regression-checklist；禁写「三者任一」

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Dtest=OriginBindingTest,CrossOriginPolicyTest test`

#### 体验：版本保存/重建失败不伪装成功

- 选题：`initSave` 用 `if (res)` 真值判断，业务失败仍弹「重建基线成功」并 `dropVersionTable`/rebaseline；`InitVersion` 先关窗再存；dbsync 失败「正在同步」死态
- `initSave`：仅 `code===200` 成功；失败靠 `request` toast、不叠弹；刷新列表便于重试；禁失败 rebaseline
- `InitVersion`：成功才关窗；失败可重试
- dbsync：`synchronous` 走 zustand `set`；失败清同步中态，可再点同步
- E2E：`version-save-failure.spec.ts` mock `hisProject/save` → 初始化不关窗可重试；重建无「重建基线成功」且无 rebaseline
- 文档：regression-checklist / control-matrix / design-principles；下一刀 → ~~只读分享创建失败死 affordance~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/version-save-failure.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：添加成员邀请失败不关窗

- 选题：协作邀请路径 `AddUser` 非 200 仍 `setOpen(false)`，toast 易漏时像邀请成功；ROI 高于 densify（版本/分享/DDL 已有失败反馈）
- `AddUser`：失败不关窗；业务/网络已由 `request` toast，禁叠弹；成功才关窗+「保存成功」
- E2E：`add-user-invite-failure.spec.ts` mock 业务码 → toast「模拟邀请拒绝」+ dialog 仍开 → 重试成功关窗
- 文档：regression-checklist / control-matrix / design-principles；下一刀 → ~~dbsync / 版本保存边缘静默失败~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/add-user-invite-failure.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：逆向解析失败可读 + 重试

- 选题：`dbReverseParse` toast 用 `'' + res` → `[object Object]`；Step2 仅「解析失败」无详情/CTA；与 autosave 重试模式断档
- `profileSlice`：`reverseParseErrorText`；失败写 `errorMessage` + `lastReverseParse`；`retryDbReverseParse`；禁叠弹（业务/网络已由 `request` toast）
- `ReverseParseStep`：失败态「数据库解析失败」+ 详情 +「重新解析」；挂次屏页与菜单 Modal；成功才显「提交」
- E2E：`reverse-parse-failure.spec.ts` mock 业务码 → 可读 toast / 无 `[object Object]` → 重试出实体表；payload 仍含 `dataSourceId`、无 password/url
- 文档：regression-checklist / control-matrix / design-principles；下一刀 → ~~添加成员邀请失败静默关窗~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/reverse-parse-failure.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：自动保存失败可重试（建模回路）

- 选题：densify ROI 已 flatten；checklist「保存失败」仍手工且顶栏失败态无 CTA；断网时 errorHandler + 兜底 toast 叠弹
- `useProjectStore`：抽出 `persistAutosave` / 导出 `retryAutosave`；catch 不再重复 toast（网络/HTTP 已由 `request` errorHandler）
- `SaveStatus`：失败态按钮「保存失败，点击重试」（对齐 design-principles）；`aria-label` + focus-visible
- E2E：`save-failure.spec.ts` 断网单 toast + 重试落库；业务码失败 toast + 重试
- 文档：regression-checklist / control-matrix；下一刀 → ~~逆向解析失败文案 `[object Object]` / 失败页重试~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/save-failure.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "save-status：aria-live" --workers=1 --retries=0`

#### 体验：快捷键速查卡（`?`）密度

- 选题：Cmd+K empty/list 已密；`?` 速查仍 list pad 6×8 + row padY 10 / gap 12 + maxH 420，与命令面板 / 22 chrome 不同阶
- `shortcut-help.scss`：header 6×10 · list 2×4 · row pad 3×4 / gap 8 · footer 4×8 · maxH 360；关闭钮 focus-visible；禁 6×8 井 + padY 10
- E2E：`relation`「快捷键速查」densify + 截图 `diagram-shortcut-help-dense.png`；Esc / 关闭钮可焦 / 与 Cmd+K 互斥不弱化
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~建模静默失败 / CTA 不清~~✅（自动保存失败可重试）

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "快捷键速查" --workers=1 --retries=0`

#### 体验：Cmd+K 无匹配空态 / list 井次密

- 选题：导入 Steps 已对齐；命令面板无匹配「无匹配结果」仍 16×12 空井 + list pad 4，与行 pad 6/8 / 22 chrome 不同阶
- `command-palette.scss`：`.erd-cmd-empty` pad 8×8 · gap 2；`.erd-cmd-list` pad 2；禁 16×12 / 4
- E2E：`relation`「命令面板」empty/list densify + 截图 `diagram-cmd-palette-dense.png`；Trap / ↑↓ / aria-activedescendant / Esc 归还不弱化
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~快捷键速查卡密度~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "命令面板" --workers=1 --retries=0`

#### 体验：导入弹层 Steps 与次屏对齐

- 选题：次屏 Steps 已 ≤10/12；菜单逆向/导出 DDL 弹层 `.erd-io-modal__steps` 仅 mb12、标题默认字号，与次屏断裂；ROI 高于 Cmd+K empty（少见路径）
- `io-modal.scss`：`.erd-io-modal__steps` mt0/mb10 · 标题 12/20；禁 mt16/mb24
- E2E：`reverse-database-keyboard` densify + 截图 `diagram-import-steps-dense.png`；`export-ddl-keyboard` Steps assert；键盘 Esc/Tab 意图不改
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~Cmd+K empty pad densify~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/reverse-database-keyboard.spec.ts tests/e2e/export-ddl-keyboard.spec.ts tests/e2e/reverse-erd-keyboard.spec.ts tests/e2e/reverse-pdman-keyboard.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "命令面板" --workers=1 --retries=0`

#### 体验：设计器次屏碎密度（逆向 / DDL / 设置 / 同步配置）

- 选题：Home 空态已密；次屏逆向 Steps 16/24 + 实体表 Card mb16 / 高级导出 DDL 无壳 / SyncConfig 裸 Modal / 设置 hint 仍略松；ROI 仍高于建模静默失败
- 新增 `.erd-secondary-pane`：pad 8×12 · 标题 13/22 · Steps mt/mb ≤10/12 · 表单 28；挂逆向 / ERD·PdMan 拖入 / 高级导出 DDL；`ReverseTable` meta+表行次密 + brand 存量表色
- `SyncConfig` → `.erd-io-modal`；设置 hint mb 8；版本空列表 pad 16×12；清 DesignLeftContent 死 less
- E2E：`designer-secondary-pane` densify；截图 `diagram-secondary-pane-dense.png`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~画布命令面板 empty pad / 导入弹层 steps 对齐~~✅（Steps 对齐）

验证点：
- `cd frontend && npx playwright test tests/e2e/designer-secondary-pane.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：Home 空态/公告区次密

- 选题：hero CTA 已密；空态 40×16 + 公告行 8×16 / 项目区 mb32 仍松井；空态 CTA +「更多公告」不压
- `pages/home/style.less`：空态 pad 24×12 + Empty 插画/描述收距；二级入口 mb16；项目区 mb20；区块头 mb8；公告 pt4 / 行 pad4·gap10 / 标题 13
- E2E：`home-keyboard` mock 空 recent + 新鲜公告 densify；保留既有 hero densify + Skip→主区→CTA/二级入口/项目卡
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~设计器次屏碎密度（视 ROI）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/home-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：Home hero CTA 簇次密

- 选题：分享成功态已密；`/home` hero actions gap12 / secondary 6×14 / hero 32·20 仍松井；主 CTA large + Skip/Tab 不压
- `pages/home/style.less`：hero gap24 / mb·pb16；stats gap12×20·mt12；actions gap8；secondary gap4×12 + 钮 4×10；secondaryNav mb20；lg 折行 gap16
- E2E：`home-keyboard` densify + Skip→主区→继续/新建/示例/二级入口/项目卡；focus-visible brand；不按 Skip 仍落品牌链
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~Home 空态/公告区次密~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/home-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：分享成功态 meta / 表清单次密

- 选题：LandingChrome 已密；分享成功态 stage 8×12 + meta gap4 + 表清单 8×12·13 标题 / 弹层 Paragraph·Compact 仍松井
- `share/index.less`：stage 6×10；meta gap2 / hint·描述 12·16；toggle ~22；表清单 pad 6×10·标题 12/18·行 pad 3×8（行高 ∈20–26）
- `ShareProjectButton` + `io-modal.scss`：挂 `.erd-io-modal`；hint mb8 / 链接行 mb10 / 钮 28；宽 480
- E2E：`demo` meta+表清单 densify；`share-project-keyboard` 弹层次密 + Esc/Tab；`share` 成功态行高；键盘/吊销用例意图不改
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign；下一刀 → ~~Home hero CTA 簇次密~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --grep "免登录 /demo" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/share-project-keyboard.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/share-revoke-keyboard.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/share.spec.ts --project=chromium --grep "设计器分享后匿名打开" --workers=1 --retries=0`

#### 体验：LandingChrome / `/compare` 次密距

- 选题：AuthBrandShell 已密；落地次屏 4.5rem section + 0.85 对照行 / compare 头 仍松井；hero 构图不动
- `landing/index.less`：section 2.75rem；pillars gap 1.5/1.25；对照行 0.5×0.65；nav 0.9 / footer 1.75；compare hero `.landingSection.landingCompareHero` padT 1.5；hero 品牌字/全幅/CTA 级不动
- E2E：`landing` 加载 densify + `compare` 对照 densify；键盘 Skip/Tab 用例不改
- 文档：design-principles §2 / landing.md / regression-checklist / control-matrix / ui-layout-redesign / roadmap

验证点：
- `cd frontend && npx playwright test tests/e2e/landing.spec.ts --project=chromium --grep "加载可见品牌|落地页键盘" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/compare.spec.ts --project=chromium --grep "加载对照表|竞品对照页键盘" --workers=1 --retries=0`

#### 体验：AuthBrandShell / 失效·登录门次密距

- 选题：欢迎空态已密；登录/注册/分享失效/404·403 共用 `AuthBrandShell` 仍 48×40 + gap20 松井
- `AuthBrandShell`：品牌 pad 32×28 / gap14；缩略 pad12；表单 pad 32；门头 mb16；gate gap10；移动 28；品牌字号/渐变/~40% 宽度不变
- E2E：`smoke` 登录页 + `share` 失效门 + `session` 去注册 — 轻量 densify assert；键盘 Skip/Tab 用例不改
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign / roadmap；下一刀 → ~~LandingChrome / compare 次密距~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/smoke.spec.ts --project=chromium --grep "登录页渲染" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/share.spec.ts --project=chromium --grep "无效 token 见品牌壳" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/session.spec.ts --project=chromium --grep "去注册|登录壳键盘" --workers=1 --retries=0`

#### 体验：欢迎空态次密距（pad 32）

- 选题：签体/次屏 Empty 已密；欢迎 `.erd-welcome-empty__inner` 标题 mt20 + 22 字 + hero 220 仍偏松
- `EmptyStateAnimation`：内 pad 锁 32×24；标题 20/mt14；引导 mt8 / lh1.5；保留逆向链 + 左树「新增模型」
- `ErdEmptyDiagram` hero 220→176（AuthBrandShell 同源；compact 132 不动）
- E2E：`model-design-ux`「欢迎空态次密距」；截图 `diagram-welcome-empty-dense.png`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign / roadmap；下一刀 → ~~AuthBrandShell 失效/登录门空态次密距~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/model-design-ux.spec.ts --project=chromium --grep "欢迎空态次密距" --workers=1 --retries=0`

#### 体验：设计器 Empty / 次屏空态次密距

- 选题：签体 pad 已密；兜底 Empty 仍 `marginTop:100` + 高 200 插画；字段/索引空态吃 antd `marginXL` 松井
- `table/index`：兜底 → `.erd-pane-empty` + `PRESENTED_IMAGE_SIMPLE`；禁 100/200
- `TableTab.less`：字段/索引空态 pad 对齐 `--erd-tab-body-pad`；`.ant-empty` margin-block 0；保留 CTA
- 清左树 Blueprint 遗留 `bp4-tab-panel` margin 80/60
- E2E：`model-design-ux`「设计器空态次密距」；截图 `diagram-pane-empty-dense.png`；保留字段/索引空态 CTA
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign / roadmap；下一刀 → ~~欢迎空态 `.erd-welcome-empty` 内 pad 32~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/model-design-ux.spec.ts --project=chromium --grep "设计器空态次密距" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/table-field-empty.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：表设计签体内容次密距

- 选题：内签栏/JExcel 行已 ~24；签体仍 10/12 松井 + hint 6×10 + 空态 16、元数据 tip 默认 Paragraph 底距
- `TableTab.less`：`--erd-tab-body-pad-x/b` 6/4；unique-hint pad 4×8 / mb 4 / minH 24；空态 pad 8；索引 gap 4；CodeTab 二级 content-holder pad 0
- `erd-design-workspace`：外井/内容井 12→6；CommonTabs nav padX 8
- `TableCodeShow`：`.erd-meta-ddl-hint` ~24；`TableIndexEdit` Space 4
- E2E：`model-design-ux`「表设计签体内容次密距」；截图 `diagram-tab-body-dense.png`；保留空字段 CTA / 空名 toast
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign / roadmap；下一刀 → ~~设计器 Empty 巨 marginTop / 次屏松井~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/model-design-ux.spec.ts --project=chromium --grep "表设计签体内容次密距" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/table-field-empty.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：空表设计 / 空表字段引导

- 选题：右键菜单已密；字段签空 `fields[]` 仍白屏死表 / 画布空表仅灰虚线「+ 添加字段」难发现
- `TableInfoEdit`：无命名字段 → Empty「还没有字段」+ 主 CTA「添加第一个字段」（种子首个 defaultField / id）；对称索引签空态
- RF 空表：`canvas-fields-empty` 引导 +「添加第一个字段」品牌 CTA；有字段后回「+ 添加字段」
- E2E：`table-field-empty`（表设计 CTA + 画布空表内联）；`__ERD_E2E__.clearEntityFields` 造空态
- 文档：design-principles §4 / regression-checklist / control-matrix / ui-layout-redesign / roadmap；下一刀 → ~~签体内容次密距~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/table-field-empty.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：右键/树操作菜单密度

- 选题：内签栏已 ~24；设计器 Dropdown/右键仍默认 antd ~40 松项
- 共享 `.erd-dense-menu`（`theme/dense-menu.less`）：项高 28 / 字 12 / pad 4×8；挂树操作、签右键、新建、项目菜单·子菜单、顶栏更多；禁 clip；保留 menuitem + 方向键/Esc
- E2E：`model-design-ux`「右键/树操作菜单密度」；截图 `diagram-context-menu-dense.png`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign / roadmap；下一刀 → ~~空表设计引导~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/model-design-ux.spec.ts --project=chromium --grep "右键/树操作菜单密度" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/tree-delete-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：表设计内签（字段/索引/元数据）栏密度

- 选题：CodeTab/DbTab 子签已显式 ~24；表设计 `#tableNav` 内签仍靠 pad 堆高、无固定栏高
- `TableTab.less`：`.erd-table-design__tabs` `--erd-inner-tabs-h: 24`、字 12、flex 居中；nav `overflow: visible`；inset focus-visible；仅 `>` 直系签栏（不吞嵌套 CodeTab）
- E2E：`model-design-ux`「表设计内签」栏高 + 不 clip + Tab focus + Cmd+1/2/3；截图 `diagram-inner-tabs-dense.png`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign / roadmap；下一刀 → ~~右键菜单密度~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/model-design-ux.spec.ts --project=chromium --grep "表设计内签" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "表设计 Cmd/Ctrl\\+1/2/3" --workers=1 --retries=0`

#### 体验：元数据应用子签 / CodeTab chrome 密度

- 选题：次屏 JExcel 已 ~24；元数据应用 `CodeTab`/`DbTab` 仍默认 antd 松签 + `#codeNav` 字 11
- `CodeTab`/`DbTab`：`size=small` + `.erd-code-tab__tabs` / `.erd-db-tab`；签栏 `--erd-sub-tabs-h: 24`、字 12、flex 居中；nav `overflow: visible`；inset focus-visible
- E2E：`model-design-ux`「元数据应用子签」栏高 + 不 clip + Tab focus + Cmd+1/2/3；截图 `diagram-code-tabs-dense.png`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign / roadmap；下一刀 → ~~表设计内签（字段/索引）栏显式 ~24~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/model-design-ux.spec.ts --project=chromium --grep "元数据应用子签" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "表设计 Cmd/Ctrl\\+1/2/3" --workers=1 --retries=0`

#### 体验：设计器次屏表密度 / chrome（JExcel + 版本 diff）

- 选题：工单/审批已 ~24；表设计字段/索引 JExcel 仍吃 datatables 头 pad10/行 pad8 + `#fbf8fb` 斑马；版本 diff 实体行碎 hex
- `JExcel/index.less`：工具栏 ~24；表头/行 pad 4×8；字 12；token 表面/斑马；工具栏 inset focus-visible；禁 clip
- `version-diff-panel`：组头/行 min-height ~24、pad 4×8；增/删/改色走 `--erd-success`/`--erd-brand`/`--erd-warning`
- E2E：`model-design-ux`「表设计 JExcel 行密度」；不回归 `relation`「工具栏 Tab 可达」+ `version.spec` 可视化 diff
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign / roadmap；下一刀 → ~~元数据应用子签 / CodeTab chrome~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/model-design-ux.spec.ts --project=chromium --grep "表设计 JExcel 行密度" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "工具栏 Tab 可达" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/version.spec.ts --project=chromium --grep "模型变更后详情展示可视化 diff" --workers=1 --retries=0`

#### 体验：版本工单/审批列表密度

- 选题：版本列表已 ~24；工单/审批仍默认 Table 松行 + `marginBottom:16` 标题
- 共享 `.approval-workorder-page`：标题栏 ~24（13/22）；表头/行 pad 4×8；动作 link 钮 22 + 禁 clip 图标；inset focus-visible；「查看」改 Button
- E2E：`approval.spec`「工单/审批列表行密度」；截图 `approval-list-dense.png` / `order-list-dense.png`；不回归 `approval-action-keyboard`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign / roadmap；下一刀 → ~~设计器次屏表密度 / chrome~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/approval.spec.ts --project=chromium --grep "工单/审批列表行密度" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/approval-action-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：版本列表二次密度 / chrome 碎色

- 选题：左树已 ~24；版本工具条仍 28 控件 + rgba/`#389e0d` 碎色
- `version-page`：工具条 Input/Select/Btn 24 + flex 居中；禁 clip 图标；inset focus-visible；行色 `--erd-ink-*`；增删改摘要 `--erd-success` / `--erd-brand` / `--erd-warning`
- `DataSourceSelect` size=small；SyncConfig/RebuildVersion 警告文案改 brand token（去裸 `red`）
- E2E：`version.spec`「版本列表行密度」扩展工具条控件高度 + 不 clip + token 色 + Tab focus-visible；截图 `diagram-version-list-dense.png`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign / roadmap；下一刀 → ~~版本工单/审批列表密度~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/version.spec.ts --project=chromium --grep "版本列表行密度" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/version-action-modals-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：左树工具条再收 / chrome 次密距

- 选题：签头已 ~24；左树工具条仍 pad 8 + 控件 28，次密距松
- `QueryTree`：工具条控件 24、pad 4；搜索 affix/清空钮同阶；禁 clip 图标；新建 inset focus-visible
- `DesignLayout` sider-inner：次密距 pad 4×6×0×8；空态 margin 12
- E2E：`model-design-ux`「模型树」扩展工具条/控件高度 + 不 clip + sider padX + Tab focus-visible；截图 `diagram-left-tree-dense.png`
- 文档：design-principles §2 / regression-checklist / control-matrix / ui-layout-redesign / roadmap；下一刀 → ~~版本列表二次走查 / chrome 碎色~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/model-design-ux.spec.ts --project=chromium --grep "模型树" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "左树键盘漫游" --workers=1 --retries=0`

#### 体验：签头密度再压（CommonTabs / 表设计不 clip）

- 选题：Cmd+K polish 后下一刀；签栏已 ~28，再压至 ~24（22 chrome）且禁裁标签/关闭钮，保留 focus-visible
- `CommonTabs`：`--erd-tabs-h: 24`、flex 竖直居中、关闭钮 14 完整落在栏内；nav `overflow: visible`；inset focus 环
- `TableTab`：签头 pad 2×10 / title 12 / min-height 24；内签 pad 4 / mb 6 + focus-visible
- E2E：`model-design-ux`「表设计三签」收紧高度断言 + 不 clip + Tab focus-visible；截图 `diagram-common-tabs-dense.png`
- 文档：design-principles §2 / regression-checklist / ui-layout-redesign / roadmap；下一刀 → ~~左树工具条再收 / chrome 次密距~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/model-design-ux.spec.ts --project=chromium --grep "表设计三签" --workers=1 --retries=0`

#### 体验：Cmd+K 命令面板键盘 polish

- 选题：命令面板已有 ↑↓/Esc/空态，但缺 focus trap、Esc 归还触发器、`aria-activedescendant`，空态仅一句「无匹配命令或表」
- 改动：`aria-modal` + combobox/`aria-activedescendant`；↑↓ 滚入可视；无匹配分层空态「无匹配结果」+ 提示；Esc 关并归还焦点（执行命令不抢回）；Tab/⇧Tab 困在搜索
- E2E：扩展 `relation`「命令面板」（工具条开 → trap / ↑↓ / 空态 / Esc 归还「命令」）
- 文档：design-principles §2§5 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~签头密度（CommonTabs / 表设计再压且不 clip）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "命令面板" --workers=1 --retries=0`

#### 体验：裸 Modal.confirm → confirmDestructive 清零

- 选题：`frontend/src` 仍有 11 处业务裸 `Modal.confirm`（4 处版本/逆向缺 keyboard/autoFocus/focusTrigger；7 处手写默认重复）
- 改动：全部改 `confirmDestructive`（仅 `destructiveConfirm.ts` 内保留 `Modal.confirm`）；版本同步/标记/重建基线补语义 `okText` + `okType=danger`；重建前落焦 `version-rebuild-btn` 以便 Esc 归还；逆向覆盖同构
- E2E：`version-rebuild-confirm-keyboard`（保存版本→重建表单→基线确认 → 首焦「重建」、Esc 不落盘、Tab trap）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → CmdK polish ✅

验证点：
- `cd frontend && npx playwright test tests/e2e/version-rebuild-confirm-keyboard.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/version-sync-rebuild-keyboard.spec.ts --project=chromium --workers=1 --retries=0`
- `rg 'Modal\\.confirm' frontend/src` → 仅 `utils/destructiveConfirm.ts`

#### 体验：审批动作确认弹层键盘闭环（Popconfirm→Modal.confirm）

- 选题：审批 Pass/Refuse/Cancel/Repeat 仍用 `Popconfirm`（非稳定 `role=dialog`、无 Tab trap、首焦/Esc 闭环不稳）；`approval.spec` 仅点「是」落盘；无键盘回归。`CopyVersion` 零引用且与删版本同路径，顺手清死代码
- 改动：四处改 `confirmDestructive`（首焦语义 OK：「通过/拒绝/撤销/复批」+ Esc 归还触发器 + Tab trap）；拒绝/撤销 `okType=danger`；落盘与 toast 不变；删空壳 `CopyVersion.tsx`；`approval.spec` 确认钮改 dialog 作用域
- E2E：`approval-action-keyboard`（API 种子→拒绝/通过/撤销确认 → 首焦、Esc 不落盘、Tab trap）；不踩 `sql-approval-keyboard`
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → `rg Popconfirm frontend/src` 清零剩余（若无则扫裸 `Modal.confirm`）

验证点：
- `cd frontend && npx playwright test tests/e2e/approval-action-keyboard.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/approval.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/sql-approval-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：团队成员移除确认弹层键盘闭环（Popconfirm→Modal.confirm）

- 选题：`GroupUser`（权限组 → 用户组成员）用 `Popconfirm`（非稳定 `role=dialog`、无 Tab trap、首焦/Esc 闭环不稳）；无键盘回归
- 改动：改 `confirmDestructive`（首焦「移除」+ Esc 归还移除钮 + Tab trap）；移除钮 `aria-label`→`移除成员 {username}`；失败 toast；`/ncnb/project/group/role/users` DELETE 落盘与列表 reload 逻辑不变
- E2E：`group-user-remove-keyboard`（普通成员组→移除确认 → 首焦、Esc 归还不移、Tab trap）；不踩 `add-user-keyboard` / `group-layout-nav`
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~审批 Pass/Refuse/Cancel/Repeat + 死代码 `CopyVersion`~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/group-user-remove-keyboard.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/add-user-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：团队项目删确认弹层键盘闭环（Popconfirm→Modal.confirm）

- 选题：`RemoveGroupProject`（团队基本设置）用 `Popconfirm`（非稳定 `role=dialog`、无 Tab trap、首焦/Esc 闭环不稳）；无键盘回归
- 改动：改 `confirmDestructive`（首焦「删除」+ Esc 归还删钮 + Tab trap）；删钮 `aria-label`→`删除团队项目`；`/ncnb/project/group/delete` 落盘与跳转 `/project/group` 逻辑不变
- E2E：`group-project-delete-keyboard`（基本设置→删确认 → 首焦、Esc 归还不删、Tab trap）；不踩 `project-list-keyboard` / `group-basic-setting`
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~团队成员移除确认（`GroupUser` Popconfirm→`confirmDestructive`）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/group-project-delete-keyboard.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/project-list-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：只读分享吊销确认弹层键盘闭环（Modal.confirm）

- 选题：`ShareProjectButton` 吊销裸 `Modal.confirm`（无显式 keyboard/autoFocus/focusTrigger）；仅有点击吊销旅程 E2E；确认层键盘闭环缺回归
- 改动：吊销改 `confirmDestructive`（首焦「吊销」+ Esc 归还吊销钮 + Tab trap）；外层只读分享窗与 `/share/revoke` 落盘逻辑不变
- E2E：`share-revoke-keyboard`（分享→吊销确认 → 首焦、Esc 归还不吊销、外层仍开、Tab trap）；不踩 `share-project-keyboard` / `share-invalid-gate`
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~团队项目删确认（`RemoveGroupProject` Popconfirm→`confirmDestructive`）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/share-revoke-keyboard.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/share-project-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：工作台 databaseConfig 删/批删确认弹层键盘闭环（Modal.confirm）

- 选题：`/databaseConfig` 行删与批删裸 `Modal.confirm`（okText「确认」、无显式 keyboard/autoFocus/focusTrigger）；仅有点击确认闭环 E2E
- 改动：两路改 `confirmDestructive`（首焦「删除」+ Esc 归还触发器 + Tab trap）；行删钮 `aria-label`→`删除连接 {name}`；批删/落盘逻辑不变
- E2E：`database-config-delete-keyboard`（行删 + 批删 → 首焦、Esc 归还不删、Tab trap）；同步 `adr0008` 确认钮文案
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~分享撤销/停用确认 Modal 键盘（`ShareProjectButton`）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/database-config-delete-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：数据源设置删确认弹层键盘闭环（Popconfirm→Modal.confirm）

- 选题：设计器「数据源设置」行删用 `Popconfirm`（非稳定 `role=dialog`、无 Tab trap、首焦/Esc 闭环不稳）；`removeDbs`/defaultDataSourceId 路径无键盘回归
- 改动：`DatabaseSetUp` 行删改 `confirmDestructive`（首焦「删除」+ Esc 归还删钮 + Tab trap）；删钮补 `aria-label`；二次确认文案与 `removeDatabase`/`defaultDataSourceId` 清理逻辑不变
- E2E：`database-setup-delete-keyboard`（新增→删确认 → 首焦、Esc 归还不删、外层配置窗仍开、Tab trap）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~工作台 databaseConfig 删/批删确认 Modal 键盘~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/database-setup-delete-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：左树删模型/表/关系图确认弹层键盘闭环（Modal.confirm）

- 选题：左树 `DataTable.handleRemove` 三路径 `Modal.confirm` 未显式 `keyboard`/`autoFocusButton`/`focusTriggerAfterClose`；仅有点击取消/确认 E2E
- 改动：抽出共享 `confirmDestructive` + `focusTreeActionTrigger`（菜单卸载前落焦行「…操作」）；模型/表/关系图确认统一首焦「删除」+ Esc 归还 + Tab trap；树键盘漫游与二次确认文案不变
- E2E：`tree-delete-keyboard`（表操作→删除表 → 首焦、Esc 归还不删、Tab trap）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~数据源配置删确认 Modal 键盘~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/tree-delete-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：JExcel 工具栏删行确认弹层键盘闭环（Modal.confirm）

- 选题：共享 JExcel 工具栏 `remove` 的 `Modal.confirm` 未显式 `keyboard`/`autoFocusButton`/`focusTriggerAfterClose`；仅有点击取消/确认 E2E
- 改动：确认显式 `keyboard` + `autoFocusButton: 'ok'`（首焦「删除」）+ `focusTriggerAfterClose`；`deleteRow` 与未选中 toast 不变；半成品行 toast / 工具栏 Tab 序不动
- E2E：`jexcel-toolbar-delete-keyboard`（字段签选中行→「删除选中行」→ 首焦、Esc 归还不删、Tab trap）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~左树删模型/表/关系图确认 Modal 键盘~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/jexcel-toolbar-delete-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：表设计删索引确认弹层键盘闭环（Modal.confirm）

- 选题：`TableIndexEdit`「删除索引」`Modal.confirm` 未显式 `keyboard`/`autoFocusButton`/`focusTriggerAfterClose`；无键盘 E2E
- 改动：确认显式 `keyboard` + `autoFocusButton: 'ok'`（首焦「删除」）+ `focusTriggerAfterClose`；二次确认与 `updateEntityIndex` 逻辑不变；半成品行 toast 行为不动
- E2E：`table-index-delete-keyboard`（画布→索引→添加 →「删除索引」→ 首焦、Esc 归还不删、Tab trap）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~JExcel 工具栏删行确认 Modal 键盘~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/table-index-delete-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：画布删字段确认弹层键盘闭环（Modal.confirm）

- 选题：字段浏览器 × / 浏览态 Delete·Backspace 共用的 `confirmRemoveField` 未显式 `keyboard`/`autoFocusButton`/`focusTriggerAfterClose`；无键盘 E2E
- 改动：确认显式 `keyboard` + `autoFocusButton: 'ok'`（首焦「删除」）+ `focusTriggerAfterClose`；二次确认与 `removeField` 逻辑不变
- E2E：`canvas-delete-field-keyboard`（空态建表 → 加字段 → ×「删除字段」→ 首焦、Esc 归还不删、Tab trap）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~表设计删索引确认 Modal 键盘（`TableIndexEdit`）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/canvas-delete-field-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：画布删边/删分组确认弹层键盘闭环（Modal.confirm）

- 选题：删边（`onEdgesDelete` + 基数 chip）/ 删分组 Frame 的 `Modal.confirm` 未显式 `keyboard`/`autoFocusButton`/`focusTriggerAfterClose`；无键盘 E2E
- 改动：三处确认均显式 `keyboard` + `autoFocusButton: 'ok'`（首焦「删除」）+ `focusTriggerAfterClose`；二次确认与 `removeAssociation`/`removeFrame` 逻辑不变
- E2E：`canvas-delete-edge-frame-keyboard`（连线/建分组 → 焦点触发器 → Delete → 首焦、Esc 归还不删、Tab trap）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~画布删字段确认 Modal 键盘~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/canvas-delete-edge-frame-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：画布删表确认弹层键盘闭环（Modal.confirm）

- 选题：RF 画布 Delete 删表 `Modal.confirm` 未显式 `keyboard`/`autoFocusButton`/`focusTriggerAfterClose`；无键盘 E2E
- 改动：删表确认显式 `keyboard` + `autoFocusButton: 'ok'`（首焦「删除」）+ `focusTriggerAfterClose`；二次确认与 `removeEntity` 逻辑不变
- E2E：`canvas-delete-table-keyboard`（空态新建表 → 选中 →「修改表名」焦点 → Delete → 首焦、Esc 归还不删、Tab trap）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~画布删边/删分组确认 Modal 键盘~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/canvas-delete-table-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：EntityModal 弹层键盘闭环（新增模型/表/关系图）

- 选题：左树领域 CRUD 共用 `EntityModal` 缺 `keyboard`/`focusTriggerAfterClose`；开窗首焦不稳；无键盘 E2E
- 改动：显式 `keyboard` + `focusTriggerAfterClose` + `afterOpenChange`（新增表首焦「所属模型」Select；模型/关系图首焦名称）；名称/中文名/所属模型补 `aria-label`；提交/校验逻辑不变
- E2E：`entity-modal-keyboard`（个人项目空态「新增模型」→ 首焦、Esc 归还触发器、Tab trap；不提交）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~画布删表确认 Modal 键盘~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/entity-modal-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：只读分享弹层键盘闭环（ShareProjectButton）

- 选题：设计器顶栏「只读分享」Modal 缺 `keyboard`/`focusTriggerAfterClose`；开窗首焦不稳；无键盘 E2E
- 改动：显式 `keyboard` + `focusTriggerAfterClose` + `afterOpenChange` 首焦「分享链接」；关闭钮补 `aria-label`；create/复制/吊销逻辑不变（不改分享失效门 / 只读壳）
- E2E：`share-project-keyboard`（个人项目设计器 → 只读分享 → 首焦、Esc 归还触发器、Tab trap；不复制/不吊销）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~新建实体 Modal 键盘（EntityModal）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/share-project-keyboard.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/share.spec.ts --project=chromium --workers=1 --retries=0 -g "无效分享|分享失效门键盘"`

#### 体验：添加成员弹层键盘闭环（AddUser）

- 选题：团队权限组「添加成员」Modal 缺 `keyboard`/`focusTriggerAfterClose`；开窗首焦不稳；无键盘 E2E
- 改动：显式 `keyboard` + `focusTriggerAfterClose` + `afterOpenChange` 首焦「选择用户」Select；确定钮补 `aria-label`；加人 POST/校验逻辑不变
- E2E：`add-user-keyboard`（团队项目 → 权限组 → 普通成员 → 添加成员 → 首焦、Esc 归还触发器、Tab trap；不提交）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~分享弹层键盘（ShareProjectButton）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/add-user-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：发起SQL审批弹层键盘闭环（SqlApproval）

- 选题：版本详情「SQL审批」Modal 缺 `keyboard`/`focusTriggerAfterClose`；开窗首焦不稳；无键盘 E2E
- 改动：显式 `keyboard` + `focusTriggerAfterClose` + `afterOpenChange` 首焦「审批人」Select；审批说明补 `aria-label`；发起审批 POST/校验逻辑不变
- E2E：`sql-approval-keyboard`（团队项目 → 提交工单 → SQL审批 → 首焦、Esc 归还触发器且父详情仍开、Tab trap；不提交）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~添加成员 Modal 键盘（AddUser）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/sql-approval-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：修改密码弹层键盘闭环（ResetPassword）

- 选题：账号「修改密码」Modal 缺 `keyboard`/`focusTriggerAfterClose`；开窗首焦不稳；触发器仅「修改」无稳定可访问名；无键盘 E2E
- 改动：显式 `keyboard` + `focusTriggerAfterClose` + `afterOpenChange` 首焦「密码」；触发器 `aria-label="修改密码"`；提交流程不变
- E2E：`reset-password-keyboard`（安全设置 → 首焦、Esc 归还触发器、Tab trap）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~SQL审批 Modal 键盘（SqlApproval）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/reset-password-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：解析PdMan文件弹层键盘闭环（ReversePdMan）

- 选题：设计器「解析PdMan文件」Modal 缺 `keyboard`/`focusTriggerAfterClose`；开窗首焦不稳；无键盘 E2E
- 改动：显式 `keyboard` + `focusTriggerAfterClose` + `afterOpenChange` 首焦上传区「选择PdMan文件」；合并 modules 行为不变
- E2E：`reverse-pdman-keyboard`（项目菜单 → 首焦、Esc 归还菜单钮、Tab trap；不依赖真实 PdMan 文件）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~修改密码 Modal 键盘（ResetPassword）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/reverse-pdman-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：解析ERD文件弹层键盘闭环（ReverseERD）

- 选题：设计器「解析ERD文件」Modal 缺 `keyboard`/`focusTriggerAfterClose`；开窗首焦不稳；无键盘 E2E
- 改动：显式 `keyboard` + `focusTriggerAfterClose` + `afterOpenChange` 首焦上传区「选择ERD文件」；解密/合并 modules 行为不变
- E2E：`reverse-erd-keyboard`（项目菜单 → 首焦、Esc 归还菜单钮、Tab trap；不依赖真实 ERD 文件）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~导入 PdMan Modal 键盘（ReversePdMan）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/reverse-erd-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：导出DDL弹层键盘闭环（ExportDDL）

- 选题：设计器「导出DDL」Modal 缺 `keyboard`/`focusTriggerAfterClose`；开窗首焦不稳；无键盘 E2E
- 改动：显式 `keyboard` + `focusTriggerAfterClose` + `afterOpenChange` 首焦「数据源」Select；refreshDataSources / 两步导出行为不变
- E2E：`export-ddl-keyboard`（项目菜单 → 首焦、Esc 归还菜单钮、Tab trap；不依赖 JDBC）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~导入 ERD Modal 键盘（ReverseERD）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/export-ddl-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：数据源逆向解析弹层键盘闭环（ReverseDatabase）

- 选题：设计器「数据源逆向解析」Modal 缺 `keyboard`/`focusTriggerAfterClose`；开窗首焦不稳；无键盘 E2E
- 改动：显式 `keyboard` + `focusTriggerAfterClose` + `afterOpenChange` 首焦「数据源」Select；meta / `dataSourceId` 载荷不变
- E2E：`reverse-database-keyboard`（项目菜单 → 首焦、Esc 归还菜单钮、Tab trap；不依赖 reverse_demo）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~导出 DDL Modal 键盘~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/reverse-database-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：默认项设置弹层键盘闭环（DefaultSetUp）

- 选题：设计器「默认项设置」Modal 缺 `keyboard`/`focusTriggerAfterClose`；开窗首焦不稳；无键盘 E2E
- 改动：显式 `keyboard` + `focusTriggerAfterClose` + `afterOpenChange` 首焦「默认字段」Tab；去多余 `forceRender`；两 Tab / 保存行为不变
- E2E：`default-setup-keyboard`（项目菜单 → 首焦、Esc 归还菜单钮、Tab trap）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~逆向库 Modal 键盘~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/default-setup-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：数据源设置弹层键盘闭环（DatabaseSetUp）

- 选题：设计器「数据源设置」Modal 缺 `keyboard`/`focusTriggerAfterClose`；开窗首焦不稳；无键盘 E2E
- 改动：显式 `keyboard` + `focusTriggerAfterClose` + `afterOpenChange` 首焦「新增数据源」；去多余 `forceRender`；`defaultDataSourceId` / POST payload 行为不变
- E2E：`database-setup-keyboard`（项目菜单 → 首焦、Esc 归还菜单钮、Tab trap）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~默认项设置 Modal 键盘~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/database-setup-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：复刻弹层键盘闭环（CopyProject）

- 选题：版本行「复刻」Modal 缺 `keyboard`/`focusTriggerAfterClose`；开窗首焦不稳；无键盘 E2E
- 改动：显式 `keyboard` + `focusTriggerAfterClose` + `afterOpenChange` 首焦「项目名」；去多余 `forceRender`
- E2E：`project-copy-keyboard`（保存版本 → 首焦、Esc 归还、Tab trap）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~数据源设置 Modal 键盘~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/project-copy-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：初始化基线弹层键盘闭环（InitVersion）

- 选题：版本页「初始化基线」从工具栏失踪（仅残存在未挂载 `VersionMenu`）；Modal 缺 `keyboard`/`focusTriggerAfterClose`；无键盘 E2E
- 改动：版本页工具栏按 `canErdHisprojectInit` 挂回 `InitVersion`；显式 `keyboard` + `focusTriggerAfterClose` + `afterOpenChange` 首焦「版本号」；删未挂载死壳 `VersionMenu`
- E2E：`version-init-keyboard`（API 建数据源 → 首焦、Esc 归还、Tab trap）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~CopyProject~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/version-init-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：同步配置/重建版本弹层键盘闭环

- 选题：版本页工具栏「同步配置」「重建版本」Modal 开窗首焦不稳；缺 `keyboard`/`focusTriggerAfterClose`；无键盘 E2E
- 改动：`SyncConfig` 首焦选中升级方式 radio（默认「字段增量」）；`RebuildVersion` 首焦「版本号」；两者显式 `keyboard` + `focusTriggerAfterClose` + `afterOpenChange`
- E2E：`version-sync-rebuild-keyboard`（同步配置/重建版本：首焦、Esc 归还、Tab trap）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~InitVersion~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/version-sync-rebuild-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 安全：R-DATA-02 残余 — JDBC 连接钉解析 IP（关 check→connect TOCTOU）

- 选题：resolve-then-check 后 Driver 仍按主机名再解析，DNS 重绑定 TOCTOU 未关
- 改动：`JdbcUrlGuard.assertAllowedAndPin` 校验后将非字面量主机改写为已放行 A/AAAA；`AbstractDBCommand` / `JdbcKit` / `DynamicAspect` 走 pin URL；**不**禁 RFC1918（Railway 私网库）
- 文档：security-model R-DATA-02；roadmap 下一刀 → raw ping·reverse
- 回归：`JdbcUrlGuardTest`（pin RFC1918 / 字面量不动 / flip resolver 单次 resolve / 多 A 含 meta 拒）

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=JdbcUrlGuardTest test`
- `./backend/dev-ensure.sh --restart`；`curl -sf http://localhost:9502/actuator/health/liveness` → UP

#### 体验：版本对比/详情 diff 弹层键盘闭环（CompareVersion）

- 选题：任意版本比较 / 版本变更详情 Modal 开窗首焦不稳；缺 `keyboard`/`focusTriggerAfterClose`；无键盘 E2E
- 改动：`CompareVersion` 显式 `keyboard` + `focusTriggerAfterClose` + `afterOpenChange`（比对→首焦「初始版本」；详情→首焦「导出变更清单」）
- E2E：`version-diff-keyboard`（比对/详情：首焦、Esc 归还、Tab trap）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~同步配置/重建版本弹层键盘~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/version-diff-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：编辑版本弹窗键盘闭环（RenameVersion）

- 选题：编辑版本 Modal 开窗首焦不稳；缺 `keyboard`/`focusTriggerAfterClose`；无键盘 E2E
- 改动：`RenameVersion` 显式 `keyboard` + `focusTriggerAfterClose` + `afterOpenChange`（最新首焦版本号；非最新只读号→首焦描述）
- E2E：`version-action-modals-keyboard` 增「编辑：首焦版本号；Esc 归还；Tab trap」
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~版本对比/详情 diff 弹层键盘（CompareVersion）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/version-action-modals-keyboard.spec.ts --project=chromium --grep "编辑" --workers=1 --retries=0`

#### 安全：R-DATA-02 残余 — JDBC 主机名 DNS 解析后再拦 IMDS/链路本地

- 选题：`JdbcUrlGuard` 仅拦字面量/元数据主机名；CNAME→`169.254.x` 等 DNS 重绑定可绕过
- 改动：非字面量主机 `InetAddress.getAllByName`，**任一** A/AAAA 命中原 deny list 即拒；**不**禁 RFC1918（PaaS 私网库）；不可解析主机不 fail-closed（连库时失败）
- 文档：security-model R-DATA-02；roadmap 下一刀 → TOCTOU / raw ping·reverse
- 回归：`JdbcUrlGuardTest`（注入 resolver：IMDS / 多 A 含 meta / RFC1918 放行）

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=JdbcUrlGuardTest test`
- `./backend/dev-ensure.sh --restart`；`curl -sf http://localhost:9502/actuator/health/liveness` → UP

#### 安全：R-CFG-05/06 + R-OPS-03（OSS 密钥面 / OAuth 死键 / SocketIO 端口）

- 选题：yml 扁平 `martin.oss.accessKey=minio`/`minio123` 不绑 `MinioClient` 仍误导复制；prod 强制假 `OSS_*`；`.env.example` 残留 `OAUTH_CLIENT_*`；9092 缺防火墙说明
- 改动：嵌套 `martin.oss.minio.*` + 空默认；去掉 prod 强制 OSS 占位；`OssCredentialGuard` prod 拒 blank/`minio`+`minio123`；MinIO Bean 仅 endpoint 非空；删 OAuth 死键；deployment 写明 9092 勿公网裸放
- 文档：security-model R-CFG-05/06、R-OPS-03 ✅；roadmap 下一刀 → R-DATA-02 残余
- 回归：`OssCredentialGuardTest` + `OssSecurityConfigContractTest`

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=OssCredentialGuardTest,OssSecurityConfigContractTest test`
- `./backend/dev-ensure.sh --restart`；`curl -sf http://localhost:9502/actuator/health/liveness` → UP（未设 `OSS_ENDPOINT` 仍可起）

#### 体验：版本动作弹窗键盘闭环（新增/删除/回滚）

- 选题：新增版本 Modal 开窗首焦不稳；删除/回滚用 Popconfirm 非 `role=dialog`、无 Tab trap；无键盘 E2E
- 改动：`AddVersion` 显式 `keyboard` + `focusTriggerAfterClose` + `afterOpenChange` 首焦版本号；`RemoveVersion`/`RevertVersion` Popconfirm→Modal（首焦「是」）
- E2E：`version-action-modals-keyboard`（新增/删除/回滚：首焦、Esc 归还、Tab trap）；`version.spec` 确认钮改走 dialog
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~编辑版本弹窗键盘（RenameVersion）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/version-action-modals-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 安全：R-DEAD-01/02/03 收敛假开关与 ignore 假路径

- 选题：`martin.swagger.enabled` / `martin.resource-server.enabled` 死键误导运维；ignore `/endpoint/**` 无控制器仍扩大未来匿名面
- 改动：删除两假开关与死类 `SwaggerProperties`；ignore 去掉 `/endpoint/**`；springdoc 仍仅 `springdoc.*`（prod 关）
- 文档：security-model R-DEAD-01/02/03 ✅；roadmap 下一刀 → R-CFG-05/06
- 回归：`DeadSecurityConfigContractTest`（yml 无死键、ignore 契约）

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=DeadSecurityConfigContractTest test`
- `./backend/dev-ensure.sh --restart`；匿名 `GET /endpoint/foo` → 401；`GET /actuator/health` → 200；`POST /auth/login`（坏口令）非 401 鉴权面（应为 4xx 业务/校验）

#### 体验：导入/导出弹层键盘闭环（DBML）

- 选题：DBML 导入/导出 Modal 开窗首焦不稳；菜单打开后 Esc 无法归还触发器（菜单项已卸载）；无键盘 E2E
- 改动：`ReverseDBML`/`ExportDBML` 显式 `keyboard` + `focusTriggerAfterClose` + `afterOpenChange` 首焦文本区/模型 Select；`ProjectMenu.openDialog` 开窗前焦点交「项目菜单」
- E2E：`import-export-keyboard`（空态导入 CTA / 菜单导出：首焦、Esc 归还、Tab trap）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~版本动作弹窗键盘闭环（新增/删除/回滚）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/import-export-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 安全：R-AUTH-07 frameOptions DENY（点击劫持）

- 选题：Security 链 `frameOptions.disable()`，API 可被嵌 iframe
- 改动：`ErdSecurityConfiguration` → `frameOptions.deny()`；分享为 SPA `/share/:token`，不嵌 API；第三方嵌 UI 文档约定走前端 CSP `frame-ancestors`
- 文档：security-model R-AUTH-07 ✅ + 点击劫持节；roadmap 下一刀 → R-DEAD-01/02/03
- 回归：`FrameOptionsContractTest`（源契约：deny 启用、非 disable）

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=FrameOptionsContractTest test`
- `./backend/dev-ensure.sh --restart`；`curl -sI http://localhost:9502/actuator/health` → `X-Frame-Options: DENY`

#### 安全：R-CFG-03 应用库 JDBC TLS（prod 默认开 SSL）

- 选题：双 DS `jdbc-url` 硬编码 `useSSL=false` + `allowPublicKeyRetrieval=true`，生产中间人面
- 改动：`MYSQL_USE_SSL` / `MYSQL_REQUIRE_SSL` / `MYSQL_ALLOW_PUBLIC_KEY_RETRIEVAL` 驱动双 DS；`application.yml` 默认关 SSL；`application-prod.yml` 默认开 + `requireSSL`、关 public-key retrieval；`docker-compose` / `.env.example` 显式关 SSL 保无 TLS 本地 MySQL
- 文档：security-model R-CFG-03 ✅；roadmap 下一刀 → R-AUTH-07；deployment Railway MySQL TLS 说明
- 回归：`MysqlJdbcSslBindingTest`（本地/prod 默认占位符 + compose 逃生阀）

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=MysqlJdbcSslBindingTest test`
- `./backend/dev-ensure.sh --restart`；`curl -sf http://localhost:9502/actuator/health/liveness` → UP

#### 体验：项目动作弹窗键盘闭环（新建/修改/删除确认）

- 选题：新建/修改 Modal 开窗首焦不稳、Esc/焦点归还未 E2E；删除用 Popconfirm 非 `role=dialog`、无 Tab trap、失败静默
- 改动：`AddProject`/`RenameProject` 显式 `keyboard` + `focusTriggerAfterClose` + `afterOpenChange` 首焦首字段；`RemoveProject` Popconfirm→Modal（失败 toast、首焦「是」）
- E2E：`project-action-modals-keyboard`（新建/修改/删除：首焦、Esc 归还、Tab trap）；`helpers.deleteOwnPersonProjects` 走 dialog「是」
- 文档：design-principles §2 / control-matrix / regression-checklist；下一刀 → ~~导入/导出弹层键盘闭环（打开首焦 + Esc 归还 + Tab trap）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/project-action-modals-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 安全：R-DATA-05 删 TestJson 样板 CRUD 面

- 选题：`TestJsonController` `/testJson/**` 需登录仍暴露样板 CRUD，污染攻击面
- 改动：删除 `TestJsonController` + `TestJsonService`/`Impl` + `TestJsonMapper`/`xml` + `TestJson` 实体；无 ignore-urls / FE 代理引用
- 文档：security-model R-DATA-05 ✅；roadmap 下一刀 → R-CFG-03
- 回归：`TestJsonDeadPathRemovedTest`（源文件缺席断言）

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=TestJsonDeadPathRemovedTest test`
- `./backend/dev-ensure.sh --restart`；匿名 `GET /ncnb/testJson` → 401；带 JWT → 404（`资源不存在`）

#### 安全：R-AUTH-06 开放注册单入口 + prod 默认关闭

- 选题：ignore 双入口（`/user/register` + 产品路径）；Service `@RestController` 另挂匿名注册面；prod 默认可自注册
- 改动：`RemoteSystemUser.userRegister` 去 HTTP 映射（仅进程内）；ignore 去掉 `/register`、`/user/register`，仅留 `/project/group/user/register`；`erd.security.allow-open-register`（`ERD_ALLOW_OPEN_REGISTER`）prod/默认=false → 拒绝注册；`dev`=true 保本地/E2E
- 文档：security-model R-AUTH-06 ✅；roadmap 下一刀 → R-DATA-05；deployment / `.env.example`

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=RemoteSystemUserHttpContractTest,UserExtensionServiceImplRegisterGateTest test`
- `./backend/dev-ensure.sh --restart`；匿名产品注册 → `code=200`（dev）；`POST /user/register` → 401；`ERD_ALLOW_OPEN_REGISTER=false` 单测拒注册且不触 DB

#### 体验：账号设置壳键盘（Skip + Tab 序 + focus-visible）

- 选题：`/account/settings` 进页 Tab 先扫顶栏再扫左侧页签；无 Skip 直达主表单；保存钮键盘可达未回归；无键盘 E2E
- 改动：HomeLayout 在账号设置路由首 Skip「跳到主表单」→ `#account-settings-form`（`tabIndex=-1`）；右侧面板地标 + 设置分类 `aria-label`；地标 focus-visible brand 环（继承壳环）
- E2E：`account-settings-keyboard`「账号键盘：Skip→主表单；字段/保存 Tab 序；focus-visible；无 trap」
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~项目动作弹窗键盘闭环（新建/修改/删除确认）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/account-settings-keyboard.spec.ts --project=chromium --grep "账号键盘" --workers=1 --retries=0`

#### 安全：R-CFG-04 SocketIO/CORS 生产 Origin fail-fast

- 选题：SocketIO 默认 `origin:*`；prod 可漏配 UI 源；`ERD_UI_URL` 曾零引用（R-DEAD-04）
- 改动：新增 `CrossOriginPolicy`（prod 拒 CORS/SocketIO `*` 与 blank）；`application-prod.yml` `martin.socketio.origin=${SOCKETIO_ORIGIN:${ERD_UI_URL}}`、`martin.ui.url=${ERD_UI_URL:${SOCKETIO_ORIGIN}}` 无 `*` 默认；`CorsConfig` 经 `CORS_ALLOWED_ORIGINS`→`ERD_UI_URL` 回落；本地/dev 保留 `*` + localhost CORS；compose/`.env.example` 默认 `ERD_UI_URL=http://localhost:8000`
- 文档：security-model R-CFG-04 / R-DEAD-04 ✅；roadmap 下一刀 → R-AUTH-06；deployment 变量与排障表
- 注：`cfe943e` 仅落类文件；本提交补齐接线与文档

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=CrossOriginPolicyTest,OriginBindingTest test`
- `./backend/dev-ensure.sh --restart`（dev profile）：健康；本地 CORS 仍放行 `http://localhost:8000`

#### 体验：项目列表行键盘（个人/最近/团队 · Enter + Tab + focus-visible）

- 选题：列表行仅标题链可点，描述/头像死区；动作区无键盘回归；删除/管理缺稳定可访问名
- 改动：`ProjectListOpenLink` + 行 `stretched ::after` 消死卡；三面共用 `project-list-row` / `project-list-open-link`；删除/管理补 `aria-label`；行 `:has(:focus-visible)` inset brand 环（避开 ant List 后代 outline 重置）
- E2E：`project-list-keyboard`（个人死卡 + Enter/Tab 动作；最近/团队 Enter + Tab）
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~账号设置壳键盘（Account / profile）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/project-list-keyboard.spec.ts --project=chromium --workers=1 --retries=0`

#### 安全：R-DATA-04 上传归属 — 删测试口 + Word 模板绑项目

- 选题：`POST /project/upload`（及 group/ws 同构测试口）任意登录用户写默认 OSS；`doc/uploadWordTemplate`/`downloadWordTemplate` 无成员校验，`doctpl` 可跨租户读对象键
- 改动：删除 `ProjectController`/`GroupProjectController`/`WsController` 的 `upload` 测试接口；新增 `WordTemplateGuard`（仅 `.docx`、安全 basename、Content-Type 白名单、键必须 `martin/projecterd/{projectId}/*.docx`）；`GenDocServiceImpl` 上传/下载/gendocx 均 `ProjectAcl.assertMember` + 路径守卫
- 文档：security-model R-DATA-04 ✅；roadmap 下一刀 → R-CFG-04

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=WordTemplateGuardTest,UploadTestEndpointsRemovedTest,GenDocServiceImplTest test`
- 登录后：`POST /ncnb/project/upload` → 404；`POST /ncnb/doc/uploadWordTemplate/{他人projectId}` → 403；`GET downloadWordTemplate?doctpl=martin/projecterd/{他人}/x.docx` → 403；默认模板下载仍 200

#### 体验：GroupLayout 壳键盘（Skip + Tab 序 + focus-visible）

- 选题：团队设置壳进页 Tab 先扫顶栏+侧栏；无 Skip 直达主区；焦点环缺；无键盘 E2E
- 改动：`GroupLayout` 首焦 Skip「跳到主内容」→ `#group-main-content`（`tabIndex=-1`）；壳内 `:focus-visible` brand 环；自然 DOM 序不动正 `tabIndex`
- E2E：`group-keyboard`「Group 键盘：Skip→主内容；表单 Tab 序；focus-visible；无 trap」
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~项目列表（个人/最近/团队）行键盘~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/group-keyboard.spec.ts --project=chromium --grep "Group 键盘" --workers=1 --retries=0`

#### 体验：Home 工作台键盘（Skip + Tab 序 + focus-visible）

- 选题：`/home` 进页 Tab 先扫顶栏；无 Skip 直达主区；CTA/项目卡焦点环缺；无键盘 E2E
- 改动：`HomeLayout` 首焦 Skip「跳到主内容」→ `#home-main-content`（`tabIndex=-1`）；壳内 + Home 页 `:focus-visible` brand 环；自然 DOM 序不动正 `tabIndex`
- E2E：`home-keyboard`「Home 键盘：Skip→主内容；CTA/项目卡 Tab 序；focus-visible；无 trap」
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~GroupLayout 壳键盘~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/home-keyboard.spec.ts --project=chromium --grep "Home 键盘" --workers=1 --retries=0`

#### 安全：R-DATA-02 收尾 — mutate 强制 dataSourceId + IMDS/链路本地拦截

- 选题：sqlexec/dbsync 仍可 raw JDBC+账密旁路 ACL；JDBC 主机仅禁单一元数据 IP，链路本地/Azure/阿里云 IMDS 有缺口
- 改动：`ConnectorCredentialResolver.applyMutate`（无 id → `code=400`）；`ConnectorController` sqlexec/dbsync 接入；`JdbcUrlGuard` 扩 `169.254.0.0/16`、`168.63.129.16`、`100.100.100.200`、`fe80::/10`、`fd00:ec2::254`、IPv4-mapped、主机名（含 bracket IPv6 解析）；**不**禁 RFC1918（自托管内网库）
- 文档：security-model R-DATA-02 建议收尾 ✅；roadmap 下一刀 → R-DATA-04

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=JdbcUrlGuardTest,ConnectorCredentialResolverTest test`
- 登录后：`POST /ncnb/connector/sqlexec` 仅 raw JDBC（无 `dataSourceId`）→ `code=400` 文案含 dataSourceId；`ping` 至 `169.254.x`/`168.63.129.16` → 拒

#### 安全：R-DATA-02 FE connector 热路径只传 dataSourceId

- 选题：已保存数据源仍在 ping/reverse/sqlexec/dbsync 重传 raw JDBC+账密，绕过后端 id 优先语义
- 改动：`preferDataSourceIdPayload`（`dataSourceId`/`dbKey`/`key`→剥 url/username/password/driver）；`save.js` ping/sqlexec/dbsync/dbReverse* 接入；逆向/版本同步带 id；`/databaseConfig` 同步状态走 id；设计器/表单「测试连接」仍 raw
- 文档：security-model R-DATA-02 ✅；roadmap 下一刀 → SSRF/禁 mutate raw → **已由同日收尾切片关闭**

验证点：
- `cd frontend && npx --yes tsx src/utils/connectorPayload.test.ts`
- `cd frontend && npx playwright test tests/e2e/adr0008-datasource.spec.ts --project=chromium --grep "同步状态" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/import-reverse.spec.ts --project=chromium --workers=1 --retries=0`（需 reverse_demo MySQL）

#### 安全：R-AUTH-05 SocketIO 校验 project_user 成员

- 选题：合法短票/JWT 可加任意 `projectId` 房收 presence/sync（越权旁听与注入）
- 改动：短票 Redis 载荷改为 `userId\\nusername`；`SocketIoAuthorizationListener` 握手强制 `projectId` + `ProjectAcl.isMember`；`JOIN_ROOM` 再验一次（SPI 实例经 `SpringContextHelper`）；cursor/sync 仅 `ATTR_JOINED` 后广播
- 脚本：presence/cursor/sync 改建团队项目并绑定 e2e0；新增 `verify-socket-membership.mjs` 负向
- 文档：`security-model` R-AUTH-05 ✅；ADR-0009；roadmap 下一刀 → ~~FE connector dataSourceId~~✅

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=SocketTicketServiceTest,SocketIoAuthorizationListenerTest,ProjectAndDataSourceAclTest test`
- `./backend/dev-ensure.sh --restart`；liveness → 200
- `node scripts/verify-socket-membership.mjs`；`node scripts/verify-socket-presence.mjs`

#### 体验：`/compare` 竞品对照页键盘（Skip + Tab 序 + focus-visible）

- 选题：共用 `LandingChrome` Skip/`#landing-main-cta` 已在落地页落地，但 `/compare` 无独立键盘 E2E；对照 CTA 链（演示→自部署→首页）未断言
- 改动：无新壳逻辑——复用 Skip「跳到主操作」→ `#landing-main-cta`；核对 Tab 序 / surface focus-visible / 无 trap
- E2E：`compare`「竞品对照页键盘：Skip→主 CTA；Tab 序；focus-visible；无 trap」
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign / landing.md；下一刀 → ~~Home 工作台键盘（Skip 进主区）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/compare.spec.ts --project=chromium --grep "竞品对照页键盘" --workers=1 --retries=0`

#### 体验：分享失效门键盘（Skip + Tab 序 + focus-visible）

- 选题：失效门虽共用 `AuthBrandShell`，Skip 仍默认「跳到表单」；`share-invalid-gate` 无 Skip 锚 / `tabIndex`；无键盘 E2E
- 改动：`skipLabel=跳到主操作` + `skipTargetId=exception-main-cta`（CTA 栈 `id` + `tabIndex=-1`）；与 404/403 同构；壳内地标 focus-visible 既有
- E2E：`share`「分享失效门键盘：Skip→主 CTA；Tab 序；focus-visible；无 trap」
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~`/compare` 竞品对照页键盘~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/share.spec.ts --project=chromium --grep "分享失效门键盘" --workers=1 --retries=0`

#### 体验：404/403 壳键盘（Skip + Tab 序 + focus-visible）

- 选题：异常门虽共用 `AuthBrandShell`，Skip 文案仍为「跳到表单」；主 CTA 栈无 Skip 锚；`403` 无路由不可达；无键盘 E2E
- 改动：`skipLabel=跳到主操作` + `skipTargetId=exception-main-cta`（门 CTA 栈 `tabIndex=-1`）；`AuthBrandShell` 支持可配置 Skip 锚；壳内地标 focus-visible；深链 `/403`（layout false）
- E2E：`not-found`「404 壳键盘」「403 壳键盘」
- 文档：design-principles §2 / control-matrix / regression-checklist / ui-layout-redesign；下一刀 → ~~分享失效门键盘（同构 `share-invalid-gate`）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/not-found.spec.ts --project=chromium --grep "壳键盘" --workers=1 --retries=0`

#### 体验：落地页键盘（Skip + Tab 序 + focus-visible）

- 选题：`/` 进页 Tab 先扫完整顶栏；无 Skip 直达主 CTA；深色门面焦点环缺；无键盘 E2E
- 改动：`LandingChrome` 首焦 Skip「跳到主操作」→ `#landing-main-cta`（`tabIndex=-1`）；hero /compare CTA 同锚；壳内 `:focus-visible` surface 环（地标 brand）；自然 DOM 序不动正 `tabIndex`
- E2E：`landing`「落地页键盘：Skip→主 CTA；Tab 序；focus-visible；无 trap」
- `docs/design-principles.md` §2 / control-matrix / regression-checklist / landing.md；下一刀 → ~~404/403 壳键盘核对~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/landing.spec.ts --project=chromium --grep "落地页键盘" --workers=1 --retries=0`

#### 安全：R-AUTH-02 UserController CRUD 补 sys_user_* 权限

- 选题：任意已登录用户可调用 `UserController` 增删改查系统用户（相对 Extension 的 `sys_user_*` 缺口）
- 改动：`POST/DELETE/PUT/GET /user`、`GET /user/page`、`DELETE /user/batch` 分别加 `@PreAuthorize(hasAuthority('sys_user_add|del|edit|get|page|deleteBatch'))`；密文仍靠 `User.pwd`/`salt` `WRITE_ONLY`
- 文档：`docs/security-model.md` R-AUTH-02 ✅；roadmap 下一刀 → FE connector id / SocketIO 成员（R-AUTH-05）

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=UserControllerAuthContractTest,RemoteSystemUserHttpContractTest test`
- `./backend/dev-ensure.sh --restart`；liveness → 200
- 注册普通用户登录后 `GET /user/page` → **401**；`admin` 同路径 → 200 且 body 不含 `"pwd"`

#### 安全：R-DATA-02 connector 凭证优先已鉴权 dataSourceId

- 选题：connector 热路径每次收 raw JDBC+账密，绕过 `data_sources` 归属（R-AUTH-04 只护 CRUD）
- 改动：`ConnectorCredentialResolver` — body 含 `dataSourceId` 时经 `DataSourceAcl.requireOwned` 后服务端填入 url/username/password/driverClassName（覆盖客户端字段；url 空则按 host/type 合成）；`ConnectorController` ping/dbReverse*/sqlexec/dbsync 接入；无 id 仍允 raw（逆向/试连 UX）
- 文档：`docs/security-model.md` R-DATA-02 基本关闭；roadmap 下一刀 → FE 热路径迁 id

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=ConnectorCredentialResolverTest,ProjectAndDataSourceAclTest,JdbcUrlGuardTest test`
- `./backend/dev-ensure.sh --restart`；liveness → 200
- 登录后：`POST /ncnb/connector/ping` 仅 `{"dataSourceId":"<他人id>"}` → body `code=403`；自有 id（或带自有 id + 伪客户端账密）走服务端凭据试连；无 id 的 raw `jdbc:h2` 仍拒

#### 体验：注册壳键盘（Skip + Tab 序 + Enter 校验 + focus-visible）

- 选题：注册虽共用 `AuthBrandShell`，缺「跳到注册表单」文案；5 个 Form tip 问号抢 Tab；无聚焦 E2E
- 改动：`skipLabel=跳到注册表单`；tip icon `tabIndex=-1`（悬停保留，约束靠 rules）；`register-submit` testid
- E2E：`session`「注册壳键盘：Skip→表单；Tab 序；Enter 校验；focus-visible；无 trap」
- 文档：`docs/design-principles.md` §2 / control-matrix / regression-checklist；下一刀 → ~~落地页键盘打磨~~✅ / 404/403 壳核对

验证点：
- `cd frontend && npx playwright test tests/e2e/session.spec.ts --project=chromium --grep "注册壳键盘" --workers=1 --retries=0`

#### 体验：登录壳键盘（Skip + Tab 序 + Enter 提交 + focus-visible）

- 选题：`/login` 进页 Tab 先扫左品牌面板；暗面板焦点环弱；无 Skip 直达表单
- 改动：`AuthBrandShell` 首焦 Skip「跳到登录表单」→ `#auth-form-anchor`（`tabIndex=-1`）；壳内 `:focus-visible` brand 环（暗面板 surface）；密码框 Enter 提交既有；注册壳共用
- E2E：`session`「登录壳键盘：Skip→表单；Tab 序；Enter 提交；focus-visible；无 trap」
- `docs/design-principles.md` §2 / control-matrix / regression-checklist；下一刀 → ~~注册壳核对~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/session.spec.ts --project=chromium --grep "登录壳键盘" --workers=1 --retries=0`

#### 体验：分享壳键盘（Skip + Controls Tab + focus-visible）

- 选题：公开/分享只读进页 Tab 先扫顶栏；画布主操作键盘摩擦未对齐设计器 Skip / chrome 序
- 改动：分享页首焦 Skip「跳到关系图」→ `#share-canvas-stage`（`tabIndex=-1`）；模块 Segmented 包 `role=group` `aria-label=切换模块`；壳内 `:focus-visible` brand 环
- E2E：`share`「分享壳键盘：Skip→关系图；Controls 可达；MiniMap 出序；focus-visible」（`/demo`）
- `docs/design-principles.md` §2 / control-matrix / regression-checklist；下一刀 → ~~登录壳键盘~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/share.spec.ts --project=chromium --grep "分享壳键盘" --workers=1 --retries=0`

#### 安全：R-AUTH-03/04 关闭项目与 dataSources IDOR

- 选题：知 `projectId`/`dataSourceId` 即可跨租户读改删（含 JDBC 账密 / 全量 projectJSON）
- 改动：
  - `ProjectAcl` + `countProjectMember`：个人/团队 get、info、save、update、delete 校验 `project_user` 成员
  - `DataSourceAcl` + `ResourceOwnership`：dataSources get/update/patch/delete/batch 校验 creator；tree 按 creator 过滤；禁止 body 改写 creator
- 文档：`docs/security-model.md` R-AUTH-03/04 ✅；R-DATA-02 残留注明「凭证仍可走 raw JDBC」

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=ProjectAndDataSourceAclTest test`
- `./backend/dev-ensure.sh --restart`；`curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:9502/actuator/health/liveness` → 200
- 登录：`curl -sS -o /tmp/login.json -w '%{http_code}\n' -X POST http://localhost:9502/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"123456"}'` → 200
- 单测：user A 读 user B 的 dataSourceId → `ValidateException` FORBIDDEN；非成员 `isMember` → false

#### 安全：R-DATA-01/02 SQL+JDBC 门禁；R-DATA-03 删 Gitlab 死路径

- 选题：`queryInfo` `${sql}` 无白名单；connector 任意 JDBC/SQL；`GitlabController` 硬编码账密
- 改动：
  - `SqlGuard`：只读白名单（SELECT/EXPLAIN/SHOW/DESC）接 `QueryInfoServiceImpl`；mutate 拒 GRANT/OUTFILE 等接 `sqlexec`/`dbsync`
  - `JdbcUrlGuard`：mysql/mariadb/postgresql/oracle/sqlserver allowlist + 禁云元数据主机；`AbstractDBCommand`/`JdbcKit`/`PingDBCommand`
  - 删除 `GitlabController`/`GitlabService*`/`GitlabOauthVo` 与 `gitlab4j-api`（FE 零调用）
- 文档：`docs/security-model.md` R-DATA-01 ✅、R-DATA-02 部分 ✅、R-DATA-03 ✅

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=SqlGuardTest,JdbcUrlGuardTest,GitlabDeadPathRemovedTest test`
- `./backend/dev-ensure.sh --restart`；`curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:9502/actuator/health/liveness` → 200
- 登录：`curl -sS -o /tmp/login.json -w '%{http_code}\n' -X POST http://localhost:9502/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"123456"}'` → 200
- 带 token：`POST /ncnb/connector/ping` body `{"url":"jdbc:h2:mem:x","driverClassName":"org.h2.Driver","username":"sa","password":""}` → 业务失败且文案含「不支持的 JDBC」；合法 `jdbc:mysql://127.0.0.1:3306/erd` 仍可试连

#### 安全：R-CFG-02 prod 拒绝 admin 种子默认口令

- 选题：自托管 prod 仍可用 Flyway 种子 `admin`/`123456` 登录
- 改动：`erd.security.allow-demo-admin`（`ERD_ALLOW_DEMO_ADMIN`）；`prod`/默认=false → `AuthLoginController` 拒绝 `admin`+`123456`；`dev`=true 保本地 dogfood/E2E；改密后不受影响
- 文档：`docs/security-model.md` R-CFG-02 ✅；`docs/deployment.md` / `.env.example`

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=AuthLoginControllerTest test`
- `./backend/dev-ensure.sh --restart`；`curl -sS -o /tmp/login.json -w '%{http_code}\n' -X POST http://localhost:9502/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"123456"}'` → **200**（dev）
- 单测 `rejectsAdminSeedPasswordWhenDemoAdminDisallowed`：`allowDemoAdmin=false` → 401 且不调 `AuthenticationManager`

#### 安全：R-CFG-01 prod `JWT_SECRET` fail-fast

- 选题：`JWT_SECRET` 仓库弱默认可随 prod 上线签发/伪造 JWT
- 改动：`application-prod.yml` `erd.jwt.secret: ${JWT_SECRET}` 无默认；`JwtConfig` prod 拒绝 blank 与 `JwtProperties.INSECURE_DEV_DEFAULT`；本地/dev 保留 DX 默认；compose/`.env.example` 补 `JWT_SECRET`（compose 本地串 ≠ 仓库串）
- 文档：`docs/security-model.md` R-CFG-01 ✅；`docs/deployment.md` 排障表

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=JwtConfigTest,JwtSecretBindingTest test`
- `./backend/dev-ensure.sh --restart`；`curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:9502/actuator/health/liveness` → 200
- prod 缺 `JWT_SECRET`：占位符解析失败（单测 `prodRequiredPlaceholderFailsWhenJwtSecretUnset`）；设仓库默认串：`JwtConfig` 抛 `IllegalStateException`

#### 安全：R-AUTH-01 关闭匿名 loadUserByUsername 泄露密文

- 选题：匿名 `GET /user/loadUserByUsername/{u}` 经 ignore-urls + `@RestController` 返回 bcrypt `pwd`
- 改动：`application.yml` 移除 ignore；`RemoteSystemUser.loadUserByUsername` 去掉 `@GetMapping`（保留进程内 UserDetailsService）；`User.pwd`/`salt` `WRITE_ONLY` 防 JSON 泄露
- 文档：`docs/security-model.md` R-AUTH-01 ✅

验证点：
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Djacoco.skip=true -Dtest=RemoteSystemUserHttpContractTest test`
- `./backend/dev-ensure.sh --restart`；`curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:9502/user/loadUserByUsername/admin` → **401**
- `curl -sS -o /tmp/login.json -w '%{http_code}\n' -X POST http://localhost:9502/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"123456"}'` → 200（登录未断）

#### 安全：后端风险登记（鉴权/密钥/SQL/死配置）

- 选题：公网与自托管生产向风险梳理（非泛 code smell）
- 文档：`docs/security-model.md` 新增「已知风险」表（R-AUTH / R-CFG / R-DATA / R-OPS / R-DEAD）
- 关键发现：匿名 `GET /user/loadUserByUsername/{u}` 返回 bcrypt `pwd`+权限（ignore-urls + Service `@RestController`）；`JWT_SECRET` prod 未 fail-fast；`queryInfo` `${sql}` / `connector` 任意 JDBC 无白名单；项目与 dataSources IDOR；`GitlabController` 硬编码账密

验证点：
- `curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:9502/user/loadUserByUsername/admin` → 曾为 200；**已由 R-AUTH-01 切片关闭 → 401**
- `curl -sS http://localhost:9502/actuator/env` → 404；prod yml 仍见 `springdoc.*.enabled: false`
- 文档章节：「已知风险（后端登记，2026-08-03）」

#### 安全：prod 关闭 springdoc OpenAPI / Swagger UI

- 选题：`/v3/api-docs` 与 Swagger UI 在 Security 中 `permitAll`；`martin.swagger.enabled` 为死键（不门控 springdoc）；`application-prod.yml` 未真正关闭
- 改动：`application-prod.yml` 设 `springdoc.api-docs.enabled=false`、`springdoc.swagger-ui.enabled=false`；本地/非 prod 保持默认开启
- 文档：`docs/security-model.md` 记明门控方式与死键

验证点：
- `rg -n 'springdoc:' -A6 backend/src/main/resources/application-prod.yml` 见 api-docs/swagger-ui `enabled: false`
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -DskipTests compile`
- `./backend/dev-ensure.sh --restart`；默认 profile 下 `curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:9502/v3/api-docs` → 200（本地仍开）

#### 体验：画布节点级 Tab（RF wrapper / 边 chip / Frame）

- 选题：RF 默认每个节点/边 wrapper `tabindex=0` + 边基数 chip 无条件进序 → 密图 Tab trap；Frame 重命名仅双击
- `ReactFlow` / 分享壳：`nodesFocusable={false}` `edgesFocusable={false}`；自研控件按选中门控
- 边 chip：仅选中边或邻接表时 `tabIndex=0`，否则 `-1`；Frame 标题 `role=button` + 选中进序 + Enter/Space 重命名；速查卡同步
- E2E：`relation`「画布节点级 Tab：无选中无节点停靠；选中边 chip / Frame 可入」；复跑 chrome / 字段环
- `docs/design-principles.md` §2 / control-matrix / regression-checklist；下一刀 → ~~分享壳键盘或首焦 Skip 收尾打磨~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "画布节点级 Tab" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "画布 chrome Tab 序|字段浏览器 Tab 环" --workers=1 --retries=0`

#### 配置：Spring 数据源/Redis 对齐 Railway 插件原生名（MYSQL* / REDIS*）

- 选题：Railway MySQL/Redis 插件注入 `MYSQLHOST`/`REDISHOST` 等，而非 `DB_*` / `SPRING_DATA_REDIS_URL`；`92aabea` 收拢到 `DB_*` 与插件不合
- 改动：JDBC 仅认 `MYSQLHOST`/`MYSQLPORT`/`MYSQLDATABASE`/`MYSQLUSER`/`MYSQLPASSWORD`；Redis 仅认 `REDISHOST`/`REDISPORT`/`REDISUSER`/`REDISPASSWORD`；每项单一占位符、零嵌套回退
- 空 Redis 密码：`RedisBlankCredentialNormalizer` 将空白 user/password 置 null，避免 Redisson `AUTH ""`
- 文档 / compose / `.env.example` / CI / ADR-0020 同步；不读 `MYSQL_URL`/`REDIS_URL` 作主接线

验证点：
- `rg -n '\\$\\{[^}]*\\$\\{' backend/src/main/resources/` = 0
- `rg -n 'DB_HOST|DB_USERNAME|SPRING_DATA_REDIS_URL' backend/src/main/resources/` = 0
- `cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Dtest=RedisDataPropertiesBindingTest test`
- `./backend/dev-ensure.sh --restart`；`curl -sf http://localhost:9502/actuator/health/liveness` → UP

#### 配置：Spring 数据源占位符收拢为单一 DB_*（Railway 对齐）

- 选题：`application.yml` / `application-prod.yml` 多层 `${A:${B:${C}}}` 与 Railway「可选配置」文档不一致，贡献者易追死别名
- 改动：JDBC 仅认 `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USERNAME` / `DB_PASSWORD`（两池共用）；去掉 `MYSQL*` / `DB_USER` / `DB_ERD*` / `DB_MARTIN` 嵌套回退
- 文档：`docs/deployment.md`、ADR-0020、`.env.example` 同步；compose 仍 `MYSQL_*`←`DB_*` 注入进 MySQL 容器，backend 服务注入 `DB_*`
- **已由上条 MYSQL*/REDIS* 切片取代**（勿再按本条配置 Dashboard）

验证点：
- `rg -n '\\$\\{[^}]*\\$\\{' backend/src/main/resources/` = 0
- `./backend/dev-ensure.sh --restart`；`curl -sf http://localhost:9502/actuator/health/liveness` → UP

#### 体验：左树键盘漫游（模型树 Arrow / Enter）

- 选题：Skip 到模型树后只能 Tab 进搜索；方向键无法入树；无法键盘开表/关系
- `DataTable` 地标：↓/↑/Enter 切入 `QueryTree.focusKeyboard`（antd rc-tree 键盘面）；`data-tree-kb-active` + brand 环；Enter 复用既有 `handleSelect`（`focusTable` / 开关系）
- 速查卡登记；Skip→Tab 进搜索不变（无 trap）
- E2E：`relation`「左树键盘漫游：Skip↓入树；Enter 定位表/开关系；focus-visible；无 trap」
- `docs/design-principles.md` §2 / regression-checklist；下一刀 → ~~节点级 Tab 再收口（或分享壳键盘）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "左树键盘漫游" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "设计器 Skip" --workers=1 --retries=0`

#### 体验：画布 chrome Tab 序（Controls / MiniMap / 工具栏）

- 选题：MiniMap `pannable`+`zoomable` 经 d3-zoom 写 `tabindex=0` → Tab 陷阱；Controls 键盘环弱；工具栏与缩放钮割裂
- `ErdMiniMap`：MutationObserver 强制 SVG `tabindex=-1`（鼠标拖/滚保留；`role=img` 名保留）；设计器+分享共用
- Controls `:focus-visible` brand 环；工具栏 `role=toolbar`「画布工具」
- E2E：`relation`「画布 chrome Tab 序：Controls→工具栏；MiniMap 不出序；focus-visible」
- `docs/design-principles.md` §2 / control-matrix / regression-checklist；下一刀 → ~~左树键盘漫游（或节点级 Tab 再收口）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "画布 chrome Tab 序" --workers=1 --retries=0`

#### 体验：画布字段浏览器 Tab 环（键盘建模）

- 选题：所有表字段 + 行内 PK/✎/× 全进 Tab 序 → 密图画布 trap；未选中表仍可 Tab 入
- `TableNode`：仅选中表字段行/`添加字段`/打开表设计/`改名` `tabIndex=0`；未选中 `-1`；行内 PK·✎·× `-1`（Enter 编辑、Delete 删）；字段行↑↓、`:focus-visible` brand 环；`?` 速查同步
- E2E：`relation`「画布字段浏览器 Tab 环：选中表穿字段无 trap」；速查卡文案断言同步
- `docs/design-principles.md` §2；下一刀 → ~~画布工具栏 / MiniMap / Controls Tab 序收口~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "字段浏览器 Tab 环" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "快捷键速查" --workers=1 --retries=0`

#### 体验：表设计 Cmd/Ctrl+1/2/3 签页直切（键盘建模）

- 选题：表设计三签（字段 / 索引 / 元数据应用）只能鼠标点；Cmd+K 体系缺签页直切
- `TableTab`：`Cmd/Ctrl+1|2|3` → `field|index|code`；仅表设计签挂载时监听（画布不抢浏览器签页）；输入框 / contentEditable 不拦；`?` 速查卡登记
- E2E：`relation`「表设计 Cmd/Ctrl+1/2/3：直切字段/索引/元数据应用」；速查卡断言同步
- `docs/design-principles.md` §2；下一刀 → ~~画布节点/字段浏览器 Tab 环~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "表设计 Cmd/Ctrl\\+1/2/3" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "快捷键速查" --workers=1 --retries=0`

#### 体验：设计器 Skip + 焦点环（键盘建模）

- 选题：进设计器 Tab 先扫冗长顶栏；模型树/签页/画布无 Skip；焦点环不可见
- `DesignLayout`：`erd-skip-nav`「跳到模型树」「跳到主工作区」→ `#erd-design-tree` / `#erd-design-workspace`（`tabIndex=-1`）；设计器 `:focus-visible` brand 环；签栏/画布工具栏补环；左树文件夹 `+` Enter/Space
- E2E：`relation`「设计器 Skip：首项 Tab 达跳过链；落到模型树/主工作区无 trap」
- `docs/design-principles.md` §2；下一刀 → ~~Cmd+1/2/3 签页直切~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "设计器 Skip" --workers=1 --retries=0`

#### 体验：表设计字段签 JExcel Tab 焦点序（键盘建模）

- 选题：工具栏仅 remove 可 Tab；其余 6 个 icon 键盘不可达；remove 可聚焦但 Enter/Space 不触发；网格无 Tab 入口
- 全工具栏 `role=button` + `tabindex=0` + `aria-label`(title) + Enter/Space→click；`.jexcel_content` `jexcel-grid` 可聚焦，Enter 选 A1；不拦 Tab/Shift+Tab（无 trap）
- E2E：`relation`「表设计字段签：工具栏 Tab 可达且 Enter 增行；网格无 trap」
- `docs/design-principles.md` §2；下一刀 → ~~设计器全局焦点环审计（左树/签页/画布）~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "工具栏 Tab 可达" --workers=1 --retries=0`

#### 体验：表设计索引签半成品行不静默丢（键盘建模）

- 选题：字段签半成品已 toast+中止；索引签 `fields` 可为 `[]` /「;」空串 → 旧 `isEmptyCell` 漏检，仍可能静默写坏/丢索引
- `isEmptyCell`：数组与多选空串视为空；索引签必填仍 `name`+`fields`；半成品 toast + 中止写回（与字段签同形）
- E2E：`relation`「表设计索引签：半成品行不静默丢索引；Esc 停在网格」
- `docs/design-principles.md` §5；下一刀 → ~~字段签 Tab 焦点序~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "索引签：半成品行不静默丢" --workers=1 --retries=0`

#### 体验：画布 `?` 快捷键速查卡（建模回路）

- 选题：Cmd+K / Delete 确认 / Tab 字段跳行已落地，但发现路径差；原则写了 `?` 速查却无实现
- `?`（Shift+/）或工具栏「?」→ `role=dialog`「快捷键」列出命令面板、撤销重做、删确认、Tab 字段导航、Esc 等；Esc / 再按 `?` / 遮罩关闭；与命令面板互斥
- E2E：`relation`「快捷键速查：? 打开 aria dialog」
- `docs/design-principles.md` §2；roadmap ✅ 本刀，下一刀 → ~~表设计签半成品静默丢~~✅ → ~~索引签键盘半成品~~✅ → 字段签 Tab 焦点序

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "快捷键速查" --workers=1 --retries=0`

#### 体验：表设计字段签半成品行不静默丢（键盘建模）

- 选题：JExcel `notEmptyColumn` 静默 reject 缺类型行 → Enter/Tab/清类型后字段从 store 消失且无 toast；与画布空名反馈不一致
- `saveValidData`：全空草稿可丢；半成品中止写回 + toast「有行未填完必填项…」；字段签必填对齐为 `name`+`typeName`；网格内 Esc stopPropagation
- E2E：`relation`「表设计字段签：半成品行不静默丢字段；Esc 停在网格」
- `docs/design-principles.md` §4；下一刀 → ~~索引签键盘半成品~~✅ → ~~字段签 Tab 焦点序~~✅

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "半成品行不静默丢" --workers=1 --retries=0`

#### 体验：左树点表定位/高亮（建模回路）

- 选题：左树点表直开表设计，密图找表仍绕命令面板；期望与面板同语言「选中 + fitView + flash」
- 点树表节点 → 切该模块关系图签 + `pendingLocateTable` → 复用画布 `focusTable`；表设计改走菜单「编辑表」
- E2E：`relation`「左树点表：定位选中并高亮」；`model-design-ux` 表设计入口改菜单
- `docs/design-principles.md` §2/§4；roadmap ✅ 本刀，下一刀 → 表设计签 / 字段行键盘建模摩擦（优先于碎色·密度）

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "左树点表" --workers=1 --retries=0`

#### 体验：命令面板搜表定位/高亮（建模回路）

- 选题：Cmd/Ctrl+K 只能筛静态命令；密图画布找不到表，设计原则里「Cmd+F 搜索表」名存实亡
- 命令面板注入当前图全部表项（hint「定位到画布」/中文名）；执行 → 选中 + `fitView` 对准 + `locate-flash` 脉冲（`data-locate-flash`）
- `Cmd/Ctrl+F` 同开面板；空态文案「无匹配命令或表」；placeholder 含表名
- E2E：`relation`「命令面板：搜表定位选中并高亮」（视口挪开→搜表→选中+闪光+回视口）；既有「命令面板」空态文案同步
- `docs/design-principles.md` §2/§4；roadmap ✅ 本刀，下一刀 → 左树点表定位/高亮（优先于碎色·密度）

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "命令面板" --workers=1 --retries=0`

#### 体验：左树搜索 × 清过滤 + 无匹配空态（建模回路）

- 选题：antd Search `onSearch` 不随 allowClear 触发 → 点 × 后输入空但 `searchKey` 残留，树仍过滤；无匹配时只剩空「表」文件夹、无引导
- `QueryTree`：清空时立刻 `onSearch('')`；无匹配空态「未找到匹配的表」（`tree-search-empty`）；`aria-label=搜索表名`
- `DataTable`：搜索时隐藏无命中实体的模型；零匹配走空态
- E2E：`multi-diagram`「左树搜索：无匹配空态；× 清除残留过滤」
- `docs/design-principles.md` §4；roadmap ✅ 本刀，下一刀 → 命令面板搜表定位/高亮（优先于碎色·密度）

验证点：
- `cd frontend && npx playwright test tests/e2e/multi-diagram.spec.ts --project=chromium --grep "左树搜索" --workers=1 --retries=0`

#### 体验：元数据应用修改/删除字段签对齐模板（建模回路）

- 选题：「修改字段」子签挂了 `deleteFieldTemplate`（DROP），「删除字段」挂了 `updateFieldTemplate`（MODIFY）→ 错标 affordance，复制 DDL 可误伤；顺手去掉「创建索引」无效 `closable`
- `DbTab`：标签与 `templateCode`/`key` 对齐；差异脚本拉版本改走版本页同通道（无 JDBC → `__erd_snapshot__`），禁静默空脚本；失败 toast「拉取版本失败…」
- `meta-ddl-sql-{templateCode}` 供断言
- E2E：`relation`「元数据应用：修改/删除字段签标签对齐模板」：版本基线→改类型见 MODIFY 仅在修改签；删除签空（无 MODIFY/DROP）
- `docs/design-principles.md` §4；roadmap ✅ 本刀，下一刀 → 左树搜索清除残留过滤 / 无匹配空态（优先于碎色·密度）

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "元数据应用：修改/删除字段签" --workers=1 --retries=0`

#### 体验：字段级 unique 说明（索引唯一 CTA + 画布 UK）

- 选题：字段无 `unique` 列（UNIQUE 只在 `indexs[].isUnique`）；用户在字段签/画布找「唯一」易迷路
- 字段签顶栏 hint +「去索引签设置唯一」（`field-unique-hint` / `field-goto-index`）
- 索引空态：「添加唯一索引」（`index-empty-add-unique`）+ 说明；有行后「再添加一条唯一索引」+ UNIQUE 提示
- 画布：参与唯一索引的字段显示只读 `UK` 徽章（`field-uk-badge`）；编辑仍走索引签
- E2E：`relation`「字段级 unique 说明：索引唯一 CTA → 画布 UK；字段签跳索引」
- `docs/design-principles.md` §4；roadmap ✅ 本刀，下一刀 → 建模回路其它摩擦（优先于碎色·密度）

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "字段级 unique 说明" --workers=1 --retries=0`

#### CI：清理 GitHub Actions 告警与硬失败

- Actions 升到 Node 24 runtime 主版本：`checkout@v5`、`setup-node@v5`、`setup-java@v5`、`upload-artifact@v6`、`upload-pages-artifact@v5`、`deploy-pages@v5`、docker/`softprops`/`wrangler` 对应大版本（消 Node 20 deprecation 噪声）
- `e2e-smoke`：去掉 MySQL service `options` 里非法的 `--character-set-server`（docker create 未知旗标 → exit 125）；init 后建 `erd`/`erd` 用户并对齐 `DB_HOST`
- Docs：`regression-checklist` `opacity<1` → `` `opacity < 1` ``；文档里裸 `{name}` 改成 `` `{name}` ``（MDX SSG）
- CF Pages：`preCommands` 补 `pages project create … || true`，避免 Project not found 拖红整条 Docs/Demo
- Frontend：去掉已失效的 `@umijs/fabric` extends；`.eslintrc.js` 直连 `@typescript-eslint` + `react-hooks`；`eslint` 升至 8；`lint:js:ci` 去掉缺失的 `pretty` formatter

验证点：
- `cd frontend && yarn lint:js:ci`
- `cd website && yarn build`（本地已过）
- `gh run list --limit 10`（push 后 Docs / Frontend CI / e2e-smoke）

#### 体验：左树「编辑表」开表设计字段签（建模回路）

- 选题：表菜单「编辑表」仅弹重命名层，与字面「编辑」及画布「打开字段」期望不符
- 「编辑表」→ `addTab(..., designPane: 'field')`（同画布 `canvas-open-field`）；另项「重命名表」→ EntityModal（标题同步为「重命名表」）
- E2E：`multi-diagram`「左树「编辑表」开表设计字段签」：menuitem → 字段签选中 + 重命名另项
- `docs/design-principles.md` §4；roadmap 下一刀 → 字段级 unique 说明

验证点：
- `cd frontend && npx playwright test tests/e2e/multi-diagram.spec.ts --project=chromium --grep "编辑表" --workers=1 --retries=0`

#### 体验：左树「关系」文件夹 + 直建图（建模回路）

- 选题：「表」文件夹有旁路 `+` 建表；「关系」文件夹缺对称 CTA，只能绕树头「新建」
- 「关系」旁 `+`（`aria-label=新建关系图` / `tree-folder-add-relation`）→ EntityModal → `createDiagram`；「表」旁 `+` 补 `aria-label=新建表`
- E2E：`multi-diagram`「左树「关系」文件夹 + 直建图」：tree scoped `getByRole('button', { name: '新建关系图' })`
- `docs/design-principles.md` §4；roadmap 下一刀 →「编辑表」只改名

验证点：
- `cd frontend && npx playwright test tests/e2e/multi-diagram.spec.ts --project=chromium --grep "关系」文件夹" --workers=1 --retries=0`

#### 体验：左树新建关系图路径 E2E（建模回路）

- 选题：顶栏/画布「新建关系图」已覆盖；树头「新建 → 新建关系图」→ EntityModal → `createDiagram` 缺聚焦回归
- E2E：`multi-diagram`「左树新建关系图」：`getByRole('button', { name: '新建', exact: true })` → menuitem → 名称-only 弹层 → 树 + switcher + toast
- `docs/design-principles.md` §4 补树头新建正例；roadmap 下一刀前移

验证点：
- `cd frontend && npx playwright test tests/e2e/multi-diagram.spec.ts --project=chromium --grep "左树新建关系图" --workers=1 --retries=0`

#### 体验：左树重命名关系图接通（建模回路）

- 选题：「编辑关系」打开空 FK（表1/表2）弹层，`handleModalOk` 未写 `renameDiagram` → 死 affordance
- 菜单文案「重命名关系图」→ EntityModal 名称-only → `renameDiagram`；顶栏「新建关系图」同路径 `createDiagram`
- 隐藏关系图复制/剪切（无实现）；删掉 EntityModal 废弃空 FK 字段
- E2E：`multi-diagram`「左树重命名关系图」
- `docs/design-principles.md` §4 补正例

验证点：
- `cd frontend && npx playwright test tests/e2e/multi-diagram.spec.ts --project=chromium --grep "左树重命名关系图" --workers=1 --retries=0`

#### 体验：左树删除模型/关系图二次确认（掌控感）

- 选题：关系图菜单「删除」文案误走「表」且 `onOk` 未调 `removeDiagram`；模型删依赖 `currentModuleIndex` 易误伤
- 非主关系图：`Modal.confirm`（仅删图不删表）→ `removeDiagram`；主图不展示删除项
- 模型：`Modal.confirm`（级联删表/图文案）→ 按名 `removeModule` + toast
- E2E：`multi-diagram`「左树删除关系图/模型二次确认」
- `docs/design-principles.md` §5 补左树删确认正例

验证点：
- `cd frontend && npx playwright test tests/e2e/multi-diagram.spec.ts --project=chromium --grep "左树删除关系图/模型二次确认" --workers=1 --retries=0`

#### 体验：画布删分组（Frame）二次确认（掌控感）

- 选题：选中 Frame Delete/Backspace 立即 `removeFrame`，与已对齐的删表/删边掌控感不一致
- 选中分组 Delete/Backspace → `Modal.confirm`（标明仅删框不删表）；取消保留；确认后 toast「已删除分组」
- E2E：`diagram-frame`「删除分组二次确认：取消保留；确认后移除；表仍在」
- `docs/design-principles.md` §5 补 Frame 删确认正例

验证点：
- `cd frontend && npx playwright test tests/e2e/diagram-frame.spec.ts --project=chromium --grep "删除分组二次确认" --workers=1 --retries=0`

#### 体验：画布删表/删边二次确认（掌控感）

- 选题：design-principles「掌控感」反例——连接线 Delete 立即删；画布表 Delete 仅 toast 赶去树侧
- 选中边 Delete/Backspace → `Modal.confirm`（`onEdgesDelete`）；基数 chip 聚焦 Delete/Backspace 同确认（chip 叠中难以点路径）
- 选中表节点 Delete/Backspace → 同文案确认后才 `removeEntity`（对齐模型树）；取消保留
- `selectNodesOnDrag={false}`：表头 `nodrag` 区域也可单击选中（否则无法键盘删表）
- E2E：`relation`「画布删表/删边二次确认」+ 全旅程/删边持久化路径同步点确认钮
- 关闭 `docs/design-principles.md` §5 右键/连接线无确认反例（RF 无右键删菜单；键盘/chip 路径已确认）

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "画布删表/删边二次确认" --workers=1 --retries=0`

#### 体验：JExcel 工具栏删除二次确认（建模回路）

- 选题：共享 JExcel 工具栏 `remove` 无确认 → 字段/索引表静默删洞（表内索引删除 CTA 已补，工具栏仍绕过）
- `remove` → 未选中 toast「未选中行」；有选中 → `Modal.confirm`（确定删除选定行 + 不可逆）才 `deleteRow`
- 工具栏项 `id`/`data-testid=jexcel-toolbar-remove` + `role=button`/`aria-label=删除选中行`（对齐 getByRole）
- E2E：`relation`「JExcel 工具栏删除二次确认：取消保留；确认后行消失」

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "JExcel 工具栏删除二次确认" --workers=1 --retries=0`

#### 体验：索引签删除二次确认（建模回路）

- 选题：索引已能加；JExcel 工具栏 `remove` 无文案且无确认 → 破坏性静默删风险
- 表下可访问「删除索引 {name}」链路按钮（`index-delete-list` / `index-delete-N` / `aria-label`）→ `Modal.confirm`（文案对齐删字段：确定删除 + 不可逆）
- 取消保留行；确认后 `updateEntityIndex` 写回（含 `[]` → 空态 CTA）
- E2E：`relation`「索引签删除二次确认：取消保留；确认后回空态」

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "索引签删除二次确认" --workers=1 --retries=0`

#### 体验：索引签「再加一行」表内 CTA（建模回路）

- 选题：空态「添加第一个索引」✅；已有首条后只能靠 JExcel 工具栏无文案「+」→ 死 affordance
- 表下 dashed CTA「+ 再添加一条索引」（`index-add-row` / `aria-label`）；种子 `{name: <表>_IDXn, fields: [首字段]}` 追加写回（名冲突自增）；无字段 toast 引导
- `JExcel` `key=index-grid-${length}`：条数变重挂（组件不吃 props.data）
- E2E：`relation`「索引签再加一行 CTA：首条后表内引导；无死 affordance」

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "索引签再加一行 CTA" --workers=1 --retries=0`

#### 体验：画布打开表设计「元数据应用」签（建模回路）

- 选题：字段/索引已有画布底栏入口；「元数据应用」只能绕左树或粘滞内签 → 死 affordance 感
- 表节点底栏并排「字段 | 索引 | 元数据」：`canvas-open-code` / `aria-label=打开元数据应用` → `designPane: code`
- `CodeTab` 加 `data-testid=table-code-edit`（对称 field/index edit）
- E2E：`relation`「画布打开元数据应用签：直达表设计元数据；无死 affordance」

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "画布打开元数据应用签" --workers=1 --retries=0`

#### 体验：索引签空态 CTA（建模回路）

- 选题：`indexs: []` 时 JExcel 吃空数组 → 白屏/死 affordance；无「加第一条」引导
- 空态：`还没有索引` + 主 CTA「添加第一个索引」（`index-empty-add` / `aria-label`）
- CTA：用首字段种子 `{name: <表>_IDX1, fields: [首字段]}` 写回；无字段则仅展开空表
- E2E：`relation`「索引签空态 CTA：画布→索引→添加第一个索引」

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "索引签空态 CTA" --workers=1 --retries=0`

#### 体验：画布打开表设计「字段」签（对称入口）

- 选题：索引签已有画布入口；全量表格编辑 / 从索引切回字段仍需绕左树或粘滞内签
- 表节点底栏并排「字段 | 索引」（同高不叠行）：`canvas-open-field` / `aria-label=打开字段` → `designPane: field`；索引按钮不变
- `TableInfoEdit` 加 `data-testid=table-field-edit`（对称 `table-index-edit`）
- E2E：`relation`「画布打开字段签：直达表设计字段；无死 affordance」

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "画布打开字段签|画布打开索引签" --workers=1 --retries=0`

#### 体验：画布打开表设计「索引」签（建模回路）

- 选题：字段已在节点内联；唯一/复合索引仍只在表设计「索引」签，画布无入口 → 左树绕路或死 affordance 感
- 表节点底栏「索引」按钮（`data-testid=canvas-open-index` / `aria-label=打开索引`）→ `addTab` + `designPane: index`，直达表设计索引签
- `ModuleEntity.designPane` + `consumeDesignPane`（用户切换内签后清除）；树打开不带 pane 时清定位
- E2E：`relation`「画布打开索引签：直达表设计索引；无死 affordance」

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "画布打开索引签" --workers=1 --retries=0`

#### 体验：字段默认值（defaultValue）内联编辑（建模回路）

- 选题：常见默认值只能开表设计/EntityModal；画布编辑态缺 `defaultValue`，主栏已满（PK/NN/AI/隐 + 名/中文名/类型）再挤横向会糊
- 编辑态次行「默认」input（`aria-label=默认值`）；Enter/blur 与名/中文名同批落盘；Escape 丢弃草稿（已即时落盘的类型/PK/NN/AI/隐不受影响）
- Tab：字段名 → 中文名 → 类型 → 默认值 → 下一行（末行仍新建）；Shift+Tab 逆序；名/中文名/类型序不变
- 浏览态类型旁 muted `=值`；可空清除
- E2E：`relation`「字段默认值内联编辑；Tab 入 default；Escape 丢弃」+「字段 Tab」同步 Tab 序

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "字段默认值|字段 Tab 跳下一行" --workers=1 --retries=0`

#### 体验：表头实体中文名（chnname）内联编辑（建模回路）

- 选题：表头 ✎ 只能改实体名；中文名只能开 EntityModal / 表设计；字段 chnname 已内联后表头仍断环
- 表头编辑态双栏：表名 +「表中文名」；Tab 表名→中文名→提交；Enter/blur 经 `renameEntity` 落盘；Escape 丢弃草稿（拦 blur）
- 仅改中文名也触发 save-status；中文名可空；空表名 toast 并留在编辑
- E2E：`relation`「表头中文名内联编辑；Tab 入；Escape 丢弃」；既有「表头 ✎ 可改名」仍绿

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "表头中文名|表头 ✎ 可改名" --workers=1 --retries=0`

#### 体验：字段中文名（chnname）内联编辑（建模回路）

- 选题：字段别名/注释只能开 EntityModal 或表设计签；画布编辑态缺 chnname，Tab 直接跳行跳过中文名
- 编辑态加「中文名」input（`aria-label`）；Enter/blur 与字段名同批落盘；Escape 丢弃未提交别名（已即时落盘的 PK/NN/AI/隐不受影响）
- Tab：字段名 → 中文名 → 类型 → 下一行（末行仍新建）；字段名空 + Tab 仍走空名 toast；Shift+Tab 逆序
- E2E：`relation`「字段中文名内联编辑；Tab 入 chnname；Escape 丢弃」+「字段 Tab」同步 Tab 序

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "字段中文名|字段 Tab 跳下一行" --workers=1 --retries=0`

#### 体验：Delete/Backspace 删字段二次确认（建模回路）

- 选题：画布「×」删字段无确认；键盘 Delete/Backspace 只能删边/Frame，字段无键盘删除回路；编辑态 Backspace 必须仍只改字
- 浏览态单击选中字段 → Delete/Backspace → `Modal.confirm`（不可逆文案）；取消不删；「删除字段」按钮同确认
- 编辑态 input Backspace 不弹确认、不删行；Escape / Tab / 空名 toast 路径不变
- E2E：`relation`「删除字段：按钮二次确认；选中 Delete/Backspace；编辑态 Backspace 不删」

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "删除字段" --workers=1 --retries=0`

#### 体验：编辑态 Escape 取消改名（建模回路）

- 选题：字段 Escape 只 `setEditing(null)`，卸 input 时 blur 仍走 `commit` → 取消变静默落盘（改名/新建草稿误保存）
- Escape → `ignoreBlur` + 清空 editingRef 再退出；未提交字段名丢弃；已即时落盘的类型/PK/NN/AI/隐不受影响
- E2E：`relation`「编辑态 Escape 取消改名；不经 blur 落盘」

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "编辑态 Escape" --workers=1 --retries=0`

#### 体验：编辑态隐藏即时 save-status + 表底恢复（建模回路）

- 选题：编辑态已有 PK/NN/AI 即时落盘；`relationNoShow` 只能绕表设计签改，画布缺隐藏开关；隐藏后行离画布需明确反馈与可发现恢复
- 编辑态加「隐」勾选（已有字段）；勾选 → 立刻 `relationNoShow` + 退出编辑，顶栏 `save-status` 即时「已保存」；toast 提示表底「已隐藏」/表设计可恢复
- 表节点底栏「已隐藏 N 个字段」展开 →「显示」取消隐藏（仍可走表设计「字段」签）
- E2E：`relation`「编辑态隐藏即时 save-status；toast + 表底恢复显示」

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "编辑态隐藏" --workers=1 --retries=0`

#### 体验：编辑态自增勾选即时 save-status（建模回路）

- 选题：编辑态已有 PK/NN 即时落盘；`autoIncrement` 只能绕表设计签改，画布回路缺自增开关（隐藏 `relationNoShow` 勾上即离画布，ROI 低于自增）
- 编辑态加 AI（自增）勾选；已有字段勾/取消 → 立刻 `updateEntityFields`，顶栏 `save-status` 即时「已保存」
- 空名 toast / Tab 跳行路径不变；字段级仍无 unique（唯一在索引）
- E2E：`relation`「编辑态自增勾选即时 save-status；空名 toast 保留」

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "编辑态自增" --workers=1 --retries=0`

#### 体验：编辑态非空勾选即时 save-status（建模回路）

- 选题：字段编辑态仅有 PK 元数据可即时落盘；`notNull` 只能绕表设计签改，画布回路缺非空开关
- 编辑态加 NN（非空）勾选；已有字段勾/取消 → 立刻 `updateEntityFields`，顶栏 `save-status` 即时「已保存」；PK 勾选时强制非空且禁用取消
- 字段级无 `unique`（唯一在索引）；空名 toast / Tab 跳行路径不变
- E2E：`relation`「编辑态非空勾选即时 save-status；空名 toast 保留」

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "编辑态非空" --workers=1 --retries=0`

#### 体验：编辑态 PK 勾选即时 save-status（建模回路）

- 选题：字段编辑态勾 PK 只改本地 state，要等 Enter/blur 才落盘；类型已即时保存，PK 不对齐
- 已有字段编辑态勾选/取消主键 → 立刻 `updateEntityFields`，顶栏 `save-status` 即时「已保存」；新建行仍等命名提交
- 空名 toast / Tab 跳行路径不变
- E2E：`relation`「编辑态 PK 勾选即时 save-status；空名 toast 保留」

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "编辑态 PK" --workers=1 --retries=0`

#### 体验：末行 Tab 新建字段（建模回路）

- 选题：字段 Tab 已能跳行，但末行 Tab 只退出编辑 → 还要再点「+ 添加字段」打断键盘回路
- 末行（或新建提交后仍无下一行）Tab → 开 `__NEW__` 空行；填名再 Tab → 落盘并再开新建
- 空名 toast「字段名不能为空」路径不变（改已有字段）；新增空名仍=取消
- E2E：`relation`「字段 Tab 跳下一行；末行新建；类型即时 save-status」

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "字段 Tab" --workers=1 --retries=0`

#### 体验：字段 Tab 跳下一行 + 类型即时 save-status（建模回路）

- 选题：字段内联编辑只能 Enter/blur 提交；Tab 不进下一行；仅改类型无即时保存反馈
- Tab / Shift+Tab：校验通过后提交并进下一/上一字段编辑；空名仍 toast「字段名不能为空」并留编辑
- 已有字段改类型 → 立刻 `updateEntityFields`，顶栏 `save-status` 即时「已保存」（不必等 Enter）
- E2E：`relation`「字段 Tab 跳下一行；类型即时 save-status」

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "字段 Tab 跳下一行" --workers=1 --retries=0`

#### 体验：字段行内编辑 affordance + 空名反馈（建模回路）

- 选题：字段只能双击进编辑，空名 blur/Enter 静默退出丢改动；表头已有 ✎，字段行不对齐
- 字段行 hover 露 ✎（`编辑字段`）→ 进内联编辑；双击仍可用；输入/类型补 aria-label
- 改已有字段空名 → toast「字段名不能为空」并留在编辑（新增空名仍=取消）
- 成功改名后靠顶栏 `save-status`「已保存」；E2E：`relation`「字段 ✎ 可改名；空名有 toast」

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "字段 ✎ 可改名" --workers=1 --retries=0`

#### 体验：连线失败可见反馈（重复关联 / 非法锚点，建模回路）

- 选题：拖连线重复同一对或落到非法锚点时静默无反馈，用户以为坏了
- `addAssociation` 重复 → toast「该字段关联已存在，无需重复连线」；缺模块也提示
- 画布 `onConnect` 角色/不完整 → 可行动 warning；`onConnectStart/End`：非法锚点或表体未对准接入点有 toast，空白处取消不打扰
- 合法连线路径不变；E2E：`relation`「连线失败反馈：重复关联与非法锚点有 toast」

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "连线失败反馈" --workers=1 --retries=0`

#### 体验：画布工具栏「新建表」一键上图（建模回路，ADR-0016）

- 选题：空态有「新建第一张表」，非空画布却无建表 CTA → 只能左树弹层或 Cmd+K（多余步骤 / CTA 不清）
- 工具栏加 `canvas-create-table`（aria「新建表」）→ 复用 `createFirstTable`，创建即上图 + toast「表添加成功」
- 不改色 token / 密度；自动布局仍为工具栏 `--primary`
- E2E：`relation`「工具栏新建表：非空画布一键上图」+ 工具栏可访问名含「新建表」

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "工具栏新建表|工具栏：撤销" --workers=1 --retries=0`

#### 体验：Frame 标题扫读层次（分组名 vs muted meta，ADR-0016）

- 选题：Frame chrome label 11/600 与 meta 10 同阶，分享截图分组名扫不过；停色 token，攻字重/字号/padding vs muted
- `.erd-frame-label` 12px / 700；`.erd-frame-meta` 10/400 + opacity 0.88；chrome pad 0 8、height 仍 22；rename input 对齐主标题
- 双击重命名回路不动；设计器 / 分享只读共用 `reactflow-relation.scss`
- E2E：`diagram-frame` 层次 + 重命名、`demo` RBAC Frame；截图 `diagram-frame-title-hierarchy.png` / `demo-frame-title-hierarchy.png`

验证点：
- `cd frontend && npx playwright test tests/e2e/diagram-frame.spec.ts --project=chromium --grep "新建分组|重命名" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --grep "免登录 /demo" --workers=1 --retries=0`

#### 体验：表节点密表再压（分享截图密度，ADR-0016）

- 选题：表头 pad 8 + 字段行 minH 22 在多字段分享截图仍偏松；停色 token，攻密度且保留标题/徽章层次
- `.erd-table-header` pad 6×10/12、gap 6；`.erd-field-row` minH 20 / lh 15 / pad 1；徽章仍 10/700/`min-width` 22（lh 14）
- 布局估算：`FIELD_ROW_H=24`、`NODE_CHROME_H=48`、`NODE_FOOTER_H=32`；设计器/分享同 SCSS
- E2E：`relation`/`demo` 断言密度 + 层次；截图 `diagram-table-node-density.png` / `demo-table-node-density.png`

验证点：
- `cd frontend && npx tsx src/utils/graphLayout.test.ts`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "PK/FK 与边样式" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --grep "免登录 /demo" --workers=1 --retries=0`

#### 体验：画布工具栏/Controls 扫读层次（ADR-0016）

- 选题：顶栏散粒描边钮 + Controls 四钮等权，分享截图主操作扫不过；停色 token，攻 chrome 层次
- `.erd-canvas-toolbar`：单块 surface chrome；工具无独立描边；次要 ink600，`自动布局` `--primary` 600/ink900
- Controls：图标 12px；`适应画布` `.erd-controls-primary` muted 底 + ink900；缩放/锁次要 ink600
- MiniMap：128×96 紧凑 + `nodeStrokeWidth` 1.5；设计器/分享同款；aria 定位不变
- E2E：`relation` Controls/MiniMap/工具栏 + `demo`；截图 `diagram-controls-dense.png` / `diagram-minimap-sunk.png` / `diagram-canvas-toolbar-dense.png`

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "Controls|MiniMap|工具栏" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --grep "免登录 /demo" --workers=1 --retries=0`

#### 体验：PK/FK 徽章扫读层次（角色标列，ADR-0016）

- 选题：字段行 PK/FK 徽章 9px 偏小、无列宽对齐，分享截图角色标扫不过字段名；停色 token，攻徽章层次；字段名 500/PK 600 不动
- `.erd-pk-badge` / `.erd-fk-badge`：10px / 700、`min-width` 22 + inline-flex 居中、pad 0 5 / line-height 15；warning / success 色不变
- 设计器 / 分享只读共用 `reactflow-relation.scss`；E2E：`relation`/`demo`；截图 `diagram-pk-fk-badge-hierarchy.png` / `demo-pk-fk-badge-hierarchy.png`

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "PK/FK 与边样式" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --grep "免登录 /demo" --workers=1 --retries=0`

#### 体验：基数 chip 扫读层次（字号/字重/对比，ADR-0016）

- 选题：分享截图上 `n:1` 等 chip 11/500/ink600 偏淡，干道 ink900 后字更不抢眼；停色 token 碎活，攻扫读
- `.erd-edge-label` 12px / 600 / ink900；白底 + line 描边不变；`EDGE_LABEL_CHIP_W/H` 40×20 跟字号（碰撞 nudge / crow's foot 不动）
- 设计器 / 分享共用 `associationsToEdges` + SCSS；E2E：`relation`/`demo`；截图 `diagram-edge-label-chip.png` / `demo-edge-label-chip.png`

验证点：
- `cd frontend && npx tsx src/utils/relationEdges.test.ts`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "PK/FK 与边样式" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --grep "免登录 /demo" --workers=1 --retries=0`

#### 体验：空态 CTA 层次（唯一主操作 + 次链，ADR-0016）

- 选题：画布空态「新建」实心钮与「导入 DBML」描边钮同阶抢焦点；分享空态一句 ink600 无主次；停色 token，攻一眼可读
- 设计器：标题 14/700；desc 11/ink400；唯一 `.erd-empty-button`；导入/逆向并入 `.erd-empty-links` 次链（ink600）；删 `.erd-empty-outline`
- 分享：`ShareEmptyState` 主标题 ink900/700 + hint ink400 + 唯一 primary；设计器/分享同构图语言
- E2E：`relation`「空态构图」、`share`「空模块分享」断言层次；截图 `diagram-empty-composition.png` / `share-empty-module.png`

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "空态构图" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/share.spec.ts --project=chromium --grep "空模块分享" --workers=1 --retries=0`

#### 体验：表头标题层次（实体名主标题 vs muted meta，ADR-0016）

- 选题：表节点表头实体名与中文名字号/字重接近，muted 表头上扫读不先落实体名；停色 token，攻标题层次
- `.erd-table-title` 14px / 700 / ink900；`.erd-table-chnname` 10px / 400 / ink400 + opacity 0.88；改名 input 对齐主标题
- 设计器 / 分享只读共用 `reactflow-relation.scss`；E2E：`relation` 建表填中文名、`demo` 断言 sys_user「用户」；截图 `diagram-table-header-hierarchy.png` / `demo-table-header-hierarchy.png`

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "PK/FK 与边样式" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --grep "免登录 /demo" --workers=1 --retries=0`

#### 体验：关系线默认描边权重/对比（ADR-0016）

- 选题：默认关系干道 `ink600` + 1.5px 在 sunk 画布/分享截图偏淡；停色 token 碎活，攻可读
- `EDGE_STROKE`=`ink900`、`EDGE_STROKE_WIDTH` 2 / 选中 2.5；设计器与分享共用 `associationsToEdges` + SCSS
- Crow's foot ink 色与线宽对齐干道；marker 盒仍 14，chip 仍白底 ink600（不抢色、不胀撞）
- 单测：`relationEdges.test`；E2E：`relation`/`demo` 断言 stroke；截图 `diagram-edge-stroke.png` / `demo-edge-stroke.png`

验证点：
- `cd frontend && npx tsx src/utils/relationEdges.test.ts`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "PK/FK 与边样式" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --grep "免登录 /demo" --workers=1 --retries=0`

#### 体验：字段行扫读层次（名主列 / 类型次要右对齐，ADR-0016）

- 选题：表节点字段名与类型字重/对齐几乎同阶，密表与分享截图扫读糊成一块；停色 token，攻可读
- `.erd-field-name` font-weight 500（PK 行 600）；`.erd-field-type` 右对齐 + min-width 4.25em + opacity 0.88
- 设计器 / 分享只读共用 `reactflow-relation.scss`；截图 `demo-field-scanability.png`

验证点：
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "PK/FK 与边样式" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --grep "免登录 /demo" --workers=1 --retries=0`

#### 体验：关系图 PK/FK/hover 行浅底 color-mix（ADR-0016）

- 选题：`reactflow-relation.scss` PK/FK/hover 行与空态阴影仍裸 `rgba(warning/success/ink,…)`，与 `--erd-warning` / `--erd-success` / `--erd-ink-900` 割裂
- 字段行 hover → `color-mix(… ink-900 3%)`；PK/FK 浅底 → warning/success 4%；PK+FK 渐变 → 各 5%；空态 CTA 阴影同 ink-900 mix
- 视觉强度与原 rgba 对齐；不新增 alpha token

验证点：
- `rg -n 'rgba\((212,\s*136,\s*6|47,\s*143,\s*123|11,\s*28,\s*44)' frontend/src/pages/design/relation/reactflow-relation.scss` → 0
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "品牌 token|PK/FK 与边样式" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --grep "免登录 /demo" --workers=1 --retries=0`

#### 体验：关系图 SCSS 清 brand 裸 rgba（ADR-0016）

- 选题：`reactflow-relation.scss` 字段删/加行 hover 仍裸 `rgba(222,41,16,…)`，与 `--erd-frame-fill-brand` / `--erd-brand` 割裂；分享画布同引该文件
- `.erd-field-delete:hover` → `var(--erd-frame-fill-brand)`；`.erd-field-add:hover` → `color-mix(… var(--erd-brand) 4%)`
- PK/FK 行浅底等非 brand rgba 留作下一微刀

验证点：
- `rg -n 'rgba\(222,\s*41,\s*16' frontend/src/pages/design/relation/reactflow-relation.scss` → 0
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "品牌 token" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --grep "免登录 /demo" --workers=1 --retries=0`（轻量，分享同 SCSS）

#### 体验：dataTypeDomains 树图标清 `#DE2910` 硬编码（ADR-0016）

- 选题：`getDataTypeTree` 四枚 icon-park 仍裸 `#DE2910`，与 DesignLayout / Home·Group `erdColors.brand` 割裂
- `brandFill = erdColors.brand`；源码区无裸字面量（`tokens.ts` / `--erd-brand` 为唯一真相源）
- 左树 UI 暂未挂载该入口 → 单测锁 fill；无 E2E

验证点：
- `cd frontend && npx tsx src/store/project/dataTypeDomainsSlice.test.ts`
- `rg -n 'fill="#DE2910"' frontend/src/store/project/dataTypeDomainsSlice.tsx` → 0

#### 体验：Export / Home·Group 壳清 `#DE2910` 硬编码（ADR-0016）

- 选题：`ExportCommon` 与 Home/Group `_defaultProps` 导航图标仍裸 `#DE2910`，与 DesignLayout `erdColors.brand` / `--erd-brand` 割裂
- Export 卡片图标 `currentColor` → `.ant-list-item-meta-avatar { color: var(--erd-brand) }`；Home/Group 主导航对齐 DesignLayout `brandFill = erdColors.brand`
- E2E：`export` 密度用例断言 path fill=`currentColor` + avatar color；`layout-outlet` 三壳断言导航图标 fill ≡ `--erd-brand`

验证点：
- `cd frontend && npx playwright test tests/e2e/export.spec.ts --project=chromium --grep "普通导出页密度" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/layout-outlet.spec.ts --project=chromium --grep "三壳同语言" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/group-layout-nav.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：账号设置授权类型对齐密度 token（ADR-0016）

- 选题：`identification` 仍裸 antd `Result` + 硬编码 `#DE2910`，与账号设置 22–28 / `--erd-*` 割裂（嵌入页不适配全屏 AuthBrandShell）
- 改密度状态面板：`account-settings-identification` + `role="status"`；图标 `currentColor` → `--erd-brand`；标题 13/22、副文案 12/18
- E2E：`account-settings`「授权类型：密度面板 + brand token，无裸 Result」；截图 `account-settings-identification.png`

验证点：
- `cd frontend && npx playwright test tests/e2e/account-settings.spec.ts --project=chromium --grep "授权类型" --workers=1 --retries=0`

#### 体验：404/403 对齐 AuthBrandShell（ADR-0016）

- 选题：`pages/404`/`403` 仍裸 antd `Result`，与登录/分享失效门 / 三壳 token 割裂
- 未知路径 / 无权访问 → 复用 `AuthBrandShell`（「页面不存在」/「无权访问」+ 主 CTA「打开示例 demo」+「返回首页」）；`exception-404-gate` / `exception-403-gate`
- 右侧 CTA 栈样式收口 `.auth-shell__gate-actions`（分享失效门同用）；路由表不变
- E2E：`not-found.spec` 品牌壳 ~40% + CTA；深链/死认证路径断言改 `exception-404-gate`；截图 `exception-404-brand-shell.png`

验证点：
- `cd frontend && npx playwright test tests/e2e/not-found.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/dead-auth-routes.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：分享失效/空态对齐 AuthBrandShell（ADR-0016）

- 选题：失效页仍裸 antd `Result` 403，与登录品牌壳 / 三壳 token 割裂；空模块仅灰字无剪影
- 失效/无效/吊销 → 复用 `AuthBrandShell`（「分享不可用」+ 主 CTA「打开示例 demo」+「返回首页」）；`share-invalid-gate`
- 无模型 / 模块 0 表 → `ShareEmptyState`（`ErdEmptyDiagram` + 同 CTA）；成功态 chrome/画布不变
- E2E：`share.spec` 无效 token 品牌壳 ~40% + 空模块剪影；吊销/happy-path 不回归；截图 `share-invalid-brand-shell.png` / `share-empty-module.png`

验证点：
- `cd frontend && npx playwright test tests/e2e/share.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：边标签 / 基数 chip 碰撞避让（ADR-0016）

- 选题：干道 bundling 步长 12 ≪ chip 宽 ~36，密图最长段中点标签叠字；crow's foot + 路由分流不够
- `edgeLabelBundleStretch` / `edgeLabelLaneStretch` + `resolveEdgeLabelOffsets`（AABB 迭代）；`ErdRelationEdge` 应用后暴露 `erd-edge-label-nudge`
- 单测：`relationEdges.test`；E2E：`demo.spec` 非零 nudge + 标签 AABB 零重叠；截图 `demo-edge-label-collision.png`

验证点：
- `cd frontend && npx tsx src/utils/relationEdges.test.ts`
- `cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：分享展开表清单行密度（ADR-0016）

- 选题：表清单折叠后展开态仍用 16 pad + 14 标题 + antd 默认松行，与 22–28 / project-list 不同阶
- `.share-page__tables`：pad 8×12、标题 13/22、表头/行 pad 4×8 / font 12；折叠默认 + 底条 affordance 不变
- `demo.spec` 断言展开后首行高 ∈[22,28]；截图 `demo-share-tables-dense.png`

验证点：
- `cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/share.spec.ts --project=chromium --grep "设计器分享后匿名打开" --workers=1 --retries=0`

#### 体验：分享 meta hint/描述密度（ADR-0016）

- 选题：视口铺满 + 表清单折叠后，hint/描述仍用 13px + 12 间距抢纵向；画布应再涨一截
- `.share-page__meta`：gap 4、hint/描述 12/18、描述单行 ellipsis+tooltip；stage pad 8×12；模块 Segmented `small`；折叠条 24
- Segmented `diagram-switcher` / 表清单折叠 affordance 保留；`demo.spec` 断言 metaH≤72 且画布 ≥视口 55%；截图 `demo-share-meta-dense.png`

验证点：
- `cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/share.spec.ts --project=chromium --grep "设计器分享后匿名打开" --workers=1 --retries=0`

#### 体验：分享只读表清单折叠（ADR-0016）

- 选题：视口铺满后表清单仍展开占纵向注意力；图应为主、清单按需展开
- 默认折叠；舞台底边 `展开表清单（N）` / `收起表清单`（`aria-expanded` + region）；展开后清单落折线下
- Segmented `diagram-switcher` / 画布铺满断言保留；`demo.spec` + `share.spec` 覆盖折叠/展开；截图 `demo-share-tables-fold.png`

验证点：
- `cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/share.spec.ts --project=chromium --grep "设计器分享后匿名打开" --workers=1 --retries=0`

#### 体验：分享只读画布视口铺满（ADR-0016）

- 选题：`/s/:token` 只读关系图固定 `height: 480`，图非主平面、首屏被表清单抢戏
- `ShareRelationCanvas` 去掉固定高；`.share-page__stage` = `calc(100vh - chrome)` + flex，画布 `flex:1` 铺满顶栏下视口；表清单落到折线下
- Segmented 切图 / `diagram-switcher` 仍在 meta；`demo.spec` 断言 canvasH >480 且占视口过半；截图 `demo-share-canvas-viewport.png`

验证点：`cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：分享只读多关系图切换（ADR-0016 / ADR-0017）

- 选题：分享走查发现 `/demo` 有「鉴权核心 / 会话与审计」两图但只读页无切换器（相对设计器死能力）
- `ShareRelationCanvas` 接 `diagramId`；`listDiagrams` + 只读 `Segmented`（`role=group` / `diagram-switcher`）；切图 remount + `fitView`；无新建/重命名
- `demo.spec` 点「会话与审计」断言 layout x 变化 + Frame；截图 `demo-share-diagram-switch.png`

验证点：`cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：公告列表行密度（ADR-0016）

- 选题：`/project/notice` 页头/列表行密度（复用 `.project-list-page`，与 person/recent/group 同阶）
- 标题 13/22、工具条 ~28、行 pad 4×8、公告链/时间 13/12；禁 Title level4 + List 默认松行
- 内联渲染公告行；删除 Home 死导出 `renderActivities`（及无样式 `username`/`datetime`）
- `project-notice-page` / heading「公告」/ 种子链 `ERDOnline` / 失败 toast 保留
- Home「更多公告」缺省（无 90 天内公告）时直达 `/project/notice` 仍验收列表
- `project-notice`「公告列表行密度」；截图 `project-notice-list-dense.png`

验证点：`cd frontend && npx playwright test tests/e2e/project-notice.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：团队项目列表行密度（ADR-0016）

- 选题：`/project/group` 页头/搜索/列表行密度（复用 `.project-list-page`，与 person/recent 同阶）
- 标题 13/22、工具条/搜索/新建 28、行 pad 4×8、头像 28、名 13/22、描述/Tag 12、打开钮 28；禁 Title level4 + List `large`
- `project-group-page` / `open-project` / ConfigProject / aria「搜索项目名」保留
- `project-surface`「团队项目列表行密度」；截图 `project-group-list-dense.png`

验证点：`cd frontend && npx playwright test tests/e2e/project-surface.spec.ts --project=chromium --grep "团队项目列表行密度" --workers=1 --retries=0`

#### 体验：个人/最近项目列表行密度（ADR-0016）

- 选题：`/project/person` + `/project/recent` 页头/搜索/列表行密度（与 22–28 chrome / `.setting-common-page` 同阶）
- 共享 `.project-list-page`：标题 13/22、工具条/搜索/新建 28、行 pad 4×8、头像 28、名 13/22、描述/Tag 12、打开钮 28；禁 Title level4 + List `large`
- `project-person-page` / `project-recent-page` / `open-project` / `project-rename-trigger` / aria「搜索项目名」保留
- `project-surface`「个人/最近项目列表行密度」；截图 `project-person-list-dense.png` / `project-recent-list-dense.png`

验证点：`cd frontend && npx playwright test tests/e2e/project-surface.spec.ts --project=chromium --grep "列表行密度" --workers=1 --retries=0`

#### 体验：账号设置 + Home 项目卡密度（ADR-0016）

- 选题：`/account/settings` 页头/表单/安全行 + Home「进行中的项目」卡密度（与 22–28 chrome / `.setting-common-page` / `.erd-io-modal` 同阶）
- 账号设置：标题 13/22、页 pad 8×12、侧栏项 28、表单输入/保存钮 28、安全行 pad 6；修改密码 Modal 挂 `.erd-io-modal`；role/aria（邮箱/更新基本信息/修改）不变
- Home 项目卡：区标题 13/22、卡 pad 10×12 / min-height 96、名 13/22；`home-project-card` testid；禁 16×18 + 16 标题松卡
- `account-settings`「页密度」+ `layout-outlet`「Home 项目卡密度」；截图 `account-settings-page-dense.png` / `home-project-cards-dense.png`

验证点：
- `cd frontend && npx playwright test tests/e2e/account-settings.spec.ts --project=chromium --grep "页密度" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/layout-outlet.spec.ts --project=chromium --grep "Home 项目卡密度" --workers=1 --retries=0`

#### 体验：数据库配置页密度（/databaseConfig + 数据源设置，ADR-0016）

- 选题：`/databaseConfig` 页头/列表/抽屉表单密度（与 22–28 chrome / `.setting-common-page` / `.erd-io-modal` 同阶）；数据类型域实验页已下线，本切片收数据库配置
- `.database-config-page`：标题 13/22、hint 12、页 pad 8×12、sheet pad 8×10；工具条钮/搜索 28；表行 pad 4×8；禁 Title level4 + 松 Card
- 抽屉表单：`size=small`、输入/Select/按钮 28、表单项 mb 12；去嵌套 Card 与死链「文档/支持」
- 菜单「数据源设置」Modal 挂 `.erd-io-modal` + Form `size=small`；role/aria（新建/编辑/测试连接/同步状态）不变
- `database-config.spec`「页密度」；截图 `database-config-page-dense.png`

验证点：`cd frontend && npx playwright test tests/e2e/database-config.spec.ts --project=chromium --grep "页密度" --workers=1 --retries=0`

#### 体验：设置页 chrome 密度（DefaultSetUp / DefaultField，ADR-0016）

- 选题：`/design/table/setting/defaultField` + `/default` 页头与表单密度（与 22–28 chrome / `.erd-io-modal` 同阶）
- `.setting-common-page`：标题 13/22、hint 12、页 pad 8×12；表单项 margin 12、Input/Password/InputNumber/按钮 28；`default-setup-page` / `default-field-page` testid 保留
- 菜单「默认项设置」Modal 挂 `.erd-io-modal` + Tabs/Form `size=small`；role/aria（「默认项设置」/两 Tab/保存 toast）不变
- `default-field.spec`「设置页密度」；截图 `diagram-setting-page-dense.png`

验证点：`cd frontend && npx playwright test tests/e2e/default-field.spec.ts --project=chromium --grep "设置页密度" --workers=1 --retries=0`

#### 体验：普通导出页 ExportCommon 卡片密度（ADR-0016）

- 选题：`/design/table/export/common` 页头与导出卡片密度（与 22–28 chrome / `.erd-io-modal` 同阶）
- `.export-common-page`：标题 13/22、hint 12、页 pad 8×12；卡片 pad 8×10 / 圆角 6 / 边框；grid gutter 8；禁 16 pad + Title level4 松卡片
- `export.spec`「普通导出页密度」；截图 `diagram-export-common-dense.png`；`export-common-*` / role=button /「导出文件」文案不变

验证点：`cd frontend && npx playwright test tests/e2e/export.spec.ts --project=chromium --grep "普通导出页密度" --workers=1 --retries=0`

#### 体验：导入/导出弹层密度（ADR-0016）

- 选题：项目菜单导入/导出 Modal 头脚与控件密度（与 22–28 chrome / EntityModal 同阶）
- 共享 `io-modal.scss`（`.erd-io-modal`）：标题 13/22、body pad 12/14、footer 钮 28、Select/单行 Input 28、Dragger 收紧；挂 DBML/ERD/PdMan/逆向/DDL 弹层
- `dbml-import`「导入弹层密度」+ `dbml-export`「导出弹层密度」；截图 `diagram-import-modal-dense.png` / `diagram-export-modal-dense.png`；role/aria 定位不变

验证点：
- `cd frontend && npx playwright test tests/e2e/dbml-import.spec.ts --project=chromium --grep "导入弹层密度" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/dbml-export.spec.ts --project=chromium --grep "导出弹层密度" --workers=1 --retries=0`

#### 体验：版本列表行密度（ADR-0016）

- 选题：设计器版本管理列表行/工具条密度（与 22–28 chrome / CommonTabs 同阶）
- `.version-page`：顶栏 min-height 28、工具条 pad 2/4、控件 28/12；列表行 pad 4×8、标题 13/行高 22、meta gap 2 / prose 12；禁 8×12 松行 + 16 标题
- `version.spec`「版本列表行密度」补密度断言 + 截图 `diagram-version-list-dense.png`；`version-row-*` / `version-list` / role 定位不变

验证点：`cd frontend && npx playwright test tests/e2e/version.spec.ts --project=chromium --grep "版本列表行密度" --workers=1 --retries=0`

#### 体验：关系线 Crow's foot 端点（ADR-0016）

- 选题：边端一眼可读行业 ER 基数；chip 保留编辑；不新增持久化字段
- IE 记法：`one`=竖线 / `many`=鸦爪；由 `association.relation`（from→to）映射两端；选中 brand 色
- `ErdCrowFootMarkers` defs + `crowFootEnds` / `crowFootMarkersForRelation`；设计器与分享同用；弃闭合箭头

验证点：
- `cd frontend && npx tsx src/utils/relationEdges.test.ts`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "表节点视觉：PK/FK" --workers=1 --retries=0`

#### 功能：关系基数可编辑 + Frame 重命名 + 边路由再收（ADR-0016 P0）

- 选题：连线不全是死 `1:n`；Frame 名可改；绕行少折弯（Vision tick 不切 chrome 密度）
- 基数：`association.relation` ∈ `1:1|1:n|n:1|n:n`；拖连线默认 `n:1`；点 `erd-edge-label` → Select；历史 `0,n:1` 归一展示；DBML from→to 对齐 `n:1`
- Frame：双击标题内联改名 → `renameFrame` / `groups[].name`；导入 Frame 不受影响
- 路由：同侧短 U `sameSide` 外肘避障；叠表缝显式 mid-corridor；`EDGE_BYPASS_DETOUR_RATIO` 2.15→1.85

验证点：
- `cd frontend && npx tsx src/utils/relationEdges.test.ts && npx tsx src/utils/relationEdgeRoute.test.ts && npx tsx src/utils/diagram.test.ts && npx tsx src/utils/dbml/toProjectJSON.test.ts`
- `cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "表节点视觉" --workers=1 --retries=0`
- `cd frontend && npx playwright test tests/e2e/diagram-frame.spec.ts --project=chromium --grep "重命名" --workers=1 --retries=0`

#### 体验：CommonTabs / 表设计签头密度（ADR-0016）

- 选题：设计器签栏 40→~28（22 chrome 同阶）+ 表设计签头收紧；Vision 常驻「持续 UI/UX」写入 loop prompt
- `CommonTabs`：`--erd-tabs-h: 28`、字 12、关闭钮 14；禁历史 40 松栏
- `TableTab`：签头 pad 4×12 / title 13 / min-height 28；内签 `size=small`
- `model-design-ux`「表设计三签」补密度断言 + 截图 `diagram-common-tabs-dense.png`
- `agent-loop-vision.prompt.md` / `development.md`：常驻指令持续优化 UI/UX、体验轨偏置

验证点：`cd frontend && npx playwright test tests/e2e/model-design-ux.spec.ts --project=chromium --grep "表设计三签" --workers=1 --retries=0`

#### 体验：左树行高密度（ADR-0016）

- 选题：设计器左树（实体/模块）行高密度（与 22 chrome / EntityModal 同阶）
- `QueryTree`：`itemHeight`/`TREE_ROW_HEIGHT` 22；treenode 去 margin；字号 12；工具条 pad 8 / 搜索·新建 28；禁默认 ~28 松行 + 16 工具条
- `model-design-ux`「模型树」补密度断言 + 截图 `diagram-left-tree-dense.png`；展开/`tree-open-relation` 定位不变

验证点：`cd frontend && npx playwright test tests/e2e/model-design-ux.spec.ts --project=chromium --grep "模型树" --workers=1 --retries=0`

#### 体验：实体新建弹层密度（ADR-0016）

- 选题：实体/模型新建弹层密度（建模回路入口与 22 chrome / 命令面板同阶）
- `.erd-entity-modal`：宽 400；header/body/footer pad 收紧；标题 13；表单项 margin 12；输入/Select/OK 高 28 / font 12；禁默认 520 宽 + 24 pad 松卡片
- `relation.spec`「实体新建弹层密度」补密度断言 + 截图 `diagram-entity-modal-dense.png`

验证点：`cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "实体新建弹层密度" --workers=1 --retries=0`

#### 体验：命令面板密度（ADR-0016）

- 选题：命令面板密度（Cmd/Ctrl+K 快捷回路与 22 chrome 同阶；空态/工具栏已收）
- `.erd-cmd-panel`：宽 440 / max-height 360 / radius 8；输入 height 36 / font 13；行 pad 6×8 / font 12；hint/footer 10；禁 48 高输入 + 10×12 松行
- `relation.spec`「命令面板」补密度断言 + 截图 `diagram-cmd-palette-dense.png`

验证点：`cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "命令面板" --workers=1 --retries=0`

#### 体验：空态面板再收（ADR-0016）

- 选题：空态面板再收 vs 命令面板密度 → 选前者（首印象/截图构图；命令面板后置）
- `.erd-empty-cta`：padding 14/18/12、max-width 300、radius token；标题 14 / 描述 12；主次按钮 height 26 / font 12；顶距 `min(10vh, 88)`
- `ErdEmptyDiagram` compact 168→132；禁 28/32 松卡片盖首屏

验证点：`cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "空态构图" --workers=1 --retries=0`

#### 体验：画布工具栏再收（ADR-0016）

- `.erd-canvas-tool`：height 22 / font 11 / padding `0 8`；gap 4；与 Controls/Frame chrome 同阶
- 关系图 Select：selector 22、字号 11、`minWidth` 96；禁 5×12 松按钮盖截图

验证点：`cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "工具栏" --workers=1 --retries=0`

#### 修复：`02_tables.sql` 中文 DEFAULT 在 latin1 客户端导入失败

- `sys_user.title`、`project.description` 的中文 `DEFAULT '…'` 在客户端字符集为 latin1（常见于未加 `--default-character-set=utf8mb4` 的手动 `mysql <`）时触发 `ERROR 1067 Invalid default value`
- 两处改为 `DEFAULT NULL`（仍仅 CREATE TABLE；应用插入会显式写字段）
  验证点：临时库 `erd_tmp_import` 分别以 `--default-character-set=latin1` 与 `utf8mb4` 导入 `02_tables.sql` 均成功（47 表）；`SHOW CREATE TABLE` 确认 `title`/`description` 为 `DEFAULT NULL`

#### 运维：`db/init/02_tables.sql` 仅 CREATE TABLE

- 去掉 `--`/`/* */`、`SET NAMES`、`SET FOREIGN_KEY_CHECKS`、全部 `DROP TABLE`、以及 `USE`；仅保留 `CREATE TABLE`（含表内索引；列/表 `COMMENT '…'` 元数据保留）；QRTZ 含 FK 子表排在 `QRTZ_TRIGGERS` 之后
- `railway-mysql-init.sh` 导入 `02` 时显式指定库 `erd`（docker 空卷靠 `MYSQL_DATABASE=erd`）
  验证点：`MYSQL_URL='mysql://root:x@example:3306/railway' ./scripts/railway-mysql-init.sh --dry-run`；临时库导入 `02_tables.sql` 成功（47 表，含 `sys_user`/`project`/`project_share`/`data_sources`）；文件无 `SET`/`DROP`/`USE`/`--` 注释

#### 体验：选中光晕统一（表 a18 = Frame a18 · ADR-0016）

- Frame 选中环 `--erd-brand-a12` → 与表同 `--erd-brand-a18`；抽出 `--erd-selection-ring` 防分叉
- 表保留抬升阴影层；环强度与 Frame 一致

验证点：`cd frontend && npx playwright test tests/e2e/diagram-frame.spec.ts --project=chromium --grep "选中表→新建分组" --workers=1 --retries=0`；`npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "品牌 token" --workers=1 --retries=0`

#### 体验：Controls 面板密度（ADR-0016）

- `.react-flow__controls`：`surface` + `line` 描边圆角；按钮 22×22（禁 RF `#fefefe` content-box 松柱）；图标 `ink600` / hover brand
- 设计器与分享只读同 scss；与 MiniMap 同角 chrome 语言

验证点：`cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "Controls" --workers=1 --retries=0`；`npx playwright test tests/e2e/demo.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：Frame 标题栏密度 + MiniMap sunk 对齐（ADR-0016）

- Frame chrome：height 28→22、label 11 / meta 10、内边距收紧；少占成员上方空白
- MiniMap：背景改 `surfaceSunk`（禁 RF 默认 `#fff` 白块）+ `line` 描边；设计器/分享同款

验证点：`cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --workers=1 --retries=0`；`npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "MiniMap" --workers=1 --retries=0`；`npx playwright test tests/e2e/diagram-frame.spec.ts --project=chromium --grep "选中表→新建分组" --workers=1 --retries=0`

#### 体验：边标签密度 + Frame 内边距微调（ADR-0016）

- `EDGE_LABEL_BG_PADDING` `[6,3]`→`[4,2]`，`EDGE_LABEL_BG_RADIUS` 4→3；字号仍 ≥11（可读底线）
- `FRAME_PADDING` 24→20（适应成员 / 导入建议更贴表）；既有 demo 烘焙坐标不动

验证点：`cd frontend && npx tsx src/utils/relationEdges.test.ts && npx tsx src/utils/diagram.test.ts`；`npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "表节点视觉" --workers=1 --retries=0`；`npx playwright test tests/e2e/demo.spec.ts --project=chromium --workers=1 --retries=0`

#### 架构：单一业务库 `erd`（取消 martin/erd 双库 · ADR-0020）

- JDBC：`DB_NAME`（默认 `erd`）；两套 Hikari/SqlSessionFactory 过渡期同库；兼容旧 `DB_ERD`/`DB_MARTIN` 回退
- `db/init`：仅 `01_create_database.sql` + `02_tables.sql`（schema-only）；丢弃 erd 侧未用 `sys_*` 桩表与 junk 表
- 种子迁 Flyway：`V3` 系统基线、`V4` ERD_USER_NEW 权限、`V5` 公开 demo、`V6` E2E 账号
- `railway-mysql-init.sh` / compose / `.env.example` / deployment·development·architecture 同步；无仓库硬编码生产密钥

验证点：`cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -DskipTests compile`；`MYSQL_URL='mysql://root:x@example:3306/railway' ./scripts/railway-mysql-init.sh --dry-run` 仅导入 `01`+`02`；`rg -n 'CREATE DATABASE.*martin|DB_MARTIN:martin' backend/src/main/resources/application.yml db/init` = 0

#### 功能：竞品对照子页 `/compare`（获客诚实对照）

- 公开路由 `/compare`：协作 / 版本 / 审批审计 / 只读分享 / 开源自部署 / DBML / Agent 事实源 vs dbdiagram / dbml
- 抽出 `LandingChrome`（顶栏+页脚）；落地 `#compare` 保留四行摘要 +「查看完整对照」
- 顶栏「对比」→ `/compare`；页脚加「对照」链；CTA → demo / 自部署 / 首页

验证点：`cd frontend && npx playwright test tests/e2e/compare.spec.ts tests/e2e/landing.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：导入后首屏打磨（空态导入 CTA + fitView / ADR-0016）

- 空态次 CTA「导入 DBML」→ 同菜单弹窗；文案强调导入后铺满首屏
- DBML 导入成功后直开导入模块关系图（菜单/空态同路径）
- 切图 / 自动布局 / 导入后 `fitView`：多表用 `FIT_VIEW_SHAREABLE`（padding 0.08 / maxZoom 1.15，与分享只读同源 `utils/canvasFit`）
- 控件「适应画布」改走分享密；空画布 init 仍 `FIT_VIEW_INIT`（防单节点放大过头）
- CommonTabs `destroyOnHidden`：切签销毁非活动画布，避免空态 CTA 残留 DOM

验证点：`cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "空态构图" --workers=1 --retries=0`；`npx playwright test tests/e2e/dbml-import.spec.ts --project=chromium --grep "空态导入 DBML" --workers=1 --retries=0`

#### 体验：设计器字段行再压一档（ADR-0016 节点密度）

- `.erd-field-row`：`min-height` 24→22、`padding` 竖 3→2、`line-height` 18→16（设计器与分享只读同 scss）
- `FIELD_ROW_H` 28→26；`estimateNodeHeight` / dense-fk probe 对齐

验证点：`cd frontend && npx tsx src/utils/graphLayout.test.ts`；`npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "表节点视觉" --workers=1 --retries=0`

#### 体验：密图密度微调（demo/分享截图 / ADR-0016）

- 示例主图手排再收：列间距 ~44→~28px，x 跨度 1136→1072；会话图同步收紧；Frame 包围盒贴成员（padding 24）
- dagre 默认 `nodesep` 56 / `ranksep` 108；`FRAME_PADDING` 32→24
- 分享只读：过滤 `relationNoShow`（与设计器同密）+ `fitView` padding 0.08 / maxZoom 1.15 + 网格 gap 16
- 同步 `frontend/src/utils/demo.projectjson.json`（`node scripts/sync-demo-projectjson.mjs`）；本地 erd 库需重灌公开 demo 种子

验证点：`cd frontend && npx tsx src/utils/graphLayout.test.ts && npx tsx src/utils/diagram.test.ts`；`npx playwright test tests/e2e/demo.spec.ts --project=chromium --workers=1 --retries=0`（spanX&lt;1100 + 无 `del_flag` + 截图 `demo-layout-density.png`）

#### 运维：Railway MySQL 一键灌 `db/init`（含 Docker 路径）

- 新增 `scripts/railway-mysql-init.sh`：接受 `MYSQL_URL` 或 `MYSQLHOST`/`MYSQLPORT`/`MYSQLUSER`/`MYSQLPASSWORD`；建 `martin`/`erd`（utf8mb4）；按序导入 `02→03→06…09`；跳过 `05_e2e_users.sql`；默认跳过 `04_privileges.sql`（`--with-privileges` 可选）
- 新增 `scripts/railway-mysql-init.docker.sh`：无本机 mysql 时用 `mysql:8` 容器挂载仓库跑同一脚本；可读仓库根 `.env`（`/.env` 已 gitignore）；**禁止**硬编码密码
- `docs/deployment.md`：Docker 方式 + 与本地 compose 空卷首启挂载 `db/init` 的区分说明

验证点：`chmod +x scripts/railway-mysql-init.sh scripts/railway-mysql-init.docker.sh`；`./scripts/railway-mysql-init.sh --help` 退出 0；`MYSQL_URL='mysql://root:x@example:3306/railway' ./scripts/railway-mysql-init.sh --dry-run` 与 `./scripts/railway-mysql-init.docker.sh --dry-run` 均打印导入清单且不连库；`rg -n 'root:[^$\"'\'']' scripts/railway-mysql-init*.sh` 无真实密码字面量

#### 体验：落地页 less 对齐 `--erd-*` tokens

- `pages/landing/index.less`：删除 `@ink`/`@accent`/`@teal`/`#4aa3c8` 等自造色；底/scrim/字族/主 CTA/三柱点缀一律 `var(--erd-*)` + `color-mix`
- 主 CTA 橙 → brand 红，与登录壳/工作台同源；构图与全幅 hero 不动

验证点：`cd frontend && npx playwright test tests/e2e/landing.spec.ts --project=chromium --workers=1 --retries=0`；`rg -n '#[0-9a-fA-F]{3,8}|@ink|@accent' frontend/src/pages/landing/index.less` = 0

#### 修复：Railway MySQL 双库接线（去掉 MYSQLDATABASE 误绑）

- 现象：`HikariPool.checkFailFast` → `PrimaryDatasource` → `Cannot resolve … erdSqlSessionFactory`（JDBC 打不开的级联）
- 根因：双 DS（`martin`/`erd`）不读 `SPRING_DATASOURCE_URL`/`MYSQL_URL`；插件默认库常为 `railway`；旧 yml `DB_MARTIN` 回退 `MYSQLDATABASE` 会把 martin JDBC 指错库
- 改动：`application.yml` 库名仅 `${DB_MARTIN:martin}` / `${DB_ERD:erd}`；host/user/password 仍回退 `MYSQLHOST`/`MYSQLUSER`/`MYSQLPASSWORD`
- 文档：`deployment.md`「Railway MySQL 正确接法」+ Variable Reference 表 + 建库/`db/init` 步骤

验证点：对照 yml 占位符无 `MYSQLDATABASE`；Dashboard 按文档设 `DB_HOST`←`MYSQLHOST` 等并建 `martin`/`erd` 后 Redeploy → 日志 `Started ErdOnlineApplication`，无 `checkFailFast`；`curl /actuator/health` UP

#### 体验：登录/注册品牌壳对齐 erd tokens（W5 切片 4）

- `AuthBrandShell`：左 40% 暗色品牌面板（`--erd-ink-900`×brand 渐变 + logo/叙事/`ErdEmptyDiagram` +「打开演示」文字链）+ 右 Form
- 清 `bg2.png` 背景与 `#1677FF` 硬编码；删除 `public/bg2.png`；注册页同构复用
- `redirect` 闭环与可访问名不变

验证点：`cd frontend && npx playwright test tests/e2e/smoke.spec.ts --project=chromium --grep "登录页渲染" --workers=1 --retries=0`；`session.spec`「去注册」同壳

#### 体验：分享页顶栏品牌对齐设计器壳（W5 切片 3 / ADR-0016）

- 选题：登录壳 vs 分享顶栏 → 选后者（陌生人门面「敢分享」首印象；登录壳下一刀）
- 成功态：`erd-chrome-header` 64px + logo→落地 + 项目名/「只读」Tag +「复制到我的项目」+ 未登录「登录/注册」文字链（autofork redirect）；去 Card/`Alert` 厚壳
- 截图 `share-chrome-brand.png` / `share-chrome-brand-demo.png`

验证点：`cd frontend && npx playwright test tests/e2e/share.spec.ts --project=chromium --grep "设计器分享后匿名打开" --workers=1 --retries=0`；`demo.spec`「免登录 /demo」chrome 64px

#### 重构：删除 RedisUrlAliasEnvironmentPostProcessor，改用 Boot 标准绑定

- 根因：自定义 EPP 是临时把 Railway `REDIS_*` 桥进 `spring.data.redis.*`；标准做法是环境变量 **`SPRING_DATA_REDIS_URL`** → 松散绑定 `spring.data.redis.url`（裸 `REDIS_URL` **不会**自动映射）
- 删除：`RedisUrlAliasEnvironmentPostProcessor` + `META-INF/...EnvironmentPostProcessor` 注册 + 对应单测
- yml：仅本地 `REDIS_HOST`/`REDIS_PORT`；**不**写 url/password 空默认
- 文档：`deployment.md`「Railway Redis 正确接法」唯一推荐 `SPRING_DATA_REDIS_URL`←`${{Redis.REDIS_URL}}`
- 保留：`RedisResolvedConnectionLogger` 打印 `url=set|missing` / `password=set|missing`

验证点：`mvn -q -Djacoco.skip=true -Dtest=RedisDataPropertiesBindingTest test`；Redeploy 后日志 `url=set password=set`

### 2026-08-02

#### 修复：Railway Redis 变量同名 + URL 强制覆盖 host

- 现象：只挂 `REDIS_URL`、删掉 `REDIS_HOST` 后又连 `localhost:127.0.0.1:6379`
- 改动：yml 优先 `REDISHOST`/`REDISPORT`；EPP 解析 `REDIS_URL`/`REDIS_PUBLIC_URL` 并**强制**写入 host/port/password/username；密码优先 `REDISPASSWORD`；启动打印 `[erd] Redis target host=… via=…` + INFO `Redis bound host=…`
- 文档：Variable Reference **保持插件同名**（不必改名成 `REDIS_HOST`）

验证点：`mvn -q -Dtest=RedisUrlAliasEnvironmentPostProcessorTest,RedisDataPropertiesBindingTest test`；Redeploy 后日志 `via=REDIS_URL` 或 `via=REDISHOST`，不再 localhost

#### 修复：Railway Redis WRONGPASS（URL 优先 + 禁止空串 ACL）

- 现象：已连 `redis.railway.internal`，仍 `RedisWrongPasswordException: WRONGPASS invalid username-password pair`
- 根因：yml `password/username: ${VAR:}` 空默认绑成 `""`；Redisson 对非 null 空串发 `AUTH "" password`（Redis 6 ACL）或 `AUTH ""`（弄坏本地无密码）
- 改动：`RedisUrlAliasEnvironmentPostProcessor` 优先 `REDIS_PRIVATE_URL`→`REDIS_URL`；仅非空时注入 password/`REDISUSER`；yml 去掉空默认；文档强调 Variable Reference ← `REDISPASSWORD` 并 Redeploy

验证点：`mvn -q -Dtest=RedisUrlAliasEnvironmentPostProcessorTest,RedisDataPropertiesBindingTest test`；本地无 `REDIS_PASSWORD` 时 `password`/`username` 均为 null

#### 修复：Redis 仍连 localhost（Boot 3 属性前缀）

- 根因：`application.yml` 写在废弃的 `spring.redis.*`（Boot 3 error 级、不绑定）；Redisson 读 `spring.data.redis.*` → 永远默认 `localhost:6379`，与 Railway 是否已设 `REDIS_HOST` 无关
- 改绑 `spring.data.redis.host/port/password`，占位符 `REDIS_*` 回退 `REDISHOST`/`REDISPORT`/`REDISPASSWORD`；`REDIS_URL` 经 `RedisUrlAliasEnvironmentPostProcessor` 注入
- MySQL：`DB_HOST`/`DB_USERNAME` 回退 `MYSQLHOST`/`MYSQLUSER`/`DB_USER`，避免下一脚踩 localhost / placeholder
- `docs/deployment.md` Variables 表改为 Add Variable Reference 示例

验证点：`mvn -q -Dtest=RedisUrlAliasEnvironmentPostProcessorTest,RedisDataPropertiesBindingTest test`；本地默认仍 `localhost`/`redis`（compose `REDIS_HOST=redis`）

#### 修复：Railway healthcheck 连续失败（liveness + Redis 密码 + logback）

- 现象：镜像推送 OK，`/actuator/health` Attempt #1–#8 service unavailable（约 2min+）→ 进程未听端口或聚合 health 因 db/redis DOWN 返回 503
- 日志 WARN `Could not find … com.erdonline.common.log/base-logback.xml`：**不阻断启动**；根因是目录名以 `.log` 结尾被根 `.gitignore` 的 `*.log` 忽略，Git/Docker 构建缺资源 → 无 appender、真实 DB 错误看不见
- 崩溃循环证据：Martin banner + logback WARN 约每 10s 重复、从未 `Started` → 进程退出被 Railway 拉起；**不是** health 路径本身
- `logback-spring.xml` → include 已入库 `base-logback.xml`（旧路径目录名以 `.log` 结尾被 `*.log` gitignore，Docker 镜像缺文件）
- `base-logback.xml`：`prod` 仅 STDOUT（避免修好 include 后写 `logs/` 再在只读容器翻车）
- probes + `railway.toml` → `/actuator/health/liveness`；`REDIS_PASSWORD`；`deployment.md` 自查表

验证点：`jar tf … | rg base-logback` 命中根路径；本地 `curl …/health/liveness` → UP；Redeploy 后日志应出现正常 Boot 行或真实 DB/Redis 错误（不再只有 No appenders）

#### 体验：关系图/设计器空态构图打磨（ADR-0016）

- 选题：空态构图（设计器首印象）— 替换粉红卡通 `EmptyStateAnimation`，画布空态补 ER 剪影 + 主/次 CTA
- `ErdEmptyDiagram`：幽灵表 + 虚线关联 + Frame 浅底，走 `--erd-*`
- 画布空态：标题「开始你的第一张关系图」+「新建第一张表」+「从数据源逆向」；空态隐藏 MiniMap
- 截图 `diagram-empty-composition.png`

验证点：`cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "空态构图" --workers=1 --retries=0`

#### 修复：Railway/Docker Maven 走 Central（勿阿里云）

- `backend/Dockerfile`：不再 COPY / `-s` `.mvn/settings.xml`（海外 Aliyun 慢/错）
- `pom.xml`：移除硬编码 `maven.aliyun.com` repositories；国内本机仍靠 `.mvn/settings.xml` + `maven.config`
- `docs/deployment.md`：注明 Railway 构建用 Central

验证点：`rg 'COPY.*settings|-s /root' backend/Dockerfile` = 0；`rg 'maven\.aliyun' backend/pom.xml` = 0；`cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -DskipTests help:evaluate -Dexpression=project.version -DforceStdout`（本机仍走 settings/Aliyun）

#### 体验：导入后 Frame 自动建议（ADR-0016）

- 选题：空态构图 vs 导入 Frame → 选后者（分享首印象：导入多表立刻有分组层次，空态 CTA 已可用）
- `suggestImportFrames`：表名前缀优先（`sys_*`/`biz_*`），否则 ≥2 连通分量；禁单前缀/单分量整图大框
- DBML `databaseToProjectJSON` 与 JDBC 逆向自动布局路径写入 `diagrams[].groups`；toast「已建议 N 个分组」
- fixture `prefixed.dbml`；截图 `diagram-import-frame-suggest.png`

验证点：`cd frontend && yarn test:unit:dbml`；`cd frontend && npx playwright test tests/e2e/dbml-import.spec.ts --project=chromium --grep "前缀表" --workers=1 --retries=0`

#### 体验：边标签 chip 可读性（ADR-0016）

- 基数标签：白底 `surface` + `line` 描边 + `ink600` 字 + 11px/500；禁与画布 `surfaceSunk` 同色、禁整块 `opacity` 冲淡文字
- `EDGE_LABEL_*` 常量；设计器/分享共用 `.erd-edge-label`；截图 `demo-edge-label-chip.png` / `diagram-edge-label-chip.png`

验证点：`cd frontend && npx tsx src/utils/relationEdges.test.ts`；`cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --workers=1 --retries=0`；`cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "PK/FK" --workers=1 --retries=0`

#### 体验：Frame 主题色板 + 三壳清硬编码（ADR-0016）

- `erdColors` 增 `frameFill` / `frameFillInk` / `frameFillWarning` / `frameFillBrand` + `FRAME_COLOR_PALETTE`；新建 Frame 按序轮换
- demo Frame 去掉 Ant 蓝 `rgba(37,99,235)`；命令面板 / TableTab / MiniMap / Home 卡片阴影 / Design sider 图标 → `--erd-*` / `erdColors`
- Frame chrome 轻表面条；设计器/分享共用 token 默认底

验证点：`cd frontend && npx tsx src/utils/diagram.test.ts`；`cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --workers=1 --retries=0`；`rg '37,\\s*99,\\s*235|#f0f5ff' frontend/src schema/examples/demo.projectjson.json` = 0

#### 体验：几何择柄消竖叠 circle-route（ADR-0016）

- 字段双侧 `src/tgt` 手柄；`pickPortSides`：水平对向 lr/rl，同列短竖叠走同侧短 U
- `associationsToEdges` 按 layout 坐标绑 `*-src-l/r` / `*-tgt-l/r`；`data-port` 供 E2E；设计器/分享同构
- 连线/删边解析兼容新旧 handle id

验证点：`cd frontend && npx tsx src/utils/relationEdges.test.ts`；`cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "PK/FK|边路由" --workers=1 --retries=0`

#### 体验：表节点卡片层次（ADR-0016 敢分享的美图）

- 新增 `surfaceMuted` / `--erd-surface-muted`；表头实底替换 `#f3f5f7` 渐变
- 字段行发丝分隔 + PK（及 PK+FK）左侧色条，与表头 brand 条同构；设计器/分享共用 `reactflow-relation.scss`

验证点：`cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "表节点视觉" --workers=1 --retries=0`

#### 体验：分享只读同路由 + 密 hub 扇出（ADR-0016）

- 确认设计器 / 分享共用 `ErdRelationEdge` + `associationsToEdges`；两侧传入 layout `positions` 作 hub 扇出提示
- `hubFanOffsetsForAssociations`：度数 ≥ `EDGE_HUB_FAN_MIN`(3) 的端点按对端 Y 居中扇出（`EDGE_HUB_FAN_STEP` 10px），并入 `laneOffset`；`data-hub-fan` 供 E2E
- `/demo` 断言分享画布 `erd-edge-route-mode` 接线 + 非零 hub 扇出；截图 `demo-share-edge-routing.png`

验证点：`cd frontend && npx tsx src/utils/relationEdges.test.ts`；`cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：密 FK 导入走查 + 绕行竞短（ADR-0016）

- fixture `dense-fk.dbml`（12 表 / 20 FK）+ E2E `dense-fk-import.spec.ts`；截图 `diagram-dense-fk-canvas.png`
- `routeErdSmoothStep`：bypass 取曼哈顿最短；密障或绕行倍率 > `EDGE_BYPASS_DETOUR_RATIO` 时与 twoBend/A* 竞短（修「绕底一圈」抢先返回）
- DBML 导入 E2E：勿点已自动展开的树标题（`expandAction=click` 会收起）

验证点：`cd frontend && npx tsx src/utils/relationEdgeRoute.test.ts`；`cd frontend && npx playwright test tests/e2e/dense-fk-import.spec.ts tests/e2e/dbml-import.spec.ts tests/e2e/relation.spec.ts --project=chromium --grep "密 FK|DBML 导入|边路由" --workers=1 --retries=0`（dense modes 含 astar/twoBend）

#### 体验：关系图边稀疏 Hanan A*（ADR-0016）

- `routeErdSmoothStep`：`twoBend` 仍无解时 → `astar`（走廊外轴候选 + 正交 A* + 折弯代价）
- `collectAstarAxisCandidates` / `routeOrthogonalAstar`：每轴最多 16 点，非全像素栅格
- `ErdRelationEdge` `data-mode` 增 `astar`；E2E 允许集同步

验证点：`cd frontend && npx tsx src/utils/relationEdgeRoute.test.ts`；`cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "边路由" --workers=1 --retries=0`

#### 体验：关系图边两弯绕行 / mid-corridor（ADR-0016）

- `pickBypassYCandidates`：并集外沿之外补各障顶/底，叠表缝可走 mid-corridor
- `routeErdSmoothStep`：单 `bypassY` 竖腿仍撞时 → `twoBend`（escapeX 水平逃逸 + bypassY）
- `ErdRelationEdge` `data-mode` 增 `twoBend`；几何断言在单测

验证点：`cd frontend && npx tsx src/utils/relationEdgeRoute.test.ts`；`cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "边路由" --workers=1 --retries=0`

#### 体验：关系图边干道 bundling（ADR-0016）

- `assignTrunkBundleOffsets`：按表对 midX 量化通道，同桶居中分流（`EDGE_BUNDLE_STEP` 12px）
- `routeErdSmoothStep({ trunkBundleOffset })`：无障碍/默认竖肘偏移 `centerX`，bypass 偏移水平干道 Y
- `ErdRelationEdge` 读 RF 边集分配偏移；`data-bundle` 供 E2E；截图 `diagram-edge-bundle.png`

验证点：`cd frontend && npx tsx src/utils/relationEdgeRoute.test.ts`；`cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "边路由" --workers=1 --retries=0`

#### 文档：Zeabur demo 怎么用（根路径 404 ≠ 挂了）

**现象**：`erdonline.zeabur.app` 预览「This page can't be found」；curl `/`、`/actuator/health`、`/doc.html` 若**全部** 404（Caddy 空 body）→ 公网未打到 Boot（常见 Root Directory=`/` 误检前端）。若仅 `/` 404 而 health 为 `UP` → 正常（API-only，无欢迎页）。

**文档 / 配置**

- `deployment.md` 扩写 Zeabur：预期 vs 真挂对照、Root Directory=`backend`、`PORT`、MySQL/Redis、env 同 Railway 表、`DEMO_API_URL` → CF Pages
- `backend/Dockerfile`：只 `EXPOSE 9502`（去掉 9092），避免 Zeabur 单端口 Git 服务选错口

验证点：`curl -sS https://YOUR.zeabur.app/actuator/health` → `{"status":"UP"}`；`docker build -t erd-be ./backend`

#### 修复：Railway demo 构建失败（monorepo Root Directory + PORT）

**原因**

- 从 GitHub 部署时 Root Directory 默认为 `/`：Railpack/Nixpacks 误检前端，或 Docker context 不含 `backend/pom.xml`
- `ghcr.io/erdonline/erdonline-backend` 尚无 `v*` release，选 Docker Image 会 404
- 平台注入 `PORT` 而进程死盯 9502 → 构建过了也会被健康检查杀掉

**修复**

- 新增 `backend/railway.toml`（DOCKERFILE builder + `/actuator/health`）
- `backend/Dockerfile` 入口：`--server.port=${PORT:-9502}`
- `deployment.md`：明确 Dashboard **Root Directory=`backend`**、**Config=`/backend/railway.toml`**；首发前勿用 GHCR Image

验证点：`cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -DskipTests package -s .mvn/settings.xml`；`docker build -t erd-be ./backend`；Dashboard 改 Root Directory 后 Deploy 成功

#### 体验：关系图边障碍避让（ADR-0016 erdSmooth）

- `utils/relationEdgeRoute`：对向左右手柄正交折线检测中间表包围盒；水平走廊畅通时平移 `centerX`，同行穿表则 `bypassY` 上/下绕行
- 设计器 + 分享只读画布共用 `ErdRelationEdge`（读 RF 表节点尺寸，取实测与估算较大值）
- 几何断言在 `relationEdgeRoute.test.ts`；E2E「边路由：erdSmooth 暴露 route-mode」验接线 + 截图

验证点：`cd frontend && npx tsx src/utils/relationEdgeRoute.test.ts`；`cd frontend && npx tsx src/utils/relationEdges.test.ts`；`cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "边路由" --workers=1 --retries=0`

#### 体验：示例/默认布局密度（ADR-0016 敢分享截图）

- `schema/examples/demo.projectjson.json`：主图/会话图手排收紧（列间距 ~44px，x 跨度 1280→1136）；Frame 包围盒贴成员
- dagre 默认 `nodesep` 64 / `ranksep` 120 / margin 24（相对旧 80/160 更密，仍留边走廊）
- `FRAME_PADDING` 48→32（「适应成员」与烘焙 demo 同口径）
- `layoutBoundingSize` + 单测密度断言；`demo.spec` 断言 flow x 跨度 <1200 + 截图

验证点：`node scripts/validate-projectjson.mjs`；`cd frontend && npx tsx src/utils/graphLayout.test.ts`；`cd frontend && npx tsx src/utils/diagram.test.ts`；`docker exec -i erd-mysql mysql -uroot -proot < db/init/08_public_demo.sql`；`cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --workers=1 --retries=0`

#### 体验：关系图边路由 — 同表对多 FK 肘距分流（ADR-0016）
- 共享 `utils/relationEdges`：设计器 + 分享只读画布统一建边；自定义 `erdSmooth`（更大圆角 + lane→stepOffset）
- 同无向表对多条 FK：居中 lane，肘部错开，path `d` 不再完全重叠
- dagre 默认 `nodesep` 80 / `ranksep` 160，走廊略宽；MiniMap 走 erd token（去默认蓝）
- E2E：`边路由：同表对双 FK 肘距分流` + 截图 `ux-walkthrough/diagram-edge-lanes.png`；既有 PK/FK 边用例断言 `erdSmooth`

验证点：`cd frontend && npx tsx src/utils/relationEdges.test.ts`；`cd frontend && npx tsx src/utils/graphLayout.test.ts`；`cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium --grep "边路由|PK/FK 与边样式" --workers=1 --retries=0`

#### 基础设施：官方 Demo 运行时 Railway-only（ADR-0019）

**决策 / 文档**

- ADR-0019：官方试用后端默认 **Railway**（App + MySQL 8 插件 + Redis）；拒绝 TiDB+Upstash 三厂商；Zeabur 仅作中国区备选；用户生产仍走 docker compose（ADR-0018）
- `deployment.md`：中文「Railway 部署官方 demo」五步 + Spring 环境变量对照（`DB_*`/`REDIS_*`/`JWT_*`/`CORS_ALLOWED_ORIGINS` 等）+ 接 CF Pages `DEMO_API_URL`；短述 Zeabur
- MDX：`regression-checklist.md` 裸 `<…` 改为行内代码，避免 Docusaurus 解析失败

验证点：目视 ADR-0019 / `deployment.md#railway-demo`；`cd website && yarn build`（若本机有 website deps）无 MDX 报错

#### 体验：Frame 可缩放 / 拖框带表 / 适应成员 / 拖入拖出（ADR-0017）

**问题**

- 分组框无法调节大小；拖框不带动成员、与表归属脱节，配合使用不流畅

**功能**

- 选中 Frame：`NodeResizer` 八角手柄，持久化 `groups[].w/h`（及 NW 侧 `x/y`）
- 拖框：按同一 Δ 平移 `memberEntityIds` 表节点并写 `layout.nodes`（仍非 RF parent）
- 工具栏「适应成员」：按成员包围盒 + padding 重算框；「加入分组」只扩不缩
- 拖表中心入框 → `addFrameMembers` + 扩边；拖出 → `removeFrameMembers` + toast
- ADR-0017 / `data-format.md` 后果修订：拖框带表为正式行为

**测试**

- `diagram.test.ts`：`removeMembersFromFrame` / `expandFrameBoundsToNodes` / `isPointInFrameBounds`
- `diagram-frame.spec.ts`：缩放持久化、拖框带表、「适应成员」

验证点：`cd frontend && npx tsx src/utils/diagram.test.ts`；`cd frontend && npx playwright test tests/e2e/diagram-frame.spec.ts --project=chromium --workers=1 --retries=0`

#### 示例：demo projectJSON 升级为多图 + Frame（ADR-0017 Phase 2a/2b）

**功能 / 数据**

- `schema/examples/demo.projectjson.json`：`modules[0].diagrams[]` 双图叙事——「鉴权核心」（主图）/「会话与审计」；各含 Frame「主体」「RBAC」「会话审计」「业务」与 `memberEntityIds`
- 主图 LR 分层坐标 + 框包围盒不叠压；遗留 `graphCanvas` 与主图布局对齐
- `node scripts/sync-demo-projectjson.mjs` → 前端副本 + `db/init/08_public_demo.sql`；`data-format.md` 示例说明同步

**测试**

- `demo.spec.ts`：8 表 + 4 Frame（只读分享）
- `activation.spec.ts`：示例打开可见 `diagram-switcher`、Frame，并可切到「会话与审计」

验证点：`node scripts/validate-projectjson.mjs` → 绿；`docker exec -i erd-mysql mysql -uroot -proot < db/init/08_public_demo.sql`；`cd frontend && npx playwright test tests/e2e/demo.spec.ts --project=chromium --workers=1 --retries=0`；`cd frontend && npx playwright test tests/e2e/activation.spec.ts --project=chromium-serial --grep '首页示例项目' --retries=0`

#### 基础设施：托管拓扑 1–3（ADR-0018）— CF Pages + GHCR，无 VPS

**功能 / 运维**

- 文档站：`docs-site.yml` 保留 GitHub Pages，并在配置 secrets 后部署 Cloudflare Pages（`erdonline-docs`）；`DOCUSAURUS_*` 区分 baseUrl
- 静态 demo：`frontend-demo-site.yml` → CF Pages `erdonline-demo`；`DEMO_API_URL` 可选（可空）
- 发版：`release.yml` Node 20、先 `test` 再打包；推送 `ghcr.io/erdonline/erdonline-{backend,frontend}`
- `docker-compose.yml` 默认 `image: ghcr.io/...`，本地仍可 `build`
- Dockerfile：backend Temurin 17；frontend Node 20 + `build:prod`
- ADR-0018 + `deployment.md` 官方托管拓扑 / secrets 说明
- `deployment.md`：补全「GitHub Actions × Cloudflare Pages」可复制配置清单（Token / Direct Upload / Secrets / 验收 URL）

验证点：`actionlint` 检查 `docs-site.yml` / `frontend-demo-site.yml` / `release.yml` → 无 error（CF 部署以 Variable `CLOUDFLARE_PAGES_DEPLOY=true` 门闸，避免 job-level secrets 上下文问题）

#### 功能：图内分组 Frame Phase 2b（ADR-0017）— 视觉框 + 显式成员

**功能**

- `diagram.groups[]` / `DiagramFrame`：视觉框节点（RF `type: 'frame'`，z-index 低于表），成员 `memberEntityIds` 显式记录，**不做坐标重父化**
- 工具栏「新建分组」「加入分组」；Delete 删框；拖框只改框 bounds
- 写路径：`createFrame` / `addFrameMembers` / `updateFrameBounds` / `removeFrame`；实体改名/删除同步成员列表
- 分享只读画布渲染 Frame

**测试 / 文档**

- 单测扩展：`diagram.test.ts`（包围盒 / 成员 / nodeId）
- E2E：`diagram-frame.spec.ts`
- ADR-0017 / `data-format.md` / regression-checklist 推进 Phase 2b ✅

验证点：`node scripts/validate-projectjson.mjs` → 绿；`cd frontend && npx tsx src/utils/diagram.test.ts` → 绿；`cd frontend && npx playwright test tests/e2e/diagram-frame.spec.ts --project=chromium --workers=1 --retries=0` → 绿（2 passed, 19.3s）

#### 功能：多关系图 Phase 2a（ADR-0017）— diagrams[] + 切换器 + 树图列表

**功能**

- `module.diagrams[]` 加法字段（schema + `data-format.md`）；懒迁移 `graphCanvas` → `diagrams[0]`
- 单一 selector `getActiveDiagram` / 写路径只写 `diagrams`（`updateGraphCanvasLayout(module, nodes, diagramId?)`）
- 画布工具栏：切换关系图 Select + 新建图 / 重命名；左树「关系」改图列表（不再逐边叶子）
- 每图独立布局坐标；切图 / 刷新后保持

**测试 / 文档**

- 单测：`frontend/src/utils/diagram.test.ts`
- E2E：`multi-diagram.spec.ts`（新建/重命名/切换 + 持久化）
- ADR-0017 状态推进 Phase 2a ✅；Frame 留 Phase 2b

验证点：`node scripts/validate-projectjson.mjs` → 绿；`cd frontend && npx tsx src/utils/diagram.test.ts` → 绿；`cd frontend && npx playwright test tests/e2e/multi-diagram.spec.ts --project=chromium --workers=1 --retries=0` → 绿（10.2s）

#### 修复：自动布局 E2E 在 dagre-on-create 后假阳性

- `relation.spec.ts`：点「自动布局」前先拖乱节点，再断言坐标变化（避免已是 dagre 结果时 after===before）

验证点：随 `relation.spec.ts`「全旅程」或自动布局相关用例

#### 功能：模型设计 UX（ADR-0017 Phase 1）— 默认展开 + 虚拟滚动 + 三签美化 + erd 色调

**功能 / 体验**

- 模型树「表」「关系」默认展开（新模块自动展开；用户手动折叠不被回顶）；删除 `getExpandedKeys` 推送不匹配 key 的死逻辑（store 层 `expandedKeys` 死状态一并清除）
- 模型树开虚拟滚动（antd Tree `height` + ResizeObserver 量容器），支撑 100+ 表/边
- 模型设计工作区 12px 留白 + 卡片化（sunk 底 + surface 卡 + `--erd-line` 描边）；关系图画布成圆角面板，不再贴边
- 表设计三签（字段/索引/元数据应用）美化：签头加表名 + 中文名 + 所属模型层级条，签体统一内边距，内层 DB 签降一级
- 树图标/徽章/菜单色值切 `erdColors`（模块 ink900、表 warning、关系 success、删除 brand），与画布 PK/FK 徽章同语言

**测试 / 文档**

- E2E：新增 `model-design-ux.spec.ts`（默认展开 + 虚拟滚动结构断言 + 折叠不回顶 + 三签切换）；`helpers.expandTreeTitle` 改幂等
- `docs/adr/0017-multi-diagram-and-entity-editor.md`：调研结论 + Phase 2（多关系图 `module.diagrams[]` + 图内分组 Frame，schema-additive 纯 projectJSON）

验证点：`cd frontend && npx playwright test tests/e2e/model-design-ux.spec.ts --project=chromium --workers=1`

#### 修复：设计器项目菜单导出/导入串台 + chrome 入口

**修复 / 体验**

- P0：项目 ▾「导出」子菜单曾显示导入项 → `ProjectMenu` 改 antd `items` + 弹窗外置 + `openKeys` 同时只开一个子菜单
- 侧栏「+」下拉去掉副标题卡片，改为紧凑 Menu items
- 设计器顶栏右：可发现入口「我的工单 / 待审批 / 通知」→ 既有路由
- 头像菜单审计：仅保留个人中心 / 授权信息 / 退出（无假项）

**测试 / 文档**

- E2E：`project-menu` 导出六项 + 断言无导入串台；叶子改 `menuitem`；`layout-outlet` 工单/审批/通知深链
- `ui-layout-redesign.md`、`design-principles` 菜单密度

验证点：`cd frontend && npx playwright test tests/e2e/project-menu.spec.ts tests/e2e/layout-outlet.spec.ts --project=chromium --grep "导出|DesignLayout：顶栏|项目 →" --workers=1`

#### 功能：Home 工作台 IA 重设计（去模板脸）

**功能**

- 首屏一构图：问候 + 安静指标 + 唯一 CTA 簇（继续上次 / 新建 / 从示例）；删右侧「快速操作」色块墙与竖排中文
- 项目列表全宽 3 列作视觉锚点（去 Card.Grid 嵌套）；次级入口改水平文字链（`home-link-*` 保留）
- 「最新公告」仅展示 90 天内条目，过期/空则整段隐藏
- HomeLayout 整壳 `erdTheme`；水平 Menu 选中/下划线走 brand，不再 Ant 蓝
- 删除死组件 `EditableLinkGroup`

**测试 / 文档**

- E2E：`project-surface` / `layout-outlet` + 截图 `ux-walkthrough/home-redesign.png`
- `ui-home-model-redesign.md` / `ui-layout-redesign.md` / `design-principles` IA 对齐

验证点：`npx playwright test tests/e2e/layout-outlet.spec.ts tests/e2e/project-surface.spec.ts --project=chromium --grep "Home|HomeLayout|三壳同语言|首页快捷|继续上次" --workers=1` → 绿

#### 修复：chromium-serial 不再依赖全量 chromium（Playwright footgun）

**修复**

- `playwright.config.ts`：去掉 `chromium-serial` 的 `dependencies: ['chromium']`；单条 `--project=chromium-serial` 不再先跑 ~101 条并行套件
- 全量顺序改由 CI（`e2e-smoke.yml`）两步显式保证：`--project=chromium` → `--project=chromium-serial`；本地 `yarn test:e2e` 一次跑两 project（无 deps）
- 新增 `yarn test:e2e:serial`；`workers: 1` 仍在 serial project config（共享 `e2e-serial`）
- `docs/development.md`、agent-loop vision/ux prompt、`dev-loop-speed` / `dev-entrypoints` 同步正确跑法（无需再传 `--no-deps`）

验证点：`cd frontend && npx playwright test tests/e2e/activation.spec.ts --project=chromium-serial --grep '首页示例项目' --list` → **仅 1 条**（非 ~102）

#### 功能：功能鉴权示例 projectJSON（8 表 RBAC）

**功能**

- 公开 demo /「从示例开始」由 2 表商城升级为功能鉴权域：`sys_user` / `sys_role` / `sys_permission` / `sys_user_role` / `sys_role_permission` / `sys_session` / `sys_audit_log` / `biz_order`
- 含 1:n 关联、唯一/普通索引、`defaultValue`、LR 分层坐标；中文 `chnname`
- 真相源 `schema/examples/demo.projectjson.json`；`scripts/sync-demo-projectjson.mjs` 同步前端副本与 `db/init/08_public_demo.sql`

**测试 / 文档**

- E2E：`demo.spec` 断言 8 节点；`activation` / `project-activation` 对齐新模块名；节点用 `rf__node-*`（避免 `sys_user` 子串匹配 `sys_user_role`）
- `withExclusiveAccount` 仅重试锁冲突，不再吞掉断言失败导致空等至 test timeout
- `data-format.md` 示例表清单；已有库需重跑 `08_public_demo.sql`

验证点：`node scripts/validate-projectjson.mjs` → 绿；`cd frontend && npx playwright test tests/e2e/activation.spec.ts --project=chromium-serial --grep '首页示例项目'` → 绿（7.5s）

#### 功能：三壳同语言 chrome（ADR-0016）

**功能**

- Home / Group / Design 共用 `layouts/erd-chrome.less`：顶栏 64px、品牌/用户区同一套 `--erd-*`
- 去掉三壳全页 `Watermark`；Home 页脚收成一行版权；GitHub 外链图 → 文本链（去 shields / `marginTop:-10px`）
- Home 内容区 `max-width: 1200` 居中 + surface 卡片；项目 Tag 走 ink/success token（禁默认蓝绿）
- Group 去侧栏页脚 clutter；Design 顶栏对齐同一 chrome 高度

**测试 / 文档**

- E2E：`三壳同语言：顶栏 64 + 无水印 + Home 表面 token` + 截图 `ux-walkthrough/home-chrome-tokens.png`
- `design-principles` 原则 7、`ui-layout-redesign`、ADR-0016 后果、roadmap 对齐

验证点：`npx playwright test --grep "三壳同语言|HomeLayout：/home" --project=chromium --workers=1` → 绿

#### 功能：关系图表节点视觉打磨（ADR-0016）

**功能**

- 表名/字段名/类型走 `--erd-font-mono`；行高与 padding 收紧；表头左侧 brand 强调条
- PK 琥珀 / FK 青绿徽章（`association.from` → FK）；PK/FK 行轻微底色；token 补 `warning-bg` / `success-bg` / `font-mono`
- 边：`smoothstep` + 闭合箭头；选中时描边/箭头转 brand；标签底 `surfaceSunk`
- 设计器与分享只读画布同视觉

**测试 / 文档**

- E2E：`表节点视觉：PK/FK 与边样式` + 截图 `ux-walkthrough/diagram-node-polish.png`
- `design-principles` 原则 7、roadmap、ADR-0016 后果段对齐

验证点：`npx playwright test --grep "表节点视觉：PK/FK" --project=chromium --workers=1` → 绿

#### 功能：导入/逆向 dagre 自动布局（ADR-0016）

**功能**

- 共享 `utils/graphLayout`：按 FK 做 dagre LR 分层；DBML 导入、数据库逆向、设计器/分享画布无坐标兜底共用
- 替换 DBML 旧 3 列网格与画布 `gridPosition` 散点；保留用户已拖坐标，只补缺表
- 分享只读画布 dagre 补上 association 边（此前只排节点、无视关系）

**测试 / 文档**

- 单测：`graphLayout.test` + `toProjectJSON` 断言 `posts.x < users.x`
- E2E：`dbml-import` 画布 transform 分层断言 + 截图 `ux-walkthrough/diagram-autolayout-import.png`
- `design-principles` 原则 7、ADR-0016 后果段对齐

验证点：`yarn test:unit:dbml` → 绿；`npx playwright test --grep "上传 minimal.dbml" --project=chromium --workers=1` → 绿

#### 战略 + 功能：ADR-0016「敢分享的美图」+ 关系图表节点品牌视觉

**决策 / 文档**

- ADR-0016：ICP 混合 — 主体验注=图颜值+三壳同语言；能力轨=维护版本保存/分享/presence；本季禁版本分支/双向 sync/MCP 产品码；证伪 sync 主注与「UI 是 P2」
- `agent-loop-vision` / `agent-loop-ux`：双轨等权、禁止开放式问方向、禁止碎活凑数
- `vision.md`：设计器是主战场之一；`design-principles` 增原则 7；roadmap 对齐 ADR-0016

**功能（切片 A）**

- 关系图 / 分享只读画布：表节点、边、背景、空态 CTA、工具条改走 `--erd-*` / `erdColors`（去掉默认蓝主色）；选中 brand 描边；边 ink600
- 修复 PK 空态徽章悬停不显示（选择器曾误嵌在 `.erd-field-name` 内）

**测试**

- `relation.spec`：表节点标题色 = ink900、画布底 = surfaceSunk；截图 `ux-walkthrough/diagram-shareable-tokens.png`

验证点：`npx playwright test --grep "表节点视觉：品牌 token" --project=chromium --workers=1` → 绿；`rg '#4096ff|#1d39c4' frontend/src/pages/design/relation/reactflow-relation.scss` = 0

#### 功能：设计器项目 ▾ 最近项目切换

**功能**

- ProjectMenu：打开时拉 `recentProject`（最多 5 条）；「最近项目」区当前项标 ✓，点其它项切 `/design/table/model?projectId=`（点当前仅关菜单）；加载/失败/空态各一行提示
- 菜单序：全部项目 → 最近项目 → 导入/导出/设置；保留 `ProjectMenuCloseContext` 关下拉

**测试 / 文档**

- `project-menu.spec`：当前项 ✓ +「最近项目可切换到另一项目」；`ui-layout-redesign` 导航模式补切换说明

验证点：`npx playwright test --grep "项目菜单：全部项目|项目菜单：最近项目可切换" --project=chromium --workers=1` → 绿

#### 工程：Vision 5m 循环 PM 持续迭代指令

**改动**

- `scripts/agent-loop-vision.prompt.md`：产品经理人格；每 tick 必交付；禁止默认 idle；化妆品伤首印象/IA = 产品工作；安全闸仅「用户叫停 / 连续两轮变差重议」
- `scripts/agent-loop-vision.sh`：emit 失败不杀循环；payload 注入永不因 idle 停心跳；`set +e` 主体常驻
- `docs/roadmap.md` / `docs/development.md` / iteration-protocol：对齐「三件事 ✅ 后不 idle」

验证点：`bash -n scripts/agent-loop-vision.sh`；`AGENT_LOOP_VISION_INTERVAL=1` 短跑确认连续两 tick 仍 emit（Ctrl-C 停）

#### 功能：设计器顶栏单一 chrome（模型|版本）

**功能**

- DesignLayout：左 logo + **项目名 ▾**（`project.projectName`，fallback「项目」；`aria-label=项目菜单`）；中主 tabs **仅 模型 | 版本**；右 SaveStatus / 保存版本 / presence / 分享 / `⋯`（公众号·GitHub·`APP_VERSION_LABEL`）/ 用户
- ProjectMenu：加「全部项目」→ `/project/recent`；去掉面板「版本」；导入/导出/设置弹层不变
- `_defaultProps`：导入/导出/设置移入 `secondaryRoutes`（深链 + sider 仍可用，不占顶栏）

**测试 / 文档**

- `layout-outlet` / `project-menu` / `presence` / `design-query` / `data-domain` / `export-feedback` 对齐新 IA；`ui-layout-redesign` 导航模式更新

验证点：`npx playwright test --grep "DesignLayout：顶栏|项目菜单：全部项目|设计器项目菜单|协作 presence" --project=chromium --workers=1` → 绿

#### 功能：Home S2 —「继续上次建模」主 CTA + 安静指标

**功能**

- Home hero：主按钮「继续上次建模」直达最近项目设计器；次操作「新建模型」/「从示例开始」
- 指标改为活跃模型 / 模型总数 / 团队项目，ink-900、无彩虹色/无图标前缀；问候上下文带最近项目名
- 快捷链色板对齐 `erd-*` tokens（去掉 `#1890ff/#52c41a/#faad14`）

**测试 / 文档**

- `project-surface.spec` 新增 hero CTA→设计器；`ui-home-model-redesign` S2 ✅；roadmap S2 标记

验证点：`npx playwright test --grep "Home hero：继续上次建模" --project=chromium --workers=1` → 绿；`rg '#1890ff|#52c41a|#faad14' frontend/src/pages/home` = 0

#### 清理：删除零引用 `plaza/Material*` 死码

**功能**

- 删除 `com.erdonline.erd.plaza` 整包（Material 控制器/服务/实体/Mapper）与 7 个 `Material*.xml`
- `ErdDataSourceConfig` MapperScan 仅保留 `com.erdonline.erd.mapper`（表不动）

**测试 / 文档**

- `architecture.md` / `product-capability-map`；regression-checklist

验证点：`mvn -q -DskipTests compile` → 绿；`./backend/dev-ensure.sh --restart` 后 `GET /actuator/health` → UP；`GET /material` → 404（非 500）；`rg 'erd\.plaza|MaterialController' backend/src` = 0

#### 功能：逆向保真 — JDBC `COLUMN_DEF` → `fields[].defaultValue`

**功能**

- `DefaultValueMapper`：规范化 JDBC 列默认值（空/NULL 跳过；无引号字符串加 `'…'`；数字原样；`CURRENT_TIMESTAMP`/`now()` 等表达式原样；PG `'x'::type` 剥离）
- `AbstractJdbcReverseDialect.buildField` 写入 `Field.defaultValue`（四库 + Generic 共用）

**测试 / 文档**

- 单测 `DefaultValueMapperTest`；ADR-0006 / `data-format.md` / roadmap 逆向保真；regression-checklist

验证点：`mvn -Dtest=DefaultValueMapperTest,*Reverse* -Djacoco.skip=true test` → 绿；curl MySQL `reverse_demo` `dbReverseParse`：`t_order.status.defaultValue='NEW'`、`amount=0.00`、`t_user.created_at=CURRENT_TIMESTAMP`

#### 功能：DBML `default` ↔ `fields[].defaultValue` 双向映射

**功能**

- `toProjectJSON`：`[default: …]` / `dbdefault` → `defaultValue`（string→`'…'`，number 原样，expression 原样，boolean→`TRUE`/`FALSE`）
- `fromProjectJSON`：`defaultValue` → `[default: …]`（字面量/数字/表达式分别还原）
- fixture `minimal.dbml` 补 `name` 默认 `'guest'`；导入/导出弹层文案同步（索引已映射，不再写「不导入索引」）

**测试 / 文档**

- 单测 `mapDbmlDefault` / `formatDefaultAttr` + round-trip 含 default；`data-format.md` 映射表；roadmap DBML default 收口；regression-checklist

验证点：`cd frontend && yarn test:unit:dbml` → all passed；`npx playwright test --grep "DBML" --project=chromium --workers=1` → 2 passed

#### 功能：自部署 DX — 验收脚本 + 升级路径演练（P5 缺口 ✅）

**功能**

- `scripts/verify-self-deploy.sh`：health UP、info `erd-online`、未暴露 actuator→404、前端 `/`→200；可选断言 `erd.flyway_schema_history` 最新成功版本
- `deployment.md`：一键验收命令 + 已有卷升级演练（停服备份 → build/up → 验收 → 查 Flyway 历史）；明确**不**靠重跑 `db/init`

**测试 / 文档**

- roadmap 自部署 DX ✅；regression-checklist

验证点：`./scripts/verify-self-deploy.sh` → ok=5 fail=0（含 flyway version=2）

#### 功能：DBML Indexes ↔ projectJSON `indexs` 双向映射

**功能**

- `toProjectJSON`：DBML `indexes { }` → `entities[].indexs[]`（`name` / `isUnique` / `fields`）；跳过 `pk` 索引与表达式列；无名索引生成 `idx_<table>_<cols>`
- `fromProjectJSON`：`indexs` → `indexes { (cols) [name, unique] }` 块
- fixture `minimal.dbml` 补 `idx_users_name`，round-trip 覆盖 indexs

**测试 / 文档**

- 单测导入/导出/round-trip；`data-format.md` 映射表；roadmap DBML index 收口；regression-checklist

验证点：`cd frontend && yarn test:unit:dbml` → all passed；`npx playwright test --grep "DBML" --project=chromium --workers=1` → 2 passed

#### 功能：自部署可观测薄切片 — health + info（P5 缺口 ✅）

**功能**

- `management.endpoints.web.exposure.include=health,info`；`health.show-details=never`（匿名面不泄数据源）
- `ErdAppInfoContributor`：`/actuator/info` → `app.name=erd-online` + `app.version`（jar Manifest / 本地 `dev`）
- `GlobalExceptionHandler`：`NoResourceFoundException` → **404**（未暴露 actuator 子路径不再假 500）
- 顺手清死码：未接线 `ReversePDM` 桩、空壳 `pages/design/import/index.tsx`（sider `component/*` 保留）

**测试 / 文档**

- 单测 `ErdAppInfoContributorTest`；`deployment.md` 验收 curl；`security-model` actuator 面；roadmap 可观测性 ✅

验证点：`mvn -Dtest=ErdAppInfoContributorTest -Djacoco.skip=true test` → passed；`./backend/dev-ensure.sh --restart` 后 `curl /actuator/health` → UP；`curl /actuator/info` → 含 `erd-online`；`curl /actuator/env` → HTTP 404 + code 404

#### 功能：DBML 导出镜像 — projectJSON → DBML + 设计器入口（互通闭环 ✅）

**功能**

- `frontend/src/utils/dbml/fromProjectJSON.ts`：纯映射 Table/fields/`[pk,increment,not null,note]`/associations→`Ref`、chnname→note；逻辑类型薄反查（未知→`varchar`）
- `ExportDBML`：模块 Select + 预览 + 下载 `.dbml` / 复制；loading/失败 message；项目菜单「导出DBML」
- 未做：enum/index/trigger、复合 FK、后端、旧 `pages/design/import` 清理

**测试 / 文档**

- 单测 `fromProjectJSON.test.ts`（含 fixture round-trip）；E2E `dbml-export.spec.ts`；roadmap DBML 🚧→✅；`data-format.md` 双向映射；regression-checklist

验证点：`cd frontend && yarn test:unit:dbml` → **all passed**（含 round-trip）；`npx playwright test --grep "DBML" --project=chromium --workers=1` → **2 passed**（导出~10s / 导入~10s）

#### 功能：DBML 导入薄切片 — DBML → projectJSON + 设计器入口

**功能**

- 依赖 `@dbml/core@^9.1.1`（Holistics 持续维护）；`frontend/src/utils/dbml/toProjectJSON.ts` 纯映射（dynamic import 懒加载）：Table/fields/Ref→FK、note→chnname
- `ReverseDBML`：粘贴 + Dragger；复用 `importModuleAndProfile`；loading/成功/失败反馈；项目菜单「导入DBML」
- 未做：导出、后端、enum/index/trigger 映射

**测试 / 文档**

- 单测 `toProjectJSON.test.ts`（tsx）；E2E `dbml-import.spec.ts`；roadmap 开放 DBML 📋→🚧；`data-format.md` 互通说明；regression-checklist

验证点：`cd frontend && yarn test:unit:dbml` → **all passed**（含 schema 校验）；`npx playwright test --grep "DBML 导入" --project=chromium --workers=1` → **1 passed**（~15s，画布 `data-node-total≥2`）

#### 功能：逆向保真切片 2 — SQL Server 字典级表/列注释 → chnname

**功能**

- `SqlServerReverseDialect`：`supportsComment(true)`；`SQL_TABLE_COMMENTS` / `SQL_COLUMN_COMMENTS` 经 `sys.extended_properties`（`MS_Description`）；`listTables`/`fillEntity` 回填，失败 warn+回退 JDBC
- 复用方言无关 `CommentResultSetMapper`；`reverse-fixtures/sqlserver` 补 `sp_addextendedproperty` 中文注释

**文档**

- ADR-0006 / roadmap 逆向保真：SQL Server 注释 ✅；Oracle 注释另切片

验证点：`cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn test -Dtest='CommentResultSetMapperTest,*Reverse*'` → Comment/Registry 绿（SqlServer `supportsComment`）。curl `dbReverseParse` chnname：**延期**（本机 `azure-sql-edge` 镜像拉取 >15min 未完成；fixture 已备，`./scripts/dev-reverse-dbs.sh` 可用后补验）

#### 功能：逆向保真切片 1 — PostgreSQL 字典级表/列注释 → chnname

**功能**

- `PostgresqlReverseDialect`：`SQL_TABLE_COMMENTS`（`obj_description`）/ `SQL_COLUMN_COMMENTS`（`col_description`）；`listTables`/`fillEntity` 后回填 remarks，失败回退 JDBC
- `DialectCapability.supportsComment` + `dbReverseMeta.supportsComment`（MySQL JDBC ✅；PG 字典 ✅）
- `CommentResultSetMapper` + 单测；`reverse-fixtures/postgres` 补 `COMMENT ON`

**文档**

- ADR-0006 补注释字典化一行；roadmap 逆向保真 🚧（本切片 PG 注释 ✅）

验证点：`cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn test -Dtest='CommentResultSetMapperTest,*Reverse*'` → Comment/Registry/Index/FK 绿；docker PG `dbReverseParse`：`t_user.chnname=用户表`、`id/code/email` chnname=主键/用户编码/邮箱；MySQL `reverse_demo` 解析不回归

#### 功能：W3 切片 3 — 审批/工单入口理顺（版本域收口 ✅）

**功能**

- 版本页顶栏「我的工单 / 我的审批」直达（`version-nav-orders` / `version-nav-approvals`）；侧栏既有 menuitem 不变
- 团队项目未同步版本行「提交工单」→ 打开变更详情，footer「SQL审批」（`version-submit-order-btn` / `sql-approval-btn`）
- 工单/审批空态文案对齐「版本行提交工单」；GroupLayout 无工单菜单（设计器域入口，不扩）

**测试 / 文档**

- `approval.spec` 新增「版本页：提交工单入口可达且审批 tab 可见」；既有工单/审批用例不回归
- `product-capability-map` 工单提交/审批 thin→✅；`roadmap` W3 ✅ + 落地页 🚧→✅（实现+E2E 已齐）；`ui-layout-redesign` W3 切片 3 ✅

验证点：`cd frontend && npx playwright test --grep "approval|工单" --project=chromium --workers=1` → **4 passed**

#### 测试：协作 sync → 保存版本全路径 + 节流回归（下一季③ close）

**测试 / 文档**

- `sync-toast.spec.ts`：info toast → `sync-save-version-cta` → AddVersion → `POST /ncnb/hisProject/save` 200 + `version-row-1.0.0`；60s 内二次模型变更 peer toast / CTA 仍为 0 再弹
- `helpers.saveVersion` 抽出供 version / sync 共用；`docs/roadmap.md` 下一季③ 🚧→✅

验证点：`npx playwright test --grep "协作 sync 提示" --project=chromium --workers=1` → **3 passed**（~42s）

#### 度量：激活旅程「30 秒进版本保存」计时收口（下一季 bet①）

**新增 / 文档**

- `frontend/tests/e2e/activation-30s.spec.ts`：落地 → demo → 登录 → 示例就绪 → 保存首版本；`Date.now` 分段墙钟 + ≤30s 断言
- `docs/performance-budget.md`：激活旅程预算与分段基线；`docs/roadmap.md` 下一季① 🚧→✅

验证点：`npx playwright test tests/e2e/activation-30s.spec.ts --project=chromium` → **1 passed**；计时段 ~3.5s（landing/demo/login/example_ready/save_version），预算 30s

#### 文档 / 开放：projectJSON schema-as-code 初稿（ADR-0012）

**新增**

- `docs/data-format.md`：对外规范（modules / entities / fields / associations / profile / dataTypeDomains；仅加法兼容；密钥纪律引 ADR-0008）
- `schema/projectjson.schema.json`：JSON Schema draft 2020-12（字段蒸馏自运行时 + `defaultData.json`，不发明键）
- `schema/examples/demo.projectjson.json`：公开 demo 同构正例；`invalid.projectjson.json` 负例
- `scripts/validate-projectjson.mjs`（ajv@8）：正例通过、负例非零退出
- roadmap P5 开放/缺口与 ADR-0013 触发条件 #3 标记解锁；architecture / security-model / development 交叉引用

验证点：`node scripts/validate-projectjson.mjs` → 正例 PASS、负例「invalid as expected」、exit 0

#### 重构：W2 切片 4 — 设计器壳 calc(100vh) 清零（树 + 版本页 flex）

**修复 / 重构**

- `EmptyStateAnimation` 内容态补 `flex:1; height:100%`——此前打断高度链，画布靠 `calc(100vh)` 遮羞
- `QueryTree` / `version-page` / ReactFlow：去掉 `calc(100vh-*)`，改 flex / `height:100%` 填满壳层
- sider-inner：`overflow:hidden` + 左树子节点 flex，避免与壳层双滚动

**测试 / 文档**

- `layout-outlet`：新增「模型树与版本页 flex 填满」
- `ui-layout-redesign` / `roadmap` / `product-capability-map` / `regression-checklist`：W2 切片 4 ✅
  验证点：`npx playwright test tests/e2e/layout-outlet.spec.ts -g "flex 填满" --project=chromium`；`rg 'calc\\(100vh' frontend/src/components/QueryTree frontend/src/pages/design` = 0

#### 重构：W2 切片 3 — 设计器 chrome 左树去重 + sider 320 + flex

**重构**

- 模型页去掉嵌套 `Splitter`/`DataTable`：左树唯一来源 = `DesignLayout` sider（`DesignLeftContent`）
- sider 400→320；删除 sider footer；设计器壳 `calc(100vh-56px)` → flex 填满；`CommonTabs` 栏高 40px
- 树头「新建」`aria-label`（`design-tree-add`）常显

**测试 / 文档**

- `layout-outlet`：空态单份 `add-module-empty` + sider 320px + 无 footer；新增「模型树唯一 + 新建入口常显」
- `helpers.openRelationFromEmpty`：断言单树 / 单关系图入口
- `ui-layout-redesign` / `roadmap` / `product-capability-map` / `regression-checklist`：W2 切片 3 ✅
  验证点：`npx playwright test tests/e2e/layout-outlet.spec.ts -g "DesignLayout" --project=chromium` → **2 passed**

#### 重构：W5 切片 2 — 分享失效态 Result + 示例 demo CTA

**重构**

- 分享页无效/吊销 token：`Empty` → antd `Result` status 403；extra「返回首页」+「打开示例 demo」→ `/demo`（与 404/403 同构）
- 加载中全页 `Spin`；成功态 chrome / fork / Alert 不变；背景改用 `--erd-surface-sunk`

**测试 / 文档**

- `ui-layout-redesign` / `roadmap` / `product-capability-map` / `regression-checklist`：W5 切片 2 ✅
  验证点：`npx playwright test tests/e2e/share.spec.ts -g "无效 token|吊销" --project=chromium` → **2 passed**

#### 重构：W5 切片 1 — 404/403 标准 Result + 示例 demo CTA

**重构**

- `404` / `403`：删 `antd/dist/reset.css` 与自定义 svg；`Result` 用标准 status 图标
- extra：主按钮「返回首页」+ 次按钮「打开示例 demo」→ `/demo`（激活漏斗）
- 删除零引用 `public/no-found.svg` / `no-access.svg`

**测试 / 文档**

- `ui-layout-redesign` / `roadmap` / `product-capability-map` / `regression-checklist`：W5 切片 1 ✅
  验证点：`npx playwright test tests/e2e/not-found.spec.ts --project=chromium` → **2 passed**；页面源无 `antd/dist/reset.css` / `no-found.svg`

#### 修复：创建项目卡在「新增项目」+ 团队/写接口偶发 HTML 400

**根因**

1. Pro/presets 摘除后 `Theme` 的 `ConfigProvider` 未注入 `zh_CN`，Modal 默认 `OK`/`Cancel`，E2E/旅程按「确定」定位超时
2. JWT 含全量 `authorities`/`role_ids`（Authorization ≈8KB+），Boot 3 默认 `server.max-http-request-header-size=8KB`，POST 被 Tomcat 以 **HTML 400** 拒掉（创建/删除/团队 API）

**修复**

- `Theme`：`ConfigProvider locale={zhCN}`；`AddProject` 显式 `okText`/`cancelText`
- `application.yml`：`server.max-http-request-header-size` / `tomcat.max-http-response-header-size` → **64KB**（ADR-0015）
- `request.js`：非 JSON / HTML 200 响应 toast 后抛错，避免 `.json()` 静默炸掉

**验证点**

- `npx playwright test tests/e2e/smoke.spec.ts -g "登录 → 新建项目 → 进入设计器" --project=chromium` → **1 passed**
- `npx playwright test tests/e2e/layout-outlet.spec.ts --project=chromium --workers=1` → **3 passed**
- curl：e2e0（tok≈8KB）`POST /ncnb/project/add|delete|group/add` → `application/json` code=200（非 text/html 400）

#### 修复：Pro 摘除后登录 SPA 白屏 / E2E 找不到「用户名」

**修复**

- `app.tsx`：移除无效 runtime `layout`（`config.layout` / presets 已删，触发 `invalid key layout`）
- 登录/注册：`htmlFor` + `aria-label` 稳定可访问名；`settings/base` 摘残留 `@ant-design/pro-form`
- `global.tsx`：去掉失效 `useIntl`；`resolutions.@ant-design/cssinjs=1.24.0` 对齐 antd 5.29
  验证点：Playwright 登录页 `textbox「用户名」` 可见可填；`smoke`「登录页渲染」「错误凭证登录出现」绿

#### 重构：W4 切片 15 — Pro 清零 + 移除 `@ant-design/pro-components`

**重构**

- `account/settings`：摘 `ProLayout`/`PageContainer`/`ProCard`/`WaterMark`/`pro-layout` GridContent；路由挂入 `HomeLayout`；页签 URL/`selectKey` 不变
- 团队 `GroupUser`：摘 `ProList` → antd `List` + 搜索/分页；`AddUser`/`移除` 联动 `reload` 不变
- 团队 `GroupPermission`：摘 `ProForm`/`FooterToolbar` → antd `Form` + sticky 提交栏
- 逆向解析（菜单对话框 + `/design/table/import/reverse`）：摘 `ModalForm`/`StepsForm`/`ProFormSelect` → antd `Modal`/`Steps`/`Form`/`Select`；`ReverseTable` 摘 `ProTable` → antd `Table`
- 删除零引用死码 `StandardFieldLibrary`（Pro 题库 demo）及其 `index.less`
- `package.json` 移除 `@ant-design/pro-components`、`umi-presets-pro`；`config.ts` 去掉 `presets`/`layout:{}`；`defaultSettings` 去 `pro-layout` 类型

**测试 / 文档**

- ADR-0014 / `ui-layout-redesign` / `roadmap` / `regression-checklist`：W4 切片 15 ✅；Pro 文件数 7→0；依赖移除
  验证点：`rg -l '@ant-design/pro-components' frontend/src --glob '*.{ts,tsx}'` → **0**；`npx playwright test account-settings group-layout-nav import-reverse --project=chromium`

#### 重构：W4 切片 14 — approval/order/home/login/register/databaseConfig/ExportDDL → antd

**重构**

- 版本「我的审批 / 我的工单」：摘 `ProTable` → antd `Table` + 自管分页；`actionRef.reload` 与 Pass/Refuse/Cancel/Repeat 联动不变；testid `page-title-approvals` / `page-title-orders` 保留
- Home：摘 `PageContainer` → 普通内容区；快捷入口 testid 不变
- 登录 / 注册：摘 `LoginFormPage` / `ProFormText` → antd `Form` + 左右分栏品牌壳；文案与演示 CTA 保留
- `databaseConfig`：摘 `PageContainer`（`pro-layout`）+ `ProTable` → 标题区 + `Input.Search` + antd `Table`；Drawer 新建/编辑/删除/ping 不变
- 导出 DDL（菜单对话框 + 导出页）：摘 `StepsForm` / `ModalForm` / `ProForm*` → antd `Modal`/`Steps`/`Form`/`TreeSelect`；aria「下一步/上一步/导出」与 `export-ddl-tables` 保留

**测试 / 文档**

- `ui-layout-redesign` / `roadmap` / `regression-checklist`：W4 切片 14 ✅；Pro 文件数 15→8
- 审批/工单操作列：`approveStatus` 按 `Number(...)` 比较（API 常返回字符串，避免 `=== 0` 漏渲染「通过/拒绝/撤销/复批」）
- `databaseConfig.loadData`：`PAGE(..., sorter)` + `res?.code` 防空，避免列表请求异常时白屏崩溃
  验证点：切片文件 `pro-components` = 0；`rg -l "from '@ant-design/pro-" frontend/src` → **8**；`approval` 空态 + `session`×4 + `smoke` 登录×2 绿；审批操作列曾以拒绝/SQL失败用例验证 `Number(approveStatus)`；ExportDDL 第二步曾绿（TreeSelect 收起后点下一步）

#### 重构：W4 切片 13 — person / recent / group / dataModels / ExportCommon ProList → antd List

**重构**

- 个人/最近/团队项目列表：摘 `ProList` → antd `List` + 标题行 + `Input.Search`；行操作（改名/删除/打开/配置）与失败 toast 不变；个人空态 CTA testid 不变
- 数据模型页 `dataModels`：摘 `ProList` 网格 → antd `List grid`；类型 `Select` + 搜索 + 行操作不变
- 普通导出 `ExportCommon`：摘 `ProList` → antd `List grid`；`data-testid=export-common-*` + 键盘可点；标题「导出文件」不变

**测试 / 文档**

- `ui-layout-redesign` / `roadmap` / `regression-checklist`：W4 切片 13 ✅；Pro 文件数 20→15
  验证点：`rg '@ant-design/pro-components' …person/recent/group/dataModels/ExportCommon` = 0；`rg -l … | wc -l` → **15**；`npx playwright test project-surface layout-outlet loading export --project=chromium -g "个人项目|最近项目|HomeLayout|列表请求中|导出 Markdown|导出 HTML|/project/new|首页快捷|数据模型"` → **9 passed**（`project-activation` chromium-serial 空态因账号锁超时未计入；空态 CTA testid 代码保留）

#### 重构：W4 切片 12 — SqlApproval / BasicSetting / GroupSetting / notice / TableTab → antd

**重构**

- 版本比对「SQL审批」`SqlApproval`：摘 `ModalForm` / `ProForm*` → antd `Modal` + `Form` + `Select`（远程审批人）；失败 toast 不关窗；触发 aria 不变
- 团队「基本设置」`BasicSetting`：摘 `ProForm*` → antd `Form` + `Select mode="tags"`；提交按钮文案「提 交」与权限门控不变
- 团队「用户组」`GroupSetting`：摘 `ProCard` tabs → antd `Tabs tabPosition="left"`
- 公告页 `project/notice`：摘 `ProList` → antd `List` + 分页；失败 toast 不变
- 表编辑 `TableTab`：摘无业务 `ProCard` 外壳 → `div`

**测试 / 文档**

- `ui-layout-redesign` / `roadmap` / `regression-checklist`：W4 切片 12 ✅；Pro 文件数 25→20
  验证点：`rg '@ant-design/pro-components' …SqlApproval/BasicSetting/GroupSetting/notice/TableTab` = 0；`rg -l … | wc -l` → **20**；`npx playwright test group-basic-setting group-layout-nav project-notice layout-outlet -g "基本设置|权限组|更多公告|GroupLayout|加载失败"` → **7 passed**

#### 重构：W4 切片 11 — ResetPassword / AddUser / ReversePdMan / ReverseERD → antd

**重构**

- 账户「修改密码」`ResetPassword`：摘 `ModalForm` / `ProFormText.Password` → antd `Modal` + `Form` + `Input.Password`；两次密码不一致不关窗；校验文案不变
- 团队「添加成员」`AddUser`：摘 `ModalForm` / `ProFormSelect` → antd `Modal` + `Form` + `Select mode="multiple"`（远程搜索）；去掉 props `any`
- 项目菜单「解析PdMan / 解析ERD」对话框：摘 `ModalForm` → antd `Modal` + `Upload.Dragger`；本地解析、`beforeUpload` 返回 false 防误上传；触发 aria 与成功 toast 不变

**测试 / 文档**

- `ui-layout-redesign` / `roadmap` / `regression-checklist`：W4 切片 11 ✅；`account-settings` 安全页增「修改密码」弹窗可打开；`import-pdman`/`import-erd` 改走 `project-menu-panel` click（消歧顶栏「导入」）；Pro 文件数 29→25
  验证点：`rg '@ant-design/pro-components' …ResetPassword/AddUser/ReversePdMan/ReverseERD` = 0；`rg -l … | wc -l` → **25**；`npx playwright test … -g "PdMan|ERD|页签可切换|导入 → 三项"` → **4 passed**

#### 重构：W4 切片 10 — RebuildVersion / InitVersion / setting DefaultSetUp → antd

**重构**

- 版本工具栏「重建版本」`RebuildVersion`：摘 `ModalForm` / `ProForm*` → antd `Modal` + `Form`；testid `version-rebuild-btn`；提交仍走 `versionDispatch.rebuild`（二次确认不变）
- 项目菜单「初始化基线」`InitVersion`：摘 `ModalForm` / `ProForm*` → antd `Modal` + `Form`；testid `version-init-btn`；无数据源 toast 且不关窗；异步保存行为对齐原 ModalForm
- 设计器设置页「系统默认项」`pages/design/setting/component/DefaultSetUp`：摘 `ProForm*` → antd `Form` + `InputNumber` / `Upload`（路由 `/design/table/setting/default` 保留）

**测试 / 文档**

- `ui-layout-redesign` / `roadmap` / `regression-checklist`：W4 切片 10 ✅；`version.spec` 新增「重建版本弹窗可打开」
  验证点：`rg '@ant-design/pro-components' frontend/src/components/dialog/version/RebuildVersion.tsx InitVersion.tsx frontend/src/pages/design/setting/component/DefaultSetUp.tsx` = 0；`rg -l '@ant-design/pro-components' frontend/src --glob '*.{ts,tsx}' | wc -l`；`npx playwright test tests/e2e/version.spec.ts --grep "重建版本弹窗|同步配置" --project=chromium --workers=1`

#### 重构：W4 切片 9 — CompareVersion / SyncConfig ModalForm → antd Modal+Form

**重构**

- 版本「详情 / 版本比对」`CompareVersion`：摘 `ModalForm` / `ProFormSelect` → antd `Modal` + `Select`；自定义 footer（导出/同步/审批）与 testid 不变
- 版本工具栏「同步配置」`SyncConfig`：摘 `ModalForm` / `ProFormRadio` → antd `Modal` + `Form` + `Radio.Group`；保存仍 `setUpgradeType` →「设置成功」

**测试 / 文档**

- `ui-layout-redesign` / `roadmap` / `regression-checklist`：W4 切片 9 ✅；`version.spec` 新增「同步配置弹窗可保存升级方式」
  验证点：`rg '@ant-design/pro-components' frontend/src/components/dialog/version/CompareVersion.tsx SyncConfig.tsx` = 0；`rg -l '@ant-design/pro-components' frontend/src --glob '*.{ts,tsx}' | wc -l`；`npx playwright test tests/e2e/version.spec.ts --grep "可视化 diff|同步配置" --project=chromium --workers=1`

#### 重构：W4 切片 8 — DefaultSetUp ModalForm → antd Form+Modal

**重构**

- 设计器菜单「默认项设置」`dialog/setup/DefaultSetUp`：摘 `ModalForm` / `ProCard` / `ProForm*` → antd `Modal` + `Form` + `Tabs`；触发 aria、两 Tab（默认字段/默认配置）、保存 `updateProfile` →「设置成功」不变；WORD 上传仍走 `updateWordTemplateConfig`

**测试 / 文档**

- `ui-layout-redesign` / `roadmap` / `regression-checklist`：W4 切片 8 ✅
  验证点：`rg '@ant-design/pro-components' frontend/src/components/dialog/setup/DefaultSetUp.tsx` = 0；`rg -l '@ant-design/pro-components' frontend/src --glob '*.{ts,tsx}' | wc -l`；`npx playwright test tests/e2e/project-menu.spec.ts --grep "默认项设置" --project=chromium --workers=1`

#### 重构：W4 切片 7 — DatabaseSetUp ModalForm → antd Form+Modal

**重构**

- 设计器菜单「数据源设置」`dialog/setup/DatabaseSetUp`：摘 `ModalForm` / `ProFormList` / `ProForm*` → antd `Modal` + `Form` + `Form.List`；触发/标题/「新增数据源」aria 与 blur 写 `/ncnb/dataSources` 行为不变；方言选项改从 `dataTypeDomains.database`（对齐原 setting 页正确源）
- 删除零引用 `pages/design/setting/component/DatabaseSetUp.tsx`（ProForm/ProCard 死页）

**测试 / 文档**

- `ui-layout-redesign` / `roadmap` / `regression-checklist`：W4 切片 7 ✅
  验证点：`rg 'ModalForm|ProForm' frontend/src/components/dialog/setup/DatabaseSetUp.tsx` = 0；`test ! -f frontend/src/pages/design/setting/component/DatabaseSetUp.tsx`；`npx playwright test tests/e2e/adr0008-datasource.spec.ts tests/e2e/project-menu.spec.ts --grep "数据源" --project=chromium --workers=1`

#### 重构：W4 切片 6 — CopyProject ModalForm → antd Form+Modal

**重构**

- `CopyProject`（版本行「复刻」弹窗）：摘 `ModalForm` / `ProFormSelect` / `ProFormText` / `ProFormTextArea` → antd `Modal` + `Form` + `Select mode="tags"`；宽度 520；项目类型用数值（对齐 AddProject，不再 `labelInValue`）；失败 toast 且不关窗；`data-testid`（`project-copy-trigger` / `project-copy-tags`）；props 去掉 `any`

**测试 / 文档**

- `ui-layout-redesign` / `roadmap` / `regression-checklist`：W4 切片 6 ✅；`version.spec` 新增「版本行复刻弹窗可创建个人项目」
  验证点：`rg 'ModalForm|ProForm' frontend/src/components/dialog/project/CopyProject.tsx` = 0；`npx playwright test tests/e2e/version.spec.ts --grep "复刻" --project=chromium --workers=1`

#### 重构：W4 切片 5 — 清除零引用 module/entity/database ModalForm

**重构**

- 删除零挂载 `DataDomain` / `DynamicDialog` 及仅被其引用的 `dialog/module|entity|database|dataType`（含 ModalForm：`AddModule`/`RenameModule`/`AddEntity`/`RenameEntity`/`AddDatabase`/`RenameDatabase`/`AddDataType`/`RenameDataType` 等）
- 模型/表 CRUD 已由左树 `EntityModal`（antd `Modal`+`Form`）承接；禁止为凑 Pro 清零而平移不可见弹窗

**测试 / 文档**

- `ui-layout-redesign` / `roadmap` / `regression-checklist`：W4 切片 5 ✅；`empty-projectjson` 断言 EntityModal 路径
  验证点：`test -d frontend/src/components/dialog/module` 等目录不存在；`rg 'dialog/(module|entity|database|dataType)|DataDomain|DynamicDialog' frontend/src` = 0；`npx playwright test tests/e2e/empty-projectjson.spec.ts --project=chromium --workers=1`

#### 重构：W4 切片 4 — RenameProject ModalForm → antd Form+Modal

**重构**

- `RenameProject`（修改项目弹窗）：摘 `ModalForm` / `ProFormSelect` / `ProFormText` / `ProFormTextArea` → antd `Modal` + `Form` + `Select mode="tags"`；宽度 520；打开时拆分 `tags` 字符串回填；失败 toast 且不关窗；`data-testid`（`project-rename-trigger` / `project-rename-tags`）；props 去掉 `any`

**测试 / 文档**

- `ui-layout-redesign` / `roadmap` / `regression-checklist`：W4 切片 4 ✅；`project-surface` 新增「个人项目：修改弹窗可改名并回列表」
  验证点：`rg 'ModalForm|ProForm' frontend/src/components/dialog/project/RenameProject.tsx` = 0；`npx playwright test tests/e2e/project-surface.spec.ts --grep "修改弹窗" --project=chromium --workers=1`

#### 重构：W4 切片 3 — AddProject ModalForm → antd Form+Modal

**重构**

- `AddProject`（新增项目弹窗）：摘 `ModalForm` / `ProFormSelect` / `ProFormText` / `ProFormTextArea` → antd `Modal` + `Form` + `Select mode="tags"`；宽度 520；`type` 初值尊重调用方（个人/团队页）；标签 `notFoundContent={null}`；失败不关窗（受控 `open`）；`data-testid`（`project-create-trigger` / `project-tags`）与校验文案不变

**测试 / 文档**

- `ui-layout-redesign` / `roadmap` / `regression-checklist`：W4 切片 3 ✅；`createPersonProject` 写 tags 内 input + 断言 chip 后再填描述
  验证点：`rg 'ModalForm|ProForm' frontend/src/components/dialog/project/AddProject.tsx` = 0；`npx playwright test --grep "登录 → 新建项目|新建项目表单可创建成功" --project=chromium --workers=1`

#### 修复：多标签版本 E2E（Escape 遮罩 / 标签未落盘）

**修复**

- `saveVersion`：tags 回车后断言 chip 可见，再点「版本描述」失焦关下拉；**禁止 Escape**（antd Select「暂无数据」遮罩挡「确定」，偶发清掉未提交输入 → `1.0.1` 无 `release` 被筛选隐藏）
- `AddVersion` / `RenameVersion`：`Select notFoundContent={null}`；`AddVersion` 保存失败改为 `return` 不 `reject`（对齐 RenameVersion，避免 webpack overlay）

**测试**

  验证点：`npx playwright test tests/e2e/version.spec.ts --grep "多标签" --project=chromium --workers=1` → passed

#### 重构：W4 切片 2 — RenameVersion ModalForm → antd Form+Modal

**重构**

- `RenameVersion`（编辑版本弹窗）：摘 `ModalForm` / `ProFormText` / `ProFormTextArea` / `ProFormSelect` → antd `Modal` + `Form` + `Select mode="tags"`；宽度 520；打开时回填当前版本与标签；非最新版版本号 `readOnly`；业务失败（重复号 / 版本过低 / 标签超长）toast 且不关窗（受控 `open`，勿 `reject` 以免 webpack overlay）；`data-testid`（`version-rename-btn` / `version-tag-input`）与校验文案不变

**测试 / 文档**

- `ui-layout-redesign` / `roadmap` / `regression-checklist`：W4 切片 2 ✅；E2E 失败关窗改 Escape（更稳）
  验证点：`rg 'ModalForm|ProFormText|ProFormSelect' frontend/src/components/dialog/version/RenameVersion.tsx` = 0；`npx playwright test tests/e2e/version.spec.ts --grep "重命名描述" --project=chromium --workers=1`

#### 重构：W4 切片 1 — AddVersion ModalForm → antd Form+Modal

**重构**

- `AddVersion`（保存版本弹窗）：摘 `ModalForm` / `ProFormText` / `ProFormTextArea` / `ProFormSelect` → antd `Modal` + `Form` + `Select mode="tags"`；宽度 520；标签逗号分隔、校验（版本号/描述/标签总长≤255）与 `data-testid`（`add-version-btn` / `version-empty-save-btn` / `version-tag-input`）不变

**测试 / 文档**

- `ui-layout-redesign` / `roadmap` / `regression-checklist`：W4 切片 1 ✅；菜单入口 `testId=menu-add-version-btn` 避免与工具栏撞 id；E2E tags 写 Select 内 input + Escape 关下拉
  验证点：`rg 'ModalForm|ProFormText|ProFormSelect' frontend/src/components/dialog/version/AddVersion.tsx` = 0；`npx playwright test tests/e2e/version.spec.ts --grep "无数据源也可新增版本|可视化 diff" --project=chromium --workers=1` → **2 passed**（多标签 Escape 修复已落盘，本轮未再跑长 E2E）

#### 重构：W3 切片 2 — version ProList → antd List + 空态 CTA

**功能 / 重构**

- `pages/design/version`：摘 `ProList` → antd `List`；工具栏（脏标记/数据源/标签筛选/新增/对比/同步配置/重建）与行（版本号 strong、同步 Tag、标签 chips、变更摘要、行尾操作）平移，行为与 testid 不变
- 空态：「还没有版本」+ 主按钮「保存第一个版本」（`version-empty-save-btn`，与「新增版本」同一 `AddVersion` 动作）；标签筛选无匹配另文案
- `AddVersion` 支持可选 `label` / `testId`（空态与工具栏按钮不撞 testid）

**测试 / 文档**

- `version.spec`「无数据源也可新增版本」：断言 `version-list` / `version-empty` /「保存第一个版本」→ 保存后空态消失
- `ui-layout-redesign` / `product-capability-map` / `roadmap`：W3 切片 2 ✅
  验证点：`cd frontend && npx playwright test tests/e2e/version.spec.ts --grep "无数据源也可新增版本|可视化 diff" --project=chromium --workers=1`；`rg 'ProList' src/pages/design/version` = 0

#### 功能：W3 切片 1 — 跨版本 diff 导出 + 零引用图表依赖清理

**功能**

- CompareVersion diff 弹层「导出」：主按钮下载 Markdown 变更清单（结构化模型变更 + 变化脚本 SQL）；下拉「仅导出 SQL」；空内容 `message.warning`，成功 toast
- 新增 `formatVersionDiffMarkdown`（纯函数）复用既有 `File.save` 管道；`data-testid=version-diff-export-btn` / `aria-label=导出变更清单`

**清理**

- 移除零引用依赖 `bizcharts`、`@ant-design/plots`（Radar 已随 W2 切片 2 删除）；清 `bizcharts-plugin-slider` typings

**测试 / 文档**

- `version.spec` 详情弹层断言 download `.md` +「已导出变更清单」；`formatVersionDiffMarkdown.test.ts`
- `product-capability-map` / `ui-layout-redesign` / `roadmap`：diff 导出 → ✅（W3 切片 1）
  验证点：`cd frontend && npx tsx src/components/dialog/version/formatVersionDiffMarkdown.test.ts`；`npx playwright test tests/e2e/version.spec.ts --grep "可视化 diff" --project=chromium --workers=1`；`rg 'bizcharts|@ant-design/plots|@ant-design/charts|@chatui/core' package.json src` = 0

#### 清理：W2 切片 2 — Home 死码 + 实验页源文件物理删除

**清理**

- Home：删 `components/Radar/`、`_mock.ts`、`service.ts`（fakeChartData）、未渲染 Pie config、重复「项目概览」卡；摘 `@ant-design/charts`
- HomeLayout：删 slogan 轮转与 `businessSlogans.json`（页脚仅版权）
- 实验页源文件删除：`pages/design/query`、`chatsql`、`dataDomain`、`pages/dataQuery`，连带 `QueryLeftContent`、`dialog/query`、`store/query`、`TabGroup.QUERY`
- 依赖移除：`@ant-design/charts`、`@chatui/core`（ChatSQL 唯一消费者）

**文档**

- `ui-layout-redesign.md` W2 切片 2 ✅；`product-capability-map.md` / `roadmap.md` / ADR-0014 同步
  验证点：`cd frontend && npx playwright test tests/e2e/layout-outlet.spec.ts --project=chromium --workers=1` → **3 passed**；`rg '@ant-design/charts|@chatui/core|useQueryStore|pages/design/query' src package.json` = 0（activation 属 chromium-serial，本切片未阻塞提交）

#### 功能：W2 切片 1 — 分享吊销接线 + 实验空壳下线路由

**功能**

- `ShareProjectButton`：顶栏「分享」→ 弹层（创建/查看链接/复制/**吊销** → `POST /share/revoke`）
- 后端 `revoke`：登录 + 项目创建人校验（对齐 security-model）；匿名放行收窄为 **GET** `/share/*`（去掉 `/share/**` 全方法放行）

**清理**

- 下线路由：`/design/table/query`、`/design/table/chatsql`、`/design/dataDomain`、`/dataQuery`（深链 → 404）；删 `pages/test`、`pages/design/test`、`account/settings/geographic` 与无引用 province/city API
- `DesignLayout` 去掉 Query 左栏 / chatsql 特例（路由已无）

**测试**

- `share.spec`：原 fork 旅程适配弹层；新增「创建→吊销→匿名失效」
- `design-query` / `data-domain` / `home-data-query`：深链断言改为 404
  验证点：`./backend/dev-ensure.sh --restart`；`cd frontend && npx playwright test tests/e2e/share.spec.ts tests/e2e/design-query.spec.ts tests/e2e/data-domain.spec.ts tests/e2e/home-data-query.spec.ts --project=chromium --workers=1`

**文档**

- `product-capability-map.md` 分享吊销 → ✅；`ui-layout-redesign.md` W2 切片 1 进度；`roadmap.md` 同步；`security-model.md` 匿名放行改为 GET-only

#### 文档：布局策略 v2 重估（能力暴露优先）+ 产品能力对照表

**文档**

- 新增 `docs/product-capability-map.md`：能力 → API/SQL → UI 暴露面 → 缺口（missing/thin/overbuilt/✅）；结论：北极星直接相关的 UI 缺口只有版本域收口（跨版本 diff 导出、审批入口）与分享吊销/管理两类
- `docs/ui-layout-redesign.md` v2：推翻三个假设（①Home 密度单列一波 ②逐页抬水位=组件平移 ③Pro 清零驱动波次）；新增「后端已能、UI 埋没或缺失」（分享吊销 missing、diff 导出 missing、数据字典 thin）与「空壳清单」（query/dataQuery/chatsql/dataDomain/JExcel/test/home Radar+mock/settings geographic 先删后美）；分波重排：W2=能力暴露+空壳清除（替代旧 Home 密度）→ W3=版本域收口（旧 W4 提前+diff 导出）→ W4=项目列表/数据源平移 → W5=登录/分享/404+Pro 依赖一次性移除；Pro import 清零降为副产品指标
- `roadmap.md` P5 UI 水位条目同步 v2 分波
  验证点：仅文档改动，无产品代码；证据：grep 后端控制器（ProjectShareController `/share/revoke` 无前端调用；RevertVersion/diff/dbsync/gendocx 已暴露 ✅；DataDictController 全 CRUD 仅实验页）+ `frontend/src/pages` 死壳清单 + Flyway V1/V2（db_change.tag）

#### 文档：全站布局重设计总纲（ui-layout-redesign.md）

**文档**

- 新增 `docs/ui-layout-redesign.md`：全站页面（落地/登录注册/Home/dataModels/project/*/databaseConfig/设计器 chrome/version/import/export/setting/account/share/404）布局重设计总纲；三种壳（品牌/工作台/设计器）+ 密度/导航/空态规范；分波 W1–W5，W5 完成后 Pro 依赖可移除
- `ui-home-model-redesign.md` 头部加总纲指针（本文保留 Home/模型页区块级 IA 与 tokens 定义）
- `roadmap.md` P5 UI 水位登记总纲与 W1–W5 分波
  验证点：仅文档改动；W1 DesignLayout 摘 Pro 见同日重构条目（已 ✅）

#### 重构：DesignLayout 摘 ProLayout → antd Layout（Strangler 切片 2）

**重构**

- `DesignLayout`：去掉 `ProLayout` / `PageContainer` / `ProCard` / Pro `WaterMark` → antd `Layout` + 顶栏 `Menu` + 条件 `Sider` + `Watermark`
- 顶栏保留 `headRightContent`（SaveStatus / 保存版本 / CollabPresence / 只读分享 + `homeRightContent`）与项目菜单 Dropdown；用户菜单复用 `menuHeaderDropdown`
- less 对齐 token-first：BEM + `var(--erd-*)`，去掉 `antd/dist/reset.css`；头像色用 `erdColors.brand`
- 清 `_defaultProps.appList`（Pro 应用抽屉死配置）
- `ProjectMenu` SubMenu `triggerSubMenuAction="click"`（Dropdown 内 hover 途经邻项易粘住）
- `layout-outlet.spec` 增 DesignLayout 顶栏/出口断言；项目菜单面板 `data-testid="project-menu-panel"`（与顶栏「版本」menuitem 消歧）；`createAndOpenPersonProject` 按项目名 listitem 定位打开
  验证点：`cd frontend && yarn build`（已绿）；`npx playwright test tests/e2e/layout-outlet.spec.ts tests/e2e/presence.spec.ts tests/e2e/project-menu.spec.ts --grep "DesignLayout|协作 presence|项目 → 设置 → 数据源|项目 → 版本" --project=chromium --workers=1` → **4 passed**

**文档**

- `roadmap.md` Pro Strangler DesignLayout ✅；`ui-home-model-redesign.md` S1b；`development.md` Design chrome 已对齐 tokens；`ui-layout-redesign.md` W1 ✅（W2 未开）

#### 重构：S1 tokens 地基 + 剪除 Pro scaffold 死 less

**重构**

- 新增 `frontend/src/theme/tokens.ts` + `css-vars.less`；`components/Theme` 用 antd 5 `ConfigProvider` 注入 `token`/`components`（无 children 时渲染 `Outlet`）
- Home/Group 布局 less 改读 `var(--erd-*)`；`global.less` 去掉渐变滚动条魔法色，保留 settings 仍需的 Pro 头像留白
- 删除未引用 Pro scaffold：`NoticeIcon`/`RightContent`/`HeaderSearch`/`HeaderDropdown`/`Footer`、`ProjectLayout` 树、`components/JExcel` 演示、`Welcome.less`、空 less（login/register/export/import/DarkTheme）、死 `Radar`/`PhoneView`/`design/test`
- 文档：`ui-home-model-redesign.md` S1 ✅ + 样式策略；`development.md` token-first 入口
  验证点：`cd frontend && yarn build`；`npx playwright test tests/e2e/layout-outlet.spec.ts tests/e2e/project-surface.spec.ts --grep "HomeLayout|GroupLayout|主导航" --project=chromium --workers=1`；`find src -name '*.less' | wc -l` 由 36 → 20（DesignLayout less 仍在，未计入删）

#### 决策：ADR-0014 已接受 · B + S0 umi/antd 升级 + Pro Strangler 切片 1

**决策 / 文档**

- `docs/adr/0014-drop-or-strangle-ant-pro.md`：**✅ 已接受 · 选项 B**；Pro 钉死 `2.8.10`；ADR README / roadmap P5 UI 水位登记
- 版本单源：`frontend/src/constants/appVersion.ts` 读 `package.json` → `APP_VERSION_LABEL`（layouts / landing / settings）

**依赖（S0）**

- `@umijs/max` `^4.0.65` → `4.6.84`；`antd` `^5.21.0` → `5.29.3`；`umi-presets-pro` → `2.0.3`
- `@ant-design/pro-components` **钉死 `2.8.10`**（不随 umi/antd 升级；WIP 误升 2.7.19 已纠正）
- `rc-util` `^5.24.4`（锁到 5.30）→ `5.44.4` + `resolutions`（修 antd 5.29 `set.merge is not a function`）

**重构（Strangler 切片 1）**

- `HomeLayout` / `GroupLayout`：去掉 `ProLayout` / `PageContainer` / `ProCard` / Pro `WaterMark` → antd `Layout` + `Menu` + `Watermark`
- `DesignLayout` / `account/settings` / 表单域仍用 Pro（后置切片）
  验证点：`yarn build`；`node -e` 断言 installed `pro===2.8.10`、`antd===5.29.3`、`max===4.6.84`；`npx playwright test tests/e2e/layout-outlet.spec.ts tests/e2e/project-surface.spec.ts --grep "HomeLayout|GroupLayout|主导航" --project=chromium --workers=1`

#### 决策：ADR-0014 @ant-design/pro-components Strangler 摘除（文档草案）

**文档**

- 新增 `docs/adr/0014-drop-or-strangle-ant-pro.md`（草案建议 B）：grep 基线 ~70 文件直接 import Pro——`ModalForm/ProForm*` ~32、`ProCard` ~12、`ProTable` ~10、`ProLayout/PageContainer` ~6、其余 ~18
- 结论：A 拒绝 / C 拒绝 / B Strangler——冻结新增、钉死 2.8.10、chrome → 表单 → 表格 → 登录注册
- `docs/ui-home-model-redesign.md` 增 S0 前置片；ADR README 索引登记
  验证点：纯文档切片（已被上方「已接受」条目覆盖）

#### 文档：Home/模型页 UI 重设计简报

**文档**

- 新增 `docs/ui-home-model-redesign.md`：视觉 tokens（brand `#DE2910` 归一、Syne/IBM Plex Sans 字族、4pt 网格、三级阴影）、Home IA（hero 条 + 紧凑项目网格，去彩虹统计/重复概览卡/slogan 轮转）、模型页 IA（删装饰背景图、sider 400→320、树面板「+ 新建」露出、画布 flex 高度替魔法数）、S1–S6 Strangler 分片
- 关键决策：Home 走工作台式亮色系统（Figma-like hub），落地页保留深色品牌门面；一个系统两种曝光
- `docs/roadmap.md` P5「UI 水位」📋→🚧 并挂简报指针
  验证点：纯文档切片，无代码改动；简报含每片验证点与度量基线（彩虹色 grep 清零、画布 +80px、高度魔法数 1→0）

#### 修复：Home 顶栏保留公众号/GitHub，排除设计器动作

**修复**

- 抽出 `homeRightContent`（公众号 Popover + GitHub stars）；`HomeLayout.actionsRender` 使用该子集
- `DesignLayout.headRightContent` = SaveStatus / 保存版本 / CollabPresence / 只读分享 + `...homeRightContent`
- 公众号图标补 `aria-label="公众号"`（稳定 E2E / 读屏）
  验证点：`npx playwright test tests/e2e/layout-outlet.spec.ts --grep "HomeLayout" --project=chromium --workers=1` → `/home` 无 `save-status` / `collab-presence` /「只读分享」；可见「GitHub 仓库」与「公众号」

**文档**

- `docs/regression-checklist.md` 登记 Home 顶栏子集

#### 修复：版本管理页空白过大 +「返回模型」导航

**修复**

- 去掉 `75vh` 固定高与空态大边距；版本页用 `version-page` 填满视口剩余高度，列表行/工具栏/空态 padding 收紧
- 页顶增加可访问「返回模型」→ `/design/table/model?projectId=…`（不依赖易被树遮挡的侧栏「模型」）
  验证点：`npx playwright test tests/e2e/version.spec.ts --grep "返回模型" --project=chromium --workers=1` → 1 passed；多标签用例不回归：`--grep "多标签"` → 1 passed

**文档**

- `docs/development.md` 注明版本页「返回模型」入口

#### 功能：版本多标签（逗号分隔，复用）

**功能**

- `db_change.tag` 仍为单列 varchar，语义改为逗号分隔多标签；Flyway `V2__db_change_tag_multi_relax.sql` 去掉 `uk_db_change_project_tag` 并加宽至 255（允许多标签跨版本复用，不再做同项目唯一）
- 保存/编辑用 antd Select `mode="tags"`；列表拆成 Tag chips（`data-testid=version-tags` +「标签」前缀）；变更摘要改为散文计数（`version-change-summary` +「变更」前缀），与标签 chips 视觉/语义分离
- 筛选按任一 token 子串匹配（客户端 split）；后端 `normalizeTag`：trim / 去空 / 忽略大小写去重后 `join(',')`
  验证点：`mvn -Dtest=DbChangeServiceImplTagTest -Djacoco.skip=true test` → 4 passed；`./backend/dev-ensure.sh --restart` → health UP + Flyway v2 + 无 `uk_db_change_project_tag`；`npx tsx src/utils/versionTags.test.ts`；`npx playwright test tests/e2e/version.spec.ts --grep "多标签" --project=chromium --workers=1` → 1 passed（断言 `version-tags` 与 `version-change-summary` 并存且可区分）

**文档**

- `docs/roadmap.md` P5 版本标签说明改为逗号分隔多标签

#### 构建：Maven 默认走阿里云（绕过 JD Artifactory）

**构建**

- `backend/.mvn/maven.config` 自动 `-s .mvn/settings.xml`；settings 镜像阿里云 `public`/`central`/`spring`；`pom.xml` 补齐同名 repositories + pluginRepositories
  验证点：`cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q dependency:get -Dartifact=org.flywaydb:flyway-core:11.7.2` 成功（Boot 3.5.16 管理版本）

**文档**

- `docs/development.md` Maven 行注明项目级阿里云 settings，绕过本机 JD Artifactory

#### 文档：Schema 双源约定（db/init vs Flyway）

**文档**

- `docs/development.md` / `docs/deployment.md`：明确 `db/init`=空卷首启+应急手工；Flyway=`erd` 增量真相源；新变更优先 Flyway only，双写须一致幂等；冻结新增 `07/08/09` 风格 init 补丁
  验证点：两文含「双源」与「优先 Flyway」表述；本切片无 schema 改写

#### 规则：Flyway 单写 Cursor rule

**规则**

- 新增 `.cursor/rules/schema-migration.mdc`（`alwaysApply: true`）：增量 schema 只写 `backend/.../db/migration/erd/`；冻结 `db/init` 新编号补丁；应急双写须与 Flyway 一致且幂等；Flyway 仅绑 erd（默认关闭防打 martin）；验证走 `./backend/dev-ensure.sh --restart`
  验证点：规则文件存在且含「真相源」「冻结」「martin vs erd」；`docs/development.md` / `docs/deployment.md` 已含双源约定（与 a7107c9 对齐，本切片无冲突改写）

#### 功能：版本标签/里程碑（P5 产品深度）

**功能**

- `db_change` 增加可选 `tag`（同项目非空唯一；落库在用户可见历史版本表，非同步游标 `db_version`）；保存/编辑弹窗可填标签；版本列表展示标签并支持按标签筛选；重复标签拦截且弹窗不关（对齐版本号查重）
- 落地 erd Flyway：`ErdFlywayConfig` + `V1__db_change_add_tag.sql`（幂等）；`spring.flyway.enabled=false`；`02_erd.sql` 基线含 `tag`（无新增 `db/init/09`）
  验证点：`mvn -Dtest=DbChangeServiceImplTagTest -Djacoco.skip=true test` → 4 passed；`./backend/dev-ensure.sh --restart` → health UP；`SHOW COLUMNS FROM erd.db_change LIKE 'tag'` 有行；`flyway_schema_history` version=1 success；`npx playwright test tests/e2e/version.spec.ts --grep "标签" --project=chromium --workers=1` → 1 passed

**文档**

- `docs/roadmap.md` P5 版本工作流「版本标签/里程碑」→ ✅

#### 修复：落地页 hero 全幅构图 + 已登录疏导（P0/P1）

**修复**

- hero 由侧栏嵌图改为全幅背景截图 + 可读 scrim；去掉 hero 内 GitHub / 重复 CTA，收束为试用+注册+登录
- 标题压到「数据库设计的 Git + Figma」；副文案保留 AI 事实源一句
- 已登录：顶栏 / hero 主 CTA / 页脚均为「进入工作台」→ `/home`（不硬跳转）
  验证点：`cd frontend && npx playwright test tests/e2e/landing.spec.ts --project=chromium --workers=1` → 2 passed；截图 `frontend/test-results/ux-walkthrough/landing-hero-audit.png`

**测试**

- `landing.spec.ts` 增补：localStorage 带 Authorization 时主 CTA → `/home`
  验证点：同上

**文档**

- `docs/landing.md` / `docs/roadmap.md` 同步全幅 hero 与已登录 CTA
  验证点：landing.md 含「全幅」与「进入工作台」

#### 功能：公开落地页 `/`（P5 叙事先行）

**功能**

- 新增 `frontend/src/pages/landing`：品牌优先全幅 hero（真实 demo 画布截图）、三卖点、对照表、footer；CTA → `/demo`、注册/登录、GitHub
- `routes.ts`：`/` 改为落地页（`layout: false`）；登录/注册亦 `layout: false`；应用内 logo/设置回跳改为 `/home`（避免登录用户点 logo 掉进营销页）
- 登录页增加「了解产品」→ `/`
- 静态资源 `public/landing-hero.jpg`（public-demo 画布截图）
  验证点：`cd frontend && npx playwright test tests/e2e/landing.spec.ts --project=chromium --workers=1` → passed；浏览器打开 `http://localhost:8000/` 见 ERD Online hero

**测试**

- 新增 `landing.spec.ts`：落地页加载、主 CTA→demo、去登录→了解产品回路
  验证点：同上

**文档**

- `docs/landing.md` / `docs/roadmap.md` P5 落地页子项同步实现说明
  验证点：roadmap 落地页节含 `/` 与 `landing.spec.ts`

#### 文档：接受 ADR-0012 选项 B + ADR-0013 stub + vision/roadmap 对齐

**文档**

- `docs/adr/0012-ai-era-data-structure-platform.md`：状态 → **已接受**；决策记录选项 B + 日期 2026-08-02
- `docs/vision.md`：一句话定位改为「Git + Figma + AI 时代开源事实源」；「不做 AI 噱头」按 ADR 精确改写；移除「待确认」阻断注记
- `docs/roadmap.md` P5：待确认 → 🚧；落地页为首个 🚧 子项；开放 API/MCP 注明受 ADR-0013 约束
- 新增 `docs/adr/0013-public-api-mcp.md`（📋）：鉴权/限流/scope 待定；触发条件为落地页上线且需求清晰；本切片不实现
- `docs/landing.md` / `docs/adr/README.md` 同步状态
  验证点：`rg '已接受|选项 B' docs/adr/0012-ai-era-data-structure-platform.md`；`rg '待确认' docs/vision.md docs/roadmap.md` → 无 P5/vision 阻断注记；`test -f docs/adr/0013-public-api-mcp.md`

#### 文档：ADR-0012 AI 时代数据结构平台（待确认）+ roadmap P5 + 落地页草稿

**文档**

- 新增 `docs/adr/0012-ai-era-data-structure-platform.md`（状态**待确认**）：定位升级选项 A/B/C，推荐 B（Git+Figma+agent 可读的开源事实源，开放+安全）；明确「AI 噱头不做 vs 平台级 AI 能力做」的边界；含 vision.md 拟议修改 diff（未批准不生效）
- `docs/vision.md` 一句话定位下追加「待确认」注记指向 ADR-0012（未改写定位本身）
- `docs/roadmap.md` 新增 **P5：AI 时代数据结构平台（待确认）**：落地页（品牌 hero，禁 AI slop 模板）/ 产品深度 / UI 水位（Strangler）/ 开放（API/MCP/schema-as-code/DBML 互通）/ 安全（token/CSRF/SQL 信任链/密钥）/ 用户没说的缺口（贡献者漏斗、schema 版本化承诺、agent 可读 projectJSON、可观测性、自部署 DX、竞品对比）
- 新增 `docs/landing.md`：落地页 IA + hero 文案方向草稿（不含实现）
- `docs/adr/README.md` 索引补 0012
  验证点：`git status` 仅 docs/CHANGELOG 五处变更；`docs/adr/0012-*.md` 状态为「待确认」；roadmap 含「P5：AI 时代数据结构平台（待确认）」小节

#### 功能：协作 sync 提示带「保存版本」直达（下一季③）

**功能**

- 远端 sync toast 改为 notification：info / dirty warning 均附主按钮「保存版本」（`data-testid="sync-save-version-cta"`），点击直达 `/design/table/version/all`
- 节流由 3s 调整为同会话 ≤1 次/分钟，避免协作噪声打断
  验证点：`cd frontend && npx playwright test tests/e2e/sync-toast.spec.ts --project=chromium --workers=1` → 2 passed（info/warning CTA → 版本页）

**测试**

- `sync-toast.spec.ts`：info / warning 路径均断言 CTA 可见并跳转 `version/all?projectId=…`
  验证点：同上

**文档**

- `docs/roadmap.md` 下一季③ → 🚧，子项「sync 提示→保存版本」✅
  验证点：roadmap ③ 行含 🚧 与本切片 ✅ 日期

#### 修复：审批通过路径校验 SQL 执行结果（失败不落通过、不 sync）

**修复**

- `ApprovalController.update`：通过（`approveStatus=1`）时先执行 `DbSqlExecCommand.exec` 并检查结果；失败/`exec` 抛异常 → `R.failed`，**不**更新 `approve_status`、**不** `syncBdVersion`；成功后再 sync 并落库
  验证点：`JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q test -Dtest=ApprovalControllerTest -Djacoco.skip=true` → 通过；curl：坏 JDBC 审批 `PUT /ncnb/approval/{id}` → code=500（连接失败）且读回 `approveStatus=0`；`npx playwright test approval.spec.ts --grep "SQL 失败" --project=chromium --workers=1` → 1 passed

**测试**

- 新增 `ApprovalControllerTest`：SQL 失败/抛异常不 sync 不 update；成功才 sync+update；空 dbInfo 直接失败
- `approval.spec.ts`：坏数据源点「通过」→ 失败 toast 可见 + 状态仍待审批 + API `approveStatus=0`
  验证点：同上

**文档**

- `docs/roadmap.md` 下一季② 子项「审批通过路径」✅，整体 ✅
  验证点：roadmap ② 行含本切片 ✅ 日期

#### 修复：Word 导出去 MinIO 硬依赖（classpath 默认模板 + 缺席降级）

**修复**

- `GenDocServiceImpl`：`gendocx` / `downloadWordTemplate` 在 MinIO 缺席或默认模板下载失败时回落 `classpath:templates/word/defaultWorldTemplate.docx`；自定义模板仍走 MinIO；`uploadWordTemplate` 在 MinIO 缺席时返回明确文案（不再 NPE）
- 内置 `defaultWorldTemplate.docx`（项目名/当前版本占位）
  验证点：`JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q test -Dtest=GenDocServiceImplTest` → 通过；curl（无 MinIO）：`POST /ncnb/doc/gendocx` → 200 + `PK` 魔数；`downloadWordTemplate` → 200；`uploadWordTemplate` → msg 含「MinIO」；`export.spec` Word 下载绿

**测试**

- 新增 `GenDocServiceImplTest`：classpath 降级、自定义模板缺 MinIO 报错、上传失败文案、MinIO 优先/失败回落、无 MinIO 导出/下载
- `export.spec.ts`：无 MinIO 时「导出 Word」真实下载（OOXML `PK`）
  验证点：同上

**文档**

- `docs/deployment.md`：MinIO 标为可选；说明内置模板与上传前置条件
- `docs/roadmap.md` 下一季② 子项「Word/MinIO 解耦」✅
  验证点：roadmap ② 行含本切片 ✅ 日期

#### 修复：导出失败可见（Word/DDL/ExportCommon，不再静默/空白）

**修复**

- `exportSlice`：Word/PDF `gendocx` 用局部 `errorHandler` 强制 reject，避免全局 handler `resolve(undefined)` 后无反馈；失败统一 `「…导出失败!请重试！出错原因：…」`；成功/失败后 `Modal.destroyAll` 收起「导出提示」
- `exportSQL` 返回 `boolean`；空内容/写入失败走同一失败文案；`ExportDDL`（菜单弹窗 + 页面 StepsForm）`onFinish` 返回 false 保持对话框
- `ExportCommon` 卡片补 `data-testid=export-common-*`
  验证点：`cd frontend && npx playwright test --grep "导出失败" --project=chromium-serial --no-deps` → 3 passed

**测试**

- 新增 `export-feedback.spec.ts`：Word 模拟 500、Word 网络 abort、DDL 自定义空内容失败且弹窗不关；纳入 `chromium-serial`
  验证点：同上

**文档**

- `docs/roadmap.md` 下一季② → 🚧，子项「导出失败可见」✅
  验证点：roadmap ② 行含 🚧 与本切片 ✅ 日期

#### 功能：设计器顶栏「保存版本」常驻入口（关通知不丢激活路径）

**功能**

- 新增 `SaveVersionButton`（`data-testid="design-header-save-version"`），挂入 `DesignLayout` 顶栏右侧（SaveStatus 旁）；直达 `/design/table/version/all`
- 示例就绪通知文案提示顶栏备用入口；关闭按钮补 `data-testid="example-ready-dismiss"`
  验证点：`cd frontend && npx playwright test activation.spec.ts --project=chromium-serial --no-deps` → 含新用例「关闭示例就绪通知后仍可经顶栏保存版本」全绿

**测试**

- `activation.spec`：关通知 → CTA 消失 → 顶栏「保存版本」→ 新增版本 → `version-row-1.0.0`
  验证点：同上

#### 功能：示例项目就绪后直达「保存第一个版本」（下一季①首屏叙事→30s 进版本保存）

**功能**

- `utils/exampleProject.ts → .tsx`：示例项目创建成功进入设计器后，弹出常驻通知卡（message「示例项目已就绪」+ 主按钮「保存第一个版本」`data-testid="example-save-version-cta"`），点击直达 `/design/table/version/all`；取代原「开始探索吧」toast（消除进设计器后找不到版本入口的断点）
  验证点：`cd frontend && npx playwright test activation.spec.ts --project=chromium-serial --no-deps` → 5 passed（45.1s），含新用例

**测试**

- `activation.spec` 新增「示例项目一键直达保存第一个版本（30s 激活闭环）」：/home → 一键示例 → 通知 CTA → 版本页 → 新增版本 → `version-row-1.0.0` 可见
  验证点：同上 5 passed；全量套件两轮连跑（69/72 passed）失败均为 export/loading 既有 flaky，与本改动无关

#### 规则：新增 model-routing 子任务模型路由规则

**规则**

- `.cursor/rules/model-routing.mdc`（alwaysApply）：规划类子任务（选题/ROI/roadmap/ADR/取舍）派 `kimi-k3-high`；执行类（实现/bugfix/E2E/commit/文档蒸馏）省略 `model` 走 Auto；仅允许三个既有 slug
  验证点：`git status` 仅新增 1 个 `.mdc` + CHANGELOG 一行

#### 文档：roadmap 新增「下一季只做三件事」+ agent-loop 选题规则对齐

**文档**

- `docs/roadmap.md`：当前状态后新增「下一季只做三件事（北极星杠杆）」——① 首屏叙事+示例项目→30s 进版本保存；② 导出/版本信任链打穿；③ 协作→版本自然发生；AI / i18n / 正式仓 Issue 投放标为依赖外部或后置
- `scripts/agent-loop-vision.prompt.md`：矩阵 🚧=0 时按三件事顺序选题；idle 条件收紧为「三件全被外部依赖阻断」
- `docs/vision.md`：北极星指标处补一行指向 roadmap 新章节（不重写愿景）
  验证点：纯文档改动；`git diff --stat` 仅 4 个 md 文件

#### 修复：编辑版本号校验失败仍关弹窗

**修复**

- `RenameVersion`：最新版改号时若「版本号已存在」或「不能 ≤ 已有版本」，`onFinish` 返回 `false` 保持弹窗；成功路径才关闭
  验证点：`cd frontend && npx playwright test tests/e2e/version.spec.ts --project=chromium -g "重命名描述"`

**测试**

- `version.spec`「重命名与删除」：最新版 `1.0.1`→`1.0.2` 成功；再改回 `1.0.0` 见「该版本号已经存在了」且弹窗仍开
  验证点：同上

**文档**

- `docs/control-matrix.md` W4 重命名行；`docs/community.md` 种子 55；不续 a11y 草稿；Word 导出仍依赖本机 MinIO（compose 未挂）
  验证点：同上 E2E

#### 修复：`lint:js:ci` 7 error（分享页 Array 类型 + DataDomain hooks）

**修复**

- `share/index.tsx` / `ShareRelationCanvas.tsx`：`Array<T>` → `T[]`（`@typescript-eslint/array-type`）
- `DataDomain.tsx`：`useRef` 挪到 `ready` 早退之前（`react-hooks/rules-of-hooks`）；行为不变
  验证点：`cd frontend && yarn lint:js:ci`（0 error）；`npx playwright test tests/e2e/share.spec.ts --project=chromium`

**文档**

- 本条；不续 a11y 草稿。Word 导出 E2E 本 tick 不可验（本机 MinIO 未起，`gendocx` 依赖默认模板）
  验证点：同上 lint + share.spec

#### P4 good-first：命令面板 listbox 语义（草稿 39）

**修复**

- `CommandPalette`：选项列表补 `role="listbox"` + `aria-label="命令列表"`；空态「无匹配命令」补 `aria-live="polite"`；不改快捷键与执行逻辑
  验证点：`npx playwright test tests/e2e/relation.spec.ts --project=chromium -g "命令面板"`

**测试**

- `relation.spec.ts`「命令面板」：断言 `listbox` 可见；填无匹配关键字后见「无匹配命令」且 `aria-live=polite`
  验证点：同上

**文档**

- ISSUE_DRAFTS `39` 标已合入；**不续草稿 40**（a11y 微切片边际收益低，池暂空）；README / `docs/community.md` 种子 53 / `docs/roadmap.md` P4 同步
  验证点：`DRY_RUN=1 REPO=example/erdonline ./scripts/seed-good-first-issues.sh` 无待投放（`39` 为 SKIP）

#### P4 good-first：顶栏 CollabPresence aria-live（草稿 38）

**修复**

- `CollabPresence`：补 `role="status"` + `aria-live="polite"`，读屏可播报在线名单变化；不改样式与 presence 订阅逻辑
  验证点：`npx playwright test tests/e2e/presence.spec.ts --project=chromium`

**测试**

- `presence.spec.ts`：既有「设计器顶栏可见在线名单」加 `aria-live` / `role=status` 属性断言
  验证点：同上

**文档**

- ISSUE_DRAFTS `38` 标已合入；补草稿 `39`（命令面板 listbox）；README / `docs/community.md` 种子 52–53 / `docs/roadmap.md` P4 同步
  验证点：`DRY_RUN=1 REPO=example/erdonline ./scripts/seed-good-first-issues.sh` 仅列 `39`（`38` 为 SKIP）

#### P4 good-first：顶栏 SaveStatus aria-live（草稿 37）

**修复**

- `SaveStatus`：补 `role="status"` + `aria-live="polite"`，读屏可播报「保存中… / 已保存 / 未保存」；不改样式与自动保存逻辑
  验证点：`npx playwright test tests/e2e/relation.spec.ts --project=chromium -g "save-status|aria-live"`

**测试**

- `relation.spec.ts`：新增「save-status：aria-live 播报自动保存状态」；建表后断言「已保存」及 `aria-live` / `role`
  验证点：同上

**文档**

- ISSUE_DRAFTS `37` 标已合入；补草稿 `38`（CollabPresence aria-live）；README / `docs/community.md` 种子 51–52 / `docs/roadmap.md` P4 同步
  验证点：`DRY_RUN=1 REPO=example/erdonline ./scripts/seed-good-first-issues.sh` 仅列 `38`（`37` 为 SKIP）

#### P4 good-first：画布工具栏撤销/重做/对齐 aria（草稿 36）

**修复**

- `erd-canvas-toolbar`：撤销 / 重做 / 自动布局及对齐六钮补中文 `aria-label`（对齐与 `title` 一致；可见「自动布局」可访问名同步）
  验证点：`npx playwright test tests/e2e/relation.spec.ts --project=chromium -g "工具栏"`

**测试**

- `relation.spec.ts`：新增「工具栏：撤销/重做/自动布局与对齐可访问名」；多选后断言对齐组与六钮 `getByRole`
  验证点：同上

**文档**

- ISSUE_DRAFTS `36` 标已合入；补草稿 `37`（SaveStatus aria-live）；README / `docs/community.md` 种子 50–51 / `docs/roadmap.md` P4 同步
  验证点：`DRY_RUN=1 REPO=example/erdonline ./scripts/seed-good-first-issues.sh` 仅列 `37`（`36` 为 SKIP）

#### P4 good-first：ReactFlow MiniMap 中文可访问名（草稿 35）

**修复**

- 设计器与分享页 `<MiniMap />` 增加 `ariaLabel="画布缩略图"`（覆盖库默认 `React Flow mini map`）
  验证点：`npx playwright test tests/e2e/relation.spec.ts --project=chromium -g "MiniMap|缩略图"`

**测试**

- `relation.spec.ts`：新增「MiniMap：中文可访问名」；断言 `getByRole('img', { name: '画布缩略图' })`，英文文案 count=0
  验证点：同上

**文档**

- ISSUE_DRAFTS `35` 标已合入；补草稿 `36`（画布工具栏 aria）；README / `docs/community.md` 种子 49–50 / `docs/roadmap.md` P4 同步
  验证点：`DRY_RUN=1 REPO=example/erdonline ./scripts/seed-good-first-issues.sh` 仅列 `36`（`35` 为 SKIP）

#### P4 good-first：ReactFlow Controls 中文可访问名（草稿 34）

**修复**

- 新增 `ZhControls`：自定义 ControlButton，`aria-label`/`title` 为「放大」「缩小」「适应画布」「切换交互」；设计器与分享页替换默认 `<Controls />`
  验证点：`npx playwright test tests/e2e/relation.spec.ts --project=chromium -g "Controls"`

**测试**

- `relation.spec.ts`：新增「Controls：中文可访问名」；`helpers.connectFields` 改点「适应画布」
  验证点：同上；英文 `zoom in` 等 `getByLabel` count=0

**文档**

- ISSUE_DRAFTS `34` 标已合入；补草稿 `35`（MiniMap 中文 aria）；README / `docs/community.md` 种子 48–49 / `docs/roadmap.md` P4 同步
  验证点：`DRY_RUN=1 REPO=example/erdonline ./scripts/seed-good-first-issues.sh` 仅列 `35`（`34` 为 SKIP）

#### P4 good-first：画布「删除字段」可访问按钮（草稿 33）

**修复**

- 关系图表节点 `erd-field-delete`：`span` → `button` + `aria-label="删除字段"`（保留无二次确认）
  验证点：`npx playwright test tests/e2e/relation.spec.ts --project=chromium -g "删除字段"`

**测试**

- `relation.spec.ts`：新增「删除字段：可访问按钮移除字段行」
  验证点：同上

**文档**

- ISSUE_DRAFTS `33` 标已合入；README / `docs/community.md` 种子 47 / `docs/roadmap.md` P4 同步
  验证点：`DRY_RUN=1 REPO=example/erdonline ./scripts/seed-good-first-issues.sh` 仅列 `34`（`33` 为 SKIP）

#### P4 社区：补 good-first 草稿 33–34

**文档**

- 新增 ISSUE_DRAFTS `33`（画布删除字段 a11y）/ `34`（RF Controls 中文 aria）；同步 README 待投放表与 `docs/community.md` 种子 47–48
  验证点：`ls .github/ISSUE_DRAFTS/3[34]-*.md`；`DRY_RUN=1 REPO=example/erdonline ./scripts/seed-good-first-issues.sh` 列出上述两标题且非 SKIP

#### CHANGELOG Unreleased 按日折叠

**文档**

- 多段 `## [Unreleased] — …` 合并为单节，同日归入 `### YYYY-MM-DD`；保留全部验证点
  验证点：`head -n 80 CHANGELOG.md` 见维护约定 + `### 2026-08-02`；`rg -c '^## \[Unreleased\]' CHANGELOG.md` = 1

#### P2b 收口：公告页闭环 + roadmap/vision 选题

**修复**

- `/project/notice`：加载失败明确 toast（`加载公告失败`），避免静默空列表
  验证点：`project-notice.spec`「加载失败有 toast」

**测试**

- 新增 `project-notice.spec.ts`：首页「更多公告」→ 列表见种子公告；失败 toast
  验证点：`npx playwright test tests/e2e/project-notice.spec.ts --project=chromium`

**文档**

- `docs/roadmap.md` P2b：矩阵 🚧=0；📋 延期项简述；下一阶段战略改指 P4 Issue / AI·i18n
- `scripts/agent-loop-vision.prompt.md`：矩阵 🚧=0 后优先可行动 📋 或 roadmap 📋
- `docs/control-matrix.md`：公告 → ✅；🗑 六行确认代码已不存在；统计 ✅90 / 🚧0 / 🗑6 / 📋6
- `docs/regression-checklist.md`：公告页自动化

#### W6 权限组 / GroupLayout 导航 / 404 闭环

**修复**

- 团队权限组：等 GroupLayout `access.initialized` 后再拉 roles 并挂「用户组成员」「权限配置」，消除竞态空嵌套页签；roles 失败有 toast
  验证点：`group-layout-nav.spec`「权限组」见角色 tab + 用户组成员/权限配置 +「全选」/「团队基础设置」
- GroupLayout 菜单：「返回项目列表」→ `/dataModels`（不带 projectId）；「打开模型」写入 `projectId` 缓存并进设计器
  验证点：`group-layout-nav.spec`「返回/打开」

**测试**

- 新增 `group-layout-nav.spec.ts`、`not-found.spec.ts`（未知路径 404 +「返回首页」）
  验证点：`npx playwright test tests/e2e/group-layout-nav.spec.ts tests/e2e/not-found.spec.ts --project=chromium`

**文档**

- `docs/control-matrix.md`：上述 4 行 → ✅；统计 ✅89 / 🚧0 / 🗑6 / 📋7（合计 102）
- `docs/roadmap.md` P2b：矩阵 🚧=0
- `docs/regression-checklist.md`：权限组/导航/404 自动化

#### W6 `/project/group/setting/basic` 保存 toast

**修复**

- 团队项目基本设置：保存成功「修改成功」；失败走全局拦截器 toast，无 msg 时组件兜底「修改失败」；GET 返回的 tags 字符串拆成 Select tags 数组
  验证点：`group-basic-setting.spec` 成功/失败 toast

**测试**

- 新增 `group-basic-setting.spec.ts`：API 建团队项目→改项目名提交→toast；mock update 失败 toast
  验证点：`npx playwright test tests/e2e/group-basic-setting.spec.ts --project=chromium`

**文档**

- `docs/control-matrix.md`：保存基本设置 → ✅；统计 ✅85 / 🚧4 / 🗑6 / 📋7（合计 102）
- `docs/roadmap.md` P2b 长尾已收群组基本设置 toast
- `docs/regression-checklist.md`：群组基本设置保存自动化

#### W6 `/account/settings` 其它页签可切换

**修复**

- `/account/settings`：侧栏切换同步 `?selectKey=`；URL 与内容对齐；resize 不再因闭包打回旧页签
  验证点：头像→个人中心→「安全设置」URL=`selectKey=security` 且见「账户密码」/「修改」；「授权类型」见「开源版」或「已取得授权」
- 删除未接线死组件 `notification.tsx`（菜单无通知页签）

**测试**

- `account-settings.spec.ts`：头像菜单进入后切换 security / identification 有内容；授权信息直达
  验证点：`npx playwright test tests/e2e/account-settings.spec.ts --project=chromium`

**文档**

- `docs/control-matrix.md`：其它 selectKey 页签 → ✅；统计重算 ✅84 / 🚧5 / 🗑6 / 📋7（合计 102）
- `docs/roadmap.md` P2b 长尾已收 settings 其它页签
- `docs/regression-checklist.md`：页签切换自动化

#### W6 Home `/dataQuery` 主导航裁剪

**修复**

- HomeLayout `_defaultProps`：移除「数据查询」菜单（与设计器查询同策略）
  原因：`QueryInfoServiceImpl.exec` 经 MyBatis 打**应用库**，忽略前端所选数据源；非北极星主路径
  验证点：`/home` 主导航无 link「数据查询」；仍有「数据模型」「数据源」
- `/dataQuery`：加「实验功能」Alert（`data-testid=home-data-query-page`）；路由保留深链
  验证点：直达页见「实验功能」

**测试**

- 新增 `home-data-query.spec.ts`：主导航无「数据查询」+ 深链实验提示
  验证点：`npx playwright test tests/e2e/home-data-query.spec.ts --project=chromium`

**文档**

- `docs/control-matrix.md`：Home 数据查询菜单 → ✅；页内实验 📋；统计 ✅68 / 🚧24 / 📋4
- `docs/roadmap.md` P2b 长尾已收 Home 数据查询裁剪
- `docs/regression-checklist.md`：Home 数据查询裁剪自动化

#### W6 `/account/settings` 基本资料保存 toast

**修复**

- `/account/settings` 基本资料：保存成功 `更新基本信息成功`；失败走全局拦截器 toast，无 msg 时组件兜底「更新基本信息失败」（头像保持「头像上传暂未开放」，不恢复假 Upload）
  验证点：`account-settings.spec` 成功/失败 toast；页内无「更换头像」/file input

**测试**

- 新增 `account-settings.spec.ts`：保存成功 toast + 路由 mock 失败 toast + 头像裁剪态
  验证点：`npx playwright test tests/e2e/account-settings.spec.ts --project=chromium`

**文档**

- `docs/control-matrix.md`：基本资料保存 → ✅；统计 ✅67 / 🚧25 / 📋4
- `docs/roadmap.md` P2b 长尾已收账户基本资料 toast
- `docs/regression-checklist.md`：账户设置保存自动化

#### W6 `/design/table/query` 侧栏裁剪

**修复**

- DesignLayout `_defaultProps`：移除「查询」菜单（与 Chat SQL / 数据域同策略）
  原因：`QueryInfoServiceImpl.exec` 经 MyBatis `${sql}` 打**应用库**，忽略前端所选数据源；非北极星主路径
  验证点：项目菜单无 menuitem「查询」；无 `link`「查询」
- `/design/table/query`：加「实验功能」Alert（`data-testid=design-query-page`）；路由保留深链
  验证点：直达页见「实验功能」
- 设计器查询 / Home `/dataQuery`：运行、执行计划、保存 SQL 失败/成功均有 antd message（消除静默失败）
  验证点：手工清单「深链运行失败有 toast」；见 regression-checklist

**测试**

- 新增 `design-query.spec.ts`：项目菜单无「查询」+ 深链实验提示
  验证点：`npx playwright test tests/e2e/design-query.spec.ts --project=chromium`

**文档**

- `docs/control-matrix.md`：查询菜单 → ✅；页内实验 📋；统计 ✅66 / 🚧26 / 📋4
- `docs/roadmap.md` P2b 长尾已收查询侧栏裁剪
- `docs/regression-checklist.md`：查询裁剪自动化 + 失败 toast 手工项

#### W6 `/design/dataDomain` 侧栏裁剪

**修复**

- DesignLayout `_defaultProps`：移除「数据域」路由菜单项（与 Chat SQL 同策略；不服务「版本保存」北极星主路径）
  验证点：项目菜单无 menuitem「数据域」；无 `link`「数据域」
- `/design/dataDomain`：加「实验功能」Alert；路由保留深链，不扩类型域编辑 E2E
  验证点：直达页见 `data-testid=data-domain-page` +「实验功能」
- 数据域相关对话框 store 选择器空安全（`project?.projectJSON?.…`），避免硬导航白屏
  验证点：深链 `/design/dataDomain` 不再报 `dataTypeDomains` TypeError

**测试**

- 新增 `data-domain.spec.ts`：项目菜单无「数据域」+ 深链实验提示
  验证点：`npx playwright test tests/e2e/data-domain.spec.ts --project=chromium`

**文档**

- `docs/control-matrix.md`：数据域菜单 → ✅；页内实验 📋；统计 ✅65 / 🚧27 / 📋3
- `docs/roadmap.md` P2b 长尾已收数据域侧栏裁剪
- `docs/regression-checklist.md`：数据域裁剪自动化

#### W4 工单/审批有数据全链路

**测试**

- `approval.spec`：API `POST /ncnb/approval` 种子待审（自审）→ 审批页见行 → UI「拒绝」toast「已拒绝」→ 工单页「复批」toast「已重新提交审批」
  验证点：`npx playwright test tests/e2e/approval.spec.ts --project=chromium`
  说明：「通过」会走 JDBC 执行 SQL，本切片不覆盖；发起 UI（版本详情 SQL审批）依赖数据源+团队成员，种子用真实创建 API 代替

**文档**

- `docs/control-matrix.md`：工单/审批有数据全链路 → ✅；统计 ✅64 / 🚧28
- `docs/roadmap.md` P2b 长尾已收工单有数据拒绝/复批
- `docs/regression-checklist.md`：有数据拒绝/复批自动化；UI 发起+通过仍手工

#### W6 `/design/table/setting/defaultField` 闭环

**修复**

- 默认字段表格编辑后防抖 toast「默认字段已更新」（页路由与项目菜单弹窗共用 `updateDefaultFields`）
  验证点：改主键英文字段名 → toast；新建表节点含新字段名
- DesignLayout：硬导航首帧在 `projectJSON` 未就绪时不挂载子页，避免 JExcel 空表只 init 一次
  验证点：直达 `/design/table/setting/defaultField` 可见默认 `id` 行
- `getDefaultFields`：兼容嵌套数组旧数据；类型域无匹配时仍保留字段
  验证点：设置页不再空白

**测试**

- 新增 `default-field.spec.ts`：进设置页 → 改 `id`→`e2e_pk` → toast → 空态建表见 `e2e_pk`
  验证点：`npx playwright test tests/e2e/default-field.spec.ts --project=chromium`

**文档**

- `docs/control-matrix.md`：`/design/table/setting/defaultField` → ✅；`docs/roadmap.md` P2b 长尾已收默认字段

#### W3 命令面板/快捷键矩阵收口

**修复**

- 清除 `useShortcutStore.show` / `setShow` 死状态（写入从未被读取；关系图开合不依赖该字段）
  验证点：开关系图 / 建表直开关系图行为不变

**测试**

- `relation.spec` 新增「命令面板：Cmd+K 打开并执行新建表」：快捷键开合 → 执行「新建表」节点 +1 → 工具条「命令」再开 → Esc 关
  验证点：`npx playwright test tests/e2e/relation.spec.ts --grep "命令面板" --project=chromium`

**文档**

- `docs/control-matrix.md`：DesignLayout 命令面板/快捷键 → ✅；`docs/roadmap.md` P2b 长尾已收命令面板

#### W3 DesignLayout 顶栏自动保存状态

**修复**

- 自动保存状态从画布工具栏迁至 DesignLayout 顶栏：模型变更后可见「保存中…」→「已保存」（失败为「未保存」+ message）
  验证点：`relation.spec` 空态建表后顶栏 `save-status` 先「保存中…」再「已保存」

**测试**

- `relation.spec`：拦截 `/ncnb/project/save` 放慢 600ms，断言顶栏状态流转
  验证点：`npx playwright test tests/e2e/relation.spec.ts --grep "全旅程" --project=chromium`

**文档**

- `docs/control-matrix.md`：DesignLayout 自动保存状态 → ✅；`docs/roadmap.md` P2b 长尾标注已收

#### W5 `/databaseConfig` 同步状态闭环

**修复**

- `/databaseConfig` 同步状态钮：点击后 loading；本地更新在线/错误徽章；成功/不可达均有明确 toast（不再全表 reload 重 ping）
  验证点：`adr0008-datasource.spec`「同步状态钮有可见反馈」

**测试**

- `adr0008-datasource.spec`：新建假 JDBC → 点「同步状态」→ 等待 ping → toast + 行内状态文案
  验证点：`npx playwright test tests/e2e/adr0008-datasource.spec.ts --grep "同步状态" --project=chromium`

**文档**

- `docs/control-matrix.md`：同步状态钮 → ✅；`docs/roadmap.md` P2b 长尾标注已收

#### W5 `/databaseConfig` 编辑/删除闭环

**修复**

- `/databaseConfig`：行内编辑/删除/同步图标钮补 `aria-label`；连接名称链可点打开编辑（原死 affordance）
  验证点：`adr0008-datasource.spec`「编辑保存 + 删除确认」

**测试**

- `adr0008-datasource.spec`：新建 → 编辑改名 PUT → toast「更新成功」→ 删除二次确认 →「删除成功」行消失
  验证点：`npx playwright test tests/e2e/adr0008-datasource.spec.ts --grep "编辑保存" --project=chromium`

**文档**

- `docs/control-matrix.md`：编辑/删除/批量删 → ✅；`docs/roadmap.md` P2b 长尾标注数据源编辑删已收

#### W5 逆向解析提交闭环

**修复**

- `DataSourceSelect`：Option/`onChange` 按 `key`（dataSource id）匹配，修复侧栏逆向页选库后 `onDbChange` 失效
  验证点：`import-reverse.spec` 侧栏页自动选中 `reverse_demo` 数据源并解析出表

**测试**

- 新增 `import-reverse.spec.ts`：POST dataSources → `/design/table/import/reverse` → 选 `t_user`/`t_order` → 等待 autosave → 模型树可见「逆向解析_MYSQL」
  验证点：`npx playwright test tests/e2e/import-reverse.spec.ts --project=chromium`（1 passed；依赖 Colima MySQL `reverse_demo`）

**文档**

- `docs/control-matrix.md`：`/design/table/import/reverse` → ✅；`docs/roadmap.md` P2b 长尾标注逆向已收

#### W4 对比版本矩阵收口

**文档**

- `docs/control-matrix.md`：W4「对比版本」→ ✅（既有 `version.spec` 双版比对已覆盖）
- `docs/roadmap.md`：P2b 长尾去掉「对比版本」
  验证点：`npx playwright test tests/e2e/version.spec.ts --grep "可视化 diff|无数据源也可新增" --project=chromium`（2 passed）

#### W5 ERD 导入闭环

**修复**

- `ReverseERD`（菜单弹窗 + 侧栏页）：上传校验接受 `.json` / `.erd.json` 文件名（OS/Playwright 常不带 `application/json` MIME）
  验证点：`npx playwright test tests/e2e/import-erd.spec.ts --project=chromium`

**测试**

- 新增 `import-erd.spec.ts` + fixture `minimal.erd.json`（默认密码 AES）：上传后树可见「ERD导入」/ `T_ERD_ITEM`
  验证点：同上，chromium 绿

**文档**

- `docs/control-matrix.md`：`/design/table/import/erd` → ✅；`docs/roadmap.md` P2b 长尾标注 ERD 导入已收

#### P2b W2 项目面闭环

**测试**

- 新增 `project-surface.spec.ts`：`/project/new`→person；home 快捷个人/最近/团队；最近项目打开设计器；主导航数据模型/数据源
  验证点：`npx playwright test tests/e2e/project-surface.spec.ts --project=chromium`

**文档**

- `docs/control-matrix.md` / `docs/roadmap.md`：P2b W0–W6 波次收口 ✅（长尾 📋 保留）

#### P2b W3–W5 控件闭环

**测试**

- 版本：`RenameVersion`/`RemoveVersion` 补 `data-testid`；`version.spec` 重命名描述 + 删除版本 + toast/行消失
  验证点：`npx playwright test tests/e2e/version.spec.ts --grep "重命名" --project=chromium`
- 导出：`export.spec` 补导出 HTML / ERD 下载；`project-menu.spec` DDL 终步 `.sql` 下载
  验证点：`npx playwright test tests/e2e/export.spec.ts tests/e2e/project-menu.spec.ts --grep "导出|DDL" --project=chromium`
- 数据源：`adr0008-datasource.spec` 测试连接 toast（假 JDBC 失败亦可）；`DatabaseConfigForm` 测试连接 `aria-label`
  验证点：`npx playwright test tests/e2e/adr0008-datasource.spec.ts --grep "测试连接" --project=chromium`
- PdMan：`tests/fixtures/minimal-pdman.json` + `import-pdman.spec` 上传后树可见
  验证点：`npx playwright test tests/e2e/import-pdman.spec.ts --project=chromium`
- 关系图：`relation.spec` 删边后刷新仍 0 条边
  验证点：`npx playwright test tests/e2e/relation.spec.ts --grep "删边" --project=chromium`

**文档**

- `docs/control-matrix.md`：W3 删边/undo、W4 重命名删除、W5 PdMan/HTML/ERD/DDL/测试连接 → ✅
- `docs/roadmap.md`：P2b W3/W4/W5 子项进度

#### P2b W6 外围裁剪

**修复**

- `Menu/index.tsx`：删除无调用方导出 `ProjectSortMenu` / `ProjectFilterMenu` / `NavigationMenu` / `VersionHandle`
- 删除 `ReverseERWin.tsx`（零引用 stub）
- `/databaseConfig`：移除顶栏无 onClick 的「数据库使用分析」「帮助」按钮
- `/account/settings` 基本资料：假 Upload 改为「头像上传暂未开放」文案
- DesignLayout 侧栏：隐藏 Chat SQL 导航项（路由 `/design/table/chatsql` 保留实验页，不扩 AI）
- `/project/new`：redirect→`/project/person`；删除 ZeroCode 占位页目录

**文档**

- `docs/control-matrix.md`：W6 裁剪行 💀→🗑/✅；统计更新
- `docs/roadmap.md`：P2b W6 进度标注
  验证点：`rg` 已删符号零引用；`yarn eslint` 受影响文件 `--max-warnings 0`；`npx playwright test tests/e2e/smoke.spec.ts --grep "登录" --project=chromium`

#### HomeLayout/GroupLayout 子路由出口

**修复**

- `HomeLayout` / `GroupLayout`：对齐 DesignLayout，在 Theme 旁显式渲染 `props.children`（消除仅靠 Theme 内 Outlet 的隐患）
  验证点：`npx playwright test tests/e2e/layout-outlet.spec.ts --project=chromium` 绿（`/home` 见新建模型 CTA；`/project/person` 见新建；`/project/group/setting/basic` 见「基本设置」且 count=1）

#### W1 会话闭环

**修复**

- `logout()`：`cache.clear()` 清 JWT/用户名（此前仅清 projectId/licence，刷新仍像已登录）
- 注册页提交文案改为「注册」；补「已有账号？去登录」；邮箱正则放宽
- 顶栏用户菜单 trigger：`aria-label` + `data-testid=user-menu-trigger`
- **注册后无法登录**：`userRegister` 写入默认 `dept_id=1`；`JwtTokenService` 拒 null claim；种子 `09_erd_user_new_privileges.sql` 给 `ERD_USER_NEW` 复制 admin 权限（此前 JWT/无权限被误报账密错误）

**测试**

- 新增 `session.spec.ts`：去注册、注册→/home、头像菜单三项、退出清会话
  验证点：`npx playwright test tests/e2e/session.spec.ts --project=chromium`；curl 注册→登录拿 `access_token`

#### P2b 控件矩阵与 Vision 选题

**文档**

- 新增 `docs/control-matrix.md` v1（全挂载路由 + Home/Design 菜单；标 💀 死表面）
- `docs/roadmap.md` 增加 **P2b：全站控件闭环** 🚧（W0–W6；W0 已随布局修复勾选）
- `scripts/agent-loop-vision.prompt.md`：P2b 🚧 时优先啃矩阵 🚧 行
- `docs/community.md` / ISSUE_DRAFTS：矩阵可拆 good-first
  验证点：矩阵数据行合计见文末统计；`control-inventory.spec.ts` 默认 skip（仅 `PW_CONTROL_INVENTORY=1`）

**测试**

- `frontend/tests/e2e/control-inventory.spec.ts`：手工采集 clickables，不进 CI

#### 版本回滚落库 + E2E goto helpers

**修复**

- `revertVersionData`：`setModules` 后 `Save.saveProject`（此前仅内存，刷新即丢）
- E2E：`gotoVersionSub` / `openVersionPage` / `gotoDesignModel` 抽到 helpers
  验证点：`version.spec` + `approval.spec` 绿

#### 项目菜单关闭态 CSS class

**修复**

- 项目下拉关闭态改用 `.erd-project-menu--closed`（禁点击 + 透明），替代内联 style
  验证点：project-menu「导出」2 绿

#### canvasHistory 单测

**测试**

- `canvasHistory.test.ts` + `yarn test:unit:canvas-history`（tsx；覆盖空栈/去重/undo-redo/截断）
  验证点：`cd frontend && yarn test:unit:canvas-history` 输出 all passed

#### share E2E 清理断言

**测试**

- `share.spec` finally：双次清理 + 断言个人列表无本次项目名/副本
  验证点：`npx playwright test tests/e2e/share.spec.ts --project=chromium` 绿

#### json2code 入口类型收窄

**修复**

- `getAllDataSQLByFilter` / `getFieldType` 补显式参数与返回类型（文件仍 `@ts-nocheck`，文档化入口）
  验证点：project-menu「导出 DDL」绿

#### PageSkeleton 可访问名

**体验**

- `PageSkeleton`：`role="status"` + `aria-label="页面加载中"`（已有 `aria-busy`）
  验证点：`loading.spec`「设计器」断言 aria 属性绿

#### 版本管理页 eslint 清零

**修复**

- `pages/design/version/index.tsx`：去掉 unused import/死函数与空 `{}` props
  验证点：`yarn eslint …/version/index.tsx --max-warnings 0`；project-menu「版本」绿

#### ExportDDL eslint 清零

**修复**

- `ExportDDL.tsx`：`ProFormInstance` / `RadioChangeEvent` 改为 `import type`
  验证点：`yarn eslint …/ExportDDL.tsx --max-warnings 0`；project-menu「导出」2 绿

#### 表头改名 E2E

**体验 / 测试**

- 表头 ✎ 补 `data-testid` / aria；`relation.spec`「表头 ✎ 可改名」（改名中用 page 级 textbox）
  验证点：`npx playwright test tests/e2e/relation.spec.ts --project=chromium -g "改名"` 绿

#### PK 徽标可访问名 + E2E

**体验**

- 关系图 PK 徽标改为 `button` + `aria-label`（取消/设为主键）；补「PK 徽标可取消再恢复」E2E
  验证点：`npx playwright test tests/e2e/relation.spec.ts --project=chromium -g "PK|全旅程"` 绿

#### 关系图边命中热区 24px

**体验**

- ReactFlow 边 `interactionWidth=24`；`relation.spec` 删边改为常规 click（不再 force）
  验证点：`npx playwright test tests/e2e/relation.spec.ts --project=chromium -g "全旅程"` 绿

#### 导出 DDL 对齐 ADR-0008 + 第二步 E2E

**修复**

- ExportDDL 从 `/ncnb/dataSources` 拉列表（不再读空的 `profile.dbs`）；选中项写入方言码；表树默认展开
- 项目菜单 `destroyPopupOnHide=false` 关闭后 `pointer-events: none`，避免挡弹窗
- 去掉 `json2code.getAllDataSQLByFilter` 内遗留 `debugger`
  验证点：`npx playwright test tests/e2e/project-menu.spec.ts --project=chromium -g "导出"` 2 绿

#### canvasHistory 去掉 any

**修复**

- `canvasHistory.ts`：`ModulesSnapshot = unknown[]`，undo/redo 经 `parseModules`
  验证点：`yarn eslint …/canvasHistory.ts --max-warnings 0`；`relation.spec`「全旅程」绿（含撤销布局）

#### approval E2E 改为 goto

**修复**

- `approval.spec`：模型页侧栏为树，「版本」menuitem 不可见 → 与 `version.spec` 一样直达 `/version/order|approval`
  验证点：`npx playwright test tests/e2e/approval.spec.ts --project=chromium` 绿

#### 我的工单页 eslint 清零

**修复**

- `pages/design/version/order`：去掉空 `{}` props；模态宽高常量提前定义（消 `no-use-before-define`）
  验证点：`yarn eslint src/pages/design/version/order --max-warnings 0`；`approval.spec`（修后）绿

#### 导出组件 ban-types + 版本行 key + Issue 草稿 18–21

**修复**

- 导出 HTML/Word/Markdown/ERD 去掉空 `{}` props 类型；版本管理行/工具栏 action 补 `key`
  验证点：`yarn eslint` 上述 4 个 Export* 文件 `--max-warnings 0`；`project-menu`「版本」「导出」绿

**文档**

- `docs/community.md` 补 Issue 草稿投放规则；草稿 18–21 待投放
  验证点：`DRY_RUN=1 REPO=example/erdonline ./scripts/seed-good-first-issues.sh` → Done: 4

#### 导出 DDL 向导 aria + Issue 投放脚本

**修复 / 体验**

- 导出 DDL StepsForm「下一步 / 上一步 / 导出」补 `aria-label`
  验证点：`npx playwright test tests/e2e/project-menu.spec.ts --project=chromium -g "导出"` 绿

**工具**

- `seed-good-first-issues.sh` 仅跳过行首 `> **已合入**`（避免正文误判）
  验证点：`DRY_RUN=1 REPO=example/erdonline ./scripts/seed-good-first-issues.sh` → `Done: 0`

#### 版本双入口说明

**文档**

- 版本页与 `docs/development.md` 标明：侧栏「版本管理」= 项目菜单「版本」
  验证点：`npx playwright test tests/e2e/project-menu.spec.ts --project=chromium -g "版本"` 绿

#### 导入/导出打开时关闭项目下拉

**修复**

- 导入三项与导出五项触发时调用 `closeProjectMenu()`，避免菜单层挡住弹窗
  验证点：`npx playwright test tests/e2e/project-menu.spec.ts --project=chromium -g "导入"` 绿（弹窗内文案可点）

#### 删表确认钮「删除」+ dev 关 MFSU

**修复**

- 树删表 `Modal.confirm` 的 `okText` 改为「删除」；E2E 匹配 antd「删 除」空格
- `config.dev.ts`：`mfsu: false`，避免 eager worker 卡住 / 送出过期模块
  验证点：`npx playwright test tests/e2e/smoke.spec.ts --project=chromium -g "删除表"` 绿

#### 模型树删表确认/取消 E2E

**修复**

- 删表确认文案统一「不可逆」；`okType: danger`；补确认删除成功路径 E2E
  验证点：`npx playwright test tests/e2e/smoke.spec.ts --project=chromium -g "删除表"` 绿

#### 版本管理首屏骨架 E2E

**新增**

- `loading.spec.ts`：慢网进版本管理见 `page-skeleton`，无 `Loading...` 文案残留
  验证点：`npx playwright test tests/e2e/loading.spec.ts --project=chromium -g "版本管理"` 绿

#### 默认项设置保存反馈 E2E

**修复**

- 项目下拉受控关闭 + `destroyPopupOnHide=false`，避免设置弹窗被菜单层挡住后卸载
- E2E：默认项设置确定 →「设置成功」；Issue 草稿 11–12
  验证点：`npx playwright test tests/e2e/project-menu.spec.ts --project=chromium` 绿

#### 项目菜单「版本」跳转版本管理

**修复**

- 设计器项目菜单「版本」原只改 shortcut（首页用），设计器内无反馈；改为跳转 `/design/table/version/all`
  验证点：`npx playwright test tests/e2e/project-menu.spec.ts --project=chromium -g "版本"` 绿

#### modulesSlice eslint 清零

**修复**

- `modulesSlice.tsx`：粘贴命名抽出 `nextCopyName` 消 no-loop-func；去未用变量；`storage.tsx` import type；`store/project` warn=0
- ISSUE_DRAFTS `09`–`10`（版本菜单 E2E / 默认项保存反馈）
  验证点：`yarn eslint src/store/project --max-warnings 0`；`empty-projectjson.spec.ts` 绿

#### useProjectStore eslint 清零

**修复**

- `useProjectStore.tsx`：`import type`；`ensureProjectJSON` 不可变补齐；fetch 用局部 id；eslint warn=0
  验证点：`yarn eslint src/store/project/useProjectStore.tsx --max-warnings 0`；`empty-projectjson` + `sync-toast` 绿

#### projectJsonSlice eslint 清零

**修复**

- `projectJsonSlice.tsx`：`import type`、去掉未用变量、`fixModules` 不重赋参数、`diff` 改为纯函数；eslint warn=0
  验证点：`yarn eslint src/store/project/projectJsonSlice.tsx --max-warnings 0`；`empty-projectjson.spec.ts` 绿

#### 默认项设置 E2E + Issue 草稿补池

**新增**

- `project-menu.spec.ts`：项目→设置→默认项设置可开（默认字段/默认配置 tab）；按钮补 aria-label
- ISSUE_DRAFTS `06`–`08`（projectJsonSlice / useProjectStore / modulesSlice eslint）；community 种子池同步
  验证点：`npx playwright test tests/e2e/project-menu.spec.ts --project=chromium` 绿；`DRY_RUN=1 REPO=example/erdonline ./scripts/seed-good-first-issues.sh` 打印 3 条待投放标题

#### ADR-0008 设计器新增数据源落库

**修复**

- `data_sources.id` 扩至 `varchar(64)`：原 `varchar(32)` 无法容纳 RFC4122 UUID（36），`POST /ncnb/dataSources` 截断 500
- 设计器「新增数据源」使用紧凑 32 位 id + 默认名称；`addDbs` 成功后显式 `saveProject` 写入 `defaultDataSourceId`
  验证点：`npx playwright test tests/e2e/adr0008-datasource.spec.ts --project=chromium` 绿

#### 设计器导出入口 E2E

**新增**

- `project-menu.spec.ts`：项目→导出五项可见且「导出DDL」弹窗；导出按钮补 aria-label
  验证点：`npx playwright test tests/e2e/project-menu.spec.ts --project=chromium` 绿

#### 设计器导入入口 E2E

**新增**

- `project-menu.spec.ts`：项目→导入→数据源逆向/PdMan/ERD 弹窗与上传区可见；导入按钮补 aria-label
  验证点：`npx playwright test tests/e2e/project-menu.spec.ts --project=chromium` 绿

#### 设计器项目菜单接线

**修复**

- DesignLayout 挂载「项目」下拉；导入/导出/设置 SubMenu 接上既有 dialog；修复 DefaultSetUp `ProCard` 错误导入导致白屏
  验证点：`npx playwright test tests/e2e/project-menu.spec.ts --project=chromium` 绿

#### entitiesSlice eslint 清零

**修复**

- `entitiesSlice.tsx`：`import type`、删死代码；改名/粘贴/移字段写法消 no-param-reassign；warn=0
  验证点：`yarn eslint src/store/project/entitiesSlice.tsx --max-warnings 0`；`empty-projectjson.spec.ts` 绿

#### 开源品牌去「零代科技」文案

**修复**

- 布局/设置页脚改为 `© 2026 ERD Online · MIT`；ChatSQL「联系人工」改为指向 GitHub 社区
  验证点：`npx playwright test tests/e2e/presence.spec.ts --project=chromium` 绿（无「零代科技」）

#### dataTypeDomainsSlice eslint 清零

**修复**

- `dataTypeDomainsSlice.tsx`：去掉未用 lodash、粘贴重名逻辑抽出 `uniqueWithSuffix`，eslint warn=0
  验证点：`yarn eslint src/store/project/dataTypeDomainsSlice.tsx --max-warnings 0`

#### profileSlice eslint 清零

**修复**

- `profileSlice.tsx`：`import type`、未用参数与 prefer-const / no-param-reassign，eslint warn=0
  验证点：`yarn eslint src/store/project/profileSlice.tsx --max-warnings 0`

#### 已删社交登录路径 E2E

**新增**

- `dead-auth-routes.spec.ts`：`/login/success`、微信绑定页 404；`/auth/oauth2/**` 非 200
  验证点：`npx playwright test tests/e2e/dead-auth-routes.spec.ts --project=chromium` 绿

#### 设计器顶栏仓库链改 GitHub

**修复**

- 设计器顶栏 star 徽章由旧 Gitee 改为 `https://github.com/erdonline/erdonline`
  验证点：`npx playwright test tests/e2e/presence.spec.ts --project=chromium` 绿

#### good-first Issue 草稿与投放脚本

**新增**

- `.github/ISSUE_DRAFTS/`（4 篇）+ `scripts/seed-good-first-issues.sh`；community/roadmap 同步
  验证点：`DRY_RUN=1 REPO=example/erdonline ./scripts/seed-good-first-issues.sh` 打印 4 条标题

#### exportSlice eslint 清零

**修复**

- `exportSlice.tsx`：`import type`、reduce 不可变写法、`const`，该文件 eslint warn=0
  验证点：`yarn eslint src/store/project/exportSlice.tsx --max-warnings 0`

#### 开源版去掉升级至尊 CTA

**修复**

- 设计器顶栏移除「升级至尊版」；删除 `dialog/upgrade`；账号页改为「开源版」文案；首页入口改为「团队项目」
  验证点：`npx playwright test tests/e2e/presence.spec.ts --project=chromium` 绿（断言无「升级至尊版」）

#### 协作 sync warning toast E2E

**新增**

- `sync-toast.spec.ts`：B 阻断自动保存后本地改模型，A 建表 → B 见 warning toast
  验证点：`npx playwright test tests/e2e/sync-toast.spec.ts --project=chromium` 绿

#### databaseDomainsSlice eslint 清零

**修复**

- `databaseDomainsSlice.tsx`：`import type` + 点号访问 `code`，该文件 eslint warn=0
  验证点：`yarn eslint src/store/project/databaseDomainsSlice.tsx --max-warnings 0`

#### 创建项目默认 projectJSON 骨架

**修复**

- `ProjectServiceImpl.ensureDefaultProjectJson`：创建/保存时 null JSON 写入 `modules=[]`
  验证点：`JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Dtest=ProjectEnsureDefaultJsonTest -Djacoco.skip=true surefire:test` 绿；curl 建团队项目无 JSON 后 GET info 含 `modules`

#### 空 projectJSON 可新增模型

**修复**

- 打开项目时 `ensureProjectJSON` 补齐 null/残缺骨架；`addModule` 防 `modules` 未定义误报「已存在」
  验证点：`npx playwright test tests/e2e/empty-projectjson.spec.ts --project=chromium` 绿

#### configJsonSlice eslint 清零

**修复**

- `configJsonSlice.tsx`：`import type`、去掉空 `{}` 类型与未用 `get`，该文件 eslint warn=0
  验证点：`yarn eslint src/store/project/configJsonSlice.tsx --max-warnings 0`

#### 协作 sync toast E2E

**新增**

- `sync-toast.spec.ts`：团队项目双 context（e2e-serial + e2e15），A 建表后 B 见「同步了模型变更」info toast
  验证点：`npx playwright test tests/e2e/sync-toast.spec.ts --project=chromium` 绿

#### presence E2E 清理项目

**修复**

- `presence.spec.ts`：用例前后 `deleteOwnPersonProjects`，避免 e2e 项目堆积
  验证点：`npx playwright test tests/e2e/presence.spec.ts --project=chromium` 绿

#### 登录/注册去 ChatGPT 噱头

**修复**

- 登录/注册副标题与活动区对齐愿景（Git + Figma）；活动 CTA 改「打开演示」→`/demo`，去掉 ChatGPT 营销文案
  验证点：`npx playwright test tests/e2e/smoke.spec.ts -g "登录页渲染" --project=chromium` 绿

#### good-first-issue 运营清单

**新增**

- `docs/community.md`：标签约定、双周节奏、种子任务池；Issue 模板 `good_first_issue.yml`；CONTRIBUTING 入口
  验证点：`cd website && yarn build` 绿（含 community 页）；模板文件存在于 `.github/ISSUE_TEMPLATE/`

#### 文档站本地中文搜索

**新增**

- `website`：`@easyops-cn/docusaurus-search-local`（`language: en,zh`，`docsRouteBasePath: docs`）
  验证点：`cd website && yarn build` 成功；`build` 下存在 `search-index*.json`

#### 文档站死链门禁 + Pages 工作流

**新增**

- `.github/workflows/docs-site.yml`：PR/`main` 构建 `website/`；`main` 部署 GitHub Pages
- docs 外链改为绝对 GitHub URL；Docusaurus `onBrokenLinks=throw`
  验证点：`cd website && yarn build` 无 broken links 成功

#### 文档站骨架 + 复合 FK 延期

**新增**

- `website/`：Docusaurus 3.7 消费 `docs/`（ADR-0003）；**ADR-0011** 复合 `fields[]` 延期（保持字段级多边）
  验证点：`cd website && yarn && yarn build` 成功

#### Oracle 字典级 FK 逆向

**新增**

- Oracle：`ALL_CONSTRAINTS(R)` + `ALL_CONS_COLUMNS` 字典外键（`position` 保序）；失败回退 JDBC；P0 四库字典 FK 齐套
  验证点：`mvn -q -Dtest=ForeignKeyAssociationMapperTest,ReverseDialectRegistryTest -Djacoco.skip=true surefire:test` 绿

#### SQL Server 字典级 FK 逆向

**新增**

- SQL Server：`sys.foreign_keys` / `sys.foreign_key_columns` 字典外键（`constraint_column_id` 保序）；失败回退 JDBC
  验证点：`mvn -q -Dtest=ForeignKeyAssociationMapperTest,ReverseDialectRegistryTest -Djacoco.skip=true surefire:test` 绿

#### PostgreSQL 字典级 FK 逆向

**新增**

- PostgreSQL：`information_schema.key_column_usage` 字典外键（保序，失败回退 JDBC）
  验证点：`mvn -q -Dtest=ForeignKeyAssociationMapperTest,ReverseDialectRegistryTest -Djacoco.skip=true surefire:test` 绿

#### MySQL 字典级 FK 逆向

**新增**

- MySQL/MariaDB：`KEY_COLUMN_USAGE` 字典外键（`ORDINAL_POSITION` 保序）；失败回退 JDBC；`mapFromKeyColumnUsage` 单测覆盖复合列
  验证点：`JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -q -Dtest=ForeignKeyAssociationMapperTest test` 绿

#### Sync 冲突提示 + P2 收口

**新增**

- 收到远端 sync：已保存 → info「同步了模型变更」；本地未保存 → warning 提示核对；patch 失败 → error（3s 节流）
- **ADR-0010**：暗色模式延期；P2 体验深水区标 ✅
  验证点：`npx playwright test tests/e2e/presence.spec.ts --project=chromium` 绿；`verify-socket-sync.mjs` PASS

#### 协作模型增量 sync

**新增**

- `martin:event:sync`：房间广播 `projectJSON` 的 jsondiffpatch delta；设计器防抖发送、远端 patch、timestamp 去重回声
  验证点：`node scripts/verify-socket-sync.mjs` PASS；`presence.spec.ts` 仍绿

#### 协作光标广播

**新增**

- `martin:event:cursor`：房间内广播 flow 坐标；关系图画布叠加远程光标（`collab-cursors`）
  验证点：`node scripts/verify-socket-cursor.mjs` PASS；`presence.spec.ts` 仍绿

#### Presence 断线清名单

**修复**

- Socket 断线/关页后房间名单残留：namespace DisconnectListener 与 leaveRoom 同路径摘名（多标签同用户保活）
  验证点：`node scripts/verify-socket-presence.mjs`（双人进房→一人断线→名单只剩留守者）PASS

#### 协作 Presence 短票

**新增**

- **ADR-0009**：设计器 Presence 接后端 SocketIO `:9092`（`/project/erd`）；`POST /auth/socket-ticket` 短票握手（避免超长 JWT query 断连）
- 顶栏在线名单 `collab-presence`；`socket.io-client@2.5` 对齐 netty-socketio；移除死代码 `frontend/src/socket-io` / `socket.io@4`
  验证点：`node scripts/verify-socket-presence.mjs` PASS；`npx playwright test tests/e2e/presence.spec.ts --project=chromium` 绿

#### 在线 Demo

**新增**

- 免登录 `/demo` → `/s/public-demo`；种子 `db/init/08_public_demo.sql`；登录/注册入口「先看演示」
  验证点：`npx playwright test tests/e2e/demo.spec.ts --project=chromium` 绿；`curl` GET share `public-demo` 200

#### 双周发版笔记

**文档**

- `docs/releases/` + `scripts/cut-release-notes.sh`：从 CHANGELOG Unreleased 生成用户向双周笔记
  验证点：`./scripts/cut-release-notes.sh --dry-run` 有输出；`docs/releases/2026-08-02.md` 存在

#### 分享页 Fork 个人项目

**新增**

- `POST /share/{token}/fork`（需登录）：从分享快照创建个人项目副本（剥离 dbs / defaultDataSourceId）
- 分享页 CTA「复制到我的项目」；未登录跳转 `/login?redirect=/s/:token`；登录支持 redirect
- 注册转化：分享页「注册并带回」→ `/register?redirect=`；登录页「去注册」保留 redirect；注册成功后 `login(..., redirect)`
- 登录/注册回跳带 `?autofork=1`，分享页自动 fork，少点一次
  验证点：`npx playwright test tests/e2e/share.spec.ts --project=chromium` 绿；curl 匿名 fork 401、登录 fork 得 projectId

#### 数据源与 projectJSON 隔离

**变更**

- **ADR-0008**：JDBC 只存 `data_sources` / `/ncnb/dataSources`；`profile.dbs` 不再存连接；项目仅 `defaultDataSourceId`
- 打开/保存项目剥离机密；设计器数据源设置走 API；分享响应清空 `dbs`
  验证点：`ProjectShareSanitizeTest` 绿；`./scripts/audit-fe-apis.sh` 绿；手工：设置数据源后保存项目 JSON 无 password

#### 前后端接口连通性

**修复**

- `GET /ncnb/dataSources` 500：缺表 `erd.data_sources` → 新增 `db/init/07_data_sources.sql` + `@TableName`
- 注册匿名 401：`ignore-urls` 补 `/project/group/user/register`（前缀剥离后）
- `queryHistory`：FE 误用 GET → 统一 POST（与 Controller 一致）
- `updateDatabaseConfigs`：禁止无 id 批量 PUT，改为按 id 增删改
- 探测脚本 `scripts/audit-fe-apis.sh`
  验证点：`./scripts/audit-fe-apis.sh` 全 OK；`GET /ncnb/dataSources?size=10&current=1` 200

#### 只读分享 API

**新增**

- **ADR-0007** + 表 `project_share`；`POST /share/create`、`GET /share/{token}`（匿名）、`POST /share/revoke`
- Security：`/share/**` 放行匿名读
- 匿名响应脱敏 `profile.dbs` 口令；前端 `/s/:token` 只读表清单 + 只读关系图 + 设计器「分享」复制链接
- 分享按钮：clipboard 不可用时降级展示完整链接（避免创建成功却报失败）；E2E `share.spec.ts`（设计器分享→匿名 `/s/:token` 见关系图）
  验证点：登录 create → 匿名 GET `readonly=true` 且 password=`***`；含 associations；`ProjectShareSanitizeTest` 绿；`npx playwright test tests/e2e/share.spec.ts --project=chromium` 绿

### 2026-08-01

#### 开发入口规则

**文档 / 规则**

- 新增 `.cursor/rules/dev-entrypoints.mdc`：后端唯一入口 `./backend/dev-ensure.sh`（tmux `erd-be`）；前端永不重启、HMR/代理/E2E 强制用法
- 同步 `dev-loop-speed.mdc`、`docs/development.md`，废弃「直接跑 dev-restart / kill 9502」旁路
- 本地基建改为 **Colima + docker-compose** 托管 MySQL/Redis；禁止 brew 常驻抢端口；文档给出 `--disk-image` 与国内 registry-mirrors
- 逆向验证栈：`docker-compose --profile reverse`（PostgreSQL / Azure SQL Edge）+ `db/reverse-fixtures` + `scripts/dev-reverse-dbs.sh`
- Vision 5m 循环：`scripts/agent-loop-vision.sh` + `agent-loop-vision.prompt.md`（现场读 roadmap 选题，禁止写死主线）
  验证点：`colima` + `erd-mysql/redis` healthy；MySQL/PG `dbReverseParse` 产出 indexs + associations（已 curl）；旧写死 prompt 循环已停、新脚本 PID 可查

#### 多库逆向 Dialect SPI

**新增**

- **ADR-0006**：多库逆向 Dialect SPI（P0：MySQL/PG/Oracle/SQL Server；Generic JDBC 兜底）
- 包 `com.erdonline.erd.reverse`：`ReverseDialect` / `DialectCapability` / `ReverseDialectRegistry`
- **MysqlReverseDialect**：索引走 `INFORMATION_SCHEMA.STATISTICS`（对齐 DBeaver/jOOQ）；MariaDB 共用
- **PostgresqlReverseDialect**：`listSchemas` + 默认 `public`；索引走 `pg_catalog`（unnest indkey，排除主键）
- **OracleReverseDialect**：schema=用户；索引 `ALL_INDEXES`/`ALL_IND_COLUMNS`（排除主键约束索引）
- **SqlServerReverseDialect**：默认 `dbo`；索引 `sys.indexes`（排除主键与 INCLUDE 列）
- **GenericJdbcReverseDialect**：表/列/PK + `getIndexInfo` 尽力索引
- `DBReverseParseCommand` 改为委托 Dialect；连接在 finally 关闭；支持可选 `schema` 参数
- **`POST /ncnb/connector/dbReverseMeta`**：返回方言能力 + schema 列表；导入向导在 `supportsSchema` 时展示 Schema 选择
- **外键逆向**：`getImportedKeys` → `module.associations`（from=子表/FK，to=父表/PK，relation=`1:n`）；导入时挂到外键侧实体所在模块
  验证点：`ForeignKeyAssociationMapperTest` + Registry/Mapper 单测绿；curl MySQL meta `supportsForeignKey=true`

#### eslint 热路径收尾

**变更**

- 修 `lint:js:ci` 阻断：`entitiesSlice` `Array<T>` → `T[]`
- 清零 `console.log/debug/info`：82 文件约 380 行调试输出；删死代码 `pages/design/test/Test3`
- 保留 `console.warn`/`console.error`（业务错误路径）
  验证点：`yarn lint:js:ci` 通过；`rg 'console\.(log|debug|info)' src` = 0

#### 第 3 轮：Blueprint 清零

**变更**

- **UI 栈统一 antd**：移除 `@blueprintjs/core`/`popover2`/`select`/`docs-theme` 依赖（-4 个包），src 下 0 处引用
- 删除死代码：`pages/test/index.tsx`、`pages/design/test/Test2.tsx`、`FieldMultiSelect.tsx`、`TableObjectList.tsx`（零引用）
- `components/Menu`：Blueprint Menu/Popover2 → antd Menu/Dropdown；`DesignHeader`：Navbar/InputGroup → antd Layout.Header + Input；`ProjectHeader`/`ProjectLeftContent`：简化 antd 化
- 15 个 dialog 的 Blueprint Button trigger（`minimal/small/fill/alignText`）→ antd `type="text" size="small" block`
  验证点：`yarn tsc --noEmit` 0 src 错误；`yarn build` 通过（28s）；15 条核心 E2E（smoke/relation/version/export/ux-audit 等）15/15 全绿

#### 第 0 轮：验证基建

> 目标：建立"一切迭代的前提"——全栈可起、核心旅程有自动化冒烟守护。

**新增**

- **E2E 冒烟测试**（Playwright）：覆盖核心旅程「登录 → 新建项目 → 进入设计器 → 清理删除」，自清理可重复运行（`frontend/tests/e2e/smoke.spec.ts`，`yarn test:e2e`）
- **CI 冒烟门禁**（`.github/workflows/e2e-smoke.yml`）：GitHub Actions 全栈起 mysql/redis/backend/frontend 后执行冒烟，失败禁止合并
- 两个 `test.fixme` 用例标记第 1 轮修复目标：错误凭证无提示、画布删除无二次确认

**修复（冒烟测试抓出的真实 bug）**

- **新克隆无法启动前端**：`yarn start`/`build:prod` 依赖的 `env.local.sh`/`env.sh` 未入库，已补回（生成 `env-config.js`，开发态走同源代理）
- **admin 打开个人项目页 403**：权限种子漏配 admin 角色的 42 个 operation + 9 个 menu（含 `/project/page`），`db/init/03_martin.sql` 追加幂等补全
- **免费版删除项目后永远无法再建**：VIP 项目计数 Redis 缓存只增不减、删除不清除，`ProjectServiceImpl.removeById` 现在删除后清除计数缓存
- **首页统计与项目列表数据不一致**：`/project/statistic` 的 6 个统计 SQL 未过滤 `del_flag`，软删除项目仍被计数（列表显示 0 个、统计却显示 2 个），已全部补上 `del_flag = 0`
  验证点：有软删除数据时 statistic 各计数 = 项目表 del_flag=0 行数（已 curl 验证一致）

**文档**

- 新增 `docs/vision.md`、`docs/roadmap.md`、`docs/design-principles.md`
- 新增 ADR：`0001` ReactFlow 设计器迁移、`0002` 后端升级路径、`0003` Docusaurus 文档站、`0004` MIT 协议
- 新增 Cursor 规则：项目上下文、迭代协议、前端/后端编码红线、文档自动维护

**已知问题（记入第 1 轮急救包）**

- 登录接口用 GET + query 传密码（`?password=` 会进代理/浏览器历史日志）
- 错误凭证登录、表单校验失败、VIP 限额触发等场景前端静默失败，无任何提示
- 点击项目卡片名称无响应，必须点「打开模型」按钮（死 affordance）
- 项目 `create_time`/`creator` 未写入（列表时间为空）
- 登录页存在 `console.log` 调试残留（登录提交打印明文账密！）

#### 第 2 轮（进行中）：质量基线 · Boot 3 + JWT（ADR-0002）

> 目标：直上 Spring Boot 3.5 + JWT Resource Server；删掉无法带走的旧 OAuth/社交死代码。

**认证与栈**

- **Boot 3.5.16 + JDK 17**：`POST /auth/login`（JSON）签发 HS256 JWT；请求头仍 `Authorization: Bearer`
- **删除**：password-grant `/oauth/token`、Redis opaque token、社交登录整包（`common.social`）、SocialDetails CRUD、微信绑定页、`/login/success` 回调路由、模板页 `pages/user/Login`
- **CI**：backend-ci / e2e-smoke / release 统一 Java 17
  验证点：curl 登录拿 JWT → `/ncnb/project/statistic` 200；错误密码 401；`smoke.spec.ts` 3 过 1 跳过；`relation.spec.ts` 绿（2026-08-01）

**fastjson → Jackson（✅）**

- **核心持久化**：`ErdJsonTypeHandler` / `Project` / `JsonBase` 改为 `Map<String,Object>`；Module API `@RequestBody Map`
- **实体对齐**：`DbChange` / `DataDict` 数组字段改 `List`；逆向模型 `@JSONField` → `@JsonPropertyOrder`
- **依赖**：移除 `com.alibaba:fastjson`；统一走 `JsonUtil`（Jackson）
- **单测**：`JsonUtilTest`、`ErdJsonTypeHandlerTest`；`GatewayPrefixStripFilterTest` 改断言 `/auth/login`
  验证点：`mvn test -Dtest=JsonUtilTest,ErdJsonTypeHandlerTest,GatewayPrefixStripFilterTest` 通过；登录后 GET 项目 `projectJSON` 为对象且可进设计器（smoke/relation）

**核心单测 + Jacoco 门禁（✅）**

- **Jacoco**：`pom` 对 JWT / 登录 / 网关前缀 / JsonUtil / ErdJsonTypeHandler 行覆盖率 ≥50%（实测核心包 ~78%）
- **用例**：`AuthLoginControllerTest`、`JwtTokenServiceTest`、`JwtConfigTest`、`AuthEndpointTest`、`TokenServiceTest`；网关前缀补 `/syst` `/ncnb`
- **CI**：`backend-ci` 跑 `mvn test`（含 check）并上传 jacoco 报告；`frontend-ci` Node 20 + `yarn lint:js:ci`（`--quiet`，存量 warn 不挡）
  验证点：本地 `mvn test` BUILD SUCCESS；jacoco check-core 通过；`yarn lint:js:ci` 0 error

**版本快照零摩擦（✅ 北极星）**

- **无 JDBC 也可保存版本**：`SNAPSHOT_DB_KEY` 通道；版本页不再永远 Loading；空态引导文案
- **新增版本**：自动建议下一 semver + 默认描述；去掉 debugger / 明文 console
- **E2E**：`version.spec.ts` 登录→进设计器→版本管理→新增→列表见 `1.0.0`
  验证点：`npx playwright test tests/e2e/version.spec.ts` 通过（2026-08-01）

#### 第 3 轮：版本时光机

> 目标：抬升「每周有版本保存」——看得见模型变更，不只是存了个号。

**版本 diff 可视化（✅）**

- **模型变更面板**：`VersionDiffPanel` 按表分组，新增绿 / 删除红 / 修改黄；摘要 Tag
- **详情弹窗**：替换纯文本列表 + 去掉 MUI Grid；`CompareVersion` 左右分栏（可视化 + DDL）
- **列表行摘要**：版本行展示 `+N/-N/~N` 变更计数
- **首版增量**：无历史时 `calcChanges` 相对空模型计算（详情可见新建表/字段）
- **清理**：`showChanges` 去掉 `debugger`
  验证点：`npx playwright test tests/e2e/version.spec.ts` 通过（含详情 diff + 双版比对）

**工单/审批打磨（✅）**

- **操作反馈**：通过/拒绝/撤销/复批/发起审批成功有 message，失败不关窗、不静默
- **文案**：审批页 `headerTitle` 由错误的「我的工单」改为「我的审批」；空态引导
- **可达**：拒绝后也可「复批」；创建审批默认 `approveStatus=0`
- **比对入口**：不足两版时「版本比对」禁用
  验证点：`approval.spec.ts` 表头/空态；`version.spec.ts` 单版禁用比对、双版比对出 REMARK

**版本回滚 + 删表确认（✅）**

- **回滚**：无快照时 `message.error`；去掉 debug console；`data-testid=version-revert-btn`
- **删表确认 E2E**：模型树「…→删除表」出现确认框，取消不删（替换原 g6 canvas fixme）
  验证点：`version.spec` 回滚后 REMARK 消失；`smoke`「模型树删除表需二次确认」通过

**新手 30s：首页示例项目（✅）**

- **快速操作去死链**：指向真实路由（个人/最近项目等）
- **一键示例**：`createExampleProjectAndOpen` 创建含用户/订单+关联的模型并进设计器
- **E2E**：`activation.spec.ts` 首页点示例 → 关系图见 2 节点 1 边
  验证点：`npx playwright test tests/e2e/activation.spec.ts` 通过

**设计器自动保存状态可见（✅）**

- 画布工具栏 `save-status`：保存中 / 已保存 / 未保存；防抖 600ms；失败有 message
- 首次拉取项目不触发无意义保存
  验证点：`relation.spec` 建表后 `save-status` 为「已保存」

**开源版取消项目数限制（✅）**

- `PersonProjectCountRight` / `GroupProjectCountRight`：`valid()` 恒 true，个人/团队项目不限个数
- E2E：可连续创建 2 个个人项目
  验证点：curl 连建 2 个项目均 200；`activation.spec`「可连续创建多个个人项目」

**项目激活链路打磨（✅）**

- **个人项目空态引导**：无项目时展示「立即创建 / 一键示例」双入口（`project/person` Empty）
- **新建表单减负**：默认个人项目 + 默认标签，必填只剩项目名/描述；创建成功/失败均有 message 反馈（不再静默）
- **E2E**：`project-activation.spec.ts` 空态一键示例进设计器见 T_USER/T_ORDER；表单默认值 + 创建反馈
  验证点：`npx playwright test` 全量 14/14 通过

**后端生命周期托管（✅ 开发基建）**

- 新增 `backend/dev-ensure.sh`：幂等保证后端常驻 tmux 会话 `erd-be`（`--restart` 重启 / `--logs` 看日志）
- 新增规则 `.cursor/rules/backend-lifecycle.mdc`：禁止模型直接启动 java，唯一入口 dev-ensure.sh
- 根因：IDE/agent shell 会话结束会杀子进程，nohup 后台化被误杀导致反复重启
  验证点：脚本首跑拉起 → 二跑秒退（幂等）→ curl /login 返回 token

**E2E 多 worker 并发（✅ 开发基建）**

- `playwright.config.ts`：`fullyParallel` + 本地最多 4 worker（`PW_WORKERS` 可覆盖；CI 默认 2）
- 并发隔离：项目名 `e2e-w{n}-` 前缀，`deleteOwnPersonProjects` 只清本 worker
- 空态/示例用例：`chromium-serial`（依赖并行项目跑完）+ `withExclusiveAccount` 文件锁
  验证点：`npx playwright test` → `Running 14 tests using 4 workers`，14 passed（~2.6m）

**画布视口裁剪 + E2E 定位纪律（✅）**

- 规则：`.cursor/rules/e2e-locators.mdc`（role 优先，testid 兜底）
- 设计器关键入口补 `data-testid` / `aria-label`（新增模型、关系图、空态建表、打开模型）
- 节点≥24 开启 `onlyRenderVisibleElements`；TableNode `React.memo`；E2E `canvas-scale.spec.ts`
  验证点：`canvas-scale.spec` 绿（~15s）；`relation.spec` 回归绿

**E2E 全量按定位纪律改写（🚧）**

- `helpers`：建项/开关系图/toast/内联字段/连线；specs 去掉 `.ant-modal` / `.ant-tree [class*=title]` / xpath
- 产品侧：`version-row-{ver}`、`tree-node-menu`、命令面板 `cmd-palette-input` / `role=option`
  验证点：`npx playwright test` 全量绿

**去掉 VIP 限额 + E2E 多账号（✅）**

- `VIPRightsAspect` 开源放行（人数/项目数/AI 等不再拦截）；登录路径去掉 `@VIP`
- 种子 `db/init/05_e2e_users.sql`：`e2e0`..`e2e15` + `e2e-serial`（密码 `123456`，admin 角色）
- Playwright 本地 worker 上限 16；serial 用 `e2e-serial`
- 防漏洞：`erd.security.e2e-accounts-enabled` 仅 `dev` 为 true；`prod`/默认拒绝 e2e 种子登录
- 文档：`docs/security-model.md`、deployment 生产清理说明
  验证点：`curl` e2e0/e2e-serial JWT；`npx playwright test` 绿

**性能预算基线（✅）**

- 新增 `docs/performance-budget.md`：dist ≤20MB、冒烟 ≤30s、relation ≤60s；热路径禁止 console
- 本机基线：dist ~14MB；冒烟 ~10.4s；relation ~26s
  验证点：文档指标表与 `du -sh frontend/dist` / smoke 耗时可对照

**性能：设计器热路径去掉 console.log（✅ eslint 清债切片）**

- `useProjectStore` immer/`set` 中间件与 fetch/socket 调试日志删除（原先每次模型变更都刷屏）
- `DesignLayout` 渲染路径调试日志删除
- 全仓 `no-console` warn：约 407 → 375
  验证点：`yarn eslint` 上述两文件 0×no-console；`relation.spec` 仍绿

**修：连线后改字段名边消失（✅）**

- 根因：association 仍在，但字段 Handle 动态变更后未 `updateNodeInternals`，RF 不渲染边
- 修复：TableNode 字段签名变化时刷新锚点；边列表改由 associations 派生；改名同步加强（同长按下标）
- E2E：`relation.spec`「先连线再改名」断言边仍在
  验证点：`npx playwright test tests/e2e/relation.spec.ts` 通过

**迭代协议：验完自动续跑**

- `.cursor/rules/iteration-protocol.mdc`：commit 后立刻开下一切片，不等「继续」

**UI 收敛：清除 MUI（✅；Blueprint 另议）**

- CRUD 对话框内全部 `@mui/material` / `@mui/icons-material` 替换为 antd（Divider/Button/Row/Col/InboxOutlined）
- 从 `package.json` 移除 `@mui/*` 与仅为其服务的直连 `@emotion/*`
- Blueprint 菜单/工具栏残留记后续切片（设计器侧栏触发器暂保留）
  验证点：`rg '@mui/' frontend/src` 零命中；`yarn lint:js:ci` 过；`version.spec`/`export.spec` 绿（diff 用例偶发已复跑通过）

**设计系统：全局加载骨架（✅ 加载半完成；暗色另议）**

- 新增 `PageSkeleton`；进设计器 `projectLoading` 时内容区骨架，禁止白屏
- 个人/团队/最近项目列表请求中 `ProList loading`，禁止空态闪一下
- 版本页裸 `Loading...`、账号设置空 `<Spin>` → `PageSkeleton`
- DesignLayout 主色对齐品牌红 `#DE2910`（原错误蓝 `#1890ff`）
- 暗色：ADR-0005 写明 CRUD 不换肤，本切片不做 toggle
  验证点：`loading.spec.ts` 2/2；连带依赖跑全量 chromium 14/14 绿（含 smoke/project-activation）

**缩短建表链路（✅）**

- **修 bug**：`addEntity` 曾强制 `fields: []` 冲掉默认字段；现未传/空数组时注入项目默认字段（含主键）
- **建表即见结构**：画布空态「新建第一张表」带默认主键；树/弹窗建表后自动打开关系图
- **减负**：新建表中文名改为可选；字段行 `data-field` 便于定位
- **稳健性**：内联编辑 Enter+blur 防双提交；删边时若字段已改名则不误清关联
  验证点：`relation.spec` 空态建表节点含 id/主键；全量 playwright 14/14

#### 第 2 轮（进行中）：ReactFlow 迁移（ADR-0001）

> 目标：用现代画布重建核心建模体验，根治「实体上不了画布」断裂。

**R3 默认切换（2026-08-01 ✅）**

- **关系图唯一实现**：`relation/index.tsx` 重导出 ReactFlow；删除 `g6.js` / Contex / ModalWrapper / RelationEdit 等旧接线
- **入口统一**：设计器标签经 `pages/design/relation` 进入新画布
- **导出去 G6**：`relation2file.saveImage` 改为 DOM 卡片 + SVG 连线 + html2canvas；`document.ejs` / `config.ts` 移除 g6 全局脚本
  验证点：`export.spec.ts` 设计器「导出 Markdown」成功下载 `.md`；`relation.spec.ts` 仍绿

**R0 探针（2026-08-01 ✅）**

- **ReactFlow 只读画布上线**：`relation/ReactFlowRelation.tsx` + `reactflow-relation.scss`，替换设计器「关系图」标签（旧 g6 文件保留未接线，R3 删除）
- **实体即节点（核心设计约束落地）**：`module.entities` 全集即画布节点，**建表即上图**（画布开着建表，节点即时出现，E2E 实证）；`graphCanvas` 只用于复用旧坐标，无坐标节点网格自动布局
- **字段级 Handle**：每字段行左 target/右 source 连接点（悬停可见），为 R1 字段锚点连线铺路；`associations` → 边映射已接线
- **节点卡片**：表头（名+中文名）+ 字段行（PK 徽标/类型/中文名），选中高亮
- **修复画布高度塌陷**：antd Tabs 内容区 auto 高度致 `height:100%` 链塌为 0（空态画布不可见），改显式 `calc(100vh - 104px)`
- 依赖：新增 `reactflow@11.11.4`
- 测试：新增 `tests/e2e/relation.spec.ts`（实体即节点不变量 + finally 清理防配额泄漏），全量 5 通过 1 跳过
- 走查存档：`test-results/ux-walkthrough/r0-reactflow-canvas.png`

**R1 功能对等·第一批（2026-08-01 ✅）**

- **节点拖动 + 位置持久化**：`onNodeDragStop` → `updateGraphCanvasLayout`（graphCanvas 只存布局），store 订阅自动落库；重载后坐标精确保持（E2E 断言画布 transform）
- **字段拖连线建关联**：字段行左 target/右 source 手柄，`onConnect` → `addAssociation`（去重），边删除（Delete 键）→ `removeAssociation`；curl 实证 `{from:{T_B.A_ID}, to:{T_A.ID}}` 落库与清除
- **节点删除守卫**：画布 Delete 不删表（实体即节点，删节点=删表属破坏性）——拦截 + 提示走模型树，E2E 断言
- **走查抓出并修复两个真 bug**：① 节点 `overflow:hidden` 把半探出的字段手柄埋住不可点（连线不可能）；② 节点点击不选中——重建节点时未保留 `selected` 交互态
- ADR-0005 落定 UI 架构：antd 守 CRUD、设计器域自研、暂缓 Tailwind

**R2 超越·第一批（2026-08-01 ✅）**

- **节点即编辑器**：字段增/改/删全部画布内联（`+ 添加字段` / 双击改名改类型 / × 删字段），告别「双击开标签 + handsontable」4 步链路
- **空态可操作引导**：0 表时「+ 新建第一张表」CTA（非静态插图），创建即上图
- **dagre 自动布局**：画布右上角一键分层排布（LR），布局即持久化
- **字段改名/删除同步 associations**：改名后边锚点跟随；删字段清除悬空关联；去掉字段更新 success toast（UI 即反馈，避免淹没守卫提示）
- **手柄可点性**：常显弱可见 + 扩大热区 + overflow visible（连线命中率）
- **画布 undo/redo**：模块 JSON 快照栈（`canvasHistory.ts`），覆盖字段/关联/布局/建表；Cmd/Ctrl+Z · Shift+Z + 工具条按钮；项目加载时重置
- **表头内联改名**：✎ 按钮 / 双击表头；`renameEntity` 同步 associations 与 graphCanvas 节点 id
- **PK 一键切换**：字段行 PK 徽标可点；新建 `IdOrKey` 字段默认主键
- **命令面板 Cmd/Ctrl+K**：建表 / 自动布局 / 左齐 / 顶齐 / 撤销 / 重做；工具条「命令」入口；Esc / 筛选 / ↑↓ Enter
  验证点：`relation.spec.ts` Cmd+K → 搜「新建」→ 执行 → 节点数 +1（已通过）
- **多选对齐**：Shift+点击 / 左键框选（`selectionOnDrag`）；≥2 选中时工具条显示左/右/顶/底/水平中/垂直中；布局即持久化
  验证点：`relation.spec.ts` Shift 多选两表 → 左齐 → transform x 相同（已通过）
- **E2E 全旅程**：`relation.spec.ts` 覆盖空态→建表→内联字段→连线→改字段名跟边→删边→删除守卫→拖动持久化→自动布局→撤销→多选对齐→命令面板建表

#### 第 1 轮：交互急救包 + P0 安全

> 目标：消灭静默失败与高危残留；建立秒级开发验证回路。

**修复（第 0 轮登记的已知问题，逐条核销）**

- **静默失败 → 统一错误反馈**（`utils/request.js`）：重写 `errorHandler`——401 区分登录接口（提示后端业务文案，不跳转）与登录态失效（提示+跳登录）；补 500 处理盲区；透传 `msg`/`message`/`error_description`；网络层失败提示「网络异常」。响应拦截器跳过非 2xx（修同一条错误弹两次）。验证点：E2E「错误凭证登录出现明确错误提示」含**仅弹一次**断言，已通过
- **登录页打印明文账密**：`pages/login/index.tsx` 删除 `console.log(29, values)`；`.eslintrc.js` 新增 `no-console` 规则防新增（存量 488 处记 P2 批量清除）。验证点：E2E 登录流程 console 无账密输出
- **项目卡片死 affordance**：个人/团队/最近/数据模型 4 个列表页的项目名全部可点击直达设计器（`dataModels` 页原有 `<a>` 无事件也已接线）。验证点：E2E 冒烟主旅程通过；手工点击卡片名跳转正常
- **`create_time`/`creator` 未写入**：根因=双数据源手动建 `SqlSessionFactory` 时 `GlobalConfig` 未挂 `MetaObjectHandler`（MP 自动配置被 exclude），两个数据源全部填充失效。已挂接。验证点：curl 建项目 → 库中 `creator=admin`、`create_time` 非空，且**接口返回 id 与库中一致**（同根因顺带修 `BeanUtil.copyProperties` null 覆盖抹掉 id 的隐患）
- **画布删除无确认**：g6 右键删除表/连接线接线 `Modal.confirm`（红按钮、提示可撤销）。同时补 `Modal` 导入（`Modal.error` 两处调用原为 ReferenceError 隐患）。验证点：代码审查通过；自动化待 ReactFlow 迁移（canvas 无 DOM 节点），见检查单手工项
- **画布撤销/重做快捷键**：Cmd/Ctrl+Z 撤销、Cmd/Ctrl+Shift+Z 重做（输入框内不拦截）

**新增**

- **秒级后端验证回路**：`backend/dev-restart.sh`——`mvn compile -o` + 直接 `java -cp` 启动，全流程 ~20s（原 `mvn spring-boot:run` 冷启动 3-4 分钟）
- **SocketIO 端口泄漏修复**：`socketIOServer` Bean 加 `destroyMethod="stop"`，上下文关闭释放 9092（原来每次重启必 BindException）
- `.cursor/rules/dev-loop-speed.mdc`：服务常驻/热加载/增量验证/环境一次到位纪律

**技术决策记录（为什么不用 spring-boot-devtools）**

试装 devtools 后发现致命冲突：`RedisTokenStore` 用 JDK 序列化存 `Authentication`（内含本项目 `MartinUser`），`ObjectInputStream` 按调用栈把类解析到基础类加载器，而 devtools 业务代码在 `RestartClassLoader`——同名类双加载器，**所有登录态请求必报 ClassCastException**，且 `restart.exclude` 不支持按包排除目录类。已卸载，改用 `dev-restart.sh` 方案。TCCL 过滤器方案已实证无效（`latestUserDefinedLoader` 不读 TCCL）。

**新发现问题（登记待办）**

- 存量 488 处 `console.log`（P2，配合 `no-console` 规则批量清除）

**追加修复（2026-08-01 下午，走查驱动）**

- **[P0] 关系图入口缺失（核心功能不可达）**：`getModuleEntityTree` 仅 `groupByType=false` 扁平模式返回「关系图」叶子，而界面恒用文件夹模式 → 画布无任何入口。已在「关系」文件夹置顶「关系图」入口（`modulesSlice.tsx`），浏览器实证画布打开渲染（3 canvas 元素）
- **[P0 登记] 实体永远无法上图（旧画布建模回路全断）**：前端无任何拖拽源（树节点 draggable=false）+ `addEntity` 不写 `graphCanvas` → 新建实体上不了画布。**决策：不修补 g6**，ReactFlow 轮根治——实体即节点、`graphCanvas` 只存布局（ADR-0001 补充决策已写入）
- **[安全] CORS 收敛**：`CorsConfig` 通配 origin → 默认仅 localhost:8000/127.0.0.1:8000，其他来源 `CORS_ALLOWED_ORIGINS` 显式声明（Bearer token 认证不受收紧影响）；删除 `GatewayPrefixStripFilter` 预检短路（回显任意 Origin + `Allow-Credentials:true` 的潜在漏洞，且已被 CorsFilter 覆盖的死代码）
- **[安全] 生产凭证 fail-fast**：`application.yml` 弱默认值（martin/erd/minio123）原会随 prod profile 泄漏上线；`application-prod.yml` 重新声明 DB/OSS 凭证为无默认值环境变量，缺失即启动失败
- **[语义修正] /oauth/token 500→401**：`MartinOauthResponseExceptionTranslator`——StatefulException 9404xxx 业务码（查无此用户等）与 InvalidGrantException（密码错误）由 500 改 401；前端 errorHandler 同步透传后端业务文案。curl + E2E 双验证
- **[文档] CSRF 关闭合理性**：`WebSecurityConfigurer` 补注释——Bearer token 无 Cookie 会话，CSRF 可安全关闭；引入 Cookie 时必须恢复

**UX 走查机制（playwright-ux-audit 规则首轮运转）**

- 新增 `.cursor/rules/playwright-ux-audit.mdc`：页面级改动必须 Playwright 真实旅程走查；摩擦分类判据表（静默失败/死 affordance/重复反馈/多余步骤/空态/破坏无确认/文案不清）；P0/P1/P2 分级处理
- 新增 `tests/e2e/ux-audit.spec.ts`：UX 不变量断言（卡片标题真链接可键盘聚焦、标题直达设计器、全旅程 console 无账密）+ 6 张全旅程截图存档
- **首轮走查即抓出真问题**：卡片标题 `<a onClick>` 无 href 是"假链接"（无 link role、键盘不可达），已修为带 href 的真链接（4 个页面）
- 走查新发现（P2 登记）：设计器 0 表空态为静态插图无操作引导；建表到看图需 4 步
