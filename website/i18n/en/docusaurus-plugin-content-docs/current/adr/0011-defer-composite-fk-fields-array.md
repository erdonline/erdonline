# ADR-0011: Defer composite FK change to AssociationEnd.fields[]

- Status: Accepted (2026-08-02); **`fields[]` still deferred** (2026-08-03 review: unblock conditions not met)
- Decision makers: Project maintainers

## Context

P0 four DBs already pull FK via dictionary SQL; composite keys **split into multiple** single-field `Association` edges by `ORDINAL_POSITION` (`from.field` / `to.field`), aligned with ReactFlow field-level connections. Changing to single edge + `fields[]` requires canvas multi-anchor/edge model sync — ROI lower than continued acquisition and docs site.

## Decision

1. **Keep** "one column one edge"; dictionary layer already ordered, precision sufficient
2. **Do not** do `AssociationEnd.fields[]` / single logical FK aggregation this phase
3. When needed, separate milestone: FE multi-field edge protocol first, then reverse aggregation
4. **Additive metadata allowed** (edge granularity unchanged): `constraintName` / `deleteRule` / `updateRule` on each split association; composite FK multiple edges share same `constraintName` (see [data-format](/docs/data-format))

## Consequences

- Positive: canvas and import need no big change; four-DB dictionary FK can mark done; constraint name and referential actions reverse-faithful without touching `fields[]`
- Negative: composite FK still multiple associations in JSON (logical aggregation awaits milestone)

## Unblock conditions (`fields[]`)

Separate milestone only when **both**: **FE multi-field edge protocol** (single logical FK → multi-anchor/routing) shipped, **and** North Star ROI beats other reverse gaps. Until then forbid changing split edges to `from.fields[]`/`to.fields[]`.
