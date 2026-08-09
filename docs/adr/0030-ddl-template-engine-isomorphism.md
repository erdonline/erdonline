# ADR-0030：DDL 模板引擎（Freemarker 终态 + doT 遗留桥）

- 状态：**已接受**（2026-08-09，终态锁定）
- 前置：[ADR-0022](./0022-dual-layer-consistency.md) 工作区↔版本↔实库；`docs/data-format.md` projectJSON `database[]` 模板字段

## 背景

- projectJSON 内 DDL 模板沿用 **doT.js** 语法（`defaultData.json`）；历史前端 `json2code.ts` 曾用于预览/导出。
- 版本面板 `/hisProject/diff` 的 `ddl` **必须**由后端权威生成；前端只渲染 API（ADR-0022 延伸）。
- 约束：**JVM 原生高性能 / 低内存**；**禁止** Nashorn/GraalJS/ScriptEngine 嵌入 doT.js；**不**长期维持双引擎。
- 调研结论：Handlebars 双端同文在 FE 不再执行 DDL 后失去同构收益，JVM 吞吐约为 Freemarker 的 ~1/5，故**不**作为终态。

## 决策（终态）

### 1. 单一权威：后端生成 DDL

- **版本详情 / 对比、导出、同步 SQL** 等 product path 的 DDL **一律**由后端生成。
- 前端 **禁止** 在产品路径调用 `generateUpdateSql` / `json2code` 重算 DDL；只渲染 API 返回的 `ddl` 字符串。
- FE 版本面板、顶栏 dirty、导出与实库同步 SQL 随切片迁移至后端 API；doT 前端运行时逐步退役（非 product path 调试工具可暂留）。

### 2. 引擎：Freemarker（终态）；Pebble（过渡）

| 阶段 | 运行时 | 说明 |
|---|---|---|
| **过渡（当前，2026-08-09）** | Pebble 3.x | 已落地：`DdlPebbleTemplateEngine` + 编译缓存；满足「无脚本引擎、fail-closed」 |
| **终态（下一实现切片）** | **Freemarker** | `spring-boot-starter-freemarker` 已在 classpath；benchmark 显示在具备循环/条件/helpers 能力的 JVM 引擎中吞吐与内存最优 |

- Pebble 过渡实现 **可继续服务** 直至 Freemarker 迁移切片完成；本 ADR **锁定方向**，不要求同轮替换。
- 迁移切片：`DdlFreemarkerTemplateEngine` 替换 `DdlPebbleTemplateEngine`；classpath 种子迁至 `ddl/freemarker/{dialect}/*.ftl`；单测/golden 对齐后移除 Pebble 依赖（若无其它引用）。

### 3. 模板与遗留兼容

- **官方/种子模板**：语法统一为 **Freemarker**；`defaultData.json` 与 classpath 默认模板随 Freemarker 切片迁移。
- **用户存量 doT**（projectJSON `database[]` 自定义模板）：**读时**经 **`DotToFreemarkerTranslator`**（命名随实现；当前为 `DotToPebbleTranslator` 的 Pebble 版过渡）+ **`DdlTemplateContextEnricher`** 预计算 `pkFieldNames`、`sameCols` 等 evaluate，**非**永久双引擎——翻译层仅为 legacy bridge。
- **写入新模板**：projectJSON 增加 `templateSyntax: freemarker | dot`（`dot` 仅兼容旧稿；新稿默认 `freemarker`）。未标注且含 doT 特征时按 `dot` 处理。
- **编排不变**：`Json2CodeDdlEngine.generateUpdateSql` → `VersionDdlEngine` / `VersionPanelDiffEngine`。

### 4. 明确拒绝（终态）

| 方案 | 拒绝理由 |
|---|---|
| Handlebars.js + Handlebars.java 双运行时 | FE 不再执行 DDL，同构税不值；JVM 侧约 5× 慢于 Freemarker |
| Mustache | 逻辑过弱，无法表达现有 doT 循环/条件/helpers |
| Liqp | 非 JVM 原生主路径；维护与 classpath 负担 |
| GraalJS / Nashorn / ScriptEngine + doT.js | 与用户约束冲突；内存与沙箱风险 |
| 永久 Pebble + doT 双引擎 | 与「单一 JVM 终态引擎」冲突；Pebble 仅过渡 |

### 5. 明确不做

- JVM 内嵌 doT.js；无测试的手写 SQL 拼接兜底；为「前端预览」保留与后端并行的 product DDL 路径。

## 调研备忘（归档）

| 方案 | 同文件 FE+BE | JVM 吞吐 | 覆盖现有 doT | 结论 |
|---|---|---|---|---|
| **Freemarker** | ❌（BE-only 后不需要） | ✅ 最优 | ✅ FTL + enricher | **终态** |
| Pebble + Translator | ❌ | ✅ 良好 | ✅ defaultData 子集 | **过渡** |
| Handlebars.js + Handlebars.java | ✅ | ⚠️ ~5× 慢 | ✅ | **拒绝终态** |
| Spring Script + doT.js | ✅ | ❌ | ✅ | **拒绝** |
| Mustache | ❌ | ✅ | ❌ | **拒绝** |

## 后果

- ✅ 版本 DDL 与 changes 同源；fail-closed（`DdlTemplateException`）。
- ✅ 存量 projectJSON doT 无需用户立即改写；翻译桥直至用户主动迁移 FTL。
- ✅ 终态单一 JVM 引擎（Freemarker），无 perpetual dual-engine。
- ⚠️ Freemarker 迁移切片完成前，过渡期为 Pebble + Dot→Pebble；完成后移除 Pebble DDL 路径。
- ⚠️ FE export/sync 迁移完成前，仍可能存在非权威 FE doT 路径——按 roadmap 切片关闭，不得新增 FE DDL product 依赖。

## 验证

**过渡（Pebble，当前）**

- `DdlPebbleCompatibilityTest`：defaultData MYSQL `createTableTemplate` → CREATE + 字段 + PK
- `VersionDdlEngineTest`：N entity add → N CREATE TABLE + FK

**终态（Freemarker，迁移切片验收）**

- 同上 golden + `DotToFreemarkerTranslator` 对存量 doT fixture
- classpath `ddl/freemarker/**` 与 Pebble 期输出 diff 为零或 documented delta
- FE product path 无 `generateUpdateSql` 调用（grep / E2E）

## 下一步实现切片

1. `DdlFreemarkerTemplateEngine` + `ddl/freemarker/{dialect}/*.ftl` 种子
2. `DotToFreemarkerTranslator`（自 Pebble 版机械迁移或直译 doT→FTL）
3. 单测/golden 对齐后删除 Pebble DDL 专用代码与 `pebble` 依赖（若无它用）
4. FE：export / sync SQL 改调后端 API；移除 product path 的 `json2code` DDL
5. `templateSyntax` 字段写入与 `data-format.md` 文档
