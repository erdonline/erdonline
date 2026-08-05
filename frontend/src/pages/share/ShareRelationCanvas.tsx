import React, {useMemo} from 'react';
import ReactFlow, {
  Background,
  Handle,
  Position,
  NodeProps,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {useIntl} from '@umijs/max';
import {erdColors} from '@/theme/tokens';
import {
  demoEntityChnname,
  demoGroupName,
  isPublicDemoShare,
} from '@/utils/demoShareI18n';
import {
  DiagramFrame,
  frameNodeId,
  getActiveDiagramFrames,
  getActiveDiagramLayoutNodes,
} from '@/utils/diagram';
import {resolveEntityPositions} from '@/utils/graphLayout';
import {ERD_EDGE_TYPE, associationsToEdges} from '@/utils/relationEdges';
import {FIT_VIEW_SHAREABLE} from '@/utils/canvasFit';
import ErdCrowFootMarkers from '../design/relation/ErdCrowFootMarkers';
import ErdMiniMap from '../design/relation/ErdMiniMap';
import ErdRelationEdge from '../design/relation/ErdRelationEdge';
import ZhControls from '../design/relation/ZhControls';
import ShareEmptyState from './ShareEmptyState';
import '../design/relation/reactflow-relation.scss';

type FieldData = {
  name: string;
  type?: string;
  pk?: boolean;
  chnname?: string;
  relationNoShow?: boolean;
};
type EntityData = { title: string; chnname?: string; fields?: FieldData[] };
type Association = {
  relation?: string;
  from?: { entity?: string; field?: string };
  to?: { entity?: string; field?: string };
  constraintName?: string;
  deleteRule?: string;
  updateRule?: string;
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

type ReadOnlyTableNodeData = {
  entity: EntityData;
  fkFields?: string[];
  localizeEntity?: boolean;
};

const ReadOnlyTableNode: React.FC<NodeProps<ReadOnlyTableNodeData>> = React.memo(
  ({data, selected}) => {
    const intl = useIntl();
    const entity = data.entity;
    const pkLabel = intl.formatMessage({ id: 'share.badge.pk' });
    const fkLabel = intl.formatMessage({ id: 'share.badge.fk' });
    const displayChnname = data.localizeEntity
      ? demoEntityChnname(intl, entity.title, entity.chnname)
      : entity.chnname;
    // 与设计器对齐：隐藏 relationNoShow，截图更密（ADR-0016）
    const fields = (entity.fields || []).filter((f) => !f.relationNoShow);
    const fkSet = useMemo(() => new Set(data.fkFields || []), [data.fkFields]);
    return (
      <div className={`erd-table-node${selected ? ' selected' : ''}`}>
        <div className="erd-table-header">
          <span className="erd-table-title">{entity.title}</span>
          {displayChnname ? <span className="erd-table-chnname">{displayChnname}</span> : null}
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
              data-field={f.name}
            >
              <Handle type="source" id={`${f.name}-src-l`} position={Position.Left} className="erd-field-handle erd-handle-src"/>
              <Handle type="target" id={`${f.name}-tgt-l`} position={Position.Left} className="erd-field-handle erd-handle-tgt"/>
              <span className="erd-field-name">
                {f.pk ? (
                  <span className="erd-pk-badge active" title={pkLabel} aria-label={pkLabel}>{pkLabel}</span>
                ) : null}
                {fkSet.has(f.name) ? (
                  <span className="erd-fk-badge" title={fkLabel} aria-label={fkLabel}>{fkLabel}</span>
                ) : null}
                {f.name}
              </span>
              <span className="erd-field-type">{f.type}</span>
              <Handle type="target" id={`${f.name}-tgt-r`} position={Position.Right} className="erd-field-handle erd-handle-tgt"/>
              <Handle type="source" id={`${f.name}-src-r`} position={Position.Right} className="erd-field-handle erd-handle-src"/>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

type ReadOnlyFrameNodeData = {
  frame: DiagramFrame;
  localizeFrame?: boolean;
};

const ReadOnlyFrameNode: React.FC<NodeProps<ReadOnlyFrameNodeData>> = React.memo(({data}) => {
  const intl = useIntl();
  const f = data.frame;
  const frameName = data.localizeFrame ? demoGroupName(intl, f.id, f.name) : f.name;
  const memberCount = f.memberEntityIds?.length || 0;
  const frameGroupLabel = intl.formatMessage({ id: 'share.frame.groupAria' }, { name: frameName });
  return (
    <div
      className="erd-frame-node"
      data-testid="diagram-frame"
      data-frame-id={f.id}
      style={{
        width: '100%',
        height: '100%',
        background: f.color || erdColors.frameFill,
      }}
      aria-label={frameGroupLabel}
    >
      <div className="erd-frame-chrome">
        <div className="erd-frame-label">{frameName}</div>
        {memberCount > 0 ? (
          <div className="erd-frame-meta">
            {intl.formatMessage({ id: 'share.frame.tableCount' }, { count: memberCount })}
          </div>
        ) : null}
      </div>
    </div>
  );
});

const nodeTypes = {table: ReadOnlyTableNode, frame: ReadOnlyFrameNode};
const edgeTypes = {[ERD_EDGE_TYPE]: ErdRelationEdge};

function layoutNodes(
  entities: EntityData[],
  associations: Association[],
  layout: { id: string; x?: number; y?: number }[],
  frames: DiagramFrame[] = [],
  localizeDemo = false,
): Node[] {
  const {positions} = resolveEntityPositions(entities, associations, layout);
  const fkMap = fkFieldsByEntity(associations);
  const frameNodes: Node[] = frames.map((f) => ({
    id: frameNodeId(f.id),
    type: 'frame',
    zIndex: 0,
    position: {x: f.x, y: f.y},
    style: {width: f.w, height: f.h, zIndex: 0},
    data: {frame: f, localizeFrame: localizeDemo},
    draggable: false,
    selectable: false,
    connectable: false,
  }));
  const tableNodes: Node[] = entities.map((e) => ({
    id: e.title,
    type: 'table',
    zIndex: 2,
    position: positions[e.title] || {x: 0, y: 0},
    data: {entity: e, fkFields: fkMap.get(e.title) || [], localizeEntity: localizeDemo},
    draggable: false,
    connectable: false,
  }));
  return [...frameNodes, ...tableNodes];
}

export type ShareRelationCanvasProps = {
  module: ModuleData;
  /** 多关系图 id；缺省主图（listDiagrams[0]） */
  diagramId?: string | null;
  /** public-demo 等已知种子：渲染层走 i18n 映射 */
  shareToken?: string | null;
};

const ShareRelationCanvas: React.FC<ShareRelationCanvasProps> = ({module, diagramId, shareToken}) => {
  const intl = useIntl();
  const localizeDemo = isPublicDemoShare(shareToken);
  const {nodes, edges} = useMemo(() => {
    const entities = module.entities || [];
    const associations = module.associations || [];
    const layout = getActiveDiagramLayoutNodes(module, diagramId);
    const frames = getActiveDiagramFrames(module, diagramId);
    const {positions} = resolveEntityPositions(entities, associations, layout);
    return {
      nodes: layoutNodes(entities, associations, layout, frames, localizeDemo),
      edges: associationsToEdges(associations, {positions}),
    };
  }, [module, diagramId, localizeDemo]);

  const tableCount = nodes.filter((n) => n.type === 'table').length;
  if (!tableCount) {
    return <ShareEmptyState message={intl.formatMessage({ id: 'share.empty.noTables' })} />;
  }

  // key：切图时 remount → fitView 铺满；高度由 .share-page__stage flex 铺满视口（ADR-0016）
  return (
    <div
      key={diagramId || 'main'}
      className="erd-reactflow-container share-relation-canvas"
      data-testid="share-relation-canvas"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{...FIT_VIEW_SHAREABLE}}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable
        panOnDrag
        zoomOnScroll
        proOptions={{hideAttribution: true}}
      >
        <ErdCrowFootMarkers />
        <Background gap={16} size={1} color={erdColors.line}/>
        <ZhControls showInteractive={false} fitViewOptions={{...FIT_VIEW_SHAREABLE}}/>
        <ErdMiniMap
          pannable
          zoomable
          ariaLabel={intl.formatMessage({ id: 'share.minimap.aria' })}
          nodeColor={erdColors.surface}
          nodeStrokeColor={erdColors.line}
          nodeStrokeWidth={1.5}
          maskColor={erdColors.inkA06}
          style={{ backgroundColor: erdColors.surfaceSunk }}
        />
      </ReactFlow>
    </div>
  );
};

export default ShareRelationCanvas;
