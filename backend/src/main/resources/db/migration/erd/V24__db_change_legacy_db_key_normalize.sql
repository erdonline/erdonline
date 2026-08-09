-- 历史版本 db_key 与产品通道不对齐：
--   defaultDB（dogfood/Public API 硬编码）→ project.profile.defaultDataSourceId
--   SNAPSHOT（旧脚本）→ __erd_snapshot__（前端 SNAPSHOT_DB_KEY）
-- 去重后再 UPDATE，避免 uk_db_change_project_dbkey_version 冲突。

DELETE s FROM `db_change` s
INNER JOIN `db_change` c
  ON c.project_id = s.project_id
 AND c.db_key = '__erd_snapshot__'
 AND c.version = s.version
WHERE s.db_key = 'SNAPSHOT';

UPDATE `db_change`
SET db_key = '__erd_snapshot__'
WHERE db_key = 'SNAPSHOT';

DELETE d FROM `db_change` d
INNER JOIN `project` p ON p.id = d.project_id
INNER JOIN `db_change` t
  ON t.project_id = d.project_id
 AND t.version = d.version
 AND t.db_key = JSON_UNQUOTE(JSON_EXTRACT(p.projectJSON, '$.profile.defaultDataSourceId'))
WHERE d.db_key = 'defaultDB'
  AND JSON_EXTRACT(p.projectJSON, '$.profile.defaultDataSourceId') IS NOT NULL
  AND JSON_UNQUOTE(JSON_EXTRACT(p.projectJSON, '$.profile.defaultDataSourceId')) != '';

UPDATE `db_change` d
INNER JOIN `project` p ON p.id = d.project_id
SET d.db_key = JSON_UNQUOTE(JSON_EXTRACT(p.projectJSON, '$.profile.defaultDataSourceId'))
WHERE d.db_key = 'defaultDB'
  AND JSON_EXTRACT(p.projectJSON, '$.profile.defaultDataSourceId') IS NOT NULL
  AND JSON_UNQUOTE(JSON_EXTRACT(p.projectJSON, '$.profile.defaultDataSourceId')) != '';
