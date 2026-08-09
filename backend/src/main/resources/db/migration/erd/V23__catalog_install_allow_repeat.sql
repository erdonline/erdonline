-- ADR-0028：同一用户可对同一模板多次安装，每次新建个人项目（Figma Community 模式）
ALTER TABLE `catalog_install` DROP INDEX `uk_catalog_install_template_user`;
CREATE INDEX `idx_catalog_install_template_user` ON `catalog_install` (`template_id`, `user_id`);
