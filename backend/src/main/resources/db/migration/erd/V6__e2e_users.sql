-- Formerly db/init/05_e2e_users.sql; prod rejects login via e2e-accounts-enabled=false
-- E2E / 本地开发种子账号
-- e2e0..e2e15 → Playwright worker parallelIndex 0..15（本地上限 16）
-- e2e-serial → chromium-serial 空态用例（不与 worker 抢号）
-- 密码与 admin 相同：123456（仅开发/CI；生产 erd.security.e2e-accounts-enabled=false 拒绝登录）
-- 幂等：可对已有库重复执行
SET NAMES utf8mb4;

SET @e2e_pwd := '{bcrypt}$2a$10$vAxxCnKsa0MLdCLoP9A2UOsBMdsVLOaodDIezhtyFhkLdLilo6Mce';

INSERT INTO sys_user (
  id, name, username, nickname, email, pwd, salt, age, signature, title,
  classification, phone, dept_id, tenant_id, lock_flag, del_flag, creator, updater
) VALUES
  ('e2e-user-0', 'E2E0', 'e2e0', 'E2E Worker 0', 'e2e0@erd.local', @e2e_pwd, '1', 20, 'E2E seed', 'E2E', 'E2E', NULL, '1', '0', '0', '0', 'seed', 'seed'),
  ('e2e-user-1', 'E2E1', 'e2e1', 'E2E Worker 1', 'e2e1@erd.local', @e2e_pwd, '1', 20, 'E2E seed', 'E2E', 'E2E', NULL, '1', '0', '0', '0', 'seed', 'seed'),
  ('e2e-user-2', 'E2E2', 'e2e2', 'E2E Worker 2', 'e2e2@erd.local', @e2e_pwd, '1', 20, 'E2E seed', 'E2E', 'E2E', NULL, '1', '0', '0', '0', 'seed', 'seed'),
  ('e2e-user-3', 'E2E3', 'e2e3', 'E2E Worker 3', 'e2e3@erd.local', @e2e_pwd, '1', 20, 'E2E seed', 'E2E', 'E2E', NULL, '1', '0', '0', '0', 'seed', 'seed'),
  ('e2e-user-4', 'E2E4', 'e2e4', 'E2E Worker 4', 'e2e4@erd.local', @e2e_pwd, '1', 20, 'E2E seed', 'E2E', 'E2E', NULL, '1', '0', '0', '0', 'seed', 'seed'),
  ('e2e-user-5', 'E2E5', 'e2e5', 'E2E Worker 5', 'e2e5@erd.local', @e2e_pwd, '1', 20, 'E2E seed', 'E2E', 'E2E', NULL, '1', '0', '0', '0', 'seed', 'seed'),
  ('e2e-user-6', 'E2E6', 'e2e6', 'E2E Worker 6', 'e2e6@erd.local', @e2e_pwd, '1', 20, 'E2E seed', 'E2E', 'E2E', NULL, '1', '0', '0', '0', 'seed', 'seed'),
  ('e2e-user-7', 'E2E7', 'e2e7', 'E2E Worker 7', 'e2e7@erd.local', @e2e_pwd, '1', 20, 'E2E seed', 'E2E', 'E2E', NULL, '1', '0', '0', '0', 'seed', 'seed'),
  ('e2e-user-8', 'E2E8', 'e2e8', 'E2E Worker 8', 'e2e8@erd.local', @e2e_pwd, '1', 20, 'E2E seed', 'E2E', 'E2E', NULL, '1', '0', '0', '0', 'seed', 'seed'),
  ('e2e-user-9', 'E2E9', 'e2e9', 'E2E Worker 9', 'e2e9@erd.local', @e2e_pwd, '1', 20, 'E2E seed', 'E2E', 'E2E', NULL, '1', '0', '0', '0', 'seed', 'seed'),
  ('e2e-user-10', 'E2E10', 'e2e10', 'E2E Worker 10', 'e2e10@erd.local', @e2e_pwd, '1', 20, 'E2E seed', 'E2E', 'E2E', NULL, '1', '0', '0', '0', 'seed', 'seed'),
  ('e2e-user-11', 'E2E11', 'e2e11', 'E2E Worker 11', 'e2e11@erd.local', @e2e_pwd, '1', 20, 'E2E seed', 'E2E', 'E2E', NULL, '1', '0', '0', '0', 'seed', 'seed'),
  ('e2e-user-12', 'E2E12', 'e2e12', 'E2E Worker 12', 'e2e12@erd.local', @e2e_pwd, '1', 20, 'E2E seed', 'E2E', 'E2E', NULL, '1', '0', '0', '0', 'seed', 'seed'),
  ('e2e-user-13', 'E2E13', 'e2e13', 'E2E Worker 13', 'e2e13@erd.local', @e2e_pwd, '1', 20, 'E2E seed', 'E2E', 'E2E', NULL, '1', '0', '0', '0', 'seed', 'seed'),
  ('e2e-user-14', 'E2E14', 'e2e14', 'E2E Worker 14', 'e2e14@erd.local', @e2e_pwd, '1', 20, 'E2E seed', 'E2E', 'E2E', NULL, '1', '0', '0', '0', 'seed', 'seed'),
  ('e2e-user-15', 'E2E15', 'e2e15', 'E2E Worker 15', 'e2e15@erd.local', @e2e_pwd, '1', 20, 'E2E seed', 'E2E', 'E2E', NULL, '1', '0', '0', '0', 'seed', 'seed'),
  ('e2e-user-serial', 'E2E Serial', 'e2e-serial', 'E2E Serial', 'e2e-serial@erd.local', @e2e_pwd, '1', 20, 'E2E seed', 'E2E', 'E2E', NULL, '1', '0', '0', '0', 'seed', 'seed')
ON DUPLICATE KEY UPDATE
  pwd = VALUES(pwd),
  del_flag = '0',
  lock_flag = '0',
  updater = 'seed';

INSERT INTO sys_user_role (id, user_id, role_id, creator)
SELECT v.id, v.user_id, '1', 'seed'
FROM (
  SELECT 'e2e-ur-0' AS id, 'e2e-user-0' AS user_id UNION ALL
  SELECT 'e2e-ur-1', 'e2e-user-1' UNION ALL
  SELECT 'e2e-ur-2', 'e2e-user-2' UNION ALL
  SELECT 'e2e-ur-3', 'e2e-user-3' UNION ALL
  SELECT 'e2e-ur-4', 'e2e-user-4' UNION ALL
  SELECT 'e2e-ur-5', 'e2e-user-5' UNION ALL
  SELECT 'e2e-ur-6', 'e2e-user-6' UNION ALL
  SELECT 'e2e-ur-7', 'e2e-user-7' UNION ALL
  SELECT 'e2e-ur-8', 'e2e-user-8' UNION ALL
  SELECT 'e2e-ur-9', 'e2e-user-9' UNION ALL
  SELECT 'e2e-ur-10', 'e2e-user-10' UNION ALL
  SELECT 'e2e-ur-11', 'e2e-user-11' UNION ALL
  SELECT 'e2e-ur-12', 'e2e-user-12' UNION ALL
  SELECT 'e2e-ur-13', 'e2e-user-13' UNION ALL
  SELECT 'e2e-ur-14', 'e2e-user-14' UNION ALL
  SELECT 'e2e-ur-15', 'e2e-user-15' UNION ALL
  SELECT 'e2e-ur-serial', 'e2e-user-serial'
) v
WHERE NOT EXISTS (
  SELECT 1 FROM sys_user_role ur WHERE ur.user_id = v.user_id AND ur.role_id = '1'
);
