# ERD Online MCP

ADR-0013：本地 MCP server，经 **Personal Access Token** 调用公开 REST `/api/v1/**`。

## 工具

| Tool | REST | Scope |
|---|---|---|
| `list_projects` | `GET /api/v1/projects` | `projects:read` |
| `get_project` | `GET /api/v1/projects/{id}` | `projects:read` |
| `get_project_schema` | 同上，返回 `{ id, name, projectJSON }` | `projects:read` |
| `list_versions` | `GET /api/v1/projects/{id}/versions` | `versions:read` |
| `get_version` | `GET /api/v1/projects/{id}/versions/{versionId}` | `versions:read` |
| `create_version` | `POST /api/v1/projects/{id}/versions` | `versions:write` |

## 环境变量

| 变量 | 说明 |
|---|---|
| `ERD_API_URL` | API 根，默认 `http://127.0.0.1:9502` |
| `ERD_PAT` | 明文 PAT（`erd_pat_…`）；也接受 `ERD_API_TOKEN` |
| `ERD_MCP_PORT` | HTTP 模式端口，默认 `3920` |
| `ERD_MCP_TRANSPORT=http` | 等价于 `--http` |

铸造 PAT 见仓库 [`docs/development.md`](../docs/development.md)「公开 API PAT」。写工具须铸造时显式包含 `versions:write`。

## 安装与 stdio

```bash
cd mcp
yarn install
yarn build

export ERD_API_URL=http://127.0.0.1:9502
export ERD_PAT=erd_pat_…   # 明文只见一次

# Cursor / Claude Desktop：stdio
node dist/index.js
# 开发免编译
yarn dev
```

### Cursor MCP 配置示例

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

`dogfood`：登录铸造读写 PAT → REST（含 `create_version`）→ stdio MCP `tools/list` + 调用。

## 不做

- connector / mutate SQL
- 会话 JWT（`/api/v1` 一律拒绝）
- `projects:write` MCP tools（REST 已有 `PATCH /projects/{id}` + `PUT …/projectJSON`；MCP 后置）
