# Growth plan (traffic and content promotion)

:::caution Maintainer doc
This page is **not** in the docs site default sidebar. It is for ops and the content pipeline; end users should read [User guide](/docs/guide/what-is-erd-online) and the docs site [guide index](https://doc.erdonline.com/blog/).
:::

> Aligned with the North Star: **weekly count of active modeling projects that produce a version save**. All content follows one funnel; vanity metrics (stars/views) are observed but not optimized.
> This doc states conclusions and execution rules; articles go through the pipeline at [`content/articles/`](https://github.com/erdonline/erdonline/tree/main/content/articles).

## Target funnel

```
Exposure (articles / community posts / search)
  → Click demo link (with UTM; copy must say "30 seconds, no signup")
    → Demo activation: edit one table → save version → view diff once
      → Fork to my project / register
        → Weekly version saves (North Star: non-empty diff version saves)
```

Discipline: **every article has one primary CTA = demo**; GitHub star only at the end in secondary position. If any article gets high reads but demo CTR below 1.5%, fix CTA placement and copy first—not new articles.

## Channel priority (ROI order)

**Do now (rewritten 2026-08-28)**: Xiaohongshu “梁工造物” (MCP/Agent titles read highest) → Juejin (1 MCP how-to/week) → docs MCP page SEO → landing secondary MCP link (H1 stays Git + Figma; www SERP title stays draw-ERD) → OSChina / SegmentFault sync. HelloGitHub / Ruanyifeng / V2EX / Zhihu still run, but must not preempt the MCP wedge.

**Defer (preconditions)**: Show HN / Reddit / dev.to — wait until demo and landing English experience is complete (i18n is P3); EN users hitting Chinese demo = conversion collapse—better late than bad; Bilibili — wait for a visually strong milestone, then one 3-minute demo.

**Do not**: Paid ads; Douyin; self-built WeChat official-account matrix; ChatSQL / “generate an ERD in one prompt”; fake engagement; re-blast the old 12 posts. Xiaohongshu is **not** an audience mismatch—15 notes already shipped; AI-adjacent titles are the current read leader. Continue **concrete how-tos**. Do not change the brand H1.

**CN vs EN**: Chinese search for "ER diagram tool / database modeling tool" is a vacuum (no decent comparison posts)—capture incremental traffic; English side dbdiagram/DrawDB dominate—plant seeds only (awesome list PRs, README.en-US quality); Show HN after i18n is complete.

## Article topic pack (12, in publish order)

| # | Title (draft) | Angle | slug (draft) | CTA | Guide page (docs distill) | Status |
|---|---|---|---|---|---|---|
| 1 | Git + Figma for database design: we put version management and real-time collaboration into ER modeling | Brand manifesto; positioning and empty niche | `git-figma-for-database-design` | demo | [`guide/what-is-erd-online`](/docs/guide/what-is-erd-online) | ✅ ready |
| 2 | Still drawing ER diagrams in draw.io? It doesn't know what a foreign key is | Generic drawing vs database semantics | `drawio-doesnt-know-fk` | demo | blog + [/compare](https://www.erdonline.com/compare) (not in handbook body) | ✅ ready (incl. v2ex.txt) |
| 3 | Who owns it when schema changes break prod? Git-style version diff for modeling | Strongest version narrative; incident opening | `git-style-version-diff` | demo | [`guide/save-version-and-diff`](/docs/guide/save-version-and-diff) | ✅ ready |
| 4 | Move from dbdiagram in 5 minutes: DBML import + self-host guide | Migration harvest; competitor users | `from-dbdiagram-in-5-min` | demo | [`guide/import-dbml`](/docs/guide/import-dbml) | ✅ ready |
| 5 | One-click reverse engineer MySQL/Oracle/PG/SQL Server into a relation diagram | Reverse engineering depth; existing DB need | `reverse-engineer-four-dbs` | demo | [`guide/reverse-engineer`](/docs/guide/reverse-engineer) | ✅ ready |
| 6 | Let AI agents read your database design: open projectJSON + MCP | AI platform narrative (open and auditable only) | `projectjson-mcp-for-agents` | docs | [`guide/api-and-mcp`](/docs/guide/api-and-mcp) | ✅ ready (highest XHS reads 2026-08-28) |
| 13 | Cursor + MCP: read one diagram, suggest one version | How-to sequel to #6; 30-second copy-paste | `cursor-mcp-read-and-suggest-version` | docs | [`guide/api-and-mcp`](/docs/guide/api-and-mcp) | 🚧 slice 1 |
| 7 | MIT open-source database modeling platform with docker-compose one-click deploy | Self-host SEO article | `docker-compose-mit-modeler` | deploy | [`guide/quick-self-host`](/docs/guide/quick-self-host) | ✅ ready |
| 8 | How do teams govern modeling permissions? Three-tier roles + approval flow in practice | Team scenario; single-user tool pain | `team-roles-approval-flow` | demo | [`guide/roles-and-approval`](/docs/guide/roles-and-approval) | ✅ ready |
| 9 | Honest comparison of 8 ER / database design tools in 2026 | SEO long-tail; comparisons must be honest | `honest-er-tools-compare-2026` | compare | blog + [/compare](https://www.erdonline.com/compare) (not in handbook body) | ✅ ready (incl. SegmentFault) |
| 10 | 30 seconds, no signup: open this link, edit one table, save a version | Pure demo experience post; images over words | `thirty-seconds-demo-version` | demo | [`guide/save-version-and-diff`](/docs/guide/save-version-and-diff) | ✅ ready (incl. v2ex.txt) |
| 11 | From G6 to ReactFlow: canvas Strangler migration notes | Technical depth; contributor funnel | `g6-to-reactflow-strangler` | repo | [`community`](./community.md) (contributors) | ✅ ready |
| 12 | How we design good first issues: first PR merged within two hours | Contributor recruitment | `good-first-issue-two-hours` | repo | [`community`](./community.md) (contributors) | ✅ ready |

Discipline: growth long-form **does not** go wholesale into the handbook; distillable tasks become `docs/guide/*` how-tos. Index: docs site [Blog](https://doc.erdonline.com/blog/).

**Publish package**: `node scripts/growth/build-package.mjs --all` → `content/dist/<slug>/`.  
**Wechatsync default sync platforms**: Juejin / CSDN / OSChina / Xiaohongshu / WeChat / Zhihu / SegmentFault; V2EX uses each article's `v2ex.txt` manually.  
**Publish click is still manual**: verify UTM / cover in drafts before posting.  
**Sync ledger**: [content/articles/publish-status-2026-08-09.md](https://github.com/erdonline/erdonline/blob/main/content/articles/publish-status-2026-08-09.md) (success/fail URLs; JSON in same dir).

## Metrics (what "working" means after 4 weeks)

| Layer | Tool | Metric | Success criterion |
|---|---|---|---|
| Exposure | Platform dashboards | Views/likes | Juejin single post >2k views |
| Click | Baidu Tongji / CF Web Analytics | UTM referrer, demo UV | Demo UV ≥2× baseline; referrer traceable |
| Activation | Baidu events / page paths | Demo → version save reach rate | Demo visitors → version save ≥10% |
| Conversion | Backend registration data | Weekly registrations | ≥2× baseline |
| North Star | Business DB stats | Weekly non-empty diff version saves | Two consecutive weeks up WoW |
| Vanity/lagging | GitHub Insights | stars, traffic referrer | Observe only; referrer validates which posts drive traffic |

UTM spec: `?utm_source=<platform>&utm_medium=article&utm_campaign=<campaign>&utm_content=<slug>`, generated by `scripts/growth/lib/utm.mjs`—do not hand-write bare links in articles.

## Publish pipeline (automation boundary)

- **Automated**: topic templates, frontmatter rules, UTM injection, platform package generation (`new-article.mjs` / `build-package.mjs`); CI artifact after PR tagged `growth-publish`.
- **Semi-auto (Wechatsync)**: via [Wechatsync](https://github.com/wechatsync/Wechatsync) push `content/dist/<slug>/` platform `.md` files **to drafts** (Juejin/Zhihu/SegmentFault/OSChina/WeChat official account, etc.); extension uses your logged-in browser session and platform Web APIs—**no cookie scraping scripts**; default draft; human review before publish.
- **Manual**: V2EX plain-text posts, comment Q&A, data backfill, click "Publish" in drafts.

### Wechatsync integration (Phase 2 shipped)

User-facing **WebChatSync** is the open project **Wechatsync**: Chrome extension + `@wechatsync/cli`, WebSocket sync of Markdown to 29+ platform drafts.

**One-time setup**

1. Install [Chrome extension](https://www.wechatsync.com/#install); log into Juejin/Zhihu etc. in the browser.
2. Extension settings → enable **MCP connection** → copy Token → write to repo root `.env`: `WECHATSYNC_TOKEN=<token>` (see `.env.example`).
3. Install pinned CLI (upstream `@wechatsync/cli@1.1.0` needs locked CJS deps on Node 20):
   ```bash
   cd scripts/growth && npm install
   ```

**Publish one (ready status)**

```bash
# 1. Package (UTM injected per platform)
node scripts/growth/build-package.mjs git-style-version-diff

# 2. Preview (no extension connection)
node scripts/growth/sync-wechatsync.mjs git-style-version-diff --dry-run

# 3. Sync to drafts (extension online + Token match)
export WECHATSYNC_TOKEN=...   # or source .env
node scripts/growth/sync-wechatsync.mjs git-style-version-diff

# Optional: check platform login state
node scripts/growth/sync-wechatsync.mjs --check-auth
```

**Discipline**

- Sync each platform's `juejin.md` / `zhihu.md` … separately so `utm_source=<platform>` is correct; `v2ex` still uses `v2ex.txt` manual posts.
- CI **does not** run Wechatsync (needs local Chrome login); run sync locally after downloading artifact.
- Remote dev box: extension "sync bridge" connects `ws://<host>:9527`, Token matches server (see [CLI README](https://github.com/wechatsync/Wechatsync/tree/v2/packages/cli#%E8%BF%9C%E7%A8%8B%E6%A1%A5%E6%8E%A5)); production should use SSH tunnel.

**Relation to old rules**: still no extension-less cookie/Playwright posting; Wechatsync is user-installed extension + official Web API draft sync.

### Cursor / Claude MCP (optional)

Wechatsync provides an **MCP Server** (`packages/mcp-server`, **not published to npm separately**), sharing the WebSocket bridge with `@wechatsync/cli`:

```
Cursor / Claude  ←stdio→  MCP Server (Node)  ←ws:9527→  Chrome extension  →  platform draft APIs
growth CLI       ←same WS bridge, WECHATSYNC_TOKEN matches extension Token→
```

**One-time setup**

1. Extension side as above: enable **MCP connection**, Token in repo root `.env` as `WECHATSYNC_TOKEN=<token>` (do not commit).
2. Build MCP Server (local path example):
   ```bash
   git clone --depth 1 -b v2 https://github.com/wechatsync/Wechatsync.git ~/.local/share/wechatsync-mcp
   cd ~/.local/share/wechatsync-mcp && pnpm install && pnpm build:mcp
   ```
3. Add to **user-level** Cursor MCP config (`~/.cursor/mcp.json`, not in git):
   ```json
   {
     "mcpServers": {
       "wechatsync": {
         "command": "node",
         "args": ["/path/to/Wechatsync/packages/mcp-server/dist/index.js"],
         "env": {
           "MCP_TOKEN": "<same token as extension>",
           "SYNC_WS_PORT": "9527"
         }
       }
     }
   }
   ```
   `MCP_TOKEN` must **exactly match** the extension Token (growth CLI reads `WECHATSYNC_TOKEN`, same semantics).

**MCP tools (Agent can call directly)**

| Tool | Purpose |
|---|---|
| `list_platforms` | List platforms and login state |
| `check_auth` | Check if a platform is logged in |
| `sync_article` | Sync Markdown to platform drafts |
| `extract_article` | Extract article from current browser page |
| `upload_image_file` | Upload local image to image host |

**Daily**: keep Chrome open with extension connected; reload Cursor MCP after MCP/CLI config changes. Remote dev: see [MCP Server README](https://github.com/wechatsync/Wechatsync/tree/v2/packages/mcp-server#%E8%BF%9C%E7%A8%8B%E6%A1%A5%E6%8E%A5) (extension "sync bridge" to `ws://<host>:9527`).

## MCP / Agent two-week push (2026-08-28 → 2026-09-10)

> Evidence: among 15 Xiaohongshu notes, **open projectJSON + MCP to agents** led reads (51); draw.io dunk 41; honest compare 14. GSC www queries remain draw/create/make ER diagram (2 clicks / 103 impressions). Therefore: **CN growth wedge = demoable MCP**; www SERP title **stays** draw-ERD; H1 **stays** Git + Figma; no ChatSQL.

Near-term metrics: landing → demo / signup, GSC CTR, Xiaohongshu reads. North star remains weekly non-empty-diff version saves.

Full slice table (outcomes / files / verify): see Chinese [`growth.md`](https://github.com/erdonline/erdonline/blob/main/docs/growth.md) — same calendar. Slice 1 = docs 30-second MCP path + SEO + article #13. Slice 2 = XHS #13 in review (`https://www.xiaohongshu.com/explore/6a90682300000000290346fd`, do not republish); Juejin paste pack tracked, public post blocked on login. Slice 3 = logged-in MCP entry (✅). Slice 4 = PAT reveal embeds copyable mcp.json (✅). Slices 5–8 = screenshots, GSC indexing, CI-lint article, two-week review.

Exception: MCP how-to posts use **docs MCP page** as primary CTA (not demo). Demo is a read-only share and cannot mint a PAT.

## Historical 4-week rhythm (2026-08 launch pack; topics 1–12 done)

- **W1 infra + launch**: UTM rules landed (done with pipeline) → record Baidu/CF/GitHub Traffic baseline → publish #1 (Juejin) → V2EX light post → HelloGitHub submission
- **W2 selling points**: publish #3 (version diff, key post) + #5; Ruanyifeng weekly submission; answer 3 Zhihu stock questions; weekend review referrer/conversion
- **W3 migration harvest**: publish #4 + #6; awesome list PRs 3–5; polish README.en-US
- **W4 long-tail + review**: publish #7/#8/#9; **four-week decision review**: does CN data support doubling down? Is demo English ready for Show HN? archive data and produce next month's plan
