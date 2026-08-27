# Five-minute self-host

Want accounts and data on your machine or intranet? Bring the stack up with Docker Compose, then smoke-test **Save version**.

Not sure yet? Try the **[live Demo](https://www.erdonline.com/demo)** (no login) or **[Compare](https://www.erdonline.com/compare)** first.

> **Goal**: Run ERD Online locally or on a private network.  
> **Prereq**: Docker + Compose; 2C4G recommended. Full options: [Deployment](/docs/deployment).

## Steps

```bash
git clone https://github.com/erdonline/erdonline.git
cd erdonline
docker compose pull
docker compose up -d
```

1. Wait until healthy: `docker compose ps`; on failure `docker compose logs -f backend`.  
2. Open the frontend mapped port in a browser (default **8000**—follow your compose file).  
3. **Register / sign in** → **create a project** → smoke-test with [Save a version and view the diff](./save-version-and-diff.md).

## What success looks like

- `docker compose ps` shows mysql / redis / backend / frontend running (or equivalent healthy).  
- The browser reaches login or the workbench—not a gateway 502.  
- A new project opens the designer and can **Save version**.

## Troubleshooting

| Symptom | Try |
|---|---|
| Port in use | Remap compose ports, or stop whatever holds 8000/9502 |
| Backend restart loop | Backend logs: often waiting on MySQL or wrong password/db name |
| Image pull failed | Network access to GHCR; or build locally per deployment docs |
| Default passwords in prod | Change them; use read-only DB users for reverse engineering |
| Need Agent / MCP | MCP is **not** in the default compose. Self-host: set `ERD_API_URL` to `http://127.0.0.1:9502`, then [API and MCP](./api-and-mcp.md). Pick prompt `suggest-erd-version`. `create_version` API 200 is **not** human approval. The public Demo is **not** a PAT |

## Next

- Deeper topologies & cloud: [Deployment](/docs/deployment)  
- Let Cursor read the local diagram, then suggest a version: [MCP guide](./api-and-mcp.md) — prompt `suggest-erd-version`; `ERD_API_URL=http://127.0.0.1:9502`  
- Bring models in: [Import DBML](./import-dbml.md) · [Reverse engineer](./reverse-engineer.md)  
- [Start here](./intro.md)
