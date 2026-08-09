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

/** 工作区 ↔ 最新版本基线（A 层 dirty chip / 存版前 changes） */
export async function fetchWorkspaceDirtyDiff(input: {
  projectJSON: Record<string, unknown>;
  dialectCode?: string;
  projectId?: string;
  dbKey?: string;
}): Promise<VersionDiffResponse> {
  return fetchVersionPanelDiff(input);
}

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

export type VersionSyncSqlResponse = {
  sql: string;
};

/** 版本同步到库：全量 / 增量 SQL（后端 VersionSyncSqlEngine 权威） */
export async function fetchVersionSyncSql(input: {
  projectJSON: Record<string, unknown>;
  baselineProjectJSON?: Record<string, unknown>;
  dialectCode?: string;
  mode?: 'full' | 'incremental';
  upgradeType?: string;
  changes?: VersionDiffChange[];
  projectId?: string;
  dbKey?: string;
}): Promise<VersionSyncSqlResponse> {
  const projectId = input.projectId || cache.getItem(CONSTANT.PROJECT_ID);
  if (!projectId) {
    throw new Error('projectId is required for version sync SQL');
  }
  if (!input.dbKey) {
    throw new Error('dbKey is required for version sync SQL');
  }
  const body: Record<string, unknown> = {
    projectId,
    dbKey: input.dbKey,
    projectJSON: input.projectJSON,
    dialectCode: input.dialectCode || 'MYSQL',
    mode: input.mode || 'incremental',
  };
  if (input.baselineProjectJSON) {
    body.baselineProjectJSON = input.baselineProjectJSON;
  }
  if (input.upgradeType) {
    body.upgradeType = input.upgradeType;
  }
  if (input.changes) {
    body.changes = input.changes;
  }
  const res = await POST('/ncnb/hisProject/syncSql', body);
  if (!res || res.code !== 200) {
    throw new Error(res?.msg || res?.message || `version sync SQL failed (${res?.code ?? 'no response'})`);
  }
  const data = res.data || {};
  return {
    sql: typeof data.sql === 'string' ? data.sql : '',
  };
}

/** @deprecated 使用 fetchVersionPanelDiff */
export async function fetchVersionStructuralDiff(
  input: Parameters<typeof fetchVersionPanelDiff>[0],
): Promise<VersionDiffResponse> {
  return fetchVersionPanelDiff(input);
}
