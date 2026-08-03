/**
 * relationEdges 单测：同表对多 FK lane + hub 扇出 + 几何择柄
 * 运行：npx tsx src/utils/relationEdges.test.ts
 */
import assert from 'assert';
import { NODE_WIDTH } from './graphLayout';
import {
  CARDINALITY_OPTIONS,
  crowFootEnds,
  crowFootMarkerId,
  crowFootMarkersForRelation,
  DEFAULT_RELATION,
  EDGE_HUB_FAN_MIN,
  EDGE_HUB_FAN_STEP,
  EDGE_LABEL_BG_PADDING,
  EDGE_LABEL_BG_RADIUS,
  EDGE_LABEL_CHIP_H,
  EDGE_LABEL_CHIP_W,
  EDGE_LABEL_COLLISION_GAP,
  EDGE_LABEL_FONT_SIZE,
  EDGE_LANE_STEP,
  EDGE_STEP_OFFSET,
  EDGE_STROKE,
  EDGE_STROKE_WIDTH,
  EDGE_STROKE_WIDTH_SELECTED,
  ERD_EDGE_TYPE,
  PORT_VERTICAL_STACK_DY,
  associationsToEdges,
  edgeLabelBundleStretch,
  edgeLabelLaneStretch,
  formatAssociationFkMeta,
  hubFanOffsetsForAssociations,
  hubFanOffsetsForCount,
  laneOffsetsForPairCount,
  normalizeConstraintName,
  normalizeFkRule,
  normalizeRelation,
  parseFieldHandle,
  pickPortSides,
  resolveEdgeLabelOffsets,
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
    assert.ok(EDGE_LABEL_FONT_SIZE >= 12, '截图扫读字号 ≥12');
    assert.strictEqual(edge.labelStyle?.fill, erdColors.ink900);
    assert.notStrictEqual(edge.labelStyle?.fill, erdColors.ink600, '禁回退低对比 ink600 字');
    assert.notStrictEqual(edge.labelStyle?.fill, erdColors.ink400, '禁低对比 ink400');
    assert.ok(EDGE_LABEL_CHIP_W >= 40 && EDGE_LABEL_CHIP_H >= 20, '碰撞盒跟字号抬一档');
    assert.strictEqual(edge.labelBgStyle?.fill, erdColors.surface);
    assert.notStrictEqual(edge.labelBgStyle?.fill, erdColors.surfaceSunk, '禁与画布 sunk 同色');
    assert.strictEqual(edge.labelBgStyle?.fillOpacity, 1);
    assert.deepStrictEqual(edge.labelBgPadding, EDGE_LABEL_BG_PADDING);
    assert.deepStrictEqual(EDGE_LABEL_BG_PADDING, [4, 2], 'chip 水平/垂直 padding 再压密');
    assert.ok(EDGE_LABEL_BG_PADDING[0] <= 4 && EDGE_LABEL_BG_PADDING[1] <= 2);
    assert.strictEqual(edge.labelBgBorderRadius, EDGE_LABEL_BG_RADIUS);
    assert.ok(EDGE_LABEL_BG_RADIUS <= 3, 'chip 圆角勿过大');
    assert.ok(
      EDGE_LABEL_COLLISION_GAP <= 4 && EDGE_LABEL_COLLISION_GAP >= 2,
      '避让 gap 已贴密下限（再压叠字风险）',
    );
  });

  await run('normalizeFkRule：合法 / 空 / 非法', () => {
    assert.strictEqual(normalizeFkRule('cascade'), 'CASCADE');
    assert.strictEqual(normalizeFkRule('SET NULL'), 'SET NULL');
    assert.strictEqual(normalizeFkRule(''), '');
    assert.strictEqual(normalizeFkRule('  '), '');
    assert.strictEqual(normalizeFkRule(null), '');
    assert.strictEqual(normalizeFkRule('DROP'), null);
  });

  await run('normalizeConstraintName：合法 / 空 / 非法', () => {
    assert.strictEqual(normalizeConstraintName('fk_order_user'), 'fk_order_user');
    assert.strictEqual(normalizeConstraintName('  FK_A  '), 'FK_A');
    assert.strictEqual(normalizeConstraintName(''), '');
    assert.strictEqual(normalizeConstraintName('  '), '');
    assert.strictEqual(normalizeConstraintName(null), '');
    assert.strictEqual(normalizeConstraintName('a\u0000b'), null);
    assert.strictEqual(normalizeConstraintName('x'.repeat(129)), null);
  });

  await run('associationsToEdges：透传 FK 约束元数据（ADR-0011 拆边同名）', () => {
    const edges = associationsToEdges([
      {
        relation: '1:n',
        from: { entity: 'order', field: 'tenant_id' },
        to: { entity: 'user', field: 'tenant_id' },
        constraintName: 'fk_order_user',
        deleteRule: 'CASCADE',
        updateRule: 'NO ACTION',
      },
      {
        relation: '1:n',
        from: { entity: 'order', field: 'user_id' },
        to: { entity: 'user', field: 'id' },
        constraintName: 'fk_order_user',
        deleteRule: 'CASCADE',
        updateRule: 'NO ACTION',
      },
    ]);
    assert.strictEqual(edges.length, 2);
    const d0 = edges[0].data as {
      constraintName?: string;
      deleteRule?: string;
      updateRule?: string;
    };
    const d1 = edges[1].data as {
      constraintName?: string;
      deleteRule?: string;
      updateRule?: string;
    };
    assert.strictEqual(d0.constraintName, 'fk_order_user');
    assert.strictEqual(d1.constraintName, 'fk_order_user');
    assert.strictEqual(d0.deleteRule, 'CASCADE');
    assert.strictEqual(d0.updateRule, 'NO ACTION');
    assert.strictEqual(
      formatAssociationFkMeta(d0),
      'fk_order_user，ON DELETE CASCADE，ON UPDATE NO ACTION',
    );
  });

  await run('associationsToEdges：默认描边权重/对比（分享可读）', () => {
    const [edge] = associationsToEdges([
      { relation: 'n:1', from: { entity: 'a', field: 'b_id' }, to: { entity: 'b', field: 'id' } },
    ]);
    assert.strictEqual(edge.style?.stroke, EDGE_STROKE);
    assert.strictEqual(EDGE_STROKE, erdColors.ink900, '默认干道用 ink900 对比 sunk');
    assert.notStrictEqual(EDGE_STROKE, erdColors.ink600, '禁回退低对比 ink600 干道');
    assert.strictEqual(edge.style?.strokeWidth, EDGE_STROKE_WIDTH);
    assert.ok(EDGE_STROKE_WIDTH >= 2, '默认线宽 ≥2');
    assert.ok(EDGE_STROKE_WIDTH_SELECTED > EDGE_STROKE_WIDTH, '选中须更粗');
    assert.ok(EDGE_STROKE_WIDTH_SELECTED <= 2.5, '选中勿胀到撞 crow/chip');
  });

  await run('edgeLabelBundleStretch：bundle 步长短于 chip → 拉伸到安全间距', () => {
    assert.strictEqual(edgeLabelBundleStretch(0, 12), 0);
    assert.strictEqual(
      edgeLabelBundleStretch(12, 12),
      EDGE_LABEL_CHIP_W + EDGE_LABEL_COLLISION_GAP,
    );
    assert.strictEqual(
      edgeLabelBundleStretch(-6, 12),
      -0.5 * (EDGE_LABEL_CHIP_W + EDGE_LABEL_COLLISION_GAP),
    );
    assert.ok(
      Math.abs(edgeLabelBundleStretch(12, 12)) * 2 >=
        EDGE_LABEL_CHIP_W + EDGE_LABEL_COLLISION_GAP,
      '双侧外缘间距应 ≥ chip+gap',
    );
  });

  await run('edgeLabelLaneStretch：lane 非零 → 额外 Y', () => {
    assert.strictEqual(edgeLabelLaneStretch(0), 0);
    assert.ok(edgeLabelLaneStretch(EDGE_LANE_STEP) > 0);
    assert.ok(edgeLabelLaneStretch(-EDGE_LANE_STEP) < 0);
  });

  await run('resolveEdgeLabelOffsets：重合锚点沿轴推开至无重叠', () => {
    const m = resolveEdgeLabelOffsets([
      { id: 'a', x: 100, y: 100 },
      { id: 'b', x: 100, y: 100 },
      { id: 'c', x: 100, y: 100 },
    ]);
    const pos = ['a', 'b', 'c'].map((id) => {
      const n = m.get(id)!;
      return { id, x: 100 + n.dx, y: 100 + n.dy };
    });
    const minDx = EDGE_LABEL_CHIP_W + EDGE_LABEL_COLLISION_GAP;
    const minDy = EDGE_LABEL_CHIP_H + EDGE_LABEL_COLLISION_GAP;
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const dx = Math.abs(pos[j].x - pos[i].x);
        const dy = Math.abs(pos[j].y - pos[i].y);
        assert.ok(
          dx >= minDx - 0.01 || dy >= minDy - 0.01,
          `pair ${pos[i].id}/${pos[j].id} still overlap dx=${dx} dy=${dy}`,
        );
      }
    }
  });

  await run('resolveEdgeLabelOffsets：已分离锚点不动', () => {
    const m = resolveEdgeLabelOffsets([
      { id: 'a', x: 0, y: 0 },
      { id: 'b', x: 200, y: 0 },
    ]);
    assert.deepStrictEqual(m.get('a'), { dx: 0, dy: 0 });
    assert.deepStrictEqual(m.get('b'), { dx: 0, dy: 0 });
  });

  await run('normalizeRelation：历史 0,n:1 → n:1；行业集合保留', () => {
    assert.strictEqual(normalizeRelation('0,n:1'), 'n:1');
    assert.strictEqual(normalizeRelation('0,1:1'), '1:1');
    assert.strictEqual(normalizeRelation('1:N'), '1:n');
    assert.strictEqual(normalizeRelation('n:m'), 'n:n');
    assert.strictEqual(DEFAULT_RELATION, 'n:1');
    assert.ok(CARDINALITY_OPTIONS.includes('1:1'));
    assert.ok(CARDINALITY_OPTIONS.includes('n:n'));
  });

  await run('crowFootEnds：四基数 → 两端 IE 记法', () => {
    assert.deepStrictEqual(crowFootEnds('1:1'), { source: 'one', target: 'one' });
    assert.deepStrictEqual(crowFootEnds('1:n'), { source: 'one', target: 'many' });
    assert.deepStrictEqual(crowFootEnds('n:1'), { source: 'many', target: 'one' });
    assert.deepStrictEqual(crowFootEnds('n:n'), { source: 'many', target: 'many' });
    assert.deepStrictEqual(crowFootEnds('0,n:1'), { source: 'many', target: 'one' });
    assert.deepStrictEqual(crowFootEnds(''), { source: 'many', target: 'one' });
    assert.deepStrictEqual(crowFootEnds(undefined), { source: 'many', target: 'one' });
  });

  await run('crowFootMarkersForRelation：url + id 对齐 defs', () => {
    const m = crowFootMarkersForRelation('n:1', 'ink');
    assert.strictEqual(m.markerStart, `url(#${crowFootMarkerId('many', 'start', 'ink')})`);
    assert.strictEqual(m.markerEnd, `url(#${crowFootMarkerId('one', 'end', 'ink')})`);
    const brand = crowFootMarkersForRelation('1:n', 'brand');
    assert.strictEqual(brand.markerStart, `url(#${crowFootMarkerId('one', 'start', 'brand')})`);
    assert.strictEqual(brand.markerEnd, `url(#${crowFootMarkerId('many', 'end', 'brand')})`);
  });

  await run('associationsToEdges：0,n:1 归一展示 + assoc 键', () => {
    const [edge] = associationsToEdges([
      {
        relation: '0,n:1',
        from: { entity: 'a', field: 'b_id' },
        to: { entity: 'b', field: 'id' },
      },
    ]);
    assert.strictEqual(edge.label, 'n:1');
    const d = edge.data as { assocFrom: { entity: string }; assocTo: { entity: string } };
    assert.strictEqual(d.assocFrom.entity, 'a');
    assert.strictEqual(d.assocTo.entity, 'b');
    assert.strictEqual(edge.markerStart, crowFootMarkersForRelation('n:1').markerStart);
    assert.strictEqual(edge.markerEnd, crowFootMarkersForRelation('n:1').markerEnd);
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
