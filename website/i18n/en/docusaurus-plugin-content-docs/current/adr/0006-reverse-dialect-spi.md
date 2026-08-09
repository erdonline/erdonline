# ADR-0006: Multi-DB reverse Dialect SPI

- Status: Accepted (2026-08-01)
- Decision makers: Project maintainers

## Context

Reverse parsing long piled in `DBReverseParseCommand` `if (dbType)` branches; index/FK precision depends on JDBC drivers; multi-DB and import UX (schema pick, on-demand load) hard to extend. After surveying DBeaver / SchemaCrawler / jOOQ-meta / Apache Calcite·MetaModel: industry hot paths use dictionary SQL, JDBC only as Generic fallback; Apache libs unsuitable as ER reverse core.

## Decision

1. Introduce `com.erdonline.erd.reverse`: **ReverseDialect** SPI + **DialectCapability** + **ReverseDialectRegistry**
2. **P0 first-class** (full: table/column/PK/index, FK later): MySQL (incl. MariaDB), PostgreSQL, Oracle, SQL Server
3. **GenericJdbcReverseDialect**: any JDBC fallback (table/column/PK; index best-effort, failure non-blocking)
4. MySQL indexes via `INFORMATION_SCHEMA.STATISTICS` (aligned with DBeaver/jOOQ), not `getIndexInfo` precision; MySQL 8 functional keys read `EXPRESSION` → `indexs[].fields[]` (column fallback if missing); PostgreSQL expression keys `pg_get_indexdef` → same field
5. Do not introduce SchemaCrawler (EPL) / MetaModel / Calcite as reverse dependencies
6. Code style follows Alibaba Java Development Manual (naming, constants, try-with-resources, no raw types, etc.)

## Consequences

- Positive: per-DB extension, capability matrix drives frontend, mapping rules unit-testable
- Cost: each DB needs a maintained Dialect; precision not promised outside P0
- Shipped: `POST /connector/dbReverseMeta` + schema selection; JDBC `getImportedKeys` → `associations`
- P0 four-DB dictionary FK: MySQL `KEY_COLUMN_USAGE`; PG `referential_constraints`; SQL Server `sys.foreign_keys`; Oracle `ALL_CONSTRAINTS(R)`; JDBC fallback on failure; composite columns split into ordered edges
- Comment fidelity: `DialectCapability.supportsComment`; MySQL via JDBC `REMARKS`; PostgreSQL dictionary `obj_description` / `col_description`; SQL Server dictionary `sys.extended_properties` (`MS_Description`); Oracle dictionary `ALL_TAB_COMMENTS` / `ALL_COL_COMMENTS` → `entity.chnname` / `fields[].chnname` (JDBC fallback on failure)
- Column defaults: JDBC `COLUMN_DEF` → `fields[].defaultValue` (`DefaultValueMapper`: quote strings, numbers/expressions as-is; strip PG `::type`)
- Trigger fidelity: `DialectCapability.supportsTrigger`; MySQL/MariaDB dictionary `INFORMATION_SCHEMA.TRIGGERS`, PostgreSQL dictionary `information_schema.triggers`, SQL Server dictionary `sys.triggers`/`sys.trigger_events`+`OBJECT_DEFINITION`, Oracle dictionary `ALL_TRIGGERS`+`ALL_SOURCE` (multi-event split rows) → `entity.triggers[]` (`name` / `timing` / `event` / `statement` / rebuild or raw `ddl`); warn-skip on failure; P0 four-DB closed loop
- Expression/functional indexes: PostgreSQL `pg_get_indexdef`, MySQL 8 `STATISTICS.EXPRESSION`, Oracle `ALL_IND_EXPRESSIONS`, SQL Server `sys.computed_columns.definition` → `indexs[].fields[]` as raw strings (same slot as DBML interop); P0 four-DB closed loop; missing keys / unavailable dictionary soft-skip or column-name-only fallback
- Partial/filtered index predicates: PostgreSQL `pg_get_expr(indpred)`, SQL Server `sys.indexes.filter_definition` → `indexs[].filter` (not in `fields[]`); no MySQL/Oracle equivalent; export side PG/SQL Server DDL `WHERE` + DBML `note: 'filter: …'` (`@dbml/core` rejects official `where:`)
- Composite FK `fields[]`: see ADR-0011 (still deferred; unblocking needs FE multi-field edge protocol). Shipped additive metadata: `constraintName` / `deleteRule` / `updateRule` (same name on split edges, not aggregated); table list on-demand pagination TBD
