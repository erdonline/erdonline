# Development guide

## Requirements

| Tool | Version |
|---|---|
| JDK | 8 |
| Maven | 3.6+ (`backend/.mvn/maven.config` auto `-s .mvn/settings.xml`, Aliyun public mirror, bypasses local JD Artifactory) |
| Node.js | 16+ |
| Yarn | 1.x |
| MySQL | 8 |
| Redis | 5+ |

## Startup steps

Locally **MySQL / Redis run only on Colima (Docker)** — do not use `brew services` for local instances (port conflicts).

```bash
# 0. Colima (first run needs disk image; don’t hit GitHub directly in CN)
#    Mirror portal: https://github.akams.cn/  (pattern https://<node>/https://github.com/...)
#    e.g.: curl -fL -o ~/Downloads/ubuntu-24.04-minimal-cloudimg-arm64-docker.raw.gz \
#      'https://github.dpik.top/https://github.com/abiosoft/colima-core/releases/download/v0.10.4/ubuntu-24.04-minimal-cloudimg-arm64-docker.raw.gz'
colima start --cpu 4 --memory 8 --disk 40 \
  --disk-image ~/Downloads/ubuntu-24.04-minimal-cloudimg-arm64-docker.raw.gz
# Docker Hub CN mirror: ~/.colima/default/colima.yaml → docker.registry-mirrors
# (use docker-compose if compose plugin missing)
# Agent global rule: ~/.cursor/rules/github-download-proxy.mdc

## 5-minute Vision self-iteration (optional)

**Root cause (e5842d5, verified 2026-08-04)**: older version wrote full tick payload (including prompt body) to stdout; a Cursor Shell tool had to keep reading that pipe or the process blocked; when chat ended nobody read it, OS pipe buffer filled in a few rounds, process blocked on `write()` — looked “alive but stuck” (`ps` visible, ticks stopped).

**Evaluated Cursor Automations (cron trigger) as stdout heartbeat replacement**: not viable — (1) this repo session has no `open_automation` / `open_resource` editor handle to create from chat; (2) even if creatable, Automations cron runs in a **fresh cloud sandbox** every tick, re-cloning/Colima/`docker-compose up`/`dev-ensure.sh`, conflicting with “FE/BE resident processes, never restart” dev-loop discipline (`dev-loop-speed.mdc`), and can’t validate real local 9502/8000 instances. **Conclusion: Vision heartbeat stays local script, file append, no stdout pipe consumer dependency.**

Fixed mechanism: tick body **appends to file** (`TICK_FILE`, default `/tmp/erd-vision-tick.log`); file writes don’t need a reader, won’t block when consumer absent; file trimmed to recent ticks when over `AGENT_LOOP_VISION_TICK_MAX_LINES` (default 500). stdout only one fixed-length heartbeat line (no prompt body), can’t fill pipe.

```bash
# Idempotent start/resume: tmux session erd-vision, unaffected by Shell tool or chat end
tmux has-session -t erd-vision 2>/dev/null || \
  tmux new-session -d -s erd-vision '/Users/liangcan9/cursor/erdonline/scripts/agent-loop-vision.sh'

# Recent ticks (file on disk, readable anytime, no watcher needed)
tail -n 3 /tmp/erd-vision-tick.log

# Confirm heartbeat still producing (compare file mtime vs now; >2× INTERVAL = stuck, restart)
stat -f '%Sm' /tmp/erd-vision-tick.log   # macOS; Linux: stat -c '%y'

# prompt.md changes don’t need restart; script re-reads each tick

# Stop
tmux kill-session -t erd-vision

# Custom interval / tick file path
AGENT_LOOP_VISION_INTERVAL=600 AGENT_LOOP_VISION_TICK_FILE=/tmp/erd-vision-tick.log \
  tmux new-session -d -s erd-vision '/Users/liangcan9/cursor/erdonline/scripts/agent-loop-vision.sh'
```

Topic rules in `scripts/agent-loop-vision.prompt.md`: **standing directive = keep optimizing UI/UX, don’t stop** (experience track bias; every tick must ship visible FE improvement). PM discover→ROI→verify→commit; no default idle; edit prompt, no shell restart. Agent reports idle but **doesn’t exit**, wakes again in 5m.

**Important boundary (honest)**: file append only fixes “will process deadlock,” not “who reads file and actually works.” Local script **cannot** spawn a new Cursor chat with zero active Agent session — `/tmp/erd-vision-tick.log` is a queryable heartbeat/backlog ledger; human or running Agent should periodically `tail` it and execute `agent-loop-vision.prompt.md`. For fully unattended cloud-scheduled Agent, user creates cron Automation in **Agents Window** via `automate` skill (suggest 10–15 min not 5, fresh cloud sandbox cold start); prompt points at `scripts/agent-loop-vision.prompt.md` product discovery rules; but cloud Automation **can’t validate local 9502/8000 residents** — good for code/docs slices only, not local integration — so current stage: local file heartbeat + periodic human/session `tail`.

**Model routing** (strong think / cheap exec, see prompt.md “Model routing”): coordinator receiving tick uses two independent `Task` calls — think default `claude-sonnet-5-thinking-high` (hard architecture / stuck upgrade `claude-opus-5-thinking-high`), exec default `composer-2.5-fast` (typed FE / flaky → `gpt-5.6-sol-medium`); override with `VISION_THINK_MODEL` / `VISION_EXEC_MODEL`.

Biweekly release notes (user-facing):

```bash
./scripts/cut-release-notes.sh --dry-run
./scripts/cut-release-notes.sh          # → docs/releases/YYYY-MM-DD.md
```

See [docs/releases/README.md](https://github.com/erdonline/erdonline/blob/main/docs/releases/README.md).

# 1. Start databases
docker-compose up -d mysql redis

# 1b. (Optional) reverse dialect validation DBs: PostgreSQL + SQL Server
#     ./scripts/dev-reverse-dbs.sh
#     or PG only: docker-compose --profile reverse up -d postgres
#     connections in script output; MySQL validation DB reverse_demo (root/root)

# 2. Backend (default port 9502, profile=dev; tmux resident)
./backend/dev-ensure.sh            # idempotent: healthy exits fast, unhealthy auto-starts
./backend/dev-ensure.sh --restart  # after Java/yml/mapper changes
./backend/dev-ensure.sh --logs     # startup logs

# 3. Frontend (default port 8000)
cd frontend
yarn
yarn start

# 4. (Optional) self-deploy parity check: health/info/frontend + erd Flyway
./scripts/verify-self-deploy.sh
```

Production compose acceptance and **existing volume upgrade drill**: [Deployment](/docs/deployment).

> Don’t use `mvn spring-boot:run` or `nohup` in a normal shell for backend: IDE/agent session end kills child processes. `dev-ensure.sh` hosts process in tmux session `erd-be`, terminal close doesn’t affect it. Dependency: `brew install tmux`.  
> Agent/human mandatory entry: `.cursor/rules/dev-entrypoints.mdc`: backend only `dev-ensure.sh`; frontend `yarn start` resident, HMR for code changes, never restart to apply.  
> Local `config.dev.ts` sets `mfsu: false` (MFSU eager once stuck build worker / stale modules); restart `yarn start` once if you change that switch.  
> Designer → version management: sidebar “Versions → Version management”, or top bar project menu “Versions” (both open `/design/table/version/all`). Version page top bar “Back to model” → `/design/table/model?projectId=…` (sidebar “Model” often hidden by tree — don’t rely on sidebar alone).

## Frontend styling (token first)

Workbench styles prefer antd 5 **ConfigProvider theme tokens**; minimize scattered less.

| Source of truth | Path |
|---|---|
| antd tokens | `frontend/src/theme/tokens.ts` → `components/Theme` (`ConfigProvider`) |
| CSS variables (same values) | `frontend/src/theme/css-vars.less` (imported by `global.less`) |

Layout chrome (Home/Group/Design use BEM + `var(--erd-*)`; `account/settings` still on ProLayout); **landing** `pages/landing/index.less` keeps dark facade scoped less but colors/type read `--erd-*` (no second palette). New colors/radius → edit `tokens.ts` first. Details: [ui-home-model-redesign.md](https://github.com/erdonline/erdonline/blob/main/docs/ui-home-model-redesign.md#style-strategy-token-first).

## Frontend unit tests (lightweight)

`max test` PuppeteerEnvironment unavailable; canvas undo stack:

```bash
cd frontend && yarn test:unit:canvas-history
```

## E2E (Playwright)

```bash
cd frontend
yarn test:e2e                 # full (chromium + chromium-serial; no project deps, parallel OK)
yarn test:e2e:serial          # serial project only (activation / empty / export-feedback)
PW_WORKERS=16 yarn test:e2e   # max parallel (needs ~16-core machine)
# single parallel spec
npx playwright test tests/e2e/smoke.spec.ts --project=chromium --grep 'keyword'
# single serial spec (don’t omit --project=chromium-serial; workers=1 in config, no --no-deps)
npx playwright test tests/e2e/activation.spec.ts --project=chromium-serial --grep 'keyword'
```

- Parallel isolation: local cap 16 workers (default `ceil(CPU/2)`, full `PW_WORKERS=16`); each worker logs in as `e2e{n}` (`e2e0`..`e2e15`); project names `e2e-w{n}-` prefix
- Empty/example/export-failure specs in `chromium-serial` (config `workers: 1`, account `e2e-serial`); **don’t** add `dependencies: ['chromium']` to that project (once caused `--project=chromium-serial` to run full chromium first); CI full order in `e2e-smoke.yml` two steps
- E2E / public demo seeds: empty volume via backend Flyway `V5`/`V6`; existing DB: `./backend/dev-ensure.sh --restart` or check `flyway_schema_history`
- Change public/login example model: edit `schema/examples/demo.projectjson.json`, then `node scripts/sync-demo-projectjson.mjs`, ensure Flyway `V5` applied (or rebuild volume for new DB)
- Backend `dev` enables `erd.security.e2e-accounts-enabled`; `prod` rejects `e2e\\d+` / `e2e-serial` login
- Locator priority: `.cursor/rules/e2e-locators.mdc`: `getByRole` → label/placeholder → `getByTestId`; no `.ant-*`

### Schema dual source (`db/init` vs Flyway)

| Source | Path | Role |
|---|---|---|
| Empty volume first boot (schema-only) | `db/init/01_create_database.sql` + `02_tables.sql` | MySQL **empty data volume** first mount; CREATE DATABASE + CREATE TABLE only (ADR-0020) |
| Incremental schema **and seeds** | `backend/src/main/resources/db/migration/erd/` (`V*__*.sql`) | `ErdFlywayConfig` → single business DB; **new changes only here** |

Conventions:

- **`db/init` no more seeds / privileges**; daily increments only Flyway `V*__*.sql`
- Config: `spring.flyway.enabled=false`; `ErdFlywayConfig` binds `erdDataSource` (same DB as system DS)
- Upgrade from old dual DB: see ADR-0020 “Consequences”; fastest local path `docker compose down -v && docker compose up -d`
- After migration change: `./backend/dev-ensure.sh --restart` (pom change: refresh `target/cp.txt` first)

## Docs site (Docusaurus)

```bash
cd website && yarn && yarn start   # http://localhost:3000/
cd website && yarn build           # output website/build; broken links fail build
```

Consumes repo `docs/` (ADR-0003). **Product docs entry**: [https://doc.erdonline.com/](https://doc.erdonline.com/) (sole public URL). Local Chinese search: `@easyops-cn/docusaurus-search-local` (verify index with `yarn build && yarn serve`; dev index may be incomplete).  
CI: `.github/workflows/docs-site.yml` (PR build; `main` → Cloudflare Pages `erdonline-docs` on `doc.erdonline.com`).  
Requires repo Variable `CLOUDFLARE_PAGES_DEPLOY=true`. GitHub Pages is off; do not re-enable.  
Static demo: `.github/workflows/frontend-demo-site.yml` → CF project `erdonline-demo` (hosting topology in [Deployment](/docs/deployment)).

## Collaboration Presence (SocketIO)

- Port `9092` (netty-socketio, separate from HTTP `9502`); frontend `SOCKETIO_URL` (dev default `http://localhost:9092`)
- Handshake: `POST /auth/socket-ticket` (Bearer JWT) for short ticket, then namespace `/project/erd` (query must include real `projectId`; user ∈ `project_user`, see ADR-0009 / R-AUTH-05)
- Verify: `node scripts/verify-socket-presence.mjs`; `verify-socket-cursor.mjs`; `verify-socket-sync.mjs`; **negative** `verify-socket-membership.mjs`; E2E `presence.spec.ts`

## projectJSON schema (agent-readable)

See [data-format](/docs/data-format) and repo root `schema/`.

## Public API PAT / OAuth (ADR-0013)

```bash
# 1. Session login for JWT (example)
TOKEN=$(curl -sS -X POST http://127.0.0.1:9502/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"123456"}' | jq -r '.access_token // .data.access_token')

# 2. Mint PAT (plaintext shown once)
PAT=$(curl -sS -X POST http://127.0.0.1:9502/auth/personal-access-tokens \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"dogfood"}' | jq -r '.data.token')

# 3. Public probe + projects/versions (default read; write needs explicit scopes)
curl -sS http://127.0.0.1:9502/api/v1/me -H "Authorization: Bearer $PAT"
curl -sS 'http://127.0.0.1:9502/api/v1/projects?page=1&size=20' -H "Authorization: Bearer $PAT"
# ID=$(… | jq -r '.data.items[0].id')
# curl -sS "http://127.0.0.1:9502/api/v1/projects/$ID" -H "Authorization: Bearer $PAT"
# curl -sS "http://127.0.0.1:9502/api/v1/projects/$ID/versions?page=1&size=20" -H "Authorization: Bearer $PAT"
# VID=$(… | jq -r '.data.items[0].id')
# curl -sS "http://127.0.0.1:9502/api/v1/projects/$ID/versions/$VID" -H "Authorization: Bearer $PAT"

# 4. Write scope mint + submit version / write project
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

# 5. OAuth slice A: register client → client_credentials → /api/v1 (same as PAT Bearer)
# CREATED=$(curl -sS -X POST http://127.0.0.1:9502/auth/oauth-clients \
#   -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
#   -d '{"name":"ci-bot"}')
# CLIENT_ID=$(echo "$CREATED" | jq -r '.data.clientId')
# CLIENT_SECRET=$(echo "$CREATED" | jq -r '.data.clientSecret')  # once only
# OAT=$(curl -sS -X POST http://127.0.0.1:9502/oauth/token \
#   -H 'Content-Type: application/x-www-form-urlencoded' \
#   -d "grant_type=client_credentials&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET" \
#   | jq -r '.access_token')
# curl -sS http://127.0.0.1:9502/api/v1/me -H "Authorization: Bearer $OAT"

# 6. OAuth slice B: Authorization Code + PKCE (consent Allow → code)
# VERIFIER=$(python3 -c 'import secrets; print(secrets.token_urlsafe(64)[:64])')
# CHALLENGE=$(python3 -c "import hashlib,base64,sys; print(base64.urlsafe_b64encode(hashlib.sha256(sys.argv[1].encode()).digest()).rstrip(b'=').decode())" "$VERIFIER")
# PUB=$(curl -sS -X POST http://127.0.0.1:9502/auth/oauth-clients \
#   -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
#   -d '{"name":"spa","clientType":"public","redirectUris":["http://127.0.0.1:3000/cb"]}')
# CLIENT_ID=$(echo "$PUB" | jq -r '.data.clientId')
# # GET consent preview (no code issued)
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

# 7. OAuth refresh (auth code only; rotation + revoke)
# TOK=$(curl -sS -X POST http://127.0.0.1:9502/oauth/token \
#   -H 'Content-Type: application/x-www-form-urlencoded' \
#   -d "grant_type=authorization_code&client_id=$CLIENT_ID&code=$CODE&redirect_uri=http://127.0.0.1:3000/cb&code_verifier=$VERIFIER")
# OAT=$(echo "$TOK" | jq -r '.access_token'); ORT=$(echo "$TOK" | jq -r '.refresh_token')
# NEW=$(curl -sS -X POST http://127.0.0.1:9502/oauth/token \
#   -H 'Content-Type: application/x-www-form-urlencoded' \
#   -d "grant_type=refresh_token&client_id=$CLIENT_ID&refresh_token=$ORT")
# # old ORT refresh again → invalid_grant; logout:
# curl -sS -X POST http://127.0.0.1:9502/oauth/revoke \
#   -H 'Content-Type: application/x-www-form-urlencoded' \
#   -d "token=$(echo "$NEW" | jq -r '.refresh_token')&client_id=$CLIENT_ID&token_type_hint=refresh_token"

# 8. OIDC thin MVP (when issuer is API directly set ERD_OIDC_ISSUER=http://127.0.0.1:9502)
# curl -sS http://127.0.0.1:9502/.well-known/openid-configuration | jq .
# # register public client with openid → authorize scope=openid+projects:read → token:
# TOK=$(curl -sS -X POST http://127.0.0.1:9502/oauth/token \
#   -H 'Content-Type: application/x-www-form-urlencoded' \
#   -d "grant_type=authorization_code&client_id=$CLIENT_ID&code=$CODE&redirect_uri=http://127.0.0.1:3000/cb&code_verifier=$VERIFIER")
# echo "$TOK" | jq '{has_id_token:(.id_token!=null),scope}'
# curl -sS http://127.0.0.1:9502/oauth/userinfo -H "Authorization: Bearer $(echo "$TOK" | jq -r .access_token)"

# Product UI: login → /account/settings?selectKey=personalAccessTokens → mint/copy plaintext/revoke (token only in create modal)
#            /account/settings?selectKey=oauthClients → register/copy ID/revoke (secret only in create modal; optional openid)
#            browser authorize URL: /oauth/authorize?... → AuthBrandShell consent Allow/Deny
# ADR-0021 federation (optional): export complete provider triples then restart backend; login page shows buttons; security settings can bind
# export GITHUB_CLIENT_ID=... GITHUB_CLIENT_SECRET=... GITHUB_REDIRECT_URI=http://localhost:9502/auth/federate/github/callback
# export GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... GOOGLE_REDIRECT_URI=http://localhost:9502/auth/federate/google/callback
# export WECHAT_APP_ID=... WECHAT_APP_SECRET=... WECHAT_REDIRECT_URI=http://localhost:9502/auth/federate/wechat/callback
# ./backend/dev-ensure.sh --restart
# curl -sS http://127.0.0.1:9502/auth/federate/providers   # configured keys true; unconfigured false; login shows one line “Third-party login not configured”
```

Rate limits: `ERD_PUBLIC_API_RATE_LIMIT` (default 60/min); OAuth OAT TTL: `ERD_PUBLIC_API_OAUTH_TTL` (default 3600); auth code TTL: `ERD_PUBLIC_API_OAUTH_CODE_TTL` (default 120); refresh TTL: `ERD_PUBLIC_API_OAUTH_REFRESH_TTL` (default 2592000 / 30 days). OIDC: RS256 (`ERD_OIDC_RSA_PRIVATE_KEY` or `ERD_OIDC_RSA_PRIVATE_KEY_PATH` / PKCS12; required in prod; local dev auto-generates `~/.erdonline/oidc-rsa-private.pem`); issuer=`ERD_OIDC_ISSUER` or `ERD_UI_URL`; id_token TTL: `ERD_OIDC_ID_TOKEN_TTL` (default 3600); authorize optional `nonce` (≤255, bound to code, in id_token on code exchange; **refresh omits nonce**); `at_hash` with access_token; JWKS: `GET /.well-known/jwks.json`. OpenAPI group `public-v1` visible only when non-prod springdoc enabled. Session JWT on `/api/v1/**` → 401. PKCE S256 only; unregistered redirect no 302; `client_credentials` no refresh/id_token. In-product UI: `/account/settings?selectKey=personalAccessTokens` (PAT), `?selectKey=oauthClients` (OAuth client). Browser consent: `/oauth/authorize` (login required; Allow issues `erd_ac_`; passes through `nonce`). Third-party login (ADR-0021): optional `GITHUB_CLIENT_ID/SECRET/REDIRECT_URI`, `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI`, `WECHAT_APP_ID/SECRET/REDIRECT_URI` (all three required to enable); missing = off; session JWT short ticket exchange, not PAT.

### MCP (slices 4–5 + projects:write tools)

```bash
cd mcp && yarn install && yarn build
export ERD_API_URL=http://127.0.0.1:9502
export ERD_PAT="$PAT"   # write tools need versions:write / projects:write
node dist/index.js      # stdio; or yarn start -- --http → :3920/mcp
yarn dogfood            # read/write PAT + REST/MCP (create_version / update_project / put_project_json)
```

See [`mcp/README.md`](https://github.com/erdonline/erdonline/blob/main/mcp/README.md).

## How the frontend finds the backend

Public spec: [data-format](/docs/data-format). After changing `schema/projectjson.schema.json` or examples:

```bash
node scripts/validate-projectjson.mjs
# or: cd frontend && yarn validate:projectjson
```

## How the frontend finds the backend

In development, `frontend/config/proxy.ts` proxies `/api`, `/ncnb`, `/auth` to `http://localhost:9502`.

When JWT carries full permissions, `Authorization` header can reach 8KB+; Boot 3 needs `server.max-http-request-header-size` (this repo 64KB, see ADR-0015). If write APIs return **HTML 400**, check config applied (`./backend/dev-ensure.sh --restart`) then proxy not returning SPA HTML for `/ncnb/*`.
Backend `GatewayPrefixStripFilter` strips `/ncnb`|`/auth`|`/syst` prefix before Controllers.
Production injects `window._env_.API_URL` etc. via `public/env-config.js` (from `.env` / `env.sh`).

Optional `LOCALE` (default empty = no override, umi **baseNavigator** + `umi_locale` localStorage): when set, `getAntdLocale()` forces antd `ConfigProvider`; foundation supports `zh-CN` / `en-US`. Example: `LOCALE=en-US ./env.sh && cp env-config.js ./public/` (local verify antd English Modal buttons).

Baidu Analytics: site ID hardcoded in `frontend/config/config.ts`; local `yarn start` doesn’t load hm.js (Umi analytics skips in `development`), `yarn build:prod` injects automatically (see [Deployment](/docs/deployment)).

Integration probe (after login hit common APIs, expect no 404/405/500):

```bash
./scripts/audit-fe-apis.sh
# or: ./scripts/audit-fe-apis.sh http://localhost:9502 e2e0 123456
```

## Backend package layout

```
com.erdonline
├── ErdOnlineApplication   # entry
├── auth/                  # OAuth2
├── system/                # users/permissions/menus/dict
├── erd/                   # modeling core
├── common/                # shared libs
└── config/                # global config
```

## Performance budget

Metrics and red lines: [Performance budget](/docs/performance-budget). Re-measure after dependency or core journey changes.

## Commit conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/); details in [CONTRIBUTING.md](https://github.com/erdonline/erdonline/blob/main/CONTRIBUTING.md).

## Relation diagram canvas (ReactFlow)

- Edge hit area: `EDGE_INTERACTION_WIDTH = 24` (`ReactFlowRelation.tsx`); visual stroke stays thin. In very dense layouts if edges still hard to click, drag nodes apart or box-select then Delete.
- Version dual entry: sidebar “Version management” and project menu “Versions” same page (`/design/table/version/all`).

## FAQ

- **Backend fails connecting MySQL**: confirm `colima status` running and `docker-compose up -d mysql redis` healthy; don’t fight brew MySQL on 3306
- **Frontend login 401**: confirm backend up and `oauth_client_details` has `client2` row
- **`data_sources` `username`/`password` look like `enc:v1:...` gibberish**: expected (R-DATA-06, AES-256-GCM at rest); API still returns plaintext; local/dev uses repo weak default key, no config needed; see [security-model](/docs/security-model#r-data-06)
