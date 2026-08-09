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
};

export function computeApplyToProject(opts: ApplyToProjectOptions): ApplyToProjectResult {
  const beforeFieldCount = (opts.existingFields || []).length;
  const beforeEnumCount = (opts.existingDatatypes || []).length;
  const fields = mergeFieldsIntoEntity(opts.existingFields, opts.applyResult.fields || []);
  const datatypes = mergeEnumsIntoDomains(opts.existingDatatypes, opts.applyResult.enums);
  return {
    fields,
    datatypes,
    addedFieldCount: fields.length - beforeFieldCount,
    addedEnumCount: datatypes.length - beforeEnumCount,
  };
}
