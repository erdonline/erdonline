# ADR-0008: Datasource isolation from projectJSON

- Status: Accepted (2026-08-02)
- Decision makers: Project maintainers

## Context

Legacy implementation wrote JDBC connections (url/username/password) into `projectJSON.profile.dbs`, causing: version snapshots/shares/exports carrying secrets; conflict with global `/ncnb/dataSources`.

## Decision

1. **Single source of truth for connections**: table `data_sources` + API `/ncnb/dataSources`; UI entry is database config page (`/databaseConfig`) and in-designer datasource settings (same API).
2. **`profile.dbs` stores no DB secrets**: no longer write `properties` (url/username/password/driver). Strip on legacy load; force-clear secrets before save.
3. **Project keeps binding only**: `profile.defaultDataSourceId` = current project default datasource id (maps to `data_sources.id`).
4. **Runtime resolution**: connection params from in-memory dataSources list (versionStore.dbs) by id; without JDBC, snapshot channel still works (`SNAPSHOT_DB`).

## Consequences

- Positive: share/version JSON no longer naturally contains passwords; config separated from model lifecycle
- Migration: on open legacy project strip `profile.dbs.*.properties`; if `defaultDB` exists backfill `defaultDataSourceId`
- UI: designer "Export DDL" dropdown must `refreshDataSources()` (`/ncnb/dataSources`), must not read `profile.dbs`
- Follow-up: on ERD import do not merge counterparty `profile.dbs` secrets; optional one-click "import to dataSources"
