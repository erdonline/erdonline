# Cursor 连上 MCP 读一张 ER 图

上一篇讲了为什么要开放 projectJSON + MCP，而不是「一句话生成 ERD」。这篇只做一件能今晚验证的事：让 Cursor 读你正在维护的那张图，必要时提交一版建议，人再 diff。

- 铸造 PAT 后粘贴 Cursor mcp.json（npx Release 包，不必 clone），30 秒列出项目
- Agent 读取 projectJSON，看表和外键，而不是猜
- 写权限只走创建版本，人在设计器里 diff

30 秒复制 Cursor MCP 配置 👇

👉 https://doc.erdonline.com/docs/guide/api-and-mcp/?utm_source=xiaohongshu&utm_medium=article&utm_campaign=mcp-agent&utm_content=cursor-mcp-read-and-suggest-version

开源地址：https://github.com/erdonline/erdonline?utm_source=xiaohongshu&utm_medium=post&utm_campaign=mcp-agent&utm_content=cursor-mcp-read-and-suggest-version
