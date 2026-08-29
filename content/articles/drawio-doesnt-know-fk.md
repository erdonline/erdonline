---
title: 还在用 drawio 画 ER 图？它根本不知道什么是外键
slug: drawio-doesnt-know-fk
status: ready
platforms: [juejin, csdn, oschina, zhihu, v2ex]
cta: demo
utm_campaign: launch
xhs_title: drawio 画 ER？它不懂外键
created: 2026-08-09
---

## 开场：图很好看，DDL 对不上

draw.io（diagrams.net）是优秀的**通用画图**工具：框、线、颜色、导出 PDF 都顺手。很多团队用它画 ER，评审 PPT 也好看。麻烦出在**落库那一刻**：箭头只是形状，没有「这是 FK、指向哪张表哪一列、ON DELETE 是 CASCADE 还是 RESTRICT」的语义；改完保存 PNG，上一版长什么样只能靠文件名猜。

这不是 draw.io 的错——它本来就不是数据库建模器。问题在于：**把通用画图当 ER 工具用，会在协作、逆向、版本 diff 上持续付隐性成本。**

## 通用画图 vs 懂数据库语义

| 能力 | 通用画图（draw.io 等） | 数据库建模器（ERD Online） |
|---|---|---|
| 外键 | 视觉连线，无约束名/规则 | 关系写入 projectJSON，可导出 DDL、可 diff |
| 字段类型 | 文本框手写 | 字典驱动（INT/VARCHAR/…），与方言对齐 |
| 索引 / 备注 | 靠人工标注 | 结构化字段，逆向可回填 |
| 逆向工程 | 无 | MySQL / Oracle / PostgreSQL / SQL Server JDBC 导入 |
| DBML | 无 | 一等导入格式，与 dbdiagram 生态互通 |
| 版本 diff | 无 | 表/字段/关系级两版比对 |

draw.io 适合「讲清楚概念」；**当模型要演进、要导出、要对齐生产库**时，需要模型本身携带数据库语义，而不是事后从图里「读」出来。

Navicat 等客户端能连库、能逆向，但强项在**实例运维**——设计评审、字段级 diff、多人并行改同一 projectJSON 并不是它的主路径。dbdiagram 把「当前模型 + DBML」做得很好，若你的痛点是版本链、内网自托管、审批落库，仍需要换一条产品叙事。ERD Online 不试图在「5 分钟画完一张图」上和它们拼轻量，而是把**协作化数据库设计**当主战场。

## 迁移并不痛苦：DBML 与逆向两条路

若已有 draw.io 图，不必从零手抄：

1. **有 DBML 源**（或能从 dbdiagram 导出）→ 直接导入 ERD Online，表与 Ref 落入 ReactFlow 画布。
2. **只有生产库**→ 配 JDBC 数据源，从 MySQL / Oracle / PG / SQL Server **逆向**成关系图；注释、索引、外键约束名与规则尽量保真进 projectJSON。
3. **导入/逆向后立刻存版本**——第一次快照就是基线；之后每次改字段再存，Git 式 diff 才跑得起来。

> 诚实边界：通用画图里的「装饰性箭头」无法自动变成 FK；若只有截图，仍需人工或从库逆向重建语义。Trigger 等构造以当前解析器支持为准，不支持项会明确跳过而非静默丢失。

## 30 秒亲手验证（免注册）

1. 打开 demo，进入设计器空态。
2. 点「导入 DBML」，粘贴含两张表 + 一条 `Ref` 的片段。
3. 确认关系线可见；给某表加一个字段，保存版本，打开 diff 看变更。

{{CTA}}

## 画布的及格线与长板

我们同样重视**图的可读性**：ReactFlow 关系图、Crow's foot 基数、Frame 分组、密 FK 布局与分享只读链接——这些是体验及格线。长板在**版本 + 协作 + 开放 projectJSON**：多人同项目改模型、三级权限、SQL 审批流、MCP/API 只读读写（见专门文章）。

draw.io 不会因此被「替代」——概念草图仍可以用它。**当 ER 图要成为团队的事实源**，就该换到懂外键的工具链上。

若你正在 V2EX / 掘金上搜「ER 工具 自托管」，多半是在找这条链：**语义模型 → 版本 diff → 可选审批落库**。我们刻意不做「纯画图 SaaS」——MIT + compose 是为内网评审与合规准备的，不是 Pro 版解锁。

## 开源与自部署

MIT 许可；`docker compose up -d` 可内网自托管（见 [部署文档]({{DOC:deployment}})）。

## 路线图与参与

- 文档 / 路线图 / ADR：[文档站]({{DOCS}})
- Issue / PR / star：[GitHub 仓库]({{REPO}})

有用欢迎 star / issue / PR——路线图与贡献入口见文档站。
