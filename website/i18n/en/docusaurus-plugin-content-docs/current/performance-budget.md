# Performance budget

> Baseline reference to prevent “works but keeps getting slower.” Exceeding budget must be absorbed in the same iteration or documented with exemption rationale.

## Budget table (2026-08-01 baseline)

| Metric | Budget | Current baseline | Measurement |
|---|---|---|---|
| `frontend/dist` total size | ≤ 20 MB | ~14 MB | `du -sh frontend/dist` (after `yarn build`) |
| Smoke “login → create → enter designer” | ≤ 30 s | ~10.4 s (local) | `npx playwright test tests/e2e/smoke.spec.ts` (third test: login → new project → designer) |
| Relation diagram full journey E2E | ≤ 60 s | ~26 s (local) | `npx playwright test tests/e2e/relation.spec.ts` |
| **Activation: landing → demo → login → example → first version** | ≤ 30 s (wall clock, timed segments) | **~3.5 s** (local 2026-08-02) | `npx playwright test tests/e2e/activation-30s.spec.ts --project=chromium` |
| Designer hot-path `console.log` | 0 (all src `log/debug/info`) | ✅ cleared | `rg 'console\.(log\|debug\|info)' src` |

### Activation journey segment baseline (2026-08-02, local chromium)

Product narrative “30 seconds to version save” = real cold-start feel target; E2E measures automated wall clock (excludes warmup DB clear/logout).

| Segment | Baseline (ms) | Notes |
|---|---|---|
| `landing` | ~56 | `/` brand + main title visible |
| `demo` | ~1.5k | CTA → `/demo` relation diagram visible |
| `login` | ~0.3k | Seed account login (excludes real registration form) |
| `example_ready` | ~0.3k | `/home` one-click example → ready toast |
| `save_version` | ~1.4k | CTA → add version → `1.0.0` row visible |
| **Total (timed segments)** | **~3.5 s** | Assert ≤ 30 s; 2 consecutive runs green |

Full spec (including warmup cleanup) ~ ~10 s — not counted in 30s budget. If CI occasionally slows: check FE/BE health and lock contention first; two consecutive rounds >20% over budget triggers drift protocol pause.

## Red lines

- New dependency grows dist > 1 MB: PR must justify benefit
- Core journey E2E slows > 20% two rounds in a row: stop and find regression (iteration protocol drift control)
- No restoring debug `console.log` on zustand `set` / layout render paths

## Canvas scale

| Metric | Budget | Current |
|---|---|---|
| Viewport culling threshold | ≥24 tables enables `onlyRenderVisibleElements` | ✅ |
| DOM nodes when zoomed | < logical table count | ✅ `canvas-scale.spec.ts` |

Full virtualization (tables >100, very many fields) can still be optimized; Lighthouse CI pending stable demo site.
