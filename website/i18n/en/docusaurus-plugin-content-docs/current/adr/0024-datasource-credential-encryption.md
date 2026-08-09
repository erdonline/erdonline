# ADR-0024: Datasource credential encryption at rest (AES-256-GCM)

## Status

Accepted — 2026-08-05

## Context

ADR-0008 moved JDBC connection secrets (url/username/password/driver) from `projectJSON.profile.dbs` to single source of truth table `data_sources`, solving "share/version snapshot carries plaintext password" — but `data_sources.username`/`password` still stored plaintext in MySQL: DBA/backup/slow query log/anyone with data volume can read user downstream DB passwords directly. Repo already has `JwtConfig` (session key), `OidcRsaKeySupport` (OIDC RSA private key) two "local weak default + prod fail-fast + reject repo default" key management conventions, but no symmetric encryption for **data at rest**; `jasypt-spring-boot-starter` dependency declared but never wired.

## Decision

1. **Encrypt only true secret fields**: `username`, `password`; `host`/`port`/`url`/`databaseName`/`driverClassName` stay plaintext (non-secret, and some scenarios need direct display in list/form — not worth decryption-failure availability risk)
2. **Algorithm**: AES-256-GCM (`javax.crypto` native, zero new deps), key = `SHA-256(ERD_DB_CONFIG_SECRET)`; ciphertext format `enc:v1:<base64(iv[12B]||ciphertext||tag)>`, prefix carries dual "version + encrypted?" identifier
3. **Location**: encrypt/decrypt centralized in `DataSourceCredentialCipher` (single Spring bean), called by `DataSourcesServiceImpl` (covers `save`/`updateById`/`update`/`getById`/`list`/`page`) and `DataSourceAcl` (only path bypassing Service direct mapper); **no** MyBatis `TypeHandler` scattered to mapper layer — keep explicit call chain "who reads/writes DB encrypts/decrypts" for audit and test
4. **Backward compat / gradual migration**: no one-shot batch rewrite. `decrypt()` passes through legacy plaintext without `enc:v1:` prefix; user next edit-save (form username/password required) `encrypt()` auto-upgrades. Fresh encrypted rows and legacy plaintext rows can coexist long-term, no migration window downtime
5. **Key management**: reuse `JwtConfig`/`OidcRsaKeySupport` convention — `erd.datasource-secret.key: ${ERD_DB_CONFIG_SECRET:<repo weak default>}`; local/dev allows weak default (`dev-ensure` zero-config); `application-prod.yml` no default (missing placeholder parse fail, fail-fast); `DataSourceCredentialCipher` constructor additionally validates prod key non-blank and not repo default
6. **No Jasypt/external KMS**: repo scale (monolith self-host, user-managed DB) native AES-GCM sufficient; `jasypt-spring-boot-starter` not wired this round (future KMS/HSM can be separate ADR)

## Consequences

- Positive: MySQL at-rest/backup/slow query no longer plaintext downstream passwords; transparent to Controller, `ConnectorCredentialResolver`, frontend forms (API still plaintext, UX zero change)
- Positive: gradual migration zero downtime, no batch migration script or maintenance window
- Negative: key rotation costly — changing `ERD_DB_CONFIG_SECRET` makes all old ciphertext undecryptable (`decrypt()` throws); before rotation must re-save all connections with old key, or export and rebuild with new key (recorded in [deployment](/docs/deployment))
- Negative: `username`/`password` columns longer after ciphertext (AES-GCM ≈ plaintext + 28 bytes + `enc:v1:` 7-byte prefix, then base64 ~33% expansion); Flyway `V18` widened `username` to 255, `password` to 500, covers most cases
- Follow-up (not this slice): multi-key/rotation without losing history needs key id prefix (e.g. `enc:v2:<kid>:...`) and dual-key decrypt fallback — not this ADR

## Verification

- `DataSourceCredentialCipherTest`: encrypt/decrypt roundtrip, IV randomness, idempotent encrypt, legacy plaintext passthrough, tamper/wrong key throws, prod empty/repo default fail-fast
- `curl` manual: after `POST /ncnb/dataSources` direct MySQL query `data_sources.password` is `enc:v1:...`; `GET /ncnb/dataSources/{id}` and list still return plaintext password; manual insert plaintext row readable on `GET`, after `PATCH` re-save MySQL becomes ciphertext
- `mvn test` full pass (except unrelated existing failure `OracleReverseDialectCommentTest`, verified same failure on main with `git stash`)
