---
title: Let Cursor / Claude read your ER diagram via MCP
description: Copy-paste Cursor MCP config and a PAT so agents read the same ERD projectJSON. Humans still diff and approve versions. No one-shot AI diagram generator.
---

Want Cursor or Claude to read the ER diagram you are editing? Use authenticated REST / MCP to read/write the **same** projectJSON the designer uses. A share-link token is not an API key.

> **30-second goal**: mint a PAT → paste MCP config → the agent lists your projects.  
> **Prereq**: a signed-in instance ([self-host](./quick-self-host.md) or [www.erdonline.com](https://www.erdonline.com/)); format in [data-format](/docs/data-format).  
> **Not this**: one-shot “generate an ERD”, ChatSQL; writes must be reviewed in a version diff.

## Connect Cursor in 30 seconds

1. After sign-in, open **Account settings → Personal access tokens**: [mint a PAT](https://www.erdonline.com/account/settings?selectKey=personalAccessTokens). Read-only is enough to start; the plaintext is shown once, **and the success dialog includes a PAT-filled `mcp.json` you can copy**. The public Demo is a read-only share—**not** a PAT. You need your own project.

![PAT plaintext is shown once; the dialog also copies mcp.json](/img/guide/mcp-pat-reveal.png)

2. After minting a PAT, [Add to Cursor](https://cursor.com/link/mcp/install?name=erdonline&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIi0tcGFja2FnZSIsImh0dHBzOi8vZ2l0aHViLmNvbS9lcmRvbmxpbmUvZXJkb25saW5lL3JlbGVhc2VzL2Rvd25sb2FkL21jcC12MC4xLjAvZXJkb25saW5lLW1jcC0wLjEuMC50Z3oiLCJlcmQtbWNwIl0sImVudiI6eyJFUkRfQVBJX1VSTCI6Imh0dHBzOi8vZXJkb25saW5lLXByb2R1Y3Rpb24udXAucmFpbHdheS5hcHAiLCJFUkRfUEFUIjoiZXJkX3BhdF%2FigKYifX0%3D) (official [install-links](https://cursor.com/docs/mcp/install-links); protocol `cursor://anysphere.cursor-deeplink/mcp/install`). Then replace `ERD_PAT` with the plaintext from the dialog.

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

![Cursor mcp.json snippet (npx tarball; replace the PAT)](/img/guide/mcp-json.png)

For local self-host, set `ERD_API_URL` to `http://127.0.0.1:9502`. MCP is **not** in the Docker image.

3. Reload Cursor MCP and ask: `List my ERD projects`. You should see `list_projects`. Then: `Read projectJSON for project X`.

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

![MCP tools the agent can call](/img/guide/mcp-agent-tools.png)

No `publish_template`, no PAT ratings. See [`mcp/README.md`](https://github.com/erdonline/erdonline/blob/main/mcp/README.md).

## Let the agent suggest a version

When minting the PAT, include `versions:write`. Ask the agent to call `create_version` with a note like “agent suggestion”. Open the designer version list, read the diff, accept or roll back.

Do not let the agent silently `put_project_json` over the workspace—that skips human review.

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
| 401 / 403 | Expired PAT, insufficient scope, or wrong environment |
| Share link works but API fails | Share read-only tokens are **not** API credentials |
| MCP won’t connect | MCP process must be started separately; token/path must match docs |
| Compose is up but no MCP | Expected; start MCP from `mcp/` |
| Changing model schema meaning | Additive-only rules; see [data-format](/docs/data-format) |
| Lint the model in CI | Do **not** start MCP on the runner. Fetch `projectJson` over REST, then `node scripts/validate-projectjson.mjs`; see [data-format · Fetch from the public API](/docs/data-format#ci-fetch-then-lint) |

## Next

- [projectJSON data format](/docs/data-format) (includes CI fetch-then-lint)
- [Security model](/docs/security-model)
- [Start here](/docs/guide/intro)
