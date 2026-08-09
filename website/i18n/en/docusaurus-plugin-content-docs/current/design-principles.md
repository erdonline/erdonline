# Design principles

:::info Audience
Maintainer doc: read before writing any UI. Regular users should start with the [User guide](/docs/guide/what-is-erd-online).
:::

> For all contributors: read this before writing any UI code.
> Each principle includes positive and negative examples (negative examples come from real historical code in the project, already fixed or on the fix list).

## 1. Instant feedback

Every action gets a visible response within 100ms; optimistic updates when possible instead of waiting for the server; async operations must show state.

- ✅ Auto-save shows "Saving… / Saved 12:30 / Save failed, click to retry"
- ✅ Data source reverse-engineering failure: toast / in-page readable business copy (no `[object Object]`); failure area "Re-parse"; no stacked toasts for business vs network errors
- ✅ Add-member invite failure: business toast, modal stays open (no fake success); retryable; no stacked toasts
- ✅ Initialize baseline save failure: business toast, modal stays open; retryable; close only on success
- ✅ Rebuild baseline `hisProjectSave` failure: no fake "Rebuild baseline succeeded"; no rebaseline after failure; readable toast
- ✅ dbsync sync failure: clear "Syncing" dead state, sync clickable again; Modal shows failure reason
- ✅ Read-only share creation failure: business toast, window stays open; primary button "Regenerate" retryable (no disabled dead affordance); no stacked toasts
- ✅ Change password failure: business toast, modal stays open (no fake success); retryable; fallback "Update password failed" when no msg
- ✅ Sync config failure: only on `saveProject` code===200 write store + toast "Settings saved" + close modal; failure toast readable, modal stays open and retryable; fallback "Settings failed" when no msg
- ✅ Default-field settings failure: only on `saveProject` code===200 write store + toast "Settings saved" + close modal; failure toast readable, modal stays open and retryable; fallback "Settings failed" when no msg
- ✅ Data source settings confirm failure: only on successful `updateDbs` (PUT dataSources) toast "Saved successfully!" + close modal; failure toast readable, modal stays open and retryable; no unconditional success toast
- ✅ EntityModal (new model/table/diagram): only on `saveProject` code===200 write store + success toast + close modal; failure toast readable, modal stays open and retryable; no local mutate then "Added successfully"
- ✅ Canvas new/rename diagram: only on `saveProject` code===200 write store + success toast (create) + close modal; failure toast readable, modal stays open and retryable
- ✅ Canvas create table / inline new field: only on `saveProject` code===200 add to canvas / exit inline edit; failure toast readable, draft/empty state retryable; no local mutate then "Table added successfully"
- ✅ Canvas rename existing field / delete field: only on `saveProject` code===200 exit edit / remove row; failure toast; rename draft kept; delete confirm modal stays open on failure, retryable
- ✅ Canvas / left tree delete table: only on `saveProject` code===200 remove node + toast "Table deleted successfully"; failure toast, node kept, confirm modal refuses close, retryable; no local mutate then "Table deleted successfully"
- ✅ Left tree delete model/diagram: only on `saveProject` code===200 remove + toast "Model/diagram deleted successfully"; failure toast, tree node kept, confirm modal refuses close, retryable; no local mutate then success
- ✅ Left tree cut/paste table (and model cut/paste): only on `saveProject` code===200 write clipboard and remove/add + success toast; failure toast, prior state kept; no local mutate then "Cut/paste succeeded" (copy is clipboard-only, no persist)
- ✅ Canvas drag table / drag frame coordinates: only on `saveProject` code===200 write layout/Frame bounds; failure toast + RF rollback to prior coordinates; no local mutate as if coordinates persisted
- ✅ Canvas align/auto-layout: only on `saveProject` code===200 write layout; failure toast + RF rollback; fitView only after success; no local `updateGraphCanvasLayout` as if coordinates persisted
- ✅ Frame rename/resize/fit members: only on `saveProject` code===200 write store; failure toast + rename draft kept / RF bounds rollback; toast "Members fitted" only on success; no local mutate as if persisted
- ✅ Frame create/add/remove members: only on `saveProject` code===200 write store + toast; failure toast, no add to canvas / no member change; add modal refuses close on failure; no local mutate then success
- ✅ Canvas drag edge to create association: only on `saveProject` code===200 write store; failure toast, no edge (associations derived); drag again to retry; no local mutate then edge on canvas
- ✅ Canvas change edge cardinality: only on `saveProject` code===200 write store; failure toast, chip keeps original cardinality; select again to retry; no local mutate then cardinality changed
- ✅ Canvas change edge ON DELETE/UPDATE / constraint name: only on `saveProject` code===200 write `constraintName`/`deleteRule`/`updateRule`; failure toast, keep original values; same old `constraintName` split-edge sync rename and rules; duplicate-name blocked; no local mutate then metadata changed
- ✅ Data type dictionary CRUD: only on `saveProject` code===200 write store + success toast/close modal; failure toast, modal kept, table no new row; no local mutate then "Submitted successfully"; enum kind/`values[]` same gate (`buildEnumApply`); logical types encode `apply[code].type` per dialect dense table (no raw JSON)
- ✅ Field type picker distinguishes enums: canvas `<select>` optgroup "Logical type|Enum"; table design/default-field JExcel dropdown group; selection writes `fields[].type=code`; browse state enum badge; no fake success (still uses existing persist)
- ✅ Reverse import (data source pick tables / ERD·PdMan·DBML file): only on `saveProject` code===200 write store + success toast; failure toast, no store write, modal/page stays retryable; no local `setProjectJson`/`importReverseTable` then "Import/operation succeeded"
- ✅ Default data source switch / WORD template path: only on `saveProject` code===200 write store (template also toasts "WORD template updated"); failure toast, Radio/list rollback retryable; no local mutate only (`needSave=false` skips autosave)
- ✅ Version rollback: only on `saveProject` code===200 write store + toast "Rollback succeeded" + close modal; failure toast, no store write, confirm modal stays open retryable; no `setModules` first then async save
- ✅ WORD template download: only persist blob to `.docx` when non-empty and ZIP magic `PK`; empty body / JSON error body toast "Download template failed" and no download; no fake success file
- ✅ Word document export (`gendocx`): same ZIP gate (`docxBlobGate`); empty body / JSON / non-`PK` → toast "Word export failed! Please retry!" and no download; no fake success file
- ❌ Login failure with no feedback — user thinks the network is down (historical issue)
- ❌ Silent auto-save — user doesn't know whether modeling work was persisted (historical issue)
- ❌ Reverse parse failure toast "Database parse failed:[object Object]" and in-page only "Parse failed" with no retry (historical issue)
- ❌ Add member non-200 still closes modal — missing toast looks like invite succeeded (historical issue)
- ❌ Rebuild baseline business failure still shows success toast and rebaselines; initialize baseline closes modal before save (historical issue)
- ❌ After share creation failure "Copy link" disabled — can only close and reopen (historical issue)
- ❌ Change password non-200 still closes modal — missing toast looks like password changed (historical issue)
- ❌ Sync config only local `upgradeType` change then toast "Settings saved" and close — persist failure looks like configured (historical issue)
- ❌ Default-field settings only local profile change then toast "Settings saved" and close — persist failure looks like configured (historical issue)
- ❌ EntityModal / module tree local mutate then toast "Model added successfully" and close — autosave failure looks saved (historical issue)
- ❌ Canvas new diagram local mutate then close — autosave failure looks like diagram created (historical issue)
- ❌ Canvas create table/inline add field local mutate then success — autosave failure looks on canvas/field added (historical issue)
- ❌ Canvas rename/delete field local mutate then success — autosave failure looks renamed/deleted (historical issue)
- ❌ Canvas/left tree delete table local mutate then toast "Table deleted successfully" — autosave failure looks deleted (historical issue)
- ❌ Left tree delete model/diagram local mutate then toast — autosave failure looks deleted (historical issue)
- ❌ Left tree cut/paste local mutate then success toast — autosave failure looks cut/pasted (historical issue)
- ❌ Canvas drag table local mutate writes layout — autosave failure looks coordinates persisted (historical issue)
- ❌ Canvas align/auto-layout local mutate writes layout — autosave failure looks coordinates persisted (historical issue)
- ❌ Frame rename/fit members local mutate then success (fit members toasts first) — autosave failure looks renamed/resized (historical issue)
- ❌ Frame create/member add-remove local mutate then toast — autosave failure looks group created/joined (historical issue)
- ❌ Canvas drag edge local mutate adds edge — autosave failure looks association created (historical issue)
- ❌ Canvas change edge cardinality local mutate swaps chip — autosave failure looks cardinality changed (historical issue)
- ❌ Data type dictionary local mutate then toast "Submitted successfully" — autosave failure looks written (historical issue)
- ❌ Reverse import local `setProjectJson`/`importReverseTable` then toast "Import/operation succeeded" — autosave failure looks imported (historical issue)
- ❌ Default data source / WORD template path local mutate only — never persists when `needSave=false` or autosave failure looks switched/configured (historical issue)
- ❌ Version rollback `setModules` first then async save and immediate close — persist failure looks rolled back (historical issue)
- ❌ WORD template download saves empty blob / JSON error body directly as `wordTemplate.docx` (historical issue)

## 2. Keyboard first

Full shortcut system + `Cmd/Ctrl+K` command palette. Power users should model without touching the mouse.

- ✅ `Cmd+Z` / `Cmd+Shift+Z` undo/redo, `Delete`/`Backspace` delete selection (with confirm), `Cmd/Ctrl+K`/`Cmd/Ctrl+F` command palette (search tables to locate), `?` opens shortcut cheat sheet (`role=dialog` "Shortcuts"; toolbar "?" same entry)
- ✅ Command palette keyboard loop: open focuses search first; ↑↓ + `aria-activedescendant` selection; Enter executes; no match shows "No results" + hint; Esc closes and returns focus to trigger; Tab/⇧Tab trapped in search (options not in Tab order)
- ✅ Table design inner tab direct switch: `Cmd/Ctrl+1` fields · `2` indexes · `3` metadata apply (intercept only when table design tab mounted; not in inputs; don't steal browser tabs on canvas); listed on cheat sheet
- ✅ Table design JExcel (fields/indexes/default fields shared): toolbar `role=toolbar` "Spreadsheet edit toolbar" + all 7 items Tab + Enter/Space; grid `jexcel-grid` focusable, Enter enters A1; Shift+Tab back to toolbar (no trap); edit Escape discards draft and returns focus to grid (no hidden textarea commit); "Quick actions" `Modal.info` focuses "Got it" first + Esc returns + Tab trap
- ✅ Designer Skip: first Tab "Skip to model tree / Skip to main workspace" lands `erd-design-tree` / `erd-design-workspace` (`tabIndex=-1`); bypass top chrome; landmark → next Tab into search/tabs·canvas (no trap); designer `:focus-visible` brand ring (tab bar/canvas toolbar/focusable controls)
- ✅ CommonTabs tab header keyboard: `navigation` "Open tabs"; ←/→ roving switch entity tabs; close button `aria-label=Close {table name}` (no English `remove`); close tab focus returns to next tab or main workspace landmark; close button `:focus-visible`; inner tab arrows don't bubble
- ✅ Share shell keyboard: first Tab Skip "Skip to diagram" lands `#share-canvas-stage` (`tabIndex=-1`); bypass top chrome; Controls (zoom in/out/fit) in order, MiniMap out of order; Fork/login/register reachable; shell `:focus-visible` brand ring; module/snapshot Segmented `role=group` named; no trap
- ✅ Login shell keyboard: first Tab Skip "Skip to login form" lands `#auth-form-anchor` (`tabIndex=-1`); bypass left brand panel; username→password→login→footer in order; Enter on password submits; shell `:focus-visible` brand ring (dark panel surface ring); no trap
- ✅ Register shell keyboard: same shell Skip "Skip to register form"; username→password→confirm→email→phone→register→footer; Form tip question mark out of order (hover kept); Enter on last field submits/validates; focus-visible brand ring; no trap
- ✅ Landing page keyboard: first Tab Skip "Skip to main action" lands `#landing-main-cta` (`tabIndex=-1`); bypass top bar; try→register→login (logged in: workspace→demo); shell `:focus-visible` surface ring (dark facade); brand landmark; brand links still reachable without Skip; no trap
- ✅ `/compare` competitor page keyboard: same shell Skip→ `#landing-main-cta`; open demo→self-host guide→back home; surface focus-visible; no trap
- ✅ Home workspace keyboard: first Tab Skip "Skip to main content" lands `#home-main-content` (`tabIndex=-1`); bypass top bar; continue modeling→new→example→secondary entries→project cards; shell `:focus-visible` brand ring; no trap
- ✅ GroupLayout shell keyboard: first Tab Skip "Skip to main content" lands `#group-main-content` (`tabIndex=-1`); bypass top bar+sidebar; basic settings form fields in order; shell `:focus-visible` brand ring; no trap
- ✅ Project list row keyboard: personal/recent/team rows stretched link (description also opens project); Enter opens designer; Tab row actions (edit/delete/manage/open) reversible; row `:has(:focus-visible)` inset brand ring (resists ant List outline reset); no trap/dead end
- ✅ Account settings shell keyboard: `/account/settings` first Tab Skip "Skip to main form" lands `#account-settings-form` (`tabIndex=-1`); bypass top bar+left tabs; email→phone→update basic info; shell `:focus-visible` brand ring; no trap
- ✅ Project action modal keyboard: new/edit Modal opens focus first field; delete confirm focuses "Yes"; Esc closes; focus returns to trigger; Tab trapped in `role=dialog`
- ✅ Import/export modal keyboard (DBML): import focuses textarea first; export focuses model Select first; Esc closes; empty CTA / "Project menu" focus return; Tab trapped in dialog
- ✅ Version action modal keyboard: add→version number; edit→version number (non-latest read-only number→description); delete/rollback confirm→"Yes"; Esc closes; focus returns to trigger; Tab trapped in `role=dialog`
- ✅ Version compare/detail diff modal keyboard: compare→"Initial version" Select; detail→"Export change list"; Esc closes; focus returns to trigger; Tab trapped in `role=dialog`
- ✅ Sync config/rebuild version modal keyboard: sync config→"Field increment" first; rebuild version→"Version number" first; Esc closes; focus returns to trigger; Tab trapped in `role=dialog`
- ✅ Initialize baseline modal keyboard: "Version number" first; Esc closes; focus returns to trigger; Tab trapped in `role=dialog`
- ✅ Clone modal keyboard: "Project name" first; Esc closes; focus returns to trigger; Tab trapped in `role=dialog`
- ✅ Data source settings modal keyboard: "Add data source" first; Esc closes; focus returns to "Project menu"; Tab trapped in `role=dialog`
- ✅ Default-field settings modal keyboard: "Default fields" tab first; Esc closes; focus returns to "Project menu"; Tab trapped in `role=dialog`
- ✅ Data source reverse-engineering modal keyboard: "Data source" Select first; Esc closes; focus returns to "Project menu"; Tab trapped in `role=dialog`
- ✅ Export DDL modal keyboard: "Data source" Select first; Esc closes; focus returns to "Project menu"; Tab trapped in `role=dialog`
- ✅ Parse ERD file modal keyboard: upload area "Choose ERD file" first; Esc closes; focus returns to "Project menu"; Tab trapped in `role=dialog`
- ✅ Parse PdMan file modal keyboard: upload area "Choose PdMan file" first; Esc closes; focus returns to "Project menu"; Tab trapped in `role=dialog`
- ✅ Change password modal keyboard: "Password" first; Esc closes; focus returns to trigger; Tab trapped in `role=dialog`
- ✅ Submit SQL approval modal keyboard: "Approver" first; Esc closes; focus returns to trigger (parent detail still open); Tab trapped in `role=dialog`
- ✅ Add member modal keyboard: "Select user" first; Esc closes; focus returns to trigger; Tab trapped in `role=dialog`
- ✅ Read-only share modal keyboard: "Share link" first; Esc closes; focus returns to trigger; Tab trapped in `role=dialog`
- ✅ EntityModal keyboard: new model focuses "Name" first (new table focuses "Parent model" first); Esc closes; focus returns to trigger; Tab trapped in `role=dialog`
- ✅ Canvas diagram modal keyboard: new/rename focuses "Diagram name" first; Esc closes; focus returns to trigger; Tab trapped in `role=dialog`; Esc disabled while submitting; "Add to group" focuses "Select group" first, same pattern
- ✅ Data type dictionary modal keyboard: add/edit focuses "Type name" first; Esc closes; focus returns to trigger; Tab trapped in `role=dialog`; Esc disabled while submitting
- ✅ Canvas delete table confirm modal keyboard: selected table Delete → focuses "Delete" first; Esc closes; focus returns to trigger; Tab trapped in `role=dialog` (confirm kept)
- ✅ Canvas delete edge/group confirm modal keyboard: selected edge/group Delete → focuses "Delete" first; Esc closes; focus returns to trigger; Tab trapped in `role=dialog` (confirm kept)
- ✅ Canvas delete field confirm modal keyboard: field browser × "Delete field" → focuses "Delete" first; Esc closes; focus returns to trigger; Tab trapped in `role=dialog` (confirm kept)
- ✅ Table design delete index confirm modal keyboard: index tab "Delete index `{name}`" → focuses "Delete" first; Esc closes; focus returns to trigger; Tab trapped in `role=dialog` (confirm kept)
- ✅ JExcel toolbar delete row confirm modal keyboard: "Delete selected rows" → focuses "Delete" first; Esc closes; focus returns to trigger; Tab trapped in `role=dialog` (confirm kept)
- ✅ Left tree delete model/table/diagram confirm modal keyboard: "…Actions→Delete…" → focuses "Delete" first; Esc closes; focus returns to row trigger; Tab trapped in `role=dialog` (confirm kept)
- ✅ Data source settings delete confirm modal keyboard: row "Delete data source" → focuses "Delete" first; Esc closes confirm without delete, returns to delete button; outer config modal stays open; Tab trapped in confirm `role=dialog`
- ✅ Workspace databaseConfig delete/batch delete confirm modal keyboard: row "Delete connection"/"Batch delete" → focuses "Delete" first; Esc closes confirm without delete, returns to trigger; Tab trapped in confirm `role=dialog`
- ✅ Read-only share revoke confirm modal keyboard: "Revoke share" → focuses "Revoke" first; Esc closes confirm without revoke, returns to revoke button; outer share modal stays open; Tab trapped in confirm `role=dialog`
- ✅ Team project delete confirm modal keyboard: basic settings "Delete team project" → focuses "Delete" first; Esc closes confirm without delete, returns to delete button; Tab trapped in confirm `role=dialog`
- ✅ Team member remove confirm modal keyboard: user group "Remove member" → focuses "Remove" first; Esc closes confirm without remove, returns to remove button; Tab trapped in confirm `role=dialog`
- ✅ Approval action confirm modal keyboard: approval "Approve/Reject"/work order "Revoke" → focuses primary action first; Esc closes confirm without persist, returns to trigger; Tab trapped in confirm `role=dialog` (re-approval same `confirmDestructive`)
- ✅ Approval/work order SQL detail keyboard: row "View SQL" → `Modal.info` focuses "Got it" first; Esc/OK closes and returns to trigger; Tab trapped in `role=dialog` (`showSqlDetailModal`)
- ✅ Import skip validation keyboard: re-import existing model → `Modal.warning` focuses "Got it" first; Esc/OK closes hint and returns to "Parse and import"; Tab trapped in `role=dialog` (`showImportSkipWarning`)
- ✅ Workspace databaseConfig Drawer keyboard: new/edit open focuses "Connection name" first; Esc closes Drawer; focus returns to trigger (Drawer has no `focusTriggerAfterClose`, `afterOpenChange` manual return); Tab trapped in Drawer `role=dialog`
- ✅ Version sync result modal keyboard: sync success/failure `Modal.success`/`Modal.warn` focuses "Got it" first; Esc/OK closes and returns to "Sync"; Tab trapped in `role=dialog` (`showSyncResultModal`; pin back to sync button before open); `SyncVersion` must pass row data, click pins `currentVersion` (no hover-only or `projectJSON.modules` empty crash)
- ✅ Destructive confirm unified `confirmDestructive`: bare `Modal.confirm` in `frontend/src` only in utility; version "Rebuild baseline/Sync confirm", reverse overwrite, canvas/JExcel/index delete etc. all focus OK first + Esc return + Tab trap
- ✅ 404/403 shell keyboard: first Tab Skip "Skip to main action" lands `#exception-main-cta` (`tabIndex=-1`); bypass left brand panel; open example demo→back home; shell `:focus-visible` brand ring; `/403` deep link reachable; no trap
- ✅ Share invalid gate keyboard: same Skip "Skip to main action"→ `#exception-main-cta` (`share-invalid-gate`); open example→back home; focus-visible brand; no trap
- ✅ Canvas field browser Tab loop: only **selected** table field rows / add field / open table design in order; row PK·✎·× `tabIndex=-1` (Enter edits, Delete deletes field); unselected table `tabIndex=-1` prevents canvas trap; field row `:focus-visible` brand ring; listed on cheat sheet
- ✅ Canvas chrome Tab order: Controls (zoom in/out/fit/interact) → toolbar; MiniMap (d3-zoom) `tabindex=-1` decorative out of order, mouse drag still works; Controls `:focus-visible` brand ring; no trap
- ✅ Canvas node-level Tab: `nodesFocusable`/`edgesFocusable=false` (RF wrapper out of order); only **selected** table controls / adjacent edge cardinality chip / Frame rename in order; unselected `-1`; no dense-graph trap
- ✅ Left tree keyboard roving: after Skip "Skip to model tree" ↓/↑/Enter enters tree keyboard surface; arrows roam, ←→ expand/collapse, Enter locates table / opens diagram (same `focusTable` / `tree-open-relation`); active row brand ring; landmark→Tab still enters search (no trap)
- ❌ Design principles mention `?` cheat sheet but no implementation; Cmd+K / Delete confirm / Tab field nav only found by walkthrough (historical issue)
- ❌ Table design field grid toolbar 6/7 icons keyboard unreachable, remove focusable but Enter does nothing, grid no Tab entry (historical issue)
- ❌ Enter designer Tab scans long top bar first, model tree/canvas no Skip, focus ring invisible (historical issue)
- ❌ Table design three tabs mouse-only — power users keep hands on keyboard but must go around the canvas bottom bar (historical issue)
- ❌ Canvas unselected table fields and inline micro-buttons all in Tab order — dense graph keyboard trap (historical issue)
- ❌ Controls→toolbar Tab through MiniMap SVG trap; Controls keyboard ring invisible (historical issue)
- ❌ RF default every node/edge wrapper `tabindex=0` + edge chip unconditionally in order → dense graph scan entire graph before toolbar (historical issue)
- ❌ After Skip to model tree only Tab into search — arrows can't enter tree roam, can't keyboard open table/diagram (historical issue)
- ❌ Share page Tab scans top bar first, no Skip, Controls/MiniMap order and focus ring not aligned with designer (historical issue)
- ❌ Login/register shell Tab scans left brand panel first, no Skip, dark panel focus ring invisible (historical issue)
- ❌ Landing page Tab scans full top bar first, no Skip to main CTA, dark facade focus ring missing (historical issue)
- ✅ Command palette search table name → select node + `fitView` align + `locate-flash` pulse highlight (no whole canvas with no feedback)
- ✅ Left tree click table name → same language locate on canvas (switch diagram tab + select + fitView + `data-locate-flash`); table design via menu "Edit table"
- ❌ undo/redo methods implemented but never wired to UI and keyboard (historical issue)
- ❌ Command palette only create table/layout — search table name no match, large canvas can't find table (historical issue)

## 3. Context is the tool

Context menus, hover actions, inline edit first; avoid modals when you can.

- ✅ Canvas table node inline field edit: hover ✎ / double-click to edit; empty name toast, no silent discard; Enter commits; Escape cancels uncommitted rename (block blur, no cancel becoming persist); Tab/Shift+Tab next/previous row; last row Tab opens new field; only type/PK/not-null/auto-increment/hidden instant persist (save-status, `persist:true` rollback on failure); hidden has toast + table bottom "Hidden" recover (only after save success); defaultValue edit second inline row (main row full, no horizontal squeeze); browse selected field Delete/Backspace (and ×) confirm delete, edit Backspace only edits text
- ✅ Relationship cardinality: click edge label chip inline pick `1:1`/`1:n`/`n:1`/`n:n` (no modal); drag edge default `n:1`; both ends Crow's foot (IE) follow cardinality; same editor can edit constraint name + ON DELETE/UPDATE (empty rule=dialect default; empty name on export generates)
- ✅ Frame title double-click inline rename
- ❌ Creating one relationship required opening modal to configure cardinality manually (historical issue)
- ❌ FK referential actions only visible on reverse-engineer title, canvas can't change CASCADE (historical issue)
- ❌ Relationship lines only closed arrows — can't read cardinality at a glance (historical issue)
- ❌ Double-click open table method exists but never passed to component — double-click dead link (historical issue)

## 4. Zero-friction defaults

Templates, smart defaults, everything draggable; no page should leave users facing a blank screen with no idea what to do.

- ✅ New project wizard: blank / import database / from template — done in three steps
- ✅ Empty state = illustration + one-line guide + action button
- ✅ Non-empty canvas toolbar "New table" one-click on canvas (`canvas-create-table`); `persist:true` only adds to canvas on save success; no need to go around the left tree or Cmd+K
- ✅ Drag edge failure has toast: duplicate association / invalid anchor (same type or not aligned to port); release on blank=cancel, no noise
- ✅ Field row ✎ same shape as table header rename; rename existing field empty name toast "Field name cannot be empty"; Enter commits; Escape cancels (no blur persist); Tab field name→Chinese name→type→default→next row; last row Tab new; Chinese name (chnname)/defaultValue inline edit; type/PK/not-null/auto-increment/hidden onChange instant save-status; hidden toast + table bottom recover; selected field Delete/Backspace / × confirm delete; **inline new/rename field** `persist:true` (failure doesn't exit edit, draft kept); **delete field** after confirm `persist:true` (failure modal stays open, row not removed); **type/PK/not-null/auto-increment/hidden/browse PK** `persist:true` (failure edit draft rollback; hidden failure no exit, no toast "Hidden")
- ✅ Table header ✎ / double-click: table name + entity Chinese name dual inline; Tab table name→Chinese name→commit; Escape discard (block blur); chnname-only change also save-status; rename `persist:true` (failure doesn't exit edit, draft kept)
- ✅ Table node footer row "Fields | Indexes | Metadata | Triggers" → table design corresponding tabs (`canvas-open-field` / `canvas-open-index` / `canvas-open-code` / `canvas-open-trigger`); no canvas entry forcing a detour through the left tree / tab header click
- ✅ Trigger tab can edit existing rows: row "Edit" modal rename/timing/event/granularity/body/DDL; structure change with DDL text unchanged forces rebuild; only `saveProject` code===200 write store; failure modal stays open retryable; name focus first + Esc return; no delete-and-recreate only
- ✅ Index tab empty state: `No indexes yet` + primary CTA "Add first index" (seed first field index); no empty `indexs[]` white dead table
- ✅ Index tab fields/expressions: JExcel "Field/expression*" text cell; semicolon mix column names and expressions (e.g. `id;LOWER(email)`) → `indexs[].fields[]`; no dropdown losing expressions; persist-on-200
- ✅ Field tab empty state: `No fields yet` + primary CTA "Add first field" (seed first defaultField / id); no empty `fields[]` white dead table
- ✅ Canvas empty table field guide: 0 visible fields → "No fields yet" + "Add first field" brand CTA; no gray dashed line buried in white shell only
- ✅ Index tab existing rows: table bottom "+ Add another index" clear CTA; no JExcel toolbar icon-only plus without copy
- ✅ Index tab delete: table bottom "Delete index `{name}`" + Modal confirm (aligned with canvas delete field); cancel kept; clear returns to empty state
- ✅ Left tree diagram "Rename diagram" → `renameDiagram` (name-only; no empty FK "Table1/Table2" dead modal); no unwired copy/cut
- ✅ Left tree header "New → New diagram" → EntityModal name-only → `createDiagram` (same path as canvas toolbar; no empty FK modal)
- ✅ Left tree "Relations" folder `+` (`aria-label=New diagram`) → same path `createDiagram`; symmetric with "Tables" folder `+`
- ✅ Left tree table menu "Edit table" → table design field tab (`designPane: 'field'`, same path as canvas `canvas-open-field`); "Rename table" separate item via EntityModal
- ✅ Left tree search: Enter filters table names; × / clear immediately clears `searchKey` (antd Search `onSearch` doesn't fire on clear); no match → "No matching tables" (`tree-search-empty`); no filter residue empty folder white screen
- ✅ Command palette search table locate: `Cmd/Ctrl+K`/`F` → enter table name → locate on canvas (select + fitView + `data-locate-flash`); no command filter only, can't find table
- ✅ Left tree click table locate: click table node → switch diagram + select + fitView + flash (same `focusTable` as command palette); no click table only opens table design, hard to find on dense graph
- ✅ Field-level unique explanation: field tab hint "No standalone unique column" + "Set unique on index tab"; index empty "Add unique index"; canvas field UK badge (read-only, edit on index tab)
- ✅ Metadata apply sub-tab "Modify field"=`updateFieldTemplate` (MODIFY), "Delete field"=`deleteFieldTemplate` (DROP); no swapped labels inducing wrong action; diff script same dbKey as version page (incl. snapshot channel); fetch failure has toast
- ❌ Home quick entries point to non-existent routes (404) (historical issue)
- ❌ After first table created canvas has no create-table CTA — only left tree/command palette (historical issue)
- ❌ Duplicate edge or drag to wrong anchor silent no feedback (historical issue)
- ❌ Fields only double-click edit, empty name silent exit loses type/PK changes; type/PK/not-null/auto-increment/hidden wait blur to save or must go through table design; Chinese name/defaultValue only EntityModal or table design; table header Chinese name only EntityModal; last row Tab exit then click "+ Add field"; Escape unload edit then blur still commits (cancel becomes persist); × delete field no confirm; indexes/fields/metadata apply only via left tree table design (historical issue)

## 5. Sense of control

Everything undoable; dangerous actions preview or confirm first; user can always go back.

- ✅ Canvas delete relationship edge second confirm (selected edge Delete·Backspace / cardinality chip focused Delete·Backspace; cancel kept; after confirm `removeAssociation` `persist:true`, failure refuses close retryable)
- ✅ Confirm before deleting canvas table (model tree menu / canvas selected Delete·Backspace; copy says "irreversible"; `selectNodesOnDrag=false` so header clickable; after confirm `removeEntity` `persist:true`, failure refuses close retryable)
- ✅ Canvas delete group (Frame) second confirm (selected Delete·Backspace; copy says only frame deleted not tables; cancel kept; after confirm `removeFrame` `persist:true`, failure refuses close retryable)
- ✅ Left tree delete model/diagram second confirm (model: states cascade delete tables and diagrams; non-main diagram: only diagram not tables; main diagram no delete item; after confirm `persist:true`, failure refuses close retryable)
- ✅ Left tree cut/paste table and model: `cutEntity`/`pastEntity`/`cutModule`/`pastModule` `persist:true`; tree changes only after save success; failure retryable (copy doesn't persist)
- ✅ Canvas drag table/drag frame coordinates: `commitDiagramGeometry` `persist:true`; only save success writes layout/Frame bounds; failure RF rollback to store coordinates (no local mutate as persisted)
- ✅ Frame rename/resize/fit members: `renameFrame`/`commitDiagramGeometry` `persist:true`; only save success closes edit / writes bounds + "Members fitted"; failure draft kept / RF rollback
- ✅ Frame create/member add-remove: `createFrame`/`addFrameMembers`/`removeFrameMembers` `persist:true`; only save success write store + toast; failure no add to canvas/no member change; add modal refuses close
- ✅ Canvas drag edge: `addAssociation` `persist:true`; only save success write store; failure no edge retryable
- ✅ Canvas change edge cardinality: `updateAssociationRelation` `persist:true`; only save success write store; failure keep original cardinality, select again
- ✅ Canvas delete field second confirm (button / selected Delete·Backspace), edit Backspace doesn't accidentally delete
- ✅ Index tab "Delete index `{name}`" Modal second confirm; cancel kept; delete all returns to empty state
- ✅ JExcel toolbar "Delete selected rows" Modal second confirm (fields/indexes/default fields shared; toast when none selected)
- ✅ Table design field tab draft rows: missing English name/type toast + abort write (no silent discard losing fields); all-empty draft can discard; grid Esc doesn't bubble; required `name`+`typeName` (aligned with canvas empty name feedback)
- ✅ Table design field tab JExcel meta (type/PK/NN/AI/hidden etc.) and empty "Add first field": `updateEntityFields` `persist:true`; only save code===200 write store; failure toast + remount grid rollback draft (no local mutate success)
- ✅ Table design index tab (empty add / JExcel rename·fields·unique / add more / delete): `updateEntityIndex` `persist:true`; only save code===200 write store + "Index updated successfully"; failure toast + empty kept or remount grid rollback; delete confirm failure refuses close
- ✅ Default field settings (page route JExcel / project menu modal HotTable): `updateDefaultFields` `persist:true`; only save code===200 write store + "Default fields updated"; failure toast + remount grid rollback (no local mutate success)
- ✅ Table design index tab draft rows: missing index name/fields toast + abort write (no silent discard losing index); empty `fields` array/`;` empty string counts as unfilled; all-empty draft can discard; grid Esc doesn't bubble
- ✅ Version time machine: any historical version diffable and restorable

## 6. Fluid motion

Canvas operations feel responsive (60fps); page transitions animated; loading uses skeleton screens not spinners alone.

- ✅ Floating toolbar shows zoom ratio live, one-click fit to screen
- ✅ CRUD / enter designer wait uses `PageSkeleton` (or list `loading`); button-level async can use Spin / Button loading
- ❌ `position: fixed` pins hint text to viewport, doesn't respond to layout (historical issue)

## 7. The diagram itself is readable and shareable (ADR-0016)

The relationship diagram is the product face: nodes/edges/background use `erd-*` tokens (same language as Home/landing); density and typography make people want to screenshot and share. UI beauty is first-class, not permanently deferred P2.

- ✅ Table header ink, selected brand stroke, edge stroke use ink600; no scattered default blue `#4096ff` as canvas primary
- ✅ Reverse / DBML import dagre layered layout by FK (FK side→PK side, default `nodesep` 56 / `ranksep` 108), not unrelated grid scatter
- ✅ Public demo / example main diagram hand-tightened (column gap ~28px, Frame padding 20), screenshot not "empty"; read-only share hides `relationNoShow`; multi-diagram project share page can switch `diagrams[]` (same source as designer, read-only no new/rename)
- ✅ Table/field names monospace (`--erd-font-mono`); field name scan primary column 500 (PK row 600), type right-aligned secondary; **PK/FK badge role column** 10/700 + `min-width` 22 (amber/teal, screenshot scans role then name); table header `surfaceMuted` + field hairline separators + PK left bar; custom `erdSmooth` (rounded elbows + same-table multi-FK split + junction obstacle avoid + trunk bundling + two bends/mid-corridor + sparse Hanan A* + dense obstacle detour shortest + high-degree hub fan by peer Y + **geometric handle pick**: vertical stack same column same side short U, no fixed right→left loop) + **Crow's foot endpoints** (IE: one=vertical line / many=crow's foot, follow `association.relation`); designer and read-only share same routing; **table node dense recompress**: header pad 6, field row `min-height` 20 / lh 15 / pad 1, `FIELD_ROW_H` 24 (title 14/700 and badge hierarchy unchanged); **footer/empty well micro spacing**: add field margin 2×6 + minH 22, open table design margin 0×6×4 + btn minH 22, empty dashed well pad 6 / gap 4 / margin 4×6; `NODE_FOOTER_H` 28; no recompress header/field row hurting hit targets
- ❌ Field row PK/FK badge 9px no column width, role badge blurs into field name (historical issue)
- ✅ Frame palette uses `frameFill*` tokens (success/ink/warning/brand light fill rotation); no scattered Ant blue Frame on demo/canvas; command palette hover no `#f0f5ff`
- ✅ Edge cardinality label chip: white `surface` + `line` stroke + `ink900` text / 12px / 600; padding `[4,2]` / radius 3 (dense recompress); no same as canvas sunk, no whole semi-transparent washing text; **clickable change cardinality** (designer); **trunk bundle stretch + AABB iterative avoid** (`resolveEdgeLabelOffsets`), dense graph chips don't overlap text
- ✅ Frame title bar chrome: height 22 / **label 12/700** vs **meta 10/400+0.88** (group name primary, count muted); pad 0 8; light surface strip; no tall header squeezing members; **double-click title rename**
- ✅ Edge routing: same-side short U outer elbow avoid (`sameSide`); bypass stack table seam explicit mid-corridor; detour multiplier 1.85 shortest
- ✅ MiniMap: background `surfaceSunk` + `line` stroke + 128×96 compact (overview not shrunk); panel **margin 8** (no RF default 15); no default white vs sunk canvas split
- ❌ MiniMap panel RF default margin 15, vs ADR-0016 8–12 family too loose (historical issue)
- ❌ Controls / canvas toolbar Panel RF default margin 15, vs MiniMap already dense 8 / 8–12 family too loose (historical issue)
- ❌ Canvas empty state compact silhouette 132 (and earlier 168), vs already dense CTA pad / panel top still too large covering first screen (historical issue)
- ✅ Controls: buttons 22×22, `surface` + `line` stroke rounded; icons 12px; **panel margin 8** (aligned MiniMap; no RF default 15); **Fit canvas** muted bg + ink900 primary, zoom/lock secondary ink600; no RF `#fefefe` loose column vs canvas split
- ✅ Canvas toolbar: single surface chrome block (same language as Controls); **Panel margin 8**; buttons height 22 / font 11; secondary ink600, **Auto layout** 600/ink900; no scattered outline buttons + 5×12 loose buttons covering screenshot / no RF panel margin 15
- ✅ Empty state silhouette compact: **112** (was 132); hero 176 / Auth logo 48 / welcome pad unchanged; no ≥132 regression; ≥96 keeps presence; `testid=erd-empty-diagram`
- ✅ Edge cardinality Select: edit height **24** (≤28); EntityModal / io-modal form item mb **12**, input·Select·OK **28** (measured tight; E2E lock no regression)
- ✅ Selection halo: table / Frame share `--erd-selection-ring` (brand a18); no Frame a12 weak ring split
- ✅ Import/reverse Frame auto-suggest: table name prefix (`sys_*`/`biz_*`) first, else ≥2 connected components; no single prefix/single component whole-graph big box
- ✅ Empty state composition: designer welcome and diagram canvas share ER silhouette (`ErdEmptyDiagram`) + primary title (14/700) + one muted line guide + **single** solid primary CTA "Create first table" + secondary link "Import DBML · Reverse from data source" (ink600 text); share empty same pattern (title + hint + "Open example demo"); no pink cartoon / outline second button / empty MiniMap clutter
- ✅ Empty state panel density: padding 10×12 (ADR-0016 8–12; was 14/18/12), max-width 300, title 14/700 / CTA height 26 (hit ≥26), silhouette compact **112** (was 132 / earlier 168); no 14×18 / 28/32 loose card / ≥132 loose silhouette covering first screen; Auth logo 48 / welcome pad·hero 176 unchanged
- ✅ Empty state panel top spacing secondary dense: `.erd-empty-panel` `min(8vh, 64)` (was `min(10vh, 88)`); keep top presence ≥32; no 10vh/88 loose top; Auth logo / welcome pad / CTA pad 10×12 unchanged; `testid=canvas-empty-panel`
- ✅ Empty state vertical rhythm: `.erd-empty-title` mt≈8, `.erd-empty-desc` mb≈12 (measured tight ADR-0016; was 16 / 8×18); no regression loose spacing; Auth logo / welcome pad / CTA pad / panel top unchanged; `testid=canvas-empty-state`
- ✅ Empty state secondary link area: `.erd-empty-links` mt≈10 (8–12 family; Controls chrome measured dense so don't secondary-dense Controls); no regression >12; Auth logo / welcome pad / CTA / panel / title·desc unchanged; `testid=canvas-empty-links`
- ✅ Command palette density: width ≤440, max-height 360, input 36/13, row pad 6/8 / font 12, footer 4×8 / font 10 (same tier as `?` cheat footer); no 48 high input + 10/12 loose rows + footer 6×10 loose well covering shortcut loop
- ✅ Command palette empty state: keyword no match → "No results" + "Try table name, locate, create table or layout"; empty pad ≤8×8 / gap ≤2, list pad ≤2; no "No matching commands or tables" alone without guidance; no 16×12 empty well + 4px list well
- ✅ Shortcut cheat sheet density: `?` dialog maxH ≤360, header 6×10, list pad ≤2×4, row padY ≤6 / gap ≤8, footer 4×8; close button focus-visible; no list 6×8 + row padY 10 / gap 12 loose well; Esc / mutual exclusion with Cmd+K not weakened
- ✅ Entity create modal density: width 400, title 13/22, head/body/footer pad **8×12** (was head 10×14×8 / foot 8×14 / body 12×14), form item margin 12, input/OK height 28 / font 12; no head 10×14×8 / foot 8×14 / body 12×14 / default 520 wide + 24 pad loose card covering modeling loop
- ✅ Import/export modal density: shared `.erd-io-modal` (title 13/22, head/body/footer pad **8×12** (was head 10×14×8 / foot 8×14 / body 12×14), footer buttons 28, Select/single Input 28, Dragger tightened; Steps mt/mb ≤10/12 · title 12, same tier as secondary pane); no head 10×14×8 / foot 8×14 / body 12×14 / Steps 16/24 covering project menu loop
- ✅ Left tree row high density: `QueryTree` row height 22 / font 12, toolbar controls 24 / secondary spacing pad 4, sider-inner pad 4×6×0×8; virtual scroll `itemHeight` aligned with visual; no default ~28 loose row + pad 8/controls 28; no clip icons; keep toolbar/tree focus-visible
- ✅ CommonTabs / table design tab header density: tab bar `--erd-tabs-h` 24 (recompress, was 40→28), font 12, flex center; header pad 2×8 / gap4 / title 12; inner tab gutter/marginR 2 (no 8); no clip labels/close; no historical 40 loose bar + 10×16 header
- ✅ Version list row density: row pad 4×8, title 13/line height 22, toolbar controls 24; hint/summary colors `--erd-ink-*` / success·brand·warning; no 8×12 loose row + 16 title, no toolbar 28 + livecam/`#389e0d` fragment colors; no clip icons; keep toolbar focus-visible
- ✅ Version list empty well secondary dense: `.version-page__list .ant-list-empty-text` pad 12×8 (aligned workspace list empty); keep "No versions yet" + "Save first version" CTA; no 16×12 loose well; `testid=version-empty`
- ✅ Version work order/approval list density: shared `.approval-workorder-page` title 13/22, title bar ~24, header/row pad 4×8, action buttons 22; no default loose table + `marginBottom:16`; no clip icons; keep action button focus-visible
- ✅ Designer secondary pane table density: JExcel (fields/indexes/default fields) toolbar ~24, header/row pad 4×8, font 12, token zebra; version diff entity group header/row ~24 + success/brand/warning; no datatables header 10/row 8 + `#fbf8fb`; no clip; keep toolbar Tab/focus-visible
- ✅ Metadata apply sub-tab density: `CodeTab`/`DbTab` tab bar `--erd-sub-tabs-h` 24, font 12, flex center; no default antd loose tabs + font 11; no clip; keep sub-tab Tab focus-visible + Cmd+1/2/3 table design tabs
- ✅ Table design inner tab density: `#tableNav` fields/indexes/metadata `--erd-inner-tabs-h` 24, font 12, flex center; `tabBarGutter`/marginR 2 (aligned sub-tabs); no pad stack no fixed bar + marginR 8; no clip; keep inner tab Tab focus-visible + Cmd+1/2/3
- ✅ Table design tab body content secondary spacing: `--erd-tab-body-pad-x/b` 6/4, unique-hint pad 4×8 / mb 4, empty pad flush tab-body, metadata tip `.erd-meta-ddl-hint` ~24, workspace well 6; no 10/12 loose well + Paragraph large bottom margin; no clip JExcel; keep empty field CTA / empty name toast
- ✅ Designer empty state secondary spacing: fallback `.erd-pane-empty` (no `marginTop:100` / height 200 illustration); fields/indexes `.ant-empty` margin-block 0 + pad aligned `--erd-tab-body-pad`; keep empty CTA; no antd `marginXL` secondary loose well
- ✅ Welcome empty state secondary spacing: `.erd-welcome-empty__inner` pad 20×16, title 18/mt12·lh22 (aligned page-title 13/22 rhythm), guide mt8, hero silhouette 176; keep "Reverse from data source" link + left tree "New model"; no 32×24 / 48+ loose well / 20·mt14 / 22 title mt20 / hero 220; don't compress to canvas empty 10×12
- ✅ AuthBrandShell secondary spacing: brand/form pad 20×16 / gap12, thumbnail pad12, header mb12; form Title mt6 + `.auth-shell-form` item mb12 / Input·button 28; login/register/share invalid/404·403 same source; no 32×28 / 48×40 loose well / gap14 / mb16 / Title mt10 / antd item mb24 / large 40; brand font size/~40%/Skip·Tab not weakened
- ✅ LandingChrome / `/compare` secondary spacing: secondary section 2.75rem, pillars gap 1.5, compare row 0.5, nav/footer tightened; compare hero padT 1.5; don't compress hero brand font size/full composition/CTA; Skip·Tab not weakened
- ✅ Designer menu density: shared `.erd-dense-menu` (tree actions / tab context / new / project menu·submenu / top bar more); item height ~28 / font 12 / padX 8; `border-box` + padY 0 (no antd dropdown `content-box`+padY5 inflating height:28 to ~33); no default ~40 loose items; no clip; keep `role=menuitem` + arrows/Esc
- ✅ Common export page density: `.export-common-page` title 13/22, card pad 8×10 / gutter 8; icons `currentColor` → `--erd-brand`; no 16 pad + Title level4 loose card / bare `#DE2910`
- ✅ Home / Group main nav icons: `erdColors.brand` (same source as DesignLayout / `--erd-brand`); no hardcoded `#DE2910` in components
- ✅ dataTypeDomains tree icons: `getDataTypeTree` uses `erdColors.brand`; no bare `#DE2910`
- ✅ Settings page chrome density: `.setting-common-page` title 13/22, page pad 8×12, form item margin 12, Input/button 28; menu "Default field settings" uses `.erd-io-modal`; no default Form 24 spacing + large controls
- ✅ Database config page density: `.database-config-page` title 13/22, page pad 8×12, toolbar buttons 28, table row pad 4×8; drawer form same tier; menu "Data source settings" uses `.erd-io-modal`; no Title level4 + loose Card
- ✅ Account settings / Home project card density: `/account/settings` title 13/22, page pad 8×12, form/security row 28; BaseView column gap 16 (narrow 12); license type density panel (`--erd-brand` + 13/22, no bare `Result` / `#DE2910`); Home "Projects in progress" card pad 10×12 / title 13/22; change password uses `.erd-io-modal`; no 20 title + 14 loose row / 16×18 loose card / BaseView gap24
- ✅ Project list row density: personal/recent/team/announcement shared `.project-list-page` (title 13/22, row pad 4×8, toolbar/open button 28); announcement `notice-row` gap 8; no Title level4 + List `large` + notice gap12
- ✅ Project list toolbar micro spacing: `.project-list-page__toolbar` Space gap 8 + search control height 28 (no antd default 32 inflating to 34); button padX 8; `data-testid=project-list-toolbar`; hit target/keyboard not weakened
- ✅ Team member toolbar micro spacing: `.group-user-list__toolbar` mb8 + Space gap 8 + search/button height 28; button padX 8; no mb16 + Search default 32; `data-testid=group-user-toolbar`; hit target/keyboard not weakened
- ✅ Group user group Title/left role tab micro spacing: `.group-setting-page` title 13/22·mb8; left tab padX12·height28·font12; no Title level4 + Space large + br + padX24; `data-testid=group-setting-page`; keyboard not weakened
- ✅ Group basic settings page header micro spacing: `.basic-setting-page` title 13/22·mt0·mb8; same file "Delete project" same tier; no Title level4; `data-testid=basic-setting-page`; keyboard/save not weakened
- ✅ Group basic settings Form micro spacing: `.basic-setting-form` item mb12 / Input·Select·button 28 / label 12; aligned `.setting-common-form`; no antd default 24/32; keyboard/save not weakened
- ✅ Group basic settings delete zone fragments: Divider 12 + body gap8 + secondary text 12/18; no Divider 24 + Space stacked title mb; `data-testid=basic-setting-delete-zone`; confirm/aria not weakened
- ✅ Share success meta / table list secondary dense: stage pad 6×10, meta gap2 / hint·description 12·16, description single-line ellipsis; table list title 12/18 + panel pad 6×10, row pad 3×8 (row height ∈20–26); default still collapsed; modal `.erd-io-modal` (body 8×12 / hint mb8 / link row mb10 / button 28); no 12×14 body / 8×12 stage outer loose well / Paragraph·Compact loose well; keyboard·revoke not weakened
- ✅ Home hero CTA cluster secondary dense: hero gap24 / mb·pb16; actions gap8; secondary 4×12 + button 4×10; stats mt12; no gap32·actions12 / secondary 6×14; primary CTA large + greeting ≥28 + Skip·Tab not weakened
- ✅ Home empty/announcement secondary dense: empty pad 24×12; secondary entry mb16; project area mb20; section header mb8; announcement pt4 / row pad4·gap10 / title 13; no 40×16 empty well / row 8×16; keep empty CTA + "More announcements"
- ✅ Designer secondary pane fragment density: `.erd-secondary-pane` (reverse / ERD·PdMan / advanced export DDL) pad 8×12 · Steps ≤10/12 · form 28; `ReverseTable` meta+table row secondary dense; `SyncConfig`→`.erd-io-modal`; settings hint mb8; no Steps 16/24 + Card mb16 + bare Modal
- ✅ Share invalid/empty state: invalid·revoked → `AuthBrandShell` (left dark brand panel + right "Share unavailable" + primary CTA "Open example demo"); no model/no tables → `ErdEmptyDiagram` + same CTA; no bare antd `Result` 403 split from login shell
- ✅ 404/403: unknown path / no permission → `AuthBrandShell` ("Page not found" / "Access denied" + same CTA); no bare `Result` split from three-shell tokens
- ✅ Post-import first screen: DBML import opens diagram directly + `fitView` (multi-table padding 0.08 / maxZoom 1.15, same density as read-only share); switch diagram/one-click layout same fill
- ✅ Competitor compare sub-page `/compare`: honest differentiation (collaboration/version/open/self-host); landing keeps summary table; no exaggeration, no dbdiagram clone narrative
- ✅ Home / Group / Design three shells share `erd-chrome-*`: top bar 64, `--erd-*` surfaces; no full-page Watermark / shields badge clutter
- ✅ Workspace shell outer well secondary dense: HomeLayout shell 12×16×10 / body 12×16 / footer 10×6; GroupLayout content·body 12×16; list empty 12×8; no shell 24 + body 20 stacked with inner 8×12 double loose well; Skip/top bar 64 not weakened
- ✅ Account BaseView left/right column secondary dense: form/avatar column gap 16 (narrow 12); no gap24; form items/controls 28 unchanged; Skip/save not weakened
- ✅ Top bar `erd-chrome-actions` secondary dense: gap 12 (Design override 8); no gap16; top bar 64 / brand·user menu hit / Skip not weakened
- ✅ Top bar `erd-chrome-header` secondary dense: padX 16 + brand–nav gap 12 (Design gap8 / right well 16); no padX20 / gap16; top bar 64 / Skip not weakened
- ✅ Home horizontal nav Menu item secondary dense: padX 12 (8–12 family); no padX16; item height 64 / hit width ≥44 / Skip·keyboard not weakened
- ✅ Group sidebar nav row spacing secondary dense: item height 28 / padX 12 / marginY 2 / font 12 (same tier as account left nav); no height 40 + pad 24·16; hit ≥28 / Skip·keyboard not weakened
- ✅ Designer sidebar nav row spacing secondary dense: `.design-layout__sider-menu` item height 28 / padX 12 / marginY 2 / font 12 (same tier as Group sidebar); version/import/export/settings same source; no height 40 + pad 24; hit ≥28 / `menuitem` keyboard not weakened; `testid=design-layout-sider-menu`
- ✅ Home single composition: hero CTA cluster + project grid anchor; no quick-action vertical Chinese tiles / stale announcement placeholder; nav selected uses brand
- ✅ Designer dropdown uses antd `Menu`/`Dropdown` `items`: single-line title, compact density (`.erd-dense-menu` ~28); popover external; no "large icon+subtitle" card items; no default ~40 loose items; submenus must not cross-wire (export≠import)
- ❌ Workspace shell 24×24 + body 20×24 / Group 24+20, stacked with inner 8×12 double loose well (historical issue)
- ❌ Account BaseView form/avatar column gap24, different tier from shell 12×16 secondary dense (historical issue)
- ❌ Top bar `erd-chrome-actions` gap16, vs brand gap8 / Design gap8 too loose (historical issue)
- ❌ Top bar `erd-chrome-header` padX20 + brand–nav gap16, vs shell 12×16 / actions gap12 too loose (historical issue)
- ❌ Home horizontal Menu item padX16, vs top bar 8–12 family too loose (historical issue)
- ❌ Group sidebar Menu height 40 / pad 24·16 / marginY4, vs account left nav 28·12 and 8–12 family too loose (historical issue)
- ❌ Designer sidebar Menu height 40 + default pad, vs Group sidebar 28·12 and 8–12 family too loose (historical issue)
- ❌ Team member toolbar mb16 + Search default 32, vs project list toolbar 28 / 8–12 family too loose (historical issue)
- ❌ Group user group Title level4 + Space large + br + left tab padX24·height38, vs 13/22·28 / 8–12 family too loose (historical issue)
- ❌ Welcome empty inner well pad 32×24 / title 20/mt14·lh≈26 (and earlier mt20 / 22 font) + hero 220, covering first-screen scan (historical issue)
- ❌ AuthBrandShell brand/form pad 32×28 / 48×40 + gap20 loose well, break from welcome secondary dense/chrome (historical issue)
- ❌ AuthBrandShell form Title mt10 + Form item mb24 + `size=large`≈40, break from `.setting-common-form` 12/28 (historical issue)
- ❌ Landing secondary 4.5rem section + 0.85 compare row / compare header loose spacing, break from AuthBrandShell secondary dense (historical issue)
- ❌ Share success meta gap4 / stage 8×12 + table list 8×12·13 title / modal Paragraph 12·Compact 16, break from LandingChrome secondary dense (historical issue)
- ❌ Home hero actions gap12 / secondary 6×14 / hero 32·20 loose well, break from share success secondary dense (historical issue)
- ❌ Home empty 40×16 + announcement row 8×16 / section 32 bottom loose well, break from hero CTA secondary dense (historical issue)
- ❌ Designer secondary reverse Steps 16/24 + entity table Card mb16 / advanced export DDL no shell / SyncConfig bare Modal, break from setting/export secondary dense (historical issue)
- ❌ Canvas one Ant blue set, Home one brand red — screenshot doesn't look like same product (historical issue)
- ❌ Project "Export" pops reverse/PdMan import items beside it (historical issue)
- ❌ Post-import multi-table laid in grid by index, association lines cross like yarn ball (historical issue)
- ❌ Association fields no FK marker, edges no arrowheads — screenshot looks like whiteboard lines (historical issue)
- ❌ Table header scattered `#f3f5f7`, fields blur into block with no row boundaries (historical issue)
- ❌ Vertically stacked same-column tables still fixed right-source left-target, edges loop big circle (circle-route, historical issue)
- ❌ Frame / command palette scattered Ant blue light fill (`#f0f5ff` / `rgba(37,99,235)`, historical issue)
- ❌ Edge label same color as canvas sunk + whole 0.94 opacity + ink400 — cardinality unreadable in screenshot (historical issue)
- ❌ After dense graph trunk bundling, cardinality chip still at longest segment midpoint (historical issue)
- ❌ MiniMap default white `#fff` on sunk canvas white block (historical issue)
- ❌ Controls default `#fefefe` loose column (content-box 26px) split from sunk canvas; four buttons equal weight no primary (historical issue)
- ❌ Canvas toolbar scattered outline buttons + `padding: 5px 12px` loose buttons, primary action lost in screenshot (historical issue)
- ❌ Empty state panel `padding: 28px 32px` loose card covering first screen (historical issue)
- ❌ Empty state panel `margin-top: min(10vh, 88px)` first-screen top too loose (historical issue)
- ❌ Empty state title mt16 / desc mb18 vertical rhythm loose well (historical issue)
- ❌ Command palette input height 48 / row pad 10×12 loose card, different tier from 22 chrome (historical issue)
- ❌ Command palette no-match empty pad 16×12 + list pad 4, different tier from row pad 6/8 / 22 chrome (historical issue)
- ❌ Entity create modal default 520 wide + Form 24 spacing loose card, different tier from 22 chrome (historical issue)
- ❌ Import/export Modal default head/footer loose spacing + large controls, different tier from 22–28 chrome (historical issue)
- ❌ Import/export modal Steps only mb12, title default font size, break from secondary Steps ≤10/12 (historical issue)
- ❌ Left tree default ~28 row height + 16 toolbar loose spacing, different tier from 22 chrome (historical issue)
- ❌ CommonTabs bar 40px + table design header 10×16 loose spacing, different tier from 22 chrome (historical issue)
- ❌ Version list 8×12 loose row + 16 title / toolbar 28 + rgba fragment colors, different tier from 22–28 chrome / `--erd-*` (historical issue)
- ❌ Version list empty pad 16×12, vs workspace list empty 12×8 / 8–12 family too loose (historical issue)
- ❌ Work order/approval default Table loose row + `marginBottom:16` title, different tier from 22–28 chrome (historical issue)
- ❌ JExcel datatables header pad10/row pad8 + `#fbf8fb` zebra / version diff fragment hex, different tier from 22–28 chrome / `--erd-*` (historical issue)
- ❌ Metadata apply CodeTab/DbTab default antd loose tabs + font 11, different tier from CommonTabs ~24 (historical issue)
- ❌ Common export page 16 pad + Title level4 loose card / icons bare `#DE2910`, different tier from 22–28 chrome / `--erd-*` (historical issue)
- ❌ Home / Group nav icons hardcoded `#DE2910`, split from DesignLayout `erdColors.brand` (historical issue)
- ❌ dataTypeDomains tree icons hardcoded `#DE2910`, split from `erdColors.brand` (historical issue)
- ❌ Settings page default Form 24 spacing + large controls, different tier from 22–28 chrome (historical issue)
- ❌ Account settings 20 title + 14 loose row / Home project card 16×18 pad, different tier from 22–28 chrome (historical issue)
- ❌ License type bare `Result` + hardcoded `#DE2910`, split from account settings density / `--erd-*` (historical issue)
- ❌ Announcement row title↔time gap12, vs row pad 4×8 / 8–12 family too loose (historical issue)
- ❌ Personal/recent/team/announcement list Title level4 + List large loose row, different tier from 22–28 chrome (historical issue)
- ❌ Share page hint 13px + 12 spacing / description no ellipsis stealing canvas height (historical issue)
- ❌ Share expanded table list 16 pad + 14 title + antd default loose row, different tier from 22–28 / project-list (historical issue)
- ❌ Share invalid page bare `Result` 403, split from login `AuthBrandShell` / three-shell tokens (historical issue)
- ❌ 404/403 bare `Result`, split from login / share invalid `AuthBrandShell` (historical issue)
- ❌ Table selected a18, Frame selected a12 halo split (historical issue)
- ❌ Workspace full watermark + GitHub stars external image, template face covering product feel (historical issue)

---

## Review checklist

Before submitting a UI-related PR, ask yourself:

1. What will the user see when an operation fails?
2. Can this operation be done with the keyboard?
3. Can this modal be replaced with inline/right-click?
4. Does a first-time user know where to click on this page?
5. Can mistaken actions be undone? Do dangerous actions have confirmation?
6. Do places that wait more than 300ms show a loading state?
