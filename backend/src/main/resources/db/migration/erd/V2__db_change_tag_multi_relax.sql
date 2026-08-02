-- 多标签：db_change.tag 存逗号分隔字符串；去掉同项目唯一约束以允许跨版本复用标签
-- 幂等：索引已删 / 列已加宽时跳过

SET @idx_exists := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'db_change'
      AND INDEX_NAME = 'uk_db_change_project_tag'
);
SET @sql := IF(@idx_exists > 0,
    'DROP INDEX `uk_db_change_project_tag` ON `db_change`',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @need_widen := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'db_change'
      AND COLUMN_NAME = 'tag'
      AND CHARACTER_MAXIMUM_LENGTH < 255
);
SET @sql := IF(@need_widen > 0,
    'ALTER TABLE `db_change` MODIFY COLUMN `tag` varchar(255) NULL COMMENT ''版本标签（逗号分隔，可多个）''',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
