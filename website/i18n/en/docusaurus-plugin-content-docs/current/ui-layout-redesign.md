# Site-wide Layout Redesign Master Plan

> **v2 Reassessment (2026-08-02)**: After cross-checking vision / ADR-0012 / backend capability inventory, **wave order has changed** (see "Waves" section). Core correction: capability exposure and shell removal take priority over presentation-layer density polish; Pro zero-out drops from "wave-driven metric" to "cleanup hygiene". Full capability matrix: [product-capability-map.md](./product-capability-map.md).

> Audience: implementers executing UI slices (Auto). Answers one question: **how to raise layout quality across all existing pages to first-class product feel**, and in what order.
> Constraints: antd 5 + umi (ADR-0005 / ADR-0014); Pro Strangler peel-only, no deepening; visual tokens single source of truth `frontend/src/theme/tokens.ts` + `theme/css-vars.less` (see [ui-home-model-redesign.md](./ui-home-model-redesign.md) §Visual direction — this doc does not redefine the palette); landing page dark brand facade stays; Home is a light workspace.
> Relationship: this doc is the **site-wide master plan**; Home/model page block-level IA details remain in `ui-home-model-redesign.md`; this doc references only, does not duplicate.

## One System, Two Exposures

| World | Pages | Visual |
|---|---|---|
| Facade (dark brand) | Landing `/`, login/register | Syne/IBM Plex type + dark composition, brand-first |
| Workspace (light system) | Home, project list, designer chrome, version/settings/account, data sources, share, 404 | Light token system; antd Layout/Table/Form as skeleton |

Bridge across worlds: login/register left half uses landing dark brand panel, right half white form — one dark→light transition stitching "facade" and "workspace" on one screen.

## Layout Pattern Catalog (only these three shells site-wide)

1. **Brand Shell**: no nav chrome; content centered/split-column. Used for landing, login/register, 404/403.
2. **Workspace Shell**: 64px header (`--erd-chrome-header-h`; logo + primary nav + right user area) + content area `max-width: 1200px` centered + one-line footer copyright. Used for Home, dataModels, project/*, databaseConfig, account/settings. Implementation = `HomeLayout` + shared `layouts/erd-chrome.less` (GroupLayout same chrome; **no full-page Watermark**).
3. **Designer Shell**: 64px header (same chrome) + left tree 320px + tabs ~24px (`--erd-tabs-h`, was 40→28→24, ADR-0016 density) + flex canvas. Used for `/design/*` (including version / import / export / setting tabs). Implementation = `DesignLayout` (antd Layout, W1 peeled Pro; version number under "More", no watermark clutter).

**Do not invent a fourth shell**; do not wrap any page in ProLayout/PageContainer again (ADR-0014).

## Density Spec (site-wide unified)

- 4pt grid; **workspace shell outer gutter** Home/Group: shell/content 12×16, body 12×16 (inner page adds 8×12); forbid outer gutter 24/20 stacked with inner double-loose gutter; card padding follows each `.` densify class
- Tables: `size="middle"`, row height controlled by antd token, forbid custom row-height magic numbers
- Forms: `layout="vertical"` (settings) or `labelCol 6` inside modals; labels 13px, required asterisk brand color
- List row height follows `.project-list-page` / data source table densify (~row pad 4×8); tree row height 22
- Type scale follows token brief: 12/13/14/16/20/28/40; stat numbers always ink-900, no rainbow colors

## Navigation Patterns

- **Global**: workspace shell header primary nav (Home / Projects / Data Sources / Account), current item brand underline 2px, hover ink-900
- **Inside designer (single chrome)**: left logo→`/home` + **project name ▾** (`aria-label=Project menu`: All projects → **Recent projects (max 5, current item ✓, click other item switches `/design/table/model?projectId=`)** → import·export·settings overlay, `items` API + submenus externalized, submenu click and only one open at a time); center main tabs **Model | Version only** (version includes sider sub-nav); right SaveStatus / **Save version** / presence / share / **My work orders·Pending approvals·Notifications** (`/design/table/version/order|approval`, `/project/notice`) / `⋯` (WeChat·GitHub·version number) / user. Import·export·settings pages remain deep-linkable, not in header
- **Hierarchy consolidation**: project list card whole-card `<Link>` straight to designer; switch project inside designer via ▾ "Recent projects"; return to list via "All projects" / logo, no new "Back" button


## Empty State Spec (one sentence + one primary CTA per page)

| Page | Empty state |
|---|---|
| Home project area | Illustration + "New model" primary button + "Start from example" text link |
| dataModels (each tab) | "No projects yet" + "New project" primary button; team tab adds "Create a team" text link |
| databaseConfig | "No data sources yet" + "New data source" primary button |
| Designer canvas | ER silhouette illustration + "Create first table" primary button + "Import DBML" secondary button + "Reverse from data source" text link (empty state hides MiniMap); after import opens relation diagram and fitView |
| version list | "No versions yet" + "Save first version" primary button (same action as header entry) |
| share (invalid link) | `AuthBrandShell` + "Open demo" primary button + "Back to Home"; empty module/no model → ER silhouette + same CTA |
| 404 / 403 | `AuthBrandShell` + "Open demo" primary button + "Back to Home" (same shape as share invalid gate) |

Use brand shell / ER silhouette empty states uniformly; reuse existing illustration assets; empty-state CTA must be reachable (`getByRole('button', { name })`). Forbid bare antd `Result` as brand gate.

## Per-Page Plan

### Landing `/` (Brand Shell · composition unchanged)

- Keep dark full-bleed brand composition and `landing-hero.jpg` (roadmap P5 decided)
- ✅ **Landing page token alignment** (2026-08-03): `pages/landing/index.less` cleared `@ink`/`@accent`/`#4aa3c8` magic colors → `--erd-*` + `color-mix`; primary CTA changed to brand red; three pillars use success/brand/warning accents; type family via `--erd-font-*`
- Footer one-line copyright; links grouped under "Resources" column

### Login / Register (Brand Shell · W5)

- ✅ **W5 slice 4** (2026-08-03): `AuthBrandShell` left 40% dark brand panel (`--erd-ink-900` gradient + logo/narrative/`ErdEmptyDiagram` thumbnail + "Open demo" text link) + right 60% white antd `Form`; cleared `bg2.png` / `#1677FF` hardcodes; register page same shape; `redirect` loop unchanged

### Home `/home` (Workspace Shell · W2, deletion-first)

- Block-level IA see `ui-home-model-redesign.md` §Home information architecture (hero CTA cluster + secondary horizontal links + full-width 3-column project grid; no quick-action wall; announcements hideable by freshness); W2 **deletion only**: duplicate stat cards ("Project overview"), slogan rotation, `components/Radar/`, `_mock.ts`, unrendered `Pie` config and dead `@ant-design/charts` import
- ✅ **S2 Home hero** (2026-08-02): primary CTA "Continue last modeling" straight to recent project canvas + quiet three metrics; quick links retokenized (not W5 presentation layer)
- Grid hover elevation and other density details are opportunistic, not standalone slices; forbid extra visual design hours for Home (S3 grid is separate slice)
- Verification anchors: `getByRole('button', { name: 'Continue last modeling' })`, `home-link-*` testId

### Project list dataModels + project/* (Workspace Shell · W4)

- Current: `ProList` (dataModels / project/person / project/recent / project/group) card list, `avatar:'/logo.svg'` placeholder, action buttons stacked in `actions`
- Target: antd `List` + inline row layout: left logo 32px + project name (16 strong, whole row `<Link>` straight to designer) + type Tag (personal ink / team teal) + one-line truncated description + right "Updated x ago" + hover-reveal row-end actions (rename/copy/settings/delete in `Dropdown`)
- Tabs (recent/personal/team) use antd `Tabs` at content header; sort `Select` right-aligned; pagination unchanged
- Peel all `ProList`; delete project confirmation unchanged (existing)
- project/group subpages (members/permissions/settings) same wave: `PageContainer` → workspace shell content area + antd `Card` sections

### Data source config databaseConfig (Workspace Shell · W4)

- Current: `PageContainer` + `ProTable`, functionality complete (status Badge / ping / Drawer form / batch delete)
- Target: peel `PageContainer` → workspace shell; `ProTable` → antd `Table` (columns ported, toolbar becomes title row + right "New data source" primary button + search `Input.Search`); Drawer form `ProForm*` deferred to W4 unified peel
- Column width uses `Table` default adaptive, forbid fixed px total width

### Designer chrome + model (Designer Shell · W1 ✅ / W2 cleanup ✅ / header IA ✅)

- W1: DesignLayout peel ProLayout → antd Layout (**✅**, see CHANGELOG 2026-08-02); header keeps save/share/presence/`homeRightContent`/project menu
- ✅ **W2 slice 3** (2026-08-02): removed main area nested `Splitter`/`DataTable` (left tree only = sider); removed sider footer; sider 400→320; `CommonTabs` bar 40px; designer shell `calc(100vh-*)` → flex fill; tree header "New" (`design-tree-add`) always visible
- ✅ **W2 slice 4** (2026-08-02): cleared designer residual `calc(100vh)` — fixed `EmptyStateAnimation` content height chain break; `QueryTree` / `version` / ReactFlow → flex/`height:100%` (metric "post-W1 designer 0" closed)
- ✅ **Header IA consolidation** (2026-08-02): removed "Project ▾" and horizontal five-tab dual navigation; project name switcher + Model|Version + right North Star CTA + `⋯` overflow (see "Navigation Patterns")
- ✅ **Project ▾ recent switch** (2026-08-02): menu "Recent projects" max 5 (`recentProject`); current item ✓; click other item switches `/design/table/model?projectId=`; "All projects"/import·export·settings retained

### Version version / Import import / Export export / Settings setting (Designer Shell tabs · W3/W4)

- Current: `design/version` uses `ProList` deep hack (token brief marks "pending peel"); import/export/setting dialogs and panels heavy `ProForm*` (ReverseDatabase, ExportDDL, DatabaseSetUp, DefaultSetUp, etc.)
- Target:
  - version list → antd `List`/`Table`: version number (strong) + tag chips + truncated description + time + row-end action Dropdown (rename/diff/**export**/revert/approval); diff/approval subpages same shell
  - **Cross-version diff export** is new capability this wave (not port): diff panel adds "Export" action, reuses existing export pipeline
  - All `ProForm*` → antd `Form` + `Form.Item`: fields, validation, `onFinish` ported; modal width unified 520/720 two tiers
  - Form button area: primary button right brand, cancel left text button; destructive ops (rebuild version) confirmation unchanged
- Principle: **peel one dialog at a time**, port without behavior change; run that journey E2E after each peel

### Account account/settings (Workspace Shell · W4)

- Current: Pro settings page skeleton (`account/settings` + `components/base` etc. `ProForm`)
- Target: antd `Tabs` (left vertical: Basic profile / Change password) + `Form layout="vertical"`; avatar upload unchanged; peel all ProForm; delete "Geographic/Phone" etc. fields with no backend (grep first to confirm zero refs)
- ✅ **Authorization type density alignment** (2026-08-03): `identification` removed bare `Result` / `#DE2910`; density status panel (13/22 + `--erd-brand`); `account-settings-identification`
- ✅ **Export / Home·Group icon token** (2026-08-03): `ExportCommon` icon `currentColor`→`--erd-brand`; Home/Group `_defaultProps` aligned DesignLayout `erdColors.brand`
- ✅ **dataTypeDomains tree icon token** (2026-08-03): `getDataTypeTree` `brandFill = erdColors.brand`; forbid bare `#DE2910`; settings page `/setting/dataType` mounted

### Share share (Brand Shell-lite · W5)

- Current: read-only canvas + header, fork entry wired (P3a ✅)
- ✅ **W5 slice 2** (2026-08-02): invalid/expired token → `Result` 403 + "Back to Home" + "Open demo" (same shape as 404/403)
- ✅ **W5 slice 3** (2026-08-03): success state header aligned designer shell — `erd-chrome-header` 64px, logo→landing, project name + "Read-only" Tag, "Copy to my projects" primary button, logged-out "Login/Register" text link (with autofork redirect); removed Card/`Alert` thick shell, canvas is facade body
- ✅ **W5 slice 4** (2026-08-03): login/register brand shell — left dark panel + right Form; see section above
- ✅ **Share invalid/empty state brand alignment** (2026-08-03): invalid gate → `AuthBrandShell` (removed bare 403 Result); no model/no table → `ShareEmptyState` (`ErdEmptyDiagram` + primary CTA); `--erd-*` same language
- Share page is product facade for strangers; keep light chrome, no workspace navigation

### 404 / 403 (Brand Shell · W5)

- ✅ **W5 slice 1** (2026-08-02): removed `antd/dist/reset.css`; `Result` standard status icons (removed `no-found.svg` / `no-access.svg`); extra "Back to Home" + "Open demo" → `/demo`; 403 same shape
- ✅ **404/403 brand alignment** (2026-08-03): → `AuthBrandShell` (removed bare Result); primary CTA "Open demo" + "Back to Home"; same language as share invalid gate
- ✅ **404/403 shell keyboard** (2026-08-03): Skip "Skip to main action" → `#exception-main-cta`; focus-visible brand; `/403` deep link reachable; same shape as landing/login
- ✅ **Share invalid gate keyboard** (2026-08-03): same Skip→ `#exception-main-cta` (`share-invalid-gate`); focus-visible brand; `share.spec` keyboard green
- ✅ **`/compare` competitor comparison page keyboard** (2026-08-03): same shell Skip→ `#landing-main-cta`; demo→self-host→back to Home; surface focus-visible; `compare.spec` keyboard green
- ✅ **Home workspace keyboard** (2026-08-03): Skip "Skip to main content" → `#home-main-content`; CTA/secondary entry/project card tab order; brand focus-visible; `home-keyboard.spec` green
- ✅ **GroupLayout shell keyboard** (2026-08-03): Skip "Skip to main content" → `#group-main-content`; bypass header+sidebar; basic settings form tab order; brand focus-visible; `group-keyboard.spec` green
- ✅ **Project list row keyboard** (2026-08-03): personal/recent/team stretched link removes dead card; Enter opens designer; Tab row actions; brand focus-visible; `project-list-keyboard.spec` green
- ✅ **Account settings shell keyboard** (2026-08-03): `/account/settings` Skip "Skip to main form" → `#account-settings-form`; bypass header+sidebar; email→phone→save; brand focus-visible; `account-settings-keyboard.spec` green
- ✅ **Project action modal keyboard** (2026-08-03): create/edit first focus field; delete confirm first focus "Yes"; Esc returns; Tab trap; `project-action-modals-keyboard.spec` green
- ✅ **Import/export overlay keyboard** (2026-08-03): DBML import first focus text / export first focus model; Esc returns empty-state CTA/project menu; Tab trap; `import-export-keyboard.spec` green
- ✅ **Version action modal keyboard** (2026-08-03): add/edit first focus version number (non-latest→description); delete/revert Popconfirm→Modal first focus "Yes"; Esc returns; Tab trap; `version-action-modals-keyboard.spec` green
- ✅ **Version compare/detail diff overlay keyboard** (2026-08-03): compare first focus "Initial version"; detail first focus "Export change list"; Esc returns; Tab trap; `version-diff-keyboard.spec` green
- ✅ **Sync config/rebuild version overlay keyboard** (2026-08-03): sync config first focus "Field incremental"; rebuild version first focus "Version number"; Esc returns; Tab trap; `version-sync-rebuild-keyboard.spec` green
- ✅ **Init baseline overlay keyboard** (2026-08-03): first focus "Version number"; Esc returns; Tab trap; `version-init-keyboard.spec` green
- ✅ **Duplicate overlay keyboard** (2026-08-03): first focus "Project name"; Esc returns; Tab trap; `project-copy-keyboard.spec` green
- ✅ **Data source settings overlay keyboard** (2026-08-03): first focus "Add data source"; Esc returns "Project menu"; Tab trap; `database-setup-keyboard.spec` green
- ✅ **Default items settings overlay keyboard** (2026-08-03): first focus "Default fields" Tab; Esc returns "Project menu"; Tab trap; `default-setup-keyboard.spec` green
- ✅ **Data source reverse parse overlay keyboard** (2026-08-03): first focus "Data source" Select; Esc returns "Project menu"; Tab trap; `reverse-database-keyboard.spec` green
- ✅ **Export DDL overlay keyboard** (2026-08-03): first focus "Data source" Select; Esc returns "Project menu"; Tab trap; `export-ddl-keyboard.spec` green
- ✅ **Parse ERD file overlay keyboard** (2026-08-03): first focus upload area "Select ERD file"; Esc returns "Project menu"; Tab trap; `reverse-erd-keyboard.spec` green
- ✅ **Parse PdMan file overlay keyboard** (2026-08-03): first focus upload area "Select PdMan file"; Esc returns "Project menu"; Tab trap; `reverse-pdman-keyboard.spec` green
- ✅ **Change password overlay keyboard** (2026-08-03): first focus "Password"; Esc returns trigger; Tab trap; `reset-password-keyboard.spec` green
- ✅ **Submit SQL approval overlay keyboard** (2026-08-03): first focus "Approver"; Esc returns trigger (parent detail still open); Tab trap; `sql-approval-keyboard.spec` green
- ✅ **Add member overlay keyboard** (2026-08-03): first focus "Select user"; Esc returns trigger; Tab trap; `add-user-keyboard.spec` green
- ✅ **Read-only share overlay keyboard** (2026-08-03): first focus "Share link"; Esc returns trigger; Tab trap; `share-project-keyboard.spec` green
- ✅ **EntityModal overlay keyboard** (2026-08-03): empty state "Add model" first focus "Name"; Esc returns trigger; Tab trap; `entity-modal-keyboard.spec` green
- ✅ **Canvas delete table confirm overlay keyboard** (2026-08-03): selected table Delete first focus "Delete"; Esc returns without delete; Tab trap; `canvas-delete-table-keyboard.spec` green
- ✅ **Canvas delete edge/frame confirm overlay keyboard** (2026-08-03): selected edge/frame Delete first focus "Delete"; Esc returns without delete; Tab trap; `canvas-delete-edge-frame-keyboard.spec` green
- ✅ **Canvas delete field confirm overlay keyboard** (2026-08-03): field browser × first focus "Delete"; Esc returns without delete; Tab trap; `canvas-delete-field-keyboard.spec` green
- ✅ **Table design delete index confirm overlay keyboard** (2026-08-03): index tab "Delete index" first focus "Delete"; Esc returns without delete; Tab trap; `table-index-delete-keyboard.spec` green
- ✅ **JExcel toolbar delete row confirm overlay keyboard** (2026-08-03): "Delete selected rows" first focus "Delete"; Esc returns without delete; Tab trap; `jexcel-toolbar-delete-keyboard.spec` green
- ✅ **Left tree delete model/table/relation diagram confirm overlay keyboard** (2026-08-03): shared `confirmDestructive`; first focus "Delete"; Esc returns without delete; Tab trap; `tree-delete-keyboard.spec` green
- ✅ **Data source settings delete confirm overlay keyboard** (2026-08-03): `Popconfirm`→`confirmDestructive`; first focus "Delete"; Esc returns without delete; Tab trap; `database-setup-delete-keyboard.spec` green
- ✅ **Workspace databaseConfig delete/batch delete confirm overlay keyboard** (2026-08-03): `confirmDestructive`; first focus "Delete"; Esc returns without delete; Tab trap; `database-config-delete-keyboard.spec` green
- ✅ **Read-only share revoke confirm overlay keyboard** (2026-08-03): `confirmDestructive`; first focus "Revoke"; Esc returns without revoke; outer share window still open; Tab trap; `share-revoke-keyboard.spec` green
- ✅ **Team project delete confirm overlay keyboard** (2026-08-03): `RemoveGroupProject` Popconfirm→`confirmDestructive`; first focus "Delete"; Esc returns without delete; Tab trap; `group-project-delete-keyboard.spec` green
- ✅ **Team member remove confirm overlay keyboard** (2026-08-03): `GroupUser` Popconfirm→`confirmDestructive`; first focus "Remove"; Esc returns without remove; Tab trap; `group-user-remove-keyboard.spec` green
- ✅ **Approval action confirm overlay keyboard** (2026-08-03): Pass/Refuse/Cancel/Repeat Popconfirm→`confirmDestructive`; first focus semantic OK; Esc returns without persist; Tab trap; dead code `CopyVersion` removed; `approval-action-keyboard.spec` green
- ✅ **Bare Modal.confirm → confirmDestructive zero-out** (2026-08-03): version rebuild baseline/sync×2, reverse overwrite, canvas delete table·edge·frame·field, edge chip, JExcel delete row, table index delete; rebuild confirm first focus "Rebuild" + Esc returns rebuild button; `version-rebuild-confirm-keyboard.spec` green
- ✅ **Cmd+K command palette keyboard polish** (2026-08-03): aria-modal + combobox/`aria-activedescendant`; ↑↓ scroll selection; no match "No results" layered empty state; Esc returns trigger; Tab trapped in search; `relation.spec` "command palette" green
- ✅ **Tab header density re-compress** (2026-08-03): CommonTabs `--erd-tabs-h` 24 + table design tab header ~24; no clip labels/close buttons; focus-visible; `model-design-ux` "table design three tabs" green; next cut → ~~left tree toolbar tighten / chrome secondary density~~✅
- ✅ **Left tree toolbar/secondary density** (2026-08-03): `QueryTree` toolbar controls 24 + pad 4; sider-inner secondary density; forbid clip icons; focus-visible; `model-design-ux` "model tree" green; next cut → ~~version list second pass / chrome stray colors~~✅
- ✅ **Version list second density / chrome stray colors** (2026-08-03): toolbar controls 24; token colors; forbid clip; focus-visible; `version.spec` "version list row density" green; next cut → ~~version work order/approval list density~~✅
- ✅ **Version work order/approval list density** (2026-08-03): `.approval-workorder-page` title bar ~24 + row pad 4×8; forbid clip; focus-visible; `approval.spec` "work order/approval list row density" green; next cut → ~~designer secondary pane table density / chrome~~✅
- ✅ **Designer secondary pane table density / chrome** (2026-08-03): JExcel toolbar ~24 + header/row pad 4×8 (over datatables); version diff entity row token colors; forbid clip; `model-design-ux` "table design JExcel row density" + `version.spec` diff green; next cut → ~~metadata app sub-tabs / CodeTab chrome~~✅
- ✅ **Metadata app sub-tabs / CodeTab chrome** (2026-08-03): CodeTab/DbTab tab bar ~24; forbid clip; focus-visible + Cmd+1/2/3; `model-design-ux` "metadata app sub-tabs" green; next cut → ~~table design inner tabs (fields/index) explicit ~24~~✅
- ✅ **Table design inner tab bar density** (2026-08-03): `#tableNav` `--erd-inner-tabs-h` 24; forbid clip; focus-visible + Cmd+1/2/3; `model-design-ux` "table design inner tabs" green; next cut → ~~context menu density~~✅
- ✅ **Context/tree action menu density** (2026-08-03): shared `.erd-dense-menu` (tree actions / tab context / new / project menu); items ~28; forbid clip; menuitem keyboard; `model-design-ux` "context/tree action menu density" green; next cut → ~~empty table design guidance~~✅
- ✅ **Empty table design / empty table fields guidance** (2026-08-03): fields tab Empty "Add first field"; canvas `canvas-fields-empty` brand CTA; `table-field-empty` green; next cut → ~~tab body content secondary density~~✅
- ✅ **Table design tab body content secondary density** (2026-08-03): tab body pad 6/4 + hint/empty/metadata tip ~24; workspace gutter 6; forbid clip JExcel; `model-design-ux` "table design tab body content secondary density" green; next cut → ~~designer Empty giant marginTop / secondary loose gutter~~✅
- ✅ **Designer empty state secondary density** (2026-08-03): fallback forbid marginTop:100; fields/index Empty compress marginXL + pad flush tab-body; retain CTA; `model-design-ux` "designer empty state secondary density" green; next cut → ~~welcome empty `.erd-welcome-empty` inner pad 32~~✅
- ✅ **Welcome empty state secondary density** (2026-08-03): `.erd-welcome-empty__inner` pad 32×24 (later tighter 20×16); title 20/mt14→18/mt12·lh22; hero 176; retain reverse link + left tree add model; `model-design-ux` "welcome empty state secondary density" green; next cut → ~~AuthBrandShell invalid/login gate secondary density~~✅
- ✅ **AuthBrandShell secondary density** (2026-08-03): brand 32×28/gap14 + form pad32 + header mb16 (later tighter brand/form 20×16 + gap12 + header mb12 + form body 12/28); login/register/invalid/404·403 same source; forbid weaken brand type size/Skip·Tab; `smoke`+`share`+`session` densify green; next cut → ~~LandingChrome / compare secondary density~~✅
- ✅ **LandingChrome / `/compare` secondary density** (2026-08-03): secondary section 2.75 / comparison row 0.5 / nav·footer tighten; compare hero padT 1.5; hero brand-level + full-bleed unchanged; `landing`+`compare` densify green; next cut → ~~share success state meta/table list secondary density~~✅
- ✅ **Share success state meta / table list secondary density** (2026-08-03): stage 6×10 + meta gap2 / hint 12·16; table list pad 6×10·title 12; overlay `.erd-io-modal`; keyboard/revoke not weakened; `demo`+`share-project-keyboard` densify green; next cut → ~~Home hero CTA cluster secondary density~~✅
- ✅ **Home hero CTA cluster secondary density** (2026-08-03): hero gap24/mb·pb16; actions gap8; secondary 4×10; primary CTA large + Skip/Tab not weakened; `home-keyboard` densify green; next cut → ~~Home empty state/announcement area secondary density~~✅
- ✅ **Home empty state/announcement secondary density** (2026-08-03): empty state pad 24×12; secondary entry mb16; project area mb20; announcement pt4 / row pad4·gap10 / title 13; retain empty state CTA; `home-keyboard` empty/announce densify green; next cut → ~~designer secondary pane fragment density~~✅
- ✅ **Designer secondary pane fragment density** (2026-08-03): `.erd-secondary-pane` reverse/ERD·PdMan/advanced DDL; `ReverseTable` meta; `SyncConfig`→io-modal; settings hint mb8; `designer-secondary-pane` densify green; next cut → ~~import overlay Steps alignment~~✅
- ✅ **Import overlay Steps alignment** (2026-08-03): `.erd-io-modal__steps` mt/mb ≤10/12 · title 12; same tier as secondary pane; `reverse-database-keyboard`+`export-ddl-keyboard` densify green; next cut → ~~command palette empty pad densify~~✅
- ✅ **Cmd+K no-match empty state / list gutter secondary density** (2026-08-03): empty pad ≤8×8 / gap ≤2, list pad ≤2; forbid 16×12 / 4; Trap / aria-activedescendant / Esc return not weakened; `relation.spec` "command palette" green; next cut → ~~shortcut cheat sheet card density~~✅
- ✅ **Shortcut cheat sheet (`?`) density** (2026-08-03): header 6×10 · list 2×4 · row 3×4/gap8 · footer 4×8 · maxH 360; close button focus-visible; forbid 6×8 gutter + padY 10; Esc / Cmd+K mutual exclusion not weakened; `relation.spec` "shortcut cheat sheet" green; next cut → ~~modeling silent failure / unclear CTA~~✅ (autosave failure retryable → reverse parse failure readable+retry)
- ✅ **Reverse parse failure readable + retry** (2026-08-03): forbid toast `[object Object]`; failure area details + "Re-parse"; `reverse-parse-failure` green; next cut → ~~add member invite failure silent close~~✅
- ✅ **Add member invite failure no close** (2026-08-03): non-200 no close; `request` toast no stack on modal; `add-user-invite-failure` green; next cut → ~~dbsync / version save edge silent failure~~✅
- ✅ **Version save/rebuild failure no fake success** (2026-08-03): `initSave` only code===200; InitVersion failure no close; dbsync clear syncing dead state; `version-save-failure` green; next cut → ~~read-only share create failure dead affordance~~✅
- ✅ **Read-only share create failure retryable** (2026-08-03): failure no stack; primary button "Regenerate"; forbid disabled dead affordance; `share-create-failure` green; next cut → ~~change password failure silent close~~✅
- ✅ **Change password failure no close** (2026-08-03): only `code===200` closes; failure toast + retryable; keyboard loop retained; `reset-password-failure` green; next cut → ~~SyncConfig fake success~~✅
- ✅ **Sync config failure no close** (2026-08-03): `setUpgradeType` only writes store on `saveProject` code===200; failure toast + retryable; `sync-config-failure` green; next cut → ~~DefaultSetUp fake success~~✅
- ✅ **Default items settings failure no close** (2026-08-03): `updateProfile` only writes store on `saveProject` code===200; failure toast + retryable; keyboard loop retained; `default-setup-failure` green; next cut → ~~data source settings OK fake success~~✅
- ✅ **Data source settings OK failure no close** (2026-08-03): `updateDbs` returns boolean; OK flush only success toast/close; forbid unconditional "Saved successfully"; `database-setup-failure` green; next cut → ~~EntityModal/module tree local success vs autosave~~✅
- ✅ **EntityModal persist failure no close** (2026-08-03): `addModule` etc. `persist:true` `saveProject` first then write store; only code===200 toast/close; `entity-modal-failure` green; keyboard loop retained; next cut → ~~canvas createDiagram same shape~~✅
- ✅ **Canvas relation diagram overlay persist failure no close** (2026-08-03): `ReactFlowRelation` diagram Modal `persist:true`; only code===200 closes; `diagram-modal-failure` green; next cut → ~~canvas table header rename fake success~~✅
- ✅ **Canvas table header rename persist failure no exit edit** (2026-08-03): `renameEntity` `persist:true`; only code===200 exits edit; `table-rename-failure` green; next cut → ~~canvas create table/field inline fake success~~✅
- ✅ **Canvas create table/inline add field persist failure retryable** (2026-08-03): `addEntity`/`updateEntityFields` `persist:true`; only code===200 adds to canvas/exits new edit; failure toast + retryable; empty name toast / empty field CTA retained; `canvas-create-field-failure` green; next cut → ~~field rename/delete field fake success~~✅
- ✅ **Canvas field rename/delete field persist failure retryable** (2026-08-03): existing field `commit`/`removeField` `persist:true`; only code===200 exits edit/removes row; delete field confirmation retained, failure window stays open; `canvas-field-rename-delete-failure` green; next cut → ~~field meta (type/PK/hidden) instant fake success~~✅
- ✅ **Canvas field meta persist failure retryable** (2026-08-03): type/PK/NN/AI/hidden/browse PK `persist:true`; failure draft rollback or row remains; `canvas-field-meta-failure` green; next cut → ~~table design JExcel field meta fake success~~✅
- ✅ **Table design JExcel field meta persist failure retryable** (2026-08-03): `TableInfoEdit` `persist:true`; failure re-mount grid rollback; `jexcel-field-meta-failure` green; next cut → ~~table design index tab fake success~~✅
- ✅ **Table design index tab persist failure retryable** (2026-08-03): `updateEntityIndex`/`TableIndexEdit` `persist:true`; failure empty state/re-mount rollback; `jexcel-index-failure` green; next cut → ~~default field fake success~~✅
- ✅ **Default field persist failure retryable** (2026-08-03): `updateDefaultFields`/`DefaultField` `persist:true`; failure re-mount rollback; dead code `moveField` removed; `default-field-failure` green; next cut → ~~workspace shell outer gutter densify~~✅
- ✅ **Workspace shell (Home/Group) outer gutter secondary density** (2026-08-03): shell/content 12×16, body 12×16, list empty state 12×8; forbid 24/20 double-loose gutter; `layout-outlet` densify green; next cut → ~~account BaseView gap~~✅
- ✅ **Account BaseView left-right column secondary density** (2026-08-03): gap 24→16 (narrow 12); forbid 24; `account-settings` densify green; next cut → ~~header `erd-chrome-actions` gap16~~✅
- ✅ **Header `erd-chrome-actions` secondary density** (2026-08-03): gap 16→12 (Design still 8); `data-testid`; `layout-outlet` densify green; next cut → ~~header pad20 / brand–nav gap16~~✅
- ✅ **Header `erd-chrome-header` secondary density** (2026-08-03): padX 20→16 + brand–nav gap 16→12; Home/Group override aligned; Design still gap8; `data-testid`; `layout-outlet` densify green; next cut → ~~Home horizontal nav Menu item horizontal loose spacing~~✅
- ✅ **Home horizontal nav Menu item secondary density** (2026-08-03): padX 16→12 (8–12 family); item height 64 / hit width ≥44; `testid=home-layout-menu`; `layout-outlet` densify green; next cut → ~~Group sidebar nav row spacing~~✅
- ✅ **Group sidebar nav row spacing secondary density** (2026-08-03): item height 40→28 / padX 24·16→12 / marginY 4→2 / type 12; `testid=group-layout-sider-menu`; `layout-outlet` densify + `group-keyboard` green; next cut → ~~project list toolbar fragment spacing~~✅
- ✅ **Project list toolbar fragment spacing** (2026-08-03): Search height 32→28 + Space `size={8}` + button padX 8; toolbar height ≤32; `testid=project-list-toolbar`; `project-surface` densify + `project-list-keyboard` green; next cut → ~~team member toolbar fragment spacing~~✅
- ✅ **Team member toolbar fragment spacing** (2026-08-03): `GroupUser` mb16→8 + Search 32→28 + Space gap8 + button padX8; `testid=group-user-toolbar`; `group-layout-nav` densify + `group-keyboard` / `add-user-keyboard` green; next cut → ~~Group user group Title/tab fragment spacing~~✅
- ✅ **Group user group Title/left role tab fragment spacing** (2026-08-03): title 20→13/22·mb8; removed Space large + br; left tab padX24→12·height38→28·type12; `testid=group-setting-page`; `group-layout-nav` densify + `group-keyboard` / `add-user-keyboard` green; next cut → ~~Group basic settings Title level4~~✅
- ✅ **Group basic settings page header fragment spacing** (2026-08-03): title 20→13/22·mt0·mb8; same file "Delete project" same tier; `testid=basic-setting-page`; `group-basic-setting` densify + `group-layout-nav` / `group-keyboard` green; next cut → ~~Group basic settings Form item spacing/controls 28~~✅
- ✅ **Group basic settings Form fragment spacing** (2026-08-03): item mb24→12 / Input·Select·button 32→28 / label 12; aligned `.setting-common-form`; `group-basic-setting` densify + `group-layout-nav` / `group-keyboard` green; next cut → ~~Group basic settings delete zone fragments (Divider/Space/secondary text)~~✅
- ✅ **Group basic settings delete zone fragments** (2026-08-03): Divider 24→12 + removed Space stacked title mb + secondary text 14→12/18; `testid=basic-setting-delete-zone`; `group-basic-setting` densify + `group-project-delete-keyboard` green; next cut → ~~welcome empty state title 20/mt14 fragment spacing~~✅
- ✅ **Welcome empty state title fragment spacing** (2026-08-03): title 20/mt14·lh≈26 → 18/mt12·lh22 (flush 8–12 / page-title 13/22); pad/hero unchanged; `model-design-ux` densify green; next cut → ~~welcome empty state inner gutter pad32~~✅
- ✅ **Welcome empty state inner gutter fragment spacing** (2026-08-03): `.erd-welcome-empty__inner` pad 32×24 → 20×16 (flush shell 8–12 / content 12×16); title/hero unchanged; `testid=designer-welcome-empty-inner`; `model-design-ux` densify green; next cut → ~~AuthBrandShell brand/form pad32 second pass (align 20 gutter)~~✅
- ✅ **AuthBrandShell brand/form gutter fragment spacing second pass** (2026-08-03): brand/form pad 32→20×16; gap14/header/type size/~40% unchanged; `testid=auth-form-panel`; `smoke`+`share`+`session` densify + login shell keyboard green; next cut → ~~AuthBrandShell header mb16 / brand gap14 third pass~~✅
- ✅ **AuthBrandShell header/brand gap third pass** (2026-08-03): header mb16→12 + brand gap14→12; pad 20×16 / type size / color hierarchy unchanged; `testid=auth-form-header`; `smoke`+`session` keyboard densify + `share` green; next cut → ~~AuthBrandShell form Title mt10 / Form item antd default mb~~✅
- ✅ **AuthBrandShell form body fragment spacing** (2026-08-03): Title mt10→6 + item mb24→12 / Input·button large→28 / label 12; aligned `.setting-common-form`; `testid=auth-shell-form`; `smoke`+`session` densify green; next cut → ~~designer sidebar nav row spacing~~✅ (skip Auth logo 48)
- ✅ **Designer sidebar nav row spacing secondary density** (2026-08-03): `.design-layout__sider-menu` item height 40→28 / padX→12 / marginY→2 / type 12 (same tier as Group sidebar); version/import/export/settings same source; `testid=design-layout-sider-menu`; `layout-outlet` densify + sidebar keyboard; next cut → ~~version empty state pad 16×12~~✅
- ✅ **Version list empty state gutter secondary density** (2026-08-03): `.version-page__list .ant-list-empty-text` pad 16×12→12×8 (aligned workspace list empty state); retain "Save first version"; `version.spec` empty state densify green; next cut → ~~Cmd+K footer~~✅
- ✅ **Cmd+K footer secondary density** (2026-08-03): `.erd-cmd-footer` pad 6×10→4×8 (aligned `?` cheat sheet footer); type 10 / lh 1.3; `relation.spec` "command palette" lock padY≤8 / padX≤8; Trap / aria / Esc not weakened; next cut → ~~notice-row gap12~~✅
- ✅ **Announcement notice-row gap secondary density** (2026-08-03): `.project-list-page__notice-row` gap 12→8 (8–12 family); row pad / toolbar unchanged; `testid=project-notice-row`; `project-notice` densify green; next cut → ~~canvas empty state CTA pad~~✅
- ✅ **Canvas empty state CTA pad secondary density** (2026-08-03): `.erd-empty-cta` pad 14×18×12→10×12 (8–12 family); primary CTA hit ≥26; Auth logo / welcome pad unchanged; `testid=canvas-empty-state`; `relation` densify green; next cut → ~~`.erd-empty-panel` top spacing~~✅
- ✅ **Canvas empty state panel top spacing secondary density** (2026-08-03): `.erd-empty-panel` `min(10vh, 88)`→`min(8vh, 64)`; retain presence; do not adjust CTA pad again; Auth logo / welcome pad skip; `testid=canvas-empty-panel`; `relation` densify green; next cut → ~~empty state vertical rhythm (title mt / desc mb)~~✅
- ✅ **Canvas empty state vertical rhythm lock density** (2026-08-03): measured title mt8 / desc mb12 already flush ADR-0016; E2E lock forbid revert 16/18; Auth logo / welcome pad / CTA pad / panel top spacing skip; `relation` densify green; next cut → ~~Controls secondary density or `.erd-empty-links` mt10~~✅
- ✅ **Canvas empty state secondary link mt10 lock density** (2026-08-03): measured Controls 22/pad0 already dense → lock `.erd-empty-links` mt10; `testid=canvas-empty-links`; Auth logo / welcome / CTA / panel / title·desc skip; `relation` empty state+Controls green; next cut → ~~table design tab header / CommonTabs fragment spacing~~✅
- ✅ **Table design tab header / inner tab gutter fragment spacing** (2026-08-03): measured CommonTabs 24 already dense; tab header pad 2×10/gap6→2×8/gap4; inner tab marginR 8→2 (aligned sub-tabs); `testid=table-design-header`/`table-design-tabs`/`common-tabs`; Auth logo / welcome / empty panel skip; `model-design-ux` three tabs+inner tabs green; next cut → ~~canvas table node chrome~~✅
- ✅ **Table node footer / empty table gutter chrome fragment spacing** (2026-08-03): measured header pad6 / field minH20 already at dense table floor; compress empty table gutter pad10→6 + footer margin8→6 + hit minH22/26; `NODE_FOOTER_H` 32→28; header/field row/persist unchanged; `relation`+`table-field-empty` densify green; next cut → ~~left tree context menu border-box actual density~~✅
- ✅ **Left tree/context menu border-box actual density** (2026-08-03): measured item CSS height28 but antd dropdown `content-box`+padY5 → hit ~33; compress `box-sizing:border-box` + padY0; hit≈28; version toolbar already 24 skip; Auth/welcome/Controls/approval/export skip; `model-design-ux` densify green; next cut → ~~canvas MiniMap chrome~~✅
- ✅ **MiniMap chrome margin fragment spacing** (2026-08-03): measured 128×96 / pad0 / sunk already dense; RF panel margin **15** loose → **8**; overview size unchanged; Controls/version toolbar/Auth/welcome skip; `relation`+`demo` densify green; next cut → ~~edge label avoidance~~ measured already dense / ~~import overlay body~~✅
- ✅ **Import overlay body fragment spacing** (2026-08-03): measured edge label pad[4,2]/gap4/12px already at readable floor; `.erd-io-modal` body **12×14**→**8×12**; export same source; `dbml-import`+`dbml-export` densify green; next cut → ~~EntityModal body~~✅
- ✅ **EntityModal body fragment spacing** (2026-08-03): `.erd-entity-modal` body **12×14**→**8×12** (aligned io / secondary pane); `relation` densify green; next cut → ~~io-modal header·footer~~✅
- ✅ **io-modal / EntityModal header-footer fragment spacing** (2026-08-03): both families header **10×14×8**→**8×12**, footer **8×14**→**8×12**, close top **10**→**8**; title 13/22 · OK≥28 unchanged; `relation`+`dbml-import`+`dbml-export` densify green; next cut → ~~cardinality Select / Form mb~~ measured already dense / ~~Controls·toolbar panel margin~~✅
- ✅ **Controls / toolbar Panel margin fragment spacing** (2026-08-03): measured cardinality Select **24** / Form mb12·controls28 already dense; Controls+header toolbar RF margin **15**→**8** (aligned MiniMap); `relation`+`demo` densify green; next cut → ~~empty state silhouette compact 132~~✅ (skip Auth logo 48 / welcome pad)
- ✅ **Empty state silhouette compact fragment spacing** (2026-08-03): `ErdEmptyDiagram` compact **132**→**112**; hero 176 / Auth logo / welcome pad / Controls·toolbar margin / edge labels / MiniMap size / version toolbar / overlay header-body-footer skip; `relation` "empty state composition" densify green; next cut → ~~canvas/left tree delete table fake success~~✅ (skip Auth logo 48)
- ✅ **Canvas/left tree delete table persist failure retryable** (2026-08-03): `removeEntity` `persist:true`; only save code===200 removes + "Table deleted successfully"; failure node retained, confirm reject close retryable; `canvas-delete-table-failure` green; next cut → ~~left tree delete model·delete relation diagram~~✅
- ✅ **Left tree delete model/relation diagram persist failure retryable** (2026-08-03): `removeModule`/`removeDiagram` `persist:true`; only save code===200 removes + success toast; failure tree retained, confirm reject close retryable; `tree-delete-module-diagram-failure` green; next cut → ~~canvas delete edge·Frame~~✅
- ✅ **Canvas delete edge/delete frame persist failure retryable** (2026-08-03): `removeAssociation`/`removeFrame` `persist:true`; only save code===200 removes + success toast; failure edge/frame retained, confirm reject close retryable; `canvas-delete-edge-frame-failure` green; next cut → ~~clipboard paste fake success~~✅
- ✅ **Left tree cut/paste persist failure retryable** (2026-08-03): `cutEntity`/`pastEntity`/`cutModule`/`pastModule` `persist:true`; only save code===200 writes clipboard and remove/write + success toast; failure retains prior state; copy local clipboard only; `tree-cut-paste-failure` green; next cut → ~~rename model/relation diagram~~ already clean → ~~drag persist fake success~~✅
- ✅ **Canvas drag table coordinates persist failure rollback** (2026-08-03): `commitDiagramGeometry` `persist:true`; only save code===200 writes layout/Frame bounds; failure toast + RF rollback; `canvas-drag-reposition-failure` green; next cut → ~~align·auto layout~~✅
- ✅ **Canvas align/auto layout persist failure rollback** (2026-08-03): `alignSelected`/`autoLayout`→`commitDiagramGeometry` `persist:true`; failure toast + RF rollback; fitView only on success; `canvas-align-layout-failure` green; next cut → ~~Frame rename / Frame bounds (fit members·scale) fake success~~✅
- ✅ **Frame rename/bounds persist failure rollback** (2026-08-03): `renameFrame` persist + scale/fit members/`expandFrameForMembers`→`commitDiagramGeometry`; failure toast + draft/RF rollback; "Members fitted" only on success; `canvas-frame-rename-bounds-failure` green; next cut → ~~Frame create·member add/remove fake success~~✅
- ✅ **Frame create/member add-remove persist failure rollback** (2026-08-03): `createFrame`/`addFrameMembers`/`removeFrameMembers` `persist:true`; failure toast, no add to canvas/members unchanged; join Modal reject close; `canvas-frame-members-failure` green; next cut → ~~`addAssociation` connect edge fake success~~✅
- ✅ **Canvas connect edge create association persist failure retryable** (2026-08-03): `addAssociation` `persist:true`; failure toast, no edge; can drag retry; `canvas-connect-edge-failure` green; next cut → ~~`updateAssociationRelation` cardinality change fake success~~✅
- ✅ **Canvas change edge cardinality persist failure retryable** (2026-08-03): `updateAssociationRelation` `persist:true`; failure toast, chip keeps original cardinality; can re-select retry; `canvas-cardinality-failure` green; next cut → ~~data type dictionary CRUD fake success~~✅
- ✅ **Data type dictionary persist failure retryable** (2026-08-03): `addDatatype`/`updateDatatype`/`removeDatatype` `persist:true`; settings page `/setting/dataType`; failure toast, window kept; `datatype-domains-failure` green; next cut → ~~reverse import `setProjectJson`/`importReverseTable` fake success~~✅
- ✅ **Reverse import persist failure retryable** (2026-08-03): `setProjectJson`/`importReverseTable`/`importModuleAndProfile` persist; only save code===200 writes store + success toast; failure toast, no store write; `import-erd-failure` green; next cut → ~~default DB switch / WORD template fake success~~✅
- ✅ **Default data source / WORD template persist failure retryable** (2026-08-03): `setDefaultDb`/`updateWordTemplateConfig` only save code===200 writes store; failure toast+Radio rollback; removed dead code `databaseDomainsSlice` zero-mount CRUD; `default-db-failure` green; next cut → ~~version revert fake success~~✅
- ✅ **Version revert persist failure retryable** (2026-08-03): scanned remaining fake success — dbsync/Word export already closed; `revertVersionData` only save code===200 writes store + success toast; failure no store write, confirm window no close; `version-revert-failure` green; next cut → ~~`downloadWordTemplate` JSON/empty blob fake download~~✅
- ✅ **WORD template download fake file rejected** (2026-08-03): `downloadWordTemplate` rejects empty/JSON/non-ZIP blob, failure toast, no `saveByBlob`; `word-template-download-failure` green; next cut → ~~Word `gendocx` fake download~~✅
- ✅ **Word gendocx export fake file rejected** (2026-08-03): `exportFile('Word')` reuses `docxBlobGate`; empty/JSON/non-ZIP toast, no save; `word-gendocx-download-failure` green; next cut → ~~scan remaining fake success～canvas relation diagram overlay keyboard~~✅
- ✅ **Canvas relation diagram overlay keyboard loop closed** (2026-08-03): fake success high ROI exhausted; create/rename relation diagram + join frame Modal first focus/Esc/Tab trap; `diagram-modal-keyboard` green; next cut → ~~data type dictionary Modal `focusTriggerAfterClose`~~✅
- ✅ **Data type dictionary overlay keyboard loop closed** (2026-08-03): `DataTypeDomains` `keyboard` + `focusTriggerAfterClose` + first focus "Type name"; `datatype-domains-keyboard` green; next cut → ~~designer shell Skip/table design tab header keyboard~~✅
- ✅ **CommonTabs tab header keyboard loop closed** (2026-08-03): close button "Close `{table name}`" + close tab focus return; `common-tabs-keyboard` green; scan remaining overlays: main Modal loop closed, remaining `Modal.info` SQL detail / `Modal.warning` import validation / databaseConfig Drawer; next cut → ~~SQL detail focus return~~✅
- ✅ **Approval/work order SQL detail keyboard loop closed** (2026-08-03): `showSqlDetailModal` first focus "Got it" + Esc/OK returns "View SQL" + Tab trap; `sql-detail-keyboard` green; next cut → ~~`Modal.warning` import validation~~✅
- ✅ **Import skip validation keyboard loop closed** (2026-08-03): `showImportSkipWarning` first focus "Got it" + Esc/OK returns "Parse and import" + Tab trap; DBML/ERD/PdMan (dialog+secondary pane) shared; `import-skip-warning-keyboard` green; next cut → ~~`databaseConfig` Drawer~~✅
- ✅ **Workspace databaseConfig Drawer keyboard loop closed** (2026-08-03): `keyboard` + open first focus "Connection name" + Esc + `afterOpenChange` returns trigger (Drawer has no `focusTriggerAfterClose`) + Tab trap; `database-config-drawer-keyboard` green; next cut → ~~JExcel Escape backspace + shortcut action Modal~~✅
- ✅ **JExcel Escape backspace / shortcut action keyboard** (2026-08-03): edit mode Esc discard→focus back `jexcel-grid`; toolbar `role=toolbar`; shortcut action `Modal.info` first focus "Got it" + Esc return + Tab trap; `jexcel-grid-keyboard` green; next cut → ~~version sync result Modal keyboard~~✅
- ✅ **Version sync result overlay keyboard** (2026-08-03): `SyncVersion` row binding fix + `showSyncResultModal` success/failure first focus "Got it" + Esc returns "Sync" + Tab trap; `version-sync-result-keyboard` green
- ✅ **Oracle reverse comment fidelity** (2026-08-03): `ALL_TAB_COMMENTS`/`ALL_COL_COMMENTS` → chnname; `OracleReverseDialectCommentTest`; next cut → ~~MySQL trigger reverse~~✅
- ✅ **MySQL trigger reverse fidelity** (2026-08-03): `INFORMATION_SCHEMA.TRIGGERS` → `entity.triggers[]` (name/timing/event/ddl); `MysqlReverseDialectTriggerTest`; next cut → ~~PG trigger~~✅
- ✅ **PostgreSQL trigger reverse fidelity** (2026-08-03): `information_schema.triggers` → `entity.triggers[]`; `PostgresqlReverseDialectTriggerTest`; next cut → ~~SQL Server trigger~~✅
- ✅ **SQL Server trigger reverse fidelity** (2026-08-03): `sys.triggers`/`sys.trigger_events`+`OBJECT_DEFINITION` → `entity.triggers[]`; `SqlServerReverseDialectTriggerTest`; next cut → ~~Oracle trigger~~✅
- ✅ **Oracle trigger reverse fidelity** (2026-08-03): `ALL_TRIGGERS`+`ALL_SOURCE` → `entity.triggers[]`; `OracleReverseDialectTriggerTest`; P0 four-DB trigger loop closed; next cut → ~~FK constraint metadata~~✅
- ✅ **FK constraint name + ON DELETE/UPDATE** (2026-08-03): `constraintName`/`deleteRule`/`updateRule` additive fields; four-DB dictionary + JDBC; composite split-edge same name (ADR-0011 `fields[]` still deferred); edge chip `title`/`aria-label` + `erd-edge-fk-meta`; next cut → ~~table list pagination~~✅ / DBML trigger (no home in metrics → doc deferred)
- ✅ **Share table list pagination** (2026-08-03): read-only footer table list default `pageSize=5` + SizeChanger; demo 8 tables paginated; `data-format` registers DBML Trigger gap (`@dbml/core` no block, `Note` forbid stuffing); next cut → ~~trigger UI~~✅ / DBML enum / ADR-0013 (manual) / P4 demo
- ✅ **Table design trigger tab** (2026-08-03): `entity.triggers[]` list + view DDL + add/delete; `updateEntityTriggers` persist-on-200; `Cmd/Ctrl+4`; `table-triggers.spec`; next cut → ~~DBML enum~~✅ / ADR-0013 (manual) / P4 demo
- ✅ **DBML Enum interoperability** (2026-08-03): `Enum`↔`dataTypeDomains.datatype` (`kind:enum`/`values[]`) + column `type=code`; import/export round-trip; `enum.dbml` + `yarn test:unit:dbml` + `dbml-export` Enum E2E; next cut → ~~expression index~~✅
- ✅ **DBML expression index** (2026-08-03): expression↔`indexs[].fields[]` raw string (no schema addition); mixed column export `` `expr` ``; `expression-index.dbml` + unit + `dbml-export` E2E; next cut → ~~reverse function index dictionary~~✅
- ✅ **Reverse expression/function index** (2026-08-03): PG `pg_get_indexdef` + MySQL 8 `STATISTICS.EXPRESSION` → `indexs[].fields[]`; mapper soft skip; unit mock JDBC; next cut → ~~index tab UI expression~~✅
- ✅ **Index tab field/expression editing** (2026-08-03): JExcel `fields` column text "Field/expression*"; semicolon mixed; persist-on-200; `index-expression-edit`; next cut → ~~Oracle·SQL Server function index~~✅
- ✅ **Reverse Oracle/SQL Server function·computed column index** (2026-08-03): `ALL_IND_EXPRESSIONS` / `sys.computed_columns.definition` → `fields[]`; P0 four-DB loop closed; next cut → ~~filtered index predicate~~✅
- ✅ **DDL/DBML `filter` writeback** (2026-08-03): PG/SQL Server `WHERE` + DBML `note: filter:`; next cut → ~~DDL `triggers[]`~~✅
- ✅ **DDL `triggers[]` writeback** (2026-08-03): `createTrigger` prefers `ddl`/dialect rebuild (four DBs); export overlay checkbox; `json2code.trigger.test.ts`; next cut → ~~data dictionary·enum domain UX~~✅
- ✅ **Data dictionary·enum domain UX** (2026-08-03): `/setting/dataType` kind logic|enum, `values[]` Form.List, list kind/value dense columns, empty state dual CTA; persist-on-200; `datatype-enum-ux`; next cut → ~~field type dropdown enum distinction~~✅
- ✅ **Field type dropdown enum distinction** (2026-08-03): canvas `<select>` optgroup "Logical types|Enums" + browse mode enum badge; table design/default field JExcel dropdown `group`; value writes `fields[].type=code`; `field-type-enum-picker`; next cut → ~~DB dialect apply visual editing~~✅
- ✅ **DB dialect apply visual editing** (2026-08-03): logical type Modal "DB dialect mapping" dense table edit `apply[code].type`; enum still `buildEnumApply`; persist-on-200; `datatype-apply-ux`; next cut → ~~edge ON DELETE/UPDATE editable~~✅
- ✅ **Canvas edge FK referential action editable** (2026-08-03): chip editor cardinality + ON DELETE/UPDATE; `updateAssociationFkMeta` persist-on-200; same `constraintName` split-edge sync; `canvas-fk-meta-edit`; next cut → ~~DDL FK writeback~~✅ / ADR-0013 (manual) / P4 demo / DBML Trigger (await official block)
- ✅ **DDL/DBML FK writeback** (2026-08-03): `createForeignKey` four DBs ALTER FOREIGN KEY + ON DELETE/UPDATE; DBML official Ref settings; next cut → ~~canvas footer open trigger tab~~✅ / ADR-0013 (manual) / P4 demo / DBML Trigger (await official block)
- ✅ **Canvas footer open trigger tab** (2026-08-03): table node "Triggers" `canvas-open-trigger` → `designPane:'trigger'` (symmetric with fields/index/metadata); forbid tab exists only via tab header/`Cmd+4`; `relation`+`table-triggers`; next cut → ~~trigger tab edit existing rows~~✅
- ✅ **Trigger tab edit existing rows** (2026-08-03): row "Edit" overlay; rebuild when structure changes but DDL unchanged; persist-on-200; failure retryable; `table-triggers`; next cut → ~~canvas edge constraint name editable~~✅
- ✅ **Canvas edge constraint name editable** (2026-08-03): FK editor +`constraintName`; same old name split-edge sync rename; persist-on-200; duplicate name blocked; `canvas-fk-meta-edit`; **auto Vision track paused** → Human next see [roadmap.md](./roadmap.md) "Vision auto track pause point"

## Reassessment Conclusions (2026-08-02 v2): Three Overturned Assumptions

Cross-checking vision (North Star = weekly active modeling projects with version saves), ADR-0012 (agent-readable source of truth = version + share + audit), and current backend controller / Flyway state, original W2–W5 ordering was based on three wrong assumptions:

1. **"Home density deserves its own wave" was wrong.** Home's job is 5-second routing back to modeling; North Star levers (example project straight to "Save first version", header "Save version" always visible, remote sync hint straight to version page) all ✅ as of 2026-08-02. Home's remaining issues are **dead code and duplicate stats** (`components/Radar/`, `_mock.ts`, unrendered `Pie` config, hero and "Project overview" card repeating same statistic group) — a **deletion** problem, not a density design problem. Decorative density polish contributes zero to North Star.
2. **"Raise water level page by page = port components page by page" was wrong.** Real gap is **capability exposure**: backend can do it but UI buries or lacks it (see next section). Most of original W3–W5 effort was user-invisible `ProList→List` / `ProForm→Form` ports.
3. **"Pro import zero-out is current highest-priority metric" was wrong.** ADR-0014 frozen Pro@2.8.10 and tolerates coexistence; dependency removal is cleanup hygiene, should not drive three waves. Peel Pro rides "capability exposure / shell removal" piggyback, final one-shot dependency removal (separate commit).

### Backend Ready, UI Buried or Missing (expose first, polish later)

| Capability | Backend evidence | UI current | Gap |
|---|---|---|---|
| Read-only share **revoke/manage** | `POST /share/revoke` (ProjectShareController); security-model explicit "create/revoke requires login and project creator" | Designer header "Share" overlay: create/copy/revoke ✅ (W2 slice 1) | ✅ |
| Cross-version diff **export** | Version diff visualization ✅ (CompareVersion); db_change.tag multi-tag ✅ (Flyway V1/V2) | CompareVersion "Export" Markdown/SQL ✅ (W3 slice 1) | ✅ |
| Data dictionary | `/dataDict` full CRUD (DataDictController) | Experimental page removed (W2); no UI this phase | **thin** — do not expand this phase, also do not polish for it |
| Approval flow | approval CRUD + SQL trust chain (SQL failure does not pass ✅) | Version row "Submit work order" + header/sidebar work order·approval direct ✅ (W3 slice 3) | ✅ |
| Version revert / tags / sync / reverse / Word export | RevertVersion, tag chips, dbsync/rebaseline, dbReverseParse, `/doc/gendocx` | All exposed ✅ | No gap, do not re-invest |

### Shell Inventory (delete before polish; forbid any UI polish before deletion)

- `pages/design/query`, `pages/dataQuery`: online SQL experimental pages → W2 ✅ deleted (including QueryLeftContent / dialog/query / useQueryStore)
- `pages/design/chatsql`: ADR-0012 no marketing wrapper → W2 ✅ deleted (`@chatui/core` removed)
- `pages/design/dataDomain`: experimental page deferred → W2 ✅ deleted
- `pages/design/test`, `pages/test`: demo/test residue → W2 ✅ deleted (`pages/JExcel` retained as table edit component)
- Home dead code: `components/Radar/`, `_mock.ts`, `service.ts`, `Pie` config, `@ant-design/charts`, duplicate "Project overview", slogan rotation → W2 ✅ deleted
- `account/settings/geographic` (province/city json) and fields with no backend → W2 ✅ deleted

## Waves (Auto executes wave by wave)

Each wave independently revertible; close with `yarn build` + affected E2E + UX walkthrough screenshots + update CHANGELOG "verification points".

| Wave | Scope | Peel Pro | Verification |
|---|---|---|---|
| **W1** Designer shell ✅ | DesignLayout peel ProLayout → antd Layout (2026-08-02 ✅) | ProLayout/PageContainer/ProCard/WaterMark ✅ | `layout-outlet.spec` + smoke "login→create→designer" |
| **W2** Capability exposure + shell removal (redefined, replaces old "Home density") | ① Share management: header "Share" → overlay (create/copy/**revoke** wired `/share/revoke`/view current link); ② Remove shells: query/dataQuery/chatsql/dataDomain hide or delete, JExcel/test pages, home Radar/_mock/Pie dead code, settings geographic delete; ③ Home **delete only**: duplicate stat cards, slogan rotation, dead imports; ④ Designer chrome cleanup: remove `bgLayoutImgList`/sider footer, sider 320, tabs 40px, canvas flex, panel header "+ New" exposed | Pro usage from deleted pages/components cleared together | Share "create→copy→revoke→link invalid 403" E2E; shell routes 404/unreachable assert; `home-link-*` no regression; create table journey smoke no regression; remove `@ant-design/charts` from deps if zero remaining refs |
| └ **W2 slice 1** ✅ (2026-08-02) | ① Share overlay+revoke+backend creator check+anonymous GET-only; ② Shell routes offline (query/chatsql/dataDomain/dataQuery→404) + delete test pages and settings geographic (`pages/JExcel` retained as table edit component) | Clear Query sidebar exception with deleted routes | `share.spec` (including revoke invalid) + `design-query`/`data-domain`/`home-data-query` 404 |
| └ **W2 slice 2** ✅ (2026-08-02) | ③ Home delete only: Radar/_mock/service/Pie config/"Project overview" duplicate card + HomeLayout slogan rotation; experimental source files physically deleted (query/chatsql/dataDomain/dataQuery + QueryLeftContent/dialog/query/useQueryStore); deps removed `@ant-design/charts`, `@chatui/core` | Clear TabGroup.QUERY with deletion | `activation` + `layout-outlet`; shell 404 no regression; `grep charts/chatui/useQueryStore` = 0 |
| └ **W2 slice 3** ✅ (2026-08-02) | ④ Designer chrome: main area dedupe nested `DataTable`; sider footer deleted; sider 400→320; tabs 40px; shell flex fill; tree header "New" always visible | — | `layout-outlet` "header…" + "model tree only + new entry always visible"; `openRelationFromEmpty` assert single tree |
| └ **W2 slice 4** ✅ (2026-08-02) | ⑤ Designer `calc(100vh)` zero-out: `QueryTree` / `version-page` / ReactFlow canvas → flex/`height:100%`; sider-inner `overflow:hidden` | — | `layout-outlet` "model tree and version page flex fill"; `rg 'calc\\(100vh' frontend/src/components/QueryTree frontend/src/pages/design` = 0 |
| **W3** Version domain consolidation ✅ (old W4 advanced, goal rewritten) | version ProList → antd List ✅; **cross-version diff export** ✅; approval/order forms `ProForm*` → antd Form port ✅; approval entry streamlined ✅ | Version/approval domain ProForm (peeled) | Version "save→tag→diff→export→revert" journey E2E; approval "submit→pass→SQL failure does not pass" regression |
| └ **W3 slice 1** ✅ (2026-08-02) | **Cross-version diff export**: diff overlay "Export" primary button outputs Markdown (model changes+SQL), dropdown "Export SQL only"; reuses `File.save`; removed zero-ref `bizcharts` / `@ant-design/plots` | — | `version.spec` detail overlay download `.md` + toast; `formatVersionDiffMarkdown.test.ts` |
| └ **W3 slice 2** ✅ (2026-08-02) | version `ProList` → antd `List`: toolbar (dirty flag/data source/tag filter/add/compare/sync config/rebuild) + row (version number strong + sync Tag + tag chips + change summary + row-end actions); empty state "No versions yet" + "Save first version" primary button | version ProList | `version.spec` "can add version without data source" empty state CTA + list row no regression; `rg ProList pages/design/version` = 0 |
| └ **W3 slice 3** ✅ (2026-08-02) | **Approval/work order entry streamlined**: version page header "My work orders/My approvals" direct; team unsynced version row "Submit work order" → detail "SQL approval"; empty state copy aligned | — | `approval.spec` "version page: submit work order entry reachable and approval tab visible" + existing work order/approval cases |
| **W4** Project list + data sources (old W3, demoted to pure port wave) | dataModels + project/* `ProList` → antd List; databaseConfig `ProTable`/`PageContainer` → antd Table + workspace shell; import/export/setting/account remaining `ProForm*` peel one by one (including save version AddVersion) | 4 ProList pages + 1 ProTable + remaining ProForm | Project "list→open→rename→delete" E2E; data source "create→ping→delete" E2E; each dialog corresponding E2E no regression |
| └ **W4 slice 1** ✅ (2026-08-02) | **AddVersion** (save version modal): `ModalForm`/`ProForm*` → antd `Modal` + `Form`; tags `Select mode=tags` + comma-separated, validation and testid unchanged | AddVersion ProForm | `version.spec` save path (add without data source / multi-tag / visual diff inner saveVersion) |
| └ **W4 slice 2** ✅ (2026-08-02) | **RenameVersion** (edit version modal): `ModalForm`/`ProForm*` → antd `Modal` + `Form`; backfill/non-latest read-only version number/failure no close; testid unchanged | RenameVersion ProForm | `version.spec` "rename description and delete version" |
| └ **W4 slice 3** ✅ (2026-08-02) | **AddProject** (new project modal): `ModalForm`/`ProForm*` → antd `Modal` + `Form`; personal/team `type` initial value; tags Select + testid unchanged | AddProject ProForm | `smoke` / `project-activation` `createPersonProject` |
| └ **W4 slice 4** ✅ (2026-08-02) | **RenameProject** (edit project modal): `ModalForm`/`ProForm*` → antd `Modal` + `Form`; tags split backfill; failure no close; testid added | RenameProject ProForm | `project-surface` "edit modal can rename and return to list" |
| └ **W4 slice 5** ✅ (2026-08-02) | **Dead code removal**: zero-mount `DataDomain`/`DynamicDialog` + `dialog/module|entity|database|dataType` ModalForm cluster deleted (model/table already handled by `EntityModal` antd Form+Modal; do not port invisible pages) | Dead ModalForm cluster | `empty-projectjson` "team project without JSON can add model"; `rg dialog/(module\|entity\|database\|dataType)` = 0 |
| └ **W4 slice 6** ✅ (2026-08-02) | **CopyProject** (version row duplicate modal): `ModalForm`/`ProForm*` → antd `Modal` + `Form`; type numeric; tags Select + testid; failure no close | CopyProject ProForm | `version.spec` "version row duplicate modal can create personal project" |
| └ **W4 slice 7** ✅ (2026-08-02) | **DatabaseSetUp** (designer "Data source settings"): `ModalForm`/`ProFormList`/`ProForm*` → antd `Modal` + `Form` + `Form.List`; deleted zero-ref setting page twin files | dialog DatabaseSetUp ProForm | `adr0008-datasource` "add data source" + `project-menu` "data source settings can open" |
| └ **W4 slice 8** ✅ (2026-08-02) | **DefaultSetUp** (designer "Default items settings"): `ModalForm`/`ProCard`/`ProForm*` → antd `Modal` + `Form` + `Tabs`; fields/config two tabs and save hint unchanged | dialog DefaultSetUp ProForm | `project-menu` "default items settings can open" + "save shows success hint" |
| └ **W4 slice 9** ✅ (2026-08-02) | **CompareVersion** + **SyncConfig**: detail/compare overlay and sync config `ModalForm`/`ProForm*` → antd `Modal` + `Select`/`Form`/`Radio`; export footer and testid unchanged | CompareVersion + SyncConfig ProForm | `version.spec` visual diff + "sync config overlay can save upgrade mode" |
| └ **W4 slice 10** ✅ (2026-08-02) | **RebuildVersion** + **InitVersion** + setting page **DefaultSetUp**: `ModalForm`/`ProForm*` → antd `Modal`/`Form`; settings page route retained | RebuildVersion + InitVersion + setting DefaultSetUp | `version.spec` "rebuild version overlay can open"; Pro file count 32→29 |
| └ **W4 slice 11** ✅ (2026-08-02) | **ResetPassword** + **AddUser** + dialog **ReversePdMan** / **ReverseERD**: `ModalForm`/`ProForm*` → antd `Modal` + `Form`/`Upload.Dragger` | 4 dialog ProForm | `import-pdman` / `import-erd` / `project-menu` import submenu + `account-settings` change password modal; Pro file count 29→25 |
| └ **W4 slice 12** ✅ (2026-08-02) | **SqlApproval** + **BasicSetting** + **GroupSetting** + **notice** + **TableTab**: `ModalForm`/`ProForm`/`ProCard`/`ProList` → antd `Modal`/`Form`/`Tabs`/`List` | 5 Pro files | `group-basic-setting` + `group-layout-nav` permission group + `project-notice` + `layout-outlet` GroupLayout basic; Pro file count 25→20 |
| └ **W4 slice 13** ✅ (2026-08-02) | **person / recent / group / dataModels / ExportCommon**: `ProList` → antd `List` + title row/`Input.Search`; empty state CTA and testid unchanged | 5 ProList pages | `project-surface` + `project-activation` empty state + `layout-outlet` person + `loading` list loading + `export` normal export; Pro file count 20→15 |
| └ **W4 slice 14** ✅ (2026-08-02) | **approval/order** `ProTable`→Table; **home** peel `PageContainer`; **login/register** peel `LoginFormPage`; **databaseConfig** peel ProTable/`pro-layout` PageContainer; **ExportDDL** (dialog+page) peel StepsForm | 8 priority Pro files | `approval` + `session`/`smoke` login register + `adr0008-datasource` databaseConfig + `project-menu` export DDL + `project-surface` home; Pro file count 15→8 |
| └ **W4 slice 15** ✅ (2026-08-02) | Final zero-out: `account/settings`→HomeLayout; `GroupUser`/`GroupPermission`; dual `ReverseDatabase`+`ReverseTable`; delete dead code `StandardFieldLibrary`; remove `@ant-design/pro-components` + `umi-presets-pro` | 7→0 + dependency removal | `account-settings` + `group-layout-nav` + `import-reverse`; `rg …pro-components` = 0 |
| **W5** Login/share/404 polish | Login register brand shell re-polish; share header alignment + invalid state; 404/403 remove reset.css + standard Result (**Pro dependency already removed W4 slice 15**) | Visual/share/404 | `landing.spec` + login redirect loop E2E; share fork journey; 404 screenshot |
| └ **W5 slice 1** ✅ (2026-08-02) | **404/403**: remove `reset.css`; standard Result icons; secondary button "Open demo"; delete custom svg | — | `not-found.spec` "Back to Home" + "Open demo" → `/demo`\|`/s/public-demo` |
| └ **404/403 brand alignment** ✅ (2026-08-03) | **404/403**: → `AuthBrandShell` (removed bare Result); same CTA as share invalid gate | — | `not-found.spec` brand shell ~40% + `exception-404-gate` |
| └ **W5 slice 2** ✅ (2026-08-02) | **Share invalid state**: invalid/revoked token → `Result` 403 + "Back to Home" + "Open demo"; success state chrome unchanged | — | `share.spec` "invalid token…demo" + "create→revoke then…" see Result CTA |
| └ **W5 slice 3** ✅ (2026-08-03) | **Share header brand alignment**: 64px `erd-chrome-header` + logo + project name + Fork CTA + login/register link; light chrome no workspace nav | — | `share.spec` "after designer share…" assert header 64px + logo/login/register; `demo.spec` chrome visible |
| └ **W5 slice 4** ✅ (2026-08-03) | **Login/register brand shell**: `AuthBrandShell` left 40% dark panel + right Form; clear `bg2`/`#1677FF`; delete `public/bg2.png` | — | `smoke` "login page render" brand shell ~40% + no hardcode; `session` "go register" same shell |

Dependency order: W1 ✅ → **W2 → W3 → W4 → W5**. W2 and W3/W4 have no file overlap, can parallel; W5 depends on W1 header pattern settled, and must be last wave (dependency removal requires zero-out first).

**Pro Strangler close-out criteria (revised)**: Pro import zero-out is no longer wave goal, but **byproduct** of W2–W5 capability work; W5 end one-shot dependency removal. No wave may port user-invisible pages just to "hit zero-out".

## Metrics (compare at each wave close)

- **Primary**: capability exposure gap count (product-capability-map missing/thin items) drops wave by wave; shell pages/dead code file count → 0
- Pro import file count: baseline 65 (S0 freeze) → natural drop W2–W5 → 0 at W5 end (**byproduct metric, do not schedule waves for it**)
- Inline hex literals: `grep -rn '#[0-9a-fA-F]\{6\}' frontend/src/pages | wc -l` drops wave by wave; landing page less already reads `--erd-*` (hex only in `theme/tokens.ts` / `css-vars.less`)
- Height/alignment magic numbers (`calc(100vh -`, negative margin): post-W1 designer 0; post-W5 site-wide 0
- No new `any`; no new UI dependencies; `yarn build` bundle size does not increase
