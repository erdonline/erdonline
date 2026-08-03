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
- 公网部署应改密 `admin`、删除 `e2e*` 用户；见 [deployment.md](./deployment.md)

## SQL 执行

设计器内 JDBC/同步走登录会话与（团队）审批路径；开源版 VIP 权益切面**不**拦截次数。

| 路径 | 门禁 |
|---|---|
| `queryInfo/exec`、`queryInfo/explain` | `SqlGuard.assertReadOnly`：单语句 SELECT / EXPLAIN / SHOW / DESC（jsqlparser + 词首回退）；禁多语句、GRANT/OUTFILE 等 |
| `connector/sqlexec`、`dbsync` | **mutate**：允许同步所需 DDL/DML；`SqlGuard.assertMutateAllowed` 拒 GRANT/REVOKE/CREATE USER/INTO OUTFILE/LOAD DATA LOCAL 等 |
| `connector/ping|dbReverse*|sqlexec|dbsync|…` | `JdbcUrlGuard`：仅 `jdbc:mysql\|mariadb\|postgresql\|oracle:(thin\|oci)\|sqlserver`；禁云元数据主机；**`dataSourceId` 优先**（`ConnectorCredentialResolver` → `DataSourceAcl` 后服务端填入凭据，覆盖客户端 JDBC 字段） |

残留：无 `dataSourceId` 时仍可直传已 allowlist 的 JDBC 凭证（设计器逆向/试连 UX）；FE 热路径迁 id 后可再收紧 raw。内网 SSRF 主机策略另刀。

## 匿名放行（前缀剥离后路径）

- 登录/退出：`/login`、`/auth/login`、`/exit`
- 注册：`/project/group/user/register`（前端 `POST /ncnb/project/group/user/register`）
- 只读分享：**仅** `GET /share/{token}`（及 `/ncnb/share/{token}` 前缀剥离前形态），见 ADR-0007；`create` / `revoke` / `fork` **不在** ignore-urls（需登录）
- Actuator：`/actuator/**` 放行，但 **exposure 仅 `health,info`**；`health` 不 `show-details`；`info` 仅 app name/version（无密钥）。禁止扩大到 env/beans/heapdump
- OpenAPI / Swagger UI：Security 仍对 `/v3/api-docs/**`、`/swagger-ui/**` 匿名放行；**`prod` profile 通过 `springdoc.api-docs.enabled=false` / `springdoc.swagger-ui.enabled=false` 关闭端点本身**。勿依赖 `martin.swagger.enabled`（死键，不门控 springdoc）。本地/dev 默认仍开启，便于联调。

## 只读分享

- 创建/吊销需登录且为项目创建人（UI：设计器顶栏「分享」弹层）
- 匿名响应按 ADR-0008 **清空** `profile.dbs`（连接只在 `data_sources`）；可保留 `defaultDataSourceId` 引用

## projectJSON 密钥纪律

JDBC 连接机密（url / username / password / driver）**不得**写入 `projectJSON`（[ADR-0008](./adr/0008-datasource-isolation.md)）。对外字段说明与兼容政策见 [data-format.md](./data-format.md)。

## 已知风险（后端登记，2026-08-03）

梳理范围：Spring Security / JWT / CORS / springdoc / datasource / Redis / 用户库 SQL 执行 / 上传 / admin / actuator / SocketIO / 密钥与 ignore-urls / 项目 ACL / 死配置。下列为**已核实**安全或生产风险（非泛 code smell）。级别：P0 公网可利用或密钥可预测；P1 需登录但横向越权/破坏面大；P2 收紧面或误导运维。

### 鉴权暴露面

| ID | 级别 | 项 | 证据 | 现状 | 建议 |
|---|---|---|---|---|---|
| R-AUTH-01 | P0 | ~~匿名 `GET /user/loadUserByUsername/{username}` 泄露用户密文与权限~~ | ~~ignore-urls + Service `@RestController`~~ | **✅ 已关闭（2026-08-03）**：去掉 ignore；`RemoteSystemUser.loadUserByUsername` 去 `@GetMapping`（仅进程内）；`User.pwd`/`salt` `@JsonProperty(WRITE_ONLY)` | 保持无 HTTP 映射；勿回 ignore |
| R-AUTH-02 | P1 | `UserController` CRUD 无 `@PreAuthorize` | `UserController.java:57-119`（对比 `UserExtensionController` 的 `sys_user_*`） | 任意已登录用户可增删改查系统用户（常含 `pwd`） | 补权限或委托已鉴权 Extension API；禁止返回密文字段 |
| R-AUTH-03 | P1 | ~~项目/模型 IDOR：按 id 读写不校验成员~~ | ~~`ProjectServiceImpl` / `ProjectController` delete/update/get~~ | **✅ 已关闭（2026-08-03）**：`ProjectAcl` 查 `project_user`；get/info/save/update/delete（个人+团队）均 `assertMember` | 设计器旁路/SocketIO 成员检见 R-AUTH-05 |
| R-AUTH-04 | P1 | ~~`dataSources` 读/改/删无归属校验~~ | ~~`DataSourcesController` get/update/delete~~ | **✅ 已关闭（2026-08-03）**：`DataSourceAcl` 校验 creator（username/userId）；tree 亦按 creator 过滤；禁止更新改写 creator | 保持；与 R-DATA-02 热路径走已鉴权 id |
| R-AUTH-05 | P1 | SocketIO 仅验短票/JWT，不验项目成员 | `SocketIoAuthorizationListener.java:24-48`；`ErdSocketIoServiceImpl.java:54-72`；ADR-0009 已知限制 | 合法用户可加任意 `projectId` 房收 presence/sync | 握手或 `JOIN_ROOM` 校验项目角色 |
| R-AUTH-06 | P2 | 开放注册双入口 | ignore：`/user/register`；产品：`/project/group/user/register` | 公网可自注册（产品路径）；Service `@RestController` 另挂 `/user/register` | 自托管若关闭注册则收 ignore + 门控；废弃重复入口 |
| R-AUTH-07 | P2 | `frameOptions` 关闭 | `ErdSecurityConfiguration.java:63` | 可被嵌入 iframe（点击劫持面） | 非嵌入场景恢复 `deny`/`sameOrigin` |

### 配置与密钥

| ID | 级别 | 项 | 证据 | 现状 | 建议 |
|---|---|---|---|---|---|
| R-CFG-01 | P0 | ~~`JWT_SECRET` 有仓库默认值，prod 未 fail-fast~~ | ~~`application.yml` 弱默认；prod 未覆盖~~ | **✅ 已关闭（2026-08-03）**：`application-prod.yml` `erd.jwt.secret: ${JWT_SECRET}` 无默认；`JwtConfig` prod 拒 blank/仓库开发默认串；本地/dev 保留 DX 默认 | 保持 prod 无默认；公网/demo 须旋转且 ≠ 仓库串 |
| R-CFG-02 | P0 | ~~种子 `admin`/`123456`~~ | ~~`security-model` 种子表；Flyway `V3`/`V6`~~ | **✅ 已关闭（2026-08-03）**：`allow-demo-admin` prod/默认=false，拒绝 `admin`+`123456`；`dev`=true 保本地 dogfood；`ERD_ALLOW_DEMO_ADMIN=true` 逃生 | 公网改密 admin；勿开 `ERD_ALLOW_DEMO_ADMIN` |
| R-CFG-03 | P1 | 应用库 JDBC `useSSL=false` + `allowPublicKeyRetrieval=true` | `application.yml:32-46` | 中间人/弱校验 TLS | 生产 URL 开 SSL；分 profile |
| R-CFG-04 | P1 | CORS 依赖 `CORS_ALLOWED_ORIGINS`；SocketIO `origin:*` | `CorsConfig.java:30-40`；`application.yml:94` | HTTP CORS 已收敛；SocketIO 默认任意 Origin | 生产设 `SOCKETIO_ORIGIN` 与 UI 同源；demo 设 `CORS_ALLOWED_ORIGINS` |
| R-CFG-05 | P2 | OSS / MinIO 默认密钥进 yml | `application.yml:85-87`；prod 已强制 `OSS_*` | 本地默认弱；prod fail-fast OK | 保持 prod 强制；文档勿示例真密钥 |
| R-CFG-06 | P2 | `.env.example` 残留 `OAUTH_CLIENT_*` | `.env.example:41-43` | 认证已 JWT，易误配 | 删死键或标注废弃 |

### 数据面（SQL / 文件 / 出站）

| ID | 级别 | 项 | 证据 | 现状 | 建议 |
|---|---|---|---|---|---|
| R-DATA-01 | P0 | ~~`queryInfo/exec`：`${sql}` 无语句白名单~~ | ~~`QueryInfoMapper.xml`；`QueryInfoServiceImpl`~~ | **✅ 已关闭（2026-08-03）**：`SqlGuard.assertReadOnly` 仅 SELECT/EXPLAIN/SHOW/DESC；禁多语句 | 保持只读白名单；`${sql}` 仍为动态执行面，勿扩 DML |
| R-DATA-02 | P0 | ~~`connector/*` 任意 JDBC + SQL~~ | ~~`AbstractDBCommand` / `DbSqlExecCommand` / `PingDBCommand`~~ | **✅ 基本关闭（2026-08-03）**：`JdbcUrlGuard`；mutate 拒 GRANT/OUTFILE；**`dataSourceId`→ACL→服务端凭据**（覆盖客户端字段）；无 id 的 raw JDBC 仍保留给逆向/试连 | 下一刀：FE 热路径只传 id；内网 SSRF 主机策略；可选禁 mutate raw |
| R-DATA-03 | P1 | ~~`GitlabController` 硬编码第三方账密~~ | ~~`GitlabController.java:41`~~ | **✅ 已关闭（2026-08-03）**：删除 Controller/Service/Vo + `gitlab4j-api` 依赖 | 勿回挂 `/ci/**`；泄露口令视为已公开勿复用 |
| R-DATA-04 | P1 | `POST /project/upload` 无类型/归属校验 | `ProjectController.java:134-137` | 任意登录用户写默认 OSS bucket | 校验扩展名/content-type；鉴权到项目；禁测试接口上生产 |
| R-DATA-05 | P2 | `TestJsonController` 样板 CRUD 仍暴露 | `TestJsonController.java:56-121` | 需登录，污染面 | 删死路由 |

### 运维可观测

| ID | 级别 | 项 | 证据 | 现状 | 建议 |
|---|---|---|---|---|---|
| R-OPS-01 | — | Actuator 仅 health/info，匿名可达 | `application.yml:134-154`；ignore `/actuator/**`；`/actuator/env`→404 | **可接受**；勿扩大 exposure | 保持；liveness 与聚合 health 分工见 deployment |
| R-OPS-02 | — | springdoc：Security `permitAll`，prod 关端点 | `application-prod.yml:34-38`；CHANGELOG 2026-08-03 | **已缓解**；本地仍开 | 勿回退；勿信 `martin.swagger` |
| R-OPS-03 | P2 | SocketIO `0.0.0.0:9092` 与 HTTP 分离 | `application.yml:91-93` | PaaS 须单独暴露/防火墙 | 部署文档标明勿对公网裸放 9092 |

### 误导死配置

| ID | 级别 | 项 | 证据 | 现状 | 建议 |
|---|---|---|---|---|---|
| R-DEAD-01 | P1 | `martin.swagger.enabled` 不门控 springdoc | `application.yml:74-75`；prod 注释 | 运维以为关 swagger 实际靠 springdoc | 删键或真正接线；文档已警示 |
| R-DEAD-02 | P2 | `martin.resource-server.enabled` 无引用 | `application.yml:76-77` | 假开关 | 删除 |
| R-DEAD-03 | P2 | ignore：`/endpoint/**`、`/register`、或未再走 HTTP 的路径 | `application.yml:174-179`；`/endpoint/foo`→404 | 扩大未来误挂匿名面 | 收敛 ignore 仅保留真实匿名 API |
| R-DEAD-04 | P2 | `martin.ui.url` / `ERD_UI_URL` 代码零引用 | `application.yml:103-104` | 部署表有变量但不生效 | 接线 CORS/跳转或文档降级为可选 |

### 建议下一刀（按 ROI）

1. **FE connector 热路径只传 `dataSourceId`**（R-DATA-02 残留；后端已支持 id 优先；逆向/新建试连可保留 raw）。
2. **用户 CRUD 权限**：`UserController` 补 `@PreAuthorize` + 禁止返回密文（R-AUTH-02）。
3. **SocketIO 项目成员**（R-AUTH-05）。

（内网 SSRF 主机策略 / mutate 禁 raw 可随后收紧。）

