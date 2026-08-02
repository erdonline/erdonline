/**
 * ADR-0017 Phase 2：getActiveDiagram / Frame helpers
 * 运行：npx tsx src/utils/diagram.test.ts
 */
import assert from 'node:assert/strict';
import {
  DEFAULT_DIAGRAM_ID,
  DEFAULT_DIAGRAM_NAME,
  DEFAULT_FRAME_W,
  addFrameToDiagram,
  addMembersToFrame,
  computeFrameBoundsFromNodes,
  ensureDiagrams,
  expandFrameBoundsToNodes,
  frameNodeId,
  getActiveDiagram,
  getActiveDiagramFrames,
  isFrameNodeId,
  isPointInFrameBounds,
  listDiagrams,
  parseDiagramIdFromTabEntity,
  parseFrameIdFromNodeId,
  purgeFrameMemberId,
  relationTabEntity,
  removeMembersFromFrame,
  renameFrameMemberIds,
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

  await run('Frame：包围盒 + 成员显式 + 不改节点坐标', () => {
    const nodes = [
      { position: { x: 100, y: 50 }, width: 220, height: 80 },
      { position: { x: 400, y: 200 }, width: 220, height: 80 },
    ];
    const before = nodes.map((n) => ({ ...n.position }));
    const bounds = computeFrameBoundsFromNodes(nodes, 48);
    assert.equal(bounds.x, 52);
    assert.equal(bounds.y, 2);
    assert.equal(bounds.w, 616);
    assert.equal(bounds.h, 326);
    assert.deepEqual(
      nodes.map((n) => n.position),
      before,
      '不得重父化/改写成员坐标',
    );

    const empty = computeFrameBoundsFromNodes([]);
    assert.equal(empty.w, DEFAULT_FRAME_W);

    const d = { id: 'main', name: '主', layout: { nodes: [] as any[] }, groups: [] as any[] };
    const f = addFrameToDiagram(d, {
      name: '鉴权',
      memberEntityIds: ['U', 'R', 'U'],
      ...bounds,
    });
    assert.equal(f.name, '鉴权');
    assert.deepEqual(f.memberEntityIds, ['U', 'R']);
    assert.equal(d.groups?.length, 1);

    addMembersToFrame(d, f.id, ['P']);
    assert.deepEqual(f.memberEntityIds, ['U', 'R', 'P']);

    removeMembersFromFrame(d, f.id, ['P']);
    assert.deepEqual(f.memberEntityIds, ['U', 'R']);

    renameFrameMemberIds(d, 'U', 'USER');
    assert.ok(f.memberEntityIds.includes('USER'));
    assert.ok(!f.memberEntityIds.includes('U'));

    purgeFrameMemberId(d, 'R');
    assert.ok(!f.memberEntityIds.includes('R'));

    const nid = frameNodeId(f.id);
    assert.ok(isFrameNodeId(nid));
    assert.equal(parseFrameIdFromNodeId(nid), f.id);

    assert.ok(isPointInFrameBounds(100, 100, { x: 0, y: 0, w: 200, h: 200 }));
    assert.ok(!isPointInFrameBounds(300, 100, { x: 0, y: 0, w: 200, h: 200 }));

    const expanded = expandFrameBoundsToNodes(
      { x: 0, y: 0, w: 100, h: 100 },
      [{ position: { x: 80, y: 80 }, width: 220, height: 80 }],
      40,
    );
    assert.ok(expanded.w > 100);
    assert.ok(expanded.h > 100);
    assert.equal(expanded.x, 0);
    assert.equal(expanded.y, 0);
  });

  await run('getActiveDiagramFrames：读 groups', () => {
    const mod = {
      diagrams: [
        {
          id: 'main',
          name: '主',
          layout: { nodes: [] },
          groups: [
            {
              id: 'f1',
              name: 'G',
              x: 0,
              y: 0,
              w: 100,
              h: 80,
              memberEntityIds: ['A'],
            },
          ],
        },
      ],
    };
    assert.equal(getActiveDiagramFrames(mod).length, 1);
    assert.equal(getActiveDiagramFrames(mod)[0].name, 'G');
  });

  console.log('diagram.test: all passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
