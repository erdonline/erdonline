# ADR-0019：官方 Demo 运行时 — Railway-only（真实 MySQL 8）

- 状态：已接受（2026-08-02）
- 决策者：项目维护者

## 背景

ADR-0018 已定：文档 / 静态 demo 走 Cloudflare Pages，镜像走 GHCR，**不买生产 VPS**；公网 demo API 留待独立步骤。  
静态站 `DEMO_API_URL` 可空，完整试用需要可公网访问的后端 + MySQL + Redis。

曾评估「TiDB Serverless + Upstash Redis + 某容器宿主」三厂商拼装，以及国内 PaaS（Zeabur）与 Railway 插件一体方案。维护者已注册 Railway 与 Zeabur；先前拍板：**官方 demo 默认 = Railway-only**。

## 决策

| 角色 | 宿主 | 说明 |
|---|---|---|
| **官方 demo 后端** | **Railway**（单一项目） | App 服务跑 `ghcr.io/erdonline/erdonline-backend`（或 Dockerfile）；**MySQL 插件（MySQL 8）** + **Redis 插件**；环境变量对齐 Spring Boot（`DB_*` / `REDIS_*` / `JWT_*` 等） |
| 静态 demo 前端 | Cloudflare Pages（ADR-0018） | Variable `DEMO_API_URL` → Railway 公网 HTTPS 根 URL |
| 中国区备选 | **Zeabur** | 同样思路（容器 + 托管 MySQL/Redis）；**非**官方默认路径，文档仅短述 |
| 用户生产 / 自托管 | **docker compose**（ADR-0018） | 项目方不托管用户生产数据；compose + GHCR 仍是推荐生产路径 |

明确拒绝：

- **TiDB + Upstash（或其它）三厂商拼装**作为官方 demo：多账单、多故障面、方言/兼容性心智负担，不值 demo 体量
- 把 Railway/Zeabur demo 当成「官方生产」或替代用户自托管
- 为 demo 购买长期 VPS（不推翻 ADR-0018）

## 后果

- 正面：一个 Dashboard 内 App + 真 MySQL 8 + Redis；与 compose 数据面同构（双库 `martin`/`erd`）；成本可控（Hobby 约 \$5–10/月量级，以 Railway 账单为准）
- 代价：须发版 tag 后 GHCR 才有可拉镜像；空库须手工/`mysql` 灌 `db/init`（Flyway 只覆盖 erd 增量）；跨域须配 `CORS_ALLOWED_ORIGINS`；SocketIO `:9092` 在单 HTTP 端口平台上可能不可用（demo 以 REST 为主）
- Dashboard 硬性设置（无法写进 toml）：App **Root Directory = `backend`**；**Config as Code = `/backend/railway.toml`**。否则 monorepo 根构建会失败；首个 `v*` 前勿用尚不存在的 GHCR Image
- 与既有 ADR：补全 ADR-0018「公网 demo API」空档；不改变自托管 compose 真相源
- 操作步骤：见 [deployment.md — Railway 部署官方 demo](../deployment.md#railway-demo)；中国区备选见 [Zeabur](../deployment.md#zeabur-demo)
