import create, {GetState, SetState} from "zustand";

import {StoreApiWithSubscribeWithSelector, subscribeWithSelector} from 'zustand/middleware';

import type {IProjectJsonDispatchSlice, IProjectJsonSlice} from "./projectJsonSlice";
import ProjectJsonSlice from "./projectJsonSlice";
import type {IConfigJsonDispatchSlice, IConfigJsonSlice} from "./configJsonSlice";
import ConfigJsonSlice from "./configJsonSlice";
import type {IModulesDispatchSlice, IModulesSlice} from "@/store/project/modulesSlice";
import type {IDataTypeDomainsDispatchSlice, IDataTypeDomainsSlice} from "@/store/project/dataTypeDomainsSlice";
import type {IProfileDispatchSlice, IProfileSlice} from "@/store/project/profileSlice";
import type {IEntitiesDispatchSlice, IEntitiesSlice} from "@/store/project/entitiesSlice";
import type {IDatabaseDomainsDispatchSlice, IDatabaseDomainsSlice} from "@/store/project/databaseDomainsSlice";
import _ from "lodash";
import * as cache from "@/utils/cache";
import request from "@/utils/request";
import * as Save from '@/utils/save';
import useGlobalStore from "@/store/global/globalStore";
import {enablePatches, produceWithPatches} from 'immer'
import {IExportDispatchSlice, IExportSlice} from "@/store/project/exportSlice";
import {message} from "antd";
import {CONSTANT} from "@/utils/constant";
import {connectPresence, disconnectPresence, emitCursor} from "@/services/collabPresence";
import {jsondiffpatch} from "./jsondiffpatch";
import {resetCanvasHistory} from "./canvasHistory";

export type RemoteCursor = { x: number; y: number; ts: number };


enablePatches()


// 类型：对象、函数两者都适用，但是 type 可以用于基础类型、联合类型、元祖。
// 同名合并：interface 支持，type 不支持。
// 计算属性：type 支持, interface 不支持。
// 总的来说，公共的用 interface 实现，不能用 interface 实现的再用 type 实现。主要是一个项目最好保持一致。


export type ProjectState =
  {
    tables: any[],
    project: any,
    projectLoading: boolean,
    socket: any,
    onlineUsers: string[],
    remoteCursors: Record<string, RemoteCursor>,
    syncing: boolean,
    timestamp: number,
    fetch: (projectId?: string) => Promise<void>;
    initSocket: (projectId: string) => Promise<void>;
    closeSocket: (projectId: string) => void;
    publishCursor: (x: number, y: number) => void;
    sync: (delta: any,) => void;
    dispatch: IProjectJsonDispatchSlice & IConfigJsonDispatchSlice & IModulesDispatchSlice
      & IDataTypeDomainsDispatchSlice & IDatabaseDomainsDispatchSlice & IProfileDispatchSlice
      & IEntitiesDispatchSlice & IExportDispatchSlice
  }
  & IProjectJsonSlice
  & IConfigJsonSlice
  & IModulesSlice
  & IDataTypeDomainsSlice
  & IDatabaseDomainsSlice
  & IProfileSlice
  & IExportSlice
  & IEntitiesSlice;

const forwardPatches: any[] = []
const backPatches: any[] = []

export const wrapWithPatch = (fn: (store: ProjectState) => void) => {
  return (store: ProjectState) => {
    const [newStore, patches, invPatches] = produceWithPatches(fn)(store)
    forwardPatches.push(...patches)
    backPatches.push(...invPatches)
    return newStore
  }
}

// Turn the set method into an immer proxy
// @ts-ignore
export const immer = config => (set, get, api) => config((partial, replace) => {
  const nextState = typeof partial === 'function'
    ? wrapWithPatch(partial)
    : partial;
  return set(nextState, replace);
}, get, api)


// Turn the set method into an immer proxy
// @ts-ignore
export const patch = config => (set, get, api) => config((fn: (store: ProjectState) => ProjectState) => {
  return (store: ProjectState) => {
    const [newStore, patches, invPatches] = produceWithPatches(fn)(store)
    forwardPatches.push(...patches)
    backPatches.push(...invPatches)
    return newStore
  }
}, get, api)
const useProjectStore = create<ProjectState, SetState<ProjectState>, GetState<ProjectState>, StoreApiWithSubscribeWithSelector<ProjectState>>(
  subscribeWithSelector(
    immer(
      (set: SetState<ProjectState>, get: GetState<ProjectState>) => ({
        tables: [],
        project: {},
        projectLoading: false,
        onlineUsers: [],
        remoteCursors: {},
        syncing: false,
        timestamp: Date.now(),
        fetch: async (projectId?: string|null) => {
          if (!projectId) {
            projectId = cache.getItem(CONSTANT.PROJECT_ID);
          }
          set({ projectLoading: true });
          try {
            await request.get(`/ncnb/project/info/${projectId}`).then((res: any) => {
              const data = res?.data;
              if (res?.code === 200 && data) {
                resetCanvasHistory();
                set({
                  project: data
                });
                get().dispatch.fixProject(data);
                //计算全部表名
                const tables = _.flatMapDepth(data?.projectJSON?.modules, (m) => {
                  return _.map(m.entities, 'title')
                }, 2);
                set({
                  tables
                });
              } else {
                message.error('获取项目信息失败');
              }
            });
          } finally {
            set({ projectLoading: false });
          }
        },
        initSocket: async (projectId: string) => {
          if (get().socket) return;
          try {
            const socket = await connectPresence(projectId, {
              onRoster: (users, actor) => {
                const next: Record<string, RemoteCursor> = { ...get().remoteCursors };
                // 离开者清光标；名单外用户清掉
                Object.keys(next).forEach((u) => {
                  if (!users.includes(u)) delete next[u];
                });
                if (actor && !users.includes(actor)) {
                  delete next[actor];
                }
                set({ onlineUsers: users, remoteCursors: next });
              },
              onCursor: ({ username, x, y }) => {
                const me = cache.getItem('username');
                if (me && me === username) return;
                set({
                  remoteCursors: {
                    ...get().remoteCursors,
                    [username]: { x, y, ts: Date.now() },
                  },
                });
              },
            });
            set({ socket });
          } catch (e: any) {
            message.warning(e?.message || '协作在线状态连接失败');
          }
        },
        closeSocket: (projectId: string) => {
          const username = cache.getItem('username') || undefined;
          disconnectPresence(get().socket, username);
          const project = get().project;
          if (project) {
            Save.saveProject(project);
          }
          set({
            socket: null,
            onlineUsers: [],
            remoteCursors: {},
            project: {}
          })
        },
        publishCursor: (x: number, y: number) => {
          emitCursor(get().socket, x, y);
        },
        sync: (_r: any) => {
          // 模型增量同步另切；光标已走 martin:event:cursor
        },
        dispatch: {
          updateProjectName: (payload: any) => set((state: any) => {
            // @ts-ignore
            state.project.projectName = payload;
          }),
          ...ProjectJsonSlice(set, get),
          ...ConfigJsonSlice(set, get),
        }
      })
    )
  )
);


/** 自动保存防抖：合并连续编辑，状态条可见「保存中 / 已保存 / 未保存」 */
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
let autosaveSeq = 0;

// @ts-ignore
useProjectStore.subscribe(state => state.project, (project, previousProject) => {
  if (!project || JSON.stringify(project) === '{}') {
    return;
  }
  // 首次拉取项目：previous 为空对象，避免刚加载就打一枪保存
  if (!previousProject || JSON.stringify(previousProject) === '{}') {
    useGlobalStore.getState().dispatch.setSaved(true);
    useGlobalStore.getState().dispatch.setSaving(false);
    return;
  }
  if (!useGlobalStore.getState().needSave) {
    return;
  }

  useGlobalStore.getState().dispatch.setSaved(false);
  useGlobalStore.getState().dispatch.setSaving(true);

  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
  }
  const seq = ++autosaveSeq;
  autosaveTimer = setTimeout(() => {
    const latest = useProjectStore.getState().project;
    if (!latest || JSON.stringify(latest) === '{}') {
      return;
    }
    Save.saveProject(latest)
      .then((res: any) => {
        if (seq !== autosaveSeq) {
          return;
        }
        if (res?.code === 200) {
          useGlobalStore.getState().dispatch.setSaved(true);
          useGlobalStore.getState().dispatch.setSaving(false);
        } else {
          useGlobalStore.getState().dispatch.setSaving(false);
          useGlobalStore.getState().dispatch.setSaved(false);
          message.error(res?.msg || res?.message || '自动保存失败');
        }
      })
      .catch((err: any) => {
        if (seq !== autosaveSeq) {
          return;
        }
        useGlobalStore.getState().dispatch.setSaving(false);
        useGlobalStore.getState().dispatch.setSaved(false);
        // request errorHandler 已弹过网络错误时避免重复；无 message 再补
        if (err && !err.response) {
          message.error(err?.message || '自动保存失败');
        }
      });
  }, 600);
});


export default useProjectStore;
