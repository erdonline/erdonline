-- ADR-0032：字段库 data_dict（platform / group / user）+ 平台种子
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `data_dict` (
  `id` varchar(64) NOT NULL COMMENT '主键',
  `parent_id` varchar(64) NOT NULL DEFAULT '0' COMMENT '父级 ID',
  `is_leaf` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否叶子节点',
  `title` varchar(200) NOT NULL COMMENT '名称',
  `dict_code` varchar(128) DEFAULT NULL COMMENT '代码',
  `dict_info` json DEFAULT NULL COMMENT '字段/枚举片段 {fields,enums}',
  `description` varchar(500) DEFAULT NULL COMMENT '描述',
  `usage_count` int NOT NULL DEFAULT 0 COMMENT '使用次数',
  `scope_type` varchar(32) NOT NULL DEFAULT 'user' COMMENT 'platform|group|user',
  `scope_id` varchar(64) DEFAULT NULL COMMENT 'group=团队项目 id；user=user id；platform=NULL',
  `del_flag` char(1) NOT NULL DEFAULT '0',
  `creator` varchar(64) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `updater` varchar(64) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_data_dict_scope` (`scope_type`, `scope_id`),
  KEY `idx_data_dict_parent` (`parent_id`),
  KEY `idx_data_dict_code` (`dict_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='字段库（平台/团队/个人）';

-- 平台根
INSERT INTO `data_dict` (
  `id`, `parent_id`, `is_leaf`, `title`, `dict_code`, `dict_info`, `description`,
  `usage_count`, `scope_type`, `scope_id`, `del_flag`, `creator`, `updater`
) VALUES (
  'dd-platform-root',
  '0',
  0,
  '平台字段库',
  'platform_root',
  NULL,
  '系统预置字段与字段组',
  0,
  'platform',
  NULL,
  '0',
  'system',
  'system'
) ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `del_flag` = '0';

-- 分类：通用字段
INSERT INTO `data_dict` (
  `id`, `parent_id`, `is_leaf`, `title`, `dict_code`, `dict_info`, `description`,
  `usage_count`, `scope_type`, `scope_id`, `del_flag`, `creator`, `updater`
) VALUES (
  'dd-cat-common',
  'dd-platform-root',
  0,
  '通用字段',
  'common_fields',
  NULL,
  '单字段模板',
  0,
  'platform',
  NULL,
  '0',
  'system',
  'system'
) ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `del_flag` = '0';

-- 叶子：性别
INSERT INTO `data_dict` (
  `id`, `parent_id`, `is_leaf`, `title`, `dict_code`, `dict_info`, `description`,
  `usage_count`, `scope_type`, `scope_id`, `del_flag`, `creator`, `updater`
) VALUES (
  'dd-field-gender',
  'dd-cat-common',
  1,
  '性别',
  'gender',
  CAST('{"fields":[{"name":"gender","chnname":"性别","type":"Gender","typeName":"性别","dataType":"CHAR(1)","pk":false,"notNull":false,"autoIncrement":false,"relationNoShow":false,"defaultValue":"","remark":""}],"enums":[{"name":"性别","code":"Gender","kind":"enum","values":[{"name":"M","chnname":"男"},{"name":"F","chnname":"女"},{"name":"U","chnname":"未知"}],"apply":{"MYSQL":{"type":"CHAR(1)"},"ORACLE":{"type":"CHAR(1)"},"PostgreSQL":{"type":"CHAR(1)"},"SQLServer":{"type":"CHAR(1)"}}}]}' AS JSON),
  '性别枚举字段',
  0,
  'platform',
  NULL,
  '0',
  'system',
  'system'
) ON DUPLICATE KEY UPDATE
  `dict_info` = VALUES(`dict_info`),
  `del_flag` = '0';

-- 叶子：状态
INSERT INTO `data_dict` (
  `id`, `parent_id`, `is_leaf`, `title`, `dict_code`, `dict_info`, `description`,
  `usage_count`, `scope_type`, `scope_id`, `del_flag`, `creator`, `updater`
) VALUES (
  'dd-field-status',
  'dd-cat-common',
  1,
  '状态',
  'status',
  CAST('{"fields":[{"name":"status","chnname":"状态","type":"Status","typeName":"状态","dataType":"CHAR(1)","pk":false,"notNull":true,"autoIncrement":false,"relationNoShow":false,"defaultValue":"''1''","remark":""}],"enums":[{"name":"状态","code":"Status","kind":"enum","values":[{"name":"0","chnname":"禁用"},{"name":"1","chnname":"启用"}],"apply":{"MYSQL":{"type":"CHAR(1)"},"ORACLE":{"type":"CHAR(1)"},"PostgreSQL":{"type":"CHAR(1)"},"SQLServer":{"type":"CHAR(1)"}}}]}' AS JSON),
  '启用/禁用状态',
  0,
  'platform',
  NULL,
  '0',
  'system',
  'system'
) ON DUPLICATE KEY UPDATE
  `dict_info` = VALUES(`dict_info`),
  `del_flag` = '0';

-- 分类：字段组
INSERT INTO `data_dict` (
  `id`, `parent_id`, `is_leaf`, `title`, `dict_code`, `dict_info`, `description`,
  `usage_count`, `scope_type`, `scope_id`, `del_flag`, `creator`, `updater`
) VALUES (
  'dd-cat-groups',
  'dd-platform-root',
  0,
  '字段组',
  'field_groups',
  NULL,
  '多字段组合',
  0,
  'platform',
  NULL,
  '0',
  'system',
  'system'
) ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `del_flag` = '0';

-- 叶子：审计字段组
INSERT INTO `data_dict` (
  `id`, `parent_id`, `is_leaf`, `title`, `dict_code`, `dict_info`, `description`,
  `usage_count`, `scope_type`, `scope_id`, `del_flag`, `creator`, `updater`
) VALUES (
  'dd-group-audit',
  'dd-cat-groups',
  1,
  '审计字段组',
  'audit_fields',
  CAST('{"fields":[{"name":"del_flag","chnname":"删除标识（0-正常,1-删除）","type":"Char","typeName":"单字符","dataType":"CHAR(1)","pk":false,"notNull":false,"autoIncrement":false,"relationNoShow":true,"defaultValue":"''0''","remark":""},{"name":"revision","chnname":"乐观锁","type":"Integer","typeName":"整数","dataType":"INT","pk":false,"notNull":false,"autoIncrement":false,"relationNoShow":true,"defaultValue":"","remark":""},{"name":"creator","chnname":"创建人","type":"IdOrKey","typeName":"标识号","dataType":"VARCHAR(32)","pk":false,"notNull":false,"autoIncrement":false,"relationNoShow":true,"defaultValue":"","remark":""},{"name":"create_time","chnname":"创建时间","type":"DateTime","typeName":"日期时间","dataType":"DATETIME","pk":false,"notNull":false,"autoIncrement":false,"relationNoShow":true,"defaultValue":"CURRENT_TIMESTAMP","remark":""},{"name":"updater","chnname":"更新人","type":"IdOrKey","typeName":"标识号","dataType":"VARCHAR(32)","pk":false,"notNull":false,"autoIncrement":false,"relationNoShow":true,"defaultValue":"","remark":""},{"name":"update_time","chnname":"更新时间","type":"DateTime","typeName":"日期时间","dataType":"DATETIME","pk":false,"notNull":false,"autoIncrement":false,"relationNoShow":true,"defaultValue":"","remark":""}]}' AS JSON),
  'del_flag / revision / creator / create_time / updater / update_time',
  0,
  'platform',
  NULL,
  '0',
  'system',
  'system'
) ON DUPLICATE KEY UPDATE
  `dict_info` = VALUES(`dict_info`),
  `del_flag` = '0';
