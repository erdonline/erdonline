# 部署指南 / Deployment

## Docker Compose（推荐）

```bash
cp .env.example .env      # 修改端口 / 密码
docker compose up -d      # mysql + redis + backend + frontend
docker compose logs -f backend   # 查看后端日志
```

首次启动时，MySQL 会自动执行 `db/init/` 下的初始化脚本，创建 `erd` 与 `martin` 库。

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

## 生产建议

- 修改 `.env` 中所有默认密码
- 后端 jar 单独部署时，通过环境变量覆盖数据源/redis 配置（见 `application-prod.yml`）
- 前端可将 `dist/` 部署到任意静态服务器 / CDN，运行时通过 `env-config.js` 注入 `API_URL`

## 手动构建产物

```bash
# 后端 jar
cd backend && mvn clean package -DskipTests   # 产物：target/*.jar

# 前端 dist
cd frontend && yarn && yarn build              # 产物：dist/
```
