---
title: 30 秒免注册：打开这个链接，改一张表，存一个版本
slug: thirty-seconds-demo-version
status: ready
platforms: [juejin, csdn, oschina, zhihu, v2ex]
cta: demo
utm_campaign: launch
xhs_title: 30 秒：改表 → 存版本
created: 2026-08-09
---

## 不注册、不装客户端

[ERD Online](https://github.com/erdonline/erdonline) demo 是完整设计器，不是 GIF。打开 → 改 → 存版 → 看 diff，四步约半分钟。下面只列操作，不讲故事。

## 1. 打开 demo

示例项目已加载，直接进 ReactFlow 画布。无需账号。

## 2. 改一张表

点任意表 → 右侧字段面板 → 新增一列，例如 `user.nickname`，类型 `VARCHAR(64)`。保存后画布与 projectJSON 同步。

## 3. 存版本

工具栏 **保存版本** → 版本号填 `0.0.2-demo` → 说明写「demo 试改 nickname」→ 确认。这是 Git 式快照，不是导出文件。

## 4. 看 diff

**版本管理** → 选「上一版」与「刚存的版」→ diff 面板列出表/字段/关系变更。不用 Beyond Compare 贴两份 DDL。

{{CTA}}

## 试完若还想多走一步

- **DBML**：空态粘贴 DBML 可导入；也可导出给 dbdiagram 系工具。
- **逆向**：MySQL / PostgreSQL / Oracle / SQLServer 存量库可逆向成关系图（完整项目需注册或自托管）。
- **协作**：多人实时改模型 + 三级角色审批，开源版自带。
- **自托管**：MIT + 根目录 `docker compose up -d`。
- **对照**：和 dbdiagram / draw.io 等差异见 `/compare` 公开对照页（版本 diff、开源自部署等维度）。

若你在 V2EX / 即刻看到这篇：欢迎回帖说卡在哪一步——我们优先修 demo 路径上的静默失败，而不是堆新功能。

细节见[文档站]({{DOCS}})。

## 路线图与参与

- 文档 / 路线图：[文档站]({{DOCS}})
- Issue / PR / star：[GitHub 仓库]({{REPO}})

顺手点个 star 或提 issue——我们优化的是「改模型 → 存版 → 看 diff」闭环，不是又一个只能截图的 ER 工具。
