/**
 * relationEdges 单测：同表对多 FK lane + hub 扇出 + 几何择柄
 * 运行：npx tsx src/utils/relationEdges.test.ts
 */
import assert from 'assert';
import { NODE_WIDTH } from './graphLayout';
import {
  EDGE_HUB_FAN_MIN,
  EDGE_HUB_FAN_STEP,
  EDGE_LABEL_BG_PADDING,
  EDGE_LABEL_BG_RADIUS,
  EDGE_LABEL_FONT_SIZE,
  EDGE_LANE_STEP,
  EDGE_STEP_OFFSET,
  ERD_EDGE_TYPE,
  PORT_VERTICAL_STACK_DY,
  associationsToEdges,
  hubFanOffsetsForAssociations,
  hubFanOffsetsForCount,
  laneOffsetsForPairCount,
  parseFieldHandle,
  pickPortSides,
  sourceHandleId,
  stepOffsetForLane,
  targetHandleId,
} from './relationEdges';
import { erdColors } from '@/theme/tokens';

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
  await run('laneOffsets：单边 = [0]', () => {
    assert.deepStrictEqual(laneOffsetsForPairCount(1), [0]);
  });

  await run('laneOffsets：双边对称', () => {
    const lanes = laneOffsetsForPairCount(2);
    assert.deepStrictEqual(lanes, [-EDGE_LANE_STEP / 2, EDGE_LANE_STEP / 2]);
  });

  await run('laneOffsets：三边居中含 0', () => {
    const lanes = laneOffsetsForPairCount(3);
    assert.deepStrictEqual(lanes, [-EDGE_LANE_STEP, 0, EDGE_LANE_STEP]);
  });

  await run('hubFanOffsetsForCount：三辐对称', () => {
    assert.deepStrictEqual(hubFanOffsetsForCount(3), [
      -EDGE_HUB_FAN_STEP,
      0,
      EDGE_HUB_FAN_STEP,
    ]);
  });

  await run('stepOffset：随 laneIndex 增大', () => {
    assert.strictEqual(stepOffsetForLane(0, 0), EDGE_STEP_OFFSET);
    assert.strictEqual(stepOffsetForLane(0, 1), EDGE_STEP_OFFSET + EDGE_LANE_STEP);
    assert.strictEqual(stepOffsetForLane(99, 2), EDGE_STEP_OFFSET + 2 * EDGE_LANE_STEP);
  });

  await run('pickPortSides：水平右靶 → lr', () => {
    const p = pickPortSides({ x: 0, y: 0 }, { x: NODE_WIDTH + 80, y: 0 });
    assert.deepStrictEqual(p, { sourceSide: 'r', targetSide: 'l', mode: 'lr' });
  });

  await run('pickPortSides：水平左靶 → rl', () => {
    const p = pickPortSides({ x: NODE_WIDTH + 80, y: 0 }, { x: 0, y: 0 });
    assert.deepStrictEqual(p, { sourceSide: 'l', targetSide: 'r', mode: 'rl' });
  });

  await run('pickPortSides：同列竖叠 → same（左）', () => {
    assert.ok(PORT_VERTICAL_STACK_DY <= 200);
    const p = pickPortSides({ x: 40, y: 40 }, { x: 48, y: 280 });
    assert.strictEqual(p.mode, 'same');
    assert.strictEqual(p.sourceSide, p.targetSide);
    assert.strictEqual(p.sourceSide, 'l');
  });

  await run('pickPortSides：同列略偏右 → same（右）', () => {
    const p = pickPortSides({ x: 40, y: 40 }, { x: 60, y: 280 });
    assert.strictEqual(p.mode, 'same');
    assert.strictEqual(p.sourceSide, 'r');
    assert.strictEqual(p.targetSide, 'r');
  });

  await run('parseFieldHandle：新/旧 id', () => {
    assert.deepStrictEqual(parseFieldHandle('user_id-src-r'), {
      field: 'user_id',
      role: 'src',
      side: 'r',
    });
    assert.deepStrictEqual(parseFieldHandle('id-tgt-l'), {
      field: 'id',
      role: 'tgt',
      side: 'l',
    });
    assert.deepStrictEqual(parseFieldHandle('id-tgt'), {
      field: 'id',
      role: 'tgt',
    });
    assert.strictEqual(parseFieldHandle(''), null);
  });

  await run('associationsToEdges：无坐标默认 lr 手柄', () => {
    const edges = associationsToEdges([
      { relation: 'n:1', from: { entity: 'orders', field: 'user_id' }, to: { entity: 'users', field: 'id' } },
      { relation: 'n:1', from: { entity: 'orders', field: 'owner_id' }, to: { entity: 'users', field: 'id' } },
    ]);
    assert.strictEqual(edges.length, 2);
    assert.ok(edges.every((e) => e.type === ERD_EDGE_TYPE));
    assert.ok(edges.every((e) => e.sourceHandle === sourceHandleId('user_id', 'r') || e.sourceHandle === sourceHandleId('owner_id', 'r')));
    assert.ok(edges.every((e) => e.targetHandle === targetHandleId('id', 'l')));
    assert.ok(edges.every((e) => (e.data as { portMode: string }).portMode === 'lr'));
    const steps = edges.map((e) => (e.data as { stepOffset: number }).stepOffset);
    assert.notStrictEqual(steps[0], steps[1], '并行边肘距应不同');
    const lanes = edges.map((e) => (e.data as { laneOffset: number }).laneOffset);
    assert.strictEqual(lanes[0] + lanes[1], 0, '双边 lane 应对称');
  });

  await run('associationsToEdges：边标签 chip 可读默认', () => {
    const [edge] = associationsToEdges([
      { relation: '1:n', from: { entity: 'a', field: 'b_id' }, to: { entity: 'b', field: 'id' } },
    ]);
    assert.strictEqual(edge.label, '1:n');
    assert.strictEqual(edge.labelStyle?.fontSize, EDGE_LABEL_FONT_SIZE);
    assert.ok(EDGE_LABEL_FONT_SIZE >= 11);
    assert.strictEqual(edge.labelStyle?.fill, erdColors.ink600);
    assert.notStrictEqual(edge.labelStyle?.fill, erdColors.ink400, '禁低对比 ink400');
    assert.strictEqual(edge.labelBgStyle?.fill, erdColors.surface);
    assert.notStrictEqual(edge.labelBgStyle?.fill, erdColors.surfaceSunk, '禁与画布 sunk 同色');
    assert.strictEqual(edge.labelBgStyle?.fillOpacity, 1);
    assert.deepStrictEqual(edge.labelBgPadding, EDGE_LABEL_BG_PADDING);
    assert.deepStrictEqual(EDGE_LABEL_BG_PADDING, [4, 2], 'chip 水平/垂直 padding 再压密');
    assert.ok(EDGE_LABEL_BG_PADDING[0] <= 4 && EDGE_LABEL_BG_PADDING[1] <= 2);
    assert.strictEqual(edge.labelBgBorderRadius, EDGE_LABEL_BG_RADIUS);
    assert.ok(EDGE_LABEL_BG_RADIUS <= 3, 'chip 圆角勿过大');
  });

  await run('associationsToEdges：不同 pair 互不抢 lane', () => {
    const edges = associationsToEdges([
      { from: { entity: 'a', field: 'b_id' }, to: { entity: 'b', field: 'id' } },
      { from: { entity: 'a', field: 'c_id' }, to: { entity: 'c', field: 'id' } },
    ]);
    assert.ok(edges.every((e) => (e.data as { laneOffset: number }).laneOffset === 0));
    assert.ok(edges.every((e) => (e.data as { stepOffset: number }).stepOffset === EDGE_STEP_OFFSET));
  });

  await run('hubFan：度数不足不扇出', () => {
    const assocs = [
      { from: { entity: 'a', field: 'h_id' }, to: { entity: 'hub', field: 'id' } },
      { from: { entity: 'b', field: 'h_id' }, to: { entity: 'hub', field: 'id' } },
    ];
    assert.ok(EDGE_HUB_FAN_MIN > 2);
    const fans = hubFanOffsetsForAssociations(assocs);
    assert.deepStrictEqual(fans, [0, 0]);
  });

  await run('hubFan：三辐按 Y 排序扇出', () => {
    const assocs = [
      { from: { entity: 'c', field: 'h_id' }, to: { entity: 'hub', field: 'id' } },
      { from: { entity: 'a', field: 'h_id' }, to: { entity: 'hub', field: 'id' } },
      { from: { entity: 'b', field: 'h_id' }, to: { entity: 'hub', field: 'id' } },
    ];
    const positions = {
      a: { x: 0, y: 0 },
      b: { x: 0, y: 100 },
      c: { x: 0, y: 200 },
      hub: { x: 300, y: 100 },
    };
    const fans = hubFanOffsetsForAssociations(assocs, positions);
    // Y 序 a,b,c → 对应 idx 1,2,0
    assert.strictEqual(fans[1], -EDGE_HUB_FAN_STEP);
    assert.strictEqual(fans[2], 0);
    assert.strictEqual(fans[0], EDGE_HUB_FAN_STEP);
  });

  await run('associationsToEdges：hubFan 并入 laneOffset', () => {
    const assocs = [
      { from: { entity: 'a', field: 'h_id' }, to: { entity: 'hub', field: 'id' } },
      { from: { entity: 'b', field: 'h_id' }, to: { entity: 'hub', field: 'id' } },
      { from: { entity: 'c', field: 'h_id' }, to: { entity: 'hub', field: 'id' } },
    ];
    const positions = {
      a: { x: 0, y: 0 },
      b: { x: 0, y: 50 },
      c: { x: 0, y: 100 },
      hub: { x: 300, y: 50 },
    };
    const edges = associationsToEdges(assocs, { positions });
    const fans = edges.map((e) => (e.data as { hubFanOffset: number }).hubFanOffset);
    assert.deepStrictEqual(fans, [-EDGE_HUB_FAN_STEP, 0, EDGE_HUB_FAN_STEP]);
    const lanes = edges.map((e) => (e.data as { laneOffset: number }).laneOffset);
    assert.deepStrictEqual(lanes, fans, '无 pair 叠边时 lane = hubFan');
    assert.ok(edges.every((e) => (e.data as { portMode: string }).portMode === 'lr'));
  });

  await run('associationsToEdges：竖叠同列 → same 侧手柄', () => {
    const edges = associationsToEdges(
      [
        {
          relation: '0,n:1',
          from: { entity: 'T_ORDER', field: 'T1_ID' },
          to: { entity: 'T_TABLE_1', field: 'id' },
        },
      ],
      {
        positions: {
          T_TABLE_1: { x: 40, y: 40 },
          T_ORDER: { x: 40, y: 280 },
        },
      },
    );
    assert.strictEqual(edges.length, 1);
    assert.strictEqual((edges[0].data as { portMode: string }).portMode, 'same');
    assert.strictEqual(edges[0].sourceHandle, sourceHandleId('T1_ID', 'l'));
    assert.strictEqual(edges[0].targetHandle, targetHandleId('id', 'l'));
  });

  console.log('all relationEdges tests passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
