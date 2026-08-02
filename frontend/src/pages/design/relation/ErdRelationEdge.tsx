/**
 * 自定义 smoothstep 边：圆角肘 + 多 FK 分流 + 障碍避让（centerX/bypass/twoBend/astar）+ 干道 bundling（ADR-0016）。
 * 设计器：基数 chip 可点选 1:1 / 1:n / n:1 / n:n；两端 Crow's foot（IE）；分享只读。
 */
import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  useStore,
} from 'reactflow';
import { Select } from 'antd';
import {
  CARDINALITY_OPTIONS,
  Cardinality,
  EDGE_BORDER_RADIUS,
  EDGE_LABEL_BG_PADDING,
  EDGE_LABEL_BG_RADIUS,
  EDGE_LABEL_FONT_SIZE,
  EDGE_STEP_OFFSET,
  ERD_EDGE_TYPE,
  EdgeLabelAnchor,
  ErdEdgeData,
  crowFootMarkersForRelation,
  edgeLabelBundleStretch,
  edgeLabelLaneStretch,
  isCardinality,
  normalizeRelation,
  resolveEdgeLabelOffsets,
} from '@/utils/relationEdges';
import {
  EDGE_BUNDLE_STEP,
  ObstacleRect,
  assignTrunkBundleOffsets,
  routeErdSmoothStep,
} from '@/utils/relationEdgeRoute';
import { NODE_WIDTH, estimateNodeHeight } from '@/utils/graphLayout';
import useProjectStore from '@/store/project/useProjectStore';

type TableNodeData = {
  entity?: { title?: string; fields?: Array<{ name?: string; relationNoShow?: boolean }> };
};

function nodeCenterX(n: {
  position: { x: number };
  positionAbsolute?: { x: number };
  width?: number;
}): number {
  const abs = n.positionAbsolute;
  const x = abs?.x ?? n.position.x;
  const w = Math.max(n.width && n.width > 0 ? n.width : 0, NODE_WIDTH);
  return x + w / 2;
}

function nodeCenterY(n: {
  position: { y: number };
  positionAbsolute?: { y: number };
  height?: number;
  data?: unknown;
}): number {
  const abs = n.positionAbsolute;
  const y = abs?.y ?? n.position.y;
  const entity = (n.data as TableNodeData | undefined)?.entity;
  const estimatedH = estimateNodeHeight(entity);
  const h = Math.max(n.height && n.height > 0 ? n.height : 0, estimatedH);
  return y + h / 2;
}

const CARDINALITY_SELECT_OPTIONS = CARDINALITY_OPTIONS.map((v) => ({
  value: v,
  label: v,
}));

function ErdRelationEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerStart,
  markerEnd,
  label,
  labelStyle,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
  selected,
  data,
}: EdgeProps<ErdEdgeData>) {
  const lane = data?.laneOffset ?? 0;
  const stepOffset = data?.stepOffset ?? EDGE_STEP_OFFSET;
  const hubFan = data?.hubFanOffset ?? 0;
  const portMode = data?.portMode ?? 'lr';
  const editable = !!data?.editable;
  const [editing, setEditing] = useState(false);
  // 垂直 Y 分流：肘段错开；端点仍贴近字段手柄（0.4 系数避免断柄感）
  const yShift = lane * 0.4;

  const obstacles = useStore(
    useCallback(
      (s): ObstacleRect[] => {
        const out: ObstacleRect[] = [];
        for (const n of s.getNodes()) {
          if (n.id === source || n.id === target) continue;
          if (n.type !== 'table') continue;
          if (n.hidden) continue;
          const entity = (n.data as TableNodeData | undefined)?.entity;
          // 取实测与估算较大值，避免矮估导致误判「水平走廊畅通」
          const estimatedH = estimateNodeHeight(entity);
          const w = Math.max(n.width && n.width > 0 ? n.width : 0, NODE_WIDTH);
          const h = Math.max(n.height && n.height > 0 ? n.height : 0, estimatedH);
          const abs = (n as { positionAbsolute?: { x: number; y: number } }).positionAbsolute;
          const x = abs?.x ?? n.position.x;
          const y = abs?.y ?? n.position.y;
          out.push({ id: n.id, x, y, width: w, height: h });
        }
        return out;
      },
      [source, target],
    ),
    (a, b) =>
      a.length === b.length &&
      a.every(
        (r, i) =>
          r.id === b[i].id &&
          r.x === b[i].x &&
          r.y === b[i].y &&
          r.width === b[i].width &&
          r.height === b[i].height,
      ),
  );

  const trunkBundleOffset = useStore(
    useCallback(
      (s): number => {
        const nodes = s.getNodes();
        const byId = new Map(nodes.map((n) => [n.id, n]));
        const items: Array<{ id: string; midX: number }> = [];
        for (const e of s.edges) {
          if (e.type && e.type !== ERD_EDGE_TYPE) continue;
          const sn = byId.get(e.source);
          const tn = byId.get(e.target);
          if (!sn || !tn) continue;
          if (sn.type !== 'table' || tn.type !== 'table') continue;
          if (sn.hidden || tn.hidden) continue;
          items.push({
            id: e.id,
            midX: (nodeCenterX(sn) + nodeCenterX(tn)) / 2,
          });
        }
        return assignTrunkBundleOffsets(items).get(id) ?? 0;
      },
      [id],
    ),
  );

  // 兄弟边近似锚点（中心 + bundle/lane 拉伸）；当前边用精确 path 标签点覆盖
  const siblingLabelAnchors = useStore(
    useCallback(
      (s): EdgeLabelAnchor[] => {
        const nodes = s.getNodes();
        const byId = new Map(nodes.map((n) => [n.id, n]));
        const midItems: Array<{ id: string; midX: number }> = [];
        for (const e of s.edges) {
          if (e.type && e.type !== ERD_EDGE_TYPE) continue;
          const sn = byId.get(e.source);
          const tn = byId.get(e.target);
          if (!sn || !tn) continue;
          if (sn.type !== 'table' || tn.type !== 'table') continue;
          if (sn.hidden || tn.hidden) continue;
          midItems.push({
            id: e.id,
            midX: (nodeCenterX(sn) + nodeCenterX(tn)) / 2,
          });
        }
        const bundles = assignTrunkBundleOffsets(midItems);
        const anchors: EdgeLabelAnchor[] = [];
        for (const e of s.edges) {
          if (e.type && e.type !== ERD_EDGE_TYPE) continue;
          const sn = byId.get(e.source);
          const tn = byId.get(e.target);
          if (!sn || !tn) continue;
          if (sn.type !== 'table' || tn.type !== 'table') continue;
          if (sn.hidden || tn.hidden) continue;
          const eLane =
            (e.data as ErdEdgeData | undefined)?.laneOffset ?? 0;
          const bundle = bundles.get(e.id) ?? 0;
          anchors.push({
            id: e.id,
            x:
              (nodeCenterX(sn) + nodeCenterX(tn)) / 2 +
              edgeLabelBundleStretch(bundle, EDGE_BUNDLE_STEP),
            y:
              (nodeCenterY(sn) + nodeCenterY(tn)) / 2 +
              eLane * 0.4 +
              edgeLabelLaneStretch(eLane),
          });
        }
        return anchors;
      },
      [],
    ),
    (a, b) =>
      a.length === b.length &&
      a.every(
        (r, i) =>
          r.id === b[i].id && r.x === b[i].x && r.y === b[i].y,
      ),
  );

  const { path, labelX, labelY, mode } = routeErdSmoothStep({
    sourceX,
    sourceY: sourceY + yShift,
    targetX,
    targetY: targetY + yShift,
    sourcePosition,
    targetPosition,
    offset: stepOffset,
    borderRadius: EDGE_BORDER_RADIUS,
    obstacles,
    trunkBundleOffset,
  });

  const labelStretchX = edgeLabelBundleStretch(
    trunkBundleOffset,
    EDGE_BUNDLE_STEP,
  );
  const labelStretchY = edgeLabelLaneStretch(lane);
  const labelNudge = useMemo(() => {
    const anchors = siblingLabelAnchors.map((a) =>
      a.id === id
        ? {
            id,
            x: labelX + labelStretchX,
            y: labelY + labelStretchY,
          }
        : a,
    );
    return resolveEdgeLabelOffsets(anchors).get(id) ?? { dx: 0, dy: 0 };
  }, [
    siblingLabelAnchors,
    id,
    labelX,
    labelY,
    labelStretchX,
    labelStretchY,
  ]);
  const labelDrawX = labelX + labelStretchX + labelNudge.dx;
  const labelDrawY = labelY + labelStretchY + labelNudge.dy;

  const pad = labelBgPadding || EDGE_LABEL_BG_PADDING;
  const rawLabel = typeof label === 'string' ? label : '';
  const displayLabel = normalizeRelation(rawLabel) || rawLabel;
  const hasLabel = displayLabel.length > 0;
  // 勿把 fillOpacity 套到整块 div（会冲淡文字）；chip 样式以 .erd-edge-label 为准
  const chipBg =
    (labelBgStyle?.fill as string | undefined) || 'var(--erd-surface)';
  const chipColor =
    (labelStyle?.fill as string | undefined) || 'var(--erd-ink-600)';

  const currentValue: Cardinality | string = isCardinality(displayLabel)
    ? displayLabel
    : displayLabel || 'n:1';

  // 选中用 brand 鸦爪；props 未带 marker 时按 label 回落（防分享/旧边）
  const tone = selected ? 'brand' : 'ink';
  const fallback = crowFootMarkersForRelation(displayLabel || 'n:1', tone);
  const startMarker = markerStart || fallback.markerStart;
  const endMarker = markerEnd || fallback.markerEnd;

  const commitRelation = (next: string) => {
    const mod = data?.moduleName;
    const from = data?.assocFrom;
    const to = data?.assocTo;
    if (!mod || !from || !to) {
      setEditing(false);
      return;
    }
    useProjectStore.getState().dispatch.updateAssociationRelation(
      mod,
      { from, to },
      next,
    );
    setEditing(false);
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={style}
        markerStart={startMarker}
        markerEnd={endMarker}
      />
      <span
        data-testid="erd-edge-route-mode"
        data-mode={mode}
        data-bundle={String(trunkBundleOffset)}
        data-hub-fan={String(hubFan)}
        data-port={portMode}
        data-edge-id={id}
        hidden
      />
      <span
        data-testid="erd-edge-crowfoot"
        data-marker-start={String(startMarker)}
        data-marker-end={String(endMarker)}
        data-relation={displayLabel || 'n:1'}
        hidden
      />
      <span
        data-testid="erd-edge-label-nudge"
        data-edge-id={id}
        data-dx={String(labelStretchX + labelNudge.dx)}
        data-dy={String(labelStretchY + labelNudge.dy)}
        hidden
      />
      {hasLabel || editable ? (
        <EdgeLabelRenderer>
          <div
            className={`erd-edge-label nodrag nopan${editable ? ' erd-edge-label--editable' : ''}${
              editing ? ' erd-edge-label--editing' : ''
            }`}
            data-testid="erd-edge-label"
            role={editable ? 'button' : undefined}
            aria-label={editable ? `关系基数 ${displayLabel || '未设'}，点击修改` : undefined}
            tabIndex={editable ? 0 : undefined}
            onClick={
              editable && !editing
                ? (e) => {
                    e.stopPropagation();
                    setEditing(true);
                  }
                : undefined
            }
            onKeyDown={
              editable && !editing
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditing(true);
                    }
                  }
                : undefined
            }
            style={{
              transform: `translate(-50%, -50%) translate(${labelDrawX}px,${labelDrawY}px)`,
              fontSize: (labelStyle?.fontSize as number) || EDGE_LABEL_FONT_SIZE,
              color: chipColor,
              background: chipBg,
              padding: editing
                ? 0
                : `${pad[1]}px ${pad[0]}px`,
              borderRadius: labelBgBorderRadius ?? EDGE_LABEL_BG_RADIUS,
            }}
          >
            {editing && editable ? (
              <Select
                size="small"
                autoFocus
                open
                className="erd-edge-cardinality-select"
                data-testid="erd-edge-cardinality"
                aria-label="选择关系基数"
                value={isCardinality(String(currentValue)) ? currentValue : 'n:1'}
                options={CARDINALITY_SELECT_OPTIONS}
                onChange={(v) => commitRelation(String(v))}
                onDropdownVisibleChange={(vis) => {
                  if (!vis) setEditing(false);
                }}
                getPopupContainer={() => document.body}
                style={{ width: 72, fontSize: EDGE_LABEL_FONT_SIZE }}
                popupMatchSelectWidth={false}
              />
            ) : (
              displayLabel || 'n:1'
            )}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export default memo(ErdRelationEdge);
