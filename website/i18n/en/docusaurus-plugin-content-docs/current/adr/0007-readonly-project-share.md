# ADR-0007: Read-only project share links

- Status: Accepted (2026-08-02)
- Decision makers: Project maintainers

## Context

Roadmap P3 "read-only share links" serves the "share & spread" journey; need login-free model viewing to lift trial and return visits.

## Decision

1. Table `project_share`: unique `token`; `enabled` / optional `expire_time`
2. API: `POST /share/create` (logged in + creator); `GET /share/{token}` (anonymous, returns `readonly` + projectJSON); `POST /share/revoke` (logged in + creator)
3. Security: anonymous **GET only** on `/share/*` (`ErdSecurityConfiguration`); `create`/`revoke`/`fork` require login (no longer blanket `/share/**` all methods)
4. Frontend anonymous page `/s/:token`: table list + read-only ReactFlow relation diagram; designer top bar "Share" modal (create/copy/revoke)
5. Anonymous response sanitization: see ADR-0008 — share JSON **clears** `profile.dbs` (no longer masked connection blocks)

## Consequences

- Positive: shareable and openable; revocable; passwords not in anonymous response; canvas read-only — no connect/drag model edits
- Follow-up: share expiry policy UI
- Extension: `POST /share/{token}/fork` logged-in copy to personal project (P3a)
