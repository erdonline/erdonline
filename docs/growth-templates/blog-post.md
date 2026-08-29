# 技术博客模板

> **频率**：每周一篇  
> **平台**：Dev.to / Hashnode / Medium / 掘金 / 知乎  
> **执行人**：cheap model 生成初稿，你审核  
> **字数**：1500-2500 字

---

## 文章类型

| 类型 | 频率 | 目标 | 示例 |
|---|---|---|---|
| **技术深度** | 每两周一次 | 建立技术权威 | "How I built a collaborative ERD canvas" |
| **教程** | 每周一次 | SEO + 长尾流量 | "How to version your database schema like Git" |
| **对比** | 每月一次 | 获客 | "ERD Online vs dbdiagram vs drawio" |
| **用户故事** | 每月一次 | 社会认同 | "How Team X uses ERD Online to manage 500+ tables" |

---

## 模板 1：技术深度文章

### 标题

```
How I built an open-source ERD tool with versioning and MCP integration
```

**备选**：
- `Building a collaborative database design tool with React and Spring Boot`
- `Versioning database schemas like Git: A technical deep dive`

### 结构

#### 1. Hook（200 字）

```
Database design tools haven't changed in 20 years. You either use a heavyweight desktop app (Navicat, PDManer) or a pretty but closed web app (dbdiagram). Neither supports versioning or real-time collaboration.

I built ERD Online to solve this. It's an open-source database design tool that combines Git-like versioning with Figma-like collaboration. AI agents can even read and write your schema via MCP.

In this article, I'll walk you through the technical architecture, the hardest problems I solved, and the lessons I learned.
```

#### 2. The Problem（300 字）

```
Existing database design tools force a trade-off:

**dbdiagram**: Pretty and easy to use, but closed source and no versioning. If you make a mistake, you can't rollback. If you want to collaborate, you can't.

**Navicat/PDManer**: Powerful but heavy, desktop-only, and single-player. If you want to collaborate, you have to export/import files.

**drawio**: Free and flexible, but doesn't understand databases. You can draw boxes and lines, but it doesn't know what a foreign key is.

I wanted a tool that:
- Versions every change (like Git)
- Supports real-time collaboration (like Figma)
- Understands databases (foreign keys, indexes, constraints)
- Is open source and self-hostable
```

#### 3. The Solution（500 字）

```
ERD Online is built around a simple idea: **projectJSON**.

projectJSON is a language-agnostic format that represents your database schema. It includes:
- Tables (name, columns, indexes, constraints)
- Relationships (foreign keys, cardinality)
- Metadata (comments, tags, colors)

Both humans and AI agents read/write the same projectJSON. The designer renders projectJSON as an interactive ERD, and the backend persists it with versioning.

**Versioning**

Every save creates a version. A version is a snapshot of projectJSON at a point in time. You can:
- Diff any two versions
- Rollback to any version
- See who changed what and when

The versioning system is inspired by Git:
- Versions are immutable
- Diffs are computed on-demand
- Rollbacks create a new version (not delete history)

**Collaboration**

Real-time collaboration is built on WebSocket + CRDT:
- WebSocket for real-time updates
- CRDT (Conflict-free Replicated Data Type) for conflict resolution

Multiple users can edit the same diagram at the same time. Changes are merged automatically, and conflicts are resolved by CRDT.

**MCP Integration**

MCP (Model Context Protocol) allows AI agents to interact with ERD Online:
- `list_projects`: List all projects
- `get_project`: Get a project's projectJSON
- `create_version`: Suggest a new version

AI agents can't directly modify the schema. They suggest changes, and you diff and approve in the designer. This is the "human-in-the-loop" pattern.
```

#### 4. Technical Deep Dive（800 字）

```
**Frontend: React + Canvas**

The frontend is React 18 + UmiJS + TypeScript. The hardest part was building a canvas that:
- Renders 100+ tables at 60fps
- Supports real-time multiplayer editing
- Generates clean diffs for versioning

I ended up building a custom canvas renderer with:
- **Spatial indexing**: R-tree for fast hit-testing
- **Incremental rendering**: Only re-render changed tables
- **CRDT**: Conflict-free collaboration

**Backend: Spring Boot + PostgreSQL**

The backend is Spring Boot 3.5 + PostgreSQL. The key components:
- **ProjectService**: Manages projects and versions
- **VersionService**: Computes diffs and rollbacks
- **MCPService**: Handles MCP requests from AI agents

**Versioning: Git-like Snapshots**

Versions are stored as snapshots, not deltas. This is slower but simpler:
- Every save creates a full snapshot of projectJSON
- Diffs are computed on-demand (not stored)
- Rollbacks create a new version (not delete history)

The trade-off: storage is O(n) instead of O(1), but the code is much simpler.

**Real-time: WebSocket + CRDT**

Real-time collaboration is built on:
- **WebSocket**: Bidirectional communication
- **CRDT**: Conflict-free Replicated Data Type

I used a CRDT called Yjs. It's a library that handles conflict resolution automatically. Multiple users can edit the same diagram at the same time, and changes are merged automatically.

**MCP: Model Context Protocol**

MCP is a protocol for AI agents to interact with external tools. In ERD Online, MCP allows AI agents to:
- Read your schema via `list_projects` and `get_project`
- Suggest changes via `create_version`

The key boundary: AI agents read/write the same projectJSON the canvas uses. They don't generate ER diagrams from a sentence.
```

#### 5. Lessons Learned（300 字）

```
**1. Snapshots are simpler than deltas**

I initially tried to store versions as deltas (like Git). This was faster but much more complex. I switched to snapshots, and the code became much simpler.

**2. CRDT is worth the complexity**

Real-time collaboration is hard. I initially tried to build my own conflict resolution, but it was buggy. I switched to Yjs (a CRDT library), and it just works.

**3. MCP is the future**

AI agents are becoming first-class citizens in developer tools. MCP is a clean protocol for AI agents to interact with external tools. I believe MCP will become the standard.

**4. Open source is a moat**

Closed-source tools (like dbdiagram) can't compete with open-source tools in the long run. Open source builds trust, community, and sustainability.
```

#### 6. Call to Action（200 字）

```
**Try ERD Online**

Live demo (no signup): https://www.erdonline.com/demo
GitHub: https://github.com/erdonline/erdonline
Docs: https://doc.erdonline.com

**Feedback welcome**

I'd love your thoughts on:
- The versioning approach (Git-like snapshots + diff)
- The MCP integration (AI agents for schema management)
- What features would make this a must-have for your team?

**Star on GitHub**

If you find ERD Online useful, please star it on GitHub. It helps others discover the project.

**Contribute**

ERD Online is looking for contributors in:
- Frontend (React + TypeScript)
- Backend (Spring Boot + PostgreSQL)
- Documentation (technical writing)

Check out the [good first issues](https://github.com/erdonline/erdonline/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).
```

---

## 模板 2：教程文章

### 标题

```
How to version your database schema like Git
```

**备选**：
- `Database schema versioning: A practical guide`
- `How to rollback database schema changes (without losing data)`

### 结构

#### 1. Hook（200 字）

```
Database schema changes are hard to track. Who changed what? When did they change it? Why did they change it? How do I rollback?

In this tutorial, I'll show you how to version your database schema like Git. You'll learn how to:
- Track every schema change
- Diff any two versions
- Rollback to any version
- Collaborate with your team
```

#### 2. The Problem（300 字）

```
Database schema changes are hard to track because:
- Most tools don't version schema changes
- Migration files are hard to read
- Rollbacks are risky and error-prone
- Collaboration is manual (export/import)

This leads to:
- "Who changed this table?"
- "When did this column disappear?"
- "How do I rollback this change?"
- "Can I see what changed between v1 and v2?"
```

#### 3. The Solution（500 字）

```
ERD Online treats schema like Git treats code:
- Every save creates a version
- You can diff any two versions
- You can rollback to any version
- Reviews and approvals are built-in

**Step 1: Create a project**

Sign in to ERD Online and create a new project. You can:
- Start from scratch
- Import from an existing database
- Import from a DBML file

**Step 2: Design your schema**

Use the designer to create tables, columns, indexes, and relationships. The designer is like Figma:
- Drag and drop tables
- Edit columns inline
- Create relationships by dragging

**Step 3: Save a version**

Click "Save" to create a version. Every save creates a version you can diff and rollback.

**Step 4: Diff two versions**

Click "Versions" to see all versions. Select two versions and click "Diff" to see what changed.

**Step 5: Rollback to a version**

Select a version and click "Rollback" to restore it. This creates a new version (not delete history).
```

#### 4. Advanced Topics（500 字）

```
**Collaboration**

Multiple users can edit the same diagram at the same time. Changes are merged automatically, and conflicts are resolved by CRDT.

**Reviews and Approvals**

You can require reviews and approvals for schema changes. This is useful for:
- Production databases
- Compliance requirements
- Team workflows

**MCP Integration**

AI agents (Cursor, Claude) can read your schema via MCP and suggest changes via create_version. You still diff and approve in the designer.

This is useful for:
- Generating migration scripts
- Suggesting index optimizations
- Detecting schema drift
```

#### 5. Conclusion（200 字）

```
Database schema versioning is hard, but it doesn't have to be. ERD Online treats schema like Git treats code, making it easy to track, diff, and rollback changes.

**Try it now**: https://www.erdonline.com/demo
**GitHub**: https://github.com/erdonline/erdonline
**Docs**: https://doc.erdonline.com

**Feedback welcome**: What features would make this a must-have for your team?
```

---

## 模板 3：对比文章

### 标题

```
ERD Online vs dbdiagram vs drawio: Which database design tool is right for you?
```

### 结构

#### 1. Hook（200 字）

```
Choosing a database design tool is hard. There are dozens of options, each with different strengths and weaknesses.

In this article, I'll compare three popular options:
- ERD Online (open source, versioning, collaboration)
- dbdiagram (pretty, easy to use, closed source)
- drawio (free, flexible, doesn't understand databases)

By the end, you'll know which tool is right for your team.
```

#### 2. Comparison Table（300 字）

| Feature | ERD Online | dbdiagram | drawio |
|---|---|---|---|
| **Open source** | ✅ MIT | ❌ Closed | ✅ Apache |
| **Versioning** | ✅ Git-like | ❌ No | ❌ No |
| **Collaboration** | ✅ Real-time | ❌ No | ⚠️ Limited |
| **Database semantics** | ✅ Yes | ✅ Yes | ❌ No |
| **Self-hostable** | ✅ Yes | ❌ No | ✅ Yes |
| **MCP integration** | ✅ Yes | ❌ No | ❌ No |
| **Price** | Free | Free / Paid | Free |

#### 3. Detailed Comparison（800 字）

```
**ERD Online**

Pros:
- Open source (MIT license)
- Git-like versioning (diff, rollback, reviews)
- Real-time collaboration (like Figma)
- Database semantics (foreign keys, indexes, constraints)
- Self-hostable (Docker Compose)
- MCP integration (AI agents)

Cons:
- Newer project (less mature)
- Smaller community
- Fewer templates

Best for: Teams that need versioning, collaboration, and self-hosting.

**dbdiagram**

Pros:
- Pretty and easy to use
- Database semantics (foreign keys, indexes, constraints)
- Large template library
- Popular (large community)

Cons:
- Closed source
- No versioning
- No collaboration
- Not self-hostable

Best for: Individuals that need a quick, pretty diagram.

**drawio**

Pros:
- Free and open source (Apache license)
- Flexible (can draw anything)
- Self-hostable
- Large community

Cons:
- Doesn't understand databases (no foreign keys, indexes, constraints)
- No versioning
- Limited collaboration

Best for: General-purpose diagramming (not just databases).
```

#### 4. Conclusion（200 字）

```
Choose ERD Online if you need versioning, collaboration, and self-hosting.

Choose dbdiagram if you need a quick, pretty diagram and don't need versioning or collaboration.

Choose drawio if you need a general-purpose diagramming tool (not just databases).

**Try ERD Online**: https://www.erdonline.com/demo
**GitHub**: https://github.com/erdonline/erdonline
```

---

## SEO 关键词

- `open source erd tool`
- `database design with versioning`
- `erd tool with collaboration`
- `mcp for database schema`
- `database schema versioning`
- `erd online vs dbdiagram`
- `self-hosted database design tool`

---

## 发布 Checklist

### 发布前

- [ ] 选择一个文章类型（技术深度 / 教程 / 对比）
- [ ] 使用对应的模板生成初稿
- [ ] 你审核并修改
- [ ] 添加 SEO 关键词
- [ ] 添加 Demo 链接和 GitHub 链接

### 发布

- [ ] Dev.to（英文）
- [ ] Hashnode（英文）
- [ ] Medium（英文）
- [ ] 掘金（中文）
- [ ] 知乎（中文）

### 发布后

- [ ] 在 X/Twitter 同步宣传
- [ ] 在 LinkedIn 同步宣传
- [ ] 回复评论
- [ ] 统计流量和注册

---

## 成功指标

- **最低目标**：100+ 阅读，5+ 注册
- **理想目标**：1000+ 阅读，50+ 注册
- **失败线**：< 50 阅读 → 复盘问题（标题？内容？SEO？）
