# ADR-0033: Application-wide i18n extraction conventions

- Status: **Accepted** (2026-08-12)
- Prerequisites: [ADR-0023](./0023-i18n-foundation.md) (i18n foundation: default zh-CN, `baseNavigator` first-visit match, backend error codes as source of truth)
- Related: [ADR-0034](./0034-locale-path-routing.md) (English SEO routes), [ADR-0005](./0005-ui-architecture.md) (Ant Design only)

## Context

Foundation is shipped: `src/locales/{zh-CN,en-US}.ts` each have 889 keys fully aligned; landing, compare, login/register, and share pages are 100% keyed. Remaining hardcoded Chinese concentrates in the application body (measured non-comment lines with Chinese): `pages/design` 612, `components` 565, `store` 352, `pages/JExcel` 96, `pages/databaseConfig` 86 — 1500+ sites total — to be extracted by **multiple agents in parallel**.

Three real parallel risks: merge conflicts on single giant files, inconsistent key naming/granularity, and treating **data** as **copy** (changes projectJSON semantics, introduces functional bugs). This ADR sets mechanically followable rules.

Key mechanism facts (`@umijs/plugins/dist/utils/localeUtils.js` `getLocaleList` + generated `.umi/plugin-locale/localeExports.ts`):

- Plugin globs **only two places**: `src/locales/*.{ts,js,json}` (non-recursive, filenames must match `xx-XX`) and **`src/pages/**/locales/*.{ts,js,json}`**. `src/components/**/locales/` and `src/store/**/locales/` are **not collected**.
- Same-language multiple files merge `{...A, ...B}`; `src/locales/` first, `pages/**` second — **latter overrides former** silently with no warning → key collision is a hidden incident; validation scripts must block it.

## Decision

### 1. Namespaces and file layout

| Code location | Copy location | Key prefix |
|---|---|---|
| `src/pages/<module>/**` | `src/pages/<module>/locales/{zh-CN,en-US}.ts` | `<module>.` (e.g. `design.`, `catalog.`, `databaseConfig.`) |
| `src/components/**`, `src/layouts/**` | `src/locales/{zh-CN,en-US}/components.ts` | `component.<Name>.` |
| `src/store/**`, `src/utils/**` | `src/locales/{zh-CN,en-US}/store.ts` | `store.<slice>.` / `util.<name>.` |
| Cross-module atomic words | `src/locales/{zh-CN,en-US}/common.ts` | `common.` |
| Existing auth / landing / locale keys | Keep in place; migrate into shards gradually | Do not rename keys |

`src/locales/zh-CN.ts` and `en-US.ts` become **aggregation barrels** (import + spread shards only; no direct keys); shards live under `src/locales/zh-CN/` and `src/locales/en-US/` subdirectories — those directory names are not `locales` and not under `pages`, so the plugin will not double-collect them.

Hard constraints:

- **One key defined in exactly one file**; key's first segment must equal that file's namespace (`design.*` only in `pages/design/locales/`). Both enforced by validation script to prevent spread override.
- Deep pages (e.g. `pages/design/table/`) do **not** get separate `locales/`; unify under module root `pages/design/locales/`, distinguish with second segment (`design.table.*`, `design.relation.*`). Parallel agent conflict surface = each module file.
- Shard files split by agent task boundary; one agent writes only its zh shard + matching en shard.

### 2. Key naming

`<namespace>.<scope>.<element>[.<state>]`, segments lowerCamel, **max 4 segments**. `<element>` is semantic, not literal copy (`design.table.field.deleteConfirm`, not `design.table.field.querenshanchu`).

Reuse rules:

- **Reusable** `common.*`: only **context-free atomic UI words**, closed whitelist — `common.ok` `common.cancel` `common.save` `common.delete` `common.edit` `common.close` `common.confirm` `common.yes` `common.no` `common.loading` `common.empty` `common.required` `common.copy` `common.search` `common.reset`. Expanding whitelist requires updating this table same iteration.
- **Must be independent keys**: any sentence with business nouns or tone, even if Chinese text matches today. Example: two "Save failed" → `design.project.saveError` and `store.version.saveError` separately (English: "Couldn't save the model." / "Couldn't save the version.").
- Anti-patterns: extract "Delete" as both `design.table.delete` and `design.relation.delete` (use `common.delete`); put contextual delete confirm in `common.deleteConfirm` (forbidden).

### 3. Non-React copy access

**Unified `getIntl()` (`@umijs/max` export), evaluated only inside functions at call time.**

- Top-level `const` copy / table columns / menu arrays → **factory functions**, called inside components (React passes `useIntl()` intl; non-React uses `getIntl()` internally).
- Deprecate the deprecated named `formatMessage` export; unify on `getIntl().formatMessage`.
- Backend errors follow ADR-0023: slices keep error code / raw message only; map to keys via `store.error.<code>`; **no** Accept-Language passthrough.

### 4. What not to extract

Do not extract if any applies: persisted/transmitted data; comparison/matching literals; comments/logs/test fixtures/templates. Default seeds in store slices are user data. Use `*.label` keys for display when raw values drive logic.

### 5. Variables and plurals

ICU placeholders only; no concatenation or split keys. zh/en placeholder name sets must match (script asserts).

### 6. Regression guards

**A.** `scripts/check-locale-keys.mjs` (`yarn i18n:check`): key parity, no cross-file duplicates, namespace match, ICU parity, no empty/TODO, en has no CJK.

**B.** `scripts/check-hardcoded-cjk.mjs`: ratchet on CJK literals in `frontend/src/**` with allowlist for seeds.

**C.** E2E: follow `e2e-locators.mdc` — no Chinese-only anchors.

### 7. English quality baseline

Glossary in `docs/i18n-glossary.md`; tone aligned with landing English; Sentence case buttons; errors state what happened + next step.

## Consequences

- Positive: parallel conflict surface per module; scripts block key drift; data/copy boundary explicit.
- Cost: aggregation barrels + shard dirs; ratchet maintenance.
- Risk: umi silent merge override — validation must land before bulk extraction.
