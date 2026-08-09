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
  return code.toUpperCase() !== 'JAVA';
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
