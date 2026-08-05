import create, {GetState, SetState} from "zustand";
import _ from "lodash";
import {message} from "antd";
import {appFormat} from '@/utils/messageFormat';
import {confirmDestructive} from "@/utils/destructiveConfirm";
import {showSyncResultModal} from "@/utils/syncResultModal";
import {compareStringVersion, compareStringVersionForSort} from "@/utils/string";
import useProjectStore from "@/store/project/useProjectStore";
import * as Save from '@/utils/save';
import {getAllDataSQL, getCodeByChanges} from "@/utils/json2code";
import moment from "moment";
import produce from "immer";
import { POST } from "@/services/crud";
import * as cache from "@/utils/cache";
import { CONSTANT } from "@/utils/constant";
import { SNAPSHOT_DB, SNAPSHOT_DB_KEY } from "@/utils/versionConstants";
import {
  baselineProjectJSON,
  buildLatestVersionQuery,
  hasBaseline,
  resolveBaselineDbKey,
  type BaselineRecord,
} from "@/utils/versionBaseline";
import {
  checkVersionStructuralDiff,
  hasMeaningfulVersionChanges,
  snapshotProjectJSONForVersion,
} from "@/utils/versionStructuralDiff";
import {
  handleVersionSaveResponse,
  isVersionSaveDuplicate,
} from "@/utils/versionSaveConflict";


export const SHOW_CHANGE_TYPE = {
  // 默认为最新版本变化
  DEFAULT: "lastVersion",
  // 计算当前选中
  CURRENT: "currentVersion",
  // 多版本差异比较
  MULTI: "multiVersionCompare",
}

export type IVersionSlice = {
  checkBaseVersion: (versions: any) => void;
  getVersionMessage: (versionData: any, only?: boolean) => void;
  getDBVersion: () => void;
  getAllTable: (dataSource: any) => any;
  /** A 层差异：当前模型 ↔ 独立查询到的最新版本基线 */
  calcChanges: () => Promise<any[]>;
  compareField: (currentField: any, checkField: any, table: any) => any;
  compareEntity: (currentTable: any, checkTable: any) => any;
  compareIndexs: (currentTable: any, checkTable: any) => any;
  compareIndex: (currentIndex: any, checkIndex: any, table: any) => any;
  compareStringArray: (currentFields: any, checkFields: any, title: any, name: any) => any;
  setState: (value: any) => void;
  getCurrentDB: () => any;
  getCurrentDBData: () => any;
  dropVersionTable: () => void;
  setCurrentVersion: (currentVersion: any, index: number) => void;
  getOptName: (opt: any) => any;
  getTypeName: (type: any) => any;
  constructorMessage: (changes: any) => any;
  showChanges: (type: string, change: any, currentVersion: any, lastVersion: any) => void;
  setChanges: (changes: any) => void;
  checkVersionCount: (version: any) => any;
  execSQL: (data: any, version: any, updateDBVersion: any, cb: any, onlyUpdateDBVersion: any) => void;
  generateSQL: (dbData: any, version: any, data: any, updateVersion: any, cb?: any, onlyUpdateVersion?: any) => void;
  getCMD: (updateVersion: any, onlyUpdateVersion: any) => any;
  connectJDBC: (param: any, opt: any, cb: any) => void;
  updateVersionData: (newVersion: any, oldVersion: any, status: any) => void;
  /** 回滚到历史快照：仅 saveProject code===200 写 store + 成功 toast；失败不写 store */
  revertVersionData: () => Promise<boolean>;
  readDb: (status: any, version: any, lastVersion: any, changes: any, initVersion: any, updateVersion: any) => void;
  saveNewVersion: (version: any) => Promise<boolean>;
  rebuild: (tempValue: any) => void;
  initBase: (tempValue: any, msg?: string) => void;
  initSave: (version: any, msg: any) => void;
  initDbs: (dbs: any) => void;
  /** 切换默认数据源：仅 setDefaultDb 落盘成功后更新本地标记；失败不改 store */
  dbChange: (d: any) => Promise<boolean>;
  resolveDb: () => void;
  compare: (state: any) => void;
  checkVersionData: (dataSource1: any, dataSource2: any) => any;
  /** 独立拉取最新版本作为 A 层基线（ADR-0022）；与版本列表分页解耦 */
  fetchVersionBaseline: (db?: any) => Promise<BaselineRecord>;
  recalculateChanges: () => void;
}


export type VersionState =
  {
    init: boolean;
    currentVersion: any;
    currentVersionIndex: number | undefined;
    hasDB: boolean;
    versions: any[];
    totalVersions: number;
    currentPage: number;
    pageSize: number;
    messages: any;
    data: any;
    dbVersion: string | undefined;
    /** A 层差异：当前模型相对基线的变更项（非版本分组） */
    changes: any[];
    /** A 层基线：独立查询到的最新版本（null = 尚未存过版本） */
    versionBaseline: BaselineRecord;
    /** 基线是否已查过：未查过时不得断言「无差异」 */
    baselineLoaded: boolean;
    dbs: any;
    synchronous: any;
    incrementVersionData: any;
    fetch: (db: any, page?: number, pageSize?: number) => Promise<void>;
    setPageSize: (newPageSize: number) => void;
    dispatch: IVersionSlice;
  }
  const DB_CHANGE_URL = '/ncnb/dbChange';

const useVersionStore = create<VersionState>(
  (set: SetState<VersionState>, get: GetState<VersionState>) => ({
    init: true,
    currentVersion: {},
    currentVersionIndex: undefined,
    hasDB: false,
    versions: [],
    totalVersions: 0,
    currentPage: 1,
    pageSize: 10,
    messages: [],
    data: undefined,
    dbVersion: '0.0.0',
    changes: [],
    versionBaseline: null,
    baselineLoaded: false,
    dbs: [],
    incrementVersionData: {},
    synchronous: {},
    fetch: async (db: any, current = 1, pageSize = 10) => {
      const currentDB = db?.key ? db : get().dispatch.getCurrentDBData();
      if (!currentDB || !currentDB.key) {
        return;
      }
      const isSnapshot = currentDB.isSnapshot || currentDB.key === SNAPSHOT_DB_KEY;
      try {
        const res = await POST(DB_CHANGE_URL, {
          dbKey: currentDB.key,
          projectId: cache.getItem(CONSTANT.PROJECT_ID),
          current,
          size: pageSize,
          orders: [{ column: 'version', asc: false }],
        });
        if (res && res.data && res.data.records) {
          set(produce((state) => {
            state.versions = res.data.records;
            state.totalVersions = res.data.total;
            state.currentPage = current;
            state.pageSize = pageSize;
          }));
          if (!isSnapshot) {
            get().dispatch.getDBVersion();
          } else {
            set({ dbVersion: '0.0.0', hasDB: false, init: false });
          }
          get().dispatch.checkBaseVersion(currentDB);
          get().dispatch.calcChanges();
        } else {
          message.error(appFormat()('versionStore.fetch.failed'));
          get().dispatch.checkBaseVersion(currentDB);
        }
      } catch (error: any) {
        message.error(
          appFormat()('versionStore.fetch.failedWithDetail', {
            detail: error?.message || error,
          }),
        );
        get().dispatch.checkBaseVersion(currentDB);
      }
    },
    setPageSize: (newPageSize: number) => {
      set(produce(state => {
        state.pageSize = newPageSize;
      }));
    },
    dispatch: {
      compareStringArray: (currentFields: any, checkFields: any, title: any, name: any) => {
        const changes: any = [];
        currentFields.forEach((f: any) => {
          if (!checkFields.includes(f)) {
            changes.push({
              type: 'index',
              name: `${title}.${name}.fields.${f}`,
              opt: 'update',
              changeData: `addField=>${f}`,
            });
          }
        });
        checkFields.forEach((f: any) => {
          if (!currentFields.includes(f)) {
            changes.push({
              type: 'index',
              name: `${title}.${name}.fields.${f}`,
              opt: 'update',
              changeData: `deleteField=>${f}`,
            });
          }
        });
        return changes;
      },
      compareIndex: (currentIndex: any, checkIndex: any, table: any) => {
        const changes: any = [];
        Object.keys(currentIndex).forEach((name) => {
          if (checkIndex[name] !== currentIndex[name]) {
            changes.push({
              type: 'index',
              name: `${table.title}.${currentIndex.name}.${name}`,
              opt: 'update',
              changeData: `${checkIndex[name]}=>${currentIndex[name]}`,
            });
          }
        });
        return changes;
      },
      compareIndexs: (currentTable: any, checkTable: any) => {
        const changes: any = [];
        const currentIndexs = currentTable?.indexs || [];
        const checkIndexs = checkTable?.indexs || [];
        const checkIndexNames = checkIndexs.map((index: any) => index.name);
        const currentIndexNames = currentIndexs.map((index: any) => index.name);
        currentIndexs.forEach((cIndex: any) => {
          if (!checkIndexNames.includes(cIndex.name)) {
            changes.push({
              type: 'index',
              name: `${currentTable.title}.${cIndex.name}`,
              opt: 'add',
            });
          } else {
            const checkIndex = checkIndexs.filter((c: any) => c.name === cIndex.name)[0] || {};
            changes.push(...get().dispatch.compareIndex(_.omit(cIndex, ['fields']),
              _.omit(checkIndex, ['fields']), currentTable));
            // 比较索引中的属性
            const checkFields = checkIndex.fields || [];
            const currentFields = cIndex.fields || [];
            changes.push(...get().dispatch.compareStringArray(
              currentFields, checkFields, currentTable.title, cIndex.name));
          }
        });
        checkIndexs.forEach((cIndex: any) => {
          if (!currentIndexNames.includes(cIndex.name)) {
            changes.push({
              type: 'index',
              name: `${currentTable.title}.${cIndex.name}`,
              opt: 'delete',
            });
          }
        });
        return changes;
      },
      compareEntity: (currentTable: any, checkTable: any) => {
        const changes: any = [];
        Object.keys(currentTable).forEach((name) => {
          if (checkTable[name] !== currentTable[name]) {
            changes.push({
              type: 'entity',
              name: `${currentTable.title}.${name}`,
              opt: 'update',
              changeData: `${checkTable[name]}=>${currentTable[name]}`,
            });
          }
        });
        return changes;
      },
      compareField: (currentField: any, checkField: any, table: any) => {
        const changes: any = [];
        Object.keys(currentField).forEach((name) => {
          if (name !== 'typeName' && name !== 'dataType' && checkField[name] !== currentField[name]) {
            changes.push({
              type: 'field',
              name: `${table.title}.${currentField.name}.${name}`,
              opt: 'update',
              changeData: `${checkField[name]}=>${currentField[name]}`,
            });
          }
        });
        return changes;
      },
      getAllTable: (dataSource: any) => {
        return (dataSource?.modules || []).reduce((a: any, b: any) => {
          return a.concat((b.entities || []));
        }, []);
      },
      fetchVersionBaseline: async (db?: any): Promise<BaselineRecord> => {
        const dbKey = resolveBaselineDbKey({
          explicitKey: db?.key,
          dbs: get().dbs,
          profileDefaultId: useProjectStore.getState().project?.projectJSON?.profile
            ?.defaultDataSourceId,
        });
        const projectId = cache.getItem(CONSTANT.PROJECT_ID);
        if (!projectId) {
          return get().versionBaseline;
        }
        try {
          const res = await POST(DB_CHANGE_URL, buildLatestVersionQuery(dbKey, projectId));
          if (!res || res.code !== 200) {
            throw new Error(res?.msg || `baseline fetch failed (${res?.code ?? 'no response'})`);
          }
          const records = res?.data?.records;
          const baseline: BaselineRecord =
            Array.isArray(records) && records.length > 0 ? records[0] : null;
          set(produce((state) => {
            state.versionBaseline = baseline;
            state.baselineLoaded = true;
          }));
          get().dispatch.recalculateChanges();
          return baseline;
        } catch (error: any) {
          // 基线未知：不得静音成「无差异」；失败时显式清 loaded，避免沿用旧基线判「一致」
          set(produce((state) => {
            state.baselineLoaded = false;
          }));
          message.error(
            appFormat()('versionStore.baseline.fetchFailedWithDetail', {
              detail: error?.message || error,
            }),
          );
          return null;
        }
      },
      calcChanges: async () => {
        const projectState = useProjectStore.getState();
        const dataSource = projectState?.project?.projectJSON;

        if (!dataSource) {
          console.warn("Project JSON is not available yet");
          return [];
        }

        const baseline = await get().dispatch.fetchVersionBaseline();
        if (!get().baselineLoaded) {
          return [];
        }
        // 无基线（尚未存过版本）→ 相对空模型算增量，脏 = 当前模型全部未提交
        const changes = get().dispatch.checkVersionData(
          { ...dataSource },
          baselineProjectJSON(baseline),
        );
        set(produce((state) => {
          state.changes = changes;
        }));
        return changes || [];
      },
      getDBVersion: () => set(produce(() => {
        const dbData = get().dispatch.getCurrentDBData();
        if (!dbData || dbData.isSnapshot || dbData.key === SNAPSHOT_DB_KEY) {
          set({ dbVersion: '0.0.0', hasDB: false });
          return;
        }

        Save.dbversion({
          ...dbData.properties,
          dbKey: dbData.key
        }).then((res: any) => {
          if (res && res.code === 200) {
            set({
              dbVersion: res.data,
              hasDB: true,
            });
            message.success(appFormat()('versionStore.dbVersion.fetchSuccess'));
          } else {
            set({
              dbVersion: '',
              hasDB: false,
            });
            message.error(appFormat()('versionStore.dbVersion.fetchFailed'));
          }
        }).catch(() => {
          set({
            dbVersion: '',
            hasDB: false,
          });
          message.error(appFormat()('versionStore.dbVersion.fetchFailed'));
        });
      })),
      checkBaseVersion: async (db: any) => {
        const currentDB = db || get().dispatch.getCurrentDBData();
        if (!currentDB || !currentDB.key) {
          set({ init: false });
          return;
        }
        if (currentDB.isSnapshot || currentDB.key === SNAPSHOT_DB_KEY) {
          // 快照通道不要求 JDBC 基线，允许直接保存版本
          set({ init: false });
          return;
        }
        try {
          // 获取最早的版本记录
          const res = await POST(DB_CHANGE_URL,
            { dbKey: currentDB.key,
              projectId: cache.getItem(CONSTANT.PROJECT_ID),
              current: 1,
              size: 1,
              orders: [
                {
                  column: "version",
                  asc: true  // 升序排列，获取最早的版本
                }
              ]
             });
          if (res && res.data && res.data.records && res.data.records.length > 0) {
            const earliestVersion = res.data.records[0];
            set(produce(state => {
              // 判断历史版本文是否存在
              if (earliestVersion) {
                state.init = false;
              } 
            }));
          } else {
            // 如果没有版本记录，设置 init 为 true
            set({ init: true });
            // message.warning('当前数据不存在任何版本，请先初始化基线', 2);
          }
        } catch (error) {
          message.error(appFormat()('versionStore.baseline.checkFailed'));
          // message.error(`检查基线版本失败: ${error.message}`);
          // set({ init: true }); // 在错误情况下也设置 init 为 true
        }
      },
      getVersionMessage: (versionData: any, only?: boolean) => {
        const {versions = []} = get();
        let tempVersions = [];
        if (Array.isArray(versionData)) {
          tempVersions = versionData;
        } else if (versionData) {
          tempVersions = only ? [].concat(versionData) : versions.concat(versionData);
        }
        set({
          versions: tempVersions.map((data: any) => _.pick(data,
            ['id', 'version', 'versionDesc', 'changes', 'versionDate', 'projectJSON', 'baseVersion','creator']))
            .sort((a: any, b: any) => compareStringVersionForSort(b.version, a.version, true)),
        });
      },
      setState: (value: any) => {
        _.assign(get(), value);
      },
      getCurrentDB: () => {
        const db = get().dispatch.getCurrentDBData();
        if (db) {
          return db.name;
        }
        return '';
      },
      getCurrentDBData: () => {
        const found = get().dbs?.find((d: any) => d.defaultDB);
        // 未配置 JDBC 时走模型快照通道，保证「保存版本」零摩擦
        return found || { ...SNAPSHOT_DB };
      },
      dropVersionTable: () => {
        const dbData = get().dispatch.getCurrentDBData();
        if (!dbData) {
          set({
            dbVersion: '',
          })
          message.error(appFormat()('versionStore.datasource.unavailable'));
        } else {
          Save.rebaseline({
            ...dbData,
            dbKey: dbData.key,
            version: '0.0.0',
            versionDesc: '基线本，新建版本时请勿低于该版本',
          }).then((res) => {
            if (res && res.code === 200) {
              message.success(appFormat()('versionStore.rebaseline.success'));
              get().dispatch.getDBVersion();
            } else {
              message.error(appFormat()('versionStore.rebaseline.failed'));
            }
          }).catch((err) => {
            message.error(
              appFormat()('versionStore.rebaseline.failedWithDetail', {
                detail: err.message,
              }),
            );
          });
        }
      },
      setCurrentVersion: (currentVersion: any, currentVersionIndex: any) => {
        set({
          currentVersion,
          currentVersionIndex,
        });
      },
      getOptName: (opt: any) => {
        let optName = '';
        switch (opt) {
          case 'update':
            optName = '新';
            break;
          case 'add':
            optName = '新增';
            break;
          case 'delete':
            optName = '删除';
            break;
          default:
            optName = '未知操作';
            break;
        }
        return optName;
      },
      getTypeName: (type: any) => {
        let optName = '';
        switch (type) {
          case 'entity':
            optName = '表';
            break;
          case 'index':
            optName = '索引';
            break;
          case 'field':
            optName = '属性';
            break;
          case 'association':
            optName = '关联';
            break;
          case 'diagram':
            optName = '关系图';
            break;
          case 'profile':
            optName = '项目配置';
            break;
          case 'datatype':
            optName = '数据类型';
            break;
          case 'module':
            optName = '模块';
            break;
          default:
            optName = '未知类型';
            break;
        }
        return optName;
      },
      constructorMessage: (changes: any) => {
        if (!Array.isArray(changes)) {
          console.error('changes is not an array:', changes);
          return [];
        }
        return changes.map((c: any) => {
          let tempMsg = `${get().dispatch.getOptName(c.opt)}${get().dispatch.getTypeName(c.type)}「${c.name}」`;
          if (c.changeData) {
            tempMsg += `：${c.changeData}`;
          }
          return {
            message: tempMsg,
            opt: c.opt,
            type: c.type,
            name: c.name,
            changeData: c.changeData,
          };
        });
      },
      showChanges: (type: string, change: any, currentVersion: any, lastVersion: any) => {
        const dataSource = _.get(useProjectStore.getState().project, "projectJSON");
        const {changes, init, currentVersionIndex, versions} = get();
        if (!currentVersion || !lastVersion) {
          currentVersion = get().currentVersion;
          lastVersion = currentVersionIndex ? versions[currentVersionIndex + 1] || currentVersion : currentVersion;
        }
        let tempChanges;
        if (type === SHOW_CHANGE_TYPE.CURRENT) {
          tempChanges = currentVersion.changes || [];
        } else if (type === SHOW_CHANGE_TYPE.MULTI) {
          tempChanges = [...change];
        } else {
          tempChanges = [...changes];
        }
        if (tempChanges) {
          _.remove(tempChanges, function (n: any) {
            return (
              n?.type === "field"
              && n?.opt === 'update'
              && (n?.changeData && n?.changeData?.search('undefined=>') > -1)
            );
          });
        }
        const configData = _.get(useProjectStore.getState().project, 'configJSON');

        const tempValue = {
          ...(configData?.synchronous || {upgradeType: 'increment'}),
        };
        if (tempValue.upgradeType === 'rebuild') {
          // 如果是重建数据表则不需要字段更新的脚本
          // 1.提取所有字段以及索引所在的数据表
          const entities: any = [];
          // 2.暂存新增和删除的数据表
          const tempEntitiesUpdate: any = [];
          tempChanges.forEach((c) => {
            if (c.type === 'entity') {
              tempEntitiesUpdate.push(c);
            } else {
              entities.push(c.name.split('.')[0]);
            }
          });
          tempChanges = [...new Set(entities)].map((e) => {
            // 构造版本变化数据
            return {
              type: 'entity',
              name: e,
              opt: 'update',
            };
          }).concat(tempEntitiesUpdate);
        } else {
          // todo 暂时取消数据表的中文名以及其他变化时所生成的更新数据
          // tempChanges = tempChanges.filter(c => !(c.type === 'entity' && c.opt === 'update'));
        }
        let messages;
        if (type === SHOW_CHANGE_TYPE.CURRENT) {
          messages = get().dispatch.constructorMessage(currentVersion?.changes || []);
        } else if (type === SHOW_CHANGE_TYPE.MULTI) {
          messages = get().dispatch.constructorMessage(change || []);
        } else {
          messages = get().dispatch.constructorMessage(changes || []);
        }
        set({
            messages
          }
        );
        const dbData = get().dispatch.getCurrentDBData();
        const code = _.get(dbData, 'select', 'MYSQL');
        let data = '';
        if (init) {
          data = getAllDataSQL({
            ...dataSource,
            modules: dataSource?.modules || [],
          }, code);
        } else {
          data = currentVersion.baseVersion ?
            getAllDataSQL({
              ...dataSource,
              modules: currentVersion.projectJSON ? currentVersion.projectJSON.modules : currentVersion.modules,
            }, code) :
            getCodeByChanges({
              ...dataSource,
              modules: currentVersion.projectJSON ? currentVersion.projectJSON.modules : currentVersion.modules,
            }, tempChanges, code, {
              modules: lastVersion.projectJSON ? lastVersion.projectJSON.modules : lastVersion.modules,
            });
        }
        set({
          data
        })
      },
      setChanges: (changes: any) => {
        set({
          changes
        })
      },
      checkVersionCount: (version: any) => {
        const {dbVersion, versions} = get();
        // 1.获取所有当前比数据源版本的版本
        let lowVersions = [];
        if (!dbVersion) {
          lowVersions = versions;
        } else {
          lowVersions = versions.filter((v: any) => {
            const cmp = compareStringVersion(v.version, dbVersion);
            return cmp === null || cmp > 0;
          });
        }
        return lowVersions
          .filter((v: any) => v.version !== version.version)
          .some((v: any) => {
            const cmp = compareStringVersion(v.version, version.version);
            return cmp === null || cmp <= 0;
          });
      },
      execSQL: (data: any, version: any, updateDBVersion: any, cb: any, onlyUpdateDBVersion: any) => {
        const dbData = get().dispatch.getCurrentDBData();
        if (!dbData) {
          set({
            dbVersion: '',
          });
          message.error(appFormat()('versionStore.datasource.unavailable'));
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          cb && cb();
        } else {
          confirmDestructive({
            title: appFormat()('versionStore.confirm.sync.title'),
            content: onlyUpdateDBVersion
              ? appFormat()('versionStore.confirm.markSync.content')
              : appFormat()('versionStore.confirm.sync.content'),
            okText: onlyUpdateDBVersion
              ? appFormat()('versionStore.confirm.markSync.ok')
              : appFormat()('versionStore.confirm.sync.ok'),
            okType: 'danger',
            cancelText: appFormat()('versionStore.confirm.cancel'),
            onOk: (m) => {
              const cb1 = () => {
                get().fetch(null,get().currentPage,get().pageSize);
                m && m();
              }
              get().dispatch.generateSQL(dbData, version, data, updateDBVersion, cb1, onlyUpdateDBVersion);
              cb && cb();
            }
          });
        }
      },
      generateSQL: (dbData: any, version: any, data: any, updateVersion: any, cb: any, onlyUpdateVersion: any) => {
        // 判断是否是标记为同步还是同步
        const cmd = get().dispatch.getCMD(updateVersion, onlyUpdateVersion);
        // 获取外层目录
        const dataSource = _.get(useProjectStore.getState().project, 'projectJSON');
        if (dbData) {
          const sqlParam = {
            version: undefined,
            versionDesc: undefined,
            sql: undefined,
            separator: undefined
          };
          if (updateVersion) {
            sqlParam.versionDesc = version.versionDesc;
            sqlParam.version = version.version;
          }
          if (!onlyUpdateVersion) {
            const separator = _.get(dataSource, 'profile.sqlConfig', '/*SQL@Run*/');
            sqlParam.sql = data;
            sqlParam.separator = separator;
          }

          get().dispatch.connectJDBC({
            ...dbData.properties,
            ...sqlParam,
            dbKey: dbData.key,
            showModal: true,
          }, cmd, () => {
            cb && cb();
            set({
              synchronous: {
                ...get().synchronous,
                [version.version]: false,
              },
            });
          });
        }
      },
      getCMD: (updateVersion: any, onlyUpdateVersion: any) => {
        // 一共有三种情况
        // 1.预同步 执行SQL但是不更新版本号
        // 2.同步 执行SQL同时更新版本号
        // 3.标记为同步 只更新版本号
        let cmd = 'dbsync';
        if (onlyUpdateVersion) {
          cmd = 'updateVersion';
        } else if (updateVersion) {
          cmd = 'dbsync';
        } else {
          cmd = 'sqlexec';
        }
        return cmd;
      },
      connectJDBC: (param: any, opt: any, cb: any) => {
        const clearSyncing = () => {
          const ver = param?.version;
          if (!ver) {
            return;
          }
          set({
            synchronous: {
              ...get().synchronous,
              [ver]: false,
            },
          });
        };
        /** 确认窗关后焦点易坠 body；结果 Modal 打开前钉回「同步」以便 Esc 归还 */
        const focusSyncTrigger = () => {
          const el = document.querySelector<HTMLElement>(
            '[data-testid="version-sync-btn"]:not([disabled])',
          );
          el?.focus();
        };
        Save[opt](param).then((res: any) => {
          if (res.code === 200) {
            cb && cb();
            focusSyncTrigger();
            showSyncResultModal({ ok: true, content: res.data });
            return;
          }
          // 失败须清「正在同步」，否则标签卡死、用户误以为不可重试
          clearSyncing();
          focusSyncTrigger();
          showSyncResultModal({
            ok: false,
            content: res.msg || res.message || appFormat()('versionStore.sync.failed'),
          });
        }).catch((err: any) => {
          clearSyncing();
          message.error(
            appFormat()('versionStore.sync.failedWithDetail', { detail: err.message }),
          );
        });
      },
      updateVersionData: (newVersion: any, oldVersion: any, status: any) => {
        if (status === 'update') {
          const dbData = get().dispatch.getCurrentDBData();
          Save.hisProjectSave({...newVersion, dbKey: dbData.key}).then((res) => {
            if (res.code === 200) {
              message.success(appFormat()('versionStore.update.success'));
              set({
                versions: get().versions.map((v: any, vIndex: any) => {
                  if (vIndex === get().currentVersionIndex) {
                    return newVersion;
                  }
                  return v;
                }),
              });
            } else {
              message.error(
                res?.msg || res?.message || appFormat()('versionStore.update.failed'),
              );
            }
          }).catch((err) => {
            message.error(
              appFormat()('versionStore.update.failedWithDetail', { detail: err.message }),
            );
          });
        } else {
          // 删除原来的
            Save.hisProjectDelete(newVersion.id).then((res) => {
            if (res.code === 200) {
              message.success(appFormat()('versionStore.delete.success'));
              const tempVersions = get().versions.filter((v: any) => v.id !== newVersion.id);
              set({ versions: tempVersions });
              // 删版本后基线可能变化：重新独立查询（勿把 Promise 塞进 changes）
              get().dispatch.calcChanges();
              get().dispatch.checkBaseVersion(null);
              return;
            }
            // 业务失败：request 已 toast；勿伪装成功
          }).catch((err) => {
            message.error(
              appFormat()('versionStore.delete.failedWithDetail', { detail: err.message }),
            );
            get().dispatch.checkBaseVersion(null);
          });
        }
        get().fetch(null,get().currentPage,get().pageSize);
      },
      revertVersionData: async (): Promise<boolean> => {
        const ver = get()?.currentVersion;
        const modules = ver?.projectJSON?.modules;
        if (!(modules instanceof Array) || modules.length === 0) {
          message.error(appFormat()('versionStore.revert.noSnapshot'));
          return false;
        }
        const project = useProjectStore.getState().project;
        if (!project?.projectJSON) {
          message.error(appFormat()('versionStore.revert.noProject'));
          return false;
        }
        // 禁止先 setModules 再异步 save：失败时树/画布已回滚像成功
        const next = produce(project, (draft: any) => {
          draft.projectJSON.modules = modules;
        });
        const {
          persistProjectNow,
          ackManualPersist,
        } = await import('@/store/project/projectAutosave');
        const saved = await persistProjectNow(
          next,
          appFormat()('versionStore.revert.persistFailed'),
        );
        if (!saved) {
          // 失败 toast 已弹；不写 store，弹层保持可重试
          return false;
        }
        useProjectStore.getState().dispatch.setModules(modules);
        ackManualPersist(true);
        message.success(
          appFormat()('versionStore.revert.success', { version: ver?.version ?? '' }),
        );
        get().fetch(null, get().currentPage, get().pageSize);
        return true;
      },
      readDb: (status: any, version: any, lastVersion: any, changes = [], initVersion: any, updateVersion: any) => {
        if (!status) {
          const dbData = get().dispatch.getCurrentDBData();
          if (!dbData) {
            message.error(appFormat()('versionStore.datasource.unavailableDetailed'));
          } else {
            let flag = false;
            if (!initVersion) {
              flag = get().dispatch.checkVersionCount(version);
            }
            if (flag) {
              message.error(appFormat()('versionModal.compare.crossVersionError'));
            } else {
              confirmDestructive({
                title: appFormat()('versionStore.confirm.sync.title'),
                content: appFormat()('versionStore.confirm.sync.content'),
                okText: appFormat()('versionStore.confirm.sync.ok'),
                okType: 'danger',
                cancelText: appFormat()('versionStore.confirm.cancel'),
                onOk: (m) => {
                  // 须走 set，禁止 _.set 绕过 zustand（否则「正在同步」不刷新或失败后死态）
                  set({
                    synchronous: {
                      ...get().synchronous,
                      [version.version]: true,
                    },
                  });
                  m && m();
                  const configData = _.get(useProjectStore.getState().project, "configJSON");
                  const tempValue = {
                    ...(configData?.synchronous || {upgradeType: 'increment'}),
                  };
                  let data = '';
                  // 判断是否为初始版本，如果为初始版本则需要生成全量脚本
                  if (initVersion) {
                    data = getAllDataSQL({
                      ..._.get(useProjectStore.getState().project, "projectJSON"),
                      modules: version?.projectJSON?.modules || [],
                    }, _.get(dbData, 'select', 'MYSQL'));
                  } else {
                    let tempChanges: any[] = [...(changes || [])];
                    // @ts-ignore
                    if (tempValue.upgradeType === 'rebuild') {
                      // 如果是重建数据表则不需要字段更新的脚本
                      // 1.提取所有字段以及索引所在的数据表
                      let entities: any = [];
                      // 2.暂存新增和删除的数据表
                      const tempEntitiesUpdate: any = [];
                      tempChanges.forEach((c: any) => {
                        if (c.type === 'entity') {
                          tempEntitiesUpdate.push(c);
                        } else {
                          entities.push(c.name.split('.')[0]);
                        }
                      });
                      tempChanges = [...new Set(entities)].map((e) => {
                        // 构造版本变化数据
                        return {
                          type: 'entity',
                          name: e,
                          opt: 'update',
                        };
                      }).concat(tempEntitiesUpdate);
                    } else {
                      // todo 暂时取消数据表的中文名以及其他变化时所生成的更新数据
                      tempChanges = tempChanges.filter((c: any) => !(c.type === 'entity' && c.opt === 'update'));
                    }
                    data = getCodeByChanges({
                        ..._.get(useProjectStore.getState().project, "projectJSON"),
                        modules: version?.projectJSON?.modules || [],
                      }, tempChanges,
                      _.get(dbData, 'select', 'MYSQL'), lastVersion?.projectJSON);
                  }
                  get().dispatch.generateSQL(dbData, version, data, updateVersion, () => get().fetch(null,get().currentPage,get().pageSize));
                }
              });
            }
          }
        }
      },
      saveNewVersion: async (tempValue: any) => {
        const fmt = appFormat();
        if (!tempValue.version || !tempValue.versionDesc) {
          message.error(fmt('versionStore.validation.versionAndDescRequired'));
          return false;
        }

        if (get().versions.map((v: any) => v.version).includes(tempValue.version)) {
          message.error(fmt('versionModal.renameVersion.duplicateVersion'));
          return false;
        }

        const tag = (tempValue.tag || '').trim() || undefined;

        // 与基线（独立查询的最新版本）比，而不是分页列表的第一条
        const latest = get().versionBaseline?.version || get().versions[0]?.version;
        if (latest) {
          const latestCmp = compareStringVersion(tempValue.version, latest);
          if (latestCmp === null) {
            message.error(fmt('versionModal.renameVersion.formatNotComparable'));
            return false;
          }
          if (latestCmp <= 0) {
            message.error(fmt('versionModal.renameVersion.notGreaterThanExisting'));
            return false;
          }
        }

        try {
          const changes = await get().dispatch.calcChanges();
          const changesArray = Array.isArray(changes) ? changes : [];
          if (!hasMeaningfulVersionChanges(changesArray)) {
            message.warning(fmt('versionStore.save.noModelDiffWarning'));
          }
          const dbData = get().dispatch.getCurrentDBData();
          const projectState = useProjectStore.getState();
          const projectJSON = projectState?.project?.projectJSON;

          const version = {
            projectJSON: snapshotProjectJSONForVersion(projectJSON),
            dbKey: dbData.key,
            // 首版判定看基线，列表可能只是空的第 N 页
            baseVersion: get().baselineLoaded
              ? !hasBaseline(get().versionBaseline)
              : get().versions.length === 0,
            version: tempValue.version,
            versionDesc: tempValue.versionDesc,
            tag: tag || undefined,
            changes: changesArray,
            versionDate: moment().format('YYYY/M/D H:m:s'),
          };

          const res = await Save.hisProjectSave(version);
          if (handleVersionSaveResponse(res)) {
            get().dispatch.getVersionMessage(res.data);
            message.success(fmt('versionStore.save.success'));
            await get().fetch(dbData, get().currentPage, get().pageSize);
            await get().dispatch.fetchVersionBaseline(dbData);
            return true;
          }
          if (!isVersionSaveDuplicate(res)) {
            message.error(res?.msg || res?.message || fmt('versionStore.save.failed'));
          }
          return false;
        } catch (err: any) {
          message.error(
            fmt('versionStore.save.failedWithDetail', { detail: err?.message || err }),
          );
          return false;
        }
      },
      rebuild: (tempValue: any) => {
        // 表单 Modal 已关：落焦重建钮，Esc 才能归还
        (
          document.querySelector<HTMLElement>('[data-testid="version-rebuild-btn"]') ??
          document.querySelector<HTMLElement>('[aria-label="重建版本"]')
        )?.focus();
        confirmDestructive({
          title: appFormat()('versionStore.confirm.rebuild.title'),
          content: appFormat()('versionStore.confirm.rebuild.content'),
          okText: appFormat()('versionStore.confirm.rebuild.ok'),
          okType: 'danger',
          cancelText: appFormat()('versionStore.confirm.cancel'),
          onOk: () => {
            // 重新初始化
            // 先删除所有的版本信息
            get().dispatch.initBase(tempValue, appFormat()('versionStore.rebuild.success'));
          }
        });
      },
      initBase: (tempValue: any, msg: any) => {
        const fmt = appFormat();
        if (!tempValue.version || !tempValue.versionDesc) {
          message.error(fmt('versionStore.validation.versionAndDescRequired'));
        } else {
          const dbData = get().dispatch.getCurrentDBData();
          const projectState = useProjectStore.getState();

          const version = {
            projectJSON: snapshotProjectJSONForVersion(projectState?.project?.projectJSON),
            dbKey: dbData.key,
            baseVersion: true,
            version: tempValue.version,
            versionDesc: tempValue.versionDesc,
            changes: [],
            versionDate: moment().format('YYYY/M/D H:m:s'),
          };
          if (msg) {
            Save.hisProjectDeleteAll(dbData.key).then((res) => {
              if (res.code === 200) {
                get().dispatch.initSave(version, msg);
              } else {
                message.error(fmt('versionStore.rebuild.failed'));
              }
            }).catch((err) => {
              message.error(
                fmt('versionStore.rebuild.failedWithDetail', { detail: err.message }),
              );
            });
          } else {
            get().dispatch.initSave(version, msg);
          }
        }
      },
      initSave: (version: any, msg: any) => {
        const fmt = appFormat();
        Save.hisProjectSave(version).then((res) => {
          if (handleVersionSaveResponse(res)) {
            message.success(msg || fmt('versionModal.initVersion.success'));
            get().fetch(null, get().currentPage, get().pageSize);
            // 仅成功后 rebaseline，禁止失败仍重置数据源版本
            get().dispatch.dropVersionTable();
            return;
          }
          // 业务失败：409001 由 Modal 处理；其余 request 已 toast
          get().fetch(null, get().currentPage, get().pageSize);
        }).catch(() => {
          // 网络/HTTP：errorHandler 已 toast；刷新列表便于重试
          get().fetch(null, get().currentPage, get().pageSize);
        });
      },
      initDbs: (dbs: any) => set(produce(state => {
        const defaultId = useProjectStore.getState().project?.projectJSON?.profile?.defaultDataSourceId;
        const {markDefaultDataSource} = require('@/utils/projectDataSource');
        state.dbs = markDefaultDataSource(dbs || [], defaultId);
      })),
      dbChange: async (d: any): Promise<boolean> => {
        const selected = get().dbs.find(
          (db: any) => db.name === d.value || db.key === d.value,
        );
        if (!selected?.key) {
          return false;
        }
        const ok = await useProjectStore
          .getState()
          .dispatch.setDefaultDb(selected.key);
        if (!ok) {
          // 失败 toast 已弹；不改本地 defaultDB 标记
          return false;
        }
        set(
          produce((state) => {
            state.dbs = state.dbs.map((db: any) => ({
              ...db,
              defaultDB: db.name === d.value || db.key === d.value,
            }));
          }),
        );
        get().fetch(selected || d, get().currentPage, get().pageSize);
        return true;
      },
      resolveDb: () => set(produce(state => {
        state.hasDB = state.dbs && state.dbs.length > 0;
      })),
      compare: (state: any) => {
        if (get().versions.length > 1) {
          if (!state.initVersion || !state.incrementVersion) {
            console.warn('版本未选择，使用默认值');
            state.initVersion = get().versions[1].version;
            state.incrementVersion = get().versions[0].version;
          }
          const rangeCmp = compareStringVersion(state.incrementVersion, state.initVersion);
          if (rangeCmp === null) {
            message.warning(appFormat()('versionStore.compare.formatNotComparable'));
          } else if (rangeCmp <= 0) {
            message.warning(appFormat()('versionStore.compare.incrementNotGreater'));
          } else {
            // 读取两个版本下的数据信息
            let incrementVersionData = {};
            let initVersionData = {};
            get().versions.forEach((v: any) => {
              if (v.version === state.initVersion) {
                initVersionData = {modules: v.projectJSON.modules};
              }
              if (v.version === state.incrementVersion) {
                incrementVersionData = {modules: v.projectJSON.modules};
              }
            });
            const changes = get().dispatch.checkVersionData(incrementVersionData, initVersionData);
            get().dispatch.showChanges(SHOW_CHANGE_TYPE.MULTI, changes, incrementVersionData, initVersionData);
            set({
              incrementVersionData
            })
          }
        } else {
          console.warn('没有足够的版本进行比较');
        }
      },
      checkVersionData: (dataSource1: any, dataSource2: any) =>
        checkVersionStructuralDiff(dataSource1, dataSource2),
      recalculateChanges: () => {
        const state = get();
        // 基线未查过 → 差异未知，不得断言「无差异」
        if (!state.baselineLoaded) {
          return;
        }
        const currentProjectJSON = useProjectStore.getState()?.project?.projectJSON;
        if (!currentProjectJSON) {
          return;
        }
        // 基线永远是独立查询到的最新版本，与版本列表翻页无关
        const newChanges = state.dispatch.checkVersionData(
          currentProjectJSON,
          baselineProjectJSON(state.versionBaseline),
        );
        set(produce((draft) => {
          draft.changes = newChanges;
        }));
      },
    }
  })
);

/** 画布拖移等高频 projectJSON 更新：全量 diff 防抖，避免拖动时 thrash */
const debouncedRecalculateChanges = _.debounce(() => {
  useVersionStore.getState().dispatch.recalculateChanges();
}, 300);

useProjectStore.subscribe((state) => {
  if (state.project?.projectJSON) {
    debouncedRecalculateChanges();
  }
});

export default useVersionStore;
