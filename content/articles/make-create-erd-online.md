---
title: 搜 make ERD online 时，别再打开又一个画框图
slug: make-create-erd-online
status: ready
platforms: [juejin, csdn, oschina, zhihu]
cta: demo
utm_campaign: launch
xhs_title: 在线做 ER 图，别再只画框
created: 2026-08-28
guide: docs/guide/what-is-erd-online.md
---

## 开头

Google 上敲 **make ERD online**、**create ERD online**，或 **ERD diagram maker**，结果页几乎全是「在线画框」：拖矩形、拉箭头、导出 PNG。五分钟能出一张好看的图，评审也能投影。麻烦在第二天——字段类型是文本框里手打的字，箭头没有「指向哪一列、ON DELETE 是什么」，上一版长什么样只能靠文件名猜。

你要的不是又一个画图站。你要的是：**打开就能建表、关系是真外键、改完能存一版**。这篇只验证这件事。不讲「一句话生成整库」，也不把 ER 图当成聊天的附件。

写给谁：正在搜在线 ER 工具、还没决定用哪款 maker 的人。已经有 dbdiagram 或 draw.io 存稿的，也可以先走 30 秒路径，再决定要不要搬家。

## 中间

「在线做 ER 图」听起来像画图，做起来却是建模。通用画图把表当成矩形、关系当成路径；真正的 ERD diagram maker 把表、列、类型、外键写进同一份模型。那份模型能导出 DDL，能两版 diff，能给脚本当事实源。箭头好看、落库时还得人工翻译成 SQL——那是 PPT，不是设计稿。

对照不必背：外键、类型、逆向、DBML、版本 diff，画框图全靠人；建模器写进结构。公开对照页把 dbdiagram、draw.io 和开源建模摊在一张表上，版本链、外键语义、自托管一眼能看。搜 maker 的人常在比功能清单；真正该比的是：**改完能不能追溯，数据能不能出 SaaS**。

[ERD Online](https://www.erdonline.com/) 的定位是数据库设计的 Git + Figma：画布是及格线，版本和协作才是留下来的原因。ReactFlow 关系图、Crow's foot 基数、DBML 导入、四库逆向，都是为了让「create ERD online」这一步不像在画 PPT。它不和极简 DSL 拼「五分钟出一张漂亮图」；它押的是每次有意义的改动能存版、任意两版能看表/字段/关系级 diff。

### 30 秒亲手验证（免注册）

1. 打开文末 demo，进示例项目画布。无需账号。
2. 点一张表，加一列，例如 `user.nickname`，类型 `VARCHAR(64)`。
3. 点保存版本，填版本号；打开版本管理，选两版看 diff，确认那一列出现在变更里。

空项目也可以：导入一小段带 `Ref` 的 DBML，关系线应出现。这一步过了，你验证的是 make / create ERD online 的最低标准——**模型里有外键，而不只是图上有箭头**。

Demo 是只读分享，改结构要复制到自己的项目。MIT 许可，内网可用 `docker compose up -d` 自托管。官方 Demo **铸不了**访问令牌；若以后要让编辑器读同一份 JSON，那是已登录后的次路径，不是今晚的门槛。

诚实边界：概念草图、一次性评审截图，draw.io 仍然够用。只有当这张图要演进、要对齐生产库、要给别人接着改，才值得换到懂外键的 maker。导入 DBML 或从存量库逆向之后，立刻存一个版本当基线——没有基线，后面的 diff 无从谈起。

{{CTA}}

还在横评哪款 ERD diagram maker：打开 [竞品对照](https://www.erdonline.com/compare)（版本 diff、外键语义、自托管摊在一张表上）。

## 结尾

搜 make / create ERD 进来的人，第一眼要的是「能画」。画完若不能存版、不能 diff、不能当 DDL 源，明天还是截图。产品首页不会改成聊天机器人。今晚三步通了，下一步不是再导出一张 PNG，而是让这张图开始有版本。

30 秒免注册：改一张表，存一个版本。对照页随时可回看差异，不必把功能清单背下来。

#ER图 #数据库设计 #ERD #开源
