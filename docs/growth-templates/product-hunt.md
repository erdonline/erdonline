# Product Hunt Launch Template

> **发布时间**：周二或周三 00:01 PST（流量高峰）  
> **准备时间**：提前 3 天准备材料  
> **执行人**：cheap model 生成初稿，你审核

---

## Tagline（60 字符以内）

```
Git + Figma for database design
```

**备选**：
- `Open-source ERD tool with versioning & MCP`
- `Collaborative database design, open source`

---

## Description（260 字符以内）

```
Open-source ERD tool with versioning, real-time collaboration, and MCP for AI agents. Draw ER diagrams online, save versions like Git, edit with your team like Figma. Try the live demo in 30 seconds — no signup required.
```

---

## Topics（选 3 个）

- `Database Tools`
- `Developer Tools`
- `Open Source`

---

## Gallery（3-5 张图）

### 图 1：Hero（Landing 页截图）
- 展示"Git + Figma for database design"标题
- 突出 30 秒 demo 按钮

### 图 2：Demo 动线（GIF）
- 30 秒演示：打开 demo → 改一张表 → 存一个版本 → 看一次 diff
- 用 [ScreenToGif](https://www.screentogif.com/) 或 [Kap](https://getkap.co/) 录制

### 图 3：版本 Diff（截图）
- 展示两个版本的 diff 对比
- 突出"像 Git 一样管理 schema"

### 图 4：协作（截图）
- 多人同时编辑的 presence 效果
- 突出"像 Figma 一样协作"

### 图 5：MCP 集成（截图）
- 展示 Cursor 中调用 `list_projects` / `create_version`
- 突出"AI agent 也能读写"

---

## First Comment（发布后立刻评论）

```
Hi Product Hunt! 👋

I'm the maker of ERD Online. Here's why I built it:

**The Problem**
Existing database design tools force a trade-off:
- dbdiagram: pretty but closed, no versioning
- Navicat/PDManer: powerful but heavy, desktop-only
- drawio: free but doesn't understand databases

**The Solution**
ERD Online is Git + Figma for database design:
- **Versioning**: Every save creates a version you can diff and rollback
- **Collaboration**: Real-time multiplayer editing (like Figma)
- **Open**: projectJSON format + MCP for AI agents (Cursor, Claude, etc.)

**Tech Stack**
- Frontend: React 18 + UmiJS + TypeScript
- Backend: Spring Boot 3.5 + PostgreSQL
- Deployment: Docker Compose (one command)

**Try it now** (no signup): https://www.erdonline.com/demo

**GitHub**: https://github.com/erdonline/erdonline (MIT license)

I'd love your feedback on:
1. The versioning approach (Git-like snapshots + diff)
2. The MCP integration (AI agents reading/writing schema)
3. What features would make this a must-have for your team?

Thanks for checking it out! 🚀
```

---

## Launch Checklist

### 提前 3 天

- [ ] 准备 3-5 张截图/GIF
- [ ] 写 Tagline、Description、First Comment
- [ ] 测试 Demo 链接可用性
- [ ] 准备 X/Twitter 同步文案
- [ ] 邀请 5-10 个朋友/upvote（合规范围内）

### 发布当天（周二 00:01 PST）

- [ ] 00:01 发布
- [ ] 00:05 发 First Comment
- [ ] 00:10 在 X/Twitter 同步宣传
- [ ] 00:15 在 LinkedIn 同步宣传
- [ ] 01:00 回复所有评论（前 1 小时最重要）
- [ ] 06:00 再回复一轮评论
- [ ] 12:00 检查排名，如果进前 10 继续努力
- [ ] 23:59 发布结束，统计数据

### 发布后

- [ ] 写复盘：流量、注册、star 数
- [ ] 回复未回复的评论
- [ ] 把 Product Hunt 链接加到 README

---

## X/Twitter 同步文案

```
🚀 Launching ERD Online on @ProductHunt today!

Git + Figma for database design:
✅ Versioning (like Git)
✅ Real-time collaboration (like Figma)
✅ MCP for AI agents (Cursor, Claude)

Try the live demo (no signup): https://www.erdonline.com/demo

#opensource #database #devtools
```

---

## LinkedIn 同步文案

```
Excited to launch ERD Online on Product Hunt today! 🚀

After years of frustration with existing database design tools, I built an open-source alternative that combines:

• Git-like versioning (every save creates a diff-able snapshot)
• Figma-like collaboration (real-time multiplayer editing)
• MCP integration (AI agents can read/write your schema)

Tech stack: React 18 + Spring Boot 3.5 + PostgreSQL + Docker

Try the live demo (no signup required): https://www.erdonline.com/demo

Would love your feedback on the versioning approach and MCP integration.

#opensource #database #devtools #producthunt
```

---

## 成功指标

- **最低目标**：首日 100+ upvotes，500+ 访问，20+ 注册
- **理想目标**：首日 300+ upvotes，进入 Top 10，2000+ 访问，100+ 注册
- **失败线**：首日 < 50 upvotes → 复盘问题（标题？配图？时机？）

---

## 常见问题（FAQ）

**Q: 什么时候发布最好？**  
A: 周二或周三 00:01 PST。避开周一（大家都在忙）和周五（大家都准备周末）。

**Q: 需要准备多少张图？**  
A: 最少 3 张，最多 5 张。第一张是 Hero（最重要），第二张是 GIF 演示（最吸引人）。

**Q: 需要邀请朋友 upvote 吗？**  
A: 可以邀请 5-10 个朋友，但不要刷票。Product Hunt 会检测异常投票。

**Q: 发布后要做什么？**  
A: 前 1 小时最重要。回复所有评论，在社交媒体同步宣传，保持活跃。
