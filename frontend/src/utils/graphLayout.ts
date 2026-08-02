/**
 * 关系图自动布局（ADR-0016）
 * 逆向 / DBML 导入 / 无坐标画布兜底共用 dagre LR，按关联分层，避免网格散点。
 */
import dagre from 'dagre';

export type LayoutEntity = {
  title: string;
  fields?: Array<{ name?: string; relationNoShow?: boolean }>;
};

export type LayoutAssociation = {
  from?: { entity?: string };
  to?: { entity?: string };
};

export type LayoutPoint = { x: number; y: number };

export const NODE_WIDTH = 240;

/** 默认走廊：够边肘分流，又不过稀（ADR-0016 分享密度） */
export const DAGRE_NODESEP = 56;
export const DAGRE_RANKSEP = 108;
export const DAGRE_MARGIN = 24;

export function estimateNodeHeight(entity?: LayoutEntity): number {
  const fields = (entity?.fields || []).filter((f) => !f.relationNoShow);
  return 52 + Math.max(fields.length, 1) * 28 + 36;
}

/** 节点包围盒宽高（用于密度断言 / Frame 烘焙） */
export function layoutBoundingSize(
  positions: Record<string, LayoutPoint>,
  entities: LayoutEntity[],
): { width: number; height: number } {
  if (entities.length === 0) return { width: 0, height: 0 };
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  entities.forEach((e) => {
    const p = positions[e.title];
    if (!p) return;
    const h = estimateNodeHeight(e);
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x + NODE_WIDTH);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y + h);
  });
  return {
    width: Math.round(maxX - minX),
    height: Math.round(maxY - minY),
  };
}

/** dagre 分层布局（默认 LR），返回表 title → 左上角坐标 */
export function dagrePositions(
  entities: LayoutEntity[],
  associations: LayoutAssociation[] = [],
  opts?: { rankdir?: 'LR' | 'TB'; nodesep?: number; ranksep?: number },
): Record<string, LayoutPoint> {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: opts?.rankdir ?? 'LR',
    nodesep: opts?.nodesep ?? DAGRE_NODESEP,
    ranksep: opts?.ranksep ?? DAGRE_RANKSEP,
    marginx: DAGRE_MARGIN,
    marginy: DAGRE_MARGIN,
  });
  g.setDefaultEdgeLabel(() => ({}));
  const ids = new Set(entities.map((e) => e.title));
  entities.forEach((e) => {
    g.setNode(e.title, { width: NODE_WIDTH, height: estimateNodeHeight(e) });
  });
  associations.forEach((a) => {
    const s = a.from?.entity;
    const t = a.to?.entity;
    if (s && t && ids.has(s) && ids.has(t) && s !== t) {
      g.setEdge(s, t);
    }
  });
  dagre.layout(g);
  const positions: Record<string, LayoutPoint> = {};
  entities.forEach((e) => {
    const d = g.node(e.title);
    const h = estimateNodeHeight(e);
    positions[e.title] = {
      x: Math.round(d.x - NODE_WIDTH / 2),
      y: Math.round(d.y - h / 2),
    };
  });
  return positions;
}

/** 写入 graphCanvas.nodes 的形状 */
export function graphCanvasNodesFromDagre(
  entities: LayoutEntity[],
  associations: LayoutAssociation[] = [],
): Array<{ id: string; x: number; y: number }> {
  const pos = dagrePositions(entities, associations);
  return entities.map((e) => ({
    id: e.title,
    x: pos[e.title].x,
    y: pos[e.title].y,
  }));
}

type SavedLayoutNode = { id?: string; title?: string; x?: number; y?: number };

function savedId(n: SavedLayoutNode): string {
  if (n.id) return n.id;
  return (n.title || '').split(':')[0];
}

/**
 * 保留已有坐标；缺坐标的表用「全图 dagre」坐标补齐。
 * didAutoLayout=true 时应持久化 graphCanvas。
 */
export function resolveEntityPositions(
  entities: LayoutEntity[],
  associations: LayoutAssociation[],
  saved: SavedLayoutNode[] = [],
): { positions: Record<string, LayoutPoint>; didAutoLayout: boolean } {
  const savedMap = new Map<string, LayoutPoint>();
  saved.forEach((n) => {
    const id = savedId(n);
    if (id && typeof n.x === 'number' && typeof n.y === 'number') {
      savedMap.set(id, { x: n.x, y: n.y });
    }
  });

  if (entities.length === 0) {
    return { positions: {}, didAutoLayout: false };
  }

  const missing = entities.filter((e) => !savedMap.has(e.title));
  if (missing.length === 0) {
    const positions: Record<string, LayoutPoint> = {};
    entities.forEach((e) => {
      positions[e.title] = savedMap.get(e.title)!;
    });
    return { positions, didAutoLayout: false };
  }

  const dagrePos = dagrePositions(entities, associations);
  const positions: Record<string, LayoutPoint> = {};
  entities.forEach((e) => {
    positions[e.title] = savedMap.get(e.title) ?? dagrePos[e.title];
  });
  return { positions, didAutoLayout: true };
}
