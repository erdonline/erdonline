# 部署指南 / Deployment

## 官方托管拓扑（无 VPS）

决策见 [ADR-0018](./adr/0018-hosting-topology-no-vps.md)。项目方**不买生产 VPS**、不托管用户生产数据；公开表面用 GitHub + Cloudflare 免费档。

```
文档站 ──► Cloudflare Pages（erdonline-docs）  [主]
       └─► GitHub Pages（/erdonline/）         [回退]

静态 demo ─► Cloudflare Pages（erdonline-demo）
             env-config.js ← Variables: DEMO_API_URL
                  └─► 指向 Railway 公网后端（ADR-0019）

官方 demo API ─► Railway（App + MySQL 8 插件 + Redis 插件）
  镜像：ghcr.io/erdonline/erdonline-backend:latest
  备选（CN）：Zeabur，同镜像思路

运行时镜像 ─► GHCR
  ghcr.io/erdonline/erdonline-backend
  ghcr.io/erdonline/erdonline-frontend

自托管数据面 ─► 用户自己的 docker compose（MySQL/Redis + 上列镜像）
  ← 用户生产仍走这条；Railway 只服务官方试用
```

| 表面 | 工作流 | 所需配置 |
|---|---|---|
| 文档 | `.github/workflows/docs-site.yml`（Jobs: `deploy-github-pages` / `deploy-cloudflare`） | 见下清单；无 CF 门闸时仅 GH Pages |
| 静态 demo | `.github/workflows/frontend-demo-site.yml` | 同上 + 可选 Variable `DEMO_API_URL` |
| 发版镜像 | `.github/workflows/release.yml`（tag `v*`，job `ghcr`） | `GITHUB_TOKEN` + `packages:write`（通常无需额外 Secret） |

### GitHub Actions × Cloudflare Pages 配置 {#cf-pages-setup}

一次性清单（复制勾选）。配置完成后 push `main` 才会真正跑部署 job。

#### 1. Cloudflare API Token

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → **My Profile** → **API Tokens** → **Create Token**
2. 选用模板 **Edit Cloudflare Workers**（含 Workers / Pages 写权限）
3. **Account Resources**：Include → All accounts（或指定本账号）
4. **Zone Resources**：All zones，或留空不限（Direct Upload 不绑域名亦可）
5. **Client IP Address Filtering**：不填；**TTL**：空（不过期）
6. 建议改名：`erdonline-pages-deploy` → Create Token → **立刻复制**（只显示一次）

#### 2. Account ID

Workers & Pages 左侧边栏底部（或 Overview）复制 **Account ID**。

#### 3. 创建两个 Pages 项目（Direct Upload）

Workers & Pages → **Create** → **Pages** → **Upload assets** / Direct Upload（**不要**接 Git 仓库；由 Actions + Wrangler 推送）：

| 项目名（须一字不差） | 用途 | 工作流 |
|---|---|---|
| `erdonline-docs` | Docusaurus 文档（主） | `docs-site.yml` → `pages deploy … --project-name=erdonline-docs` |
| `erdonline-demo` | 前端静态 demo | `frontend-demo-site.yml` → `--project-name=erdonline-demo` |

#### 4. GitHub Secrets / Variables

仓库 **Settings → Secrets and variables → Actions**：

| Name | 类型 | 值 |
|---|---|---|
| `CLOUDFLARE_PAGES_DEPLOY` | **Variable** | `true`（门闸；未设则跳过 CF job，文档仍走 GH Pages） |
| `CLOUDFLARE_API_TOKEN` | **Secret** | 步骤 1 的 Token |
| `CLOUDFLARE_ACCOUNT_ID` | **Secret** | 步骤 2 的 Account ID |
| `DEMO_API_URL` | Variable（可选） | 公网 API 根 URL；**未设则 `env-config.js` API 为空**（落地页可访问，完整试用待后端） |

#### 5. GitHub Pages 回退

**Settings → Pages → Build and deployment → Source** = **GitHub Actions**（对应 `docs-site.yml` 的 `deploy-github-pages`）。

文档双宿主：`website/docusaurus.config.js` 读 `DOCUSAURUS_URL` / `DOCUSAURUS_BASE_URL`（GH：`https://erdonline.github.io` + `/erdonline/`；CF：`https://erdonline-docs.pages.dev` + `/`）。

#### 6. 远程与触发

```bash
git remote -v   # 须指向将跑 Actions 的 GitHub 仓库
git push origin main
```

- `docs-site.yml`：`push` 到 `main` 且改动 `docs/**` / `website/**` / 本 workflow 时构建；CF job 另需 `CLOUDFLARE_PAGES_DEPLOY=true`
- `frontend-demo-site.yml`：同样门闸；可 `workflow_dispatch` 手动跑
- 无 `git remote` / 未 push `main` → Actions 不会跑

#### 7. 验收 URL

| 表面 | URL |
|---|---|
| 文档（CF 主） | https://erdonline-docs.pages.dev |
| 静态 demo | https://erdonline-demo.pages.dev |
| 文档（GH 回退） | https://erdonline.github.io/erdonline/ |

Actions 页确认 `Docs site` / `Frontend demo site` 对应 job 绿。

#### 8. GHCR（镜像，与 Pages 无关）

- 触发：推送 tag `v*`（或 `release.yml` 的 `workflow_dispatch`）
- 权限：workflow 已声明 `packages: write`；登录用 `GITHUB_TOKEN`，**通常不必再配 Secret**
- 镜像：`ghcr.io/erdonline/erdonline-backend`、`ghcr.io/erdonline/erdonline-frontend`

### 自托管者拉取 GHCR（推荐）

发版 tag（如 `v5.0.1`）后镜像推送到 GHCR。在目标机：

```bash
cp .env.example .env   # 改密码；按需设 ERD_IMAGE_TAG=v5.0.1
docker compose pull    # 拉 ghcr.io/erdonline/erdonline-{backend,frontend}
docker compose up -d
./scripts/verify-self-deploy.sh
```

公开包通常可读；若组织策略要求登录：

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USER --password-stdin
```

本地改源码时不要依赖远程镜像，显式构建：

```bash
docker compose build backend frontend
docker compose up -d
```

## Railway 部署官方 demo {#railway-demo}

决策见 [ADR-0019](./adr/0019-demo-runtime-railway.md)。项目方用 **Railway 单项目**跑官方试用后端（真 MySQL 8 + Redis）；用户生产仍用下方 **Docker Compose**。

成本：Hobby 量级约 **\$5–10/月**（App + MySQL + Redis，以 [Railway 定价](https://railway.app/pricing) 账单为准）。

### Dashboard 五步（最短路径）

> **构建失败先看这里**：仓库是 monorepo。若 Root Directory 留空（`/`），Railway 会按仓库根做 Railpack/Nixpacks（常误检前端）或用错 Docker context（`COPY pom.xml` 找不到）。**必须**把后端服务指到 `backend/`。另：`ghcr.io/erdonline/erdonline-backend` 在首次打 `v*` tag 跑 `release.yml` 之前**不存在**（404）——在此之前请用 **Dockerfile 从 GitHub 构建**，不要选 Docker Image。

1. **New Project** → **Deploy from GitHub**（选 `erdonline/erdonline`）。**不要**先选 Docker Image（镜像尚未发布时会拉取失败）。
2. 打开 **App 服务 → Settings**，按下面三项改（改完会触发重建）：

   | 设置项 | 必填值 | 说明 |
   |---|---|---|
   | **Root Directory** | `backend` | 构建上下文 = `backend/`（与 `docker-compose` / `backend/Dockerfile` 一致） |
   | **Config as Code** / Railway config file | `/backend/railway.toml` | 强制 `DOCKERFILE` builder；config **不**跟随 Root Directory，须写绝对路径 |
   | **Watch Paths**（可选） | `/backend/**` | 仅后端变更触发部署；toml 里已有同款 |

   确认 Builder 为 **Dockerfile**、`Dockerfile` 路径为 `Dockerfile`（相对 Root Directory）。
3. **Add Plugin → MySQL**（MySQL 8）与 **Add Plugin → Redis**；等插件 Ready。
4. 在 MySQL 上建双库并灌基线（插件通常只给一个库）。用 Railway 提供的连接串/`mysql` 客户端执行：
   ```bash
   # 建库（与 db/init/01_schema.sql 一致）
   CREATE DATABASE IF NOT EXISTS erd DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
   CREATE DATABASE IF NOT EXISTS martin DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
   # 再按序导入仓库 db/init/02_erd.sql … 09_*.sql（公网勿灌 05_e2e_users.sql）
   ```
   后端启动时 Flyway 只迁移 **erd** 增量；**martin** 基线必须来自 `db/init`。
5. 在 **App 服务 → Variables** 写入下表环境变量（把插件变量引用成 Spring 名；值以 Dashboard 实际为准）。
6. **Settings → Networking → Public Networking** 生成 `*.up.railway.app` HTTPS。容器入口已读平台 `PORT`（`backend/Dockerfile`）；**不必**再手填 9502。验收：
   ```bash
   curl -sS https://YOUR-APP.up.railway.app/actuator/health/liveness
   # 期望 {"status":"UP"}  （部署门禁；railway.toml 也指向此路径）
   curl -sS https://YOUR-APP.up.railway.app/actuator/health
   # 期望 {"status":"UP"}  （含 db/redis；未接线时 503，业务未就绪）
   ```
   随后在 GitHub Actions Variables 设 `DEMO_API_URL=https://YOUR-APP.up.railway.app`（无尾斜杠），重跑 `frontend-demo-site.yml`，CF Pages 静态 demo 即指向该 API。

可选（首个 `v*` release 且 GHCR 已有包之后）：空项目 → **Add service → Docker Image** → `ghcr.io/erdonline/erdonline-backend:latest`，跳过本地 Dockerfile 构建。

### Healthcheck 连续失败（立刻自查）{#railway-health-fail}

`healthcheckTimeout = 300`（5 分钟）内 **Attempt #1–#8 全是 service unavailable** ≈ **2 分钟仍无人听端口**，**不是**「JVM 慢一点」。正常 Boot 冷启约 30–90s；超过约 2–3 分钟日志里还没有 `Started ErdOnlineApplication` → **卡在 DB/Redis 或 prod 缺环境变量，进程在崩溃重试**。

**现在就看**：Deployments → 当前部署 → **View logs**，搜这些关键词：

| 日志关键词 | 含义 | 怎么修 |
|---|---|---|
| `Could not find … base-logback.xml` / `No appenders` | Logback include 失败（已修：改 include 根路径）；**不阻断启动**，但后面真实错误可能看不见 | 拉含本修复的 commit 后 Redeploy；仍失败再往下看 |
| `Started ErdOnlineApplication` | 进程已起来 | 再 curl `/actuator/health/liveness`；若公网仍 502 → Networking/域名 |
| `Communications link failure` / `Connection refused` / `Unknown database` | MySQL 未通或未建 `martin`/`erd` | 映射 `DB_*`；执行建库 + `db/init` |
| `Unable to connect to Redis` … `localhost/127.0.0.1:6379` | **属性前缀错误**（旧 `spring.redis.*` 在 Boot 3 不绑定）或变量未进容器 | 拉含 `spring.data.redis` 修复的 commit 后 **Redeploy**；变量已是 `REDIS_HOST` 也要重部署才能吃到新 jar |
| `WRONGPASS invalid username-password pair` | 主机已通（如 `redis.railway.internal`）但鉴权错：手填错密码、或空用户名 `AUTH ""`、或未用插件密码 | **优先** Variable Reference：`REDIS_URL` ← Redis.`REDIS_URL`（或 `REDIS_PRIVATE_URL`）；否则 `REDIS_PASSWORD` ← Redis.`REDISPASSWORD`（点开眼睛核对与 Redis 服务 Variables 一致，勿手打）；可选 `REDIS_USERNAME` ← Redis.`REDISUSER`（多为 `default`）。改完 **Redeploy** |
| `Could not resolve placeholder 'DB_USERNAME'` / `OSS_ACCESS_KEY` | `prod` fail-fast 缺变量 | 用 `DB_USERNAME`（不是 `DB_USER`）或插件 `MYSQLUSER`；补 `OSS_*` |
| 完全没有 Java/`Tomcat started` | 镜像未真正跑起来 / 入口错 | 确认 Root Directory=`backend`、Builder=Dockerfile |

容器内（Railway Shell）：

```bash
echo "PORT=$PORT"
curl -sS -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:${PORT}/actuator/health/liveness"
curl -sS "http://127.0.0.1:${PORT}/actuator/health"
```

说明：

- **部署门禁**用 `/actuator/health/liveness`（进程存活即可；`railway.toml` 已改）。
- **业务就绪**仍看 `/actuator/health`（含 db/redis）。**不要**靠 `management.health.db.enabled=false` 瞒过接线问题——优先把 MySQL/Redis 变量与双库灌好。
- Dockerfile 已 `--server.port=${PORT:-9502}`；Security 已放行 `/actuator/**`。连续失败时优先查日志与 Variables，而不是改路径。

### 环境变量对照（Spring Boot）

与根目录 `.env.example`、`docker-compose.yml`、`application.yml` / `application-prod.yml` 对齐。

**怎么加（Railway App 服务 → Variables）**：点 **Add Variable** → **Add Variable Reference**，选 Redis / MySQL 服务里的插件变量，映射成下表左侧「应用认的名字」。服务名以 Dashboard 为准（常见 `Redis` / `MySQL`）。

Boot 3 / Redisson 读的是 **`spring.data.redis.*`**。`REDIS_URL` / `REDIS_PRIVATE_URL` / 密码 / ACL 用户名由启动桥接注入（**仅非空时**；空串会导致 Redis 6 `WRONGPASS`）。仅设插件原名 `REDISHOST` 也能工作（yml 有 host 回退）；**已设 `REDIS_HOST` 却仍连 localhost** → 旧镜像还在用废弃的 `spring.redis.*`，拉新 commit 后 Redeploy。

**Redis 鉴权（立刻自查）**：

1. App 服务 → Variables：删掉手填的错误 `REDIS_PASSWORD`（若有）。
2. **Add Variable Reference**（不要手打密码）：
   - **推荐一条搞定**：`REDIS_URL` = `${{Redis.REDIS_URL}}`（或内网 `REDIS_PRIVATE_URL` = `${{Redis.REDIS_PRIVATE_URL}}`）
   - 或拆分：`REDIS_HOST` ← `REDISHOST`，`REDIS_PORT` ← `REDISPORT`，`REDIS_PASSWORD` ← **`REDISPASSWORD`**（插件变量名，不是自己编的），可选 `REDIS_USERNAME` ← `REDISUSER`（一般为 `default`）
3. 点开 `REDIS_PASSWORD` 眼睛图标，与 **Redis 服务** Variables 里的 `REDISPASSWORD` **逐字一致**。
4. **Redeploy** App（改变量不会自动进已跑容器）。

| 应用变量（填这个名） | Variable Reference 示例 | 说明 |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod`（手填） | 生产 fail-fast；须显式给齐凭证 |
| `DB_HOST` | `${{MySQL.MYSQLHOST}}` | JDBC 主机；也可直接引用插件 `MYSQLHOST`（yml 回退） |
| `DB_PORT` | `${{MySQL.MYSQLPORT}}` | 默认 3306 |
| `DB_MARTIN` | `martin`（手填） | 系统/认证库名；**不要**只设 `DB_NAME` 指望双库 |
| `DB_ERD` | `erd`（手填） | 建模库名 |
| `DB_USERNAME` | `${{MySQL.MYSQLUSER}}` | martin 账号；别名 `DB_USER` / `MYSQLUSER` 也可 |
| `DB_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` | 别名 `MYSQLPASSWORD` |
| `DB_ERD_USERNAME` / `DB_ERD_PASSWORD` | 同 `DB_USERNAME`/`DB_PASSWORD` 或专用 | 可与 martin 同账号（须两库授权） |
| `REDIS_URL`（**推荐**） | `${{Redis.REDIS_URL}}` | 含用户/密码的完整 URI → `spring.data.redis.url`；优先于拆分变量 |
| `REDIS_PRIVATE_URL`（推荐内网） | `${{Redis.REDIS_PRIVATE_URL}}` | 与上同，主机为 `*.railway.internal`；桥接时优先于 `REDIS_URL` |
| `REDIS_HOST` | `${{Redis.REDISHOST}}` | 无 URL 时用；→ `spring.data.redis.host`；别名 `REDISHOST` |
| `REDIS_PORT` | `${{Redis.REDISPORT}}` | → `spring.data.redis.port`；别名 `REDISPORT` |
| `REDIS_PASSWORD` | `${{Redis.REDISPASSWORD}}` | **Variable Reference**，勿手填；别名 `REDISPASSWORD` |
| `REDIS_USERNAME`（可选） | `${{Redis.REDISUSER}}` | Redis 6 ACL，多为 `default`；别名 `REDISUSER` |
| `JWT_SECRET` | 随机 ≥32 字节（手填） | **必改**；勿用仓库默认值 |
| `JWT_EXPIRES_IN` | `43200` | 可选 |
| `ERD_E2E_ACCOUNTS_ENABLED` | `false` | 公网禁止 e2e 弱口令 |
| `CORS_ALLOWED_ORIGINS` | `https://erdonline-demo.pages.dev` | 逗号分隔；静态 demo 跨域必需 |
| `ERD_UI_URL` | 同上 CF Pages URL | 业务回调/UI 提示用 |
| `OSS_ACCESS_KEY` / `OSS_SECRET_KEY` | 任意非空占位（如 `demo`/`demo`） | `prod` profile 强制存在；无 MinIO 时 Word 自定义上传不可用，内置模板仍可导出 |
| `SOCKETIO_PORT` | `9092` | 容器内 Presence；单公网 HTTP 口时浏览器常连不上，demo 可先忽略 |

> **MySQL 注意**：`MYSQL_URL` / `DB_NAME` **不够**。本应用是双库 JDBC（`DB_MARTIN` + `DB_ERD`），必须有 `DB_HOST`（或 `MYSQLHOST`）与 `DB_USERNAME`（或 `DB_USER`/`MYSQLUSER`）+ 密码。`MYSQL_URL` 可留作备忘，应用不读。

本地 / compose 默认监听 **9502**。Railway 会注入 `PORT`：`backend/Dockerfile` 入口为 `java … --server.port=${PORT:-9502}`，与公网代理对齐。仓库提交了 `backend/railway.toml`（Dockerfile builder + `/actuator/health/liveness`）；Dashboard 仍须设 **Root Directory = `backend`** 与 **Config file = `/backend/railway.toml`**（Root Directory 无法写进 toml）。**Docker / Railway 构建走 Maven Central**（不 COPY `.mvn/settings.xml` 阿里云镜像；国内本机仍可用该 settings）。

### 接 CF Pages


1. Railway liveness 绿，且 `actuator/health` 为 UP（或至少能登录/注册）
2. 仓库 **Settings → Secrets and variables → Actions** → Variable `DEMO_API_URL` = Railway 公网根 URL
3. 跑 `frontend-demo-site.yml`（`workflow_dispatch` 或 push）
4. 打开 https://erdonline-demo.pages.dev ，确认会请求该 API（Network）

### Zeabur 备选（中国区）{#zeabur-demo}

国内网络下可用 [Zeabur](https://zeabur.com/) 作**非默认**备选；官方默认仍以 **Railway** 为准（ADR-0019）。

**这个 URL 是什么**：Zeabur 服务 = **后端 API only**，不是完整产品站。浏览器打开 `https://xxx.zeabur.app/` 看到 404 **常常正常**（Spring Boot 无落地页）。前端试用站仍是 Cloudflare Pages，靠 `DEMO_API_URL` 指向此 API。

#### 预期 404 vs 真挂了

| 现象 | 含义 | 你该做什么 |
|---|---|---|
| `/` → 404，但 `/actuator/health` → `{"status":"UP"}` | API 已通 | 设 `DEMO_API_URL`，用 CF Pages 前端 |
| `/`、`/actuator/health`、`/doc.html` **全部** 404（空 body、`server: Caddy`） | 公网没打到 Boot（常见：Root Directory 仍是仓库根，zbpack 误检前端） | 按下方 Dashboard 必改重建 |
| health 502 / 连不上 | 未听 `PORT`，或缺 DB/Redis 启动失败 | 看「日志」；补 MySQL/Redis 与环境变量 |

```bash
curl -sS -D- -o /dev/null https://YOUR.zeabur.app/            # 可为 404
curl -sS https://YOUR.zeabur.app/actuator/health               # 期望 {"status":"UP"}
```

#### Dashboard 必改（monorepo）

仓库根有 `frontend/`、**无**根级 Dockerfile。Root Directory 留空时 Zeabur 常按 Node 前端构建 → Dashboard「运行中」但 API 全 404。

1. Deploy from GitHub（`erdonline/erdonline`）
2. **设置 → Root Directory** = `backend`（与 `backend/Dockerfile` / compose 一致）；改完会重建
3. 确认走 **Dockerfile**；若仍误检，环境变量加 `ZBPACK_DOCKERFILE_PATH=Dockerfile`
4. **网络**绑定公网域名。入口已读平台 `PORT`（`--server.port=${PORT:-9502}`），不必手填 9502
5. 首个 `v*` 且 GHCR 有包后，也可改用镜像 `ghcr.io/erdonline/erdonline-backend:latest`

#### MySQL + Redis + 环境变量

与上节 Railway **同一张表**（`SPRING_PROFILES_ACTIVE=prod`、`DB_*`、`REDIS_*`、`JWT_SECRET`、`CORS_ALLOWED_ORIGINS`、`ERD_UI_URL`、`OSS_*` 占位、`ERD_E2E_ACCOUNTS_ENABLED=false`）。

1. 同项目添加 **MySQL 8** + **Redis**
2. 建双库并灌基线（公网勿灌 `05_e2e_users.sql`）：
   ```sql
   CREATE DATABASE IF NOT EXISTS erd DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
   CREATE DATABASE IF NOT EXISTS martin DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
   ```
   再导入 `db/init/02_*.sql` …；Flyway 只迁 **erd** 增量，**martin** 须来自 init
3. 把平台 MySQL/Redis 的 host/port/密码**显式映射**成 `DB_HOST` / `REDIS_HOST` 等 Spring 名
4. `CORS_ALLOWED_ORIGINS` / `ERD_UI_URL` = CF Pages demo 源（如 `https://erdonline-demo.pages.dev`）
5. health 绿后：GitHub Actions Variable `DEMO_API_URL=https://YOUR.zeabur.app`（无尾斜杠）→ 重跑 `frontend-demo-site.yml`

#### 最短路径

1. Root Directory=`backend` + MySQL + Redis + 上表变量 → 域名 PROVISIONED  
2. `curl …/actuator/health` 见 `UP`（预览窗打开 `/` 的 404 可忽略）  
3. `DEMO_API_URL` → 打开 CF Pages demo 试用  

## Docker Compose（推荐 · 用户自托管 / 生产）

```bash
cp .env.example .env      # 修改端口 / 密码；可选 ERD_IMAGE_TAG
docker compose pull       # 优先使用 GHCR 预构建镜像
docker compose up -d      # mysql + redis + backend + frontend
# 或本地构建：docker compose build && docker compose up -d
docker compose logs -f backend   # 查看后端日志
```

**Schema 双源（自部署必读）**

| 来源 | 何时生效 | 说明 |
|---|---|---|
| `db/init/` | MySQL **空 data 卷**首次启动 | 建库建表 + 种子；卷已存在时**不会**再跑。应急可手工 `mysql < db/init/0x_*.sql` |
| Flyway（`backend/.../db/migration/erd/`） | **后端每次启动**（`ErdFlywayConfig` → `erd` 库） | 增量 schema 的**真相源**；升级已有部署靠后端拉起即可，不必手跑 init |

新变更优先只加 Flyway 脚本。若为逃生口双写 `db/init`，须与 Flyway 脚本一致且幂等。勿再为常规功能追加 `07`/`08`/`09` 类 init 补丁（除非紧急）。

访问：

- 前端 http://localhost:8000
- 后端 API http://localhost:9502

### 健康检查 / 版本信息（自部署验收）

后端已挂 Spring Actuator，**仅**暴露 `health` 与 `info`（匿名可读；不暴露 env/beans/metrics）。已开 Boot probes。compose 或独立 jar 拉起后：

```bash
# 部署门禁 / 存活（不含 db/redis）
curl -sS http://localhost:9502/actuator/health/liveness
# 期望 {"status":"UP"}

# 业务就绪（含 db/redis；依赖挂则 503）
curl -sS http://localhost:9502/actuator/health

# 应用名 + 版本（本地 classpath 常为 "dev"；正式 jar 为 Manifest 版本）
curl -sS http://localhost:9502/actuator/info
# 期望含 "app":{"name":"erd-online","version":"..."}
```

未暴露的 actuator 子路径返回 **404**（勿再伪装成 500「操作发生错误」）。

### 一键验收脚本

栈拉起后（`docker compose up -d` **或** 本地 `mysql/redis` + `./backend/dev-ensure.sh` + `yarn start`）跑：

```bash
./scripts/verify-self-deploy.sh
# 期望：health UP、info 含 erd-online、/actuator/env → 404、前端 / → 200；
#       若存在容器 erd-mysql，再断言 erd.flyway_schema_history 有成功版本
```

可选环境变量：`API_BASE` / `FE_BASE` / `SKIP_FE=1` / `SKIP_FLYWAY=1` / `MYSQL_CONTAINER`。

### 升级路径演练（已有 data 卷）

自部署升级**不**重跑 `db/init/`（卷已存在时 MySQL 入口脚本不会再次执行）。增量 schema 靠后端启动时 Flyway 打到 **erd** 库。

```bash
# 1) 备份（示例：具名卷）
docker compose stop
docker run --rm -v erdonline_erd-mysql-data:/v -v "$(pwd)":/b alpine \
  tar czf /b/erd-mysql-backup-$(date +%Y%m%d).tgz -C /v .

# 2) 拉新代码 / 新镜像（优先 GHCR；无对应 tag 再本地 build）
git pull
# docker compose build backend frontend   # 仅本地改源码时
docker compose pull
docker compose up -d

# 3) 验收（含 Flyway 最新成功版本号）
./scripts/verify-self-deploy.sh

# 4) 可选：看迁移历史
docker exec erd-mysql mysql -uerd -perd erd \
  -e "SELECT installed_rank,version,description,success FROM flyway_schema_history ORDER BY installed_rank;"
```

本地开发（非 compose 全栈）升级同样只需 `./backend/dev-ensure.sh --restart`（classpath 有新 `V*__*.sql` 即 migrate），再跑同一验收脚本。

## 服务说明

| 服务 | 端口 | 说明 |
|---|---|---|
| frontend | 8000 | Nginx 托管前端静态资源，反代 `/api`、`/ncnb` 到后端 |
| backend | 9502 | Spring Boot 单体 |
| mysql | 3306 | 数据库（erd + martin） |
| redis | 6379 | token / 缓存 |
| MinIO（可选） | 9000 | 对象存储；**非 compose 默认依赖** |

### MinIO（可选）

默认 `docker compose` **不含** MinIO。Word 导出与「下载默认模板」使用后端 classpath 内置模板（`templates/word/defaultWorldTemplate.docx`），无 MinIO 亦可导出。

需要**上传自定义 Word 模板**或把默认模板托管到对象存储时，再配置：

```bash
# 环境变量示例（需同时满足 Bean 条件 martin.oss.minio.endpoint）
OSS_ENDPOINT=http://localhost:9000
OSS_ACCESS_KEY=minio
OSS_SECRET_KEY=...
```

并在 `application.yml` / 覆盖配置中声明嵌套项，例如：

```yaml
martin:
  oss:
    minio:
      endpoint: ${OSS_ENDPOINT}
      accessKey: ${OSS_ACCESS_KEY}
      secretKey: ${OSS_SECRET_KEY}
```

未配置时：`gendocx` / `downloadWordTemplate` 降级走内置模板；`uploadWordTemplate` 返回明确错误（提示配置 MinIO），不再 NPE。

## 生产建议

- 修改 `.env` 中所有默认密码（含 `admin`）
- **删除或改密种子账号** `e2e0`..`e2e15`、`e2e-serial`（弱口令仅供本地/CI；`prod` 默认拒绝登录，仍建议删库内记录）
- 勿设置 `ERD_E2E_ACCOUNTS_ENABLED=true` 到公网环境
- 后端 jar 单独部署时，通过环境变量覆盖数据源/redis 配置（见 `application-prod.yml`）
- 前端可将 `dist/` 部署到任意静态服务器 / CDN，运行时通过 `env-config.js` 注入 `API_URL`

## 手动构建产物

```bash
# 后端 jar
cd backend && mvn clean package -DskipTests   # 产物：target/*.jar

# 前端 dist（生产：先写 env-config.js）
cd frontend && yarn && API_URL= ERD_API_URL= yarn build:prod   # 产物：dist/
```

### 前端 `env-config.js`（构建时 vs 运行时）

| 场景 | 做法 |
|---|---|
| 本地 `yarn start` | `env.local.sh` → `public/env-config.js`（开发代理） |
| 静态 CDN / CF Pages | CI 设 `API_URL`/`ERD_API_URL`（或 `DEMO_API_URL`）后 `yarn build:prod`，配置打进 `dist/env-config.js` |
| Docker / Nginx 同源 | 镜像内可空；容器启动 `docker-entrypoint.sh` 按环境变量重写 `env-config.js` |

浏览器读 `window._env_.API_URL`（见 `frontend/src/utils/request.js`）。静态 demo **没有**同源反代时必须填可公网访问的后端 URL；留空则仅适合落地/文档类页面。
