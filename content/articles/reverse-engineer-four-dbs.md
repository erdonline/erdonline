---
title: MySQL/Oracle/PG/SQLServer 存量库一键逆向成关系图
slug: reverse-engineer-four-dbs
status: ready
platforms: [juejin, csdn, oschina, zhihu]
cta: demo
utm_campaign: launch
xhs_title: 四库存量一键逆向成 ER 图
created: 2026-08-09
---

## 开场：文档丢了，库还在

接手老系统时，常见局面是：**生产库是真相，ER 图在离职同事的硬盘里**。Navicat 能导出 DDL，但评审要关系图、改表要对齐设计态语义——手抄进 draw.io 漏 FK，只留 SQL 又丢中文备注和关系叙事。

[ERD Online](https://github.com/erdonline/erdonline) 的逆向工程走 JDBC：在项目里配数据源，从**活库** introspect 表结构，规范化写入 projectJSON，再落到 ReactFlow 关系图画布。P0 四库：**MySQL、Oracle、PostgreSQL、Microsoft SQL Server**。

## 逆向会带回什么语义

不是只画一堆框：

| 对象 | 逆向行为（因方言而异） |
|---|---|
| 表 / 列 | 名、类型、可空、默认值、备注 |
| 主键 | 单列 / 复合 PK |
| 外键 | 约束名、引用表列、ON DELETE/UPDATE 规则 |
| 索引 | 普通 / 唯一；PG·SQL Server 表达式索引、过滤谓词尽量保留 |
| 触发器 | 四库均支持写入 `entity.triggers[]`（以当前 dialect 为准） |

导入后画布会自动 dagre 布局；前缀相近的表可能建议 Frame 分组，方便大图阅读。Oracle 需留意 schema 选择；PostgreSQL 支持 schema 级 introspect；SQL Server 可走库 + schema 组合。MySQL 侧常见 InnoDB FK/索引与列备注均可回填。

与「只导出 CREATE TABLE 文本」相比，逆向进 projectJSON 的好处是：**关系线、基数、约束名**仍在设计器里可编辑，后续存版 diff 针对的是 ER 语义，不是 eyeball 两份 DDL。

> 诚实边界：逆向依赖 JDBC 连通与账号权限（至少能读系统 catalog）；超大库建议按 schema/表前缀筛选后再导入。个别方言特性若上游 mapper 尚未映射，会 warn 跳过而非伪造。生产库逆向账号建议只读，密码走项目数据源配置加密存储，勿写进导出文件。

## 推荐工作流：逆向 → 基线版本 → 再演进

1. **新建团队/个人项目**，在「数据源」里配置目标库连接（密码加密存储，见 [安全模型]({{DOC:security-model}})）。
2. **设计器 → 逆向导入**：选库/schema、勾选表，执行后表节点进画布。
3. **立刻「保存版本」**——例如 `0.1.0-baseline-from-prod`，说明写清来源库与时间；这是后续 diff 的起点。
4. **在模型上规划变更**——加字段、调关系；每次有意义改动再存版，评审时对着 diff 说话，而不是对着 Navicat 当前态吵架。
5. **需要落库时**走 SQL 审批流（团队项目）：生成变更 SQL → 选审批人 → 通过后同步（失败不会假通过）。

逆向完成后，还可 **DBML 导出** 与 dbdiagram 生态互通，或 **DDL 导出** 给 Flyway 参考——但设计态仍以 projectJSON + 版本链为准，避免「库已是真相、图永远落后」再次上演。

单机导出 DDL 只能回答「现在库长什么样」；**版本链**回答「相对基线我们打算改什么」。

## 30 秒亲手验证（免注册）

demo 环境未绑你的生产库，但可以用示例项目感受「有结构的 ER 画布 + 版本 diff」：

1. 打开 demo，进入示例项目关系图。
2. 打开版本管理，查看已有版本列表与 diff 面板。
3. 改一个字段，保存新版本，对比两版差异。

若你要对**自己的库**做逆向，需自托管或注册后配置 JDBC（部署见 [部署文档]({{DOC:deployment}})）。

{{CTA}}

## 与 DBML 导入、MCP 的衔接

- **DBML 导入**：若已有 dbdiagram 模型，DBML 可能比连生产库更安全（只读文件，无 JDBC 风险）。
- **projectJSON + MCP/API**：逆向结果是结构化 JSON，Agent 可通过 PAT 只读拉取同一事实源（MCP 为独立进程，非 Docker 内置，见 [MCP 说明]({{GH:mcp/README.md}})）。

## 开源与自部署

MIT；`docker compose up -d` 起全栈。GHCR 预构建镜像 `ghcr.io/erdonline/erdonline-backend` / `frontend`。生产环境务必改默认口令、限制数据源账号为只读账号。

## 路线图与参与

- 文档 / 路线图 / 逆向保真进展：[文档站]({{DOCS}})
- Issue / PR / star：[GitHub 仓库]({{REPO}})

欢迎 star / issue / PR——路线图与逆向保真进展见文档站。
