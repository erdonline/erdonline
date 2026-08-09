# ADR-0013: Public API / MCP

- Status: **✅ Accepted** (manual unblock 2026-08-04; slices 1–5 ✅ + `projects:write` REST/MCP ✅ + Redis rate limit ✅ + **OAuth slices A+B** ✅ + **client / PAT management UI** ✅ + **consent page** ✅ + **refresh_token** ✅ + **OIDC thin MVP** ✅ + **nonce/at_hash** ✅ + **RS256·JWKS** ✅)
- Decision makers: Project maintainers (Vision auto-track pause at `785d699`, then **explicit choice** of this ADR as next milestone)
- Prerequisite: [ADR-0012](/docs/adr/ai-era-data-structure-platform) Option B accepted; [ADR-0016](/docs/adr/experience-first-shareable-diagram) season "no MCP product code" **special unblock** by this manual decision (this milestone only, no version branch / live sync reopen)

## Context

ADR-0012 lists "API/MCP open" as platform capability: agents read schema, submit new versions. Public API and MCP server introduce new auth surface, rate limiting, scope model — not to be decided and implemented same round as landing page narrative.

Trigger status: landing page ✅; schema-as-code ✅; need = internal dogfood + agent-readable source of truth (adopt-first).

## Decision (locked · adopt-first / MIT)

| Topic | Decision |
|---|---|
| Auth model | **Personal Access Token (PAT)** + **OAuth** (client_credentials + Authorization Code/PKCE + refresh_token) + **OIDC** (discovery / RS256 `id_token` + JWKS / userinfo). PAT prefix `erd_pat_`; OAuth access token prefix `erd_oat_`; refresh prefix `erd_ort_`; auth code prefix `erd_ac_`. All call `/api/v1/**` via `Authorization: Bearer <token>` (**PAT/OAT only**; refresh **cannot** call API directly). Session JWT **not** accepted on `/api/v1/**`. |
| OAuth (sliced) | **Slice A (✅)**: machine-to-machine — register confidential client → `POST /oauth/token` `grant_type=client_credentials` → short-lived `erd_oat_` (default TTL 3600s). Access as **registrant**. **No** refresh / id_token. **Slice B (✅)**: browser Authorization Code + **mandatory PKCE S256** — `GET /oauth/authorize` (session JWT) → consent page JSON preview; product UI `/oauth/authorize` explicit Allow/Deny; `POST decision=allow` only then issue `erd_ac_` → `POST /oauth/token` `authorization_code` + `code_verifier` → `erd_oat_` + `erd_ort_` (+ if scope includes `openid` → `id_token`). Deny → `error=access_denied`. Access as **authorizing user**. Public client no secret; confidential exchange still requires secret. **Post-MVP refresh (✅)**: auth code only issues `erd_ort_` (SHA-256); `grant_type=refresh_token` **rotation** (old token void + new access/refresh same `family_id`; if openid re-sign `id_token`); reuse revoked refresh → **whole family revoked**; `POST /oauth/revoke` (RFC 7009 style) + revoking client also voids refresh. |
| **OIDC (✅) + nonce/at_hash (✅) + RS256·JWKS (✅)** | `GET /.well-known/openid-configuration`; issuer=`ERD_OIDC_ISSUER` else `ERD_UI_URL` (`martin.ui.url` first item). **RS256** `id_token` (hard cut, deprecate `ERD_OIDC_HMAC`); keys: `ERD_OIDC_RSA_PRIVATE_KEY` (PEM) or `ERD_OIDC_RSA_PRIVATE_KEY_PATH` or PKCS12 (`ERD_OIDC_RSA_KEYSTORE_PATH`); prod missing key fail-fast (align JWT_SECRET); non-prod unconfigured auto-generates `~/.erdonline/oidc-rsa-private.pem` (outside repo). `GET /.well-known/jwks.json` publishes public JWK (`kid`=thumbprint or `ERD_OIDC_RSA_KID`). `GET /oauth/userinfo`: Bearer OAT + `openid`. `openid` in `PatScopes` whitelist (default mint still excludes). **nonce** (optional): `GET/POST /oauth/authorize?nonce=` → bind `oauth_authorization_code.nonce` → auth code exchange `id_token` echo; **refresh exchange omits nonce** (OIDC Core §12.2). **at_hash**: on auth code / refresh id_token compute from access_token (RS256 → SHA-256 left half + base64url). ~~**Not doing**: third-party IdP federation.~~ → **Unblocked by [ADR-0021](/docs/adr/idp-federation-google-wechat)** (session login surface; unrelated to PAT/OAT). |
| Secret storage | **SHA-256 hex only** (PAT / client_secret / OAT / ORT / auth code). Plaintext only at mint/exchange/authorize response once. No plaintext/reversible encryption in DB. `id_token` is JWT, not stored. |
| Client types | `confidential` (default, may `client_credentials`, requires secret) / `public` (SPA, no secret, **forbidden** client_credentials, must register `redirectUris`). `redirect_uri` **exact string match** (no fragment; only `https` or `http://localhost\|127.0.0.1\|[::1]`). |
| PKCE / CSRF | `code_challenge_method=S256` only (reject `plain`); `state` required; auth code default TTL 120s (`ERD_PUBLIC_API_OAUTH_CODE_TTL`), single use; unregistered redirect **never** 302 (open redirect prevention). |
| Scope (this milestone) | Default mintable: `projects:read`, `versions:read`. **Write unlocked**: `projects:write`, `versions:write`. **OIDC**: `openid` (explicit). OAuth client registered scopes same `PatScopes` whitelist as PAT; exchange `scope` must ⊆ client registered. |
| Rate limit | Default **60 req/min/token** (`erd.public-api.rate-limit-per-minute` / `ERD_PUBLIC_API_RATE_LIMIT`); **Redisson `RRateLimiter`** cluster-shared quota (key `erd:public-api:rl:<pat\|oat\|ip>`); over limit HTTP 429 + `Retry-After`. Read and write share quota. Redis unavailable **fail-closed** → HTTP 503 (no in-process fallback, avoid multi-instance bypass). |
| MCP tool list | Read-only five-pack + **`create_version`** (`versions:write`) + **`update_project`** / **`put_project_json`** (`projects:write`) → REST + PAT (OAT also works). Transport: stdio (default) + Streamable HTTP (`--http`). |
| Share / SQL boundary | PAT/OAT ≠ [ADR-0007](/docs/adr/readonly-project-share) share token (share still anonymous read-only single project). Public API **does not** expose connector / mutate SQL; write paths reuse member ACL, clear `profile.dbs` before write (ADR-0008). |
| OpenAPI | springdoc group `public-v1`; **prod still off** `springdoc.*.enabled` (existing gate, demo does not relax). |
| CORS | Token `/oauth/token`, revoke `/oauth/revoke`, userinfo, discovery anonymous allow **does not** relax CORS; still existing `CrossOriginPolicy` (prod rejects `*`). Authorize requires session JWT, same no extra CORS. |

## Slice progress

| # | Delivery | Status |
|---|---|---|
| 1 | PAT table (hash) + mint/list/revoke + `/api/v1/me` + rate limit skeleton + OpenAPI group | ✅ 2026-08-04 |
| 2 | `GET /api/v1/projects`, `GET /api/v1/projects/{id}` (member ACL, projectJSON read-only, secret discipline) | ✅ 2026-08-04 |
| 3 | `GET /api/v1/projects/{id}/versions` (and single version detail) | ✅ 2026-08-04 |
| 4 | MCP server skeleton (stdio/HTTP) read-only tools → above REST | ✅ 2026-08-04 |
| 5 | Write scope + `POST …/versions` (save=commit) + MCP `create_version`; rate limit quota + create audit log | ✅ 2026-08-04 |
| — | `PATCH /api/v1/projects/{id}` + `PUT …/projectJSON` (`projects:write` + member; clear `profile.dbs`) | ✅ 2026-08-04 |
| — | Redis / Redisson cluster rate limit (replace in-process skeleton; fail-closed) | ✅ 2026-08-04 |
| — | MCP `update_project` / `put_project_json` (`projects:write`) | ✅ 2026-08-04 |
| A | OAuth client register/list/revoke + `client_credentials` → `erd_oat_` calling `/api/v1` | ✅ 2026-08-04 |
| B | Authorization Code + PKCE S256 (public/confidential; authorize + token) | ✅ 2026-08-04 |
| — | In-product OAuth client management UI (`/account/settings?selectKey=oauthClients`) | ✅ 2026-08-04 |
| — | In-product PAT management UI (`/account/settings?selectKey=personalAccessTokens`) | ✅ 2026-08-04 |
| — | Consent page (`/oauth/authorize` Allow/Deny; GET preview does not issue code) | ✅ 2026-08-04 |
| — | **refresh_token** (`erd_ort_`; rotation + reuse detection; `/oauth/revoke`; auth code only) | ✅ 2026-08-04 |
| — | **OIDC thin MVP** (discovery / HS256 id_token / userinfo / `openid` scope) | ✅ 2026-08-04 |
| — | **OIDC nonce + at_hash** (authorize bind; refresh omits nonce) | ✅ 2026-08-04 |
| — | **OIDC RS256 + JWKS** (deprecate HMAC; public key `/.well-known/jwks.json`) | ✅ 2026-08-04 |

## Consequences

- Positive: agents/scripts get first-class auth; M2M and browser third-party apps both OAuth; North Star can measure "API-produced version saves" guardrail; browser clients can refresh without repeated consent; OIDC RPs can use standard discovery + id_token + userinfo
- Cost: new token surface needs revoke/expiry/rate-limit ops; docs must stress "plaintext seen once"; write scope expands blast radius — mint least privilege; OAuth client revoke must void issued OAT/ORT and unconsumed codes; auth code traffic accesses as authorizing user (differs from client_credentials registrant); refresh reuse detection revokes whole family (anti-theft; legitimate concurrent clients must serialize refresh); RSA private key separate ops (PEM/PKCS12; rotation changes kid)
- Explicitly not doing (still deferred): in-product black-box "one sentence generates ERD"; self-built LLM; ~~third-party login IdP federation~~ (→ [ADR-0021](/docs/adr/idp-federation-google-wechat))
