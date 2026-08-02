/**
 * 多关系图（ADR-0017 Phase 2）：同一 schema 的多个视图布局。
 * 实体/关联仍唯一存于 module.entities / associations；图只存布局。
 * 读写收敛于本文件 selector，禁止旁路双写 graphCanvas。
 */

export type DiagramLayoutNode = {
  id: string;
  x: number;
  y: number;
  title?: string;
};

/** Phase 2b：图内视觉框；成员显式列表，不做 RF 坐标重父化 */
export type DiagramFrame = {
  id: string;
  name: string;
  color?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  memberEntityIds: string[];
};

export type Diagram = {
  id: string;
  name: string;
  includeEntities?: string[];
  layout: { nodes: DiagramLayoutNode[] };
  groups?: DiagramFrame[];
};

export const DEFAULT_DIAGRAM_ID = 'main';
export const DEFAULT_DIAGRAM_NAME = '主关系图';

/** RF 节点 id 前缀，避免与实体 title 碰撞 */
export const FRAME_NODE_PREFIX = 'erd-frame-';
export const DEFAULT_FRAME_W = 320;
export const DEFAULT_FRAME_H = 200;
export const FRAME_PADDING = 40;
/** 成功色浅底（与 erdColors.success 同语系） */
export const DEFAULT_FRAME_COLOR = 'rgba(47, 143, 123, 0.10)';

type GraphCanvasNode = { id?: string; title?: string; x?: number; y?: number };

export function frameNodeId(frameId: string): string {
  return `${FRAME_NODE_PREFIX}${frameId}`;
}

export function isFrameNodeId(nodeId: string): boolean {
  return nodeId.startsWith(FRAME_NODE_PREFIX);
}

export function parseFrameIdFromNodeId(nodeId: string): string {
  return isFrameNodeId(nodeId) ? nodeId.slice(FRAME_NODE_PREFIX.length) : nodeId;
}

export function newFrameId(): string {
  return `f_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 按成员节点包围盒算框（绝对坐标；不改成员 position） */
export function computeFrameBoundsFromNodes(
  nodes: Array<{ position: { x: number; y: number }; width?: number; height?: number }>,
  padding = FRAME_PADDING,
): { x: number; y: number; w: number; h: number } {
  if (!nodes.length) {
    return { x: 40, y: 40, w: DEFAULT_FRAME_W, h: DEFAULT_FRAME_H };
  }
  const wOf = (n: { width?: number }) => n.width || 220;
  const hOf = (n: { height?: number }) => n.height || 80;
  const minX = Math.min(...nodes.map((n) => n.position.x));
  const minY = Math.min(...nodes.map((n) => n.position.y));
  const maxR = Math.max(...nodes.map((n) => n.position.x + wOf(n)));
  const maxB = Math.max(...nodes.map((n) => n.position.y + hOf(n)));
  return {
    x: Math.round(minX - padding),
    y: Math.round(minY - padding),
    w: Math.round(maxR - minX + padding * 2),
    h: Math.round(maxB - minY + padding * 2),
  };
}

function nodeId(n: GraphCanvasNode): string {
  if (n.id) return n.id;
  return (n.title || '').split(':')[0];
}

function layoutNodesFromGraphCanvas(graphCanvas?: {
  nodes?: GraphCanvasNode[];
}): DiagramLayoutNode[] {
  return (graphCanvas?.nodes || [])
    .map((n) => {
      const id = nodeId(n);
      if (!id || typeof n.x !== 'number' || typeof n.y !== 'number') {
        return null;
      }
      return { id, title: id, x: n.x, y: n.y };
    })
    .filter(Boolean) as DiagramLayoutNode[];
}

/** 从旧 graphCanvas 构造主图（纯函数，不 mutate） */
export function diagramFromGraphCanvas(graphCanvas?: {
  nodes?: GraphCanvasNode[];
}): Diagram {
  return {
    id: DEFAULT_DIAGRAM_ID,
    name: DEFAULT_DIAGRAM_NAME,
    layout: { nodes: layoutNodesFromGraphCanvas(graphCanvas) },
  };
}

/**
 * 确保 module.diagrams 已物化（懒迁移 graphCanvas → diagrams[0]）。
 * 仅在 immer set() 内调用。
 */
export function ensureDiagrams(module: {
  diagrams?: Diagram[];
  graphCanvas?: { nodes?: GraphCanvasNode[] };
}): Diagram[] {
  if (Array.isArray(module.diagrams) && module.diagrams.length > 0) {
    return module.diagrams;
  }
  module.diagrams = [diagramFromGraphCanvas(module.graphCanvas)];
  return module.diagrams;
}

/**
 * 单一读路径：返回当前激活图。
 * 无 diagrams 时虚拟迁移（不 mutate）；写路径必须先 ensureDiagrams。
 */
export function getActiveDiagram(
  module: { diagrams?: Diagram[]; graphCanvas?: { nodes?: GraphCanvasNode[] } } | null | undefined,
  diagramId?: string | null,
): Diagram {
  if (!module) {
    return diagramFromGraphCanvas();
  }
  const diagrams =
    Array.isArray(module.diagrams) && module.diagrams.length > 0
      ? module.diagrams
      : [diagramFromGraphCanvas(module.graphCanvas)];
  if (diagramId) {
    const found = diagrams.find((d) => d.id === diagramId);
    if (found) return found;
  }
  return diagrams[0];
}

/** 当前图的布局节点（供 resolveEntityPositions） */
export function getActiveDiagramLayoutNodes(
  module: { diagrams?: Diagram[]; graphCanvas?: { nodes?: GraphCanvasNode[] } } | null | undefined,
  diagramId?: string | null,
): DiagramLayoutNode[] {
  return getActiveDiagram(module, diagramId).layout?.nodes || [];
}

/** 列表（树/切换器用）；无 diagrams 时返回虚拟主图，不 mutate */
export function listDiagrams(module: {
  diagrams?: Diagram[];
  graphCanvas?: { nodes?: GraphCanvasNode[] };
} | null | undefined): Diagram[] {
  if (!module) return [diagramFromGraphCanvas()];
  if (Array.isArray(module.diagrams) && module.diagrams.length > 0) {
    return module.diagrams;
  }
  return [diagramFromGraphCanvas(module.graphCanvas)];
}

/** tab.entity：`关系图-${module}` 或 `关系图-${module}-${diagramId}` */
export function relationTabEntity(moduleName: string, diagramId?: string | null): string {
  if (!diagramId || diagramId === DEFAULT_DIAGRAM_ID) {
    return `关系图-${moduleName}`;
  }
  return `关系图-${moduleName}-${diagramId}`;
}

/** 从 tab.entity 解析 diagramId；缺省 → main */
export function parseDiagramIdFromTabEntity(
  moduleName: string | undefined,
  entity: string | undefined,
): string {
  if (!moduleName || !entity || !entity.startsWith('关系图')) {
    return DEFAULT_DIAGRAM_ID;
  }
  const prefix = `关系图-${moduleName}`;
  if (entity === prefix) {
    return DEFAULT_DIAGRAM_ID;
  }
  if (entity.startsWith(`${prefix}-`)) {
    const id = entity.slice(prefix.length + 1);
    return id || DEFAULT_DIAGRAM_ID;
  }
  return DEFAULT_DIAGRAM_ID;
}

export function newDiagramId(): string {
  return `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** upsert 布局节点到指定图（写路径；调用方已 ensureDiagrams） */
export function upsertDiagramLayout(
  diagram: Diagram,
  layoutNodes: Array<{ id: string; position: { x: number; y: number } }>,
): void {
  if (!diagram.layout) {
    diagram.layout = { nodes: [] };
  }
  const layout = diagram.layout.nodes || [];
  layoutNodes.forEach((n) => {
    const idx = layout.findIndex(
      (s) => (s.title || '').split(':')[0] === n.id || s.id === n.id,
    );
    const entry: DiagramLayoutNode = {
      id: n.id,
      title: n.id,
      x: Math.round(n.position.x),
      y: Math.round(n.position.y),
    };
    if (idx >= 0) {
      layout[idx] = { ...layout[idx], ...entry };
    } else {
      layout.push(entry);
    }
  });
  diagram.layout.nodes = layout;
}

export function getActiveDiagramFrames(
  module: { diagrams?: Diagram[]; graphCanvas?: { nodes?: GraphCanvasNode[] } } | null | undefined,
  diagramId?: string | null,
): DiagramFrame[] {
  return getActiveDiagram(module, diagramId).groups || [];
}

/** 在图上追加 Frame（写路径；调用方已 ensureDiagrams） */
export function addFrameToDiagram(
  diagram: Diagram,
  opts: {
    name?: string;
    memberEntityIds?: string[];
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    color?: string;
    id?: string;
  } = {},
): DiagramFrame {
  if (!diagram.groups) {
    diagram.groups = [];
  }
  const n = diagram.groups.length + 1;
  const frame: DiagramFrame = {
    id: opts.id || newFrameId(),
    name: (opts.name || '').trim() || `分组${n}`,
    color: opts.color || DEFAULT_FRAME_COLOR,
    x: typeof opts.x === 'number' ? Math.round(opts.x) : 40,
    y: typeof opts.y === 'number' ? Math.round(opts.y) : 40,
    w: typeof opts.w === 'number' ? Math.round(opts.w) : DEFAULT_FRAME_W,
    h: typeof opts.h === 'number' ? Math.round(opts.h) : DEFAULT_FRAME_H,
    memberEntityIds: [...new Set(opts.memberEntityIds || [])],
  };
  diagram.groups.push(frame);
  return frame;
}

/** 合并成员（去重）；框不存在则 no-op */
export function addMembersToFrame(
  diagram: Diagram,
  frameId: string,
  memberEntityIds: string[],
): DiagramFrame | undefined {
  const frame = (diagram.groups || []).find((g) => g.id === frameId);
  if (!frame) return undefined;
  const set = new Set(frame.memberEntityIds || []);
  memberEntityIds.forEach((id) => {
    if (id) set.add(id);
  });
  frame.memberEntityIds = [...set];
  return frame;
}

export function updateFrameBounds(
  diagram: Diagram,
  frameId: string,
  bounds: { x: number; y: number; w?: number; h?: number },
): void {
  const frame = (diagram.groups || []).find((g) => g.id === frameId);
  if (!frame) return;
  frame.x = Math.round(bounds.x);
  frame.y = Math.round(bounds.y);
  if (typeof bounds.w === 'number' && bounds.w > 0) frame.w = Math.round(bounds.w);
  if (typeof bounds.h === 'number' && bounds.h > 0) frame.h = Math.round(bounds.h);
}

export function removeFrameFromDiagram(diagram: Diagram, frameId: string): void {
  if (!diagram.groups) return;
  diagram.groups = diagram.groups.filter((g) => g.id !== frameId);
}

/** 实体改名时同步 groups.memberEntityIds */
export function renameFrameMemberIds(diagram: Diagram, oldTitle: string, newTitle: string): void {
  if (!diagram.groups?.length) return;
  diagram.groups.forEach((g) => {
    g.memberEntityIds = (g.memberEntityIds || []).map((id) =>
      id === oldTitle ? newTitle : id,
    );
  });
}

/** 实体删除时从成员列表剔除 */
export function purgeFrameMemberId(diagram: Diagram, entityTitle: string): void {
  if (!diagram.groups?.length) return;
  diagram.groups.forEach((g) => {
    g.memberEntityIds = (g.memberEntityIds || []).filter((id) => id !== entityTitle);
  });
}
