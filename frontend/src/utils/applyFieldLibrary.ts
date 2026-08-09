import type { DataDictApplyResult, DataDictEnum } from '@/services/data-dict';
import useProjectStore from '@/store/project/useProjectStore';
import { computeApplyToProject, type ProjectEnumRow, type ProjectFieldRow } from '@/utils/fieldLibraryMerge';

type ApplyFieldLibraryOpts = {
  moduleName: string;
  entityTitle: string;
  applyResult: DataDictApplyResult;
  /** 有选中行时为 overwrite，否则 append */
  selectedRowIndices?: number[];
};

/**
 * copy-on-apply：merge 字段 + 枚举，persist-on-200。
 */
export async function applyFieldLibraryToEntity(
  opts: ApplyFieldLibraryOpts,
): Promise<{
  ok: boolean;
  addedFieldCount: number;
  addedEnumCount: number;
  modifiedFieldCount: number;
  mode: 'append' | 'overwrite';
}> {
  const state = useProjectStore.getState();
  const project = state.project;
  const moduleIndex = project?.projectJSON?.modules?.findIndex(
    (m: { name?: string }) => m.name === opts.moduleName,
  );
  if (moduleIndex == null || moduleIndex < 0 || !project?.projectJSON) {
    return { ok: false, addedFieldCount: 0, addedEnumCount: 0, modifiedFieldCount: 0, mode: 'append' };
  }
  const module = project.projectJSON.modules[moduleIndex];
  const entity = module?.entities?.find(
    (e: { title?: string; name?: string }) =>
      (e.title || e.name) === opts.entityTitle,
  );
  if (!entity) {
    return { ok: false, addedFieldCount: 0, addedEnumCount: 0, modifiedFieldCount: 0, mode: 'append' };
  }

  const existingFields = (entity.fields || []) as ProjectFieldRow[];
  const existingDatatypes = (project.projectJSON.dataTypeDomains?.datatype ||
    []) as ProjectEnumRow[];
  const selectedRowIndices = (opts.selectedRowIndices || []).filter(
    (i) => Number.isInteger(i) && i >= 0 && i < existingFields.length,
  );
  const mode: 'append' | 'overwrite' =
    selectedRowIndices.length > 0 ? 'overwrite' : 'append';

  const merged = computeApplyToProject({
    existingFields,
    existingDatatypes,
    applyResult: opts.applyResult,
    mode,
    selectedRowIndices,
  });

  for (const en of (opts.applyResult.enums || []) as DataDictEnum[]) {
    const code = String(en?.code || '').trim();
    if (!code) {
      continue;
    }
    const exists = existingDatatypes.some((d) => d.code === code);
    if (!exists) {
      const addOk = await Promise.resolve(
        state.dispatch.addDatatype(en, { persist: true }),
      );
      if (!addOk) {
        return {
          ok: false,
          addedFieldCount: 0,
          addedEnumCount: 0,
          modifiedFieldCount: 0,
          mode,
        };
      }
    }
  }

  const fieldsOk = await Promise.resolve(
    state.dispatch.updateEntityFields(
      opts.moduleName,
      opts.entityTitle,
      merged.fields,
      { persist: true },
    ),
  );

  return {
    ok: !!fieldsOk,
    addedFieldCount: merged.addedFieldCount,
    addedEnumCount: merged.addedEnumCount,
    modifiedFieldCount: merged.modifiedFieldCount,
    mode,
  };
}
