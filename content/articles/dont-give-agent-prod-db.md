---
title: 别再让 AI Agent 直连生产库了
slug: dont-give-agent-prod-db
status: ready
platforms: [juejin, csdn, oschina, zhihu]
cta: demo
utm_campaign: mcp-agent
created: 2026-08-29
guide: docs/guide/api-and-mcp.md
---

## 报错那一秒

周五晚上，你让 Cursor 写一条查询：订单表联用户表，按最近登录时间排序。它三秒给出答案，语气自信得像 DBA：

```sql
SELECT o.id, o.amount, u.last_login_at
FROM biz_order o
JOIN sys_user u ON u.id = o.user_id
ORDER BY u.last_login_at DESC;
```

粘进客户端，回车：

```text
ERROR: column "last_login_at" does not exist
LINE 2: SELECT o.id, o.amount, u.last_login_at
```

表里没有 `last_login_at`。也从来没有过。模型不知道，它只是觉得这个列「应该有」。

## 这个失败有名字：编列

这不是「AI 还不够聪明」的问题，它有名字——**编列**（invented column）：模型在没有任何事实来源的情况下，凭空发明一个看起来合理的列名，然后用不容置疑的语气写进 JOIN。

编列之所以危险，是因为它**不像错误**。`last_login_at` 出现在 90% 的用户表里，语法正确、命名规范、连缩进都对。它混在十条正确的 JOIN 里，你很难一条条核对。等你发现，通常是在 code review 被同事指出来，或者更糟——在生产报错日志里。

## 你已经试过的三件事

**更好的 prompt。**「不要发明列名，只用我给的 schema」——写进系统提示，第一天有效，第三天上下文一长就忘了。prompt 是愿望，不是约束。

**`@schema.sql`。** 把建表语句导出一份塞进 context。这是目前最诚实的做法，但它有两个洞：一是**过期**，上周导出的文件不知道这周有人加了列；二是**没人维护**，它不在任何审批流里，谁都能改，改了对不上库也没人发现。

**实时目录 MCP。** 让 Agent 直接查数据库的 information_schema。方向是对的——给模型一个事实来源，而不是让它猜。这类工具（postgres-mcp、各家云厂商的 MCP）确实解决了「别再幻觉列名」的一半问题，值得承认。

## 但实时目录只做了一半

真把生产库接进 IDE，你会撞上四堵墙：

**权限过滤后的 information_schema 是另一种幻觉。** 你给 Agent 的数据库账号大概率看不到全部表——它查出来的「完整 schema」只是它有权看到的那部分。模型不会告诉你「我只看到 60% 的表」，它会在缺失的那 40% 里继续编列。

**240 张表全量 dump 会爆上下文。** 真实项目的 schema 不是 demo 里的 8 张表。全量塞进去，要么截断，要么把真正相关的三张表淹死在噪声里。

**生产凭证进 IDE 是红线。** 这一条不用展开。你的 `.cursor/mcp.json` 会进 git、会被截图、会被同步到你不记得的设备上。只读账号也是生产账号。

**tool-list 缓存到重启才刷新。** 同事上午加了列，你的 Agent 下午还在用缓存里的旧 schema 写 SQL——你回到了 `@schema.sql` 的过期问题，只是更隐蔽。

还有一层更根本的：**结构不等于语义**。information_schema 能告诉你 `status` 是 `CHAR(1)`，但告诉不了你 `status = '1'` 是有效、`'9'` 是脏数据；能告诉你有 `del_flag`，告诉不了你「所有查询都要带 `del_flag = '0'`」这类部落知识。结构问题正在被实时目录解决，语义问题它碰不到——因为语义根本不在库里，在人的脑子里和评审记录里。

## 换一个事实来源：读契约，不读生产库

我们的做法是把事实来源从「生产库」换成「**已批准的版本**」。

在 ERD Online 里，表结构在设计器里维护，每次改动存成一个命名版本，人能 diff、能回滚。这份 `projectJSON` 就是契约：它经过人的眼睛，不含任何数据库密码（`profile.dbs` 在 API 层强制清空），而且天然带语义——列上的中文名和备注，就是「`del_flag = '0'`」这类知识落盘的地方。

Agent 读这份契约，而不是连生产库。三个直接后果：

- **零凭证**：IDE 里只有一枚项目级 PAT，没有任何数据库账号。
- **不过期**：契约随版本更新，Agent 读到的就是团队刚批准的那一版。
- **可追责**：Agent 基于哪一版写的 SQL，版本号摆在那里。

## 渐进披露，而不是全量 dump

契约也可能很大，所以读法很重要。我们给 MCP 加了两个契约读工具，刻意做成「先列表、再按需展开」：

`list_tables` 只返回表名、中文名、字段数——8 张表的项目返回 8 行，240 张表的项目返回 240 行，都不至于爆上下文。Agent 挑出它真正需要的两三张，再调 `describe_table` 拿字段和外键邻域（谁引用我、我引用谁）。

关键是表名写错时的行为。Agent 猜了一个不存在的表，得到的不是沉默或编造，而是：

```json
{
  "found": false,
  "query": "user_id",
  "suggestions": ["sys_user", "sys_user_role"],
  "hint": "Table not in the approved contract. Retry with one of the suggestions; do not invent columns."
}
```

`found:false` 加候选列表——编列在工具层就被挡住了，不靠 prompt 里的「请不要幻觉」。

这两个工具读的是已批准版本的快照（传 `versionId` 即锁定某一版），不执行 SQL，不连任何数据库。配置方式和既有工具相同，见 [用 MCP 让 Cursor 读取 ER 图]({{DOC:guide/api-and-mcp}})。

## 结尾的 CTA 不是装 MCP

这篇的下一步不是「先去装一个 MCP」。是更基本的一件事：**给你的模型存一个版本**。

打开 demo，改一张表，存一个命名版本，看一次 diff——30 秒，不用注册。存下第一个版本的那一刻，你才有了一份 Agent 敢读、你敢让它读的契约。之后接不接 MCP，都是顺手的事。

{{CTA}}

#MCP #数据库设计 #ER图 #Cursor
