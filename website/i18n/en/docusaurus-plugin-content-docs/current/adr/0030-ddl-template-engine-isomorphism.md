# ADR-0030: DDL template engine (Freemarker end state + doT legacy bridge)

- Status: **Implemented** (2026-08-09, Freemarker end-state slice complete)
- Prerequisites: [ADR-0022](./0022-dual-layer-consistency.md) workspace↔version↔live DB; `docs/data-format.md` projectJSON `database[]` template fields

## Context

- projectJSON DDL templates use **doT.js** syntax (`defaultData.json`); historical frontend `json2code.ts` was used for preview/export.
- Version panel `/hisProject/diff` `ddl` **must** be generated authoritatively by the backend; frontend only renders API (ADR-0022 extension).
- Constraints: **JVM-native high performance / low memory**; **forbid** Nashorn/GraalJS/ScriptEngine embedding doT.js; **do not** maintain dual engines long term.
- Research conclusion: Handlebars dual-runtime loses isomorphic benefit once FE stops executing DDL; JVM throughput ~1/5 of Freemarker—**not** end state.

## Decision (end state)

### 1. Single authority: backend generates DDL

- **Version detail / compare, export, sync SQL** and other product paths: DDL **always** backend-generated.
- Frontend **forbidden** on product paths to call `generateUpdateSql` / `json2code` to recompute DDL; only render API `ddl` string.
- FE version panel, top bar dirty, export and live DB sync SQL migrate to backend API per slice; doT FE runtime phased out (non-product debug tools may remain temporarily).

### 2. Engine: Freemarker (end state); Pebble (transition)

| Phase | Runtime | Notes |
|---|---|---|
| **Transition (2026-08-09)** | Pebble 3.x | Shipped: `DdlPebbleTemplateEngine` + compile cache; satisfies "no script engine, fail-closed" |
| **End state (2026-08-09)** | **Freemarker** | `DdlFreemarkerTemplateEngine` replaced Pebble; classpath seeds `ddl/freemarker/{dialect}/*.ftl`; Pebble dependency removed |

- Pebble transition **fully replaced**; this ADR end state is landed.
- Migration complete: `DdlFreemarkerTemplateEngine` replaced `DdlPebbleTemplateEngine`; classpath seeds moved to `ddl/freemarker/{dialect}/*.ftl`; unit/golden aligned then Pebble dependency removed.

### 3. Templates and legacy compatibility

- **Official/seed templates**: syntax unified to **Freemarker**; `defaultData.json` and classpath defaults migrate with Freemarker slice. Classpath seed dir `ddl/freemarker/{mysql,postgresql,oracle}/*.ftl` aligned with MySQL key set (11 items); `defaultData` has no SQL Server dialect, so no `sqlserver/` seed yet.
- **Resolution priority**: `DdlTemplateRenderer.resolveFtlSource` — projectJSON `database[]` custom templates **first**; fallback to classpath seed only when fields empty.
- **User legacy doT** (projectJSON `database[]` custom templates): **on read** via **`DotToFreemarkerTranslator`** + **`DdlTemplateContextEnricher`** precomputes `pkFieldNames`, `sameCols`, etc.—**not** permanent dual engine; translation layer is legacy bridge only.
- **Writing new templates**: projectJSON adds `templateSyntax: freemarker | dot` (`dot` for old drafts only; new default `freemarker`). Unmarked with doT features treated as `dot`.
- **Orchestration unchanged**: `Json2CodeDdlEngine.generateUpdateSql` → `VersionDdlEngine` / `VersionPanelDiffEngine`.

### 4. Explicit rejections (end state)

| Approach | Rejection reason |
|---|---|
| Handlebars.js + Handlebars.java dual runtime | FE no longer executes DDL; isomorphic tax not worth it; JVM ~5× slower than Freemarker |
| Mustache | Too weak for existing doT loops/conditions/helpers |
| Liqp | Not JVM-native main path; maintenance and classpath burden |
| GraalJS / Nashorn / ScriptEngine + doT.js | Conflicts with user constraint; memory and sandbox risk |
| Permanent Pebble + doT dual engine | Conflicts with "single JVM end engine"; Pebble transition only |

### 5. Explicitly out

- JVM-embedded doT.js; untested hand-written SQL fallback; keeping parallel product DDL path with backend "for frontend preview".

## Research notes (archive)

| Approach | Same file FE+BE | JVM throughput | Covers existing doT | Conclusion |
|---|---|---|---|---|
| **Freemarker** | ❌ (BE-only after) | ✅ best | ✅ FTL + enricher | **End state** |
| Pebble + Translator | ❌ | ✅ good | ✅ defaultData subset | **Transition** |
| Handlebars.js + Handlebars.java | ✅ | ⚠️ ~5× slow | ✅ | **Reject end state** |
| Spring Script + doT.js | ✅ | ❌ | ✅ | **Reject** |
| Mustache | ❌ | ✅ | ❌ | **Reject** |

## Consequences

- ✅ Version DDL same source as changes; fail-closed (`DdlTemplateException`).
- ✅ Legacy projectJSON doT needs no immediate user rewrite; translation bridge until user migrates to FTL.
- ✅ End-state single JVM engine (Freemarker), no perpetual dual-engine.
- ⚠️ ~~FE export (`getAllDataSQLByFilter`) still FE doT—non-version product path, close per roadmap~~ ✅ (2026-08-09: `POST /hisProject/exportDdl` + `POST /hisProject/tableDdl`; HTTP split see [ADR-0031](./0031-ddl-api-surface.md) → `/projectDdl/*`)

## Verification

**Transition (Pebble, current)**

- `DdlPebbleCompatibilityTest`: defaultData MYSQL `createTableTemplate` → CREATE + fields + PK
- `VersionDdlEngineTest`: N entity add → N CREATE TABLE + FK

**End state (Freemarker, implemented)**

- `DdlFreemarkerCompatibilityTest`: defaultData MYSQL `createTableTemplate` → CREATE + fields + PK
- `VersionDdlEngineTest`: N entity add → N CREATE TABLE + FK
- `DotToFreemarkerTranslator` on legacy doT fixtures
- classpath `ddl/freemarker/**` as dialect fallback
- FE version module product path no `generateUpdateSql` / `getAllDataSQL` (sync calls `/hisProject/syncSql`)
- FE export / table metadata DDL preview no local `json2code` (calls `/hisProject/exportDdl`, `/hisProject/tableDdl`)

## Next implementation slices

1. ~~`DdlFreemarkerTemplateEngine` + `ddl/freemarker/{dialect}/*.ftl` seeds~~ ✅
2. ~~`DotToFreemarkerTranslator`~~ ✅
3. ~~Unit/golden align then delete Pebble DDL code and `pebble` dependency~~ ✅
4. ~~FE: version sync SQL calls `/hisProject/syncSql`~~ ✅; ~~export still FE doT (non-version module)~~ ✅ (`/hisProject/exportDdl` + `/hisProject/tableDdl`)
5. ~~`templateSyntax` field write and `data-format.md` docs~~ ✅
