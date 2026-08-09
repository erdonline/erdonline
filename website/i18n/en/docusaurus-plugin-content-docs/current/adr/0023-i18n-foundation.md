# ADR-0023: i18n foundation (default zh-CN; English-first ≠ switch default)

- Status: **Accepted** (2026-08-04); **foundation slice ✅ 2026-08-04** (`getAntdLocale`, deleted `frontend/src/locales/`, `e2e-locators` anti-fragility)
- Related: [ADR-0005](/docs/adr/ui-architecture) (antd only)

## Decision

| Topic | Decision |
|---|---|
| Timing | **One** foundation slice after B-layer five-state closed loop; **no** i18n MVP during dual-layer A/B trust work |
| Default locale | **Fallback** still **zh-CN** (unknown browser language); first visit **`baseNavigator: true`** matches browser zh/en; user explicit switch **`useLocalStorage`** takes priority |
| Backend copy | Structured error code is truth; FE maps copy; **do not** pass Accept-Language through JDBC errors |
| Foundation three steps | (1) Theme locale configurable via umi/`getAntdLocale`, fallback zh-CN (2) Clear/replace dead `locales/` skeleton (3) E2E anti-fragility rules |
| Full i18n | P3 deferred (language switch UI, full-site keyification) |
