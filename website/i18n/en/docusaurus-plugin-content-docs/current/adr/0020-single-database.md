# ADR-0020: Single business database (drop martin / erd dual DB)

- Status: Accepted (2026-08-03)
- Decision makers: Project maintainers

## Context

Application long used two DBs on same MySQL instance: `martin` (system/auth) and `erd` (modeling metadata), dual Hikari + SqlSessionFactory routed by mapper package. Railway / remote plugin MySQL defaults one DB name (often `railway`); dual DB creation and `db/init` seeding became deployment main pain.

Historical comment said `sys_user` / `sys_role` name collision prevents merge. Audit result:

| Source | Conflicting tables | Conclusion |
|---|---|---|
| `martin` | Full `sys_user` / `sys_role` (auth source of truth) | Keep |
| Old `erd` dump | Same-name stub tables (id/username/password only) | **Zero erd mapper references**, discard on merge |

No other table name overlap; can coexist same DB.

## Decision

1. **Physically single DB**: default name `erd` (env `MYSQLDATABASE`; no `DB_ERD` / `DB_MARTIN` / `DB_NAME` fallback).
2. **`db/init` schema only**: `01_create_database.sql` + `02_tables.sql` (CREATE TABLE); no seeds, demo, privileges scripts.
3. **Seeds in Flyway**: `backend/.../db/migration/erd/` `V3+` (system baseline / new user permissions / public demo / E2E accounts); backend startup runs via `ErdFlywayConfig`.
4. **Transition keeps dual SqlSessionFactory**: `martinDataSource` and `erdDataSource` still separated by package scan, but **JDBC URL points to same `MYSQLDATABASE`**, credentials same `MYSQLUSER` / `MYSQLPASSWORD` (avoid mapper explosion this round). Single DS merge can be future ADR.
5. **Env vars**: Spring reads Railway plugin native names directly (`MYSQLHOST` / `MYSQLPORT` / `MYSQLDATABASE` / `MYSQLUSER` / `MYSQLPASSWORD`), each single placeholder, no nested fallback. Compose: MySQL container official `MYSQL_DATABASE` / `MYSQL_USER` / `MYSQL_PASSWORD`, backend injects same `MYSQL*`.

## Consequences

- Railway: Link MySQL injects `MYSQL*`; create one DB + import schema; Redeploy then Flyway seeds. No longer require `DB_MARTIN`≠`DB_ERD` two DBs, nor `DB_*` Variable Reference.
- Local existing **dual DB data volume**: must rebuild volume (`docker compose down -v` then up) or manually migrate `martin.*` tables into `erd` and set `MYSQLDATABASE=erd`.
- Production existing dual DB data: export both sides → import single business DB (discard erd stub `sys_*`) → `MYSQLDATABASE` points there → confirm `flyway_schema_history` then baseline / run missing versions as needed.
- E2E seeds enter DB via Flyway; public login still rejected by `erd.security.e2e-accounts-enabled=false`.

## Verification

- `mvn -q -DskipTests compile`
- `./scripts/railway-mysql-init.sh --dry-run` lists only `01`+`02`
- Empty volume compose first start backend Flyway ≥ V6; `SELECT COUNT(*) FROM erd.sys_user` > 0
