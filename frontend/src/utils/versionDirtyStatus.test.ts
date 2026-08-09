/**
 * 运行：cd frontend && npx tsx src/utils/versionDirtyStatus.test.ts
 */

import {
  resolveVersionDirtyState,
  summarizeChanges,
  versionDirtyCopy,
} from './versionDirtyStatus';

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}`, e);
    process.exitCode = 1;
  }
}

run('unknown when baseline not loaded', () => {
  const state = resolveVersionDirtyState({
    baselineLoaded: false,
    versionBaseline: null,
    changes: [],
  });
  if (state !== 'unknown') throw new Error(state);
});

run('no-baseline when loaded but empty', () => {
  const state = resolveVersionDirtyState({
    baselineLoaded: true,
    versionBaseline: null,
    changes: [{ opt: 'add' }],
  });
  if (state !== 'no-baseline') throw new Error(state);
});

run('unknown when workspace diff failed', () => {
  const state = resolveVersionDirtyState({
    baselineLoaded: true,
    versionBaseline: { id: '1', version: '1.0.0' },
    changes: [{ opt: 'add' }],
    workspaceDiffError: 'version diff failed',
  });
  if (state !== 'unknown') throw new Error(state);
});

run('dirty when changes exist', () => {
  const state = resolveVersionDirtyState({
    baselineLoaded: true,
    versionBaseline: { id: '1', version: '1.0.0' },
    changes: [{ opt: 'add' }],
  });
  if (state !== 'dirty') throw new Error(state);
});

run('clean when baseline matches', () => {
  const state = resolveVersionDirtyState({
    baselineLoaded: true,
    versionBaseline: { id: '1', version: '1.0.0' },
    changes: [],
  });
  if (state !== 'clean') throw new Error(state);
});

run('summarizeChanges formats +/−/~', () => {
  const s = summarizeChanges([
    { opt: 'add' },
    { opt: 'add' },
    { opt: 'delete' },
    { opt: 'update' },
  ]);
  if (s !== '+2 −1 ~1') throw new Error(s);
});

run('dirty copy includes summary', () => {
  const copy = versionDirtyCopy('dirty', [{ opt: 'add' }]);
  if (!copy.label.includes('未存版本')) throw new Error(copy.label);
  if (!copy.label.includes('+1')) throw new Error(copy.label);
  if (!copy.openSaveFlow) throw new Error('expected openSaveFlow');
});

console.log('versionDirtyStatus.test.ts OK');
