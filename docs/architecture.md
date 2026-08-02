# 架构说明 / Architecture

ERD Online 采用**前后端分离**的单体架构：

```
┌─────────────┐  HTTP :9502       ┌──────────────────────────┐
│  Frontend   │ ────────────────▶ │   Backend (Spring Boot)   │
│ React/Umi   │ /auth /syst /ncnb │  单进程 Monolith          │
│ (Nginx)     │ SocketIO :9092    │  + netty-socketio         │
└─────────────┘  /project/erd     │  （presence，ADR-0009）   │
                                  │  ┌─────────────────────┐  │
                                  │  │ auth  (JWT + 短票)  │  │
                                  │  │ system(用户/权限)   │  │
                                  │  │ erd   (建模核心)    │  │
                                  │  │ common(核心公共库)  │  │
                                  │  └─────────────────────┘  │
                                  └────────┬─────────┬────────┘
                                           │         │
                                     ┌─────▼───┐ ┌───▼────┐
                                     │ MySQL 8 │ │ Redis  │
                                     │ erd +   │ │ token/ │
                                     │ martin  │ │ ticket │
                                     └─────────┘ └────────┘
```

> 前端沿用原网关的路径前缀 `/auth`、`/syst`、`/ncnb`，由后端的 `GatewayPrefixStripFilter`
> 在进程内剥离前缀（等价于原网关的 `StripPrefix=1`），无需独立网关。
> 协作 Presence 走独立端口 `9092`（短票鉴权，见 ADR-0009），不经 HTTP 代理。
>
> **官方托管（无 VPS）**：文档 / 静态 demo → Cloudflare Pages（GH Pages 回退）；运行时镜像 → GHCR；
> 数据面仅自托管。见 [ADR-0018](./adr/0018-hosting-topology-no-vps.md) 与 [deployment.md](./deployment.md)。

## 后端模块（单体内的业务分包）

| 包 | 职责 | 来源 |
|---|---|---|
| `com.erdonline.auth` | OAuth2 授权服务器 + 资源服务器（同进程） | 原 martin-biz-auth |
| `com.erdonline.system` | 用户 / 角色 / 菜单 / 字典 | 原 martin-biz-system |
| `com.erdonline.erd` | ERD 建模核心、SQL、版本、协作 | 原 martin-extension-ncnb |
| `com.erdonline.erd.reverse` | 多库逆向 Dialect SPI（索引字典 + FK/`associations` + Generic 兜底）；`dbReverseMeta` 暴露能力/schema | ADR-0006 |
| `com.erdonline.common` | core/bean/data/log/security/vip/websocket/oss/swagger | 原 martin-common-* |
| `com.erdonline.config` | Security / CORS / Swagger / MyBatis / WebSocket 配置 | 合并新增 |

## 从微服务到单体的关键变化

- **服务发现（Nacos）**：移除，配置内联到 `application.yml`
- **API 网关**：移除，鉴权 / CORS 逻辑并入单体 Security 过滤器链
- **Feign 远程调用**：改为进程内 Spring Bean 直接注入调用
- **OAuth2**：授权服务器与资源服务器合并，同一 RedisTokenStore 本地签发/校验
- **Sentinel / Skywalking**：移除

## 项目模型事实源（projectJSON）

ERD 项目的表/字段/关联/画布布局以 JSON 列 `project.projectJSON` 为事实源（非关系表拆分）。对外规范与机器可校验 schema：

- 文档：[data-format.md](./data-format.md)（仅加法兼容、密钥纪律）
- Schema：[`schema/projectjson.schema.json`](../schema/projectjson.schema.json)
- 校验：`node scripts/validate-projectjson.mjs`

JDBC 机密不进 projectJSON（ADR-0008）；连接在 `data_sources`。

## 数据存储

采用**单一业务库** `erd`（ADR-0020）。历史双库（`martin`/`erd`）已合并；旧 erd dump 中与认证同名的桩表已丢弃。

- **库内表**：系统/认证（用户、角色、菜单、OAuth、QRTZ…）与建模元数据（项目、版本、分享、`data_sources`…）共存。
- **双 SqlSessionFactory（过渡）**：`MartinDataSourceConfig` / `ErdDataSourceConfig` 仍按 mapper 包路由，但 JDBC 均指向同一 `DB_NAME`（默认 `erd`）。
- **Redis**：OAuth token 存储（RedisTokenStore）与缓存。
- **Bootstrap**：`db/init` 仅 CREATE DATABASE + CREATE TABLE；种子 / demo / E2E 由 `classpath:db/migration/erd`（`ErdFlywayConfig`）写入。

