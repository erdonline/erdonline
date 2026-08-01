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

本地 **MySQL / Redis 只跑在 Colima（Docker）**，不要再用 `brew services` 起本机实例（端口会冲突）。

```bash
# 0. Colima（首次需盘镜像；国内勿直连 GitHub）
#    加速门户：https://github.akams.cn/  （拼法 https://<node>/https://github.com/...）
#    例：curl -fL -o ~/Downloads/ubuntu-24.04-minimal-cloudimg-arm64-docker.raw.gz \
#      'https://github.dpik.top/https://github.com/abiosoft/colima-core/releases/download/v0.10.4/ubuntu-24.04-minimal-cloudimg-arm64-docker.raw.gz'
colima start --cpu 4 --memory 8 --disk 40 \
  --disk-image ~/Downloads/ubuntu-24.04-minimal-cloudimg-arm64-docker.raw.gz
# Docker Hub 国内源：~/.colima/default/colima.yaml → docker.registry-mirrors
# （本机无 compose 插件时用 docker-compose）
# Agent 全局规则：~/.cursor/rules/github-download-proxy.mdc

## 5 分钟 Vision 自迭代（可选）

```bash
./scripts/agent-loop-vision.sh   # 默认每 300s 唤醒；PROMPT 每次读 scripts/agent-loop-vision.prompt.md
# AGENT_LOOP_VISION_INTERVAL=600 ./scripts/agent-loop-vision.sh
```

选题规则在 `scripts/agent-loop-vision.prompt.md`：每 tick **从 roadmap/CHANGELOG/git 现场推导目标**，不写死功能主线；改 prompt 文件即可，不必重启循环。

双周发版笔记（用户向）：

```bash
./scripts/cut-release-notes.sh --dry-run
./scripts/cut-release-notes.sh          # → docs/releases/YYYY-MM-DD.md
```

说明见 `docs/releases/README.md`。

# 1. 起数据库
docker-compose up -d mysql redis

# 1b. （可选）逆向方言验证库：PostgreSQL + SQL Server
#     ./scripts/dev-reverse-dbs.sh
#     或仅 PG：docker-compose --profile reverse up -d postgres
#     连接见脚本输出；MySQL 验证库 reverse_demo（root/root）

# 2. 后端（默认端口 9502，profile=dev；tmux 常驻）
./backend/dev-ensure.sh            # 幂等：健康秒退，不健康自动拉起
./backend/dev-ensure.sh --restart  # 改了 Java/yml/mapper 后重启
./backend/dev-ensure.sh --logs     # 看启动日志

# 3. 前端（默认端口 8000）
cd frontend
yarn
yarn start
```

> 后端不要用 `mvn spring-boot:run` 或在普通 shell 里 `nohup`：IDE/agent 会话结束会杀子进程。`dev-ensure.sh` 把进程托管进 tmux 会话 `erd-be`，终端关闭不影响。依赖：`brew install tmux`。  
> Agent/人强制入口见 `.cursor/rules/dev-entrypoints.mdc`：后端只调 `dev-ensure.sh`；前端 `yarn start` 常驻、改代码靠 HMR、禁止为生效而重启。

## E2E（Playwright）

```bash
cd frontend
yarn test:e2e                 # 多 worker 并发（本地默认 ceil(CPU/2)，上限 16；CI 默认 2）
PW_WORKERS=16 yarn test:e2e   # 拉满（需 16 核级机器）
PW_WORKERS=1 yarn test:e2e    # 强制串行排查
```

- 并发隔离：本地上限 16 worker（默认 `ceil(CPU/2)`，满配 `PW_WORKERS=16`）；每 worker 登录 `e2e{n}`（`e2e0`..`e2e15`）；项目名 `e2e-w{n}-` 前缀
- 空态/示例用例在 `chromium-serial`（`workers: 1`），账号 `e2e-serial`
- 已有库补种子：`mysql -h127.0.0.1 -uroot -proot < db/init/05_e2e_users.sql`
- 已有库补数据源表：`docker exec -i erd-mysql mysql -uroot -proot < db/init/07_data_sources.sql`
- 已有库补公开演示：`docker exec -i erd-mysql mysql -uroot -proot < db/init/08_public_demo.sql`（访问 `/demo`）
- 后端 `dev` 打开 `erd.security.e2e-accounts-enabled`；`prod` 拒绝 `e2e\\d+` / `e2e-serial` 登录
- 定位优先级见 `.cursor/rules/e2e-locators.mdc`：`getByRole` → label/placeholder → `getByTestId`；禁止 `.ant-*`

## 前端如何找到后端

前端通过 `frontend/config/proxy.ts` 在开发环境把 `/api`、`/ncnb`、`/auth` 代理到 `http://localhost:9502`。
后端 `GatewayPrefixStripFilter` 剥离 `/ncnb`|`/auth`|`/syst` 前缀后再进 Controller。
生产环境通过 `public/env-config.js`（由 `.env` 生成）注入 `window._env_.API_URL`。

联调探测（登录后打常用接口，期望无 404/405/500）：

```bash
./scripts/audit-fe-apis.sh
# 或指定：./scripts/audit-fe-apis.sh http://localhost:9502 e2e0 123456
```

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

- **后端启动报连接 MySQL 失败**：确认 `colima status` 为 running，且 `docker-compose up -d mysql redis` 健康；勿与 brew MySQL 抢 3306
- **前端登录 401**：确认后端已启动且数据库 `oauth_client_details` 表有 `client2` 记录
