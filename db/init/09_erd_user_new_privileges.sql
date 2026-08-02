-- 新注册角色 ERD_USER_NEW 需具备与 admin 同等业务权限，否则 loadUserByUsername 因无 privilege 失败，
-- 注册成功后无法登录（表现为「用户名不存在或者密码错误」）。
USE `martin`;

INSERT INTO `sys_role_privilege` (`id`, `role_id`, `resource_id`, `dict_id`, `tenant_id`, `del_flag`, `create_time`, `creator`)
SELECT REPLACE(UUID(), '-', ''),
       '100024597134442524',
       sp.`resource_id`,
       sp.`dict_id`,
       COALESCE(sp.`tenant_id`, '0'),
       '0',
       NOW(),
       '2'
FROM `sys_role_privilege` sp
WHERE sp.`role_id` = '1'
  AND (sp.`del_flag` IS NULL OR sp.`del_flag` = '0')
  AND NOT EXISTS (
    SELECT 1
    FROM `sys_role_privilege` x
    WHERE x.`role_id` = '100024597134442524'
      AND IFNULL(x.`resource_id`, '') = IFNULL(sp.`resource_id`, '')
      AND IFNULL(x.`dict_id`, '') = IFNULL(sp.`dict_id`, '')
  );
