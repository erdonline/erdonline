# ADR-0001: Migrate designer canvas to ReactFlow

- Status: Accepted (2026-08-01)
- Decision makers: Project maintainers

## Context

The designer core was built on G6 1.x (unmaintained since 2019), loaded via script tag as a global, with a ~1550-line class component (`frontend/src/pages/design/relation/g6.js`), no types, no tests. Planned canvas features — inline editing, rich node styling, virtualization — are natural in modern frameworks but infeasible or prohibitively expensive on G6 1.x.

## Decision

Migrate to **ReactFlow** using a **Strangler** strategy:

- R0 probe: validate projectJSON → ReactFlow nodes/edges mapping (field-level anchors via native Handles) ✅
- R1 parity: drag, zoom, minimap, connections, delete guards, auto-save, dagre ✅
- R2 beyond legacy: undo/redo, inline edit, multi-select align, command palette ✅
- R3 switch: relation diagram entry is ReactFlow-only; delete `g6.js` and right-click/relation edit satellite files ✅ (2026-08-01)
  - Export: `relation2file` now uses DOM+SVG+html2canvas; global `g6*.js` removed from entry ✅

During migration, legacy G6 gets S-tier hotfix only — no M-tier+ investment (canvas and export both switched).

## Addendum (2026-08-01 walkthrough: pre-existing breaks the new canvas must fix)

Walkthrough confirmed the old canvas modeling loop was fully broken: ① folder-mode tree missing "Relation diagram" entry (S-tier hotfix applied); ② no drag source on frontend, entities never reach canvas; ③ `addEntity` does not write `graphCanvas`. New canvas data model must be: **nodes derived from full `module.entities` set (entity = node, created = on canvas); `graphCanvas` stores layout only (coordinates/collapse state); nodes without coordinates get auto-layout**. Do not inherit the "entity ≠ canvas node" dual-write model.

## Consequences

- Positive: custom nodes = React components; inline edit/rich styling natural; community momentum helps contributors; undo self-built more controllable than G6 black box
- Cost: 2–4 week migration window with legacy canvas frozen; 500-table large diagrams need `onlyRenderVisibleElements` + node memo manual tuning
- Risks & mitigations: data format compatibility → projectJSON schema versioning (see [data-format](/docs/data-format)); migration quality → Playwright smoke first
