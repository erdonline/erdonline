# ADR-0019: Official Demo runtime — Railway-only (real MySQL 8)

- Status: Accepted (2026-08-02)
- Decision makers: Project maintainers

## Context

ADR-0018 set: docs / static demo via Cloudflare Pages, images via GHCR, **no production VPS**; public demo API deferred separate step.
Static site `DEMO_API_URL` may be empty; full trial needs public backend + MySQL + Redis.

Previously evaluated "TiDB Serverless + Upstash Redis + some container host" three-vendor assembly, and domestic PaaS (Zeabur) vs Railway plugin-in-one. Maintainer registered Railway and Zeabur; prior decision: **official demo default = Railway-only**.

## Decision

| Role | Host | Notes |
|---|---|---|
| **Official demo backend** | **Railway** (single project) | App service runs `ghcr.io/erdonline/erdonline-backend` (or Dockerfile); **MySQL plugin (MySQL 8)** + **Redis plugin**; env vars align Spring Boot (`DB_*` / `REDIS_*` / `JWT_*`, etc.) |
| Static demo frontend | Cloudflare Pages (ADR-0018) | Variable `DEMO_API_URL` → Railway public HTTPS root URL |
| China region fallback | **Zeabur** | Same idea (container + managed MySQL/Redis); **not** official default path, docs brief mention only |
| User production / self-host | **docker compose** (ADR-0018) | Project does not host user production data; compose + GHCR still recommended production path |

Explicitly rejected:

- **TiDB + Upstash (or other) three-vendor assembly** as official demo: multiple bills, multiple failure surfaces, dialect/compatibility mental load, not worth demo scale
- Treating Railway/Zeabur demo as "official production" or self-host replacement
- Long-term VPS purchase for demo (does not overturn ADR-0018)

## Consequences

- Positive: one Dashboard App + real MySQL 8 + Redis; same data plane shape as compose (dual DB `martin`/`erd`); cost controllable (Hobby ~$5–10/month order of magnitude, per Railway billing)
- Cost: need release tag before GHCR has pullable image; empty DB must manual/`mysql` load `db/init` (Flyway only covers erd incremental); cross-origin needs `ERD_UI_URL`; SocketIO `:9092` may be unavailable on single HTTP port platform (demo REST-first)
- Dashboard hard settings (cannot write to toml): App **Root Directory = `backend`**; **Config as Code = `/backend/railway.toml`**. Otherwise monorepo root build fails; before first `v*` do not use GHCR Image that doesn't exist yet
- vs existing ADR: fills ADR-0018 "public demo API" gap; does not change self-host compose source of truth
- Ops steps: see [Deployment — Railway official demo](/docs/deployment#railway-demo); China fallback see [Zeabur](/docs/deployment#zeabur-demo)
