import create, {GetState, SetState} from "zustand";
import _ from "lodash";
import {message, Modal} from "antd";
import {compareStringVersion} from "@/utils/string";
import useProjectStore from "@/store/project/useProjectStore";
import * as Save from '@/utils/save';
import {getAllDataSQL, getCodeByChanges} from "@/utils/json2code";
import moment from "moment";
import produce from "immer";
import { fetchDatabaseConfigs } from '@/utils/databaseUtils';
import { PAGE, POST } from "@/services/crud";
import * as cache from "@/utils/cache";
import { CONSTANT } from "@/utils/constant";
import { SNAPSHOT_DB, SNAPSHOT_DB_KEY } from "@/utils/versionConstants";


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
  calcChanges: (data: any) => any;
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
  revertVersionData: () => void;
  readDb: (status: any, version: any, lastVersion: any, changes: any, initVersion: any, updateVersion: any) => void;
  saveNewVersion: (version: any) => void;
  rebuild: (tempValue: any) => void;
  initBase: (tempValue: any, msg?: string) => void;
  initSave: (version: any, msg: any) => void;
  initDbs: (dbs: any) => void;
  dbChange: (d: any) => void;
  resolveDb: () => void;
  compare: (state: any) => void;
  checkVersionData: (dataSource1: any, dataSource2: any) => any;
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
    changes: { version: string, changes: any[] }[];
    currentChanges: any[];
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
    currentChanges: [],
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
          get().dispatch.calcChanges(null);
        } else {
          message.error('获取版本信息失败');
          get().dispatch.checkBaseVersion(currentDB);
        }
      } catch (error: any) {
        message.error(`获取版本信息失败: ${error?.message || error}`);
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
      calcChanges: async (versions: any) => {
        const projectState = useProjectStore.getState();
        const dataSource = projectState?.project?.projectJSON;

        if (!dataSource) {
          console.warn("Project JSON is not available yet");
          return [];
        }

        const currentDB = get().dispatch.getCurrentDBData();
        if (!currentDB || !currentDB.key) {
          message.error('无法获取到数据源信息，请切换尝试数据源');
          return [];
        }

        try {
          // 获取最新版本
          const res = await POST(DB_CHANGE_URL,
            {
              dbKey: currentDB.key,
              projectId: cache.getItem(CONSTANT.PROJECT_ID),
              current: 1,
              size: 1,
              orders: [
                {
                  column: "version",
                  asc: false
                }
              ]
             });

          if (res && res.data && res.data.records && res.data.records.length > 0) {
            const latestVersion = res.data.records[0];
            const currentDataSource = {...dataSource};
            const checkDataSource = {
              modules: _.get(latestVersion, 'projectJSON.modules', []),
            };
            const changes = get().dispatch.checkVersionData(
              currentDataSource,
              checkDataSource
            );

            set(produce(state => {
              state.changes = changes;
            }));

            return changes || [];
          }
          // 尚无历史：相对空模型算增量，首版详情可见「新增表/字段」
          const changes = get().dispatch.checkVersionData(
            { ...dataSource },
            { modules: [] },
          );
          set(produce((state) => {
            state.changes = changes;
          }));
          return changes || [];
        } catch (error) {
          message.error(`计算差异失败: ${error.message}`);
          return [];
        }
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
            message.success('数据源版本信息获取成功');
          } else {
            set({
              dbVersion: '',
              hasDB: false,
            });
            message.error('数据源版本信息获取失败');
          }
        }).catch(() => {
          set({
            dbVersion: '',
            hasDB: false,
          });
          message.error('数据源版本信息获取失败');
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
          message.error('检查基线版本失败:');
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
            .sort((a: any, b: any) => compareStringVersion(b.version, a.version)),
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
          message.error('无法获取到数据源信息，请切换尝试数据源');
        } else {
          Save.rebaseline({
            ...dbData,
            dbKey: dbData.key,
            version: '0.0.0',
            versionDesc: '基线本，新建版本时请勿低于该版本',
          }).then((res) => {
            if (res && res.code === 200) {
              message.success('初始化数据表成功');
              get().dispatch.getDBVersion();
            } else {
              message.error('初始化数据表失败');
            }
          }).catch((err) => {
            message.error(`初始化数据表失败：${err.message}`);
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
          lowVersions = versions.filter((v: any) => compareStringVersion(v.version, dbVersion) > 0);
        }
        return lowVersions
          .filter((v: any) => v.version !== version.version)
          .some((v: any) => compareStringVersion(v.version, version.version) <= 0);
      },
      execSQL: (data: any, version: any, updateDBVersion: any, cb: any, onlyUpdateDBVersion: any) => {
        const dbData = get().dispatch.getCurrentDBData();
        if (!dbData) {
          set({
            dbVersion: '',
          });
          message.error('无法获取到数据源信息，请切换尝试数据源');
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          cb && cb();
        } else {
          Modal.confirm({
            title: '同步确认',
            content: onlyUpdateDBVersion ? '元数据即将标记为同步，标记为同步后不可撤销，确定标记吗？' : '元数据即将同步到数据源，同步后不可撤销，确定同步吗？',
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
          }, cmd, (result: any) => {
            cb && cb();
            set({
              synchronous: {
                [version.version]: false,
              },
            });
            // @ts-ignore
          }, cmd);
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
        Save[opt](param).then((res: any) => {
          if (res.code === 200) {
            cb && cb();
            Modal.success({
              title: '同步成功',
              content: res.data,
            });
          } else {
            Modal.warn({
              title: '同步失败',
              content: res.msg,
            });

          }
        }).catch((err: any) => {
          message.error(`同步失败:${err.message}`);
        });
      },
      updateVersionData: (newVersion: any, oldVersion: any, status: any) => {
        if (status === 'update') {
          const dbData = get().dispatch.getCurrentDBData();
          Save.hisProjectSave({...newVersion, dbKey: dbData.key}).then((res) => {
            if (res.code === 200) {
              message.success('版本信息更新成功');
            } else {
              message.error('版本信息更新失败');
            }
          }).catch((err) => {
            message.error(`版本信息更新失败${err.message}`);
          }).finally(() => {
            set({
              versions: get().versions.map((v: any, vIndex: any) => {
                if (vIndex === get().currentVersionIndex) {
                  return newVersion;
                }
                return v;
              }),
            })
          });
        } else {
          // 删除原来的
          Save.hisProjectDelete(newVersion.id).then((res) => {
            if (res.code === 200) {
              message.success('版本信息删除成功');
              const tempVersions = get().versions.filter((v: any) => v.id !== newVersion.id);
              set({
                changes: get().dispatch.calcChanges(tempVersions),
                versions: tempVersions,
              });
              get().dispatch.checkBaseVersion(null);
            }
          }).catch((err) => {
            message.error(`版本信息删除失败${err.message}`);
            get().dispatch.checkBaseVersion(null);
          });
        }
        get().fetch(null,get().currentPage,get().pageSize);
      },
      revertVersionData: () => {
        const ver = get()?.currentVersion;
        const modules = ver?.projectJSON?.modules;
        if (modules instanceof Array && modules.length > 0) {
          useProjectStore.getState().dispatch.setModules(modules);
          const project = useProjectStore.getState().project;
          // 须落库：否则切路由/刷新会冲掉仅内存的回滚
          void Save.saveProject(project).then((res: any) => {
            if (res?.code === 200) {
              message.success(`成功回滚至「${ver?.version}」`);
            } else {
              message.error(res?.msg || res?.message || '回滚已应用但保存失败');
            }
            get().fetch(null, get().currentPage, get().pageSize);
          }).catch((err: any) => {
            message.error(`回滚保存失败：${err?.message || err}`);
          });
          return;
        }
        message.error('该版本无可用模型快照，无法回滚');
      },
      readDb: (status: any, version: any, lastVersion: any, changes = [], initVersion: any, updateVersion: any) => {
        if (!status) {
          const dbData = get().dispatch.getCurrentDBData();
          if (!dbData) {
            message.error('无法获取到数据源信息，请尝试切换数据源，并检查是否已经配置数据源信息！');
          } else {
            let flag = false;
            if (!initVersion) {
              flag = get().dispatch.checkVersionCount(version);
            }
            if (flag) {
              message.error('当前操作的版本之前还有版本尚未同步，请不要跨版本操作!');
            } else {
              Modal.confirm({
                title: '同步确认',
                content: '元数据即将同步到数据源，同步后不可撤销，确定同步吗？',
                onOk: (m) => {
                  _.set(get().synchronous, `${version.version}`, true);
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
                      modules: version.projectJSON.modules,
                    }, _.get(dbData, 'select', 'MYSQL'));
                  } else {
                    let tempChanges: any[] = [...changes];
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
                        modules: version.projectJSON.modules,
                      }, tempChanges,
                      _.get(dbData, 'select', 'MYSQL'), lastVersion.projectJSON);
                  }
                  get().dispatch.generateSQL(dbData, version, data, updateVersion, () => get().fetch(null,get().currentPage,get().pageSize));
                }
              });
            }
          }
        }
      },
      saveNewVersion: async (tempValue: any) => {
        if (!tempValue.version || !tempValue.versionDesc) {
          message.error('版本号和版本描述不能为空');
          return;
        }

        if (get().versions.map((v: any) => v.version).includes(tempValue.version)) {
          message.error('该版本号已经存在了');
          return;
        }

        if (get().versions[0] && compareStringVersion(tempValue.version, get().versions[0].version) <= 0) {
          message.error('新版本不能小于或等于已经存在的版本');
          return;
        }

        try {
          const changes = await get().dispatch.calcChanges(get().versions);
          const changesArray = Array.isArray(changes) ? changes : [];
          const dbData = get().dispatch.getCurrentDBData();
          const projectState = useProjectStore.getState();

          const version = {
            projectJSON: {
              modules: projectState?.project?.projectJSON?.modules || [],
            },
            dbKey: dbData.key,
            baseVersion: get().versions.length === 0,
            version: tempValue.version,
            versionDesc: tempValue.versionDesc,
            changes: changesArray,
            versionDate: moment().format('YYYY/M/D H:m:s'),
          };

          const res = await Save.hisProjectSave(version);
          if (res && res.code === 200) {
            get().dispatch.getVersionMessage(res.data);
            set({ changes: [] });
            message.success('当前版本保存成功');
            await get().fetch(dbData, get().currentPage, get().pageSize);
          } else {
            message.error('当前版本保存失败');
          }
        } catch (err: any) {
          message.error(`当前版本保存失败: ${err?.message || err}`);
        }
      },
      rebuild: (tempValue: any) => {
        Modal.confirm({
          title: '重建基线',
          content: '重建基线将会清除当前项目的所有版本信息，该操作不可逆，是否继续？',
          onOk: () => {
            // 重新初始化
            // 先删除所有的版本信息
            get().dispatch.initBase(tempValue, '重建基线成功');
          }
        });
      },
      initBase: (tempValue: any, msg: any) => {
        if (!tempValue.version || !tempValue.versionDesc) {
          message.error('版本号和版本描述不能为空');
        } else {
          const dbData = get().dispatch.getCurrentDBData();
          const projectState = useProjectStore.getState();

          // 基线文件只需要存储modules信息
          const modules = projectState?.project?.projectJSON?.modules;
          const version = {
            projectJSON: {
              modules: modules || [],
            },
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
                message.error(`重建基线失败`);
              }
            }).catch((err) => {
              message.error(`重建基线失败:${err.message}`);
            });
          } else {
            get().dispatch.initSave(version, msg);
          }
        }
      },
      initSave: (version: any, msg: any) => {
        Save.hisProjectSave(version).then((res) => {
          if (res) {
            message.success(msg || '初始化基线成功');
            get().fetch(null,get().currentPage,get().pageSize);
            // 更新版本表
            get().dispatch.dropVersionTable();
          } else {
            message.error('操作失败！');
          }
        }).catch((err) => {
          message.error(`操作失败！ ${err.message}`);
        });
      },
      initDbs: (dbs: any) => set(produce(state => {
        const defaultId = useProjectStore.getState().project?.projectJSON?.profile?.defaultDataSourceId;
        const {markDefaultDataSource} = require('@/utils/projectDataSource');
        state.dbs = markDefaultDataSource(dbs || [], defaultId);
      })),
      dbChange: (d: any) => {
        const selected = get().dbs.find((db: any) => db.name === d.value || db.key === d.value);
        if (selected?.key) {
          useProjectStore.getState().dispatch.setDefaultDb(selected.key);
        }
        set(produce(state => {
          state.dbs = state.dbs.map((db: any) => ({
            ...db,
            defaultDB: db.name === d.value || db.key === d.value,
          }));
        }));
        get().fetch(selected || d, get().currentPage, get().pageSize);
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
          if (compareStringVersion(state.incrementVersion, state.initVersion) <= 0) {
            message.warning('增量脚本的版本号不能小于或等于初始版本的版本号');
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
      checkVersionData: (dataSource1: any, dataSource2: any) => {
        // 循环比较每个模型下的每张表以及每一个字段的差异
        const changes: any = [];
        // 1.获取所有的表
        const currentTables = get().dispatch.getAllTable(dataSource1);
        const checkTables = get().dispatch.getAllTable(dataSource2);
        const checkTableNames = checkTables.map((e: any) => e.title);
        const currentTableNames = currentTables.map((e: any) => e.title);
        // 2.将当前的表循环
        currentTables.forEach((table: any) => {
          // 1.1 判断该表是否存在
          if (checkTableNames.includes(table.title)) {
            // 1.2.1 如果该表存在则需要对比字段
            const checkTable = checkTables.filter((t: any) => t.title === table.title)[0] || {};
            // 将两个表的所有的属性循环比较
            const checkFields = (checkTable.fields || []).filter((f: any) => f.name);
            const tableFields = (table.fields || []).filter((f: any) => f.name);
            const checkFieldsName = checkFields.map((f: any) => f.name);
            const tableFieldsName = tableFields.map((f: any) => f.name);
            tableFields.forEach((field: any) => {
              if (!checkFieldsName.includes(field.name)) {
                changes.push({
                  type: 'field',
                  name: `${table.title}.${field.name}`,
                  opt: 'add',
                });
              } else {
                // 比较属性的详细信息
                const checkField = checkFields.filter((f: any) => f.name === field.name)[0] || {};
                const result = get().dispatch.compareField(field, checkField, table);
                changes.push(...result);
              }
            });
            checkFields.forEach((field: any) => {
              if (!tableFieldsName.includes(field.name)) {
                changes.push({
                  type: 'field',
                  name: `${table.title}.${field.name}`,
                  opt: 'delete',
                });
              }
            });
            // 1.2.2 其他信息
            const entityResult = get().dispatch.compareEntity(_.omit(table, ['fields', 'indexs', 'headers']),
              _.omit(checkTable, ['fields', 'indexs']));
            changes.push(...entityResult);
            // 1.2.3 对比索引
            const result = get().dispatch.compareIndexs(table, checkTable);
            changes.push(...result);
          } else {
            // 1.3 如果该表不存在则说明当前版本新增了该表
            changes.push({
              type: 'entity',
              name: table.title,
              opt: 'add',
            });
          }
        });
        // 3.将比较的表循环，查找删除的表
        checkTables.forEach((table: any) => {
          // 1.1 判断该表是否存在
          if (!currentTableNames.includes(table.title)) {
            // 1.2 如果该表不存在则说明当前版本删除了该表
            changes.push({
              type: 'entity',
              name: table.title,
              opt: 'delete',
            });
          }
        });
        return changes;
      },
      recalculateChanges: () => {
        const state = get();
        // 只重新计算最新版本（未保存的更改）与上一个保存的版本之间的差异
        if (state.versions.length > 0) {
          const projectState = useProjectStore.getState();

          const currentProjectJSON = projectState?.project?.projectJSON;
          const lastSavedVersion = state.versions[0];
          const newChanges = state.dispatch.checkVersionData(
            currentProjectJSON,
            lastSavedVersion.projectJSON
          );

          set(produce(draft => {
            // 更新 currentChanges，而不是整个 changes 数组
            draft.currentChanges = newChanges;
            // 重新构造消息，但只针对当前更改
            draft.messages = state.dispatch.constructorMessage(newChanges);
          }));

        }
      },
    }
  })
);

useProjectStore.subscribe((state) => {
  if (state.project?.projectJSON) {
    useVersionStore.getState().dispatch.recalculateChanges();
  }
});

export default useVersionStore;
