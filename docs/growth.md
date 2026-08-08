# 增长方案（引流与内容推广）

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

纪律：**每篇文章 CTA 永远只有一个主链接 = demo**，GitHub star 只放文末次要位置。任何一篇阅读高但 demo 点击率低于 1.5%，先改 CTA 位置与文案，而不是写新文章。

## 渠道优先级（ROI 排序）

**立刻做**：掘金（每周 1 篇主发）→ HelloGitHub 月刊投稿（一次性）→ 阮一峰周刊投稿（一次性）→ V2EX（首发 + 每里程碑一次）→ 开源中国/思否（掘金稿零成本同步）→ 知乎答题（长尾存量问题，写一次吃几年）。

**暂缓（有前置条件）**：Show HN / Reddit / dev.to —— 等 demo 与落地页英文体验完整（i18n 在 P3），EN 用户撞中文 demo = 转化率塌方，宁可晚发不可烂发；B 站 —— 等有视觉性强的里程碑再录 1 条 3 分钟演示。

**不做**：付费投放、抖音/小红书（受众错配）、自建公众号矩阵（改为投稿既有大号）、AI 噱头营销、刷量、10+ 平台机械同步（只维护掘金主发 + 思否/开源中国同步 + 知乎答题）。

**CN vs EN 判断**：中文「ER 图工具/数据库建模工具」搜索是真空（无像样横评文），抢增量；英文侧 dbdiagram/DrawDB 已霸屏，只埋种子（awesome list PR、README.en-US 质量），等 i18n 完整再 Show HN。

## 文章选题包（12 个，按发布序）

| # | 标题（暂定） | 角度 | 平台 | CTA |
|---|---|---|---|---|
| 1 | 数据库设计的 Git + Figma：我们把版本管理和实时协作塞进了 ER 建模 | 品牌宣言，定位与生态位空白 | 掘金首发→思否/开源中国 | demo |
| 2 | 还在用 drawio 画 ER 图？它根本不知道什么是外键 | 通用画图 vs 懂数据库语义 | 掘金 + V2EX | demo |
| 3 | 数据库表结构改崩了谁背锅？给建模加上 Git 式版本 diff | 版本叙事最强卖点，事故开场 | 掘金 + 投稿公众号大号 | demo→存版本 |
| 4 | 从 dbdiagram 搬家只要 5 分钟：DBML 导入 + 自托管指南 | 迁移收割，抢竞品用户 | 掘金 + 知乎 | demo→导入 |
| 5 | MySQL/Oracle/PG/SQLServer 存量库一键逆向成关系图 | 逆向工程深度，存量库刚需 | 掘金 | demo |
| 6 | 让 AI Agent 读懂你的数据库设计：开放 projectJSON + MCP | AI 平台叙事（只讲开放可审计） | 掘金 + 少数派 | API 文档 |
| 7 | docker-compose 一键部署的 MIT 开源数据库建模平台 | 自部署 SEO 文 | 思否 + 开源中国 | 部署文档 |
| 8 | 团队建模怎么管权限？三级角色 + 审批流落地实录 | 团队场景，打单机工具痛点 | 掘金 | demo |
| 9 | 2026 年 8 款 ER 图/数据库设计工具诚实横评 | SEO 长尾收割机；自己排第一但对照必须诚实 | 知乎 + 思否 | /compare |
| 10 | 30 秒免注册：打开这个链接，改一张表，存一个版本 | 纯 demo 体验帖，图多字少 | V2EX + 即刻 | demo |
| 11 | 从 G6 到 ReactFlow：画布 Strangler 迁移实录 | 技术深度，服务贡献者漏斗 | 掘金 | GitHub |
| 12 | 我们怎么设计 good first issue：让第一个 PR 两小时内合入 | 贡献者招募 | 掘金 + 开源中国 | GitHub Issues |

节奏：每周 1–2 篇，前 4 周发 #1–#8 中的 6 篇，#9–#12 视产能排第 5–6 周。

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

## 4 周节奏（启动 checklist 摘要）

- **W1 基建+首发**：UTM 规范落地（已随流水线完成）→ 记录 Baidu/CF/GitHub Traffic 基线 → 发 #1（掘金）→ V2EX 轻量帖 → HelloGitHub 投稿
- **W2 卖点主打**：发 #3（版本 diff，重点篇）+ #5；阮一峰周刊投稿；知乎答 3 个存量问题；周末复盘 referrer/转化
- **W3 迁移收割**：发 #4 + #6；awesome 列表 PR 3–5 个；打磨 README.en-US
- **W4 长尾+评审**：发 #7/#8/#9；**四周决策评审**：CN 数据是否支撑加倍？demo 英文体验可否 Show HN？数据归档后产出下月计划
