---
title: Connect your agent to ERD Online MCP with one URL
description: Mint a PAT, copy the prefilled Streamable HTTP config, and let Cursor read the same projectJSON over https://api.erdonline.com/mcp.
---

[Mint a PAT](https://www.erdonline.com/account/settings?selectKey=personalAccessTokens) first. Six MCP clients start with the same remote Streamable HTTP endpoint:

```text
https://api.erdonline.com/mcp
```

The [public six-client page](https://www.erdonline.com/cursor-mcp/) shows the URL and evidenced app-opening actions. PAT-filled installers appear only in the signed-in mint-success dialog.

> **30-second goal**: [mint a PAT](https://www.erdonline.com/account/settings?selectKey=personalAccessTokens) → keep the success dialog open → use its client-specific PAT-filled copy/install actions. Minting and installing are one flow.
> **Authentication transition**: OAuth is the next slice. The plaintext PAT appears once. The dialog may inject it into copied JSON/CLI, but Cursor and VS Code install URIs contain only the public URL. Never commit a filled config.
> **Not this**: one-shot “generate an ERD”, ChatSQL; writes still require human review in the version diff.

## Six client cards

### Cursor

1. Click “Open app (no PAT)” in the PAT success dialog.
2. Click “Copy PAT-filled config” in the same dialog.
3. Save it to user-level `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "erdonline": {
      "url": "https://api.erdonline.com/mcp",
      "headers": {"Authorization": "Bearer erd_pat_…"}
    }
  }
}
```

The deeplink contains only the URL, never a PAT.

### Claude Desktop

1. Open App → **Customize → Connectors**.
2. Click **+ → Add custom connector**.
3. Copy the URL from the PAT dialog; connect account data after OAuth ships.

Anthropic documents no custom connector install URI and its UI does not accept a static Bearer header, so PAT injection is unavailable for this client. Its cloud connector also cannot reach localhost.

### Claude Code

1. Mint a PAT and keep the success dialog open.
2. Click “Copy PAT-filled command”.
3. Run it:

```bash
claude mcp add --transport http --scope user erdonline https://api.erdonline.com/mcp \
  -H 'Authorization: Bearer erd_pat_…'
```

A manual JSON entry must include `"type": "http"`:

```json
{"type":"http","url":"https://api.erdonline.com/mcp","headers":{"Authorization":"Bearer erd_pat_…"}}
```

### Cline

1. Open Cline → **MCP Servers → Remote Servers**.
2. Copy the PAT-filled Cline config from the mint dialog.
3. Paste it and choose Streamable HTTP:

```json
{"mcpServers":{"erdonline":{"type":"streamableHttp","url":"https://api.erdonline.com/mcp","headers":{"Authorization":"Bearer erd_pat_…"}}}}
```

No official custom MCP install URI is documented for Cline.

### Devin Desktop (formerly Windsurf)

1. Open Devin Desktop → **MCPs / Add Server**.
2. Copy the PAT-filled Devin config from the mint dialog.
3. Write `~/.codeium/mcp_config.json` using `serverUrl`, then refresh:

```json
{"mcpServers":{"erdonline":{"serverUrl":"https://api.erdonline.com/mcp","headers":{"Authorization":"Bearer erd_pat_…"}}}}
```

Devin’s 2026 FAQ confirms `~/.codeium/mcp_config.json` as the primary user MCP path. `windsurf://windsurf-mcp-registry` opens Marketplace only; it cannot carry an arbitrary ERD Online config.

### VS Code Copilot

1. Click the `vscode:mcp/install?...` “Open app (no PAT)” action.
2. Copy the PAT-filled VS Code config from the same dialog.
3. Save it to `.vscode/mcp.json` under top-level `servers`:

```json
{"servers":{"erdonline":{"type":"http","url":"https://api.erdonline.com/mcp","headers":{"Authorization":"Bearer erd_pat_…"}}}
```

## First call

Ask: `List my ERD projects`, then `Read projectJSON for project X`. Use `create_version` for a proposed change and review its diff in the designer. Mint a PAT in [Account settings](https://www.erdonline.com/account/settings?selectKey=personalAccessTokens); add `versions:write` only when needed.

## What you get

- REST: project list / detail (member ACL; DB secrets never appear in model JSON)
- Versions: read history; create versions with write scope
- MCP: map those capabilities to agent tools (stdio or HTTP)

### Tools

| Tool | Role | Scope |
|---|---|---|
| `list_projects` / `get_project` / `get_project_schema` | List projects, read projectJSON | `projects:read` |
| `list_tables` / `describe_table` | Progressive contract read: table list, then one table with fields, comments, and FK neighborhood | `projects:read` |
| `list_versions` / `get_version` | Version history | `versions:read` |
| `diff_versions` | Semantic table/column diff between two named versions, including conservative rename candidates | `versions:read` |
| `preview_ddl` | Preview-only `CREATE TABLE` draft from a named version; never connects to a database or executes SQL | `versions:read` |
| `create_version` | Submit a version (human diffs next) | `versions:write` |
| `update_project` / `put_project_json` | Patch metadata / replace JSON | `projects:write` |
| `list_templates` / `get_template` / `install_template` | Template catalog | read / `projects:write` |

`preview_ddl` requires a `versionId` and never reads the unsaved workspace. The version API does not currently store a separate approval state, so your merge gate must still verify human approval.

No `publish_template`, no PAT ratings. See [`mcp/README.md`](https://github.com/erdonline/erdonline/blob/main/mcp/README.md).

## Let the agent suggest a version

When minting the PAT, include `versions:write`. Pick prompt **`suggest-erd-version`** in Cursor, or ask the agent to call `create_version` with a note like “agent suggestion”.

`create_version` returning **API 200 is not human approval**. You must open the designer version diff and accept or roll back. Do not let the agent silently `put_project_json` over the workspace.

## Self-host / run from source

`@erdonline/mcp` is currently `private: true` and unpublished, so this guide does not advertise `npx @erdonline/mcp`. Build the in-repo server:

```bash
export ERD_API_URL=http://127.0.0.1:9502
export ERD_PAT=erd_pat_…
cd mcp && yarn install && yarn build
node dist/index.js
```

That is the stdio fallback. For self-hosted Streamable HTTP, use `yarn start -- --http` (`http://127.0.0.1:3920/mcp`); the Docker/Railway image exposes `/mcp` through Spring on the backend port.

## What success looks like

- Read calls return 200 and a full model (**no** DB password fields).
- After writing a version, it appears in the designer version list.
- The MCP client lists tools and succeeds on read-only tools.

## Troubleshooting

| Symptom | Try |
|---|---|
| 401 / 403 | Expired PAT, insufficient scope, or wrong environment; remint at [Personal access tokens](https://www.erdonline.com/account/settings?selectKey=personalAccessTokens) |
| Agent says PAT is missing / still `erd_pat_…` | The placeholder is not a token. Put the plaintext in a local `Authorization: Bearer …` header. The one-click link never includes a PAT |
| `list_projects` is empty | Create your own project in the designer, then ask again. The official Demo share is **not** a PAT |
| Agent drew a new ER diagram | Tell it to `list_projects` then `get_project_schema` — read/write your existing projectJSON; do not generate a diagram from natural language |
| `create_version` already 200 | Still open the version diff and confirm or roll back. **API 200 is not human approval** |
| Share link works but API fails | Share read-only tokens are **not** API credentials |
| Hosted MCP won’t connect | Confirm `https://api.erdonline.com/mcp`; a 404 means production has not yet redeployed from repository root |
| Self-hosted MCP won’t connect | In the image, check backend `/mcp`; for stdio fallback, check `node mcp/dist/index.js` |
| Changing model schema meaning | Additive-only rules; see [data-format](/docs/data-format) |
| Lint the model in CI | Do **not** start MCP on the runner. Fetch `projectJson` over REST, then `node scripts/validate-projectjson.mjs`; see [data-format · Fetch from the public API](/docs/data-format#ci-fetch-then-lint) |

## Next

- [projectJSON data format](/docs/data-format) (includes CI fetch-then-lint)
- [Security model](/docs/security-model)
- [Start here](/docs/guide/intro)
