/**
 * 公开 demo 布局重算：用产品同款 dagre 分层算法（graphLayout.ts）替换手排坐标（ADR-0016）。
 * 手排失败原因：估算节点高度与真实字段数不匹配 → 卡片重叠；Frame 凭手感画框未按布局包围盒算 → 框与节点脱节。
 * Run: cd frontend && npx tsx scripts/gen-demo-layout.ts
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  NODE_WIDTH,
  dagrePositions,
  estimateNodeHeight,
  layoutBoundingSize,
  type LayoutAssociation,
  type LayoutEntity,
} from '../src/utils/graphLayout';
import { computeFrameBoundsFromNodes, FRAME_PADDING } from '../src/utils/diagram';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'schema/examples/demo.projectjson.json');

type Json = Record<string, unknown>;

function frameBoundsForGroup(
  memberIds: string[],
  positions: Record<string, { x: number; y: number }>,
  entityByTitle: Map<string, LayoutEntity>,
  padding = FRAME_PADDING,
) {
  const nodes = memberIds.map((id) => ({
    position: positions[id],
    width: NODE_WIDTH,
    height: estimateNodeHeight(entityByTitle.get(id)),
  }));
  return computeFrameBoundsFromNodes(nodes, padding);
}

/** 校验候选框不侵入非成员节点包围盒（真实防重叠，而非手感留白） */
function frameOverlapsForeignNode(
  bounds: { x: number; y: number; w: number; h: number },
  memberIds: string[],
  positions: Record<string, { x: number; y: number }>,
  entityByTitle: Map<string, LayoutEntity>,
): string | null {
  const memberSet = new Set(memberIds);
  for (const [title, p] of Object.entries(positions)) {
    if (memberSet.has(title)) continue;
    const h = estimateNodeHeight(entityByTitle.get(title));
    const nx1 = p.x;
    const ny1 = p.y;
    const nx2 = p.x + NODE_WIDTH;
    const ny2 = p.y + h;
    const bx2 = bounds.x + bounds.w;
    const by2 = bounds.y + bounds.h;
    const overlaps = nx1 < bx2 && nx2 > bounds.x && ny1 < by2 && ny2 > bounds.y;
    if (overlaps) return title;
  }
  return null;
}

function buildFrames(
  groups: Array<{ id: string; name: string; color: string; memberEntityIds: string[] }>,
  positions: Record<string, { x: number; y: number }>,
  entityByTitle: Map<string, LayoutEntity>,
) {
  const frames: Array<Json> = [];
  for (const g of groups) {
    const bounds = frameBoundsForGroup(g.memberEntityIds, positions, entityByTitle, FRAME_PADDING);
    const bad = frameOverlapsForeignNode(bounds, g.memberEntityIds, positions, entityByTitle);
    if (bad) {
      console.warn(
        `[gen-demo-layout] 框「${g.name}」包围盒侵入非成员节点「${bad}」，跳过该框（避免视觉误框）`,
      );
      continue;
    }
    frames.push({
      id: g.id,
      name: g.name,
      color: g.color,
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: bounds.h,
      memberEntityIds: g.memberEntityIds,
    });
  }
  return frames;
}

function main() {
  const raw = fs.readFileSync(SRC, 'utf8');
  const json = JSON.parse(raw);
  const mod = json.modules[0];
  const entities = mod.entities as LayoutEntity[];
  const associations = mod.associations as LayoutAssociation[];
  const entityByTitle = new Map(entities.map((e) => [e.title, e]));

  // 主图：TB 分层——本图两层分别是 5 表宽 / 3 表宽，TB 铺成横向更适合分享截图；
  // 走产品同款默认走廊（DAGRE_NODESEP/RANKSEP）
  const mainPos = dagrePositions(entities, associations, { rankdir: 'TB' });
  const mainSize = layoutBoundingSize(mainPos, entities);
  console.log('main bounding size:', mainSize);
  Object.entries(mainPos).forEach(([id, p]) => console.log(`  ${id}: x=${p.x} y=${p.y}`));

  // 按 dagre 分层结果聚类分组：同 rank 的表天然不重叠，比人工语义分组更贴布局真相
  // TB 各表高度不同，顶边 y 会因居中而错开——按「中心 y」才能还原真实 rank（宽度恒定则左边 x 即可代表 rank）
  const rankOf = (id: string) => mainPos[id].y + estimateNodeHeight(entityByTitle.get(id)) / 2;
  const ranksSorted = [...new Set(entities.map((e) => Math.round(rankOf(e.title))))].sort((a, b) => a - b);
  const rankGroups = ranksSorted.map((x) => entities.filter((e) => Math.round(rankOf(e.title)) === x).map((e) => e.title));
  console.log('rank groups:', rankGroups);

  const FRAME_COLORS = [
    'rgba(47, 143, 123, 0.10)',
    'rgba(11, 28, 44, 0.06)',
    'rgba(212, 136, 6, 0.10)',
    'rgba(222, 41, 16, 0.08)',
  ];
  const mainGroupDefs = [
    { id: 'f_detail', name: '关联与明细', color: FRAME_COLORS[1], memberEntityIds: rankGroups[0] },
    { id: 'f_core', name: '核心实体', color: FRAME_COLORS[0], memberEntityIds: rankGroups[1] },
  ].filter((g) => g.memberEntityIds && g.memberEntityIds.length > 0);
  const mainFrames = buildFrames(mainGroupDefs, mainPos, entityByTitle);

  // 第二视图：LR 分层，呈现同一 schema 的另一种叙事角度（会话/审计聚焦）
  const sessionPos = dagrePositions(entities, associations, { rankdir: 'LR' });
  // LR 各表宽度恒为 NODE_WIDTH，左边 x 本身即可代表 rank（无需再加宽度/2）
  const sessionRankOf = (id: string) => sessionPos[id].x;
  const sRanksSorted = [...new Set(entities.map((e) => Math.round(sessionRankOf(e.title))))].sort((a, b) => a - b);
  const sRankGroups = sRanksSorted.map((y) => entities.filter((e) => Math.round(sessionRankOf(e.title)) === y).map((e) => e.title));
  const sessionGroupDefs = [
    { id: 'f2_detail', name: '关联与明细', color: FRAME_COLORS[1], memberEntityIds: sRankGroups[0] },
    { id: 'f2_core', name: '核心实体', color: FRAME_COLORS[0], memberEntityIds: sRankGroups[1] },
  ].filter((g) => g.memberEntityIds && g.memberEntityIds.length > 0);
  const sessionFrames = buildFrames(sessionGroupDefs, sessionPos, entityByTitle);

  mod.diagrams = [
    {
      id: 'main',
      name: '鉴权核心',
      layout: {
        nodes: entities.map((e) => ({ id: e.title, title: e.title, x: mainPos[e.title].x, y: mainPos[e.title].y })),
      },
      groups: mainFrames,
    },
    {
      id: 'd_session',
      name: '会话与审计',
      layout: {
        nodes: entities.map((e) => ({ id: e.title, title: e.title, x: sessionPos[e.title].x, y: sessionPos[e.title].y })),
      },
      groups: sessionFrames,
    },
  ];
  mod.graphCanvas = {
    nodes: entities.map((e) => ({ id: e.title, x: mainPos[e.title].x, y: mainPos[e.title].y })),
    edges: [],
  };

  fs.writeFileSync(SRC, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
  console.log('written:', path.relative(ROOT, SRC));
}

main();
