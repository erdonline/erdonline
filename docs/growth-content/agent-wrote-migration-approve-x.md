# X long-form — Job 2: The agent wrote the migration. Are you really going to Approve it?

**长文 = Article only；Post composer 发长文 = 失败。** 入口 `https://x.com/compose/articles` → **`button[aria-label="create"]`** → 等 **`compose/articles/edit/{id}`** → `node scripts/fill-x-article-shortcuts.mjs --slug=agent-wrote-migration-approve`。

Companion to `content/articles/agent-wrote-migration-approve.en.md`. **Source of truth = Markdown below**; `compileArticle()` maps MD tokens → paste HTML + fiber insertPlan (see `x-article-md-map.mjs`).

---

## X title

```
The agent wrote the migration. Are you really going to Approve it?
```

## X body (paste as-is, below the line)

## TUESDAY AFTERNOON, THAT APPROVE BUTTON

Tuesday, 3 p.m. A PR notification lands in Slack. Junior writes in the channel: "Cursor generated this migration for me — can you take a look?"

You open the diff. Eighty lines of `ALTER TABLE`. Add columns, change types, add indexes, attach foreign keys — every line is familiar on its own. Syntax is clean. Naming matches team conventions. Mechanically, **it all looks plausible**.

But together? That `NOT NULL` on `biz_order` has no default — will it pass on existing rows? How long does the type change on `sys_user` lock the table? Does the down migration actually restore the previous schema? The PR description says "Agent self-review: should be fine" — that is not evidence.

Reject the whole thing and you look like you are blocking the team or fighting AI. Click Approve and **your name** is on it. When production blows up, the postmortem asks "who approved this version?" and you say: "CI passed; it looked okay to me."

You cannot spin up a database for every PR. In the end there are only two performances: **pretend to understand** — comment on naming and click Approve; **pretend to be strict** — send it back three times for formatting, and still nobody notices the missing join table.

## THIS FAILURE HAS A NAME: REVIEWED WITHOUT REVIEWING

This is not a moral failure of "not reading carefully enough." It has a name — **reviewed without reviewing**: generation speed went up; human review speed did not. The Agent spits out eighty lines of `ALTER` in three seconds; your brain still runs at "read SQL line by line." SQL diffs are mostly noise — `VARCHAR(64)` to `VARCHAR(128)` fills half the screen, while the change that actually blows up (missing join table, FK pointing at the wrong parent) hides in the middle and looks like any other edit.

People in the industry summarize it in one line: **No human can review at this speed.** That is not an insult — it is a mechanism claim. When the output is executable statements and the input is an eighty-line character diff, the Tech Lead is effectively signing blind. The moment you lose face and own the blame is the postmortem, not the Approve button on GitHub.

There is a sneakier variant: **which three lines in this migration are hallucinated?** Not syntax errors — semantic errors. The Agent used a stale `@schema.sql` and invented a join table that "should" exist. Or it set a default on `del_flag` that your team never uses. Every line runs; together they break a query you did not think to test.

## FOUR THINGS YOU ALREADY TRIED

**Stricter CI.** Lint migration file names, require down files, run sqlfluff. Helpful — but CI checks format and parseability, not "will this table lock for ten minutes on Tuesday peak traffic." Green does not mean "I will sign Approve."

**Agent self-review.** "Check this migration for risk and output a confidence score." The model politely returns "low risk" — it did not run that `ALTER` against your real row counts either. Self-review is tone, not acceptance.

**Declarative diff tools.** Prisma, Atlas, and similar tell you "what changed in the model vs last revision." Progress — the diff object is no longer raw SQL. But the declaration is still not "what will execute": the migration that lands in prod can diverge from the declaration; and field-level diffs are still noise, not "what this change means for the business."

**Finer code review policy.** "Migrations need two approvers." "Agents cannot push to main." Process is right; the object under review is still SQL noise. If the second approver only glances at green CI, you now have two "looked fine to me" signatures.

## LIVE CATALOG AND SQL DIFF BOTH MISS THIS HALF

Someone will say: wire the Agent to live DB so column names stop hallucinating. Job 1 already covered why — production credentials in the IDE are a red line; 240-table dumps blow context; permission-filtered schema is another hallucination. Even when structure reads correctly, **that is not what the Lead needs to review**.

The Lead needs to answer the product question in the meeting: "Will this schema change blow up?" — which means "relative to the **last approved version**, what are the semantic changes?" not eighty lines of `ALTER`. Live catalog MCP solves "does this column exist?" **Semantics** — soft delete still on this table?, is this status code still valid?, should this FK point at `sys_user` not `biz_user`? — live in notes, review records, and **human-approved versions**, not in `information_schema`.

So the trap is not "we need a better SQL linter." It is **reviewing the wrong artifact**: you Approve executable statements without an "approved intent" to align against.

## SWAP WHAT YOU REVIEW: VERSION DIFF, NOT MIGRATION DIFF

Our approach moves the Agent write path from "dump SQL for you to sign" to **"declare intent → save as a version → human diffs in the designer."**

The flow:

1. The team maintains schema in the designer. Each change saves as a **named version** — that `projectJSON` is the approved contract.
2. When the Agent needs a schema change, it does not call `put_project_json` to overwrite the workspace (API 200 is not human approval). It calls **`create_version`**: submit a suggested revision with a note.
3. The Tech Lead opens the **version diff** — not eighty lines of SQL, but: which table was added, which field removed, which FK moved from A to B. Column labels and notes carry tribal knowledge: next to `status`, "1=valid 9=dirty" is closer to what you review than `CHAR(1)`.
4. Point at three changes in the diff, say "I reviewed these three," then accept — the named version you produce is what goes in the changelog and aligns with what the Agent declared.

DDL drafts can be generated from approved versions for DBA reference; **ERD does not execute SQL**. Landing migrations in the database is still Atlas / Flyway / your CI. The Agent gets no production credentials; the Lead does not blind-sign raw migrations.

One sentence on the difference vs "Agent writes migration, you sign SQL": **API 200 is not human approval.** Approval happens after you read the diff in the designer.

## WHAT MCP DOES HERE (AND WHAT IT DOES NOT YET)

By now you might want MCP — not at the opening of the article.

Today the only MCP write path is **`create_version`**: the Agent reads the approved contract via `list_tables` / `describe_table`, updates the model, submits a suggestion; you diff in the designer. See [Read ER diagrams from Cursor via MCP](https://www.erdonline.com/docs/guide/api-and-mcp?utm_source=x&utm_campaign=mcp-agent&utm_content=agent-wrote-migration-approve) and [Save a version and view the diff](https://www.erdonline.com/docs/guide/save-version-and-diff?utm_source=x&utm_campaign=mcp-agent&utm_content=agent-wrote-migration-approve).

One honest gap: **semantic `diff_versions`** — ask MCP "what three semantic changes between v1.3 and v1.2?" instead of scanning the version panel by eye. That is the Job 2 build target; until the tool ships, Leads still open two versions in the designer — but the object is at least the **contract**, not SQL noise.

Planned optional capability: DDL draft from two contract versions as a DBA starting point — **still no execution**. Hard merge gates and DBA veto before main — that is another journey (Job 4). This article stops at the Lead's Approve button: you sign intent you diffed, not eighty lines the Agent spat out.

## THE CTA IS NOT "INSTALL OUR MCP"

The next step from this article is not "go install MCP first." It is more basic: **save a version and walk through diff approval once.**

Open the demo, change one table, save a named version, change something else, save again, open the diff between the two — 30 seconds, no signup. If you have not walked "Agent suggests → human diffs → approve" yet, practice with your own two hand-edited versions first: what "field added" vs "FK retargeted" looks like in the diff, so when the Agent calls `create_version` you know where to look.

The moment you save that first named version, you have a "last approved baseline" to align against. Without it, the Agent's eighty lines are a blind sign — the Approve button is there; whether you dare click depends on whether you reviewed SQL or the contract.

> **Try it in 30 seconds without signing up**: [erdonline.com/demo](https://www.erdonline.com/demo?utm_source=x&utm_campaign=mcp-agent&utm_content=agent-wrote-migration-approve)

Open source (MIT — star / issue / PR welcome): [github.com/erd-online/erd-online](https://github.com/erd-online/erd-online?utm_source=x&utm_campaign=mcp-agent&utm_content=agent-wrote-migration-approve)
