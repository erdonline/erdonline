# ADR-0027: Product Chrome IA (instrument panel + global theme + single browse surface)

- Status: **Accepted** (2026-08-09)
- Decision makers: maintainers

## Context

After Precision Tooling (ADR-0026), the designer top bar was still a wall of sentences; `layout:false` auth/share pages missed `erdTheme` (antd blue primary); `/dataModels` and `/project/*` used two list densities. Further 24px densify had zero ROI — an IA decision was required.

## Decision

1. **Global theme**: `app.tsx` `rootContainer` injects `erdTheme`.
2. **Status instrument**: Keep ADR-0022 three semantics separate; present as Synced / `vX` / `DB ·` capsules.
3. **Action hierarchy**: Instrument + one primary CTA (save version) + icon actions; workflow text demoted.
4. **Single project browse chrome**: Shared `project-list` + `ProjectTypeBadge`.
5. **Table design hierarchy**: Merge name bar + inner tabs into one chrome row.
6. **Tree create**: Prefer folder-inline `+`; group context menus.
7. **Out of scope**: Default designer dark mode / glass nodes (ADR-0010 / 0026).

## Consequences

- Positive: coherent brand; readable chrome; one list face.
- Negative: short instrument labels need solid aria; E2E migrations.
