-- 修复：FederateUserService#unlink 曾用 linkMapper.deleteById（被 delFlag 全局逻辑删除拦截改写成
-- UPDATE del_flag=1），但 uk_identity_provider_subject (provider, subject) 不区分 del_flag——
-- 逻辑删除的旧行仍占坑，导致同一身份「解绑→重新登录」insert 新链接时撞唯一键，
-- 前端收到裸 JSON 500「「google-<sub>」已存在」。代码侧已改为 physicalDeleteById（见
-- FederateUserService#unlink）；本迁移物理清掉存量软删行，释放坑位，讓已受影响用户下次登录即恢复。
--
-- 幂等：软删行本就不参与任何业务查询（MP 按 del_flag=0 自动过滤），物理删除不影响任何现有功能；
-- 空库/未产生过软删行时本语句影响 0 行。

DELETE FROM `user_identity_link` WHERE `del_flag` <> '0';
