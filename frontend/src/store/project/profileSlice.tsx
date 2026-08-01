import {GetState, SetState} from "zustand";
import {ProjectState} from "@/store/project/useProjectStore";
import produce from "immer";
import _ from "lodash";
import * as Save from '@/utils/save';
import {message, Modal} from "antd";
import request from "@/utils/request";
import {saveByBlob} from "@/utils/file";
import {
  createDatabaseConfig,
  deleteDatabaseConfig,
  fetchDatabaseConfigs,
  updateDatabaseConfig,
} from "@/utils/databaseUtils";
import {markDefaultDataSource} from "@/utils/projectDataSource";

export type IProfileSlice = {
  currentDbKey?: string;
  profileSliceState?: any;
}

export interface IProfileDispatchSlice {
  addDefaultFields: (defaultFieldsIndex: number, payload: any) => void;
  removeDefaultFields: (defaultFieldsIndex: number) => void;
  updateDefaultFields: (payload: any) => void;

  updateDefaultFieldsType: (payload: any) => void;
  updateSqlConfig: (payload: any) => void;

  /** ADR-0008：写 dataSources API，不写 profile.dbs 机密 */
  addDbs: (payload: any) => Promise<void>;
  removeDbs: (key: string) => Promise<void>;
  updateDbs: (key: string, payload: any) => Promise<void>;
  updateAllDbs: (payload: any) => void;
  setCurrentDbKey: (payload: string) => void;
  setDefaultDb: (payload: string) => void;
  refreshDataSources: () => Promise<any[]>;

  updateWordTemplateConfig: (payload: any) => void;
  updateProfile: (payload: any) => void;


  getCurrentDBName: () => any;
  getCurrentDBData: () => any;
  setProfileSliceState: (profileSlice: any) => void;
  dbReverseParse: (db: any, dataFormat: string, schema?: string) => void;
  checkField: (data: any) => any;
  getAllTable: (dataSource: any) => any;
  saveSelectedRowKeys: (selectedRowKeys: any) => void;
  getSelectedEntity: () => boolean;
  importReverseTable: () => void;
  getDefaultFields: () => any;
  downloadWordTemplate: () => any;
}


const ProfileSlice = (set: SetState<ProjectState>, get: GetState<ProjectState>) => ({
  addDefaultFields: (defaultFieldsIndex: number, payload: any) => set(produce(state => {
    state.project.projectJSON.profile.defaultFields[defaultFieldsIndex].push(payload);
  })),
  removeDefaultFields: (defaultFieldsIndex: number) => set(produce(state => {
    delete state.project.projectJSON.profile.defaultFields[defaultFieldsIndex];
  })),
  updateDefaultFields: (payload: any) => set(produce(state => {
    state.project.projectJSON.profile.defaultFields = payload;
  })),

  updateDefaultFieldsType: (payload: any) => set(produce(state => {
    state.project.projectJSON.profile.defaultFieldsType = payload;
  })),
  updateSqlConfig: (payload: any) => set(produce(state => {
    state.project.projectJSON.profile.sqlConfig = payload;
  })),

  refreshDataSources: async () => {
    const list = await fetchDatabaseConfigs();
    const defaultId = get().project?.projectJSON?.profile?.defaultDataSourceId;
    const marked = markDefaultDataSource(list, defaultId);
    try {
      // 懒加载避免与 useVersionStore ↔ useProjectStore 循环依赖
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const useVersionStore = require('@/store/version/useVersionStore').default;
      useVersionStore.getState().dispatch.initDbs(marked);
    } catch (e) {
      console.warn('refreshDataSources: versionStore unavailable', e);
    }
    return marked;
  },
  addDbs: async (payload: any) => {
    const ok = await createDatabaseConfig(payload);
    if (!ok) {
      message.error('新增数据源失败');
      return;
    }
    if (payload?.defaultDB || payload?.key) {
      set(produce(state => {
        const profile = state.project.projectJSON.profile || (state.project.projectJSON.profile = {});
        profile.dbs = [];
        if (payload.defaultDB && payload.key) {
          profile.defaultDataSourceId = payload.key;
          state.currentDbKey = payload.key;
        }
      }));
    }
    await get().dispatch.refreshDataSources();
  },
  removeDbs: async (key: string) => {
    const ok = await deleteDatabaseConfig(key);
    if (!ok) {
      message.error('删除数据源失败');
      return;
    }
    set(produce(state => {
      const profile = state.project.projectJSON.profile || {};
      profile.dbs = [];
      if (profile.defaultDataSourceId === key) {
        profile.defaultDataSourceId = undefined;
        state.currentDbKey = undefined;
      }
      state.project.projectJSON.profile = profile;
    }));
    await get().dispatch.refreshDataSources();
  },
  /** key = dataSourceId；payload 局部合并后 PUT /dataSources/{id} */
  updateDbs: async (key: string, payload: any) => {
    const list = await fetchDatabaseConfigs();
    const prev = list.find((d: any) => d.key === key);
    if (!prev) {
      message.error('数据源不存在');
      return;
    }
    const next = {
      ...prev,
      ...payload,
      key,
      properties: payload?.properties
        ? {...(prev.properties || {}), ...payload.properties}
        : prev.properties,
    };
    const ok = await updateDatabaseConfig(next);
    if (!ok) {
      message.error('更新数据源失败');
      return;
    }
    set(produce(state => {
      if (state.project?.projectJSON?.profile) {
        state.project.projectJSON.profile.dbs = [];
      }
    }));
    await get().dispatch.refreshDataSources();
  },
  /** 兼容旧调用：忽略写入 profile.dbs，仅刷新 API 列表 */
  updateAllDbs: (_payload: any) => {
    get().dispatch.refreshDataSources();
  },
  setCurrentDbKey: (payload: string) => set(produce(state => {
    state.currentDbKey = payload;
  })),
  setDefaultDb: (payload: string) => set(produce(state => {
    const profile = state.project.projectJSON.profile || (state.project.projectJSON.profile = {});
    profile.defaultDataSourceId = payload;
    profile.dbs = [];
    state.currentDbKey = payload;
  })),

  updateWordTemplateConfig: (payload: any) => set(produce(state => {
    state.project.projectJSON.profile.wordTemplateConfig = payload;
  })),
  updateProfile: (payload: any) => set(produce(state => {
    const profile = _.assign(state.project.projectJSON.profile, payload);
    state.project.projectJSON.profile = profile;
    message.success('设置成功');
  })),
  getCurrentDBName: () => {
    const db = get().dispatch.getCurrentDBData();
    if (db) {
      return db.name;
    }
    return '';
  },
  getCurrentDBData: () => {
    const defaultId = get().project?.projectJSON?.profile?.defaultDataSourceId;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const useVersionStore = require('@/store/version/useVersionStore').default;
      const dbs = useVersionStore.getState().dbs || [];
      if (defaultId) {
        const byId = dbs.find((d: any) => d.key === defaultId);
        if (byId) {
          return byId;
        }
      }
      return dbs.find((d: any) => d.defaultDB) || dbs[0];
    } catch {
      return undefined;
    }
  },

  setProfileSliceState: (profileSlice: any) => set(produce(state => {
    state.profileSliceState = profileSlice;
  })),
  dbReverseParse: (db: any, dataFormat: string, schema?: string) => set(produce(state => {
    if (!dataFormat) {
      dataFormat = 'DEFAULT';
    }
    if (!db) {
      message.error('未选中或配置数据源');
      return;
    }
    get().dispatch.setProfileSliceState({
      loading: true,
      flag: true,
      status: true,
      data: {},
      exists: [],
      keys: [],
    });
    const dbConfig = _.omit(db.properties, ['driver_class_name']);
    Save.dbReverseParse({
      ...dbConfig,
      driverClassName: db.properties['driver_class_name'], // eslint-disable-line
      flag: dataFormat,
      ...(schema ? {schema} : {}),
    }).then((res) => {
      if (res && res.code === 200) {
        get().dispatch.setProfileSliceState({
          ...get().profileSliceState,
          data: res.data || res,
          exists: get().dispatch.checkField(res.data || res),
          status: 'SUCCESS',
          flag: false,
        });
      } else {
        get().dispatch.setProfileSliceState({
          ...get().profileSliceState,
          status: 'FAILED'
        });
        message.error('数据库解析失败:' + res || res.msg);
      }
    }).catch((err) => {
      message.error('数据库解析失败:' + err.message);
    }).finally(() => {
      get().dispatch.setProfileSliceState({
        ...get().profileSliceState,
        flag: false,
        loading: false
      });
    });
  })),
  checkField: (data: any) => {
    let tempExists: any[];
    tempExists = [];
    const dataSource = get().project?.projectJSON;
    // 当前模型中已经拥有的数据表
    const allTable = get().dispatch.getAllTable(dataSource);
    // 从数据库解析中获取到的数据表
    const entities = _.get(data, 'module.entities', []).map((d: any) => d.title);
    entities.forEach((e: any) => {
      if (allTable.includes(e)) {
        tempExists.push(e);
      }
    });
    return tempExists;
  },
  getAllTable: (dataSource: any) => {
    return (dataSource.modules || []).reduce((a: any, b: any) => {
      return a.concat((b.entities || []).map((entity: any) => entity.title));
    }, []);
  },
  saveSelectedRowKeys: (selectedRowKeys: any) => {
    get().dispatch.setProfileSliceState({
      ...get().profileSliceState,
      keys: selectedRowKeys.map((k: any) => {
        return get().profileSliceState?.data?.module?.entities?.filter((e: any) => e.title === k)[0];
      }).filter((k: any) => !!k)
    });
  },
  getSelectedEntity: () => {
    const keys = get().profileSliceState?.keys || [];
    if (keys.length === 0) {
      message.warning('未选中要导入数据表');
      return false;
    }
    let isClose = false;
    if (keys?.some((k: any) => get().profileSliceState.exists.includes(k.title))) {
      Modal.confirm({
        title: '温馨提示',
        content: '勾选的数据表中包含模型中已经存在的数据表，继续操作将会覆盖模型中的数据，是否继续？',
        okText: '确认',
        cancelText: '取消',
        onOk: () => {
          isClose = true;
          get().dispatch.importReverseTable();
        }
      });
    } else {
      get().dispatch.importReverseTable();
      isClose = true;
    }
    return isClose;
  },
  importReverseTable: () => {
    const dataSource = get().project?.projectJSON;
    const {data, keys} = get().profileSliceState;
    const dbType = _.get(data, 'dbType', 'MYSQL');
    const module = _.get(data, 'module', {});
    const datatypeObj = _.get(data, 'dataTypeMap', {});
    let currentDataTypes = _.get(dataSource, 'dataTypeDomains.datatype', []);
    const database = _.get(dataSource, 'dataTypeDomains.database', []);
    if (!database.some((d: any) => d.code === dbType)) {
      database.push({
        code: dbType
      });
    }
    const currentDataTypeCodes = currentDataTypes.map((t: any) => t.code);
    const dataTypes = Object.keys(datatypeObj)
      .map(d => ({
        name: datatypeObj[d].name,
        code: datatypeObj[d].code,
        apply: {
          [dbType]: {
            type: datatypeObj[d].type
          }
        }
      })).filter(d => !currentDataTypeCodes.includes(d.code));
    currentDataTypes = currentDataTypes.map((c: any) => {
      if (datatypeObj[c.code]) {
        return {
          ...c,
          apply: {
            ...(c.apply || {}),
            [dbType]: {
              type: datatypeObj[c.code].type
            }
          }
        }
      }
      return c;
    });
    let tempKeys = [...keys];
    let tempData = {...dataSource};
    const selectedTitles = new Set(keys.map((k: any) => k.title));
    const incomingAssociations = (_.get(module, 'associations', []) || []).filter((a: any) =>
      selectedTitles.has(a?.from?.entity) && selectedTitles.has(a?.to?.entity)
      && a?.from?.field && a?.to?.field);
    const mergeAssociations = (existing: any[] = [], incoming: any[] = []) => {
      const merged = [...existing];
      incoming.forEach((a: any) => {
        const dup = merged.some((x: any) =>
          x?.from?.entity === a?.from?.entity && x?.from?.field === a?.from?.field
          && x?.to?.entity === a?.to?.entity && x?.to?.field === a?.to?.field);
        if (!dup) {
          merged.push(a);
        }
      });
      return merged;
    };
    // 1.循环所有已知的数据表
    let modules = (tempData.modules || []).map((m: any) => ({
      ...m,
      entities: (m.entities || []).map((e: any) => {
        // 执行覆盖操作
        const dbEntity = keys.filter((k: any) => k.title === e.title)[0];
        if (dbEntity) {
          tempKeys = tempKeys.filter(t => t.title !== dbEntity.title);
        }
        return dbEntity || e;
      })
    }));
    if (modules.map((m: any) => m.name).includes(module.code)) {
      // 如果该模型已经存在了
      modules = modules.map((m: any) => {
        if (m.name === module.code) {
          return {
            ...m,
            entities: (m.entities || []).concat(tempKeys),
          };
        }
        return m;
      })
    } else {
      modules.push({
        name: module.code,
        chnname: module.name,
        entities: tempKeys,
        associations: [],
      });
    }
    // 关联挂到「外键侧实体所在模块」（画布按模块读 associations）
    modules = modules.map((m: any) => {
      const titles = new Set((m.entities || []).map((e: any) => e.title));
      const forModule = incomingAssociations.filter((a: any) => titles.has(a.from.entity));
      if (forModule.length === 0) {
        return m;
      }
      return {
        ...m,
        associations: mergeAssociations(m.associations || [], forModule),
      };
    });
    tempData = {
      ...tempData,
      modules,
      dataTypeDomains: {
        ...(dataSource.dataTypeDomains || {}),
        datatype: currentDataTypes.concat(dataTypes),
        database,
      },
    };
    get().dispatch.updateAllDataTypes(currentDataTypes.concat(dataTypes));
    get().dispatch.updateAllModules(modules);

    message.success('操作成功！')
  },
  getDefaultFields: () => {
    const defaultDatabaseCode = get().dispatch.getDefaultDatabaseCode();
    const defaultFields = get().project?.projectJSON?.profile?.defaultFields || [];
    const datatype = get().project?.projectJSON?.dataTypeDomains?.datatype || [];
    return defaultFields.filter((f: any) => f != null).map((d: any) => {
      const defaultField = _.find(datatype, ['code', d.type]);
      if (defaultField) {
        return {
          ...d,
          dataType: defaultDatabaseCode ? _.get(defaultField, `apply.${defaultDatabaseCode}.type`) : '',
          typeName: defaultField.name || ''
        };
      }
    });

  },
  downloadWordTemplate: () => {
    // 获取word的目录
    const doctpl = get().project?.projectJSON?.profile.wordTemplateConfig;
    request('/ncnb/doc/downloadWordTemplate', {
      method: 'GET',
      responseType: 'blob',
      params: {
        doctpl: doctpl
      }
    }).then((res) => {
      if (res) {
        saveByBlob(res, 'wordTemplate.docx');
      }
    }).catch((err) => {
      message.error(`下载模板出错!出错原因：${err.message}！`);
    });
  }
});


export default ProfileSlice;
