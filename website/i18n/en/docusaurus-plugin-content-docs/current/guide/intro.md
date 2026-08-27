# Start here

Answer one question first: **what do you want to get done today?**

ERD Online is an open-source (MIT) database modeler: meaningful schema changes can be **versioned** with **field-level diffs**, and you can self-host. No install yet? Open the free Demo and look at a real diagram.

**Try now**: [Open Demo](https://www.erdonline.com/demo) (about 30 seconds to an example model)

---

## Path 1: Feel the product (~5 minutes)

Best if you just discovered us.

1. Positioning & boundaries → [What is ERD Online](./what-is-erd-online.md)
2. Demo → copy to your project → change a column → **Save version** → open diff → [Save a version and view the diff](./save-version-and-diff.md)

You leave with your own version record—not just a screenshot.

## Path 2: Bring an existing model in

Best if you already have dbdiagram / `.dbml`, or a live database.

| You have… | Open |
|---|---|
| `.dbml` / dbdiagram export | [Import DBML](./import-dbml.md) |
| MySQL / PostgreSQL / Oracle / SQL Server | [Reverse engineer](./reverse-engineer.md) |
| Want a comparison vs other tools | [Compare](https://www.erdonline.com/compare) |

After import, **save a version immediately** as the baseline so later diffs mean something.

## Path 3: Keep data on your side, or open APIs

Best if you need intranet deploy, approval, or agents/scripts on the same model.

| Goal | Open |
|---|---|
| Five-minute stack on your machine | [Quick self-host](./quick-self-host.md) |
| Full deploy & cloud topologies | [Deployment](/docs/deployment) |
| Roles & SQL approval | [Roles and approval](./roles-and-approval.md) |
| Scripts / agents (API · MCP) | [API and MCP](./api-and-mcp.md) |
| Let Cursor read the diagram, then suggest a version | Same guide; pick prompt `suggest-erd-version`. The public Demo is **not** a PAT. `create_version` API 200 is **not** human approval |

---

## How to read these docs (30 seconds)

- **User guides** (this sidebar section): “how do I…” — you are here
- **Self-host & open interfaces**: deploy, data format, security
- **Contribute & engineering** (collapsed by default): for PR authors, not required to start

Long-form article index: [Guide index](pathname:///blog)
