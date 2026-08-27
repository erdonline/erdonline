# 官方 MCP Registry 发布（runbook）

:::caution 维护者文档
本文**不在**文档站默认侧栏。面向把 [`mcp/`](https://github.com/erdonline/erdonline/tree/main/mcp) 登记到 [MCP Registry](https://registry.modelcontextprotocol.io/) 的维护者。终端用户请看 [用 MCP 让 Cursor 读取 ER 图](https://doc.erdonline.com/docs/guide/api-and-mcp/)。
:::

**状态：📋 未发布。** 2026-08-28 用现有 `gh`（`whaty`）/ 仓密钥**不能**完成发布。当前 30 秒路径仍是 GitHub Release tarball + `npx`，不是 Registry。

官方流程（2026 preview）：[Quickstart](https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/quickstart.mdx) · [Package types](https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/package-types.mdx) · [Auth](https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/authentication.mdx) · [GitHub Actions](https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/github-actions.mdx)。

## 为何本机发不出去

| 阻塞 | 原因 |
|---|---|
| npm 制品 | Registry **只托管元数据**。`registryType: npm` 要求包已在 `registry.npmjs.org` 且 `package.json` 含匹配的 `mcpName`。仓内 `@erdonline/mcp` 仍 `"private": true`；`gh secret list` 无 `NPM_TOKEN`。**本切片不发 npmjs。** |
| GitHub Release `.tgz` | **不是**支持的 `registryType`。MCPB 要 `.mcpb` + `fileSha256`；我们的 `erdonline-mcp-0.1.0.tgz` 是 `npm pack`。 |
| GitHub 登录 | `mcp-publisher login github` 是 **device OAuth**（打开 `github.com/login/device`）。现有 `gh` 会话不能代替。组织命名空间 `io.github.erdonline/*` 还要求登录账号是 **erdonline org Owner**，CI PAT 需 `read:org`（无 repo scope）。`whaty` 只能发 `io.github.whaty/*`，不要用。 |
| DNS / HTTP | `com.erdonline/*` 要域名 apex TXT 或 `/.well-known/mcp-registry-auth` + 私钥。未配。 |

搜是否已在 Registry：

```bash
curl -sS 'https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.erdonline/erdonline'
```

应为空（未发）。

## 解锁后怎么发（精确命令）

前置：**npmjs 上公开 `@erdonline/mcp@0.1.0`**（`mcpName` 已写在 `mcp/package.json`），且维护者能对 erdonline org 做 GitHub device 授权。

```bash
# 1. 安装 CLI（macOS）
brew install mcp-publisher
# 或：curl -L "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" | tar xz mcp-publisher

# 2. 校验仓内草稿（不登录）
cd mcp
mcp-publisher validate   # 读 ./server.json

# 3. 人在浏览器完成 device 登录（必须是 erdonline Owner，不要用 whaty 个人命名空间）
mcp-publisher login github
# 打开打印的 https://github.com/login/device ，输入一次性码

# 4. 发布元数据（制品须已在 npm）
mcp-publisher publish

# 5. 核对
curl -sS 'https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.erdonline/erdonline'
```

期望：`name` = `io.github.erdonline/erdonline`，`websiteUrl` = `https://doc.erdonline.com/docs/guide/api-and-mcp/`，描述是 Git+Figma / `projectJSON`，**不是** ChatSQL。

CI 替代（仍要 `NPM_TOKEN` + org Owner）：workflow 里 `mcp-publisher login github-oidc`，`permissions: id-token: write`。见上游 GitHub Actions 文档。不要把 PAT 写进 URL。

## 草稿文件

- [`mcp/server.json`](https://github.com/erdonline/erdonline/blob/main/mcp/server.json) — 待发元数据
- [`mcp/package.json`](https://github.com/erdonline/erdonline/blob/main/mcp/package.json) — `mcpName` 必须与 `server.json` 的 `name` 一致

发成功后把本文状态改为 ✅，并在 `docs/growth.md` 台账打勾。
