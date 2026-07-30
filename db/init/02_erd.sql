USE erd;

/*
去navicate导出结构
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for db_approval
-- ----------------------------
DROP TABLE IF EXISTS `db_approval`;
CREATE TABLE `db_approval` (
                               `id` varchar(32) COLLATE utf8mb4_general_ci NOT NULL COMMENT '主键',
                               `project_id` varchar(32) COLLATE utf8mb4_general_ci NOT NULL COMMENT '项目id',
                               `promoter` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '发起人',
                               `version_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT '' COMMENT '审批版本',
                               `approver` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '审批人',
                               `db_info` varchar(512) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '数据库连接信息',
                               `approve_sql` text COLLATE utf8mb4_general_ci NOT NULL COMMENT '审批SQL',
                               `approve_remark` varchar(512) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '审批备注',
                               `approve_result` varchar(512) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '审批结果',
                               `approve_time` datetime DEFAULT NULL COMMENT '审批时间',
                               `approve_status` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT '0' COMMENT '审批状态',
                               `del_flag` char(1) COLLATE utf8mb4_general_ci DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                               `revision` int DEFAULT NULL COMMENT '乐观锁',
                               `creator` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '创建人',
                               `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                               `updater` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '更新人',
                               `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                               PRIMARY KEY (`id`),
                               KEY `idx_project_id` (`project_id`),
                               KEY `idx_promoter_approver_id` (`promoter`,`approver`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='元数据审批 ';

-- ----------------------------
-- Table structure for db_approval_copy1
-- ----------------------------
DROP TABLE IF EXISTS `db_approval_copy1`;
CREATE TABLE `db_approval_copy1` (
                                     `id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '主键',
                                     `project_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '项目id',
                                     `promoter` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '发起人',
                                     `version_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT '' COMMENT '审批版本',
                                     `approver` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '审批人',
                                     `db_info` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '数据库连接信息',
                                     `approve_sql` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '审批SQL',
                                     `approve_remark` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '审批备注',
                                     `approve_result` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '审批结果',
                                     `approve_time` datetime DEFAULT NULL COMMENT '审批时间',
                                     `approve_status` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT '0' COMMENT '审批状态',
                                     `del_flag` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                                     `revision` int DEFAULT NULL COMMENT '乐观锁',
                                     `creator` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '创建人',
                                     `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                     `updater` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '更新人',
                                     `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                                     PRIMARY KEY (`id`),
                                     KEY `idx_project_id` (`project_id`),
                                     KEY `idx_promoter_approver_id` (`promoter`,`approver`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='元数据审批 ';

-- ----------------------------
-- Table structure for db_change
-- ----------------------------
DROP TABLE IF EXISTS `db_change`;
CREATE TABLE `db_change` (
                             `id` varchar(64) NOT NULL COMMENT '主键',
                             `base_version` bit(1) DEFAULT NULL COMMENT '是否为基线版本',
                             `changes` longblob COMMENT '版本变动',
                             `project_id` varchar(64) NOT NULL COMMENT 'project主键',
                             `db_key` varchar(64) NOT NULL COMMENT '数据库标识',
                             `projectJSON` longblob COMMENT 'project配置',
                             `version` varchar(20) NOT NULL COMMENT '版本号',
                             `version_date` varchar(20) DEFAULT NULL COMMENT '版本创建时间',
                             `version_desc` varchar(500) DEFAULT NULL COMMENT '版本描述',
                             `create_time` datetime DEFAULT NULL COMMENT '创建时间',
                             `creator` varchar(32) DEFAULT NULL COMMENT '创建人',
                             PRIMARY KEY (`id`) USING BTREE,
                             UNIQUE KEY `uni_versin_projectid_dbkey` (`project_id`,`db_key`,`version`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COMMENT='变动表';

-- ----------------------------
-- Table structure for db_version
-- ----------------------------
DROP TABLE IF EXISTS `db_version`;
CREATE TABLE `db_version` (
                              `id` varchar(64) NOT NULL,
                              `db_version` varchar(256) NOT NULL COMMENT '版本号',
                              `version_desc` varchar(1024) DEFAULT NULL COMMENT '版本描述',
                              `project_id` varchar(64) NOT NULL COMMENT '项目主键',
                              `db_key` varchar(64) NOT NULL COMMENT '数据库标识',
                              `create_time` datetime DEFAULT NULL COMMENT '创建时间',
                              `creator` varchar(32) DEFAULT NULL COMMENT '创建人',
                              PRIMARY KEY (`id`),
                              UNIQUE KEY `db_version_project_key_uk` (`db_version`,`project_id`,`db_key`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COMMENT='版本表';

-- ----------------------------
-- Table structure for erd_json_schema
-- ----------------------------
DROP TABLE IF EXISTS `erd_json_schema`;
CREATE TABLE `erd_json_schema` (
                                   `id` int NOT NULL AUTO_INCREMENT,
                                   `module` json NOT NULL,
                                   `entity` json NOT NULL,
                                   `filed` json NOT NULL,
                                   `datatype` json NOT NULL,
                                   PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table structure for project
-- ----------------------------
DROP TABLE IF EXISTS `project`;
CREATE TABLE `project` (
                           `id` varchar(64) NOT NULL COMMENT '主键',
                           `projectJSON` json DEFAULT NULL COMMENT '项目JSON',
                           `configJSON` json DEFAULT NULL COMMENT '配置JSON',
                           `project_name` varchar(100) NOT NULL COMMENT '项目名称',
                           `description` varchar(100) DEFAULT '在线多人协作数据库建模' COMMENT '项目介绍',
                           `type` char(1) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '项目类型 1个人项目 2团队项目',
                           `tags` varchar(255) DEFAULT NULL COMMENT '项目标签',
                           `revision` int DEFAULT NULL COMMENT '乐观锁',
                           `del_flag` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                           `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                           `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                           `creator` varchar(32) DEFAULT NULL COMMENT '创建人',
                           `updater` varchar(32) DEFAULT NULL COMMENT '更新人',
                           PRIMARY KEY (`id`),
                           KEY `project_project_name_uindex` (`project_name`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COMMENT='项目表';

-- ----------------------------
-- Table structure for project_copy1
-- ----------------------------
DROP TABLE IF EXISTS `project_copy1`;
CREATE TABLE `project_copy1` (
                                 `id` varchar(64) NOT NULL COMMENT '主键',
                                 `configJSON` blob COMMENT '配置JSON',
                                 `temp_json1` json DEFAULT NULL,
                                 `temp_json` json DEFAULT NULL,
                                 `projectJSON` longblob COMMENT '项目JSON',
                                 `project_name` varchar(100) NOT NULL COMMENT '项目名称',
                                 `description` varchar(100) DEFAULT '在线多人协作数据库建模' COMMENT '项目介绍',
                                 `type` char(1) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '项目类型 1个人项目 2团队项目',
                                 `tags` varchar(255) DEFAULT NULL COMMENT '项目标签',
                                 `revision` int DEFAULT NULL COMMENT '乐观锁',
                                 `del_flag` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                                 `create_time` datetime DEFAULT NULL COMMENT '创建时间',
                                 `update_time` datetime DEFAULT NULL COMMENT '更新时间',
                                 `creator` varchar(32) DEFAULT NULL COMMENT '创建人',
                                 `updater` varchar(32) DEFAULT NULL COMMENT '更新人',
                                 PRIMARY KEY (`id`),
                                 KEY `project_project_name_uindex` (`project_name`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COMMENT='项目表';

-- ----------------------------
-- Table structure for project_copy2
-- ----------------------------
DROP TABLE IF EXISTS `project_copy2`;
CREATE TABLE `project_copy2` (
                                 `id` varchar(64) NOT NULL COMMENT '主键',
                                 `configJSON` blob COMMENT '配置JSON',
                                 `projectJSON` longblob COMMENT '项目JSON',
                                 `project_name` varchar(100) NOT NULL COMMENT '项目名称',
                                 `description` varchar(100) DEFAULT '在线多人协作数据库建模' COMMENT '项目介绍',
                                 `type` char(1) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '项目类型 1个人项目 2团队项目',
                                 `tags` varchar(255) DEFAULT NULL COMMENT '项目标签',
                                 `revision` int DEFAULT NULL COMMENT '乐观锁',
                                 `del_flag` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                                 `create_time` datetime DEFAULT NULL COMMENT '创建时间',
                                 `update_time` datetime DEFAULT NULL COMMENT '更新时间',
                                 `creator` varchar(32) DEFAULT NULL COMMENT '创建人',
                                 `updater` varchar(32) DEFAULT NULL COMMENT '更新人',
                                 PRIMARY KEY (`id`),
                                 KEY `project_project_name_uindex` (`project_name`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COMMENT='项目表';

-- ----------------------------
-- Table structure for project_role
-- ----------------------------
DROP TABLE IF EXISTS `project_role`;
CREATE TABLE `project_role` (
                                `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '主键',
                                `role_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '角色id',
                                `project_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '项目id',
                                `role_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL COMMENT '角色名称',
                                `role_code` varchar(64) COLLATE utf8mb4_general_ci NOT NULL COMMENT '角色标识',
                                PRIMARY KEY (`id`) USING BTREE,
                                KEY `idx_project_id` (`project_id`) USING BTREE,
                                KEY `idx_role_id` (`role_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Table structure for project_user
-- ----------------------------
DROP TABLE IF EXISTS `project_user`;
CREATE TABLE `project_user` (
                                `id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '主键 ',
                                `project_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '项目id ',
                                `role_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '-1' COMMENT '角色id',
                                `user_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '用户id ',
                                `revision` int DEFAULT NULL COMMENT '乐观锁',
                                `creator` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '创建人',
                                `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                `updater` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '更新人',
                                `update_time` datetime DEFAULT NULL COMMENT '更新时间',
                                KEY `idx_project_id` (`project_id`) USING BTREE,
                                KEY `idx_user_id` (`user_id`) USING BTREE,
                                KEY `idx_role_id` (`role_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='项目用户中间表 ';

-- ----------------------------
-- Table structure for query_history
-- ----------------------------
DROP TABLE IF EXISTS `query_history`;
CREATE TABLE `query_history` (
                                 `id` varchar(32) COLLATE utf8mb4_general_ci NOT NULL COMMENT '主键',
                                 `title` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '名称',
                                 `sql_info` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci COMMENT 'SQL语句',
                                 `db_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '执行数据库',
                                 `duration` int DEFAULT NULL COMMENT '耗时',
                                 `query_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '所属查询',
                                 `revision` int DEFAULT NULL COMMENT '乐观锁',
                                 `del_flag` char(1) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                                 `creator` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '创建人',
                                 `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                 `updater` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '更新人',
                                 `update_time` datetime DEFAULT NULL COMMENT '更新时间',
                                 PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='sql执行记录表 ';

-- ----------------------------
-- Table structure for query_info
-- ----------------------------
DROP TABLE IF EXISTS `query_info`;
CREATE TABLE `query_info` (
                              `id` varchar(32) COLLATE utf8mb4_general_ci NOT NULL COMMENT '主键',
                              `parent_id` varchar(32) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0' COMMENT '父级ID',
                              `title` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '名称',
                              `sql_info` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci COMMENT 'SQL语句',
                              `is_leaf` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否为叶子节点:1为true，0为false',
                              `project_id` varchar(32) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '所属项目',
                              `revision` int DEFAULT NULL COMMENT '乐观锁',
                              `del_flag` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                              `creator` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '创建人',
                              `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                              `updater` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '更新人',
                              `update_time` datetime DEFAULT NULL COMMENT '更新时间',
                              PRIMARY KEY (`id`),
                              UNIQUE KEY `uni_idx_title` (`title`,`project_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='sql信息表 ';

-- ----------------------------
-- Table structure for sys_permission
-- ----------------------------
DROP TABLE IF EXISTS `sys_permission`;
CREATE TABLE `sys_permission` (
                                  `id` varchar(64) NOT NULL,
                                  `name` varchar(200) NOT NULL,
                                  `description` varchar(200) DEFAULT NULL,
                                  `url` varchar(200) NOT NULL,
                                  `pid` bigint DEFAULT NULL,
                                  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for sys_permission_role
-- ----------------------------
DROP TABLE IF EXISTS `sys_permission_role`;
CREATE TABLE `sys_permission_role` (
                                       `id` varchar(64) NOT NULL,
                                       `role_id` varchar(64) NOT NULL,
                                       `permission_id` varchar(64) NOT NULL,
                                       PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for sys_role
-- ----------------------------
DROP TABLE IF EXISTS `sys_role`;
CREATE TABLE `sys_role` (
                            `id` varchar(64) NOT NULL,
                            `name` varchar(200) NOT NULL,
                            PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for sys_role_user
-- ----------------------------
DROP TABLE IF EXISTS `sys_role_user`;
CREATE TABLE `sys_role_user` (
                                 `id` varchar(64) NOT NULL,
                                 `sys_user_id` varchar(64) NOT NULL,
                                 `sys_role_id` varchar(64) NOT NULL,
                                 PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for sys_user
-- ----------------------------
DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE `sys_user` (
                            `id` varchar(64) NOT NULL,
                            `username` varchar(200) NOT NULL,
                            `password` varchar(200) NOT NULL,
                            PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for t_datatype
-- ----------------------------
DROP TABLE IF EXISTS `t_datatype`;
CREATE TABLE `t_datatype` (
                              `id` varchar(32) COLLATE utf8mb4_general_ci NOT NULL COMMENT '主键',
                              `del_flag` char(1) COLLATE utf8mb4_general_ci DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                              `revision` int DEFAULT NULL COMMENT '乐观锁',
                              `creator` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '创建人',
                              `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                              `updater` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '更新人',
                              `update_time` datetime DEFAULT NULL COMMENT '更新时间',
                              PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='数据域';

-- ----------------------------
-- Table structure for t_entity
-- ----------------------------
DROP TABLE IF EXISTS `t_entity`;
CREATE TABLE `t_entity` (
                            `id` varchar(32) COLLATE utf8mb4_general_ci NOT NULL COMMENT '主键',
                            `del_flag` char(1) COLLATE utf8mb4_general_ci DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                            `revision` int DEFAULT NULL COMMENT '乐观锁',
                            `creator` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '创建人',
                            `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                            `updater` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '更新人',
                            `update_time` datetime DEFAULT NULL COMMENT '更新时间',
                            PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='元数据';

-- ----------------------------
-- Table structure for t_field
-- ----------------------------
DROP TABLE IF EXISTS `t_field`;
CREATE TABLE `t_field` (
                           `id` varchar(32) COLLATE utf8mb4_general_ci NOT NULL COMMENT '主键',
                           `del_flag` char(1) COLLATE utf8mb4_general_ci DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                           `revision` int DEFAULT NULL COMMENT '乐观锁',
                           `creator` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '创建人',
                           `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                           `updater` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '更新人',
                           `update_time` datetime DEFAULT NULL COMMENT '更新时间',
                           PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='字段 ';

-- ----------------------------
-- Table structure for t_module
-- ----------------------------
DROP TABLE IF EXISTS `t_module`;
CREATE TABLE `t_module` (
                            `id` varchar(32) COLLATE utf8mb4_general_ci NOT NULL COMMENT '主键',
                            `del_flag` char(1) COLLATE utf8mb4_general_ci DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                            `revision` int DEFAULT NULL COMMENT '乐观锁',
                            `creator` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '创建人',
                            `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                            `updater` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '更新人',
                            `update_time` datetime DEFAULT NULL COMMENT '更新时间',
                            PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='模块';

-- ----------------------------
-- Table structure for team
-- ----------------------------
DROP TABLE IF EXISTS `team`;
CREATE TABLE `team` (
                        `REVISION` int DEFAULT NULL COMMENT '乐观锁',
                        `CREATOR` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '创建人',
                        `CREATE_TIME` datetime DEFAULT NULL COMMENT '创建时间',
                        `UPDATER` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '更新人',
                        `UPDATE_TIME` datetime DEFAULT NULL COMMENT '更新时间',
                        `id` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '主键',
                        `name` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '项目名称'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='123 ';

-- ----------------------------
-- Table structure for test
-- ----------------------------
DROP TABLE IF EXISTS `test`;
CREATE TABLE `test` (
    `test1` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table structure for test2
-- ----------------------------
DROP TABLE IF EXISTS `test2`;
CREATE TABLE `test2` (
                         `id` varchar(32) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'ä¸»é®',
                         `del_flag` char(1) COLLATE utf8mb4_general_ci DEFAULT '0' COMMENT 'å é¤æ è¯ï¼0-æ­£å¸¸,1-å é¤ï¼',
                         `revision` int DEFAULT NULL COMMENT 'ä¹è§é',
                         `creator` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'åå»ºäºº',
                         `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'åå»ºæ¶é´',
                         `updater` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'æ´æ°äºº',
                         `update_time` datetime DEFAULT NULL COMMENT 'æ´æ°æ¶é´',
                         PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='test2 ';

-- ----------------------------
-- Table structure for test_json
-- ----------------------------
DROP TABLE IF EXISTS `test_json`;
CREATE TABLE `test_json` (
                             `id` int NOT NULL AUTO_INCREMENT,
                             `test` json DEFAULT NULL,
                             PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;


