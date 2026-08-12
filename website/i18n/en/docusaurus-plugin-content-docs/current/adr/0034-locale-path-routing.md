# ADR-0034: Locale routing — `/en/*` for marketing pages only, not in-app routes

- Status: **Accepted** (2026-08-12)
- Prerequisites: [ADR-0023](./0023-i18n-foundation.md) (default zh-CN + `baseNavigator`), [ADR-0033](./0033-app-i18n-extraction-conventions.md) (bulk i18n conventions)
- Related: [ADR-0025](./0025-og-social-unfurl.md) (crawler UA split / OG reveal pages), [ADR-0018](./0018-hosting-topology-no-vps.md) (CF Pages hosting), [ADR-0003](./0003-docs-docusaurus.md) (docs site already has `/en/`)

## Context

`www.erdonline.com` is a pure CSR SPA; Chinese and English **share the same URLs**; language from `umi_locale` / browser language. For search engines one URL = one language version — English content is not indexable, hreflang has no URL, and English keyword organic traffic is blocked.

Full-site path localization would touch 60 routes, 76 `history.push/replace`, 236 E2E `page.goto()`, 16 backend URL configs, nginx bot rules, and immutable `/s/:token` short links. Login-required in-app pages have **no SEO value**; only `/`, `/compare`, `/catalog` matter (~21 internal marketing links).

## Decision

**Introduce `/en` path prefix for marketing pages only; in-app pages, `/s/:token`, `/demo` stay un-prefixed.**

| Item | Decision |
|---|---|
| Path scope | Slice 1: `/en`, `/en/compare`; slice 2: `/en/catalog` (list only; not `/catalog/:id`) |
| Implementation | Explicit English routes in `config/routes.ts`; `LocaleRoute` forces `setLocale('en-US', false)` on `/en*` and `zh-CN` on `/` — **path overrides localStorage and browser language** |
| In-app pages | No prefix; 76 `history.push` and 236 `page.goto` **unchanged** |
| First visit | English browser without explicit `umi_locale` and non-crawler UA → one-time `history.replace('/en')`; explicit switch writes `umi_locale` and stops auto redirect |
| Language switcher | Marketing: path jump (`/compare` ↔ `/en/compare`) + `setLocale`; in-app: existing `setLocale` |
| SEO | `usePageSeo` adds canonical, hreflang zh-CN/en/x-default, `og:locale`; `frontend/public/sitemap.xml` registers both languages |
| Prerender | **Not now**; 90-day Search Console gate before optional `exportStatic` for marketing routes only |
| nginx / backend | Zero change |

Rejected: full-site `/en/*`; status quo; multilingual share/demo URLs; Accept-Language cloaking.

## Relationship to bulk i18n

**No blocking dependency; parallel.** This ADR indexes marketing pages; ADR-0033 fixes in-app English retention. Order: slice 1 here → ADR-0033 extraction → slice 2 `/en/catalog`.

## Consequences

- Positive: first independently indexable English URLs; small change surface.
- Cost: marketing vs in-app locale rules differ; sitemap maintenance.
- Risk: UA regex must stay synced with `nginx.conf`; 90-day CSR indexing gate may trigger SSG slice.
- Verification: Googlebot curl 200 + hreflang; E2E `/en` English + `/` Chinese; en browser first visit redirect once, explicit zh switch stops redirect.
