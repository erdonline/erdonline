# Product vision

:::info Audience
This document is for **contributors and maintainers** (the arbiter of trade-offs). If you want “how to use the product,” start with [Start here](/docs/guide/intro).
:::

> This document answers one question: what this project aims to become, and why.
> It is the highest arbiter for all feature trade-offs. Changes require maintainer consensus.

## One-line positioning

**Git + Figma for database design — the open-source source of truth for data structures in the AI era** — bringing version management and real-time collaboration to database modeling; projectJSON and the version system let humans and AI agents read and write the same source of truth.

Positioning upgrade rationale: [ADR-0012](/docs/adr/ai-era-data-structure-platform) (accepted · option B). Public API/MCP: [ADR-0013](/docs/adr/public-api-mcp) (📋 planned).

## Why this positioning

Ecological niches for database modeling tools:

- **Minimal tools** (dbdiagram.io): pretty and easy, but no collaboration, no versions, closed source
- **General drawing** (draw.io): free and flexible, but no database semantics
- **Desktop-only** (PDManer, Navicat): feature-heavy, but no collaboration, dated UX

**“Collaborative database design” is the only empty niche**, and this project already has assets others lack: automatic versioning with diff on every change, three-tier permissions with approval flow, multi-datasource forward/reverse engineering. We lengthen our strengths instead of competing in others’ niches.

## Three layers of user value (the standard for judging every requirement)

1. **First-time visitors**: amazed within 30 seconds — drives spread
2. **Power users**: modeling work is indispensable; switching cost is very high — drives retention (locked by versions + collaboration)
3. **Potential contributors**: code feels well-crafted; willing to open PRs — drives ecosystem (modern stack + engineering quality)

Every requirement review asks: which layer does it serve? If none, we don’t build it.

## North Star metric

**Weekly count of active modeling projects that produce a version save** (must be a **non-empty diff** version save; empty bookmark saves are allowed but don’t count toward North Star — see [ADR-0022](/docs/adr/dual-layer-consistency)).

Star count is a lagging vanity metric; this metric is real product vitality. Guardrail metrics: CI gate strength, core module test coverage, first-screen bundle size, core journey duration (see [Performance budget](/docs/performance-budget)). Current quarter North Star levers: [Roadmap — Next quarter: three things only](/docs/roadmap#next-quarter-three-things-only-north-star-levers).

## What we don’t build

- No mobile / desktop clients — modeling is a desktop browser scenario; early distraction is fatal
- No closed-source cloud / commercial distraction — win open-source reputation first; monetization comes after winning
- No AI hype — no conversational black-box magic; AI delivered as “open API/MCP + version source of truth + auditable” platform; agents are first-class citizens of projectJSON
- No dbdiagram clone — minimal-tool niche is taken; we differentiate on collaboration, versions, and open source of truth
- No further investment in retired stacks — stopping loss is half of engineering decisions

## Experience design principles

See [Design principles](/docs/design-principles). Every interaction change must pass the six principles.

**The designer is one main battlefield** (alongside Home / landing as shell layers): relation diagram readability and “shareable” aesthetics, auto-layout quality, are product levers alongside versions/collaboration; this quarter’s weight: [ADR-0016](/docs/adr/experience-first-shareable-diagram).

## Technical roadmap highlights

- Designer canvas migrates to **ReactFlow** (Strangler strategy, parallel then cutover)
- Backend Spring Boot stabilizes on 2.7 first; 3.x + JDK 17 is a separate milestone — the two big bangs don’t run in parallel
- UI converges on Ant Design; JSON processing unified on Jackson
- Core data format projectJSON is schema-versioned; never break in place (see [data-format](/docs/data-format))
