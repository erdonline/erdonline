# 安全模型（开源自托管）

## VIP / 限额

开源版**不启用**人数、个人项目数、团队项目数、版本数、AI 次数等 VIP 拦截（`VIPRightsAspect` 放行）。License 上传接口仍保留，但不作为功能门禁。

## 种子账号

| 账号 | 用途 | 默认密码 |
|---|---|---|
| `admin` | 运维/手工 | `123456`（dev 可用；prod 默认拒绝该口令） |
| `e2e0`..`e2e15` | Playwright 并发隔离（≤16 worker） | `123456` |
| `e2e-serial` | chromium-serial 空态用例 | `123456` |

防护：

- `erd.security.e2e-accounts-enabled`：`dev`=true，`prod`/默认=false → 生产拒绝 `e2e\\d+` / `e2e-serial` 登录
- `erd.security.allow-demo-admin`：`dev`=true，`prod`/默认=false → 生产拒绝用户名 `admin` + 种子口令 `123456`（改密后不受影响）；逃生阀 `ERD_ALLOW_DEMO_ADMIN=true`
- `erd.security.allow-open-register`：`dev`=true，`prod`/默认=false → 生产拒绝匿名开放注册；逃生阀 `ERD_ALLOW_OPEN_REGISTER=true`
- 公网部署应改密 `admin`、删除 `e2e*` 用户；见 [deployment.md](./deployment.md)

## SQL 执行

设计器内 JDBC/同步走登录会话与（团队）审批路径；开源版 VIP 权益切面**不**拦截次数。

| 路径 | 门禁 |
|---|---|
| `queryInfo/exec`、`queryInfo/explain` | `SqlGuard.assertReadOnly`：单语句 SELECT / EXPLAIN / SHOW / DESC（jsqlparser + 词首回退）；禁多语句、GRANT/OUTFILE 等 |
| `connector/sqlexec`、`dbsync` | **mutate**：允许同步所需 DDL/DML；`SqlGuard.assertMutateAllowed` 拒 GRANT/REVOKE/CREATE USER/INTO OUTFILE/LOAD DATA LOCAL 等；**强制** `dataSourceId`（`applyMutate`，拒 raw JDBC+账密） |
| `connector/ping|dbReverse*|…` | `JdbcUrlGuard`：仅 `jdbc:mysql\|mariadb\|postgresql\|oracle:(thin\|oci)\|sqlserver`；禁链路本地 / 云 IMDS（字面量 + **DNS 解析后任意 A/AAAA** 命中 `169.254.0.0/16`、`168.63.129.16`、`100.100.100.200`、`fe80::/10`、`fd00:ec2::254`、元数据主机名）；连接前 **`assertAllowedAndPin`** 把主机名改写为已放行 IP（关 check→connect TOCTOU）；**不**禁 RFC1918/localhost（PaaS 私网库如 Railway `MYSQLHOST`）；`dataSourceId` 优先（`ConnectorCredentialResolver.apply` → ACL 后覆盖客户端 JDBC 字段） |

FE 热路径（已保存数据源）：ping / dbReverse* / sqlexec / dbsync 传 `dataSourceId`，客户端不附带 url/username/password（`preferDataSourceIdPayload`）。无 id 的 raw JDBC **仅**留给 ping / dbReverse*（试连与新建未保存 UX）；sqlexec/dbsync 后端硬拒。

## 匿名放行（前缀剥离后路径）

- 登录/退出：`/login`、`/auth/login`、`/exit`
- 注册：仅 `/project/group/user/register`（前端 `POST /ncnb/project/group/user/register`）；受 `erd.security.allow-open-register` 门控（`dev`=true，`prod`/默认=false）；重复入口 `/user/register` 已去 HTTP 映射并不再 ignore
- 第三方 IdP 联邦（ADR-0021）：`/federate/providers`、`/federate/{google|wechat}`、`/federate/{google|wechat}/callback`、`/federate/session`（及 `/auth/federate/…` 前缀形态）；**不含** `/federate/links/**`（须会话 JWT）
- 只读分享：**仅** `GET /share/{token}`（及 `/ncnb/share/{token}` 前缀剥离前形态），见 ADR-0007；`create` / `revoke` / `fork` **不在** ignore-urls（需登录）
- Actuator：`/actuator/**` 放行，但 **exposure 仅 `health,info`**；`health` 不 `show-details`；`info` 仅 app name/version（无密钥）。禁止扩大到 env/beans/heapdump
- OpenAPI / Swagger UI：Security 仍对 `/v3/api-docs/**`、`/swagger-ui/**`（及 `/webjars/**`）匿名放行；**唯一门控**为 `springdoc.api-docs.enabled` / `springdoc.swagger-ui.enabled`（`prod`=false）。本地/dev 默认开启。已无 `martin.swagger` / `martin.resource-server` 配置键。

## 第三方登录 IdP 联邦（ADR-0021）

- **方向**：Google / 微信 → 本系统会话 JWT（与账密登录同构）；**不是** ADR-0013 对外 IdP（PAT/`erd_oat_`）
- **Google**：Authorization Code + OIDC（`openid email profile`）；须 `email_verified`；subject=`sub`；可按邮箱绑定已有用户
- **微信**：开放平台网站应用扫码（`snsapi_login`）；subject 优先 `unionid` 否则 `openid`；**不做**公众号网页授权
- **存储**：`user_identity_link`（仅 subject；无 token）；短票 Redis `erd:federate:session:*`（回调后换票，JWT 不进 URL）
- **开关**：`GOOGLE_*` / `WECHAT_*` 三项齐全才启用；缺则 `/auth/federate/providers` 对应 `false`，启动不崩溃
- **建号**：无链接且无邮箱匹配时走 `erd.security.allow-open-register`；关闭则提示先账密登录再绑定
- **UI**：登录页条件按钮；`/account/settings?selectKey=security` 绑定/解绑；落地 `/login/federate?ticket=`
- **明确不做**：回潮 `/login/success`、`/account/settings/wechat`、`/auth/oauth2/**`、password-grant

## 只读分享

- 创建/吊销需登录且为项目创建人（UI：设计器顶栏「分享」弹层）
- 匿名响应按 ADR-0008 **清空** `profile.dbs`（连接只在 `data_sources`）；可保留 `defaultDataSourceId` 引用

## 公开 API PAT / OAuth（ADR-0013）

- **PAT 铸造**：会话 JWT → `POST /auth/personal-access-tokens`（前缀剥离后 `/personal-access-tokens`）；明文 `erd_pat_…` **仅响应一次**
- **OAuth 切片 A（M2M）**：会话 JWT → `POST /auth/oauth-clients` 注册 confidential（默认；`client_id`=`erd_cli_…`，`client_secret`=`erd_cs_…` **仅响应一次**）→ 匿名 `POST /oauth/token`（`grant_type=client_credentials`，body 或 Basic）→ `access_token`=`erd_oat_…`（默认 TTL 3600s，`ERD_PUBLIC_API_OAUTH_TTL`）。列表/吊销：`GET|DELETE /auth/oauth-clients`。吊销 client 使未过期 OAT 与未消费 auth code 失效。
- **OAuth 切片 B（浏览器 + PKCE）**：注册时可选 `clientType=public|confidential` + `redirectUris[]`（精确匹配；仅 https 或 localhost/127.0.0.1/[::1]）。产品同意页 `/oauth/authorize`（AuthBrandShell）。`GET /oauth/authorize`（**须会话 JWT**）→ 同意预览 JSON（client 名 / scopes / redirect host；**不**签发 code）。`POST … decision=allow` → 302（或 `Accept: application/json` → `{redirect_to}`）`?code=erd_ac_…&state=`；`decision=deny` → `error=access_denied`。匿名 `POST /oauth/token` `grant_type=authorization_code` + `code` + `redirect_uri` + `code_verifier`（public 无 secret；confidential 须 secret）→ `erd_oat_…` + `erd_ort_…`（refresh）。auth code 仅 SHA-256、默认 TTL 120s（`ERD_PUBLIC_API_OAUTH_CODE_TTL`）、单次消费。未注册 redirect **永不** 302。
- **OAuth refresh（post-MVP）**：仅 `authorization_code` 换票签发 refresh（`client_credentials` **不**发）。`POST /oauth/token` `grant_type=refresh_token` → **轮换**（旧 `erd_ort_` 立即吊销，新 access+refresh 同 `family_id`）；提交已吊销 refresh → 整族 OAT/ORT 吊销 + `invalid_grant`。TTL：`ERD_PUBLIC_API_OAUTH_REFRESH_TTL`（默认 2592000s / 30 天）。`POST /oauth/revoke`（token + client 认证；RFC 7009 未知票仍 200）。吊销 client → 未过期 OAT/ORT + 未消费 code 一并失效。
- **OIDC（RS256 + JWKS）+ nonce/at_hash**：`GET /.well-known/openid-configuration`（issuer=`ERD_OIDC_ISSUER` 或 `ERD_UI_URL`）；`id_token` **RS256**（`ERD_OIDC_RSA_PRIVATE_KEY` / `_PATH` / PKCS12；prod fail-fast；与 `JWT_SECRET` 分离；已废 `ERD_OIDC_HMAC`）；`GET /.well-known/jwks.json` 发布公钥（`kid`）。授权码/refresh 且 scope 含 `openid` → 换票附 `id_token`；`client_credentials` 不发。authorize 可选 `nonce` → 绑定 auth code → code 换票回显；**refresh 续期 id_token 不含 nonce**（OIDC Core §12.2）。`at_hash` 按同响应 access_token 计算（SHA-256 左半 + base64url）。`GET /oauth/userinfo`：Bearer `erd_oat_` + `openid`（拒 PAT/会话 JWT）。
- **存储**：表 `personal_access_token` / `oauth_api_client` / `oauth_access_token` / `oauth_authorization_code` / `oauth_refresh_token` 仅哈希 + hint；禁止明文入库存仓
- **调用**：`Authorization: Bearer erd_pat_…` **或** `erd_oat_…` → `/api/v1/**`（独立 SecurityFilterChain；**不接受**会话 JWT / refresh）。`client_credentials` OAT 以**注册人**身份；`authorization_code` / refresh 续期的 OAT 以**授权用户**身份。
- **Scope（已解锁）**：默认 `projects:read`、`versions:read`；可显式铸造 `projects:write`、`versions:write`、`openid`（OAuth 注册同 `PatScopes`；换票 `scope` ⊆ 客户端）
- **只读项目**：`GET /api/v1/projects`、`GET /api/v1/projects/{id}` 需 `projects:read` + `project_user` 成员；详情 `projectJSON` 清空 `profile.dbs`（ADR-0008）
- **只读版本**：`GET /api/v1/projects/{id}/versions`、`…/versions/{versionId}` 需 `versions:read` + 成员；列表不含 `projectJSON`；详情清空 `profile.dbs`
- **提交版本**：`POST /api/v1/projects/{id}/versions` 需 `versions:write` + 成员；body `projectJSON`/`snapshot`；写入前清空 `profile.dbs`；仅 insert（忽略客户端 id）；会话 JWT 不接受
- **写项目**：`PATCH /api/v1/projects/{id}`（元数据）与 `PUT /api/v1/projects/{id}/projectJSON` 需 `projects:write` + 成员；PUT 写入前清空 `profile.dbs`
- **MCP**：仓库 `mcp/` 经 PAT（或等价 OAT）调上列 REST；stdio / Streamable HTTP；写 tools：`create_version`（`versions:write`）、`update_project` / `put_project_json`（`projects:write`）。见 [`mcp/README.md`](../mcp/README.md)
- **限流**：默认 60/min/token（`ERD_PUBLIC_API_RATE_LIMIT`）；Redisson 集群共享；超限 429；Redis 不可用 fail-closed → 503（读写共用）
- **后置**：~~第三方 IdP 联邦~~ → 见 [ADR-0021](./adr/0021-idp-federation-google-wechat.md)；**不**因换票/吊销/userinfo/discovery 匿名口放宽 CORS
- **产品 UI**：
  - `/account/settings?selectKey=personalAccessTokens` — 列表 / 铸造（scopes + 可选过期）/ 明文一次揭示 / 吊销
  - `/account/settings?selectKey=oauthClients` — 列表 / 注册（含 `openid`）/ 复制 `client_id` / `client_secret` 创建时一次揭示（不可再查看）/ 吊销
  - `/oauth/authorize` — OAuth 同意（client / scopes / redirect host + Allow/Deny）
- **边界**：≠ 分享 token；不暴露 connector/mutate SQL；prod 仍关 springdoc；public client **禁止** `client_credentials`

## projectJSON 密钥纪律

JDBC 连接机密（url / username / password / driver）**不得**写入 `projectJSON`（[ADR-0008](./adr/0008-datasource-isolation.md)）。对外字段说明与兼容政策见 [data-format.md](./data-format.md)。

## 已知风险（后端登记，2026-08-03）

梳理范围：Spring Security / JWT / CORS / springdoc / datasource / Redis / 用户库 SQL 执行 / 上传 / admin / actuator / SocketIO / 密钥与 ignore-urls / 项目 ACL / 死配置。下列为**已核实**安全或生产风险（非泛 code smell）。级别：P0 公网可利用或密钥可预测；P1 需登录但横向越权/破坏面大；P2 收紧面或误导运维。

### 鉴权暴露面

| ID | 级别 | 项 | 证据 | 现状 | 建议 |
|---|---|---|---|---|---|
| R-AUTH-01 | P0 | ~~匿名 `GET /user/loadUserByUsername/{username}` 泄露用户密文与权限~~ | ~~ignore-urls + Service `@RestController`~~ | **✅ 已关闭（2026-08-03）**：去掉 ignore；`RemoteSystemUser.loadUserByUsername` 去 `@GetMapping`（仅进程内）；`User.pwd`/`salt` `@JsonProperty(WRITE_ONLY)` | 保持无 HTTP 映射；勿回 ignore |
| R-AUTH-02 | P1 | ~~`UserController` CRUD 无 `@PreAuthorize`~~ | ~~`UserController` CRUD~~ | **✅ 已关闭（2026-08-03）**：CRUD/`page`/`batch` 补 `sys_user_*` `@PreAuthorize`；`pwd`/`salt` 仍 `WRITE_ONLY` | 保持；管理写操作优先 Extension `/user/add` `/user/update` |
| R-AUTH-03 | P1 | ~~项目/模型 IDOR：按 id 读写不校验成员~~ | ~~`ProjectServiceImpl` / `ProjectController` delete/update/get~~ | **✅ 已关闭（2026-08-03）**：`ProjectAcl` 查 `project_user`；get/info/save/update/delete（个人+团队）均 `assertMember` | 设计器旁路/SocketIO 成员检见 R-AUTH-05 |
| R-AUTH-04 | P1 | ~~`dataSources` 读/改/删无归属校验~~ | ~~`DataSourcesController` get/update/delete~~ | **✅ 已关闭（2026-08-03）**：`DataSourceAcl` 校验 creator（username/userId）；tree 亦按 creator 过滤；禁止更新改写 creator | 保持；与 R-DATA-02 热路径走已鉴权 id |
| R-AUTH-05 | P1 | ~~SocketIO 仅验短票/JWT，不验项目成员~~ | ~~`SocketIoAuthorizationListener` / `JOIN_ROOM`~~ | **✅ 已关闭（2026-08-03）**：短票载荷含 `userId`；握手 + `JOIN_ROOM` 均 `ProjectAcl.isMember`；cursor/sync 仅已入房会话可广播 | 保持；成员多人协作见 `verify-socket-presence` / `verify-socket-membership` |
| R-AUTH-06 | P2 | ~~开放注册双入口~~ | ~~ignore：`/user/register`；产品：`/project/group/user/register`~~ | **✅ 已关闭（2026-08-03）**：去 `RemoteSystemUser.userRegister` HTTP 映射；ignore 仅留产品路径；`allow-open-register` prod/默认=false，`dev`=true；`ERD_ALLOW_OPEN_REGISTER=true` 逃生 | 公网勿开；需自注册自托管显式开阀 |
| R-AUTH-07 | P2 | ~~`frameOptions` 关闭~~ | ~~`ErdSecurityConfiguration.java:63`~~ | **✅ 已关闭（2026-08-03）**：`headers.frameOptions.deny()`；分享为 SPA `/share/:token`，不 iframe 嵌 API | 保持 DENY；第三方嵌 UI 走前端托管 CSP `frame-ancestors`，勿在此链 `disable` |

### 配置与密钥

| ID | 级别 | 项 | 证据 | 现状 | 建议 |
|---|---|---|---|---|---|
| R-CFG-01 | P0 | ~~`JWT_SECRET` 有仓库默认值，prod 未 fail-fast~~ | ~~`application.yml` 弱默认；prod 未覆盖~~ | **✅ 已关闭（2026-08-03）**：`application-prod.yml` `erd.jwt.secret: ${JWT_SECRET}` 无默认；`JwtConfig` prod 拒 blank/仓库开发默认串；本地/dev 保留 DX 默认 | 保持 prod 无默认；公网/demo 须旋转且 ≠ 仓库串 |
| R-CFG-02 | P0 | ~~种子 `admin`/`123456`~~ | ~~`security-model` 种子表；Flyway `V3`/`V6`~~ | **✅ 已关闭（2026-08-03）**：`allow-demo-admin` prod/默认=false，拒绝 `admin`+`123456`；`dev`=true 保本地 dogfood；`ERD_ALLOW_DEMO_ADMIN=true` 逃生 | 公网改密 admin；勿开 `ERD_ALLOW_DEMO_ADMIN` |
| R-CFG-03 | P1 | ~~应用库 JDBC `useSSL=false` + `allowPublicKeyRetrieval=true`~~ | ~~`application.yml` 双 DS jdbc-url~~ | **✅ 已关闭（2026-08-03）**：双 DS 经 `MYSQL_USE_SSL` / `MYSQL_REQUIRE_SSL` / `MYSQL_ALLOW_PUBLIC_KEY_RETRIEVAL`；`dev`/默认关 SSL；`prod` 默认 `useSSL`+`requireSSL` 且关 public-key retrieval；compose 显式关 SSL 保无 TLS 本地 MySQL | 公网/Railway 勿关 SSL；私网无 TLS 逃生阀显式 `MYSQL_USE_SSL=false` |
| R-CFG-04 | P1 | ~~CORS 依赖 `CORS_ALLOWED_ORIGINS`；SocketIO `origin:*`~~ | ~~`CorsConfig`；`application.yml` SocketIO origin~~ | **✅ 已关闭（2026-08-03）**：`CrossOriginPolicy` prod 拒 CORS/SocketIO `*`；prod 单一 `ERD_UI_URL` → `martin.ui.url` + `martin.socketio.origin`（无嵌套别名）；本地/dev 保留 `*` + localhost CORS | 公网必设 `ERD_UI_URL`；勿 `*` / 空串；勿再设 `SOCKETIO_ORIGIN`/`CORS_ALLOWED_ORIGINS` |
| R-CFG-05 | P2 | ~~OSS / MinIO 默认密钥进 yml~~ | ~~扁平 `martin.oss.accessKey` 弱默认；prod 强制假占位~~ | **✅ 已关闭（2026-08-03）**：嵌套 `martin.oss.minio.*` + 空默认（无仓库密钥）；prod 不再强制 `OSS_*`；启用时 `OssCredentialGuard` 拒 `minio`/`minio123` | 启用 MinIO 时设 `OSS_ENDPOINT`+旋转密钥；勿示例真密钥 |
| R-CFG-06 | P2 | ~~`.env.example` 残留 `OAUTH_CLIENT_*`~~ | ~~`.env.example` OAuth 死键~~ | **✅ 已关闭（2026-08-03）**：删 `OAUTH_CLIENT_*`；改为可选 OSS 注释段 | 勿回挂 password-grant 客户端键 |

### 数据面（SQL / 文件 / 出站）

| ID | 级别 | 项 | 证据 | 现状 | 建议 |
|---|---|---|---|---|---|
| R-DATA-01 | P0 | ~~`queryInfo/exec`：`${sql}` 无语句白名单~~ | ~~`QueryInfoMapper.xml`；`QueryInfoServiceImpl`~~ | **✅ 已关闭（2026-08-03）**：`SqlGuard.assertReadOnly` 仅 SELECT/EXPLAIN/SHOW/DESC；禁多语句 | 保持只读白名单；`${sql}` 仍为动态执行面，勿扩 DML |
| R-DATA-02 | P0 | ~~`connector/*` 任意 JDBC + SQL~~ | ~~`AbstractDBCommand` / `DbSqlExecCommand` / `PingDBCommand`~~ | **✅ 关闭（2026-08-03）**：`JdbcUrlGuard`（协议 + IMDS/链路本地字面量 + resolve 后再判 + **pin 解析 IP 再 connect**）；mutate 拒 GRANT/OUTFILE；**`dataSourceId`→ACL**；**sqlexec/dbsync 强制 id**（ping/reverse 仍可 raw） | 保持；残余：raw ping/reverse 仍可带 JDBC；TLS `VERIFY_IDENTITY` 钉 IP 后靠证书 IP SAN（私网库通常关 SSL） |
| R-DATA-03 | P1 | ~~`GitlabController` 硬编码第三方账密~~ | ~~`GitlabController.java:41`~~ | **✅ 已关闭（2026-08-03）**：删除 Controller/Service/Vo + `gitlab4j-api` 依赖 | 勿回挂 `/ci/**`；泄露口令视为已公开勿复用 |
| R-DATA-04 | P1 | ~~`POST /project/upload` 无类型/归属校验~~ | ~~`ProjectController` / `GroupProjectController` / `WsController` 测试上传；`doc/uploadWordTemplate`~~ | **✅ 已关闭（2026-08-03）**：删除三处无归属测试上传；`WordTemplateGuard` 仅 `.docx` + 键前缀 `martin/projecterd/{projectId}/`；上传/下载/gendocx 经 `ProjectAcl` | 勿回挂匿名 OSS 写；自定义模板路径勿放开任意 bucket |
| R-DATA-05 | P2 | ~~`TestJsonController` 样板 CRUD 仍暴露~~ | ~~`TestJsonController.java` + Service/Mapper/Entity~~ | **✅ 已关闭（2026-08-03）**：删除 Controller/Service/Impl/Mapper/Entity/`TestJsonMapper.xml`；无 ignore/FE 代理 | 勿回挂 `/testJson/**`；表 `test_json` 若残留可不删（delete-dead-code 表慎动） |

### 运维可观测

| ID | 级别 | 项 | 证据 | 现状 | 建议 |
|---|---|---|---|---|---|
| R-OPS-01 | — | Actuator 仅 health/info，匿名可达 | `application.yml:134-154`；ignore `/actuator/**`；`/actuator/env`→404 | **可接受**；勿扩大 exposure | 保持；liveness 与聚合 health 分工见 deployment |
| R-OPS-02 | — | springdoc：Security `permitAll`，prod 关端点 | `application-prod.yml` springdoc；CHANGELOG 2026-08-03 | **已缓解**；本地仍开 | 勿回退；门控只用 springdoc.* |
| R-OPS-03 | P2 | ~~SocketIO `0.0.0.0:9092` 与 HTTP 分离~~ | ~~`application.yml` socketio host/port~~ | **✅ 已关闭（2026-08-03）**：`deployment.md` 标明 9092 勿对公网裸放；PaaS 须防火墙/内网或反代 | 保持；demo 单口可先忽略 Presence |

### 误导死配置

| ID | 级别 | 项 | 证据 | 现状 | 建议 |
|---|---|---|---|---|---|
| R-DEAD-01 | P1 | ~~`martin.swagger.enabled` 不门控 springdoc~~ | ~~`application.yml`~~ | **✅ 已关闭（2026-08-03）**：删除 `martin.swagger` 与死类 `SwaggerProperties`；门控仅 `springdoc.*` | 勿回键；prod 保持 springdoc 关 |
| R-DEAD-02 | P2 | ~~`martin.resource-server.enabled` 无引用~~ | ~~`application.yml`~~ | **✅ 已关闭（2026-08-03）**：删除假开关；resource server 常驻 | 勿回键 |
| R-DEAD-03 | P2 | ~~ignore：`/endpoint/**` 等无控制器路径~~ | ~~`application.yml` ignore-urls~~ | **✅ 已关闭（2026-08-03）**：去掉 `/endpoint/**`；保留登录/退出/注册产品口/actuator/springdoc/error；分享仍仅 GET（代码链）；`/register`/`/user/register` 不回 ignore | 新匿名面须挂真实 Controller 后再入 ignore |
| R-DEAD-04 | P2 | ~~`martin.ui.url` / `ERD_UI_URL` 代码零引用~~ | ~~`application.yml` ui.url~~ | **✅ 已关闭（2026-08-03）**：`CrossOriginPolicy` 读 `martin.ui.url`；prod SocketIO 同绑 `ERD_UI_URL`；见 R-CFG-04 | 保持接线；业务跳转若再用同键 |

### 点击劫持（X-Frame-Options）

- API 响应默认 `X-Frame-Options: DENY`（`ErdSecurityConfiguration`）。
- 只读分享是前端 SPA 路由（匿名 `GET /share/{token}` 只取 JSON），**不**要求把后端嵌进第三方 iframe。
- 例外：若自托管要把 **UI** 嵌到其它站，在 nginx/CDN 配 `Content-Security-Policy: frame-ancestors …`；不要为此关闭后端 `frameOptions`。

### 建议下一刀（按 ROI）

1. （本轮 R-DATA-02 pin-IP 已关）残余面：raw ping/reverse 仍可带 JDBC（有 Guard + pin）；TLS 主机名校验与钉 IP 的张力（见 R-DATA-02 建议列）。
2. 贡献者路径 / Agent schema 等非安全项见 roadmap。
