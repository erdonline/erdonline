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

/** Phase 2b：图内视觉框；Phase 2a 仅占位类型 */
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

type GraphCanvasNode = { id?: string; title?: string; x?: number; y?: number };

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
