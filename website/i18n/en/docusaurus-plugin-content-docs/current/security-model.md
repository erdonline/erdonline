# Security model (open-source self-host)

## VIP / limits

The open-source edition **does not enforce** VIP intercepts for headcount, personal project count, team project count, version count, AI usage, etc. (`VIPRightsAspect` passes through). License upload API remains but is not a feature gate.

## Seed accounts

| Account | Purpose | Default password |
|---|---|---|
| `admin` | Ops / manual | `123456` (ok in dev; prod rejects this password by default) |
| `e2e0`..`e2e15` | Playwright parallel isolation (≤16 workers) | `123456` |
| `e2e-serial` | chromium-serial empty-state cases | `123456` |

Protections:

- `erd.security.e2e-accounts-enabled`: `dev`=true, `prod`/default=false → prod rejects `e2e\\d+` / `e2e-serial` login
- `erd.security.allow-demo-admin`: `dev`=true, `prod`/default=false → prod rejects username `admin` + seed password `123456` (unaffected after password change); escape hatch `ERD_ALLOW_DEMO_ADMIN=true`
- `erd.security.allow-open-register`: `dev`=true, `prod`/default=false → prod rejects anonymous open registration; escape hatch `ERD_ALLOW_OPEN_REGISTER=true`
- Public deployments should change `admin` password and delete `e2e*` users; see [deployment](/docs/deployment)

## SQL execution

Designer JDBC/sync uses logged-in session and (team) approval path; open-source VIP rights aspect **does not** intercept usage counts.

| Path | Gate |
|---|---|
| `queryInfo/exec`, `queryInfo/explain` | `SqlGuard.assertReadOnly`: single-statement SELECT / EXPLAIN / SHOW / DESC (jsqlparser + leading-word fallback); blocks multi-statement, GRANT/OUTFILE, etc. |
| `connector/sqlexec`, `dbsync` | **mutate**: allows DDL/DML needed for sync; `SqlGuard.assertMutateAllowed` rejects GRANT/REVOKE/CREATE USER/INTO OUTFILE/LOAD DATA LOCAL, etc.; **requires** `dataSourceId` (`applyMutate`, rejects raw JDBC+credentials) |
| `connector/ping|dbReverse*|…` | `JdbcUrlGuard`: only `jdbc:mysql\|mariadb\|postgresql\|oracle:(thin\|oci)\|sqlserver`; blocks link-local / cloud IMDS (literal + **DNS-resolved any A/AAAA** hitting `169.254.0.0/16`, `168.63.129.16`, `100.100.100.200`, `fe80::/10`, `fd00:ec2::254`, metadata hostnames); **`assertAllowedAndPin`** before connect rewrites hostname to allowed IP (closes check→connect TOCTOU); **does not** block RFC1918/localhost (PaaS private DBs like Railway `MYSQLHOST`); `dataSourceId` preferred (`ConnectorCredentialResolver.apply` → ACL then overrides client JDBC fields) |

FE hot paths (saved datasources): ping / dbReverse* / sqlexec / dbsync pass `dataSourceId`; client does not attach url/username/password (`preferDataSourceIdPayload`). Raw JDBC without id **only** for ping / dbReverse* (trial connect and unsaved UX); sqlexec/dbsync hard-reject on backend.

## Anonymous allowlist (after prefix strip)

- Login/logout: `/login`, `/auth/login`, `/exit`
- Registration: only `/project/group/user/register` (frontend `POST /ncnb/project/group/user/register`); gated by `erd.security.allow-open-register` (`dev`=true, `prod`/default=false); duplicate entry `/user/register` HTTP mapping removed and no longer ignored
- Third-party IdP federation (ADR-0021): `/federate/providers`, `/federate/{github|google|wechat}`, `/federate/{github|google|wechat}/callback`, `/federate/session` (and `/auth/federate/…` prefix forms); **excludes** `/federate/links/**` (requires session JWT)
- Read-only share: **only** `GET /share/{token}` (and `/ncnb/share/{token}` before prefix strip), see ADR-0007; `create` / `revoke` / `fork` **not** in ignore-urls (login required)
- Actuator: `/actuator/**` allowed, but **exposure only `health,info`**; `health` does not `show-details`; `info` only app name/version (no secrets). Do not expand to env/beans/heapdump
- OpenAPI / Swagger UI: Security still anonymous for `/v3/api-docs/**`, `/swagger-ui/**` (and `/webjars/**`); **sole gate** is `springdoc.api-docs.enabled` / `springdoc.swagger-ui.enabled` (`prod`=false). Local/dev enabled by default. No `martin.swagger` / `martin.resource-server` config keys remain.

## Third-party login IdP federation (ADR-0021)

- **Direction**: GitHub / Google / WeChat → this system’s session JWT (same shape as password login); **not** ADR-0013 external IdP (PAT/`erd_oat_`)
- **GitHub**: OAuth App; scope=`read:user user:email`; subject=numeric `id`; verified email can bind by email
- **Google**: Authorization Code + OIDC (`openid email profile`); requires `email_verified`; subject=`sub`; can bind existing user by email
- **WeChat**: Open Platform website QR login (`snsapi_login`); subject prefers `unionid` else `openid`; **no** official account web auth
- **Storage**: `user_identity_link` (subject only; no tokens); short ticket Redis `erd:federate:session:*` (ticket after callback; JWT not in URL)
- **Toggle**: all three of `GITHUB_*` / `GOOGLE_*` / `WECHAT_*` required to enable; missing → `/auth/federate/providers` returns `false` for that provider; startup does not crash
- **Account creation**: when no link and no email match, follows `erd.security.allow-open-register`; when off, prompt password login first then bind
- **UI**: conditional buttons on login page; `/account/settings?selectKey=security` bind/unbind; landing `/login/federate?ticket=`; logout same as password (clears JWT)
- **Explicitly not doing**: revive `/login/success`, `/account/settings/wechat`, `/auth/oauth2/**`, password-grant

## Read-only share

- Create/revoke requires login and project creator (UI: designer top bar “Share” dialog)
- Anonymous response per ADR-0008 **clears** `profile.dbs` (connections only in `data_sources`); may keep `defaultDataSourceId` reference

## Public API PAT / OAuth (ADR-0013)

- **PAT minting**: session JWT → `POST /auth/personal-access-tokens` (after prefix strip `/personal-access-tokens`); plaintext `erd_pat_…` **shown once in response**
- **OAuth slice A (M2M)**: session JWT → `POST /auth/oauth-clients` register confidential (default; `client_id`=`erd_cli_…`, `client_secret`=`erd_cs_…` **once in response**) → anonymous `POST /oauth/token` (`grant_type=client_credentials`, body or Basic) → `access_token`=`erd_oat_…` (default TTL 3600s, `ERD_PUBLIC_API_OAUTH_TTL`). List/revoke: `GET|DELETE /auth/oauth-clients`. Revoking client invalidates unexpired OAT and unconsumed auth codes.
- **OAuth slice B (browser + PKCE)**: registration optional `clientType=public|confidential` + `redirectUris[]` (exact match; https only or localhost/127.0.0.1/[::1]). Product consent page `/oauth/authorize` (AuthBrandShell). `GET /oauth/authorize` (**session JWT required**) → consent preview JSON (client name / scopes / redirect host; **does not** issue code). `POST … decision=allow` → 302 (or `Accept: application/json` → `{redirect_to}`) `?code=erd_ac_…&state=`; `decision=deny` → `error=access_denied`. Anonymous `POST /oauth/token` `grant_type=authorization_code` + `code` + `redirect_uri` + `code_verifier` (public no secret; confidential requires secret) → `erd_oat_…` + `erd_ort_…` (refresh). Auth code SHA-256 only, default TTL 120s (`ERD_PUBLIC_API_OAUTH_CODE_TTL`), single use. Unregistered redirect **never** 302.
- **OAuth refresh (post-MVP)**: only `authorization_code` exchange issues refresh (`client_credentials` **does not**). `POST /oauth/token` `grant_type=refresh_token` → **rotation** (old `erd_ort_` revoked immediately, new access+refresh same `family_id`); submitting revoked refresh → whole family OAT/ORT revoked + `invalid_grant`. TTL: `ERD_PUBLIC_API_OAUTH_REFRESH_TTL` (default 2592000s / 30 days). `POST /oauth/revoke` (token + client auth; RFC 7009 unknown token still 200). Revoking client → unexpired OAT/ORT + unconsumed codes invalidated together.
- **OIDC (RS256 + JWKS) + nonce/at_hash**: `GET /.well-known/openid-configuration` (issuer=`ERD_OIDC_ISSUER` or `ERD_UI_URL`); `id_token` **RS256** (`ERD_OIDC_RSA_PRIVATE_KEY` / `_PATH` / PKCS12; prod fail-fast; separate from `JWT_SECRET`; deprecated `ERD_OIDC_HMAC`); `GET /.well-known/jwks.json` publishes public key (`kid`). Authorization code/refresh with scope containing `openid` → exchange includes `id_token`; `client_credentials` does not. Authorize optional `nonce` → bound to auth code → returned on code exchange; **refresh renewal id_token has no nonce** (OIDC Core §12.2). `at_hash` computed from same-response access_token (SHA-256 left half + base64url). `GET /oauth/userinfo`: Bearer `erd_oat_` + `openid` (rejects PAT/session JWT).
- **Storage**: tables `personal_access_token` / `oauth_api_client` / `oauth_access_token` / `oauth_authorization_code` / `oauth_refresh_token` hash only + hint; plaintext forbidden in DB
- **Invocation**: `Authorization: Bearer erd_pat_…` **or** `erd_oat_…` → `/api/v1/**` (separate SecurityFilterChain; **does not accept** session JWT / refresh). `client_credentials` OAT acts as **registrant**; `authorization_code` / refresh-renewed OAT acts as **authorized user**.
- **Scopes (unlocked)**: default `projects:read`, `versions:read`; can explicitly mint `projects:write`, `versions:write`, `openid` (OAuth registration same `PatScopes`; exchange `scope` ⊆ client)
- **Read projects**: `GET /api/v1/projects`, `GET /api/v1/projects/{id}` require `projects:read` + `project_user` membership; detail `projectJSON` clears `profile.dbs` (ADR-0008)
- **Read versions**: `GET /api/v1/projects/{id}/versions`, `…/versions/{versionId}` require `versions:read` + membership; list excludes `projectJSON`; detail clears `profile.dbs`
- **Submit version**: `POST /api/v1/projects/{id}/versions` requires `versions:write` + membership; body `projectJSON`/`snapshot`; clears `profile.dbs` before write; insert only (ignores client id); session JWT not accepted
- **Write project**: `PATCH /api/v1/projects/{id}` (metadata) and `PUT /api/v1/projects/{id}/projectJSON` require `projects:write` + membership; PUT clears `profile.dbs` before write
- **MCP**: repo `mcp/` calls above REST via PAT (or equivalent OAT); stdio / Streamable HTTP; write tools: `create_version` (`versions:write`), `update_project` / `put_project_json` (`projects:write`). See [`mcp/README.md`](https://github.com/erdonline/erdonline/blob/main/mcp/README.md)
- **Rate limit**: default 60/min/token (`ERD_PUBLIC_API_RATE_LIMIT`); Redisson cluster shared; over limit 429; Redis unavailable fail-closed → 503 (read/write shared)
- **Follow-up**: ~~third-party IdP federation~~ → see [ADR-0021](/docs/adr/idp-federation-google-wechat); **do not** widen CORS for token exchange/revocation/userinfo/discovery anonymous endpoints
- **Product UI**:
  - `/account/settings?selectKey=personalAccessTokens` — list / mint (scopes + optional expiry) / one-time plaintext reveal / revoke
  - `/account/settings?selectKey=oauthClients` — list / register (includes `openid`) / copy `client_id` / `client_secret` one-time reveal on create (not viewable again) / revoke
  - `/oauth/authorize` — OAuth consent (client / scopes / redirect host + Allow/Deny)
- **Boundary**: ≠ share token; does not expose connector/mutate SQL; prod still disables springdoc; public client **forbidden** `client_credentials`

## projectJSON secret discipline

JDBC connection secrets (url / username / password / driver) **must not** be written to `projectJSON` ([ADR-0008](/docs/adr/datasource-isolation)). External field docs and compatibility policy: [data-format](/docs/data-format).

## Datasource credential encryption (R-DATA-06){#r-data-06}

After ADR-0008 converged JDBC secrets to table `data_sources` as sole source of truth, that table still stored `username`/`password` in plaintext. This section documents **at-rest encryption** (decision in [ADR-0024](/docs/adr/datasource-credential-encryption)).

- **Algorithm**: AES-256-GCM, key = `SHA-256(ERD_DB_CONFIG_SECRET)`; ciphertext format `enc:v1:<base64(iv[12B]||ciphertext||tag)>`
- **Scope**: only `username`/`password` (actual secrets); `host`/`port`/`url`/`databaseName`/`driverClassName` not encrypted (non-secret, some need plaintext display/edit)
- **Encrypt/decrypt timing**: `DataSourcesServiceImpl` (`save`/`updateById`/`update`/`getById`/`list`/`page`, covering indirect `getPage`/`tree`) encrypts before persist, decrypts on read; `DataSourceAcl` (sole path bypassing Service direct `DataSourcesMapper` query) also decrypts before return for `ConnectorCredentialResolver` plaintext connect
- **Transparent to upper layers**: Controller (`/ncnb/dataSources/**`), frontend forms, `ConnectorCredentialResolver`, `LocalNcnbDatabaseService` still send/receive plaintext; **does not** change existing API response shape (still logged-in owner reads own connection plaintext password, same as before)
- **Backward compat / gradual migration**: `decrypt()` passes through legacy plaintext without `enc:v1:` prefix (no error); user next edit+save (form username/password required, naturally resubmits) triggers `encrypt()` auto-encryption—no one-shot batch rewrite or maintenance window
- **Key management**: env var `ERD_DB_CONFIG_SECRET`; local/dev allows repo weak default (`erd-online-dev-datasource-secret-change-me-32bytes!!`, same pattern as `JWT_SECRET`); `prod` missing var fails placeholder resolution (fail-fast), `DataSourceCredentialCipher` additionally rejects still equal to repo default
- **Key rotation cost**: changing `ERD_DB_CONFIG_SECRET` makes all old ciphertext undecryptable (`decrypt()` throws `IllegalStateException`, logs contain no plaintext); before rotation must re-save all connections with **old key** (trigger re-encrypt), or export and rebuild with new key
- **Not doing**: no encryption of `projectJSON`/version snapshots (ADR-0008 ensures no secrets); no Jasypt/KMS (repo scale: app-layer AES-GCM sufficient, see [ADR-0024](/docs/adr/datasource-credential-encryption) tradeoffs)

## Known risks (backend registry, 2026-08-03)

Scope: Spring Security / JWT / CORS / springdoc / datasource / Redis / user DB SQL execution / upload / admin / actuator / SocketIO / secrets and ignore-urls / project ACL / dead config. Below are **verified** security or production risks (not generic code smell). Severity: P0 publicly exploitable or predictable secrets; P1 login required but large lateral/privilege impact; P2 tightening surface or ops mislead.

### Auth exposure

| ID | Severity | Item | Evidence | Status | Recommendation |
|---|---|---|---|---|---|
| R-AUTH-01 | P0 | ~~Anonymous `GET /user/loadUserByUsername/{username}` leaked user ciphertext and permissions~~ | ~~ignore-urls + Service `@RestController`~~ | **✅ Closed (2026-08-03)**: removed ignore; `RemoteSystemUser.loadUserByUsername` dropped `@GetMapping` (in-process only); `User.pwd`/`salt` `@JsonProperty(WRITE_ONLY)` | Keep no HTTP mapping; do not re-add ignore |
| R-AUTH-02 | P1 | ~~`UserController` CRUD without `@PreAuthorize`~~ | ~~`UserController` CRUD~~ | **✅ Closed (2026-08-03)**: CRUD/`page`/`batch` added `sys_user_*` `@PreAuthorize`; `pwd`/`salt` still `WRITE_ONLY` | Keep; prefer Extension `/user/add` `/user/update` for admin writes |
| R-AUTH-03 | P1 | ~~Project/model IDOR: read/write by id without membership check~~ | ~~`ProjectServiceImpl` / `ProjectController` delete/update/get~~ | **✅ Closed (2026-08-03)**: `ProjectAcl` checks `project_user`; get/info/save/update/delete (personal+team) all `assertMember` | Designer bypass/SocketIO membership see R-AUTH-05 |
| R-AUTH-04 | P1 | ~~`dataSources` read/update/delete without ownership check~~ | ~~`DataSourcesController` get/update/delete~~ | **✅ Closed (2026-08-03)**: `DataSourceAcl` validates creator (username/userId); tree filtered by creator; update cannot rewrite creator | Keep; with R-DATA-02 hot path uses authenticated id |
| R-AUTH-05 | P1 | ~~SocketIO only validates short ticket/JWT, not project membership~~ | ~~`SocketIoAuthorizationListener` / `JOIN_ROOM`~~ | **✅ Closed (2026-08-03)**: short ticket payload includes `userId`; handshake + `JOIN_ROOM` both `ProjectAcl.isMember`; cursor/sync only broadcast to joined sessions | Keep; multi-user collaboration see `verify-socket-presence` / `verify-socket-membership` |
| R-AUTH-06 | P2 | ~~Open registration dual entry~~ | ~~ignore: `/user/register`; product: `/project/group/user/register`~~ | **✅ Closed (2026-08-03)**: removed `RemoteSystemUser.userRegister` HTTP mapping; ignore only product path; `allow-open-register` prod/default=false, `dev`=true; `ERD_ALLOW_OPEN_REGISTER=true` escape | Do not enable on public internet; self-host needing registration must explicitly open valve |
| R-AUTH-07 | P2 | ~~`frameOptions` disabled~~ | ~~`ErdSecurityConfiguration.java:63`~~ | **✅ Closed (2026-08-03)**: `headers.frameOptions.deny()`; share is SPA `/share/:token`, no iframe embed API | Keep DENY; third-party embed UI via frontend CSP `frame-ancestors`, do not `disable` here |

### Config and secrets

| ID | Severity | Item | Evidence | Status | Recommendation |
|---|---|---|---|---|---|
| R-CFG-01 | P0 | ~~`JWT_SECRET` had repo default, prod no fail-fast~~ | ~~`application.yml` weak default; prod not overridden~~ | **✅ Closed (2026-08-03)**: `application-prod.yml` `erd.jwt.secret: ${JWT_SECRET}` no default; `JwtConfig` prod rejects blank/repo dev default string; local/dev keeps DX default | Keep prod no default; public/demo must rotate and ≠ repo string |
| R-CFG-02 | P0 | ~~Seed `admin`/`123456`~~ | ~~`security-model` seed table; Flyway `V3`/`V6`~~ | **✅ Closed (2026-08-03)**: `allow-demo-admin` prod/default=false, rejects `admin`+`123456`; `dev`=true for local dogfood; `ERD_ALLOW_DEMO_ADMIN=true` escape | Change admin password on public internet; do not enable `ERD_ALLOW_DEMO_ADMIN` |
| R-CFG-03 | P1 | ~~App DB JDBC `useSSL=false` + `allowPublicKeyRetrieval=true`~~ | ~~`application.yml` dual DS jdbc-url~~ | **✅ Closed (2026-08-03)**: dual DS via `MYSQL_USE_SSL` / `MYSQL_REQUIRE_SSL` / `MYSQL_ALLOW_PUBLIC_KEY_RETRIEVAL`; `dev`/default SSL off; `prod` default `useSSL`+`requireSSL` and public-key retrieval off; compose explicitly SSL off for local MySQL without TLS | Public/Railway do not disable SSL; private no-TLS escape explicitly `MYSQL_USE_SSL=false` |
| R-CFG-04 | P1 | ~~CORS depended on `CORS_ALLOWED_ORIGINS`; SocketIO `origin:*`~~ | ~~`CorsConfig`; `application.yml` SocketIO origin~~ | **✅ Closed (2026-08-03)**: `CrossOriginPolicy` prod rejects CORS/SocketIO `*`; prod single `ERD_UI_URL` → `martin.ui.url` + `martin.socketio.origin` (no nested alias); local/dev keeps `*` + localhost CORS | Public must set `ERD_UI_URL`; no `*` / empty string; do not set `SOCKETIO_ORIGIN`/`CORS_ALLOWED_ORIGINS` again |
| R-CFG-05 | P2 | ~~OSS / MinIO default keys in yml~~ | ~~flat `martin.oss.accessKey` weak default; prod forced fake placeholder~~ | **✅ Closed (2026-08-03)**: nested `martin.oss.minio.*` + empty defaults (no repo keys); prod no longer forces `OSS_*`; when enabled `OssCredentialGuard` rejects `minio`/`minio123` | When enabling MinIO set `OSS_ENDPOINT`+rotate keys; do not use example keys in prod |
| R-CFG-06 | P2 | ~~`.env.example` leftover `OAUTH_CLIENT_*`~~ | ~~`.env.example` dead OAuth keys~~ | **✅ Closed (2026-08-03)**: removed `OAUTH_CLIENT_*`; replaced with optional OSS comment block | Do not re-add password-grant client keys |
| R-CFG-07 | P1 | ~~prod “escape hatches” ineffective: `allow-open-register`/`allow-demo-admin` literal `false` in `application-prod.yml`~~ | ~~`application-prod.yml:10` (old); profile-specific doc priority over `application.yml` `${VAR:false}` placeholders~~ | **✅ Closed (2026-08-05)**: changed to `${ERD_ALLOW_DEMO_ADMIN:false}` / `${ERD_ALLOW_OPEN_REGISTER:false}`, same placeholder keys as `application.yml`; container `ERD_ALLOW_OPEN_REGISTER=true` actually works; `e2e-accounts-enabled` stays literal `false` (by design no escape); `ProdSecurityEscapeHatchBindingTest` loads real prod config regression | New prod security switches must use `${ENV_VAR:false}` placeholders, not bare literals; if no escape intended, comment “no escape hatch” |

### Data plane (SQL / files / egress)

| ID | Severity | Item | Evidence | Status | Recommendation |
|---|---|---|---|---|---|
| R-DATA-01 | P0 | ~~`queryInfo/exec`: `${sql}` no statement whitelist~~ | ~~`QueryInfoMapper.xml`; `QueryInfoServiceImpl`~~ | **✅ Closed (2026-08-03)**: `SqlGuard.assertReadOnly` only SELECT/EXPLAIN/SHOW/DESC; blocks multi-statement | Keep read-only whitelist; `${sql}` still dynamic execution surface, do not expand DML |
| R-DATA-02 | P0 | ~~`connector/*` arbitrary JDBC + SQL~~ | ~~`AbstractDBCommand` / `DbSqlExecCommand` / `PingDBCommand`~~ | **✅ Closed (2026-08-03)**: `JdbcUrlGuard` (protocol + IMDS/link-local literal + resolve-then-check + **pin resolved IP before connect**); mutate rejects GRANT/OUTFILE; **`dataSourceId`→ACL**; **sqlexec/dbsync require id** (ping/reverse still raw) | Keep; residual: raw ping/reverse still accepts JDBC; TLS `VERIFY_IDENTITY` pin-IP vs cert IP SAN (private DBs often SSL off) |
| R-DATA-03 | P1 | ~~`GitlabController` hardcoded third-party credentials~~ | ~~`GitlabController.java:41`~~ | **✅ Closed (2026-08-03)**: deleted Controller/Service/Vo + `gitlab4j-api` dependency | Do not re-add `/ci/**`; treat leaked password as compromised |
| R-DATA-04 | P1 | ~~`POST /project/upload` no type/ownership check~~ | ~~`ProjectController` / `GroupProjectController` / `WsController` test upload; `doc/uploadWordTemplate`~~ | **✅ Closed (2026-08-03)**: deleted three unowned test uploads; `WordTemplateGuard` only `.docx` + key prefix `martin/projecterd/{projectId}/`; upload/download/gendocx via `ProjectAcl` | Do not re-add anonymous OSS write; custom template paths must not open arbitrary bucket |
| R-DATA-05 | P2 | ~~`TestJsonController` sample CRUD still exposed~~ | ~~`TestJsonController.java` + Service/Mapper/Entity~~ | **✅ Closed (2026-08-03)**: deleted Controller/Service/Impl/Mapper/Entity/`TestJsonMapper.xml`; no ignore/FE proxy | Do not re-add `/testJson/**`; table `test_json` may remain (delete-dead-code cautious on tables) |
| R-DATA-06 | P1 | ~~`data_sources.username`/`password` plaintext in DB~~ | ~~`DataSources` entity `varchar` plaintext columns~~ | **✅ Closed (2026-08-05)**: `DataSourceCredentialCipher` (AES-256-GCM, ciphertext prefix `enc:v1:`) in `DataSourcesServiceImpl` (save/updateById/update/getById/list/page) and `DataSourceAcl` (direct mapper path) encrypt before persist, decrypt on read; transparent to Controller/`ConnectorCredentialResolver`/frontend (API still plaintext); legacy plaintext `decrypt()` pass-through, next edit-save auto-encrypts (gradual migration, no batch job); key `ERD_DB_CONFIG_SECRET`, local/dev repo weak default, prod fail-fast and rejects still using default | See “Datasource credential encryption” below; before key rotation must re-save all connections with old key (else old ciphertext undecryptable) |

### Ops observability

| ID | Severity | Item | Evidence | Status | Recommendation |
|---|---|---|---|---|---|
| R-OPS-01 | — | Actuator only health/info, anonymous reachable | `application.yml:134-154`; ignore `/actuator/**`; `/actuator/env`→404 | **Acceptable**; do not expand exposure | Keep; liveness vs aggregate health see deployment |
| R-OPS-02 | — | springdoc: Security `permitAll`, prod disables endpoints | `application-prod.yml` springdoc; CHANGELOG 2026-08-03 | **Mitigated**; still on locally | Do not regress; gate only springdoc.* |
| R-OPS-03 | P2 | ~~SocketIO `0.0.0.0:9092` separate from HTTP~~ | ~~`application.yml` socketio host/port~~ | **✅ Closed (2026-08-03)**: `deployment.md` states 9092 must not be exposed raw on public internet; PaaS needs firewall/private network or reverse proxy | Keep; demo single port can ignore Presence for now |

### Misleading dead config

| ID | Severity | Item | Evidence | Status | Recommendation |
|---|---|---|---|---|---|
| R-DEAD-01 | P1 | ~~`martin.swagger.enabled` did not gate springdoc~~ | ~~`application.yml`~~ | **✅ Closed (2026-08-03)**: removed `martin.swagger` and dead class `SwaggerProperties`; gate only `springdoc.*` | Do not re-add key; prod keep springdoc off |
| R-DEAD-02 | P2 | ~~`martin.resource-server.enabled` unreferenced~~ | ~~`application.yml`~~ | **✅ Closed (2026-08-03)**: removed fake switch; resource server always on | Do not re-add key |
| R-DEAD-03 | P2 | ~~ignore: `/endpoint/**` and other paths without controllers~~ | ~~`application.yml` ignore-urls~~ | **✅ Closed (2026-08-03)**: removed `/endpoint/**`; kept login/logout/register product path/actuator/springdoc/error; share still GET only (code chain); `/register`/`/user/register` not back in ignore | New anonymous surface must have real Controller before ignore |
| R-DEAD-04 | P2 | ~~`martin.ui.url` / `ERD_UI_URL` zero code references~~ | ~~`application.yml` ui.url~~ | **✅ Closed (2026-08-03)**: `CrossOriginPolicy` reads `martin.ui.url`; prod SocketIO same-bound `ERD_UI_URL`; see R-CFG-04 | Keep wired; business redirects may reuse same key |

### Clickjacking (X-Frame-Options)

- API responses default `X-Frame-Options: DENY` (`ErdSecurityConfiguration`).
- Read-only share is frontend SPA route (anonymous `GET /share/{token}` only fetches JSON), **does not** require embedding backend in third-party iframe.
- Exception: if self-hosting wants to embed **UI** in other sites, configure nginx/CDN `Content-Security-Policy: frame-ancestors …`; do not disable backend `frameOptions` for this.

### Suggested next cuts (by ROI)

1. (This round R-DATA-02 pin-IP closed) Residual surface: raw ping/reverse still accepts JDBC (has Guard + pin); TLS hostname verification vs pin-IP tension (see R-DATA-02 recommendation column).
2. Contributor path / Agent schema and other non-security items see roadmap.
