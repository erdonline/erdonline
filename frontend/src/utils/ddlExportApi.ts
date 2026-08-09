/**
 * 项目 DDL 导出 / 单表预览 — 后端 Freemarker 权威（Json2CodeFullDdlEngine / Json2CodeTableDdlEngine）。
 * 产品路径禁止再调用前端 json2code 本地渲染。
 */
import { POST } from '@/services/crud';
import * as cache from '@/utils/cache';
import { CONSTANT } from '@/utils/constant';
import { SNAPSHOT_DB_KEY } from '@/utils/versionConstants';
import type { VersionDiffChange } from '@/utils/versionDiffApi';

export type ExportDdlFilterKey =
  | 'deleteTable'
  | 'createTable'
  | 'createIndex'
  | 'createTrigger'
  | 'createForeignKey'
  | 'updateComment';

export const EXPORT_DDL_ALL_SEGMENTS: ExportDdlFilterKey[] = [
  'deleteTable',
  'createTable',
  'createIndex',
  'createTrigger',
  'createForeignKey',
  'updateComment',
];

export type DdlSqlResponse = {
  sql: string;
};

export async function fetchExportDdl(input: {
  projectJSON: Record<string, unknown>;
  dialectCode?: string;
  filter?: ExportDdlFilterKey[];
  entityTitles?: string[];
  projectId?: string;
  dbKey?: string;
}): Promise<DdlSqlResponse> {
  const projectId = input.projectId || cache.getItem(CONSTANT.PROJECT_ID);
  if (!projectId) {
    throw new Error('projectId is required for export DDL');
  }
  const dbKey = input.dbKey || SNAPSHOT_DB_KEY;
  const body: Record<string, unknown> = {
    projectId,
    dbKey,
    projectJSON: input.projectJSON,
    dialectCode: input.dialectCode || 'MYSQL',
  };
  if (input.filter?.length) {
    body.filter = input.filter;
  }
  if (input.entityTitles?.length) {
    body.entityTitles = input.entityTitles;
  }
  const res = await POST('/ncnb/hisProject/exportDdl', body);
  if (!res || res.code !== 200) {
    throw new Error(res?.msg || res?.message || `export DDL failed (${res?.code ?? 'no response'})`);
  }
  const data = res.data || {};
  return {
    sql: typeof data.sql === 'string' ? data.sql : '',
  };
}

export async function fetchTableDdl(input: {
  projectJSON: Record<string, unknown>;
  dialectCode: string;
  templateKey: string;
  entityTitle: string;
  baselineProjectJSON?: Record<string, unknown>;
  changes?: VersionDiffChange[];
  projectId?: string;
  dbKey?: string;
}): Promise<DdlSqlResponse> {
  const projectId = input.projectId || cache.getItem(CONSTANT.PROJECT_ID);
  if (!projectId) {
    throw new Error('projectId is required for table DDL');
  }
  const dbKey = input.dbKey || SNAPSHOT_DB_KEY;
  const body: Record<string, unknown> = {
    projectId,
    dbKey,
    projectJSON: input.projectJSON,
    dialectCode: input.dialectCode,
    templateKey: input.templateKey,
    entityTitle: input.entityTitle,
  };
  if (input.baselineProjectJSON) {
    body.baselineProjectJSON = input.baselineProjectJSON;
  }
  if (input.changes?.length) {
    body.changes = input.changes;
  }
  const res = await POST('/ncnb/hisProject/tableDdl', body);
  if (!res || res.code !== 200) {
    throw new Error(res?.msg || res?.message || `table DDL failed (${res?.code ?? 'no response'})`);
  }
  const data = res.data || {};
  return {
    sql: typeof data.sql === 'string' ? data.sql : '',
  };
}
