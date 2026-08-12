# ADR-0029: Designer Data Preview (Schema Probe) Design Brief

## Status

Proposed (design brief, not an implementation decision) — 2026-08-09; same-day third revision of §5 "Driver Management". This document answers "whether to build it and what it should look like"; it does **not** authorize implementation. Entering the roadmap requires explicit human approval and lifting the current "📋 Deferred: do not expand JDBC query console" status in `control-matrix.md`.

**Revision history (2026-08-09, same day, three pieces of user feedback)**:

1. "You cannot rely on compile-time Maven dependencies for four databases — there are too many database types and versions" — four databases cannot be a permanent ceiling; an extension path is needed that does not require starting over
2. "None of your thinking or design should put users in a blocking situation where they have to supply missing pieces mid-use to continue" — any extension mechanism must **not** require modelers to supply driver jars, driver class names, or contact an administrator while using preview; this constraint outranks "cover more database types"
3. "I want compile-time to include only the drivers this project needs — nothing else bundled" — the `backend` module's own compile/runtime dependencies should include only drivers required for **application bootstrap** (MySQL for system databases `erd`/`martin`); connectors for **user data sources** such as PostgreSQL/Oracle/SQL Server should not count toward the `backend` module's compile/runtime scope, even if they still appear in the default release image

The three pieces of feedback together yield: a **system driver + official connector pack + extended connector pack** three-layer model (see §5). Day-1 visible support for modelers is unchanged (still four databases, zero blocking); what changes is the architectural ownership of "how these four databases are assembled into the final image."

## Context

Historically the FE had a query console page (`pages/design/query`, `pages/dataQuery`), judged overbuilt in W2 and removed from source (see `product-capability-map.md` "Dead shells and overbuilding"); backend `QueryInfoController`/`SqlGuard.assertReadOnly` remain, but they use the legacy `@Dynamic` + `SqlHelperDsManager` path (routing global registered data sources by `dbName` string), **not** the modern permission path through the project `data_sources` table + `DataSourceAcl` (deliberately excluded when ADR-0008/R-DATA-02 was fixed).

The user wants a serious re-evaluation of this capability: where the entry point is, what happens inside, whether to leave an audit trail, plus a dimension not previously covered — **how to manage multi-database drivers**. This document is the conclusion of that evaluation.

## Decision

### 0. Answer "whether to build it" first

**Conclusion: yes, but minimized and renamed** — not a "query console/SQL Workbench", only **"Table Data Preview"** (English working name `Data Preview`; routes/component names must avoid `query`/`sql`). Rationale:

- `vision.md` explicitly says "do not replicate dbdiagram" and "do not compete in others' niches" — a generic SQL execution box (DBeaver/Navicat style) is exactly someone else's niche; but **one-click real data from a canvas-selected table** is an action strongly bound to the "modeling" context, serving the core modeling question "does my model match real data in the database?", not general query capability
- Naming is product boundary: calling it "query" constantly pulls user requests toward "can we add a WHERE input?", "can we save common queries?", "can we export CSV?" — each step is reasonable, but the end state is rebuilding the removed query console. Calling it "preview" inherently rejects those requests by name
- Relation to the North Star: does not directly produce "version saves", but reduces doubt of "I built the model but am not sure fields/data are right", indirectly lowering "abandon modeling midway" churn — a **supporting** capability, not a lever capability; scheduling priority should be below any slice that directly serves the North Star

### 1. Entry points (few entries, strongly bound to modeling, do not compete with modeling for attention)

| Entry | Decision | Rationale |
|---|---|---|
| Canvas table node bottom bar fifth item "Preview Data" beside "Fields \| Indexes \| Metadata \| Triggers" | ❌ Do not add | Bottom bar already has 4 items near density limit (design-principles table node dense-bar discipline); all 4 bottom-bar items are **change model structure** actions; preview data is **view external real data**, semantically different — mixing them makes users think preview can edit structure |
| Table node context menu "Preview Data…" | ✅ Add | Context is the tool (principle 3); does not occupy permanent bottom-bar space; item appears only when table is bound to a data source **and** that data source type has an available driver — if either condition fails, item does not appear (no grayed dead affordance, no "click to learn it's unsupported") — driver availability per §5.3 |
| Left tree table node context menu same "Preview Data…" | ✅ Add | Symmetric with canvas; keyboard-roaming users (left-tree arrow-key flow) can reach it equally |
| Project menu / DesignLayout sidebar new top-level "Query" or "Data Preview" | ❌ Do not add | This is exactly the revived old entry — a standalone entry detached from table context equals rebuilding a generic query console; also competes with sidebar space for "Import/Export/Settings" and other structure actions |
| Home / top bar | ❌ Do not add | Completely detached from modeling context; pure distraction |
| Command palette `Cmd/Ctrl+K` search table then append "Preview \{table name\} data" | ✅ (add in v1, not v0 required) | Power-user loop consistency; v0 only context menu, validate demand before expanding keyboard entry |

**First-touch empty state**: context menu item itself needs no empty-state design (item either appears or not). After preview drawer/panel opens, if table is not bound to a data source or data source has not synced that table → clear copy "This table is not connected to a data source. Bind one in Data Source Settings to preview real data" + jump link; blank drawer forbidden.

### 2. What happens inside (flow)

**Carrier choice**: Drawer (side panel), not full-page route, not new tab. Rationale: preview is a lightweight "glance and close" action; closing Drawer returns to canvas state without interrupting modeling flow; full-page route (old approach) means leaving designer context, inconsistent with "supporting capability" positioning.

**Happy path**:

1. Table node/left tree right-click "Preview Data…" → if table has ≥1 bound data source, open Drawer with **current project default data source** (`profile.defaultDataSourceId`, existing field); if project has multiple data sources and no default set → one `Select` at top of Drawer for user to pick, remember choice for this session only (not persisted, frontend state only)
2. Drawer opens and **auto-runs** dialect-generated `SELECT * FROM {table} LIMIT/TOP/FETCH 100` (see "Driver management" below) — user should not need two clicks; right-click → preview should show data; an extra "Run" click is friction
3. Result area: read-only table (reuse antd `Table`, not JExcel — JExcel is editable grid, implying "this data can be edited"); column headers show field names + types read from `projectJSON` (if model contains this table)
4. Drawer top toolbar: only "Refresh" and "Close" + one read-only line "Showing first 100 rows · took xx ms · \{data source name\}"; **no** WHERE input, no sort-on-click, no export — those are "query console" features, not "preview" features; v0/v1 both skip them
5. Failure state: connection failure/timeout/SQL error → inline error copy in Drawer (same "zero silent failure" discipline), provide "Retry"; do not close Drawer, do not pop secondary Modal

**Relation to model tree/current entity selection**: preview is a one-way action "from table"; does not reverse-affect canvas selection or currently open tab. Preview Drawer can coexist with table design tab and field editor (Drawer floats, does not take tab slot).

**Multi data source/multi schema**: one `entity` maps to one real table in one selected data source connection; no "compare same table name across multiple data sources" advanced feature (not a v0/v1 goal).

**Large result sets**: server hard cap 100 rows (experience default) + 500 row hard maximum (`PaginationInnerInterceptor.setMaxLimit(500L)` is already global config, naturally applies); frontend **does not** provide "load more"/pagination — preview is "glance"; needing more data is ops/DBA scenario, belongs in a real database client, not a requirement this product should take on.

**Timeout**: current `connector`/`queryInfo` command stack has **no** JDBC query timeout setting (confirmed by inspection — zero call sites for `Statement.setQueryTimeout`) — this is mandatory new work, not incidental: preview must set 5–10s server-side timeout; timeout handled as failure copy ("Query timed out — table may be large or data source slow"), preventing one preview from exhausting connection pool and dragging down other designer APIs.

### 3. Audit trail / history

| Topic | Decision | Rationale |
|---|---|---|
| Record `QueryHistory` (existing entity/table)? | **Yes, but for audit not "recent queries" UX** | Projects hold data source credentials (even if encrypted at rest); who ran what SQL against which data source when is basic security audit, especially in self-hosted scenarios where admins must answer "who viewed production data source data" |
| Record granularity | One row per preview: `projectId` / `dataSourceId` / `tableName` / executed SQL text / executor / duration / row count / success or failure | Existing `QueryHistory` lacks `projectId`/`dataSourceId` (only legacy `dbName`/`queryId`); reviving requires adding these columns first (Flyway add columns, per schema-migration rules) |
| Expose "history" panel in UI? | **v0/v1 do not expose**; persist only, no frontend list | Exposing "history" implies "this is worth revisiting and managing", pulling user mental model from "preview" back to "query workbench"; when real audit need appears (e.g. team admin wants who queried sensitive data), build separate admin audit view, not on designer UI |
| Saved queries | **v0/v1 explicitly out of scope** | Typical query console signature feature; building it equals admitting this is a query console |
| Collaboration visibility: can teammates see what tables I previewed? | **No**, and should not | Preview is local read-only exploration, not modeling change; should not use collaboration broadcast (SocketIO presence/sync); audit log is for project owner/admin retrospective lookup, not real-time teammate feed |
| Privacy | SQL text in history may contain user-typed WHERE conditions (even though v0 has no WHERE input, `SELECT * FROM t LIMIT 100` carries low risk); **result data never stored in audit table** — only SQL text + row count + duration, not returned data content | Avoid audit table becoming a second sensitive data leak surface |

### 4. Important points the user did not ask about

**Security** (on ADR-0008/R-DATA-02 baseline, new surfaces for preview):

- Must use modern path `dataSourceId` → `DataSourceAcl.requireOwned`; **forbidden** to revive legacy `@Dynamic`/`dbName` path used by `queryInfo/exec` today (that path skips project membership check — anyone can guess/enumerate `dbName` to hit other projects' data sources)
- Read-only whitelist reuses existing `SqlGuard.assertReadOnly` (SELECT/EXPLAIN/SHOW/DESC, jsqlparser validation) — no new implementation needed
- SSRF/DNS-rebind protection reuses `JdbcUrlGuard.assertAllowedAndPin` (pin host to allowed IP before connect) — preview equals a new "build temporary connection and run SELECT at any time" path; must use this protection, no shortcut direct connect

**Permissions: who can preview**:

- Project members (`project_user`) only, same level as other in-project operations — **no** separate "preview permission" dimension (YAGNI; split only if real need "read-only preview without edit" appears)
- Read-only share (`/s/:token`) visitors **cannot** preview — ADR-0008 clears `profile.dbs` in share response; visitors get no data source credentials; preview entry naturally absent in share shell (frontend hides by `shareContext`, same guard as layer B probe)

**Version interaction: queries live database, not model snapshot — this mismatch must be clear**:

- Preview connects to **current live database real data**, independent from designer `projectJSON`/version snapshot (echoes ADR-0022 dual-layer consistency: projectJSON↔version is layer A, live schema is layer B; `Data Preview` is layer B "data" dimension — layer B previously only did "schema structure" probe)
- User may have renamed fields/added fields in model but not synced to live DB (or vice versa — live schema changed but model not re-reverse-engineered) — preview may show "column missing in table" or "column missing in model"; copy must explain; users must not think "preview result = current model state"
- Concrete approach: Drawer top reuses layer B probe semantic separation color (`dualLayerTokens`); if data source known to be `behind`/`diverged` vs current model (`SchemaProbeCommand` already determines), add muted line above preview result "Live schema may be out of sync with current model — see Version page for probe details" — **reuse existing capability, do not reinvent**

**Rate limiting/cost/accidental large-table harm**:

- Per session/per user lightweight throttle (e.g. 5/minute); rationale not "save money" (self-hosted has no token cost) but prevent accidental ops (e.g. hotkey spam) from exhausting downstream data source connection pool
- `SELECT *` harming large tables: v0 fixed `LIMIT/TOP/FETCH 100`; user **cannot** change SQL or remove LIMIT in this feature — product design eliminates "accidentally full table scan"; another reason for "no WHERE input" (once custom SQL allowed, must worry about statements without LIMIT)

**Mobile**: not applicable; product explicitly excludes mobile (`vision.md`); preview panel needs no responsive deep adaptation.

**Naming**: settled in §0 — "Preview Data"/`Data Preview`; forbid "query", "schema probe", "SQL" in product-visible copy and route/component names; backend internal only (e.g. Command class names) may use `PreviewTableDataCommand`; Controller path should be `connector/tablePreview` not `queryInfo/*` (sever semantic link to legacy path, prevent maintainers welding feature back to legacy `@Dynamic` path).

**Success metrics**: not the North Star itself; **leading indicator**: correlation between "preview usage count" and "non-empty diff version save within 24h after preview" — if preview users' version save rate shows no significant difference, capability does not actually pull the North Star; downgrade maintenance or cut. No dedicated dashboard needed; one-off SQL analysis from `QueryHistory` (after `projectId` added) + `db_change` table suffices; not worth productized reporting.

**Kill criteria (dogfood failure)**:

- Within 4 weeks of launch, preview usage < 10% of active projects, and no user feedback "can't live without this" — downgrade to "maintain but no further investment", do not delete code (sunk cost paid, keeping cheaper than deleting), but reject all enhancement requests (no WHERE, no export, etc.)
- If preview significantly increases "live DB connection pool pressure" complaints/failures (especially self-hosted low-memory deploys), tighten throttle/timeout first; if still ineffective, remove entry (context menu item), keep backend API but unexposed

### 5. Driver management (revision: core layer + deploy-time extension packs, redesign driven by two hard constraints)

#### 5.0 Revision motivation

Initial conclusion "drivers are compile-time 4-database Maven dependencies, sufficient, no pluginization" overturned by three user feedback items in sequence:

1. **Cannot cap**: too many database type + version combinations; pinning "only 4 supported" as permanent architecture assumption is wrong; need extension path without starting over
2. **Cannot block modelers**: any extension mechanism must not make "preview data" modeling action require user to supply something mid-flow (upload jar, ask admin to install driver, fill driver class name to unlock) — this constraint **outranks** "cover more database types"; coverage expansion must be completely invisible to modelers, happening in deploy/ops timezone, not modeler click timezone
3. **Compile artifact must slim down**: `backend` module Maven `compile`/`runtime` scope should include only **application bootstrap** drivers; user data source connectors (even officially supported PostgreSQL/Oracle/SQL Server) should not be "this Spring Boot app must depend at compile time" — boundary between "what the app needs" vs "what this self-hosted stack release wants to cover"; they need not be the same Maven scope

§5.1–§5.11 below is concrete design satisfying all three constraints.

#### 5.1 Current state: two driver uses mixed in same compile scope today

Drivers today are **compile-time Maven dependencies**, bundled into backend fat jar / Docker image; no runtime dynamic loading, no plugin marketplace, no "upload driver jar" DBeaver-style mechanism. But these drivers serve two completely different needs, currently mixed in `backend/pom.xml` same `<dependencies>` block, same compile/runtime scope:

| Driver | pom.xml coordinates | Version | Actual use | Product surface integrated? |
|---|---|---|---|---|
| MySQL (incl. MariaDB compat) | `com.mysql:mysql-connector-j` | `${mysql.connector.version}` | **Dual**: ① app bootstrap — `erd`/`martin` system DB connect (`application.yml` hardcoded `driver-class-name: com.mysql.cj.jdbc.Driver`) + Flyway; ② user data sources — most common customer MySQL/MariaDB | ✅ ADR-0006 P0 · `JdbcUrlGuard` whitelist · frontend type Select |
| PostgreSQL | `org.postgresql:postgresql` | `42.7.4` | **User data sources only** — app system DB always MySQL, never PG | ✅ same |
| Oracle | `com.oracle.database.jdbc:ojdbc8` | `${oracle.connector.version}` | User data sources only | ✅ same (`jdbc:oracle:thin\|oci`) |
| SQL Server | `com.microsoft.sqlserver:mssql-jdbc` | `12.8.1.jre11` | User data sources only | ✅ same |
| ~~DB2~~ | ~~`com.ibm.db2:jcc`~~ | ~~`${db2.connector.version}`~~ | None | **Removed this round**: verified zero repo usage (not in `JdbcUrlGuard` protocol whitelist, not in `ReverseDialectRegistry`/`DialectIds`, not in frontend data source type `Select`); `pom.xml` pure dead declaration; removed with this ADR (`delete-dead-code`, trivial, no dedicated PR wait); README "DB2 online management" remains inaccurate historical marketing copy — separate debt, not changed this round |

**Key technical fact (verified repo-wide grep `backend/src/main/java`)**: application code has **zero compile-time references** to these drivers' Java classes (no `import org.postgresql.*`/`oracle.jdbc.*`/`com.microsoft.sqlserver.*`) — driver loading is pure reflection: `JdbcKit.getConnection()`/`AbstractDBCommand` series all use `Class.forName(driverClassName)` + `DriverManager.getConnection(url, props)`; `driverClassName` is runtime string (from `data_sources.driverClassName` or `ConnectorCredentialResolver.defaultDriver(type)` fallback). Therefore **moving user data source drivers out of `backend` module compile/runtime scope does not break compile** — `mvn compile` does not depend on these jars being present; only when actually executing `DriverManager.getConnection` are driver classes needed on **runtime** classpath. This fact is the technical prerequisite for §5.2 layering.

**Dialect capability matrix** has precedent: `ReverseDialect` SPI + `DialectCapability` + `ReverseDialectRegistry` (ADR-0006), serving "reverse parse metadata"; **connection credential resolution** has modern path: `ConnectorCredentialResolver.apply()` gets credentials via `dataSourceId` through `DataSourceAcl`, `defaultDriver(type)` fallback driver class name; **pagination dialect** auto-detected by MyBatis-Plus `PaginationInnerInterceptor` from actual JDBC connection metadata — preview does not handle itself. Preview reuses all three modern paths; this revision does not change that conclusion.

**Known real pit (unchanged)**: four databases lack unified `EXPLAIN <SQL>` syntax — preview v0/v1 does not do explain/execution plan.

#### 5.2 Decision: system driver + official connector pack + extended connector pack, three-layer model

| Layer | What it is | In `backend` module compile/runtime scope? | In default release image? | Who adds | Modeler perception |
|---|---|---|---|---|---|
| **System driver** | Required for app bootstrap — currently MySQL/MariaDB (`erd`/`martin` system DB + Flyway), also naturally covers most common customer MySQL data sources | ✅ Yes, and **permanently** — app cannot connect to its own system DB without it; "moving out" is not an option | ✅ Yes | Project maintainers; changes only if system DB engine itself changes (no such plan) | Unaware; always been this way |
| **Official connector pack** | Serves user data sources; product P0-promised types — day-1 PostgreSQL, Oracle, SQL Server (exactly same types as reverse parse/sync/ping) | ❌ **Target state: not in** (still in today, see §5.1 table; migration path §5.2a, not executed this round) | ✅ Yes — image build stage merges these three driver jars into final artifact (`BOOT-INF/lib` or `loader.path` scan directory), separate from `backend` module compile output but same default image | Project maintainers via normal PR + release | Unaware — these three types "always existed" in data source type Select and preview menu because default image always included them |
| **Extended connector pack** | Future new DB types (e.g. DB2, ClickHouse, Doris, SQLite…), product not committed | ❌ Not in | ❌ **Not in** default image; ops must explicitly choose alternate image tag or mount driver directory | Project maintainers develop + release; **self-hosted ops** decide enablement (see §5.5) | Unaware — if ops enabled, type "always existed"; if not enabled, type "never existed", not appear-then-error |

Shared discipline across three layers: **driver appearance/disappearance only at deploy/release time, never on a modeler click**; "official connector pack" + "system driver" together are what modelers see as "databases this product supports" — same thing to modelers, different Maven scopes to maintainers. No fourth layer — this ADR explicitly rejects:

- ❌ Admin online upload driver jar Web feature (even admin-only) — rationale §5.6
- ❌ Modeler/project member filling driver class name/version to "unlock" a type — rationale constraint 2
- ❌ End-user "driver marketplace/plugin store" browse/install UI — DBeaver/Navicat product form, not something "preview" should grow into; violates `vision.md` "do not compete in others' niches"

#### 5.2a Migration path (target state, recorded this round only, not executed)

Moving PostgreSQL/Oracle/SQL Server from official connector pack current state (still in `backend` module compile scope) to target state (not in that scope, merged only at image build) requires:

1. `backend/pom.xml`: move these three dependencies out of main `<dependencies>`, into separate Maven modules (e.g. `backend/connector-postgresql`, `connector-oracle`, `connector-sqlserver`) each declaring dependency, or Maven profile isolation (`-Pconnectors-official` to compile into artifact) — this round added comments in `pom.xml` marking target state and technical basis (§5.1 reflection loading fact); did not actually split modules
2. Docker multi-stage build: default image build stage beyond packaging `backend` main artifact, additionally "resolve these three connector module dependency coordinates → download jars → copy into `BOOT-INF/lib`" (`mvn dependency:copy-dependencies` targeting three artifacts, or build three submodule jars then merge into final image layer)
3. CI: new "official connector pack integrity" check — default image build output must contain class files for these three drivers, preventing accidental omission when build scripts change (regression test, not runtime probe)
4. Verification: after migration `mvn -pl backend compile` should still succeed (§5.1 proved zero compile-time class references — theoretically removal should not fail); `docker compose up -d` with default image, create PostgreSQL/Oracle/SQL Server data source + right-click "Preview Data" should match pre-migration behavior exactly — core regression assertion, not "looks like it compiles"

This migration changes no user-visible behavior; pure maintainer-side build artifact governance; need not finish inside this ADR; schedule as independent follow-up (work concentrated in Docker build scripts + CI, no product/security decisions — decided in this ADR).

#### 5.3 Non-blocking modelers: capability-driven UI visibility (constraint 2 response, core new design)

- Backend maintains "connector types actually available in current process" list (which types' driver classes can load now) — **system driver + official connector pack** four types always available in any default release image, static known set, no probe needed (even after §5.2a migration when PG/Oracle/SQL Server no longer `backend` module compile dependencies, they still start with default image — logic unchanged); extended connector pack types determined by `@ConditionalOnClass`/module on classpath, computed at **startup**, not per request
- **Frontend both entry points render only when type appears in that list**:
  1. Data source create/edit form type `Select` — unavailable types not shown; no dead "selected but cannot connect" options
  2. Table node/left tree "Preview Data…" — updated in §1 as dual gate: bound data source **and** data source type has available driver; both required to appear
- For existing data sources where current deploy downgraded/removed driver (e.g. ops switched image from extended-connector tag back to default — uncommon but must cover): other data source info (host/port/connection test history etc.) still viewable/editable; **only** "Preview Data" menu item silently disappears — one action's missing driver must not make entire data source unusable; minimal blast radius
- Result: modelers only ever see "what works"; never "click to discover it doesn't work"; never "install something to use" prompts — exactly constraint 2

#### 5.4 Version matrix: product self-test combinations, not user-chosen driver versions

- Each system driver / official connector pack type has **one** product-pinned driver version (as today: one line each in `pom.xml` top `<properties>`); no "MySQL 5.7 uses driver A, MySQL 8 uses driver B" branches users must understand — `mysql-connector-j` 8.x itself backward-compatible to MySQL 5.7 and mainstream MariaDB for read-only query path; version differences handled by driver, not exposed at product layer
- SQL dialect differences (pagination/identifier quoting) already handled by §5.1 MP pagination plugin auto-detect + §5.8 prefill template table fallback; no "user picks version" concept needed
- Product QA: on driver upgrade run docker matrix (e.g. `mysql:5.7`/`mysql:8.4`/`mariadb:10.11`, `postgres:13`/`16`, `mssql:2019`, Oracle redistributable free edition) for connect + preview SQL integration tests; regression in CI; users need not prove "my version works"
- Existing editable `data_sources.driverClassName` field (`DatabaseConfigForm.tsx` currently allows manual override) tensions with this decision — **record as implementation TODO**: system driver + official connector pack four types should become read-only display derived from `type` (no user override, eliminate "wrong driver class name" failure mode that should not exist); extended connector pack types may need explicit declaration when ops onboard new type (one-time deploy config, not a field modelers touch); this ADR does not change code this round, only records direction to avoid doc/target drift

#### 5.5 Security conclusion: reject runtime upload, naturally no new RCE surface

- Because §5.2 rejects "runtime upload jar", extended connector pack enters only via two ops **existing** trust boundaries:
  1. Choose alternate image tag containing that extended pack (requires pull/build image permission — ops already have)
  2. Mount driver jar into compose-declared directory, added to classpath once at process start (requires modifying `docker-compose.yml`/host filesystem — ops already have)
- Neither path adds permission tier: whoever can do this can already do anything to the self-hosted stack (change image, compose, env vars). **No** "give project member who just wants preview an upload entry" attack surface — entry designed not to exist
- Therefore **no** signature verification, sandbox ClassLoader, upload audit mechanisms only needed when "upload allowed" — saving not "future debt to fill" but a whole attack surface class never introduced
- Official connector pack (PG/Oracle/SQL Server) via §5.2a image build merge likewise involves no runtime upload; same security conclusion as extended pack; only difference is whether it appears in the default image automatically, not whether an upload entry exists (neither has one)
- If community later wants "download community-maintained connector pack" distribution (beyond §5.2), must re-run security model (signature/verification/trust chain); new ADR; cannot naturally grow from this ADR's extension pack mechanism

#### 5.6 Oracle license conclusion (responding to "license issues" concern)

Verified (2026-08 Maven Central metadata check): `ojdbc8` since 19.6 uses **Oracle Free Use Terms and Conditions (FUTC)**, not click-through; permits free use and **redistribution** of binaries without signing agreement or contacting Oracle sales. `pom.xml` current `21.1.0.0` within FUTC coverage; bundling Oracle driver in **official connector pack** (whether current `backend` module compile-time or §5.2a target image build merge) **has no redistribution license issue**; no need to move Oracle to "extended connector pack" layer separately.

If evaluating IBM DB2 (`db2jcc`) etc. later, **verify separately** license terms allow similar free redistribution — cannot assume Oracle FUTC; if unfavorable, keep type in "extended connector pack" layer for ops to download/mount themselves, not default image distributed with project (avoid project redistribution obligation).

#### 5.7 v0 driver scope: day-1 support surface must be complete (responding to "day-1 shippable" concern)

- v0 declares support for **system driver + official connector pack four types** only (default release image four types); preview entry/data source type Select stays **fully consistent** with existing capabilities (reverse parse, sync, ping) — no "can create data source but not preview" or inverse half-support; concrete "claimed types must work day one"
- Prefill template table (§5.8) covers four types with correct identifier quoting rules; no "click then syntax error" dead affordance
- Explain/execution plan: v0/v1 out (§5.1 known pit)

#### 5.8 Prefill templates (unchanged, per dialect)

| Dialect | Prefill template |
|---|---|
| MySQL / MariaDB / PostgreSQL | `` SELECT * FROM `t` LIMIT 100 `` (PG uses double quotes `"t"`) |
| SQL Server | `SELECT TOP 100 * FROM [t]` |
| Oracle | `SELECT * FROM "T" FETCH FIRST 100 ROWS ONLY` (12c+ syntax; this project targets new greenfield DBs, not 11g and earlier) |

Identifier quoting rules must match dialect (`` ` ``/`"`/`[]`); otherwise reserved words/case-sensitive table names cause syntax errors — "looks clickable but errors on click" dead affordance; must handle in prefill generation, cannot lazily concatenate bare table names.

#### 5.9 Path for new types (replacing original "add driver flow", requalified by three layers)

**System driver layer: default no expansion** — serves app bootstrap only; not where "support more user database types" should change things. Unless project decides to change system DB engine (no such plan; fully independent major decision, outside this ADR), this layer forever has only MySQL/MariaDB.

**Official connector pack expansion** (maintainer judges type worth permanent product baseline, e.g. repeated community ask and clear license):

1. `pom.xml` (or post-migration independent connector module) add dependency coordinates + version property
2. (Optional, for reverse parse precision) implement `ReverseDialect` SPI, register in `ReverseDialectRegistry`
3. `ConnectorCredentialResolver.defaultDriver()` / `buildJdbcUrl()` each add `case` branch
4. `JdbcUrlGuard` protocol whitelist add corresponding `jdbc:xxx` prefix
5. Frontend `DatabaseConfigForm` type `Select` add item + `dbTypeMap`/`defaultPorts` one line; backend available type list (§5.3) sync add
6. §5.8 prefill template table add row
7. Confirm new driver jar merged into default release image at image build stage (§5.2a mechanism), not automatic from dependency add alone

**Extended connector pack addition** (do not want new type in default image, or niche/unresolved license):

1. New independent module (e.g. `erd-connector-db2`), declare driver dependency + steps 2–4 (same, but registration via `@ConditionalOnClass` conditional wiring — silent when module not on classpath)
2. Alternate Docker image tag (e.g. `:full`) builds module in; or document "mount driver jar to directory, startup script adds to classpath" ops onboarding in `docs/deployment.md`
3. Do not change default image size/default support surface; `docker compose up -d` (default tag) users completely unaware type ever existed

Common to both expansion paths: **all maintainer-submitted code/image changes, ops chooses enablement (extended pack) or maintainer decides release (official pack) — never triggered by one preview session** — satisfies constraint 1 (no cap) without violating constraint 2 (no modeler blocking) or constraint 3 (system driver layer stays lean; new types via "merge into image" not "stuff into backend module compile dependencies").

**Non-goals (unchanged, tightened this round)**: no pluginized driver marketplace browse/install UI; no role may upload driver jar at application runtime; preview does not serve "unregistered type" bare JDBC URL (`dataSourceId` mandatory, see below).

#### 5.10 Connection resolution path (unchanged, prevent return to legacy path)

Preview **must** use modern `connector/*` path not legacy `queryInfo/exec`:

- Request body carries only `dataSourceId`; backend reuses `ConnectorCredentialResolver` (new branch semantically like `applyMutate` but read-only validation `applyQuery`/`applyProbe`) to resolve `driverClassName`/`url`/`username`/`password`
- Reuse `AbstractDBCommand` existing connection logic (includes `JdbcUrlGuard.assertAllowedAndPin` SSRF/DNS-rebind protection), open temporary read-only connection, run `SqlGuard.assertReadOnly`-validated SQL, close after use (not pooled — preview is low-frequency lightweight action, no need to occupy pool)
- **Does not** go through `@Dynamic` annotation or `SqlHelperDsManager` global registered data source table — existing `QueryInfoController`/`QueryInfoServiceImpl` therefore **cannot be directly revived**; implementation is "new `connector/tablePreview` endpoint", not "unban old Controller"

#### 5.11 Failure states (revision: remove all "ask user to supply missing pieces" copy)

| Failure scenario | User-visible result | Requires user to "supply missing pieces" to continue? |
|---|---|---|
| Data source type not in available connector list (extended pack not enabled, or historical type downgraded) | Type does not appear in data source type Select; existing data source "Preview Data" menu silently absent | **No** — option removed from UI before modeler reaches "clicked but useless" |
| (Defensive, core layer should not happen) driver class resolution fails unexpectedly at runtime | Drawer inline terminal copy "This data source is currently unavailable for preview" + "Close"; server logs error for ops | **No** — do not guide user to fill driver class name/find driver/contact anyone; ops fixes image/deploy from logs |
| Dialect detection fails (pagination plugin cannot get connection metadata, e.g. opaque pool proxy class) | Unaware: server fallback to hard-coded `LIMIT 100` concatenation, not surfaced to user | No |
| Query timeout (entire stack currently zero `setQueryTimeout` calls — must add) | "Preview timed out — data may be large or data source slow" + "Retry" | No — retry is same action, not supplying new info |
| Connection failure (network/credentials/permissions) | Show readable DB driver error, no stack trace | Edge case: prompt may say credentials/network in data source settings may be wrong — **connection** issue not **driver** issue; credentials/host are normal editable fields in data source settings, not new blocking points from this round; does not violate constraint 2 |
| SQL execution error (table dropped/type mismatch etc.) | Show readable DB driver error (reuse `ExceptionUtil.getCausedBy(e, SQLException.class)` pattern) | No |

### 6. Phasing

| Phase | Scope | Explicit non-goals |
|---|---|---|
| v0 | Canvas/left tree table right-click "Preview Data…" → Drawer; auto-run dialect `LIMIT/TOP/FETCH 100`; read-only table; refresh/close; failure copy; `dataSourceId` modern path + `SqlGuard.assertReadOnly` + `JdbcUrlGuard` reuse; server timeout + throttle; `QueryHistory` add `projectId`/`dataSourceId` audit persist (no frontend history panel) | WHERE input, custom SQL, sort/filter, export, explain, favorites, multi-table JOIN, collaboration visibility, command palette entry |
| v1 (depends on v0 dogfood) | Command palette search table append "Preview" entry; semantic hint linkage with layer B probe (`behind`/`diverged`); lightweight pagination (next 100 rows, still no WHERE) | Still no: custom SQL, export, favorites, explain, cross-data-source compare |
| Later (requires new initiative, outside this ADR) | If team strongly asks "can I write my own WHERE" — **should refuse** and point to real database client; if built anyway, must re-run security model (custom SQL = reopening "user-controlled SQL execution surface", not just an input box) and new ADR; cannot naturally grow from v0/v1; likewise first concrete §5.9 "extension pack" (e.g. DB2/ClickHouse) needs real demand before initiative — this ADR sets architecture only, does not pre-build any | — |

## Consequences

- Positive: right-click "Preview Data" cheaply answers "does my model match real data?", reducing mid-modeling abandonment friction from uncertainty; reuses existing `SqlGuard`/`JdbcUrlGuard`/`ConnectorCredentialResolver`/MP pagination plugin, almost no new security surface
- Positive: naming and scope double tightening ("preview" not "query", no WHERE/no custom SQL) product-design excludes "become second query console" path dependency
- Positive (this revision): driver model from "4 DB cap" to "system driver + official connector pack + extended connector pack" three layers, leaves non-disruptive path for future DB types; rejecting runtime jar upload means **no** new RCE attack surface — no cap and no modeler blocking satisfied simultaneously without conflict
- Positive (this revision): Oracle redistribution license verified (FUTC, Maven Central metadata); resolves outstanding "Oracle driver in default image license risk" concern; `db2.connector.version`/`com.ibm.db2:jcc` dead dependency removed from `pom.xml` this round
- Positive (this revision): grep verified repo-wide `backend/src/main/java` zero compile-time references to user data source driver Java classes (pure `Class.forName(driverClassName)` reflection) — makes "move PostgreSQL/Oracle/SQL Server out of `backend` module compile/runtime scope" technically safe refactor without touching business code; `pom.xml` comments mark target state; actual Maven module split + Docker multi-stage build is independent follow-up (§5.2a), not this round, no behavior change
- Negative: `QueryHistory` needs column migration (Flyway); server timeout/throttle missing on legacy path, must write new not reuse
- Negative (this revision): `data_sources.driverClassName` currently user-overridable (`DatabaseConfigForm.tsx`) tensions with target "system/official four types should not expose driver class name to users" — follow-up to tighten to read-only derived from `type`; this ADR records direction, scheduling decides timing, no code this round
- Negative (this revision): §5.2a migration path is substantial build-chain work (Maven modules or profile + Docker multi-stage + CI integrity check); real cost; this ADR only sets direction and verification assertions — schedule as independent work item, do not bundle inseparably with preview v0 implementation
- Negative: North Star supporting not lever capability; mis-prioritizing in scheduling steals time from slices directly serving "version save" — this ADR recommends explicitly marking lower than any P3 version workflow/collaboration slices
- Legacy `QueryInfoController`/`SqlGuard.assertReadOnly` existing code: verified repo-wide only `QueryInfoServiceImpl` calls `assertReadOnly`; approval/work order "view SQL" detail is plain text display, not this execution path — after preview lands, legacy `@Dynamic` path can fully retire (Controller/ServiceImpl/Mapper together); separate `delete-dead-code` PR, not handled in this ADR

## Related

- [ADR-0006](./0006-reverse-dialect-spi.md) Multi-database reverse Dialect SPI — precedent for dialect capability table-driven pattern
- [ADR-0008](./0008-datasource-isolation.md) Data source isolation — modern credential path preview must use
- [ADR-0022](./0022-dual-layer-consistency.md) Dual-layer consistency — semantic framework for preview vs model snapshot mismatch
- [ADR-0024](./0024-datasource-credential-encryption.md) Data source credential encryption — preview decrypt path aligned with this ADR
- `security-model.md` R-DATA-01/02 — read-only whitelist and SSRF protection current state
- `product-capability-map.md` "Dead shells and overbuilding" — historical decision removing old query console; this ADR does not overturn it, proposes smaller replacement outside its boundary
