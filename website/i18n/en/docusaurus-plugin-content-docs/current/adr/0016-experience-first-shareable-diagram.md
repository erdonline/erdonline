# ADR-0016: Experience-first — "shareable beautiful diagrams" as main line (ICP hybrid)

- Status: Accepted (2026-08-02)
- Decision makers: Project maintainers (user vetoed "ask direction again"; this ADR locks it in)

## Context

Vision remains "Git + Figma for database design"; North Star remains "weekly active modeling projects with version saves".
Version save / share / presence already usable, but loop topic selection kept oscillating between "enterprise approval", "chrome crumbs", "bidirectional live sync / MCP big pit", and "is UI P2?".

Falsified or rejected:

- **Sync as main bet** — bidirectional live sync / version branches too large this season, unclear ROI; falsified.
- **UI is P2** — user explicitly rejected; diagram aesthetics and three-shell same language are activation and spread levers — first-class citizens.

## Decision (ICP hybrid, not pure A/B)

**Main experience bet (~90 days): "shareable beautiful diagrams"**

1. Reverse / import / DDL → **auto-layout quality** + ReactFlow **diagram aesthetics** (nodes, edges, background, density, typography) — goal: users willing to screenshot and share.
2. Designer + Home + landing **same visual language** (`erd-*` tokens); forbid scattered `#4096ff` default blue as primary.
3. **UI beauty = first-class**, must not be labeled infinitely deferrable P2 cosmetics again.

**Parallel capability track (maintain, don't freeze or over-expand):**

- Keep maintaining version save / share / presence (bug fixes, accessibility, trustworthy feedback).
- **Forbidden new this season**: version branches, bidirectional live sync. ~~MCP / public API product code~~ → **2026-08-04 manual unblock**: [ADR-0013](/docs/adr/public-api-mcp) proceeds by slice (still forbid version branches / live sync).

**Deprioritized:**

- Enterprise approval flow not North Star main bet.
- Chrome micro-slices that don't change diagram look/share desire.
- Meta loop prompt idle rewrites.

Loop directive must be: **dual-track equal-weight topic selection; no open-ended direction questions to user; no crumb-padding.**

## Consequences

- Positive: activation and word-of-mouth (screenshot spread) have clear main line; capability assets not lost; agent loop stops direction oscillation.
- Cost: less "sync/branch/MCP product code" and approval deep work this season; some chrome debt deferred.
- Risk: cosmetics without modeling loop → constrain with walkthrough+E2E "diagram readable and shareable" must be verifiable; layout quality: import/reverse/no-coordinate fallback wired shared dagre (`utils/graphLayout`, default `nodesep` 56 / `ranksep` 108); example main diagram hand-tightened (column gap ~28px, x span ~1072) + Frame padding 20; node density/PK·FK badges/custom `erdSmooth` edges (same-table multi-FK elbow spacing + junction table `centerX`/`bypassY` avoidance + same midX channel bundling + stacked-table seam mid-corridor / two-bend `escapeX` + sparse Hanan A* + dense-obstacle shortest detour + high-degree hub Y fan-out) shipped; **table node card hierarchy** (`surfaceMuted` header + field hairlines + PK left bar) ✅; designer and read-only share share `ErdRelationEdge`/`associationsToEdges` (incl. layout hint); three-shell chrome (top bar 64 / watermark removed / Home surface tokens) aligned; dense FK import walkthrough ✅ (`dense-fk.dbml`); share same route + hub fan-out ✅ (`demo.spec`); **geometric handle pick (vertical stack same-side short U, eliminates circle-route) ✅**; **Frame theme palette + clear Ant blue/command palette hardcodes ✅**; **edge label chip readability (surface white bg + ink900/12/600, forbid whole-block opacity; hit box 40×20) ✅**; **post-import/reverse Frame auto-suggest (prefix/connected components) ✅**; **empty-state composition polish (ER silhouette + primary/secondary CTA, remove pink cartoon) ✅**; **share top bar brand alignment (W5 slice 3) ✅**; **login/register brand shell (W5 slice 4) ✅**; **landing page token same source ✅**; **dense diagram density tweak (share fitView / relationNoShow filter) ✅**; **field row one more compression (min-height 22 / FIELD_ROW_H 26) ✅** → **table node dense table compression (header pad 6 / field minH 20 / FIELD_ROW_H 24) ✅**; **post-import first screen polish (empty state "Import DBML" + direct open relation diagram + fitView same as share dense) ✅**; **competitor comparison `/compare` ✅**; **edge label density + Frame padding 20 ✅**; **Frame title bar density (chrome 22) + MiniMap sunk alignment ✅**; **Controls panel density (22×22 + surface chrome) ✅**; **selection halo unified (table/Frame `--erd-selection-ring` a18) ✅**; **canvas toolbar tightened (height 22 / font 11) ✅**; **empty-state panel tightened (pad 14/18 + CTA 26 + silhouette 132) ✅**; **command palette density (width 440 / input 36 / row 6×8) ✅**; **entity create modal density (width 400 / input 28) ✅**; **left tree row high density (22 / font 12) ✅**; **read-only share multi-diagram switch ✅**; **share canvas viewport fill (480→stage flex) ✅**; **read-only share table list collapsible ✅**; **share meta hint/description density ✅**; **share expanded table list row density (22–28 / project-list) ✅**; **edge label collision avoidance (bundle stretch + AABB `resolveEdgeLabelOffsets`) ✅**; **share invalid/empty state brand alignment (AuthBrandShell gate + ErdEmptyDiagram empty state) ✅**; **404/403 AuthBrandShell ✅**; **relation diagram SCSS clear brand raw rgba (`--erd-frame-fill-brand` / color-mix) ✅**; **PK/FK/hover row light bg color-mix (warning/success/ink-900) ✅**; **field row scan hierarchy (name 500/PK 600 + type right-aligned secondary column) ✅**; **relation line default stroke weight/contrast (ink900 + 2px / selected 2.5; crow aligned) ✅**; **table header title hierarchy (title 14/700 vs chnname 10/400+0.88) ✅**; **empty-state CTA hierarchy (single primary + secondary link / share title+hint) ✅**; **cardinality chip scan hierarchy (12/600/ink900) ✅**; **PK/FK badge scan hierarchy (10/700 + min-width 22 role label column) ✅**; **canvas toolbar/Controls scan hierarchy (single chrome block + fit canvas/auto-layout primary actions) ✅**; **table node dense table compression again (header pad 6 / field minH 20, hierarchy unchanged) ✅**; **Frame title scan (label 12/700 vs meta 10/400+0.88, chrome 22) ✅**; **canvas toolbar "New table" one-click on canvas (non-empty modeling loop) ✅**; **connection failure visible feedback (duplicate association / invalid anchor toast; blank cancel silent) ✅**; **field row ✎ inline edit + empty name toast (modeling loop) ✅**; **field Tab row jump + type instant save-status (modeling loop) ✅**; **last row Tab new field (modeling loop) ✅**; **index tab add-row CTA (modeling loop) ✅**; next cut: modeling loop friction (index table delete confirm / JExcel toolbar copy); no more crumb color·density.
- vs existing ADRs: does not overturn ADR-0001 (ReactFlow), ADR-0012 (positioning), ADR-0013 (MCP planned not implemented); this ADR only sets **this season's bet weight**.
