/**
 * ADR-0017 Phase 2a：getActiveDiagram / 懒迁移
 * 运行：npx tsx src/utils/diagram.test.ts
 */
import assert from 'node:assert/strict';
import {
  DEFAULT_DIAGRAM_ID,
  DEFAULT_DIAGRAM_NAME,
  ensureDiagrams,
  getActiveDiagram,
  listDiagrams,
  parseDiagramIdFromTabEntity,
  relationTabEntity,
  upsertDiagramLayout,
} from './diagram';

async function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (e) {
    console.error(`fail - ${name}`);
    throw e;
  }
}

async function main() {
  await run('无 diagrams：虚拟迁移自 graphCanvas', () => {
    const mod = {
      graphCanvas: { nodes: [{ id: 'T1', x: 10, y: 20 }] },
    };
    const d = getActiveDiagram(mod);
    assert.equal(d.id, DEFAULT_DIAGRAM_ID);
    assert.equal(d.name, DEFAULT_DIAGRAM_NAME);
    assert.equal(d.layout.nodes[0].x, 10);
    assert.equal(mod.diagrams, undefined, '读路径不得 mutate');
  });

  await run('ensureDiagrams：物化且幂等', () => {
    const mod: any = {
      graphCanvas: { nodes: [{ id: 'T1', title: 'T1', x: 1, y: 2 }] },
    };
    const a = ensureDiagrams(mod);
    assert.equal(a.length, 1);
    assert.equal(a[0].layout.nodes[0].id, 'T1');
    const b = ensureDiagrams(mod);
    assert.equal(b, a);
  });

  await run('getActiveDiagram：按 id 选中', () => {
    const mod = {
      diagrams: [
        { id: 'main', name: '主关系图', layout: { nodes: [] } },
        { id: 'auth', name: '鉴权', layout: { nodes: [{ id: 'U', x: 0, y: 0 }] } },
      ],
    };
    assert.equal(getActiveDiagram(mod, 'auth').name, '鉴权');
    assert.equal(getActiveDiagram(mod, 'missing').id, 'main');
  });

  await run('tab entity 往返', () => {
    assert.equal(relationTabEntity('SHOP'), '关系图-SHOP');
    assert.equal(relationTabEntity('SHOP', 'main'), '关系图-SHOP');
    assert.equal(relationTabEntity('SHOP', 'auth'), '关系图-SHOP-auth');
    assert.equal(parseDiagramIdFromTabEntity('SHOP', '关系图-SHOP'), 'main');
    assert.equal(parseDiagramIdFromTabEntity('SHOP', '关系图-SHOP-auth'), 'auth');
  });

  await run('upsertDiagramLayout：只写目标图', () => {
    const d = { id: 'main', name: '主', layout: { nodes: [] as any[] } };
    upsertDiagramLayout(d, [{ id: 'A', position: { x: 3.2, y: 4.8 } }]);
    assert.deepEqual(d.layout.nodes[0], { id: 'A', title: 'A', x: 3, y: 5 });
  });

  await run('listDiagrams：无 diagrams 返回虚拟主图', () => {
    const list = listDiagrams({ graphCanvas: { nodes: [] } });
    assert.equal(list.length, 1);
    assert.equal(list[0].id, DEFAULT_DIAGRAM_ID);
  });

  console.log('diagram.test: all passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
