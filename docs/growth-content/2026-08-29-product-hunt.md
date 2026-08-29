# Product Hunt Launch Material - 2026-08-29

## Tagline

```
Git + Figma for database design, with MCP for AI agents
```

## Description

```
Open-source ERD tool with versioning, real-time collaboration, and MCP integration. Let Cursor, Claude, and Cline read/write your schema. Try the live demo in 30 seconds — no signup required.
```

## Topics

- Database Tools
- Developer Tools
- Open Source

## Gallery Checklist

- [ ] Hero screenshot (Landing page with "Git + Figma for database design")
- [ ] GIF: 30-second demo (open demo → edit table → save version → see diff)
- [ ] GIF: MCP integration in Cursor (`list_projects` → `create_version`)
- [ ] Version diff screenshot
- [ ] Collaboration/presence screenshot

## First Comment

```
Hi Product Hunt! 👋

I'm the maker of ERD Online. Here's why I built it:

**The Problem**
Existing database design tools force a trade-off:
- dbdiagram: pretty but closed, no versioning, no AI integration
- Navicat/PDManer: powerful but heavy, desktop-only, no AI integration
- drawio: free but doesn't understand databases, no AI integration

**The Solution**
ERD Online is Git + Figma for database design, with MCP for AI agents:

- **Versioning**: Every save creates a version you can diff and rollback. Treat schema like Git treats code.
- **Collaboration**: Real-time multiplayer editing (like Figma)
- **MCP Integration**: AI agents (Cursor, Claude, Cline) can read your schema via MCP and suggest changes via `create_version`. You still diff and approve in the designer.

The key boundary: AI agents read/write the same projectJSON the canvas uses. No black-box magic. You stay in control.

**Try it now** (no signup): https://www.erdonline.com/demo

**GitHub**: https://github.com/erdonline/erdonline (MIT license)

**What I'd love feedback on**:
1. The versioning approach (Git-like snapshots + diff)
2. The MCP integration (AI agents as first-class citizens)
3. What features would make this a must-have for your team?

Thanks for checking it out! 🚀
```

## X/Twitter Sync

```
🚀 Launching ERD Online on @ProductHunt today!

Git + Figma for database design, with MCP for AI agents:
✅ Versioning (like Git)
✅ Real-time collaboration (like Figma)
✅ MCP for Cursor, Claude, Cline

Try the live demo (no signup): https://www.erdonline.com/demo

#opensource #database #devtools #ai #mcp
```

## LinkedIn Sync

```
Excited to launch ERD Online on Product Hunt today! 🚀

After years of frustration with existing database design tools, I built an open-source alternative that combines:

• Git-like versioning (every save creates a diff-able snapshot)
• Figma-like collaboration (real-time multiplayer editing)
• MCP integration (AI agents can read/write your schema)

Tech stack: React 18 + Spring Boot 3.5 + PostgreSQL + Docker

Try the live demo (no signup required): https://www.erdonline.com/demo

Would love your feedback on the versioning approach and MCP integration.

#opensource #database #devtools #producthunt #ai #mcp
```

## Launch Time

- **Go live**: Tuesday 00:01 PST
- **First comment**: immediately after launch
- **Reply window**: first 1 hour critical, then 6h / 12h / 24h check-ins

## Links

- Live demo: https://www.erdonline.com/demo
- GitHub: https://github.com/erdonline/erdonline
- MCP docs: https://doc.erdonline.com/docs/guide/api-and-mcp/
