# ADR-0006：多库逆向 Dialect SPI

- 状态：已接受（2026-08-01）
- 决策者：项目维护者

## 背景

逆向解析长期堆在 `DBReverseParseCommand` 的 `if (dbType)` 分支中，索引/FK 精度依赖 JDBC 驱动，多库与导入 UX（选 schema、按需加载）难以扩展。调研 DBeaver / SchemaCrawler / jOOQ-meta / Apache Calcite·MetaModel 后确认：业界热库走字典 SQL，JDBC 仅作 Generic 兜底；Apache 库不适合作为 ER 逆向核心。

## 决策

1. 引入 `com.erdonline.erd.reverse`：**ReverseDialect** SPI + **DialectCapability** + **ReverseDialectRegistry**
2. **P0 一等公民**（完整：表/列/PK/索引，后续 FK）：MySQL（含 MariaDB）、PostgreSQL、Oracle、SQL Server
3. **GenericJdbcReverseDialect**：任意 JDBC 兜底（表/列/PK；索引尽力、失败不阻断）
4. MySQL 索引走 `INFORMATION_SCHEMA.STATISTICS`（对齐 DBeaver/jOOQ），不依赖 `getIndexInfo` 精度；MySQL 8 函数键位读 `EXPRESSION` → `indexs[].fields[]`（无列回退）；PostgreSQL 表达式键位 `pg_get_indexdef` → 同字段
5. 不引入 SchemaCrawler（EPL）/ MetaModel / Calcite 作为逆向依赖
6. 代码风格遵循阿里巴巴 Java 开发手册（命名、常量、try-with-resources、禁止原始类型等）

## 后果

- 正面：按库扩展、能力矩阵驱动前端、可单测映射规则
- 代价：每库需维护一份 Dialect；P0 外库精度不承诺
- 已落地：`POST /connector/dbReverseMeta` + Schema 选择；JDBC `getImportedKeys` → `associations`
- P0 四库字典 FK：MySQL `KEY_COLUMN_USAGE`；PG `referential_constraints`；SQL Server `sys.foreign_keys`；Oracle `ALL_CONSTRAINTS(R)`；失败回退 JDBC；复合列保序拆边
- 注释保真：`DialectCapability.supportsComment`；MySQL 走 JDBC `REMARKS`；PostgreSQL 字典 `obj_description` / `col_description`；SQL Server 字典 `sys.extended_properties`（`MS_Description`）；Oracle 字典 `ALL_TAB_COMMENTS` / `ALL_COL_COMMENTS` → `entity.chnname` / `fields[].chnname`（失败回退 JDBC）
- 列默认值：JDBC `COLUMN_DEF` → `fields[].defaultValue`（`DefaultValueMapper`：字符串加引号、数字/表达式原样；PG `::type` 剥离）
- 触发器保真：`DialectCapability.supportsTrigger`；MySQL/MariaDB 字典 `INFORMATION_SCHEMA.TRIGGERS`、PostgreSQL 字典 `information_schema.triggers`、SQL Server 字典 `sys.triggers`/`sys.trigger_events`+`OBJECT_DEFINITION`、Oracle 字典 `ALL_TRIGGERS`+`ALL_SOURCE`（多事件拆行）→ `entity.triggers[]`（`name` / `timing` / `event` / `statement` / 重建或原样 `ddl`）；失败 warn 跳过；P0 四库闭环
- 表达式/函数索引：PostgreSQL `pg_get_indexdef`、MySQL 8 `STATISTICS.EXPRESSION` → `indexs[].fields[]` 原样字符串（与 DBML 互通同槽）；键位缺失软跳过；Oracle / SQL Server 函数索引另切片
- 复合 FK `fields[]`：见 ADR-0011（仍延期；解封需 FE 多字段边协议）。已落地加法元数据：`constraintName` / `deleteRule` / `updateRule`（拆边同名，不聚合）；表清单按需分页另议
