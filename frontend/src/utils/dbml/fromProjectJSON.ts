/**
 * projectJSON → DBML 纯映射（Table / fields / associations→Ref / chnname→note / indexs→Indexes / defaultValue→default）。
 * 与 toProjectJSON 同范围：不映射 enum / trigger。
 */

import type {
  ProjectJsonAssociation,
  ProjectJsonEntity,
  ProjectJsonField,
  ProjectJsonIndex,
  ProjectJsonModule,
} from './toProjectJSON';

export type ProjectJsonLike = {
  modules?: ProjectJsonModule[];
};

/** 逻辑 type code → DBML 物理类型（薄反查；未知回落 varchar） */
export function mapLogicalTypeToDbml(typeCode: string | undefined): string {
  const t = String(typeCode || '').trim();
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

function formatField(field: ProjectJsonField): string {
  const type = mapLogicalTypeToDbml(field.type);
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

function formatIndex(index: ProjectJsonIndex): string | null {
  const fields = (index.fields || [])
    .map((f) => String(f || '').trim())
    .filter(Boolean);
  if (fields.length === 0) return null;
  const cols = fields.map(quoteIdent).join(', ');
  const settings: string[] = [];
  const name = String(index.name || '').trim();
  if (name) settings.push(`name: '${escapeNote(name)}'`);
  if (index.isUnique) settings.push('unique');
  if (settings.length === 0) return `    (${cols})`;
  return `    (${cols}) [${settings.join(', ')}]`;
}

function formatTable(entity: ProjectJsonEntity): string {
  const title = quoteIdent(entity.title || entity.name);
  const lines = [`Table ${title} {`];
  for (const f of entity.fields || []) {
    lines.push(formatField(f));
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

function refOperator(relation: ProjectJsonAssociation['relation']): string {
  if (relation === '1:1') return '-';
  if (relation === 'n:n') return '<>';
  return '>';
}

function formatRef(assoc: ProjectJsonAssociation): string {
  const fromE = quoteIdent(assoc.from.entity);
  const fromF = quoteIdent(assoc.from.field);
  const toE = quoteIdent(assoc.to.entity);
  const toF = quoteIdent(assoc.to.field);
  const op = refOperator(assoc.relation);
  return `Ref: ${fromE}.${fromF} ${op} ${toE}.${toF}`;
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
 * 空表模块抛错。
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

  for (const entity of entities) {
    parts.push(formatTable(entity));
    parts.push('');
  }

  const associations = mod.associations || [];
  for (const assoc of associations) {
    if (!assoc?.from?.entity || !assoc?.from?.field) continue;
    if (!assoc?.to?.entity || !assoc?.to?.field) continue;
    parts.push(formatRef(assoc));
  }

  return parts.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
