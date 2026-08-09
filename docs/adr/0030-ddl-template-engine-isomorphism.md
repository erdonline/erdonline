# ADR-0030：DDL 模板引擎（Pebble + doT 兼容层）

- 状态：**已接受**（2026-08-09）
- 前置：[ADR-0022](./0022-dual-layer-consistency.md) 工作区↔版本↔实库；`docs/data-format.md` projectJSON `database[]` 模板字段

## 背景

- projectJSON 内 DDL 模板沿用 **doT.js** 语法（`defaultData.json`），前端 `json2code.ts` 用于预览/导出。
- 版本面板 `/hisProject/diff` 的 `ddl` **必须**由后端权威生成；前端只渲染 API。
- 约束：**JVM 原生高性能**；**禁止** Nashorn/GraalJS/ScriptEngine 嵌入 doT.js。

## 决策

**当前实现（2026-08-09）**：

1. **运行时：Pebble 3.x** — 编译缓存、无脚本引擎；Freemarker 保留给其它 codegen，DDL 独立选型。
2. **兼容层：`DotToPebbleTranslator`** — 确定性转换存量 doT（`{{=}}` / `{{~}}` / 条件）；翻译结果按内容缓存。
3. **状态预计算：`DdlTemplateContextEnricher`** — `pkList.push` / `sameCols = intersect(...)` 等 evaluate 在 Java 预计算为 `pkFieldNames`、`sameCols`。
4. **Classpath 默认**：`ddl/pebble/{dialect}/*.pebble` 与 defaultData 语义对齐，database 行未配置时使用。
5. **编排**：`Json2CodeDdlEngine.generateUpdateSql`；`VersionPanelDiffEngine` = `VersionDiffEngine` + DDL。

**明确不做**：JVM 内嵌 doT.js；无测试的手写 SQL 拼接兜底。

**远期（可选）**：Handlebars 双端同文见下表调研；需 golden fixture + 迁移工具，非本切片范围。

## 调研备忘（远期 Handlebars 方案）

| 方案 | 同文件 FE+BE | JVM 原生 | 覆盖现有 doT | 备注 |
|---|---|---|---|---|
| Handlebars.js + Handlebars.java | ✅ | ✅ | ✅ helpers 双端 | 目标态候选 |
| Pebble + DotToPebbleTranslator | ❌ | ✅ | ✅ defaultData 子集 | **当前** |
| Spring Script + doT.js | ✅ | ❌ | ✅ | 与用户约束冲突 |

## 后果

- ✅ 存量 projectJSON doT 模板无需用户改写即可在后端渲染（含字段循环 + PK）。
- ✅ 版本 DDL 与 changes 同源；fail-closed（`DdlTemplateException`）。
- ⚠️ FE 仍跑 doT，BE 跑 Pebble+翻译 — parity 靠单测/golden，非 bit-identical 同引擎。
- 前端版本面板禁止重算 DDL；export 路径仍用 `json2code`。

## 验证

- `DdlPebbleCompatibilityTest`：defaultData MYSQL `createTableTemplate` → CREATE + 字段 + PK
- `VersionDdlEngineTest`：N entity add → N CREATE TABLE + FK
