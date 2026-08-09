# How to import DBML

Have a `.dbml` export from dbdiagram (or another tool)? Bring tables and refs onto the canvas, then save a baseline version.

> **Goal**: Import valid DBML so tables and relations appear in the designer.  
> **Prereq**: DBML text or file; an **editable** project (read-only [Demo](https://www.erdonline.com/demo) needs **Copy to my project** first).

## Steps

1. **Export DBML** from the source tool (copy text or download `.dbml`).  
2. Open an **editable** ERD Online designer.  
3. Choose **Import DBML** from the empty-state CTA or project menu.  
4. Paste text or pick a file; run parse / import.  
5. Check the canvas: tables should be visible; `Ref`s should draw relations.  
6. (Strongly recommended) [Save a version](./save-version-and-diff.md) as the import baseline.

## What success looks like

- Imported tables appear; you can zoom, pan, and select fields.  
- Skipped constructs are **called out** (not silently dropped as “full success”).  
- Similar table prefixes may suggest grouping Frames—accept or ignore.

## Troubleshooting

| Symptom | Try |
|---|---|
| Parse / syntax error | Re-export from the source; check truncation / non-DBML paste |
| Missing tables or refs | Read skip hints; triggers and some constructs may not map |
| Blank canvas or off-screen tables | Fit view / zoom; confirm parsed table count > 0 |
| Want to overwrite an existing model | [Save a version](./save-version-and-diff.md) first for rollback |
| Can’t find import on read-only Demo | **Copy to my project**, or [self-host](./quick-self-host.md) |

## Next

- [Save a version and view the diff](./save-version-and-diff.md)  
- [Reverse engineer](./reverse-engineer.md) (when you have a live DB)  
- [API and MCP](./api-and-mcp.md) (when scripts need the model)
