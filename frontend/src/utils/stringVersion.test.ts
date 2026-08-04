/**
 * 运行：cd frontend && npx tsx src/utils/stringVersion.test.ts
 */

import {
  compareStringVersion,
  compareStringVersionForSort,
  isVersionGreater,
  isVersionLessOrEqual,
} from './stringVersion';

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}`, e);
    process.exitCode = 1;
  }
}

run('1.10 > 1.9', () => {
  const cmp = compareStringVersion('1.10', '1.9');
  if (cmp == null || cmp <= 0) throw new Error(String(cmp));
});

run('1.9 < 1.10', () => {
  const cmp = compareStringVersion('1.9', '1.10');
  if (cmp == null || cmp >= 0) throw new Error(String(cmp));
});

run('equal semver', () => {
  if (compareStringVersion('1.0.0', '1.0.0') !== 0) throw new Error('not equal');
});

run('v-prefix normalized', () => {
  if (compareStringVersion('v1.0', '1.0') !== 0) throw new Error('v1.0 vs 1.0');
  if (compareStringVersion('V2.1', '2.1') !== 0) throw new Error('V2.1 vs 2.1');
});

run('empty string unknown', () => {
  if (compareStringVersion('', '1.0') !== null) throw new Error('empty left');
  if (compareStringVersion('1.0', '') !== null) throw new Error('empty right');
  if (compareStringVersion('', '') !== null) throw new Error('both empty');
});

run('null unknown', () => {
  if (compareStringVersion(null, '1.0') !== null) throw new Error('null left');
  if (compareStringVersion('1.0', null) !== null) throw new Error('null right');
  if (compareStringVersion(null, null) !== null) throw new Error('both null');
});

run('empty segment unknown', () => {
  if (compareStringVersion('1..0', '1.0.0') !== null) throw new Error('1..0');
  if (compareStringVersion('.1.0', '1.0') !== null) throw new Error('.1.0');
});

run('non-numeric segment unknown', () => {
  if (compareStringVersion('1.a.0', '1.0.0') !== null) throw new Error('1.a.0');
  if (compareStringVersion('release-1', '1.0.0') !== null) throw new Error('prefix');
});

run('NaN must not compare as equal via <=0', () => {
  if (isVersionLessOrEqual('1.a', '1.0') !== null) throw new Error('expected null');
  if (isVersionGreater('1.a', '1.0') !== null) throw new Error('expected null');
});

run('sort puts invalid last', () => {
  const sorted = ['bad', '1.10', '1.9', ''].sort((a, b) =>
    compareStringVersionForSort(a, b, true),
  );
  if (sorted[0] !== '1.10' || sorted[1] !== '1.9') {
    throw new Error(JSON.stringify(sorted));
  }
  if (sorted[2] !== 'bad' && sorted[3] !== 'bad') {
    throw new Error(`invalid not last: ${JSON.stringify(sorted)}`);
  }
});

console.log('stringVersion.test.ts OK');
