#!/usr/bin/env node
/**
 * Verify contract-read helpers (list_tables / describe_table logic) against the
 * public demo projectJSON fixture — no backend, no DB.
 *   cd mcp && yarn build && node scripts/verify-contract-tools.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  describeContractTable,
  extractProjectJson,
  listContractTables,
} from '../dist/contract-schema.js';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const fixture = JSON.parse(
  readFileSync(
    path.join(repoRoot, 'schema/examples/demo.projectjson.json'),
    'utf8',
  ),
);

// extractProjectJson tolerates both API key spellings
assert.equal(extractProjectJson({ projectJson: fixture }), fixture);
assert.equal(extractProjectJson({ projectJSON: fixture }), fixture);
assert.equal(extractProjectJson({}), undefined);

// list_tables: compact list, not a dump
const tables = listContractTables(fixture);
assert.ok(tables.length >= 8, `expected >=8 tables, got ${tables.length}`);
const titles = tables.map((t) => t.title);
assert.ok(titles.includes('sys_user'));
assert.ok(titles.includes('biz_order'));
for (const t of tables) {
  assert.equal(typeof t.fieldCount, 'number');
  assert.ok(!('fields' in t), 'list_tables must not embed field details');
}

// describe_table: exact, case-insensitive
const user = describeContractTable(fixture, 'SYS_USER');
assert.equal(user.found, true);
assert.equal(user.title, 'sys_user');
assert.ok(user.fields.some((f) => f.name === 'username'));
assert.ok(user.fields.some((f) => f.name === 'id' && f.pk === true));
// FK neighborhood: sys_user_role.user_id → sys_user.id is inbound
assert.ok(
  user.foreignKeys.inbound.some(
    (a) => a.fromEntity === 'sys_user_role' && a.fromField === 'user_id',
  ),
  'expected inbound FK from sys_user_role.user_id',
);

// outbound on the FK side
const userRole = describeContractTable(fixture, 'sys_user_role');
assert.equal(userRole.found, true);
assert.ok(
  userRole.foreignKeys.outbound.some(
    (a) => a.toEntity === 'sys_user' && a.toField === 'id',
  ),
  'expected outbound FK to sys_user.id',
);

// found:false + suggestions (the anti-hallucination path)
const miss = describeContractTable(fixture, 'user_id');
assert.equal(miss.found, false);
assert.ok(miss.suggestions.includes('sys_user'));
const nonsense = describeContractTable(fixture, 'zzz_nope');
assert.equal(nonsense.found, false);
assert.ok(Array.isArray(nonsense.suggestions));

console.error(
  `[verify-contract-tools] PASS tables=${tables.length} ` +
    `sys_user.fields=${user.fields.length} inbound=${user.foreignKeys.inbound.length}`,
);
