# ADR-0013：公开 API / MCP

- 状态：**🚧 进行中**（人工解封 2026-08-04；切片 1–5 ✅ + `projects:write` REST/MCP ✅ + Redis 限流 ✅ + **OAuth 切片 A** ✅；余 Authorization Code / PKCE）
- 决策者：项目维护者（Vision 自动轨暂停点 `785d699` 后**显式选择**本 ADR 为下一里程碑）
- 前置：[ADR-0012](./0012-ai-era-data-structure-platform.md) 选项 B 已接受；[ADR-0016](./0016-experience-first-shareable-diagram.md) 本季「禁 MCP 产品码」由本人工决策**专项解封**（仅本里程碑，不重开版本分支 / live sync）

## 背景

ADR-0012 将「API/MCP 开放」列为平台级能力：agent 可读 schema、可提交新版本。公开 API 与 MCP server 引入新的鉴权面、速率限制与 scope 模型，不宜与落地页叙事同轮拍板实现。

触发条件现状：落地页 ✅；schema-as-code ✅；需求 = 内部 dogfood + agent 可读事实源（adopt-first）。

## 决策（已拍板 · adopt-first / MIT）

| 议题 | 决策 |
|---|---|
| 鉴权模型 | **Personal Access Token（PAT）** + **OAuth client_credentials（切片 A）**。PAT 前缀 `erd_pat_`；OAuth access token 前缀 `erd_oat_`。均 `Authorization: Bearer <token>` 调 `/api/v1/**`。会话 JWT **不**接受于 `/api/v1/**`。 |
| OAuth（分切片） | **切片 A（✅）**：机器对机器 — 注册 OAuth client（`erd_cli_` / 密文 `erd_cs_` 仅见一次、库存 SHA-256）→ `POST /oauth/token` `grant_type=client_credentials` → 短期 `erd_oat_`（默认 TTL 3600s，`ERD_PUBLIC_API_OAUTH_TTL`）。以**注册人**用户身份 + 客户端 scope 访问 `/api/v1`。 **切片 B（📋）**：浏览器 Authorization Code + 可选 PKCE（第三方 UI 应用）；本切片不做。 |
| 密钥存储 | **只存 SHA-256 hex**（PAT `token_hash`；client `client_secret_hash`；OAT `token_hash`）。明文仅在铸造/换票响应出现一次。禁止明文/可逆加密入库。 |
| Scope（本里程碑） | 默认可铸造：`projects:read`、`versions:read`。**已解锁写**：`projects:write`、`versions:write`（须显式列入 `scopes`；默认仍只读）。OAuth client 注册 scope 与 PAT 同一 `PatScopes` 白名单；换票 `scope` 须 ⊆ 客户端已注册。 |
| 速率限制 | 默认 **60 req/min/token**（`erd.public-api.rate-limit-per-minute` / `ERD_PUBLIC_API_RATE_LIMIT`）；**Redisson `RRateLimiter`** 集群共享配额（key `erd:public-api:rl:<pat\|oat\|ip>`）；超限 HTTP 429 + `Retry-After`。写与读共用该配额。Redis 不可用时 **fail-closed** → HTTP 503（不回落进程内存，避免多实例旁路）。 |
| MCP tool 清单 | 只读五件套 + **`create_version`**（`versions:write`）+ **`update_project`** / **`put_project_json`**（`projects:write`）→ REST + PAT（亦可用 OAT）。传输：stdio（默认）+ Streamable HTTP（`--http`）。 |
| 与分享 / SQL 边界 | PAT/OAT ≠ [ADR-0007](./0007-readonly-project-share.md) 分享 token（分享仍匿名只读单项目）。公开 API **不**暴露 connector / mutate SQL；写路径复用成员 ACL，写入前清空 `profile.dbs`（ADR-0008）。 |
| OpenAPI | springdoc 分组 `public-v1`；**prod 仍关** `springdoc.*.enabled`（既有门控，不因 demo 放宽）。 |
| CORS | 换票 `/oauth/token` 匿名放行**不**放宽 CORS；仍走既有 `CrossOriginPolicy`（prod 拒 `*`）。 |

## 切片进度

| # | 交付 | 状态 |
|---|---|---|
| 1 | PAT 表（哈希）+ 铸造/列表/吊销 + `/api/v1/me` + 限流骨架 + OpenAPI 分组 | ✅ 2026-08-04 |
| 2 | `GET /api/v1/projects`、`GET /api/v1/projects/{id}`（成员 ACL，projectJSON 只读，密钥纪律） | ✅ 2026-08-04 |
| 3 | `GET /api/v1/projects/{id}/versions`（及单版本详情） | ✅ 2026-08-04 |
| 4 | MCP server 骨架（stdio/HTTP）只读 tool → 上列 REST | ✅ 2026-08-04 |
| 5 | 写 scope + `POST …/versions`（保存=提交）+ MCP `create_version`；限流配额 + 创建日志审计 | ✅ 2026-08-04 |
| — | `PATCH /api/v1/projects/{id}` + `PUT …/projectJSON`（`projects:write` + 成员；清 `profile.dbs`） | ✅ 2026-08-04 |
| — | Redis / Redisson 集群限流（替换进程内骨架；fail-closed） | ✅ 2026-08-04 |
| — | MCP `update_project` / `put_project_json`（`projects:write`） | ✅ 2026-08-04 |
| A | OAuth client 注册/列表/吊销 + `client_credentials` → `erd_oat_` 调 `/api/v1` | ✅ 2026-08-04 |
| B | Authorization Code (+ 可选 PKCE) 浏览器三方应用 | 📋 后置 |

## 后果

- 正面：agent / 脚本有一等鉴权面；机器对机器可用 OAuth client 而不共享个人 PAT；北极星可计量「API 产生的版本保存」护栏有挂点
- 代价：新令牌面须吊销/过期/限流运维；文档须强调「明文只见一次」；写 scope 扩大爆破半径须最小权限铸造；OAuth client 以注册人身份访问，吊销 client 须使已发 OAT 失效
- 明确不做（仍后置）：产品内黑盒「一句话生成 ERD」；自研 LLM；切片 B 浏览器 code flow
