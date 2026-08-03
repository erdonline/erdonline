/**
 * 关系图边（ADR-0016）：设计器 + 分享只读画布共用。
 * 同表对多 FK 用 lane → 不同 smoothstep offset，肘部分流，减少叠线；
 * 高度数 hub 按对端 Y（或名）扇出，密 FK 星型不再贴成一捆；
 * 几何择柄：竖叠同列走同侧短 U，避免固定右→左绕圈（circle-route P0）。
 */
import { Edge } from 'reactflow';
import { erdColors } from '@/theme/tokens';
import { NODE_WIDTH } from '@/utils/graphLayout';

export const ERD_EDGE_TYPE = 'erdSmooth';

/** 边命中热区宽度（px）；视觉描边见 EDGE_STROKE_* */
export const EDGE_INTERACTION_WIDTH = 24;

/** 默认关系线描边（分享截图可读；勿再细于 2） */
export const EDGE_STROKE_WIDTH = 2;
/** 选中 / hover 略粗，保持层级且不胀到撞 chip */
export const EDGE_STROKE_WIDTH_SELECTED = 2.5;
/** 默认描边色：ink900 相对 sunk 画布对比度高于 ink600 */
export const EDGE_STROKE = erdColors.ink900;

/** smoothstep 圆角 / 默认肘距 */
export const EDGE_BORDER_RADIUS = 10;
export const EDGE_STEP_OFFSET = 28;

/** 同 pair 多边：每条额外肘距（px） */
export const EDGE_LANE_STEP = 14;

/** 度数 ≥ 此值视为 hub，对端边扇出 */
export const EDGE_HUB_FAN_MIN = 3;
/** hub 扇出步长（px），并入 laneOffset 做 Y 分流 */
export const EDGE_HUB_FAN_STEP = 10;

/**
 * 中心 X 差 ≤ 此值（相对 NODE_WIDTH）→ 视为同列竖叠，走同侧短 U。
 * 0.55≈半表宽，容忍手排/dagre 轻微错位。
 */
export const PORT_VERTICAL_STACK_DX = NODE_WIDTH * 0.55;
/** 竖向至少拉开这么多才触发同侧（避免近邻对角误判） */
export const PORT_VERTICAL_STACK_DY = 48;

/** 边标签 chip（基数 1:n 等）：截图扫读；禁整块 opacity 冲淡文字 */
export const EDGE_LABEL_FONT_SIZE = 12;
/** [水平, 垂直] padding px；密 FK 图再压一档，勿胀成大块 */
export const EDGE_LABEL_BG_PADDING: [number, number] = [4, 2];
export const EDGE_LABEL_BG_RADIUS = 3;

/**
 * 基数 chip 近似外接盒（font 12/600 + pad[4,2] + 1px border；"n:1" 量级）。
 * 干道 bundling 步长（12）远小于 chip 宽 → 须拉伸/避让，否则密图标签叠成一团。
 */
export const EDGE_LABEL_CHIP_W = 40;
export const EDGE_LABEL_CHIP_H = 20;
/** chip AABB 之间最小间隙 */
export const EDGE_LABEL_COLLISION_GAP = 4;

export type EdgeLabelAnchor = { id: string; x: number; y: number };
export type EdgeLabelNudge = { dx: number; dy: number };

/**
 * 把 path 级 trunkBundleOffset 拉伸到 chip 安全间距（标签可略离路径，保可读）。
 * `bundleStep` 与 `EDGE_BUNDLE_STEP` 对齐，由调用方传入以免循环依赖。
 */
export function edgeLabelBundleStretch(
  trunkBundleOffset: number,
  bundleStep: number,
  chipW = EDGE_LABEL_CHIP_W,
  gap = EDGE_LABEL_COLLISION_GAP,
): number {
  if (!trunkBundleOffset || !bundleStep) return 0;
  const targetStep = chipW + gap;
  return (trunkBundleOffset / bundleStep) * targetStep;
}

/**
 * 同 pair / hub 扇出：path 仅 yShift=lane×0.4，chip 再加一截 Y，避免多 FK 标签贴死。
 */
export function edgeLabelLaneStretch(laneOffset: number): number {
  if (!laneOffset) return 0;
  return laneOffset * 0.55;
}

/**
 * 迭代 AABB 分离：重叠则沿穿透更浅的轴对推（稳定、按 id 破平）。
 * 返回相对输入锚点的 {dx,dy}；无重叠则为 0。
 */
export function resolveEdgeLabelOffsets(
  anchors: EdgeLabelAnchor[],
  opts?: {
    chipW?: number;
    chipH?: number;
    gap?: number;
    maxIter?: number;
  },
): Map<string, EdgeLabelNudge> {
  const chipW = opts?.chipW ?? EDGE_LABEL_CHIP_W;
  const chipH = opts?.chipH ?? EDGE_LABEL_CHIP_H;
  const gap = opts?.gap ?? EDGE_LABEL_COLLISION_GAP;
  const maxIter = opts?.maxIter ?? 24;
  const minDx = chipW + gap;
  const minDy = chipH + gap;
  const n = anchors.length;
  const out = new Map<string, EdgeLabelNudge>();
  if (n === 0) return out;

  const ids = anchors.map((a) => a.id);
  const xs = anchors.map((a) => a.x);
  const ys = anchors.map((a) => a.y);
  const order = Array.from({ length: n }, (_, i) => i).sort(
    (a, b) => ids[a].localeCompare(ids[b]) || a - b,
  );

  for (let iter = 0; iter < maxIter; iter++) {
    let moved = false;
    for (let ai = 0; ai < n; ai++) {
      for (let bi = ai + 1; bi < n; bi++) {
        const i = order[ai];
        const j = order[bi];
        const dx = xs[j] - xs[i];
        const dy = ys[j] - ys[i];
        const overlapX = minDx - Math.abs(dx);
        const overlapY = minDy - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;
        if (overlapX < overlapY) {
          const push = overlapX / 2;
          let sx = Math.sign(dx);
          if (sx === 0) sx = ids[i] < ids[j] ? -1 : 1;
          xs[i] -= sx * push;
          xs[j] += sx * push;
        } else {
          const push = overlapY / 2;
          let sy = Math.sign(dy);
          if (sy === 0) sy = ids[i] < ids[j] ? -1 : 1;
          ys[i] -= sy * push;
          ys[j] += sy * push;
        }
        moved = true;
      }
    }
    if (!moved) break;
  }

  for (let i = 0; i < n; i++) {
    out.set(ids[i], {
      dx: xs[i] - anchors[i].x,
      dy: ys[i] - anchors[i].y,
    });
  }
  return out;
}

/**
 * 行业 ER 基数字符串（from→to 方向；画布拖 FK→PK 默认 n:1）。
 * 兼容历史 `0,n:1` / `0,1:1`（可选性前缀）→ 归一到下列集合。
 */
export const CARDINALITY_OPTIONS = ['1:1', '1:n', 'n:1', 'n:n'] as const;
export type Cardinality = (typeof CARDINALITY_OPTIONS)[number];
/** 拖连线默认：多端（FK）→ 一端（PK） */
export const DEFAULT_RELATION: Cardinality = 'n:1';

/** 归一化 / 展示用；未知串原样返回（不丢用户数据） */
export function normalizeRelation(raw: string | undefined | null): string {
  if (raw == null) return '';
  const s = String(raw).trim().toLowerCase().replace(/\s+/g, '');
  if (!s) return '';
  if ((CARDINALITY_OPTIONS as readonly string[]).includes(s)) return s;
  // 0,n:1 / 0,1:n / 1,n:1 等可选性前缀
  const m = s.match(/^(?:0[,:]?)?(1|n)[:\-](1|n)$/);
  if (m) return `${m[1]}:${m[2]}` as Cardinality;
  if (s === 'n:m' || s === 'm:n' || s === '*:') return 'n:n';
  return String(raw).trim();
}

export function isCardinality(v: string): v is Cardinality {
  return (CARDINALITY_OPTIONS as readonly string[]).includes(v);
}

/** Crow's foot 端点：one=单竖线；many=鸦爪三叉 */
export type CrowFootEnd = 'one' | 'many';

/**
 * from→to 基数 → 两端 Crow's foot（IE 记法）。
 * 未知串回落 DEFAULT_RELATION（n:1 → 源 many / 靶 one）。
 */
export function crowFootEnds(
  relation: string | undefined | null,
): { source: CrowFootEnd; target: CrowFootEnd } {
  const n = normalizeRelation(relation);
  const card: Cardinality = isCardinality(n) ? n : DEFAULT_RELATION;
  const [from, to] = card.split(':') as [string, string];
  return {
    source: from === 'n' ? 'many' : 'one',
    target: to === 'n' ? 'many' : 'one',
  };
}

export type CrowFootMarkerRole = 'start' | 'end';
export type CrowFootMarkerTone = 'ink' | 'brand';

/** SVG marker id（与 ErdCrowFootMarkers defs 对齐） */
export function crowFootMarkerId(
  end: CrowFootEnd,
  role: CrowFootMarkerRole,
  tone: CrowFootMarkerTone = 'ink',
): string {
  return `erd-cf-${end}-${tone}-${role}`;
}

/** BaseEdge / path 用的 `url(#…)` */
export function crowFootMarkerUrl(
  end: CrowFootEnd,
  role: CrowFootMarkerRole,
  tone: CrowFootMarkerTone = 'ink',
): string {
  return `url(#${crowFootMarkerId(end, role, tone)})`;
}

/** 由基数串直接得到 markerStart / markerEnd */
export function crowFootMarkersForRelation(
  relation: string | undefined | null,
  tone: CrowFootMarkerTone = 'ink',
): { markerStart: string; markerEnd: string } {
  const ends = crowFootEnds(relation);
  return {
    markerStart: crowFootMarkerUrl(ends.source, 'start', tone),
    markerEnd: crowFootMarkerUrl(ends.target, 'end', tone),
  };
}

export type PortSide = 'l' | 'r';
/** lr=右→左；rl=左→右；same=同侧短 U（竖叠） */
export type PortMode = 'lr' | 'rl' | 'same';

export type PortChoice = {
  sourceSide: PortSide;
  targetSide: PortSide;
  mode: PortMode;
};

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
  /** 几何择柄模式（供 E2E / 探针） */
  portMode?: PortMode;
  /** 设计器可改基数；分享只读不传 */
  editable?: boolean;
  /** 选中本边或邻接表时进 Tab 序（密图未选中不出序） */
  tabbable?: boolean;
  /** 写回 associations 用（与 edge id 解耦） */
  assocFrom?: { entity: string; field: string };
  assocTo?: { entity: string; field: string };
  moduleName?: string;
};

export type EdgeLayoutHint = {
  /** 表中心或左上角均可；只比相对 Y / 几何择柄比相对 X */
  positions?: Record<string, { x: number; y: number }>;
  /** 择柄用表宽；默认 NODE_WIDTH */
  nodeWidth?: number;
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

/** 默认 LR（历史右源左靶） */
export const DEFAULT_PORT_CHOICE: PortChoice = {
  sourceSide: 'r',
  targetSide: 'l',
  mode: 'lr',
};

/**
 * 按两表左上角几何选手柄侧：水平对向优先；同列短竖叠走同侧，消 circle-route。
 */
export function pickPortSides(
  source: { x: number; y: number },
  target: { x: number; y: number },
  nodeWidth = NODE_WIDTH,
): PortChoice {
  const half = nodeWidth / 2;
  const dx = target.x + half - (source.x + half);
  const dy = Math.abs(target.y - source.y);
  const stackDx = Math.max(PORT_VERTICAL_STACK_DX, nodeWidth * 0.55);

  if (Math.abs(dx) <= stackDx && dy >= PORT_VERTICAL_STACK_DY) {
    // 略偏右 → 右侧短 U；否则左侧（与 LR 主图走廊错开）
    const side: PortSide = dx > 8 ? 'r' : 'l';
    return { sourceSide: side, targetSide: side, mode: 'same' };
  }
  if (dx >= 0) {
    return { sourceSide: 'r', targetSide: 'l', mode: 'lr' };
  }
  return { sourceSide: 'l', targetSide: 'r', mode: 'rl' };
}

export function sourceHandleId(field: string, side: PortSide): string {
  return `${field}-src-${side}`;
}

export function targetHandleId(field: string, side: PortSide): string {
  return `${field}-tgt-${side}`;
}

/**
 * 解析字段手柄 id（含几何择柄后缀；兼容旧 `-src`/`-tgt`）。
 */
export function parseFieldHandle(
  handleId: string,
): { field: string; role: 'src' | 'tgt'; side?: PortSide } | null {
  if (!handleId) return null;
  const m = handleId.match(/^(.*)-(src|tgt)-(l|r)$/);
  if (m) {
    return {
      field: m[1],
      role: m[2] as 'src' | 'tgt',
      side: m[3] as PortSide,
    };
  }
  const legacy = handleId.match(/^(.*)-(src|tgt)$/);
  if (legacy) {
    return { field: legacy[1], role: legacy[2] as 'src' | 'tgt' };
  }
  return null;
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

  const nodeWidth = hint?.nodeWidth ?? NODE_WIDTH;
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
    const sp = hint?.positions?.[source];
    const tp = hint?.positions?.[target];
    const ports =
      sp && tp ? pickPortSides(sp, tp, nodeWidth) : DEFAULT_PORT_CHOICE;
    const relationLabel = normalizeRelation(a.relation) || a.relation || '';
    const data: ErdEdgeData = {
      laneOffset,
      stepOffset,
      hubFanOffset,
      portMode: ports.mode,
      assocFrom: { entity: source, field: a.from!.field! },
      assocTo: { entity: target, field: a.to!.field! },
    };

    return {
      id: `e-${source}-${a.from!.field}-${target}-${a.to!.field}-${i}`,
      source,
      sourceHandle: sourceHandleId(a.from!.field!, ports.sourceSide),
      target,
      targetHandle: targetHandleId(a.to!.field!, ports.targetSide),
      type: ERD_EDGE_TYPE,
      label: relationLabel,
      data,
      labelStyle: {
        fontSize: EDGE_LABEL_FONT_SIZE,
        fill: erdColors.ink900,
        fontFamily: 'var(--erd-font-mono)',
      },
      // 底用 surface 白底（相对画布 sunk）；fillOpacity 仅语义保留，渲染不整块套 opacity
      labelBgStyle: { fill: erdColors.surface, fillOpacity: 1 },
      labelBgPadding: EDGE_LABEL_BG_PADDING,
      labelBgBorderRadius: EDGE_LABEL_BG_RADIUS,
      style: { stroke: EDGE_STROKE, strokeWidth: EDGE_STROKE_WIDTH },
      ...crowFootMarkersForRelation(relationLabel, 'ink'),
      animated: false,
      interactionWidth: EDGE_INTERACTION_WIDTH,
    };
  });
}
