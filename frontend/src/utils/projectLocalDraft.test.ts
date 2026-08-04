/**
 * 本地草稿 read/write/clear 与服务器 diff 判定。
 * 运行：cd frontend && npx tsx src/utils/projectLocalDraft.test.ts
 */
import assert from 'node:assert/strict';
import {
  clearProjectDraft,
  draftDiffersFromServer,
  draftStorageKey,
  hasRecoverableDraft,
  readProjectDraft,
  writeProjectDraft,
} from './projectLocalDraft';

const mem = new Map<string, string>();
(globalThis as { localStorage?: Storage }).localStorage = {
  getItem: (k) => mem.get(k) ?? null,
  setItem: (k, v) => {
    mem.set(k, String(v));
  },
  removeItem: (k) => {
    mem.delete(k);
  },
  clear: () => mem.clear(),
  get length() {
    return mem.size;
  },
  key: () => null,
} as Storage;

const serverJson = {
  modules: [{ name: 'm1', entities: [{ title: 'T_A' }] }],
  profile: {},
  dataTypeDomains: {},
};

const project = {
  id: 'p-draft-1',
  updateTime: '2026-08-04T10:00:00.000',
  projectJSON: {
    modules: [{ name: 'm1', entities: [{ title: 'T_A' }, { title: 'T_B' }] }],
    profile: {},
    dataTypeDomains: {},
  },
};

assert.equal(draftStorageKey('p1'), 'erd:project-draft:p1');

const draft = writeProjectDraft(project, '2026-08-04T09:00:00.000');
assert.ok(draft);
assert.equal(draft?.projectId, 'p-draft-1');
assert.equal(mem.has(draftStorageKey('p-draft-1')), true);

const loaded = readProjectDraft('p-draft-1');
assert.ok(loaded);
assert.deepEqual(loaded?.projectJSON, project.projectJSON);

assert.equal(
  draftDiffersFromServer(loaded, { projectJSON: serverJson }),
  true,
);
assert.equal(
  draftDiffersFromServer(loaded, { projectJSON: project.projectJSON }),
  false,
);
assert.equal(hasRecoverableDraft('p-draft-1', { projectJSON: serverJson }), true);
assert.equal(hasRecoverableDraft('p-draft-1', { projectJSON: project.projectJSON }), false);

clearProjectDraft('p-draft-1');
assert.equal(readProjectDraft('p-draft-1'), null);
assert.equal(hasRecoverableDraft('p-draft-1', { projectJSON: serverJson }), false);

// 无 projectJSON 不写草稿
assert.equal(writeProjectDraft({ id: 'x' }), null);

console.log('projectLocalDraft.test.ts: all passed');
