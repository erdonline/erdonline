---
title: 用一个 URL 把 Agent 接到 ERD Online
description: 把远程 Streamable HTTP URL 接入 Cursor、Claude Desktop、Claude Code、Cline、Windsurf 或 VS Code Copilot；Agent 读取契约，人审版本 diff。
---

想把正在画的 ER 图交给 Cursor 或 Claude？六类客户端都从同一个远程 Streamable HTTP 地址开始：

```text
https://api.erdonline.com/mcp
```

> **30 秒目标**：粘贴 URL → 客户端发现 MCP 工具 → Agent 读取已批准的模型契约。
> **鉴权过渡**：OAuth 在下一切片实现。当前需要读取账户数据时，支持自定义 header 的客户端可加 `Authorization: Bearer erd_pat_…`。明文 PAT 只放本机密钥配置，绝不能写进 deeplink 或提交仓库。
> **不做**：一句话生成 ERD、ChatSQL；写操作必须人在版本 diff 里审批。`create_version` 的 API 200 不是人批准。

## 六种客户端，六张配置卡

### Cursor

1. 打开[一键安装页](https://www.erdonline.com/cursor-mcp/)，点击「在 Cursor 打开」。
2. 确认 URL 为 `https://api.erdonline.com/mcp` 后安装。
3. 过渡期需要账户数据时，在用户级 `~/.cursor/mcp.json` 本机补 PAT header：

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

deeplink 使用 Cursor 官方格式 `cursor://anysphere.cursor-deeplink/mcp/install?...`，只编码 `{"url":"https://api.erdonline.com/mcp"}`，**不含 PAT**。

### Claude Desktop

1. 打开 **Settings → Connectors**。
2. 添加自定义 Connector，粘贴 `https://api.erdonline.com/mcp`。
3. 保存并重新连接。

Anthropic 云端 Connector 无法访问 `localhost`。本切片尚未实现远程 OAuth，因此需要账户鉴权的完整旅程要等下一切片；不要退回 stdio tgz 当主路径。

### Claude Code

1. 运行：

```bash
claude mcp add --transport http --scope user erdonline https://api.erdonline.com/mcp
```

2. 确认服务保存到 user scope。
3. 过渡期若改 JSON，远程项必须显式写 `"type": "http"`：

```json
{"type":"http","url":"https://api.erdonline.com/mcp","headers":{"Authorization":"Bearer erd_pat_…"}}
```

### Cline

1. 打开 Cline 的 MCP Servers。
2. 添加远程服务；transport 字段必须是 `"type": "streamableHttp"`。
3. 保存后检查工具列表：

```json
{
  "mcpServers": {
    "erdonline": {
      "type": "streamableHttp",
      "url": "https://api.erdonline.com/mcp",
      "headers": {"Authorization": "Bearer erd_pat_…"}
    }
  }
}
```

### Windsurf

1. 打开 `~/.codeium/windsurf/mcp_config.json`。
2. 加入远程服务；URL 字段必须是 `serverUrl`。
3. 重载 Windsurf：

```json
{
  "mcpServers": {
    "erdonline": {
      "serverUrl": "https://api.erdonline.com/mcp",
      "headers": {"Authorization": "Bearer erd_pat_…"}
    }
  }
}
```

### VS Code Copilot

1. 打开工作区 `.vscode/mcp.json`。
2. 在顶层 `servers` 加入 HTTP 服务。
3. 启动该 MCP 服务：

```json
{
  "servers": {
    "erdonline": {
      "type": "http",
      "url": "https://api.erdonline.com/mcp",
      "headers": {"Authorization": "Bearer erd_pat_…"}
    }
  }
}
```

## 第一次调用

重载客户端后对 Agent 说：`列出我的 ERD 项目`。应出现 `list_projects`。再说：`读取项目 X 的 projectJSON`。列表为空时，先在设计器里建一个自己的项目。要改模型，让 Agent 调 `create_version`，再由人在设计器版本 diff 中审批。

PAT 可在[账户设置](https://www.erdonline.com/account/settings?selectKey=personalAccessTokens)铸造；默认只读，写版本需 `versions:write`。明文只显示一次。

## 你会得到什么

- REST：项目列表 / 详情（成员 ACL；连接密钥不会出现在返回的模型 JSON 中）
- 版本：可读历史；有写权限时可创建版本
- MCP：把上述能力映射为 Agent 工具（stdio 或 HTTP）

### 工具清单

| Tool | 作用 | Scope |
|---|---|---|
| `list_projects` / `get_project` / `get_project_schema` | 列项目、读 projectJSON | `projects:read` |
| `list_tables` / `describe_table` | 契约渐进披露：先列表、再按需读单表字段 + FK 邻域；表名写错返回 `found:false` + suggestions；可选 `versionId` 读已批准版本 | `projects:read` |
| `list_versions` / `get_version` | 读版本历史 | `versions:read` |
| `diff_versions` | 对比两个命名版本的语义差异：表/列增删改与保守的改名候选；不把 ALTER 文本当主要审查界面 | `versions:read` |
| `preview_ddl` | 从一个命名版本快照生成 MySQL / PostgreSQL / SQL Server / Oracle `CREATE TABLE` 草稿；只预览，MCP 永不连接数据库、永不执行 SQL | `versions:read` |
| `create_version` | 提交一版（人再 diff） | `versions:write` |
| `update_project` / `put_project_json` | 改项目元数据 / 整份 JSON | `projects:write` |
| `list_templates` / `get_template` / `install_template` | 模板广场 | read / `projects:write` |

<img src="/img/guide/mcp-agent-tools.webp" alt="Agent 可调用的 MCP 工具清单" width="703" height="393" loading="lazy" />

`preview_ddl` 只接受 `versionId`，不会读取未存版的工作区；当前版本 API 不记录独立的「已批准」状态，因此团队仍须在 merge 门禁中确认批准。没有 `publish_template`，也没有 PAT 评分。仓库说明见 [`mcp/README.md`](https://github.com/erdonline/erdonline/blob/main/mcp/README.md)。

## 让 Agent 提交一版建议

铸造 PAT 时显式勾选 `versions:write`。在 Cursor 选 prompt **`suggest-erd-version`**，或请 Agent 调用 `create_version`，版本说明写清「Agent 建议」。

`create_version` 返回 **API 200 不是人批准**。你必须打开设计器版本 diff，通过或回滚。不要让 Agent 静默 `put_project_json` 覆盖工作区。

## 自托管 / 从源码运行

`@erdonline/mcp` 当前仍是 `private: true`，尚不可从 npm 安装，因此不宣传 `npx -y @erdonline/mcp`。从仓库源码构建：

```bash
export ERD_API_URL=http://127.0.0.1:9502
export ERD_PAT=erd_pat_…
cd mcp && yarn install && yarn build
node dist/index.js
```

上面是 stdio fallback。若要自托管 Streamable HTTP，运行 `yarn start -- --http`，端点为 `http://127.0.0.1:3920/mcp`；Docker / Railway 镜像则由 Spring 在后端端口暴露 `/mcp`。

## 成功时你会看到什么

- 只读请求返回 200 与完整模型结构（**无**数据库密码字段）。
- 写版本后，设计器版本列表出现对应记录。
- MCP 客户端能列出工具并成功调用只读工具。

## 常见问题 / 排障

| 现象 | 可尝试 |
|---|---|
| 401 / 403 | 检查 PAT 是否过期、scope 是否足够、是否打到正确环境；过期则重新[铸造](https://www.erdonline.com/account/settings?selectKey=personalAccessTokens) |
| Agent 说 Missing PAT / 仍是 `erd_pat_…` | 占位符不是令牌。把铸造弹层里的明文填到本机配置的 `Authorization: Bearer …` header；一键安装链接**不会**把 PAT 编进 URL |
| `list_projects` 为空 | 先在设计器新建自己的项目，再说「列出我的 ERD 项目」。官方 Demo 分享链接**不能**当 PAT |
| Agent 画了一张新 ER 图 | 叫它 `list_projects` 再 `get_project_schema`，读写你已有的 projectJSON，不要从自然语言生成图 |
| `create_version` 已 200 | 还要打开版本 diff 确认或回滚。**API 200 不是人批准** |
| 分享链接能看图但 API 失败 | 分享只读 token **不能**当 API 凭证 |
| 官方 MCP 连不上 | 确认 URL 是 `https://api.erdonline.com/mcp`；若返回 404，说明生产镜像尚未按仓库根目录重部署 |
| 自托管 MCP 连不上 | 镜像部署确认后端 `/mcp`；源码 stdio fallback 则确认 `node mcp/dist/index.js` 已启动 |
| 想改模型 schema 含义 | 遵守「仅加法」；见 [data-format](../data-format.md) |
| 想在 CI 里校验模型 | **不要**在 runner 上起 MCP。用 REST 拉 `projectJson` 再跑 `node scripts/validate-projectjson.mjs`；见 [data-format · 从公开 API 拉再校验](../data-format.md#ci-fetch-then-lint) |

## 下一步

- [projectJSON 数据格式](../data-format.md)（含 CI 用 REST 拉 JSON 再 lint）
- [安全模型](../security-model.md)
- [从这里开始](./intro.md)
