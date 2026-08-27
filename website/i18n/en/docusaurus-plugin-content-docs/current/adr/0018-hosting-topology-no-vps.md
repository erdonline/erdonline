# ADR-0018: Hosting topology — GitHub + Cloudflare free tier, no production VPS

- Status: Accepted (2026-08-02); **amended 2026-08-27**: retired GitHub Pages docs host; sole public URL `https://doc.erdonline.com`
- Decision makers: Project maintainers

## Context

Open-source project needs discoverable docs site, pullable container images, and (optional) static frontend demo.
Maintainer constraint: **no production VPS purchase**; formal business data not hosted by project; public demo API (e.g. Render) separate step.

## Decision

| Surface | Host | Notes |
|---|---|---|
| Docs site (Docusaurus) | **Cloudflare Pages** (project `erdonline-docs`) | **Sole public URL** `https://doc.erdonline.com`; `main` via Actions + Wrangler |
| Legacy GitHub Pages | **Off** | Unpublished 2026-08-27; `docs-site.yml` no longer deploys github.io |
| Frontend static demo | **Cloudflare Pages** (project `erdonline-demo`) | `yarn build:prod` + `env-config.js`; API may be empty |
| Runtime images | **GHCR** | `ghcr.io/erdonline/erdonline-backend` / `…-frontend`; tags on release |
| Self-hosted data plane | **User's own machine** | `docker compose` pull images; project does not host production DB |

Explicitly not doing (this ADR):

- No VPS purchase for docs/demo
- No Render (or other) public backend this slice (separate step)
- User projectJSON / credentials on project free hosting is not "official production"

## Consequences

- Positive: zero fixed server cost; docs and static site public; self-hosters have reproducible image path.
- Cost: full online trial depends on future demo API; CF / GH free quotas and domain need secrets maintenance.
- Risk: empty `DEMO_API_URL` static site only shows landing/guidance, API journeys unavailable — must document clearly to avoid "broken demo" expectation.
- vs existing ADR: does not overturn ADR-0003 (Docusaurus); public host is Cloudflare Pages. GitHub Pages unpublished 2026-08-27.
- Ops checklist (Token / Pages projects / GitHub Secrets / acceptance URLs): see [Deployment — GitHub Actions × Cloudflare Pages setup](/docs/deployment#cf-pages-setup).
