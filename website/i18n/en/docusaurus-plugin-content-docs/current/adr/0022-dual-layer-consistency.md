# ADR-0022: Dual-layer consistency (workspace ↔ version ↔ live DB), forbid automatic bidirectional sync

- Status: **✅ Accepted** (2026-08-04; manual decision theme, Vision 5m loop iterates per this)
- Decision makers: Project maintainers
- Related: [ADR-0016](/docs/adr/experience-first-shareable-diagram) (experience-first main line), [ADR-0009](/docs/adr/collab-presence-socketio) (presence/delta sync), [ADR-0008](/docs/adr/datasource-isolation) (datasource isolation)

## Context

Product simultaneously has three "truths": in-memory projectJSON (editing), saved versions (`db_change`), and live database schema. Prior UI mixed them:

- Top bar only "Saved / Saving / Save failed" — about **persist**, not "uncommitted changes vs latest version"
- Live DB consistency via `db_version` (human version string), `compareStringVersion` returns `NaN` on empty/invalid segments, unjudgeable showed as "consistent"
- Version baseline from **paginated** list `versions[0]` — baseline drifts on page/sort change
- Unmount `closeSocket` unconditionally `Save.saveProject`, result discarded → silent overwrite + silent failure

User mental model trained by Git: `status` for dirty, `pull` for others', `push` for own. Product should borrow, not invent new terms.

## Decision

| Topic | Decision |
|---|---|
| Layers | **Layer A (workspace)**: in-memory projectJSON ↔ latest version; **Layer B (live DB)**: model ↔ live schema. Two layers **presented separately**, not merged into one "sync status" |
| Layer A presentation | Real-time dirty chip: clean / dirty (with change count) / persist failed; semantics merged with top bar save status, no duplicate feedback |
| Layer A baseline | **Independent query latest version** (dedicated endpoint or `size:1` sorted query), **forbid** paginated list `versions[0]` |
| Layer B presentation | Five states: consistent / model ahead / DB ahead / bidirectional fork / **unknown**; each state actionable copy, unknown gives 4 exits |
| Layer B criterion | **Measured schema fingerprint** (tables/columns/indexes normalized then hashed); `db_version` demoted to hint, no longer consistency truth |
| Layer B trigger | **Explicit probe** (user clicks button), with loading and failure reason; **forbid** auto probe on page load |
| Action metaphors | "Pull" = reverse parse from live DB → save as version; "Push" = sync DDL → pin baseline after success. Both **explicit user actions** |
| Red line | **Forbid automatic bidirectional sync** (scheduled, on page load, or "helpfully for user"). Model↔live DB writes must be user-initiated and previewable |
| Unjudgeable = unknown | When version string/fingerprint incomparable must show "unknown", **forbid** default "consistent" |
| Share visitors | Read-only share does not expose Layer B (no credentials, does not represent visitor probing DB) |
| Concurrency | project save optimistic lock (conflict → actionable prompt, no silent overwrite); `db_change.version` unique constraint (Flyway); unmount no blind save, persist only when dirty with visible result |
| North Star metric | "Version save" = **non-empty diff** version; empty-changes save allowed but not counted |

## Consequences

- Positive: status no longer lies (unknown is unknown); no data loss under concurrency; users understand via Git habits; live DB ops always human-approved
- Cost: extra "latest version" query; schema fingerprint needs per-dialect normalization (P0 four DBs first), more work than string compare; probe no longer "automatic help", user must click
- Explicitly not doing: scheduled/auto bidirectional sync; stuffing live DB state into projectJSON; continuing `db_version` as consistency truth; probing DB for visitors
