# How to reverse-engineer a live database

Database already running, ER diagram missing? Connect with a **read-only** account, pull selected tables onto the canvas, and save a “source of truth” baseline.

> **Goal**: Connect MySQL / PostgreSQL / Oracle / SQL Server and import selected tables.  
> **Prereq**: Signed-in project that can configure datasources; prefer a **read-only** DB user.  
> **Note**: The free Demo / public share **cannot** reach your private DB — [self-host](./quick-self-host.md) or use a signed-in instance.

## Steps

1. Open the project → menu → **Reverse engineer datasource** (empty state may show **Reverse from datasource**).  
2. **Select or create a datasource**, fill connection details, test connectivity.  
3. Pick schemas / tables (for large DBs, filter by prefix or allow-list first).  
4. Run the parse; wait for completion.  
5. (Strongly recommended) [Save a version](./save-version-and-diff.md) as the reverse baseline.

## What success looks like

- Selected tables appear; FKs show as relations within supported scope.  
- Comments / indexes are carried over per dialect capability.  
- Connection passwords **do not** appear in exported model JSON.

## Troubleshooting

| Symptom | Try |
|---|---|
| Connection failed | Host/port/firewall; in Compose networks use the service name, not `localhost` for the host machine |
| Permission errors | Use a read-only account with dictionary privileges |
| Too many tables / timeouts | Narrow selection; reverse by schema or prefix batches |
| Missing indexes or FKs | Read parse hints; some dialect features are skipped, not invented |
| No reverse entry on Demo | Expected — [self-host](./quick-self-host.md) or a signed-in instance |

## Next

- File-only / no JDBC: [Import DBML](./import-dbml.md)  
- Secrets isolation: [Security model](/docs/security-model)  
- [Start here](./intro.md)
