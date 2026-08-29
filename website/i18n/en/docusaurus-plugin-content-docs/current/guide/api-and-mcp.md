---
title: Let Cursor / Claude / Cline read your ER diagram via MCP
description: Copy-paste the MCP config and a PAT so Cursor, Claude, Cline, Windsurf and other MCP clients read the same ERD projectJSON. Humans still diff and approve versions. No one-shot AI diagram generator.
---

Want Cursor or Claude to read the ER diagram you are editing? Use authenticated REST / MCP to read/write the **same** projectJSON the designer uses. A share-link token is not an API key.

> **30-second goal**: mint a PAT → paste MCP config → pick prompt `suggest-erd-version` in Cursor (or have the agent call `create_version`).  
> **Prereq**: a signed-in instance ([self-host](./quick-self-host.md) or [www.erdonline.com](https://www.erdonline.com/)); format in [data-format](/docs/data-format).  
> **Not this**: one-shot “generate an ERD”, ChatSQL; writes must be reviewed in a version diff. `create_version` API 200 is not human approval.

## Supported MCP clients

Any client that supports the Model Context Protocol can use the same `mcpServers.erdonline` block to read and write ERD projectJSON. Common clients and their config locations:

| Client | Config location | Notes |
|---|---|---|
| **Cursor** | `~/.cursor/mcp.json` | [Official install-links](https://cursor.com/docs/mcp/install-links); one-click page: [erdonline.com/cursor-mcp](https://www.erdonline.com/cursor-mcp/) |
| **Claude Desktop** | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) / `%APPDATA%/Claude/claude_desktop_config.json` (Windows) | Same JSON shape as Cursor |
| **Claude Code** | `claude config set mcpServers '{...}'` or `~/.claude/config.json` | Terminal agent; set `ERD_PAT` in env or file |
| **Cline** | VS Code settings `mcp.marketplace` or `cline.mcp.json` | Paste the `mcpServers` JSON into the client |
| **Roo Code** | VS Code settings `roo.mcpServers` | Same shape as Cline |
| **Windsurf** | `~/.windsurf/mcp.json` (or Cascade Settings MCP panel) | Codeium; same fields as Cursor |
| **Glama** | Hosted registry [glama.ai/mcp/servers](https://glama.ai/mcp/servers) | `tools/list` introspection works without PAT; writes still need PAT |
| **5ire / Smithery / others** | Paste `command` / `args` / `env` into their MCP settings | Any stdio MCP client works |

**Same `mcp.json` everywhere**: the Cursor example below is also the snippet to paste into the other clients above.

## Connect Cursor in 30 seconds

1. After sign-in, open **Account settings → Personal access tokens**: [mint a PAT](https://www.erdonline.com/account/settings?selectKey=personalAccessTokens). Read-only is enough to start; the plaintext is shown once, **and the success dialog includes a PAT-filled `mcp.json` you can copy**. The public Demo is a read-only share—**not** a PAT. You need your own project.

<img src="/img/guide/mcp-pat-reveal.webp" alt="PAT plaintext is shown once; the dialog also copies mcp.json" width="464" height="336" loading="eager" fetchpriority="high" />

2. After minting a PAT, [Add to Cursor](https://www.erdonline.com/cursor-mcp/) (official [install-links](https://cursor.com/docs/mcp/install-links); protocol `cursor://anysphere.cursor-deeplink/mcp/install`). One-click install does **not** embed the PAT; paste the filled `mcp.json` from the copy box, or replace the placeholder after install.

Or paste this into Cursor user-level `~/.cursor/mcp.json` (Claude Desktop is the same shape). Replace `erd_pat_…` with your PAT (the dialog already fills it). `npx -y --package … erd-mcp` fetches the MCP tarball from GitHub Releases — **no** local clone.

```json
{
  "mcpServers": {
    "erdonline": {
      "command": "npx",
      "args": [
        "-y",
        "--package",
        "https://github.com/erdonline/erdonline/releases/download/mcp-v0.1.0/erdonline-mcp-0.1.0.tgz",
        "erd-mcp"
      ],
      "env": {
        "ERD_API_URL": "https://erdonline-production.up.railway.app",
        "ERD_PAT": "erd_pat_…"
      }
    }
  }
}
```

<img src="/img/guide/mcp-json.webp" alt="Cursor mcp.json snippet (npx tarball; replace the PAT)" width="512" height="196" loading="lazy" />

For local self-host, set `ERD_API_URL` to `http://127.0.0.1:9502`. MCP is **not** in the Docker image.

3. Reload Cursor MCP and ask: `List my ERD projects`. You should see `list_projects`. Then: `Read projectJSON for project X`. If the list is empty, create **your own** project in the designer first (the official Demo is not a PAT). To change the model, pick prompt **`suggest-erd-version`** in Cursor, or have the agent call `create_version`. If the agent still says `erd_pat_…`, paste the minted token into `mcp.json` — the one-click install link never embeds a live PAT. Do not ask the agent to generate a new ER diagram from a sentence.

To run from source: `cd mcp && yarn install && yarn build`, then `node /ABS/PATH/to/erdonline/mcp/dist/index.js`. During development you can use `npx tsx mcp/src/index.ts`.

## What you get

- REST: project list / detail (member ACL; DB secrets never appear in model JSON)
- Versions: read history; create versions with write scope
- MCP: map those capabilities to agent tools (stdio or HTTP)

### Tools

| Tool | Role | Scope |
|---|---|---|
| `list_projects` / `get_project` / `get_project_schema` | List projects, read projectJSON | `projects:read` |
| `list_versions` / `get_version` | Version history | `versions:read` |
| `create_version` | Submit a version (human diffs next) | `versions:write` |
| `update_project` / `put_project_json` | Patch metadata / replace JSON | `projects:write` |
| `list_templates` / `get_template` / `install_template` | Template catalog | read / `projects:write` |

<img src="/img/guide/mcp-agent-tools.webp" alt="MCP tools the agent can call" width="703" height="393" loading="lazy" />

No `publish_template`, no PAT ratings. See [`mcp/README.md`](https://github.com/erdonline/erdonline/blob/main/mcp/README.md).

## Let the agent suggest a version

When minting the PAT, include `versions:write`. Pick prompt **`suggest-erd-version`** in Cursor, or ask the agent to call `create_version` with a note like “agent suggestion”.

`create_version` returning **API 200 is not human approval**. You must open the designer version diff and accept or roll back. Do not let the agent silently `put_project_json` over the workspace.

## Streamable HTTP (optional)

```bash
export ERD_API_URL=http://127.0.0.1:9502
export ERD_PAT=erd_pat_…
cd mcp && yarn start -- --http
# → http://127.0.0.1:3920/mcp
```

## What success looks like

- Read calls return 200 and a full model (**no** DB password fields).
- After writing a version, it appears in the designer version list.
- The MCP client lists tools and succeeds on read-only tools.

## Troubleshooting

| Symptom | Try |
|---|---|
| 401 / 403 | Expired PAT, insufficient scope, or wrong environment; remint at [Personal access tokens](https://www.erdonline.com/account/settings?selectKey=personalAccessTokens) |
| Agent says Missing ERD_PAT / still `erd_pat_…` | The placeholder is not a token. Paste the minted plaintext into `mcp.json` `ERD_PAT`. The one-click install link **never** puts a PAT in the URL |
| `list_projects` is empty | Create your own project in the designer, then ask again. The official Demo share is **not** a PAT |
| Agent drew a new ER diagram | Tell it to `list_projects` then `get_project_schema` — read/write your existing projectJSON; do not generate a diagram from natural language |
| `create_version` already 200 | Still open the version diff and confirm or roll back. **API 200 is not human approval** |
| Share link works but API fails | Share read-only tokens are **not** API credentials |
| MCP won’t connect | MCP process must be started separately; token/path must match docs |
| Compose is up but no MCP | Expected; start MCP from `mcp/` |
| Changing model schema meaning | Additive-only rules; see [data-format](/docs/data-format) |
| Lint the model in CI | Do **not** start MCP on the runner. Fetch `projectJson` over REST, then `node scripts/validate-projectjson.mjs`; see [data-format · Fetch from the public API](/docs/data-format#ci-fetch-then-lint) |

## Next

- [projectJSON data format](/docs/data-format) (includes CI fetch-then-lint)
- [Security model](/docs/security-model)
- [Start here](/docs/guide/intro)
