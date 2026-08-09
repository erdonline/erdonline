---
title: 从 dbdiagram 搬家只要 5 分钟：DBML 导入 + 自托管指南
slug: from-dbdiagram-in-5-min
status: ready
platforms: [juejin, csdn, oschina, xiaohongshu, weixin, zhihu, segmentfault]
cta: demo
utm_campaign: launch
xhs_title: 从 dbdiagram 搬家只要 5 分钟
created: 2026-08-09
---

## 开场：模型被「锁」在 SaaS 里

团队在 dbdiagram 里画了半年 ER：表名、字段、外键 Ref 都写得挺规范。某天要做两件事——**内网评审要离线看图**，以及**每次改字段要能对照上一版**——结果发现：导出一份 DBML / 截图还能分享，但「版本链、团队权限、自托管」并不在同一条产品路径上。

更糟的是，一搬家就怕丢语义：手抄进画图工具会漏外键；只留 SQL 迁移脚本又丢了设计阶段的关系叙事。真正需要的是：**把已有 DBML 原样接进一个可自托管、可存版本的建模工具**，而不是再画一遍。

## 为什么「导出再重画」是假搬家

| 做法 | 看起来完成了 | 实际成本 |
|---|---|---|
| 截图 / PDF 归档 | 能发群 | 不可编辑、不可 diff |
| 只导出 DDL | 能建库 | 丢了设计态关系图与中文备注等语义 |
| 手抄进 draw.io | 图好看了 | 外键、索引、枚举容易漏；无版本链 |
| 继续只在原 SaaS 里改 | 零摩擦 | 协作/自托管/审计能力受平台边界限制 |

缺口很具体：**DBML 已经是半结构化事实源**，缺的是一个「导入 → 进画布 → 可存版 / 可协作 / 可 docker 起」的落点。

## 5 分钟路径：DBML 进 ERD Online

[ERD Online](https://github.com/erdonline/erdonline) 把 DBML 当作一等导入格式（基于 `@dbml/core` 解析），空项目也能从空态直接「导入 DBML」落到关系图画布：

1. **在 dbdiagram（或任意 DBML 源）导出 `.dbml`**——保留 `Table` / `Ref` / 索引与备注。
2. **打开 ERD Online**——免注册 demo，或自托管实例里新建/打开项目。
3. **空态或项目菜单 → 导入 DBML**——粘贴文本或选文件，解析后表节点落入画布可视区；前缀相近的表还可能给出 Frame 分组建议。
4. **立刻存一个版本**——导入本身就是一次有意义的基线快照；之后每次改字段再存，就能看表/字段/关系级 diff。

不需要先学一套新 DSL：你原来的 DBML 就是输入。

> 诚实边界：Trigger 等个别构造若上游 `@dbml/core` 尚无官方块，不会被「假装」映射进模型；Enum、表达式索引、FK 的 ON DELETE/UPDATE 等已支持往返的能力，以文档与单测为准——搬家时以解析预览为准，跳过项会明确提示。

## 30 秒亲手验证（免注册）

不用先搭环境，打开 demo 就能验证「导入 → 上画布」：

1. 打开 demo，进入设计器空态（或清空示例后）。
2. 点「导入 DBML」，粘贴一小段含两张表 + 一条 `Ref` 的 DBML。
3. 确认解析结果：表出现在画布上，关系线可见；再点「保存版本」打一条基线。

{{CTA}}

## 搬进来之后你多得到什么

导入只是起点。相对「只能看当前态」的极简建模，你还会有：

- **Git 式版本 + diff**：任意两版比对表/字段/关系变更（设计阶段可追溯，不只靠 Flyway 事后脚本）。
- **实时协作与权限**：同一项目多人改模型；适合内网评审而不是文件传来传去。
- **开放 projectJSON**：结构化事实源可被脚本、MCP、自建工具读写——不是锁死在专有云格式里。

细节见[文档]({{DOCS}})，本文不展开截图教程。

## 开源与自托管（内网真搬家）

若合规要求数据不出内网：

```bash
git clone https://github.com/erdonline/erdonline.git
cd erdonline
docker compose pull
docker compose up -d
```

- **许可**：MIT，可商用、可 fork。
- **栈**：MySQL + Redis + 前后端按 compose 编排；预构建镜像走 GHCR（见 [部署文档]({{DOC:deployment}})）。
- **导入路径不变**：自托管实例里同样用 DBML 导入，再本地存版本。

## 路线图与参与

- 文档 / 路线图 / good first issue：[文档站]({{DOCS}})
- Issue / PR / star：[GitHub 仓库]({{REPO}})

若这篇帮你把旧模型接进可自托管工具，欢迎点 star、提 issue 或 PR——我们会继续把「导入 → 版本 → 协作」这条迁移路径磨短，而不是做另一个只能看当前态的画图站。
