# ADR-0026: Precision Tooling Visual Language

- Status: **Accepted** (2026-08-09)
- Decision makers: maintainers

## Context

Landing and docs home validated a “dark void + fine grid + IBM Plex + brand red + glass product window” look. Post-login chrome still felt like Ant Design Pro template. We need a unified visual language without overturning [ADR-0010](./0010-defer-dark-mode.md) (no global dark mode this phase).

## Decision

1. **Adopt Precision Tooling**: Linear / Raycast / Figma chrome spirit — precision and density, not neon cyberpunk.
2. **Two domains**:
   - **Marketing shell** (landing / AuthBrandShell / exception gates): dark void + grid
   - **App chrome** (Home / Group / Design chrome): **light** precision (hairline, mono chips, tight tracking, weak-shadow panels)
3. **Out of scope this milestone**: ReactFlow table node / edge skins (share images + visual E2E baselines later).
4. Token source of truth: `frontend/src/theme/tokens.ts` + `css-vars.less` (`--erd-void`, `--erd-hairline`, `--erd-surface-elevated`, `--erd-chrome-blur`, `--erd-steel`, kicker size).

## Consequences

- Positive: landing and product chrome feel coherent; slices are independently revertable; does not block the modeling north-star.
- Negative: light workspace is still not a night theme; full-site dark mode needs a separate milestone.
