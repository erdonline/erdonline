# How to use the public API and MCP

Want scripts or AI agents to read/write the **same** projectJSON the designer uses? Use authenticated REST / MCP—not a share-link token as an API key.

> **Goal**: Read/write models via PAT / OAuth or MCP (auth required).  
> **Prereq**: A signed-in instance (usually [self-host](./quick-self-host.md) first); format in [data-format](/docs/data-format).

## What you get

- REST: project list / detail (member ACL; DB secrets never appear in model JSON)  
- Versions: read history; create versions with write scope  
- MCP: map those capabilities to agent tools (stdio or HTTP)

## Steps

1. Confirm the instance is up and you are a member of the target project.  
2. Create a **PAT** in-product, or configure an OAuth client (account / developer settings).  
3. Call a read-only REST endpoint with the PAT; verify projectJSON matches the designer.  
4. Enable write scopes only when needed (edit project, save versions).  
5. For MCP: follow [`mcp/README.md`](https://github.com/erdonline/erdonline/blob/main/mcp/README.md) for transport + token; load in Cursor / Claude / similar.

## What success looks like

- Read calls return 200 and a full model (**no** DB password fields).  
- After writing a version, it appears in the designer version list.  
- The MCP client lists tools and succeeds on read-only tools.

## Troubleshooting

| Symptom | Try |
|---|---|
| 401 / 403 | Expired PAT, insufficient scope, or wrong environment |
| Share link works but API fails | Share read-only tokens are **not** API credentials |
| MCP won’t connect | MCP process must be started separately; token/port must match docs |
| Compose is up but no MCP | Expected; start MCP from `mcp/` |
| Changing model schema meaning | Additive-only rules; see [data-format](/docs/data-format) |

## Next

- [projectJSON data format](/docs/data-format)  
- [Security model](/docs/security-model)  
- [Start here](./intro.md)
