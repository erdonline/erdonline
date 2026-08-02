USE `erd`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `oauth_client_details`;
CREATE TABLE `oauth_client_details` (
                                        `ID` varchar(45) NOT NULL COMMENT '主键',
                                        `CLIENT_ID` varchar(48) NOT NULL COMMENT '客户端唯一标识',
                                        `CLIENT_SECRET` varchar(256) NOT NULL COMMENT '客户端密码,必须要有前缀代表加密方式',
                                        `RESOURCE_IDS` varchar(256) DEFAULT NULL COMMENT '客户端能访问的资源id集合,不能为空，用逗号分隔',
                                        `SCOPE` varchar(256) NOT NULL COMMENT '围client的权限范围',
                                        `AUTHORIZED_GRANT_TYPES` varchar(256) DEFAULT NULL COMMENT '授权模式(可选值 授权码模式:authorization_code,密码模式:password,刷新token: refresh_token, 隐式模式: implicit: 客户端模式: client_credentials。支持多个用逗号分隔)',
                                        `WEB_SERVER_REDIRECT_URI` varchar(256) DEFAULT NULL COMMENT '客户端重定向uri',
                                        `AUTHORITIES` varchar(256) DEFAULT NULL COMMENT '指定用户的权限范围，implicit和client_credentials需要',
                                        `ACCESS_TOKEN_VALIDITY` int DEFAULT NULL COMMENT '设置access_token的有效时间(秒),默认(606012,12小时)',
                                        `REFRESH_TOKEN_VALIDITY` int DEFAULT NULL COMMENT '设置refresh_token有效期(秒)，默认(606024*30, 30填)',
                                        `ADDITIONAL_INFORMATION` varchar(4096) DEFAULT NULL COMMENT '额外的信息，值必须是json格式',
                                        `AUTOAPPROVE` varchar(256) DEFAULT NULL COMMENT '默认false,适用于authorization_code模式,设置用户是否自动approval操作,设置true跳过用户确认授权操作页面，直接跳到redirect_uri',
                                        `CREATOR` varchar(45) DEFAULT NULL COMMENT '创建人',
                                        `UPDATER` varchar(45) DEFAULT NULL COMMENT '修改人',
                                        PRIMARY KEY (`ID`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='oauth2客户端 ';

DROP TABLE IF EXISTS `QRTZ_BLOB_TRIGGERS`;
CREATE TABLE `QRTZ_BLOB_TRIGGERS` (
                                      `SCHED_NAME` varchar(120) NOT NULL,
                                      `TRIGGER_NAME` varchar(190) NOT NULL,
                                      `TRIGGER_GROUP` varchar(190) NOT NULL,
                                      `BLOB_DATA` blob,
                                      PRIMARY KEY (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
                                      KEY `SCHED_NAME` (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
                                      CONSTRAINT `qrtz_blob_triggers_ibfk_1` FOREIGN KEY (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`) REFERENCES `QRTZ_TRIGGERS` (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

DROP TABLE IF EXISTS `QRTZ_CALENDARS`;
CREATE TABLE `QRTZ_CALENDARS` (
                                  `SCHED_NAME` varchar(120) NOT NULL,
                                  `CALENDAR_NAME` varchar(190) NOT NULL,
                                  `CALENDAR` blob NOT NULL,
                                  PRIMARY KEY (`SCHED_NAME`,`CALENDAR_NAME`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

DROP TABLE IF EXISTS `QRTZ_CRON_TRIGGERS`;
CREATE TABLE `QRTZ_CRON_TRIGGERS` (
                                      `SCHED_NAME` varchar(120) NOT NULL,
                                      `TRIGGER_NAME` varchar(190) NOT NULL,
                                      `TRIGGER_GROUP` varchar(190) NOT NULL,
                                      `CRON_EXPRESSION` varchar(120) NOT NULL,
                                      `TIME_ZONE_ID` varchar(80) DEFAULT NULL,
                                      PRIMARY KEY (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
                                      CONSTRAINT `qrtz_cron_triggers_ibfk_1` FOREIGN KEY (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`) REFERENCES `QRTZ_TRIGGERS` (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

DROP TABLE IF EXISTS `QRTZ_FIRED_TRIGGERS`;
CREATE TABLE `QRTZ_FIRED_TRIGGERS` (
                                       `SCHED_NAME` varchar(120) NOT NULL,
                                       `ENTRY_ID` varchar(95) NOT NULL,
                                       `TRIGGER_NAME` varchar(190) NOT NULL,
                                       `TRIGGER_GROUP` varchar(190) NOT NULL,
                                       `INSTANCE_NAME` varchar(190) NOT NULL,
                                       `FIRED_TIME` bigint NOT NULL,
                                       `SCHED_TIME` bigint NOT NULL,
                                       `PRIORITY` int NOT NULL,
                                       `STATE` varchar(16) NOT NULL,
                                       `JOB_NAME` varchar(190) DEFAULT NULL,
                                       `JOB_GROUP` varchar(190) DEFAULT NULL,
                                       `IS_NONCONCURRENT` varchar(1) DEFAULT NULL,
                                       `REQUESTS_RECOVERY` varchar(1) DEFAULT NULL,
                                       PRIMARY KEY (`SCHED_NAME`,`ENTRY_ID`),
                                       KEY `IDX_QRTZ_FT_TRIG_INST_NAME` (`SCHED_NAME`,`INSTANCE_NAME`),
                                       KEY `IDX_QRTZ_FT_INST_JOB_REQ_RCVRY` (`SCHED_NAME`,`INSTANCE_NAME`,`REQUESTS_RECOVERY`),
                                       KEY `IDX_QRTZ_FT_J_G` (`SCHED_NAME`,`JOB_NAME`,`JOB_GROUP`),
                                       KEY `IDX_QRTZ_FT_JG` (`SCHED_NAME`,`JOB_GROUP`),
                                       KEY `IDX_QRTZ_FT_T_G` (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
                                       KEY `IDX_QRTZ_FT_TG` (`SCHED_NAME`,`TRIGGER_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

DROP TABLE IF EXISTS `QRTZ_HISTORY`;
CREATE TABLE `QRTZ_HISTORY` (
                                `ID` int NOT NULL AUTO_INCREMENT COMMENT '主键',
                                `SCHED_NAME` varchar(120) NOT NULL COMMENT '调度器名称',
                                `TRIGGER_NAME` varchar(190) NOT NULL COMMENT '触发器名称',
                                `TRIGGER_GROUP` varchar(190) NOT NULL COMMENT '触发器分组',
                                `JOB_NAME` varchar(190) NOT NULL COMMENT '任务名称',
                                `JOB_GROUP` varchar(190) NOT NULL COMMENT '任务分组',
                                `JOB_STATUS` varchar(10) DEFAULT NULL COMMENT '任务执行状态',
                                `NEXT_FIRE_TIME` bigint DEFAULT NULL COMMENT '下次执行时间',
                                `PREV_FIRE_TIME` bigint DEFAULT NULL COMMENT '上次执行时间',
                                `JOB_DATA` varchar(200) DEFAULT NULL COMMENT '任务执行记录日志',
                                `DEL_FLAG` char(1) DEFAULT NULL COMMENT '删除标识（0-正常,1-删除）',
                                `CREATE_TIME` datetime DEFAULT NULL COMMENT '创建时间',
                                `UPDATE_TIME` datetime DEFAULT NULL COMMENT '更新时间',
                                `CREATOR` varchar(45) DEFAULT NULL COMMENT '创建人',
                                `UPDATER` varchar(45) DEFAULT NULL COMMENT '修改人',
                                PRIMARY KEY (`ID`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1031 DEFAULT CHARSET=utf8mb3;

DROP TABLE IF EXISTS `QRTZ_JOB_DETAILS`;
CREATE TABLE `QRTZ_JOB_DETAILS` (
                                    `SCHED_NAME` varchar(120) NOT NULL,
                                    `JOB_NAME` varchar(190) NOT NULL,
                                    `JOB_GROUP` varchar(190) NOT NULL,
                                    `DESCRIPTION` varchar(250) DEFAULT NULL,
                                    `JOB_CLASS_NAME` varchar(250) NOT NULL,
                                    `IS_DURABLE` varchar(1) NOT NULL,
                                    `IS_NONCONCURRENT` varchar(1) NOT NULL,
                                    `IS_UPDATE_DATA` varchar(1) NOT NULL,
                                    `REQUESTS_RECOVERY` varchar(1) NOT NULL,
                                    `JOB_DATA` blob,
                                    PRIMARY KEY (`SCHED_NAME`,`JOB_NAME`,`JOB_GROUP`),
                                    KEY `IDX_QRTZ_J_REQ_RECOVERY` (`SCHED_NAME`,`REQUESTS_RECOVERY`),
                                    KEY `IDX_QRTZ_J_GRP` (`SCHED_NAME`,`JOB_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

DROP TABLE IF EXISTS `QRTZ_LOCKS`;
CREATE TABLE `QRTZ_LOCKS` (
                              `SCHED_NAME` varchar(120) NOT NULL,
                              `LOCK_NAME` varchar(40) NOT NULL,
                              PRIMARY KEY (`SCHED_NAME`,`LOCK_NAME`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

DROP TABLE IF EXISTS `QRTZ_PAUSED_TRIGGER_GRPS`;
CREATE TABLE `QRTZ_PAUSED_TRIGGER_GRPS` (
                                            `SCHED_NAME` varchar(120) NOT NULL,
                                            `TRIGGER_GROUP` varchar(190) NOT NULL,
                                            PRIMARY KEY (`SCHED_NAME`,`TRIGGER_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

DROP TABLE IF EXISTS `QRTZ_SCHEDULER_STATE`;
CREATE TABLE `QRTZ_SCHEDULER_STATE` (
                                        `SCHED_NAME` varchar(120) NOT NULL,
                                        `INSTANCE_NAME` varchar(190) NOT NULL,
                                        `LAST_CHECKIN_TIME` bigint NOT NULL,
                                        `CHECKIN_INTERVAL` bigint NOT NULL,
                                        PRIMARY KEY (`SCHED_NAME`,`INSTANCE_NAME`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

DROP TABLE IF EXISTS `QRTZ_SIMPLE_TRIGGERS`;
CREATE TABLE `QRTZ_SIMPLE_TRIGGERS` (
                                        `SCHED_NAME` varchar(120) NOT NULL,
                                        `TRIGGER_NAME` varchar(190) NOT NULL,
                                        `TRIGGER_GROUP` varchar(190) NOT NULL,
                                        `REPEAT_COUNT` bigint NOT NULL,
                                        `REPEAT_INTERVAL` bigint NOT NULL,
                                        `TIMES_TRIGGERED` bigint NOT NULL,
                                        PRIMARY KEY (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
                                        CONSTRAINT `qrtz_simple_triggers_ibfk_1` FOREIGN KEY (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`) REFERENCES `QRTZ_TRIGGERS` (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

DROP TABLE IF EXISTS `QRTZ_SIMPROP_TRIGGERS`;
CREATE TABLE `QRTZ_SIMPROP_TRIGGERS` (
                                         `SCHED_NAME` varchar(120) NOT NULL,
                                         `TRIGGER_NAME` varchar(190) NOT NULL,
                                         `TRIGGER_GROUP` varchar(190) NOT NULL,
                                         `STR_PROP_1` varchar(512) DEFAULT NULL,
                                         `STR_PROP_2` varchar(512) DEFAULT NULL,
                                         `STR_PROP_3` varchar(512) DEFAULT NULL,
                                         `INT_PROP_1` int DEFAULT NULL,
                                         `INT_PROP_2` int DEFAULT NULL,
                                         `LONG_PROP_1` bigint DEFAULT NULL,
                                         `LONG_PROP_2` bigint DEFAULT NULL,
                                         `DEC_PROP_1` decimal(13,4) DEFAULT NULL,
                                         `DEC_PROP_2` decimal(13,4) DEFAULT NULL,
                                         `BOOL_PROP_1` varchar(1) DEFAULT NULL,
                                         `BOOL_PROP_2` varchar(1) DEFAULT NULL,
                                         PRIMARY KEY (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
                                         CONSTRAINT `qrtz_simprop_triggers_ibfk_1` FOREIGN KEY (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`) REFERENCES `QRTZ_TRIGGERS` (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

DROP TABLE IF EXISTS `QRTZ_TRIGGERS`;
CREATE TABLE `QRTZ_TRIGGERS` (
                                 `SCHED_NAME` varchar(120) NOT NULL,
                                 `TRIGGER_NAME` varchar(190) NOT NULL,
                                 `TRIGGER_GROUP` varchar(190) NOT NULL,
                                 `JOB_NAME` varchar(190) NOT NULL,
                                 `JOB_GROUP` varchar(190) NOT NULL,
                                 `DESCRIPTION` varchar(250) DEFAULT NULL,
                                 `NEXT_FIRE_TIME` bigint DEFAULT NULL,
                                 `PREV_FIRE_TIME` bigint DEFAULT NULL,
                                 `PRIORITY` int DEFAULT NULL,
                                 `TRIGGER_STATE` varchar(16) NOT NULL,
                                 `TRIGGER_TYPE` varchar(8) NOT NULL,
                                 `START_TIME` bigint NOT NULL,
                                 `END_TIME` bigint DEFAULT NULL,
                                 `CALENDAR_NAME` varchar(190) DEFAULT NULL,
                                 `MISFIRE_INSTR` smallint DEFAULT NULL,
                                 `JOB_DATA` blob,
                                 PRIMARY KEY (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
                                 KEY `IDX_QRTZ_T_J` (`SCHED_NAME`,`JOB_NAME`,`JOB_GROUP`),
                                 KEY `IDX_QRTZ_T_JG` (`SCHED_NAME`,`JOB_GROUP`),
                                 KEY `IDX_QRTZ_T_C` (`SCHED_NAME`,`CALENDAR_NAME`),
                                 KEY `IDX_QRTZ_T_G` (`SCHED_NAME`,`TRIGGER_GROUP`),
                                 KEY `IDX_QRTZ_T_STATE` (`SCHED_NAME`,`TRIGGER_STATE`),
                                 KEY `IDX_QRTZ_T_N_STATE` (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`,`TRIGGER_STATE`),
                                 KEY `IDX_QRTZ_T_N_G_STATE` (`SCHED_NAME`,`TRIGGER_GROUP`,`TRIGGER_STATE`),
                                 KEY `IDX_QRTZ_T_NEXT_FIRE_TIME` (`SCHED_NAME`,`NEXT_FIRE_TIME`),
                                 KEY `IDX_QRTZ_T_NFT_ST` (`SCHED_NAME`,`TRIGGER_STATE`,`NEXT_FIRE_TIME`),
                                 KEY `IDX_QRTZ_T_NFT_MISFIRE` (`SCHED_NAME`,`MISFIRE_INSTR`,`NEXT_FIRE_TIME`),
                                 KEY `IDX_QRTZ_T_NFT_ST_MISFIRE` (`SCHED_NAME`,`MISFIRE_INSTR`,`NEXT_FIRE_TIME`,`TRIGGER_STATE`),
                                 KEY `IDX_QRTZ_T_NFT_ST_MISFIRE_GRP` (`SCHED_NAME`,`MISFIRE_INSTR`,`NEXT_FIRE_TIME`,`TRIGGER_GROUP`,`TRIGGER_STATE`),
                                 CONSTRAINT `qrtz_triggers_ibfk_1` FOREIGN KEY (`SCHED_NAME`, `JOB_NAME`, `JOB_GROUP`) REFERENCES `QRTZ_JOB_DETAILS` (`SCHED_NAME`, `JOB_NAME`, `JOB_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

DROP TABLE IF EXISTS `sys_announcement`;
CREATE TABLE `sys_announcement` (
                                    `id` varchar(32) COLLATE utf8mb4_general_ci NOT NULL COMMENT '主键',
                                    `title` varchar(128) COLLATE utf8mb4_general_ci NOT NULL COMMENT '标题',
                                    `content` varchar(1024) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '内容',
                                    `url` varchar(1024) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '跳转地址',
                                    `del_flag` char(1) COLLATE utf8mb4_general_ci DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                                    `revision` int DEFAULT NULL COMMENT '乐观锁',
                                    `creator` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '创建人',
                                    `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                    `updater` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '更新人',
                                    `update_time` datetime DEFAULT NULL COMMENT '更新时间',
                                    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='公告表 ';

DROP TABLE IF EXISTS `sys_code`;
CREATE TABLE `sys_code` (
                            `id` varchar(45) NOT NULL COMMENT '主键',
                            `table_name` varchar(255) DEFAULT '' COMMENT '表名',
                            `table_comment` varchar(255) DEFAULT '' COMMENT '表注释',
                            `table_prefix` varchar(255) DEFAULT '' COMMENT '表前缀',
                            `module_name` varchar(255) DEFAULT '' COMMENT '所属模块',
                            `module_code` varchar(255) DEFAULT '' COMMENT '模块编码',
                            `parent` varchar(255) DEFAULT '' COMMENT '包名',
                            `author` varchar(50) DEFAULT NULL COMMENT '作者',
                            `db_url` varchar(200) DEFAULT NULL COMMENT 'url',
                            `db_driver_name` varchar(100) DEFAULT NULL COMMENT '驱动名称',
                            `db_username` varchar(100) DEFAULT NULL COMMENT '用户名',
                            `db_password` varchar(100) DEFAULT NULL COMMENT '密码',
                            `tenant_id` varchar(45) DEFAULT '0' COMMENT '所属租户',
                            `del_flag` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                            `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                            `update_time` datetime DEFAULT NULL COMMENT '更新时间',
                            `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
                            `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
                            `menu` varchar(255) DEFAULT NULL COMMENT '按钮',
                            PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统代码生成表';

DROP TABLE IF EXISTS `sys_config`;
CREATE TABLE `sys_config` (
                              `ID` varchar(45) NOT NULL COMMENT '主键',
                              `NAME` varchar(50) DEFAULT NULL COMMENT '名称',
                              `VALUE` varchar(100) DEFAULT NULL COMMENT '配置值',
                              `TYPE` varchar(40) NOT NULL COMMENT '配置关键字',
                              `TENANT_ID` varchar(45) NOT NULL DEFAULT '0' COMMENT '租户',
                              `DEL_FLAG` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                              `CREATE_TIME` datetime DEFAULT NULL COMMENT '创建时间',
                              `UPDATE_TIME` datetime DEFAULT NULL COMMENT '更新时间',
                              `CREATOR` varchar(45) DEFAULT NULL COMMENT '创建人',
                              `UPDATER` varchar(45) DEFAULT NULL COMMENT '修改人',
                              PRIMARY KEY (`ID`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统配置 ';

DROP TABLE IF EXISTS `sys_dept`;
CREATE TABLE `sys_dept` (
                            `id` varchar(11) NOT NULL COMMENT '主键',
                            `name` varchar(50) DEFAULT NULL COMMENT '部门名称',
                            `address` varchar(200) DEFAULT NULL COMMENT '部门所在地',
                            `phone` varchar(50) DEFAULT NULL COMMENT '部门电话',
                            `dept_level` int DEFAULT NULL COMMENT '部门级别',
                            `sort` int DEFAULT NULL COMMENT '排序',
                            `dept_id` varchar(45) DEFAULT NULL COMMENT '上级部门id',
                            `tenant_id` varchar(45) DEFAULT NULL COMMENT '所属租户',
                            `del_flag` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                            `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                            `update_time` datetime DEFAULT NULL COMMENT '更新时间',
                            `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
                            `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
                            PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统部门';

DROP TABLE IF EXISTS `sys_dept_role`;
CREATE TABLE `sys_dept_role` (
                                 `id` varchar(45) NOT NULL COMMENT '主键',
                                 `dept_id` varchar(45) NOT NULL COMMENT '部门id',
                                 `role_id` varchar(45) NOT NULL COMMENT '角色id',
                                 `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                 `update_time` datetime DEFAULT NULL COMMENT '修改时间',
                                 `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
                                 `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
                                 PRIMARY KEY (`id`) USING BTREE,
                                 KEY `fk_sys_dept_has_sys_role_sys_role1_idx` (`role_id`) USING BTREE,
                                 KEY `fk_sys_dept_has_sys_role_sys_dept1_idx` (`dept_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统部门角色关系';

DROP TABLE IF EXISTS `sys_dept_user`;
CREATE TABLE `sys_dept_user` (
                                 `id` varchar(45) NOT NULL COMMENT '主键',
                                 `user_id` varchar(45) NOT NULL COMMENT '用户id',
                                 `dept_id` varchar(45) NOT NULL COMMENT '部门id',
                                 `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                 `update_time` datetime DEFAULT NULL COMMENT '修改时间',
                                 `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
                                 `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
                                 PRIMARY KEY (`id`) USING BTREE,
                                 KEY `fk_sys_user_has_sys_dept_sys_dept1_idx` (`dept_id`) USING BTREE,
                                 KEY `fk_sys_user_has_sys_dept_sys_user1_idx` (`user_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统用户部门关系';

DROP TABLE IF EXISTS `sys_dict`;
CREATE TABLE `sys_dict` (
                            `id` varchar(45) NOT NULL COMMENT '主键',
                            `value` varchar(100) NOT NULL COMMENT '数据值',
                            `label` varchar(100) NOT NULL COMMENT '标签名',
                            `type` varchar(100) NOT NULL COMMENT '类型',
                            `description` varchar(100) NOT NULL COMMENT '描述',
                            `sort` int NOT NULL COMMENT '排序（升序）',
                            `remarks` varchar(255) DEFAULT NULL COMMENT '备注信息',
                            `tenant_id` varchar(45) NOT NULL DEFAULT '0' COMMENT '所属租户',
                            `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                            `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                            `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                            `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
                            `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
                            PRIMARY KEY (`id`) USING BTREE,
                            KEY `sys_dict_value` (`value`) USING BTREE,
                            KEY `sys_dict_label` (`label`) USING BTREE,
                            KEY `sys_dict_del_flag` (`del_flag`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统字典';

DROP TABLE IF EXISTS `sys_element`;
CREATE TABLE `sys_element` (
                               `id` varchar(45) NOT NULL COMMENT '主键',
                               `name` varchar(32) NOT NULL COMMENT '页面元素名称',
                               `authority` varchar(32) NOT NULL COMMENT '权限编码',
                               `flag_request_method` varchar(45) DEFAULT NULL COMMENT '请求类型',
                               `url` varchar(250) DEFAULT NULL COMMENT '页面元素路径',
                               `sort` int DEFAULT '1' COMMENT '排序值',
                               `tenant_id` varchar(45) NOT NULL DEFAULT '0' COMMENT '所属租户',
                               `del_flag` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                               `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                               `update_time` datetime DEFAULT NULL COMMENT '更新时间',
                               `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
                               `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
                               PRIMARY KEY (`id`) USING BTREE,
                               UNIQUE KEY `code_UNIQUE` (`authority`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统页面元素';

DROP TABLE IF EXISTS `sys_file`;
CREATE TABLE `sys_file` (
                            `id` varchar(45) NOT NULL COMMENT '主键',
                            `name` varchar(32) NOT NULL COMMENT '文件名称',
                            `authority` varchar(32) NOT NULL COMMENT '权限编码',
                            `flag_request_method` int DEFAULT NULL COMMENT '请求类型',
                            `url` varchar(250) DEFAULT NULL COMMENT '文件路径',
                            `sort` int DEFAULT '1' COMMENT '排序值',
                            `tenant_id` varchar(45) NOT NULL DEFAULT '0' COMMENT '所属租户',
                            `del_flag` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                            `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                            `update_time` datetime DEFAULT NULL COMMENT '更新时间',
                            `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
                            `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
                            PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统文件';

DROP TABLE IF EXISTS `sys_log`;
CREATE TABLE `sys_log` (
                           `id` varchar(45) NOT NULL COMMENT '主键',
                           `type` int DEFAULT NULL COMMENT '日志状态',
                           `title` varchar(255) DEFAULT '' COMMENT '日志标题',
                           `remote_addr` varchar(255) DEFAULT NULL COMMENT '操作IP地址',
                           `user_agent` varchar(1000) DEFAULT NULL COMMENT '用户代理',
                           `request_uri` varchar(255) DEFAULT NULL COMMENT '请求URI',
                           `method` varchar(10) DEFAULT NULL COMMENT '操作方式',
                           `params` text COMMENT '操作提交的数据',
                           `body` varchar(4000) DEFAULT NULL COMMENT '请求body体',
                           `time` bigint DEFAULT NULL COMMENT '执行时间(ms)',
                           `exception` text COMMENT '异常信息',
                           `tenant_id` varchar(45) DEFAULT '0' COMMENT '所属租户',
                           `del_flag` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                           `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                           `update_time` datetime DEFAULT NULL COMMENT '更新时间',
                           `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
                           `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
                           PRIMARY KEY (`id`) USING BTREE,
                           KEY `sys_log_type` (`type`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统日志';

DROP TABLE IF EXISTS `sys_menu`;
CREATE TABLE `sys_menu` (
  `id` varchar(45) NOT NULL COMMENT '主键',
  `name` varchar(32) NOT NULL COMMENT '菜单名称',
  `authority` varchar(50) NOT NULL COMMENT '权限编码',
  `flag_project_group` varchar(45) DEFAULT NULL COMMENT '所属项目分组',
  `flag_request_method` varchar(45) DEFAULT NULL COMMENT '请求类型',
  `url` varchar(250) DEFAULT NULL COMMENT '后端权限url',
  `path` varchar(128) DEFAULT NULL COMMENT '前端URL',
  `target` varchar(50) DEFAULT '_blank' COMMENT '重定向操作',
  `table_name` varchar(50) DEFAULT NULL COMMENT '绑定表名',
  `menu_id` varchar(45) DEFAULT NULL COMMENT '父菜单ID',
  `icon` varchar(32) DEFAULT NULL COMMENT '图标',
  `locale` varchar(45) DEFAULT NULL COMMENT '国际化字段',
  `parent_key` varchar(200) DEFAULT NULL COMMENT '父菜单路径',
  `ui_key` varchar(100) DEFAULT NULL COMMENT '任意值',
  `component` varchar(64) DEFAULT NULL COMMENT '前端组件',
  `sort` int DEFAULT '1' COMMENT '排序值',
  `hide_in_menu` bit(1) DEFAULT b'0' COMMENT '是否隐藏菜单',
  `hide_children_in_menu` bit(1) DEFAULT b'0' COMMENT '是否隐藏子菜单',
  `dev` bit(1) NOT NULL DEFAULT b'0' COMMENT '是否为演示数据',
  `flag_is_gent_operation` bit(1) DEFAULT b'0' COMMENT '是否已生成按钮',
  `tenant_id` varchar(45) NOT NULL DEFAULT '0' COMMENT '所属租户',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
  `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_authority` (`authority`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统菜单';

DROP TABLE IF EXISTS `sys_operation`;
CREATE TABLE `sys_operation` (
  `id` varchar(45) NOT NULL COMMENT '主键',
  `name` varchar(32) NOT NULL COMMENT '操作名称',
  `authority` varchar(64) DEFAULT NULL COMMENT '权限编码',
  `flag_request_method` varchar(45) DEFAULT NULL COMMENT '请求类型',
  `url` varchar(250) DEFAULT NULL COMMENT '后端权限url',
  `parent_id` varchar(45) DEFAULT NULL COMMENT '父操作id',
  `menu_id` varchar(45) DEFAULT NULL COMMENT '所属菜单',
  `icon` varchar(32) DEFAULT NULL COMMENT '图标',
  `component` varchar(64) DEFAULT NULL COMMENT '前端组件',
  `sort` int DEFAULT '1' COMMENT '排序值',
  `tenant_id` varchar(45) NOT NULL DEFAULT '0' COMMENT '所属租户',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
  `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `code_UNIQUE` (`authority`) USING BTREE,
  KEY `sys_operation_menu_id_index` (`menu_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统操作';

DROP TABLE IF EXISTS `sys_privilege`;
CREATE TABLE `sys_privilege` (
  `id` varchar(45) NOT NULL COMMENT '主键',
  `type` varchar(50) NOT NULL COMMENT '权限类型',
  `resource_id` varchar(45) NOT NULL COMMENT '资源id',
  `role_id` varchar(45) NOT NULL COMMENT '角色id',
  `dict_id` varchar(45) NOT NULL COMMENT '权限类型',
  `tenant_id` varchar(45) NOT NULL DEFAULT '0' COMMENT '所属租户',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
  `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `sys_dict_del_flag` (`del_flag`) USING BTREE,
  KEY `fk_sys_privilege_sys_dict1_idx` (`dict_id`) USING BTREE,
  KEY `sys_privilege_role_id_index` (`role_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统权限';

DROP TABLE IF EXISTS `sys_role`;
CREATE TABLE `sys_role` (
  `id` varchar(45) NOT NULL COMMENT '主键',
  `role_name` varchar(64) NOT NULL COMMENT '角色名称',
  `role_code` varchar(64) NOT NULL COMMENT '角色编码',
  `role_desc` varchar(255) DEFAULT NULL COMMENT '角色描述',
  `ds_type` char(1) NOT NULL DEFAULT '2' COMMENT '数据权限类型',
  `ds_scope` varchar(255) DEFAULT NULL COMMENT '数据权限范围',
  `project_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT '0' COMMENT '所属项目',
  `tenant_id` varchar(45) DEFAULT NULL COMMENT '所属租户',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
  `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `role_idx1_role_code` (`role_code`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统角色';

DROP TABLE IF EXISTS `sys_role_privilege`;
CREATE TABLE `sys_role_privilege` (
  `id` varchar(45) NOT NULL COMMENT '主键',
  `role_id` varchar(45) NOT NULL COMMENT '角色id',
  `resource_id` varchar(45) DEFAULT NULL COMMENT '资源id',
  `dict_id` varchar(45) DEFAULT NULL COMMENT '权限类型',
  `tenant_id` varchar(45) DEFAULT '0' COMMENT '所属租户',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '修改时间',
  `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
  `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `fk_sys_role_has_sys_privilege_sys_role1_idx` (`role_id`) USING BTREE,
  KEY `sys_role_privilege_dict_id_index` (`dict_id`) USING BTREE,
  KEY `sys_role_privilege_resource_id_index` (`resource_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统角色权限关系--废弃';

DROP TABLE IF EXISTS `sys_social_details`;
CREATE TABLE `sys_social_details` (
  `id` varchar(45) NOT NULL COMMENT '主鍵',
  `type` varchar(16) NOT NULL COMMENT '类型',
  `remark` varchar(64) DEFAULT NULL COMMENT '描述',
  `app_id` varchar(64) NOT NULL COMMENT 'appid',
  `app_secret` varchar(64) NOT NULL COMMENT 'app_secret',
  `redirect_url` varchar(128) DEFAULT NULL COMMENT '回调地址',
  `tenant_id` varchar(45) NOT NULL DEFAULT '0' COMMENT '所属租户',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
  `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统社交账号';

DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE `sys_user` (
  `id` varchar(45) NOT NULL COMMENT '主键',
  `name` varchar(50) DEFAULT NULL COMMENT '姓名',
  `username` varchar(64) NOT NULL COMMENT '用户名',
  `nickname` varchar(100) DEFAULT NULL COMMENT '昵称',
  `gender` char(1) DEFAULT NULL COMMENT '性别',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像',
  `blog` varchar(255) DEFAULT NULL COMMENT '博客',
  `company` varchar(64) DEFAULT NULL COMMENT '公司',
  `location` varchar(255) DEFAULT NULL COMMENT '地址',
  `email` varchar(50) DEFAULT NULL COMMENT '邮箱',
  `pwd` varchar(255) NOT NULL COMMENT '密码',
  `salt` varchar(255) DEFAULT NULL COMMENT '随机盐',
  `age` int DEFAULT NULL COMMENT '年纪',
  `signature` varchar(100) DEFAULT NULL COMMENT '签名',
  `title` varchar(45) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT '全球第一个开源在线数据库建模平台' COMMENT '头衔',
  `classification` varchar(100) DEFAULT NULL COMMENT '分类',
  `phone` varchar(20) DEFAULT NULL COMMENT '电话',
  `dept_id` varchar(45) DEFAULT NULL COMMENT '部门ID',
  `wechat_openid` varchar(32) DEFAULT NULL COMMENT '微信openid',
  `qq_openid` varchar(32) DEFAULT NULL COMMENT 'QQ openid',
  `tenant_id` varchar(45) NOT NULL DEFAULT '0' COMMENT '所属租户',
  `lock_flag` char(1) DEFAULT '0' COMMENT '0-正常，9-锁定',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '修改时间',
  `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
  `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `username_UNIQUE` (`username`) USING BTREE,
  KEY `user_wx_openid` (`wechat_openid`) USING BTREE,
  KEY `user_qq_openid` (`qq_openid`) USING BTREE,
  KEY `user_idx1_username` (`username`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统用户';

DROP TABLE IF EXISTS `sys_user_role`;
CREATE TABLE `sys_user_role` (
  `id` varchar(45) NOT NULL COMMENT '主键',
  `user_id` varchar(45) NOT NULL COMMENT '用户id',
  `role_id` varchar(45) NOT NULL COMMENT '角色id',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NULL DEFAULT NULL COMMENT '修改时间',
  `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
  `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `sys_user_role_pk` (`user_id`,`role_id`) USING BTREE,
  KEY `fk_sys_user_has_sys_role_sys_role1_idx` (`role_id`) USING BTREE,
  KEY `fk_sys_user_has_sys_role_sys_user_idx` (`user_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统用户角色关系';

SET FOREIGN_KEY_CHECKS = 1;

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
                             `tag` varchar(255) DEFAULT NULL COMMENT '版本标签（逗号分隔，可多个）',
                             `create_time` datetime DEFAULT NULL COMMENT '创建时间',
                             `creator` varchar(32) DEFAULT NULL COMMENT '创建人',
                             PRIMARY KEY (`id`) USING BTREE,
                             UNIQUE KEY `uni_versin_projectid_dbkey` (`project_id`,`db_key`,`version`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COMMENT='变动表';

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

DROP TABLE IF EXISTS `erd_json_schema`;
CREATE TABLE `erd_json_schema` (
                                   `id` int NOT NULL AUTO_INCREMENT,
                                   `module` json NOT NULL,
                                   `entity` json NOT NULL,
                                   `filed` json NOT NULL,
                                   `datatype` json NOT NULL,
                                   PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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

SET FOREIGN_KEY_CHECKS = 1;
