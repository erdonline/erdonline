# Roadmap

:::info Audience
This document is for **contributors and maintainers**. End users should start with [Start here](/docs/guide/intro); public capability entry points are in the sidebar under “Self-host & open API”.
:::

> Public roadmap. Influence it via [Issues](https://github.com/erdonline/erdonline/issues).
> Status markers: ✅ Done · 🚧 In progress · 📋 Planned

## Current status

Engineering and the designer are at a **usable prototype**: core journeys run; data sources are isolated per ADR-0008. Integration baseline: `./scripts/audit-fe-apis.sh`.

**Next-phase strategy (serves the North Star; does not overturn the vision)**: P2b matrix 🚧 cleared to zero (see [control-matrix](/docs/control-matrix)); remaining matrix 📋 items are deferred (forum external links, VIP badge, experimental query/ChatSQL/dataDomain/dataQuery pages, etc.; see matrix).

### Vision auto-track redirect (2026-08-04)

Human-assigned theme: **dual-layer consistency and trustworthy save** ([ADR-0022](/docs/adr/dual-layer-consistency)). The Vision 5m loop (`scripts/agent-loop-vision.prompt.md`) continues on that theme’s slice queue (A workspace → concurrency/persistence foundation → B live DB five states), one tick one slice, auto-advancing when done; changes pause only on user stop or two consecutive rounds of worsening metrics. See “Dual-layer consistency 🚧” below.

### Vision auto-track pause point (2026-08-03 · `d94f1fd`, superseded by redirect above)

Auto-scan conclusion: no **unlocked** high-ROI P0/P1 Vision slices remain (excluding further chrome densify and Auth logo). **Vision auto-track paused** until manually unblocked.

| Human next | Why gated | Unblock condition |
|---|---|---|
| ~~[ADR-0013](/docs/adr/public-api-mcp) Public API / MCP~~ | ~~Auth/rate-limit/scope not decided~~ → **Manually unblocked 2026-08-04**; MVP ✅ (slices 1–5 + write REST/MCP + Redis + OAuth A+B + PAT/client UI + consent page) | — |
| P4 Official demo (Railway) | Dashboard spin-up + fill `DEMO_API_URL` (ADR-0019 choice set; ops still manual) | Manual Railway + env backfill |
| DBML Trigger interop | `@dbml/core` has no Trigger block; Notes forbidden as workaround | Upstream official block stable |
| Composite FK `fields[]` ([ADR-0011](/docs/adr/defer-composite-fk-fields-array)) | Still deferred | FE multi-field edge protocol landed |

Non-Vision lower-priority notes (don’t preempt auto-track): security R-DATA-02 residual raw ping/reverse JDBC; cross-table reuse / dataDomain re-evaluation; branch-style version evolution (ADR-0016 banned this quarter); contributor funnel / canonical repo Issue seeding; demo site main bundle vendor/app not split (`umi.js` ~1.86MB landing + designer share one pack; see 2026-08-04 perf diagnosis) + `html2canvas.min.js` blocking head script → lazy load (export-only).

## Next quarter: three things only (North Star levers)

Proceed in order; one thing at a time. After all three ✅, **no idle**: Vision 5m loop continues inventing the next slice per [ADR-0016](/docs/adr/experience-first-shareable-diagram) dual track (experience = shareable beautiful diagram; capability = maintain versions/share) (see `scripts/agent-loop-vision.prompt.md`):

1. **Landing narrative + sample project → 30-second version save** (activation; serves “30s wow” + “weekly versions” North Star) ✅ (sample-ready CTA + top bar “Save version” ✅; timed E2E `activation-30s.spec.ts` wall-clock baseline ~3.5s ≤30s ✅ 2026-08-02)
2. **Export/version trust chain end-to-end** (Word/MinIO decouple or degrade, approval pass path, visible export failure) ✅ (export failure visible ✅; Word/MinIO decouple: classpath default template + MinIO absent degrade ✅; approval pass path: SQL failure doesn’t mark passed / no sync ✅ 2026-08-02)
3. **Collaboration → versions happen naturally** (presence to “edited together this week and saved” guidance; no AI expansion) ✅ (remote sync toast with “Save version” deep link to version page, throttled ≤1/min/session; full-path E2E: toast→CTA→AddVersion persisted + 60s throttle regression ✅ 2026-08-02)

**External or later**: AI, i18n, canonical repo Issue seeding (`REPO=… ./scripts/seed-good-first-issues.sh`, pending canonical repo ready).

## P5: AI-era data structure platform 🚧

> Per [ADR-0012](/docs/adr/ai-era-data-structure-platform) (**accepted · option B**): “Git + Figma + AI-agent-readable open source of truth for database design”; keywords **open + secure**. Landing first; API/MCP see [ADR-0013](/docs/adr/public-api-mcp) (✅ MVP: slices 1–5 + write REST/MCP + Redis + OAuth A+B + PAT/client UI + consent page).

### MCP / Agent growth wedge (from 2026-08-28, two weeks) 🚧

> Calendar and verify points: [`growth.md`](https://github.com/erdonline/erdonline/blob/main/docs/growth.md). Vision lock: AI is an option; H1 stays Git + Figma; www SERP title stays draw-ERD; public docs only `https://doc.erdonline.com`.

| Slice | Status | Ships |
|---|---|---|
| 1 Docs 30-second MCP path + SEO + article #13 | ✅ 2026-08-28 | [`guide/api-and-mcp`](/docs/guide/api-and-mcp) copy-paste; landing Open pillar link; `content/articles/cursor-mcp-read-and-suggest-version.md` |
| 2 Publish #13 on Xiaohongshu / Juejin | 🚧 2026-08-28 | XHS **published**, 5 views [explore/6a906823…](https://www.xiaohongshu.com/explore/6a90682300000000290346fd) (do not republish); Juejin paste pack tracked, publish blocked on login |
| 3 Logged-in workspace MCP secondary entry | ✅ 2026-08-28 | Home hero MCP link; stat relabel “Edited today” |
| 4 PAT success screen embeds mcp.json | ✅ 2026-08-28 | Reveal modal copies PAT-filled Cursor `mcp.json` |
| 5 Docs MCP page 3 screenshots | ✅ 2026-08-28 | PAT reveal / mcp.json / agent tool list; XHS covers in `content/articles/assets/mcp-*.png` |
| 6 Juejin CTA retro | ⛔ captcha wall | Skip until human login; do not mass-post |
| 7 GSC EN indexing probe | ✅ 2026-08-28 | ZH/EN MCP docs 200 + trailing-slash canonical + sitemap loc; GSC unknown → requested indexing; submitted EN sitemap |
| 8 CI REST schema-lint article | ✅ 2026-08-28 | `ci-rest-projectjson-schema-lint`; distilled into [`data-format`](/docs/data-format) |
| Two-week review (early) | ✅ 2026-08-28 | XHS #13 live, 5 views (#6 still 51); GSC 2/103 unchanged, no doc pages; no P0 www leak; article #15 dunk+demo |

### Landing (public, brand-first, one composition) ✅

- Public route `/` (accessible logged out); logged-in “Learn more” back link; logged-out primary CTA → `/demo`, logged-in primary CTA → `/home`
- Implementation constraints: brand-first + **full-bleed** real canvas screenshot (`landing-hero.jpg`); no sidebar embed / purple gradient AI slop; see [landing](/docs/landing)
- E2E: `landing.spec.ts` (load + CTA→demo/login + logged-in→workspace) ✅

### Dual-layer consistency and trustworthy save 🚧

> Per [ADR-0022](/docs/adr/dual-layer-consistency): borrow Git mental model (status / pull / push) to express three truths in layers; **no automatic bidirectional sync**. Current sole theme of Vision 5m loop.

**A Workspace (in-memory projectJSON ↔ latest version)**

- ~~Baseline independently fetches latest version (no paginated `versions[0]`)~~ ✅ (2026-08-04; `create_time` desc `size:1` independent query + no-baseline state hint)
- ~~Live dirty chip (clean / changed / persist failed; merged semantics with top-bar save status, no duplicate feedback)~~ ✅ (2026-08-04; top bar `VersionDirtyChip` + SaveStatus “persisted”)
- ~~Full diff (`associations` / `diagrams` / `profile` in diff) + debounce; **empty changes don’t count toward “version saved” North Star**~~ ✅ (2026-08-04; `versionStructuralDiff.ts` + save-version warn + snapshot includes profile/domains)

**Concurrency and persistence foundation (prevent data loss first)**

- ~~Blind save on unload (`closeSocket` unconditional `Save.saveProject`) → persist only when dirty with visible result~~ ✅ (2026-08-04)
- ~~Project optimistic lock (actionable conflict hint, no silent overwrite)~~ ✅ (2026-08-04; `update_time` CAS → 409; Modal refresh/fork as new project)
- ~~`db_change.version` unique constraint (Flyway)~~ ✅ (2026-08-04; V14 dedupe + unique index; 409001 + frontend Modal)
- Honest persistence: persist failure → local draft + `beforeunload` guard; re-entry can compare/discard ✅ 2026-08-04

**B Live DB (model ↔ live schema)**

- ~~Criterion switched to measured schema fingerprint (table/column/index normalized hash); `db_version` demoted to hint~~ ✅ 2026-08-04 (`POST /connector/schema/probe` + version page “Probe live DB”; bookmark tag “pushed/not pushed”)
- Fix `compareStringVersion` (empty segment / `NaN` / prefix); indeterminate → unknown state not “in sync” ~~ ✅ 2026-08-04 (`stringVersion.ts` returns `null`; bookmark tag “bookmark unknown”; sync actions conservatively blocked)
- ~~Five states + unknown four-way actionable copy; explicit probe (loading + failure reason)~~ ✅ 2026-08-04 (IR diff → ahead/behind/diverged; unknown four-way copy + testid; `schema-probe.spec.ts`)
- ~~Share visitors hide B layer~~ ✅ 2026-08-04 (`shareContext` + ACL guard + `share.spec.ts` no probe testid/API)

**MVP queue (#1–#11) closed**; same-theme continuation queue #12 ✅ → #13 ✅ → #14 ✅ → #15 ✅ → #16 (Pull/Push requires user gate) see `scripts/agent-loop-vision.prompt.md`.

- ~~#12 A/B layer diff visual/copy unification (`dualLayerTokens` parity colors + top-bar legend; A in-sync green/ahead blue; toolbar and dirty chip same source)~~ ✅ 2026-08-04
- ~~#13 Conflict visualization: project 409 Modal minimal diff preview (local vs server / last known; reuse `VersionDiffPanel`)~~ ✅ 2026-08-04
- ~~#14 B layer probe entry consolidation: `SchemaProbeControl` moved to designer top bar (icon-only chrome); duplicate removed from version page; discoverable on canvas~~ ✅ 2026-08-04
- ~~#15 Five states + dirty chip E2E catch-up: `schema-probe.spec.ts` 4 cases (mock five states + unknown four-way + legend); `version-dirty-chip.spec.ts` no-baseline/clean/dirty; A layer unknown still manual checklist~~ ✅ 2026-08-04
- ~~#23 Baseline query failure E2E: `version-baseline.spec.ts` mock size=1 → 500 → unknown chip/tag + retry recovery; `fetchVersionBaseline` failure clears `baselineLoaded`~~ ✅ 2026-08-05
- ~~#24 Local draft discard E2E: `project-local-draft.spec.ts` discard path + `project-draft-recovery-*` testid; discard clears localStorage, reverts to server model~~ ✅ 2026-08-05
- ~~#25 409 conflict Modal decision E2E: `project-save-conflict.spec.ts` refresh/fork paths + refresh clears draft; static Modal → `appFormat`/`VersionDiffPanelStatic`; fork navigates `/design/table/model`~~ ✅ 2026-08-05
- ~~#26 Persist failure vs 409 conflict top-bar state routing E2E: `save-status-failure-routing.spec.ts` failure retry and conflict Modal must not mix states~~ ✅ 2026-08-05
- ~~#27 Top-bar retry seq alignment: `isPersistAutosaveCurrent`; mock failure → click retry → persisted (not stuck saving)~~ ✅ 2026-08-05
- ~~#28 Leave designer failure state E2E: `leave-designer-save.spec.ts` failure → leave retry shot → top-bar retry → clean leave~~ ✅ 2026-08-05
- ~~#29 Debounce window leave retry shot E2E: leave while saving → retry shot success / abort failure → draft + top-bar retry visible~~ ✅ 2026-08-05
- ~~#30 beforeunload + persist-failure draft guard E2E: reload/close page doesn’t overwrite localStorage draft; native dialog not tested (Playwright brittle), draft persistence acceptance~~ ✅ 2026-08-05
- ~~#31 Two-user collab leave retry shot E2E: dual context (sync-toast mode); A persist failure leave retry; B persisted changes visible after reload and editable~~ ✅ 2026-08-05
- ~~#32 Two-user collab B localDirty leave retry shot E2E: B blocks save keeping localDirty; A failure leave retry; B persisted + draft unsaved changes not overwritten~~ ✅ 2026-08-05

### i18n foundation (after B layer) ✅

> Per [ADR-0023](/docs/adr/i18n-foundation). Landed 2026-08-04.

- ~~Theme locale configurable (default still **zh-CN**; this slice doesn’t enable umi locale plugin MVP)~~ ✅
- ~~Remove dead `locales/` Pro scaffold (zero `useIntl` consumers)~~ ✅
- ~~E2E anti-fragile: new controls prefer `data-testid` / `aria-label`; separate locator from copy assertion~~ ✅ (`e2e-locators.mdc`)

Full i18n (language switch UI, site-wide keying) remains P3 📋; “English first” = new keys write EN+ZH together; first visit `baseNavigator:true` matches browser language, `LocaleSwitcher` explicit choice + `umi_locale` persistence override.

**i18n MVP progress (2026-08-05)**: #1–#16 all ✅ (incl. DesignLayout workflow/skip-nav/aria · `1c63853` etc.); post-MVP #17–#22 ✅; Vision default lane back to consistency/trust (#23–#32 ✅ · `76d1a1a`), **awaiting theme**

### Product depth (beyond “thin CRUD”) 📋

- Data dictionary / governance: field-level docs, ~~enum domains~~✅ (`/setting/dataType` kind=enum + editable `values[]`), ~~logical type apply dialect mapping~~✅ (dense table edit `apply[code].type`), cross-table reuse (re-evaluate 📋 dataDomain experimental page positioning)
- Reverse-engineering fidelity 🚧: ~~FK constraint name + ON DELETE/UPDATE~~✅ (`constraintName`/`deleteRule`/`updateRule`; composite still split edges same name; ~~canvas editable referential actions~~✅; ~~DDL/DBML FK write-back~~✅), composite FK `fields[]` (ADR-0011 **still deferred**, unblock = FE multi-field edge protocol), ~~PG table/column comments → chnname~~✅ (dict `obj_description`/`col_description`), ~~SQL Server table/column comments → chnname~~✅ (`MS_Description`), ~~Oracle table/column comments → chnname~~✅ (`ALL_TAB_COMMENTS`/`ALL_COL_COMMENTS`), ~~column default `COLUMN_DEF` → `defaultValue`~~✅ (JDBC generic), ~~indexes dictionary-complete~~✅, ~~PG/MySQL expression/function indexes → `indexs[].fields[]`~~✅ (`pg_get_indexdef` / `STATISTICS.EXPRESSION`), ~~Oracle/SQL Server function/computed column indexes → `indexs[].fields[]`~~✅ (`ALL_IND_EXPRESSIONS` / `sys.computed_columns.definition`; P0 four-DB closed loop), ~~PG/SQL Server partial/filter index predicates → `indexs[].filter`~~✅ (`pg_get_expr(indpred)` / `filter_definition`), ~~index signature fields/expressions editable~~✅ (JExcel text; semicolon mix; persist-on-200), ~~index signature filter column~~✅ (text read/write `filter`), ~~DDL/DBML `filter` write-back~~✅ (PG/SQLServer `WHERE`; DBML `note: filter:` convention), ~~MySQL triggers → `triggers[]`~~✅ (`INFORMATION_SCHEMA.TRIGGERS`), ~~PG triggers → `triggers[]`~~✅ (`information_schema.triggers`), ~~SQL Server triggers → `triggers[]`~~✅ (`sys.triggers`), ~~Oracle triggers → `triggers[]`~~✅ (`ALL_TRIGGERS`+`ALL_SOURCE`; P0 four-DB closed loop), ~~DDL `triggers[]` write-back~~✅ (`createTrigger`; prefer `ddl`/dialect rebuild)
- Version workflow: branch-style evolution, ~~version tags/milestones~~✅ (`db_change.tag` comma-separated multi-tag + chips filter; no cross-version uniqueness), ~~cross-version diff export~~✅ (W3 slice 1: Markdown change list + SQL)
- Collaboration → versions happen naturally (next quarter ③ ✅); deeper work see version workflow (branch-style evolution etc.)

### UI waterline (Strangler, no rewrite) 🚧

- CRUD shell stays antd (ADR-0005), design domain builds proprietary visual system (nodes/toolbar/command palette mature); [ADR-0016](/docs/adr/experience-first-shareable-diagram) beautiful-diagram main line: brand token ✅ → import/reverse dagre layered layout ✅ → node density/PK·FK badges/arrow edges ✅ → edge routing (same-table multi-FK elbow spacing + custom erdSmooth) ✅ → sample/default layout density (dagre 56/108 + Frame padding 24; demo seed uses `gen-demo-layout.ts` algorithm, dropped hand-placed x/y) ✅ → edge obstacle avoidance (centerX / bypassY around middle tables) ✅ → orthogonal edge bundling (same midX channel trunk split) ✅ → two-bend detour / mid-corridor (escapeX + stacked-table gap) ✅ → sparse Hanan A* ✅ → dense FK import walkthrough + detour shortest-win ✅ → share read-only same routing + hub fan-out ✅ → **table node card hierarchy (muted header + row dividers + PK color bar) ✅** → **geometric handle pick (vertical stack same-side short U) ✅** → **Frame theme palette + three-shell hardcode cleanup ✅** → **edge label chip readable ✅** → **post-import Frame auto-suggest ✅** → **cardinality editable (1:1/1:n/n:1/n:n) ✅** → **Frame double-click rename ✅** → **same-side outer elbow + mid-corridor shortest-win ✅** → **Crow's foot endpoints (IE, per cardinality) ✅** → **empty state composition polish ✅** → **share top bar brand alignment (W5 slice 3) ✅** → **login/register brand shell (W5 slice 4) ✅** → **landing token same source ✅** → **dense diagram density tweak (demo dagre gen + share fitView / relationNoShow) ✅** → **field row one notch denser (min-height 22 / FIELD_ROW_H 26) ✅** → **post-import first screen polish (empty import CTA + fitView same as share dense) ✅** → **competitor compare subpage `/compare` ✅** → **edge label density + Frame padding 20 ✅** → **Frame title bar density + MiniMap sunk alignment ✅** → **Controls panel density (22px + surface chrome) ✅** → **selection halo unified (table/Frame a18) ✅** → **canvas toolbar tighter (22 / font 11) ✅** → **empty panel tighter (14/18 pad + CTA 26) ✅** → **command palette density (440 / input 36) ✅** → **entity create modal density (width 400 / input 28) ✅** → **left tree row high density (22 / font 12) ✅** → **CommonTabs/tab header density (tabs ~24, no clip) ✅** → **version list row density (pad 4×8 / title 13) ✅** → **import/export modal density (`.erd-io-modal` head/foot 22–28) ✅** → **plain export page ExportCommon card density (pad 8×10 / title 13) ✅** → **settings page chrome density (DefaultSetUp / DefaultField + menu modal `.erd-io-modal`) ✅** → **database config page density (`/databaseConfig` + menu “Data source settings” `.erd-io-modal`) ✅** → **account settings + Home project card density (22–28 chrome / `.erd-io-modal`) ✅** → **personal/recent project list row density (`.project-list-page` 22–28) ✅** → **team project list row density (`/project/group` same `.project-list-page`) ✅** → **notice list row density (`/project/notice` same `.project-list-page`) ✅** → **share read-only multi-diagram switch (`diagram-switcher` / ADR-0017) ✅** → **share canvas viewport fill (480→stage flex) ✅** → **share read-only table list collapse (bottom bar expand affordance) ✅** → **share meta hint/description density ✅** → **share expanded table list row density (22–28 / project-list) ✅** → **edge label collision avoidance (AABB chip) ✅** → **share invalid/empty state brand alignment (AuthBrandShell + ErdEmptyDiagram) ✅** → **404/403 AuthBrandShell ✅** → **relation diagram SCSS brand bare rgba cleanup ✅** → **PK/FK/hover row light fill color-mix ✅** → **field row scan hierarchy (name 500/PK 600 + type right-align) ✅** → **relation line default stroke weight/contrast (ink900 + 2px) ✅** → **table header title hierarchy (title 14/700 vs chnname 10/400) ✅** → **empty state CTA hierarchy (single primary + secondary link) ✅** → **cardinality chip scan hierarchy (12/600/ink900) ✅** → **PK/FK badge scan hierarchy (10/700 + min-width 22) ✅** → **canvas toolbar/Controls scan hierarchy (single chrome block + primary action) ✅** → **table node dense table one notch (header pad 6 / field minH 20 / FIELD_ROW_H 24) ✅** → **Frame title scan (label 12/700 vs meta muted, chrome 22) ✅** → **canvas toolbar “New table” one-click on canvas (modeling loop) ✅** → **connect failure visible feedback (duplicate/illegal anchor toast) ✅** → **canvas toolbar “New table” one-click on canvas (modeling loop) ✅** → **connect failure visible feedback (duplicate/illegal anchor toast) ✅** → **field row ✎ inline edit + empty name toast (modeling loop) ✅** → **field Tab row jump + type instant save-status (modeling loop) ✅** → **last row Tab new field (modeling loop) ✅** → **edit mode PK checkbox instant save-status (modeling loop) ✅** → **edit mode not-null checkbox instant save-status (modeling loop) ✅** → **edit mode auto-increment checkbox instant save-status (modeling loop) ✅** → **edit mode hide relationNoShow instant save-status + table bottom restore (modeling loop) ✅** → **edit mode Escape cancel rename (block blur, modeling loop) ✅** → **Delete/Backspace delete field confirm (modeling loop) ✅** → **field chnname inline + Tab into Chinese name (modeling loop) ✅** → **table header entity chnname inline (modeling loop) ✅** → **field defaultValue inline + Tab into default (modeling loop) ✅** → **canvas open table design “Indexes” tab (modeling loop) ✅** → **canvas symmetric open “Fields” tab (modeling loop) ✅** → **indexes tab empty CTA “Add first index” (modeling loop) ✅** → **canvas open “Metadata apply” tab (modeling loop) ✅** → **indexes tab add-row CTA (modeling loop) ✅** → **left tree delete model/diagram confirm ✅** → **left tree rename diagram wired ✅** → **left tree new diagram path E2E ✅** → **left tree “Relations” folder + direct new diagram ✅** → **left tree “Edit table” opens table design fields tab (rename separate item) ✅** → **field-level unique hint (index unique CTA + canvas UK) ✅** → **metadata apply modify/delete fields tab aligned template ✅** → **left tree search × clear filter + no-match empty ✅** → **command palette search table locate/highlight ✅** → **designer Skip + focus ring (tree/tabs·canvas) ✅** → **table design Cmd/Ctrl+1/2/3/4 tab direct switch ✅** → **canvas field browser Tab ring ✅** → **canvas chrome Tab order (Controls/toolbar; MiniMap out of order) ✅** → **left tree keyboard roam ✅** → **canvas node-level Tab ✅** → **share shell keyboard ✅** → **login shell keyboard ✅** → **register shell keyboard ✅** → **landing keyboard polish ✅** → **404/403 shell keyboard ✅** → **share invalid gate keyboard ✅** → **`/compare` competitor page keyboard ✅** → **Home workspace keyboard ✅** → **GroupLayout shell keyboard ✅** → **project list row keyboard ✅** → **account settings shell keyboard ✅** → **project action modal keyboard ✅** → **import/export modal keyboard (DBML) ✅** → **version action modal keyboard (add/edit/delete/rollback) ✅** → **version compare/detail diff keyboard ✅** → **sync config/rebuild version modal keyboard ✅** → **init baseline modal keyboard ✅** → **Cmd+K command palette keyboard polish ✅** → **tab header density one notch (tabs ~24 / no clip) ✅** → **left tree toolbar/secondary spacing (24 / pad 4) ✅** → **version list second density/color cleanup (toolbar 24 + token) ✅** → **version ticket/approval list density (title bar ~24 / row pad 4×8) ✅** → **designer secondary table density (JExcel + version diff ~24) ✅** → **metadata apply sub-tab / CodeTab chrome (~24 / no clip) ✅** → **table design inner tab bar explicit ~24 (fields/indexes/metadata/triggers) ✅** → **context/tree action menu density (`.erd-dense-menu` ~28) ✅** → **empty table design/empty fields guidance (fields tab + canvas CTA) ✅** → **tab body content secondary spacing (pad 6/4 + hint/tip ~24) ✅** → **designer Empty / secondary empty secondary spacing (no marginTop:100 + compress marginXL) ✅** → **welcome empty secondary spacing (pad 32×24 / hero 176) ✅** → **AuthBrandShell secondary spacing (32×28 / form pad32) ✅** → **LandingChrome / `/compare` secondary spacing (section 2.75 / compare row 0.5) ✅** → **version sync result modal keyboard** ✅ → **Oracle reverse comment fidelity** ✅ → **trigger reverse (P0 four DB)** ✅ → **FK constraint name+ON DELETE/UPDATE** ✅ → **share table list pagination** ✅ → **table design triggers tab (list/DDL/CRUD)** ✅ → **DBML Enum ↔ dataTypeDomains** ✅ → **DBML expression index ↔ `indexs[].fields[]`** ✅ → **reverse PG/MySQL expression indexes** ✅ → **index signature fields/expressions editable** ✅ → **reverse Oracle/SQL Server function/computed column indexes** ✅ → **reverse PG/SQL Server partial/filter index predicates** ✅ → **DDL/DBML `filter` write-back** ✅ → **DDL `triggers[]` write-back** ✅ → ~~field type dropdown distinguishes enum~~✅; ~~dialect apply visual edit~~✅; ~~canvas edge ON DELETE/UPDATE editable~~✅; ~~DDL FK write-back~~✅; ~~canvas bottom bar open triggers~~✅; ~~triggers tab edit existing rows~~✅; ~~canvas edge constraint name editable~~✅; **auto-track paused** → Human next see “Vision auto-track pause point” above
- Raise waterline page by page: each iteration improves density and feedback on that page; no site-wide big-bang redesign
- Home / model page redesign brief: [ui-home-model-redesign](/docs/ui-home-model-redesign) ✅ (2026-08-02; decision: Home uses bright workspace system, landing keeps dark storefront; **S1–S3 ✅**: tokens + hero CTA + project grid IA tighten / remove quick-action wall / notice freshness / Menu brand)
- **Site-wide layout redesign master plan**: [ui-layout-redesign](/docs/ui-layout-redesign) (2026-08-02 v2 re-estimate: capability exposure over presentation; waves W1 designer shell ✅ → **W2 capability exposure + empty shell removal** (slices 1–4 ✅: share revoke, Home dead code/experimental page removal, designer chrome left tree dedupe+sider 320+tabs 40+flex, designer inner `calc(100vh)` zeroed) → **W3 version domain tighten** ✅ (slice 1 ✅ cross-version diff export; slice 2 ✅ version ProList→antd List + empty CTA; slice 3 ✅ approval/ticket entry rationalized; 2026-08-02 top-right “My tickets/Pending approval/Notifications” discoverable + project menu export cross-page fix) → **W4** project list/datasource migration (slices 1–15 ✅; slice 15 ✅ last 7 files zeroed + deps removed) → **W5** login/share/404 polish (slices 1–4 ✅: 404/403, share invalid state, share top bar 64px, login/register brand shell) + **landing token same source ✅**; capability map see [product-capability-map](/docs/product-capability-map))
- **Pro Strangler** ([ADR-0014](/docs/adr/drop-or-strangle-ant-pro) ✅ landed · B): `@ant-design/pro-components` / `umi-presets-pro` removed from `package.json`; `rg …pro-components` = 0; proprietary Home/Group/Design Layout + antd forms/tables

### Openness ✅ — API/MCP see ADR-0013

- ~~projectJSON public schema documented (schema-as-code, `data-format.md` upgraded to external spec)~~✅ (2026-08-02: [data-format](/docs/data-format) + [`schema/projectjson.schema.json`](https://github.com/erdonline/erdonline/blob/main/schema/projectjson.schema.json) + `scripts/validate-projectjson.mjs`; unlocks ADR-0013 trigger #3)
- ~~Public API / MCP ([ADR-0013](/docs/adr/public-api-mcp))~~✅ (2026-08-04 MVP):
  - ~~Decide auth/scope/rate-limit defaults + PAT hash storage + `/api/v1/me` + rate-limit skeleton~~✅ (slice 1, 2026-08-04)
  - ~~`GET /api/v1/projects[+/{id}]` (member ACL + projectJSON secret scrub)~~✅ (slice 2, 2026-08-04)
  - ~~`GET /api/v1/projects/{id}/versions[+/{versionId}]` (`versions:read` + member; detail clears `profile.dbs`)~~✅ (slice 3, 2026-08-04)
  - ~~MCP server read-only skeleton (`mcp/`: stdio + Streamable HTTP → above REST)~~✅ (slice 4, 2026-08-04)
  - ~~Write scope + `POST …/versions` + MCP `create_version`~~✅ (slice 5, 2026-08-04)
  - ~~`projects:write` REST: `PATCH /api/v1/projects/{id}` + `PUT …/projectJSON`~~✅ (2026-08-04)
  - ~~Cluster rate limit Redis (Redisson; fail-closed)~~✅ (2026-08-04)
  - ~~MCP `projects:write` tools: `update_project` + `put_project_json`~~✅ (2026-08-04)
  - ~~OAuth slice A: client register/list/revoke + `client_credentials` → `erd_oat_` calls `/api/v1`~~✅ (2026-08-04)
  - ~~OAuth slice B: Authorization Code + PKCE S256 (public/confidential; authorize + token)~~✅ (2026-08-04)
  - ~~OAuth client management UI: `/account/settings?selectKey=oauthClients` (list/register/secret one-time reveal/revoke)~~✅ (2026-08-04)
  - ~~PAT management UI: `/account/settings?selectKey=personalAccessTokens` (list/mint/scopes/plaintext one-time reveal/revoke)~~✅ (2026-08-04)
  - ~~Consent page: `/oauth/authorize` AuthBrandShell + Allow/Deny; GET preview no issue; only Allow → `erd_ac_`~~✅ (2026-08-04)
  - ~~OAuth refresh_token: `erd_ort_` (auth code only); rotation + reuse revokes family; `POST /oauth/revoke`~~✅ (2026-08-04)
  - ~~OIDC thin MVP: discovery / HS256 `id_token` (`ERD_OIDC_HMAC`) / userinfo / `openid` scope~~✅ (2026-08-04)
  - ~~OIDC `nonce` + `at_hash` (authorize bind; refresh omits nonce)~~✅ (2026-08-04)
  - ~~OIDC RS256 + real JWKS (drop HMAC; `/.well-known/jwks.json`)~~✅ (2026-08-04)
  - ~~Third-party IdP federation (GitHub OAuth + Google OIDC + WeChat Open Platform QR)~~✅ ([ADR-0021](/docs/adr/idp-federation-google-wechat); session JWT; decoupled from PAT/OAT)
- Import/export interop: DBML / dbdiagram format conversion, lower migration cost; plugin mechanism later — ✅ (2026-08-02: import+export Table/fields/FK/note↔chnname + Indexes↔`indexs` + `default`↔`defaultValue` closed loop; **Enum↔`dataTypeDomains.datatype` kind=enum ✅ (2026-08-03)**; **expression index↔`indexs[].fields[]` raw string ✅ (2026-08-03)**; **trigger docs deferred**: `@dbml/core` no block, `Note` forbidden as workaround)

### Security 📋

- Share token: read-only share (ADR-0007); public API PAT scope/revoke/expiry see ADR-0013 (slice 1: hash storage + revoke + optional expiry)
- CSRF/CORS converged (round 1 ✅), SQL execution trust chain fixed (approval failure doesn’t mark passed ✅) — write APIs follow same constraints
- ~~Secret discipline: connection info not in projectJSON (ADR-0008 isolated), documented external promise~~✅ ([data-format](/docs/data-format) “Secret discipline” + [security-model](/docs/security-model))
- ~~Project / dataSources IDOR (R-AUTH-03/04)~~✅ (`ProjectAcl` / `DataSourceAcl`; logged in [security-model](/docs/security-model))
- ~~Connector credentials via authenticated dataSources id (R-DATA-02)~~✅ (backend `dataSourceId`→ACL; FE hot path id-only; mutate forces id + IMDS/link-local block)
- ~~Upload ownership (R-DATA-04)~~✅ (removed test upload endpoint; Word template `.docx`+`projecterd/{projectId}`+`ProjectAcl`; see [security-model](/docs/security-model))
- ~~SocketIO Origin / CORS production default (R-CFG-04)~~✅ (`CrossOriginPolicy` prod rejects `*`; single `ERD_UI_URL` fail-fast; see [security-model](/docs/security-model))
- ~~UserController permissions (R-AUTH-02)~~✅ (`sys_user_*` `@PreAuthorize`; see [security-model](/docs/security-model))
- ~~SocketIO project membership (R-AUTH-05)~~✅ (handshake + `JOIN_ROOM` validates `project_user`; see [security-model](/docs/security-model))
- ~~Open registration dual entry (R-AUTH-06)~~✅ (single entry + `allow-open-register` prod default off; see [security-model](/docs/security-model))
- ~~TestJson sample surface (R-DATA-05)~~✅ (removed Controller/Service/Mapper/Entity; see [security-model](/docs/security-model))
- ~~App DB JDBC `useSSL=false` (R-CFG-03)~~✅ (dual DS env-driven TLS; prod default on; compose off; see [security-model](/docs/security-model))
- ~~`frameOptions` restored (R-AUTH-07)~~✅ (API `DENY`; share via SPA; see [security-model](/docs/security-model))
- ~~ignore fake paths / fake switches (R-DEAD-01/02/03)~~✅ (removed `martin.swagger`/`resource-server`; ignore drops `/endpoint/**`; see [security-model](/docs/security-model))
- ~~OSS default keys / `.env.example` OAuth dead keys (R-CFG-05/06)~~✅ (nested minio empty defaults + `OssCredentialGuard`; removed `OAUTH_CLIENT_*`; see [security-model](/docs/security-model))
- ~~SocketIO 9092 public exposure note (R-OPS-03)~~✅ (deployment firewall convention)
- ~~Connector DNS rebinding (R-DATA-02 residual: resolve then judge IMDS)~~✅ (`JdbcUrlGuard` `getAllByName`; RFC1918 still allowed)
- ~~Connector check→connect TOCTOU (R-DATA-02 residual: pin resolved IP)~~✅ (`assertAllowedAndPin` → `AbstractDBCommand`/`JdbcKit`/`DynamicAspect`; RFC1918 still allowed)
- ~~`data_sources.username`/`password` plaintext at rest (R-DATA-06)~~✅ ([ADR-0024](/docs/adr/datasource-credential-encryption): `DataSourceCredentialCipher` AES-256-GCM at-rest encryption, `ERD_DB_CONFIG_SECRET` key, gradual plaintext migration; see [security-model](/docs/security-model#r-data-06))
- Next slice: raw ping·reverse JDBC surface / contributor path (see security-model R-DATA-02)

### Gaps users didn’t ask for (proactive) 📋

- Contributor funnel: good-first-issue → first PR → maintainer path documented (`community.md` extension)
- ~~Schema versioning external promise: projectJSON compatibility policy written (agent dependency stability)~~✅ (`data-format.md` “additive only / no in-place breaking”)
- ~~Agent-readable projectJSON: machine-validatable JSON Schema + examples~~✅ (`schema/` + `node scripts/validate-projectjson.mjs`)
- ~~Observability: self-deployer health/metrics endpoints (few, low cost)~~✅ (`/actuator/health` + `/actuator/info` app/version; unexposed paths 404; see [deployment](/docs/deployment))
- ~~Self-deploy DX: docker-compose one-click docs acceptance + upgrade path drill~~✅ (`scripts/verify-self-deploy.sh` + [deployment](/docs/deployment) acceptance/upgrade drill; Flyway doesn’t rely on re-running `db/init`)
- ~~Competitor compare page: honest vs dbdiagram / dbml (collab/version/open/self-host), landing subpage~~✅ (`/compare` + landing summary table; E2E `compare.spec.ts`)
- ~~Compare table: draw.io column + FK-semantics row (GSC `/compare` already has clicks; www H1/SERP unchanged)~~✅ 2026-08-28

## Phase overview

| Phase | Goal | Key deliverables | Status |
|---|---|---|---|
| Round 0: Validation infrastructure | Prerequisite for all iteration | Full-stack one-click start; Playwright core journey smoke in CI | ✅ 2026-08-01 |
| Round 1: Interaction first-aid + P0 security | Existing pages not annoying; others dare to use | ~~Silent failure feedback~~✅; ~~undo/redo wired~~✅; ~~delete confirm~~✅(code); ~~CORS/CSRF converge~~✅; ~~hardcoded passwords removed~~✅(prod fail-fast); ~~/oauth/token 500→401~~✅; ~~relation diagram entry~~✅; ~~fastjson→Jackson~~✅(round 2 done); ~~create_time fill~~✅; ~~card dead links~~✅; ~~dev loop speedup~~✅ | ✅ |
| Round 2: Quality baseline | Contributors dare to change | ~~Boot 3.5.16 + JDK 17 + JWT~~✅; ~~dead code removal~~✅; ~~fastjson→Jackson~~✅; ~~core tests ≥50%+Jacoco~~✅; ~~CI coverage/lint:js:ci~~✅; ~~version snapshot zero friction~~✅ | ✅ |
| Rounds 3–6: ReactFlow canvas | Designer modernization | ~~R0~~✅ → ~~R1~~✅ → ~~R2~~✅ → ~~R3~~✅ (canvas + export off G6) | ✅ closed |
| Round 3: Version time machine | Raise “weekly version saves” | ~~Snapshot zero friction~~✅; ~~version diff visualization~~✅; ~~ticket/approval polish~~✅; ~~edit version duplicate block keep modal open~~✅ | ✅ 2026-08-01 |
| P2: Experience deep water | Users love it | ~~Home sample project 30s activation~~✅; ~~autosave status visible~~✅; ~~open source unlimited projects~~✅; ~~project empty guidance + new form lighten~~✅; ~~shorter create-table path~~✅; ~~loading skeleton unified~~✅; ~~dark mode deferred (ADR-0010)~~✅; ~~MUI/Blueprint→antd cleanup~~✅; ~~rename field follows edge~~✅; ~~performance budget / viewport culling~~✅; ~~eslint hot-path console / legacy log zero~~✅ (rest warn→P4); ~~core API connectivity~~✅; ~~datasource isolation (ADR-0008)~~✅ | ✅ |
| **P2b: Site-wide control closed loop** | Clickable reaches result; dead entries fix or delete | Control matrix [control-matrix](/docs/control-matrix); ~~W0–W6~~✅; matrix **🚧=0**; 📋 deferred (not this phase): forum external link (canonical Discussions not ready), VIP badge (avatar identification covers), experimental dataDomain/query/ChatSQL/dataQuery pages | ✅ 2026-08-02 |
| P3: Feature depth | Stronger than competitors | ~~Version diff visualization~~✅ (round 3); ~~collab presence+cursor+incremental sync (ADR-0009)~~✅; ~~remote sync conflict hint~~✅; ~~read-only share link~~✅ (ADR-0007); ~~reverse engineering + P0 four-DB dict FK~~✅ (ADR-0006; ~~composite fields[] deferred ADR-0011~~✅); AI📋; i18n📋 | 🚧 |
| P3a: Acquisition & spread | Strangers can try and produce versions | ~~Online demo (`/demo`→`/s/public-demo`)~~✅; ~~share page → fork + autofork~~✅; ~~signup conversion (redirect loop)~~✅; ~~biweekly release notes~~✅ | ✅ |
| P4: Community & ecosystem | Project grows | ~~Docs site skeleton / Pages / local search~~✅; ~~user docs polished (intro + seven guides thickened + nav/Footer/search)~~✅; ~~docs polish (immersive handbook + Baidu analytics + zh/en i18n)~~✅; ~~hosting topology 1–3: CF Pages docs+static demo, GHCR release, compose pull image (ADR-0018)~~✅; ~~good-first-issue ops checklist (`docs/community.md` + Issue templates)~~✅; ~~Issue drafts + `seed-good-first-issues.sh`~~✅; ~~CHANGELOG Unreleased daily fold~~✅; ~~draft `33` delete field a11y~~✅; ~~draft `34` Controls Chinese aria~~✅; ~~draft `35` MiniMap Chinese aria~~✅; ~~draft `36` canvas toolbar aria~~✅; ~~draft `37` SaveStatus aria-live~~✅; ~~draft `38` CollabPresence aria-live~~✅; ~~draft `39` command palette listbox~~✅; draft pool empty (a11y micro-slices paused); seed 3–8 via `seed-good-first-issues.sh` after canonical repo ready 📋; release cadence solid ✅; ~~official demo runtime choice Railway-only (ADR-0019) + deployment steps~~✅; Dashboard actually spin Railway + fill `DEMO_API_URL` 📋 | 🚧 |

## Full user journey (we care about every step)

First contact (landing/README) → try (online demo) → register/login → newcomer activation (sample project) → daily creation (designer) → team collaboration (invite/permissions/notifications) → share (read-only link/export) → return visits (feed/What's New) → self-host ops (upgrade/backup) → community contribution.

Every stage breakpoint has a corresponding phase; see deliverables per phase above.

## Release policy

- Semantic versioning (semver); breaking changes announced one minor version ahead with migration guide
- All database schema changes via Flyway migration scripts; self-deploy users smooth upgrade
- Biweekly release with release notes and before/after comparisons

## How to influence the roadmap

- Request a feature: open an Issue stating which user value layer it serves (see [vision](/docs/vision))
- Join discussion: reply on [Issues](https://github.com/erdonline/erdonline/issues) or start a discussion
- Contribute directly: claim a `good first issue`, read repo root [CONTRIBUTING.md](https://github.com/erdonline/erdonline/blob/main/CONTRIBUTING.md)
