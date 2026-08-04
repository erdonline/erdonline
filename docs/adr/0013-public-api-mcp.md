# ADR-0013：公开 API / MCP

- 状态：**🚧 进行中**（人工解封 2026-08-04；切片 1–3 ✅ PAT + projects/versions 只读）
- 决策者：项目维护者（Vision 自动轨暂停点 `785d699` 后**显式选择**本 ADR 为下一里程碑）
- 前置：[ADR-0012](./0012-ai-era-data-structure-platform.md) 选项 B 已接受；[ADR-0016](./0016-experience-first-shareable-diagram.md) 本季「禁 MCP 产品码」由本人工决策**专项解封**（仅本里程碑，不重开版本分支 / live sync）

## 背景

ADR-0012 将「API/MCP 开放」列为平台级能力：agent 可读 schema、可提交新版本。公开 API 与 MCP server 引入新的鉴权面、速率限制与 scope 模型，不宜与落地页叙事同轮拍板实现。

触发条件现状：落地页 ✅；schema-as-code ✅；需求 = 内部 dogfood + agent 可读事实源（adopt-first）。

## 决策（已拍板 · adopt-first / MIT）

| 议题 | 决策 |
|---|---|
| 鉴权模型 | **Personal Access Token（PAT）**。前缀 `erd_pat_`；`Authorization: Bearer <token>`。会话 JWT **不**接受于 `/api/v1/**`。OAuth client / 第三方应用后置。 |
| 密钥存储 | **只存 SHA-256 hex**（`personal_access_token.token_hash`）；明文仅在铸造响应出现一次。禁止明文/可逆加密入库。 |
| Scope（本里程碑） | 先读后写。**已解锁铸造**：`projects:read`、`versions:read`（默认两者）。**未解锁**：`projects:write`、`versions:write`（名预留，铸造拒绝）。 |
| 速率限制 | 默认 **60 req/min/token**（`erd.public-api.rate-limit-per-minute` / `ERD_PUBLIC_API_RATE_LIMIT`）；进程内滑动窗口骨架；超限 HTTP 429 + `Retry-After`。集群 Redis 后置。 |
| MCP tool 清单 | **本切片不做 MCP server**。待只读 REST（项目/版本）稳定后：先 `get_project_schema` / `list_versions`，再写版本。 |
| 与分享 / SQL 边界 | PAT ≠ [ADR-0007](./0007-readonly-project-share.md) 分享 token（分享仍匿名只读单项目）。公开 API **不**暴露 connector / mutate SQL；写路径日后复用审批/ACL 同级约束。 |
| OpenAPI | springdoc 分组 `public-v1`；**prod 仍关** `springdoc.*.enabled`（既有门控，不因 demo 放宽）。 |

## 切片进度

| # | 交付 | 状态 |
|---|---|---|
| 1 | PAT 表（哈希）+ 铸造/列表/吊销 + `/api/v1/me` + 限流骨架 + OpenAPI 分组 | ✅ 2026-08-04 |
| 2 | `GET /api/v1/projects`、`GET /api/v1/projects/{id}`（成员 ACL，projectJSON 只读，密钥纪律） | ✅ 2026-08-04 |
| 3 | `GET /api/v1/projects/{id}/versions`（及单版本详情） | ✅ 2026-08-04 |
| 4 | MCP server 骨架（stdio/HTTP）只读 tool → 上列 REST | 📋 |
| 5 | 写 scope + `POST …/versions`（保存=提交）；配额与审计 | 📋 |

## 后果

- 正面：agent / 脚本有一等鉴权面；北极星可计量「API 产生的版本保存」护栏有挂点
- 代价：新令牌面须吊销/过期/限流运维；文档须强调「明文只见一次」
- 明确不做：产品内黑盒「一句话生成 ERD」；自研 LLM；本切片不写 MCP 进程
