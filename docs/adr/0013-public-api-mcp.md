# ADR-0013：公开 API / MCP

- 状态：**✅ 已接受**（人工解封 2026-08-04；切片 1–5 ✅ + `projects:write` REST/MCP ✅ + Redis 限流 ✅ + **OAuth 切片 A+B** ✅ + **client / PAT 管理 UI** ✅ + **同意页** ✅ + **refresh_token** ✅；**OIDC 仍后置**）
- 决策者：项目维护者（Vision 自动轨暂停点 `785d699` 后**显式选择**本 ADR 为下一里程碑）
- 前置：[ADR-0012](./0012-ai-era-data-structure-platform.md) 选项 B 已接受；[ADR-0016](./0016-experience-first-shareable-diagram.md) 本季「禁 MCP 产品码」由本人工决策**专项解封**（仅本里程碑，不重开版本分支 / live sync）

## 背景

ADR-0012 将「API/MCP 开放」列为平台级能力：agent 可读 schema、可提交新版本。公开 API 与 MCP server 引入新的鉴权面、速率限制与 scope 模型，不宜与落地页叙事同轮拍板实现。

触发条件现状：落地页 ✅；schema-as-code ✅；需求 = 内部 dogfood + agent 可读事实源（adopt-first）。

## 决策（已拍板 · adopt-first / MIT）

| 议题 | 决策 |
|---|---|
| 鉴权模型 | **Personal Access Token（PAT）** + **OAuth**（client_credentials + Authorization Code/PKCE + refresh_token）。PAT 前缀 `erd_pat_`；OAuth access token 前缀 `erd_oat_`；refresh 前缀 `erd_ort_`；auth code 前缀 `erd_ac_`。均 `Authorization: Bearer <token>` 调 `/api/v1/**`（**仅** PAT/OAT；refresh **不可**直调 API）。会话 JWT **不**接受于 `/api/v1/**`。 |
| OAuth（分切片） | **切片 A（✅）**：机器对机器 — 注册 confidential client → `POST /oauth/token` `grant_type=client_credentials` → 短期 `erd_oat_`（默认 TTL 3600s）。以**注册人**身份访问。**不**签发 refresh。 **切片 B（✅）**：浏览器 Authorization Code + **强制 PKCE S256** — `GET /oauth/authorize`（会话 JWT）→ 同意页预览 JSON；产品 UI `/oauth/authorize` 显式 Allow/Deny；`POST decision=allow` 才签发 `erd_ac_` → `POST /oauth/token` `authorization_code` + `code_verifier` → `erd_oat_` + `erd_ort_`。Deny → `error=access_denied`。以**授权用户**身份访问。public client 无 secret；confidential 换票仍须 secret。 **post-MVP refresh（✅）**：仅 auth code 签发 `erd_ort_`（SHA-256）；`grant_type=refresh_token` **轮换**（旧票作废 + 新 access/refresh 同 `family_id`）；复用已吊销 refresh → **整族吊销**；`POST /oauth/revoke`（RFC 7009 风格）+ 吊销 client 一并失效 refresh。 |
| 密钥存储 | **只存 SHA-256 hex**（PAT / client_secret / OAT / ORT / auth code）。明文仅在铸造/换票/授权响应出现一次。禁止明文/可逆加密入库。 |
| Client 类型 | `confidential`（默认，可 `client_credentials`，须 secret）/ `public`（SPA，无 secret，**禁止** client_credentials，须注册 `redirectUris`）。`redirect_uri` **精确字符串匹配**（禁 fragment；仅 `https` 或 `http://localhost\|127.0.0.1\|[::1]`）。 |
| PKCE / CSRF | 仅 `code_challenge_method=S256`（拒 `plain`）；`state` 必填；auth code 默认 TTL 120s（`ERD_PUBLIC_API_OAUTH_CODE_TTL`）、单次消费；未注册 redirect **永不** 302（防开放重定向）。 |
| Scope（本里程碑） | 默认可铸造：`projects:read`、`versions:read`。**已解锁写**：`projects:write`、`versions:write`（须显式列入 `scopes`；默认仍只读）。OAuth client 注册 scope 与 PAT 同一 `PatScopes` 白名单；换票 `scope` 须 ⊆ 客户端已注册。 |
| 速率限制 | 默认 **60 req/min/token**（`erd.public-api.rate-limit-per-minute` / `ERD_PUBLIC_API_RATE_LIMIT`）；**Redisson `RRateLimiter`** 集群共享配额（key `erd:public-api:rl:<pat\|oat\|ip>`）；超限 HTTP 429 + `Retry-After`。写与读共用该配额。Redis 不可用时 **fail-closed** → HTTP 503（不回落进程内存，避免多实例旁路）。 |
| MCP tool 清单 | 只读五件套 + **`create_version`**（`versions:write`）+ **`update_project`** / **`put_project_json`**（`projects:write`）→ REST + PAT（亦可用 OAT）。传输：stdio（默认）+ Streamable HTTP（`--http`）。 |
| 与分享 / SQL 边界 | PAT/OAT ≠ [ADR-0007](./0007-readonly-project-share.md) 分享 token（分享仍匿名只读单项目）。公开 API **不**暴露 connector / mutate SQL；写路径复用成员 ACL，写入前清空 `profile.dbs`（ADR-0008）。 |
| OpenAPI | springdoc 分组 `public-v1`；**prod 仍关** `springdoc.*.enabled`（既有门控，不因 demo 放宽）。 |
| CORS | 换票 `/oauth/token` 与吊销 `/oauth/revoke` 匿名放行**不**放宽 CORS；仍走既有 `CrossOriginPolicy`（prod 拒 `*`）。authorize 须会话 JWT，同样不另开 CORS。 |

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
| B | Authorization Code + PKCE S256（public/confidential；authorize + token） | ✅ 2026-08-04 |
| — | 产品内 OAuth client 管理 UI（`/account/settings?selectKey=oauthClients`） | ✅ 2026-08-04 |
| — | 产品内 PAT 管理 UI（`/account/settings?selectKey=personalAccessTokens`） | ✅ 2026-08-04 |
| — | 同意页（`/oauth/authorize` Allow/Deny；GET 预览不签发 code） | ✅ 2026-08-04 |
| — | **refresh_token**（`erd_ort_`；轮换 + 复用检测；`/oauth/revoke`；仅 auth code） | ✅ 2026-08-04 |

## 后果

- 正面：agent / 脚本有一等鉴权面；M2M 与浏览器三方应用均可 OAuth；北极星可计量「API 产生的版本保存」护栏有挂点；浏览器客户端可用 refresh 续期而无需反复弹同意页
- 代价：新令牌面须吊销/过期/限流运维；文档须强调「明文只见一次」；写 scope 扩大爆破半径须最小权限铸造；OAuth client 吊销须使已发 OAT/ORT 与未消费 code 失效；auth code 流量以授权用户身份访问（异于 client_credentials 的注册人身份）；refresh 复用检测会整族吊销（防盗用，合法并发客户端须串行刷新）
- 明确不做（仍后置）：产品内黑盒「一句话生成 ERD」；自研 LLM；**OpenID Connect**（discovery / `id_token` / userinfo）/ 第三方登录联邦
