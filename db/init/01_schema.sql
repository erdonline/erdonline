-- ERD Online 数据库初始化：创建业务库
-- erd  : 建模元数据（项目/表/字段/版本等）
-- martin: 系统与认证（用户/角色/菜单/OAuth 等）
CREATE DATABASE IF NOT EXISTS `erd`    DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE DATABASE IF NOT EXISTS `martin` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
