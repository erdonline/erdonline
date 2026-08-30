# Cursor 连上 MCP：读一张 ER 图，提交一版建议

## 上一篇讲完「为什么」，今晚只验证「读得出来」

上一篇《开放 projectJSON + MCP 给 Agent》讲的是定位：不要把一句 prompt 丢给大模型「帮我画一张电商 ER 图」。那样通常会得到一份看起来合理、没法跟团队**已经在维护的模型**对上、也无法在设计器里做字段级 diff 的 DDL。Agent 该读的，是你们已经存版的 projectJSON，而不是再发明一张黑盒图。

这篇不重复那个「为什么」。今晚只做一件能亲手验证的事：**让 Cursor 连上 MCP，读你正在维护的那张图；必要时提交一版建议，人再打开版本 diff。**

写给谁：你已经在 [ERD Online](https://www.erdonline.com/) 登录过，工作台项目列表里至少有一张自己的图。官方 Demo 是只读分享，**铸不了 PAT**，分享链接也不是 API 密钥。还没有项目的，先新建或从模板复制一张，再回来跟做。

## 今晚三件可见的结果

1. 铸造 PAT，把配置粘进 Cursor 的 `mcp.json`，大约 30 秒后 Agent 能列出你的项目名。
2. 让它读某个项目的 projectJSON：它应报出表名和外键，而不是猜「用户表大概有个 id」。
3. 若铸造时勾了写权限，它只能走「创建版本」；你在设计器版本列表看 diff，通过或回滚。禁止它静默覆盖工作区。

逐步说明、完整 JSON、排障表与线上文档同一份：[用 MCP 让 Cursor / Claude 读取 ER 图](https://doc.erdonline.com/docs/guide/api-and-mcp/?utm_source=juejin&utm_medium=article&utm_campaign=mcp-agent&utm_content=cursor-mcp-read-and-suggest-version)。

## 第一步：铸造只读 PAT

登录后打开 **账户设置 → 访问令牌**：<https://www.erdonline.com/account/settings?selectKey=personalAccessTokens>

点铸造。默认 `projects:read` 和 `versions:read` 就够今晚把图读出来。明文以 `erd_pat_` 开头，**只显示一次**，复制走之后弹层关掉就再也看不到。

若分享链接能看图、调 API 却 401：分享只读 token 和 PAT 不是同一套面，别混用。

## 第二步：粘贴 Cursor 配置（不必 clone）

`docker compose up` 拉起的是应用本身，**不会**带上 MCP 进程。这是预期行为。30 秒路径用 `npx` 拉 GitHub Release 包，**不必**本机 `yarn build`。

把下面这段放进用户级 `~/.cursor/mcp.json`（Claude Desktop 结构相同）。把 `erd_pat_…` 换成你的（铸造弹层已填好），不要把真实令牌提交进 git：

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
        "ERD_API_URL": "https://api.erdonline.com",
        "ERD_PAT": "erd_pat_…"
      }
    }
  }
}
```

连官方站时保持上面的 `ERD_API_URL`；自己电脑上的实例改成 `http://127.0.0.1:9502`。

重载 Cursor 的 MCP 后，对 Agent 说：「列出我的 ERD 项目」。成功时工具列表里出现 `list_projects`，回复里是工作台能看到的那些项目名，不是空数组。再问：「读取项目某某的 projectJSON，列出所有表名和外键」。它应调用 `get_project` 或 `get_project_schema`，说出你在设计器里能看见的表——同一份 JSON，不是模型自己编的。

401 / 403：PAT 过期、scope 不够、或打到了错误环境。npx 拉不下包：检查 Release 地址是否 302。贡献者要从源码跑：`cd mcp && yarn install && yarn build`，再用 `node /ABS/PATH/to/erdonline/mcp/dist/index.js`（这是备选，不是 30 秒主路径）。

## 第三步：让它提交一版建议

需要写的时候，再铸造一枚 PAT，显式勾选 `versions:write`。对 Agent 说：「基于当前模型提交一版建议，版本说明写 Agent 建议，不要直接覆盖工作区。」它应调用 `create_version`。然后你打开设计器 → 版本列表 → 看表/字段/关系级 diff → 通过或回滚。

不要让它调用 `put_project_json` 悄悄改工作区——那会跳过人类审批。ERD Online 的壁垒是版本和协作；Agent 只是多一个读写客户端，不是替代评审的黑盒。

> 👉 **30 秒复制 Cursor MCP 配置**：https://doc.erdonline.com/docs/guide/api-and-mcp/?utm_source=juejin&utm_medium=article&utm_campaign=mcp-agent&utm_content=cursor-mcp-read-and-suggest-version

开源地址（MIT，欢迎 star / issue / PR）：https://github.com/erdonline/erdonline?utm_source=juejin&utm_medium=article&utm_campaign=mcp-agent&utm_content=cursor-mcp-read-and-suggest-version

## 收尾：人还是版本的主人

今晚如果三步都通了，你验证的不是「AI 会画图」，而是：**人和 Cursor 读的是同一份可审计的 JSON。** 配置随时可以从文档页再复制一份。公开 API 不暴露连接器上的任意 SQL；MCP 是旁路进程，PAT 自己保管，不要写进 compose 默认值。

30 秒复制 Cursor MCP 配置，从这里开始：见文末主链接（文档页带尾斜杠，与线上一致）。

#MCP #数据库设计 #ER图 #Cursor
