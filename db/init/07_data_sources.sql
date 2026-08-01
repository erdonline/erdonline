USE erd;

-- 全局数据源配置（设计器/数据库配置页 /ncnb/dataSources）
CREATE TABLE IF NOT EXISTS `data_sources` (
  `id` varchar(64) NOT NULL COMMENT '主键（兼容无连字符 UUID 与 RFC4122）',
  `name` varchar(128) DEFAULT NULL COMMENT '数据源名称',
  `type` varchar(32) DEFAULT NULL COMMENT '数据库类型',
  `connection_type` varchar(32) DEFAULT NULL COMMENT '连接方式 host|url',
  `host` varchar(255) DEFAULT NULL COMMENT '主机',
  `port` int DEFAULT NULL COMMENT '端口',
  `url` varchar(1024) DEFAULT NULL COMMENT 'JDBC URL',
  `driver_class_name` varchar(255) DEFAULT NULL COMMENT '驱动类名',
  `database_name` varchar(128) DEFAULT NULL COMMENT '库名',
  `username` varchar(128) DEFAULT NULL COMMENT '用户名',
  `password` varchar(255) DEFAULT NULL COMMENT '密码',
  `del_flag` char(1) DEFAULT '0' COMMENT '0正常 1删除',
  `revision` int DEFAULT NULL COMMENT '乐观锁',
  `creator` varchar(32) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `updater` varchar(32) DEFAULT NULL,
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_creator` (`creator`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='数据源配置';
