/** 逆向解析选表：未入库表排前，同组内按表名 */
export function sortReverseEntitiesForDisplay<T extends { title: string }>(
  entities: T[],
  existsInProject: string[],
): T[] {
  const existsSet = new Set(existsInProject);
  return [...entities].sort((a, b) => {
    const aIn = existsSet.has(a.title);
    const bIn = existsSet.has(b.title);
    if (aIn !== bIn) {
      return aIn ? 1 : -1;
    }
    return a.title.localeCompare(b.title);
  });
}

export type ReverseImportTarget = {
  moduleCode: string;
  moduleChnname: string;
  /** true = 导入到已有模块（moduleCode 为 modules[].name） */
  useExistingModule: boolean;
};

export const REVERSE_NEW_MODULE = '__REVERSE_NEW__';

export function resolveReverseImportTarget(
  parsedModule: { code?: string; name?: string },
  target?: Partial<ReverseImportTarget>,
): ReverseImportTarget {
  const moduleCode = target?.moduleCode?.trim() || parsedModule.code || '';
  const moduleChnname = target?.moduleChnname?.trim() || parsedModule.name || moduleCode;
  return {
    moduleCode,
    moduleChnname,
    useExistingModule: target?.useExistingModule ?? false,
  };
}
