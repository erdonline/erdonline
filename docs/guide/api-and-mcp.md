---
title: 用 MCP 让 Cursor / Claude 读取 ER 图
description: 复制 Cursor MCP 配置，用 PAT 让 Agent 读写同一份 ERD projectJSON。人再 diff 审批版本。不做一句话生成 ER 图。
---

想把正在画的 ER 图交给 Cursor 或 Claude？走鉴权后的 REST / MCP，读写**同一份** projectJSON（和设计器里看到的模型一致）。分享链接不是 API 密钥。

> **30 秒目标**：铸造 PAT → 粘贴 MCP 配置 → Agent 列出你的项目。  
> **前置**：可登录实例（[自托管](./quick-self-host.md) 或 [www.erdonline.com](https://www.erdonline.com/)）；格式见 [data-format](../data-format.md)。  
> **不做**：一句话生成 ERD、ChatSQL；写操作必须人在版本 diff 里审批。

## 30 秒接到 Cursor

1. 登录后打开 **账户设置 → 访问令牌**：[铸造 PAT](https://www.erdonline.com/account/settings?selectKey=personalAccessTokens)。默认只读即可；明文只显示一次。官方 Demo 是只读分享，**不能**当 PAT——需要你自己的项目。
2. MCP **不在** Docker 镜像内。克隆并构建：

```bash
git clone https://github.com/erdonline/erdonline.git
cd erdonline/mcp
yarn install && yarn build
```

3. 把下面 JSON 粘进 Cursor 用户级 `~/.cursor/mcp.json`（Claude Desktop 同结构）。把绝对路径和 PAT 换成你的：

```json
{
  "mcpServers": {
    "erdonline": {
      "command": "node",
      "args": ["/ABS/PATH/to/erdonline/mcp/dist/index.js"],
      "env": {
        "ERD_API_URL": "https://erdonline-production.up.railway.app",
        "ERD_PAT": "erd_pat_…"
      }
    }
  }
}
```

本地自托管把 `ERD_API_URL` 改成 `http://127.0.0.1:9502`。开发免编译可用 `npx tsx /ABS/PATH/to/erdonline/mcp/src/index.ts` 代替 `node dist/...`。

4. 重载 Cursor MCP 后对 Agent 说：`列出我的 ERD 项目`。应出现 `list_projects`。再：`读取项目 X 的 projectJSON`。

## 你会得到什么

- REST：项目列表 / 详情（成员 ACL；连接密钥不会出现在返回的模型 JSON 中）
- 版本：可读历史；有写权限时可创建版本
- MCP：把上述能力映射为 Agent 工具（stdio 或 HTTP）

### 工具清单

| Tool | 作用 | Scope |
|---|---|---|
| `list_projects` / `get_project` / `get_project_schema` | 列项目、读 projectJSON | `projects:read` |
| `list_versions` / `get_version` | 读版本历史 | `versions:read` |
| `create_version` | 提交一版（人再 diff） | `versions:write` |
| `update_project` / `put_project_json` | 改项目元数据 / 整份 JSON | `projects:write` |
| `list_templates` / `get_template` / `install_template` | 模板广场 | read / `projects:write` |

没有 `publish_template`，也没有 PAT 评分。仓库说明见 [`mcp/README.md`](https://github.com/erdonline/erdonline/blob/main/mcp/README.md)。

## 让 Agent 提交一版建议

铸造 PAT 时显式勾选 `versions:write`。请 Agent 调用 `create_version`，版本说明写清「Agent 建议」。你在设计器版本列表打开 diff，通过或回滚。

不要让 Agent 静默 `put_project_json` 覆盖工作区——那会跳过人类审批。

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
| 401 / 403 | 检查 PAT 是否过期、scope 是否足够、是否打到正确环境 |
| 分享链接能看图但 API 失败 | 分享只读 token **不能**当 API 凭证 |
| MCP 连不上 | 确认 MCP 进程已单独启动；Token / 路径与文档一致 |
| compose 起来了但没有 MCP | 预期行为；MCP 在 `mcp/` 目录另启 |
| 想改模型 schema 含义 | 遵守「仅加法」；见 [data-format](../data-format.md) |

## 下一步

- [projectJSON 数据格式](../data-format.md)
- [安全模型](../security-model.md)
- [从这里开始](./intro.md)
