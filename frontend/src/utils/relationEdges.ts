/**
 * 关系图边（ADR-0016）：设计器 + 分享只读画布共用。
 * 同表对多 FK 用 lane → 不同 smoothstep offset，肘部分流，减少叠线。
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

export type RelationAssociation = {
  relation?: string;
  from?: { entity?: string; field?: string };
  to?: { entity?: string; field?: string };
};

export type ErdEdgeData = {
  /** 居中 lane：…,-14,0,14,…；驱动肘距与轻微垂直分流 */
  laneOffset: number;
  /** 传给 getSmoothStepPath 的 offset */
  stepOffset: number;
};

function pairKey(a: string, b: string): string {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

/** 同无向表对 → 居中 laneOffset 列表（供单测） */
export function laneOffsetsForPairCount(n: number): number[] {
  if (n <= 1) return n === 1 ? [0] : [];
  return Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * EDGE_LANE_STEP);
}

export function stepOffsetForLane(_laneOffset: number, laneIndex = 0): number {
  // index 拉开肘距（±lane 绝对值相同不会撞车）；laneOffset 留给路径 Y 分流
  return EDGE_STEP_OFFSET + laneIndex * EDGE_LANE_STEP;
}

export function associationsToEdges(associations: RelationAssociation[]): Edge[] {
  const valid = (associations || []).filter(
    (a) => a?.from?.entity && a?.from?.field && a?.to?.entity && a?.to?.field,
  );

  const pairCounts = new Map<string, number>();
  for (const a of valid) {
    const k = pairKey(a.from!.entity!, a.to!.entity!);
    pairCounts.set(k, (pairCounts.get(k) || 0) + 1);
  }

  const pairIndex = new Map<string, number>();
  return valid.map((a, i) => {
    const source = a.from!.entity!;
    const target = a.to!.entity!;
    const k = pairKey(source, target);
    const idx = pairIndex.get(k) || 0;
    pairIndex.set(k, idx + 1);
    const lanes = laneOffsetsForPairCount(pairCounts.get(k) || 1);
    const laneOffset = lanes[idx] ?? 0;
    const stepOffset = stepOffsetForLane(laneOffset, idx);
    const data: ErdEdgeData = { laneOffset, stepOffset };

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
