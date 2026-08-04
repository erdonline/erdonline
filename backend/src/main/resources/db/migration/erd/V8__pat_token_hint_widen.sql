-- token_hint：utf8mb4「…」占 3 字节；扩到 24 防截断（V7 初值 12）

SET @col_len := (
    SELECT CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'personal_access_token'
      AND COLUMN_NAME = 'token_hint'
);
SET @sql := IF(@col_len IS NOT NULL AND @col_len < 24,
    'ALTER TABLE `personal_access_token` MODIFY COLUMN `token_hint` varchar(24) NOT NULL COMMENT ''末尾可见片段，列表展示''',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
