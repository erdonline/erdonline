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

# 2. 后端（默认端口 9502，profile=dev；tmux 常驻，与终端生命周期解耦）
./backend/dev-ensure.sh            # 幂等：健康秒退，不健康自动拉起
./backend/dev-ensure.sh --restart  # 改了 Java/yml/mapper 后重启
./backend/dev-ensure.sh --logs     # 看启动日志

# 3. 前端（默认端口 8000）
cd frontend
yarn
yarn start
```

> 后端不要用 `mvn spring-boot:run` 或在普通 shell 里 `nohup`：IDE/agent 会话结束会杀子进程。`dev-ensure.sh` 把进程托管进 tmux 会话 `erd-be`，终端关闭不影响。依赖：`brew install tmux`。

## E2E（Playwright）

```bash
cd frontend
yarn test:e2e                 # 多 worker 并发（本地最多 4，CI 默认 2）
PW_WORKERS=1 yarn test:e2e    # 强制串行排查
```

- 并发隔离：项目名 `e2e-w{n}-` 前缀，清理只删本 worker
- 空态/示例用例在 `chromium-serial`（等并行项目结束后再跑，账号锁互斥）

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

## 性能预算

指标与红线见 [performance-budget.md](./performance-budget.md)。改依赖或核心旅程后对照表内命令复测。

## 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)，详见 [CONTRIBUTING.md](../CONTRIBUTING.md)。

## 常见问题

- **后端启动报连接 MySQL 失败**：确认 `docker compose up -d mysql redis` 已就绪，且 `application-dev.yml` 数据源指向正确
- **前端登录 401**：确认后端已启动且数据库 `oauth_client_details` 表有 `client2` 记录
