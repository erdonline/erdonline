---
title: Cursor 连上 MCP：读一张 ER 图，提交一版建议
slug: cursor-mcp-read-and-suggest-version
status: ready
platforms: [juejin, csdn, oschina, xiaohongshu, weixin, zhihu, segmentfault]
cta: mcp
utm_campaign: mcp-agent
xhs_title: Cursor 连上 MCP 读一张 ER 图
created: 2026-08-28
guide: docs/guide/api-and-mcp.md
---

## 开场：Agent 不该再画一张黑盒图

上一篇讲了为什么要开放 [projectJSON + MCP]({{DOC:guide/api-and-mcp}})，而不是「一句话生成 ERD」。这篇只做一件能今晚验证的事：**让 Cursor 读你正在维护的那张图，必要时提交一版建议，人再 diff。**

不是让模型替你设计电商库。是让它看见你们已经存版的表、字段、外键，然后在权限内说话。

## 你今晚会得到什么

- 铸造 PAT 后粘贴 Cursor mcp.json，30 秒列出项目
- Agent 读取 projectJSON，看表和外键，而不是猜
- 写权限只走创建版本，人在设计器里 diff

官方 Demo 只能看图，**不能**当 API 密钥。需要登录后自己的项目 + PAT。
Cursor / Claude 工具名是 `list_projects`、`get_project_schema`、`create_version`。

## 三步（文档页可复制）

1. 登录 [ERD Online](https://www.erdonline.com/) → 账户设置 → 访问令牌，铸造 PAT（明文只一次）。只读即可先跑通。
2. 克隆仓库，在 `mcp/` 里 `yarn install && yarn build`（MCP **不在** docker-compose 默认镜像里）。
3. 把文档里的 JSON 粘进 `~/.cursor/mcp.json`。官方实例的 `ERD_API_URL` 是 Railway API 根；自托管改成 `http://127.0.0.1:9502`。

逐步说明、完整 JSON、排障表：[如何使用公开 API 与 MCP]({{DOC:guide/api-and-mcp}})。

对 Agent 说：

- 「列出我的 ERD 项目」
- 「读取项目 X 的 projectJSON，总结有哪些表和外键」
- （可选）「基于当前模型提交一版建议，说明写 Agent 建议，不要直接覆盖工作区」

最后一句是关键：**禁止** Agent 静默 `put_project_json`。那会跳过人类审批。正确路径是 `create_version`，你打开版本 diff。

{{CTA}}

## 和小红书上那条「开放 MCP」的关系

那条是定位帖。这条是操作帖。读完如果还是去搜 ChatGPT「帮我画 ER 图」，你拿到的是无法审计的 DDL；接到 MCP 之后，Agent 和同事改的是同一份 JSON。

## 开源与边界

MIT；MCP 是旁路进程，PAT 自己保管，不要写进 compose 默认值。公开 API **不**暴露 connector 任意 SQL。壁垒仍是版本 + 协作，AI 是期权——见 [ADR-0012]({{DOC:adr/0012-ai-era-data-structure-platform}}) / [ADR-0013]({{DOC:adr/0013-public-api-mcp}})。

## 路线图与参与

- 30 秒配置：[API 与 MCP]({{DOC:guide/api-and-mcp}})
- 文档站：[文档]({{DOCS}})
- Issue / PR：[GitHub 仓库]({{REPO}})
