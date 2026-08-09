/**
 * A 层 structural diff — 后端权威（VersionDiffEngine / POST /ncnb/hisProject/diff）。
 * 版本变更详情、任意版本比对必须消费此 API；前端不得再对快照重算 diff。
 */
import { POST } from '@/services/crud';
import * as cache from '@/utils/cache';
import { CONSTANT } from '@/utils/constant';

export type VersionDiffChange = {
  type: string;
  name: string;
  opt: string;
  changeData?: string;
};

export type VersionDiffResponse = {
  hasBaseline: boolean;
  baseline: Record<string, unknown> | null;
  changes: VersionDiffChange[];
  /** 与 changes 同源的增量 DDL（后端 VersionDdlEngine 权威） */
  ddl: string;
};

export async function fetchVersionPanelDiff(input: {
  projectJSON: Record<string, unknown>;
  baselineProjectJSON?: Record<string, unknown>;
  dialectCode?: string;
  projectId?: string;
  dbKey?: string;
}): Promise<VersionDiffResponse> {
  const projectId = input.projectId || cache.getItem(CONSTANT.PROJECT_ID);
  if (!projectId) {
    throw new Error('projectId is required for version diff');
  }
  if (!input.dbKey) {
    throw new Error('dbKey is required for version diff');
  }
  const body: Record<string, unknown> = {
    projectId,
    dbKey: input.dbKey,
    projectJSON: input.projectJSON,
    dialectCode: input.dialectCode || 'MYSQL',
  };
  if (input.baselineProjectJSON) {
    body.baselineProjectJSON = input.baselineProjectJSON;
  }
  const res = await POST('/ncnb/hisProject/diff', body);
  if (!res || res.code !== 200) {
    throw new Error(res?.msg || res?.message || `version diff failed (${res?.code ?? 'no response'})`);
  }
  const data = res.data || {};
  return {
    hasBaseline: Boolean(data.hasBaseline),
    baseline: data.baseline ?? null,
    changes: Array.isArray(data.changes) ? data.changes : [],
    ddl: typeof data.ddl === 'string' ? data.ddl : '',
  };
}

/** @deprecated 使用 fetchVersionPanelDiff */
export async function fetchVersionStructuralDiff(
  input: Parameters<typeof fetchVersionPanelDiff>[0],
): Promise<VersionDiffResponse> {
  return fetchVersionPanelDiff(input);
}
