# Launch Kit — 推广物料（一键可发）

> 目标不是 star 数，而是**北极星：每周产生非空版本保存的活跃项目数**。所有渠道都要能把「点击 → 打开 demo → 存一次版本」跑通。下面文案可直接复制发布；**发布动作需在你的账号上完成**（agent 无法代发/代 star）。

## 核心资产

- 一句话定位：**The Git + Figma for database design**（数据库设计的 Git + Figma）。
- 免登录 Demo：https://erdonline-demo.pages.dev/demo
- 仓库：https://github.com/erdonline/erdonline ｜ 文档：https://erdonline.github.io/erdonline/
- 差异化：**版本快照 + diff** 与 **实时协作**（别人不开源的两件事）。

## 渠道优先级（开源开发工具冷启动，全部免费）

1. **Hacker News**「Show HN」——最高 ROI；工作日 UTC 14:00–17:00 发，作者需在评论区蹲守答疑。
2. **Reddit**：r/programming、r/database、r/opensource、r/selfhosted、r/webdev（**先读每个 sub 的自promotion 规则**，别一稿多投硬广）。
3. **Product Hunt**：备好 tagline + 4 张图 + 30s GIF，选周二/周三。
4. **X/Twitter + LinkedIn**：带 30 秒 GIF 的短线程。
5. **中文**：V2EX（分享创造节点）、掘金、少数派、知乎「开源项目」话题。
6. **长尾收录**：`awesome-database-tools` 等 awesome 列表提 PR；GitHub Topics；dev.to 教程文。

## Ready-to-post 文案

### Show HN

- 标题：`Show HN: ERD Online – open-source database design with version diffs and live collaboration`
- 正文：
  > I got tired of database design tools forcing a trade-off: dbdiagram is nice but closed with no versioning or collaboration; Navicat/PDManer are heavy and single-player; drawio doesn't understand databases. ERD Online is the open-source (MIT) middle: a ReactFlow ER canvas where **every change snapshots a version you can diff/restore**, and **teammates edit the same diagram in real time**. Reverse-engineer existing DBs, export docs, and there's an open API + MCP so AI agents read/write the same `projectJSON` source of truth.
  >
  > 30-second no-login demo (opens straight into a live ER diagram): https://erdonline-demo.pages.dev/demo
  > Repo (self-host with one `docker compose up`): https://github.com/erdonline/erdonline
  >
  > Stack: React 18 + UmiJS + TypeScript, Spring Boot 3.5 / JDK 17, MySQL + Redis. Happy to answer questions.

### Reddit (r/opensource / r/database)

- 标题：`ERD Online: open-source (MIT) database modeler with Git-style version diffs + real-time collaboration`
- 正文：同 Show HN 正文，结尾加一句「What would make this a daily driver for your team? Feedback very welcome.」并附 demo + repo 链接。

### Product Hunt

- Tagline：`Design databases together — with version diffs and live collaboration`
- Description：`The Git + Figma for database design. Open-source (MIT). Snapshot & diff every change, collaborate in real time on a ReactFlow ER canvas, reverse-engineer existing DBs, and drive it all via an open API/MCP. Try the no-login demo.`

### X/Twitter 线程

1. `Databases deserve Git + Figma. ERD Online (open-source, MIT) gives your data models version diffs and real-time collaboration. 30s no-login demo 👇 https://erdonline-demo.pages.dev/demo`
2. `Every table change auto-snapshots a version you can diff and restore. No more "final_v3_really.sql".`
3. `Reverse-engineer an existing DB, edit on a ReactFlow canvas, export Word/HTML/Markdown. Self-host with one docker compose. ⭐ https://github.com/erdonline/erdonline`

## GitHub 增长动作（你在仓库设置里做）

- **Social preview**：Settings → 上传一张 1280×640 的 OG 图（分享/搜索都用它）。
- **Topics**：`database`, `erd`, `data-modeling`, `database-design`, `collaboration`, `reactflow`, `spring-boot`, `mysql`, `self-hosted`, `open-source`。
- **About**：填一句定位 + demo 链接。
- **good first issue**：给 5–10 个小任务打标签，降低首个 PR 门槛。
- **Pinned issue**：「Roadmap / 想要什么功能来投票」，把流量转成 issue。

## 纪律

- 一次只主打一个渠道，作者到场答疑；不要一稿群发硬广（会被封）。
- 每个渠道都指向 **demo**（先体验）再指向 repo（再 star）。
- 发布后 48h 盯 issue/评论，快速回应＝口碑。
- 度量只认北极星与 demo→存版本转化，不盲追 star。
