# Deployment guide

:::tip What you get
Run ERD Online on your machine or intranet with Docker / cloud hosting; official trial topology and image release flow are also here. For the fastest stack, start with [Quick self-host](/docs/guide/quick-self-host).
:::

## Official hosting topology (no VPS)

Decision: [ADR-0018](/docs/adr/hosting-topology-no-vps). The project **does not buy production VPS** or host user production data; public surfaces use GitHub + Cloudflare free tier.

```
Docs site ──► Cloudflare Pages (erdonline-docs) → https://doc.erdonline.com  [sole public]

Static demo ─► Cloudflare Pages (erdonline-demo)
               env-config.js ← Variables: DEMO_API_URL
                    └─► Railway public API (ADR-0019)

Official demo API ─► Railway (App + MySQL 8 + Redis plugins)
  Image: ghcr.io/erdonline/erdonline-backend:latest
  Alt (CN): Zeabur, same image approach

Runtime images ─► GHCR
  ghcr.io/erdonline/erdonline-backend
  ghcr.io/erdonline/erdonline-frontend

Self-host data plane ─► your docker compose (MySQL/Redis + images above)
  ← User production stays here; Railway is trial-only
```

| Surface | Workflow | Required config |
|---|---|---|
| Docs | `.github/workflows/docs-site.yml` (`deploy-cloudflare` only) | See checklist below; requires `CLOUDFLARE_PAGES_DEPLOY=true` |
| Static demo | `.github/workflows/frontend-demo-site.yml` | Same + optional Variable `DEMO_API_URL` |
| Release images | `.github/workflows/release.yml` (tag `v*`, job `ghcr`) | `GITHUB_TOKEN` + `packages:write` (usually no extra Secret) |

### GitHub Actions × Cloudflare Pages setup {#cf-pages-setup}

One-time checklist (copy and check off). After configuration, push `main` to actually run deploy jobs.

#### 1. Cloudflare API Token

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → **My Profile** → **API Tokens** → **Create Token**
2. Use template **Edit Cloudflare Workers** (includes Workers / Pages write)
3. **Account Resources**: Include → All accounts (or your account)
4. **Zone Resources**: All zones, or leave empty (Direct Upload need not bind domain)
5. **Client IP Address Filtering**: leave empty; **TTL**: empty (no expiry)
6. Suggested rename: `erdonline-pages-deploy` → Create Token → **copy immediately** (shown once)

#### 2. Account ID

Copy **Account ID** from Workers & Pages left sidebar bottom (or Overview).

#### 3. Create two Pages projects (Direct Upload)

Workers & Pages → **Create** → **Pages** → **Upload assets** / Direct Upload (**do not** connect Git repo; Actions + Wrangler push):

| Project name (exact) | Purpose | Workflow |
|---|---|---|
| `erdonline-docs` | Docusaurus docs (primary) | `docs-site.yml` → `pages deploy … --project-name=erdonline-docs` |
| `erdonline-demo` | Frontend static demo | `frontend-demo-site.yml` → `--project-name=erdonline-demo` |

#### 4. GitHub Secrets / Variables

Repo **Settings → Secrets and variables → Actions**:

| Name | Type | Value |
|---|---|---|
| `CLOUDFLARE_PAGES_DEPLOY` | **Variable** | `true` (gate; without it **docs are not deployed**) |
| `CLOUDFLARE_API_TOKEN` | **Secret** | Token from step 1 |
| `CLOUDFLARE_ACCOUNT_ID` | **Secret** | Account ID from step 2 |
| `DEMO_API_URL` | Variable (optional) | Public API root URL (official demo: `https://erdonline-production.up.railway.app`); **if unset `env-config.js` API is empty** (landing works, full trial waits for backend) |

#### 5. Do not enable GitHub Pages

Docs live only at `https://doc.erdonline.com`. Repo **Settings → Pages** should stay **None** (unpublished via API). Do not set Source = GitHub Actions or github.io will grow a second site. `erdonline-docs.pages.dev` is the custom-domain CNAME target, not a docs link.

#### 6. Remote and trigger

```bash
git remote -v   # must point to GitHub repo that runs Actions
git push origin main
```

- `docs-site.yml`: `push` to `main` when `docs/**` / `website/**` / this workflow changes; CF deploy needs `CLOUDFLARE_PAGES_DEPLOY=true`
- `frontend-demo-site.yml`: same gate; can `workflow_dispatch` manually
- No `git remote` / no push to `main` → Actions will not run

#### 7. Acceptance URLs

| Surface | URL |
|---|---|
| Docs (sole public URL) | https://doc.erdonline.com |
| Static demo (product URL) | https://www.erdonline.com |
| Static demo (CF Pages default alias, ops) | https://erdonline-demo.pages.dev |

Actions page: confirm `Docs site` / `Frontend demo site` jobs green.

#### 8. GHCR (images, unrelated to Pages)

- Trigger: push tag `v*` (or `release.yml` `workflow_dispatch`)
- Permissions: workflow declares `packages: write`; login uses `GITHUB_TOKEN`, **usually no extra Secret**
- Images: `ghcr.io/erdonline/erdonline-backend`, `ghcr.io/erdonline/erdonline-frontend`

### Self-hosters pulling from GHCR (recommended)

After release tag (e.g. `v5.0.1`) images push to GHCR. On target machine:

```bash
cp .env.example .env   # change passwords; optionally set ERD_IMAGE_TAG=v5.0.1
docker compose pull    # pull ghcr.io/erdonline/erdonline-{backend,frontend}
docker compose up -d
./scripts/verify-self-deploy.sh
```

Public packages usually readable; if org policy requires login:

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USER --password-stdin
```

When changing source locally, do not rely on remote images—build explicitly:

```bash
docker compose build backend frontend
docker compose up -d
```

## Railway official demo deployment {#railway-demo}

Decision: [ADR-0019](/docs/adr/demo-runtime-railway). Project uses **single Railway project** for official trial backend (real MySQL 8 + Redis); user production still uses **Docker Compose** below.

Cost: Hobby tier roughly **$5–10/month** (App + MySQL + Redis, per [Railway pricing](https://railway.app/pricing) bill).

### Dashboard five steps (shortest path)

> **If build fails, check here first**: repo is monorepo. If Root Directory empty (`/`), Railway uses repo root for Railpack/Nixpacks (often mis-detects frontend) or wrong Docker context (`COPY pom.xml` not found). **Must** point backend service to `backend/`. Also: `ghcr.io/erdonline/erdonline-backend` **does not exist** until first `v*` tag runs `release.yml` (404)—until then use **Dockerfile from GitHub build**, not Docker Image.

1. **New Project** → **Deploy from GitHub** (select `erdonline/erdonline`). **Do not** pick Docker Image first (pull fails before image published).
2. Open **App service → Settings**, change these three (rebuild triggers after change):

   | Setting | Required value | Notes |
   |---|---|---|
   | **Root Directory** | `backend` | Build context = `backend/` (same as `docker-compose` / `backend/Dockerfile`) |
   | **Config as Code** / Railway config file | `/backend/railway.toml` | Forces `DOCKERFILE` builder; config **does not** follow Root Directory, use absolute path |
   | **Watch Paths** (optional) | `/backend/**` | Deploy only on backend changes; toml has same |

   Confirm Builder is **Dockerfile**, `Dockerfile` path is `Dockerfile` (relative to Root Directory).
3. **Add Plugin → MySQL** (MySQL 8) and **Add Plugin → Redis**; wait until Ready.
4. On MySQL create business DB `erd` and import schema (see “Railway MySQL correct wiring” below; plugin default DB often named `railway`, **insufficient**).
5. On **App service → Variables** write variables per “MySQL / Redis correct wiring” (Variable Reference, do not hand-copy passwords).
6. **Settings → Networking → Public Networking** generate `*.up.railway.app` HTTPS. Container entry reads platform `PORT` (`backend/Dockerfile`); **no need** to manually set 9502. Acceptance:
   ```bash
   curl -sS https://YOUR-APP.up.railway.app/actuator/health/liveness
   # expect {"status":"UP"}  (deploy gate; railway.toml points here)
   curl -sS https://YOUR-APP.up.railway.app/actuator/health
   # expect {"status":"UP"}  (includes db/redis; 503 if not wired, business not ready)
   ```
   Then set GitHub Actions Variable `DEMO_API_URL=https://erdonline-production.up.railway.app` (no trailing slash), rerun `frontend-demo-site.yml`, CF Pages static demo points to that API.

Optional (after first `v*` release and GHCR has packages): empty project → **Add service → Docker Image** → `ghcr.io/erdonline/erdonline-backend:latest`, skip local Dockerfile build.

### Healthcheck consecutive failures (self-check immediately){#railway-health-fail}

Within `healthcheckTimeout = 300` (5 minutes) **Attempt #1–#8 all service unavailable** ≈ **2 minutes still nothing listening**, **not** “JVM slow”. Normal Boot cold start ~30–90s; if logs after ~2–3 minutes still lack `Started ErdOnlineApplication` → **stuck on DB/Redis or prod missing env vars, process crash-retrying**.

**Check now**: Deployments → current deploy → **View logs**, search these keywords:

| Log keyword | Meaning | Fix |
|---|---|---|
| `Could not find … base-logback.xml` / `No appenders` | Logback include failed (fixed: changed include root path); **does not block startup**, but real error may be hidden | Redeploy after pull fix commit; if still failing look below |
| `Started ErdOnlineApplication` | Process up | curl `/actuator/health/liveness` again; if public still 502 → Networking/domain |
| `HikariPool.checkFailFast` / `PrimaryDatasource` / `Cannot resolve … erdSqlSessionFactory` | JDBC cannot open (host/creds/DB name) → DS / MyBatis cascade failure | App must get plugin-injected `MYSQLHOST`/`MYSQLUSER`/`MYSQLPASSWORD`/`MYSQLDATABASE`; create DB and import `db/init` schema |
| `Communications link failure` / `Connection refused` / `Unknown database` | MySQL not reachable or wrong DB name (plugin default often `railway`) | Confirm `MYSQLHOST`; `MYSQLDATABASE` matches initialized DB (local default `erd`) |
| `Unable to connect to Redis` … `localhost/127.0.0.1:6379` | `REDISHOST` not injected (or still expecting `REDIS_URL`/`SPRING_DATA_REDIS_URL`) | Link Redis or set `REDISHOST`/`REDISPORT`/`REDISPASSWORD`; **Redeploy** |
| `NOAUTH Authentication required` | Host reachable but no password | Confirm `REDISPASSWORD` injected; log `password=missing` |
| `WRONGPASS invalid username-password pair` | Wrong password, or empty string treated as password (old image) | Use plugin `REDISPASSWORD`; local no password do not set fake password (Normalizer nulls empty string) |
| `Could not resolve placeholder 'MYSQLUSER'` / `REDISPASSWORD` / `JWT_SECRET` / `ERD_UI_URL` | `prod` fail-fast missing vars | Link plugins or fill manually; compose without Redis password use `REDISPASSWORD=` (empty); `JWT_SECRET` see `.env.example`; UI/CORS/SocketIO set `ERD_UI_URL` |
| `OIDC RSA private key missing in prod` / `ERD_OIDC_RSA_*` | RSA PEM/path/keystore not configured | Set `ERD_OIDC_RSA_PRIVATE_KEY` or `ERD_OIDC_RSA_PRIVATE_KEY_PATH` (compose: `.secrets/oidc-rsa-private.pem`); separate from session `JWT_SECRET` |
| `martin.socketio.origin is blank or *` / `must not be * in prod` | SocketIO/CORS wildcard or empty | Set explicit `ERD_UI_URL`; no `*` / empty string |
| No Java/`Tomcat started` at all | Image not actually running / wrong entry | Confirm Root Directory=`backend`, Builder=Dockerfile |

Inside container (Railway Shell):

```bash
echo "PORT=$PORT"
curl -sS -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:${PORT}/actuator/health/liveness"
curl -sS "http://127.0.0.1:${PORT}/actuator/health"
```

Notes:

- **Deploy gate** uses `/actuator/health/liveness` (process alive; `railway.toml` updated).
- **Business ready** still `/actuator/health` (includes db/redis). **Do not** hide wiring issues with `management.health.db.enabled=false`—fix MySQL/Redis vars and `erd` schema first.
- Dockerfile already `--server.port=${PORT:-9502}`; Security allows `/actuator/**`. On consecutive failures prioritize logs and Variables, not path changes.

### Environment variable reference (Spring Boot)

Aligned with repo root `.env.example`, `docker-compose.yml`, `application.yml` / `application-prod.yml`.

**How to add (Railway App service → Variables)**: click **Add Variable** → **Add Variable Reference**. Service names match Canvas (common `MySQL` / `Redis`); reference syntax `${{ServiceName.VAR}}`.

### Railway MySQL correct wiring (only recommended path)

**Why not a single `SPRING_DATASOURCE_URL` alone**: app still has two custom prefixes (`spring.datasource.martin` + `spring.datasource.erd`, transitional dual SqlSessionFactory, see ADR-0020); Boot `SPRING_DATASOURCE_URL` / plugin `MYSQL_URL` **do not** bind those prefixes. Spring yml **reads plugin discrete vars directly** (single env per item, no `${A:${B}}` nesting).

**Plugin official vars** ([Railway MySQL](https://docs.railway.com/databases/mysql)). After **Link MySQL → App** these names appear in App env (same as plugin, no rename to `DB_*`):

| Spring reads (App env name) | Meaning | Local default |
|---|---|---|
| `MYSQLHOST` | Private host (`*.railway.internal`) | `localhost` |
| `MYSQLPORT` | Port | `3306` |
| `MYSQLUSER` | User (often `root`) | `erd` |
| `MYSQLPASSWORD` | Password | `erd` (non-prod only) |
| `MYSQLDATABASE` | Business DB name (plugin often `railway`) | `erd` |
| `MYSQL_USE_SSL` | JDBC `useSSL` | local/`dev` default `false`; **`prod` default `true`** |
| `MYSQL_REQUIRE_SSL` | JDBC `requireSSL` (prod URL only) | `prod` default `true` |
| `MYSQL_ALLOW_PUBLIC_KEY_RETRIEVAL` | JDBC `allowPublicKeyRetrieval` | local default `true`; **`prod` default `false`** |
| `MYSQL_URL` | Connection string | **App does not read** (for init / clients) |

**JDBC TLS (R-CFG-03)**: `martin` / `erd` dual DS **same** `jdbc-url` template. Public / Railway demo (`SPRING_PROFILES_ACTIVE=prod`) defaults SSL on with `requireSSL`, `allowPublicKeyRetrieval` off. Local `dev-ensure` (`dev` profile) and **docker-compose** (compose explicitly injects `MYSQL_USE_SSL=false`) keep plaintext JDBC for official MySQL image without TLS. If private plugin handshake fails temporarily set `MYSQL_USE_SSL=false` (with `MYSQL_REQUIRE_SSL=false`), but do not disable on publicly reachable instances.

**Dashboard**:

1. **Link** MySQL plugin to App (Variables should show `MYSQLHOST` etc.)
2. DB name strategy pick one: App explicitly sets **`MYSQLDATABASE=erd`** and run init below; **or** load schema into plugin default DB and do not override `MYSQLDATABASE`
3. Delete old `DB_HOST` / `DB_NAME` / `DB_USERNAME` / `DB_PASSWORD` (Spring no longer reads)
4. **Redeploy** after schema loaded (Flyway seeds on startup)

**Create DB + schema** (required once on empty plugin instance; seeds from App Flyway `V3+`):

> **Users not in `db/init`**: `admin` and system users → `backend/.../db/migration/erd/V3__system_baseline_seed.sql`; public demo project → `V5__public_demo.sql`; E2E accounts → `V6__e2e_users.sql` (App Redeploy / startup via `ErdFlywayConfig`; do not hand-load into init).

> **Difference from local compose**: `docker-compose` mounts `db/init` to MySQL **empty data volume** first boot; locally no need to run this script. Railway / remote plugin has no mount, must use script below or manual import of **schema only**.

```bash
# One-shot schema (public URL; password via env var, do not commit)
MYSQL_URL="mysql://root:${MYSQLPASSWORD}@HOST:PORT/railway" ./scripts/railway-mysql-init.sh

# Docker method (only Docker needed locally)
MYSQL_URL="mysql://root:${MYSQLPASSWORD}@HOST:PORT/railway" ./scripts/railway-mysql-init.docker.sh

# Manual:
# mysql … < db/init/01_create_database.sql
# mysql … < db/init/02_tables.sql
```

Acceptance SQL (if choosing `MYSQLDATABASE=erd`):

```sql
SHOW DATABASES LIKE 'erd';
SHOW TABLES FROM erd LIKE 'sys_user';
SELECT COUNT(*) FROM erd.sys_user;
SELECT MAX(version) FROM erd.flyway_schema_history WHERE success=1;
```

Expected deploy log: `Started ErdOnlineApplication`, no `HikariPool.checkFailFast` / `Unknown database`.

| Symptom | Meaning |
|---|---|
| `Connection refused` / host=`localhost` | App did not get `MYSQLHOST` (not Linked / not injected) |
| `Unknown database 'erd'` | Schema init not run, or `MYSQLDATABASE` not pointing to created DB |
| `Unknown database 'martin'` | Still old dual-DB image; Redeploy new version with single-DB init |
| `Access denied` | Wrong `MYSQLUSER` / `MYSQLPASSWORD` |
| Only set `MYSQL_URL` / `SPRING_DATASOURCE_URL` | **Ineffective** (custom prefixes do not read these) |
| `SSL connection required` / `Communications link failure` (TLS) | DB has no TLS but prod defaults `MYSQL_USE_SSL=true` | Private no cert: explicitly `MYSQL_USE_SSL=false` + `MYSQL_REQUIRE_SSL=false`; compose already defaults off |

### Railway Redis correct wiring (only recommended path)

Spring yml **reads plugin discrete vars directly** (same as MySQL):

| Spring reads | Meaning | Local default |
|---|---|---|
| `REDISHOST` | Private host | `localhost` |
| `REDISPORT` | Port | `6379` |
| `REDISUSER` | ACL user (often `default`) | empty → null |
| `REDISPASSWORD` | Password | empty → null (no AUTH) |
| `REDIS_URL` / `REDIS_PUBLIC_URL` | Connection string | **App does not read** |

**Dashboard**:

1. **Link** Redis plugin to App (should see `REDISHOST` / `REDISPORT` / `REDISPASSWORD` / `REDISUSER`)
2. Delete old `SPRING_DATA_REDIS_URL` / bare `REDIS_URL` mapping (yml no longer depends)
3. **Redeploy**

Expected log:

```text
Redis bound host=….railway.internal port=6379 database=0 url=missing password=set
```

| Symptom | Meaning |
|---|---|
| host=internal + `password=set` | Correct |
| host=`localhost` | `REDISHOST` not injected |
| internal host + `password=missing` | Missing `REDISPASSWORD` → NOAUTH |

### Other required variables

| App variable (use this name) | Variable Reference example | Notes |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` (manual) | Prod fail-fast; must explicitly supply credentials |
| `JWT_SECRET` | random ≥32 bytes (manual) | **Must change**; do not use repo default |
| `ERD_DB_CONFIG_SECRET` | random ≥32 bytes (manual, different from `JWT_SECRET`) | **Must change**; encryption key for `data_sources.username`/`password` at rest (R-DATA-06, AES-256-GCM); do not use repo default; missing or default value prod fail-fast |
| `ERD_OIDC_RSA_PRIVATE_KEY` or `_PATH` / keystore | PKCS#8/PKCS#1 PEM or PKCS12 | **Required in prod**; OIDC `id_token` RS256; public key via `/.well-known/jwks.json`; do not commit private key; compose mounts `.secrets/` |
| `ERD_OIDC_ISSUER` | optional; no trailing slash | empty → issuer=`ERD_UI_URL`; set API public root when hitting API directly |
| `JWT_EXPIRES_IN` | `604800` (7 days) | optional; session JWT seconds. No UI refresh; public deploys may tighten (e.g. `86400`) |
| `ERD_E2E_ACCOUNTS_ENABLED` | `false` | Forbid e2e weak passwords on public internet |
| `ERD_ALLOW_DEMO_ADMIN` | `false` | Forbid `admin`/`123456` seed password on public internet; unaffected after password change |
| `ERD_ALLOW_OPEN_REGISTER` | `false` | Forbid anonymous open registration on public internet; local/E2E uses `dev` profile; escape hatch explicit `true` (before 2026-08-05 prod escape ineffective due to YAML literal override, see R-CFG-07, now fixed); **federation first-time account creation also gated**; confirm via backend log `federate rejected open register ... allow-open-register=...` (printed on reject, no secrets) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `GITHUB_REDIRECT_URI` | usually unset | ADR-0021: GitHub OAuth App; all three required to enable; callback e.g. `https://API/auth/federate/github/callback` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` | usually unset | ADR-0021: Google OIDC login; all three required to enable; callback e.g. `https://API/auth/federate/google/callback` |
| `WECHAT_APP_ID` / `WECHAT_APP_SECRET` / `WECHAT_REDIRECT_URI` | usually unset | ADR-0021: WeChat Open Platform website QR; all three required to enable |
| `ERD_FEDERATE_SUCCESS_PATH` | `/login/federate` | Federation callback UI landing path (appended to `ERD_UI_URL`) |
| `MYSQL_USE_SSL` / `MYSQL_REQUIRE_SSL` / `MYSQL_ALLOW_PUBLIC_KEY_RETRIEVAL` | Railway default leave unset (prod SSL on); compose already off | See “Railway MySQL” TLS section; no-TLS plugin must explicitly disable |
| `ERD_UI_URL` | **Dual source (recommended)**: `https://app.erdonline.com,https://www.erdonline.com` (no trailing slash, comma no space); single UI can use one entry | **Required in prod**: CORS (`martin.ui.url`) gets **all** comma-separated entries; SocketIO origin **this key only** (after c15de0c do not set `SOCKETIO_ORIGIN`/`CORS_ALLOWED_ORIGINS`); forbid `*` / empty string; **OIDC issuer takes first valid http(s) entry only** (`iss` must be single value, skips malformed/wildcard); any entry missing `http(s)://` prefix (e.g. typo `ttps://`) prod fail-fast, error names specific value |
| `OSS_ENDPOINT` / `OSS_ACCESS_KEY` / `OSS_SECRET_KEY` | usually **unset** | optional MinIO; unset endpoint = no client; when enabled must not be `minio`/`minio123` (`OssCredentialGuard`) |
| `SOCKETIO_PORT` | `9092` | Presence separate from HTTP (9502/`PORT`); **do not expose 9092 raw on public internet** (firewall/security group internal only, or controlled reverse proxy); single public HTTP port platforms browsers often cannot reach 9092 (demo can ignore for now) |

#### Generate OIDC RSA private key (Railway / prod)

`OidcRsaKeySupport` accepts **PKCS#8** (`-----BEGIN PRIVATE KEY-----`) or **PKCS#1** (`-----BEGIN RSA PRIVATE KEY-----`) RSA private key PEM; 2048-bit; **no** separate public key config—runtime derives public key from private and publishes at `GET /.well-known/jwks.json` (`kid` defaults to public key JWK thumbprint, optional override `ERD_OIDC_RSA_KID`). Separate from session `JWT_SECRET`; **do not commit to git**.

Generate locally (PKCS#8 recommended, same as dev auto-write format):

```bash
mkdir -p ~/.erdonline
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out ~/.erdonline/oidc-rsa-private.pem
chmod 600 ~/.erdonline/oidc-rsa-private.pem
```

**Railway Variables** (pick one):

| Variable | Usage |
|---|---|
| `ERD_OIDC_RSA_PRIVATE_KEY` | Variable type **Secret**; value = full PEM (including header/footer and newlines), paste multiline in Dashboard; do not squash newlines or wrap in quotes |
| `ERD_OIDC_RSA_PRIVATE_KEY_PATH` | Only when container has mounted PEM path (compose common `.secrets/oidc-rsa-private.pem`); Railway without file volume prefer `_PRIVATE_KEY` above |

After key change or adding key **Redeploy**; accept `GET https://<API>/.well-known/jwks.json` returns RSA public JWK.

> **MySQL / Redis**: see two sections above. After Link plugins use native `MYSQL*` / `REDIS*`; `MYSQL_URL` / `REDIS_URL` / `SPRING_DATASOURCE_URL` / `SPRING_DATA_REDIS_URL` **are not** this app’s primary wiring paths.

Local / compose default listens **9502**. Railway injects `PORT`: `backend/Dockerfile` entry `java … --server.port=${PORT:-9502}`, aligned with public proxy. Repo commits `backend/railway.toml` (Dockerfile builder + `/actuator/health/liveness`); Dashboard still needs **Root Directory = `backend`** and **Config file = `/backend/railway.toml`** (Root Directory cannot be written in toml). **Docker / Railway build uses Maven Central** (does not COPY `.mvn/settings.xml` Aliyun mirror; local China can still use that settings).

### Connect CF Pages / custom domain

**Both sides must match** (UI ≠ API):

| Side | Variable | Value |
|---|---|---|
| Railway (backend) | `ERD_UI_URL` | Browser frontend Origin; **production + CF Pages demo sharing same API** use comma dual source (below) |
| CF Pages / custom domain frontend | `API_URL` + `ERD_API_URL` (demo workflow Variable `DEMO_API_URL` writes both) | Railway **public** root: `https://erdonline-production.up.railway.app` (no trailing slash) |

Do not set `API_URL` to UI domain (e.g. mistakenly `https://app.erdonline.com`)—that makes frontend point API back to itself.

**CORS (Railway backend required)**: when browser calls Railway API cross-origin from Cloudflare Pages / custom domain frontend, backend **`ERD_UI_URL` must be frontend Origin** (no trailing slash; **not** Railway API domain). Repo `config.prod.ts` / `.env` `API_URL` only points to backend; CORS configured only in Railway App Variables, missing → prod startup fail-fast or browser preflight 403 (`Invalid CORS request`, no `Access-Control-Allow-Origin`).

**Production UI + official demo sharing Railway API** (current `erdonline-production` recommended value):

```text
ERD_UI_URL=https://app.erdonline.com,https://www.erdonline.com
```

After change **Redeploy** (Variable changes do not hot-reload). Acceptance:

```bash
# expect HTTP 200 + Access-Control-Allow-Origin: https://www.erdonline.com
curl -sI -X OPTIONS 'https://erdonline-production.up.railway.app/auth/federate/providers' \
  -H 'Origin: https://www.erdonline.com' \
  -H 'Access-Control-Request-Method: GET'
```

Railway CLI (when project `railway link` and logged in):

```bash
railway variables set ERD_UI_URL='https://app.erdonline.com,https://www.erdonline.com'
railway up   # or Dashboard → Redeploy
```

**Container crashes after Redeploy following `ERD_UI_URL` change** (logs like `Error creating bean with name 'oidcIdTokenService': Invocation of init method failed → UnsatisfiedDependency → patAuthenticationFilter → Unable to start embedded Tomcat`):

- **Not** because `ERD_UI_URL` multi-source CSV itself — CORS (`CrossOriginPolicy.resolveHttpAllowedOrigins`) and OIDC issuer (`OidcConfig.resolveIssuer`) both split on comma, issuer fixed to **first valid http(s) entry**, see `OidcConfigTest` / `CrossOriginPolicyTest` regression
- Two real root causes, often coinciding with “also changed `ERD_UI_URL`” (Railway Redeploy re-runs fail-fast checks; old container may have started before hardening):
  1. **`ERD_OIDC_RSA_PRIVATE_KEY` (or `_PATH` / `_KEYSTORE_PATH`) unset**: `OidcIdTokenService` `@PostConstruct` via `OidcRsaKeySupport.load` prod requires RS256 private key, missing → fail-fast, message contains `OIDC RSA private key missing in prod`; exception propagates up `OAuthApiClientServiceImpl → patAuthenticationFilter` dependency chain, finally “Tomcat won't start”—**looks unrelated to `ERD_UI_URL`, actually same Redeploy trigger**. Fix: add private key in Railway Variables (`openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048` then paste full PEM, or mount `_PATH` to Secret file), Redeploy
  2. **`ERD_UI_URL` entry typo** (e.g. missing letter `ttps://...`): not valid http(s) Origin, repo hardened to prod fail-fast (`CrossOriginPolicy.assertWellFormed`), error names specific malformed value, not OIDC chain—fix Origin spelling per message
- Debug order: `./backend/dev-ensure.sh --logs` (local repro) or Railway Deploy Logs find `Error creating bean with name` first `Caused by:`; contains `ERD_OIDC_RSA_PRIVATE_KEY` → case 1; contains `malformed origin` → case 2

1. Railway liveness green, and `actuator/health` UP (or at least can login/register)
2. Repo **Settings → Secrets and variables → Actions** → Variable `DEMO_API_URL` = `https://erdonline-production.up.railway.app` (or Pages project Variables directly `API_URL`/`ERD_API_URL`)
3. Run `frontend-demo-site.yml` (`workflow_dispatch` or push); after custom domain `app.erdonline.com` bound to Pages project, same API injection applies
4. Open production UI (`https://app.erdonline.com/auth/login`) or demo (https://www.erdonline.com), Network confirms requests hit Railway, not UI itself

### Zeabur alternative (China region){#zeabur-demo}

Domestic network can use [Zeabur](https://zeabur.com/) as **non-default** alternative; official default remains **Railway** (ADR-0019).

**What this URL is**: Zeabur service = **backend API only**, not full product site. Browser opening `https://xxx.zeabur.app/` seeing 404 is **often normal** (Spring Boot has no landing page). Frontend trial still Cloudflare Pages via `DEMO_API_URL` pointing to this API.

#### Expected 404 vs actually down

| Symptom | Meaning | What to do |
|---|---|---|
| `/` → 404, but `/actuator/health` → `{"status":"UP"}` | API reachable | Set `DEMO_API_URL`, use CF Pages frontend |
| `/`, `/actuator/health`, `/doc.html` **all** 404 (empty body, `server: Caddy`) | Public not hitting Boot (common: Root Directory still repo root, zbpack mis-detects frontend) | Rebuild per Dashboard required changes below |
| health 502 / unreachable | Not listening on `PORT`, or missing DB/Redis startup failure | Check “Logs”; add MySQL/Redis and env vars |

```bash
curl -sS -D- -o /dev/null https://YOUR.zeabur.app/            # may be 404
curl -sS https://YOUR.zeabur.app/actuator/health               # expect {"status":"UP"}
```

#### Dashboard required changes (monorepo)

Repo root has `frontend/`, **no** root Dockerfile. Empty Root Directory Zeabur often builds Node frontend → Dashboard “running” but API all 404.

1. Deploy from GitHub (`erdonline/erdonline`)
2. **Settings → Root Directory** = `backend` (same as `backend/Dockerfile` / compose); rebuild after change
3. Confirm **Dockerfile** build; if still mis-detected, env var `ZBPACK_DOCKERFILE_PATH=Dockerfile`
4. **Network** bind public domain. Entry reads platform `PORT` (`--server.port=${PORT:-9502}`), no need to set 9502 manually
5. After first `v*` and GHCR has packages, can switch to image `ghcr.io/erdonline/erdonline-backend:latest`

#### MySQL + Redis + environment variables

Same table as Railway section above (`SPRING_PROFILES_ACTIVE=prod`, `MYSQL*`, `REDIS*`, `JWT_SECRET`, `ERD_OIDC_RSA_PRIVATE_KEY` or `_PATH`, `ERD_UI_URL`, `ERD_E2E_ACCOUNTS_ENABLED=false`; **do not** fill placeholder `OSS_*` unless actually enabling MinIO).

1. Add **MySQL 8** + **Redis** in same project
2. Create single business DB and import schema (seeds from App Flyway):
   ```sql
   CREATE DATABASE IF NOT EXISTS erd DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
   ```
   Then import `db/init/02_tables.sql`; or run `scripts/railway-mysql-init.sh`
3. Inject platform MySQL/Redis host/port/password as `MYSQLHOST` / `MYSQLDATABASE=erd` / `REDISHOST` / `REDISPASSWORD` etc.
4. `ERD_UI_URL` (required) = frontend Origin: production custom domain `https://app.erdonline.com`; official demo `https://www.erdonline.com` (CF Pages project `erdonline-demo` custom domain; default alias `erdonline-demo.pages.dev` still works but product URL unified on www); forbid `*`
5. After health green: GitHub Actions Variable `DEMO_API_URL=https://YOUR.zeabur.app` (no trailing slash) → rerun `frontend-demo-site.yml` (frontend API ≠ UI domain)

#### Shortest path

1. Root Directory=`backend` + MySQL + Redis + table vars → domain PROVISIONED  
2. `curl …/actuator/health` shows `UP` (preview window opening `/` 404 can ignore)  
3. `DEMO_API_URL` → open CF Pages demo trial  

## Docker Compose (recommended · user self-host / production)

```bash
cp .env.example .env      # change ports / passwords; optional ERD_IMAGE_TAG
docker compose pull       # prefer GHCR prebuilt images
docker compose up -d      # mysql + redis + backend + frontend
# or local build: docker compose build && docker compose up -d
docker compose logs -f backend   # view backend logs
```

**Schema dual source (self-deploy must read)**

| Source | When effective | Notes |
|---|---|---|
| `db/init/` (schema-only) | MySQL **empty data volume** first start | Only create DB + CREATE TABLE; **will not** rerun if volume exists |
| Flyway (`backend/.../db/migration/erd/`) | **Every backend startup** (`ErdFlywayConfig`) | Incremental schema **and seeds** source of truth |

New changes only via Flyway. Local upgrade from old dual-DB: `docker compose down -v` then rebuild (ADR-0020).

**Database connection credential encryption (R-DATA-06)**: `data_sources.username`/`password` encrypted with AES-256-GCM before persist (ciphertext prefix `enc:v1:`), key from `ERD_DB_CONFIG_SECRET`. **Must change on first deploy**; repo default value prod fail-fast. **Changing key loses ability to decrypt old ciphertext**—before rotation must batch re-save all connections with old key (trigger re-encrypt) or manually export/rebuild connections, see [security-model](/docs/security-model#r-data-06).

Access:

- Frontend http://localhost:8000
- Backend API http://localhost:9502

### Health checks / version info (self-deploy acceptance)

Backend exposes Spring Actuator, **only** `health` and `info` (anonymous readable; no env/beans/metrics). Boot probes enabled. After compose or standalone jar:

```bash
# Deploy gate / liveness (excludes db/redis)
curl -sS http://localhost:9502/actuator/health/liveness
# expect {"status":"UP"}

# Business ready (includes db/redis; 503 if deps down)
curl -sS http://localhost:9502/actuator/health

# App name + version (local classpath often "dev"; release jar Manifest version)
curl -sS http://localhost:9502/actuator/info
# expect contains "app":{"name":"erd-online","version":"..."}
```

Unexposed actuator subpaths return **404** (do not masquerade as 500 “operation error”).

### One-shot acceptance script

After stack up (`docker compose up -d` **or** local `mysql/redis` + `./backend/dev-ensure.sh` + `yarn start`):

```bash
./scripts/verify-self-deploy.sh
# expect: health UP, info contains erd-online, /actuator/env → 404, frontend / → 200;
#         if container erd-mysql exists, assert erd.flyway_schema_history has successful version
```

Optional env vars: `API_BASE` / `FE_BASE` / `SKIP_FE=1` / `SKIP_FLYWAY=1` / `MYSQL_CONTAINER`.

### Upgrade path drill (existing data volume)

Self-deploy upgrade **does not** rerun `db/init/` (MySQL entry scripts skip when volume exists). Incremental schema via Flyway on backend startup to **erd** DB.

```bash
# 1) Backup (example: named volume)
docker compose stop
docker run --rm -v erdonline_erd-mysql-data:/v -v "$(pwd)":/b alpine \
  tar czf /b/erd-mysql-backup-$(date +%Y%m%d).tgz -C /v .

# 2) Pull new code / new images (prefer GHCR; local build if no tag)
git pull
# docker compose build backend frontend   # only when changing source locally
docker compose pull
docker compose up -d

# 3) Acceptance (includes Flyway latest successful version)
./scripts/verify-self-deploy.sh

# 4) Optional: view migration history
docker exec erd-mysql mysql -uerd -perd erd \
  -e "SELECT installed_rank,version,description,success FROM flyway_schema_history ORDER BY installed_rank;"
```

Local dev (non-compose full stack) upgrade only needs `./backend/dev-ensure.sh --restart` (classpath new `V*__*.sql` migrates), then same acceptance script.

## Services

| Service | Port | Description |
|---|---|---|
| frontend | 8000 | Nginx serves frontend static assets, proxies `/api`, `/ncnb` to backend |
| backend | 9502 | Spring Boot monolith |
| mysql | 3306 | Database (erd + martin) |
| redis | 6379 | token / cache |
| MinIO (optional) | 9000 | Object storage; **not default compose dependency** |

### MinIO (optional)

Default `docker compose` **does not include** MinIO. Word export and “download default template” use backend classpath built-in template (`templates/word/defaultWorldTemplate.docx`); export works without MinIO.

When needing **upload custom Word template** or host default template on object storage, configure:

```bash
# Env example (non-empty OSS_ENDPOINT required to create MinioClient; keys via nested martin.oss.minio.*)
OSS_ENDPOINT=http://localhost:9000
OSS_ACCESS_KEY=minio
OSS_SECRET_KEY=...   # prod forbid still using minio123
```

`application.yml` declares nested placeholders (empty defaults); locally export above env vars, e.g.:

```yaml
martin:
  oss:
    minio:
      endpoint: ${OSS_ENDPOINT:}
      accessKey: ${OSS_ACCESS_KEY:}
      secretKey: ${OSS_SECRET_KEY:}
```

When not configured: `gendocx` / `downloadWordTemplate` fall back to built-in template; `uploadWordTemplate` returns clear error (prompt configure MinIO), no NPE.

## Production recommendations

- Change all default passwords in `.env` (including `admin`); `prod` rejects `admin`/`123456` login even if password unchanged (`erd.security.allow-demo-admin=false`)
- **Delete or change seed accounts** `e2e0`..`e2e15`, `e2e-serial` (weak passwords for local/CI only; `prod` rejects login by default, still recommend deleting DB records)
- Do not set `ERD_E2E_ACCOUNTS_ENABLED=true`, `ERD_ALLOW_DEMO_ADMIN=true`, or `ERD_ALLOW_OPEN_REGISTER=true` on public internet
- **SocketIO (9092)**: listens separate from HTTP API; self-host/PaaS **do not** map `9092` raw to public security group. When needing Presence, internal network only, or TLS reverse proxy with restricted sources; single public HTTP port platforms browsers often cannot reach 9092 (demo can ignore)
- When deploying backend jar alone, override datasource/redis via env vars (see `application-prod.yml`)
- Frontend can deploy `dist/` to any static server / CDN; runtime injects `API_URL` via `env-config.js`

## Manual build artifacts

```bash
# Backend jar
cd backend && mvn clean package -DskipTests   # artifact: target/*.jar

# Frontend dist (production: write env-config.js first)
cd frontend && yarn && API_URL= ERD_API_URL= yarn build:prod   # artifact: dist/
```

### Frontend `env-config.js` (build-time vs runtime)

| Scenario | Approach |
|---|---|
| Local `yarn start` | `env.local.sh` → `public/env-config.js` (dev proxy) |
| Static CDN / CF Pages | CI sets `API_URL`/`ERD_API_URL` (or `DEMO_API_URL`) then `yarn build:prod`, config baked into `dist/env-config.js` |
| Docker / Nginx same-origin | image may be empty; container start `docker-entrypoint.sh` rewrites `env-config.js` from env vars |

Browser reads `window._env_.API_URL` (see `frontend/src/utils/request.js`). Static site **without** same-origin proxy must fill publicly reachable **backend** root URL (Railway/Zeabur), **not** UI domain (`app.erdonline.com` / `*.pages.dev`); empty only suits landing/docs pages.

### Baidu Analytics

Umi built-in `@umijs/plugins` analytics plugin; site ID `bd50dd978c8d8d94792f4e987c4a7aaf` hardcoded in `frontend/config/config.ts` (`analytics.baidu`), prod build auto-injects `hm.baidu.com/hm.js`.

| Scenario | Behavior |
|---|---|
| Local `yarn start` | Not loaded (Umi `development` skips hm.js) |
| Local `yarn build` (`UMI_ENV=dev`) | Not loaded |
| CF Pages / `yarn build:prod` / Docker frontend image | Auto loads hm.js |

This project routing is **hash mode** (`config.ts` `hash: true`), hm.js listens hash changes for PV, **no** extra `onRouteChange` hook needed. Without CSP `script-src` whitelist, default allows `hm.baidu.com`.

### Cloudflare Web Analytics

Token `4df015bf119f48ff9b03f302f6a3e40a` hardcoded in `frontend/config/config.ts` (`CLOUDFLARE_WEB_ANALYTICS_TOKEN` + prod-only `headScripts` inline bootstrap), alongside Baidu Analytics; **only `UMI_ENV=prod` build** injects (Umi breaks `data-cf-beacon` script attrs with JSON, so IIFE dynamic append `<script type="module">`).

| Scenario | Behavior |
|---|---|
| Local `yarn start` / `yarn build` (`UMI_ENV=dev`) | Not loaded |
| CF Pages / `yarn build:prod` / Docker frontend image | Auto loads beacon |

Acceptance: `curl -sL https://www.erdonline.com | grep -E 'cloudflareinsights|4df015bf119f48ff9b03f302f6a3e40a'` should match; browser Network shows `beacon.min.js`. (CF default alias `erdonline-demo.pages.dev` also works; custom domain www is product URL.)

## MCP (agent / CLI, ADR-0013)

Read-only MCP process in repo `mcp/` (not built into Docker image). After self-hosted backend is up:

```bash
cd mcp && yarn install && yarn build
export ERD_API_URL=https://your-api.example.com   # or http://127.0.0.1:9502
export ERD_PAT=erd_pat_…                          # mint via POST /auth/personal-access-tokens
node dist/index.js                                # stdio
# optional Streamable HTTP:
# yarn start -- --http   # default http://127.0.0.1:3920/mcp
```

Cursor / Claude Desktop config see [`mcp/README.md`](https://github.com/erdonline/erdonline/blob/main/mcp/README.md). **Do not** put PAT in image or compose defaults. Writing versions requires PAT minted with `versions:write`.
