# Architecture

ERD Online uses a **frontend/backend split** monolith:

```
┌─────────────┐  HTTP :9502       ┌──────────────────────────┐
│  Frontend   │ ────────────────▶ │   Backend (Spring Boot)   │
│ React/Umi   │ /auth /syst /ncnb │  Single-process Monolith  │
│ (Nginx)     │ SocketIO :9092    │  + netty-socketio         │
└─────────────┘  /project/erd     │  (presence, ADR-0009)     │
                                  │  ┌─────────────────────┐  │
                                  │  │ auth  (JWT + ticket)│  │
                                  │  │ system(users/perms) │  │
                                  │  │ erd   (model core)  │  │
                                  │  │ common(shared libs) │  │
                                  │  └─────────────────────┘  │
                                  └────────┬─────────┬────────┘
                                           │         │
                                     ┌─────▼───┐ ┌───▼────┐
                                     │ MySQL 8 │ │ Redis  │
                                     │ erd +   │ │ token/ │
                                     │ martin  │ │ ticket │
                                     └─────────┘ └────────┘
```

> The frontend keeps legacy gateway path prefixes `/auth`, `/syst`, `/ncnb`. The backend `GatewayPrefixStripFilter`
> strips them in-process (equivalent to gateway `StripPrefix=1`) — no standalone gateway needed.
> Collaboration Presence uses port `9092` (ticket auth, see ADR-0009), not the HTTP proxy.
>
> **Official hosting (no VPS)**: docs / static demo → Cloudflare Pages (GH Pages fallback); runtime image → GHCR;
> data plane self-hosted only. See [ADR-0018](/docs/adr/hosting-topology-no-vps) and [Deployment](/docs/deployment).

## Backend modules (business packages inside the monolith)

| Package | Responsibility | Origin |
|---|---|---|
| `com.erdonline.auth` | OAuth2 authorization + resource server (same process) | Former martin-biz-auth |
| `com.erdonline.system` | Users / roles / menus / dictionaries | Former martin-biz-system |
| `com.erdonline.erd` | ERD modeling core, SQL, versions, collaboration | Former martin-extension-ncnb |
| `com.erdonline.erd.reverse` | Multi-DB reverse Dialect SPI (index dictionary + FK/`associations` + Generic fallback); `dbReverseMeta` exposes capabilities/schema | ADR-0006 |
| `com.erdonline.common` | core/bean/data/log/security/vip/websocket/oss/swagger | Former martin-common-* |
| `com.erdonline.config` | Security / CORS / Swagger / MyBatis / WebSocket config | Merged new |

## Key changes from microservices to monolith

- **Service discovery (Nacos)**: removed; config inlined in `application.yml`
- **API gateway**: removed; auth / CORS logic merged into monolith Security filter chain
- **Feign remote calls**: replaced with in-process Spring Bean injection
- **OAuth2**: authorization and resource servers merged; same RedisTokenStore for local issue/validate
- **Sentinel / Skywalking**: removed

## Project model source of truth (projectJSON)

Tables/fields/associations/canvas layout for ERD projects live in JSON column `project.projectJSON` (not normalized relational tables). Public spec and machine-validatable schema:

- Docs: [data-format](/docs/data-format) (additive compatibility only, credential discipline)
- Schema: [`schema/projectjson.schema.json`](https://github.com/erdonline/erdonline/blob/main/schema/projectjson.schema.json)
- Validation: `node scripts/validate-projectjson.mjs`

JDBC secrets do not go in projectJSON (ADR-0008); connections live in `data_sources`.

## Data storage

Uses a **single business database** `erd` (ADR-0020). Historical dual DB (`martin`/`erd`) merged; stub tables in old erd dump that duplicated auth were dropped.

- **Tables in one DB**: system/auth (users, roles, menus, OAuth, QRTZ…) and modeling metadata (projects, versions, shares, `data_sources`…) coexist.
- **Dual SqlSessionFactory (transitional)**: `MartinDataSourceConfig` / `ErdDataSourceConfig` still route by mapper package, but JDBC both point at the same `MYSQLDATABASE` (default `erd`).
- **Redis**: OAuth token storage (RedisTokenStore) and cache.
- **Bootstrap**: `db/init` only CREATE DATABASE + CREATE TABLE; seeds / demo / E2E written by `classpath:db/migration/erd` (`ErdFlywayConfig`).
