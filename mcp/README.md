# ERD Online MCP

品牌是**数据库设计的 Git + Figma**。本 server 让 Cursor / Claude **读写设计器同一份 versioned `projectJSON`**，不是 ChatSQL，也不是一句话生成 ER 图。

ADR-0013：本地 MCP server，经 **Personal Access Token** 调用公开 REST `/api/v1/**`。文档：[doc.erdonline.com/docs/guide/api-and-mcp/](https://doc.erdonline.com/docs/guide/api-and-mcp/)。

官方 MCP Registry 登记见仓库 [`docs/mcp-registry.md`](../docs/mcp-registry.md)（📋 待 `NPM_TOKEN` + org Owner device 登录）。

Glama 内省用 [`Dockerfile`](./Dockerfile)（stdio，**无** PAT；`tools/list` 即可）。`yarn smoke:introspect` 覆盖该握手。

## 支持的 MCP 客户端 / Supported clients

只要支持 stdio MCP 即可接入。常用客户端配置位置：

| 客户端 / Client | 配置文件 / Config location | 备注 / Notes |
|---|---|---|
| **Cursor** | `~/.cursor/mcp.json` | [一键安装页](https://www.erdonline.com/cursor-mcp/) / [Cursor install-links](https://cursor.com/docs/mcp/install-links) |
| **Claude Desktop** | `~/Library/Application Support/Claude/claude_desktop_config.json`（macOS） / `%APPDATA%/Claude/claude_desktop_config.json`（Windows） | 与 Cursor 同配置结构 |
| **Claude Code** | `~/.claude/config.json` 或环境变量 | 终端 Agent |
| **Cline** | `cline.mcp.json` 或 VS Code `mcp.marketplace` | 粘贴 `mcpServers` 块 |
| **Roo Code** | `roo.mcpServers` | 与 Cline 同格式 |
| **Windsurf** | `~/.windsurf/mcp.json` 或 Cascade MCP panel | Codeium |
| **Glama** | [glama.ai/mcp/servers](https://glama.ai/mcp/servers) | 无 PAT 可内省；读写仍需 PAT |
| **5ire / Smithery / 其它** | 按各自 MCP 设置填入 `command`/`args`/`env` | 支持 stdio 即可 |

完整步骤见 [doc.erdonline.com/docs/guide/api-and-mcp/](https://doc.erdonline.com/docs/guide/api-and-mcp/)。

## 工具

| Tool | REST | Scope |
|---|---|---|
| `list_projects` | `GET /api/v1/projects` | `projects:read` |
| `get_project` | `GET /api/v1/projects/{id}` | `projects:read` |
| `get_project_schema` | 同上，返回 `{ id, name, projectJSON }` | `projects:read` |
| `list_tables` | 契约渐进披露①：表清单（模块/表名/字段数），不 dump 全量 schema；可选 `versionId` 读已批准版本 | `projects:read` |
| `describe_table` | 契约渐进披露②：单表字段 + FK 邻域；表不存在返回 `found:false` + suggestions | `projects:read` |
| `list_versions` | `GET /api/v1/projects/{id}/versions` | `versions:read` |
| `get_version` | `GET /api/v1/projects/{id}/versions/{versionId}` | `versions:read` |
| `create_version` | `POST /api/v1/projects/{id}/versions` | `versions:write` |
| `update_project` | `PATCH /api/v1/projects/{id}` | `projects:write` |
| `put_project_json` | `PUT /api/v1/projects/{id}/projectJSON` | `projects:write` |
| `list_templates` | `GET /api/v1/catalog/templates` | `projects:read` |
| `get_template` | `GET /api/v1/catalog/templates/{id}` | `projects:read` |
| `install_template` | `POST /api/v1/catalog/templates/{id}/install` | `projects:write` |
| `get_creator` | `GET /api/v1/catalog/creators/{handle}` | `projects:read` |

ADR-0028：**无** `publish_template`；**无** PAT 评分/评论。

## 环境变量

| 变量 | 说明 |
|---|---|
| `ERD_API_URL` | API 根，默认 `http://127.0.0.1:9502` |
| `ERD_PAT` | 明文 PAT（`erd_pat_…`）；也接受 `ERD_API_TOKEN` |
| `ERD_MCP_PORT` | HTTP 模式端口，默认 `3920` |
| `ERD_MCP_TRANSPORT=http` | 等价于 `--http` |

铸造 PAT 见仓库 [`docs/development.md`](../docs/development.md)「公开 API PAT」。写工具须铸造时显式包含对应 scope（`versions:write` / `projects:write`）。

## 安装与 stdio

30 秒路径用 GitHub Release tarball（不必 clone 全仓）：

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

官方 Demo 不能当 PAT。自托管把 `ERD_API_URL` 改成 `http://127.0.0.1:9502`。接通后在 Cursor 选 prompt **`suggest-erd-version`**，或让 Agent 调 `create_version`。API 200 **不是**人批准。不要凭一句话生成新图。完整步骤：[doc.erdonline.com/docs/guide/api-and-mcp/](https://doc.erdonline.com/docs/guide/api-and-mcp/)。

从源码跑：

```bash
cd mcp
yarn install
yarn build

# CI 冒烟：pack 后 npx --package 本地 tarball 须打出 stdio ready（不发 npmjs）
yarn smoke:npx

export ERD_API_URL=http://127.0.0.1:9502
export ERD_PAT=erd_pat_…   # 明文只见一次

# Cursor / Claude Desktop：stdio
node dist/index.js
# 开发免编译
yarn dev
```

### Cursor MCP 配置示例（源码）

```json
{
  "mcpServers": {
    "erdonline": {
      "command": "node",
      "args": ["/ABS/PATH/to/erdonline/mcp/dist/index.js"],
      "env": {
        "ERD_API_URL": "http://127.0.0.1:9502",
        "ERD_PAT": "erd_pat_…"
      }
    }
  }
}
```

开发态可用 `npx tsx /ABS/PATH/to/erdonline/mcp/src/index.ts` 代替 `node dist/...`。

## Streamable HTTP（可选）

```bash
export ERD_API_URL=http://127.0.0.1:9502
export ERD_PAT=erd_pat_…
yarn start -- --http
# → http://127.0.0.1:3920/mcp
```

## Dogfood（本机 9502）

```bash
./backend/dev-ensure.sh   # 仓库根
cd mcp && yarn install && yarn dogfood
```

`dogfood`：登录铸造读写 PAT → REST（含 `create_version` / `update_project` / `put_project_json`）→ stdio MCP `tools/list` + 调用；只读 PAT 写路径 403。

## 不做

- connector / mutate SQL
- 会话 JWT（`/api/v1` 一律拒绝）
- OAuth client / 第三方应用（后置）
