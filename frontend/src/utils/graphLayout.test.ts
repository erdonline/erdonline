/**
 * graphLayout 单测：FK 链应按 LR 分层（外键侧 x < 主键侧 x）
 * 运行：npx tsx src/utils/graphLayout.test.ts
 */
import assert from 'assert';
import {
  DAGRE_NODESEP,
  DAGRE_RANKSEP,
  FIELD_ROW_H,
  dagrePositions,
  estimateNodeHeight,
  graphCanvasNodesFromDagre,
  layoutBoundingSize,
  resolveEntityPositions,
} from './graphLayout';
import demoProject from './demo.projectjson.json';

async function run(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    console.error(`✗ ${name}`);
    throw e;
  }
}

async function main() {
  await run('FIELD_ROW_H：字段行再压一档（与 .erd-field-row 对齐）', () => {
    assert.equal(FIELD_ROW_H, 26);
    const h1 = estimateNodeHeight({ title: 't', fields: [{ name: 'a' }] });
    const h3 = estimateNodeHeight({
      title: 't',
      fields: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
    });
    assert.equal(h1, 52 + 26 + 36);
    assert.equal(h3 - h1, 2 * FIELD_ROW_H);
  });

  await run('dagre：posts→users 时 posts.x < users.x（非网格散点）', () => {
    const entities = [
      { title: 'users', fields: [{ name: 'id' }, { name: 'name' }] },
      { title: 'posts', fields: [{ name: 'id' }, { name: 'user_id' }, { name: 'title' }] },
    ];
    const associations = [
      { from: { entity: 'posts' }, to: { entity: 'users' } },
    ];
    const pos = dagrePositions(entities, associations);
    assert.ok(pos.posts.x < pos.users.x, `期望 posts.x < users.x，得 ${pos.posts.x} / ${pos.users.x}`);
    // 旧 3 列网格：users@80、posts@360 → posts > users；dagre 必须反过来
    assert.ok(pos.posts.x < 200 || pos.users.x - pos.posts.x >= 80, '层间距应可见');
  });

  await run('graphCanvasNodesFromDagre：输出 id/x/y', () => {
    const nodes = graphCanvasNodesFromDagre(
      [{ title: 'a' }, { title: 'b' }],
      [{ from: { entity: 'a' }, to: { entity: 'b' } }],
    );
    assert.equal(nodes.length, 2);
    assert.ok(nodes.every((n) => typeof n.x === 'number' && typeof n.y === 'number'));
    const a = nodes.find((n) => n.id === 'a')!;
    const b = nodes.find((n) => n.id === 'b')!;
    assert.ok(a.x < b.x);
  });

  await run('resolveEntityPositions：保留已有坐标，只补缺', () => {
    const entities = [
      { title: 'users', fields: [{ name: 'id' }] },
      { title: 'posts', fields: [{ name: 'id' }] },
    ];
    const associations = [
      { from: { entity: 'posts' }, to: { entity: 'users' } },
    ];
    const { positions, didAutoLayout } = resolveEntityPositions(
      entities,
      associations,
      [{ id: 'users', x: 10, y: 20 }],
    );
    assert.equal(didAutoLayout, true);
    assert.deepEqual(positions.users, { x: 10, y: 20 });
    assert.ok(typeof positions.posts.x === 'number');
  });

  await run('resolveEntityPositions：全有坐标则不自动布局', () => {
    const { didAutoLayout, positions } = resolveEntityPositions(
      [{ title: 'a' }, { title: 'b' }],
      [],
      [
        { id: 'a', x: 1, y: 2 },
        { id: 'b', x: 3, y: 4 },
      ],
    );
    assert.equal(didAutoLayout, false);
    assert.deepEqual(positions.a, { x: 1, y: 2 });
  });

  await run('dagre 默认间距比旧走廊更密（同图宽更小）', () => {
    const entities = [
      { title: 'a', fields: [{ name: 'id' }, { name: 'n' }] },
      { title: 'b', fields: [{ name: 'id' }, { name: 'a_id' }, { name: 't' }] },
      { title: 'c', fields: [{ name: 'id' }, { name: 'b_id' }] },
    ];
    const associations = [
      { from: { entity: 'b' }, to: { entity: 'a' } },
      { from: { entity: 'c' }, to: { entity: 'b' } },
    ];
    const dense = layoutBoundingSize(dagrePositions(entities, associations), entities);
    const airy = layoutBoundingSize(
      dagrePositions(entities, associations, { nodesep: 80, ranksep: 160 }),
      entities,
    );
    assert.ok(
      dense.width <= airy.width && dense.height <= airy.height,
      `默认 ${dense.width}x${dense.height} 应 ≤ 旧走廊 ${airy.width}x${airy.height}`,
    );
    assert.equal(DAGRE_NODESEP, 56);
    assert.equal(DAGRE_RANKSEP, 108);
  });

  await run('demo 主图节点水平跨度更密（可分享截图）', () => {
    const mod = (demoProject as { modules: Array<{ diagrams?: Array<{ id: string; layout?: { nodes?: Array<{ id: string; x: number; y: number }> } }> }> }).modules[0];
    const main = mod.diagrams?.find((d) => d.id === 'main');
    const nodes = main?.layout?.nodes || [];
    assert.equal(nodes.length, 8);
    const xs = nodes.map((n) => n.x);
    const span = Math.max(...xs) - Math.min(...xs);
    // 旧手排 1280 → 1136 → 1072（列间距 ~28px）
    assert.ok(span < 1100, `主图 x 跨度应 <1100，得 ${span}`);
    assert.ok(span >= 1000, `主图仍应铺满叙事列，得 ${span}`);
  });

  console.log('graphLayout.test.ts OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
