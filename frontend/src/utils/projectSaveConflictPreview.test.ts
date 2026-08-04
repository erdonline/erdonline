/**
 * 运行：cd frontend && npx tsx src/utils/projectSaveConflictPreview.test.ts
 */
import assert from 'node:assert/strict';
import {
  diffLocalAgainstServer,
  rememberServerProjectJSON,
  structuralChangesToDiffItems,
} from './projectSaveConflictPreview';
import { checkVersionStructuralDiff } from './versionStructuralDiff';

const base = {
  modules: [
    {
      name: 'M1',
      entities: [{ title: 'users', fields: [{ name: 'id', type: 'INT' }] }],
    },
  ],
  profile: {},
  dataTypeDomains: { datatype: [], database: [] },
};

const localAdded = {
  ...base,
  modules: [
    {
      name: 'M1',
      entities: [
        { title: 'users', fields: [{ name: 'id', type: 'INT' }] },
        { title: 'orders', fields: [{ name: 'id', type: 'INT' }] },
      ],
    },
  ],
};

rememberServerProjectJSON(base);

const items = diffLocalAgainstServer(localAdded, base);
assert.ok(items.some((i) => i.type === 'entity' && i.opt === 'add' && i.name === 'orders'));

const raw = checkVersionStructuralDiff(localAdded, base);
const mapped = structuralChangesToDiffItems(raw);
assert.equal(mapped.length, items.length);
assert.ok(mapped[0]?.message.includes('新增'));

console.log('projectSaveConflictPreview.test.ts OK');
