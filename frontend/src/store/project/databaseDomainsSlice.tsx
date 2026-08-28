import type { GetState, SetState } from 'zustand';
import type { ProjectState } from '@/store/project/useProjectStore';
import { find as _find } from 'lodash-es';

export type IDatabaseDomainsSlice = Record<string, never>;

export interface IDatabaseDomainsDispatchSlice {
  /** 读 dataTypeDomains.database 中 defaultDatabase===true 项（供默认字段映射） */
  getDefaultDatabase: () => any;
  getDefaultDatabaseCode: () => string | undefined;
}

/**
 * 仅保留读默认库方言 code 的 getter。
 * add/update/remove/setCurrent 零挂载（W4 设置页已删），按 delete-dead-code 清掉。
 */
const DatabaseDomainsSlice = (
  _set: SetState<ProjectState>,
  get: GetState<ProjectState>,
) => ({
  getDefaultDatabase: () => {
    const database = get().project?.projectJSON?.dataTypeDomains?.database;
    return _find(database, { defaultDatabase: true });
  },
  getDefaultDatabaseCode: () => {
    const defaultDatabase = get().dispatch.getDefaultDatabase();
    if (defaultDatabase) {
      return defaultDatabase.code;
    }
    return undefined;
  },
});

export default DatabaseDomainsSlice;
