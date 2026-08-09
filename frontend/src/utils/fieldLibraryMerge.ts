import type { DataDictApplyResult, DataDictField, DataDictEnum } from '@/services/data-dict';

export type ProjectFieldRow = DataDictField & Record<string, unknown>;

export type ProjectEnumRow = DataDictEnum & Record<string, unknown>;

/** 合并 apply 字段：按 name 去重，保留已有字段 */
export function mergeFieldsIntoEntity(
  existing: ProjectFieldRow[],
  incoming: DataDictField[],
): ProjectFieldRow[] {
  const names = new Set(
    (existing || []).map((f) => String(f?.name || '').trim()).filter(Boolean),
  );
  const toAdd: ProjectFieldRow[] = [];
  for (const src of incoming || []) {
    const name = String(src?.name || '').trim();
    if (!name || names.has(name)) {
      continue;
    }
    toAdd.push(JSON.parse(JSON.stringify(src)) as ProjectFieldRow);
    names.add(name);
  }
  return [...(existing || []), ...toAdd];
}

/** 按 code 并集枚举到 dataTypeDomains.datatype */
export function mergeEnumsIntoDomains(
  existing: ProjectEnumRow[],
  incoming: DataDictEnum[] | undefined,
): ProjectEnumRow[] {
  if (!incoming?.length) {
    return [...(existing || [])];
  }
  const codes = new Set(
    (existing || []).map((d) => String(d?.code || '').trim()).filter(Boolean),
  );
  const out = [...(existing || [])];
  for (const en of incoming) {
    const code = String(en?.code || '').trim();
    if (!code || codes.has(code)) {
      continue;
    }
    out.push(JSON.parse(JSON.stringify(en)) as ProjectEnumRow);
    codes.add(code);
  }
  return out;
}

export type ApplyToProjectOptions = {
  existingFields: ProjectFieldRow[];
  existingDatatypes: ProjectEnumRow[];
  applyResult: DataDictApplyResult;
};

export type ApplyToProjectResult = {
  fields: ProjectFieldRow[];
  datatypes: ProjectEnumRow[];
  addedFieldCount: number;
  addedEnumCount: number;
  modifiedFieldCount: number;
};

export type OverwriteFieldsResult = {
  fields: ProjectFieldRow[];
  modifiedFieldCount: number;
};

/**
 * 覆盖模式：按选中行索引写入库字段副本（copy-on-apply，不级联）。
 * - 1 个库字段 + 多选行 → 同一模板覆盖各行
 * - 多库字段 + 1 选行 → 仅取第一个库字段
 * - 多选行 + 多库字段 → 按索引 zip（取 min 长度）
 */
export function overwriteFieldsAtIndices(
  existing: ProjectFieldRow[],
  incoming: DataDictField[],
  indices: number[],
): OverwriteFieldsResult {
  const base = (existing || []).map((f) => JSON.parse(JSON.stringify(f)) as ProjectFieldRow);
  const templates = (incoming || [])
    .map((f) => JSON.parse(JSON.stringify(f)) as ProjectFieldRow)
    .filter((f) => String(f?.name || '').trim());
  const sortedIndices = [...new Set(indices)]
    .filter((i) => Number.isInteger(i) && i >= 0 && i < base.length)
    .sort((a, b) => a - b);

  if (!templates.length || !sortedIndices.length) {
    return { fields: base, modifiedFieldCount: 0 };
  }

  let modifiedFieldCount = 0;
  if (templates.length === 1) {
    const tpl = templates[0];
    for (const idx of sortedIndices) {
      base[idx] = JSON.parse(JSON.stringify(tpl));
      modifiedFieldCount += 1;
    }
  } else if (sortedIndices.length === 1) {
    base[sortedIndices[0]] = JSON.parse(JSON.stringify(templates[0]));
    modifiedFieldCount = 1;
  } else {
    const n = Math.min(sortedIndices.length, templates.length);
    for (let i = 0; i < n; i += 1) {
      base[sortedIndices[i]] = JSON.parse(JSON.stringify(templates[i]));
      modifiedFieldCount += 1;
    }
  }

  return { fields: base, modifiedFieldCount };
}

export type ComputeApplyMode = 'append' | 'overwrite';

export type ComputeApplyToProjectOptions = ApplyToProjectOptions & {
  mode?: ComputeApplyMode;
  /** overwrite 时必填：实体 fields 数组中的行索引 */
  selectedRowIndices?: number[];
};

export function computeApplyToProject(opts: ComputeApplyToProjectOptions): ApplyToProjectResult {
  const beforeFieldCount = (opts.existingFields || []).length;
  const beforeEnumCount = (opts.existingDatatypes || []).length;
  const mode = opts.mode ?? 'append';
  const incoming = opts.applyResult.fields || [];

  let fields: ProjectFieldRow[];
  let modifiedFieldCount = 0;
  if (mode === 'overwrite' && (opts.selectedRowIndices?.length ?? 0) > 0) {
    const overwritten = overwriteFieldsAtIndices(
      opts.existingFields,
      incoming,
      opts.selectedRowIndices || [],
    );
    fields = overwritten.fields;
    modifiedFieldCount = overwritten.modifiedFieldCount;
  } else {
    fields = mergeFieldsIntoEntity(opts.existingFields, incoming);
  }

  const datatypes = mergeEnumsIntoDomains(opts.existingDatatypes, opts.applyResult.enums);
  return {
    fields,
    datatypes,
    addedFieldCount: fields.length - beforeFieldCount,
    addedEnumCount: datatypes.length - beforeEnumCount,
    modifiedFieldCount,
  };
}
