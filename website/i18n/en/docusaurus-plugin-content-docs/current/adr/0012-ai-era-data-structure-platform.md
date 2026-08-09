# ADR-0012: Upgrade to "AI-era data structure platform"

- Status: **Accepted** (2026-08-02)
- Decision makers: Project maintainers
- Decision: adopt **Option B** (positioning upgrade: Git + Figma + Agent schema source of truth)

## Context

User proposed new ambition: **platform for defining data structures in the AI era (openness + security)**, with a public landing page. This tensions with existing [vision](/docs/vision):

1. One-line positioning is "Git + Figma for database design", including "no AI hype — AI delivered with real capability at feature depth stage"
2. Roadmap "external or deferred" lists AI as deferred

This ADR does not rewrite vision skeleton; it answers: **what is the difference between "AI hype" and "AI-era platform", and is the latter worth a positioning upgrade.**

### Why now

- Agents (Cursor / Claude Code / MCP ecosystem) becoming primary **producers and consumers** of database schema. LLM-generated schema needs review, versioning, collaborative review — this project's existing strengths (version + collaboration + projectJSON schematization)
- Existing projectJSON (schema versioning, never break in place), version diff, approval flow, read-only share naturally form "agent-readable, auditable data structure source of truth"
- Competitors (dbdiagram/dbml) still "human writes code to draw"; no open tool treats "agent-programmable access" as first-class

## Decision options

### A. Status quo (AI stays deferred, landing page only)

- Positive: no distraction, P3 feature depth continues
- Negative: miss agent ecosystem window; landing page lacks differentiated narrative, can only say "collaboration + version"

### B. Positioning upgrade: Git + Figma + (Agent schema source of truth) 【Adopted】

Vision fine-tune: **Git + Figma for database design, and open-source source of truth for AI agents reading/writing data structures.** "No AI hype" kept, clarified: hype ≠ platform-level AI capability.

**Platform-level AI capabilities (to build — all extensions of existing strengths):**

1. **schema-as-code**: projectJSON as public, stable, versioned data format, CLI/scripts read/write (foundation exists: schema versioning promise in [data-format](/docs/data-format))
2. **API/MCP open**: public API to read schema, read versions, write versions (save = commit); MCP server lets agents "pull current project schema / submit new version" directly (auth/rate limit/scope see [ADR-0013](/docs/adr/public-api-mcp), 📋 planned)
3. **Version = agent source of truth**: each version diffable, rollbackable; every agent change auditable, reviewable (approval flow exists)
4. **Share / fork**: read-only share (ADR-0007) + fork exist, upgraded to "agent-referencable permanent links"
5. **Audit & security**: permission boundaries when agents hold tokens, SQL execution trust chain, secrets not in projectJSON (ADR-0008 isolated)

**AI hype (not doing, aligned with vision):**

- No black-box "one sentence generates ERD" front-and-center marketing
- No ChatSQL-style conversational toy marketing (experimental page stays 📋, not upgraded to selling point)
- No self-built model/vector DB investment; AI generation via "agent calls API", we provide source of truth and audit

### C. Full pivot to AI product (conversational modeling core)

- Negative: overturns Strangler rhythm and antd/CRUD investment, team bandwidth insufficient, violates "no AI hype". **Rejected.**

## Decision (accepted · Option B · 2026-08-02)

1. Vision one-liner adds AI-era dimension (see [vision](/docs/vision))
2. Roadmap **P5: AI-era data structure platform** 🚧: landing page first, then schema-as-code / product depth; API/MCP constrained by ADR-0013, not implemented this slice
3. "No AI hype" clause rewritten more precisely (see [vision](/docs/vision))

## Consequences

- Positive: differentiated narrative (open source + agent-readable + version audit); landing page has story; reuses existing investment, zero overturn
- Cost: North Star needs guardrail metrics (e.g. "version saves produced via API/MCP"); public API needs rate limiting and token management (new security surface, see ADR-0013)
- Risk: positioning upgrade without API becomes new hype → P5 ordering requires "landing page + schema-as-code docs first, API/MCP implementation after"
- Review trigger: complete ADR-0013 before MCP/API design (auth model, rate limit, scope)

## Explicitly out of scope (this ADR)

- No mobile/desktop; no closed-source cloud (vision clauses unchanged)
- No UI library swap (ADR-0005 constraint unchanged); dark mode stays deferred (ADR-0010 unchanged)
- No self-built LLM / vector retrieval; no in-product black-box AI schema generation (agents external, in/out via API)
