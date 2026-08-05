-- R-DATA-06：data_sources.username/password 改存 AES-256-GCM 密文（DataSourceCredentialCipher）。
-- 密文形如 enc:v1:<base64(iv||ciphertext||tag)>，比等长明文多约 40% + 7 字节前缀；
-- 加宽两列避免长口令/用户名超出旧长度限制（存量明文原样透传，下次保存自动补加密）。

SET @username_len := (
    SELECT CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'data_sources'
      AND COLUMN_NAME = 'username'
);
SET @sql := IF(@username_len IS NOT NULL AND @username_len < 255,
    'ALTER TABLE `data_sources` MODIFY COLUMN `username` varchar(255) DEFAULT NULL COMMENT ''用户名（AES-256-GCM 密文，enc:v1: 前缀）''',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @password_len := (
    SELECT CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'data_sources'
      AND COLUMN_NAME = 'password'
);
SET @sql := IF(@password_len IS NOT NULL AND @password_len < 500,
    'ALTER TABLE `data_sources` MODIFY COLUMN `password` varchar(500) DEFAULT NULL COMMENT ''密码（AES-256-GCM 密文，enc:v1: 前缀）''',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
