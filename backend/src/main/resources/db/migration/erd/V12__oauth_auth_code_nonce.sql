-- ADR-0013 OIDC：authorization_code 绑定可选 OIDC nonce（换票写入 id_token）。
-- 幂等：空卷 Flyway 与已有库均可重入。

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'oauth_authorization_code'
      AND COLUMN_NAME = 'nonce'
);
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE `oauth_authorization_code` ADD COLUMN `nonce` varchar(255) DEFAULT NULL COMMENT ''OIDC authorize nonce；换票写入 id_token'' AFTER `code_challenge_method`',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
