# ADR-0031：DDL 生成 API 与版本生命周期 API 分域

- 状态：**已接受**（2026-08-09）；**迁移待实施**
- 前置：[ADR-0030](./0030-ddl-template-engine-isomorphism.md)（Freemarker 终态、BE 权威生成）；[ADR-0022](./0022-dual-layer-consistency.md)（A 层版本 / B 层实库）
- 关联：`HisProjectController`、`DbChangeService`、`ConnectorController`

## 背景

ADR-0030 已将 product path 的 DDL 生成迁至后端 Freemarker，但 **HTTP 路由仍挂在 `HisProjectController`**（`/ncnb/hisProject/*`）。该 Controller 名与 Swagger tag `dbChange` 均表达「版本 / 变更历史」，却同时承载：

| 端点 | 语义 | 主要消费方 |
|---|---|---|
| `load` / `save` / `delete*` | 版本快照 CRUD | 版本页、`Save.hisProject*` |
| `POST /dbChange` | 分页列表 | `useVersionStore` |
| `diff` | 工作区 ↔ 最新版本 structural diff + 增量 DDL | 版本面板、dirty chip |
| `syncSql` | 全量/增量同步脚本（相对版本基线） | 版本「同步到库」预览 |
| `exportDdl` | 全量 DDL 片段导出 | 导出对话框、`exportSlice` |
| `tableDdl` | 单表元数据 DDL | 表属性 DDL 标签 |
| `previewDdlTemplate` | 模板编辑器草稿预览（样例实体） | DDL 模板弹窗 |

**问题**：`previewDdlTemplate` / `exportDdl` / `tableDdl` 不读写 `db_change`，与版本生命周期无关；挂在 `hisProject` 误导 API 边界、OpenAPI 分组与后续 Public API / MCP 切片。用户已明确：`previewDdlTemplate` 放在 `HisProjectController` **不合适**。

**约束**：Freemarker 引擎与 `DbChangeService` 编排 **不变**；`@RequireProjectAccess` + `@ProjectId` / `@DbKey` **不变**；**禁止**并入 `ConnectorController`（该域负责活库连接、逆向、下发 DML/DDL 执行，见 ADR-0022 B 层）。

## 决策

### 1. 分两个 Controller（路由分域，Service 复用）

| 域 | Controller | 路由前缀 | 职责 |
|---|---|---|---|
| **版本生命周期** | `HisProjectController`（保留） | `/ncnb/hisProject/*` + `/ncnb/dbChange` | 版本 CRUD、分页、A 层 diff；**可选**保留 `syncSql` |
| **DDL 生成（只读渲染）** | **`ProjectDdlController`**（新增） | **`/ncnb/projectDdl/*`** | 模板预览、全量导出、单表 DDL |

> 选用 `projectDdl` 而非 `ddl`：避免与 connector 下发 SQL、Public API 未来 `/ddl` 动词混淆；与 `projectId` 归属一致。

### 2. 端点归属（目标态）

**留在 `HisProjectController`**

| 方法 | 路径 | Service |
|---|---|---|
| POST | `/ncnb/hisProject/load` | `loadHistory` |
| POST | `/ncnb/dbChange` | `getPage` |
| POST | `/ncnb/hisProject/save` | `saveVersion` |
| POST | `/ncnb/hisProject/delete/{changeId}` | `deleteHistory` |
| POST | `/ncnb/hisProject/deleteAll` | `deleteAllHistory` |
| POST | `/ncnb/hisProject/diff` | `diffAgainstLatest` |
| POST | `/ncnb/hisProject/syncSql` | `generateSyncSql` |

**`syncSql` 归属说明（已拍板）**：留在 `hisProject`。消费方为版本面板「同步到库」；入参依赖版本基线 / `changes`，语义是「相对已保存版本的同步脚本」，不是独立的全量 schema 导出。若未来 Public API 需要无版本上下文的 DDL，在 `ProjectDdlController` 另开参数化端点，不搬 `syncSql`。

**迁至 `ProjectDdlController`**

| 方法 | 现路径 | 目标路径 | Service |
|---|---|---|---|
| POST | `/ncnb/hisProject/previewDdlTemplate` | **`/ncnb/projectDdl/previewTemplate`** | `previewDdlTemplate` |
| POST | `/ncnb/hisProject/exportDdl` | **`/ncnb/projectDdl/export`** | `generateExportDdl` |
| POST | `/ncnb/hisProject/tableDdl` | **`/ncnb/projectDdl/table`** | `generateTableDdl` |

- 请求体 / 响应体 **不变**（仍 `{ sql: string }` 或现有 `R` 包装）。
- 新方法名略短（去掉冗余 `Ddl` 前缀），因路径已含 `projectDdl`。
- Swagger tag 建议：`projectDdl`（与 `dbChange` 分离）。

### 3. 明确不做

| 方案 | 理由 |
|---|---|
| 并入 `ConnectorController` | Connector = 凭证解析 + 活库 ping/逆向/执行；DDL **渲染**不触库，职责不同 |
| 新建 `DdlTemplateController` 仅放 preview | 导出/单表/预览同属「projectJSON → SQL 字符串」，一个 Controller 足够 |
| 本切片改 Freemarker / 引擎类 | ADR-0030 已落地；本 ADR 只动 HTTP 面 |
| 新增细粒度 RBAC 码 | 继续 `@RequireProjectAccess`；与现 hisProject 一致 |

### 4. 前端迁移

| 文件 | 现调用 | 改后 |
|---|---|---|
| `frontend/src/utils/ddlExportApi.ts` | `POST …/hisProject/exportDdl` | `POST …/projectDdl/export` |
| 同上 | `…/hisProject/previewDdlTemplate` | `…/projectDdl/previewTemplate` |
| 同上 | `…/hisProject/tableDdl`（`fetchTableDdl`） | `…/projectDdl/table` |
| `frontend/src/utils/versionDiffApi.ts` | `…/hisProject/syncSql` | **不变** |
| `frontend/src/utils/save.js` | `hisProject/load|save|delete*` | **不变** |
| `useVersionStore` | `…/dbChange`、`Save.hisProject*` | **不变** |

E2E：`database-templates-modal.spec.ts` 若 mock 网络，改新路径；版本相关 spec **不改**（仍 `hisProject/diff|save`）。

### 5. 兼容与删除策略

1. **切片 A（后端）**：新增 `ProjectDdlController`，三端点落新路径；`HisProjectController` 旧三端点 **保留一版**，实现改为 `deprecated` 注释或委托同一 Service（行为 identical）。
2. **切片 B（前端）**：`ddlExportApi.ts` 切新路径；跑相关 E2E + 单测。
3. **切片 C（清理）**：删除 `HisProjectController` 上 `exportDdl` / `tableDdl` / `previewDdlTemplate` 及任何临时 alias；更新 CHANGELOG / `product-capability-map.md`。

不强制 HTTP 301；双路径共存窗口 ≤ 1 个 minor 发版，文档标注 deprecated。

## 现状映射（2026-08-09 grep）

```
HisProjectController (/ncnb)
├── hisProject/load          → 版本 load          [FE: save.js, TableCodeShow]
├── dbChange                 → 分页               [FE: useVersionStore]
├── hisProject/save          → 存版               [FE: save.js, useVersionStore, E2E]
├── hisProject/delete/*      → 删版               [FE: save.js, useVersionStore]
├── hisProject/diff          → A 层 diff          [FE: versionDiffApi, E2E version.spec]
├── hisProject/syncSql       → 同步 SQL           [FE: versionDiffApi]  → 留 hisProject
├── hisProject/exportDdl     → 全量导出           [FE: ddlExportApi → exportSlice]  → 迁 projectDdl
├── hisProject/tableDdl      → 单表 DDL           [FE: ddlExportApi → TableCodeShow]  → 迁 projectDdl
└── hisProject/previewDdlTemplate → 模板预览    [FE: ddlExportApi → DatabaseTemplatesEditor] → 迁 projectDdl

ConnectorController (/ncnb/connector) — 不吸纳上述 DDL 渲染端点
├── ping / dbReverse* / schema/probe
├── dbversion / checkdbversion / rebaseline
└── dbsync / sqlexec / updateVersion   ← 活库执行，非 Freemarker 渲染
```

## 后果

- ✅ OpenAPI / 能力图按「版本 vs DDL 渲染」清晰分域；Public API 切片可单独暴露 `projectDdl`。
- ✅ `HisProjectController` 注释与类名重新一致；降低误把模板预览当版本 API 的概率。
- ✅ Service 层零分叉：`DbChangeService` 仍为一处编排；Controller 仅薄委托。
- ⚠️ 短期双路径需维护；FE + 文档须同轮切换，避免漏改。
- ⚠️ 外部集成若硬编码 `/hisProject/exportDdl` 需发版说明（本仓库 FE 为唯一 product caller）。

## 验证（迁移切片完成后）

- `cd backend && mvn -q test -Dtest=DdlTemplatePreviewEngineTest,Json2CodeFullDdlEngineTest,Json2CodeTableDdlEngineTest -Djacoco.skip=true`
- curl 新路径三端点 + 旧路径 deprecated 仍 200（切片 A）；清理后旧路径 404（切片 C）
- `yarn test:e2e --project=chromium tests/e2e/database-templates-modal.spec.ts`
- 导出对话框 + 表 DDL 标签手工走查
- `@RequireProjectAccess` 回归：非成员 `projectId` → 403（与现 hisProject 一致）

## 实现切片（待办）

1. [ ] `ProjectDdlController` + 三 POST
2. [ ] FE `ddlExportApi.ts` 改路径
3. [ ] E2E / CHANGELOG / `product-capability-map.md`
4. [ ] 删除 `HisProjectController` 三 DDL 端点
