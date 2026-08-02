/**
 * 纯函数单测（不依赖已坏的 max test）。
 * 运行：cd frontend && npx tsx src/utils/versionTags.test.ts
 */
import assert from 'node:assert/strict';
import { joinVersionTags, splitVersionTags, versionTagsMatchFilter } from './versionTags';

function run(name: string, fn: () => void) {
  fn();
  // eslint-disable-next-line no-console
  console.log(`ok - ${name}`);
}

run('splits comma/semicolon and trims', () => {
  assert.deepEqual(splitVersionTags(' 里程碑 , release ; hotfix '), [
    '里程碑',
    'release',
    'hotfix',
  ]);
});

run('joins with dedupe case-insensitive', () => {
  assert.equal(
    joinVersionTags(['里程碑', 'release', '里程碑', 'Release']),
    '里程碑,release',
  );
});

run('filter matches any token substring', () => {
  assert.equal(versionTagsMatchFilter('里程碑,release', 'release'), true);
  assert.equal(versionTagsMatchFilter('里程碑,release', '里程'), true);
  assert.equal(versionTagsMatchFilter('里程碑,release', 'nope'), false);
});

// eslint-disable-next-line no-console
console.log('versionTags.test.ts: all passed');
