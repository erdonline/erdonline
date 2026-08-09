# ADR-0014: @ant-design/pro-components — keep or Strangler remove

- Status: **✅ Shipped · Option B** (accepted 2026-08-02; **dependency removed 2026-08-02**)
- Decision makers: Product owner
- Prerequisite: [ADR-0005](/docs/adr/ui-architecture) (UI architecture: antd for CRUD, custom design in designer domain)

## Context

`@ant-design/pro-components` (Pro) was a direct dependency (pinned `2.8.10`). Note: `@umijs/max` **does not bundle** Pro — separate package; Max only provides antd wiring and plugin system; removing Pro does not block umi/antd upgrade path.

User question: is Pro necessary? Can we keep only antd + umi?

## Baseline usage (2026-08-02 Strangler start)

~**70 files** directly import `@ant-design/pro-components` (chrome / ModalForm / ProTable / ProList / StepsForm, etc.). After W3–W4 slice removal, **zeroed 2026-08-02**.

## Decision: Option B — Strangler removal (complete)

Three candidates:

- **A Full remove this milestone**: replace with antd `Layout/Table/Form` + thin wrappers. Rejected — 70 files, 300+ usages blast radius conflicts with "one thing at a time", competes with ReactFlow canvas and North Star three things for iteration bandwidth.
- **B Strangler (accepted and shipped)**: freeze new Pro usage; converge domain by domain with layout/capability slices; remove dependency when grep zero.
- **C Keep Pro**: only if irreplaceable for stack. Rejected — Pro value (templated CRUD) overlaps ADR-0005 "antd CRUD + custom design domain", and it's antd upgrade version coupling point.

**Shipped result (2026-08-02)**:

1. `rg -l '@ant-design/pro-components' frontend/src --glob '*.{ts,tsx}'` → **0**
2. `frontend/package.json` removed `@ant-design/pro-components` and Pro-only `umi-presets-pro`
3. `frontend/config/config.ts` removed `presets: ['umi-presets-pro']` and empty `layout:{}` (now custom Home/Group/Design Layout + `Theme`/`Outlet`)
4. New code must not reintroduce Pro (recommend later `no-restricted-imports`)

### Migration map (historical reference)

| Pro | antd / thin wrapper replacement |
|---|---|
| `ModalForm` + `ProForm*` | antd `Modal` + `Form` + `Form.Item` |
| `StepsForm` | antd `Steps` + multiple `Form` instances |
| `ProTable` (`request`/`ActionType`) | antd `Table` + hand-rolled pagination |
| `ProLayout` / `PageContainer` | antd `Layout` + custom chrome |
| `ProCard` | antd `Card` / plain container |
| `ProList` | antd `List` |
| `LoginForm(Page)` | antd `Form` direct |
| `FooterToolbar` | sticky footer bar |
| `WaterMark` | antd 5 native `Watermark` |

## Consequences

- Positive: decouples antd upgrade; custom chrome aligns with ADR-0005; smaller dependency surface
- Cost: migration period had dual-write coexistence (ended)
- Constraint: forbid re-adding `@ant-design/pro-components` / `umi-presets-pro` / `@ant-design/pro-layout`
