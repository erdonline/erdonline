-- 历史公告外链：旧零代 Discussions → 正式仓 Issues（产品面统一社区入口）
UPDATE `sys_announcement`
SET `url` = 'https://github.com/erdonline/erdonline/issues'
WHERE `url` LIKE '%www-zerocode-net-cn/discussions%';
