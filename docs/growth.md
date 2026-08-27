# 增长方案（引流与内容推广）

:::caution 维护者文档
本文**不在**文档站默认侧栏。面向运营与内容流水线；终端用户请看 [使用指南](/docs/guide/what-is-erd-online) 与文档站 [指南索引](https://doc.erdonline.com/blog/)。
:::

> 对齐北极星：**每周产生版本保存的活跃建模项目数**。所有内容按同一漏斗设计，虚荣指标（star/阅读数）只看不优化。
> 本文是结论与执行口径；写文章走流水线：[`content/articles/`](https://github.com/erdonline/erdonline/tree/main/content/articles)。

## 目标漏斗

```
曝光（文章/社区帖/搜索）
  → 点击 demo 链接（带 UTM，文案必写「30 秒免注册」）
    → demo 内激活：改一张表 → 保存版本 → 看一次 diff
      → fork 到我的项目 / 注册
        → 每周版本保存（北极星：非空 diff 的版本保存数）
```

纪律：**画图/版本类文章 CTA 永远只有一个主链接 = demo**。MCP 操作帖例外：主 CTA = 文档 MCP 页（Demo 是只读分享，铸不了 PAT）。GitHub star 只放文末次要位置。任何一篇阅读高但主 CTA 点击率低于 1.5%，先改 CTA 位置与文案，而不是写新文章。

## 渠道优先级（ROI 排序）

**立刻做（2026-08-28 证据改写）**：MCP 产品漏斗已收口。EN 种子 PR：[punkpeye/awesome-mcp-servers#13035](https://github.com/punkpeye/awesome-mcp-servers/pull/13035)（已按 bot 补 Glama badge；Dockerfile/`glama.json` 已入库）。HelloGitHub [issue #3605](https://github.com/521xueweihan/HelloGitHub/issues/3605) 维护者沉默。官方 MCP Registry **📋**。**登录墙仍挡住**阮一峰 / V2EX / 知乎 / 掘金 / 思否。不发小红书；不发 npm；不请求 GSC。H1 仍 Git + Figma。

**暂缓（有前置条件）**：Show HN / Reddit / dev.to —— 等 demo 与落地页英文体验完整（i18n 在 P3），EN 用户撞中文 demo = 转化率塌方，宁可晚发不可烂发；B 站 —— 等有视觉性强的里程碑再录 1 条 3 分钟演示。

**不做**：付费投放、抖音、自建公众号矩阵、ChatSQL /「一句话生成 ERD」噱头、刷量、把 12 篇旧稿再群发一遍。小红书**不是**受众错配——已有 15 条笔记；AI 邻接标题是当前最高阅读，续做**具体操作帖**，不改品牌 H1。

**CN vs EN 判断**：中文「ER 图工具/数据库建模工具」搜索是真空（无像样横评文），抢增量；英文侧 dbdiagram/DrawDB 已霸屏，只埋种子（awesome list PR、README.en-US 质量），等 i18n 完整再 Show HN。

## 文章选题包（按发布序；#13 起为 MCP 楔子续篇）

| # | 标题（暂定） | 角度 | slug（稿件） | CTA | 指南页（docs 蒸馏） | 状态 |
|---|---|---|---|---|---|---|
| 1 | 数据库设计的 Git + Figma：我们把版本管理和实时协作塞进了 ER 建模 | 品牌宣言，定位与生态位空白 | `git-figma-for-database-design` | demo | [`guide/what-is-erd-online`](/docs/guide/what-is-erd-online) | ✅ ready |
| 2 | 还在用 drawio 画 ER 图？它根本不知道什么是外键 | 通用画图 vs 懂数据库语义 | `drawio-doesnt-know-fk` | demo | blog + [/compare](https://www.erdonline.com/compare)（不进手册正文） | ✅ ready（含 v2ex.txt） |
| 3 | 数据库表结构改崩了谁背锅？给建模加上 Git 式版本 diff | 版本叙事最强卖点，事故开场 | `git-style-version-diff` | demo | [`guide/save-version-and-diff`](/docs/guide/save-version-and-diff) | ✅ ready |
| 4 | 从 dbdiagram 搬家只要 5 分钟：DBML 导入 + 自托管指南 | 迁移收割，抢竞品用户 | `from-dbdiagram-in-5-min` | demo | [`guide/import-dbml`](/docs/guide/import-dbml) | ✅ ready |
| 5 | MySQL/Oracle/PG/SQLServer 存量库一键逆向成关系图 | 逆向工程深度，存量库刚需 | `reverse-engineer-four-dbs` | demo | [`guide/reverse-engineer`](/docs/guide/reverse-engineer) | ✅ ready |
| 6 | 让 AI Agent 读懂你的数据库设计：开放 projectJSON + MCP | AI 平台叙事（只讲开放可审计） | `projectjson-mcp-for-agents` | docs | [`guide/api-and-mcp`](/docs/guide/api-and-mcp) | ✅ ready（XHS 2026-08-28 阅读最高） |
| 13 | Cursor 连上 MCP：读一张图，提交一版建议 | #6 的操作续篇；30 秒 copy-paste | `cursor-mcp-read-and-suggest-version` | mcp | [`guide/api-and-mcp`](/docs/guide/api-and-mcp) | ✅ ready |
| 14 | CI 里用 REST 拉 projectJSON 做 schema lint：不必绑死 MCP | 流水线走 curl + ajv，不是再装一个 MCP | `ci-rest-projectjson-schema-lint` | mcp | [`data-format`](/docs/data-format) | ✅ ready |
| 15 | Cursor 读得懂你的 ER 图，draw.io 连外键都不认识 | 两周评审：GSC 仍是 draw-ER；用 dunk + demo CTA 抢点击 | `cursor-reads-erd-drawio-cannot` | demo | [`guide/what-is-erd-online`](/docs/guide/what-is-erd-online) | ✅ ready |
| 16 | 搜 make ERD online 时，别再打开又一个画框图 | GSC make/create/maker 查询；demo 主 CTA + compare 次链 | `make-create-erd-online` | demo | [`guide/what-is-erd-online`](/docs/guide/what-is-erd-online) | ✅ ready |
| 7 | docker-compose 一键部署的 MIT 开源数据库建模平台 | 自部署 SEO 文 | `docker-compose-mit-modeler` | deploy | [`guide/quick-self-host`](/docs/guide/quick-self-host) | ✅ ready |
| 8 | 团队建模怎么管权限？三级角色 + 审批流落地实录 | 团队场景，打单机工具痛点 | `team-roles-approval-flow` | demo | [`guide/roles-and-approval`](/docs/guide/roles-and-approval) | ✅ ready |
| 9 | 2026 年 8 款 ER 图/数据库设计工具诚实横评 | SEO 长尾；对照必须诚实 | `honest-er-tools-compare-2026` | compare | blog + [/compare](https://www.erdonline.com/compare)（不进手册正文） | ✅ ready（含思否） |
| 10 | 30 秒免注册：打开这个链接，改一张表，存一个版本 | 纯 demo 体验帖，图多字少 | `thirty-seconds-demo-version` | demo | [`guide/save-version-and-diff`](/docs/guide/save-version-and-diff) | ✅ ready（含 v2ex.txt） |
| 11 | 从 G6 到 ReactFlow：画布 Strangler 迁移实录 | 技术深度，服务贡献者漏斗 | `g6-to-reactflow-strangler` | repo | [`community`](./community.md)（贡献者） | ✅ ready |
| 12 | 我们怎么设计 good first issue：让第一个 PR 两小时内合入 | 贡献者招募 | `good-first-issue-two-hours` | repo | [`community`](./community.md)（贡献者） | ✅ ready |

纪律：增长长文**不整篇**进手册；可蒸馏任务写成 `docs/guide/*` How-to。索引见文档站 [Blog](https://doc.erdonline.com/blog/)。

**发布包**：`node scripts/growth/build-package.mjs --all` → `content/dist/<slug>/`。  
**Wechatsync 默认同步平台**：掘金 / CSDN / 开源中国 / 小红书 / 微信 / 知乎 / 思否；V2EX 用各篇 `v2ex.txt` 人工发。  
**点发布仍是人工**：草稿箱核对 UTM / 封面后再发。  
**同步结果台账**：[content/articles/publish-status-2026-08-09.md](https://github.com/erdonline/erdonline/blob/main/content/articles/publish-status-2026-08-09.md)（成功/失败 URL；JSON 同目录）。

## 度量（4 周后怎样算有效）

| 层 | 工具 | 指标 | 有效判据 |
|---|---|---|---|
| 曝光 | 各平台后台 | 阅读/点赞 | 掘金单篇 >2k 阅读 |
| 点击 | Baidu Tongji / CF Web Analytics | UTM referrer、demo UV | demo UV ≥2 倍基线，referrer 可追溯 |
| 激活 | Baidu 事件/页面路径 | demo → 版本保存到达率 | demo 访客 → 版本保存 ≥10% |
| 转化 | 后端注册数据 | 周注册数 | ≥2 倍基线 |
| 北极星 | 业务库统计 | 每周非空 diff 版本保存数 | 连续两周环比上升 |
| 虚荣/滞后 | GitHub Insights | stars、traffic referrer | 只看不优化；referrer 用于验证哪篇真带量 |

UTM 规范：`?utm_source=<平台>&utm_medium=article&utm_campaign=<战役>&utm_content=<slug>`，由 `scripts/growth/lib/utm.mjs` 统一生成，文章里不手写裸链接。

## 发布流水线（自动化边界）

- **自动化**：选题模板、frontmatter 规范、UTM 注入、平台包生成（`new-article.mjs` / `build-package.mjs`）、PR 打 `growth-publish` 标签后 CI 出 artifact。
- **半自动（Wechatsync）**：经 [文章同步助手 Wechatsync](https://github.com/wechatsync/Wechatsync) 把 `content/dist/<slug>/` 各平台 `.md` **推到草稿箱**（掘金/知乎/思否/开源中国/公众号等）；扩展在浏览器内用你已登录的会话调平台 Web API，**不做 cookie 抓取脚本**；默认草稿，发布前仍人审。
- **人工**：V2EX 纯文本帖、评论区答疑、数据回填、草稿箱点「发布」。

### Wechatsync 接入（Phase 2 已落地）

用户口中的 **WebChatSync** 即开源项目 **Wechatsync（文章同步助手）**：Chrome 扩展 + `@wechatsync/cli`，经 WebSocket 把 Markdown 同步到 29+ 平台草稿箱。

**一次性准备**

1. 安装 [Chrome 扩展](https://www.wechatsync.com/#install)；在浏览器登录掘金/知乎等目标账号。
2. 扩展设置 → 开启 **MCP 连接** → 复制 Token → 写入根目录 `.env`：`WECHATSYNC_TOKEN=<token>`（见 `.env.example`）。
3. 安装 pinned CLI（上游 `@wechatsync/cli@1.1.0` 在 Node 20 需锁 CJS 依赖）：
   ```bash
   cd scripts/growth && npm install
   ```

**发一篇（ready 状态）**

```bash
# 1. 打包（UTM 已按平台注入）
node scripts/growth/build-package.mjs git-style-version-diff

# 2. 预览（不需扩展连接）
node scripts/growth/sync-wechatsync.mjs git-style-version-diff --dry-run

# 3. 实同步到草稿箱（扩展须在线 + Token 一致）
export WECHATSYNC_TOKEN=...   # 或 source .env
node scripts/growth/sync-wechatsync.mjs git-style-version-diff

# 可选：检查各平台登录态
node scripts/growth/sync-wechatsync.mjs --check-auth
```

**纪律**

- 每平台单独 sync 对应 `juejin.md` / `zhihu.md` …，保证 `utm_source=<平台>` 正确；`v2ex` 仍走 `v2ex.txt` 人工帖。
- CI **不**跑 Wechatsync（需本机 Chrome 登录态）；artifact 下载后在本机执行 sync。
- 远程开发机：扩展开「同步桥接」连 `ws://<host>:9527`，Token 与服务器一致（见 [CLI README](https://github.com/wechatsync/Wechatsync/tree/v2/packages/cli#%E8%BF%9C%E7%A8%8B%E6%A1%A5%E6%8E%A5)）；生产环境建议 SSH 隧道。

**与旧口径的关系**：仍不做无扩展的 cookie/Playwright 发帖；Wechatsync 是用户显式安装的扩展 + 官方 Web API 草稿同步。

### Cursor / Claude MCP（可选）

Wechatsync 提供 **MCP Server**（`packages/mcp-server`，**未单独发 npm**），与 `@wechatsync/cli` 共用同一 WebSocket 桥：

```
Cursor / Claude  ←stdio→  MCP Server (Node)  ←ws:9527→  Chrome 扩展  →  各平台草稿 API
growth CLI       ←同上 WS 桥，WECHATSYNC_TOKEN 与扩展 Token 一致→
```

**一次性准备**

1. 扩展侧同上：开启 **MCP 连接**，Token 写入根目录 `.env` 的 `WECHATSYNC_TOKEN=<token>`（勿提交仓库）。
2. 构建 MCP Server（本机路径示例，可换任意目录）：
   ```bash
   git clone --depth 1 -b v2 https://github.com/wechatsync/Wechatsync.git ~/.local/share/wechatsync-mcp
   cd ~/.local/share/wechatsync-mcp && pnpm install && pnpm build:mcp
   ```
3. 在 **用户级** Cursor MCP 配置（`~/.cursor/mcp.json`，不进 git）增加：
   ```json
   {
     "mcpServers": {
       "wechatsync": {
         "command": "node",
         "args": ["/path/to/Wechatsync/packages/mcp-server/dist/index.js"],
         "env": {
           "MCP_TOKEN": "<与扩展相同的 token>",
           "SYNC_WS_PORT": "9527"
         }
       }
     }
   }
   ```
   `MCP_TOKEN` 必须与扩展里设置的 Token **完全一致**（growth CLI 读 `WECHATSYNC_TOKEN`，语义相同）。

**MCP 工具（Agent 可直接调用）**

| 工具 | 用途 |
|---|---|
| `list_platforms` | 列出平台及登录态 |
| `check_auth` | 检查指定平台是否已登录 |
| `sync_article` | 同步 Markdown 到平台草稿箱 |
| `extract_article` | 从当前浏览器页提取文章 |
| `upload_image_file` | 上传本地图片到图床 |

**日常**：Chrome 保持打开且扩展已连接；改 MCP/CLI 配置后重载 Cursor MCP。远程开发见 [MCP Server README](https://github.com/wechatsync/Wechatsync/tree/v2/packages/mcp-server#%E8%BF%9C%E7%A8%8B%E6%A1%A5%E6%8E%A5)（扩展开「同步桥接」连 `ws://<host>:9527`）。

## MCP / Agent 两周猛攻（2026-08-28 → 2026-09-10）

> 证据：小红书 15 条笔记里，**开放 projectJSON + MCP 给 Agent** 阅读最高（51）；draw.io 对比 41；诚实横评 14。GSC www 查询仍是 draw/create/make ER diagram，2 点击 / 103 展示。因此：**中文增长楔子 = MCP 可演示**；www SERP title **保持** draw-ERD；H1 **不改** Git + Figma；不做 ChatSQL。

近端指标：落地页 → demo / 注册、GSC CTR、小红书阅读。北极星仍是每周非空 diff 版本保存。

| 切片 | 日 | 结果 | 文件 | 验证 |
|---|---|---|---|---|
| **1** 今晚 | 08-28 | 文档 MCP 页变成 30 秒 copy-paste；SERP title/description 对准 agent/MCP；落地页开放支柱补一句 + 链到文档（非 H1）；稿 #13 掘金+小红书 | `docs/guide/api-and-mcp.md`（中/英）、`frontend/src/locales/{zh-CN,en-US}.ts`、`frontend/src/pages/landing/index.tsx`、`content/articles/cursor-mcp-read-and-suggest-version.md` | ✅ `yarn test:seo`；构建 HTML title 含 MCP；`yarn check:i18n`；`landing.spec.ts` MCP 链；`build-package.mjs` 出包 |
| **2** | 08-28 | 小红书 #13 已点发布（**审核中**，禁止再点发布）；掘金包已出 + 粘贴稿入库；本机 Chrome 未登录掘金，未公开发布 | `content/articles/cursor-mcp-read-and-suggest-version.juejin.md`；XHS [explore/6a90682300000000290346fd](https://www.xiaohongshu.com/explore/6a90682300000000290346fd) | 创作台笔记管理可见「审核中」+ 该 URL；掘金稿含 `utm_source=juejin` 且主 CTA 为文档 MCP 页 |
| **3** | 08-28 | 已登录工作台露出「给 Cursor 配 MCP」次入口；「活跃模型」改为诚实的「今日编辑」（20 个模型仍显示 0 会吓跑回访） | Home hero 次链 + locales | ✅ `home-mcp.spec.ts`（假会话，不删用户数据） |
| **4** | 08-28 | PAT 铸造成功弹层内嵌已填 PAT 的 Cursor `mcp.json` + 复制按钮；不必再翻 GitHub README | PAT UI + `mcpJsonSnippet.ts` | ✅ `personal-access-tokens.spec.ts`（铸造 → 可见 mcpServers + ERD_PAT） |
| **5** | 08-28 | 文档 MCP 页补 3 张截图（PAT 揭示弹层 / mcp.json / Agent 工具清单），供小红书封面 | `website/static/img/guide/mcp-*.png`；`content/articles/assets/` 同名副本 | ✅ 中/英指南含 `/img/guide/mcp-*.png`；`cd website && yarn build` |
| **6** | 09-03 | ⛔ **跳过**：掘金 CTA 复盘依赖公开发布；本机 Chrome 验证码墙。不群发、不重发。 | — | 待人过验证码后再做 |
| **7** | 08-28（原 09-05 提前） | ✅ 中/英 MCP 文档页 live 探测：200 + 尾斜杠 canonical + sitemap loc；GSC 两 URL 均「尚未收录 / 无法识别」→ 已请求编入索引；补交 `en/sitemap.xml` | `curl` + GSC 网址检查 | 见 CHANGELOG 切片 7；未检查无斜杠 301 路径 |
| **8** | 08-28（原 09-08；切片 6 阻塞提前做） | ✅ CI 用 REST 拉 projectJSON 做 schema lint（不是 MCP-only） | `content/articles/ci-rest-projectjson-schema-lint.md` | 汉字≥800；`node scripts/validate-projectjson.mjs`；`build-package.mjs` 主 CTA 文档 MCP 页 |
| 评审 | 08-28（原 09-10 提前） | ✅ 见下「两周评审（提前）」 | `docs/growth.md` | 楔子不停；GSC 持平不是变差 |
| GSC catalog/compare | 08-28 | ✅ `/catalog` `/compare` `/en/compare` 已收录；`/en/catalog` 已发现尚未编入索引 → 已请求编入索引 | GSC 网址检查 | 四 URL 200；未检查 301；未发 XHS |
| prerender 壳 | 08-28 | ✅ `/catalog` `/compare` `/demo` `/en` `/en/catalog` `/en/compare` `/en/demo` 首屏 title/canonical 为该路径，不再 200 反代到首页 | `seo-config.mjs` `gen-seo-static.mjs` | `yarn test:seo-static`；prod-smoke crawler first HTML |
| catalog 详情壳 | 08-28 | ✅ 官方 `/catalog/:id` 独立 title/canonical；未知 ID 200 到 `/catalog/`，`_item` 301 走 | 官方 4 种子 + `_redirects` | `yarn test:seo-static`；prod-smoke `/catalog/demo-authz` |
| README MCP | 08-28 | ✅ GitHub 默认 README + en-US 顶部 30 秒 `mcp.json` 楔子（次路径，H1 仍 Git + Figma）；文档只链 `doc.erdonline.com` | `README.md` `README.en-US.md` | json 块与 `docs/guide/api-and-mcp` 一致；无 github.io；未发 XHS；未请求 GSC |
| MCP npx | 08-28 | ✅ 30 秒路径改为 `npx -y --package` GitHub Release tarball，不必 clone+build；npmjs 未发（无登录）。自托管只改 `ERD_API_URL` | `mcpJsonSnippet.ts`、指南、README、PAT 弹层文案 | `mcpJsonSnippet.test.ts`；`npm pack` + `npx -y --package` 冒烟；未发 XHS；未请求 GSC |
| 稿件 npx | 08-28 | ✅ 稿 #13 源稿+掘金粘贴包、#6 源稿主路径改为 npx；clone/build 仅备选。**未**发小红书/掘金 | `content/articles/cursor-mcp-read-and-suggest-version{,.juejin}.md`、`projectjson-mcp-for-agents.md` | 正文 json 含 `--package` 与 `erdonline-mcp-0.1.0.tgz`；未发 XHS；未请求 GSC |
| llms.txt | 08-28 | ✅ 文档站 + www 增加短 `llms.txt`（Git + Figma 主叙事；MCP 次路径 npx）；无 llms-full.txt | `website/static/llms.txt` `frontend/public/llms.txt` | `assert-docs-seo.mjs`；`yarn test:seo-static`；未发 XHS |
| Cursor 一键 | 08-28 | ✅ 无 NPM_TOKEN，不发 npm。README + 指南加官方 `cursor.com/link/mcp/install`（stdio npx tarball）。Home 次链仍文档 | `mcpJsonSnippet.ts` README `guide/api-and-mcp` | `mcpJsonSnippet.test.ts`；live 中/英指南 200 含 install-link；未发 XHS |
| PAT 弹层一键 | 08-28 | ✅ 铸造揭示弹层次链用官方 install-link；**明文不进 URL**（占位符 `erd_pat_…`）。H1 未改 | `personalAccessTokens.tsx` | `install-link href never contains a minted PAT secret`；www Pages `762e3d88` 已绿 |
| compare MCP 行 | 08-28 | ✅ `/compare` `/en/compare` Agent / MCP 行已上线；壳 description 含 projectJSON。H1/SERP 未改 | `compare.tsx` locales `seo-config.mjs` | Pages `e88434af` 绿；curl description 含 projectJSON；About 已有 mcp |
| MCP npx CI | 08-28 | ✅ `yarn smoke:npx` 已挂 `mcp-ci.yml`；Actions [33116445179](https://github.com/erdonline/erdonline/actions/runs/33116445179) **success**（`ddd4934c`）。不发 npmjs | `mcp/scripts/smoke-npx-pack.mjs` `.github/workflows/mcp-ci.yml` | GH MCP pack smoke 绿；未发 XHS |
| 今晚 MCP 漏斗 | 08-28 | ✅ **收口（产品路径）**：npx tarball、llms.txt、Cursor install-link、PAT 明文不进 URL、`/compare` Agent/MCP 行、catalog/compare prerender 壳、路径 JSON-LD。渠道侧 #13 勿再点发布；掘金/思否登录墙 | `docs/growth.md` | 上表各行 + mcp-ci 绿 |
| EN awesome-list | 08-28 | ✅ 种子 PR：[punkpeye/awesome-mcp-servers#13035](https://github.com/punkpeye/awesome-mcp-servers/pull/13035)。bot 要 Glama：已补 badge + 仓内 `mcp/Dockerfile` / `glama.json` / 无 PAT `tools/list`。**不**发小红书/掘金；**不**请求 GSC | fork README + `mcp/Dockerfile` | PR OPEN；Glama 页仍可能 404 至爬取 |
| HelloGitHub | 08-28 | ✅ 投稿 [issue #3605](https://github.com/521xueweihan/HelloGitHub/issues/3605)；截图评论（可选字段、利于收录）：[issuecomment-5445315760](https://github.com/521xueweihan/HelloGitHub/issues/3605#issuecomment-5445315760) 用 `https://doc.erdonline.com/img/guide/mcp-agent-tools.png`（工具表，**不是** PAT 揭示弹层）。**不**发小红书/掘金；**不**请求 GSC | `submit-cn.yaml` + 评论 | issue OPEN；未入月刊 |
| EN 第二列表 | 08-28 | ⏭ 未开第二份 PR：`appcypher/awesome-mcp-servers` 已 **archived**（fork 无法建 PR）；`wong2/awesome-mcp-servers` 声明不收 PR（改投 mcpservers.org）；官方 `modelcontextprotocol/servers` 已撤第三方列表。不同名小仓 / remote-only 列表当 spam 跳过 | — | 跳过 |
| MCP Registry | 08-28 | 📋 官方 Registry **未发**：无 `NPM_TOKEN`；`mcp-publisher login github` 要 device OAuth + erdonline **Owner**（`whaty`/`gh` 不够）。Release `.tgz` 不是 mcpb。runbook [`docs/mcp-registry.md`](./mcp-registry.md)。本切片改 tarball 含 README + 弹层「一键后粘贴 PAT」。**不**发 npm / 小红书；**不**请求 GSC | `mcp/server.json` `mcp/README.md` locales | runbook 落地；Registry 空 |
| MCP resources | 08-28 | ✅ Glama 未登录（Sign Up），未提交。仓内补 `resources/list` 文档指南 + prompt `list-erd-projects`。**不**发小红书/npm；**不**请求 GSC | `mcp/src/create-server.ts` | `yarn smoke:introspect` |
| MCP PAT 报错 + 指南正文 | 08-28 | ✅ 缺 PAT / 占位符 `erd_pat_…` 时 `tools/call` 给出铸造路径 + 文档 URL；`resources/read` 返回 api-and-mcp.md。**不**发小红书/npm；**不**请求 GSC；不重试 Glama | `mcp/src/erd-api.ts` `mcp/src/load-guide.ts` | `yarn smoke:introspect`（read + call） |
| 下一刀 | 08-28 | 📋 阮一峰 / V2EX / 知乎答题（需人登录；本切片不代发）。开源中国草稿已在 08-09 台账；思否 session 失败待人登录。**不**发小红书/掘金；**不**请求 GSC | — | 被登录墙挡住 |

纪律：每切片一个意图、验证通过再 commit；MCP 是期权不是噱头（[vision](./vision.md)、[ADR-0012](./adr/0012-ai-era-data-structure-platform.md)、[ADR-0013](./adr/0013-public-api-mcp.md)）。

### 两周评审（提前 · 2026-08-28 01:23）

日历原定 09-10。切片 6 仍被掘金验证码挡住；1–5、7–8 已交付，提前取数。**不是连续两周变差**（GSC 与 08-16/08-28 基线持平），楔子不停。

| 指标 | 数 | 判读 |
|---|---|---|
| XHS #13 `explore/6a90682300000000290346fd` | **已发布**（审核中 Tab 空）；浏览 **5**；赞/评/藏/分享 0 | 00:38 过审后约 1h；**禁止再点发布** |
| XHS #6 开放 projectJSON + MCP | 浏览 **51** | 仍为账号最高；#13 尚未 > #6（发布时间差 ~19 天，不可比） |
| XHS draw.io dunk | 浏览 **41** | 第二高，对 GSC draw 查询仍有效 |
| GSC 3 个月 Web（`sc-domain:erdonline.com`，更新日期约 4.5h 前；图 8/11–8/25） | **2 点击 / 103 展示 / CTR 1.9% / 均位 62.7** | 与楔子启动时相同 |
| GSC 网页 | `/` 1/90；`/compare` 1/8；`/catalog` 1/6；`/en` 0/19；`/en/compare` 0/4；**无任何 `doc.erdonline.com` 行** | MCP 文档尚未进效果报告（切片 7 已请求编入索引） |
| 已登录 www `/home`（erdonline154） | 「继续上次建模」可点；项目卡链到设计器；「给 Cursor 配 MCP」为真实 `<a>` → 文档 MCP 页；今日编辑 0 / 模型 20 | **无 P0 点击泄漏**；H1/SERP 未改 |

决策：稿 #15/#16 小红书长文草稿已存（**未排版、未发布**）。对照页 draw.io ✅。**`/catalog` 独立 SEO ✅**。MCP 操作帖等 #13 阅读上来再续。掘金仍跳过；不点 #15/#16 一键排版/发布。

### 对照页收割 draw.io（2026-08-28 日历后）

- **证据**：GSC `/compare` 1 点击 / 8 展示（均位约 2–3），但对照表只有 dbdiagram / DBML，搜 draw-ER 的人看不到「连线 ≠ 外键」。
- **改法**：落地摘要表与 `/compare` 增加 **draw.io 列** + **关系语义 / 外键**行；对照 SEO title/description 点名 draw.io。www H1 仍 Git + Figma；SERP title 仍 draw-ERD；不做 ChatSQL；不铸 PAT；不发掘金、不上小红书。
- **蒸馏**：`docs/guide/what-is-erd-online.md` 标明静态截图可继续用 draw.io，对比走对照页。
- **状态**：✅ 2026-08-28

### `/catalog` 独立 SEO（2026-08-28）

- **证据**：GSC `/catalog` 1 点击 / 6 展示（均位约 2–3），但 `CatalogLayout` 未调 `usePageSeo`，SPA 200 后 title 仍是首页 `Draw ER Diagram Online`，与 `/` 抢同一摘要。
- **改法**：`catalog.seo.title` / `description`（中/英）写入 CatalogLayout；英文「ER diagram templates」，中文「ER 图模板」。www H1 仍 Git + Figma；首页 SERP title 仍 draw-ERD；不做 ChatSQL；不铸 PAT；不发掘金；不点小红书 #15/#16 排版/发布。
- **蒸馏**：`docs/landing.md` — catalog 必须有独立摘要，禁止套用首页 title。
- **状态**：✅ 2026-08-28

### GSC 网址检查 catalog / compare（2026-08-28）

- **范围**：`sc-domain:erdonline.com`；只检查 200 URL；不检查 301/308；不发小红书。
- **结果**：`/catalog`、`/compare`、`/en/compare` **已收录**（未再请求索引）。`/en/catalog` **已发现 - 尚未编入索引**（sitemap 已列）→ 已请求编入索引。
- **未做（当时）**：静态壳把所有公开路径的 `<title>` / canonical 指回首页。**已修（同日）**：见下节。

### 公开路径 prerender 壳（2026-08-28）

- **证据**：GSC `/en/catalog` crawled not indexed；`/catalog` `/compare` 与 `/` 共用首页 Draw-ERD 首屏 HTML（CF `_redirects` `200` → `/`）。
- **改法**：构建后写出 `dist/<path>/index.html`；从 `_redirects` 去掉这些精确路径。www H1 仍 Git + Figma；首页 SERP title 仍 draw-ERD；未发小红书；不铸 PAT。
- **蒸馏**：`docs/deployment.md`、`docs/landing.md`。
- **状态**：✅ 2026-08-28。`/demo` `/en/demo` 同日补静态壳（真人仍 hydrate → `/s/public-demo`）。`/catalog/*` splat 会匹配 `/catalog/` → 已改为 `/catalog/:id`。官方详情 4 个 ID 已独立壳；未知 ID 200 到 `/catalog/`（不再暴露 `_item`）。无 `/en/catalog/:id`。

### `/catalog/:id` 详情首屏（2026-08-28）

- **证据**：列表已对；`/catalog/:id / 200` 仍把详情首屏变成首页 Draw-ERD。数据 API-only，社区 ID 无界。
- **改法**：官方种子 per-id prerender；未知 ID 200 到 `/catalog/` 列表壳（不生成 `_item`）。CF identity-200 挡 placeholder。未请求 GSC。www H1 / 首页 SERP 未改；未发小红书。
- **蒸馏**：`docs/deployment.md`。
- **状态**：✅ 2026-08-28。live（`ec296a9e` Pages [33109350832](https://github.com/erdonline/erdonline/actions/runs/33109350832) success）：未知 ID **200 保原 URL** 列表壳；`_item` **301 → `/catalog/`**；官方 demo-authz 仍独立 title。同日 hydrate 不再把详情套成列表 SEO。未请求 GSC。

### 营销路径 JSON-LD（2026-08-28）

- **证据**：prerender 只改 JSON-LD `url`，`@type` 仍是首页 WebApplication。
- **改法**：`/` WebApplication；catalog CollectionPage；官方详情 ItemPage；compare/demo/en WebPage。
- **状态**：✅ 2026-08-28。live（`0c7f224d` Pages [33110676901](https://github.com/erdonline/erdonline/actions/runs/33110676901) success）curl 如上。未请求 GSC。

## 历史 4 周节奏（2026-08 启动包，已完成选题 1–12）

- **W1 基建+首发**：UTM 规范落地（已随流水线完成）→ 记录 Baidu/CF/GitHub Traffic 基线 → 发 #1（掘金）→ V2EX 轻量帖 → HelloGitHub 投稿
- **W2 卖点主打**：发 #3（版本 diff，重点篇）+ #5；阮一峰周刊投稿；知乎答 3 个存量问题；周末复盘 referrer/转化
- **W3 迁移收割**：发 #4 + #6；awesome 列表 PR 3–5 个；打磨 README.en-US
- **W4 长尾+评审**：发 #7/#8/#9；**四周决策评审**：CN 数据是否支撑加倍？demo 英文体验可否 Show HN？数据归档后产出下月计划
