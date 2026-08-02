/**
 * erdSmooth 障碍避让（ADR-0016）：正交肘线绕开中间表包围盒。
 * 优先平移 centerX；走廊仍穿表时走 bypassY（含叠表缝 mid-corridor）；
 * 单水平绕行仍撞竖挡时走两弯逃逸（escapeX + bypassY）；
 * 仍无解时走稀疏 Hanan 网格 A*（走廊外候选轴，非全像素栅格）。
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
/** 同竖向走廊多边干道 bundling 步长（px） */
export const EDGE_BUNDLE_STEP = 12;
/** midX 量化桶宽：落入同桶的边共享干道并分流 */
export const EDGE_CHANNEL_QUANT = 48;
/** A* 每轴最多保留的候选坐标数（控搜索规模） */
export const EDGE_ASTAR_MAX_AXIS = 16;
/** A* 折弯代价（鼓励少弯） */
export const EDGE_ASTAR_BEND_COST = 28;
/**
 * bypass 路径相对直线曼哈顿超此倍率时，继续试 twoBend/A* 并取更短解
 * （避免密 FK 簇「绕底一圈」仍抢先返回）
 */
export const EDGE_BYPASS_DETOUR_RATIO = 2.15;

/** 同通道多边 → 居中 trunk 偏移列表 */
export function trunkBundleOffsetsForCount(
  n: number,
  step = EDGE_BUNDLE_STEP,
): number[] {
  if (n <= 1) return n === 1 ? [0] : [];
  return Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * step);
}

export function channelKey(midX: number, quant = EDGE_CHANNEL_QUANT): number {
  return Math.round(midX / quant);
}

/**
 * 按 midX 通道分组，为每条边分配干道 bundle 偏移（同桶居中分流）。
 * 纯函数，供设计器 / 单测共用。
 */
export function assignTrunkBundleOffsets(
  items: Array<{ id: string; midX: number }>,
): Map<string, number> {
  const groups = new Map<number, string[]>();
  for (const it of items) {
    const k = channelKey(it.midX);
    const list = groups.get(k);
    if (list) list.push(it.id);
    else groups.set(k, [it.id]);
  }
  const out = new Map<string, number>();
  for (const ids of groups.values()) {
    ids.sort();
    const offs = trunkBundleOffsetsForCount(ids.length);
    ids.forEach((id, i) => out.set(id, offs[i] ?? 0));
  }
  return out;
}

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

/**
 * 两弯绕行：先水平逃到 escapeSX/TX（避开端点旁竖挡），再走 bypassY 走廊。
 * escape 等于 gapped X 时退化为单 bypass。
 */
export function twoBendLRWaypoints(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  offset: number,
  escapeSX: number,
  escapeTX: number,
  bypassY: number,
  sourcePosition: Position,
  targetPosition: Position,
): RoutePoint[] {
  const sxDir = sourcePosition === Position.Left ? -1 : 1;
  const txDir = targetPosition === Position.Left ? -1 : 1;
  const sourceGapped = { x: sourceX + sxDir * offset, y: sourceY };
  const targetGapped = { x: targetX + txDir * offset, y: targetY };
  const pts: RoutePoint[] = [{ x: sourceX, y: sourceY }, sourceGapped];
  if (Math.abs(escapeSX - sourceGapped.x) > 0.5) {
    pts.push({ x: escapeSX, y: sourceY });
  }
  pts.push({ x: escapeSX, y: bypassY });
  pts.push({ x: escapeTX, y: bypassY });
  if (Math.abs(escapeTX - targetGapped.x) > 0.5) {
    pts.push({ x: escapeTX, y: targetY });
  }
  pts.push(targetGapped);
  pts.push({ x: targetX, y: targetY });
  return pts;
}

function dist(a: RoutePoint, b: RoutePoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** 正交折线曼哈顿长度（选最短绕行） */
export function manhattanPolyline(points: RoutePoint[]): number {
  let len = 0;
  for (let i = 0; i < points.length - 1; i++) {
    len +=
      Math.abs(points[i + 1].x - points[i].x) +
      Math.abs(points[i + 1].y - points[i].y);
  }
  return len;
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

/**
 * 候选绕行 Y：并集外沿 + 各障顶/底（叠表缝 mid-corridor），近 midY 优先。
 */
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
  const set = new Set<number>();
  const top = Math.min(...blockers.map((r) => r.y));
  const bottom = Math.max(...blockers.map((r) => r.y + r.height));
  set.add(top - EDGE_BYPASS_GAP);
  set.add(bottom + EDGE_BYPASS_GAP);
  for (const r of blockers) {
    set.add(r.y - EDGE_BYPASS_GAP);
    set.add(r.y + r.height + EDGE_BYPASS_GAP);
  }
  return [...set].sort((a, b) => Math.abs(a - midY) - Math.abs(b - midY));
}

/** 两弯逃逸 X：障左右沿 + 走廊采样，近走廊中点优先 */
export function collectEscapeXCandidates(
  sourceGappedX: number,
  targetGappedX: number,
  obstacles: ObstacleRect[],
): number[] {
  const lo = Math.min(sourceGappedX, targetGappedX);
  const hi = Math.max(sourceGappedX, targetGappedX);
  if (hi - lo < 4) return [sourceGappedX, targetGappedX];
  const set = new Set<number>();
  const push = (v: number) => {
    if (v >= lo && v <= hi) set.add(Math.round(v * 100) / 100);
  };
  push(sourceGappedX);
  push(targetGappedX);
  for (const r of obstacles) {
    push(r.x - 1);
    push(r.x + r.width + 1);
  }
  const steps = Math.max(1, Math.floor((hi - lo) / EDGE_CENTER_STEP));
  for (let i = 0; i <= steps; i++) {
    push(lo + ((hi - lo) * i) / steps);
  }
  const mid = (lo + hi) / 2;
  return [...set].sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
}

export type ErdRouteResult = {
  path: string;
  labelX: number;
  labelY: number;
  /** default | centerX | bypass | twoBend | astar — 供单测 / 调试 */
  mode: 'default' | 'centerX' | 'bypass' | 'twoBend' | 'astar';
};

function pointInExpandedObstacle(x: number, y: number, r: ObstacleRect): boolean {
  return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
}

/** 轴候选：端点 + 障沿 ±gap + 走廊外沿；近 mid 优先截断 */
export function collectAstarAxisCandidates(
  sourceGappedX: number,
  targetGappedX: number,
  sourceY: number,
  targetY: number,
  obstacles: ObstacleRect[],
  maxAxis = EDGE_ASTAR_MAX_AXIS,
): { xs: number[]; ys: number[] } {
  const midX = (sourceGappedX + targetGappedX) / 2;
  const midY = (sourceY + targetY) / 2;
  const xSet = new Set<number>();
  const ySet = new Set<number>();
  const pushX = (v: number) => xSet.add(Math.round(v * 100) / 100);
  const pushY = (v: number) => ySet.add(Math.round(v * 100) / 100);

  pushX(sourceGappedX);
  pushX(targetGappedX);
  pushY(sourceY);
  pushY(targetY);

  const lo = Math.min(sourceGappedX, targetGappedX);
  const hi = Math.max(sourceGappedX, targetGappedX);
  // 走廊外侧：两弯搜不到的绕簇路径
  pushX(lo - EDGE_BYPASS_GAP);
  pushX(hi + EDGE_BYPASS_GAP);

  for (const r of obstacles) {
    pushX(r.x - 1);
    pushX(r.x + r.width + 1);
    pushX(r.x - EDGE_BYPASS_GAP);
    pushX(r.x + r.width + EDGE_BYPASS_GAP);
    pushY(r.y - 1);
    pushY(r.y + r.height + 1);
    pushY(r.y - EDGE_BYPASS_GAP);
    pushY(r.y + r.height + EDGE_BYPASS_GAP);
  }

  const trim = (vals: number[], mid: number) =>
    [...vals].sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid)).slice(0, maxAxis);

  return { xs: trim([...xSet], midX), ys: trim([...ySet], midY) };
}

function keyXY(x: number, y: number): string {
  return `${x},${y}`;
}

/** 去掉共线中间点 */
export function simplifyOrthogonalPath(points: RoutePoint[]): RoutePoint[] {
  if (points.length <= 2) return points;
  const out: RoutePoint[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const a = out[out.length - 1];
    const b = points[i];
    const c = points[i + 1];
    const colinear =
      (a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y);
    if (!colinear) out.push(b);
  }
  out.push(points[points.length - 1]);
  return out;
}

/**
 * 稀疏正交 A*：Hanan 候选格点上搜避障折线。
 * start/goal 允许贴障（手柄出边）；中间格点不得落入障碍。
 */
export function routeOrthogonalAstar(
  start: RoutePoint,
  goal: RoutePoint,
  obstacles: ObstacleRect[],
  xs: number[],
  ys: number[],
): RoutePoint[] | null {
  if (xs.length === 0 || ys.length === 0) return null;

  type Node = { x: number; y: number };
  const nodes: Node[] = [];
  const index = new Map<string, number>();
  const addNode = (x: number, y: number, allowInside: boolean) => {
    const k = keyXY(x, y);
    if (index.has(k)) return;
    if (
      !allowInside &&
      obstacles.some((r) => pointInExpandedObstacle(x, y, r))
    ) {
      return;
    }
    index.set(k, nodes.length);
    nodes.push({ x, y });
  };

  addNode(start.x, start.y, true);
  addNode(goal.x, goal.y, true);
  for (const x of xs) {
    for (const y of ys) {
      addNode(x, y, false);
    }
  }
  // 保证起终点轴落入网格邻接
  for (const y of ys) {
    addNode(start.x, y, false);
    addNode(goal.x, y, false);
  }
  for (const x of xs) {
    addNode(x, start.y, false);
    addNode(x, goal.y, false);
  }

  const startId = index.get(keyXY(start.x, start.y));
  const goalId = index.get(keyXY(goal.x, goal.y));
  if (startId === undefined || goalId === undefined) return null;

  // 邻接：同 X 或同 Y，段不穿障
  const adj: Array<Array<{ to: number; w: number }>> = nodes.map(() => []);
  const tryLink = (i: number, j: number) => {
    if (i === j) return;
    const a = nodes[i];
    const b = nodes[j];
    if (a.x !== b.x && a.y !== b.y) return;
    if (obstacles.some((r) => segmentIntersectsRect(a.x, a.y, b.x, b.y, r))) return;
    const w = dist(a, b);
    adj[i].push({ to: j, w });
  };
  // O(n²) 可接受：轴≤16 → 格点约数百
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      tryLink(i, j);
      tryLink(j, i);
    }
  }

  const heuristic = (i: number) => dist(nodes[i], goal);
  const gScore = new Float64Array(nodes.length).fill(Infinity);
  const fScore = new Float64Array(nodes.length).fill(Infinity);
  const came = new Int32Array(nodes.length).fill(-1);
  /** 进入该点的方向：0 无 / 1 水平 / 2 垂直 */
  const inDir = new Int8Array(nodes.length).fill(0);
  const open = new Set<number>([startId]);
  gScore[startId] = 0;
  fScore[startId] = heuristic(startId);

  while (open.size > 0) {
    let cur = -1;
    let bestF = Infinity;
    for (const id of open) {
      if (fScore[id] < bestF) {
        bestF = fScore[id];
        cur = id;
      }
    }
    if (cur < 0) break;
    if (cur === goalId) {
      const path: RoutePoint[] = [];
      let c = cur;
      while (c >= 0) {
        path.push(nodes[c]);
        c = came[c];
      }
      path.reverse();
      return simplifyOrthogonalPath(path);
    }
    open.delete(cur);
    const cx = nodes[cur].x;
    const cy = nodes[cur].y;
    for (const { to, w } of adj[cur]) {
      const nx = nodes[to].x;
      const ny = nodes[to].y;
      const dir = nx === cx ? 2 : 1;
      const bend =
        inDir[cur] !== 0 && inDir[cur] !== dir ? EDGE_ASTAR_BEND_COST : 0;
      const tentative = gScore[cur] + w + bend;
      if (tentative < gScore[to]) {
        came[to] = cur;
        inDir[to] = dir as 0 | 1 | 2;
        gScore[to] = tentative;
        fScore[to] = tentative + heuristic(to);
        open.add(to);
      }
    }
  }
  return null;
}

function pathWithCenterX(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourcePosition: Position,
  targetPosition: Position,
  offset: number,
  borderRadius: number,
  centerX: number,
  mode: ErdRouteResult['mode'],
): ErdRouteResult {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius,
    offset,
    centerX,
  });
  return { path, labelX, labelY, mode };
}

/**
 * 计算避障 smoothstep path。非对向左右手柄时退回 RF 默认。
 * `trunkBundleOffset`：同竖向走廊多边干道分流（X 肘 / bypass 的 Y）。
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
  /** 同通道干道偏移（px）；竖肘加到 centerX，绕行加到 bypassY */
  trunkBundleOffset?: number;
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
    trunkBundleOffset = 0,
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

  if (!isOppositeHorizontal(sourcePosition, targetPosition)) {
    return fallback();
  }

  const baseCenterX = (sourceX + targetX) / 2;
  const defaultCenterX = baseCenterX + trunkBundleOffset;

  const bundledDefault = () =>
    pathWithCenterX(
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      offset,
      borderRadius,
      defaultCenterX,
      'default',
    );

  if (raw.length === 0) {
    return trunkBundleOffset !== 0 ? bundledDefault() : fallback();
  }

  const obstacles = raw.map((r) => expandObstacle(r));
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
    return trunkBundleOffset !== 0 ? bundledDefault() : fallback();
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
        return pathWithCenterX(
          sourceX,
          sourceY,
          targetX,
          targetY,
          sourcePosition,
          targetPosition,
          offset,
          borderRadius,
          cx,
          'centerX',
        );
      }
    }
  }

  const bypassYs = pickBypassYCandidates(
    sourceY,
    targetY,
    loX,
    hiX,
    obstacles,
  );

  type Cand = { mode: ErdRouteResult['mode']; pts: RoutePoint[]; len: number };
  const cands: Cand[] = [];

  // 所有畅通 bypass → 取曼哈顿最短（勿「近 midY 先返回」导致绕底更长）
  for (const bypassY of bypassYs) {
    const by = bypassY + trunkBundleOffset;
    const bypassPts = bypassLRWaypoints(
      sourceX,
      sourceY,
      targetX,
      targetY,
      offset,
      by,
      sourcePosition,
      targetPosition,
    );
    if (!polylineHitsObstacles(bypassPts, obstacles)) {
      cands.push({
        mode: 'bypass',
        pts: bypassPts,
        len: manhattanPolyline(bypassPts),
      });
    }
  }

  const directLen =
    Math.abs(targetX - sourceX) + Math.abs(targetY - sourceY);
  const bestBypass = cands
    .filter((c) => c.mode === 'bypass')
    .sort((a, b) => a.len - b.len)[0];

  // 无 bypass，或绕行过长，或密障：两弯 / A* 一并竞短（修「绕底一圈」抢先返回）
  const needDeeper =
    !bestBypass ||
    bestBypass.len > directLen * EDGE_BYPASS_DETOUR_RATIO ||
    obstacles.length >= 3;

  // 单 bypass 竖腿仍撞，或 bypass 绕行过长 / 密障：两弯 / A* 竞短
  if (needDeeper) {
    const escapes = collectEscapeXCandidates(
      sourceGappedX,
      targetGappedX,
      obstacles,
    );
    for (const bypassY of bypassYs) {
      const by = bypassY + trunkBundleOffset;
      for (const escapeSX of escapes) {
        for (const escapeTX of escapes) {
          if (
            Math.abs(escapeSX - sourceGappedX) < 0.5 &&
            Math.abs(escapeTX - targetGappedX) < 0.5
          ) {
            continue;
          }
          const pts = twoBendLRWaypoints(
            sourceX,
            sourceY,
            targetX,
            targetY,
            offset,
            escapeSX,
            escapeTX,
            by,
            sourcePosition,
            targetPosition,
          );
          if (!polylineHitsObstacles(pts, obstacles)) {
            cands.push({
              mode: 'twoBend',
              pts,
              len: manhattanPolyline(pts),
            });
          }
        }
      }
    }

    const { xs, ys } = collectAstarAxisCandidates(
      sourceGappedX,
      targetGappedX,
      sourceY,
      targetY,
      obstacles,
    );
    const ysBundled =
      trunkBundleOffset === 0
        ? ys
        : [...new Set(ys.map((y) => y + trunkBundleOffset))];
    const core = routeOrthogonalAstar(
      { x: sourceGappedX, y: sourceY },
      { x: targetGappedX, y: targetY },
      obstacles,
      xs,
      ysBundled,
    );
    if (core && core.length >= 2) {
      const full: RoutePoint[] = [
        { x: sourceX, y: sourceY },
        ...core,
        { x: targetX, y: targetY },
      ];
      const simplified = simplifyOrthogonalPath(full);
      if (!polylineHitsObstacles(simplified, obstacles)) {
        cands.push({
          mode: 'astar',
          pts: simplified,
          len: manhattanPolyline(simplified),
        });
      }
    }
  }

  if (cands.length > 0) {
    const rank = (m: ErdRouteResult['mode']) =>
      m === 'bypass' ? 0 : m === 'twoBend' ? 1 : m === 'astar' ? 2 : 3;
    cands.sort(
      (a, b) => a.len - b.len || rank(a.mode) - rank(b.mode),
    );
    const win = cands[0];
    const [path, labelX, labelY] = pathFromWaypoints(win.pts, borderRadius);
    return { path, labelX, labelY, mode: win.mode };
  }

  // 仍撞：退回默认（极端重叠布局）
  return trunkBundleOffset !== 0 ? bundledDefault() : fallback();
}
