---
title: Agent 写的改表，你真敢点 Approve？
slug: agent-wrote-migration-approve
status: ready
platforms: [juejin, csdn, oschina, zhihu]
cta: demo
utm_campaign: mcp-agent
created: 2026-08-30
guide: docs/guide/save-version-and-diff.md
---

## 周二下午，那个 Approve 按钮

周二下午三点，Slack 弹出一条 PR 通知。Junior 在群里说：「这是 Cursor 帮我生成的 migration，你帮看一眼？」

你点开 diff。八十行 `ALTER TABLE`。加列、改类型、补索引、挂外键——每一行单独看都认识，语法规范，命名也符合团队习惯。机械上，**看起来都挺合理**。

但连起来呢？`biz_order` 上那条 `NOT NULL` 没给 default，老数据跑不跑得过去？`sys_user` 那次改类型，锁表要多久？down migration 能不能回到上一版 schema？PR 描述里写「Agent 自评：应该没问题」——这不是证据。

全盘打回吧，像在挡团队效率、在反 AI。直接点 Approve 吧，签名的却是你。出了事，复盘会上问「这版谁审的」，你只能答：「CI 过了，我看着也行。」

你不可能每个 PR 都自己搭库跑一遍。上周刚发生过：`order_item` 少建了到 `biz_sku` 的外键，上线后报表 JOIN 空结果，排查到凌晨两点。那次 migration 也是「看着合理」——字段都在，就是少了一行 `REFERENCES`。最后只剩两种演法：装懂，评两句 naming 就点了；装严，让人改三轮格式，少了一张关联表还是没人发现。

## 这个失败有名字：审了等于没审

这不是「review 不够仔细」的道德问题。它有名字——**审了等于没审**：生成速度上去了，人的审读速度没变。Agent 三秒吐八十行 ALTER，你的大脑还是按「一行一行读 SQL」的旧节奏在跑。SQL diff 里全是噪声——`VARCHAR(64)` 变 `VARCHAR(128)` 占半屏，真正会炸的语义变化（少了一张关联表、外键指错父表）埋在中间，和格式改动长得一样。

行业里有人把这类判断概括成一句：**No human can review at this speed.** 不是贬低人，是在说机制：当输出是「可执行的语句」而输入是「八十行字符 diff」，Lead 实际上在盲签。会丢人、会背锅的那一下，发生在复盘会，不在 GitHub 的 Approve 界面。

还有一个更隐蔽的版本：**这 80 行 ALTER 里，哪三句是幻觉？** 不是语法错，是语义错——Agent 参照了过期的 `@schema.sql`，发明了一张「应该有」的关联表；或者把 `del_flag` 的默认值写成了团队从来不用的那一个。每一行都能执行，连起来会在某个你没想到的查询里炸。

## 你已经试过的四件事

**更严的 CI。** Lint migration 文件名、检查 down 文件是否存在、跑 `sqlfluff`。有用，但 CI 验的是格式和可解析性，不是「这张表 Tuesday 峰值会不会锁死十分钟」。绿灯不等于「我敢签 Approve」。

**让 Agent 自评。** 「请检查这个 migration 是否有风险，输出 confidence score。」模型会礼貌地给出「低风险」——它和你一样，没有在真实数据量上跑过那条 `ALTER`。自评是语气，不是验收。

**声明式 diff 工具。** Prisma、Atlas 一类，能告诉你「模型相对上一版改了什么」。这是进步——至少 diff 的对象从 raw SQL 变成了结构声明。但声明仍不是「将要执行的语句」：最终落库的 migration 还能和声明分叉；而且声明 diff 照样是字段级噪声，不会自动告诉你「这次改动业务上意味着什么」。

**更细的 code review 规范。** 「migration 必须两人 approve」「禁止 Agent 直接 push main」。流程对了，审的对象还是 SQL 噪声。第二个人如果只是扫一眼 green CI，你们就有了两个「看着也行」的签名。

## 实时目录和 SQL diff 都救不了这一半

有人会说：让 Agent 连 live DB，至少列名不会幻觉。Job 1 已经说过——生产凭证进 IDE 是红线，240 张表 dump 爆 context，权限过滤后的 schema 是另一种幻觉。就算结构读对了，**Lead 要审的仍然不是结构**。

Lead 要回答的是产品在会上那个问题：「这次改表会不会炸？」——需要的是「相对**上一批准版**，语义上改了哪几处」，不是 eighty lines of `ALTER`. 实时目录 MCP 解决的是「列在不在」；**语义**（这张表还软删吗、这个状态码还有效吗、这个外键是不是该指向 `sys_user` 而不是 `biz_user`）在注释里、在评审记录里、在**人批准过的版本**里，不在 `information_schema`.

所以困境不是「缺一个更好的 SQL linter」，而是**审错对象**：你在 Approve 一份将要执行的语句，却没有一份「已批准的意图」可以对齐。

## 换一个审读对象：版本 diff，不是 migration diff

我们的做法是把 Agent 的写路径从「吐 SQL 让你签」换成「**声明意图 → 存成版本 → 人在设计器里 diff**」。

流程是这样的：

1. 团队在设计器里维护 schema，每次改动存成**命名版本**——这份 `projectJSON` 就是已批准的契约。
2. Agent 要改表，不调 `put_project_json` 覆盖工作区（API 200 也不等于人批准），而是调用 **`create_version`**：提交一版「建议变更」，附说明。
3. Tech Lead 打开**版本 diff**——看的不是 eighty lines of SQL，而是：新增了哪张表、删了哪个字段、哪条外键从 A 改挂到 B。表上的中文名和备注把部落知识带出来：`status` 旁写着「1=有效 9=脏数据」，比 `CHAR(1)` 更接近你要审的语义。
4. 指着 diff 里三处变化说「这三处我都看过了」，再点通过——这时产生的命名版本，才是可以写进 changelog、可以跟 Agent 声明对齐的**已批准版**。

设计器 diff 长什么样？新增字段会整块高亮；外键从 `sys_user` 改挂 `biz_user` 会单独一行标出；删表不会藏在某个 `DROP` 语句的第 47 行——它是一整张表的消失。你在审**结构意图**，不是猜 `ALTER` 执行顺序会不会锁库。锁库、回填、灰度——那些仍由 DBA 和 CI 在 migration 阶段处理；Lead 这一关只回答：「团队是否同意 schema 变成这样？」

DDL 草稿可以从已批准版本生成，供 DBA 参考；**ERD 不执行 SQL**，迁移落库仍是 Atlas / Flyway / 你们自己的 CI 的事。Agent 拿不到生产凭据，Lead 也不用盲签 raw migration。

这和「让 Agent 写 migration 你签 SQL」的差别，一句话：**API 200 不是人批准**；批准发生在设计器里看完 diff 之后。

## MCP 在这里做什么（以及还没做什么）

到这一步，你可能才想要 MCP——不是开头就装。

今天 MCP 已经有的写路径只有 **`create_version`**：Agent 读完已批准版本的 `list_tables` / `describe_table`，改完模型，提交一版建议；你去设计器里 diff。读契约的方式见 [用 MCP 让 Cursor 读取 ER 图]({{DOC:guide/api-and-mcp}})；存版与 diff 的操作见 [如何保存版本并查看 diff]({{DOC:guide/save-version-and-diff}})。

还缺的一块诚实地讲：**语义级 `diff_versions`**——在 MCP 里直接问「v1.3 相对 v1.2 改了哪三处语义变化」，而不是自己肉眼扫版本面板。这是 Job 2 的建设目标；在工具到位之前，Lead 仍要在设计器里打开两版比对——但比对对象至少已经是**契约**，不是 SQL 噪声。

可选能力（规划中）：从两版契约生成 DDL 草稿，给 DBA 当起点，**仍不执行**。merge 前的硬门禁、DBA 否决权——那是另一条旅程（Job 4）的事；本篇停在 Lead 的 Approve 按钮：你签的是看过 diff 的意图，不是 Agent 吐出来的 eighty lines.

## 结尾的 CTA 不是装 MCP

这篇的下一步不是「先去装一个 MCP」。是更基本的一件事：**先存一个版本，走一遍 diff 审批**。

打开 demo，改一张表，存一个命名版本，再改一处，再存一版，打开 diff 看两处差异——30 秒，不用注册。走通一次之后，下次 Junior 在群里丢「Agent 生成的 eighty lines」，你可以回一句：「先 `create_version`，把 diff 链发我」——审的对象从 SQL 换成契约，Approve 才不再是盲签。如果你还没走过「Agent 建议 → 人 diff → 批准」这条路径，先用自己手改的两版练眼：diff 里「新增字段」和「改外键指向」长什么样，下次 Agent 调 `create_version` 你才知道该看哪里。

存下第一个命名版本的那一刻，你才有「上一批准版」可以对齐。没有这版基线，Agent 写的 eighty lines 你只能盲签——Approve 按钮在那里，敢不敢点，取决于你审的是 SQL 还是契约。

{{CTA}}

#MCP #数据库设计 #ER图 #Cursor
