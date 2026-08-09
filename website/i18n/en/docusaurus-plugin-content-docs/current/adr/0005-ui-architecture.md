# ADR-0005: UI architecture — antd for CRUD, custom design in designer domain

- Status: Accepted (2026-08-01)
- Decision makers: Project maintainers (AI evaluation authorized)

## Context

Frontend today: antd v5 + Ant Design Pro + UmiJS Max; all CRUD pages built and E2E green. Round 2 startup re-evaluated whether UI architecture fits "best open-source ERD tool" goal.

## Evaluation evidence

- antd sweet spot (forms/tables/modals/trees) = all CRUD page needs here; invested, test-covered, contributors familiar (especially Chinese community)
- Measured pain only two items: v5 hash class names break Playwright class selectors (resolved with role/semantic selectors — became best practice); Tabs content auto height caused one canvas collapse (fixed)
- Designer domain (canvas nodes/field handles/command palette/context toolbar) — antd component shapes don't cover; forcing antd distorts
- Full migration (shadcn/Mantine/Tailwind rewrite) only changes CRUD appearance, not user value; regression cost in weeks, negative ROI

## Decision

**Dual-domain architecture**:

1. **CRUD/shell domain** (login, project list, settings, export, etc.): keep antd v5 + Pro components, no migration, no reskin
2. **Designer domain** (canvas and all in-canvas UI): custom design system — scss + custom React components (`ReactFlowRelation`/`TableNode` as precedent), styles in co-located `*.scss`, **no antd inside canvas** (exception: Modal/message and other global feedback)
3. **No Tailwind**: custom style volume still small, scss enough; revisit at R2 (command palette and other large surfaces)

## Consequences

- Positive: each domain uses optimal tools; designer code most readable for humans and AI (no theme bleed-through / no hash class wars); CRUD zero regression risk
- Cost: two style paradigms coexist → directory boundary constraint (`pages/design/**` custom, rest antd), no extra linter rules
- Review trigger: designer custom components exceed 15 / command-palette-class complex surface appears → re-evaluate Tailwind

## Progress (2026-08-01)

- ✅ All direct `@mui/*` dependencies and source references removed (dialog Divider/Button/Grid/icons → antd)
- 📋 `@blueprintjs/*` still remains (designer sidebar menu/part of export triggers); converge or keep as designer transition layer in later slices
