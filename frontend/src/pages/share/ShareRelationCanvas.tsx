import React, {useMemo} from 'react';
import ReactFlow, {
  Background,
  MiniMap,
  Handle,
  Position,
  NodeProps,
  Edge,
  Node,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {erdColors} from '@/theme/tokens';
import {
  DiagramFrame,
  frameNodeId,
  getActiveDiagramFrames,
  getActiveDiagramLayoutNodes,
} from '@/utils/diagram';
import {resolveEntityPositions} from '@/utils/graphLayout';
import ZhControls from '../design/relation/ZhControls';
import '../design/relation/reactflow-relation.scss';

type FieldData = { name: string; type?: string; pk?: boolean; chnname?: string };
type EntityData = { title: string; chnname?: string; fields?: FieldData[] };
type Association = {
  relation?: string;
  from?: { entity?: string; field?: string };
  to?: { entity?: string; field?: string };
};
type ModuleData = {
  name?: string;
  entities?: EntityData[];
  associations?: Association[];
  graphCanvas?: { nodes?: { id: string; x?: number; y?: number }[] };
  diagrams?: Array<{
    id: string;
    name: string;
    layout?: { nodes?: { id: string; x?: number; y?: number }[] };
    groups?: DiagramFrame[];
  }>;
};

function fkFieldsByEntity(associations: Association[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const a of associations || []) {
    const entity = a?.from?.entity;
    const field = a?.from?.field;
    if (!entity || !field) continue;
    const list = map.get(entity) || [];
    if (!list.includes(field)) list.push(field);
    map.set(entity, list);
  }
  return map;
}

function associationsToEdges(associations: Association[]): Edge[] {
  return (associations || [])
    .filter(a => a?.from?.entity && a?.from?.field && a?.to?.entity && a?.to?.field)
    .map((a, i) => ({
      id: `e-${a.from!.entity}-${a.from!.field}-${a.to!.entity}-${a.to!.field}-${i}`,
      source: a.from!.entity!,
      sourceHandle: `${a.from!.field}-src`,
      target: a.to!.entity!,
      targetHandle: `${a.to!.field}-tgt`,
      type: 'smoothstep',
      label: a.relation || '',
      labelStyle: {fontSize: 10, fill: erdColors.ink400},
      labelBgStyle: {fill: erdColors.surfaceSunk, fillOpacity: 0.94},
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 3,
      style: {stroke: erdColors.ink600, strokeWidth: 1.5},
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: erdColors.ink600,
      },
      animated: false,
    }));
}

const ReadOnlyTableNode: React.FC<NodeProps<{ entity: EntityData; fkFields?: string[] }>> = React.memo(
  ({data, selected}) => {
    const entity = data.entity;
    const fields = entity.fields || [];
    const fkSet = useMemo(() => new Set(data.fkFields || []), [data.fkFields]);
    return (
      <div className={`erd-table-node${selected ? ' selected' : ''}`}>
        <div className="erd-table-header">
          <span className="erd-table-title">{entity.title}</span>
          {entity.chnname ? <span className="erd-table-chnname">{entity.chnname}</span> : null}
        </div>
        <div className="erd-table-fields">
          {fields.map((f) => (
            <div
              key={f.name}
              className={[
                'erd-field-row',
                f.pk ? 'erd-field-pk' : '',
                fkSet.has(f.name) ? 'erd-field-fk' : '',
              ].filter(Boolean).join(' ')}
            >
              <Handle type="target" id={`${f.name}-tgt`} position={Position.Left} className="erd-field-handle"/>
              <span className="erd-field-name">
                {f.pk ? <span className="erd-pk-badge active">PK</span> : null}
                {fkSet.has(f.name) ? (
                  <span className="erd-fk-badge" title="外键" aria-label="外键">FK</span>
                ) : null}
                {f.name}
              </span>
              <span className="erd-field-type">{f.type}</span>
              <Handle type="source" id={`${f.name}-src`} position={Position.Right} className="erd-field-handle"/>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

const ReadOnlyFrameNode: React.FC<NodeProps<{ frame: DiagramFrame }>> = React.memo(({data}) => {
  const f = data.frame;
  return (
    <div
      className="erd-frame-node"
      data-testid="diagram-frame"
      data-frame-id={f.id}
      style={{
        width: '100%',
        height: '100%',
        background: f.color || 'rgba(47, 143, 123, 0.10)',
      }}
      aria-label={`分组 ${f.name}`}
    >
      <div className="erd-frame-chrome">
        <div className="erd-frame-label">{f.name}</div>
        {(f.memberEntityIds?.length || 0) > 0 ? (
          <div className="erd-frame-meta">{f.memberEntityIds.length} 张表</div>
        ) : null}
      </div>
    </div>
  );
});

const nodeTypes = {table: ReadOnlyTableNode, frame: ReadOnlyFrameNode};

function layoutNodes(
  entities: EntityData[],
  associations: Association[],
  layout: { id: string; x?: number; y?: number }[],
  frames: DiagramFrame[] = [],
): Node[] {
  const {positions} = resolveEntityPositions(entities, associations, layout);
  const fkMap = fkFieldsByEntity(associations);
  const frameNodes: Node[] = frames.map((f) => ({
    id: frameNodeId(f.id),
    type: 'frame',
    zIndex: 0,
    position: {x: f.x, y: f.y},
    style: {width: f.w, height: f.h, zIndex: 0},
    data: {frame: f},
    draggable: false,
    selectable: false,
    connectable: false,
  }));
  const tableNodes: Node[] = entities.map((e) => ({
    id: e.title,
    type: 'table',
    zIndex: 2,
    position: positions[e.title] || {x: 0, y: 0},
    data: {entity: e, fkFields: fkMap.get(e.title) || []},
    draggable: false,
    connectable: false,
  }));
  return [...frameNodes, ...tableNodes];
}

export type ShareRelationCanvasProps = {
  module: ModuleData;
};

const ShareRelationCanvas: React.FC<ShareRelationCanvasProps> = ({module}) => {
  const {nodes, edges} = useMemo(() => {
    const entities = module.entities || [];
    const associations = module.associations || [];
    const layout = getActiveDiagramLayoutNodes(module);
    const frames = getActiveDiagramFrames(module);
    return {
      nodes: layoutNodes(entities, associations, layout, frames),
      edges: associationsToEdges(associations),
    };
  }, [module]);

  const tableCount = nodes.filter((n) => n.type === 'table').length;
  if (!tableCount) {
    return (
      <div style={{padding: 24, color: 'var(--erd-ink-400)', fontFamily: 'var(--erd-font-ui)'}}>
        该模块暂无表
      </div>
    );
  }

  return (
    <div
      className="erd-reactflow-container"
      style={{height: 480}}
      data-testid="share-relation-canvas"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        panOnDrag
        zoomOnScroll
        proOptions={{hideAttribution: true}}
      >
        <Background gap={20} size={1} color={erdColors.line}/>
        <ZhControls showInteractive={false}/>
        <MiniMap pannable zoomable ariaLabel="画布缩略图"/>
      </ReactFlow>
    </div>
  );
};

export default ShareRelationCanvas;
