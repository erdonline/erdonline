import type {GetState, SetState} from "zustand";
import type {ProjectState} from "@/store/project/useProjectStore";
import produce from "immer";
import ModulesSlice from "@/store/project/modulesSlice";
import DataTypeDomainsSlice from "@/store/project/dataTypeDomainsSlice";
import ProfileSlice from "@/store/project/profileSlice";
import DatabaseDomainsSlice from "@/store/project/databaseDomainsSlice";
import useGlobalStore from "@/store/global/globalStore";
import type {State} from "zustand/vanilla";
import ExportSlice from "@/store/project/exportSlice";
import { find as _find, get as _get } from 'lodash-es';
import {message} from "antd";
import {sanitizeProfileDataSources} from "@/utils/projectDataSource";
import { storeFmt } from '@/store/storeIntl';
import {
  ackManualPersist,
  persistProjectNow,
} from "@/store/project/projectAutosave";
import type {PersistOpt} from "@/store/project/persistOpt";

async function loadCryptoJS(): Promise<any> {
  const mod: any = await import('crypto-js');
  return mod.default || mod;
}

export type IProjectJsonSlice = Record<string, never>;

export interface IProjectJsonDispatchSlice {
  fixProject: (project: any) => void;
  fixModules: (modules: any, datatype: any, database: any) => any;
  getProject: () => void;
  /**
   * 写入 projectJSON。persist:true 时仅 saveProject code===200 写 store；
   * 成功返回 true（调用方再 toast）；失败 toast、不写 store。
   */
  setProjectJson: (value: any, opts?: PersistOpt) => void | Promise<boolean>;
  setModules: (value: any) => void;
  setDataTypeDomains: (value: any) => void;
  setProfile: (value: any) => void;
  addProjectTableTitle: (title: string) => void;
  getGlobalStore: () => State;
  encrypt: (type: string, origin: string) => Promise<string>;
  decrypt: (type: string, secret: string) => Promise<string>;
  diff: (previousProject: any, project: any) => any;
  patch: (r: any) => void;
  setSyncing: (sync: any) => void;
  setTimestamp: () => void;
};

const globalState = useGlobalStore.getState();

const ProjectJsonSlice = (set: SetState<ProjectState>, get: GetState<ProjectState>) => ({
  fixProject: (project: any) => set(produce(state => {
    // 读路径归一化已并入 fetch 的 hydrateFetchedProject（单次 set，避免 autosave 竞态）。
    // 保留此方法供极少数复用；打开项目勿再单独调用。
    const modules = project?.projectJSON?.modules;
    const tmpModules = get().dispatch.fixModules(modules, null, null);
    if (tmpModules) {
      state.project.projectJSON.modules = tmpModules;
    }

    // ADR-0008：打开项目即剥离 profile 内 JDBC 机密，只保留 defaultDataSourceId
    if (state.project?.projectJSON?.profile) {
      state.project.projectJSON.profile = sanitizeProfileDataSources(state.project.projectJSON.profile);
      if (state.project.projectJSON.profile.defaultDataSourceId) {
        state.currentDbKey = state.project.projectJSON.profile.defaultDataSourceId;
      }
    }
  })),
  getProject: () => set(produce(state => {
    return state.project;
  })),
  fixModules: (data: any, datatypeArg: any, databaseArg: any) => {
    const datatype = datatypeArg || get().project?.projectJSON?.dataTypeDomains?.datatype || [];
    const database = databaseArg || get().project?.projectJSON?.dataTypeDomains?.database || [];
    const defaultDatabaseCode = _find(database, {"defaultDatabase": true})?.code || database[0]?.code;
    if (!defaultDatabaseCode) {
      return data;
    }
    return data?.map((m: any) => {
      return {
        ...m,
        entities: m?.entities?.map((e: any) => {
          return {
            ...e,
            fields: e?.fields?.map((f: any) => {
              let tmpField = f;
              const d = _find(datatype, {'code': f?.type});
              const path = `apply.${defaultDatabaseCode}.type`;
              const type = _get(d, path);

              if (!f.typeName && d?.name) {
                tmpField = {
                  ...tmpField,
                  typeName: d?.name
                };
              }
              if (!f.dataType && type) {
                tmpField = {
                  ...tmpField,
                  dataType: type
                };
              }
              return tmpField;
            })
          };
        })
      }
    });
  },
  setProjectJson: (value: any, opts?: PersistOpt) => {
    const persist = !!opts?.persist;
    if (!persist) {
      set(produce((state: ProjectState) => {
        state.project.projectJSON = value;
      }));
      return;
    }
    const project = get().project;
    if (!project) {
      message.error(storeFmt('store.common.projectNotOpen'));
      return Promise.resolve(false);
    }
    const next = produce(project, (draft: ProjectState['project']) => {
      draft.projectJSON = value;
    });
    return (async () => {
      const saved = await persistProjectNow(next, storeFmt('store.persist.importSaveFailed'));
      if (!saved) {
        return false;
      }
      set(produce((state: ProjectState) => {
        state.project.projectJSON = next.projectJSON;
      }));
      ackManualPersist(true);
      return true;
    })();
  },
  setModules: (value: any) => set(produce(state => {
    state.project.projectJSON.modules = value
  })),
  setDataTypeDomains: (value: any) => set(produce(state => {
    state.project.projectJSON.dataTypeDomains = value
  })),
  setProfile: (value: any) => set(produce(state => {
    state.project.projectJSON.profile = value
  })),
  addProjectTableTitle: (title: string) => set(produce(state => {
    state.tables.push(title);
  })),
  getGlobalStore: () => {
    return globalState;
  },
  encrypt: async (type: string, origin: string) => {
    const CryptoJS = await loadCryptoJS();
    const erdPassword = get().project?.projectJSON?.profile?.erdPassword || 'ERDOnline';
    const secretKey = CryptoJS.enc.Utf8.parse(CryptoJS.MD5(erdPassword).toString());
    const iv = CryptoJS.enc.Utf8.parse(CryptoJS.MD5(secretKey).toString().substr(0, 16));
    if (type === 'AES') {
      const src = CryptoJS.enc.Utf8.parse(origin);
      const result = CryptoJS.AES.encrypt(src, secretKey, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      return result.toString();
    }
    return "";
  },
  decrypt: async (type: string, secret: string) => {
    const CryptoJS = await loadCryptoJS();
    if (type === 'AES') {
      const erdPassword = get().project?.projectJSON?.profile?.erdPassword || 'ERDOnline';
      const secretKey = CryptoJS.enc.Utf8.parse(CryptoJS.MD5(erdPassword).toString());
      const iv = CryptoJS.enc.Utf8.parse(CryptoJS.MD5(secretKey).toString().substr(0, 16));
      const decrypted = CryptoJS.AES.decrypt(secret, secretKey, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      return CryptoJS.enc.Utf8.stringify(decrypted);
    }
    return "";
  },
  diff: async (previousProject: any, project: any) => {
    const { jsondiffpatch } = await import('@/store/project/jsondiffpatch');
    return jsondiffpatch.diff(previousProject, project);
  },
  patch: async (r: any) => {
    const { jsondiffpatch } = await import('@/store/project/jsondiffpatch');
    set(produce(state => {
      const patchedProject = jsondiffpatch.patch(JSON.parse(JSON.stringify(get().project)), r.delta);
      patchedProject.timestamp = r.timestamp;
      state.project = patchedProject;
      state.syncing = true;
    }));
  },
  setSyncing: (syncing: any) => set(produce(state => {
    state.syncing = syncing;
  })),
  setTimestamp: () => set(produce(state => {
    state.project.timestamp = Date.now();
  })),
  ...ModulesSlice(set, get),
  ...DataTypeDomainsSlice(set, get),
  ...DatabaseDomainsSlice(set, get),
  ...ProfileSlice(set, get),
  ...ExportSlice(set, get),
});


export default ProjectJsonSlice;
