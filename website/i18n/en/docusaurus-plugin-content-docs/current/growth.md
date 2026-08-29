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
| 13 | Cursor + MCP: read one diagram, suggest one version | How-to sequel to #6; 30-second copy-paste | `cursor-mcp-read-and-suggest-version` | mcp | [`guide/api-and-mcp`](/docs/guide/api-and-mcp) | ✅ ready |
| 14 | CI schema-lint via REST projectJSON (not MCP-only) | Pipelines use curl + ajv; do not start MCP on the runner | `ci-rest-projectjson-schema-lint` | mcp | [`data-format`](/docs/data-format) | ✅ ready |
| 15 | Cursor can read your ER diagram; draw.io does not know FKs | Early two-week review: GSC still draw-ER; dunk + demo CTA for clicks | `cursor-reads-erd-drawio-cannot` | demo | [`guide/what-is-erd-online`](/docs/guide/what-is-erd-online) | ✅ ready |
| 7 | MIT open-source database modeling platform with docker-compose one-click deploy | Self-host SEO article | `docker-compose-mit-modeler` | deploy | [`guide/quick-self-host`](/docs/guide/quick-self-host) | ✅ ready |
| 8 | How do teams govern modeling permissions? Three-tier roles + approval flow in practice | Team scenario; single-user tool pain | `team-roles-approval-flow` | demo | [`guide/roles-and-approval`](/docs/guide/roles-and-approval) | ✅ ready |
| 9 | Honest comparison of 8 ER / database design tools in 2026 | SEO long-tail; comparisons must be honest | `honest-er-tools-compare-2026` | compare | blog + [/compare](https://www.erdonline.com/compare) (not in handbook body) | ✅ ready (incl. SegmentFault) |
| 10 | 30 seconds, no signup: open this link, edit one table, save a version | Pure demo experience post; images over words | `thirty-seconds-demo-version` | demo | [`guide/save-version-and-diff`](/docs/guide/save-version-and-diff) | ✅ ready (incl. v2ex.txt) |
| 11 | From G6 to ReactFlow: canvas Strangler migration notes | Technical depth; contributor funnel | `g6-to-reactflow-strangler` | repo | [`community`](./community.md) (contributors) | ✅ ready |
| 12 | How we design good first issues: first PR merged within two hours | Contributor recruitment | `good-first-issue-two-hours` | repo | [`community`](./community.md) (contributors) | ✅ ready |

Discipline: growth long-form **does not** go wholesale into the handbook; distillable tasks become `docs/guide/*` how-tos. Index: docs site [Blog](https://doc.erdonline.com/blog/).

**Publish package**: `node scripts/growth/build-package.mjs --all` → `content/dist/<slug>/`.  
**Public publish**: chrome-devtools MCP + frozen path cards (see [`platform-post-recipes.md`](./growth-templates/platform-post-recipes.md), [`post-via-chrome-devtools.md`](./growth-templates/post-via-chrome-devtools.md), [publish-article skill](../.cursor/skills/publish-article/SKILL.md)).  
**Publish log**: `docs/growth-data/YYYY-MM-DD.md` (public permalinks, username, click sequence).  
**V2EX**: manual post from each article's `v2ex.txt`.

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
- **chrome-devtools MCP**: long-form/short posts via frozen path cards in [`platform-post-recipes.md`](./growth-templates/platform-post-recipes.md) → verify public URL → write `docs/growth-data/`. **No Playwright**; no non-chrome-devtools posting extensions or syncers.
- **Manual**: V2EX plain-text posts, comment Q&A, data backfill.

### Publish one (ready status)

```bash
# 1. Package (UTM injected per platform)
node scripts/growth/build-package.mjs git-style-version-diff

# 2. CN long-form (Juejin / CSDN / OSChina / Zhihu)
node scripts/post-seo-essay.mjs juejin --slug=git-style-version-diff [--submit]

# 3. EN long-form (Hashnode / Dev.to / Medium import / X Article — see platform-post-recipes + x-article-playbook)
node scripts/post-seo-essay.mjs hashnode --slug=<slug> --submit

# 4. Log permalink → docs/growth-data/YYYY-MM-DD.md
```

**Discipline**

- CN platforms = Chinese draft; EN = `content/articles/<slug>.en.md`; YAML `platforms:` only lists platforms with chrome-devtools path cards and growth-data public permalinks.
- After submit, **must** open public URL and verify body; editor read-back does not count.
- lock / captcha / phone-verify → **stop immediately**.

## MCP / Agent two-week push (2026-08-28 → 2026-09-10)

> Evidence: among 15 Xiaohongshu notes, **open projectJSON + MCP to agents** led reads (51); draw.io dunk 41; honest compare 14. GSC www queries remain draw/create/make ER diagram (2 clicks / 103 impressions). Therefore: **CN growth wedge = demoable MCP**; www SERP title **stays** draw-ERD; H1 **stays** Git + Figma; no ChatSQL.

Near-term metrics: landing → demo / signup, GSC CTR, Xiaohongshu reads. North star remains weekly non-empty-diff version saves.

Full slice table (outcomes / files / verify): see Chinese [`growth.md`](https://github.com/erdonline/erdonline/blob/main/docs/growth.md) — same calendar. Slice 1 = docs 30-second MCP path + SEO + article #13. Slice 2 = XHS #13 **published** (`https://www.xiaohongshu.com/explore/6a90682300000000290346fd`, 5 views, do not republish); Juejin paste pack tracked, public post blocked on login. Slice 3 = logged-in MCP entry (✅). Slice 4 = PAT reveal embeds copyable mcp.json (✅). Slice 5 = three MCP docs screenshots (✅). Slice 6 = Juejin CTA retro **blocked on captcha** (skip). Slice 7 = GSC/live MCP docs probe ✅ 2026-08-28 (ZH+EN 200, trailing-slash canonical, sitemap loc; GSC unknown → requested indexing; submitted `en/sitemap.xml`). Slice 8 = CI REST schema-lint article `ci-rest-projectjson-schema-lint` (✅ 2026-08-28). Two-week review **early** ✅ 2026-08-28: GSC still 2/103, no doc.erdonline.com pages; article #15 `cursor-reads-erd-drawio-cannot` (dunk + demo CTA). Post-calendar ✅ 2026-08-28: `/compare` + landing table add **draw.io column + FK-semantics row**; `/catalog` distinct SERP snippet; www H1/SERP unchanged. GSC URL Inspection ✅ 2026-08-28: `/catalog` `/compare` `/en/compare` indexed (no re-request); `/en/catalog` discovered-not-indexed → requested indexing. Did not inspect 301s; did not publish XHS.

Exception: MCP how-to posts use **docs MCP page** as primary CTA (not demo). Demo is a read-only share and cannot mint a PAT.

## Historical 4-week rhythm (2026-08 launch pack; topics 1–12 done)

- **W1 infra + launch**: UTM rules landed (done with pipeline) → record Baidu/CF/GitHub Traffic baseline → publish #1 (Juejin) → V2EX light post → HelloGitHub submission
- **W2 selling points**: publish #3 (version diff, key post) + #5; Ruanyifeng weekly submission; answer 3 Zhihu stock questions; weekend review referrer/conversion
- **W3 migration harvest**: publish #4 + #6; awesome list PRs 3–5; polish README.en-US
- **W4 long-tail + review**: publish #7/#8/#9; **four-week decision review**: does CN data support doubling down? Is demo English ready for Show HN? archive data and produce next month's plan
