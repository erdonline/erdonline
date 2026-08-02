/**
 * 纯函数单测（不依赖已坏的 max test）。
 * 运行：cd frontend && npx tsx src/components/dialog/version/formatVersionDiffMarkdown.test.ts
 */
import assert from 'node:assert/strict';
import { formatVersionDiffMarkdown } from './formatVersionDiffMarkdown';

function run(name: string, fn: () => void) {
  fn();
  // eslint-disable-next-line no-console
  console.log(`ok - ${name}`);
}

run('formats structured changes and sql', () => {
  const md = formatVersionDiffMarkdown({
    messages: [
      { message: 'add table', opt: 'add', type: 'entity', name: 'T_A' },
      { message: 'add field', opt: 'add', type: 'field', name: 'T_A.REMARK' },
      { message: 'drop field', opt: 'delete', type: 'field', name: 'T_A.OLD' },
    ],
    fromVersion: '1.0.0',
    toVersion: '1.0.1',
    sql: 'ALTER TABLE T_A ADD REMARK VARCHAR(64);',
  });
  assert.match(md, /# 版本变更 1\.0\.0 → 1\.0\.1/);
  assert.match(md, /\+2 新增/);
  assert.match(md, /-1 删除/);
  assert.match(md, /### T_A/);
  assert.match(md, /\[\*\*新增\*\*\]|\[新增\]/);
  assert.match(md, /`REMARK`/);
  assert.match(md, /```sql/);
  assert.match(md, /ALTER TABLE T_A/);
});

run('empty messages with sql still exports script section', () => {
  const md = formatVersionDiffMarkdown({
    messages: [],
    toVersion: '1.0.0',
    sql: 'CREATE TABLE T_X (ID INT);',
  });
  assert.match(md, /无结构化增量条目/);
  assert.match(md, /CREATE TABLE T_X/);
});

// eslint-disable-next-line no-console
console.log('all passed');
