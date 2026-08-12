# Product capability map

> Audience: schedulers and UI slice implementers. Answers one question: **what backend/SQL can already do, what the UI exposes, and where the gaps are**.
> Gap grading: **missing** (backend can do it, UI unreachable) · **thin** (entry exists but shallow/hard to find) · **overbuilt** (UI investment exceeds capability value) · ✅ (fully exposed—do not re-invest).
> Maintenance: reconcile this table at each iteration close; UI scheduling prioritizes eliminating missing, then thin; overbuilt—delete only, no additions.

## Versions and audit (North Star direct)

| Capability | API / SQL | UI surface | Gap |
|---|---|---|---|
| Save version (snapshot) | `POST /hisProject/save` (HisProjectController → db_change) | Designer top bar "Save version" always visible ✅; example project notice card shortcut ✅ | ✅ |
| Version list + multi-tag filter | `POST /dbChange` paginated; `db_change.tag` (Flyway V1 column, V2 multi-tag relaxed) | Designer version tab: antd List (W3 slice 2) + tag chips + filter + empty state "Save first version" ✅ | ✅ |
| Version diff | CompareVersion / VersionDiffPanel | Version page row action ✅ | ✅ (on-screen) |
| Cross-version diff **export** | Same diff data, `File.save` pipeline | CompareVersion "Export" → Markdown change list (model changes + SQL) / SQL only ✅ (W3 slice 1) | ✅ |
| Version revert | RevertVersion → `hisProject/load` + save | Version page row action "Revert" ✅ | ✅ |
| Version → datasource sync | `POST /connector/dbsync` / `rebaseline` / `checkdbversion` / `updateVersion` | Version page sync status tag + SyncConfig/InitVersion ✅ | ✅ |
| Version delete / rebuild | `hisProject/delete{,All}` | Version page, double confirm ✅ | ✅ |

## Share and spread

| Capability | API / SQL | UI surface | Gap |
|---|---|---|---|
| Read-only share create | `POST /share/create` (token anonymous read, ADR-0007) | Designer top bar "Share" one-click copy ✅ | ✅ |
| Share **revoke / link management** | `POST /share/revoke` | Designer top bar "Share" modal: create/copy/revoke ✅ (W2 slice 1) | ✅ |
| Share → fork | `POST /share/{token}/fork` | Share page fork + autofork ✅ | ✅ |
| Share invalid state | `GET /share/{token}` | Invalid/revoked → `AuthBrandShell` "Share unavailable" + primary CTA "Open example demo" + "Back to home" ✅ (ADR-0016 brand aligned; W5 slice 2 capability retained) | ✅ |
| Share read-only empty state | No model / module 0 tables | `ShareEmptyState` (`ErdEmptyDiagram` + primary CTA) ✅ | ✅ |
| Share success top bar | Read-only `/s/:token` | 64px `erd-chrome-header` + logo + project name + Fork CTA + login/register links ✅ (W5 slice 3) | ✅ |
| 404 / 403 pages | Routes `/*` / `403.tsx` | `AuthBrandShell` + "Open example demo" + "Back to home" ✅ (ADR-0016 brand aligned; W5 slice 1 capability retained) | ✅ |
| Login/register brand shell | `/login` `/register` | Left 40% dark brand panel + right Form; `--erd-*`; no `bg2`/`#1677FF` ✅ (W5 slice 4) | ✅ |
| Landing palette | `/` | Dark facade layout unchanged; less reads `--erd-*` only; below-fold/comparison secondary density ✅ (2026-08-03) | ✅ |
| Competitor comparison | `/compare` (landing summary `#compare`) | Honest comparison table + demo/self-host CTAs; shared `LandingChrome` shell; secondary density ✅ | ✅ |

## Collaboration

| Capability | API / SQL | UI surface | Gap |
|---|---|---|---|
| presence + incremental sync | WsController / SocketIO (ADR-0009) | Designer top bar CollabPresence ✅; remote sync toast shortcut to "Save version" ✅ | ✅ |
| Team/permission three tiers | GroupProject / *Privilege series | project/group subpages ✅ | thin (straighten during W4 migration) |

## Data in/out

| Capability | API / SQL | UI surface | Gap |
|---|---|---|---|
| Reverse parse (four DBs) | `POST /connector/dbReverseParse` / `dbReverseMeta` (ADR-0006) | Designer import tab ✅; edge chip shows constraint name/ON DELETE ✅ | ✅ (composite FK `fields[]` still deferred ADR-0011; `constraintName`/`deleteRule`/`updateRule` ✅) |
| DDL export | `POST /projectDdl/export` (ProjectDdlController → Freemarker); single table `POST /projectDdl/table`; template preview `POST /projectDdl/previewTemplate` (ADR-0031) | Designer export tab; table properties DDL tab; DDL template modal preview ✅ | ✅ |
| Word doc export | `POST /doc/gendocx` (classpath template + MinIO absent fallback ✅) | In export flow ✅ | ✅ |
| Datasource management | DataSourcesController + `connector/ping` | databaseConfig page (status/ping/batch delete) ✅ | thin (W4 ProTable migration) |

## Approval and SQL trust chain

| Capability | API / SQL | UI surface | Gap |
|---|---|---|---|
| Ticket submit/approve | ApprovalController CRUD; pass requires SQL success before persist/sync (✅ fixed) | Designer version page: unsynced row "Submit ticket" → detail "SQL approval"; toolbar/sidebar "My tickets" / "My approvals" shortcuts ✅ (W3 slice 3) | ✅ |
| Online SQL (read-only whitelist) | `POST /connector/sqlexec` (jsqlparser, SELECT/EXPLAIN/SHOW/DESC only) | UI experiment page removed (W2); backend API kept for version approval SQL | **overbuilt trimmed**: control-matrix 📋 deferred; no query console this phase |

## Data dictionary / governance

| Capability | API / SQL | UI surface | Gap |
|---|---|---|---|
| Field library (data_dict) | `DataDictController` CRUD + `/dataDict/tree` + `POST /dataDict/{id}/apply` | Project menu "Settings → Field library"; table design "Insert from field library" Modal (incl. manage deep link); canvas toolbar Drawer; settings `/setting/fieldLibrary` | ✅ MVP (ADR-0032); **no** MCP write |
| Data type dictionary (dataTypeDomains) | Project JSON `dataTypeDomains` (logical types / enums / apply dialect) | Project menu "Settings → Data type dictionary"; settings `/setting/dataType`; DDL template modal | ✅ menu reachable |

## Dead shells and overbuild (delete only, no additions)

| Object | Status | Action |
|---|---|---|
| `pages/design/query`, `pages/dataQuery` | Experiment deferred | W2 slice 2: sources + QueryLeftContent/dialog/query/useQueryStore deleted; route 404 |
| `pages/design/chatsql` | ADR-0012 says no marketing wrapper | W2 slice 2: sources deleted; `@chatui/core` removed |
| `pages/design/dataDomain` | Experiment deferred | W2 slice 2: sources deleted; route 404 |
| `pages/design/test`, `pages/test` | Demo/test residue | W2 slice 1: deleted (`pages/JExcel` is table edit component, kept) |
| Home `components/Radar/`, `_mock.ts`, `fakeChartData`, unrendered `Pie`, duplicate "Project overview", slogan rotation | Dead code | W2 slice 2: deleted; `@ant-design/charts` removed |
| `account/settings/geographic` (province/city json) | No backend field | W2 slice 1: deleted |
| `plaza/Material*` backend controllers | Zero frontend refs | ✅ deleted (2026-08-02; Java/XML/MapperScan; tables untouched) |
| `dialog/import/ReversePDM` ("under heavy development") | Zero menu refs | ✅ deleted (2026-08-02) |
| `pages/design/import/index.tsx` empty shell | Route not referenced | ✅ deleted; `component/*` still serves sider deep links—do not delete whole directory |

## North Star alignment conclusion

UI gaps directly serving "weekly version saves": share revoke/manage ✅ (W2 slice 1); designer chrome left tree dedup + canvas space reclaimed ✅ (W2 slice 3); designer `calc(100vh)` zeroed (tree/version flex) ✅ (W2 slice 4); cross-version diff export ✅ (W3 slice 1); version ProList→List + empty CTA ✅ (W3 slice 2); approval/ticket entry straightened ✅ (W3 slice 3). W5 share top bar ✅ (slice 3); login/register brand shell ✅ (slice 4).
