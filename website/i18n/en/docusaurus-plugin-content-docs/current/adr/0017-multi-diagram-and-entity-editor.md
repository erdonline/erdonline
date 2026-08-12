# ADR-0017: Multiple relation diagrams + in-diagram grouping + entity editor and model tree density

- Status: Accepted (2026-08-02); Phase 1 ✅; Phase 2a (multi-diagram switcher + `diagrams[]`) ✅; Phase 2b (Frame visual box) ✅; `includeEntities` filter UI / delete-diagram polish can be separate slices
- Decision makers: Project maintainers; continues ADR-0016 "shareable beautiful diagrams" main line

## Context

Model design page / table design page flagged by user: tone inconsistent with `erd-*` tokens, content flush to edges without breathing room, table design three tabs rough, model tree "Tables / Relations" collapsed by default and no virtualization when many tables/relations scroll. Also capability ask: **relation diagrams must support multiple diagrams; single diagram must support grouping**.

## Research conclusions (public best practices, English sources Aug 2026)

1. **Multiple diagrams = multiple "views" of same schema, not multiple data copies**. dbdiagram "Diagram Views" (Sep 2025 release, Apr 2026 in DBML as-code) and MySQL Workbench "one model multiple EER Diagram tabs" agree: entities/associations single copy, diagram stores layout and filtered subset only. dbdiagram community confirms: hundreds of tables makes single diagram unusable — multi-view is necessity not enhancement.
2. **In-diagram grouping has two orthogonal forms**: logical grouping (dbdiagram `TableGroup`, collapsible, can enter view filter) vs visual grouping (Workbench Layer rectangle, Figma Frame, draw.io container). Workbench Layer non-nestable, drag-in = membership; Figma Frame = boundary + members. Conclusion: start with **visual frame**, members explicitly recorded, no coordinate re-parenting.
3. **Large lists need virtual scroll**. antd Tree official: `height` property enables virtual scroll; cost is no horizontal auto width (this repo titles already ellipsis fixed width, no conflict). Stable keys + memo render are companion discipline.
4. **Entity editor = tabbed property panel**. ER/Studio (Columns/Constraints/Indexes three tabs), Beekeeper Studio (schema/indexes/relations "pills" + dirty `*` marker), Prisma Studio (sidebar + multi-tab) agree: few orthogonal tabs, clear tab header hierarchy, unified content padding.
5. **Sidebar density**: tree default expand to "actionable level" (dbdiagram/Workbench directory trees default expanded); collapse is user-initiated; search auto-expands matching branches.
6. **Relations (edges) should not stack in tree one-by-one**. Workbench directory lists objects not edges; edges belong on canvas. Current "Relations" folder listing each edge as tree node is noise at scale (Phase 2 replaces with diagram list).

## Decision

### Phase 1 (shipped, this slice)

1. Model tree "Tables" and "Relations" **default expanded** (incl. auto-expand new modules; manual collapse not reset to top); fix `getExpandedKeys` pushed key (`module${name}`) never matching tree key dead logic.
2. Model tree **virtual scroll** (antd Tree `height` + ResizeObserver measure container), supports 100+ tables/edges.
3. Model design / table design content area **unified 12px padding + cardification** (sunk base + surface card + `--erd-line` border + 8px radius), forbid content flush to edges.
4. Table design three tabs (fields / indexes / metadata app) polish: tab header adds table name + Chinese name + module hierarchy bar, tab body unified padding, all via `erd-*` tokens.
5. Tree icons / badges / menu icon colors from antd default blue-green-yellow → `erdColors` (module ink900, table warning, relation success, delete brand), same language as canvas PK/FK badges.

### Phase 2a (shipped, schema-additive, frontend-only projectJSON)

1. **Multiple relation diagrams**: `module.diagrams?: Diagram[]` new optional field; `Diagram = { id, name, includeEntities?: string[], layout: { nodes: [{ id, x, y }] }, groups?: Frame[] }`.
   - Entities and associations still unique in `module.entities` / `module.associations` (single source of truth, ADR-0001 unchanged).
   - Legacy `module.graphCanvas` treated as "main relation diagram" layout, lazy migrate into `diagrams[0]`; projects without `diagrams` behavior fully unchanged (backward compatible, rollback-safe).
   - Single selector: `getActiveDiagram(module, diagramId?)` (`frontend/src/utils/diagram.ts`); write path `updateGraphCanvasLayout` writes `diagrams` only.
   - UI: canvas toolbar diagram switcher (Select + new/rename); left tree "Relations" child nodes = diagram list (main diagram `tree-open-relation`); tab: `relation-diagram-${module}` / `relation-diagram-${module}-${diagramId}`.
   - `includeEntities` / delete main diagram: types and API reserved; filter UI and Frame render in Phase 2b.
   - Same-module relation diagram tab in-place switch (`switchRelationDiagram`), toolbar and left tree don't stack multiple canvases.

### Phase 2b (shipped, schema-additive)

2. **In-diagram grouping (Frame)**: `Frame = { id, name, color?, x, y, w, h, memberEntityIds: string[] }`, stored in `diagram.groups[]`.
   - Render as ReactFlow custom bottom-layer frame node (`type: 'frame'`, z-index below tables), **no RF subflow / parent coordinate re-parenting** (members still absolute `layout.nodes`).
   - **Drag frame moves members**: dragging Frame applies same Δ to `memberEntityIds` table nodes and persists (Figma Frame mental model; still not parentId).
   - **Resize**: selected Frame shows NodeResizer eight handles; `w`/`h` (and NW side `x`/`y`) written to `groups[]`.
   - **Fit members**: toolbar "Fit members" recalculates box from member bounding box + padding; "Add to group" / drag table into box expands only, never shrinks.
   - **Membership**: drag table center into box → `addFrameMembers`; drag out of member box → `removeFrameMembers`; toolbar "New group" / "Add to group" kept; Delete removes frame.
   - Write paths: `createFrame` / `addFrameMembers` / `removeFrameMembers` / `updateFrameBounds` / `removeFrame`; entity rename/delete syncs `memberEntityIds`.
   - Read-only share canvas also renders `groups` (no resize/drag-frame edit).

### Still separate slices

- `includeEntities` view filter UI
- Delete non-main diagram confirm flow polish (`removeDiagram` API exists)
- Frame collapse / nest / multi-frame batch align

## Consequences

- Positive: large-model usability (virtual scroll + default expand + multi-diagram) and aesthetics (tokens + padding + three tabs) both gained; multi-diagram data model matches dbdiagram/Workbench mental model; share diagrams can theme by topic; Frame resizable, drag frame carries tables, drag in/out membership, grouping with tables close to Figma.
- Cost: Phase 2 touches tab key rules and tree "Relations" child semantics (E2E coverage: `tree-open-relation`); drag frame moves members rewrites absolute coordinates (undoable); still not RF parent, so no relative coordinates or auto clip.
- Risk: multi-diagram lazy migrate dual-write drift if write path missed → migrate converges in single selector (`getActiveDiagram(module)`), write path writes diagrams only.
