/**
 * 导入后 Frame 建议（ADR-0016 / 0017）：按表名前缀或连通分量聚类，
 * 烘焙包围盒写入 diagrams[].groups，让导入首图具备可分享的分组层次。
 */
import {
  FRAME_PADDING,
  computeFrameBoundsFromNodes,
  newFrameId,
  type DiagramFrame,
} from './diagram';
import { NODE_WIDTH, estimateNodeHeight, type LayoutAssociation, type LayoutEntity } from './graphLayout';
import { frameColorAt } from '@/theme/tokens';

export type SuggestImportFramesInput = {
  entities: LayoutEntity[];
  associations?: LayoutAssociation[];
  layoutNodes: Array<{ id: string; x: number; y: number }>;
};

/** 表名前缀：`sys_user` → `sys`；无下划线则 null */
export function tableNamePrefix(title: string): string | null {
  const t = String(title || '').trim();
  const m = /^([A-Za-z][A-Za-z0-9]*)_/.exec(t);
  if (!m) return null;
  const prefix = m[1];
  // 整表名即前缀（无后缀）时不聚类
  if (t === `${prefix}_` || t.length <= prefix.length + 1) return null;
  return prefix;
}

type Cluster = { key: string; name: string; memberEntityIds: string[] };

function clusterByPrefix(titles: string[]): Cluster[] {
  const buckets = new Map<string, string[]>();
  for (const title of titles) {
    const p = tableNamePrefix(title);
    if (!p) continue;
    const list = buckets.get(p) || [];
    list.push(title);
    buckets.set(p, list);
  }
  const clusters: Cluster[] = [];
  for (const [prefix, members] of buckets) {
    if (members.length < 2) continue;
    clusters.push({
      key: `prefix:${prefix}`,
      name: prefix,
      memberEntityIds: [...members].sort(),
    });
  }
  return clusters.sort((a, b) => a.name.localeCompare(b.name));
}

function clusterByConnectedComponents(
  titles: string[],
  associations: LayoutAssociation[],
): Cluster[] {
  const ids = new Set(titles);
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let p = parent.get(x) ?? x;
    while (p !== (parent.get(p) ?? p)) {
      p = parent.get(p) ?? p;
    }
    parent.set(x, p);
    return p;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };
  titles.forEach((t) => parent.set(t, t));
  associations.forEach((a) => {
    const s = a.from?.entity;
    const t = a.to?.entity;
    if (s && t && ids.has(s) && ids.has(t) && s !== t) union(s, t);
  });
  const groups = new Map<string, string[]>();
  titles.forEach((t) => {
    const root = find(t);
    const list = groups.get(root) || [];
    list.push(t);
    groups.set(root, list);
  });
  const clusters: Cluster[] = [];
  let i = 1;
  for (const members of groups.values()) {
    if (members.length < 2) continue;
    clusters.push({
      key: `cc:${i}`,
      name: `分组${i}`,
      memberEntityIds: [...members].sort(),
    });
    i += 1;
  }
  return clusters;
}

/**
 * 何时产出建议：
 * - 前缀优先：≥1 个前缀簇（各 ≥2 表），且不全覆盖所有表，或 ≥2 个前缀簇
 * - 否则连通分量：≥2 个分量簇（避免整图画一个大框）
 */
export function pickImportFrameClusters(
  titles: string[],
  associations: LayoutAssociation[] = [],
): Cluster[] {
  if (titles.length < 2) return [];
  const byPrefix = clusterByPrefix(titles);
  if (byPrefix.length >= 2) return byPrefix;
  if (byPrefix.length === 1) {
    const covered = byPrefix[0].memberEntityIds.length;
    if (covered < titles.length) return byPrefix;
    // 单一前缀覆盖全表 → 不框，避免整图边框
    return [];
  }
  const byCc = clusterByConnectedComponents(titles, associations);
  if (byCc.length >= 2) return byCc;
  return [];
}

/** 纯函数：产出可写入 diagram.groups 的 Frame（含色板轮换） */
export function suggestImportFrames(input: SuggestImportFramesInput): DiagramFrame[] {
  const entities = input.entities || [];
  const associations = input.associations || [];
  const layoutNodes = input.layoutNodes || [];
  const titles = entities.map((e) => e.title).filter(Boolean);
  const clusters = pickImportFrameClusters(titles, associations);
  if (!clusters.length) return [];

  const posById = new Map(layoutNodes.map((n) => [n.id, n]));
  const entityByTitle = new Map(entities.map((e) => [e.title, e]));

  return clusters.map((c, index) => {
    const nodes = c.memberEntityIds
      .map((id) => {
        const p = posById.get(id);
        if (!p) return null;
        const ent = entityByTitle.get(id);
        return {
          position: { x: p.x, y: p.y },
          width: NODE_WIDTH,
          height: estimateNodeHeight(ent),
        };
      })
      .filter(Boolean) as Array<{
      position: { x: number; y: number };
      width: number;
      height: number;
    }>;
    const bounds = computeFrameBoundsFromNodes(nodes, FRAME_PADDING);
    return {
      id: newFrameId(),
      name: c.name,
      color: frameColorAt(index),
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: bounds.h,
      memberEntityIds: c.memberEntityIds,
    };
  });
}
