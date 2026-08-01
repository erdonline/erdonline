import type { GetState, SetState } from 'zustand';
import type { ProjectState } from '@/store/project/useProjectStore';
import produce from 'immer';
import { message } from 'antd';
import { Data, DatabasePoint, DataNull, DataUser } from '@icon-park/react';
import * as cache from '@/utils/cache';

function uniqueWithSuffix(
  base: string,
  exists: (value: string) => boolean,
): string {
  let value = base;
  while (exists(value)) {
    value = `${value}-副本`;
  }
  return value;
}

export type IDataTypeDomainsSlice = {
  currentDataType?: string;
  currentDataTypeIndex?: number;
}

const ERD_DATA_TYPE_CLIPBOARD = 'erd_data_type_clipboard';

const validateDataType = (dataType: any) => {
  let flag = false;
  if (dataType.code
    && typeof dataType.code === 'string'
    && dataType.name
    && typeof dataType.name === 'string'
  ) {
    flag = !(dataType.apply && typeof dataType.apply !== 'object');
  }
  return flag;
};


export interface IDataTypeDomainsDispatchSlice {

  addDatatype: (payload: any) => void;
  renameDatatype: (payload: any) => void;
  removeDatatype: () => void;
  updateDatatype: (payload: any) => void;
  copyDatatype: () => void;
  cutDatatype: () => void;
  pastDatatype: () => void;
  setCurrentDatatype: (payload: any) => void,
  updateAllDataTypes: (payload: any) => void,
  getDataTypeTree: () => any,

}

const DataTypeDomainsSlice = (set: SetState<ProjectState>, get: GetState<ProjectState>) => ({
  addDatatype: (payload: any) => set(produce(state => {
    const datatypeName = payload.name;
    const findIndex = state.project.projectJSON.dataTypeDomains?.datatype?.findIndex((m: any) => m.name === datatypeName || m.code === payload.code);
    if (findIndex === -1) {
      state.project.projectJSON.dataTypeDomains?.datatype?.push(payload);
      message.success('提交成功');
    } else {
      message.error(`名称[${payload.name}] 或 代码[${payload.code}] 已经存在`);
    }
  })),
  renameDatatype: (payload: any) => set(produce(state => {
    const {currentDataTypeIndex} = state;
    state.project.projectJSON.dataTypeDomains.datatype[currentDataTypeIndex].name = payload.name;
    state.project.projectJSON.dataTypeDomains.datatype[currentDataTypeIndex].code = payload.code;
    state.project.projectJSON.dataTypeDomains.datatype[currentDataTypeIndex].apply = payload.apply;
    message.success('修改成功');
  })),
  removeDatatype: () => set(produce(state => {
    const {currentDataTypeIndex} = state;
    state.project.projectJSON.dataTypeDomains.datatype =
      state.project.projectJSON.dataTypeDomains?.datatype?.filter((e: any, index: number) => index !== currentDataTypeIndex) || [];
  })),
  updateDatatype: (payload: any) => set(produce(state => {
    state.project.projectJSON.dataTypeDomains.datatype[state.currentDataTypeIndex] = payload;
    message.success('修改成功');
  })),
  setCurrentDatatype: (payload: any) => set(produce(state => {
    state.currentDataType = payload
    state.currentDataTypeIndex = state.project.projectJSON.dataTypeDomains?.datatype?.findIndex((m: any) => m.code === payload);
  })),
  updateAllDataTypes: (payload: any) => set(produce(state => {
    state.project.projectJSON.dataTypeDomains.datatype = payload;
  })),
  copyDatatype: () => set(produce(state => {
    const currentDataType = state.project.projectJSON.dataTypeDomains.datatype[state.currentDataTypeIndex];
    if (currentDataType) {
      cache.setItem(ERD_DATA_TYPE_CLIPBOARD, currentDataType);
      message.success("复制成功")
    } else {
      message.success("复制失败")
    }
  })),
  cutDatatype: () => set(produce(state => {
    const currentDataTypeIndex = state.currentDataTypeIndex;
    const currentDataType = state.project.projectJSON.dataTypeDomains.datatype[currentDataTypeIndex];
    if (currentDataType) {
      cache.setItem(ERD_DATA_TYPE_CLIPBOARD, currentDataType);
      state.project.projectJSON.dataTypeDomains.datatype =
        state.project.projectJSON.dataTypeDomains?.datatype?.filter((e: any, index: number) => index !== currentDataTypeIndex) || [];
      message.success("剪切成功")
    } else {
      message.success("剪切失败")
    }
  })),
  pastDatatype: () => set(state => {
    const currentDataTypeIndex = state.currentDataTypeIndex;
    let data = [];
    try {
      data = cache.getItem2object(ERD_DATA_TYPE_CLIPBOARD) || {};
      if (currentDataTypeIndex && validateDataType(data)) {
        const list = state.project.projectJSON.dataTypeDomains.datatype;
        const code = uniqueWithSuffix(data.code, (v) => list.some((m: any) => m.code === v));
        const name = uniqueWithSuffix(data.name, (v) => list.some((m: any) => m.name === v));
        state.project.projectJSON.dataTypeDomains.datatype.push({
          ...data,
          code,
          name
        });
        message.success('粘贴成功');
      } else {
        message.success('粘贴失败');
      }
    } catch (err) {
      message.error('数据格式错误，无法粘贴');

    }
  }),
  getDataTypeTree: () => {
    const dataTypes = get().project?.projectJSON?.dataTypeDomains?.datatype?.map((datatype: any) => {
      return {
        type: 'dataType',
        code: datatype.code,
        icon: <DataNull theme="filled" size="13" fill="#DE2910" strokeWidth={2}/>,
        title: datatype.name,
        isLeaf: true,
        key: `datatype${datatype.name}`,
      }
    });
    const databases = get().project?.projectJSON?.dataTypeDomains?.database?.map((database: any) => {
      return {
        type: 'database',
        code: database.code,
        icon: <DatabasePoint theme="filled" size="13" fill="#DE2910" strokeWidth={2}/>,
        title: database.code,
        isLeaf: true,
        key: `database${database.code}`,
      }
    });

    return [{
      type: 'dataType',
      title: '数据字典',
      icon: <DataUser theme="filled" size="18" fill="#DE2910" strokeWidth={2}/>,
      code: '###menu###',
      isLeaf: false,
      key: `datatype###datatype`,
      children: dataTypes
    }, {
      type: 'database',
      code: '###menu###',
      title: '数据模板',
      icon: <Data theme="filled" size="13" fill="#DE2910" strokeWidth={2}/>,
      isLeaf: false,
      key: `database###database`,
      children: databases
    }];
  },
});


export default DataTypeDomainsSlice;
