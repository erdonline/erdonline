# 部署指南 / Deployment

## Docker Compose（推荐）

```bash
cp .env.example .env      # 修改端口 / 密码
docker compose up -d      # mysql + redis + backend + frontend
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

# 前端 dist
cd frontend && yarn && yarn build              # 产物：dist/
```
