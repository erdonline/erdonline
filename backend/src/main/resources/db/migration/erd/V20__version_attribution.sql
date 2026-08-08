-- 推广链路：版本保存归因 append-only 表（渠道 → 北极星可查）
CREATE TABLE IF NOT EXISTS `version_attribution` (
    `id` varchar(64) NOT NULL COMMENT '主键',
    `db_change_id` varchar(64) DEFAULT NULL COMMENT '关联 db_change.id',
    `project_id` varchar(64) NOT NULL COMMENT '项目主键',
    `db_key` varchar(64) NOT NULL COMMENT '数据源标识',
    `version` varchar(20) NOT NULL COMMENT '版本号',
    `username` varchar(64) DEFAULT NULL COMMENT '存版用户',
    `utm_source` varchar(128) DEFAULT NULL,
    `utm_medium` varchar(128) DEFAULT NULL,
    `utm_campaign` varchar(128) DEFAULT NULL,
    `utm_content` varchar(128) DEFAULT NULL,
    `utm_term` varchar(128) DEFAULT NULL,
    `referrer` varchar(256) DEFAULT NULL,
    `landing` varchar(128) DEFAULT NULL,
    `attr_ts` bigint DEFAULT NULL COMMENT '前端首触时间戳 ms',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '落库时间',
    PRIMARY KEY (`id`),
    KEY `idx_va_project` (`project_id`),
    KEY `idx_va_utm_source` (`utm_source`),
    KEY `idx_va_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='版本保存归因（append-only）';
