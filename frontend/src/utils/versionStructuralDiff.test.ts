/**
 * 运行：cd frontend && npx tsx src/utils/versionStructuralDiff.test.ts
 */

import {
  associationKey,
  checkVersionStructuralDiff,
  hasMeaningfulVersionChanges,
  snapshotProjectJSONForVersion,
} from './versionStructuralDiff';

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}`, e);
    process.exitCode = 1;
  }
}

const baseModules = [{
  name: 'M1',
  entities: [{
    title: 'T_USER',
    fields: [{ name: 'id', type: 'IdOrKey', pk: true }],
    indexs: [],
  }],
  associations: [],
  diagrams: [{ id: 'd1', name: '主图', layout: { nodes: [{ id: 'T_USER', x: 0, y: 0 }] } }],
}];

const baseProfile = {
  defaultFields: [{ name: 'id', type: 'IdOrKey' }],
  tableLimit: 200,
};

run('association add detected', () => {
  const current = {
    modules: [{
      ...baseModules[0],
      associations: [{
        relation: '1:n',
        from: { entity: 'T_ORDER', field: 'USER_ID' },
        to: { entity: 'T_USER', field: 'id' },
      }],
    }],
  };
  const changes = checkVersionStructuralDiff({ modules: current.modules }, { modules: baseModules });
  const assoc = changes.find((c) => c.type === 'association' && c.opt === 'add');
  if (!assoc) throw new Error(JSON.stringify(changes));
});

run('association key prefers constraintName', () => {
  const key = associationKey({
    constraintName: 'fk_order_user',
    from: { entity: 'A', field: 'a' },
    to: { entity: 'B', field: 'b' },
  });
  if (key !== 'fk_order_user') throw new Error(key);
});

run('diagram layout change detected', () => {
  const current = {
    modules: [{
      ...baseModules[0],
      diagrams: [{
        id: 'd1',
        name: '主图',
        layout: { nodes: [{ id: 'T_USER', x: 100, y: 0 }] },
      }],
    }],
  };
  const changes = checkVersionStructuralDiff({ modules: current.modules }, { modules: baseModules });
  const layout = changes.find((c) => c.type === 'diagram' && c.name.endsWith('.layout'));
  if (!layout || layout.opt !== 'update') throw new Error(JSON.stringify(changes));
});

run('profile defaultFields change detected', () => {
  const changes = checkVersionStructuralDiff(
    { modules: baseModules, profile: { defaultFields: [{ name: 'e2e_pk', type: 'IdOrKey' }] } },
    { modules: baseModules, profile: baseProfile },
  );
  const profile = changes.find((c) => c.type === 'profile' && c.name === 'defaultFields');
  if (!profile) throw new Error(JSON.stringify(changes));
});

run('datatype domain change detected', () => {
  const base = {
    datatype: [{ code: 'IdOrKey', name: '主键', apply: { MYSQL: { type: 'bigint' } } }],
    database: [{ code: 'MYSQL' }],
  };
  const current = {
    datatype: [{ code: 'IdOrKey', name: '主键', apply: { MYSQL: { type: 'int' } } }],
    database: [{ code: 'MYSQL' }],
  };
  const changes = checkVersionStructuralDiff(
    { modules: [], dataTypeDomains: current },
    { modules: [], dataTypeDomains: base },
  );
  const dt = changes.find((c) => c.type === 'datatype' && c.name === 'datatype.IdOrKey');
  if (!dt || dt.opt !== 'update') throw new Error(JSON.stringify(changes));
});

run('empty diff is not meaningful', () => {
  const snap = { modules: baseModules, profile: baseProfile };
  const changes = checkVersionStructuralDiff(snap, snap);
  if (hasMeaningfulVersionChanges(changes)) throw new Error(JSON.stringify(changes));
});

run('snapshotProjectJSONForVersion strips dbs', () => {
  const snap = snapshotProjectJSONForVersion({
    modules: baseModules,
    profile: { defaultFields: [], dbs: [{ url: 'secret' }] },
    dataTypeDomains: { datatype: [] },
  });
  if ((snap.profile as Record<string, unknown>).dbs) throw new Error('dbs should be stripped');
  if (!Array.isArray(snap.modules)) throw new Error('modules missing');
});

console.log('versionStructuralDiff.test.ts OK');
