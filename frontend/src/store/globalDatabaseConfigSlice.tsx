import { GetState, SetState } from "zustand";
import produce from "immer";
import { message } from "antd";
import { storeFmt } from '@/store/storeIntl';

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
    message.success(storeFmt('store.globalDb.addSuccess'));
  })),
  removeDatabase: (index: number) => set(produce(state => {
    state.databases.splice(index, 1);
    message.success(storeFmt('store.globalDb.removeSuccess'));
  })),
  updateDatabase: (index: number, payload: any) => set(produce(state => {
    state.databases[index] = payload;
    message.success(storeFmt('store.globalDb.updateSuccess'));
  })),
  setDatabases: (databases: any[]) => set(produce(state => {
    state.databases = databases;
  })),
});

export default GlobalDatabaseConfigSlice;
