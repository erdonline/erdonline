/**
 * DBML → projectJSON 纯映射（Table / fields / Ref→FK / note→chnname / Indexes→indexs /
 * default→defaultValue / Enum→dataTypeDomains.datatype kind=enum）。
 * @dbml/core 经 dynamic import 懒加载，避免设计器首屏打包体积膨胀。
 * 布局坐标走共享 dagre（ADR-0016）；写入 diagrams[0]（ADR-0017），同步 graphCanvas 供旧读路径。
 */

import { DEFAULT_DIAGRAM_ID, DEFAULT_DIAGRAM_NAME } from '../diagram';
import { graphCanvasNodesFromDagre } from '../graphLayout';
import { suggestImportFrames } from '../suggestImportFrames';

export type ProjectJsonField = {
  name: string;
  chnname: string;
  type: string;
  pk: boolean;
  notNull: boolean;
  autoIncrement: boolean;
  /** 默认值；字符串字面量带单引号（如 `'pending'`），表达式/数字原样 */
  defaultValue?: string;
};

export type ProjectJsonIndex = {
  name: string;
  isUnique: boolean;
  /** 列名或索引表达式（如 `LOWER(email)`）；顺序即索引列序 */
  fields: string[];
};

export type ProjectJsonEntity = {
  title: string;
  name: string;
  chnname: string;
  fields: ProjectJsonField[];
  indexs: ProjectJsonIndex[];
};

export type ProjectJsonAssociation = {
  relation: '1:1' | '1:n' | 'n:1' | 'n:n';
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
  diagrams: Array<{
    id: string;
    name: string;
    layout: { nodes: Array<{ id: string; x: number; y: number }> };
    groups?: Array<{
      id: string;
      name: string;
      color?: string;
      x: number;
      y: number;
      w: number;
      h: number;
      memberEntityIds: string[];
    }>;
  }>;
};

/** DBML Enum 值 → datatype.values[] */
export type ProjectJsonEnumValue = {
  name: string;
  /** 来自 DBML value `[note: …]`；无 note 时省略 */
  chnname?: string;
};

/** dataTypeDomains.datatype 项；`kind:'enum'` 为 DBML Enum 往返载体 */
export type ProjectJsonDatatype = {
  name: string;
  code: string;
  kind?: 'enum';
  values?: ProjectJsonEnumValue[];
  apply?: Record<string, { type?: string; [key: string]: unknown }>;
};

export type DbmlProjectJSON = {
  modules: ProjectJsonModule[];
  profile: { defaultFields: unknown[]; dbs: unknown[] };
  dataTypeDomains: { datatype: ProjectJsonDatatype[]; database: unknown[] };
};

type DbmlType = {
  type_name?: string;
  args?: string | null;
};

type DbmlDefault = {
  type?: string;
  value?: string | number | boolean | null;
};

type DbmlField = {
  name: string;
  type?: DbmlType;
  pk?: boolean;
  not_null?: boolean;
  increment?: boolean;
  note?: string | null;
  dbdefault?: DbmlDefault | null;
  /** @dbml/core 解析后指向同名 Enum（若有） */
  _enum?: { name?: string } | null;
};

type DbmlEnumValue = {
  name: string;
  note?: string | null;
};

type DbmlEnum = {
  name: string;
  note?: string | null;
  values?: DbmlEnumValue[];
};

type DbmlIndexColumn = {
  type?: string;
  value?: string;
};

type DbmlIndex = {
  name?: string | null;
  unique?: boolean;
  pk?: boolean;
  columns?: DbmlIndexColumn[];
};

type DbmlTable = {
  name: string;
  note?: string | null;
  fields?: DbmlField[];
  indexes?: DbmlIndex[];
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
  enums?: DbmlEnum[];
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

function relationCode(a: string | undefined, b: string | undefined): '1:1' | '1:n' | 'n:1' | 'n:n' {
  const left = a === '1' || a === '|' ? '1' : '*';
  const right = b === '1' || b === '|' ? '1' : '*';
  if (left === '1' && right === '1') return '1:1';
  if (left === '*' && right === '*') return 'n:n';
  if (left === '*' && right === '1') return 'n:1';
  return '1:n';
}

/** DBML dbdefault → projectJSON defaultValue（对齐 DDL 模板约定） */
export function mapDbmlDefault(dbdefault: DbmlDefault | null | undefined): string | undefined {
  if (dbdefault == null || dbdefault.value === undefined || dbdefault.value === null) {
    return undefined;
  }
  const kind = String(dbdefault.type || '').toLowerCase();
  const raw = dbdefault.value;
  if (kind === 'string') {
    const s = String(raw).replace(/'/g, "''");
    return `'${s}'`;
  }
  if (kind === 'number') {
    return String(raw);
  }
  if (kind === 'boolean') {
    return raw === true || raw === 'true' ? 'TRUE' : 'FALSE';
  }
  // expression 及其它：原样（如 now() / CURRENT_TIMESTAMP）
  const expr = String(raw).trim();
  return expr || undefined;
}

/** Enum 值列表 → 各方言 apply（MySQL ENUM；PG 用类型名；其它回落字串） */
export function buildEnumApply(
  enumCode: string,
  valueNames: string[],
): NonNullable<ProjectJsonDatatype['apply']> {
  const quoted = valueNames
    .map((v) => `'${String(v).replace(/'/g, "''")}'`)
    .join(',');
  const mysqlEnum = `ENUM(${quoted})`;
  return {
    MYSQL: { type: mysqlEnum },
    PostgreSQL: { type: enumCode },
    ORACLE: { type: 'VARCHAR2(64)' },
    SQLServer: { type: 'NVARCHAR(64)' },
    JAVA: { type: 'String' },
  };
}

export function mapDbmlEnum(en: DbmlEnum): ProjectJsonDatatype | null {
  const code = String(en.name || '').trim();
  if (!code) return null;
  const values: ProjectJsonEnumValue[] = [];
  for (const v of en.values || []) {
    const name = String(v?.name || '').trim();
    if (!name) continue;
    const chnname = noteToChnname(v.note);
    if (chnname) {
      values.push({ name, chnname });
    } else {
      values.push({ name });
    }
  }
  // @dbml/core 9.x：Enum 级 Note / [note] 语法不解析；name 回落 code
  const display = noteToChnname(en.note) || code;
  return {
    name: display,
    code,
    kind: 'enum',
    values,
    apply: buildEnumApply(
      code,
      values.map((x) => x.name),
    ),
  };
}

function mapField(field: DbmlField, enumCodes: Set<string>): ProjectJsonField {
  const pk = Boolean(field.pk);
  const defaultValue = mapDbmlDefault(field.dbdefault);
  const typeName = String(field.type?.type_name || '').trim();
  const enumCode =
    (field._enum?.name && String(field._enum.name).trim()) ||
    (typeName && enumCodes.has(typeName) ? typeName : '');
  const mapped: ProjectJsonField = {
    name: field.name,
    chnname: noteToChnname(field.note),
    type: enumCode || mapDbmlTypeName(field.type?.type_name),
    pk,
    notNull: pk || Boolean(field.not_null),
    autoIncrement: Boolean(field.increment),
  };
  if (defaultValue !== undefined) {
    mapped.defaultValue = defaultValue;
  }
  return mapped;
}

function mapIndex(index: DbmlIndex, tableName: string): ProjectJsonIndex | null {
  // pk 索引由 fields[].pk 承接；列名与表达式均写入 fields[]（表达式原样字符串）
  if (index.pk) return null;
  const fields = (index.columns || [])
    .map((c) => String(c.value || '').trim())
    .filter(Boolean);
  if (fields.length === 0) return null;
  const rawName = String(index.name || '').trim();
  const name =
    rawName ||
    `idx_${tableName}_${fields.join('_')}`.replace(/[^\w.-]+/g, '_').slice(0, 64);
  return {
    name,
    isUnique: Boolean(index.unique),
    fields,
  };
}

function mapEntity(table: DbmlTable, enumCodes: Set<string>): ProjectJsonEntity {
  const indexs = (table.indexes || [])
    .map((ix) => mapIndex(ix, table.name))
    .filter((ix): ix is ProjectJsonIndex => ix != null);
  return {
    title: table.name,
    name: table.name,
    chnname: noteToChnname(table.note),
    fields: (table.fields || []).map((f) => mapField(f, enumCodes)),
    indexs,
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
    // 基数跟 from→to（多端→一端）对齐，勿用原始 endpoint 顺序
    relation: relationCode(from.relation, to.relation),
    from: { entity: from.tableName, field: fromField },
    to: { entity: to.tableName, field: toField },
  };
}

/** 将已解析的 Database 对象映射为 projectJSON（供单测注入假对象） */
export function databaseToProjectJSON(database: DbmlDatabase): DbmlProjectJSON {
  const schemas = database.schemas || [];
  const tables: DbmlTable[] = [];
  const refs: DbmlRef[] = [];
  const enums: DbmlEnum[] = [];
  for (const schema of schemas) {
    for (const t of schema.tables || []) tables.push(t);
    for (const r of schema.refs || []) refs.push(r);
    for (const e of schema.enums || []) enums.push(e);
  }

  const datatype = enums
    .map(mapDbmlEnum)
    .filter((d): d is ProjectJsonDatatype => d != null);
  const enumCodes = new Set(datatype.map((d) => d.code));

  const entities = tables.map((t) => mapEntity(t, enumCodes));
  const associations = refs
    .map(mapAssociation)
    .filter((a): a is ProjectJsonAssociation => a != null);

  const moduleName = sanitizeModuleName(database.name);
  const moduleChn = noteToChnname(database.note) || 'DBML导入';

  const layoutNodes = graphCanvasNodesFromDagre(entities, associations);
  const suggestedGroups = suggestImportFrames({
    entities,
    associations,
    layoutNodes,
  });
  const mod: ProjectJsonModule = {
    name: moduleName,
    chnname: moduleChn,
    entities,
    associations,
    graphCanvas: {
      nodes: layoutNodes,
      edges: [],
    },
    diagrams: [
      {
        id: DEFAULT_DIAGRAM_ID,
        name: DEFAULT_DIAGRAM_NAME,
        layout: { nodes: layoutNodes },
        ...(suggestedGroups.length > 0 ? { groups: suggestedGroups } : {}),
      },
    ],
  };

  return {
    modules: [mod],
    profile: { defaultFields: [], dbs: [] },
    dataTypeDomains: { datatype, database: [] },
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
