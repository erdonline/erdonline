# Hacker News (Show HN) Template

> **发布时间**：周二或周三 9-11 AM PST  
> **频率**：每 2 周一次（不要刷屏）  
> **执行人**：cheap model 生成初稿，你审核

---

## 标题（80 字符以内）

```
Show HN: ERD Online – Open-source database design with versioning and MCP
```

**备选**：
- `Show HN: Git + Figma for database design (open source)`
- `Show HN: Collaborative ERD tool with versioning and AI agent support`

---

## 正文（纯文本，无 Markdown）

```
Hi HN,

I built ERD Online because existing database design tools force a trade-off:

- dbdiagram: pretty but closed, no versioning
- Navicat/PDManer: powerful but heavy, desktop-only
- drawio: free but doesn't understand databases

ERD Online is Git + Figma for database design:

**Versioning**: Every save creates a version you can diff and rollback. Treat schema like Git treats code.

**Collaboration**: Real-time multiplayer editing with presence (like Figma). Reviews and approvals land in auditable versions.

**Open**: projectJSON is a public format. AI agents can read your schema via MCP (Model Context Protocol) and suggest changes via create_version. You still diff and approve in the designer.

**Tech stack**:
- Frontend: React 18 + UmiJS + TypeScript
- Backend: Spring Boot 3.5 + PostgreSQL
- Deployment: Docker Compose (one command)
- License: MIT

**Try the live demo** (no signup):
https://www.erdonline.com/demo

**GitHub**:
https://github.com/erdonline/erdonline

**What I'd love feedback on**:

1. The versioning approach (Git-like snapshots + diff). Is this the right mental model for schema changes?

2. The MCP integration. I want AI agents to read/write the same projectJSON the canvas uses, not generate ER diagrams from a sentence. Is this the right boundary?

3. What features would make this a must-have for your team? (Import from existing DB? Export to migration files? Better diff visualization?)

Thanks for checking it out!
```

---

## 发布 Checklist

### 发布前

- [ ] 测试 Demo 链接可用性
- [ ] 测试 GitHub 链接可用性
- [ ] 准备回复评论的素材（技术细节、差异化、 roadmap）
- [ ] 设置提醒：发布后 1 小时、6 小时、24 小时检查评论

### 发布当天

- [ ] 9-11 AM PST 发布
- [ ] 发布后 1 小时内回复所有评论（前 1 小时最重要）
- [ ] 6 小时后再回复一轮
- [ ] 24 小时后检查是否进入首页（如果进入，继续回复）

### 发布后

- [ ] 写复盘：流量、注册、star 数、评论质量
- [ ] 把有价值的评论整理到 GitHub Issues
- [ ] 把 HN 链接加到 README（如果进入首页）

---

## 评论回复模板

### 有人问"这和 dbdiagram 有什么区别？"

```
Great question! The main differences:

1. **Open source**: ERD Online is MIT licensed, dbdiagram is closed source
2. **Versioning**: Every save creates a version you can diff and rollback (like Git). dbdiagram doesn't have versioning.
3. **Collaboration**: Real-time multiplayer editing (like Figma). dbdiagram is single-player.
4. **Self-hostable**: You can run ERD Online on your own infrastructure with Docker Compose.

dbdiagram is great for quick diagrams, but if you need versioning, collaboration, or self-hosting, ERD Online might be a better fit.

Try the demo to see the difference: https://www.erdonline.com/demo
```

### 有人问"为什么用 Spring Boot 而不是 Node.js？"

```
Good question! I chose Spring Boot for a few reasons:

1. **Ecosystem**: Spring Boot has a mature ecosystem for enterprise apps (security, transactions, validation)
2. **Performance**: JVM performance is excellent for this use case
3. **Team familiarity**: My team has more Spring Boot experience than Node.js

That said, the frontend is React + TypeScript, and the API is RESTful, so you could swap the backend if you wanted.

The projectJSON format is language-agnostic, so you could build a Node.js backend that reads/writes the same format.
```

### 有人问"MCP 是什么？"

```
MCP (Model Context Protocol) is a protocol for AI agents to interact with external tools.

In ERD Online, MCP allows AI agents (like Cursor, Claude) to:
- Read your schema via `list_projects` and `get_project`
- Suggest changes via `create_version`
- You still diff and approve in the designer (human-in-the-loop)

The key boundary: AI agents read/write the same projectJSON the canvas uses. They don't generate ER diagrams from a sentence.

Docs: https://doc.erdonline.com/docs/guide/api-and-mcp/
```

### 有人问"如何自部署？"

```
Self-hosting is easy with Docker Compose:

```bash
git clone https://github.com/erdonline/erdonline.git
cd erdonline
docker-compose up -d
```

That's it! The app will be available at http://localhost:8000

Docs: https://doc.erdonline.com/docs/deployment
```

---

## 成功指标

- **最低目标**：50+ upvotes，进入前 3 页，100+ 访问，10+ 注册
- **理想目标**：200+ upvotes，进入首页，1000+ 访问，50+ 注册
- **失败线**：< 20 upvotes → 复盘问题（标题？时机？内容？）

---

## 常见问题（FAQ）

**Q: 什么时候发布最好？**  
A: 周二或周三 9-11 AM PST。避开周一（大家都在忙）和周五（大家都准备周末）。

**Q: 需要准备什么？**  
A: 一个好的标题（80 字符以内）、一段简洁的正文（纯文本）、一个可用的 Demo 链接。

**Q: 发布后要做什么？**  
A: 前 1 小时最重要。回复所有评论，保持活跃。如果进入首页，继续回复评论。

**Q: 可以发多少次？**  
A: 每 2 周一次。不要刷屏，否则会被标记为 spam。

---

## 注意事项

- **不要刷票**：Hacker News 会检测异常投票
- **不要自夸**：用"我构建了这个"而不是"这是最好的"
- **不要争辩**：如果有人批评，礼貌回应，不要争辩
- **不要发链接到 landing 页**：直接发 Demo 链接（让人先体验）
