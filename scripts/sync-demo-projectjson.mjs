#!/usr/bin/env node
/**
 * 将 schema/examples/demo.projectjson.json 同步到：
 * - frontend/src/utils/demo.projectjson.json（登录态「从示例开始」）
 * - backend/.../db/migration/erd/<MIGRATION_FILE>（已有库增量更新）
 *
 * MIGRATION_FILE 只增不改：V16 已上线部署，禁止覆写；每次调整种子布局需先在下方
 * 把 MIGRATION_FILE 改成下一个未使用的 V<N>__*.sql 再运行本脚本（Flyway 单写 ADR-0020）。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'schema/examples/demo.projectjson.json');
const FE = path.join(ROOT, 'frontend/src/utils/demo.projectjson.json');
const MIGRATION_FILE = 'V17__public_demo_layout_dagre.sql';
const SQL = path.join(ROOT, 'backend/src/main/resources/db/migration/erd', MIGRATION_FILE);

const raw = readFileSync(SRC, 'utf8');
const json = JSON.parse(raw);
// MySQL string literal: double any single quotes inside JSON
const compact = JSON.stringify(json).replace(/'/g, "''");

writeFileSync(FE, `${JSON.stringify(json, null, 2)}\n`, 'utf8');

const sql = `-- 公开 demo 布局优化 + projectJSON 真相源同步（schema/examples/demo.projectjson.json）
-- 布局坐标来自 frontend/scripts/gen-demo-layout.ts（产品同款 dagre 分层算法，非手排 x/y）
-- 改完请跑: node scripts/sync-demo-projectjson.mjs
SET NAMES utf8mb4;

UPDATE \`project\`
SET
  \`projectJSON\` = CAST('${compact}' AS JSON),
  \`project_name\` = '功能鉴权示例',
  \`description\` = 'RBAC 功能鉴权演示：用户/角色/权限/会话/审计 + 业务订单',
  \`updater\` = 'admin'
WHERE \`id\` = 'demo-project-public';
`;

writeFileSync(SQL, sql, 'utf8');
console.log('synced:', path.relative(ROOT, FE), path.relative(ROOT, SQL));
