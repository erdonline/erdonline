import assert from 'node:assert/strict';
import {
  STATUS_LABEL,
  resolveUnknownCopy,
  statusHint,
  type ProbeResult,
} from './schemaProbeCopy';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

console.log('schemaProbeCopy.test.ts');

test('STATUS_LABEL covers five states', () => {
  assert.equal(STATUS_LABEL.SYNCED, '实库一致');
  assert.equal(STATUS_LABEL.AHEAD, '模型领先');
  assert.equal(STATUS_LABEL.BEHIND, '实库领先');
  assert.equal(STATUS_LABEL.DIVERGED, '双向分叉');
  assert.equal(STATUS_LABEL.UNKNOWN, '实库未知');
});

test('resolveUnknownCopy: four actionable paths', () => {
  assert.equal(resolveUnknownCopy('PROBE_NO_DATASOURCE').title, '未配置数据源');
  assert.equal(resolveUnknownCopy('PROBE_NOT_PROBED').title, '尚未探测');
  assert.equal(resolveUnknownCopy('PROBE_CONNECTION_FAILED').title, '无法连接实库');
  assert.equal(resolveUnknownCopy('PROBE_NO_PERMISSION').title, '无读取权限');
  assert.match(resolveUnknownCopy('PROBE_NO_PERMISSION').hint, /权限/);
});

test('statusHint: ahead/behind never claim synced', () => {
  const ahead: ProbeResult = { status: 'AHEAD', reason: 'FINGERPRINT_MISMATCH' };
  assert.match(statusHint(ahead)!, /模型/);
  const behind: ProbeResult = { status: 'BEHIND', reason: 'FINGERPRINT_MISMATCH' };
  assert.match(statusHint(behind)!, /实库/);
  const unknown: ProbeResult = { status: 'UNKNOWN', reason: 'PROBE_CONNECTION_FAILED' };
  assert.match(statusHint(unknown)!, /连接/);
});

console.log('all passed');
