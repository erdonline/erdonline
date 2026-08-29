---
title: docker-compose 一键部署的 MIT 开源数据库建模平台
slug: docker-compose-mit-modeler
status: ready
platforms: [juejin, csdn, oschina, zhihu]
cta: deploy
utm_campaign: launch
xhs_title: docker compose 一键部署建模平台
created: 2026-08-09
---

## 开场：SaaS 试用可以，生产数据不行

很多团队评估 ER 工具时卡在两点：**数据能不能出内网**，以及**许可允不允许商用 fork**。云端 demo 适合 30 秒体验，但 JDBC 连生产、projectJSON 存版本、审批流走 SQL——这些往往要求**自托管**。

[ERD Online](https://github.com/erdonline/erdonline) 是 MIT 开源的全栈建模平台：关系图画布、Git 式版本 diff、四库逆向、DBML 导入、团队权限与 SQL 审批、开放 API/MCP。官方提供 **docker compose** 编排，预构建镜像托管在 GHCR。

## 一条命令起栈

```bash
git clone https://github.com/erdonline/erdonline.git
cd erdonline
docker compose pull    # ghcr.io/erdonline/erdonline-backend / frontend
docker compose up -d   # mysql + redis + backend + frontend
```

默认暴露前端 **8000**、后端 API **9502**、协作 SocketIO **9092**（与 HTTP 分离）。Schema 增量由 Flyway 在业务库启动时执行；空 data 卷首启另有数据库 bootstrap（见 [ADR-0020]({{DOC:adr/0020-single-database}})）。若你已有外部 MySQL/Redis，可按 [部署文档]({{DOC:deployment}}) 调整 compose 只起应用容器并指向现有实例。

本地改源码可 `docker compose build backend frontend && docker compose up -d`；日常升级优先 `pull` 官方镜像。GitHub [release 工作流]({{GH:.github/workflows/release.yml}}) 在 tag `v*` 时推送 GHCR，自托管用户无需本地编译 Java/Node 即可跟版。

**与官方 demo 的区别**：Cloudflare Pages 静态前端 + Railway 公网 API 仅供试用；compose 栈把 MySQL 里的 projectJSON、版本链、审批记录都放在**你的 volume** 上，适合金融/政务/制造业等数据不出域场景。

##  compose 里有什么

| 服务 | 作用 |
|---|---|
| mysql | 业务库 + 系统库（同实例不同 schema 策略见文档） |
| redis | 会话、限流、SocketIO 适配等 |
| backend | Spring Boot API、逆向 dialect、审批与版本 |
| frontend | UmiJS 静态资源 + 反向代理到 API |

**不包含**：MinIO（Word 导出用 classpath 默认模板，无 MinIO 亦可导出）；**MCP Server**（[MCP 目录]({{GH_TREE:mcp}})，需在宿主机单独起进程接 API）。

> 诚实边界：生产务必改 `.env` 中所有默认密码；公网部署禁 `admin/123456` 种子登录（`ERD_ALLOW_DEMO_ADMIN=false`）；`ERD_UI_URL` 与 CORS/SocketIO 源需指向真实前端域名，否则浏览器协作连不上 9092。

## 自托管你会得到什么

与官方 demo 同源能力，数据在你磁盘上：

- ReactFlow ER 画布、版本 diff、只读分享链接；
- MySQL / Oracle / PostgreSQL / SQL Server JDBC 逆向；
- DBML 导入、DDL/Word 导出；
- 三级团队角色、SQL 审批流；
- PAT/OAuth 公开 API（Agent 集成见 [ADR-0013]({{DOC:adr/0013-public-api-mcp}})）。

官方托管（Railway demo API + Cloudflare 静态页）仅用于试用；**用户生产数据面走自托管 compose**，见 [ADR-0018]({{DOC:adr/0018-hosting-topology-no-vps}})。

首次登录后建议流程：改管理员密码 → 建团队项目 → 配 JDBC 只读源做逆向 → 存 baseline 版本 → 再邀请成员。E2E 账号与 demo 项目种子由 Flyway 迁移注入，**生产 compose 勿开启** `ERD_E2E_ACCOUNTS_ENABLED`。

## 30 秒打开部署指南

1. 打开 [部署文档]({{DOC:deployment}})，确认机器资源（建议 2C4G+）、Docker / Compose 版本。
2. 复制 `.env.example` → `.env`，修改 `MYSQLPASSWORD`、`JWT_SECRET`、`ERD_UI_URL` 等。
3. 执行 `docker compose up -d`，访问 `http://<host>:8000`，用管理员账号登录（首次种子见文档，**立即改密**）。

健康检查：`docker compose ps` 四服务 Up；`curl -sf http://127.0.0.1:9502/actuator/health` 返回 UP。前端通过 proxy 访问 API，勿把浏览器直接指到 9502 当日常入口。

{{CTA}}

## 常见生产配置

| 变量 / 项 | 建议 |
|---|---|
| `ERD_UI_URL` | 浏览器访问的前端 URL，影响 CORS 与 SocketIO 源 |
| `JWT_SECRET` / DB 密码 | 部署前必改，勿用仓库示例值 |
| `ERD_ALLOW_DEMO_ADMIN` | 公网 `false`，禁默认 admin 口令 |
| 9092 端口 | 反代或安全组放行，否则协作 presence 不可用 |
| TLS | 前端前挂 Nginx/Caddy 终止 HTTPS，UI URL 写 https |

文档站可单独部署（Cloudflare Pages / GitHub Pages），与建模栈解耦——内网通常只起 compose 四服务即可。

## 升级与备份

- **升级**：`docker compose pull && docker compose up -d`；关注 [CHANGELOG]({{GH:CHANGELOG.md}}) 中 Flyway 迁移说明。
- **备份**：定期备份 MySQL data volume；projectJSON 亦在库表，勿只备份前端静态文件。
- **镜像来源**：`ghcr.io/erdonline/erdonline-backend:latest` 与 `frontend:latest`，由 release 工作流发版。

## 许可与社区

MIT——可商用、可修改、可内网分发，保留版权声明即可。

## 路线图与参与

- 文档 / 路线图 / good first issue：[文档站]({{DOCS}})
- Issue / PR：[GitHub 仓库]({{REPO}})

部署踩坑或改进 compose 欢迎提 issue/PR。
