/**
 * relationEdgeRoute 单测：中间表障碍 → centerX / bypass 绕行
 * 运行：npx tsx src/utils/relationEdgeRoute.test.ts
 */
import assert from 'assert';
import { Position } from 'reactflow';
import {
  EDGE_OBSTACLE_PAD,
  assignTrunkBundleOffsets,
  collectCenterXCandidates,
  oppositeLRWaypoints,
  polylineHitsObstacles,
  routeErdSmoothStep,
  segmentIntersectsRect,
  trunkBundleOffsetsForCount,
} from './relationEdgeRoute';
import { EDGE_STEP_OFFSET } from './relationEdges';

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
  await run('segmentIntersectsRect：竖线穿表', () => {
    const r = { id: 'b', x: 100, y: 0, width: 100, height: 80 };
    assert.strictEqual(segmentIntersectsRect(150, -10, 150, 90, r), true);
    assert.strictEqual(segmentIntersectsRect(50, -10, 50, 90, r), false);
  });

  await run('无障碍 → mode default', () => {
    const r = routeErdSmoothStep({
      sourceX: 240,
      sourceY: 40,
      targetX: 600,
      targetY: 40,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      offset: EDGE_STEP_OFFSET,
      obstacles: [],
    });
    assert.strictEqual(r.mode, 'default');
    assert.ok(r.path.startsWith('M'));
  });

  await run('同行中间表挡水平走廊 → bypass', () => {
    // A(0,0) 240×100 — B(280,0) 240×100 — C(600,20)
    // 默认 centerX≈420 落在 B 内；水平段 y=40 也穿 B → 必须 bypass
    const mid = { id: 'B', x: 280, y: 0, width: 240, height: 100 };
    const r = routeErdSmoothStep({
      sourceX: 240,
      sourceY: 40,
      targetX: 600,
      targetY: 60,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      offset: EDGE_STEP_OFFSET,
      obstacles: [mid],
    });
    assert.strictEqual(r.mode, 'bypass', `mode=${r.mode}`);
    const expanded = {
      ...mid,
      x: mid.x - EDGE_OBSTACLE_PAD,
      y: mid.y - EDGE_OBSTACLE_PAD,
      width: mid.width + 2 * EDGE_OBSTACLE_PAD,
      height: mid.height + 2 * EDGE_OBSTACLE_PAD,
    };
    const defaultPts = oppositeLRWaypoints(
      240,
      40,
      600,
      60,
      EDGE_STEP_OFFSET,
      (240 + 600) / 2,
      Position.Right,
      Position.Left,
    );
    assert.strictEqual(polylineHitsObstacles(defaultPts, [expanded]), true);
    assert.ok(r.path.length > 10);
  });

  await run('错位障碍仅挡竖线 → centerX 即可', () => {
    // 源/目标 Y 远离障碍带：水平段不穿表，仅默认竖肘 x=420 穿障
    const block = { id: 'blk', x: 400, y: 80, width: 40, height: 60 };
    const r = routeErdSmoothStep({
      sourceX: 240,
      sourceY: 30,
      targetX: 600,
      targetY: 200,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      offset: EDGE_STEP_OFFSET,
      obstacles: [block],
    });
    assert.strictEqual(r.mode, 'centerX', `expected centerX got ${r.mode}`);
    assert.ok(r.path.includes('Q') || r.path.includes('L'));
  });

  await run('collectCenterXCandidates：含默认且有序近默认', () => {
    const c = collectCenterXCandidates(268, 572, 420, [
      { id: 'b', x: 300, y: 0, width: 200, height: 80 },
    ]);
    assert.ok(c.includes(420) || Math.abs(c[0] - 420) < 1);
    assert.ok(c[0] === 420 || Math.abs(c[0] - 420) <= Math.abs(c[1] - 420));
  });

  await run('trunkBundleOffsetsForCount：双线 ±step/2', () => {
    assert.deepStrictEqual(trunkBundleOffsetsForCount(1), [0]);
    assert.deepStrictEqual(trunkBundleOffsetsForCount(2, 12), [-6, 6]);
    assert.deepStrictEqual(trunkBundleOffsetsForCount(3, 12), [-12, 0, 12]);
  });

  await run('assignTrunkBundleOffsets：同通道分流、异通道独立', () => {
    const m = assignTrunkBundleOffsets([
      { id: 'a', midX: 100 },
      { id: 'b', midX: 110 },
      { id: 'c', midX: 400 },
    ]);
    assert.strictEqual(m.get('a'), -6);
    assert.strictEqual(m.get('b'), 6);
    assert.strictEqual(m.get('c'), 0);
  });

  await run('trunkBundleOffset：无障碍时 path 随偏移变化', () => {
    const base = {
      sourceX: 240,
      sourceY: 40,
      targetX: 600,
      targetY: 40,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      offset: EDGE_STEP_OFFSET,
      obstacles: [] as [],
    };
    const r0 = routeErdSmoothStep({ ...base, trunkBundleOffset: 0 });
    const r1 = routeErdSmoothStep({ ...base, trunkBundleOffset: 12 });
    assert.strictEqual(r0.mode, 'default');
    assert.strictEqual(r1.mode, 'default');
    assert.notStrictEqual(r0.path, r1.path);
  });

  console.log('all relationEdgeRoute tests passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
