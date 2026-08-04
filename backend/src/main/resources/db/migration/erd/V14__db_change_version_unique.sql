-- db_change 版本号唯一：同 project_id + db_key 下 version 不可重复（并发存版防重）
-- 幂等：init 02_tables 已有 uni_versin_projectid_dbkey 或本索引时跳过
-- 存量重复：保留 id 最小行，删其余（见 docs/adr/0022-dual-layer-consistency.md）

DELETE t1 FROM `db_change` t1
INNER JOIN `db_change` t2
  ON t1.`project_id` = t2.`project_id`
 AND t1.`db_key` = t2.`db_key`
 AND t1.`version` = t2.`version`
 AND t1.`id` > t2.`id`;

SET @legacy_idx := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'db_change'
      AND INDEX_NAME = 'uni_versin_projectid_dbkey'
);
SET @new_idx := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'db_change'
      AND INDEX_NAME = 'uk_db_change_project_dbkey_version'
);
SET @sql := IF(@legacy_idx = 0 AND @new_idx = 0,
    'CREATE UNIQUE INDEX `uk_db_change_project_dbkey_version` ON `db_change` (`project_id`, `db_key`, `version`)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
