# ADR-0031: DDL generation API split from version lifecycle API

- Status: **Accepted** (2026-08-09); **Implemented** (2026-08-09)
- Prerequisites: [ADR-0030](./0030-ddl-template-engine-isomorphism.md) (Freemarker end state, BE authoritative generation); [ADR-0022](./0022-dual-layer-consistency.md) (layer A version / layer B live DB)
- Related: `HisProjectController`, `DbChangeService`, `ConnectorController`

## Context

ADR-0030 moved product-path DDL generation to backend Freemarker, but **HTTP routes still hung on `HisProjectController`** (`/ncnb/hisProject/*`). Controller name and Swagger tag `dbChange` express "version / change history" yet also carry:

| Endpoint | Semantics | Main consumers |
|---|---|---|
| `load` / `save` / `delete*` | Version snapshot CRUD | Version page, `Save.hisProject*` |
| `POST /dbChange` | Paginated list | `useVersionStore` |
| `diff` | Workspace ↔ latest version structural diff + incremental DDL | Version panel, dirty chip |
| `syncSql` | Full/incremental sync script (vs version baseline) | Version "Sync to DB" preview |
| `exportDdl` | Full DDL fragment export | Export dialog, `exportSlice` |
| `tableDdl` | Single-table metadata DDL | Table properties DDL tab |
| `previewDdlTemplate` | Template editor draft preview (sample entity) | DDL template modal |

**Problem**: `previewDdlTemplate` / `exportDdl` / `tableDdl` do not read/write `db_change`, unrelated to version lifecycle; hanging on `hisProject` misleads API boundary, OpenAPI grouping, and future Public API / MCP slices. User confirmed: `previewDdlTemplate` on `HisProjectController` is **inappropriate**.

**Constraints**: Freemarker engine and `DbChangeService` orchestration **unchanged**; `@RequireProjectAccess` + `@ProjectId` / `@DbKey` **unchanged**; **forbid** merging into `ConnectorController` (that domain is live DB connect, reverse, DML/DDL execution—ADR-0022 layer B).

## Decision

### 1. Two Controllers (route split, service reuse)

| Domain | Controller | Route prefix | Responsibility |
|---|---|---|---|
| **Version lifecycle** | `HisProjectController` (keep) | `/ncnb/hisProject/*` + `/ncnb/dbChange` | Version CRUD, pagination, layer-A diff; **optionally** keep `syncSql` |
| **DDL generation (read-only render)** | **`ProjectDdlController`** (new) | **`/ncnb/projectDdl/*`** | Template preview, full export, single-table DDL |

> Use `projectDdl` not `ddl`: avoid confusion with connector SQL execution and future Public API `/ddl` verbs; aligns with `projectId` ownership.

### 2. Endpoint ownership (target state)

**Stay on `HisProjectController`**

| Method | Path | Service |
|---|---|---|
| POST | `/ncnb/hisProject/load` | `loadHistory` |
| POST | `/ncnb/dbChange` | `getPage` |
| POST | `/ncnb/hisProject/save` | `saveVersion` |
| POST | `/ncnb/hisProject/delete/{changeId}` | `deleteHistory` |
| POST | `/ncnb/hisProject/deleteAll` | `deleteAllHistory` |
| POST | `/ncnb/hisProject/diff` | `diffAgainstLatest` |
| POST | `/ncnb/hisProject/syncSql` | `generateSyncSql` |

**`syncSql` ownership (decided)**: stays on `hisProject`. Consumer is version panel "Sync to DB"; input depends on version baseline / `changes`—semantic is "sync script relative to saved version", not standalone full schema export. If Public API needs DDL without version context later, add parameterized endpoint on `ProjectDdlController`; do not move `syncSql`.

**Move to `ProjectDdlController`**

| Method | Current path | Target path | Service |
|---|---|---|---|
| POST | `/ncnb/hisProject/previewDdlTemplate` | **`/ncnb/projectDdl/previewTemplate`** | `previewDdlTemplate` |
| POST | `/ncnb/hisProject/exportDdl` | **`/ncnb/projectDdl/export`** | `generateExportDdl` |
| POST | `/ncnb/hisProject/tableDdl` | **`/ncnb/projectDdl/table`** | `generateTableDdl` |

- Request/response bodies **unchanged** (still `{ sql: string }` or existing `R` wrapper).
- Shorter method names (drop redundant `Ddl` prefix since path has `projectDdl`).
- Swagger tag suggestion: `projectDdl` (separate from `dbChange`).

### 3. Explicitly out

| Approach | Reason |
|---|---|
| Merge into `ConnectorController` | Connector = credential resolve + live DB ping/reverse/execute; DDL **render** does not touch DB |
| New `DdlTemplateController` for preview only | Export/single-table/preview all "projectJSON → SQL string"—one Controller enough |
| Change Freemarker / engine classes this slice | ADR-0030 landed; this ADR only moves HTTP surface |
| New fine-grained RBAC codes | keep `@RequireProjectAccess`; same as current hisProject |

### 4. Frontend migration

| File | Current call | After |
|---|---|---|
| `frontend/src/utils/ddlExportApi.ts` | `POST …/hisProject/exportDdl` | `POST …/projectDdl/export` |
| same | `…/hisProject/previewDdlTemplate` | `…/projectDdl/previewTemplate` |
| same | `…/hisProject/tableDdl` (`fetchTableDdl`) | `…/projectDdl/table` |
| `frontend/src/utils/versionDiffApi.ts` | `…/hisProject/syncSql` | **unchanged** |
| `frontend/src/utils/save.js` | `hisProject/load|save|delete*` | **unchanged** |
| `useVersionStore` | `…/dbChange`, `Save.hisProject*` | **unchanged** |

E2E: `database-templates-modal.spec.ts` if mocking network, update paths; version specs **unchanged** (still `hisProject/diff|save`).

### 5. Compatibility and removal strategy

1. **Slice A (backend)**: add `ProjectDdlController`, three endpoints on new paths; keep old three on `HisProjectController` one release—implement as `deprecated` comment or delegate same Service (identical behavior).
2. **Slice B (frontend)**: `ddlExportApi.ts` switch paths; run related E2E + unit tests.
3. **Slice C (cleanup)**: remove `exportDdl` / `tableDdl` / `previewDdlTemplate` from `HisProjectController` and any temp alias; update CHANGELOG / `product-capability-map.md`.

No forced HTTP 301; dual-path window ≤ one minor release; docs mark deprecated.

## Current mapping (2026-08-09 grep)

```
HisProjectController (/ncnb)
├── hisProject/load          → version load          [FE: save.js, TableCodeShow]
├── dbChange                 → pagination            [FE: useVersionStore]
├── hisProject/save          → save version          [FE: save.js, useVersionStore, E2E]
├── hisProject/delete/*      → delete version        [FE: save.js, useVersionStore]
├── hisProject/diff          → layer-A diff          [FE: versionDiffApi, E2E version.spec]
├── hisProject/syncSql       → sync SQL              [FE: versionDiffApi]  → stay hisProject
├── hisProject/exportDdl     → full export           [FE: ddlExportApi → exportSlice]  → move projectDdl
├── hisProject/tableDdl      → single-table DDL      [FE: ddlExportApi → TableCodeShow]  → move projectDdl
└── hisProject/previewDdlTemplate → template preview [FE: ddlExportApi → DatabaseTemplatesEditor] → move projectDdl

ConnectorController (/ncnb/connector) — does not absorb above DDL render endpoints
├── ping / dbReverse* / schema/probe
├── dbversion / checkdbversion / rebaseline
└── dbsync / sqlexec / updateVersion   ← live DB execution, not Freemarker render
```

## Consequences

- ✅ OpenAPI / capability map clearly split "version vs DDL render"; Public API can expose `projectDdl` separately.
- ✅ `HisProjectController` name/comment consistent again; lower chance of treating template preview as version API.
- ✅ Service layer zero fork: `DbChangeService` still single orchestration; Controllers thin delegate.
- ⚠️ Short-term dual paths to maintain; FE + docs must switch same iteration.
- ⚠️ External integrations hardcoding `/hisProject/exportDdl` need release note (this repo FE is sole product caller).

## Verification (after migration slice)

- `cd backend && mvn -q test -Dtest=DdlTemplatePreviewEngineTest,Json2CodeFullDdlEngineTest,Json2CodeTableDdlEngineTest -Djacoco.skip=true`
- curl new paths three endpoints + old deprecated still 200 (slice A); old 404 after cleanup (slice C)
- `yarn test:e2e --project=chromium tests/e2e/database-templates-modal.spec.ts`
- Export dialog + table DDL tab manual walkthrough
- `@RequireProjectAccess` regression: non-member `projectId` → 403 (same as current hisProject)

## Implementation slices (done)

1. [x] `ProjectDdlController` + three POSTs
2. [x] FE `ddlExportApi.ts` path change
3. [x] E2E / CHANGELOG / `product-capability-map.md`
4. [x] Remove three DDL endpoints from `HisProjectController`
