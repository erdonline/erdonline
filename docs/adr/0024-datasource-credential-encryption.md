# ADR-0024：数据源凭证落库加密（AES-256-GCM）

## 状态

Accepted — 2026-08-05

## 背景

ADR-0008 把 JDBC 连接机密（url/username/password/driver）从 `projectJSON.profile.dbs` 收敛到唯一事实源表 `data_sources`，解决了「分享/版本快照携带明文口令」的问题，但 `data_sources.username`/`password` 本身仍以明文存入 MySQL：DBA/备份/慢查询日志/任何拿到数据卷的人都能直接看到用户的下游数据库口令。仓库已有 `JwtConfig`（会话密钥）、`OidcRsaKeySupport`（OIDC RSA 私钥）两套「本地弱默认 + prod fail-fast + 拒绝仓库默认值」的密钥管理惯例，但没有对**落库数据**做过对称加密；`jasypt-spring-boot-starter` 依赖已声明但从未真正接线。

## 决策

1. **仅加密真正机密字段**：`username`、`password`；`host`/`port`/`url`/`databaseName`/`driverClassName` 保持明文（非机密，且部分场景需要在列表/表单直接展示，不值得为它们承担解密失败的可用性风险）
2. **算法**：AES-256-GCM（`javax.crypto` 原生实现，零新依赖），密钥 = `SHA-256(ERD_DB_CONFIG_SECRET)`；密文格式 `enc:v1:<base64(iv[12B]||ciphertext||tag)>`，前缀承担「版本 + 是否已加密」双重标识
3. **落点**：加解密逻辑集中在 `DataSourceCredentialCipher`（单一 Spring bean），由 `DataSourcesServiceImpl`（覆盖 `save`/`updateById`/`update`/`getById`/`list`/`page`）与 `DataSourceAcl`（唯一绕过 Service 直查 mapper 的路径）调用；**不**用 MyBatis `TypeHandler` 散落到 mapper 层，保持"谁读写数据库谁负责加解密"的显式调用链，便于审计与测试
4. **向后兼容 / 渐进迁移**：不做一次性批量改写。`decrypt()` 对不含 `enc:v1:` 前缀的存量明文直接透传；用户下次编辑保存该连接（表单 username/password 必填）时 `encrypt()` 自动补齐密文。全新加密行与存量明文行可以在表里长期共存，无需下线迁移窗口
5. **密钥管理**：复用 `JwtConfig`/`OidcRsaKeySupport` 的惯例——`erd.datasource-secret.key: ${ERD_DB_CONFIG_SECRET:<仓库弱默认>}`；本地/dev 允许该弱默认（保 `dev-ensure` 零配置可用）；`application-prod.yml` 改写为无默认值（缺失时占位符解析失败，fail-fast）；`DataSourceCredentialCipher` 构造时额外校验 prod 下密钥非 blank 且不等于仓库默认值
6. **不引入 Jasypt/外部 KMS**：仓库规模（单体自托管，用户自管数据库）用应用层原生 AES-GCM 已足够；`jasypt-spring-boot-starter` 依赖暂不接线（后续若要接 KMS/HSM 可另开 ADR，不阻塞本次落地）

## 后果

- 正：MySQL 落盘/备份/慢查询日志不再含明文下游数据库口令；对 Controller、`ConnectorCredentialResolver`、前端表单完全透明（API 仍收发明文，UX 零变化）
- 正：渐进迁移零停机，无需批量迁移脚本或维护窗口
- 负：密钥轮换成本高——换 `ERD_DB_CONFIG_SECRET` 会让所有旧密文不可解（`decrypt()` 抛异常）；轮换前必须先用旧密钥把全部连接重新保存一遍，或导出后用新密钥重建（已记入 `deployment.md`）
- 负：`username`/`password` 两列改存密文后变长（AES-GCM 密文 ≈ 明文 + 28 字节 + `enc:v1:` 7 字节前缀，再 base64 膨胀 ~33%），已用 Flyway `V18` 把 `username` 加宽到 255、`password` 加宽到 500，覆盖绝大多数场景
- 后续（非本切片）：若要支持多密钥/密钥轮换而不丢历史数据，需引入 key id 前缀（如 `enc:v2:<kid>:...`）与双密钥解密回退，本 ADR 暂不做

## 验证

- `DataSourceCredentialCipherTest`：加解密 roundtrip、IV 随机性、幂等加密、存量明文透传、篡改/错密钥抛异常、prod 空/仓库默认值 fail-fast
- `curl` 手工验证：`POST /ncnb/dataSources` 后直查 MySQL `data_sources.password` 为 `enc:v1:...`；`GET /ncnb/dataSources/{id}` 与分页列表接口仍返回明文密码；手工插入明文行后 `GET` 可读、`PATCH` 重新保存后 MySQL 中变为密文
- `mvn test` 全量通过（除与本改动无关的既有失败 `OracleReverseDialectCommentTest`，已用 `git stash` 验证 main 分支同样失败）
