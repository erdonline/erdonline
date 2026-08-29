---
title: Don't give your agent the production database
slug: dont-give-agent-prod-db
status: ready
language: en
cta: demo
utm_campaign: mcp-agent
created: 2026-08-29
guide: docs/guide/api-and-mcp.md
---

## The second you hit Enter

Friday night. You ask Cursor for a query: join orders to users, sort by last login. Three seconds later, an answer arrives with DBA-level confidence:

```sql
SELECT o.id, o.amount, u.last_login_at
FROM biz_order o
JOIN sys_user u ON u.id = o.user_id
ORDER BY u.last_login_at DESC;
```

Paste it into your client. Enter:

```text
ERROR: column "last_login_at" does not exist
LINE 2: SELECT o.id, o.amount, u.last_login_at
```

There is no `last_login_at` column. There never was. The model did not know — it just decided the column "should" exist.

## This failure has a name: invented column

This is not "AI is not smart enough yet." It has a name — **invented column**: the model fabricates a plausible column name with no factual source, then writes it into a JOIN with unshakable tone.

Invented columns are dangerous because they **do not look like errors**. `last_login_at` appears on 90% of user tables. Syntax is correct. Naming is conventional. Indentation is perfect. Mixed into ten correct JOINs, you will not catch it line by line. You find out in code review — or worse, in production logs.

## Three things you already tried

**A better prompt.** "Do not invent column names; only use the schema I provide" — added to the system prompt. Works day one. By day three, long context and the model forgets. A prompt is a wish, not a constraint.

**`@schema.sql`.** Export DDL and drop it into context. The most honest approach today — but two holes: it **goes stale** (last week's export does not know this week's column), and **nobody maintains it** (not in any approval flow; anyone can edit it; drift from the real database goes unnoticed).

**Live catalog MCP.** Let the Agent query `information_schema` directly. Directionally correct — give the model a fact source instead of guesses. Tools like postgres-mcp and cloud vendor MCPs do solve half of "stop hallucinating column names." Worth acknowledging.

## Live catalog only gets you halfway

Wire production into the IDE and you hit four walls:

**Permission-filtered `information_schema` is another kind of hallucination.** The database account you give the Agent probably cannot see every table. The "complete schema" it returns is only the slice it is allowed to see. The model will not say "I only see 60% of tables." It keeps inventing columns in the missing 40%.

**A 240-table full dump blows context.** Real projects are not eight-table demos. Dump everything and you either truncate or drown the three relevant tables in noise.

**Production credentials in the IDE are a red line.** Your `.cursor/mcp.json` ends up in git, screenshots, and devices you forgot you synced. Read-only is still production.

**Tool-list cache refreshes only on restart.** A colleague adds a column at 10 a.m.; your Agent at 3 p.m. still writes SQL from cached schema — the same stale problem as `@schema.sql`, just harder to spot.

And something more fundamental: **structure is not semantics.** `information_schema` tells you `status` is `CHAR(1)`; it does not tell you `'1'` is valid and `'9'` is dirty data. It tells you `del_flag` exists; it does not tell you every query must include `del_flag = '0'`. Live catalogs are solving structure; semantics live in people's heads and review records — not in the database.

## Swap the fact source: read the contract, not production

Our approach moves the fact source from "production database" to **"approved version."**

In ERD Online, schema lives in the designer. Each change saves as a named version humans can diff and roll back. That `projectJSON` is the contract: human-reviewed, no database passwords (`profile.dbs` stripped at the API layer), and naturally semantic — column labels and notes are where tribal knowledge like "`del_flag = '0'`" gets written down.

The Agent reads the contract, not production. Three direct consequences:

- **Zero credentials**: only a project-level PAT in the IDE — no database accounts.
- **No stale drift**: the contract updates with versions; the Agent reads what the team just approved.
- **Accountability**: which version the Agent used is right there in the version id.

## Progressive disclosure, not a full dump

Contracts can be large too, so how you read matters. We added two MCP tools deliberately shaped as "list first, expand on demand":

`list_tables` returns table name, label, and field count — eight rows for an eight-table project, 240 rows for a 240-table project, neither blows context. The Agent picks the two or three it needs, then calls `describe_table` for fields and FK neighborhood (who references me, whom do I reference).

When the Agent guesses a wrong table name, the response is not silence or fabrication:

```json
{
  "found": false,
  "query": "user_id",
  "suggestions": ["sys_user", "sys_user_role"],
  "hint": "Table not in the approved contract. Retry with one of the suggestions; do not invent columns."
}
```

`found:false` plus suggestions — invented columns get blocked at the tool layer, not by "please do not hallucinate" in the prompt.

Both tools read an approved version snapshot (pass `versionId` to pin a revision). No SQL execution. No database connection. Same configuration path as existing tools — see [Read ER diagrams from Cursor via MCP](https://www.erdonline.com/docs/guide/api-and-mcp?utm_source=hashnode&utm_campaign=mcp-agent&utm_content=dont-give-agent-prod-db).

## The CTA is not "install our MCP"

The next step from this article is not "go install an MCP first." It is more basic: **save a version for your model.**

Open the demo, change one table, save a named version, watch the diff — 30 seconds, no signup. The moment you save that first version, you have a contract the Agent can read and you can stand behind. MCP comes after, if you want it.

> 👉 **Try it in 30 seconds without signing up**: https://www.erdonline.com/demo?utm_source=hashnode&utm_campaign=mcp-agent&utm_content=dont-give-agent-prod-db
>
> Open source (MIT — star / issue / PR welcome): https://github.com/erd-online/erd-online?utm_source=hashnode&utm_campaign=mcp-agent&utm_content=dont-give-agent-prod-db

#MCP #DatabaseDesign #ERD #Cursor
