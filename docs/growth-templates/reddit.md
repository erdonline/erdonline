# Reddit Template

> **频率**：每周一次（不要刷屏）  
> **执行人**：cheap model 生成初稿，你审核  
> **Subreddit 清单**：r/programming, r/webdev, r/selfhosted, r/Database, r/opensource

---

## Subreddit 选择策略

| Subreddit | 发布时间 | 内容重点 | 预期流量 |
|---|---|---|---|
| r/programming | 周二 | 技术深度、开源、架构 | 高 |
| r/webdev | 周三 | 前端技术、工具、协作 | 中 |
| r/selfhosted | 周四 | 自部署、Docker、数据主权 | 中 |
| r/Database | 周五 | 数据库设计、schema 管理 | 低（但精准） |
| r/opensource | 周六 | 开源项目、社区、贡献 | 低 |

---

## 标题模板

### r/programming

```
[OSS] ERD Online – Git + Figma for database design (versioning, collaboration, MCP)
```

### r/webdev

```
I built an open-source ERD tool with real-time collaboration and versioning
```

### r/selfhosted

```
Self-hostable database design tool with versioning and collaboration (MIT license)
```

### r/Database

```
Open-source ERD tool with Git-like versioning and MCP for AI agents
```

### r/opensource

```
ERD Online – Open-source database design with versioning and collaboration (looking for contributors)
```

---

## 正文模板

### r/programming（技术深度）

```
Hi r/programming,

I built ERD Online, an open-source database design tool that combines Git-like versioning with Figma-like collaboration.

**The Problem**

Existing database design tools force a trade-off:
- dbdiagram: pretty but closed, no versioning
- Navicat/PDManer: powerful but heavy, desktop-only
- drawio: free but doesn't understand databases

**The Solution**

ERD Online is Git + Figma for database design:

1. **Versioning**: Every save creates a version you can diff and rollback. The projectJSON format is versioned and never breaks in-place.

2. **Collaboration**: Real-time multiplayer editing with presence. Reviews and approvals land in auditable versions.

3. **MCP Integration**: AI agents (Cursor, Claude) can read your schema via MCP and suggest changes via create_version. You still diff and approve in the designer.

**Technical Details**

- Frontend: React 18 + UmiJS + TypeScript
- Backend: Spring Boot 3.5 + PostgreSQL
- Real-time: WebSocket + CRDT
- Versioning: Git-like snapshots + diff
- License: MIT

**Architecture**

The core is projectJSON, a language-agnostic format that represents your schema. Both humans and AI agents read/write the same format. The designer renders projectJSON as an interactive ERD, and the backend persists it with versioning.

**Try it**

Live demo (no signup): https://www.erdonline.com/demo
GitHub: https://github.com/erdonline/erdonline

**Feedback welcome**

I'd love your thoughts on:
- The versioning approach (Git-like snapshots + diff)
- The MCP integration (AI agents as first-class citizens)
- What features would make this a must-have for your team?

Thanks!
```

### r/webdev（前端技术）

```
Hi r/webdev,

I built ERD Online, an open-source database design tool with real-time collaboration (like Figma) and versioning (like Git).

**Tech Stack**

- React 18 + UmiJS + TypeScript
- WebSocket for real-time collaboration
- Canvas-based ERD rendering (custom, not a library)
- Monaco Editor for SQL/DDL editing

**The Interesting Part**

The hardest part was building a collaborative canvas that:
- Renders 100+ tables at 60fps
- Supports real-time multiplayer editing
- Generates clean diffs for versioning

I ended up building a custom canvas renderer with:
- Spatial indexing for fast hit-testing
- Incremental rendering for performance
- CRDT for conflict-free collaboration

**Try it**

Live demo (no signup): https://www.erdonline.com/demo
GitHub: https://github.com/erdonline/erdonline

**Feedback welcome**

I'd love your thoughts on:
- The canvas rendering approach (custom vs library)
- The real-time collaboration (WebSocket + CRDT)
- What frontend features would make this a must-have?

Thanks!
```

### r/selfhosted（自部署）

```
Hi r/selfhosted,

I built ERD Online, a self-hostable database design tool with versioning and collaboration.

**Why Self-Host?**

- **Data sovereignty**: Your schema stays on your infrastructure
- **Privacy**: No third-party tracking or analytics
- **Customization**: Modify the code to fit your needs

**Quick Start**

```bash
git clone https://github.com/erdonline/erdonline.git
cd erdonline
docker-compose up -d
```

That's it! The app will be available at http://localhost:8000

**What's Included**

- Database design tool (ERD)
- Versioning (Git-like snapshots + diff)
- Real-time collaboration
- MCP integration (for AI agents)
- MIT license

**System Requirements**

- Docker + Docker Compose
- 2GB RAM
- 10GB disk

**Docs**

- Deployment: https://doc.erdonline.com/docs/deployment
- Configuration: https://doc.erdonline.com/docs/configuration

**Try Before You Self-Host**

Live demo: https://www.erdonline.com/demo

**Feedback welcome**

I'd love your thoughts on:
- The Docker setup (too heavy? too light?)
- What features would make this a must-have for your homelab?

Thanks!
```

### r/Database（数据库专业）

```
Hi r/Database,

I built ERD Online, an open-source database design tool with Git-like versioning and MCP integration.

**The Problem**

Database schema changes are hard to track:
- Who changed what?
- When did they change it?
- Why did they change it?
- How do I rollback?

**The Solution**

ERD Online treats schema like Git treats code:
- Every save creates a version
- You can diff any two versions
- You can rollback to any version
- Reviews and approvals are built-in

**MCP Integration**

AI agents (Cursor, Claude) can read your schema via MCP and suggest changes via create_version. You still diff and approve in the designer.

This is useful for:
- Generating migration scripts
- Suggesting index optimizations
- Detecting schema drift

**Supported Databases**

- MySQL
- PostgreSQL
- Oracle
- SQL Server
- DB2
- SQLite

**Try it**

Live demo (no signup): https://www.erdonline.com/demo
GitHub: https://github.com/erdonline/erdonline

**Feedback welcome**

I'd love your thoughts on:
- The versioning approach (Git-like snapshots + diff)
- The MCP integration (AI agents for schema management)
- What database features would make this a must-have?

Thanks!
```

### r/opensource（开源社区）

```
Hi r/opensource,

I built ERD Online, an open-source database design tool with versioning and collaboration.

**Why Open Source?**

I believe database design tools should be:
- **Free**: No vendor lock-in
- **Open**: You can read and modify the code
- **Self-hostable**: Your data stays on your infrastructure

**Looking for Contributors**

ERD Online is looking for contributors in:
- Frontend (React + TypeScript)
- Backend (Spring Boot + PostgreSQL)
- Documentation (technical writing)
- Design (UI/UX)

**Good First Issues**

- Add support for more databases (MongoDB, Cassandra)
- Improve diff visualization
- Add export to more formats (Liquibase, Flyway)
- Improve accessibility (keyboard navigation, screen readers)

**Tech Stack**

- Frontend: React 18 + UmiJS + TypeScript
- Backend: Spring Boot 3.5 + PostgreSQL
- Real-time: WebSocket + CRDT
- License: MIT

**Try it**

Live demo (no signup): https://www.erdonline.com/demo
GitHub: https://github.com/erdonline/erdonline

**Feedback welcome**

I'd love your thoughts on:
- What would make you contribute to this project?
- What features would make this a must-have?

Thanks!
```

---

## 发布 Checklist

### 发布前

- [ ] 选择正确的 subreddit
- [ ] 阅读 subreddit 规则（有些禁止自我推广）
- [ ] 测试 Demo 链接可用性
- [ ] 准备回复评论的素材

### 发布当天

- [ ] 在 subreddit 活跃时间发布（通常是美东时间上午）
- [ ] 发布后 1 小时内回复所有评论
- [ ] 6 小时后再回复一轮
- [ ] 24 小时后检查是否进入热门（如果进入，继续回复）

### 发布后

- [ ] 写复盘：流量、注册、star 数、评论质量
- [ ] 把有价值的评论整理到 GitHub Issues
- [ ] 把 Reddit 链接加到 README（如果进入热门）

---

## 成功指标

- **最低目标**：20+ upvotes，50+ 访问，5+ 注册
- **理想目标**：100+ upvotes，进入 subreddit 热门，500+ 访问，20+ 注册
- **失败线**：< 5 upvotes → 复盘问题（标题？内容？subreddit 选择？）

---

## 注意事项

- **不要刷屏**：每个 subreddit 每周最多发一次
- **不要自我推广过度**：先提供价值，再提产品
- **不要争辩**：如果有人批评，礼貌回应，不要争辩
- **遵守规则**：有些 subreddit 禁止自我推广，先读规则
