/**
 * A 层基线（工作区 ↔ 最新版本，ADR-0022）。
 *
 * 基线必须来自**独立的最新版本查询**：版本列表是分页的，`versions[0]` 只是「当前页第一条」，
 * 翻页 / 换排序即漂移；version 又是字符串，字典序会把 9.0.0 排在 10.0.0 之后。
 */

import { SNAPSHOT_DB_KEY } from './versionConstants';

export type BaselineDb = { key?: string; defaultDB?: boolean };

export type BaselineRecord = {
  id?: string;
  version?: string;
  versionDate?: string;
  createTime?: string;
  projectJSON?: { modules?: unknown[] } | null;
} | null;

export type LatestVersionQuery = {
  dbKey: string;
  projectId: string;
  current: 1;
  size: 1;
  orders: { column: string; asc: boolean }[];
};

/** 基线查询的 dbKey：显式 > 已标记默认数据源 > profile 默认数据源 > 模型快照通道 */
export function resolveBaselineDbKey(input: {
  explicitKey?: string;
  dbs?: BaselineDb[];
  profileDefaultId?: string;
}): string {
  const marked = (input.dbs || []).find((d) => d?.defaultDB)?.key;
  return input.explicitKey || marked || input.profileDefaultId || SNAPSHOT_DB_KEY;
}

/** 最新版本查询体：create_time 为主序（单调递增），version 仅兜底旧数据 */
export function buildLatestVersionQuery(dbKey: string, projectId: string): LatestVersionQuery {
  return {
    dbKey,
    projectId,
    current: 1,
    size: 1,
    orders: [
      { column: 'createTime', asc: false },
      { column: 'version', asc: false },
    ],
  };
}

/**
 * 基线模型：无基线时为空模型，diff 即「当前模型全部未提交」。
 * 禁止在 versions 为空时当作「无差异」，否则首次建模会被显示为「已一致」。
 */
export function baselineProjectJSON(baseline: BaselineRecord): { modules: unknown[] } {
  const modules = baseline?.projectJSON?.modules;
  return { modules: Array.isArray(modules) ? modules : [] };
}

/** 无基线（尚未存过版本）→ 提示首次保存版本，而不是「已与最新版本一致」 */
export function hasBaseline(baseline: BaselineRecord): boolean {
  return Boolean(baseline && (baseline.id || baseline.version));
}
