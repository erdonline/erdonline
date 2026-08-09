# 如何使用公开 API 与 MCP

想让脚本或 AI Agent 读写**同一份** projectJSON（和设计器里看到的模型一致）？走鉴权后的 REST / MCP，而不是把分享链接当 API 密钥。

> **目标**：用 PAT / OAuth 或 MCP 读写模型（必须鉴权）。  
> **前置**：可登录实例（通常先 [自托管](./quick-self-host.md)）；格式见 [data-format](../data-format.md)。

## 你会得到什么

- REST：项目列表 / 详情等（成员 ACL；连接密钥不会出现在返回的模型 JSON 中）  
- 版本：可读历史；有写权限时可创建版本  
- MCP：把上述能力映射为 Agent 工具（stdio 或 HTTP）

## 步骤

1. 确认实例已运行，且你对目标项目有成员权限。  
2. 在产品内创建 **PAT**，或配置 OAuth Client（账户 / 开发者设置一类入口）。  
3. 用 PAT 调 REST 只读接口，核对返回的 projectJSON 与设计器一致。  
4. 需要时再开通写 scope（改项目、存版本）。  
5. 若用 MCP：按仓库 [`mcp/README.md`](https://github.com/erdonline/erdonline/blob/main/mcp/README.md) 配置传输与 Token，在 Cursor / Claude 等客户端加载。

## 成功时你会看到什么

- 只读请求返回 200 与完整模型结构（**无**数据库密码字段）。  
- 写版本后，设计器版本列表出现对应记录。  
- MCP 客户端能列出工具并成功调用只读工具。

## 常见问题 / 排障

| 现象 | 可尝试 |
|---|---|
| 401 / 403 | 检查 PAT 是否过期、scope 是否足够、是否打到正确环境 |
| 分享链接能看图但 API 失败 | 分享只读 token **不能**当 API 凭证 |
| MCP 连不上 | 确认 MCP 进程已单独启动；Token / 端口与文档一致 |
| compose 起来了但没有 MCP | 预期行为；MCP 在 `mcp/` 目录另启 |
| 想改模型 schema 含义 | 遵守「仅加法」；见 [data-format](../data-format.md) |

## 下一步

- [projectJSON 数据格式](../data-format.md)  
- [安全模型](../security-model.md)  
- [从这里开始](./intro.md)
