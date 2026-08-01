USE erd;

-- 只读分享链接（P3）：凭 token 匿名拉取项目快照字段
CREATE TABLE IF NOT EXISTS `project_share` (
  `id` varchar(32) NOT NULL COMMENT '主键',
  `token` varchar(64) NOT NULL COMMENT '分享令牌',
  `project_id` varchar(32) NOT NULL COMMENT '项目ID',
  `expire_time` datetime DEFAULT NULL COMMENT '过期时间，空=永不过期',
  `enabled` char(1) NOT NULL DEFAULT '1' COMMENT '1启用 0禁用',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '0正常 1删除',
  `creator` varchar(32) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `updater` varchar(32) DEFAULT NULL,
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_token` (`token`),
  KEY `idx_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='项目只读分享';
