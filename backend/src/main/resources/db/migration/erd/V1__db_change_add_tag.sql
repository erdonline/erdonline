-- 版本标签/里程碑：落在用户可见的历史版本表 db_change（非同步游标 db_version）
-- 空标签用 NULL；UNIQUE 允许多行 NULL，无标签不占唯一槽位
-- 幂等：init SQL 已含列/索引时跳过，避免自部署二次执行失败

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'db_change'
      AND COLUMN_NAME = 'tag'
);
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE `db_change` ADD COLUMN `tag` varchar(64) NULL COMMENT ''版本标签/里程碑'' AFTER `version_desc`',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'db_change'
      AND INDEX_NAME = 'uk_db_change_project_tag'
);
SET @sql := IF(@idx_exists = 0,
    'CREATE UNIQUE INDEX `uk_db_change_project_tag` ON `db_change` (`project_id`, `tag`)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
