# ADR-0025: Share link social unfurl (OG cards) via backend pre-render

- Status: Accepted
- Date: 2026-08-08
- Related: [ADR-0007 Read-only share](/docs/adr/readonly-project-share), [ADR-0016 Experience-first · shareable diagrams](/docs/adr/experience-first-shareable-diagram), [ADR-0018 Hosting topology](/docs/adr/hosting-topology-no-vps)

## Context

Growth loop choke point is "share → exposure": when users paste read-only share link `/s/:token` (or `/demo`) to HN / Twitter / WeChat / Slack, card crawlers **do not execute JS**, while frontend is UmiJS SPA — `index.html` has only generic meta — so all share links unfurl as blank cards, viral coefficient ≈ 0, all frontend acquisition doesn't compound.

Repo-wide `grep og:` zero hits, confirming social unfurl never done before.

## Decision

**Backend pre-renders HTML unfurl page with Open Graph / Twitter Card meta for share/demo URLs, crawler-facing only; humans still take SPA path.**

- New anonymous GET endpoints (no gateway prefix, Security allows `/og/**`):
  - `GET /og/s/{token}`: resolve project name / description / table count by token, output `og:*` + `twitter:card=summary_large_image`; invalid token falls back to brand generic card (still 200, no existence leak).
  - `GET /og/demo`: fixed brand card for public demo.
- HTML contains `<meta http-equiv=refresh>` + `location.replace()`: humans hitting unfurl page directly jump back to `/s/{token}` / `/demo`.
- `og:image` from backend `GET /og/s/{token}/image.png` **dynamic render** (Java2D, 1200×630, no browser): draw table names/field grid + brand + tagline from projectJSON, filter non-displayable CJK via `canDisplay` to avoid tofu. More "shareable" than static image, changes with project content.
- Production hosting (nginx, same origin) **by crawler User-Agent** reverse-proxy `/s/*`, `/demo` to backend unfurl page; human UA keeps SPA. Human URLs stay clean `/s/:token`, share button output unchanged.

## Alternatives considered / rejected

- **Frontend SPA meta injection**: crawlers don't run JS, ineffective. Rejected.
- **CF Pages edge function pre-render**: feasible but binds to hosting side, not verifiable locally, duplicates "backend same-origin reverse proxy". B-plan fallback, not preferred.
- **Change share URL to point directly at backend unfurl page**: humans extra hop, URL dirty. Rejected — use UA split to keep clean URLs.

## Consequences

- Positive: share links get proper large-image cards on platforms, closes "share→exposure" loop; backend unfurl page assertable via `curl`, E2E verifiable locally.
- Cost: nginx needs UA split segment (production); backend adds anonymous endpoint (HTML escaped against injection, invalid token no existence leak).
- Constraint: dynamic image is "schema-like brand card" (table names/field grid), not canvas 1:1 screenshot; pixel-perfect layout reproduction can be separate headless render slice later.
