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
import {io} from "socket.io-client";
import {jsondiffpatch} from "./jsondiffpatch";
import {resetCanvasHistory} from "./canvasHistory";


enablePatches()


// 类型：对象、函数两者都适用，但是 type 可以用于基础类型、联合类型、元祖。
// 同名合并：interface 支持，type 不支持。
// 计算属性：type 支持, interface 不支持。
// 总的来说，公共的用 interface 实现，不能用 interface 实现的再用 type 实现。主要是一个项目最好保持一致。


export type ProjectState =
  {
    tables: any[],
    project: any,
    socket: any,
    syncing: boolean,
    timestamp: number,
    fetch: (projectId?: string) => Promise<void>;
    initSocket: (projectId: string) => Promise<void>;
    closeSocket: (projectId: string) => void;
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
    console.log(65, patches, 'patches')
    console.log(65, invPatches, 'invPatches')
    forwardPatches.push(...patches)
    backPatches.push(...invPatches)
    return newStore
  }
}

// Turn the set method into an immer proxy
// @ts-ignore
export const immer = config => (set, get, api) => config((partial, replace) => {
  console.log(50, "s",)
  console.log(51, "partial", partial)
  console.log(51, "replace", replace)
  const nextState = typeof partial === 'function'
    ? wrapWithPatch(partial)
    : partial;
  console.log(51, "nextState", nextState)
  return set(nextState, replace);
}, get, api)


// Turn the set method into an immer proxy
// @ts-ignore
export const patch = config => (set, get, api) => config((fn: (store: ProjectState) => ProjectState) => {
  return (store: ProjectState) => {
    const [newStore, patches, invPatches] = produceWithPatches(fn)(store)
    console.log(78, patches, 'patches')
    console.log(79, invPatches, 'invPatches')
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
        syncing: false,
        timestamp: Date.now(),
        fetch: async (projectId?: string|null) => {
          if (!projectId) {
            projectId = cache.getItem(CONSTANT.PROJECT_ID);
          }
          await request.get(`/ncnb/project/info/${projectId}`).then((res: any) => {
            console.log(45, res);
            const data = res?.data;
            if (res?.code === 200 && data) {
              resetCanvasHistory();
              set({
                project: data
              });
              get().dispatch.fixProject(data);
              //计算全部表名
              const tables = _.flatMapDepth(data?.projectJSON?.modules, (m) => {
                console.log(130, m);
                return _.map(m.entities, 'title')
              }, 2);
              set({
                tables
              });
            } else {
              message.error('获取项目信息失败');
            }
          });
        },
        initSocket: async (projectId: string) => {
          let socket = get().socket;
          console.log(165, socket);
          if (socket) return;
          socket = io(`http://localhost:3000?roomId=${projectId}`);
          // client-side
          socket.on("connect", () => {
            console.log(socket?.id); // x8WIv7-mJelg7on_ALbx
          });
          const username = cache.getItem('username');
          message.success(`当前您的身份为${username}`);
          // socket.on('historyRecord', (value: any) => message.success(`init ${value}`));
          // 发送加入消息
          socket.emit('join', username);
          // 监听消息
          socket.on('msg', (r: any) => {
            console.log(149, r);
            if (username != r.username) {
              message.success(`${r.msg}`);
            }
          });
          // 监听消息
          socket.on('sync', (r: any) => {
            console.log(148, 'sync', r);
            if (username != r.username && r.delta && r.timestamp != get().timestamp && JSON.stringify(r.delta) !== '{}') {
              get().dispatch.patch(r);
            }
          });
          set({
            socket
          })
        },
        closeSocket: (projectId: string) => {
          console.log(165, 'leave', get().socket)
          if (!get().socket) return;
          const username = cache.getItem('username');
          // 发送加入消息
          get().socket.emit('leave', username);
          get().socket.close();
          const project = get().project;
          if (project) {
            Save.saveProject(project);
          }
          set({
            socket: null,
            project: {}
          })
        },
        sync: (r: any,) => {
          console.log(62, 'sync', get().socket, r.delta);
          if (get().socket) {
            if (get().project.type === '2') {
              console.log(62, 'ws 已激活', r);
              const username = cache.getItem('username');
              const timestamp = Date.now();
              set({timestamp});
              get().socket.emit('sync', {
                timestamp: r.timestamp,
                username,
                delta: r.delta
              })
            }
          }
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
