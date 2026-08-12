# ADR-0028: Official template catalog (Open VSX model)

- Status: **✅ Accepted** (MVP 2026-08-09)
- Decision makers: Project maintainers (overrides vision "no plaza/social" with targeted exception)
- Prerequisites: [ADR-0007](./0007-readonly-project-share.md) share fork scrubbing; [ADR-0013](./0013-public-api-mcp.md) PAT scopes; [ADR-0021](./0021-idp-federation-google-wechat.md) GitHub identity

## Context

New-user "create project" empty-state conversion is low; official example projectJSON hides in code/docs—not browsable, not one-click install. Figma Community analogy: browse → preview → install (=fork) → edit → save version. Historical vision said "no plaza/social"; maintainers approved **official networked template catalog** (not an LLM model marketplace).

Relation to ADR-0007: share links serve "read-only spread"; template catalog serves "discoverable + installable starting point". Both reuse `ProjectShareServiceImpl.sanitizeProjectJson` scrubbing discipline.

## Decision

| Topic | Decision |
|---|---|
| Shape | **Open VSX model**: catalog code MIT in main repo; optional `ERD_CATALOG_API_URL` (empty = Flyway/seed offline only); no closed-source cloud fork |
| Data | Flyway `catalog_template` / `catalog_rating` / `catalog_install` / `catalog_submission`; official seeds from `schema/examples` + `backend/.../catalog-seed/` |
| API | Browser `GET/POST /catalog/v1/**` (session JWT); MCP/PAT `GET/POST /api/v1/catalog/**` (read `projects:read`, install `projects:write`) |
| Create IA | `/project/new` → `/catalog`; Home CTA, empty state "Create from template"; first tile = blank project |
| Discovery IA | **Public `/catalog` CatalogLayout** (Landing brand shell, not HomeLayout); anonymous browse; install/rating/review require login; maintainer review `/catalog/review` requires login |
| Install | `POST …/install` → each call `initPersonProject` new personal project + fork-equivalent scrubbing; tags include `sourceTemplateId=<id>`; **same user may install multiple times** (Figma Community model, not silent reuse of old project) |
| Social P0 | Ratings (must have installed once, 1 vote/user); install count **cumulative** (incl. same user multiple installs); author page `GET …/creators/{handle}` (GitHub handle) |
| Social P1 | Comments (install + rate limit), report auto-hide, author toggle/restrict commenters, hot sort + official/community filter → ✅ 2026-08-09 |
| Publish | Project creator submits → `pending` → maintainer (**must explicitly configure** `erd.catalog.maintainer-usernames` / `ERD_CATALOG_MAINTAINER_USERNAMES`; prod default empty, dev may include `admin`) approve/reject. GitHub binding not required; on approve author handle prefers GitHub → account **username** → nickname; Flyway V22 backfills historical `community-*` |
| MCP | `list_templates` / `get_template` / `install_template` / `get_creator`; **no** `publish_template`; **no** PAT rating/comment |
| Explicitly out | Paid templates, LLM generation, template version inheritance, follow/DM, Agent auto-publish |

## Consequences

- Positive: 30s wow entry; examples discoverable; agents can `install_template` bootstrap; self-host offline works
- Cost: new tables + review ops; community template quality via maintainer gate; remote catalog merge when `ERD_CATALOG_API_URL` non-empty is a later iteration
- Discoverability: completes "zero to first version" funnel; does not replace share/docs site

## Slices

| # | Deliverable | Status |
|---|---|---|
| 0 | This ADR + roadmap/CHANGELOG/architecture/deployment | ✅ |
| 1 | List/detail API + seeds + `/catalog` UI | ✅ |
| 2 | install + create IA redirect | ✅ |
| 3 | ratings/install count/author page | ✅ |
| 4 | publish queue + maintainer review | ✅ |
| 5 | MCP four tools | ✅ |
| P1 | comments, reports, hot tab, official/community filter | ✅ |
