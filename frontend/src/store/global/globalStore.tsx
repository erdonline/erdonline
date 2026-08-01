import create from 'zustand';
import produce from 'immer';

export type IGlobalSlice = {
  setSaved: (saved: boolean) => void;
  setSaving: (saving: boolean) => void;
  setNeedSave: (saved: boolean) => void;
  setSearchKey: (searchKey: string) => void;
  setExpandedKeys: (expandedKeys: string[]) => void;
};

export type GlobalState = {
  expandedKeys?: any;
  searchKey?: string;
  querySearchKey?: string;
  /** 最近一次自动保存是否成功落库 */
  saved: boolean;
  /** 自动保存请求进行中 */
  saving: boolean;
  needSave: boolean;
  dispatch: IGlobalSlice;
};

const useGlobalStore = create<GlobalState>((set) => ({
  expandedKeys: [],
  searchKey: '',
  querySearchKey: '',
  saved: true,
  saving: false,
  needSave: true,
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
    setExpandedKeys: (expandedKeys: string[]) =>
      set(
        produce((state) => {
          state.expandedKeys = expandedKeys;
        }),
      ),
  },
}));

export default useGlobalStore;
