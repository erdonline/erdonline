# ADR-0008：数据源与 projectJSON 隔离

- 状态：已接受（2026-08-02）
- 决策者：项目维护者

## 背景

历史实现把 JDBC 连接（url/username/password）写进 `projectJSON.profile.dbs`，导致：版本快照/分享/导出携带机密；与全局 `/ncnb/dataSources` 双轨打架。

## 决策

1. **连接信息唯一事实源**：表 `data_sources` + API `/ncnb/dataSources`；UI 入口为数据库配置页（`/databaseConfig`）及设计器内数据源设置（同样写该 API）。
2. **`profile.dbs` 不存 DB 机密**：不再写入 `properties`（url/username/password/driver）。存量加载时剥离；保存前强制清空机密字段。
3. **项目只保留绑定**：`profile.defaultDataSourceId` = 当前项目默认数据源 id（对应 `data_sources.id`）。
4. **运行时解析**：连接参数从内存中的 dataSources 列表（versionStore.dbs）按 id 取；无 JDBC 时仍可用快照通道（`SNAPSHOT_DB`）。

## 后果

- 正面：分享/版本 JSON 不再天然含口令；配置与模型生命周期分离
- 迁移：打开旧项目时剥离 `profile.dbs.*.properties`，若有 `defaultDB` 则回填 `defaultDataSourceId`
- UI：设计器「导出 DDL」下拉须 `refreshDataSources()`（`/ncnb/dataSources`），禁止再读 `profile.dbs`
- 后续：导入 ERD 时禁止再合并对方 `profile.dbs` 机密；可选一键「导入到 dataSources」
