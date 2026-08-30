# 开发指南 / Development

## 环境要求

| 工具 | 版本 |
|---|---|
| JDK | 8 |
| Maven | 3.6+（`backend/.mvn/maven.config` 自动 `-s .mvn/settings.xml`，走阿里云公共仓，绕过本机 JD Artifactory） |
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

**根因（e5842d5，2026-08-04 复核）**：旧版本把整段 tick payload（含 prompt 全文）打到 stdout，靠某个 Cursor Shell 工具持续「读」这条管道才不阻塞；聊天结束后没人再读，OS 管道缓冲区几轮内写满，进程 `write()` 阻塞 —— 表现为「进程还在但卡死」（`ps` 能看到，tick 不再产出）。

**已评估 Cursor Automations（cron 触发）替代 stdout 心跳**：不可行，两点原因都成立——(1) 本仓库当前会话没有 `open_automation` / `open_resource` 编辑器句柄，无法从对话内直接创建；(2) 即使能创建，Automations 的 cron 触发跑的是**云端全新沙箱**，每 tick 都要重新拉库/起 Colima/`docker-compose up`/`dev-ensure.sh`，与本仓「前后端常驻进程、永不重启」的开发回路速度纪律（`dev-loop-speed.mdc`）冲突，且验证不到本机 9502/8000 上真实跑着的实例。**结论：Vision 心跳继续走本地脚本，但改成文件落盘，不再依赖 stdout 管道被消费。**

修复后的机制：tick 主体直接 **append 写文件**（`TICK_FILE`，默认 `/tmp/erd-vision-tick.log`），文件写入不看有没有人在读，天然不会因消费者缺席而阻塞；文件超过 `AGENT_LOOP_VISION_TICK_MAX_LINES`（默认 500 行）自动裁剪只保留最近的 tick，避免无限增长。stdout 只留一行定长心跳（不含 prompt 正文），常年不可能写满管道。

```bash
# 幂等启动/恢复：挂在 tmux 会话 erd-vision，不受当前 Shell 工具或聊天结束影响
tmux has-session -t erd-vision 2>/dev/null || \
  tmux new-session -d -s erd-vision '/Users/liangcan9/cursor/erdonline/scripts/agent-loop-vision.sh'

# 查看最近几条 tick（文件落盘，随时可读，不需要「有人在盯着」）
tail -n 3 /tmp/erd-vision-tick.log

# 确认心跳仍在产出（对比文件 mtime 与当前时间，超过 2× INTERVAL 说明已卡死，需重启）
stat -f '%Sm' /tmp/erd-vision-tick.log   # macOS；Linux 用 stat -c '%y'

# 改了 prompt.md 不需要重启，脚本每 tick 重新读文件

# 停止
tmux kill-session -t erd-vision

# 如需自定义间隔 / tick 文件路径
AGENT_LOOP_VISION_INTERVAL=600 AGENT_LOOP_VISION_TICK_FILE=/tmp/erd-vision-tick.log \
  tmux new-session -d -s erd-vision '/Users/liangcan9/cursor/erdonline/scripts/agent-loop-vision.sh'
```

选题规则在 `scripts/agent-loop-vision.prompt.md`：**常驻指令 = 持续优化 UI/UX，不要停**（体验轨偏置；每 tick 必须交付前端可见体验改进）。PM 发现→ROI→验证→commit；禁止默认 idle；改 prompt 即可，不必重启 shell。agent 回报 idle 时也**不退出**，5m 继续唤醒。

**重要边界（诚实说明）**：文件落盘只解决「进程会不会卡死」，不解决「谁来读文件并真正开工」。本机脚本本身**不能**在没有任何活跃 Agent 会话时凭空唤起一次新的 Cursor 对话——`/tmp/erd-vision-tick.log` 是一个可随时查询的心跳/待办账本，需要人或一个正在跑的 Agent 会话定期 `tail` 它并据此执行 `agent-loop-vision.prompt.md`。若确实需要「完全无人值守、云端定时唤起 Agent」，唯一路径是用户自己在 **Agents Window** 里用 `automate` 技能创建一个 cron Automation（建议 10–15 分钟一次，而非 5 分钟，因每次都是全新云端沙箱、有环境冷启动成本），prompt 内容指向读取并执行 `scripts/agent-loop-vision.prompt.md` 的产品发现规则；但该云端 Automation **验证不到本机 9502/8000 常驻实例**，只适合纯代码/文档类切片，不适合需要本机联调验证的切片——因此当前阶段建议仍以本地文件心跳 + 人工/会话内定期 `tail` 为主。

**模型路由**（思考强 / 执行便宜，详见 prompt.md「模型路由」节）：收到 tick 的协调者用两次独立 `Task` 调用把决策和落地拆开——think 子任务默认 `claude-sonnet-5-thinking-high`（硬架构决策/卡壳升级 `claude-opus-5-thinking-high`），exec 子任务默认 `composer-2.5-fast`（前端强类型/易抖动场景换 `gpt-5.6-sol-medium`）；可用 `VISION_THINK_MODEL` / `VISION_EXEC_MODEL` 覆盖默认值。

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

# 4. （可选）自部署同款验收：health/info/前端 + erd Flyway
./scripts/verify-self-deploy.sh
```

生产 compose 验收与**已有卷升级演练**见 [deployment.md](./deployment.md)。

> 后端不要用 `mvn spring-boot:run` 或在普通 shell 里 `nohup`：IDE/agent 会话结束会杀子进程。`dev-ensure.sh` 把进程托管进 tmux 会话 `erd-be`，终端关闭不影响。依赖：`brew install tmux`。  
> Agent/人强制入口见 `.cursor/rules/dev-entrypoints.mdc`：后端只调 `dev-ensure.sh`；前端 `yarn start` 常驻、改代码靠 HMR、禁止为生效而重启。  
> 本地 `config.dev.ts` 已设 `mfsu: false`（MFSU eager 曾卡住 build worker / 送旧模块）；改该开关后需重启一次 `yarn start`。  
> 设计器进版本管理：侧栏「版本 → 版本管理」，或顶栏项目菜单「版本」（均打开 `/design/table/version/all`）。版本页顶栏「返回模型」回 `/design/table/model?projectId=…`（侧栏「模型」常被树遮挡，勿只依赖侧栏）。

## 前端样式（token first）

工作台样式优先 antd 5 **ConfigProvider theme tokens**，少维护散落 less。

| 真相源 | 路径 |
|---|---|
| antd tokens | `frontend/src/theme/tokens.ts` → `components/Theme`（`ConfigProvider`） |
| CSS 变量（与上同值） | `frontend/src/theme/css-vars.less`（由 `global.less` 引入） |

布局 chrome（Home/Group/Design 已 BEM + `var(--erd-*)`；`account/settings` 仍挂 ProLayout）;**落地页** `pages/landing/index.less` 保留深色门面 scoped less，但色/字已读 `--erd-*`（禁止再发明第二套色板）。新颜色/圆角先改 `tokens.ts`。细则见 [ui-home-model-redesign.md](./ui-home-model-redesign.md)#样式策略token-first。

## 前端单测（轻量）

`max test` 依赖的 PuppeteerEnvironment 已不可用；画布 undo 栈用：

```bash
cd frontend && yarn test:unit:canvas-history
```

## E2E（Playwright）

```bash
cd frontend
yarn test:e2e                 # 全量（chromium + chromium-serial；无 project deps，可并行）
yarn test:e2e:serial          # 仅串行项目（activation / 空态 / export-feedback）
PW_WORKERS=16 yarn test:e2e   # 拉满并行段（需 16 核级机器）
# 单条并行用例
npx playwright test tests/e2e/smoke.spec.ts --project=chromium --grep '关键字'
# 单条串行用例（勿漏 --project=chromium-serial；workers=1 已在 config，无需 --no-deps）
npx playwright test tests/e2e/activation.spec.ts --project=chromium-serial --grep '关键字'
```

- 并发隔离：本地上限 16 worker（默认 `ceil(CPU/2)`，满配 `PW_WORKERS=16`）；每 worker 登录 `e2e{n}`（`e2e0`..`e2e15`）；项目名 `e2e-w{n}-` 前缀
- 空态/示例/导出失败用例在 `chromium-serial`（config 内 `workers: 1`，账号 `e2e-serial`）；**不要**给该 project 配 `dependencies: ['chromium']`（曾导致 `--project=chromium-serial` 先跑完整套 chromium）；CI 全量顺序见 `e2e-smoke.yml` 两步
- E2E / 公开 demo 种子：空卷由后端 Flyway `V5`/`V6` 写入；已有库可 `./backend/dev-ensure.sh --restart` 或查 `flyway_schema_history`
- 改公开/登录示例模型：先改 `schema/examples/demo.projectjson.json`，再 `node scripts/sync-demo-projectjson.mjs`，再确保 Flyway `V5` 已应用（或对新库重建卷）
- 后端 `dev` 打开 `erd.security.e2e-accounts-enabled`；`prod` 拒绝 `e2e\\d+` / `e2e-serial` 登录
- 定位优先级见 `.cursor/rules/e2e-locators.mdc`：`getByRole` → label/placeholder → `getByTestId`；禁止 `.ant-*`

## 质量门禁（CI / pre-push）

**主门禁：构建后 SPA 能否启动**（防「review 看着没问题、上线整站白屏」）

```bash
cd frontend
yarn check:prod-smoke          # yarn build（若无 dist）→ CF-like serve dist（目录 index.html 优先于 SPA）→ 公开 URL 无 pageerror + #root 有内容
PROD_SMOKE_SKIP_BUILD=1 yarn check:prod-smoke   # CI：build 后只跑 smoke
PROD_SMOKE_SKIP_PRE_PUSH=1 git push             # 跳过 pre-push 全量 smoke（CI/deploy 仍会跑）
```

公开 URL 集：`/`、`/compare`、`/catalog`、`/demo`（→ `/s/public-demo`）、`/en`、`/en/compare`。无需后端即可验证 **SPA 初始化**；会捕获 route flatten、坏 import 等 init 级崩溃（2026-08 `/demo` 白屏即此类）。

**辅门禁（秒级，不能替代 smoke）**：

```bash
yarn check:routes      # umi wrapper + 绝对子 path 静态断言（ADR-0034 举一反三之一）
yarn check:i18n        # locale 键对齐 + 硬编码中文棘轮
node ../scripts/check-routes.mjs --self-test
```

| 场景 | 门禁 |
|---|---|
| **CI** `frontend-ci.yml` | build → **`check:prod-smoke`**（阻断合并） |
| **Deploy** `frontend-demo-site.yml` | build:prod → **`check:prod-smoke`** → CF Pages（阻断发布） |
| **Pre-push** | `check:routes` + `check:i18n`；若 push 含 `frontend/**` 变更则 **`check:prod-smoke`**（~3–5 min，可 `PROD_SMOKE_SKIP_PRE_PUSH=1` 跳过） |

安装 pre-push hook：

```bash
chmod +x scripts/install-git-hooks.sh scripts/git-hooks/pre-push
./scripts/install-git-hooks.sh
```

**LocaleRoute 子路由规则**（静态补网）：带 `wrappers: ['@/components/LocaleRoute']` 且有 `routes` 时，子 `path` 用相对段（`''`、`publish`、`:id`），勿写 `/catalog/...` 绝对路径。

### Schema 双源（`db/init` vs Flyway）

| 来源 | 路径 | 职责 |
|---|---|---|
| 空卷首启（schema-only） | `db/init/01_create_database.sql` + `02_tables.sql` | MySQL **空 data 卷**首次挂载执行；只建库 + CREATE TABLE（ADR-0020） |
| 增量 schema **与种子** | `backend/src/main/resources/db/migration/erd/`（`V*__*.sql`） | `ErdFlywayConfig` 打到单一业务库；**新变更只写这里** |

约定：

- **`db/init` 禁止再加种子 / privileges**；日常增量只加 Flyway `V*__*.sql`
- 配置：`spring.flyway.enabled=false`；`ErdFlywayConfig` 绑 `erdDataSource`（与系统 DS 同库）
- 从旧双库升级：见 ADR-0020「后果」；本地最快路径 `docker compose down -v && docker compose up -d`
- 改迁移后：`./backend/dev-ensure.sh --restart`（pom 变更先刷新 `target/cp.txt`）

## 文档站（Docusaurus）

```bash
cd website && yarn && yarn start   # http://localhost:3000/
cd website && yarn build           # 产物 website/build；死链会失败
```

消费仓库 `docs/`（ADR-0003）。**产品面文档入口**：[https://doc.erdonline.com/](https://doc.erdonline.com/)（唯一公开地址）。本地中文搜索：`@easyops-cn/docusaurus-search-local`（需 `yarn build && yarn serve` 验证索引；dev 下索引可能不全）。  
CI：`.github/workflows/docs-site.yml`（PR 构建；`main` → Cloudflare Pages `erdonline-docs` 绑定 `doc.erdonline.com`）。  
须仓库 Variable `CLOUDFLARE_PAGES_DEPLOY=true`。GitHub Pages 已关闭，不要再开。  
静态 demo：`.github/workflows/frontend-demo-site.yml` → CF 项目 `erdonline-demo`（见 [deployment.md](./deployment.md) 托管拓扑）。

## 协作 Presence（SocketIO）

- 端口 `9092`（netty-socketio，与 HTTP `9502` 分离）；前端 `SOCKETIO_URL`（dev 默认 `http://localhost:9092`）
- 握手：先 `POST /auth/socket-ticket`（Bearer JWT）拿短票，再连 namespace `/project/erd`（query 须带真实 `projectId`；用户须 ∈ `project_user`，见 ADR-0009 / R-AUTH-05）
- 验证：`node scripts/verify-socket-presence.mjs`；`verify-socket-cursor.mjs`；`verify-socket-sync.mjs`；**负向** `verify-socket-membership.mjs`；E2E `presence.spec.ts`

## projectJSON schema（agent 可读）

见 [`data-format.md`](./data-format.md) 与仓库根 `schema/`。

## 公开 API PAT / OAuth（ADR-0013）

```bash
# 1. 会话登录拿 JWT（示例）
TOKEN=$(curl -sS -X POST http://127.0.0.1:9502/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"123456"}' | jq -r '.access_token // .data.access_token')

# 2. 铸造 PAT（明文仅此一次）
PAT=$(curl -sS -X POST http://127.0.0.1:9502/auth/personal-access-tokens \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"dogfood"}' | jq -r '.data.token')

# 3. 公开探针 + 项目/版本（默认 read；写须显式 scopes）
curl -sS http://127.0.0.1:9502/api/v1/me -H "Authorization: Bearer $PAT"
curl -sS 'http://127.0.0.1:9502/api/v1/projects?page=1&size=20' -H "Authorization: Bearer $PAT"
# ID=$(… | jq -r '.data.items[0].id')
# curl -sS "http://127.0.0.1:9502/api/v1/projects/$ID" -H "Authorization: Bearer $PAT"
# curl -sS "http://127.0.0.1:9502/api/v1/projects/$ID/versions?page=1&size=20" -H "Authorization: Bearer $PAT"
# VID=$(… | jq -r '.data.items[0].id')
# curl -sS "http://127.0.0.1:9502/api/v1/projects/$ID/versions/$VID" -H "Authorization: Bearer $PAT"

# 4. 写 scope 铸造 + 提交版本 / 写项目
# WPAT=$(curl -sS -X POST http://127.0.0.1:9502/auth/personal-access-tokens \
#   -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
#   -d '{"name":"write","scopes":["projects:read","projects:write","versions:read","versions:write"]}' | jq -r '.data.token')
# curl -sS -X POST "http://127.0.0.1:9502/api/v1/projects/$ID/versions" \
#   -H "Authorization: Bearer $WPAT" -H 'Content-Type: application/json' \
#   -d '{"dbKey":"defaultDB","version":"1.0.1","versionDesc":"api","projectJSON":{"modules":[]}}'
# curl -sS -X PATCH "http://127.0.0.1:9502/api/v1/projects/$ID" \
#   -H "Authorization: Bearer $WPAT" -H 'Content-Type: application/json' \
#   -d '{"projectName":"via-api","description":"patched"}'
# curl -sS -X PUT "http://127.0.0.1:9502/api/v1/projects/$ID/projectJSON" \
#   -H "Authorization: Bearer $WPAT" -H 'Content-Type: application/json' \
#   -d '{"projectJSON":{"modules":[],"profile":{"dbs":[{"url":"secret"}]}}}'

# 5. OAuth 切片 A：注册 client → client_credentials → /api/v1（与 PAT 等价 Bearer）
# CREATED=$(curl -sS -X POST http://127.0.0.1:9502/auth/oauth-clients \
#   -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
#   -d '{"name":"ci-bot"}')
# CLIENT_ID=$(echo "$CREATED" | jq -r '.data.clientId')
# CLIENT_SECRET=$(echo "$CREATED" | jq -r '.data.clientSecret')  # 仅此一次
# OAT=$(curl -sS -X POST http://127.0.0.1:9502/oauth/token \
#   -H 'Content-Type: application/x-www-form-urlencoded' \
#   -d "grant_type=client_credentials&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET" \
#   | jq -r '.access_token')
# curl -sS http://127.0.0.1:9502/api/v1/me -H "Authorization: Bearer $OAT"

# 6. OAuth 切片 B：Authorization Code + PKCE（consent Allow → code）
# VERIFIER=$(python3 -c 'import secrets; print(secrets.token_urlsafe(64)[:64])')
# CHALLENGE=$(python3 -c "import hashlib,base64,sys; print(base64.urlsafe_b64encode(hashlib.sha256(sys.argv[1].encode()).digest()).rstrip(b'=').decode())" "$VERIFIER")
# PUB=$(curl -sS -X POST http://127.0.0.1:9502/auth/oauth-clients \
#   -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
#   -d '{"name":"spa","clientType":"public","redirectUris":["http://127.0.0.1:3000/cb"]}')
# CLIENT_ID=$(echo "$PUB" | jq -r '.data.clientId')
# # GET 同意预览（不签发 code）
# curl -sS -H "Authorization: Bearer $TOKEN" \
#   "http://127.0.0.1:9502/oauth/authorize?response_type=code&client_id=$CLIENT_ID&redirect_uri=http%3A%2F%2F127.0.0.1%3A3000%2Fcb&scope=projects%3Aread&state=xyz&code_challenge=$CHALLENGE&code_challenge_method=S256"
# # POST decision=allow → 302 Location ?code=erd_ac_…
# LOC=$(curl -sS -D - -o /dev/null -H "Authorization: Bearer $TOKEN" \
#   -X POST -H 'Content-Type: application/x-www-form-urlencoded' \
#   -d "response_type=code&client_id=$CLIENT_ID&redirect_uri=http%3A%2F%2F127.0.0.1%3A3000%2Fcb&scope=projects%3Aread&state=xyz&code_challenge=$CHALLENGE&code_challenge_method=S256&decision=allow" \
#   "http://127.0.0.1:9502/oauth/authorize" \
#   | awk -F': ' 'tolower($1)=="location"{print $2}' | tr -d '\r')
# CODE=$(python3 -c "from urllib.parse import urlparse,parse_qs; print(parse_qs(urlparse('$LOC').query)['code'][0])")
# OAT=$(curl -sS -X POST http://127.0.0.1:9502/oauth/token \
#   -H 'Content-Type: application/x-www-form-urlencoded' \
#   -d "grant_type=authorization_code&client_id=$CLIENT_ID&code=$CODE&redirect_uri=http://127.0.0.1:3000/cb&code_verifier=$VERIFIER" \
#   | jq -r '.access_token')
# curl -sS http://127.0.0.1:9502/api/v1/me -H "Authorization: Bearer $OAT"

# 7. OAuth refresh（仅 auth code 签发；轮换 + 吊销）
# TOK=$(curl -sS -X POST http://127.0.0.1:9502/oauth/token \
#   -H 'Content-Type: application/x-www-form-urlencoded' \
#   -d "grant_type=authorization_code&client_id=$CLIENT_ID&code=$CODE&redirect_uri=http://127.0.0.1:3000/cb&code_verifier=$VERIFIER")
# OAT=$(echo "$TOK" | jq -r '.access_token'); ORT=$(echo "$TOK" | jq -r '.refresh_token')
# NEW=$(curl -sS -X POST http://127.0.0.1:9502/oauth/token \
#   -H 'Content-Type: application/x-www-form-urlencoded' \
#   -d "grant_type=refresh_token&client_id=$CLIENT_ID&refresh_token=$ORT")
# # 旧 ORT 再刷 → invalid_grant；logout：
# curl -sS -X POST http://127.0.0.1:9502/oauth/revoke \
#   -H 'Content-Type: application/x-www-form-urlencoded' \
#   -d "token=$(echo "$NEW" | jq -r '.refresh_token')&client_id=$CLIENT_ID&token_type_hint=refresh_token"

# 8. OIDC 薄 MVP（issuer 直连 API 时设 ERD_OIDC_ISSUER=http://127.0.0.1:9502）
# curl -sS http://127.0.0.1:9502/.well-known/openid-configuration | jq .
# # 注册含 openid 的 public client → authorize scope=openid+projects:read → token：
# TOK=$(curl -sS -X POST http://127.0.0.1:9502/oauth/token \
#   -H 'Content-Type: application/x-www-form-urlencoded' \
#   -d "grant_type=authorization_code&client_id=$CLIENT_ID&code=$CODE&redirect_uri=http://127.0.0.1:3000/cb&code_verifier=$VERIFIER")
# echo "$TOK" | jq '{has_id_token:(.id_token!=null),scope}'
# curl -sS http://127.0.0.1:9502/oauth/userinfo -H "Authorization: Bearer $(echo "$TOK" | jq -r .access_token)"

# 产品 UI：登录 → /account/settings?selectKey=personalAccessTokens → 铸造/复制明文/吊销（token 仅创建弹层）
#            /account/settings?selectKey=oauthClients → 注册/复制 ID/吊销（secret 仅创建弹层；可选 openid）
#            浏览器 authorize URL：/oauth/authorize?... → AuthBrandShell 同意页 Allow/Deny
# ADR-0021 联邦（可选）：导出下列三项齐全的 provider 后重启后端；登录页出对应按钮；安全设置可绑定
# export GITHUB_CLIENT_ID=... GITHUB_CLIENT_SECRET=... GITHUB_REDIRECT_URI=http://localhost:9502/auth/federate/github/callback
# export GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... GOOGLE_REDIRECT_URI=http://localhost:9502/auth/federate/google/callback
# export WECHAT_APP_ID=... WECHAT_APP_SECRET=... WECHAT_REDIRECT_URI=http://localhost:9502/auth/federate/wechat/callback
# ./backend/dev-ensure.sh --restart
# curl -sS http://127.0.0.1:9502/auth/federate/providers   # 配置齐全的 key 为 true；未配为 false，登录页仅一行「第三方登录未配置」
```

限流：`ERD_PUBLIC_API_RATE_LIMIT`（默认 60/min）；OAuth OAT TTL：`ERD_PUBLIC_API_OAUTH_TTL`（默认 3600）；auth code TTL：`ERD_PUBLIC_API_OAUTH_CODE_TTL`（默认 120）；refresh TTL：`ERD_PUBLIC_API_OAUTH_REFRESH_TTL`（默认 2592000 / 30 天）。OIDC：RS256（`ERD_OIDC_RSA_PRIVATE_KEY` 或 `ERD_OIDC_RSA_PRIVATE_KEY_PATH` / PKCS12；prod 必填；本地 dev 自动生成 `~/.erdonline/oidc-rsa-private.pem`）；issuer=`ERD_OIDC_ISSUER` 或 `ERD_UI_URL`；id_token TTL：`ERD_OIDC_ID_TOKEN_TTL`（默认 3600）；authorize 可选 `nonce`（≤255，绑 code，code 换票进 id_token；**refresh 不带 nonce**）；`at_hash` 随 access_token；JWKS：`GET /.well-known/jwks.json`。OpenAPI 分组 `public-v1` 仅非 prod springdoc 开启时可见。会话 JWT 调 `/api/v1/**` → 401。PKCE 仅 S256；未注册 redirect 不 302；`client_credentials` 不发 refresh/id_token。产品内管理 UI：`/account/settings?selectKey=personalAccessTokens`（PAT）、`?selectKey=oauthClients`（OAuth client）。浏览器同意页：`/oauth/authorize`（须登录；Allow 才签发 `erd_ac_`；透传 `nonce`）。第三方登录（ADR-0021）：可选 `GITHUB_CLIENT_ID/SECRET/REDIRECT_URI`、`GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI`、`WECHAT_APP_ID/SECRET/REDIRECT_URI`（各三项齐全才启用）；缺则关闭；会话 JWT 短票换票，非 PAT。

### MCP（切片 4–5 + projects:write tools）

30 秒接到 Cursor（不必 clone）：[用 MCP 让 Cursor 读取 ER 图](https://doc.erdonline.com/docs/guide/api-and-mcp/)。本机源码：

```bash
cd mcp && yarn install && yarn build
export ERD_API_URL=http://127.0.0.1:9502
export ERD_PAT="$PAT"   # 写工具需含 versions:write / projects:write
node dist/index.js      # stdio；或 yarn start -- --http → :3920/mcp
yarn dogfood            # 读写 PAT + REST/MCP（create_version / update_project / put_project_json）
yarn smoke:npx          # CI：npm pack 后 npx --package tarball 须打出 stdio ready
```

详见 [`mcp/README.md`](https://github.com/erdonline/erdonline/blob/main/mcp/README.md)。官方 Registry 发布（📋 待 npm + org Owner）：[`docs/mcp-registry.md`](./mcp-registry.md)。

### 模板广场（ADR-0028）

```bash
curl -sS 'http://127.0.0.1:9502/catalog/v1/templates?page=1&size=5' | jq .
curl -sS 'http://127.0.0.1:9502/catalog/v1/templates/blank' | jq .
# 安装须 Bearer 会话 JWT 或 PAT（projects:write）
curl -sS -X POST 'http://127.0.0.1:9502/catalog/v1/templates/blank/install' \
  -H "Authorization: Bearer $TOKEN" | jq .
```

前端：`http://localhost:8000/catalog`；`/project/new` 重定向至 `/catalog`。可选 `ERD_CATALOG_API_URL`（空 = 仅本地种子 offline）。

**维护者审核（dev）**：`application-dev.yml` 默认 `erd.catalog.maintainer-usernames: [admin]`，本地用种子 `admin/123456` 可进 `/catalog/review`。prod 须设 `ERD_CATALOG_MAINTAINER_USERNAMES=你的运维账号`（逗号分隔）。

## 前端如何找到后端

对外规范：[data-format.md](./data-format.md)。改 `schema/projectjson.schema.json` 或示例后：

```bash
node scripts/validate-projectjson.mjs
# 或：cd frontend && yarn validate:projectjson
```

## 前端如何找到后端

前端通过 `frontend/config/proxy.ts` 在开发环境把 `/api`、`/ncnb`、`/auth` 代理到 `http://localhost:9502`。

JWT 含全量权限时 `Authorization` 头可达 8KB+；Boot 3 须配置 `server.max-http-request-header-size`（本仓 64KB，见 ADR-0015）。若写接口返回 **HTML 400**，先查该配置是否生效（`./backend/dev-ensure.sh --restart`），再查代理是否把 SPA HTML 误回给 `/ncnb/*`。
后端 `GatewayPrefixStripFilter` 剥离 `/ncnb`|`/auth`|`/syst` 前缀后再进 Controller。
开发态 `yarn start` 会先跑 `env.local.sh` → `public/env-config.js`：默认 `API_URL` 空（走 `proxy.ts` → `localhost:9502`）。本地若要 UI 直连公网 API，复制 `frontend/.env.example` 为 `frontend/.env`（**gitignored**，勿入库）并设 `API_URL=https://api.erdonline.com`，再 `./env.local.sh && cp env-config.js ./public/`（**勿**重启 `yarn start`）。GitHub Actions / `CI=true` 不读 `.env`，避免把公网 API 带进 e2e-smoke。生产构建经 `env.sh` 注入 `window._env_.API_URL` 等。

可选 `LOCALE`（默认空 = 不覆盖，走 umi **baseNavigator** + `umi_locale` localStorage）：非空时经 `getAntdLocale()` 强制注入 antd `ConfigProvider`；奠基切片支持 `zh-CN` / `en-US`。例：`LOCALE=en-US ./env.sh && cp env-config.js ./public/`（本地验证 antd 英文 Modal 按钮）。

百度统计：站点 ID 硬编码于 `frontend/config/config.ts`；本地 `yarn start` 不加载 hm.js（`UMI_ENV=dev`），`yarn build:prod` 产物经 **hostname 守卫**在 `localhost` / `127.0.0.1` / `[::1]` 跳过注入（见 `docs/deployment.md`）。文档站 `website/docusaurus.config.js` 同理，`yarn serve` 本地预览不再污染线上统计。

**百度统计后台降噪**（控制台 → 过滤条件 / 排除规则）：

| 噪声来源 | 建议过滤 |
|---|---|
| 本地文档预览 | 主机名含 `localhost` 或 `127.0.0.1`（代码已跳过上报；历史数据仍可在后台排除） |
| 统计自身 / OAuth 回流 | 来源 URL 含 `tongji.baidu.com`、`accounts.google.com` |
| 登录联邦回调 | 页面 URL 含 `/login/federate` |

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

遵循 [Conventional Commits](https://www.conventionalcommits.org/)，详见 [CONTRIBUTING.md](https://github.com/erdonline/erdonline/blob/main/CONTRIBUTING.md)。

## 关系图画布（ReactFlow）

- 边命中热区：`EDGE_INTERACTION_WIDTH = 24`（`ReactFlowRelation.tsx`）；视觉描边仍细。极密布局若仍难点中边，可先拖开节点再点，或框选后 Delete。
- 版本双入口：侧栏「版本管理」与项目菜单「版本」同页（`/design/table/version/all`）。

## 常见问题

- **后端启动报连接 MySQL 失败**：确认 `colima status` 为 running，且 `docker-compose up -d mysql redis` 健康；勿与 brew MySQL 抢 3306
- **前端登录 401**：确认后端已启动且数据库 `oauth_client_details` 表有 `client2` 记录
- **`data_sources` 表 `username`/`password` 变成 `enc:v1:...` 乱码**：正常现象（R-DATA-06，AES-256-GCM 落库加密），API 仍返回明文；本地/dev 用仓库弱默认密钥无需任何配置；见 [security-model.md](./security-model.md#r-data-06)
