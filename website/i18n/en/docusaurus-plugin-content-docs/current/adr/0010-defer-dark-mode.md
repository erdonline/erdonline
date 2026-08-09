# ADR-0010: Defer dark mode

- Status: Accepted (2026-08-02)
- Decision makers: Project maintainers

## Context

P2 "loading skeleton" delivery left "dark mode ADR TBD". North Star is weekly active modeling projects with version saves; dark mode doesn't lift that metric, and ADR-0005 already sets CRUD to antd default theme with a custom-built designer domain.

## Decision

1. **This phase: no** global dark toggle / designer dark theme
2. When needed, separate milestone: contrast mockups and a11y checklist first, then tokens; forbid half-baked scattered `prefers-color-scheme`
3. Rest of P2 experience deep work closed; dark mode does not block P2 closure

## Consequences

- Positive: avoids bandwidth competition with collaboration / acquisition
- Negative: night users no official dark short-term; system/browser forced dark as workaround
