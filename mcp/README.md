# ERD Online MCP

品牌是**数据库设计的 Git + Figma**。本 server 让 Cursor / Claude **读写设计器同一份 versioned `projectJSON`**，不是 ChatSQL，也不是一句话生成 ER 图。

ADR-0013：官方远程 Streamable HTTP 端点为 **`https://api.erdonline.com/mcp`**；本地 server 经 Personal Access Token 调用公开 REST `/api/v1/**`。文档：[doc.erdonline.com/docs/guide/api-and-mcp/](https://doc.erdonline.com/docs/guide/api-and-mcp/)。

官方 MCP Registry 登记见仓库 [`docs/mcp-registry.md`](../docs/mcp-registry.md)（📋 待 `NPM_TOKEN` + org Owner device 登录）。

Glama 内省用 [`Dockerfile`](./Dockerfile)（stdio，**无** PAT；`tools/list` 即可）。`yarn smoke:introspect` 覆盖该握手。

## 支持的 MCP 客户端 / Supported clients

主路径是远程 Streamable HTTP。Cursor / Claude Desktop / Claude Code / Cline / Devin Desktop（formerly Windsurf）/ VS Code Copilot 的字段并不相同，必须按[六张配置卡](https://doc.erdonline.com/docs/guide/api-and-mcp/)填写；不要复制一份通用 stdio JSON。

OAuth 在下一切片实现。过渡期支持 custom headers 的客户端可本机配置 `Authorization: Bearer erd_pat_…`；deeplink 只含 URL，绝不含 PAT。

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
| `diff_versions` | 两个命名版本的表/列语义 diff + 保守改名候选（非 ALTER dump） | `versions:read` |
| `preview_ddl` | 指定命名版本的四方言 `CREATE TABLE` 草稿；只预览，永不执行 SQL | `versions:read` |
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

## 远程接入与 stdio fallback

30 秒路径：

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

`@erdonline/mcp` 当前 `private: true`、未发布 npm，因此不宣传 `npx @erdonline/mcp`。官方 Demo 不能当 PAT。接通后让 Agent 调 `create_version`，再由人审 diff；API 200 **不是**人批准。

自托管从源码跑：

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
