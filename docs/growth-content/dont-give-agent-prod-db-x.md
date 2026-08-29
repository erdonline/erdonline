# X long-form — Job 1: Don't give your agent the production database

**长文 = Article only；Post composer 发长文 = 失败。** 入口 `https://x.com/compose/articles` → **`button[aria-label="create"]`** → 等 **`compose/articles/edit/{id}`**（例 `…/edit/2093728235884605440`）→ `node scripts/fill-x-article-shortcuts.mjs --slug=dont-give-agent-prod-db`；**禁止** hub 未进 edit 就 type / `compose/post` / 已删的 `fill-x-article-dont-give-agent-prod-db.mjs`。

Companion to `content/articles/dont-give-agent-prod-db.en.md`.

- **X**: Premium long-form article. Paste the title into the title field and the body below into the article body. **Not a 280-char tweet, not a thread.**
- Body is deliberately plain prose: no `#` headers, no markdown tables, no code fences. X renders those literally.

---

## X title

```
Don't give your agent the production database
```

## X body (paste as-is, below the line)

Friday night. You ask Cursor for a query: join orders to users, sort by last login. Three seconds later, an answer arrives with DBA-level confidence. You paste it into your client and hit Enter.

ERROR: column "last_login_at" does not exist.

There is no last_login_at column. There never was. The model did not know — it just decided the column "should" exist.

THIS FAILURE HAS A NAME: INVENTED COLUMN

This is not "AI is not smart enough yet." It has a name — invented column: the model fabricates a plausible column name with no factual source, then writes it into a JOIN with unshakable tone.

Invented columns are dangerous because they do not look like errors. last_login_at appears on 90% of user tables. Syntax is correct. Naming is conventional. Indentation is perfect. Mixed into ten correct JOINs, you will not catch it line by line. You find out in code review — or worse, in production logs.

THREE THINGS YOU ALREADY TRIED

A better prompt. "Do not invent column names; only use the schema I provide" — added to the system prompt. Works day one. By day three, long context and the model forgets. A prompt is a wish, not a constraint.

@schema.sql. Export DDL and drop it into context. The most honest approach today — but two holes: it goes stale (last week's export does not know this week's column), and nobody maintains it (not in any approval flow; anyone can edit it; drift from the real database goes unnoticed).

Live catalog MCP. Let the Agent query information_schema directly. Directionally correct — give the model a fact source instead of guesses. Tools like postgres-mcp and cloud vendor MCPs do solve half of "stop hallucinating column names." Worth acknowledging.

LIVE CATALOG ONLY GETS YOU HALFWAY

Wire production into the IDE and you hit four walls.

Permission-filtered information_schema is another kind of hallucination. The database account you give the Agent probably cannot see every table. The "complete schema" it returns is only the slice it is allowed to see. The model will not say "I only see 60% of tables." It keeps inventing columns in the missing 40%.

A 240-table full dump blows context. Real projects are not eight-table demos. Dump everything and you either truncate or drown the three relevant tables in noise.

Production credentials in the IDE are a red line. Your .cursor/mcp.json ends up in git, screenshots, and devices you forgot you synced. Read-only is still production.

Tool-list cache refreshes only on restart. A colleague adds a column at 10 a.m.; your Agent at 3 p.m. still writes SQL from cached schema — the same stale problem as @schema.sql, just harder to spot.

And something more fundamental: structure is not semantics. information_schema tells you status is CHAR(1); it does not tell you '1' is valid and '9' is dirty data. It tells you del_flag exists; it does not tell you every query must include del_flag = '0'. Live catalogs are solving structure; semantics live in people's heads and review records — not in the database.

SWAP THE FACT SOURCE: READ THE CONTRACT, NOT PRODUCTION

Our approach moves the fact source from "production database" to "approved version."

In ERD Online, schema lives in the designer. Each change saves as a named version humans can diff and roll back. That projectJSON is the contract: human-reviewed, no database passwords (profile.dbs stripped at the API layer), and naturally semantic — column labels and notes are where tribal knowledge like "del_flag = '0'" gets written down.

The Agent reads the contract, not production. Three direct consequences: zero credentials (only a project-level PAT in the IDE — no database accounts); no stale drift (the contract updates with versions; the Agent reads what the team just approved); accountability (which version the Agent used is right there in the version id).

PROGRESSIVE DISCLOSURE, NOT A FULL DUMP

Contracts can be large too, so how you read matters. We added two MCP tools deliberately shaped as "list first, expand on demand."

list_tables returns table name, label, and field count — eight rows for an eight-table project, 240 rows for a 240-table project, neither blows context. The Agent picks the two or three it needs, then calls describe_table for fields and FK neighborhood (who references me, whom do I reference).

When the Agent guesses a wrong table name, the response is not silence or fabrication — found:false plus suggestions. Invented columns get blocked at the tool layer, not by "please do not hallucinate" in the prompt.

Both tools read an approved version snapshot (pass versionId to pin a revision). No SQL execution. No database connection. Same configuration path as existing tools — see Read ER diagrams from Cursor via MCP on erdonline.com.

THE CTA IS NOT "INSTALL OUR MCP"

The next step from this article is not "go install an MCP first." It is more basic: save a version for your model.

Open the demo, change one table, save a named version, watch the diff — 30 seconds, no signup. The moment you save that first version, you have a contract the Agent can read and you can stand behind. MCP comes after, if you want it.

Try it in 30 seconds without signing up: https://www.erdonline.com/demo

Open source (MIT — star / issue / PR welcome): https://github.com/erd-online/erd-online
