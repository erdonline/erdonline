# ADR-0032: Field library (data_dict) — platform / team / personal

- Status: **✅ Accepted** (MVP 2026-08-09)
- Decision makers: Project maintainers
- Prerequisites: [ADR-0012](./0012-ai-era-data-structure-platform.md) projectJSON fact source; [ADR-0028](./0028-official-template-catalog.md) orthogonal to catalog; [ADR-0013](./0013-public-api-mcp.md) MCP write boundary

## Context

The designer needs reusable field/enum snippets: platform seeds (gender, status, audit field groups), team shared libraries, personal favorites. Historical `DataDictController` + `tree()` filtered only by `creator=system|current user`; table `data_dict` was not in Flyway; frontend `/design/dataDomain` deleted (W2), zero `/dataDict` calls.

Orthogonal to **catalog** (whole-project templates), **sys_dict** (system config), **dataTypeDomains** (in-project logical types), **profile.defaultFields** (table defaults): field library is "snippet copy-on-apply", not live cascade.

## Decision (locked)

| Topic | Decision |
|---|---|
| Table name | Keep `data_dict` |
| Granularity | `scope_type`: `platform` \| `group` \| `user`; `scope_id`: team project id (group) or user id (user); platform `scope_id` is NULL |
| "Tenant" | = team project (`type=2` project.id); **no** new SaaS org/tenant table |
| Storage | `dict_info` JSON: `{ fields: Field[], enums?: DatatypeSnippet[] }` |
| Apply to project | **copy-on-apply**: `POST /dataDict/{id}/apply` returns `{ fields, enums }`; frontend merges into projectJSON; fields may carry `dictRef`; **no live cascade** |
| ACL | platform read-all; group = `ProjectAcl` member read/write; user = owner read/write |
| Entry | Table design "Insert from field library" **Modal**; toolbar "Field library" → on-demand right **Drawer**; no permanent Affix |
| Library admin UI | **Full CRUD tree** (platform read-only browse; personal + team editable); settings `/design/table/setting/fieldLibrary` |
| MCP | **No** MCP field library writes (separate from ADR-0013 public write surface) |

## Consequences

- Positive: modeling reuse has single source of truth; teams can standardize fields; decoupled from projectJSON, offline edit still works; project menu "Settings" navigates to field library / type dictionary admin
- Cost: after copy, library changes do not write back to project (by design); Flyway seed maintenance for platform library
- vs catalog: catalog = whole project; data_dict = field/enum snippets

## MVP slices

| # | Deliverable | Status |
|---|---|---|
| 0 | This ADR + roadmap/data-format/product-capability-map/CHANGELOG | ✅ |
| 1 | Flyway `V25__data_dict_baseline.sql` + platform seeds | ✅ |
| 2 | Backend scope ACL + apply + unit tests | ✅ |
| 3 | FE library admin + Modal + Drawer + merge | ✅ |
| 4 | E2E: insert platform "gender" → land on table → save | ✅ |

## Explicitly out

- MCP / PAT field library writes
- Live cascade (library change auto-updates open project)
- Replace `dataTypeDomains` or `defaultFields`
- org/SaaS multi-tenant layer
