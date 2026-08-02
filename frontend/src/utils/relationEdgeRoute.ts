/**
 * erdSmooth 障碍避让（ADR-0016）：正交肘线绕开中间表包围盒。
 * 优先平移 centerX；走廊仍穿表时走 bypassY 上/下绕行。
 */
import { Position, getSmoothStepPath } from 'reactflow';
import { EDGE_BORDER_RADIUS } from './relationEdges';

export type ObstacleRect = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RoutePoint = { x: number; y: number };

/** 表节点膨胀，避免描边贴边 */
export const EDGE_OBSTACLE_PAD = 8;
/** centerX 候选步长 */
export const EDGE_CENTER_STEP = 20;
/** bypass 相对障碍额外空隙 */
export const EDGE_BYPASS_GAP = 24;

export function expandObstacle(r: ObstacleRect, pad = EDGE_OBSTACLE_PAD): ObstacleRect {
  return {
    id: r.id,
    x: r.x - pad,
    y: r.y - pad,
    width: r.width + 2 * pad,
    height: r.height + 2 * pad,
  };
}

/** 轴对齐线段（水平或垂直）是否与矩形相交（含边界） */
export function segmentIntersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r: ObstacleRect,
): boolean {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  const rx2 = r.x + r.width;
  const ry2 = r.y + r.height;
  if (maxX < r.x || minX > rx2 || maxY < r.y || minY > ry2) return false;
  if (y1 === y2) {
    return y1 >= r.y && y1 <= ry2 && maxX >= r.x && minX <= rx2;
  }
  if (x1 === x2) {
    return x1 >= r.x && x1 <= rx2 && maxY >= r.y && minY <= ry2;
  }
  // 非正交：用包围盒近似（本模块只产正交折线）
  return true;
}

export function polylineHitsObstacles(points: RoutePoint[], obstacles: ObstacleRect[]): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    for (const r of obstacles) {
      if (segmentIntersectsRect(a.x, a.y, b.x, b.y, r)) return true;
    }
  }
  return false;
}

/** 对向左右手柄：与 RF getPoints verticalSplit 一致的折点 */
export function oppositeLRWaypoints(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  offset: number,
  centerX: number,
  sourcePosition: Position,
  targetPosition: Position,
): RoutePoint[] {
  const sxDir = sourcePosition === Position.Left ? -1 : 1;
  const txDir = targetPosition === Position.Left ? -1 : 1;
  const sourceGapped = { x: sourceX + sxDir * offset, y: sourceY };
  const targetGapped = { x: targetX + txDir * offset, y: targetY };
  return [
    { x: sourceX, y: sourceY },
    sourceGapped,
    { x: centerX, y: sourceY },
    { x: centerX, y: targetY },
    targetGapped,
    { x: targetX, y: targetY },
  ];
}

/** 上/下绕行：水平走廊在 bypassY */
export function bypassLRWaypoints(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  offset: number,
  bypassY: number,
  sourcePosition: Position,
  targetPosition: Position,
): RoutePoint[] {
  const sxDir = sourcePosition === Position.Left ? -1 : 1;
  const txDir = targetPosition === Position.Left ? -1 : 1;
  const sourceGapped = { x: sourceX + sxDir * offset, y: sourceY };
  const targetGapped = { x: targetX + txDir * offset, y: targetY };
  return [
    { x: sourceX, y: sourceY },
    sourceGapped,
    { x: sourceGapped.x, y: bypassY },
    { x: targetGapped.x, y: bypassY },
    targetGapped,
    { x: targetX, y: targetY },
  ];
}

function dist(a: RoutePoint, b: RoutePoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function bendSvg(a: RoutePoint, b: RoutePoint, c: RoutePoint, size: number): string {
  const bendSize = Math.min(dist(a, b) / 2, dist(b, c) / 2, size);
  const { x, y } = b;
  if ((a.x === x && x === c.x) || (a.y === y && y === c.y)) {
    return `L${x} ${y}`;
  }
  if (a.y === y) {
    const xDir = a.x < c.x ? -1 : 1;
    const yDir = a.y < c.y ? 1 : -1;
    return `L ${x + bendSize * xDir},${y}Q ${x},${y} ${x},${y + bendSize * yDir}`;
  }
  const xDir = a.x < c.x ? 1 : -1;
  const yDir = a.y < c.y ? -1 : 1;
  return `L ${x},${y + bendSize * yDir}Q ${x},${y} ${x + bendSize * xDir},${y}`;
}

/** 折点 → smoothstep 风格 path + 标签中心（最长段中点） */
export function pathFromWaypoints(
  points: RoutePoint[],
  borderRadius = EDGE_BORDER_RADIUS,
): [string, number, number] {
  let labelX = points[0].x;
  let labelY = points[0].y;
  let maxLen = -1;
  for (let i = 0; i < points.length - 1; i++) {
    const len = dist(points[i], points[i + 1]);
    if (len > maxLen) {
      maxLen = len;
      labelX = (points[i].x + points[i + 1].x) / 2;
      labelY = (points[i].y + points[i + 1].y) / 2;
    }
  }
  const path = points.reduce((res, p, i) => {
    if (i === 0) return `M${p.x} ${p.y}`;
    if (i < points.length - 1) {
      return res + bendSvg(points[i - 1], p, points[i + 1], borderRadius);
    }
    return res + `L${p.x} ${p.y}`;
  }, '');
  return [path, labelX, labelY];
}

function isOppositeHorizontal(sourcePosition: Position, targetPosition: Position): boolean {
  const horiz = new Set([Position.Left, Position.Right]);
  return (
    horiz.has(sourcePosition) &&
    horiz.has(targetPosition) &&
    sourcePosition !== targetPosition
  );
}

export function collectCenterXCandidates(
  sourceGappedX: number,
  targetGappedX: number,
  defaultCenterX: number,
  obstacles: ObstacleRect[],
): number[] {
  const lo = Math.min(sourceGappedX, targetGappedX);
  const hi = Math.max(sourceGappedX, targetGappedX);
  const span = hi - lo;
  if (span < 4) return [defaultCenterX];

  const set = new Set<number>();
  const push = (v: number) => {
    if (v > lo + 2 && v < hi - 2) set.add(Math.round(v * 100) / 100);
  };
  push(defaultCenterX);
  for (const r of obstacles) {
    push(r.x - 1);
    push(r.x + r.width + 1);
  }
  const steps = Math.max(1, Math.floor(span / EDGE_CENTER_STEP));
  for (let i = 0; i <= steps; i++) {
    push(lo + (span * i) / steps);
  }
  return [...set].sort((a, b) => Math.abs(a - defaultCenterX) - Math.abs(b - defaultCenterX));
}

/** 候选绕行 Y：近 midY 优先，上下都试 */
export function pickBypassYCandidates(
  sourceY: number,
  targetY: number,
  corridorMinX: number,
  corridorMaxX: number,
  obstacles: ObstacleRect[],
): number[] {
  const midY = (sourceY + targetY) / 2;
  const blockers = obstacles.filter((r) => {
    const rx2 = r.x + r.width;
    return !(rx2 < corridorMinX || r.x > corridorMaxX);
  });
  if (blockers.length === 0) return [midY];
  const top = Math.min(...blockers.map((r) => r.y));
  const bottom = Math.max(...blockers.map((r) => r.y + r.height));
  const above = top - EDGE_BYPASS_GAP;
  const below = bottom + EDGE_BYPASS_GAP;
  return [above, below].sort((a, b) => Math.abs(a - midY) - Math.abs(b - midY));
}

export type ErdRouteResult = {
  path: string;
  labelX: number;
  labelY: number;
  /** default | centerX | bypass — 供单测 / 调试 */
  mode: 'default' | 'centerX' | 'bypass';
};

/**
 * 计算避障 smoothstep path。非对向左右手柄时退回 RF 默认。
 */
export function routeErdSmoothStep(opts: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  offset: number;
  borderRadius?: number;
  obstacles?: ObstacleRect[];
}): ErdRouteResult {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    offset,
    borderRadius = EDGE_BORDER_RADIUS,
    obstacles: raw = [],
  } = opts;

  const fallback = (): ErdRouteResult => {
    const [path, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      borderRadius,
      offset,
    });
    return { path, labelX, labelY, mode: 'default' };
  };

  if (!isOppositeHorizontal(sourcePosition, targetPosition) || raw.length === 0) {
    return fallback();
  }

  const obstacles = raw.map((r) => expandObstacle(r));
  const defaultCenterX = (sourceX + targetX) / 2;
  const sxDir = sourcePosition === Position.Left ? -1 : 1;
  const txDir = targetPosition === Position.Left ? -1 : 1;
  const sourceGappedX = sourceX + sxDir * offset;
  const targetGappedX = targetX + txDir * offset;

  const loX = Math.min(sourceGappedX, targetGappedX);
  const hiX = Math.max(sourceGappedX, targetGappedX);

  const defaultPts = oppositeLRWaypoints(
    sourceX,
    sourceY,
    targetX,
    targetY,
    offset,
    defaultCenterX,
    sourcePosition,
    targetPosition,
  );
  if (!polylineHitsObstacles(defaultPts, obstacles)) {
    return fallback();
  }

  // 水平走廊已被挡（同行中间表）时，平移 centerX 无效，直接 bypass
  const horizontalsBlocked = obstacles.some(
    (r) =>
      segmentIntersectsRect(loX, sourceY, hiX, sourceY, r) ||
      segmentIntersectsRect(loX, targetY, hiX, targetY, r),
  );

  if (!horizontalsBlocked) {
    for (const cx of collectCenterXCandidates(
      sourceGappedX,
      targetGappedX,
      defaultCenterX,
      obstacles,
    )) {
      const pts = oppositeLRWaypoints(
        sourceX,
        sourceY,
        targetX,
        targetY,
        offset,
        cx,
        sourcePosition,
        targetPosition,
      );
      if (!polylineHitsObstacles(pts, obstacles)) {
        const [path, labelX, labelY] = getSmoothStepPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
          sourcePosition,
          targetPosition,
          borderRadius,
          offset,
          centerX: cx,
        });
        return { path, labelX, labelY, mode: 'centerX' };
      }
    }
  }

  for (const bypassY of pickBypassYCandidates(
    sourceY,
    targetY,
    loX,
    hiX,
    obstacles,
  )) {
    const bypassPts = bypassLRWaypoints(
      sourceX,
      sourceY,
      targetX,
      targetY,
      offset,
      bypassY,
      sourcePosition,
      targetPosition,
    );
    if (!polylineHitsObstacles(bypassPts, obstacles)) {
      const [path, labelX, labelY] = pathFromWaypoints(bypassPts, borderRadius);
      return { path, labelX, labelY, mode: 'bypass' };
    }
  }

  // 仍撞：退回默认（极端重叠布局）
  return fallback();
}
