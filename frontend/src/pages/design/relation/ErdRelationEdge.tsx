/**
 * 自定义 smoothstep 边：更大圆角 + 同表对多 FK 肘部分流（ADR-0016 边路由）。
 */
import React, { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
} from 'reactflow';
import {
  EDGE_BORDER_RADIUS,
  EDGE_STEP_OFFSET,
  ErdEdgeData,
} from '@/utils/relationEdges';

function ErdRelationEdge({
  id,
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
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY: sourceY + yShift,
    targetX,
    targetY: targetY + yShift,
    sourcePosition,
    targetPosition,
    borderRadius: EDGE_BORDER_RADIUS,
    offset: stepOffset,
  });

  const pad = labelBgPadding || [4, 2];
  const hasLabel = typeof label === 'string' && label.length > 0;

  return (
    <>
      <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />
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
