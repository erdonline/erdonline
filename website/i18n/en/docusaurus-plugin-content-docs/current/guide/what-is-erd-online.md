# What is ERD Online

If you want something that remembers schema changes like Git and edits like a canvas, you are in the right place.

**In one line**: open-source (MIT) database modeling — **versions, diffs, self-hosting**; or try the free [Demo](https://www.erdonline.com/demo) first.

## A good fit if you…

- Need a design-time trail of who changed which fields, and when  
- Want to move from dbdiagram / a live DB into a collaborative, self-hostable tool  
- Want open `projectJSON` / API / MCP so scripts or agents share one source of truth  

## Probably not if you…

- Only need a static ER screenshot → **draw.io** or another drawing tool may be lighter  
- Only care about applied DDL history → keep Flyway (etc.); we cover **design-time** tracing  
- Need full enterprise IAM / SSO out of the box → we offer **project-level** roles & approval, not a full IAM suite  

## Capabilities you will use often

| Capability | You get |
|---|---|
| Relationship canvas | Visual edit of tables, columns, FKs |
| Versions & diffs | Snapshots; compare tables / columns / relations |
| DBML import/export | Interop with tools like dbdiagram |
| Reverse engineering | MySQL / PostgreSQL / Oracle / SQL Server |
| Collaboration & access | Shared projects; roles & SQL approval |
| Self-host | `docker compose up -d` |

## What you see on first Demo open

- An example project (e.g. RBAC / business tables) with tables and relations  
- The top bar may say **Read-only**: this is a shared demo, not an empty landing shell  
- To edit and save versions: click **Copy to my project** (or **Sign in / Register** first)  

If the page spins forever or stays blank, see troubleshooting below.

## FAQ

| Symptom | Try |
|---|---|
| Demo won’t open / endless spinner | Retry network; confirm [www.erdonline.com/demo](https://www.erdonline.com/demo) |
| Want to edit but see read-only | **Copy to my project** or sign in, then open the designer |
| Want to connect your own DB | Public demo/share **cannot** reach private DBs → [Quick self-host](./quick-self-host.md) |
| Want to compare with draw.io / dbdiagram | [Compare page](https://www.erdonline.com/compare) (includes an FK-semantics row) |

## Next steps

1. [Save a version and view the diff](./save-version-and-diff.md) — core loop (recommended)  
2. [Import DBML](./import-dbml.md) or [Reverse engineer](./reverse-engineer.md)  
3. [Quick self-host](./quick-self-host.md)  

Maintainer positioning essay: [Vision](/docs/vision)
