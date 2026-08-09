# Architecture Decision Records / ADR

> Trace of major technical decisions. One page each: status, context, decision, consequences.
> Decisions may be overturned, but a new ADR must explain why — never edit history in place.

| ID | Decision | Status |
|---|---|---|
| [0001](/docs/adr/designer-reactflow) | Migrate designer canvas to ReactFlow | Accepted |
| [0002](/docs/adr/backend-upgrade-path) | Backend upgrade path: Boot 2.7 first, then 3.x as a separate milestone | Accepted |
| [0003](/docs/adr/docs-docusaurus) | Docs publishing stack: Docusaurus | Accepted |
| [0004](/docs/adr/license-mit) | Keep MIT license | Accepted |
| [0005](/docs/adr/ui-architecture) | UI architecture: antd for CRUD, custom design in designer domain | Accepted |
| [0006](/docs/adr/reverse-dialect-spi) | Multi-DB reverse Dialect SPI (P0 four DBs + Generic fallback) | Accepted |
| [0007](/docs/adr/readonly-project-share) | Read-only project share links | Accepted |
| [0008](/docs/adr/datasource-isolation) | Datasource isolation from projectJSON (not stored in profile.dbs) | Accepted |
| [0009](/docs/adr/collab-presence-socketio) | Collaboration presence: backend SocketIO + short ticket | Accepted |
| [0010](/docs/adr/defer-dark-mode) | Defer dark mode (does not block P2) | Accepted |
| [0011](/docs/adr/defer-composite-fk-fields-array) | Defer composite FK fields[] change (additive constraint metadata allowed) | Accepted |
| [0012](/docs/adr/ai-era-data-structure-platform) | Upgrade to "AI-era data structure platform" (Git+Figma+agent source of truth) | Accepted · B |
| [0013](/docs/adr/public-api-mcp) | Public API / MCP (auth · rate limit · scope) | 🚧 In progress (slices 1–5 + write REST/MCP + Redis + OAuth A+B + client/PAT management UI ✅; consent page remaining) |
| [0014](/docs/adr/drop-or-strangle-ant-pro) | @ant-design/pro-components Strangler removal (dependency removed) | ✅ Shipped · B |
| [0015](/docs/adr/tomcat-max-http-header-size) | Boot 3 raise `max-http-request-header-size` (JWT header overflow → HTML 400) | Accepted |
| [0016](/docs/adr/experience-first-shareable-diagram) | Experience-first: "shareable beautiful diagrams" main line (ICP hybrid) | Accepted |
| [0017](/docs/adr/multi-diagram-and-entity-editor) | Multiple relation diagrams + entity editor (including in-diagram Frame grouping) | Accepted · phased |
| [0018](/docs/adr/hosting-topology-no-vps) | Hosting topology: GitHub + Cloudflare free tier, no production VPS | Accepted |
| [0019](/docs/adr/demo-runtime-railway) | Official Demo runtime: Railway-only (real MySQL 8); reject three-vendor stack; Zeabur as CN fallback | Accepted |
| [0020](/docs/adr/single-database) | Single business DB `erd` (drop martin/erd dual DB); init schema-only; seeds via Flyway | Accepted |
| [0021](/docs/adr/idp-federation-google-wechat) | Third-party login IdP federation (GitHub + Google OIDC + WeChat Open Platform QR) | ✅ Accepted · MVP |
| [0022](/docs/adr/dual-layer-consistency) | Dual-layer consistency (workspace ↔ version ↔ live DB); no automatic bidirectional sync | ✅ Accepted |
| [0023](/docs/adr/i18n-foundation) | i18n foundation: default zh-CN; English-first ≠ switch default; one slice after B layer | Accepted |
| [0024](/docs/adr/datasource-credential-encryption) | Datasource credential encryption at rest (AES-256-GCM, `ERD_DB_CONFIG_SECRET`) | Accepted |
| [0025](/docs/adr/og-social-unfurl) | OG / social unfurl cards | Accepted |
| [0026](/docs/adr/precision-tooling-visual-language) | Precision tooling visual language (dark marketing + light precision app; ≠ global dark mode) | Accepted |
| [0027](/docs/adr/designer-chrome-ia) | Product chrome IA (global theme + status instrument + single browse + table-design hierarchy) | Accepted |
