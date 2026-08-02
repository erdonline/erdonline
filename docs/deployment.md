# 部署指南 / Deployment

## 官方托管拓扑（无 VPS）

决策见 [ADR-0018](./adr/0018-hosting-topology-no-vps.md)。项目方**不买生产 VPS**、不托管用户生产数据；公开表面用 GitHub + Cloudflare 免费档。

```
文档站 ──► Cloudflare Pages（erdonline-docs）  [主]
       └─► GitHub Pages（/erdonline/）         [回退]

静态 demo ─► Cloudflare Pages（erdonline-demo）
             env-config.js ← Variables: DEMO_API_URL（可空）

运行时镜像 ─► GHCR
  ghcr.io/erdonline/erdonline-backend
  ghcr.io/erdonline/erdonline-frontend

自托管数据面 ─► 用户自己的 docker compose（MySQL/Redis + 上列镜像）
```

| 表面 | 工作流 | 所需配置 |
|---|---|---|
| 文档 | `.github/workflows/docs-site.yml` | 见下「Cloudflare secrets」；无 secrets 时仅 GH Pages |
| 静态 demo | `.github/workflows/frontend-demo-site.yml` | 同上 + 可选 Variable `DEMO_API_URL` |
| 发版镜像 | `.github/workflows/release.yml`（tag `v*`） | `GITHUB_TOKEN` 写 GHCR（默认可用） |

### Cloudflare secrets / 项目

在 GitHub 仓库 **Settings → Secrets and variables → Actions** 配置：

| Name | 类型 | 用途 |
|---|---|---|
| `CLOUDFLARE_PAGES_DEPLOY` | Variable | 设为 `true` 才跑 CF 部署 job（无此变量时仅 GitHub Pages / 跳过 demo） |
| `CLOUDFLARE_API_TOKEN` | Secret | Pages 部署；权限至少 Account → Cloudflare Pages → Edit |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | Cloudflare 账户 ID |
| `DEMO_API_URL` | Variable（可选） | 静态 demo 构建时写入 `public/env-config.js`；**未设置则 API 为空**（落地页仍可访问；完整试用待公网后端） |

Cloudflare Dashboard 预先创建 Pages 项目（Direct Upload / 空项目即可，由 Actions 推送）：

- `erdonline-docs` — 文档
- `erdonline-demo` — 前端静态站

文档双宿主：`website/docusaurus.config.js` 读 `DOCUSAURUS_URL` / `DOCUSAURUS_BASE_URL`（GH 构建用 `/erdonline/`，CF 构建用 `/`）。

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

> 公网 demo API（Render 等）**尚未**作为官方步骤部署；静态站可先上，API 旅程随后。

## Docker Compose（推荐）

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

后端已挂 Spring Actuator，**仅**暴露 `health` 与 `info`（匿名可读；不暴露 env/beans/metrics）。compose 或独立 jar 拉起后：

```bash
# 存活：期望 {"status":"UP"}
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
