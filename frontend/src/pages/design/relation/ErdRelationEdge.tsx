/**
 * 自定义 smoothstep 边：圆角肘 + 多 FK 分流 + 中间表障碍避让（ADR-0016）。
 */
import React, { memo, useCallback } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  useStore,
} from 'reactflow';
import {
  EDGE_BORDER_RADIUS,
  EDGE_STEP_OFFSET,
  ErdEdgeData,
} from '@/utils/relationEdges';
import {
  ObstacleRect,
  routeErdSmoothStep,
} from '@/utils/relationEdgeRoute';
import { NODE_WIDTH, estimateNodeHeight } from '@/utils/graphLayout';

type TableNodeData = {
  entity?: { title?: string; fields?: Array<{ name?: string; relationNoShow?: boolean }> };
};

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
  markerEnd,
  label,
  labelStyle,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
  data,
}: EdgeProps<ErdEdgeData>) {
  const lane = data?.laneOffset ?? 0;
  const stepOffset = data?.stepOffset ?? EDGE_STEP_OFFSET;
  // 轻微 Y 分流：肘段错开；端点仍贴近字段手柄（0.4 系数避免断柄感）
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
  });

  const pad = labelBgPadding || [4, 2];
  const hasLabel = typeof label === 'string' && label.length > 0;

  return (
    <>
      <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />
      <span
        data-testid="erd-edge-route-mode"
        data-mode={mode}
        data-edge-id={id}
        hidden
      />
      {hasLabel ? (
        <EdgeLabelRenderer>
          <div
            className="erd-edge-label nodrag nopan"
            data-testid="erd-edge-label"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              fontSize: (labelStyle?.fontSize as number) || 10,
              fontFamily: 'var(--erd-font-mono)',
              color: (labelStyle?.fill as string) || 'var(--erd-ink-400)',
              background: (labelBgStyle?.fill as string) || 'var(--erd-surface-sunk)',
              opacity: (labelBgStyle?.fillOpacity as number) ?? 0.94,
              padding: `${pad[1]}px ${pad[0]}px`,
              borderRadius: labelBgBorderRadius ?? 3,
              letterSpacing: '0.02em',
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export default memo(ErdRelationEdge);
