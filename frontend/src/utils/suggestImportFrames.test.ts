/**
 * 导入 Frame 建议单测
 * 运行：cd frontend && npx tsx src/utils/suggestImportFrames.test.ts
 */
import assert from 'node:assert/strict';
import {
  pickImportFrameClusters,
  suggestImportFrames,
  tableNamePrefix,
} from './suggestImportFrames';
import { FRAME_PADDING } from './diagram';
import { NODE_WIDTH } from './graphLayout';

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (e) {
    console.error(`fail - ${name}`);
    throw e;
  }
}

function main() {
  run('tableNamePrefix：sys_user → sys', () => {
    assert.equal(tableNamePrefix('sys_user'), 'sys');
    assert.equal(tableNamePrefix('biz_order'), 'biz');
    assert.equal(tableNamePrefix('users'), null);
    assert.equal(tableNamePrefix('T_USER'), 'T');
  });

  run('前缀：sys_* + biz_* → 两组；不全覆盖不框单前缀全表', () => {
    const clusters = pickImportFrameClusters([
      'sys_user',
      'sys_role',
      'biz_order',
      'biz_item',
    ]);
    assert.equal(clusters.length, 2);
    assert.deepEqual(
      clusters.map((c) => c.name).sort(),
      ['biz', 'sys'],
    );

    assert.deepEqual(pickImportFrameClusters(['sys_user', 'sys_role']), [], '全表同前缀不框');
    assert.equal(
      pickImportFrameClusters(['sys_user', 'sys_role', 'orphan']).length,
      1,
      '有孤儿表时可框前缀簇',
    );
  });

  run('无前缀：≥2 连通分量才建议', () => {
    const titles = ['a', 'b', 'c', 'd'];
    const assocs = [
      { from: { entity: 'a' }, to: { entity: 'b' } },
      { from: { entity: 'c' }, to: { entity: 'd' } },
    ];
    const clusters = pickImportFrameClusters(titles, assocs);
    assert.equal(clusters.length, 2);

    const oneBlob = pickImportFrameClusters(
      ['a', 'b', 'c'],
      [
        { from: { entity: 'a' }, to: { entity: 'b' } },
        { from: { entity: 'b' }, to: { entity: 'c' } },
      ],
    );
    assert.deepEqual(oneBlob, [], '单连通分量不整图框');
  });

  run('suggestImportFrames：烘焙包围盒 + 色板', () => {
    const entities = [
      { title: 'sys_user', fields: [{ name: 'id' }] },
      { title: 'sys_role', fields: [{ name: 'id' }, { name: 'code' }] },
      { title: 'biz_order', fields: [{ name: 'id' }] },
      { title: 'biz_item', fields: [{ name: 'id' }] },
    ];
    const layoutNodes = [
      { id: 'sys_user', x: 40, y: 40 },
      { id: 'sys_role', x: 320, y: 40 },
      { id: 'biz_order', x: 40, y: 400 },
      { id: 'biz_item', x: 320, y: 400 },
    ];
    const frames = suggestImportFrames({ entities, layoutNodes });
    assert.equal(frames.length, 2);
    const sys = frames.find((f) => f.name === 'sys');
    const biz = frames.find((f) => f.name === 'biz');
    assert.ok(sys && biz);
    assert.deepEqual(sys!.memberEntityIds, ['sys_role', 'sys_user']);
    assert.equal(sys!.x, 40 - FRAME_PADDING);
    assert.equal(sys!.y, 40 - FRAME_PADDING);
    assert.ok(sys!.w >= NODE_WIDTH + (320 - 40) + FRAME_PADDING * 2 - 1);
    assert.ok(sys!.color);
    assert.notEqual(sys!.color, biz!.color);
  });

  run('users/posts：无建议', () => {
    const frames = suggestImportFrames({
      entities: [{ title: 'users' }, { title: 'posts' }],
      associations: [{ from: { entity: 'posts' }, to: { entity: 'users' } }],
      layoutNodes: [
        { id: 'users', x: 200, y: 0 },
        { id: 'posts', x: 0, y: 0 },
      ],
    });
    assert.equal(frames.length, 0);
  });

  console.log('suggestImportFrames.test.ts OK');
}

main();
