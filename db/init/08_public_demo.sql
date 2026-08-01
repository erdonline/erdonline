USE erd;

-- 公开只读演示（P3a /demo → /s/public-demo）。creator=admin，便于维护者续签分享。
SET NAMES utf8mb4;

INSERT INTO `project` (
  `id`, `projectJSON`, `configJSON`, `project_name`, `description`, `type`, `tags`,
  `revision`, `del_flag`, `creator`, `updater`
) VALUES (
  'demo-project-public',
  CAST('{
    "modules": [{
      "name": "SHOP",
      "chnname": "Demo",
      "entities": [
        {
          "title": "T_USER",
          "chnname": "User",
          "fields": [
            {"name": "ID", "type": "IdOrKey", "pk": true},
            {"name": "NAME", "type": "String"}
          ]
        },
        {
          "title": "T_ORDER",
          "chnname": "Order",
          "fields": [
            {"name": "ID", "type": "IdOrKey", "pk": true},
            {"name": "USER_ID", "type": "IdOrKey"},
            {"name": "AMOUNT", "type": "Double"}
          ]
        }
      ],
      "associations": [{
        "relation": "1:n",
        "from": {"entity": "T_ORDER", "field": "USER_ID"},
        "to": {"entity": "T_USER", "field": "ID"}
      }],
      "graphCanvas": {
        "nodes": [
          {"id": "T_USER", "x": 80, "y": 80},
          {"id": "T_ORDER", "x": 360, "y": 120}
        ]
      }
    }],
    "profile": {"dbs": [], "defaultFields": [[]]},
    "dataTypeDomains": {"datatype": [], "database": [{"code": "MYSQL", "defaultDatabase": true}]}
  }' AS JSON),
  NULL,
  'Public Demo',
  'Anonymous readonly demo for /demo',
  '1',
  'demo,public',
  0,
  '0',
  'admin',
  'admin'
) ON DUPLICATE KEY UPDATE
  `projectJSON` = VALUES(`projectJSON`),
  `project_name` = VALUES(`project_name`),
  `description` = VALUES(`description`),
  `del_flag` = '0',
  `updater` = 'admin';

INSERT INTO `project_share` (
  `id`, `token`, `project_id`, `expire_time`, `enabled`, `del_flag`, `creator`
) VALUES (
  'demo-share-public',
  'public-demo',
  'demo-project-public',
  NULL,
  '1',
  '0',
  'admin'
) ON DUPLICATE KEY UPDATE
  `token` = 'public-demo',
  `project_id` = 'demo-project-public',
  `enabled` = '1',
  `del_flag` = '0';
