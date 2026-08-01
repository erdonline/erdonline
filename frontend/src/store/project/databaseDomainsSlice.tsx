import type { GetState, SetState } from 'zustand';
import type { ProjectState } from '@/store/project/useProjectStore';
import produce from 'immer';
import { message } from 'antd';
import _ from 'lodash';

export type IDatabaseDomainsSlice = {
  currentDatabase?: string;
  currentDatabaseIndex?: number;
}

export interface IDatabaseDomainsDispatchSlice {

  addDatabase: (payload: any) => void;
  removeDatabase: () => void;
  updateDatabase: (payload: any) => void;
  setCurrentDatabase: (payload: any) => void,
  getDefaultDatabase: () => any;
  getDefaultDatabaseCode: () => string;
}

const DatabaseDomainsSlice = (set: SetState<ProjectState>, get: GetState<ProjectState>) => ({
  addDatabase: (payload: any) => set(produce(state => {
    const {code} = payload;
    const findIndex = state.project.projectJSON.dataTypeDomains?.database?.findIndex((m: any) => m.code === code);
    if (findIndex === -1) {
      if (payload.defaultDatabase) {
        state.project.projectJSON.dataTypeDomains.database = state.project.projectJSON.dataTypeDomains.database.map((d: any) => {
          return {
            ...d,
            defaultDatabase: false
          };
        })
      }
      state.project.projectJSON.dataTypeDomains.database.push(payload);
      message.success('提交成功');
    } else {
      message.error(`数据源[${payload.name}]已经存在`);
    }
  })),
  removeDatabase: () => set(produce(state => {
    const {currentDatabaseIndex} = state;
    state.project.projectJSON.dataTypeDomains.database =
      state.project.projectJSON.dataTypeDomains?.database?.filter((e: any, index: number) => index !== currentDatabaseIndex) || [];
  })),
  updateDatabase: (payload: any) => set(produce(state => {
    if (payload.defaultDatabase) {
      state.project.projectJSON.dataTypeDomains.database = state.project.projectJSON.dataTypeDomains.database.map((d: any) => {
        return {
          ...d,
          defaultDatabase: false
        };
      })
    }
    // _.set(state.project, `projectJSON.dataTypeDomains.database[${state.currentDatabaseIndex}]`, payload);
    state.project.projectJSON.dataTypeDomains.database[state.currentDatabaseIndex] = payload;
    message.success('修改成功');
  })),
  setCurrentDatabase: (payload: any) => set(produce(state => {
    state.currentDatabase = payload
    state.currentDatabaseIndex = state.project.projectJSON.dataTypeDomains?.database?.findIndex((m: any) => m.code === payload);
  })),
  getDefaultDatabase: () => {
    const database = get().project?.projectJSON?.dataTypeDomains?.database;
    return _.find(database, {'defaultDatabase': true});
  },
  getDefaultDatabaseCode: () => {
    const defaultDatabase = get().dispatch.getDefaultDatabase();
    if (defaultDatabase) {
      return defaultDatabase.code;
    } else {
      return undefined;
    }
  },
});


export default DatabaseDomainsSlice;
