---
title: 用 MCP 让 Cursor / Claude / Cline 等读取 ER 图
description: 复制 mcp.json 配置，用 PAT 让 Cursor、Claude、Cline、Windsurf 等 Agent 读写同一份 ERD projectJSON。人再 diff 审批版本。不做一句话生成 ER 图。
---

想把正在画的 ER 图交给 Cursor 或 Claude？走鉴权后的 REST / MCP，读写**同一份** projectJSON（和设计器里看到的模型一致）。分享链接不是 API 密钥。

> **30 秒目标**：铸造 PAT → 粘贴 MCP 配置 → 在 Cursor 选 prompt `suggest-erd-version`（或让 Agent 调 `create_version`）。  
> **前置**：可登录实例（[自托管](./quick-self-host.md) 或 [www.erdonline.com](https://www.erdonline.com/)）；格式见 [data-format](../data-format.md)。  
> **不做**：一句话生成 ERD、ChatSQL；写操作必须人在版本 diff 里审批。`create_version` 的 API 200 不是人批准。

## 支持哪些 AI 客户端

只要客户端支持 MCP（Model Context Protocol），就可以用同样的 `mcpServers.erdonline` 配置读写 ERD projectJSON。下面是常见客户端的接入位置：

| 客户端 | 配置文件位置 | 备注 |
|---|---|---|
| **Cursor** | `~/.cursor/mcp.json` | [官网 install-links](https://cursor.com/docs/mcp/install-links)；可用 [一键安装页](https://www.erdonline.com/cursor-mcp/) |
| **Claude Desktop** | `~/Library/Application Support/Claude/claude_desktop_config.json`（macOS） / `%APPDATA%/Claude/claude_desktop_config.json`（Windows） | Anthropic 官方，配置与 Cursor 同结构 |
| **Claude Code** | 命令行 `claude config set mcpServers '{...}'` 或写入 `~/.claude/config.json` | 终端 Agent；`ERD_PAT` 可在环境变量或文件里 |
| **Cline** | VS Code 设置 → `mcp.marketplace` 或 `cline.mcp.json` | 支持自定义 MCP server；把 JSON 粘进 `mcpServers` |
| **Roo Code** | VS Code 设置 → `roo.mcpServers` | 与 Cline 同格式 |
| **Windsurf** | `~/.windsurf/mcp.json`（或 Cascade Settings 中的 MCP 面板） | Codeium；配置字段与 Cursor 一致 |
| **Glama** | 托管市场 [glama.ai/mcp/servers](https://glama.ai/mcp/servers) | 无需 PAT 即可做 `tools/list` 内省；读写仍需 PAT |
| **5ire / Smithery / 其他** | 按各自 MCP 设置填入 `command`/`args`/`env` | 只要支持 stdio MCP 就能用 |

**同一套 `mcp.json`**：下面是 Cursor 示例，其它客户端把同一 JSON 粘到对应位置即可。

## 30 秒接到 Cursor

1. 登录后打开 **账户设置 → 访问令牌**：[铸造 PAT](https://www.erdonline.com/account/settings?selectKey=personalAccessTokens)。默认只读即可；明文只显示一次，**铸造成功弹层会给出已填入 PAT 的 `mcp.json`，可直接复制**。官方 Demo 是只读分享，**不能**当 PAT——需要你自己的项目。

<img src="/img/guide/mcp-pat-reveal.webp" alt="铸造 PAT 后明文只显示一次，弹层可复制 mcp.json" width="464" height="336" loading="eager" fetchpriority="high" />

2. 铸造 PAT 后可 [一键加入 Cursor](https://www.erdonline.com/cursor-mcp/)（官方 [install-links](https://cursor.com/docs/mcp/install-links)；协议 `cursor://anysphere.cursor-deeplink/mcp/install`）。**一键链接不会把 PAT 编进 URL**；请从弹层复制框粘贴已填好的 `mcp.json`，或装好后把占位符换成明文。

或把下面 JSON 粘进 Cursor 用户级 `~/.cursor/mcp.json`（Claude Desktop 同结构）。把 `erd_pat_…` 换成你的 PAT（弹层已填好）。`npx -y --package … erd-mcp` 会拉取 GitHub Release 里的 MCP 包，**不必**本机 clone。

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

<img src="/img/guide/mcp-json.webp" alt="Cursor mcp.json 配置片段（npx tarball；PAT 换成你的）" width="512" height="196" loading="lazy" />

本地自托管把 `ERD_API_URL` 改成 `http://127.0.0.1:9502`。MCP **不在** Docker 镜像内。

3. 重载 Cursor MCP 后对 Agent 说：`列出我的 ERD 项目`。应出现 `list_projects`。再：`读取项目 X 的 projectJSON`。列表为空时，先在设计器里建一个**自己的**项目（官方 Demo 不能当 PAT）。要改模型：在 Cursor 选 prompt **`suggest-erd-version`**，或让 Agent 调 `create_version`。Agent 若仍提示 `erd_pat_…`：把弹层明文粘进 `mcp.json`——一键链接不会带 PAT。不要让 Agent 凭一句话生成一张新 ER 图。

贡献者若要从源码跑：`cd mcp && yarn install && yarn build`，再用 `node /ABS/PATH/to/erdonline/mcp/dist/index.js`。开发免编译可用 `npx tsx mcp/src/index.ts`。

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
| `create_version` | 提交一版（人再 diff） | `versions:write` |
| `update_project` / `put_project_json` | 改项目元数据 / 整份 JSON | `projects:write` |
| `list_templates` / `get_template` / `install_template` | 模板广场 | read / `projects:write` |

<img src="/img/guide/mcp-agent-tools.webp" alt="Agent 可调用的 MCP 工具清单" width="703" height="393" loading="lazy" />

没有 `publish_template`，也没有 PAT 评分。仓库说明见 [`mcp/README.md`](https://github.com/erdonline/erdonline/blob/main/mcp/README.md)。

## 让 Agent 提交一版建议

铸造 PAT 时显式勾选 `versions:write`。在 Cursor 选 prompt **`suggest-erd-version`**，或请 Agent 调用 `create_version`，版本说明写清「Agent 建议」。

`create_version` 返回 **API 200 不是人批准**。你必须打开设计器版本 diff，通过或回滚。不要让 Agent 静默 `put_project_json` 覆盖工作区。

## Streamable HTTP（可选）

```bash
export ERD_API_URL=http://127.0.0.1:9502
export ERD_PAT=erd_pat_…
cd mcp && yarn start -- --http
# → http://127.0.0.1:3920/mcp
```

## 成功时你会看到什么

- 只读请求返回 200 与完整模型结构（**无**数据库密码字段）。
- 写版本后，设计器版本列表出现对应记录。
- MCP 客户端能列出工具并成功调用只读工具。

## 常见问题 / 排障

| 现象 | 可尝试 |
|---|---|
| 401 / 403 | 检查 PAT 是否过期、scope 是否足够、是否打到正确环境；过期则重新[铸造](https://www.erdonline.com/account/settings?selectKey=personalAccessTokens) |
| Agent 说 Missing ERD_PAT / 仍是 `erd_pat_…` | 占位符不是令牌。把铸造弹层里的明文粘进 `mcp.json` 的 `ERD_PAT`。一键安装链接**不会**把 PAT 编进 URL |
| `list_projects` 为空 | 先在设计器新建自己的项目，再说「列出我的 ERD 项目」。官方 Demo 分享链接**不能**当 PAT |
| Agent 画了一张新 ER 图 | 叫它 `list_projects` 再 `get_project_schema`，读写你已有的 projectJSON，不要从自然语言生成图 |
| `create_version` 已 200 | 还要打开版本 diff 确认或回滚。**API 200 不是人批准** |
| 分享链接能看图但 API 失败 | 分享只读 token **不能**当 API 凭证 |
| MCP 连不上 | 确认 MCP 进程已单独启动；Token / 路径与文档一致 |
| compose 起来了但没有 MCP | 预期行为；MCP 在 `mcp/` 目录另启 |
| 想改模型 schema 含义 | 遵守「仅加法」；见 [data-format](../data-format.md) |
| 想在 CI 里校验模型 | **不要**在 runner 上起 MCP。用 REST 拉 `projectJson` 再跑 `node scripts/validate-projectjson.mjs`；见 [data-format · 从公开 API 拉再校验](../data-format.md#ci-fetch-then-lint) |

## 下一步

- [projectJSON 数据格式](../data-format.md)（含 CI 用 REST 拉 JSON 再 lint）
- [安全模型](../security-model.md)
- [从这里开始](./intro.md)
