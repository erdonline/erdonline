---
title: 让 AI Agent 读懂你的数据库设计：开放 projectJSON + MCP
slug: projectjson-mcp-for-agents
status: ready
platforms: [juejin, csdn, oschina, zhihu]
cta: docs
utm_campaign: launch
xhs_title: 开放 projectJSON + MCP 给 Agent
created: 2026-08-09
---

## 开场：Agent 需要的不是「再画一张 AI 图」

把 prompt 丢给大模型「帮我设计电商库」，往往得到一份**看起来合理、无法审计、与团队现有模型脱节**的 DDL。真正缺的是：**机器可读、人类可 diff、权限可管**的设计事实源——Agent 应该读你们已经存版的 projectJSON，在约束内提交新版本，而不是黑盒生成一张新图。

[ERD Online](https://github.com/erdonline/erdonline) 走 **schema-as-code + 开放 API/MCP**（[ADR-0013]({{DOC:adr/0013-public-api-mcp}})）：不卖「一句话生成 ERD」噱头，而是把建模结果放进可版本化的 JSON，再用 PAT/OAuth 暴露给脚本与 Agent。

## projectJSON 是什么

每个项目的核心数据是 **projectJSON**：

- 表、字段、索引、关系、触发器等业务语义结构化存储；
- schema 版本号承诺**加法演进**，已有字段不破坏——便于自建工具与 CI 校验；
- 每次「保存版本」是对 projectJSON 的快照；diff 在表/字段/关系级可视化。

文档与 JSON Schema 见 [数据格式说明]({{DOC:data-format}}) / [schema 目录]({{GH_TREE:schema}})。这不是专有云闭源格式，MIT 仓库内可 fork 解析器。

典型集成场景：

- **CI schema lint**：PR 改 projectJSON → 流水线拉 `/api/v1/projects/{id}` 比对上一版；
- **内部 catalog**：定时同步版本列表，把「哪版对应哪次发布」写进元数据；
- **Cursor / Claude Agent**：经 MCP 读当前模型，在 `versions:write` scope 下提交「Agent 建议版」，人再 diff 合并。

## 公开 API：鉴权、scope、边界

| 要点 | 说明 |
|---|---|
| 鉴权 | Personal Access Token（`erd_pat_`）或 OAuth（`erd_oat_`）；会话 JWT **不能**调 `/api/v1/**` |
| 默认 scope | `projects:read`、`versions:read` |
| 写 scope | `projects:write`、`versions:write`——显式铸造，最小权限 |
| 速率限制 | 默认 60 req/min/token（Redis 限流；不可用 fail-closed 503） |
| 安全边界 | 写入前清 `profile.dbs`（不落库连接串）；**不**暴露 connector 任意 SQL 执行 |

REST 示例：`GET /api/v1/projects`、`GET …/versions`、`POST …/versions`（提交新版本）、`PUT …/projectJSON`。OpenAPI 分组 `public-v1`（prod 默认不暴露 springdoc UI，见 [部署文档]({{DOC:deployment}})）。

## MCP：stdio/HTTP，独立进程

MCP Server 在 [MCP 目录]({{GH_TREE:mcp}})，**不包含在 Docker 镜像内**。30 秒接到 Cursor：铸造 PAT 后粘贴 `npx -y --package <GitHub Release tarball> erd-mcp`（见 [用 MCP 让 Cursor 读取 ER 图]({{DOC:guide/api-and-mcp}})），不必 clone。贡献者从源码跑：

```bash
cd mcp && yarn install && yarn build
export ERD_API_URL=https://your-api.example.com
export ERD_PAT=erd_pat_…   # 账户设置里铸造，明文仅一次
node dist/index.js          # stdio；或 yarn start -- --http
```

工具清单（只读 + 受 scope 约束的写）：列项目/版本、读 projectJSON、`create_version`、`update_project`、`put_project_json`。Cursor / Claude Desktop 配置见 [MCP 说明]({{GH:mcp/README.md}})。本地 dogfood 脚本见 MCP 说明，会走 REST 探针五只读 tool + 写路径冒烟。

OAuth 切片（client_credentials、Authorization Code + PKCE、refresh、OIDC discovery）已落地，适合浏览器三方应用；M2M 脚本优先 PAT。分享只读 token（[ADR-0007]({{DOC:adr/0007-readonly-project-share}})）与 PAT **不是同一套面**——匿名分享链不能替代 API 鉴权。

> 诚实边界：MCP 是**旁路进程**，需自行保管 PAT、勿写进 compose 默认值；写操作仍受项目成员 ACL 约束，与 UI 存版同源。公开 API **不**暴露 connector 任意 SQL 或 mutate 生产库。

## 30 秒打开文档（建议路径）

1. 阅读 [数据格式说明]({{DOC:data-format}})（projectJSON）与 [ADR-0013]({{DOC:adr/0013-public-api-mcp}})（API/MCP）。
2. 本地或自托管实例：登录 → 账户设置 → 铸造只读 PAT → `curl /api/v1/me` 探活。
3. 需要 Agent 集成时，按 [MCP 说明]({{GH:mcp/README.md}}) 配 stdio 或 HTTP 传输。

读路径：`GET /api/v1/projects/{id}` 返回成员可见项目的 projectJSON（密钥字段已清）；版本详情同理。写路径：`POST …/versions` 等价于 UI「保存版本」，请给版本号与说明，便于人工 diff 审计。

{{CTA}}

## 与「AI 产品」的刻意距离

我们**不做**黑盒「AI 一键建模」作为主叙事；ADR 明确后置自研 LLM 与噱头营销。价值在于：

- 设计变更**可 diff、可回滚、可审批**；
- Agent 读写**同一份** auditable JSON；
- 开源 MIT，自托管数据不出内网。

若你在搭内部 data catalog、schema lint 或 CI 守门，projectJSON + API 比截图/PDF 可靠一个数量级。

与「ChatGPT 生成一张 ER」相比，差别在于：**每一版可命名、可 diff、可回滚、可审批**；Agent 只是多一个读写客户端，不是替代人类评审的黑盒。产品内 PAT / OAuth Client 管理 UI 在账户设置，同意页对 Authorization Code 流显式 Allow/Deny，避免静默授权。

## 路线图与参与

- 文档 / JSON Schema / ADR：[文档站]({{DOCS}})
- Issue / PR：[GitHub 仓库]({{REPO}})

PAT/OAuth 管理 UI 已在产品内；dogfood 脚本见 [MCP 说明]({{GH:mcp/README.md}})。
