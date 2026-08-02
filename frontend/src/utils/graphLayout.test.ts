/**
 * graphLayout 单测：FK 链应按 LR 分层（外键侧 x < 主键侧 x）
 * 运行：npx tsx src/utils/graphLayout.test.ts
 */
import assert from 'assert';
import {
  dagrePositions,
  graphCanvasNodesFromDagre,
  resolveEntityPositions,
} from './graphLayout';

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

  console.log('graphLayout.test.ts OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
