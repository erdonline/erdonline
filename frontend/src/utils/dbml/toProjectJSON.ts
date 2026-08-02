/**
 * DBML → projectJSON 纯映射（Table / fields / Ref→FK / note→chnname）。
 * @dbml/core 经 dynamic import 懒加载，避免设计器首屏打包体积膨胀。
 */

export type ProjectJsonField = {
  name: string;
  chnname: string;
  type: string;
  pk: boolean;
  notNull: boolean;
  autoIncrement: boolean;
};

export type ProjectJsonEntity = {
  title: string;
  name: string;
  chnname: string;
  fields: ProjectJsonField[];
};

export type ProjectJsonAssociation = {
  relation: '1:1' | '1:n' | 'n:n';
  from: { entity: string; field: string };
  to: { entity: string; field: string };
};

export type ProjectJsonModule = {
  name: string;
  chnname: string;
  entities: ProjectJsonEntity[];
  associations: ProjectJsonAssociation[];
  graphCanvas: {
    nodes: Array<{ id: string; x: number; y: number }>;
    edges: unknown[];
  };
};

export type DbmlProjectJSON = {
  modules: ProjectJsonModule[];
  profile: { defaultFields: unknown[]; dbs: unknown[] };
  dataTypeDomains: { datatype: unknown[]; database: unknown[] };
};

type DbmlType = {
  type_name?: string;
  args?: string | null;
};

type DbmlField = {
  name: string;
  type?: DbmlType;
  pk?: boolean;
  not_null?: boolean;
  increment?: boolean;
  note?: string | null;
};

type DbmlTable = {
  name: string;
  note?: string | null;
  fields?: DbmlField[];
};

type DbmlEndpoint = {
  tableName: string;
  fieldNames?: string[];
  relation?: string;
};

type DbmlRef = {
  endpoints?: DbmlEndpoint[];
};

type DbmlSchema = {
  tables?: DbmlTable[];
  refs?: DbmlRef[];
};

type DbmlDatabase = {
  name?: string;
  note?: string | null;
  schemas?: DbmlSchema[];
};

/** 物理类型 → 逻辑 type code（薄映射；未知回落 String） */
export function mapDbmlTypeName(typeName: string | undefined): string {
  const t = String(typeName || '')
    .toLowerCase()
    .replace(/\s+/g, '');
  if (!t) return 'String';
  if (t.includes('bigint') || t === 'int8') return 'BigInt';
  if (
    t.includes('int') ||
    t === 'serial' ||
    t === 'smallserial' ||
    t === 'bigserial' ||
    t === 'smallint' ||
    t === 'tinyint'
  ) {
    return 'Integer';
  }
  if (
    t.includes('double') ||
    t.includes('float') ||
    t.includes('real') ||
    t.includes('decimal') ||
    t.includes('numeric') ||
    t.includes('money')
  ) {
    return 'Double';
  }
  if (t.includes('bool')) return 'YesNo';
  if (t.includes('timestamp') || t.includes('datetime')) return 'DateTime';
  if (t === 'date') return 'Date';
  if (t === 'uuid' || t === 'uniqueidentifier') return 'IdOrKey';
  if (
    t.includes('char') ||
    t.includes('text') ||
    t.includes('varchar') ||
    t.includes('string') ||
    t.includes('clob')
  ) {
    return 'String';
  }
  return 'String';
}

function noteToChnname(note: string | null | undefined): string {
  if (note == null) return '';
  const s = String(note).trim();
  return s;
}

function sanitizeModuleName(raw: string | undefined): string {
  const base = String(raw || 'DBML')
    .trim()
    .replace(/[^\w\u4e00-\u9fff.-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return base || 'DBML';
}

function relationCode(a: string | undefined, b: string | undefined): '1:1' | '1:n' | 'n:n' {
  const left = a === '1' || a === '|' ? '1' : '*';
  const right = b === '1' || b === '|' ? '1' : '*';
  if (left === '1' && right === '1') return '1:1';
  if (left === '*' && right === '*') return 'n:n';
  return '1:n';
}

function mapField(field: DbmlField): ProjectJsonField {
  const pk = Boolean(field.pk);
  return {
    name: field.name,
    chnname: noteToChnname(field.note),
    type: mapDbmlTypeName(field.type?.type_name),
    pk,
    notNull: pk || Boolean(field.not_null),
    autoIncrement: Boolean(field.increment),
  };
}

function mapEntity(table: DbmlTable): ProjectJsonEntity {
  return {
    title: table.name,
    name: table.name,
    chnname: noteToChnname(table.note),
    fields: (table.fields || []).map(mapField),
  };
}

function mapAssociation(ref: DbmlRef): ProjectJsonAssociation | null {
  const eps = ref.endpoints || [];
  if (eps.length < 2) return null;
  const [epA, epB] = eps;
  const fieldA = epA.fieldNames?.[0];
  const fieldB = epB.fieldNames?.[0];
  if (!epA.tableName || !epB.tableName || !fieldA || !fieldB) return null;

  // projectJSON：from = 多端（持 FK），to = 一端（被引用）
  const aMany = epA.relation === '*' || epA.relation === '>';
  const bMany = epB.relation === '*' || epB.relation === '>';
  let from = epA;
  let to = epB;
  let fromField = fieldA;
  let toField = fieldB;
  if (aMany && !bMany) {
    from = epA;
    to = epB;
    fromField = fieldA;
    toField = fieldB;
  } else if (bMany && !aMany) {
    from = epB;
    to = epA;
    fromField = fieldB;
    toField = fieldA;
  }

  return {
    relation: relationCode(epA.relation, epB.relation),
    from: { entity: from.tableName, field: fromField },
    to: { entity: to.tableName, field: toField },
  };
}

function layoutNodes(entities: ProjectJsonEntity[]) {
  const COLS = 3;
  const DX = 280;
  const DY = 220;
  return entities.map((e, i) => ({
    id: e.title,
    x: 80 + (i % COLS) * DX,
    y: 80 + Math.floor(i / COLS) * DY,
  }));
}

/** 将已解析的 Database 对象映射为 projectJSON（供单测注入假对象） */
export function databaseToProjectJSON(database: DbmlDatabase): DbmlProjectJSON {
  const schemas = database.schemas || [];
  const tables: DbmlTable[] = [];
  const refs: DbmlRef[] = [];
  for (const schema of schemas) {
    for (const t of schema.tables || []) tables.push(t);
    for (const r of schema.refs || []) refs.push(r);
  }

  const entities = tables.map(mapEntity);
  const associations = refs
    .map(mapAssociation)
    .filter((a): a is ProjectJsonAssociation => a != null);

  const moduleName = sanitizeModuleName(database.name);
  const moduleChn = noteToChnname(database.note) || 'DBML导入';

  const mod: ProjectJsonModule = {
    name: moduleName,
    chnname: moduleChn,
    entities,
    associations,
    graphCanvas: {
      nodes: layoutNodes(entities),
      edges: [],
    },
  };

  return {
    modules: [mod],
    profile: { defaultFields: [], dbs: [] },
    dataTypeDomains: { datatype: [], database: [] },
  };
}

/**
 * 解析 DBML 文本 → projectJSON。
 * 懒加载 `@dbml/core`；解析失败抛 Error（message 可读）。
 */
export async function dbmlToProjectJSON(dbmlText: string): Promise<DbmlProjectJSON> {
  const text = String(dbmlText || '').trim();
  if (!text) {
    throw new Error('DBML 内容为空');
  }
  const { Parser } = await import('@dbml/core');
  let database: DbmlDatabase;
  try {
    database = Parser.parse(text, 'dbml') as DbmlDatabase;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`DBML 解析失败：${msg}`);
  }
  const result = databaseToProjectJSON(database);
  const entityCount = result.modules[0]?.entities?.length ?? 0;
  if (entityCount <= 0) {
    throw new Error('DBML 中未找到任何表');
  }
  return result;
}
