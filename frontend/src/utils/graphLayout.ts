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

export function estimateNodeHeight(entity?: LayoutEntity): number {
  const fields = (entity?.fields || []).filter((f) => !f.relationNoShow);
  return 52 + Math.max(fields.length, 1) * 28 + 36;
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
    // 略增走廊：边更不易贴穿邻表（ADR-0016 边路由）
    nodesep: opts?.nodesep ?? 80,
    ranksep: opts?.ranksep ?? 160,
    marginx: 40,
    marginy: 40,
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
