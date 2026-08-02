/**
 * relationEdges 单测：同表对多 FK lane 居中分流
 * 运行：npx tsx src/utils/relationEdges.test.ts
 */
import assert from 'assert';
import {
  EDGE_LANE_STEP,
  EDGE_STEP_OFFSET,
  ERD_EDGE_TYPE,
  associationsToEdges,
  laneOffsetsForPairCount,
  stepOffsetForLane,
} from './relationEdges';

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

  await run('stepOffset：随 laneIndex 增大', () => {
    assert.strictEqual(stepOffsetForLane(0, 0), EDGE_STEP_OFFSET);
    assert.strictEqual(stepOffsetForLane(0, 1), EDGE_STEP_OFFSET + EDGE_LANE_STEP);
    assert.strictEqual(stepOffsetForLane(99, 2), EDGE_STEP_OFFSET + 2 * EDGE_LANE_STEP);
  });

  await run('associationsToEdges：同 pair 两边不同 stepOffset', () => {
    const edges = associationsToEdges([
      { relation: 'n:1', from: { entity: 'orders', field: 'user_id' }, to: { entity: 'users', field: 'id' } },
      { relation: 'n:1', from: { entity: 'orders', field: 'owner_id' }, to: { entity: 'users', field: 'id' } },
    ]);
    assert.strictEqual(edges.length, 2);
    assert.ok(edges.every((e) => e.type === ERD_EDGE_TYPE));
    const steps = edges.map((e) => (e.data as { stepOffset: number }).stepOffset);
    assert.notStrictEqual(steps[0], steps[1], '并行边肘距应不同');
    const lanes = edges.map((e) => (e.data as { laneOffset: number }).laneOffset);
    assert.strictEqual(lanes[0] + lanes[1], 0, '双边 lane 应对称');
  });

  await run('associationsToEdges：不同 pair 互不抢 lane', () => {
    const edges = associationsToEdges([
      { from: { entity: 'a', field: 'b_id' }, to: { entity: 'b', field: 'id' } },
      { from: { entity: 'a', field: 'c_id' }, to: { entity: 'c', field: 'id' } },
    ]);
    assert.ok(edges.every((e) => (e.data as { laneOffset: number }).laneOffset === 0));
    assert.ok(edges.every((e) => (e.data as { stepOffset: number }).stepOffset === EDGE_STEP_OFFSET));
  });

  console.log('all relationEdges tests passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
