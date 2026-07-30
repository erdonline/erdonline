# 开发指南 / Development

## 环境要求

| 工具 | 版本 |
|---|---|
| JDK | 8 |
| Maven | 3.6+ |
| Node.js | 16+ |
| Yarn | 1.x |
| MySQL | 8 |
| Redis | 5+ |

## 启动步骤

```bash
# 1. 起数据库（可用 Docker，也可用本机已有服务）
docker compose up -d mysql redis

# 2. 后端（默认端口 9502，profile=dev）
cd backend
mvn spring-boot:run

# 3. 前端（默认端口 8000）
cd frontend
yarn
yarn start
```

或一键：`./scripts/dev.sh`

## 前端如何找到后端

前端通过 `frontend/config/proxy.ts` 在开发环境把 `/api`、`/ncnb` 代理到 `http://localhost:9502`。
生产环境通过 `public/env-config.js`（由 `.env` 生成）注入 `window._env_.API_URL`。

## 后端包结构

```
com.erdonline
├── ErdOnlineApplication   # 启动类
├── auth/                  # OAuth2
├── system/                # 用户/权限/菜单/字典
├── erd/                   # 建模核心
├── common/                # 公共库
└── config/                # 全局配置
```

## 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)，详见 [CONTRIBUTING.md](../CONTRIBUTING.md)。

## 常见问题

- **后端启动报连接 MySQL 失败**：确认 `docker compose up -d mysql redis` 已就绪，且 `application-dev.yml` 数据源指向正确
- **前端登录 401**：确认后端已启动且数据库 `oauth_client_details` 表有 `client2` 记录
