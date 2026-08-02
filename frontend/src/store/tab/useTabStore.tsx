import create from "zustand";
import produce from "immer";
import useProjectStore from "@/store/project/useProjectStore";

// 类型：对象、函数两者都适用，但是 type 可以用于基础类型、联合类型、元祖。
// 同名合并：interface 支持，type 不支持。
// 计算属性：type 支持, interface 不支持。
// 总的来说，公共的用 interface 实现，不能用 interface 实现的再用 type 实现。主要是一个项目最好保持一致。


type actions = {
  addTab: (payload: ModuleEntity) => void,
  activeTab: (payload: ModuleEntity) => void,
  removeTab: (payload: ModuleEntity) => void,
  removeLeftTab: (payload: ModuleEntity) => void,
  removeRightTab: (payload: ModuleEntity) => void,
  removeAllTab: (payload: ModuleEntity) => void,
  containTab: (payload: string) => boolean,
  /** 同模块关系图 tab 就地切换 diagram（不新开签，ADR-0017） */
  switchRelationDiagram: (module: string, entity: string) => void,
}

export enum TabGroup {
  MODEL,
}

export const defaultSelectTabId = '';

export type ModuleEntity = {
  group?: TabGroup;
  module?: string;
  entity?: string;
}

export type TabState = {
  selectTabId: string,
  tableTabs: ModuleEntity[],
  dispatch: actions
};


const useTabStore = create<TabState>(
  (set, get) => ({
    selectTabId: defaultSelectTabId,
    tableTabs: [],
    dispatch: {
      addTab: (payload: ModuleEntity) => set(produce(state => {
        if (!state.tableTabs.find((tab: ModuleEntity) => tab?.entity === payload.entity && tab?.module === payload.module)) {
          state.tableTabs.push(payload);
        }
        state.selectTabId = `${payload.module}###${payload.entity}`;
      })),
      activeTab: (payload: ModuleEntity) => set(produce(state => {
        state.selectTabId = `${payload.module}###${payload.entity}`;
        if (payload.group === TabGroup.MODEL) {
          const projectDispatch = useProjectStore.getState().dispatch;
          projectDispatch.setCurrentModule(payload.module);
          projectDispatch.setCurrentEntity(payload.entity);
        }
      })),
      removeTab: (payload: ModuleEntity) => set(produce(state => {
        const index = state.tableTabs.findIndex((tab: ModuleEntity) => tab?.entity === payload.entity && tab?.module === payload?.module);
        if (index > -1) {
          state.tableTabs = state.tableTabs.filter((tab: ModuleEntity, i: number) => i !== index);
          if (get().selectTabId === `${payload?.module}###${payload?.entity}`) {
            if (index === 0) {
              state.selectTabId = defaultSelectTabId;
            } else if (index > 0) {
              const tableTab = state.tableTabs[index - 1];
              state.selectTabId = `${tableTab?.module}###${tableTab?.entity}`;
            }
          }

        }
      })),
      removeLeftTab: (payload: ModuleEntity) => set(produce(state => {
        const index = state.tableTabs.findIndex((tab: ModuleEntity) => tab?.entity === payload.entity && tab?.module === payload?.module);
        if (index > -1) {
          state.tableTabs = state.tableTabs.filter((tab: ModuleEntity, i: number) => i >= index);
        }
        state.selectTabId = `${payload.module}###${payload.entity}`;
      })),
      removeRightTab: (payload: ModuleEntity) => set(produce(state => {
        const index = state.tableTabs.findIndex((tab: ModuleEntity) => tab?.entity === payload.entity && tab?.module === payload?.module);
        if (index > -1) {
          state.tableTabs = state.tableTabs.filter((tab: ModuleEntity, i: number) => i <= index);
        }
        state.selectTabId = `${payload.module}###${payload.entity}`;
      })),
      removeAllTab: (payload: ModuleEntity) => set(produce(state => {
        state.tableTabs = [];
        state.selectTabId = defaultSelectTabId;
      })),
      containTab: (payload: string) => {
        if (get().tableTabs.find((tab: ModuleEntity) => tab.entity === payload)) {
          return true;
        }
        return false;
      },
      switchRelationDiagram: (module: string, entity: string) => set(produce(state => {
        const relationTabs = state.tableTabs
          .map((tab: ModuleEntity, i: number) => ({ tab, i }))
          .filter(({ tab }) => tab.module === module && (tab.entity || '').startsWith('关系图'));
        if (relationTabs.length === 0) {
          state.tableTabs.push({ group: TabGroup.MODEL, module, entity });
          state.selectTabId = `${module}###${entity}`;
          return;
        }
        const keep = relationTabs[0].i;
        state.tableTabs[keep].entity = entity;
        // 合并多余关系图签
        state.tableTabs = state.tableTabs.filter((tab: ModuleEntity, i: number) => {
          if (tab.module !== module || !(tab.entity || '').startsWith('关系图')) {
            return true;
          }
          return i === keep;
        });
        state.selectTabId = `${module}###${entity}`;
      })),
    },
  })
);

export default useTabStore;
