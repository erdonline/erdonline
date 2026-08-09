/** 与 json2code.normalizeDialectCode 对齐；避免 ddlTemplateKeys ↔ json2code 环依赖 */
function normalizeDialectCodeLocal(code: string | undefined | null): string {
  return String(code || '')
    .toLowerCase()
    .replace(/[\s_-]/g, '');
}
export const PRODUCT_SQL_DIALECT_CODES = [
  'MYSQL',
  'ORACLE',
  'PostgreSQL',
  'SQLServer',
] as const;

export type ProductSqlDialectCode = (typeof PRODUCT_SQL_DIALECT_CODES)[number];

/** projectJSON.dataTypeDomains.database[] DDL 模板字段（与后端 DdlTemplateKeys 对齐） */
export const DDL_TEMPLATE_KEYS = [
  'createTableTemplate',
  'updateTableComment',
  'deleteTableTemplate',
  'createIndexTemplate',
  'rebuildTableTemplate',
  'createFieldTemplate',
  'updateFieldTemplate',
  'deleteFieldTemplate',
  'deleteIndexTemplate',
  'createPkTemplate',
  'deletePkTemplate',
] as const;

export type DdlTemplateKey = (typeof DDL_TEMPLATE_KEYS)[number];

export const DDL_TEMPLATE_LABELS: Record<DdlTemplateKey, string> = {
  createTableTemplate: '创建表',
  updateTableComment: '表注释',
  deleteTableTemplate: '删除表',
  createIndexTemplate: '创建索引',
  rebuildTableTemplate: '重建表',
  createFieldTemplate: '添加字段',
  updateFieldTemplate: '修改字段',
  deleteFieldTemplate: '删除字段',
  deleteIndexTemplate: '删除索引',
  createPkTemplate: '创建主键',
  deletePkTemplate: '删除主键',
};

/** 非 SQL 方言（如 JAVA 实体生成）不在 DDL 模板页编辑 */
export function isSqlDialect(code: string | undefined): boolean {
  if (!code) {
    return false;
  }
  const norm = normalizeDialectCodeLocal(code);
  return norm !== 'java' && norm !== 'vr';
}

/** DDL 模板方言下拉：产品 P0 全集 + 项目 database[] 中其它 SQL 方言（去重、保序） */
export function listDdlTemplateDialectCodes(
  databaseRows: Array<{ code?: string }>,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (code: string | undefined) => {
    if (!code || !isSqlDialect(code)) {
      return;
    }
    const norm = normalizeDialectCodeLocal(code);
    if (seen.has(norm)) {
      return;
    }
    seen.add(norm);
    out.push(code);
  };
  for (const code of PRODUCT_SQL_DIALECT_CODES) {
    push(code);
  }
  for (const row of databaseRows) {
    push(row.code);
  }
  return out;
}

export function findDatabaseDialectRow<T extends { code?: string }>(
  databaseRows: T[],
  code: string | undefined,
): T | undefined {
  if (!code) {
    return undefined;
  }
  const norm = normalizeDialectCodeLocal(code);
  return databaseRows.find(
    (row) => row.code && normalizeDialectCodeLocal(row.code) === norm,
  );
}

export function emptyDatabaseDialectRow(code: string): { code: string; fileShow: boolean } {
  return { code, fileShow: true };
}

export function hasStoredTemplate(
  row: { [key: string]: unknown } | undefined | null,
  key: DdlTemplateKey,
): boolean {
  const val = row?.[key];
  return typeof val === 'string' && val.trim().length > 0;
}

/** 预览/渲染：仅含已落盘或用户已编辑的模板键；其余走后端 classpath seed */
export function buildPreviewDatabaseRow(input: {
  code: string;
  stored?: Partial<Record<DdlTemplateKey, string>> & {
    defaultDatabase?: boolean;
    fileShow?: boolean;
  } | null;
  overrides: Partial<Record<DdlTemplateKey, string>>;
  meta: { defaultDatabase?: boolean; fileShow?: boolean };
}): Record<string, unknown> {
  const row: Record<string, unknown> = {
    code: input.code,
    fileShow: input.meta.fileShow ?? input.stored?.fileShow ?? true,
  };
  if (input.meta.defaultDatabase ?? input.stored?.defaultDatabase) {
    row.defaultDatabase = true;
  }
  for (const key of DDL_TEMPLATE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(input.overrides, key)) {
      row[key] = input.overrides[key] ?? '';
    } else if (hasStoredTemplate(input.stored, key)) {
      row[key] = input.stored![key];
    }
  }
  return row;
}

/** 保存：仅合并 meta + 已编辑键 + 保留其它已落盘 custom 键 */
export function buildSaveDatabaseDialectPayload(input: {
  code: string;
  stored?: Partial<Record<DdlTemplateKey, string>> & {
    defaultDatabase?: boolean;
    fileShow?: boolean;
  } | null;
  overrides: Partial<Record<DdlTemplateKey, string>>;
  meta: { defaultDatabase?: boolean; fileShow?: boolean };
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    code: input.code,
    fileShow: input.meta.fileShow ?? input.stored?.fileShow ?? true,
  };
  if (input.meta.defaultDatabase) {
    payload.defaultDatabase = true;
  }
  for (const key of DDL_TEMPLATE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(input.overrides, key)) {
      const trimmed = String(input.overrides[key] ?? '').trim();
      if (trimmed) {
        payload[key] = trimmed;
      }
    } else if (hasStoredTemplate(input.stored, key)) {
      payload[key] = input.stored![key];
    }
  }
  return payload;
}

export function editorModeForDialect(code: string): string {
  const norm = code.toLowerCase();
  if (norm.includes('postgres') || norm === 'pg') {
    return 'pgsql';
  }
  if (norm.includes('oracle')) {
    return 'sql';
  }
  if (norm.includes('sqlserver') || norm === 'mssql') {
    return 'sqlserver';
  }
  return 'mysql';
}
