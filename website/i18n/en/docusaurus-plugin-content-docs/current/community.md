# Community & good first issues

:::info Audience
For contributors who want to open a PR. To use the product, start with the [User guide](/docs/guide/what-is-erd-online).
:::

> Goal: let someone opening their **first PR merge a meaningful change within 2 hours**, raising contributor retention (the third layer of user value in our vision).

## Community entry points

The product surface consistently points to [GitHub Issues](https://github.com/erdonline/erdonline/issues) (questions, ideas, roadmap feedback). Maintainers should keep **Issues enabled for the public** (Settings → Features → Issues).

Background reading on canvas migration and contributor experience (distilled entry from long-form articles):

- The designer has completed G6 → ReactFlow Strangler (R0–R3); gaps are tracked in Issues — see [Roadmap](/docs/roadmap)
- How to write a good first Issue / PR: see good-first criteria below; repo root [CONTRIBUTING.md](https://github.com/erdonline/erdonline/blob/main/CONTRIBUTING.md)

| Label | Meaning |
|---|---|
| `good first issue` | Clear scope, verifiable locally, no deep architecture context needed |
| `help wanted` | External contributors welcome; may be slightly larger |
| `docs` / `frontend` / `backend` | Domain |
| `area:designer` / `area:share` / `area:reverse` | Sub-domain (optional) |

Issue title suggestion: `[good first] <one-line outcome>`. Body must include: **background / acceptance criteria / verification commands / related files**.

## Maintainer cadence (biweekly)

- [ ] Scan open Issues; tag qualified ones `good first issue` (keep **3–8** open)
- [ ] Once the canonical repo is ready: `REPO=owner/name ./scripts/seed-good-first-issues.sh` (drafts in `.github/ISSUE_DRAFTS/`)
- [ ] Close the Issue immediately after merge; link back in the PR description
- [ ] Call out merged beginner PRs in biweekly release notes (`docs/releases/`)
- [ ] Keep the docs site “Community” page in sync with this checklist (edit this file)

### Issue draft seeding rules

- Source files: `.github/ISSUE_DRAFTS/NN-*.md` (see `README.md` in the same directory)
- **Skip**: blockquotes starting with `> **已合入**` at line start only (other “merged” text in the body does not skip)
- **Target**: canonical repo always has **3–8** open `good first issue` items
- Dry-run: `DRY_RUN=1 REPO=owner/name ./scripts/seed-good-first-issues.sh`

## What makes a good first task

- Copy edits, add `aria-label` / `data-testid`, fix dead links, add unit test assertions
- Clear one eslint warn (with file path)
- Add one E2E journey (reuse existing helpers)
- Documentation examples with copy-paste commands

**Not suitable**: Security/OAuth changes, projectJSON core structure changes, large canvas protocol changes, vague UX with no repro steps.

## Seed task pool (open Issues directly)

Known low-risk debt in the current repo — copy acceptance criteria when opening Issues:

1. ~~**Docs site relative links**~~ (repo root paths now use absolute GitHub URLs; `./` same-dir links in `docs/` gated by `onBrokenLinks=throw`)
2. ~~**Login/register subtitle removes ChatGPT hype**~~ (merged; regression in `smoke.spec.ts`)
3. ~~**`presence.spec` project cleanup**~~ (merged `deleteOwnPersonProjects`)
4. ~~**Collab sync toast E2E**~~ (merged `sync-toast.spec.ts`; info path)
5. ~~**Frontend eslint warn targeted zero (configJsonSlice)**~~ (merged; other store files still claimable)
6. ~~**`databaseDomainsSlice` eslint warn zero**~~ (merged)
7. ~~**Collab sync warning toast E2E**~~ (merged `sync-toast.spec.ts`)
8. ~~**Backend create project default projectJSON**~~ (merged `ensureDefaultProjectJson` + unit test)
9. ~~**Remove OSS “upgrade to premium” CTA**~~ (merged; `dialog/upgrade` deleted)
10. ~~**`exportSlice` eslint warn zero**~~ (merged)
11. ~~**`profileSlice` eslint warn zero**~~ (merged)
12. ~~**`dataTypeDomainsSlice` eslint warn zero**~~ (merged)
13. ~~**Designer top bar Gitee star link update**~~ (merged → GitHub `erdonline/erdonline`)
14. ~~**Deleted social login path E2E**~~ (merged `dead-auth-routes.spec.ts`)
15. ~~**Footer/ChatSQL remove commercial “Lingdai Tech” copy**~~ (merged; footer `ERD Online · MIT`)
16. ~~**`entitiesSlice` eslint zero**~~ (merged; warn=0)
17. ~~**Designer “Project” menu wired**~~ (merged; data source settings opens)
18. ~~**`projectJsonSlice` eslint warn zero**~~ (merged; draft `06` marked done)
19. ~~**`useProjectStore` eslint warn zero**~~ (merged; draft `07` marked done)
20. ~~**`modulesSlice` eslint warn zero**~~ (merged; `src/store/project` eslint warn=0)
21. ~~**Project menu “Versions” entry**~~ (merged: navigates to version management + E2E)
22. ~~**Default settings save feedback**~~ (merged E2E “Settings saved”; draft `10`)
23. ~~**Version management page skeleton**~~ (merged; `loading.spec.ts`)
24. ~~**Model tree delete table confirm E2E**~~ (merged `smoke` cancel/confirm)
25. ~~**Import/export opens modal closes dropdown mask**~~ (merged)
26. ~~**Delete confirm primary button → “Delete”**~~ (merged; E2E `/删\s*除/`)
27. ~~**Sidebar and project menu “Versions” narrative aligned**~~ (merged)
28. ~~**Export DDL wizard button aria-label**~~ (merged)
29. ~~**ISSUE_DRAFTS README and seed checklist**~~ (merged; seed only recognizes line-start `> **已合入**`)
30. ~~**Version sort page eslint**~~ (merged)
31. ~~**canvasHistory remove any**~~ (merged)
32. ~~**Relation diagram edge hit area**~~ (merged `interactionWidth=24`)
33. ~~**Export DDL step 2 E2E**~~ (merged; ExportDDL aligned with ADR-0008)
34. ~~**community seed rules doc**~~ (merged this file “Seeding rules”)
35. ~~**PK badge toggle E2E**~~ (merged `relation.spec` “PK”)
36. ~~**Table header rename E2E**~~ (merged `relation.spec` “rename”)
37. ~~**Version management page eslint**~~ (merged)
38. ~~**ExportDDL remaining eslint**~~ (merged)
39. ~~**PageSkeleton aria-busy**~~ (merged)
40. ~~**json2code entry type narrowing**~~ (merged)
41. ~~**share.spec cleanup more stable**~~ (merged)
42. ~~**canvasHistory unit test**~~ (merged `yarn test:unit:canvas-history`)
43. ~~**Project menu closed-state CSS class**~~ (merged `erd-project-menu--closed`)
44. ~~**version/approval goto extract helpers**~~ (merged; rollback sync persists)
45. ~~**CHANGELOG Unreleased cleanup**~~ (merged: daily `### YYYY-MM-DD` + header maintenance convention; draft `32`)
46. ~~**Control matrix 🚧 rows**~~ (P2b matrix 🚧=0; remaining 📋 deferred, no blocking Issues)
47. ~~**Canvas “delete field” accessible button**~~ (merged; `relation.spec` “delete field”; draft `33`)
48. ~~**ReactFlow Controls Chinese aria**~~ (merged; `ZhControls` + `relation.spec` “Controls”; draft `34`)
49. ~~**ReactFlow MiniMap Chinese aria**~~ (merged; `ariaLabel="Canvas thumbnail"` + `relation.spec` “MiniMap”; draft `35`)
50. ~~**Canvas toolbar undo/redo/layout/align aria**~~ (merged; `relation.spec` “toolbar”; draft `36`)
51. ~~**Top bar SaveStatus aria-live**~~ (merged; `role="status"` + `aria-live="polite"`; `relation.spec` “save-status”; draft `37`)
52. ~~**Top bar CollabPresence aria-live**~~ (merged; `role="status"` + `aria-live="polite"`; `presence.spec`; draft `38`)
53. ~~**Command palette listbox semantics**~~ (merged; `role="listbox"` + empty state `aria-live`; `relation.spec` “command palette”; draft `39`)
54. ~~**`lint:js:ci` share page Array type + DataDomain hooks**~~ (merged; `yarn lint:js:ci` 0 error; `share.spec`)
55. ~~**Edit version number validation fail still closes modal**~~ (merged; `RenameVersion` `onFinish` returns false on failure; `version.spec` “rename”)

> Seed pool currently empty: a11y micro-slices paused. Word export removed MinIO hard dependency (classpath default template); real Word download E2E can be a separate slice. When seeding the canonical repo, pick new topics outside merged items.

## How contributors claim work

1. Comment “I’ll take this” on the Issue
2. Fork → `feat/...` branch → PR with template checked
3. Paste verification command results in the description per Issue instructions

See [CONTRIBUTING.md](https://github.com/erdonline/erdonline/blob/main/CONTRIBUTING.md).
