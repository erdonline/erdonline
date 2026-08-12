# Site-Wide Control Matrix (Single Source of Truth)

> Serves P2b "site-wide control closure". Update this table at the end of each wave.  
> Status: ✅ E2E/automation coverage exists · 🚧 open, pending closure · 🗑 trimmed/pending removal · 📋 deferred  
> Collection: run manually `frontend/tests/e2e/control-inventory.spec.ts` (skipped by default, not in CI).

## Wave Index

| Wave | Scope | roadmap |
|---|---|---|
| W0 | HomeLayout / GroupLayout child route shells | ✅ |
| W1 | Acquisition & session (login/register/logout/avatar) | ✅ |
| W2 | Project surfaces (home / person / group / recent / new) | ✅ |
| W3 | Designer core (model tree / relation diagram / project menu) | ✅ |
| W4 | Version time machine (versions / work orders / approvals) | ✅ |
| W5 | Import/export + data sources | ✅ |
| W6 | Perimeter trim (dataDomain/query/ChatSQL/account/placeholders) | ✅ |

---

## W0 — Layout Shell

| Surface | Control | Expected closure | Related flow | Status | Verification |
|---|---|---|---|---|---|
| HomeLayout | Child route content area | Renders `props.children`; main content visible (not slogan only) | Home routes such as `/home` | ✅ | `layout-outlet.spec` `/home` |
| HomeLayout | Top bar actions | `homeRightContent` (WeChat official account/GitHub); no SaveStatus / presence / read-only share | `/home` | ✅ | `layout-outlet.spec` `/home` |
| GroupLayout | Child route content area | Same as above | `/project/group/setting/*` | ✅ | `layout-outlet.spec` basic |
| DesignLayout | `props.children` | Designer main area renders | Correctly wired | ✅ | `smoke` / `relation` / `loading` |

---

## W1 — Acquisition & Session

| Surface | Control | Expected closure | Related flow | Status | Verification |
|---|---|---|---|---|---|
| `/login` | Sign-in button | Success navigates to `/home`; invalid credentials show one clear message | JWT session | ✅ | `smoke` "invalid credentials" / "login→create" |
| `/login` | Register link | Navigates to `/register` | Conversion funnel | ✅ | `session.spec` "go to register" |
| `/login` AuthBrandShell | Skip + Tab order + Enter | First Skip "Skip to sign-in form" → form; username→password→sign in→footer; Enter submits; focus-visible; no trap | ADR-0016 keyboard facade | ✅ | `session` "login shell keyboard" |
| `/login` AuthBrandShell | Secondary density | Brand/form pad ≤20×16; gap ∈[8,12]; header mb ∈[8,12]; form Title mt≤8; item mb∈[8,16]; controls ∈[24,32]; title ≥24; hero ≤180; ~40% panel | ADR-0016 density | ✅ | `smoke` "login page render" |
| `/register` AuthBrandShell | Skip + Tab order + Enter | First Skip "Skip to registration form" → form; field chain (tip out of order)→register→footer; Enter validates; focus-visible; no trap | ADR-0016 keyboard facade | ✅ | `session` "register shell keyboard" |
| `/register` AuthBrandShell | Secondary density | Same as login: pad 20×16 + gap12 + header mb12 + form body 12/28; "go to register" + register keyboard densify | ADR-0016 density | ✅ | `session` "go to register" + "register shell keyboard" |
| `/s/*` invalid gate | Secondary density | Brand/form pad same as above; header mb ≤20; keyboard cases unchanged | ADR-0016 density | ✅ | `share` "invalid token" |
| `/` LandingChrome | Skip + Tab order | First Skip "Skip to main action" → `#landing-main-cta`; try demo→register→login; focus-visible surface; no trap | ADR-0016 keyboard facade | ✅ | `landing` "landing page keyboard" |
| `/` LandingChrome | Secondary density | Below-fold section pad ≤52; comparison row ≤12; nav ≤20; footer ≤36; hero brand text ≥36 + full width | ADR-0016 density | ✅ | `landing` "load visible brand" |
| `/compare` LandingChrome | Skip + Tab order | Same shell Skip→ `#landing-main-cta`; open demo→self-host→back to home; surface focus-visible; no trap | ADR-0016 keyboard facade | ✅ | `compare` "compare page keyboard" |
| `/compare` LandingChrome | Secondary density | compare hero ≤36; section ≤52; comparison row ≤12; eyebrow ≥22; nav ≤20 | ADR-0016 density | ✅ | `compare` "load comparison table" |
| `/s/*` success meta/table list | Secondary density | meta ≤60 / gap≤2 / stage≤6; table list pad≤6·title≤12·row∈20–26; collapsed by default | ADR-0016 density | ✅ | `demo` "guest /demo" |
| Read-only share Modal | Secondary density | `.erd-io-modal` body≤8; hint mb≤8; link row mb≤10; input ~28; keyboard no regression | ADR-0016 density | ✅ | `share-project-keyboard` |
| HomeLayout `/home` | Skip + Tab order | First Skip "Skip to main content" → `#home-main-content`; continue modeling→create→example→secondary entries→project cards; brand focus-visible; no trap | ADR-0016 keyboard facade | ✅ | `home-keyboard` "Home keyboard" |
| `/home` hero CTA | Secondary density | actions gap ≤8; secondary button pad ≤4×10; hero gap ≤24 / mb·pb ≤16; primary CTA ≥40; greeting text ≥28 | ADR-0016 density | ✅ | `home-keyboard` densify |
| `/home` empty state/announcements | Secondary density | empty state pad ≤24×12; secondary entry mb ≤16; project area mb ≤20; announcement pt ≤4 / row pad ≤4·gap ≤10 / title ≤13; CTA preserved | ADR-0016 density | ✅ | `home-keyboard` empty/announce densify |
| HomeLayout / GroupLayout outer well | Secondary density | shell/content pad ≤12×16; body ≤12×16; list empty state ≤12×8; forbid 24/20; Skip/top bar not weakened | ADR-0016 density | ✅ | `layout-outlet` shell densify |
| `/account/settings` BaseView | Secondary density | form/avatar column gap ≤16 (narrow ≤12); forbid 24; form items/controls 28 unchanged; Skip/save not weakened | ADR-0016 density | ✅ | `account-settings` densify |
| Three-shell top bar `erd-chrome-actions` | Secondary density | Home/Group/share gap ≤12; Design ≤8; forbid 16; top bar 64 / Skip·user menu not weakened | ADR-0016 density | ✅ | `layout-outlet` densify |
| Three-shell top bar `erd-chrome-header` | Secondary density | padX ≤16; brand–nav gap ≤12 (Design ≤8); forbid 20/16; top bar 64 / Skip not weakened | ADR-0016 density | ✅ | `layout-outlet` densify |
| Home horizontal nav Menu | Secondary density | item padX ∈[8,12]; item height 64; hit width ≥44; forbid padX16; Skip/keyboard not weakened | ADR-0016 density | ✅ | `layout-outlet` + `home-keyboard` |
| Group sidebar nav Menu | Secondary density | item height ∈[28,32]; padX ∈[8,12]; marginY ≤4; forbid height40/pad24; Skip/keyboard not weakened | ADR-0016 density | ✅ | `layout-outlet` + `group-keyboard` |
| DesignLayout sidebar nav Menu | Secondary density | item height ∈[28,32]; padX ∈[8,12]; marginY ≤4; forbid height40/pad24; version/import/export/settings same source; `menuitem` keyboard not weakened | ADR-0016 density | ✅ | `layout-outlet` densify + sidebar keyboard |
| Project list toolbar | Fragment density | Space gap ∈[8,12]; search/button height ≤28; toolbar height ≤32; forbid Search default 32; keyboard not weakened | ADR-0016 density | ✅ | `project-surface` densify + `project-list-keyboard` |
| `/project/notice` announcement row | Fragment density | `.project-list-page__notice-row` gap ∈[8,12] (target 8); row pad ≤4×8; forbid gap12; toolbar not weakened | ADR-0016 density | ✅ | `project-notice` densify |
| Canvas empty-state CTA `.erd-empty-cta` | Fragment density | pad ∈[8,12] (target 10×12); primary CTA hit ∈[26,28]; forbid 14×18; Auth logo / welcome pad not weakened | ADR-0016 density | ✅ | `relation` "empty state layout" |
| Canvas empty-state silhouette `ErdEmptyDiagram` compact | Fragment density | width **112** (was 132); ∈[96,120]; forbid ≥132; hero 176 / Auth logo / welcome pad not weakened | ADR-0016 density | ✅ | `relation` "empty state layout" |
| Canvas empty-state panel `.erd-empty-panel` | Fragment density | mt ≈ min(8vh,64) and ∈[32,64]; forbid min(10vh,88); CTA pad / Auth logo / welcome pad not weakened | ADR-0016 density | ✅ | `relation` "empty state layout" |
| Canvas empty-state vertical rhythm title/desc | Fragment density | title mt ≈8∈[6,10]; desc mb ≈12∈[8,12]; desc mt≤8; forbid legacy 16/18; Auth logo / welcome pad / CTA pad / panel top spacing not weakened | ADR-0016 density | ✅ | `relation` "empty state layout" |
| Canvas empty-state secondary links `.erd-empty-links` | Fragment density | mt ≈10∈[8,12]; Controls 22/pad0 already dense, unchanged; forbid links mt>12; Auth logo / welcome / CTA / panel / title·desc not weakened | ADR-0016 density | ✅ | `relation` "empty state layout" + "Controls" |
| Team member toolbar | Fragment density | mb≤8; Space gap ∈[8,12]; search/button height ≤28; toolbar height ≤32; button padX∈[8,12]; forbid Search default 32 / mb16 | ADR-0016 density | ✅ | `group-layout-nav` densify + `group-keyboard` / `add-user-keyboard` |
| Group user-group page header/left role tabs | Fragment density | title ≤14·lh≤24·mb≤8·mt≤4; title→tab ≤12; left tab padX∈[8,12]·height∈[28,32]·text≤13; forbid Title level4 / Space large / padX24 | ADR-0016 density | ✅ | `group-layout-nav` densify + `group-keyboard` / `add-user-keyboard` |
| Group basic settings page header | Fragment density | title ≤14·lh≤24·mb≤8·mt≤4; title→form ≤12; forbid Title level4 | ADR-0016 density | ✅ | `group-basic-setting` densify + `group-layout-nav` / `group-keyboard` |
| Group basic settings Form | Fragment density | item mb∈[8,16] (target 12); Input/Select/button height∈[24,32] (target 28); label≤13; forbid antd default 24/32 | ADR-0016 density | ✅ | `group-basic-setting` densify + `group-layout-nav` / `group-keyboard` |
| Group basic settings delete zone | Fragment density | Divider mt/mb∈[8,16] (target 12); body gap∈[4,12] (target 8); secondary text≤13/lh≤20; title mb≤2; forbid Divider24 + Space stacked mb | ADR-0016 density | ✅ | `group-basic-setting` densify + `group-project-delete-keyboard` |
| DesignLayout secondary pane | Fragment density | `.erd-secondary-pane` pad ≤8×12; Steps mt/mb ≤10/12; settings hint mb ≤8; SyncConfig→`.erd-io-modal`; forbid 16/24 Steps | ADR-0016 density | ✅ | `designer-secondary-pane` densify |
| Import/export Modal Steps | Secondary density alignment | `.erd-io-modal__steps` mt/mb ≤10/12; title ≤13; same tier as secondary pane; keyboard no regression | ADR-0016 density | ✅ | `reverse-database-keyboard` + `export-ddl-keyboard` densify |
| Import/export Modal header/body/footer | Fragment density | `.erd-io-modal` header/body/footer pad ≤8×12 (forbid header 10×14×8 / footer 8×14 / body 12×14); title ≤14·lh≥20; footer buttons ≥28; keyboard no regression | ADR-0016 density | ✅ | `dbml-import` + `dbml-export` densify |
| EntityModal header/body/footer | Fragment density | `.erd-entity-modal` header/body/footer pad ≤8×12; width≤420; title ≤14·lh≥20; input/OK ≥28; keyboard no regression | ADR-0016 density | ✅ | `relation` "entity create modal density" |
| GroupLayout `/project/group/setting/*` | Skip + Tab order | First Skip "Skip to main content" → `#group-main-content`; bypass top bar + sidebar; basic settings fields enter order; brand focus-visible; no trap | ADR-0016 keyboard facade | ✅ | `group-keyboard` "Group keyboard" |
| Project list `/project/{person,recent,group}` | Row Enter / Tab actions | stretched link removes dead card; Enter opens designer; Tab row actions reversible; row `:has` inset brand focus-visible; no trap | ADR-0016 keyboard list | ✅ | `project-list-keyboard` |
| Project action modals create/edit/delete | Open focus / Esc / Tab trap | create→type; edit→project name; delete→"Yes"; Esc returns to trigger; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `project-action-modals-keyboard` |
| Import/export modal DBML | Open focus / Esc / Tab trap | import→DBML text; export→export model; Esc returns to empty-state CTA / project menu; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `import-export-keyboard` |
| Import skip validation Modal.warning | Open focus / Esc·OK / Tab trap | second import all skipped→focus "Got it"; Esc/OK returns to "Parse and import" | ADR-0016 keyboard modal | ✅ | `import-skip-warning-keyboard` |
| Version action modals create/edit/delete/revert | Open focus / Esc / Tab trap | create/edit latest→version number; edit non-latest→description; delete/revert→"Yes"; Esc returns to trigger; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `version-action-modals-keyboard` |
| Version compare/detail diff Modal | Open focus / Esc / Tab trap | compare→"Initial version"; detail→"Export change list"; Esc returns to trigger; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `version-diff-keyboard` |
| Sync config/rebuild version Modal | Open focus / Esc / Tab trap | sync config→"Field increment"; rebuild version→"Version number"; Esc returns to trigger; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `version-sync-rebuild-keyboard` |
| Rebuild baseline second confirmation | Open focus / Esc / Tab trap | focus "Rebuild"; Esc cancels without persisting, returns to "Rebuild version" button; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `version-rebuild-confirm-keyboard` |
| Initialize baseline Modal | Open focus / Esc / Tab trap | focus "Version number"; Esc returns to trigger; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `version-init-keyboard` |
| Duplicate Modal | Open focus / Esc / Tab trap | focus "Project name"; Esc returns to trigger; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `project-copy-keyboard` |
| Data source settings Modal | Open focus / Esc / Tab trap | focus "Add data source"; Esc returns to "Project menu"; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `database-setup-keyboard` |
| Default items settings Modal | Open focus / Esc / Tab trap | focus "Default fields" Tab; Esc returns to "Project menu"; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `default-setup-keyboard` |
| Data source reverse parse Modal | Open focus / Esc / Tab trap | focus "Data source" Select; Esc returns to "Project menu"; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `reverse-database-keyboard` |
| Export DDL Modal | Open focus / Esc / Tab trap | focus "Data source" Select; Esc returns to "Project menu"; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `export-ddl-keyboard` |
| Parse ERD file Modal | Open focus / Esc / Tab trap | focus upload area "Select ERD file"; Esc returns to "Project menu"; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `reverse-erd-keyboard` |
| Parse PdMan file Modal | Open focus / Esc / Tab trap | focus upload area "Select PdMan file"; Esc returns to "Project menu"; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `reverse-pdman-keyboard` |
| Change password Modal | Open focus / Esc / Tab trap | focus "Password"; Esc returns to trigger; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `reset-password-keyboard` |
| Change password failure | Business code failure / retry | readable toast; failure keeps modal open; retry success closes modal; no stacked modals | zero silent failure | ✅ | `reset-password-failure` |
| Sync config failure | Business code failure / retry | only code===200 writes store + "Settings saved" closes modal; failure toast readable; modal stays open, retryable | zero silent failure | ✅ | `sync-config-failure` |
| Default items settings failure | Business code failure / retry | only code===200 writes store + "Settings saved" closes modal; failure toast readable; modal stays open, retryable | zero silent failure | ✅ | `default-setup-failure` |
| Data source settings confirm failure | Business code failure / retry | only PUT success "Saved successfully!" closes modal; failure toast readable; modal stays open, retryable | zero silent failure | ✅ | `database-setup-failure` |
| EntityModal persist failure | Business code failure / retry | only save code===200 writes store+toast+closes modal; failure toast readable; modal stays open, retryable | zero silent failure | ✅ | `entity-modal-failure` |
| Canvas relation diagram modal persist failure | Business code failure / retry | only save code===200 writes store+toast+closes modal; failure toast readable; modal stays open, retryable | zero silent failure | ✅ | `diagram-modal-failure` |
| Canvas table header rename persist failure | Business code failure / retry | only save code===200 writes store+exits edit; failure toast readable; draft/node id preserved, retryable | zero silent failure | ✅ | `table-rename-failure` |
| Canvas create table/inline add field persist failure | Business code failure / retry | only save code===200 adds to canvas/closes create edit; failure toast; no node or draft retryable; empty name toast/empty field CTA preserved | zero silent failure | ✅ | `canvas-create-field-failure` |
| Canvas field rename/delete field persist failure | Business code failure / retry | only save code===200 exits edit/removes row; failure toast; rename draft preserved; delete confirm modal keep (reject) can delete again | zero silent failure | ✅ | `canvas-field-rename-delete-failure` |
| Canvas delete table persist failure | Business code failure / retry | only save code===200 removes+"Table deleted successfully"; failure toast; node preserved; delete confirm modal keep (reject) can delete again | zero silent failure | ✅ | `canvas-delete-table-failure` |
| Left tree delete model/relation diagram persist failure | Business code failure / retry | only save code===200 removes+success toast; failure toast; tree/table preserved; delete confirm modal keep (reject) can delete again | zero silent failure | ✅ | `tree-delete-module-diagram-failure` |
| Left tree cut/paste table persist failure | Business code failure / retry | only save code===200 writes clipboard and remove/write+success toast; failure toast; no duplicate or table preserved; retryable; copy does not persist | zero silent failure | ✅ | `tree-cut-paste-failure` |
| Canvas drag table coordinates persist failure | Business code failure / retry | `commitDiagramGeometry` only save code===200 writes layout; failure toast; RF transform rolls back, can drag again | zero silent failure | ✅ | `canvas-drag-reposition-failure` |
| Canvas align/auto-layout persist failure | Business code failure / retry | `alignSelected`/`autoLayout`→`commitDiagramGeometry`; failure toast; RF rolls back, can click again | zero silent failure | ✅ | `canvas-align-layout-failure` |
| Frame rename/fit members persist failure | Business code failure / retry | `renameFrame`/`commitDiagramGeometry` persist; failure toast; rename draft preserved; fit members RF+store rollback; retryable | zero silent failure | ✅ | `canvas-frame-rename-bounds-failure` |
| Frame create/member add/remove persist failure | Business code failure / retry | `createFrame`/`addFrameMembers`/`removeFrameMembers` persist; failure toast; not added to canvas/members unchanged; add rejects close modal; retryable | zero silent failure | ✅ | `canvas-frame-members-failure` |
| Canvas connect edge create association persist failure | Business code failure / retry | `addAssociation` persist; failure toast; no edge added; can drag again to retry | zero silent failure | ✅ | `canvas-connect-edge-failure` |
| Canvas change edge cardinality persist failure | Business code failure / retry | `updateAssociationRelation` persist; failure toast; chip keeps original cardinality; can select again to retry | zero silent failure | ✅ | `canvas-cardinality-failure` |
| Canvas edge FK metadata | Constraint name / rules / failure retry | `updateAssociationFkMeta` persist; same old constraintName split edge sync rename; `erd-edge-constraint-name` | zero silent failure | ✅ | `canvas-fk-meta-edit` |
| Canvas field meta persist failure | Business code failure / retry | type/PK/NN/AI/hidden/browse PK: only save code===200 writes store; failure toast; edit draft rolls back; hidden does not exit | zero silent failure | ✅ | `canvas-field-meta-failure` |
| Table design JExcel field meta persist failure | Business code failure / retry | field tab PK/hidden etc.: only save code===200 writes store; failure toast + re-mount grid rolls back checkbox; retryable; canvas aligned | zero silent failure | ✅ | `jexcel-field-meta-failure` |
| Table design index tab persist failure | Business code failure / retry | add/unique checkbox etc.: only save code===200 writes store + success toast; failure toast + empty state/re-mount rollback; delete confirm failure rejects close; retryable; canvas UK | zero silent failure | ✅ | `jexcel-index-failure` |
| Table design index tab fields/expression | Text persist / failure rollback | "Fields/expression*" semicolon mix → `fields[]`; business code failure re-mount rollback; success shows `id;LOWER(…)` | zero silent failure | ✅ | `index-expression-edit` |
| Initiate SQL approval Modal | Open focus / Esc / Tab trap | focus "Approver"; Esc returns to trigger (parent detail still open); focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `sql-approval-keyboard` |
| Add member Modal | Open focus / Esc / Tab trap | focus "Select user"; Esc returns to trigger; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `add-user-keyboard` |
| Add member invite failure | Business code failure / retry | readable toast; failure keeps modal open; retry success closes modal; no stacked modals | zero silent failure | ✅ | `add-user-invite-failure` |
| Version init/rebuild save failure | Business code failure / retry | init failure keeps modal open, retryable; rebuild failure no fake success, no rebaseline | zero silent failure | ✅ | `version-save-failure` |
| Read-only share create failure | Business code failure / retry | readable toast; modal stays open; "Regenerate" retryable; no stacked modals; forbid disabled dead affordance | zero silent failure | ✅ | `share-create-failure` |
| Read-only share Modal | Open focus / Esc / Tab trap | focus "Share link"; Esc returns to trigger; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `share-project-keyboard` |
| Read-only share revoke confirmation | Open focus / Esc / Tab trap | focus "Revoke"; Esc cancels without revoking; outer share modal still open; focus returns to revoke button; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `share-revoke-keyboard` |
| Team project delete confirmation | Open focus / Esc / Tab trap | focus "Delete"; Esc cancels without deleting; focus returns to "Delete team project"; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `group-project-delete-keyboard` |
| Team member remove confirmation | Open focus / Esc / Tab trap | focus "Remove"; Esc cancels without removing; focus returns to "Remove member `{username}`"; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `group-user-remove-keyboard` |
| Approval action confirmation (approve/reject/revoke/re-approve) | Open focus / Esc / Tab trap | focus semantic OK; Esc cancels without persisting; focus returns to trigger; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `approval-action-keyboard` |
| Approval/work order SQL detail Modal.info | Open focus / Esc·OK / Tab trap | focus "Got it"; Esc/OK returns to "View SQL"; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `sql-detail-keyboard` |
| Import skip validation Modal.warning | Open focus / Esc·OK / Tab trap | focus "Got it"; Esc/OK returns to "Parse and import"; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `import-skip-warning-keyboard` |
| EntityModal create model/table/relation diagram | Open focus / Esc / Tab trap | create model focus "Name"; create table focus "Parent model"; Esc returns to trigger; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `entity-modal-keyboard` |
| Canvas create/rename relation diagram Modal | Open focus / Esc / Tab trap | focus "Relation diagram name"; Esc returns to trigger; focus cannot escape dialog; Esc disabled while submitting | ADR-0016 keyboard modal | ✅ | `diagram-modal-keyboard` |
| Canvas add to group Modal | Open focus / Esc / Tab trap | focus "Select group"; Esc returns to trigger; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `diagram-modal-keyboard` (same product source) |
| Canvas delete table confirmation | Open focus / Esc / Tab trap | focus "Delete"; Esc cancels without deleting; focus returns to trigger; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `canvas-delete-table-keyboard` |
| Canvas delete edge/delete group confirmation | Open focus / Esc / Tab trap | focus "Delete"; Esc cancels without deleting; focus returns to trigger; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `canvas-delete-edge-frame-keyboard` |
| Canvas delete field confirmation | Open focus / Esc / Tab trap | focus "Delete"; Esc cancels without deleting; focus returns to trigger; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `canvas-delete-field-keyboard` |
| Table design delete index confirmation | Open focus / Esc / Tab trap | focus "Delete"; Esc cancels without deleting; focus returns to trigger; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `table-index-delete-keyboard` |
| JExcel toolbar delete row confirmation | Open focus / Esc / Tab trap | focus "Delete"; Esc cancels without deleting; focus returns to trigger; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `jexcel-toolbar-delete-keyboard` |
| JExcel quick actions Modal.info | Open focus / Esc / Tab trap | focus "Got it"; Esc/OK returns to "Quick actions"; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `jexcel-grid-keyboard` |
| JExcel Escape backspace | Edit mode Esc / focus return | Esc discards cell draft; focus returns to `jexcel-grid`; tab stays open; forbid persist hidden textarea | ADR-0016 keyboard grid | ✅ | `jexcel-grid-keyboard` |
| Left tree delete model/table/relation diagram confirmation | Open focus / Esc / Tab trap | focus "Delete"; Esc cancels without deleting; focus returns to row "…actions"; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `tree-delete-keyboard` |
| Data source settings delete confirmation | Open focus / Esc / Tab trap | focus "Delete"; Esc cancels without deleting; focus returns to row delete button; outer config modal still open; focus cannot escape confirm dialog | ADR-0016 keyboard modal | ✅ | `database-setup-delete-keyboard` |
| Workbench databaseConfig delete/batch delete confirmation | Open focus / Esc / Tab trap | focus "Delete"; Esc cancels without deleting; focus returns to row delete button/batch delete button; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `database-config-delete-keyboard` |
| Version sync result Modal.success/warn | Open focus / Esc·OK / Tab trap; row binding | focus "Got it"; Esc/OK returns to "Sync"; clicking row "Sync" does not depend on hover; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `version-sync-result-keyboard` |
| Workbench databaseConfig Drawer | Open focus / Esc / Tab trap | focus "Connection name"; Esc returns to "New connection"/"Edit"; focus cannot escape dialog | ADR-0016 keyboard modal | ✅ | `database-config-drawer-keyboard` |
| `/404` AuthBrandShell gate | Skip + Tab order | First Skip "Skip to main action" → `#exception-main-cta`; open example→back to home; focus-visible brand; no trap | ADR-0016 keyboard facade | ✅ | `not-found` "404 shell keyboard" |
| `/403` AuthBrandShell gate | Skip + Tab order | Same as 404; deep link `/403` reachable | ADR-0016 keyboard facade | ✅ | `not-found` "403 shell keyboard" |
| `/s/:token` invalid gate | Skip + Tab order | First Skip "Skip to main action" → `#exception-main-cta` (`share-invalid-gate`); open example→back to home; focus-visible brand; no trap | ADR-0016 keyboard facade | ✅ | `share` "share invalid gate keyboard" |
| `/register` | Register submit | Success navigates to `/home`; may carry redirect | `share` autofork | ✅ | `session.spec` "register success"; `share` redirect |
| `/demo` | Redirect | → `/s/public-demo` read-only diagram + copy CTA | ADR-0007 | ✅ | `demo.spec` |
| `/s/:token` | Copy to my project | Not logged in→register redirect; logged in→fork | share fork | ✅ | `share.spec` |
| Avatar menu | Account center | → `/account/settings?selectKey=base` | account | ✅ | `session.spec` |
| Avatar menu | License info | → `selectKey=identification` | licence | ✅ | `session.spec` |
| Avatar menu | Sign out | `cache.clear()` returns to `/login` | `logout()` | ✅ | `session.spec` |
| DesignLayout top bar | GitHub stars link | External link `erdonline/erdonline` | community | ✅ | copy/link merged |
| DesignLayout top bar | Share button | Generates read-only link | ADR-0007 | ✅ | `share.spec` |
| DesignLayout top bar | Collaboration presence | Visible online list | ADR-0009 | ✅ | `presence.spec` |

---

## W2 — Project Surfaces (HomeLayout menu + `/project/*`)

### HomeLayout main navigation

| Surface | Control | Expected closure | Related flow | Status | Verification |
|---|---|---|---|---|---|
| HomeLayout menu | Home | → `/home` main content | W0 | ✅ | `layout-outlet` / `project-surface` |
| HomeLayout menu | Data models | → `/dataModels` | Project list alias surface | ✅ | `project-surface` |
| HomeLayout menu | Data query | `_defaultProps` removed; route kept for experimental deep links | exec ignores selected DS | ✅ | `home-data-query.spec` |
| HomeLayout menu | Data sources | → `/databaseConfig` | ADR-0008 / W5 | ✅ | `project-surface` / `adr0008` |
| HomeLayout menu | Community | External link GitHub Issues | community | ✅ | external link not tested |

### `/home` shortcuts

| Surface | Control | Expected closure | Related flow | Status | Verification |
|---|---|---|---|---|---|
| `/home` | Create model `home-link-new-project` | → `/project/person` | Empty-state create | ✅ | `activation` / `project-activation` |
| `/home` | Example project `home-link-example` | Creates example and opens designer with tables | 30s activation | ✅ | `activation.spec` |
| `/home` | Import model | → `/project/person` (guided) | Import in designer | ✅ | `project-surface` navigation same as person |
| `/home` | Recent projects | → `/project/recent` | | ✅ | `project-surface` |
| `/home` | Personal projects | → `/project/person` | | ✅ | `project-surface` / `smoke` |
| `/home` | Team projects | → `/project/group` | | ✅ | `project-surface` |
| `/home` | VIP/license badge | → account identification | | 📋 | Avatar menu already covers identification |

### Project list routes

| Surface | Control | Expected closure | Related flow | Status | Verification |
|---|---|---|---|---|---|
| `/project/person` | Empty state "Create" | Modal→create→visible in list | VIP/open-source unlimited count | ✅ | `project-activation` "create" |
| `/project/person` | One-click example | Example opens designer | | ✅ | `project-activation` / `activation` |
| `/project/person` | Project card open | Opens `/design/table/model?projectId=` | Dead link fixed | ✅ | `smoke` "login→create→designer" |
| `/project/person` | Delete project | After confirm, disappears from list; can create again | cache | ✅ | `smoke` cleanup path |
| `/project/recent` | List/open | Opens recent project in designer | | ✅ | `project-surface` |
| `/project/group` | Team project list/open | Opens designer or settings | permissions | ✅ | `project-surface` reachable; `empty-projectjson` |
| `/project/group` | Enter team settings | → `/project/group/setting/basic` | GroupLayout | ✅ | `layout-outlet` |
| `/project/notice` | Notification list | Home "More announcements"→readable list; failure toast; notice-row gap ≤8 | | ✅ | `project-notice.spec` |
| `/project/new` | (whole page) | redirect→`/project/person`; placeholder page removed | W2 create goes through person | ✅ | `project-surface` |
| `/dataModels` | Model list entry | Equivalent to project list, usable | | ✅ | `project-surface` |

---

## W3 — Designer Core

| Surface | Control | Expected closure | Related flow | Status | Verification |
|---|---|---|---|---|---|
| DesignLayout menu | Model | → `/design/table/model` | Relation diagram | ✅ | `relation` / `smoke` |
| `/design/table/model` | Tree "Relation diagram" `tree-open-relation` | Opens canvas tab | RF | ✅ | `relation.spec` |
| `/design/table/model` | Empty-state create table CTA | Table node appears | | ✅ | `relation` full journey |
| `/design/table/model` | Inline fields/connect/guards | Persists after refresh; chnname/defaultValue inline; delete field second confirmation (× / selected Delete·Backspace) | | ✅ | `relation` |
| `/design/table/model` | Table node "Index" `canvas-open-index` | Direct to table design index tab (`aria-selected`); can switch to fields then re-enter via canvas | | ✅ | `relation` "canvas open index tab" |
| `/design/table/model` | Index tab empty-state CTA `index-empty-add` | "Add first index"→ seed row + grid; no blank screen | | ✅ | `relation` "index tab empty-state CTA" |
| `/design/table/model` | Fields tab empty-state CTA `field-empty-add` | "Add first field"→ seed first defaultField / id + grid; no blank screen | | ✅ | `table-field-empty` |
| `/design/table/model` | Canvas empty table fields CTA `canvas-fields-empty` | "Add first field"→ inline create; after fields exist returns to "Add field" | | ✅ | `table-field-empty` |
| `/design/table/model` | Index tab add another row `index-add-row` | After index exists "+ Add another index"→ append seed row; no dead affordance | | ✅ | `relation` "index tab add another row CTA" |
| `/design/table/model` | Index tab delete `index-delete-N` | "Delete index `{name}`"→ Modal confirm before delete; cancel preserves; delete all returns to empty-state CTA; keyboard initial focus/Esc/Tab trap | | ✅ | `relation` "index tab delete second confirmation"+`table-index-delete-keyboard` |
| `/design/table/model` | JExcel toolbar delete `jexcel-toolbar-remove` | "Delete selected rows"→ Modal confirm before `deleteRow`; cancel preserves; unselected toast; keyboard initial focus/Esc/Tab trap | | ✅ | `relation` "JExcel toolbar delete second confirmation"+`jexcel-toolbar-delete-keyboard` |
| `/design/table/model` | JExcel toolbar/grid Tab order | 7 toolbar buttons Tab+Enter; `jexcel-grid` focusable; Shift+Tab no trap | | ✅ | `relation` "toolbar Tab reachable" |
| `/design/table/model` | JExcel Escape backspace / quick actions Modal | Edit mode Esc discards→focus back to `jexcel-grid`; quick actions focus "Got it"; Esc returns; Tab trap | ADR-0016 keyboard | ✅ | `jexcel-grid-keyboard` |
| `/design/table/model` | Table design fields tab draft write-back | Missing `name`/`typeName` → toast + abort write-back; all-empty draft discardable; Esc stops grid | | ✅ | `relation` "draft row not silently dropped" |
| `/design/table/model` | Table design index tab draft write-back | Missing `name`/`fields` (incl. `[]`/`";"` empty) → toast + abort write-back; Esc stops grid; re-enter index still there | | ✅ | `relation` "index tab: draft row not silently dropped" |
| `/design/table/model` | Table node "Fields" `canvas-open-field` | Direct to table design fields tab (`aria-selected` + `table-field-edit`); can switch to index then re-enter via canvas | | ✅ | `relation` "canvas open fields tab" |
| `/design/table/model` | Table node "Metadata" `canvas-open-code` | Direct to table design metadata application tab (`aria-selected` + `table-code-edit`); can switch to fields then re-enter via canvas | | ✅ | `relation` "canvas open metadata application tab" |
| `/design/table/model` | Table node "Triggers" `canvas-open-trigger` | Direct to table design triggers tab (`aria-selected` + `table-trigger-edit`); can switch to fields then re-enter via canvas | | ✅ | `relation` "canvas open triggers tab" |
| `/design/table/model` | Triggers tab edit existing row | Row "Edit" modal; structural change rebuilds DDL; persist-on-200; failure keeps modal open, retryable; focus name | zero silent failure | ✅ | `table-triggers` edit / edit persist failure |
| `/design/table/model` | Table header ✎ rename | Name updates; chnname dual-column inline | | ✅ | `relation` "rename" / "table header Chinese name" |
| `/design/table/model` | PK badge toggle | Cancel/restore | | ✅ | `relation` "PK" |
| `/design/table/model` | Tree delete table | Second confirmation; confirm `removeEntity` `persist:true` (only save success removes); failure modal keep | | ✅ | `smoke` cancel/confirm + `canvas-delete-table-failure` |
| `/design/table/model` | Tree delete model/relation diagram | Second confirmation; confirm `removeModule`/`removeDiagram` `persist:true`; failure modal keep; cancel preserves | | ✅ | `multi-diagram` "left tree delete relation diagram/model second confirmation"+`tree-delete-module-diagram-failure` |
| `/design/table/model` | Tree cut/paste table·model | `cut*`/`past*` `persist:true` (only save success writes clipboard and remove/write); failure preserved; copy does not persist | | ✅ | `tree-cut-paste-failure` |
| `/design/table/model` | Canvas drag table/drag frame coordinates | `commitDiagramGeometry` `persist:true`; only save success writes layout/bounds; failure RF rollback | | ✅ | `canvas-drag-reposition-failure` |
| `/design/table/model` | Canvas align/auto-layout | `commitDiagramGeometry` `persist:true`; only save success writes layout; failure RF rollback; fitView only on success | | ✅ | `canvas-align-layout-failure` |
| `/design/table/model` | Frame rename/fit members | `renameFrame`/`commitDiagramGeometry` persist; failure draft/RF rollback; "Members fitted" only on success | | ✅ | `canvas-frame-rename-bounds-failure` |
| `/design/table/model` | Frame create/member add/remove | `createFrame`/`add*Members`/`remove*Members` persist; failure not added to canvas/members unchanged | | ✅ | `canvas-frame-members-failure` |
| `/design/table/model` | Drag connect create association | `addAssociation` persist; failure no edge, retryable | | ✅ | `canvas-connect-edge-failure` + `relation` PK/FK |
| `/design/table/model` | Change edge cardinality | `updateAssociationRelation` persist; failure keeps original cardinality, retryable | | ✅ | `canvas-cardinality-failure` + `relation` PK/FK |
| `/design/table/model` | undo/redo | Can undo canvas operations | canvasHistory | ✅ | `relation` full journey Meta+z |
| `/design/table/model` | Delete edge | Delete → Modal confirm then `removeAssociation` `persist:true` (only save success removes); failure modal keep; cancel preserves | | ✅ | `relation` "canvas delete table/delete edge" "after delete edge refresh"+`canvas-delete-edge-frame-failure` |
| `/design/table/model` | Canvas delete table | Delete → Modal confirm then `removeEntity` `persist:true` (only save success removes); failure modal keep; cancel preserves; keyboard initial focus/Esc/Tab trap | | ✅ | `relation` "canvas delete table/delete edge second confirmation"+`canvas-delete-table-keyboard`+`canvas-delete-table-failure` |
| `/design/table/model` | Canvas delete group | Delete → Modal confirm then `removeFrame` `persist:true` (only save success removes); failure modal keep; deletes frame only, not tables | | ✅ | `diagram-frame` "delete group second confirmation"+`canvas-delete-edge-frame-keyboard`+`canvas-delete-edge-frame-failure` |
| DesignLayout | Project menu button | Dropdown opens | | ✅ | `project-menu.spec` |
| Project menu | All projects | → `/project/recent` | | ✅ | `project-menu` "all projects" |
| Project menu | Recent projects | Max 5 items; current ✓; click other item switches designer | | ✅ | `project-menu` "recent projects switchable" |
| Project menu | Version (moved to top bar) | Top bar "Version"→ version management; no "Version" in menu | | ✅ | `project-menu` "all projects…top bar version" |
| Project menu | Import→three items | Modal opens; closing dropdown does not block | | ✅ | `project-menu` "import" |
| Project menu | Export→five items | Visible; DDL opens | | ✅ | `project-menu` "export" |
| Project menu | Settings→data source settings | Modal opens | ADR-0008 | ✅ | `project-menu` "data source settings" |
| Project menu | Settings→default items settings | Opens + save success message | | ✅ | `project-menu` "default items" |
| DesignLayout | Autosave status | Top bar shows saving/saved; failure shows clickable "Save failed, click to retry" + single toast (offline no stacked modals) | P1 | ✅ | `relation.spec` "Saving…→Saved" + `save-failure` |
| DesignLayout | CommonTabs / table design tab bar | Bar height ~24; tab padX≤8/gap≤4; inner tab gutter≤2; label/close button not clipped; Tab focus-visible; Cmd+1/2/3 | ADR-0016 density | ✅ | `model-design-ux` "table design three tabs" "table design inner tabs" |
| DesignLayout | CommonTabs tab bar keyboard | ←/→ roving + Enter activate; close `aria-label=Close {table name}`; close tab focus returns; focus-visible; inner tabs same pattern | ADR-0016 keyboard facade | ✅ | `common-tabs-keyboard` |
| RF TableNode | Footer / empty table well chrome | Header pad≤6 / field minH20 already dense; add margin≤6 + minH≥22; open table design margin≤6×4 + btn minH≥22; empty table well pad≤6/gap≤4; `NODE_FOOTER_H` 28; persist no regression | ADR-0016 density | ✅ | `relation` "PK/FK" + `table-field-empty` "canvas empty table" |
| DesignLayout | Command palette/shortcuts | Cmd/Ctrl+K/F toggle; search table locate+highlight; ↑↓/aria-activedescendant; empty state "No matches" pad≤8×8 / list≤2; footer pad≤4×8; Esc returns; Tab trap | RF CommandPalette | ✅ | `relation.spec` "command palette" + "search table locate" |
| DesignLayout | Shortcut cheat sheet | `?` / toolbar "?"→ aria dialog "Shortcuts"; includes Cmd+1/2/3 table design tabs; density maxH≤360 / list 2×4 / row padY≤6; Esc + close button focusable; mutually exclusive with command palette | RF ShortcutHelp | ✅ | `relation.spec` "shortcut cheat sheet" |
| DesignLayout | Skip navigation | First Tab "Skip to model tree/main workspace"→ landmark focus; no trap | focus ring audit | ✅ | `relation` "designer Skip" |
| DesignLayout | Left tree toolbar density | Toolbar ≤32 / controls ∈24–28; icons not clipped; sider secondary density; create focus-visible | QueryTree toolbar + sider-inner | ✅ | `model-design-ux` "model tree" |
| DesignLayout | Version list secondary density | Toolbar controls ∈24–28; icons not clipped; token colors; create button focus-visible; keyboard modals no regression | version-page toolbar/list | ✅ | `version.spec` "version list row density" + `version-action-modals-keyboard` |
| DesignLayout | Version list empty well secondary density | Empty state pad ≤12×8; forbid 16×12; preserve "Save first version" CTA | version-empty / list empty-text | ✅ | `version.spec` "can add version without data source" |
| DesignLayout | Work order/approval list density | Title bar ~24; row pad 4×8; action buttons ∈22–28; icons not clipped; focus-visible; confirm keyboard no regression | approval-workorder-page | ✅ | `approval.spec` "work order/approval list row density" + `approval-action-keyboard` |
| DesignLayout | Secondary pane table density (JExcel / version diff) | JExcel toolbar ~24; header/row pad 4×8; icons not clipped; focus-visible; diff group header/row ~24 token colors; toolbar Tab / visual diff no regression | jexcel-root / version-diff-panel | ✅ | `model-design-ux` "table design JExcel row density" + `relation` "toolbar Tab" + `version.spec` diff |
| DesignLayout | Metadata application sub-tab density | CodeTab/DbTab bar ~24; labels not clipped; sub-tab Tab focus-visible; Cmd+1/2/3 no regression | erd-code-tab / erd-db-tab | ✅ | `model-design-ux` "metadata application sub-tabs" + `relation` "table design Cmd/Ctrl+1/2/3" |
| DesignLayout | Table design inner tab density | Fields/index/metadata bar ~24; labels not clipped; inner tab Tab focus-visible; Cmd+1/2/3 no regression | erd-table-design__tabs / #tableNav | ✅ | `model-design-ux` "table design inner tabs" + `relation` "table design Cmd/Ctrl+1/2/3" |
| DesignLayout | Table design tab body content secondary density | Side/bottom pad 6/4; hint ~24; JExcel not clipped; metadata tip dense; empty field CTA / empty name toast preserved | erd-tab-body-pad / erd-meta-ddl-hint | ✅ | `model-design-ux` "table design tab body secondary density" + `table-field-empty` |
| DesignLayout | Designer empty state secondary density | Fallback forbid marginTop:100; fields/index Empty margin-block 0 + pad flush tab-body; preserve CTA | erd-pane-empty / erd-table-*-empty | ✅ | `model-design-ux` "designer empty state secondary density" + `table-field-empty` |
| DesignLayout | Welcome empty state secondary density | pad 20×16; title 18/mt12·lh22; hero 176; reverse links + left tree create model | erd-welcome-empty / designer-welcome-empty(-inner) | ✅ | `model-design-ux` "welcome empty state secondary density" |
| DesignLayout | Context menu/tree action menu density | Item height ~28 (∈26–30); border-box + padY≤2; icons/copy not clipped; `role=menuitem`; arrow keys/Esc | `.erd-dense-menu` | ✅ | `model-design-ux` "context menu/tree action menu density" |
| DesignLayout | Left tree keyboard roving | Skip→↓ enter tree; arrow keys+Enter locate table/open relation; active brand ring; Tab into search no trap | QueryTree.focusKeyboard + handleSelect | ✅ | `relation` "left tree keyboard roving" |
| RF TableNode | Field browser Tab loop | Only selected table fields/add/open table design in order; inline micro button -1; no trap + focus-visible | keyboard modeling | ✅ | `relation` "field browser Tab loop" |
| RF canvas chrome | Controls / toolbar Tab; MiniMap out of order | Controls→toolbar; MiniMap `tabindex=-1`; Controls focus-visible | keyboard chrome | ✅ | `relation` "canvas chrome Tab order" |
| RF MiniMap | Panel chrome fragment spacing | 128×96 overview; margin ≈8∈[8,12]; sunken background; forbid RF margin15; Controls buttons/version toolbar unchanged | ADR-0016 density | ✅ | `relation` "MiniMap" + `demo` |
| RF Controls / toolbar Panel | Panel chrome fragment spacing | margin ≈8∈[8,12] (forbid RF default 15); buttons≤22; aligned with MiniMap; version toolbar/edge labels unchanged | ADR-0016 density | ✅ | `relation` "Controls" + `demo` |
| Edge cardinality Select / Entity Form | Control density lock | Select height≤28; item mb≤12; input/OK≤28; forbid revert to 32/24 | ADR-0016 density | ✅ | `relation` "PK/FK" + "entity create modal density" |
| RF node-level Tab | Selection gate; RF wrapper out of order | `nodesFocusable/edgesFocusable=false`; selected table/edge chip/Frame in order | keyboard modeling | ✅ | `relation` "canvas node-level Tab" |
| `/s/:token` share shell | Skip + Controls Tab | First Skip "Skip to relation diagram"→ stage; zoom in/out/fit reachable; MiniMap out of order; focus-visible; no trap | ADR-0016 keyboard facade | ✅ | `share` "share shell keyboard" |
| TableTab | Cmd/Ctrl+1/2/3 | Table design: fields / index / metadata application; does not intercept while typing; mounted only on table design tab | TableTab activatePane | ✅ | `relation` "table design Cmd/Ctrl+1/2/3" |
| DesignLayout | Left tree click table locate | Click table → switch relation diagram + select + fitView + flash; does not open table design | DataTable → pendingLocate + focusTable | ✅ | `relation.spec` "left tree click table" |
| `ProjectSortMenu` | Created time/last modified | Removed from Menu export | dead code | 🗑 | Code no longer exists (grep zero hits) |
| `ProjectFilterMenu` | Filter1/Filter2 | Removed from Menu export | dead code | 🗑 | Code no longer exists (grep zero hits) |
| `NavigationMenu` | (empty horizontal menu) | Removed from Menu export | | 🗑 | Code no longer exists (grep zero hits) |

---

## W4 — Version Time Machine

| Surface | Control | Expected closure | Related flow | Status | Verification |
|---|---|---|---|---|---|
| DesignLayout menu | Version management | → `/design/table/version/all` | | ✅ | `project-menu` / `version` / `loading` |
| `/design/table/version/all` | Add version (no data source) | New version visible in list | North Star | ✅ | `version.spec` "add" |
| `/design/table/version/all` | Back to model | → `/design/table/model?projectId=` | | ✅ | `version.spec` "back to model" |
| `/design/table/version/all` | Version detail diff | Add/delete/modify color-coded | | ✅ | `version.spec` "diff" |
| `/design/table/version/all` | Rename/delete version | List updates+toast; latest version number change succeeds; duplicate number toast and modal stays open | VersionHandle | ✅ | `version.spec` "rename and delete" |
| `/design/table/version/all` | Compare versions | Compare result visible | | ✅ | `version.spec` "visual diff" two-version compare (`version-compare-btn`→compare any version) |
| `/design/table/version/all` | Revert | Persists; model still reverted after refresh | | ✅ | revert persists; version/approval green |
| DesignLayout menu | My work orders | → `/design/table/version/order` empty-state guide | | ✅ | `approval.spec` |
| DesignLayout menu | My approvals | → `.../approval` empty-state guide | | ✅ | `approval.spec` |
| `/design/table/version/all` | Top bar "My work orders/My approvals" | Direct to order/approval page | W3 slice 3 | ✅ | `approval.spec` "submit work order entry" |
| `/design/table/version/all` | Version row "Submit work order" | Team not synced row → detail "SQL approval" visible | W3 slice 3 | ✅ | `approval.spec` "submit work order entry" |
| Work orders/approvals | Submit→approve/reject full flow | Status change visible | requires data | ✅ | `approval.spec`: API seed→UI reject toast→work order re-approve (approve=JDBC too heavy, not covered) |
| Work orders/approvals | Approve/reject/revoke/re-approve confirm keyboard | Focus primary action; Esc does not persist; Tab trap | ADR-0016 keyboard modal | ✅ | `approval-action-keyboard` |
| Work orders/approvals | SQL detail Modal.info keyboard | Focus "Got it"; Esc/OK returns to "View SQL"; Tab trap | ADR-0016 keyboard modal | ✅ | `sql-detail-keyboard` |

---

## W5 — Import/Export + Data Sources

### Sidebar import/export pages

| Surface | Control | Expected closure | Related flow | Status | Verification |
|---|---|---|---|---|---|
| `/design/table/import/reverse` | Reverse parse submit | Tables enter model | ADR-0006 | ✅ | `import-reverse.spec` (MySQL `reverse_demo`) |
| `/design/table/import/reverse` | Parse failure readable + retry | toast/page copy; "Re-parse" restores | ADR-0016 zero silent | ✅ | `reverse-parse-failure` (mock API) |
| `/design/table/import/pdman` | Upload PdMan | Model visible | | ✅ | `import-pdman.spec` |
| `/design/table/import/erd` | Upload ERD | Model visible | | ✅ | `import-erd.spec` |
| `ReverseERWin` | Parse ERWin file | Component removed; menu not wired | stub | 🗑 | Code no longer exists (grep zero hits) |
| `/design/table/export/common` | Export Markdown | File download | no G6 | ✅ | `export.spec` |
| `/design/table/export/common` | Export HTML/Word/ERD | Download or explicit failure | | ✅ | `export.spec` HTML+ERD |
| `/design/table/export/more` | Advanced export DDL | With source+tables can enter step 2 | ADR-0008 | ✅ | `project-menu` "DDL step 2" |
| `/design/table/export/more` | DDL final step download | Produces SQL file | | ✅ | `project-menu` "DDL download" |

### `/databaseConfig`

| Surface | Control | Expected closure | Related flow | Status | Verification |
|---|---|---|---|---|---|
| `/databaseConfig` | Create/save data source | POST dataSources; profile no password | ADR-0008 | ✅ | `adr0008-datasource.spec` |
| `/databaseConfig` | Test connection | Success/failure toast | | ✅ | `adr0008-datasource.spec` "test connection" |
| `/databaseConfig` | Edit/delete/batch delete | List updates+confirm; row inline aria | | ✅ | `adr0008-datasource` "edit save + delete confirm" |
| `/databaseConfig` | Delete/batch delete confirm keyboard | Focus "Delete"; Esc cancels without deleting; Tab trap | ADR-0016 keyboard modal | ✅ | `database-config-delete-keyboard` |
| `/databaseConfig` | Create/edit Drawer keyboard | Focus "Connection name"; Esc returns to trigger; Tab trap | ADR-0016 keyboard modal | ✅ | `database-config-drawer-keyboard` |
| `/databaseConfig` | Sync status button | ping + toast + badge update | | ✅ | `adr0008-datasource` "sync status" |
| `/databaseConfig` top bar | "Statistics" button | Removed (originally no onClick) | dead affordance | 🗑 | Top bar has no such button (only form "Need help?" copy) |
| `/databaseConfig` top bar | "Help" button | Removed (originally no onClick) | dead affordance | 🗑 | Top bar has no such button (only form "Need help?" copy) |

---

## W6 — Perimeter & Account

| Surface | Control | Expected closure | Related flow | Status | Verification |
|---|---|---|---|---|---|
| DesignLayout menu | Data domain | `_defaultProps` removed; route kept for experimental page | weak North Star | ✅ | `data-domain.spec`; deep link see "experimental features" |
| DesignLayout menu | Query | `_defaultProps` removed; route kept for experimental deep links | exec ignores selected DS | ✅ | `design-query.spec` |
| DesignLayout menu | Chat SQL | Sidebar hidden; route kept for experimental page | AI deferred | ✅ | W6 trim navigation |
| `/design/dataDomain` | In-page type domain tree | Experimental; do not expand main journey closure | | 📋 | Do not expand E2E editing |
| `/design/table/query` | In-page run/schedule | Experimental; failure has toast; do not expand real DS SELECT | | 📋 | Do not expand JDBC query console |
| `/design/table/chatsql` | In-page send etc. | Experimental; not North Star closure | | 📋 | Do not expand model |
| `/design/table/setting/defaultField` | Default fields save | toast + new tables get default fields; only code===200; failure rollback retryable | | ✅ | `default-field.spec` "edit save has toast"; `default-field-failure` |
| `/design/table/setting/dataType` | Logical type dictionary CRUD | `add`/`update`/`remove` `persist:true`; only save code===200; failure modal keep | | ✅ | `datatype-domains-failure` |
| `/design/table/setting/dataType` | Logical type apply dialect mapping | Modal "Database dialect mapping" edits `apply[code].type`; enum `buildEnumApply` | | ✅ | `datatype-apply-ux` |
| `/design/table/setting/dataType` | Create/edit type Modal keyboard | Focus "Type name"; Esc returns to trigger; Tab trap; Esc disabled while submitting | ADR-0016 keyboard modal | ✅ | `datatype-domains-keyboard` |
| Project menu / import secondary pane | ERD·PdMan·DBML / data source reverse submit | `setProjectJson`/`importReverseTable` persist; only save code===200; failure does not write store | | ✅ | `import-erd-failure` (file); `import-reverse` (happy) |
| Project menu→data source settings | Switch default data source Radio | `setDefaultDb` only save code===200; failure toast+list rollback | | ✅ | `default-db-failure` |
| Version row→revert | Confirm revert | Only save code===200 writes store+"Revert successful" closes modal; failure toast; modal stays open retryable; forbid setModules first | | ✅ | `version-revert-failure` |
| Default items settings→download template | `downloadWordTemplate` | Only non-empty ZIP(`PK`) blob saves; empty/JSON error body toast, no fake .docx | | ✅ | `word-template-download-failure` |
| Export file→export Word | `POST /doc/gendocx` | Same `docxBlobGate`; empty/JSON/non-ZIP toast, no fake download | | ✅ | `word-gendocx-download-failure` |
| `/design/table/setting/default` | System default items | Same as project menu default items | | ✅ | `project-menu` "default items settings" |
| `/dataQuery` | In-page run/CRUD | Experimental; failure has toast; do not expand real DS SELECT | | 📋 | Do not expand JDBC query console |
| `/account/settings` | Basic profile save | toast | | ✅ | `account-settings.spec` |
| `/account/settings` | Shell keyboard Skip/Tab | Skip→main form; fields→save; focus-visible; no trap | HomeLayout | ✅ | `account-settings-keyboard.spec` |
| `/account/settings` | "Change avatar" Upload | Changed to "Avatar upload not yet available" copy | | ✅ | W6 remove fake upload |
| `/account/settings` | Other selectKey tabs | Switchable with content | | ✅ | `account-settings.spec` avatar→security/identification |
| `/project/group/setting/basic` | Save basic settings | toast | GroupLayout/W0 | ✅ | `group-basic-setting.spec` |
| `/project/group/setting/permission` | Permission group maintenance | Members visible | access | ✅ | `group-layout-nav` "permission groups" |
| GroupLayout menu | Back to project list | → `/dataModels` | | ✅ | `group-layout-nav` "back/open" |
| GroupLayout menu | Open model | → designer | projectId | ✅ | `group-layout-nav` "back/open" |
| `/*` | 404 page | Unknown path friendly message | | ✅ | `not-found.spec` |

---

## Other Covered Cross-Cutting Concerns

| Surface | Control | Expected closure | Related flow | Status | Verification |
|---|---|---|---|---|---|
| Removed auth paths | `/login/success` etc. | No frontend page; backend unavailable | dead code cleanup | ✅ | `dead-auth-routes.spec` |
| Canvas large project | Viewport culling | Off-screen nodes not rendered | performance budget | ✅ | `canvas-scale.spec` |
| Collaboration sync | Remote change toast | info / warning + "Save version"→ version/all persist (≤1/min) | ADR-0009 | ✅ | `sync-toast.spec` (full path + throttle) |
| Loading skeleton | List/designer/version | `aria-busy` + accessible name | | ✅ | `loading.spec` |
| UX invariants | Dead affordance/credentials | Full journey screenshots + assertions | | ✅ | `ux-audit.spec` |
| Empty projectJSON | Team project add model | Can add model | | ✅ | `empty-projectjson.spec` |

---

## Statistics (v1 initial)

| Status | Row count |
|---|---|
| ✅ | 93 |
| 🚧 | 0 |
| 🗑 | 6 |
| 📋 | 6 |
| **Total** | **105** |

📋 Deferred (not in this phase): forum external link, VIP badge, dataDomain / query / chatsql / dataQuery.  
Vision loop: when matrix 🚧=0, prioritize actionable matrix 📋 or roadmap next 📋 (Issue seed / AI), see `scripts/agent-loop-vision.prompt.md`.
