# ERD Online 是什么

如果你在找「能像 Git 一样记住表结构怎么变、又像画布一样好改」的工具，你大概找对了。

**一句话**：开源（MIT）数据库建模 —— **存版本、看 diff、可自托管**；也可以先用免注册 [Demo](https://www.erdonline.com/demo) 看一张真实关系图。

## 适合你，如果…

- 团队需要留下「谁、何时、改了什么字段」的设计态记录  
- 想从 dbdiagram / 存量库迁到可协作、可自托管的环境  
- 希望用开放 `projectJSON` / API / MCP，把模型交给脚本或 Agent  

## 不太适合，如果…

- 只要一张静态 ER 截图、从不改结构 → **draw.io** 等通用画图可能更轻  
- 只关心已落库的 DDL 迁移历史、不关心设计态 diff → 继续用 Flyway 等即可；本产品补的是**设计阶段**追溯  
- 需要完整企业 IAM / SSO 开箱替代 → 当前是**项目级**角色与审批，不是全家桶 IAM  

## 你会经常用到的能力

| 能力 | 你得到什么 |
|---|---|
| 关系图画布 | 表、字段、外键可视化编辑 |
| 版本与 diff | 保存快照；任意两版比对表 / 字段 / 关系 |
| DBML 导入导出 | 与 dbdiagram 等工具互通 |
| 数据源逆向 | MySQL / PostgreSQL / Oracle / SQL Server |
| 协作与权限 | 多人同项目；角色与 SQL 审批 |
| 自托管 | `docker compose up -d` |

## 第一次打开 Demo 你会看到什么

- 示例项目（如 RBAC / 业务表示例），画布上有表与关系  
- 顶栏可能标 **只读**：这是分享演示，不是空壳落地页  
- 要真正改结构并保存版本：点 **复制到我的项目**（或先 **注册 / 登录**）  

若页面一直转圈或空白，见下方排障。

## 常见问题

| 现象 | 可尝试 |
|---|---|
| Demo 打不开 / 一直转圈 | 换网络或稍后再试；确认是 [www.erdonline.com/demo](https://www.erdonline.com/demo) |
| 想改表但提示只读 | 点 **复制到我的项目** 或登录后再进设计器 |
| 想连自己的数据库 | Demo / 公开分享**不能**连私有库 → [五分钟自托管](./quick-self-host.md) |
| 想和 draw.io / dbdiagram 对比 | [对照页](https://www.erdonline.com/compare)（含外键语义一行） |

## 下一步

1. [保存版本并查看 diff](./save-version-and-diff.md) — 走通核心闭环（推荐）  
2. [导入 DBML](./import-dbml.md) 或 [数据源逆向](./reverse-engineer.md) — 迁入已有模型  
3. [五分钟自托管](./quick-self-host.md) — 数据留在自己环境  

定位与取舍长文（维护者）：[愿景](../vision.md)
