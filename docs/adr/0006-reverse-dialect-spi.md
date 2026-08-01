# ADR-0006：多库逆向 Dialect SPI

- 状态：已接受（2026-08-01）
- 决策者：项目维护者

## 背景

逆向解析长期堆在 `DBReverseParseCommand` 的 `if (dbType)` 分支中，索引/FK 精度依赖 JDBC 驱动，多库与导入 UX（选 schema、按需加载）难以扩展。调研 DBeaver / SchemaCrawler / jOOQ-meta / Apache Calcite·MetaModel 后确认：业界热库走字典 SQL，JDBC 仅作 Generic 兜底；Apache 库不适合作为 ER 逆向核心。

## 决策

1. 引入 `com.erdonline.erd.reverse`：**ReverseDialect** SPI + **DialectCapability** + **ReverseDialectRegistry**
2. **P0 一等公民**（完整：表/列/PK/索引，后续 FK）：MySQL（含 MariaDB）、PostgreSQL、Oracle、SQL Server
3. **GenericJdbcReverseDialect**：任意 JDBC 兜底（表/列/PK；索引尽力、失败不阻断）
4. MySQL 索引走 `INFORMATION_SCHEMA.STATISTICS`（对齐 DBeaver/jOOQ），不依赖 `getIndexInfo` 精度
5. 不引入 SchemaCrawler（EPL）/ MetaModel / Calcite 作为逆向依赖
6. 代码风格遵循阿里巴巴 Java 开发手册（命名、常量、try-with-resources、禁止原始类型等）

## 后果

- 正面：按库扩展、能力矩阵驱动前端、可单测映射规则
- 代价：每库需维护一份 Dialect；P0 外库精度不承诺
- 已落地：`POST /connector/dbReverseMeta` + Schema 选择；JDBC `getImportedKeys` → `associations`
- P0 四库字典 FK：MySQL `KEY_COLUMN_USAGE`；PG `referential_constraints`；SQL Server `sys.foreign_keys`；Oracle `ALL_CONSTRAINTS(R)`；失败回退 JDBC；复合列保序拆边
- 复合 FK `fields[]`：见 ADR-0011（延期）；表清单按需分页另议
