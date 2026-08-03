/**
 * projectJSON → DBML 纯映射（Table / fields / associations→Ref / chnname→note /
 * indexs→Indexes / defaultValue→default / dataTypeDomains enum→Enum）。
 * 与 toProjectJSON 同范围：不映射 trigger。
 */

import type {
  ProjectJsonAssociation,
  ProjectJsonDatatype,
  ProjectJsonEntity,
  ProjectJsonEnumValue,
  ProjectJsonField,
  ProjectJsonIndex,
  ProjectJsonModule,
} from './toProjectJSON';

export type ProjectJsonLike = {
  modules?: ProjectJsonModule[];
  dataTypeDomains?: {
    datatype?: ProjectJsonDatatype[];
    database?: unknown[];
  };
};

function isEnumDatatype(dt: ProjectJsonDatatype | undefined): dt is ProjectJsonDatatype {
  if (!dt || !String(dt.code || '').trim()) return false;
  if (dt.kind === 'enum') return true;
  return Array.isArray(dt.values) && dt.values.length > 0;
}

/** 逻辑 type code → DBML 物理类型（枚举优先；薄反查；未知回落 varchar） */
export function mapLogicalTypeToDbml(
  typeCode: string | undefined,
  options?: { enumCodes?: Set<string> },
): string {
  const t = String(typeCode || '').trim();
  if (t && options?.enumCodes?.has(t)) {
    return quoteIdent(t);
  }
  switch (t) {
    case 'BigInt':
      return 'bigint';
    case 'Integer':
      return 'integer';
    case 'Double':
      return 'double';
    case 'YesNo':
      return 'boolean';
    case 'DateTime':
      return 'timestamp';
    case 'Date':
      return 'date';
    case 'IdOrKey':
      return 'uuid';
    case 'String':
      return 'varchar';
    default:
      return 'varchar';
  }
}

function escapeNote(note: string): string {
  return note.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function quoteIdent(name: string): string {
  const s = String(name || '').trim();
  if (!s) return '""';
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(s)) return s;
  return `"${s.replace(/"/g, '\\"')}"`;
}

function formatNoteAttr(chnname: string | undefined): string | null {
  const n = String(chnname || '').trim();
  if (!n) return null;
  return `note: '${escapeNote(n)}'`;
}

/** projectJSON defaultValue → DBML `[default: …]` 片段（不含方括号） */
export function formatDefaultAttr(defaultValue: string | undefined): string | null {
  const raw = String(defaultValue || '').trim();
  if (!raw) return null;
  // 字符串字面量 '…' / "…"
  const single = raw.match(/^'(.*)'$/s);
  if (single) {
    return `default: '${escapeNote(single[1])}'`;
  }
  const dbl = raw.match(/^"(.*)"$/s);
  if (dbl) {
    return `default: '${escapeNote(dbl[1])}'`;
  }
  if (/^(TRUE|FALSE|NULL)$/i.test(raw)) {
    return `default: ${raw.toUpperCase()}`;
  }
  if (/^-?\d+(\.\d+)?$/.test(raw)) {
    return `default: ${raw}`;
  }
  // 表达式：DBML 反引号
  const expr = raw.replace(/`/g, '');
  return `default: \`${expr}\``;
}

function formatField(
  field: ProjectJsonField,
  enumCodes: Set<string>,
): string {
  const type = mapLogicalTypeToDbml(field.type, { enumCodes });
  const settings: string[] = [];
  if (field.pk) settings.push('pk');
  if (field.autoIncrement) settings.push('increment');
  if (field.notNull) settings.push('not null');
  const def = formatDefaultAttr(field.defaultValue);
  if (def) settings.push(def);
  const note = formatNoteAttr(field.chnname);
  if (note) settings.push(note);
  const name = quoteIdent(field.name);
  if (settings.length === 0) return `  ${name} ${type}`;
  return `  ${name} ${type} [${settings.join(', ')}]`;
}

/** 纯列 ident → quoteIdent；含函数/运算等 → DBML 反引号表达式 */
export function formatIndexColumn(field: string): string {
  const raw = String(field || '').trim();
  if (!raw) return '""';
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(raw)) {
    return quoteIdent(raw);
  }
  // 已是 `"ident"` 的特殊列名，仍按 ident 引用
  if (/^"[^"]+"$/.test(raw)) {
    return raw;
  }
  const expr = raw.replace(/`/g, '');
  return `\`${expr}\``;
}

/** index.filter → DBML note 约定（@dbml/core 拒 where:） */
export function formatIndexFilterNote(
  filter: string | undefined | null,
): string | null {
  const pred = String(filter || '').trim();
  if (!pred) return null;
  return `note: 'filter: ${escapeNote(pred)}'`;
}

function formatIndex(index: ProjectJsonIndex): string | null {
  const fields = (index.fields || [])
    .map((f) => String(f || '').trim())
    .filter(Boolean);
  if (fields.length === 0) return null;
  const cols = fields.map(formatIndexColumn).join(', ');
  const settings: string[] = [];
  const name = String(index.name || '').trim();
  if (name) settings.push(`name: '${escapeNote(name)}'`);
  if (index.isUnique) settings.push('unique');
  const filterNote = formatIndexFilterNote(index.filter);
  if (filterNote) settings.push(filterNote);
  if (settings.length === 0) return `    (${cols})`;
  return `    (${cols}) [${settings.join(', ')}]`;
}

function formatTable(entity: ProjectJsonEntity, enumCodes: Set<string>): string {
  const title = quoteIdent(entity.title || entity.name);
  const lines = [`Table ${title} {`];
  for (const f of entity.fields || []) {
    lines.push(formatField(f, enumCodes));
  }
  const indexLines = (entity.indexs || [])
    .map(formatIndex)
    .filter((line): line is string => line != null);
  if (indexLines.length > 0) {
    lines.push('  indexes {');
    lines.push(...indexLines);
    lines.push('  }');
  }
  const tableNote = String(entity.chnname || '').trim();
  if (tableNote) {
    lines.push(`  Note: '${escapeNote(tableNote)}'`);
  }
  lines.push('}');
  return lines.join('\n');
}

function formatEnumValue(value: ProjectJsonEnumValue): string {
  const name = quoteIdent(value.name);
  const note = formatNoteAttr(value.chnname);
  if (note) return `  ${name} [${note}]`;
  return `  ${name}`;
}

/** dataTypeDomains.datatype (kind=enum) → DBML Enum 块 */
export function formatEnum(dt: ProjectJsonDatatype): string | null {
  const code = String(dt.code || '').trim();
  if (!code) return null;
  const values = (dt.values || [])
    .map((v) => ({
      name: String(v?.name || '').trim(),
      chnname: v?.chnname,
    }))
    .filter((v) => v.name);
  const lines = [`Enum ${quoteIdent(code)} {`];
  for (const v of values) {
    lines.push(formatEnumValue(v));
  }
  lines.push('}');
  return lines.join('\n');
}

function refOperator(relation: ProjectJsonAssociation['relation']): string {
  if (relation === '1:1') return '-';
  if (relation === 'n:n') return '<>';
  // n:1 与 1:n 在 DBML 均用 >；方向由 from/to 表字段表达
  return '>';
}

/** projectJSON 大写规则 → DBML 小写 settings */
export function formatDbmlRefRule(raw: string | undefined): string | undefined {
  const s = String(raw || '').trim().toUpperCase().replace(/\s+/g, ' ');
  if (!s) return undefined;
  switch (s) {
    case 'CASCADE':
      return 'cascade';
    case 'SET NULL':
      return 'set null';
    case 'SET DEFAULT':
      return 'set default';
    case 'RESTRICT':
      return 'restrict';
    case 'NO ACTION':
      return 'no action';
    default:
      return undefined;
  }
}

type DbmlRefGroup = {
  relation: ProjectJsonAssociation['relation'];
  fromEntity: string;
  toEntity: string;
  fromFields: string[];
  toFields: string[];
  constraintName?: string;
  deleteRule?: string;
  updateRule?: string;
};

/** 同 constraintName + 表对聚合为复合 Ref（官方 syntax；不污染 Note） */
export function groupAssociationsForDbmlRef(
  associations: ProjectJsonAssociation[] | undefined | null,
): DbmlRefGroup[] {
  const groups: DbmlRefGroup[] = [];
  const namedIndex = new Map<string, number>();
  for (const assoc of associations || []) {
    if (!assoc?.from?.entity || !assoc?.from?.field) continue;
    if (!assoc?.to?.entity || !assoc?.to?.field) continue;
    const fromEntity = assoc.from.entity;
    const toEntity = assoc.to.entity;
    const fromField = assoc.from.field;
    const toField = assoc.to.field;
    const cName = String(assoc.constraintName || '').trim();
    if (cName) {
      const key = `${cName}\0${fromEntity}\0${toEntity}`;
      const idx = namedIndex.get(key);
      if (idx != null) {
        const g = groups[idx];
        if (!g.fromFields.includes(fromField)) g.fromFields.push(fromField);
        if (!g.toFields.includes(toField)) g.toFields.push(toField);
        if (!g.deleteRule && assoc.deleteRule) g.deleteRule = assoc.deleteRule;
        if (!g.updateRule && assoc.updateRule) g.updateRule = assoc.updateRule;
        continue;
      }
      namedIndex.set(key, groups.length);
      groups.push({
        relation: assoc.relation,
        fromEntity,
        toEntity,
        fromFields: [fromField],
        toFields: [toField],
        constraintName: cName,
        ...(assoc.deleteRule ? { deleteRule: assoc.deleteRule } : {}),
        ...(assoc.updateRule ? { updateRule: assoc.updateRule } : {}),
      });
      continue;
    }
    groups.push({
      relation: assoc.relation,
      fromEntity,
      toEntity,
      fromFields: [fromField],
      toFields: [toField],
      ...(assoc.deleteRule ? { deleteRule: assoc.deleteRule } : {}),
      ...(assoc.updateRule ? { updateRule: assoc.updateRule } : {}),
    });
  }
  return groups;
}

function formatRefEndpoint(entity: string, fields: string[]): string {
  const e = quoteIdent(entity);
  if (fields.length === 1) {
    return `${e}.${quoteIdent(fields[0])}`;
  }
  return `${e}.(${fields.map((f) => quoteIdent(f)).join(', ')})`;
}

function formatRef(group: DbmlRefGroup): string {
  const op = refOperator(group.relation);
  const left = formatRefEndpoint(group.fromEntity, group.fromFields);
  const right = formatRefEndpoint(group.toEntity, group.toFields);
  const name = String(group.constraintName || '').trim();
  const head = name ? `Ref ${quoteIdent(name)}: ` : 'Ref: ';
  const settings: string[] = [];
  const del = formatDbmlRefRule(group.deleteRule);
  const upd = formatDbmlRefRule(group.updateRule);
  if (del) settings.push(`delete: ${del}`);
  if (upd) settings.push(`update: ${upd}`);
  const tail = settings.length > 0 ? ` [${settings.join(', ')}]` : '';
  return `${head}${left} ${op} ${right}${tail}`;
}

function pickModule(
  modules: ProjectJsonModule[],
  moduleName?: string,
): ProjectJsonModule {
  if (moduleName) {
    const found = modules.find((m) => m.name === moduleName);
    if (!found) {
      throw new Error(`未找到模型「${moduleName}」`);
    }
    return found;
  }
  const withEntities = modules.find(
    (m) => Array.isArray(m.entities) && m.entities.length > 0,
  );
  if (withEntities) return withEntities;
  if (modules[0]) return modules[0];
  throw new Error('项目中没有任何模型');
}

/**
 * 将单个模块（或按名选取）导出为 DBML 文本。
 * 空表模块抛错。Enum 取自 projectJSON.dataTypeDomains.datatype（kind=enum / values[]）。
 */
export function projectJSONToDbml(
  projectJSON: ProjectJsonLike,
  options?: { moduleName?: string },
): string {
  const modules = projectJSON?.modules || [];
  if (modules.length <= 0) {
    throw new Error('项目中没有任何模型');
  }
  const mod = pickModule(modules, options?.moduleName);
  const entities = mod.entities || [];
  if (entities.length <= 0) {
    throw new Error(`模型「${mod.name || '未命名'}」中没有表可导出`);
  }

  const datatype = projectJSON?.dataTypeDomains?.datatype || [];
  const enumDatatypes = datatype.filter(isEnumDatatype);
  const enumCodes = new Set(enumDatatypes.map((d) => String(d.code).trim()));

  const projectName = quoteIdent(mod.name || 'ERD');
  const projectNote = String(mod.chnname || '').trim();
  const parts: string[] = [];
  parts.push(`Project ${projectName} {`);
  parts.push(`  database_type: 'MySQL'`);
  if (projectNote) {
    parts.push(`  Note: '${escapeNote(projectNote)}'`);
  }
  parts.push('}');
  parts.push('');

  for (const dt of enumDatatypes) {
    const block = formatEnum(dt);
    if (block) {
      parts.push(block);
      parts.push('');
    }
  }

  for (const entity of entities) {
    parts.push(formatTable(entity, enumCodes));
    parts.push('');
  }

  const associations = mod.associations || [];
  for (const group of groupAssociationsForDbmlRef(associations)) {
    parts.push(formatRef(group));
  }

  return parts.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
