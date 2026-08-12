# Home / Model redesign brief

> **Expanded to site-wide master doc**: layout/density/navigation/empty-state rules and W1–W5 waves for all pages are in [ui-layout-redesign.md](./ui-layout-redesign.md); this doc keeps Home and model page block-level IA details and token definitions.

> Audience: implementers of the next UI slice (Auto). Answers one question: how to raise Home and model pages from "internal tool feel" to "first-class product feel".
> Constraints: ADR-0005 (CRUD shell uses antd, design domain may custom visual), ADR-0010 (no dark mode this phase), no framework rewrite, Strangler page-by-page lift.

## Key decision: Home is "workspace-style", not "landing brand-style"

**Conclusion: Home is the post-login workspace (Figma-like workspace hub), not continuing the landing page dark brand layout.**

Reasons:

1. Different job. Landing `/` has one duty: 30-second wow (narrative + hero image + CTA); Home has one duty: **get the user back to modeling immediately** (continue last project / create new). Dark full-bleed brand layout slows that goal.
2. Different context. Above Home is the designer (light, antd, ReactFlow canvas). Every dark↔light hop from Home to canvas is a visual reset. Workspace stays light—same world as the canvas.
3. Consistency ≠ same face. Brand continuity via **type and accent color**: landing Syne/IBM Plex Sans and restrained tone enter the workspace; dark stays on landing as the "facade".

Landing = dark facade (unchanged); Home / designer chrome = same light workspace system. One system, two exposures.

## Current pain points (code evidence)

| Pain | Location | Why first-class products don't do this |
|---|---|---|
| Rainbow stat cards | `pages/home/index.tsx` three `Statistic` with `#1890ff`/`#52c41a`/`#faad14`, `Progress` blue-green gradient | No palette discipline; dashboard template residue |
| Duplicate data | "Project overview" card (personal/team stats + bars) duplicates top `ExtraContent` stats | Two reports of same numbers on one screen—placeholder, not work |
| Random slogan rotation | `HomeLayout` swaps slogan every 10s, footer `Space` with 3 secondary copy blocks | Internal tool amusement; distracts |
| Decorative background | `DesignLayout` `bgLayoutImgList` three `ant-*.png` under designer | Pro template residue; noise over canvas |
| Nested cards + shadow patch | Home project `Card.Grid` nested `Card` + `boxShadow:none` | Wrong component then patched; density out of control |
| Badge hardcoded hack | ~~GitHub stars `<img>` with `marginTop:-10px`~~ → text link `erd-chrome-link` ✅ | Layout aligned with negative magic numbers |
| Canvas height magic number | `reactflow-relation.scss` `height: calc(100vh - 104px)` | Breaks when header/tabs change; not flex thinking |
| Sidebar too wide | `DesignLayout siderWidth = 400` | Tree at most 1/5 screen; 400px squeezes canvas |

## Visual direction (tokens)

Single source of truth: `frontend/src/theme/tokens.ts` (antd `ConfigProvider.theme`) + same values `theme/css-vars.less`. Workspace injected via `components/Theme`; design domain scss / layout less read CSS variables—no scattered magic numbers.

### Style strategy (token first)

| Priority | Approach | Applies to |
|---|---|---|
| 1 | antd 5 `ConfigProvider` `theme={{ token, components }}` (`theme/tokens.ts`) | color, radius, type, component tokens |
| 2 | `:root` CSS variables (`theme/css-vars.less`, same values as tokens) | layout BEM less, design scss when reading same palette |
| Exception | Keep scoped less | **Landing** `pages/landing/index.less` (dark facade; colors/type read `--erd-*`); complex tables/editors (JExcel, QueryTree); local animations |

Forbidden: new `.ant-pro-*` / deep `.ant-*` overrides for removed Pro chrome; no raw hex for new colors (add token first).

### Color

```
brand        #DE2910   primary action/selected (existing logo, VIP, DesignLayout primaryColor—no second primary)
brand-hover  #B91E0C
ink-900      #0B1C2C   headings (borrow landing ink)
ink-600      #44525F   body
ink-400      #8A97A3   secondary/caption
line         #E4E7ED   borders (same as canvas node borders)
surface      #FFFFFF   cards
surface-sunk #FAFBFC   page base (canvas #fafafa same family, slight diff OK, unify later)
success      #2F8F7B   borrow landing teal; team/success semantics
warning      #D48806
```

- **Ban**: no `#1890ff/#52c41a/#faad14`; no blue-green gradient Progress. Semantic colors for state only—not decorating stat numbers (stats always ink-900, icons ink-400).

### Typography

- Display (Home greeting, empty state titles): `Syne, 'PingFang SC', sans-serif`, weight 700, `letter-spacing:-0.02em`
- UI body: `'IBM Plex Sans', 'PingFang SC', 'Noto Sans SC', sans-serif` (landing family)
- Scale: 12 (aux) / 13 (table·node) / 14 (body) / 16 (section) / 20 (card) / 28 (page) / 40 (hero greeting)
- antd token: unified `fontFamily`; `fontSize: 14`; `fontSizeHeading2: 28` etc. mapped above

### Spacing / radius / elevation

- 4pt grid; card padding 16/20, section gap 16/24; eliminate `marginTop:-10px` magic
- Radius: `borderRadius: 8` (match canvas nodes), buttons 8, inputs 6
- Shadow three levels: `sm: 0 1px 2px rgba(11,28,44,.06)` (static card), `md: 0 4px 16px rgba(11,28,44,.10)` (hover/overlay), `lg` (Modal/Drawer antd default)
- Elevation rule: **static cards use 1px `line` border + sm; hover only upgrades to md**; forbid `bordered={false}` + `boxShadow:none` patches

## Home information architecture (after redesign)

Single page, single job: **let the user continue modeling within 5 seconds**. Top to bottom:

1. **Hero strip** (one composition)
   - Left: `Syne 28px` "Welcome back, `{username}`" + one-line context (last edited project + updated time) + 3 quiet metrics
   - Right: **only** CTA cluster — primary `Continue last model` + secondary `New model` (`home-link-new-project`) + text link `Start from example` (`home-link-example`)
   - **Remove**: quick-action color tile wall (duplicates hero CTA; narrow column used vertical Chinese), rainbow stats, slogan rotation
2. **Secondary entry** (one row of horizontal text links, not tiles)
   - `Personal projects · Recent · Team · Import model` (keep `home-link-*` testId); never vertical/rotated Chinese
3. **Projects in progress** (first-screen anchor, full width)
   - Desktop 3 columns: type pill (personal ink / team teal) + project name 16px + one-line description + "Updated"; hover shows "Open" + md shadow
   - Whole card one `<Link>`; empty = Empty + "New model" / "Start from example"
4. **Announcements** (default de-emphasized)
   - Render small list only when **within 90 days**; hide whole section when expired/empty (no three-year-old items filling Home)

Top bar: HomeLayout whole shell wraps `ConfigProvider` (`erdTheme`); horizontal Menu selected color/underline uses brand `#DE2910`—no default Ant blue.

Before/After principle alignment:

| Principle | Before | After |
|---|---|---|
| §4 zero-friction default | hero CTA + 6 tiles duplicate—unclear where to click | one CTA cluster + project grid anchor |
| §1 instant feedback | color tiles + stale announcements steal focus | quiet metrics; announcements hideable |
| §6 fluid motion | Card.Grid nested, no hover | card hover elevation |
| Atmosphere no clutter | vertical Chinese tiles + template blue underline | horizontal links + brand nav |

## Model page (`/design/table/model` + DesignLayout) information architecture

Hierarchy: **canvas is hero; all chrome steps back**.

1. **Top bar (64px, fixed height)**
   - Left: logo + `Project ▾` menu (keep current)
   - Center: remove breadcrumb (no nav value in designer)
   - Right: `save status · save version · collaborators · share` grouped, 8px dividers; GitHub/WeChat official account into user menu or out of designer (no acquisition inside designer)
   - **Remove**: `bgLayoutImgList` three `ant-*.png` backgrounds; watermark kept (license) but evaluate opacity
2. **Left tree panel**
   - `siderWidth` 400 → **320**, Splitter default 20% but min 240px
   - Panel head: module name + search + **primary "+ New"** (dropdown: table / relation diagram)—current new entry buried in tree context menu; first designer action must be visible
   - Tree row height 36→32, icons ink-400, selected brand left bar 2px (not full-row light blue)
   - Bottom "project name + copyright" footer removed (top bar has project name; copyright stays Home/landing)
3. **Tab bar + canvas**
   - tabs height down to 40px, unsaved dot indicator, close button on hover only
   - canvas `height: calc(100vh - 104px)` magic → flex fill (`Flex vertical` inner `flex:1; min-height:0`); header/tabs height changes won't break
   - empty state one CTA: "New table" primary + "Reverse from datasource" text link (merge nested dual empty states)

Before/After principle alignment:

| Principle | Before | After |
|---|---|---|
| §3 context as tool | new table hidden in context menu | panel head "+ New" always visible |
| §6 fluid motion | height magic number fragile | flex elastic fill |
| Atmosphere no clutter | decorative bg + wide sidebar + footer | maximize canvas, chrome recedes |
| §2 keyboard first | unchanged (`Cmd+K` ready; brief doesn't touch) | — |

## Out of scope (this phase)

- No dark mode (ADR-0010); token structure allows future dark theme, not implemented
- No UI framework swap; CRUD shell stays antd (ADR-0005)
- No landing layout changes; no canvas node visual system rewrite (established—token align only)
- No interaction behavior or route changes; presentation only

## Slices (Strangler, Auto can implement slice by slice)

Each slice independently revertible; after each run `yarn build` + affected E2E + UX walkthrough screenshots.

| # | Slice | Scope | Verification |
|---|---|---|---|
| S0 | Dependency upgrade (prerequisite, ADR-0014) ✅ | **Upgrade umi + antd only, not `@ant-design/pro-components`**; freeze new Pro usage; `rc-util@5.44.4` peer fix; chrome slices 1–2 removed Home/Group/Design Pro | `yarn build` green; pro=`2.8.10`; Pro import files ≤ baseline 70 |
| S1 | Token foundation ✅ | `theme/tokens.ts` + `ConfigProvider` + `theme/css-vars.less`; trim Pro scaffold dead less; **no visible change** or radius/primary normalize only | `yarn build` green; `layout-outlet.spec` + home smoke no regression |
| S1b | DesignLayout remove Pro ✅ | `ProLayout` → antd `Layout`/`Menu`/`Watermark`; keep save/share/presence/`homeRightContent`/project menu; less reads `var(--erd-*)` | `layout-outlet` DesignLayout + `presence` / `project-menu` |
| S2 | Home hero strip ✅ | greeting + primary CTA "Continue last model" to recent project canvas + 3 quiet metrics; remove ExtraContent rainbow / VIP in title; quick links use tokens | `project-surface` "Home hero: continue last model…"; `rg '#1890ff\|#52c41a\|#faad14' pages/home` = 0 |
| S3 | Home project grid + IA tighten ✅ | remove Card.Grid / quick-action wall; 3-column project anchor; secondary horizontal links; announcements 90-day hide; Menu brand underline | `project-surface` + `layout-outlet`; screenshot `home-redesign.png`; no vertical Chinese |
| S4 | DesignLayout declutter | remove `bgLayoutImgList`, sider 400→320, remove sider footer, badge align without magic numbers | `layout-outlet.spec` green; designer screenshot compare |
| S5 | Tree panel head + tabs density + canvas flex height | expose "+ New"; tabs 40px; remove `calc(100vh-104px)` | new table journey E2E (smoke "login→new→designer") no regression; single empty CTA |
| S6 | Walkthrough closeout | full core journey UX screenshots + `regression-checklist.md` register + check off slices here | `ux-audit.spec` green; manual screenshot pass |

Dependency order: S0 → S1 → (S2∥S4) → S3 → S5 → S6. S2/S3 touch `pages/home` only; S4/S5 touch `layouts/DesignLayout` and designer chrome only—non-blocking. S0 is dependency prerequisite: upgrading umi+antd must not deepen Pro usage (ADR-0014); S2–S5 peel Pro from touched chrome (ProLayout/PageContainer/ProCard).

## Metrics (compare at each slice close)

- Home first-screen "visible card count": 4 → 3; duplicate stat groups: 2 → 1; footer copy blocks: 3 → 1
- Designer canvas usable width: +80px (sider 400→320); height magic numbers: 1 → 0
- Raw rainbow hex: `grep -c '#1890ff\|#52c41a\|#faad14' frontend/src/pages/home` → 0
- No new `any`; no new UI deps; `yarn build` bundle size non-increasing (deleting images should shrink slightly)
