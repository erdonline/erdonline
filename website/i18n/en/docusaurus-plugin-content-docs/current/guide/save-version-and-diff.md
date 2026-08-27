# How to save a version and view the diff

You just added a column. Tomorrow a teammate asks what last week’s schema looked like—this guide walks **change → save version → diff**.

> **Goal**: Edit a table → **Save version** → compare two versions.  
> **Prereq**: A browser and a **writable** project (see Demo note).

## Demo users: do this first

The public [Demo](https://www.erdonline.com/demo) is a **read-only share**. You can view the diagram; you cannot save versions there.

1. Open the [Demo](https://www.erdonline.com/demo) and confirm the example diagram loads.  
2. Click **Copy to my project** (you may be asked to **sign in / register**).  
3. Once you are in an **editable** designer, continue below.

Self-hosted or existing account projects: open that project and skip this section.

## Steps

1. Open the project designer and the **relationship diagram** canvas.  
2. Select a table; **add or edit** a field (e.g. `nickname` as `VARCHAR`).  
3. Click **Save version** in the top bar, enter a version id (e.g. `1.0.1`) and a note, confirm.  
4. Open **Version management** (version list / panel).  
5. Pick two versions and open the **diff** view.

## What success looks like

- The version list shows your new snapshot (id + time).  
- The diff distinguishes table / column / relation changes.  
- Your new field is still on the canvas; dirty/clean status vs latest version matches expectation.

## Troubleshooting

| Symptom | Try |
|---|---|
| No “Save version” on Demo | Still on the read-only share → **Copy to my project** first |
| Can’t find “Save version” | Confirm you are inside the project designer; check the top bar |
| Save succeeded but list empty | Refresh the list; retry if the network failed |
| Diff says “no changes” | Same version twice, or truly no structural delta |
| Bookmark save with no schema change | Allowed, but empty diffs help little; save after real edits |
| Need to restore | Confirm prompts before rollback / sync to a historical version |
| Agent just called `create_version` | Open the same version **diff**, accept or roll back. Pick prompt `suggest-erd-version`. API 200 is **not** human approval. The public Demo is **not** a PAT |

## Next

- Bring models in: [Import DBML](./import-dbml.md) · [Reverse engineer](./reverse-engineer.md)  
- Let Cursor suggest a version (you still diff): [MCP guide](./api-and-mcp.md) — prompt `suggest-erd-version`  
- Team apply constraints: [Roles and approval](./roles-and-approval.md)  
- Overview: [Start here](./intro.md)
