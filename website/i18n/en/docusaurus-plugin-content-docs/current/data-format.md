# projectJSON data format (public draft)

:::tip What you get
The **single JSON source of truth** for how people, scripts, and agents read and write project models. Getting started: [API and MCP](/docs/guide/api-and-mcp).
:::

> **Reader question**: How do people and AI agents read and write ERD Online’s project model source of truth?  
> **Answer**: `projectJSON` is the sole JSON source of truth for project modeling; the machine-validatable definition lives at [`schema/projectjson.schema.json`](https://github.com/erdonline/erdonline/blob/main/schema/projectjson.schema.json) in the repo root (JSON Schema draft 2020-12).

References: [ADR-0012](/docs/adr/ai-era-data-structure-platform) (schema-as-code), [ADR-0008](/docs/adr/datasource-isolation) (secrets never in JSON). This document serves the open narrative; public API/MCP remain governed by [ADR-0013](/docs/adr/public-api-mcp)—**this spec does not authorize bypassing auth to write to the database**.

## Compatibility policy (agent stability commitment)

| Rule | Description |
|---|---|
| **Additive evolution only** | Optional fields / modules may be added; semantics and types of published fields must not be broken in place |
| **No in-place breaking changes** | No renames, deletions, or type-meaning changes; if breaking change is unavoidable, use semver major + migration guide + at least one minor deprecation window (see [roadmap versioning policy](/docs/roadmap)) |
| **Preserve unknown fields** | Readers should ignore unknown keys; writers must not strip unknown keys written by others (forward-compat) |
| **Schema validation** | Repo provides an ajv script; CI/contributors can run locally; passing ≠ all business semantics are valid (e.g. FK target existence is enforced at runtime) |

The repo **does not yet** embed a `schemaVersion` field inside JSON; compatibility policy is governed by this document + Git history of the schema file. When an explicit version number is introduced, the additive-only rule still applies.

## Top-level structure

`ensureProjectJSON` (frontend) and the backend default skeleton ensure that opening a project always has at least these three top-level keys:

```json
{
  "modules": [],
  "profile": { "defaultFields": [] },
  "dataTypeDomains": { "datatype": [], "database": [] }
}
```

| Key | Type | Meaning |
|---|---|---|
| `modules` | `Module[]` | Model list: entities, associations, canvas layout |
| `profile` | `object` | Project-level config (default fields, default datasource binding, etc.) |
| `dataTypeDomains` | `object` | Logical types and database dialect / DDL templates |

Full skeleton reference: `frontend/src/utils/defaultData.json`. Public demo / “Start from example” canonical sample: [`schema/examples/demo.projectjson.json`](https://github.com/erdonline/erdonline/blob/main/schema/examples/demo.projectjson.json) (RBAC demo; synced to `db/init/08_public_demo.sql` and frontend via `node scripts/sync-demo-projectjson.mjs`; `profile.defaultFields` normatively empty array).

## modules / entities / fields / associations

### Module

| Field | Type | Description |
|---|---|---|
| `name` | string | Module logical key (required) |
| `chnname` | string | Display name |
| `entities` | `Entity[]` | Table list (required array) |
| `associations` | `Association[]` | Inter-table associations |
| `graphCanvas` | object | **Legacy** main diagram layout; **entities are authoritative in `entities`; this stores coordinates only** (ADR-0001). New write paths use `diagrams` (ADR-0017) |
| `diagrams` | `Diagram[]` | **Optional** multi-diagram views (ADR-0017); when absent, frontend lazily migrates `graphCanvas` → `diagrams[0]` |

`graphCanvas.nodes[]`: `{ id, title?, x, y }` (`id` usually equals entity `title`).  
`graphCanvas.edges[]`: optional; runtime may expose `source` / `target` (edge source of truth remains `associations`).

### Diagram (`modules[].diagrams[]`, ADR-0017)

Multiple “views” of the same module schema: entities/associations exist once; diagrams store layout and optional filtered subsets only.

```json
{
  "id": "main",
  "name": "Main relation diagram",
  "includeEntities": ["AUTH_USER", "AUTH_ROLE"],
  "layout": { "nodes": [{ "id": "AUTH_USER", "x": 0, "y": 0 }] },
  "groups": []
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique within module |
| `name` | string | Display name |
| `includeEntities` | `string[]` | Optional; default = all module entities |
| `layout.nodes` | `{ id, x, y }[]` | Coordinates for this diagram |
| `groups` | `Frame[]` | Optional visual frames in diagram (ADR-0017 Phase 2b) |

#### Frame (`diagrams[].groups[]`)

Visual grouping rectangle; **explicit member list**, no RF parent reparenting. When dragging a frame, frontend translates member absolute coordinates in `layout.nodes` by the same Δ; selected frames can resize `w`/`h`.

```json
{
  "id": "f_abc",
  "name": "Auth domain",
  "color": "rgba(47, 143, 123, 0.10)",
  "x": 40,
  "y": 40,
  "w": 480,
  "h": 320,
  "memberEntityIds": ["AUTH_USER", "AUTH_ROLE"]
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique within diagram |
| `name` | string | Display name |
| `color` | string | Optional background color |
| `x` / `y` / `w` / `h` | number | Absolute canvas coordinates and size (updated via NodeResizer / “fit members”) |
| `memberEntityIds` | `string[]` | Member entity `title` values; frontend syncs on rename/delete; drag in/out of frame adds/removes |

Compatibility: projects without `diagrams` behave unchanged; read path `getActiveDiagram(module)` virtual-migrates, write path materializes and **writes only `diagrams`** (no dual-write drift with `graphCanvas`).

### Entity

| Field | Type | Description |
|---|---|---|
| `title` | string | Table name; canvas node id |
| `name` | string | Often synced with `title` |
| `chnname` | string | Chinese/display name |
| `remark` | string | Notes |
| `fields` | `Field[]` | Field list |
| `indexs` | `Index[]` | Indexes (historical spelling **indexs**, not indexes) |
| `triggers` | `Trigger[]` | Optional; table-level triggers (reverse-engineering fidelity) |

Runtime validation: at least `title` or `name` must exist, and `fields` must be an array.

### Field

Common keys (see default fields in `defaultData.json`):

`name` · `chnname` · `typeName` · `type` · `dataType` · `remark` · `pk` · `notNull` · `autoIncrement` · `relationNoShow` · `defaultValue` · `uiHint` · `addAfter` (DDL template)

- `type`: logical type code, aligned with `dataTypeDomains.datatype[].code`
- `dataType`: physical type string for current dialect (e.g. `VARCHAR(32)`)
- `defaultValue`: column default value string. Convention: string literals with single quotes (`'NEW'`); numbers as-is (`0` / `0.00`); expressions as-is (`CURRENT_TIMESTAMP` / `now()`). **Reverse-engineered** from JDBC `COLUMN_DEF` (`DefaultValueMapper`); **DBML** round-trip mapping table below

### Association

```json
{
  "relation": "1:n",
  "from": { "entity": "T_ORDER", "field": "USER_ID" },
  "to": { "entity": "T_USER", "field": "ID" },
  "constraintName": "fk_order_user",
  "deleteRule": "CASCADE",
  "updateRule": "NO ACTION"
}
```

`relation` is a cardinality string: `1:1` · `1:n` · `n:1` · `n:n` (from→to direction; canvas drag FK→PK defaults to `n:1`; historical `0,n:1` normalized to `n:1` on display). `from` / `to` `entity` is entity `title`; `field` is field `name`. Designer edge label chip can edit cardinality and write back to this field; canvas Crow's foot (IE) notation is driven by this field, not separate marker fields.

Optional additive fields (reverse-engineering fidelity; absent = not collected):

| Field | Description |
|---|---|
| `constraintName` | FK constraint name in database. Composite FKs split into multiple associations by column (ADR-0011), sharing the same name |
| `deleteRule` / `updateRule` | `CASCADE` · `SET NULL` · `SET DEFAULT` · `RESTRICT` · `NO ACTION` (Oracle usually has no update) |

- **Reverse-engineering**: JDBC `getImportedKeys` (`FK_NAME` / `DELETE_RULE` / `UPDATE_RULE`); dictionary layer MySQL `REFERENTIAL_CONSTRAINTS`, PG `referential_constraints`, SQL Server `sys.foreign_keys.*_referential_action_desc`, Oracle `ALL_CONSTRAINTS.DELETE_RULE`
- **Canvas**: edge chip opens editor — cardinality + constraint name + ON DELETE/UPDATE (`updateAssociationFkMeta` persist-on-200; same old `constraintName` split edges sync rename/rules); chip `title` / `aria-label` + `erd-edge-fk-meta`; empty rule = dialect default; empty constraint name = export generates `fk_<table>_<column>`
- **DDL export**: `json2code.renderCreateForeignKeySql` / `rebuildForeignKeyDdl` — fragment key `createForeignKey`; same `constraintName` aggregates into composite `FOREIGN KEY (…)`; missing name generates `fk_<table>_<column>`; four-database quoting differences (MySQL `` ` `` / PG·Oracle `"` / SQL Server `[]`); writes `ON DELETE` / `ON UPDATE` when rules present (**Oracle omits ON UPDATE**); export dialog custom mode can check “create foreign key statements”
- **DBML**: official Ref settings round-trip — `Ref name: a.b > c.d [delete: cascade, update: no action]` (lowercase); import fills `constraintName` / `deleteRule` / `updateRule`; **does not** write to Note
- **Not done**: `from.fields[]` / `to.fields[]` single logical FK aggregation (ADR-0011 still deferred)

### Index (`indexs[]`)

```json
{ "name": "AUTH_USER_INDEX1", "isUnique": true, "fields": ["ID", "CODE"], "filter": "(deleted_at IS NULL)" }
```

`fields[]` is a string array; elements may be **column names** or **index expression** text as-is (e.g. `"LOWER(email)"`). DBML import writes `@dbml/core` expression columns here; export writes non-pure idents as `` `expr` ``. DDL template `createIndexTemplate` joins `fields`; expressions can appear directly in `CREATE INDEX … (LOWER(email))`.

Optional **`filter`**: partial/filtered index predicate as raw string (PG `WHERE` / SQL Server `WHERE`). Omit or null when no predicate; **do not** put in `fields[]`.

**DDL write-back**: `json2code.renderCreateIndexSql` — when dialect is PostgreSQL / SQL Server and `filter` is non-empty, outputs canonical
`CREATE [UNIQUE] INDEX name ON table(cols) WHERE <filter>;`
(overrides legacy MySQL-style `ALTER TABLE … ADD INDEX` template to avoid invalid WHERE). MySQL / Oracle have no native filtered index: export ignores `filter`, joins fields per template only. Export dialog `getAllDataSQLByFilter` picks template row by selected dialect `code` (not only `defaultDatabase`).

**DBML**: `@dbml/core` 9.x index settings allow only `name` / `note` / `type` / `unique` / `pk`, **rejects** `where:`. This product’s round-trip convention: export writes `note: 'filter: <pred>'`, import `filterFromDbmlIndexNote` recognizes that prefix and fills `indexs[].filter`.

**Designer**: table design index tab JExcel “Field/Expression*” is **text cells** (not column-name-only dropdown); cells use semicolon-separated segments (e.g. `id;LOWER(email)`), persisted split back to `fields[]`; “Filter condition” text column reads/writes `filter`; `updateEntityIndex` persist-on-200.

**Reverse-engineering**:
- PostgreSQL: `pg_catalog` + `unnest(indkey)`; when `indkey=0`, writes expression from `pg_get_indexdef(indexrelid, ord, true)` as-is; partial index `pg_get_expr(indpred, indrelid)` → `filter`
- MySQL 8+: `INFORMATION_SCHEMA.STATISTICS`, when `COLUMN_NAME` empty reads `EXPRESSION`; no such column (MariaDB / older) falls back to column-name-only, soft-skips failed key positions (no native filtered index → no `filter`)
- Oracle: `ALL_IND_COLUMNS` + `ALL_IND_EXPRESSIONS`; when `COLUMN_EXPRESSION` present, writes preferentially (overrides `SYS_NC$`); without view permission falls back to column-name-only (no function-based filter equivalent → no `filter`)
- SQL Server: no native expression indexes; computed column key positions written via `sys.computed_columns.definition` (column name as fallback); filtered index `filter_definition` → `filter`
- Generic JDBC `getIndexInfo`: still mostly column names; empty `COLUMN_NAME` soft-skips that key position
- Dictionary mapper: `EXPRESSION` preferred over `COLUMN_NAME`; `FILTER`/`FILTER_DEFINITION` → `filter` (written on first row of composite index); no case folding for expressions/predicates (`NameCaseAdjuster` applies to pure idents only)

### Trigger (`triggers[]`, optional)

```json
{
  "name": "trg_user_bu",
  "timing": "BEFORE",
  "event": "UPDATE",
  "orientation": "ROW",
  "statement": "SET NEW.updated_at = NOW()",
  "ddl": "CREATE TRIGGER `trg_user_bu` BEFORE UPDATE ON `t_user` FOR EACH ROW\nSET NEW.updated_at = NOW()"
}
```

- **Reverse-engineering**: MySQL/MariaDB from `INFORMATION_SCHEMA.TRIGGERS`, PostgreSQL from `information_schema.triggers`, SQL Server from `sys.triggers`/`sys.trigger_events`+`OBJECT_DEFINITION`, Oracle from `ALL_TRIGGERS`+`ALL_SOURCE` (`supportsTrigger`); name + timing/event + body written to table above; `ddl` prefers raw dictionary source (`OBJECT_DEFINITION` / `CREATE`/`TRIGGER` text), otherwise can rebuild CREATE (not byte-level `SHOW CREATE TRIGGER` / `pg_get_triggerdef` / `DBMS_METADATA` clone).
- **Designer**: table design tab “Triggers” (`data-testid=table-trigger-edit`) list + edit + view DDL + add/delete; `updateEntityTriggers` via `saveProject` persist-on-200 writes back to this array.
- **DDL export**: `getAllDataSQL` / `getAllDataSQLByFilter` fragment key `createTrigger`; prefers writing back `ddl`, otherwise rebuilds by selected dialect (MySQL backticks / PG double quotes / SQL Server brackets+`AS` / Oracle `CREATE OR REPLACE`); skips non-database dialects like JAVA. Export dialog custom mode can check “create trigger statements”.
- **DBML**: not mapped (see “Not mapped” below; no valid syntax home, forbidden in Note).

## profile

| Field | Description |
|---|---|
| `defaultFields` | Default `Field[]` injected when creating new entities |
| `defaultDataSourceId` | Project default datasource id (`data_sources.id`) |
| `dbs` | **Legacy slot**; should be `[]` on save/share |
| `defaultFieldsType` / `sqlConfig` / `wordTemplateConfig` | Config extensions (shape follows UI) |
| `tableLimit` / `tableNameFormat` | Table count limit and naming format |
| `erdPassword` | Historical local encryption passphrase (**not** JDBC password) |

### Secret discipline (mandatory)

Connection secrets (JDBC `url` / `username` / `password` / `driver`) have **one source of truth**: table `data_sources` + API `/ncnb/dataSources`, **never written to projectJSON** ([ADR-0008](/docs/adr/datasource-isolation)).

- Opening old projects: strip `profile.dbs.*.properties`
- Before save: force-clear secret fields; empty `dbs`
- Read-only share: anonymous response clears `dbs` (see [security-model](/docs/security-model))
- Version snapshots / export / fork: likewise must not reintroduce JDBC secrets

## dataTypeDomains

```json
{
  "datatype": [
    {
      "name": "Identifier",
      "code": "IdOrKey",
      "apply": {
        "MYSQL": { "type": "VARCHAR(32)" },
        "JAVA": { "type": "String" }
      }
    }
  ],
  "database": [
    {
      "code": "MYSQL",
      "defaultDatabase": true,
      "createTableTemplate": "…"
    }
  ]
}
```

- `datatype[]`: logical types; `apply` maps by dialect code to `{ type }`
- `database[]`: dialects and doT-style DDL/code templates (`createTableTemplate`, `createIndexTemplate`, etc.)
- **Enums (DBML)**: `kind: "enum"` + `values: [{ name, chnname? }]` (additive fields; schema `additionalProperties` allows). Written by DBML `Enum` import; export restores as `Enum` block. Built-in non-enum types have no `kind`/`values`. **UI**: settings page `/design/table/setting/dataType` can create/edit enum values; save rebuilds `apply` from `values[].name` (aligned with `buildEnumApply`). **Logical type apply**: same page Modal “Dialect mapping” dense table edits physical types per `database[]` (preserving extra dialect keys in existing `apply`), writes `apply[code].type`; no manual JSON editing. **Selection**: canvas field type `<select>` and table design/default field JExcel dropdown grouped by “logical type | enum”; after selection field `type` writes enum `code` (browse badge “enum”)

## Machine validation

```bash
# Repo root: positive examples must pass, negative must fail (non-zero exit)
node scripts/validate-projectjson.mjs

# Validate any file
node scripts/validate-projectjson.mjs path/to/your.projectjson.json

# Frontend package script (equivalent)
cd frontend && yarn validate:projectjson
```

First run installs `ajv@8` under `schema/` (see `schema/package.json`). Re-run after schema or example changes.

### Fetch from the public API, then validate (CI) {#ci-fetch-then-lint}

Do **not** start MCP on GitHub Actions runners. Use a read-only PAT (`projects:read`), extract the inner model, then run the script. The envelope is `{ code, data: { projectJson } }` (Jackson field `projectJson`, not `projectJSON`):

```bash
export ERD_API_URL=https://erdonline-production.up.railway.app   # self-host: your API root
curl -fsS -H "Authorization: Bearer $ERD_PAT" \
  "$ERD_API_URL/api/v1/projects/$ERD_PROJECT_ID" \
  | jq '.data.projectJson' > /tmp/ci-project.json
node scripts/validate-projectjson.mjs /tmp/ci-project.json
```

Store the PAT in a CI secret; do not commit it. The public Demo cannot mint a PAT. How-to article: [`ci-rest-projectjson-schema-lint`](https://github.com/erdonline/erdonline/blob/main/content/articles/ci-rest-projectjson-schema-lint.md). Auth and scopes: [API and MCP](/docs/guide/api-and-mcp).

## Example (public demo)

Canonical sample isomorphic to `/demo` → `/s/public-demo` and logged-in “Start from example”: [`schema/examples/demo.projectjson.json`](https://github.com/erdonline/erdonline/blob/main/schema/examples/demo.projectjson.json).

| Table | Display name (demo) | Role |
|---|---|---|
| `sys_user` | User | Subject |
| `sys_role` | Role | RBAC |
| `sys_permission` | Permission | RBAC |
| `sys_user_role` | User–role | n:m junction |
| `sys_role_permission` | Role–permission | n:m junction |
| `sys_session` | Login session | Auth state |
| `sys_audit_log` | Audit log | Audit trail |
| `biz_order` | Business order | Business slice (references `user_id`) |

Module name `AUTHZ` / display name “Feature authz”; includes `indexs`, `defaultValue`, and `diagrams[]` dual diagrams (“Authz core” TB layered / “Vertical view” LR layered, same schema two orientations) + Frame groups (associations & detail / core entities). Coordinates batch-generated by `frontend/scripts/gen-demo-layout.ts` calling product dagre layering (`graphLayout.ts`); Frame bounding boxes baked from layout rank clusters via `computeFrameBoundsFromNodes`—**no manual x/y**. Change requirements by editing script and re-running; `graphCanvas` aligned with main diagram layout. Ready to share screenshots (ADR-0016 / ADR-0017).

## DBML interchange (import / export)

Designer “Import → Import DBML” parses [DBML](https://dbml.dbdiagram.io/) text into a `projectJSON` module merged into current project (`@dbml/core`, frontend lazy-loaded). “Export → Export DBML” generates `.dbml` from selected modules (pure function, local download / copy).

| DBML | projectJSON |
|---|---|
| `Table` | `modules[].entities[]` (`title`/`name` = table name) |
| Column | `fields[]` (physical type ↔ logical `type` code thin bidirectional mapping; unknown import falls back to `String`, export to `varchar`) |
| `[default: …]` | `fields[].defaultValue` (string→`'…'`; number→numeric string; expression→as-is like `now()`; export restores string/number/expression separately) |
| `Note` / `[note: …]` | **Only** interchange with `chnname` (table/column display name) |
| `Ref` / column `[ref: …]` | `associations[]` (`1:1` / `1:n` / `n:n`; `from`=FK-holding side) |
| `indexes { … }` | `entities[].indexs[]` (`name` / `isUnique` / `fields[]`; skip pk indexes; column names and expressions both in `fields[]`, export expressions with backticks) |
| `Enum` / value `[note: …]` | `dataTypeDomains.datatype[]`: `kind: "enum"`, `code`/`name`=enum name, `values[]`=`{ name, chnname? }`; column type writes `fields[].type = code`; `apply.MYSQL`=`ENUM('a','b')`, `PostgreSQL`=type name, other dialects string fallback |
| `Project` name / Note | module `name` / `chnname` (default `DBML` / `DBML import`) |

**Not mapped**: triggers, table-level checks, composite FK; Enum **level** Note (`@dbml/core` 9.x does not parse `[note]` / `Note:` on Enum, only value-level note ↔ `values[].chnname`). Import merge path reuses `importModuleAndProfile` (same as ERD/PdMan reverse-engineering, includes `fixModules`; datatype union by `code`).

**Trigger gap (measured conclusion)**: `@dbml/core` 9.x parser **does not accept** `Trigger { … }` blocks (holistics/dbml#836 proposal not merged); table/column `Note` **only** interchanges with `chnname`—forbidden to write `triggers[]`/`ddl` into Note (pollutes display-name round-trip and is not valid DBML semantics). Bidirectional interchange waits for official block stability or portable extension. **DDL export is closed-loop** (`createTrigger` fragment).

## Out of scope (this spec does not cover)

- `configJSON` (export/sync preferences, separate from model source of truth)
- Public REST/MCP payload wrapping (ADR-0013)
- Composite FK `fields[]` semantic extension (ADR-0011 still deferred; unblocking = FE multi-field edge protocol then amend spec). Constraint name / referential actions covered under Association optional fields
