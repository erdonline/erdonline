import { GetState, SetState } from "zustand";
import produce from "immer";
import { message } from "antd";
import _ from 'lodash';

export type GlobalDatabaseConfig = {
  databases: any[];
};

export interface GlobalDatabaseConfigDispatchSlice {
  addDatabase: (payload: any) => void;
  removeDatabase: (index: number) => void;
  updateDatabase: (index: number, payload: any) => void;
  setDatabases: (databases: any[]) => void;
}

const GlobalDatabaseConfigSlice = (set: SetState<GlobalDatabaseConfig>, get: GetState<GlobalDatabaseConfig>) => ({
  addDatabase: (payload: any) => set(produce(state => {
    state.databases.push(payload);
    message.success('数据库添加成功');
  })),
  removeDatabase: (index: number) => set(produce(state => {
    state.databases.splice(index, 1);
    message.success('数据库删除成功');
  })),
  updateDatabase: (index: number, payload: any) => set(produce(state => {
    state.databases[index] = payload;
    message.success('数据库更新成功');
  })),
  setDatabases: (databases: any[]) => set(produce(state => {
    state.databases = databases;
  })),
});

export default GlobalDatabaseConfigSlice;
