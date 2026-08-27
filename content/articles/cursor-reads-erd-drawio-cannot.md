---
title: Cursor 读得懂你的 ER 图，draw.io 连外键都不认识
slug: cursor-reads-erd-drawio-cannot
status: ready
platforms: [juejin, csdn, oschina, weixin, zhihu, segmentfault, xiaohongshu]
cta: demo
utm_campaign: launch
xhs_title: Cursor 懂 ER，draw.io 不懂外键
created: 2026-08-28
guide: docs/guide/what-is-erd-online.md
---

## 开场：同一张图，机器读不读得懂

draw.io 画出来的 ER「图」很好看：框对齐、箭头上色、导出 PNG 丢进评审。麻烦是：**那条线对机器来说不是外键。** 它没有「指向哪张表哪一列、ON DELETE 是 CASCADE 还是 RESTRICT」；Cursor 打开这份 XML / PNG，只能看见形状，看不见约束。

Google 上搜 draw / create / make ER diagram 的人，多半正在用通用画图凑合。这篇不卖「一句话生成 ER 图」，也不做 ChatSQL。只验证一件能亲手点开的事：**把同一份模型放进真正的建模器之后，人和 Agent 读的是同一份带语义的 JSON，而不是一张图。**

## 为什么 draw.io 过不了这一关

通用画图把「表」当成矩形，「关系」当成路径。字段类型是你手打进文本框的字；索引、注释、约束名要靠自觉。换一台电脑、换一个评审，上一版长什么样只能翻文件名。

数据库建模器把这些写成结构：表、列、类型、外键写进 **projectJSON**，能导出 DDL，能两版 diff，能给 Agent 当事实源。draw.io 不是做错了——它本来就不是建模器。错的是**拿它当 ER 工具用了三年**，每次落库都要人工把箭头「翻译」成 SQL。

对照不必背：外键、类型、逆向、DBML、版本 diff，通用画图全靠人；建模器写进模型。细节见上一篇《还在用 drawio 画 ER 图？它根本不知道什么是外键》。今晚要的是 **30 秒亲手看到关系线是真外键**，不是再读一张表。

PNG 还有一个更隐蔽的成本：它没法进 CI。你不能对一张图跑 schema lint，也不能让流水线判断「这次 PR 有没有加列」。projectJSON 可以：人在设计器里改，Agent 按 PAT 只读，脚本用 REST 拉同一份再校验形状。draw.io 文件进 Git 只能 diff XML 噪音，看不出「用户表少了一个邮箱字段」。

## 今晚三件可见的结果

1. 免注册打开 demo，画布上不是装饰框，是带字段类型的表。
2. 导入一小段带 `Ref` 的 DBML，关系线出现；改一个字段，保存版本，diff 里能看到那一列。
3. （可选，已登录）铸造 PAT 后让 Cursor 列出项目名——它报的是表名，不是「用户表大概有个 id」。官方 Demo **铸不了 PAT**，分享链接也不是 API 密钥。

## 30 秒：别再导出 PNG

1. 打开文末的 demo（免注册）。
2. 空态里点导入 DBML，粘贴两张表 + 一条 `Ref`。
3. 看关系线；给其中一表加字段，保存版本，打开 diff。

这一步过了，你验证的是：**模型里有外键，而不只是图上有箭头。** 截图丢给大模型「帮我画一张电商库」，通常得到一份看起来合理、没法跟团队已有模型 diff、也无法当 DDL 源的图——那是 PPT，不是设计稿。

{{CTA}}

已经有登录项目、想让 Cursor 读同一份 JSON：铸造 PAT，复制 Cursor `mcp.json`（揭示弹层里就能拷），步骤在 [用 MCP 让 Cursor / Claude 读取 ER 图]({{DOC:guide/api-and-mcp}})。写操作必须人在版本 diff 里审批，禁止 Agent 静默覆盖工作区。

## 收尾：搜索词是画图，壁垒是版本

搜 draw ER 进来的人，第一眼要的是「能画」。及格线是画布；留下来的原因是 **Git 式版本 + 协作**，Agent 可读是期权。H1 不会改成 ChatGPT。今晚若三步都通了，下一步不是再下一张 PNG，而是让这张图开始存版本。

#ER图 #drawio #数据库设计 #MCP #Cursor
