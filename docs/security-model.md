# 安全模型（开源自托管）

## VIP / 限额

开源版**不启用**人数、个人项目数、团队项目数、版本数、AI 次数等 VIP 拦截（`VIPRightsAspect` 放行）。License 上传接口仍保留，但不作为功能门禁。

## 种子账号

| 账号 | 用途 | 默认密码 |
|---|---|---|
| `admin` | 运维/手工 | `123456`（务必在生产修改） |
| `e2e0`..`e2e15` | Playwright 并发隔离（≤16 worker） | `123456` |
| `e2e-serial` | chromium-serial 空态用例 | `123456` |

防护：

- `erd.security.e2e-accounts-enabled`：`dev`=true，`prod`/默认=false → 生产拒绝 `e2e\\d+` / `e2e-serial` 登录
- 公网部署应删除 `e2e*` 用户或改密；见 [deployment.md](./deployment.md)

## SQL 执行

设计器内 JDBC/同步仍走既有权限与审批路径；不因去掉 VIP 限额而放宽 SQL 执行白名单。

## 匿名放行（前缀剥离后路径）

- 登录/退出：`/login`、`/auth/login`、`/exit`
- 注册：`/project/group/user/register`（前端 `POST /ncnb/project/group/user/register`）
- 只读分享：**仅** `GET /share/{token}`（及 `/ncnb/share/{token}` 前缀剥离前形态），见 ADR-0007；`create` / `revoke` / `fork` **不在** ignore-urls（需登录）
- Actuator：`/actuator/**` 放行，但 **exposure 仅 `health,info`**；`health` 不 `show-details`；`info` 仅 app name/version（无密钥）。禁止扩大到 env/beans/heapdump

## 只读分享

- 创建/吊销需登录且为项目创建人（UI：设计器顶栏「分享」弹层）
- 匿名响应按 ADR-0008 **清空** `profile.dbs`（连接只在 `data_sources`）；可保留 `defaultDataSourceId` 引用

## projectJSON 密钥纪律

JDBC 连接机密（url / username / password / driver）**不得**写入 `projectJSON`（[ADR-0008](./adr/0008-datasource-isolation.md)）。对外字段说明与兼容政策见 [data-format.md](./data-format.md)。

