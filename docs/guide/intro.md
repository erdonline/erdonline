# 从这里开始

你现在只需要回答一件事：**今天想先做成哪一步？**

ERD Online 是开源（MIT）数据库建模工具：改表结构可以**存版本、看字段级 diff**，也能自托管。不想装环境时，先打开免注册 Demo 看一张真实关系图。

**马上试试**：[打开 Demo](https://www.erdonline.com/demo)（约 30 秒看到示例模型）

---

## 路径一：先感受产品（约 5 分钟）

适合：第一次听说，想确认「是不是我要的东西」。

1. 读一句定位与边界 → [ERD Online 是什么](./what-is-erd-online.md)
2. 在 Demo 里看图 → 复制到自己的项目 → 改一列 → **保存版本** → 看 diff → [保存版本并查看 diff](./save-version-and-diff.md)

做完你会留下一条自己的版本记录，而不是只看演示截图。

## 路径二：把已有模型迁进来

适合：手里已有 dbdiagram / `.dbml`，或线上库已经在跑。

| 你手里有… | 打开这篇 |
|---|---|
| `.dbml` / dbdiagram 导出 | [导入 DBML](./import-dbml.md) |
| MySQL / PostgreSQL / Oracle / SQL Server | [数据源逆向](./reverse-engineer.md) |
| 想和其它工具比差异 | [工具对照](https://www.erdonline.com/compare) |

迁入后**立刻存一版**当基线，后面改结构才有可比的 diff。

## 路径三：数据留在自己环境，或交给脚本

适合：要内网部署、团队审批，或 Agent / 脚本读写同一份模型。

| 目标 | 打开这篇 |
|---|---|
| 本机五分钟起栈 | [五分钟自托管](./quick-self-host.md) |
| 完整部署与云拓扑 | [部署指南](../deployment.md) |
| 团队角色与 SQL 审批 | [角色与审批](./roles-and-approval.md) |
| 脚本 / Agent（API · MCP） | [API 与 MCP](./api-and-mcp.md) |
| 让 Cursor 读图再提交一版 | 同上；选 prompt `suggest-erd-version`。官方 Demo **不能**当 PAT。`create_version` 的 API 200 **不是**人批准 |

---

## 文档怎么读（30 秒）

- **使用指南**（本栏）：「怎么做」——你现在在这里
- **自托管与开放接口**：部署、数据格式、安全
- **贡献与工程**（默认折叠）：给要提 PR 的人，不是上手必读

外发长文摘要入口：[指南索引](pathname:///blog)
