#!/usr/bin/env node
/**
 * 将 schema/examples/demo.projectjson.json 同步到：
 * - frontend/src/utils/demo.projectjson.json（登录态「从示例开始」）
 * - db/init/08_public_demo.sql（/demo → /s/public-demo 种子）
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'schema/examples/demo.projectjson.json');
const FE = path.join(ROOT, 'frontend/src/utils/demo.projectjson.json');
const SQL = path.join(ROOT, 'db/init/08_public_demo.sql');

const raw = readFileSync(SRC, 'utf8');
const json = JSON.parse(raw);
// MySQL string literal: double any single quotes inside JSON
const compact = JSON.stringify(json).replace(/'/g, "''");

writeFileSync(FE, `${JSON.stringify(json, null, 2)}\n`, 'utf8');

const sql = `USE erd;

-- 公开只读演示（P3a /demo → /s/public-demo）。creator=admin，便于维护者续签分享。
-- 真相源：schema/examples/demo.projectjson.json（改完请跑 node scripts/sync-demo-projectjson.mjs）
SET NAMES utf8mb4;

INSERT INTO \`project\` (
  \`id\`, \`projectJSON\`, \`configJSON\`, \`project_name\`, \`description\`, \`type\`, \`tags\`,
  \`revision\`, \`del_flag\`, \`creator\`, \`updater\`
) VALUES (
  'demo-project-public',
  CAST('${compact}' AS JSON),
  NULL,
  '功能鉴权示例',
  'RBAC 功能鉴权演示：用户/角色/权限/会话/审计 + 业务订单',
  '1',
  'demo,public,authz',
  0,
  '0',
  'admin',
  'admin'
) ON DUPLICATE KEY UPDATE
  \`projectJSON\` = VALUES(\`projectJSON\`),
  \`project_name\` = VALUES(\`project_name\`),
  \`description\` = VALUES(\`description\`),
  \`del_flag\` = '0',
  \`updater\` = 'admin';

INSERT INTO \`project_share\` (
  \`id\`, \`token\`, \`project_id\`, \`expire_time\`, \`enabled\`, \`del_flag\`, \`creator\`
) VALUES (
  'demo-share-public',
  'public-demo',
  'demo-project-public',
  NULL,
  '1',
  '0',
  'admin'
) ON DUPLICATE KEY UPDATE
  \`token\` = 'public-demo',
  \`project_id\` = 'demo-project-public',
  \`enabled\` = '1',
  \`del_flag\` = '0';
`;

writeFileSync(SQL, sql, 'utf8');
console.log('synced:', path.relative(ROOT, FE), path.relative(ROOT, SQL));
