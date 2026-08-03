/**
 * 字段类型下拉：逻辑类型 vs kind=enum 分组，供画布 select / JExcel dropdown 共用。
 * 单元格存值约定：画布 = code；JExcel typeName 列 = name（onchange 再反查 code）。
 */

export type DataTypeDomainRow = {
  code?: string;
  name?: string;
  kind?: 'enum' | string;
};

/** 画布历史快捷码（部分不在默认字典）；补进「逻辑类型」以免 E2E/旧字段失选 */
export const FIELD_TYPE_LEGACY_CODES = [
  'IdOrKey',
  'String',
  'Integer',
  'Decimal',
  'Boolean',
  'DateTime',
  'Text',
] as const;

export const FIELD_TYPE_GROUP_LOGIC = '逻辑类型';
export const FIELD_TYPE_GROUP_ENUM = '枚举';

export type FieldTypeOption = {
  code: string;
  name: string;
  kind: 'logic' | 'enum';
};

export type FieldTypePartitions = {
  logic: FieldTypeOption[];
  enums: FieldTypeOption[];
  /** code → option（含逻辑+枚举） */
  byCode: Map<string, FieldTypeOption>;
};

function toOption(row: DataTypeDomainRow): FieldTypeOption | null {
  const code = (row.code || row.name || '').trim();
  if (!code) return null;
  const name = (row.name || row.code || code).trim() || code;
  return {
    code,
    name,
    kind: row.kind === 'enum' ? 'enum' : 'logic',
  };
}

/** 从 dataTypeDomains.datatype 拆分逻辑 / 枚举，并补齐遗留 code */
export function partitionFieldTypes(
  datatype: DataTypeDomainRow[] | undefined | null,
): FieldTypePartitions {
  const logic: FieldTypeOption[] = [];
  const enums: FieldTypeOption[] = [];
  const byCode = new Map<string, FieldTypeOption>();

  for (const row of datatype || []) {
    const opt = toOption(row);
    if (!opt || byCode.has(opt.code)) continue;
    byCode.set(opt.code, opt);
    if (opt.kind === 'enum') enums.push(opt);
    else logic.push(opt);
  }

  for (const code of FIELD_TYPE_LEGACY_CODES) {
    if (byCode.has(code)) continue;
    const opt: FieldTypeOption = { code, name: code, kind: 'logic' };
    byCode.set(code, opt);
    logic.push(opt);
  }

  return { logic, enums, byCode };
}

/** 画布 option 展示：优先 code；name 不同时附中文名 */
export function formatFieldTypeLabel(opt: FieldTypeOption): string {
  if (opt.name && opt.name !== opt.code) {
    return `${opt.code} · ${opt.name}`;
  }
  return opt.code;
}

/**
 * JExcel / jsuites dropdown source（id=name 保持既有 typeName 写回；group 渲染分组头）。
 */
export function jexcelTypeDropdownSource(
  datatype: DataTypeDomainRow[] | undefined | null,
): Array<{ id: string; name: string; group: string }> {
  const { logic, enums } = partitionFieldTypes(datatype);
  const items: Array<{ id: string; name: string; group: string }> = [];
  const seenName = new Set<string>();

  const push = (opt: FieldTypeOption, group: string) => {
    const id = opt.name || opt.code;
    if (!id || seenName.has(id)) return;
    seenName.add(id);
    items.push({ id, name: id, group });
  };

  for (const opt of logic) push(opt, FIELD_TYPE_GROUP_LOGIC);
  for (const opt of enums) push(opt, FIELD_TYPE_GROUP_ENUM);

  if (items.length === 0) {
    return FIELD_TYPE_LEGACY_CODES.map((code) => ({
      id: code,
      name: code,
      group: FIELD_TYPE_GROUP_LOGIC,
    }));
  }
  return items;
}

/** Handsontable 等无 group 时：枚举置顶并用前缀扫读（值仍是 name） */
export function flatTypeNamesPreferEnum(
  datatype: DataTypeDomainRow[] | undefined | null,
): string[] {
  const { logic, enums } = partitionFieldTypes(datatype);
  const names: string[] = [];
  const seen = new Set<string>();
  for (const opt of [...enums, ...logic]) {
    const n = opt.name || opt.code;
    if (!n || seen.has(n)) continue;
    seen.add(n);
    names.push(n);
  }
  return names;
}
