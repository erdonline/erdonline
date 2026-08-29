# Hacker News Launch Material - 2026-08-29

## Title

```
Show HN: ERD Online – Open-source database design with MCP for AI agents
```

## Body

```
I built ERD Online because existing database design tools force a trade-off:

- dbdiagram: pretty but closed, no versioning, no AI integration
- Navicat/PDManer: powerful but heavy, desktop-only, no AI integration
- drawio: free but doesn't understand databases, no AI integration

ERD Online is Git + Figma for database design, with MCP for AI agents:

**Versioning**: Every save creates a version you can diff and rollback. Treat schema like Git treats code.

**Collaboration**: Real-time multiplayer editing with presence (like Figma). Reviews and approvals land in auditable versions.

**MCP Integration**: AI agents (Cursor, Claude, Cline) can read your schema via MCP and suggest changes via create_version. You still diff and approve in the designer.

The key boundary: AI agents read/write the same projectJSON the canvas uses. No black-box magic. You stay in control.

Tech stack:
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

## Posting Time

- **Go live**: Tuesday 9-11 AM PST
- **First reply window**: first 1 hour
- **Subsequent replies**: 6h / 24h

## Pre-written Replies

### Q: "How is this different from dbdiagram?"

```
Great question! The main differences:

1. Open source (MIT) vs closed source
2. Git-like versioning (diff, rollback) — dbdiagram has none
3. Real-time multiplayer collaboration — dbdiagram is single-player
4. MCP integration for AI agents — dbdiagram has none
5. Self-hostable with Docker Compose

dbdiagram is great for quick diagrams. ERD Online is for teams that need versioning, collaboration, and AI integration.

Try the demo: https://www.erdonline.com/demo
```

### Q: "Why Spring Boot instead of Node.js?"

```
Good question! I chose Spring Boot for a few reasons:

1. Mature ecosystem for enterprise apps (security, transactions, validation)
2. Excellent JVM performance for this use case
3. Team familiarity

That said, the frontend is React + TypeScript, and the API is RESTful. The projectJSON format is language-agnostic, so you could swap the backend if needed.
```

### Q: "What is MCP?"

```
MCP (Model Context Protocol) is a protocol for AI agents to interact with external tools.

In ERD Online, MCP allows AI agents (Cursor, Claude, Cline) to:
- Read your schema via list_projects and get_project
- Suggest changes via create_version
- You still diff and approve in the designer (human-in-the-loop)

Docs: https://doc.erdonline.com/docs/guide/api-and-mcp/
```

### Q: "How do I self-host?"

```
Self-hosting is easy with Docker Compose:

git clone https://github.com/erdonline/erdonline.git
cd erdonline
docker-compose up -d

The app will be available at http://localhost:8000

Docs: https://doc.erdonline.com/docs/deployment
```

## Links

- Live demo: https://www.erdonline.com/demo
- GitHub: https://github.com/erdonline/erdonline
- MCP docs: https://doc.erdonline.com/docs/guide/api-and-mcp/
