import React, {useMemo} from 'react';
import ReactFlow, {
  Background,
  MiniMap,
  Handle,
  Position,
  NodeProps,
  Edge,
  Node,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import {erdColors} from '@/theme/tokens';
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
};

const NODE_W = 220;
const NODE_H_BASE = 48;
const ROW_H = 22;

function associationsToEdges(associations: Association[]): Edge[] {
  return (associations || [])
    .filter(a => a?.from?.entity && a?.from?.field && a?.to?.entity && a?.to?.field)
    .map((a, i) => ({
      id: `e-${a.from!.entity}-${a.from!.field}-${a.to!.entity}-${a.to!.field}-${i}`,
      source: a.from!.entity!,
      sourceHandle: `${a.from!.field}-src`,
      target: a.to!.entity!,
      targetHandle: `${a.to!.field}-tgt`,
      label: a.relation || '',
      labelStyle: {fontSize: 10, fill: erdColors.ink400},
      style: {stroke: erdColors.ink600, strokeWidth: 1.5},
      animated: false,
    }));
}

const ReadOnlyTableNode: React.FC<NodeProps<{ entity: EntityData }>> = React.memo(({data, selected}) => {
  const entity = data.entity;
  const fields = entity.fields || [];
  return (
    <div className={`erd-table-node${selected ? ' selected' : ''}`}>
      <div className="erd-table-header">
        <span className="erd-table-title">{entity.title}</span>
        {entity.chnname ? <span className="erd-table-chnname">{entity.chnname}</span> : null}
      </div>
      <div className="erd-table-fields">
        {fields.map((f) => (
          <div key={f.name} className="erd-field-row">
            <Handle type="target" id={`${f.name}-tgt`} position={Position.Left} className="erd-field-handle"/>
            <span className="erd-field-name">
              <span className={`erd-pk-badge${f.pk ? ' active' : ' inactive'}`}>{f.pk ? 'PK' : ''}</span>
              {f.name}
            </span>
            <span className="erd-field-type">{f.type}</span>
            <Handle type="source" id={`${f.name}-src`} position={Position.Right} className="erd-field-handle"/>
          </div>
        ))}
      </div>
    </div>
  );
});

const nodeTypes = {table: ReadOnlyTableNode};

function layoutNodes(entities: EntityData[], layout: { id: string; x?: number; y?: number }[]): Node[] {
  const pos = new Map(layout.map(n => [n.id, n]));
  const needDagre = entities.some(e => {
    const p = pos.get(e.title);
    return p?.x == null || p?.y == null;
  });
  if (needDagre && entities.length > 0) {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({rankdir: 'LR', nodesep: 40, ranksep: 80});
    entities.forEach(e => {
      const h = NODE_H_BASE + (e.fields?.length || 0) * ROW_H;
      g.setNode(e.title, {width: NODE_W, height: h});
    });
    dagre.layout(g);
    return entities.map(e => {
      const n = g.node(e.title);
      const saved = pos.get(e.title);
      const h = NODE_H_BASE + (e.fields?.length || 0) * ROW_H;
      return {
        id: e.title,
        type: 'table',
        position: {
          x: saved?.x ?? (n.x - NODE_W / 2),
          y: saved?.y ?? (n.y - h / 2),
        },
        data: {entity: e},
        draggable: false,
        connectable: false,
      };
    });
  }
  return entities.map((e, i) => {
    const saved = pos.get(e.title);
    return {
      id: e.title,
      type: 'table',
      position: {x: saved?.x ?? (i % 3) * 260, y: saved?.y ?? Math.floor(i / 3) * 220},
      data: {entity: e},
      draggable: false,
      connectable: false,
    };
  });
}

export type ShareRelationCanvasProps = {
  module: ModuleData;
};

const ShareRelationCanvas: React.FC<ShareRelationCanvasProps> = ({module}) => {
  const {nodes, edges} = useMemo(() => {
    const entities = module.entities || [];
    const layout = module.graphCanvas?.nodes || [];
    return {
      nodes: layoutNodes(entities, layout),
      edges: associationsToEdges(module.associations || []),
    };
  }, [module]);

  if (!nodes.length) {
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
