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

```bash
./scripts/agent-loop-vision.sh   # 默认每 300s 唤醒；PROMPT 每次读 scripts/agent-loop-vision.prompt.md
# AGENT_LOOP_VISION_INTERVAL=600 ./scripts/agent-loop-vision.sh
```

选题规则在 `scripts/agent-loop-vision.prompt.md`：**常驻指令 = 持续优化 UI/UX，不要停**（体验轨偏置；每 tick 必须交付前端可见体验改进）。PM 发现→ROI→验证→commit；禁止默认 idle；改 prompt 即可，不必重启 shell。agent 回报 idle 时也**不退出**，5m 继续唤醒。

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
cd website && yarn && yarn start   # http://localhost:3000/erdonline/
cd website && yarn build           # 产物 website/build；死链会失败
```

消费仓库 `docs/`（ADR-0003）。本地中文搜索：`@easyops-cn/docusaurus-search-local`（需 `yarn build && yarn serve` 验证索引；dev 下索引可能不全）。  
CI：`.github/workflows/docs-site.yml`（PR 构建；`main` → GitHub Pages **且**（若已配 secrets）Cloudflare Pages `erdonline-docs`）。  
回退：无 `CLOUDFLARE_*` secrets 时仅 GH Pages。仓库 Settings → Pages → Source 选 **GitHub Actions**。  
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
```

限流：`ERD_PUBLIC_API_RATE_LIMIT`（默认 60/min）；OAuth OAT TTL：`ERD_PUBLIC_API_OAUTH_TTL`（默认 3600）；auth code TTL：`ERD_PUBLIC_API_OAUTH_CODE_TTL`（默认 120）；refresh TTL：`ERD_PUBLIC_API_OAUTH_REFRESH_TTL`（默认 2592000 / 30 天）。OIDC：`ERD_OIDC_HMAC`（prod 必填）；issuer=`ERD_OIDC_ISSUER` 或 `ERD_UI_URL`；id_token TTL：`ERD_OIDC_ID_TOKEN_TTL`（默认 3600）；authorize 可选 `nonce`（≤255，绑 code，code 换票进 id_token；**refresh 不带 nonce**）；`at_hash` 随 access_token。OpenAPI 分组 `public-v1` 仅非 prod springdoc 开启时可见。会话 JWT 调 `/api/v1/**` → 401。PKCE 仅 S256；未注册 redirect 不 302；`client_credentials` 不发 refresh/id_token。产品内管理 UI：`/account/settings?selectKey=personalAccessTokens`（PAT）、`?selectKey=oauthClients`（OAuth client）。浏览器同意页：`/oauth/authorize`（须登录；Allow 才签发 `erd_ac_`；透传 `nonce`）。

### MCP（切片 4–5 + projects:write tools）

```bash
cd mcp && yarn install && yarn build
export ERD_API_URL=http://127.0.0.1:9502
export ERD_PAT="$PAT"   # 写工具需含 versions:write / projects:write
node dist/index.js      # stdio；或 yarn start -- --http → :3920/mcp
yarn dogfood            # 读写 PAT + REST/MCP（create_version / update_project / put_project_json）
```

详见 [`mcp/README.md`](../mcp/README.md)。

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

遵循 [Conventional Commits](https://www.conventionalcommits.org/)，详见 [CONTRIBUTING.md](https://github.com/erdonline/erdonline/blob/main/CONTRIBUTING.md)。

## 关系图画布（ReactFlow）

- 边命中热区：`EDGE_INTERACTION_WIDTH = 24`（`ReactFlowRelation.tsx`）；视觉描边仍细。极密布局若仍难点中边，可先拖开节点再点，或框选后 Delete。
- 版本双入口：侧栏「版本管理」与项目菜单「版本」同页（`/design/table/version/all`）。

## 常见问题

- **后端启动报连接 MySQL 失败**：确认 `colima status` 为 running，且 `docker-compose up -d mysql redis` 健康；勿与 brew MySQL 抢 3306
- **前端登录 401**：确认后端已启动且数据库 `oauth_client_details` 表有 `client2` 记录
