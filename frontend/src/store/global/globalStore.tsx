import create from 'zustand';
import produce from 'immer';

/** 左树点表 → 画布定位（与命令面板 focusTable 同语义） */
export type PendingLocateTable = {
  module: string;
  tableId: string;
  /** 同表连点可重复触发 */
  seq: number;
};

export type IGlobalSlice = {
  setSaved: (saved: boolean) => void;
  setSaving: (saving: boolean) => void;
  setNeedSave: (saved: boolean) => void;
  setSearchKey: (searchKey: string) => void;
  requestLocateTable: (module: string, tableId: string) => void;
  clearPendingLocateTable: () => void;
};

export type GlobalState = {
  searchKey?: string;
  querySearchKey?: string;
  /** 最近一次自动保存是否成功落库 */
  saved: boolean;
  /** 自动保存请求进行中 */
  saving: boolean;
  needSave: boolean;
  pendingLocateTable: PendingLocateTable | null;
  dispatch: IGlobalSlice;
};

const useGlobalStore = create<GlobalState>((set) => ({
  searchKey: '',
  querySearchKey: '',
  saved: true,
  saving: false,
  needSave: true,
  pendingLocateTable: null,
  dispatch: {
    setSaved: (saved: boolean) =>
      set(
        produce((state) => {
          state.saved = saved;
        }),
      ),
    setSaving: (saving: boolean) =>
      set(
        produce((state) => {
          state.saving = saving;
        }),
      ),
    setNeedSave: (needSave: boolean) =>
      set(
        produce((state) => {
          state.needSave = needSave;
        }),
      ),
    setSearchKey: (searchKey: string) =>
      set(
        produce((state) => {
          state.searchKey = searchKey;
        }),
      ),
    requestLocateTable: (module: string, tableId: string) =>
      set(
        produce((state) => {
          state.pendingLocateTable = {
            module,
            tableId,
            seq: (state.pendingLocateTable?.seq || 0) + 1,
          };
        }),
      ),
    clearPendingLocateTable: () =>
      set(
        produce((state) => {
          state.pendingLocateTable = null;
        }),
      ),
  },
}));

export default useGlobalStore;
