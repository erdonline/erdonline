-- ADR-0028：将 community-{userId前缀} 回填为真实账号 username
SET NAMES utf8mb4;

UPDATE catalog_template ct
INNER JOIN catalog_submission cs
  ON cs.template_id = ct.id AND cs.del_flag = '0'
INNER JOIN sys_user u
  ON u.id = cs.submitter_user_id AND u.del_flag = '0'
SET
  ct.author_handle = LOWER(TRIM(u.username)),
  ct.author_display_name = COALESCE(NULLIF(TRIM(u.nickname), ''), TRIM(u.username))
WHERE ct.del_flag = '0'
  AND ct.author_handle LIKE 'community-%'
  AND u.username IS NOT NULL
  AND TRIM(u.username) <> '';
