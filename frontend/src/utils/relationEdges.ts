/**
 * 关系图边（ADR-0016）：设计器 + 分享只读画布共用。
 * 同表对多 FK 用 lane → 不同 smoothstep offset，肘部分流，减少叠线；
 * 高度数 hub 按对端 Y（或名）扇出，密 FK 星型不再贴成一捆。
 */
import { Edge, MarkerType } from 'reactflow';
import { erdColors } from '@/theme/tokens';

export const ERD_EDGE_TYPE = 'erdSmooth';

/** 边命中热区宽度（px）；视觉描边仍细 */
export const EDGE_INTERACTION_WIDTH = 24;

/** smoothstep 圆角 / 默认肘距 */
export const EDGE_BORDER_RADIUS = 10;
export const EDGE_STEP_OFFSET = 28;

/** 同 pair 多边：每条额外肘距（px） */
export const EDGE_LANE_STEP = 14;

/** 度数 ≥ 此值视为 hub，对端边扇出 */
export const EDGE_HUB_FAN_MIN = 3;
/** hub 扇出步长（px），并入 laneOffset 做 Y 分流 */
export const EDGE_HUB_FAN_STEP = 10;

export type RelationAssociation = {
  relation?: string;
  from?: { entity?: string; field?: string };
  to?: { entity?: string; field?: string };
};

export type ErdEdgeData = {
  /** 居中 lane：pair 分流 + hub 扇出；驱动肘距与轻微垂直分流 */
  laneOffset: number;
  /** 传给 getSmoothStepPath 的 offset */
  stepOffset: number;
  /** 仅 hub 扇出分量（供 E2E / 探针） */
  hubFanOffset?: number;
};

export type EdgeLayoutHint = {
  /** 表中心或左上角均可；只比相对 Y */
  positions?: Record<string, { x: number; y: number }>;
};

function pairKey(a: string, b: string): string {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

function validAssociations(
  associations: RelationAssociation[],
): RelationAssociation[] {
  return (associations || []).filter(
    (a) => a?.from?.entity && a?.from?.field && a?.to?.entity && a?.to?.field,
  );
}

/** 同无向表对 → 居中 laneOffset 列表（供单测） */
export function laneOffsetsForPairCount(n: number): number[] {
  if (n <= 1) return n === 1 ? [0] : [];
  return Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * EDGE_LANE_STEP);
}

/** hub 扇出列表（居中，步长 EDGE_HUB_FAN_STEP） */
export function hubFanOffsetsForCount(
  n: number,
  step = EDGE_HUB_FAN_STEP,
): number[] {
  if (n <= 1) return n === 1 ? [0] : [];
  return Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * step);
}

export function stepOffsetForLane(_laneOffset: number, laneIndex = 0): number {
  // index 拉开肘距（±lane 绝对值相同不会撞车）；laneOffset 留给路径 Y 分流
  return EDGE_STEP_OFFSET + laneIndex * EDGE_LANE_STEP;
}

/**
 * 按 hub 度数扇出：取度数更高的端点（≥ EDGE_HUB_FAN_MIN），
 * 对端按 Y（有坐标）或表名排序后居中赋偏移。
 * 返回与 validAssociations 同序的数组。
 */
export function hubFanOffsetsForAssociations(
  associations: RelationAssociation[],
  positions?: Record<string, { x: number; y: number }>,
): number[] {
  const valid = validAssociations(associations);
  const out = valid.map(() => 0);
  if (valid.length === 0) return out;

  const degree = new Map<string, number>();
  for (const a of valid) {
    const s = a.from!.entity!;
    const t = a.to!.entity!;
    degree.set(s, (degree.get(s) || 0) + 1);
    degree.set(t, (degree.get(t) || 0) + 1);
  }

  const hubs = [...degree.entries()]
    .filter(([, d]) => d >= EDGE_HUB_FAN_MIN)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const claimed = new Set<number>();
  for (const [hub] of hubs) {
    const spokes: Array<{ idx: number; peer: string; sortY: number; sortName: string }> =
      [];
    valid.forEach((a, idx) => {
      if (claimed.has(idx)) return;
      const s = a.from!.entity!;
      const t = a.to!.entity!;
      if (s !== hub && t !== hub) return;
      const peer = s === hub ? t : s;
      const pos = positions?.[peer];
      spokes.push({
        idx,
        peer,
        sortY: pos?.y ?? 0,
        sortName: peer,
      });
    });
    if (spokes.length < EDGE_HUB_FAN_MIN) continue;
    spokes.sort((a, b) => {
      if (positions) {
        if (a.sortY !== b.sortY) return a.sortY - b.sortY;
      }
      return a.sortName.localeCompare(b.sortName) || a.idx - b.idx;
    });
    const fans = hubFanOffsetsForCount(spokes.length);
    spokes.forEach((sp, i) => {
      out[sp.idx] = fans[i] ?? 0;
      claimed.add(sp.idx);
    });
  }
  return out;
}

export function associationsToEdges(
  associations: RelationAssociation[],
  hint?: EdgeLayoutHint,
): Edge[] {
  const valid = validAssociations(associations);

  const pairCounts = new Map<string, number>();
  for (const a of valid) {
    const k = pairKey(a.from!.entity!, a.to!.entity!);
    pairCounts.set(k, (pairCounts.get(k) || 0) + 1);
  }

  const hubFans = hubFanOffsetsForAssociations(valid, hint?.positions);

  const pairIndex = new Map<string, number>();
  return valid.map((a, i) => {
    const source = a.from!.entity!;
    const target = a.to!.entity!;
    const k = pairKey(source, target);
    const idx = pairIndex.get(k) || 0;
    pairIndex.set(k, idx + 1);
    const lanes = laneOffsetsForPairCount(pairCounts.get(k) || 1);
    const pairLane = lanes[idx] ?? 0;
    const hubFanOffset = hubFans[i] ?? 0;
    const laneOffset = pairLane + hubFanOffset;
    const stepOffset = stepOffsetForLane(laneOffset, idx);
    const data: ErdEdgeData = { laneOffset, stepOffset, hubFanOffset };

    return {
      id: `e-${source}-${a.from!.field}-${target}-${a.to!.field}-${i}`,
      source,
      sourceHandle: `${a.from!.field}-src`,
      target,
      targetHandle: `${a.to!.field}-tgt`,
      type: ERD_EDGE_TYPE,
      label: a.relation || '',
      data,
      labelStyle: {
        fontSize: 10,
        fill: erdColors.ink400,
        fontFamily: 'var(--erd-font-mono)',
      },
      labelBgStyle: { fill: erdColors.surfaceSunk, fillOpacity: 0.94 },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 3,
      style: { stroke: erdColors.ink600, strokeWidth: 1.5 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: erdColors.ink600,
      },
      animated: false,
      interactionWidth: EDGE_INTERACTION_WIDTH,
    };
  });
}
