# ADR-0020：单一业务数据库（取消 martin / erd 双库）

- 状态：已接受（2026-08-03）
- 决策者：项目维护者

## 背景

应用长期使用同一 MySQL 实例上的两个库：`martin`（系统/认证）与 `erd`（建模元数据），两套 Hikari + SqlSessionFactory 按 mapper 包路由。Railway / 远程插件 MySQL 默认只有一个库名（常为 `railway`），双库建库与 `db/init` 灌数成为部署主痛点。

历史注释称 `sys_user` / `sys_role` 同名冲突导致无法合并。核查结果：

| 来源 | 冲突表 | 结论 |
|---|---|---|
| `martin` | 完整 `sys_user` / `sys_role`（认证真相） | 保留 |
| 旧 `erd` dump | 同名桩表（仅 id/username/password 等） | **后端 erd mapper 零引用**，合并时丢弃 |

其余表名无交集，可同库共存。

## 决策

1. **物理单一库**：默认库名 `erd`（环境变量 `DB_NAME`，兼容旧 `DB_ERD` / `DB_MARTIN` 回退到同一值）。
2. **`db/init` 仅 schema**：`01_create_database.sql` + `02_tables.sql`（CREATE TABLE）；不再含种子、demo、privileges 脚本。
3. **种子进 Flyway**：`backend/.../db/migration/erd/` 的 `V3+`（系统基线 / 新用户权限 / 公开 demo / E2E 账号）；后端启动由 `ErdFlywayConfig` 执行。
4. **过渡期保留双 SqlSessionFactory**：`martinDataSource` 与 `erdDataSource` 仍按包扫描分离，但 **JDBC URL 指向同一 `DB_NAME`**（避免本轮拆 mapper 大爆炸）。后续可再 ADR 合并为单 DS。
5. **Compose**：`MYSQL_DATABASE` / `MYSQL_USER` 与 `DB_NAME` / `DB_USERNAME` 对齐；不在仓库硬编码 root 密码以外的生产密钥（示例默认仅本地）。

## 后果

- Railway：只需建一个库 + 导入 schema；Redeploy 后 Flyway 灌种子。不再要求 `DB_MARTIN`≠`DB_ERD` 两库。
- 本地已有 **双库 data 卷**：须重建卷（`docker compose down -v` 后 up）或手工把 `martin.*` 表迁入 `erd` 并改 `DB_NAME=erd`。
- 生产若已有双库数据：导出两边表 → 导入单一 `erd`（丢弃 erd 侧桩 `sys_*`）→ 变量改为 `DB_NAME=erd` → 确认 `flyway_schema_history` 后按需 baseline / 补跑未执行版本。
- E2E 种子随 Flyway 进入库；公网登录仍由 `erd.security.e2e-accounts-enabled=false` 拒绝。

## 验证

- `mvn -q -DskipTests compile`
- `./scripts/railway-mysql-init.sh --dry-run` 仅列 `01`+`02`
- 空卷 compose 首启后后端 Flyway ≥ V6；`SELECT COUNT(*) FROM erd.sys_user` > 0
