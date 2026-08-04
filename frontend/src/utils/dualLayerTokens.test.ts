/**
 * 运行：cd frontend && npx tsx src/utils/dualLayerTokens.test.ts
 */
import assert from 'node:assert/strict';
import {
  B_STATUS_COLOR,
  B_STATUS_LABEL,
  CHANGE_OPT,
  PARITY_TAG_COLOR,
  PARITY_VERB,
  changeSummaryTags,
  countChanges,
  formatChangeSummary,
  versionLayerPresentation,
} from './dualLayerTokens';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

console.log('dualLayerTokens.test.ts');

test('parity colors: synced green, ahead blue, behind orange, diverged red', () => {
  assert.equal(PARITY_TAG_COLOR.SYNCED, 'green');
  assert.equal(PARITY_TAG_COLOR.AHEAD, 'blue');
  assert.equal(PARITY_TAG_COLOR.BEHIND, 'orange');
  assert.equal(PARITY_TAG_COLOR.DIVERGED, 'red');
  assert.equal(PARITY_TAG_COLOR.UNKNOWN, 'default');
});

test('B labels use layer prefix + parity verbs', () => {
  assert.equal(B_STATUS_LABEL.SYNCED, '实库一致');
  assert.equal(B_STATUS_LABEL.AHEAD, '模型领先');
  assert.equal(B_STATUS_LABEL.BEHIND, '实库领先');
  assert.equal(B_STATUS_LABEL.DIVERGED, '双向分叉');
  assert.equal(B_STATUS_LABEL.UNKNOWN, '实库未知');
  assert.equal(B_STATUS_COLOR.AHEAD, B_STATUS_COLOR.AHEAD);
});

test('formatChangeSummary and tags', () => {
  const counts = countChanges([
    { opt: 'add' },
    { opt: 'add' },
    { opt: 'delete' },
    { opt: 'update' },
  ]);
  assert.equal(formatChangeSummary(counts), '+2 −1 ~1');
  const tags = changeSummaryTags(counts);
  assert.equal(tags.length, 3);
  assert.match(tags[0].text, /新增/);
  assert.equal(CHANGE_OPT.add.color, 'success');
});

test('A layer: clean synced green, dirty ahead blue', () => {
  const clean = versionLayerPresentation('clean', []);
  assert.equal(clean.label, '版本一致');
  assert.equal(clean.tagColor, 'green');
  assert.equal(clean.parity, 'SYNCED');

  const dirty = versionLayerPresentation('dirty', [{ opt: 'add' }]);
  assert.match(dirty.label, /未存版本/);
  assert.match(dirty.label, /\+1/);
  assert.equal(dirty.tagColor, 'blue');
  assert.equal(dirty.parity, 'AHEAD');
});

test('A layer unknown uses 版本未知', () => {
  const u = versionLayerPresentation('unknown', []);
  assert.equal(u.label, `版本${PARITY_VERB.UNKNOWN}`);
});

console.log('all passed');
