---
title: 用一个 URL 把 Agent 接到 ERD Online
description: 铸造 PAT 后在同一弹层获得已填配置，把远程 Streamable HTTP 接入 Cursor、Claude Desktop、Claude Code、Cline、Devin 或 VS Code Copilot。
---

想把正在画的 ER 图交给 Cursor 或 Claude？六类客户端都从同一个远程 Streamable HTTP 地址开始：

```text
https://api.erdonline.com/mcp
```

[公开六客户端接入页](https://www.erdonline.com/cursor-mcp/)用于查看 URL 与打开程序入口；真正带 PAT 的安装动作只在登录后铸造成功弹层中出现。

> **30 秒目标**：[铸造 PAT](https://www.erdonline.com/account/settings?selectKey=personalAccessTokens) → **不要关成功弹层** → 直接点击/复制该弹层中已填入本次 PAT 的客户端动作。铸令牌与安装不是两段教程。
> **鉴权过渡**：OAuth 在下一切片实现。明文 PAT 只显示一次；成功弹层可把它注入复制出的 JSON / CLI，但 Cursor / VS Code install URI 永远只含公开 URL，不含 PAT。不要把已填配置提交仓库。
> **不做**：一句话生成 ERD、ChatSQL；写操作必须人在版本 diff 里审批。`create_version` 的 API 200 不是人批准。

## 六种客户端，六张配置卡

### Cursor

1. 在 PAT 成功弹层点击「打开程序（无 PAT）」。
2. 在同一弹层点「复制已填 PAT 配置」。
3. 把它保存到用户级 `~/.cursor/mcp.json`：

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

deeplink 使用 Cursor 官方格式 `cursor://anysphere.cursor-deeplink/mcp/install?...`，只编码 `{"url":"https://api.erdonline.com/mcp"}`，**不含 PAT**；带 PAT 的只有一次性弹层复制内容。

### Claude Desktop

1. 打开 App → **Customize → Connectors**。
2. 点 **+ → Add custom connector**。
3. 从 PAT 成功弹层复制 URL；OAuth 上线后再连接账户。

[Anthropic 一手文档](https://support.anthropic.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp)未提供自定义 Connector install URI，UI 也不接受静态 Bearer header，所以这个客户端本切片**无法注入 PAT**；必须如实等待 OAuth。远程 Connector 从 Anthropic 云发起，无法访问 `localhost`。

### Claude Code

1. 铸造 PAT 后不要关闭成功弹层。
2. 点击「复制已填 PAT 命令」。
3. 粘到终端运行（`-H` 已注入本次 PAT）：

```bash
claude mcp add --transport http --scope user erdonline https://api.erdonline.com/mcp \
  -H 'Authorization: Bearer erd_pat_…'
```

手工 JSON 远程项必须显式写 `"type": "http"`：

```json
{"type":"http","url":"https://api.erdonline.com/mcp","headers":{"Authorization":"Bearer erd_pat_…"}}
```

### Cline

1. 打开 Cline → **MCP Servers → Remote Servers**。
2. 在 PAT 成功弹层复制 Cline 已填配置。
3. 粘贴并选 Streamable HTTP；字段必须是 `"type": "streamableHttp"`：

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

[Cline 一手文档](https://docs.cline.bot/mcp/mcp-overview)只给出 App 面板 / Remote Servers / `cline mcp`，没有自定义 MCP install URI，不杜撰 scheme。

### Devin Desktop（formerly Windsurf）

1. 打开 Devin Desktop → **MCPs / Add Server**。
2. 在 PAT 成功弹层复制 Devin 已填配置。
3. 写入 `~/.codeium/mcp_config.json` 后刷新；URL 字段必须是 `serverUrl`：

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

[Devin Desktop 一手文档](https://docs.devin.ai/desktop/cascade/mcp)与 [2026 FAQ](https://docs.devin.ai/desktop/devin-desktop-faq)明确主用户级 MCP 路径仍是 `~/.codeium/mcp_config.json`，远程字段为 `serverUrl`。官方 `windsurf://windsurf-mcp-registry` deeplink 只能打开 Marketplace；ERD Online 尚未成为其 registry 条目，因此不能把它冒充一键安装自定义配置。

### VS Code Copilot

1. 在 PAT 成功弹层点击 `vscode:mcp/install?...`「打开程序（无 PAT）」。
2. 在同一弹层点击「复制已填 PAT 配置」。
3. 保存到 `.vscode/mcp.json`；顶层必须是 `servers`：

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

[VS Code 一手文档](https://code.visualstudio.com/api/extension-guides/ai/mcp)定义了 `vscode:mcp/install?{URL_ENCODED_JSON}`；本项目 install URI 只带 name/type/url，PAT 仍由成功弹层的独立复制动作写入。

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
