import type {GetState, SetState} from "zustand";
import type {ProjectState} from "@/store/project/useProjectStore";
import produce from "immer";
import EntitiesSlice from "@/store/project/entitiesSlice";
import {message} from "antd";
import _ from 'lodash';
import * as cache from '../../utils/cache';
import {redoModules, snapshotModules, undoModules} from "@/store/project/canvasHistory";
import {
  DEFAULT_DIAGRAM_ID,
  DEFAULT_DIAGRAM_NAME,
  addFrameToDiagram,
  addMembersToFrame,
  ensureDiagrams,
  listDiagrams,
  newDiagramId,
  removeFrameFromDiagram,
  removeMembersFromFrame,
  renameFrameInDiagram,
  updateFrameBounds as applyFrameBounds,
  upsertDiagramLayout,
} from "@/utils/diagram";
import {
  normalizeConstraintName,
  normalizeFkRule,
  normalizeRelation,
} from "@/utils/relationEdges";
import {
  ackManualPersist,
  persistProjectNow,
} from "@/store/project/projectAutosave";
import type { PersistOpt } from "@/store/project/persistOpt";
export type { PersistOpt } from "@/store/project/persistOpt";

export type IModulesSlice = {
  currentModule?: string;
  currentModuleIndex?: number;
}

const validateModule = (data: any) => {
  return data && typeof data.name === 'string' && Array.isArray(data.entities);
};

/** 生成不与现有名冲突的「副本」后缀名 */
const nextCopyName = (base: string, taken: (name: string) => boolean) => {
  let name = base;
  let counter = 0;
  while (taken(name)) {
    counter += 1;
    name = `${base}${counter === 1 ? '副本' : `副本${counter}`}`;
  }
  return { name, counter };
};


export interface IModulesDispatchSlice {
  addModule: (payload: any, opts?: PersistOpt) => boolean | Promise<boolean>;
  renameModule: (payload: any, opts?: PersistOpt) => boolean | Promise<boolean>;
  removeModule: (
    moduleName?: string,
    opts?: PersistOpt,
  ) => void | Promise<boolean>;
  updateModule: (payload: any) => void;
  copyModule: (payload: any) => void;
  cutModule: (payload: any, opts?: PersistOpt) => void | Promise<boolean>;
  pastModule: (opts?: PersistOpt) => void | Promise<boolean>;
  updateRelation: (payload: any) => void;
  /** 写当前图布局（ADR-0017：只写 diagrams；diagramId 缺省=main） */
  updateGraphCanvasLayout: (moduleName: string, layoutNodes: any[], diagramId?: string) => void;
  /**
   * 拖拽落盘：表坐标 + Frame bounds 一次 produce。
   * persist:true 时仅 saveProject code===200 写 store；失败不写（调用方回滚 RF 本地坐标）。
   */
  commitDiagramGeometry: (
    moduleName: string,
    diagramId: string | undefined,
    payload: {
      layoutNodes?: any[];
      frameBounds?: Array<{ id: string; x: number; y: number; w?: number; h?: number }>;
    },
    opts?: PersistOpt,
  ) => boolean | Promise<boolean>;
  createDiagram: (
    moduleName: string,
    name?: string,
    opts?: PersistOpt,
  ) => string | undefined | Promise<string | undefined>;
  renameDiagram: (
    moduleName: string,
    diagramId: string,
    name: string,
    opts?: PersistOpt,
  ) => boolean | Promise<boolean>;
  removeDiagram: (
    moduleName: string,
    diagramId: string,
    opts?: PersistOpt,
  ) => void | Promise<boolean>;
  /** ADR-0017 Phase 2b：图内 Frame；persist:true 时仅 saveProject code===200 写 store + toast */
  createFrame: (
    moduleName: string,
    diagramId: string | undefined,
    opts?: {
      name?: string;
      memberEntityIds?: string[];
      x?: number;
      y?: number;
      w?: number;
      h?: number;
      color?: string;
    },
    persistOpt?: PersistOpt,
  ) => string | undefined | Promise<string | undefined>;
  addFrameMembers: (
    moduleName: string,
    diagramId: string | undefined,
    frameId: string,
    memberEntityIds: string[],
    opts?: PersistOpt,
  ) => void | Promise<boolean>;
  removeFrameMembers: (
    moduleName: string,
    diagramId: string | undefined,
    frameId: string,
    memberEntityIds: string[],
    opts?: PersistOpt,
  ) => void | Promise<boolean>;
  updateFrameBounds: (
    moduleName: string,
    diagramId: string | undefined,
    frames: Array<{ id: string; x: number; y: number; w?: number; h?: number }>,
    opts?: PersistOpt,
  ) => void | Promise<boolean>;
  removeFrame: (
    moduleName: string,
    diagramId: string | undefined,
    frameId: string | string[],
    opts?: PersistOpt,
  ) => void | Promise<boolean>;
  renameFrame: (
    moduleName: string,
    diagramId: string | undefined,
    frameId: string,
    name: string,
    opts?: PersistOpt,
  ) => void | Promise<boolean>;
  /** 追加关联；persist:true 时仅 saveProject code===200 写 store */
  addAssociation: (
    moduleName: string,
    association: any,
    opts?: PersistOpt,
  ) => void | Promise<boolean>;
  removeAssociation: (
    moduleName: string,
    association: any | any[],
    opts?: PersistOpt,
  ) => void | Promise<boolean>;
  /** 改关联基数（from/to 定位；relation 归一化后写入）；persist:true 时仅 saveProject code===200 写 store */
  updateAssociationRelation: (
    moduleName: string,
    association: { from: { entity: string; field: string }; to: { entity: string; field: string } },
    relation: string,
    opts?: PersistOpt,
  ) => void | Promise<boolean>;
  /**
   * 改关联 FK 元数据（constraintName / deleteRule / updateRule；from/to 定位）。
   * 空串清除；同旧 constraintName 拆边同步写/改名（ADR-0011 复合拆边）。
   * persist:true 时仅 saveProject code===200 写 store。
   */
  updateAssociationFkMeta: (
    moduleName: string,
    association: { from: { entity: string; field: string }; to: { entity: string; field: string } },
    meta: { constraintName?: string; deleteRule?: string; updateRule?: string },
    opts?: PersistOpt,
  ) => void | Promise<boolean>;
  undoCanvas: () => void;
  redoCanvas: () => void;
  setCurrentModule: (payload: any) => any,
  updateAllModules: (payload: any) => void,
  getModuleEntityTree: (searchKey: string, groupByType: boolean) => any,
  getModuleEntityFieldTree: () => any,
};

const ERD_MODULE_CLIPBOARD = 'erd_module_clipboard';

const ModulesSlice = (set: SetState<ProjectState>, get: GetState<ProjectState>) => ({
  currentModule: '',
  currentModuleIndex: -1,
  addModule: (payload: any, opts?: PersistOpt) => {
    const persist = !!opts?.persist;
    const moduleName = payload.name;
    const project = get().project;
    if (!project || JSON.stringify(project) === '{}') {
      message.error('未打开项目');
      return persist ? Promise.resolve(false) : false;
    }

    const applyLocal = (): boolean => {
      let ok = false;
      set(produce(state => {
        if (!state.project.projectJSON || typeof state.project.projectJSON !== 'object') {
          state.project.projectJSON = { modules: [] };
        }
        if (!Array.isArray(state.project.projectJSON.modules)) {
          state.project.projectJSON.modules = [];
        }
        const findIndex = state.project.projectJSON.modules.findIndex((m: any) => m.name === moduleName);
        if (findIndex === -1) {
          state.project.projectJSON.modules.push({
            ...payload,
            entities: [],
          });
          ok = true;
          if (!persist) {
            message.success('模型添加成功');
          }
        } else {
          message.error(`模型${moduleName}已经存在`);
        }
      }));
      return ok;
    };

    if (!persist) {
      return applyLocal();
    }

    const modules = project.projectJSON?.modules || [];
    if ((modules as any[]).some((m: any) => m.name === moduleName)) {
      message.error(`模型${moduleName}已经存在`);
      return Promise.resolve(false);
    }

    const next = produce(project, (draft: any) => {
      if (!draft.projectJSON || typeof draft.projectJSON !== 'object') {
        draft.projectJSON = { modules: [] };
      }
      if (!Array.isArray(draft.projectJSON.modules)) {
        draft.projectJSON.modules = [];
      }
      draft.projectJSON.modules.push({
        ...payload,
        entities: [],
      });
    });

    return (async () => {
      const saved = await persistProjectNow(next, '模型保存失败');
      if (!saved) {
        return false;
      }
      ackManualPersist(true);
      set(produce(state => {
        state.project.projectJSON = next.projectJSON;
      }));
      message.success('模型添加成功');
      return true;
    })();
  },
  renameModule: (payload: any, opts?: PersistOpt) => {
    const persist = !!opts?.persist;
    const moduleName = payload.name;
    const {currentModuleIndex} = get();

    const applyLocal = (): boolean => {
      let ok = false;
      set(produce(state => {
        const findIndex = state.project.projectJSON?.modules?.findIndex((m: any) => m.name === moduleName);
        if (findIndex === -1) {
          state.project.projectJSON.modules[state.currentModuleIndex].name = payload.name;
          state.project.projectJSON.modules[state.currentModuleIndex].chnname = payload.chnname;
          ok = true;
          if (!persist) {
            message.success('修改成功');
          }
        } else {
          message.error(`模型${moduleName}已经存在`);
        }
      }));
      return ok;
    };

    if (!persist) {
      return applyLocal();
    }

    const project = get().project;
    if (!project || JSON.stringify(project) === '{}') {
      message.error('未打开项目');
      return Promise.resolve(false);
    }
    const findIndex = project.projectJSON?.modules?.findIndex((m: any) => m.name === moduleName);
    if (findIndex !== -1) {
      message.error(`模型${moduleName}已经存在`);
      return Promise.resolve(false);
    }
    if (currentModuleIndex == null || currentModuleIndex < 0) {
      message.error('未选中模型');
      return Promise.resolve(false);
    }

    const next = produce(project, (draft: any) => {
      draft.projectJSON.modules[currentModuleIndex].name = payload.name;
      draft.projectJSON.modules[currentModuleIndex].chnname = payload.chnname;
    });

    return (async () => {
      const saved = await persistProjectNow(next, '模型保存失败');
      if (!saved) {
        return false;
      }
      set(produce(state => {
        state.project.projectJSON.modules[state.currentModuleIndex].name = payload.name;
        state.project.projectJSON.modules[state.currentModuleIndex].chnname = payload.chnname;
      }));
      ackManualPersist(true);
      message.success('修改成功');
      return true;
    })();
  },
  removeModule: (moduleName?: string, opts?: PersistOpt) => {
    const persist = !!opts?.persist;
    const name =
      (typeof moduleName === 'string' && moduleName) ||
      get().currentModule ||
      '';
    if (!name) {
      message.error('未指定要删除的模型');
      return persist ? Promise.resolve(false) : undefined;
    }

    const syncCurrentAfterRemove = (state: any) => {
      if (state.currentModule === name) {
        const next = state.project.projectJSON.modules?.[0];
        state.currentModule = next?.name;
        state.currentModuleIndex = next ? 0 : -1;
      } else {
        state.currentModuleIndex = state.project.projectJSON.modules?.findIndex(
          (m: any) => m?.name === state.currentModule,
        );
      }
    };

    if (!persist) {
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce(state => {
        const before = state.project.projectJSON.modules?.length || 0;
        state.project.projectJSON.modules =
          state.project.projectJSON.modules?.filter((m: any) => m?.name !== name) || [];
        if ((state.project.projectJSON.modules?.length || 0) === before) {
          message.error(`模型 "${name}" 不存在`);
          return;
        }
        syncCurrentAfterRemove(state);
        message.success('模型删除成功');
      }));
      return;
    }

    const project = get().project;
    if (!project || JSON.stringify(project) === '{}') {
      message.error('未打开项目');
      return Promise.resolve(false);
    }
    const modules = project.projectJSON?.modules || [];
    if (!modules.some((m: any) => m?.name === name)) {
      message.error(`模型 "${name}" 不存在`);
      return Promise.resolve(false);
    }

    const next = produce(project, (draft: any) => {
      draft.projectJSON.modules =
        draft.projectJSON.modules?.filter((m: any) => m?.name !== name) || [];
    });

    return (async () => {
      const saved = await persistProjectNow(next, '模型保存失败');
      if (!saved) {
        return false;
      }
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce(state => {
        state.project.projectJSON = next.projectJSON;
        syncCurrentAfterRemove(state);
      }));
      ackManualPersist(true);
      message.success('模型删除成功');
      return true;
    })();
  },
  updateModule: (payload: any) => set(produce(state => {
    state.project.projectJSON.modules[state.currentModuleIndex] = payload
  })),
  copyModule: (payload: any) => set(produce(state => {
    const moduleName = payload.name || payload.title;
    if (!moduleName) {
      message.error('无效的模型数据');
      return;
    }
    const currentModule = state.project.projectJSON?.modules?.find((m: any) => m.name === moduleName);
    if (currentModule) {
      const moduleToCopy = {
        ...currentModule,
        chnname: payload.chnname || currentModule.chnname
      };
      cache.setItem(ERD_MODULE_CLIPBOARD, JSON.stringify(moduleToCopy));
      message.success(`模型 "${moduleName}" 已成功复制到剪贴板`);
    } else {
      message.error(`未找到名为 "${moduleName}" 的模型`);
    }
  })),
  // 剪切模型；persist:true 时仅 saveProject code===200 写剪贴板+移出+toast
  cutModule: (payload: any, opts?: PersistOpt) => {
    const persist = !!opts?.persist;
    const moduleName = payload?.name || payload?.title;
    if (!moduleName) {
      message.error('无效的模型数据');
      return persist ? Promise.resolve(false) : undefined;
    }

    const modules = get().project?.projectJSON?.modules || [];
    const moduleIndex = modules.findIndex((m: any) => m.name === moduleName);
    if (moduleIndex === -1) {
      message.error(`未找到名为 "${moduleName}" 的模型`);
      return persist ? Promise.resolve(false) : undefined;
    }
    const currentModule = modules[moduleIndex];
    const moduleToCut = {
      ...currentModule,
      chnname: payload.chnname || currentModule.chnname,
      _isCut: true,
    };
    const clipPayload = JSON.stringify(moduleToCut);

    if (!persist) {
      cache.setItem(ERD_MODULE_CLIPBOARD, clipPayload);
      snapshotModules(modules);
      set(produce(state => {
        const mi = state.project.projectJSON?.modules?.findIndex((m: any) => m.name === moduleName);
        if (mi === -1 || mi == null) {
          message.error(`未找到名为 "${moduleName}" 的模型`);
          return;
        }
        state.project.projectJSON.modules.splice(mi, 1);
        message.success(`模型 "${moduleName}" 已成功剪切到剪贴板`);
      }));
      return;
    }

    const project = get().project;
    if (!project || JSON.stringify(project) === '{}') {
      message.error('未打开项目');
      return Promise.resolve(false);
    }
    const next = produce(project, (draft: any) => {
      draft.projectJSON.modules =
        draft.projectJSON.modules?.filter((m: any) => m?.name !== moduleName) || [];
    });

    return (async () => {
      const saved = await persistProjectNow(next, '模型保存失败');
      if (!saved) {
        return false;
      }
      cache.setItem(ERD_MODULE_CLIPBOARD, clipPayload);
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce(state => {
        state.project.projectJSON = next.projectJSON;
      }));
      ackManualPersist(true);
      message.success(`模型 "${moduleName}" 已成功剪切到剪贴板`);
      return true;
    })();
  },
  // 粘贴模型；persist:true 时仅 saveProject code===200 写 store+toast
  pastModule: (opts?: PersistOpt) => {
    const persist = !!opts?.persist;
    let data: any;
    try {
      data = JSON.parse(cache.getItem(ERD_MODULE_CLIPBOARD) || 'null');
    } catch (error) {
      console.error('解析剪贴板数据时出错:', error);
      data = null;
    }

    if (!data || !validateModule(data)) {
      message.error('剪贴板中没有有效的模型数据');
      return persist ? Promise.resolve(false) : undefined;
    }

    delete data._isCut;

    const modules = get().project?.projectJSON?.modules || [];
    const { name: moduleName, counter } = nextCopyName(data.name, (n) =>
      modules.some((m: any) => m.name === n),
    );

    const newModule = {
      ...data,
      name: moduleName,
      chnname:
        counter === 0
          ? data.chnname
          : `${data.chnname || data.name}${counter === 1 ? '副本' : `副本${counter}`}`,
      entities: (data.entities || []).map((entity: any) => {
        const baseEntity = entity.title || entity.name;
        const { name: entityName, counter: entityCounter } = nextCopyName(baseEntity, (n) =>
          modules.some((m: any) =>
            (m.entities || []).some((e: any) => (e.title || e.name) === n),
          ),
        );
        return {
          ...entity,
          title: entityName,
          name: entityName,
          chnname:
            entityCounter === 0
              ? entity.chnname
              : `${entity.chnname || entity.title || entity.name}${entityCounter === 1 ? '副本' : `副本${entityCounter}`}`,
        };
      }),
    };

    if (!persist) {
      snapshotModules(modules);
      set(produce(state => {
        state.project.projectJSON.modules.push(newModule);
        message.success(`模型 "${moduleName}" 已成功粘贴`);
      }));
      return;
    }

    const project = get().project;
    if (!project || JSON.stringify(project) === '{}') {
      message.error('未打开项目');
      return Promise.resolve(false);
    }
    const next = produce(project, (draft: any) => {
      draft.projectJSON.modules.push(JSON.parse(JSON.stringify(newModule)));
    });

    return (async () => {
      const saved = await persistProjectNow(next, '模型保存失败');
      if (!saved) {
        return false;
      }
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce(state => {
        state.project.projectJSON = next.projectJSON;
      }));
      ackManualPersist(true);
      message.success(`模型 "${moduleName}" 已成功粘贴`);
      return true;
    })();
  },
  updateRelation: (payload: any) => set(produce(state => {
    if (payload.graphCanvas) {
      state.project.projectJSON.modules[state.currentModuleIndex].graphCanvas = payload.graphCanvas;
    }
    if (payload.associations) {
      state.project.projectJSON.modules[state.currentModuleIndex].associations = payload.associations;
    }
  })),
  // 按模块名 upsert 画布布局（只写 diagrams；实体以 entities 为准——ADR-0001 / ADR-0017）。
  // 不用 currentModuleIndex：关系图 tab 的模块与当前选中模块可能不同（A 模块画布开着、B 模块被选中）。
  updateGraphCanvasLayout: (moduleName: string, layoutNodes: any[], diagramId?: string) => {
    snapshotModules(get().project?.projectJSON?.modules);
    set(produce(state => {
      const module = state.project.projectJSON?.modules?.find((m: any) => m?.name === moduleName);
      if (!module) {
        return;
      }
      const diagrams = ensureDiagrams(module);
      const id = diagramId || DEFAULT_DIAGRAM_ID;
      const diagram = diagrams.find((d) => d.id === id) || diagrams[0];
      upsertDiagramLayout(diagram, layoutNodes);
    }));
  },
  // 拖表/拖框结束：禁本地 mutate 即「坐标已落」；persist:true 仅 save code===200 写 store
  commitDiagramGeometry: (moduleName, diagramId, payload, opts?) => {
    const persist = !!opts?.persist;
    const layoutNodes = payload.layoutNodes || [];
    const frameBounds = payload.frameBounds || [];
    if (!layoutNodes.length && !frameBounds.length) {
      return persist ? Promise.resolve(true) : true;
    }

    const apply = (modules: any[]): boolean => {
      const module = modules?.find((m: any) => m?.name === moduleName);
      if (!module) {
        return false;
      }
      const diagrams = ensureDiagrams(module);
      const id = diagramId || DEFAULT_DIAGRAM_ID;
      const diagram = diagrams.find((d) => d.id === id) || diagrams[0];
      if (!diagram) {
        return false;
      }
      if (layoutNodes.length) {
        upsertDiagramLayout(diagram, layoutNodes);
      }
      frameBounds.forEach((f) => applyFrameBounds(diagram, f.id, f));
      return true;
    };

    if (!persist) {
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce(state => {
        apply(state.project.projectJSON?.modules);
      }));
      return true;
    }

    const project = get().project;
    if (!project || JSON.stringify(project) === '{}') {
      message.error('未打开项目');
      return Promise.resolve(false);
    }
    if (!project.projectJSON?.modules?.some((m: any) => m?.name === moduleName)) {
      message.error(`模型 "${moduleName}" 不存在`);
      return Promise.resolve(false);
    }

    let applied = false;
    const next = produce(project, (draft: any) => {
      applied = apply(draft.projectJSON.modules);
    });
    if (!applied) {
      message.error(`模型 "${moduleName}" 不存在`);
      return Promise.resolve(false);
    }

    return (async () => {
      const saved = await persistProjectNow(next, '布局保存失败');
      if (!saved) {
        return false;
      }
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce((state: any) => {
        state.project.projectJSON = next.projectJSON;
      }));
      ackManualPersist(true);
      return true;
    })();
  },
  createDiagram: (moduleName: string, name?: string, opts?: PersistOpt) => {
    const persist = !!opts?.persist;

    const buildDisplayAndId = (diagrams: { id: string; name: string }[]) => {
      const id = newDiagramId();
      const base = (name || '关系图').trim() || '关系图';
      let display = base;
      let n = 2;
      while (diagrams.some((d) => d.name === display)) {
        display = `${base}${n}`;
        n += 1;
      }
      return { id, display };
    };

    if (!persist) {
      let createdId: string | undefined;
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce(state => {
        const module = state.project.projectJSON?.modules?.find((m: any) => m?.name === moduleName);
        if (!module) {
          return;
        }
        const diagrams = ensureDiagrams(module);
        const { id, display } = buildDisplayAndId(diagrams);
        diagrams.push({ id, name: display, layout: { nodes: [] } });
        createdId = id;
      }));
      if (createdId) {
        message.success('已新建关系图');
      }
      return createdId;
    }

    const project = get().project;
    if (!project || JSON.stringify(project) === '{}') {
      message.error('未打开项目');
      return Promise.resolve(undefined);
    }
    const module = project.projectJSON?.modules?.find((m: any) => m?.name === moduleName);
    if (!module) {
      message.error(`模型 "${moduleName}" 不存在`);
      return Promise.resolve(undefined);
    }

    let createdId: string | undefined;
    const next = produce(project, (draft: any) => {
      const mod = draft.projectJSON?.modules?.find((m: any) => m?.name === moduleName);
      if (!mod) {
        return;
      }
      const diagrams = ensureDiagrams(mod);
      const { id, display } = buildDisplayAndId(diagrams);
      diagrams.push({ id, name: display, layout: { nodes: [] } });
      createdId = id;
    });

    if (!createdId) {
      return Promise.resolve(undefined);
    }

    return (async () => {
      const saved = await persistProjectNow(next, '关系图保存失败');
      if (!saved) {
        return undefined;
      }
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce(state => {
        state.project.projectJSON = next.projectJSON;
      }));
      ackManualPersist(true);
      message.success('已新建关系图');
      return createdId;
    })();
  },
  renameDiagram: (moduleName: string, diagramId: string, name: string, opts?: PersistOpt) => {
    const persist = !!opts?.persist;
    const nextName = (name || '').trim();
    if (!nextName) {
      message.warning('图名称不能为空');
      return persist ? Promise.resolve(false) : false;
    }

    if (!persist) {
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce(state => {
        const module = state.project.projectJSON?.modules?.find((m: any) => m?.name === moduleName);
        if (!module) {
          return;
        }
        const diagrams = ensureDiagrams(module);
        const d = diagrams.find((x) => x.id === diagramId);
        if (!d) {
          return;
        }
        d.name = nextName;
      }));
      return true;
    }

    const project = get().project;
    if (!project || JSON.stringify(project) === '{}') {
      message.error('未打开项目');
      return Promise.resolve(false);
    }

    let renamed = false;
    const next = produce(project, (draft: any) => {
      const module = draft.projectJSON?.modules?.find((m: any) => m?.name === moduleName);
      if (!module) {
        return;
      }
      const diagrams = ensureDiagrams(module);
      const d = diagrams.find((x: any) => x.id === diagramId);
      if (!d) {
        return;
      }
      d.name = nextName;
      renamed = true;
    });

    if (!renamed) {
      message.error('关系图不存在');
      return Promise.resolve(false);
    }

    return (async () => {
      const saved = await persistProjectNow(next, '关系图保存失败');
      if (!saved) {
        return false;
      }
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce(state => {
        state.project.projectJSON = next.projectJSON;
      }));
      ackManualPersist(true);
      return true;
    })();
  },
  removeDiagram: (moduleName: string, diagramId: string, opts?: PersistOpt) => {
    const persist = !!opts?.persist;
    if (diagramId === DEFAULT_DIAGRAM_ID) {
      message.warning('主关系图不可删除');
      return persist ? Promise.resolve(false) : undefined;
    }

    if (!persist) {
      snapshotModules(get().project?.projectJSON?.modules);
      let removed = false;
      set(produce(state => {
        const module = state.project.projectJSON?.modules?.find((m: any) => m?.name === moduleName);
        if (!module) {
          return;
        }
        const diagrams = ensureDiagrams(module);
        if (diagrams.length <= 1) {
          message.warning('至少保留一张关系图');
          return;
        }
        module.diagrams = diagrams.filter((d) => d.id !== diagramId);
        removed = true;
      }));
      if (removed) {
        message.success('关系图删除成功');
      }
      return;
    }

    const project = get().project;
    if (!project || JSON.stringify(project) === '{}') {
      message.error('未打开项目');
      return Promise.resolve(false);
    }
    const module = project.projectJSON?.modules?.find((m: any) => m?.name === moduleName);
    if (!module) {
      message.error(`模型 "${moduleName}" 不存在`);
      return Promise.resolve(false);
    }

    let removed = false;
    let blockedReason: 'last' | undefined;
    const next = produce(project, (draft: any) => {
      const mod = draft.projectJSON?.modules?.find((m: any) => m?.name === moduleName);
      if (!mod) {
        return;
      }
      const diagrams = ensureDiagrams(mod);
      if (diagrams.length <= 1) {
        blockedReason = 'last';
        return;
      }
      if (!diagrams.some((d) => d.id === diagramId)) {
        return;
      }
      mod.diagrams = diagrams.filter((d) => d.id !== diagramId);
      removed = true;
    });

    if (blockedReason === 'last') {
      message.warning('至少保留一张关系图');
      return Promise.resolve(false);
    }
    if (!removed) {
      message.error('关系图不存在');
      return Promise.resolve(false);
    }

    return (async () => {
      const saved = await persistProjectNow(next, '关系图保存失败');
      if (!saved) {
        return false;
      }
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce(state => {
        state.project.projectJSON = next.projectJSON;
      }));
      ackManualPersist(true);
      message.success('关系图删除成功');
      return true;
    })();
  },
  createFrame: (moduleName, diagramId, opts, persistOpt?) => {
    const persist = !!persistOpt?.persist;
    const frameOpts = opts || {};

    if (!persist) {
      let createdId: string | undefined;
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce(state => {
        const module = state.project.projectJSON?.modules?.find((m: any) => m?.name === moduleName);
        if (!module) {
          return;
        }
        const diagrams = ensureDiagrams(module);
        const id = diagramId || DEFAULT_DIAGRAM_ID;
        const diagram = diagrams.find((d) => d.id === id) || diagrams[0];
        const frame = addFrameToDiagram(diagram, frameOpts);
        createdId = frame.id;
      }));
      if (createdId) {
        message.success('已新建分组');
      }
      return createdId;
    }

    const project = get().project;
    if (!project || JSON.stringify(project) === '{}') {
      message.error('未打开项目');
      return Promise.resolve(undefined);
    }
    if (!project.projectJSON?.modules?.some((m: any) => m?.name === moduleName)) {
      message.error(`模型 "${moduleName}" 不存在`);
      return Promise.resolve(undefined);
    }

    let createdId: string | undefined;
    const next = produce(project, (draft: any) => {
      const module = draft.projectJSON?.modules?.find((m: any) => m?.name === moduleName);
      if (!module) {
        return;
      }
      const diagrams = ensureDiagrams(module);
      const id = diagramId || DEFAULT_DIAGRAM_ID;
      const diagram = diagrams.find((d) => d.id === id) || diagrams[0];
      if (!diagram) {
        return;
      }
      const frame = addFrameToDiagram(diagram, frameOpts);
      createdId = frame.id;
    });
    if (!createdId) {
      message.error(`模型 "${moduleName}" 不存在`);
      return Promise.resolve(undefined);
    }

    return (async () => {
      const saved = await persistProjectNow(next, '分组保存失败');
      if (!saved) {
        return undefined;
      }
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce((state: any) => {
        state.project.projectJSON = next.projectJSON;
      }));
      ackManualPersist(true);
      message.success('已新建分组');
      return createdId;
    })();
  },
  addFrameMembers: (moduleName, diagramId, frameId, memberEntityIds, opts?) => {
    const persist = !!opts?.persist;
    if (!memberEntityIds.length) {
      message.info('请先选中要加入分组的表');
      return persist ? Promise.resolve(false) : undefined;
    }

    const apply = (modules: any[]): string | undefined => {
      const module = modules?.find((m: any) => m?.name === moduleName);
      if (!module) {
        return undefined;
      }
      const diagrams = ensureDiagrams(module);
      const id = diagramId || DEFAULT_DIAGRAM_ID;
      const diagram = diagrams.find((d) => d.id === id) || diagrams[0];
      if (!diagram) {
        return undefined;
      }
      const frame = addMembersToFrame(diagram, frameId, memberEntityIds);
      return frame?.name;
    };

    if (!persist) {
      snapshotModules(get().project?.projectJSON?.modules);
      let frameName: string | undefined;
      set(produce(state => {
        frameName = apply(state.project.projectJSON?.modules);
      }));
      if (frameName) {
        message.success(`已加入「${frameName}」`);
      } else {
        message.warning('未找到分组');
      }
      return;
    }

    const project = get().project;
    if (!project || JSON.stringify(project) === '{}') {
      message.error('未打开项目');
      return Promise.resolve(false);
    }
    if (!project.projectJSON?.modules?.some((m: any) => m?.name === moduleName)) {
      message.error(`模型 "${moduleName}" 不存在`);
      return Promise.resolve(false);
    }

    let frameName: string | undefined;
    const next = produce(project, (draft: any) => {
      frameName = apply(draft.projectJSON.modules);
    });
    if (!frameName) {
      message.warning('未找到分组');
      return Promise.resolve(false);
    }

    return (async () => {
      const saved = await persistProjectNow(next, '分组保存失败');
      if (!saved) {
        return false;
      }
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce((state: any) => {
        state.project.projectJSON = next.projectJSON;
      }));
      ackManualPersist(true);
      message.success(`已加入「${frameName}」`);
      return true;
    })();
  },
  removeFrameMembers: (moduleName, diagramId, frameId, memberEntityIds, opts?) => {
    const persist = !!opts?.persist;
    if (!memberEntityIds.length) {
      return persist ? Promise.resolve(true) : undefined;
    }

    const apply = (modules: any[]): string | undefined => {
      const module = modules?.find((m: any) => m?.name === moduleName);
      if (!module) {
        return undefined;
      }
      const diagrams = ensureDiagrams(module);
      const id = diagramId || DEFAULT_DIAGRAM_ID;
      const diagram = diagrams.find((d) => d.id === id) || diagrams[0];
      if (!diagram) {
        return undefined;
      }
      const frame = removeMembersFromFrame(diagram, frameId, memberEntityIds);
      return frame?.name;
    };

    if (!persist) {
      snapshotModules(get().project?.projectJSON?.modules);
      let frameName: string | undefined;
      set(produce(state => {
        frameName = apply(state.project.projectJSON?.modules);
      }));
      if (frameName) {
        message.info(`已移出「${frameName}」`);
      }
      return;
    }

    const project = get().project;
    if (!project || JSON.stringify(project) === '{}') {
      message.error('未打开项目');
      return Promise.resolve(false);
    }
    if (!project.projectJSON?.modules?.some((m: any) => m?.name === moduleName)) {
      message.error(`模型 "${moduleName}" 不存在`);
      return Promise.resolve(false);
    }

    let frameName: string | undefined;
    const next = produce(project, (draft: any) => {
      frameName = apply(draft.projectJSON.modules);
    });
    if (!frameName) {
      return Promise.resolve(false);
    }

    return (async () => {
      const saved = await persistProjectNow(next, '分组保存失败');
      if (!saved) {
        return false;
      }
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce((state: any) => {
        state.project.projectJSON = next.projectJSON;
      }));
      ackManualPersist(true);
      message.info(`已移出「${frameName}」`);
      return true;
    })();
  },
  updateFrameBounds: (moduleName, diagramId, frames, opts?) => {
    const persist = !!opts?.persist;
    if (!frames.length) {
      return persist ? Promise.resolve(true) : undefined;
    }

    const apply = (modules: any[]): boolean => {
      const module = modules?.find((m: any) => m?.name === moduleName);
      if (!module) {
        return false;
      }
      const diagrams = ensureDiagrams(module);
      const id = diagramId || DEFAULT_DIAGRAM_ID;
      const diagram = diagrams.find((d) => d.id === id) || diagrams[0];
      if (!diagram) {
        return false;
      }
      frames.forEach((f) => applyFrameBounds(diagram, f.id, f));
      return true;
    };

    if (!persist) {
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce(state => {
        apply(state.project.projectJSON?.modules);
      }));
      return;
    }

    const project = get().project;
    if (!project || JSON.stringify(project) === '{}') {
      message.error('未打开项目');
      return Promise.resolve(false);
    }
    if (!project.projectJSON?.modules?.some((m: any) => m?.name === moduleName)) {
      message.error(`模型 "${moduleName}" 不存在`);
      return Promise.resolve(false);
    }

    let applied = false;
    const next = produce(project, (draft: any) => {
      applied = apply(draft.projectJSON.modules);
    });
    if (!applied) {
      message.error(`模型 "${moduleName}" 不存在`);
      return Promise.resolve(false);
    }

    return (async () => {
      const saved = await persistProjectNow(next, '分组保存失败');
      if (!saved) {
        return false;
      }
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce((state: any) => {
        state.project.projectJSON = next.projectJSON;
      }));
      ackManualPersist(true);
      return true;
    })();
  },
  removeFrame: (moduleName, diagramId, frameId, opts?) => {
    const persist = !!opts?.persist;
    const ids = (Array.isArray(frameId) ? frameId : [frameId]).filter(
      (id): id is string => typeof id === 'string' && !!id,
    );
    if (!ids.length) {
      message.error('未指定要删除的分组');
      return persist ? Promise.resolve(false) : undefined;
    }

    const applyRemove = (modules: any[]): boolean => {
      const module = modules?.find((m: any) => m?.name === moduleName);
      if (!module) {
        return false;
      }
      const diagrams = ensureDiagrams(module);
      const id = diagramId || DEFAULT_DIAGRAM_ID;
      const diagram = diagrams.find((d) => d.id === id) || diagrams[0];
      if (!diagram) {
        return false;
      }
      ids.forEach((fid) => removeFrameFromDiagram(diagram, fid));
      return true;
    };

    if (!persist) {
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce(state => {
        if (!applyRemove(state.project.projectJSON?.modules)) {
          message.error(`模型 "${moduleName}" 不存在`);
          return;
        }
        message.success('已删除分组');
      }));
      return;
    }

    const project = get().project;
    if (!project || JSON.stringify(project) === '{}') {
      message.error('未打开项目');
      return Promise.resolve(false);
    }
    if (!project.projectJSON?.modules?.some((m: any) => m?.name === moduleName)) {
      message.error(`模型 "${moduleName}" 不存在`);
      return Promise.resolve(false);
    }

    const next = produce(project, (draft: any) => {
      applyRemove(draft.projectJSON.modules);
    });

    return (async () => {
      const saved = await persistProjectNow(next, '分组保存失败');
      if (!saved) {
        return false;
      }
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce((state: any) => {
        state.project.projectJSON = next.projectJSON;
      }));
      ackManualPersist(true);
      message.success('已删除分组');
      return true;
    })();
  },
  renameFrame: (moduleName, diagramId, frameId, name, opts?) => {
    const persist = !!opts?.persist;
    const next = (name || '').trim();
    if (!next) {
      message.warning('分组名称不能为空');
      return persist ? Promise.resolve(false) : undefined;
    }

    const apply = (modules: any[]): boolean => {
      const module = modules?.find((m: any) => m?.name === moduleName);
      if (!module) {
        return false;
      }
      const diagrams = ensureDiagrams(module);
      const id = diagramId || DEFAULT_DIAGRAM_ID;
      const diagram = diagrams.find((d) => d.id === id) || diagrams[0];
      if (!diagram) {
        return false;
      }
      renameFrameInDiagram(diagram, frameId, next);
      return true;
    };

    if (!persist) {
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce(state => {
        apply(state.project.projectJSON?.modules);
      }));
      return;
    }

    const project = get().project;
    if (!project || JSON.stringify(project) === '{}') {
      message.error('未打开项目');
      return Promise.resolve(false);
    }
    if (!project.projectJSON?.modules?.some((m: any) => m?.name === moduleName)) {
      message.error(`模型 "${moduleName}" 不存在`);
      return Promise.resolve(false);
    }

    let applied = false;
    const nextProject = produce(project, (draft: any) => {
      applied = apply(draft.projectJSON.modules);
    });
    if (!applied) {
      message.error(`模型 "${moduleName}" 不存在`);
      return Promise.resolve(false);
    }

    return (async () => {
      const saved = await persistProjectNow(nextProject, '分组保存失败');
      if (!saved) {
        return false;
      }
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce((state: any) => {
        state.project.projectJSON = nextProject.projectJSON;
      }));
      ackManualPersist(true);
      return true;
    })();
  },
  // 追加关联（按 from/to 去重）；重复时 toast，禁止静默失败
  // persist:true 时仅 saveProject code===200 写 store；失败不上边（边由 associations 派生）
  addAssociation: (moduleName: string, association: any, opts?) => {
    const persist = !!opts?.persist;
    const modules = get().project?.projectJSON?.modules;
    const module = modules?.find((m: any) => m?.name === moduleName);
    if (!module) {
      message.warning('未找到当前模块，无法建立关联');
      return persist ? Promise.resolve(false) : undefined;
    }
    const exists = (module.associations || []).some((a: any) =>
      a?.from?.entity === association.from?.entity && a?.from?.field === association.from?.field &&
      a?.to?.entity === association.to?.entity && a?.to?.field === association.to?.field);
    if (exists) {
      message.warning('该字段关联已存在，无需重复连线');
      return persist ? Promise.resolve(false) : undefined;
    }

    const relation = normalizeRelation(association.relation) || association.relation || 'n:1';
    const payload = { ...association, relation };

    const applyAdd = (modList: any[]): boolean => {
      const m = modList?.find((x: any) => x?.name === moduleName);
      if (!m) {
        return false;
      }
      const dup = (m.associations || []).some((a: any) =>
        a?.from?.entity === payload.from?.entity && a?.from?.field === payload.from?.field &&
        a?.to?.entity === payload.to?.entity && a?.to?.field === payload.to?.field);
      if (dup) {
        return false;
      }
      m.associations = [...(m.associations || []), payload];
      return true;
    };

    if (!persist) {
      snapshotModules(modules);
      set(produce(state => {
        applyAdd(state.project.projectJSON?.modules);
      }));
      return;
    }

    const project = get().project;
    if (!project || JSON.stringify(project) === '{}') {
      message.error('未打开项目');
      return Promise.resolve(false);
    }

    const next = produce(project, (draft: any) => {
      if (!applyAdd(draft.projectJSON?.modules)) {
        // module vanished mid-flight
      }
    });
    if (!(next.projectJSON?.modules as any[])?.some((m: any) =>
      m?.name === moduleName
      && (m.associations || []).some((a: any) =>
        a?.from?.entity === payload.from?.entity && a?.from?.field === payload.from?.field &&
        a?.to?.entity === payload.to?.entity && a?.to?.field === payload.to?.field),
    )) {
      message.error(`模型 "${moduleName}" 不存在`);
      return Promise.resolve(false);
    }

    return (async () => {
      const saved = await persistProjectNow(next, '关系保存失败');
      if (!saved) {
        return false;
      }
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce((state: any) => {
        state.project.projectJSON = next.projectJSON;
      }));
      ackManualPersist(true);
      return true;
    })();
  },
  // 删除关联（画布删边）；persist:true 时仅 saveProject code===200 写 store + toast
  removeAssociation: (moduleName: string, association: any | any[], opts?) => {
    const persist = !!opts?.persist;
    const list = (Array.isArray(association) ? association : [association]).filter(
      (a) => a?.from?.entity && a?.from?.field && a?.to?.entity && a?.to?.field,
    );
    if (!list.length) {
      message.error('未指定要删除的关系');
      return persist ? Promise.resolve(false) : undefined;
    }

    const matches = (a: any, target: any) =>
      a?.from?.entity === target.from?.entity &&
      a?.from?.field === target.from?.field &&
      a?.to?.entity === target.to?.entity &&
      a?.to?.field === target.to?.field;

    const applyRemove = (modules: any[]): boolean => {
      const module = modules?.find((m: any) => m?.name === moduleName);
      if (!module) {
        return false;
      }
      module.associations = (module.associations || []).filter(
        (a: any) => !list.some((target) => matches(a, target)),
      );
      return true;
    };

    if (!persist) {
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce(state => {
        if (!applyRemove(state.project.projectJSON?.modules)) {
          message.error(`模型 "${moduleName}" 不存在`);
        }
      }));
      return;
    }

    const project = get().project;
    if (!project || JSON.stringify(project) === '{}') {
      message.error('未打开项目');
      return Promise.resolve(false);
    }
    if (!project.projectJSON?.modules?.some((m: any) => m?.name === moduleName)) {
      message.error(`模型 "${moduleName}" 不存在`);
      return Promise.resolve(false);
    }

    const next = produce(project, (draft: any) => {
      applyRemove(draft.projectJSON.modules);
    });

    return (async () => {
      const saved = await persistProjectNow(next, '关系保存失败');
      if (!saved) {
        return false;
      }
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce((state: any) => {
        state.project.projectJSON = next.projectJSON;
      }));
      ackManualPersist(true);
      message.success(list.length === 1 ? '关系删除成功' : `已删除 ${list.length} 条关系`);
      return true;
    })();
  },
  // 改关联基数；persist:true 时仅 saveProject code===200 写 store；失败保持原基数
  updateAssociationRelation: (moduleName, association, relation, opts?) => {
    const persist = !!opts?.persist;
    const next = normalizeRelation(relation);
    if (!next) {
      message.warning('基数不能为空');
      return persist ? Promise.resolve(false) : undefined;
    }

    const matches = (a: any) =>
      a?.from?.entity === association.from?.entity &&
      a?.from?.field === association.from?.field &&
      a?.to?.entity === association.to?.entity &&
      a?.to?.field === association.to?.field;

    const applyUpdate = (modules: any[]): boolean => {
      const module = modules?.find((m: any) => m?.name === moduleName);
      if (!module) {
        return false;
      }
      const list = module.associations || [];
      for (const a of list) {
        if (matches(a)) {
          a.relation = next;
          return true;
        }
      }
      return false;
    };

    if (!persist) {
      snapshotModules(get().project?.projectJSON?.modules);
      let found = false;
      set(produce(state => {
        found = applyUpdate(state.project.projectJSON?.modules);
      }));
      if (!found) {
        message.warning('未找到该关联');
      }
      return;
    }

    const project = get().project;
    if (!project || JSON.stringify(project) === '{}') {
      message.error('未打开项目');
      return Promise.resolve(false);
    }
    if (!project.projectJSON?.modules?.some((m: any) => m?.name === moduleName)) {
      message.error(`模型 "${moduleName}" 不存在`);
      return Promise.resolve(false);
    }

    const nextProject = produce(project, (draft: any) => {
      applyUpdate(draft.projectJSON?.modules);
    });
    const updated = (nextProject.projectJSON?.modules as any[])?.some(
      (m: any) =>
        m?.name === moduleName
        && (m.associations || []).some((a: any) => matches(a) && a.relation === next),
    );
    if (!updated) {
      message.warning('未找到该关联');
      return Promise.resolve(false);
    }

    return (async () => {
      const saved = await persistProjectNow(nextProject, '关系保存失败');
      if (!saved) {
        return false;
      }
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce((state: any) => {
        state.project.projectJSON = nextProject.projectJSON;
      }));
      ackManualPersist(true);
      return true;
    })();
  },
  // 改关联 constraintName / ON DELETE / ON UPDATE；persist:true 时仅 saveProject code===200 写 store
  updateAssociationFkMeta: (moduleName, association, meta, opts?) => {
    const persist = !!opts?.persist;
    const patch: {
      constraintName?: string;
      deleteRule?: string;
      updateRule?: string;
    } = {};
    if (Object.prototype.hasOwnProperty.call(meta, 'constraintName')) {
      const n = normalizeConstraintName(meta.constraintName);
      if (n === null) {
        message.warning('约束名无效（过长或含非法字符）');
        return persist ? Promise.resolve(false) : undefined;
      }
      patch.constraintName = n;
    }
    if (Object.prototype.hasOwnProperty.call(meta, 'deleteRule')) {
      const n = normalizeFkRule(meta.deleteRule);
      if (n === null) {
        message.warning('ON DELETE 取值无效');
        return persist ? Promise.resolve(false) : undefined;
      }
      patch.deleteRule = n;
    }
    if (Object.prototype.hasOwnProperty.call(meta, 'updateRule')) {
      const n = normalizeFkRule(meta.updateRule);
      if (n === null) {
        message.warning('ON UPDATE 取值无效');
        return persist ? Promise.resolve(false) : undefined;
      }
      patch.updateRule = n;
    }
    if (!Object.keys(patch).length) {
      message.warning('未指定要修改的 FK 元数据');
      return persist ? Promise.resolve(false) : undefined;
    }

    const matches = (a: any) =>
      a?.from?.entity === association.from?.entity &&
      a?.from?.field === association.from?.field &&
      a?.to?.entity === association.to?.entity &&
      a?.to?.field === association.to?.field;

    const applyPatchTo = (a: any) => {
      if (Object.prototype.hasOwnProperty.call(patch, 'constraintName')) {
        if (patch.constraintName) {
          a.constraintName = patch.constraintName;
        } else {
          delete a.constraintName;
        }
      }
      if (Object.prototype.hasOwnProperty.call(patch, 'deleteRule')) {
        if (patch.deleteRule) {
          a.deleteRule = patch.deleteRule;
        } else {
          delete a.deleteRule;
        }
      }
      if (Object.prototype.hasOwnProperty.call(patch, 'updateRule')) {
        if (patch.updateRule) {
          a.updateRule = patch.updateRule;
        } else {
          delete a.updateRule;
        }
      }
    };

    const applyUpdate = (modules: any[]): 'ok' | 'missing' | 'collision' => {
      const module = modules?.find((m: any) => m?.name === moduleName);
      if (!module) {
        return 'missing';
      }
      const list = module.associations || [];
      const target = list.find(matches);
      if (!target) {
        return 'missing';
      }
      const oldConstraintName = String(target.constraintName || '').trim();
      if (
        Object.prototype.hasOwnProperty.call(patch, 'constraintName')
        && patch.constraintName
        && patch.constraintName !== oldConstraintName
      ) {
        const collided = list.some(
          (a: any) =>
            a !== target
            && String(a?.constraintName || '').trim() === patch.constraintName,
        );
        if (collided) {
          message.warning(`约束名已存在: ${patch.constraintName}`);
          return 'collision';
        }
      }
      // 先按旧名锁定拆边组，再改目标（改名后仍靠 oldConstraintName 找兄弟）
      applyPatchTo(target);
      if (oldConstraintName) {
        for (const a of list) {
          if (a !== target && String(a?.constraintName || '').trim() === oldConstraintName) {
            applyPatchTo(a);
          }
        }
      }
      return 'ok';
    };

    if (!persist) {
      snapshotModules(get().project?.projectJSON?.modules);
      let status: 'ok' | 'missing' | 'collision' = 'missing';
      set(produce(state => {
        status = applyUpdate(state.project.projectJSON?.modules);
      }));
      if (status === 'missing') {
        message.warning('未找到该关联');
      }
      return;
    }

    const project = get().project;
    if (!project || JSON.stringify(project) === '{}') {
      message.error('未打开项目');
      return Promise.resolve(false);
    }
    if (!project.projectJSON?.modules?.some((m: any) => m?.name === moduleName)) {
      message.error(`模型 "${moduleName}" 不存在`);
      return Promise.resolve(false);
    }

    let status: 'ok' | 'missing' | 'collision' = 'missing';
    const nextProject = produce(project, (draft: any) => {
      status = applyUpdate(draft.projectJSON?.modules);
    });
    if (status !== 'ok') {
      if (status === 'missing') {
        message.warning('未找到该关联');
      }
      return Promise.resolve(false);
    }
    const updated = (nextProject.projectJSON?.modules as any[])?.some(
      (m: any) =>
        m?.name === moduleName
        && (m.associations || []).some((a: any) => {
          if (!matches(a)) return false;
          if (Object.prototype.hasOwnProperty.call(patch, 'constraintName')) {
            const got = a.constraintName || '';
            if (got !== patch.constraintName) return false;
          }
          if (Object.prototype.hasOwnProperty.call(patch, 'deleteRule')) {
            const got = a.deleteRule || '';
            if (got !== patch.deleteRule) return false;
          }
          if (Object.prototype.hasOwnProperty.call(patch, 'updateRule')) {
            const got = a.updateRule || '';
            if (got !== patch.updateRule) return false;
          }
          return true;
        }),
    );
    if (!updated) {
      message.warning('未找到该关联');
      return Promise.resolve(false);
    }

    return (async () => {
      const saved = await persistProjectNow(nextProject, '关系保存失败');
      if (!saved) {
        return false;
      }
      snapshotModules(get().project?.projectJSON?.modules);
      set(produce((state: any) => {
        state.project.projectJSON = nextProject.projectJSON;
      }));
      ackManualPersist(true);
      return true;
    })();
  },
  undoCanvas: () => {
    const restored = undoModules(get().project?.projectJSON?.modules);
    if (!restored) {
      message.info('没有可撤销的操作');
      return;
    }
    set(produce(state => {
      state.project.projectJSON.modules = restored;
    }));
  },
  redoCanvas: () => {
    const restored = redoModules(get().project?.projectJSON?.modules);
    if (!restored) {
      message.info('没有可重做的操作');
      return;
    }
    set(produce(state => {
      state.project.projectJSON.modules = restored;
    }));
  },
  setCurrentModule: (payload: any) => set(produce(state => {
    state.currentModule = payload
    state.currentModuleIndex = state.project.projectJSON?.modules?.findIndex((m: any) => m?.name === payload);
  })),
  updateAllModules: (payload: any) => set(produce(state => {
    const modules = get().dispatch.fixModules(payload, null, null);
    if (modules) {
      state.project.projectJSON.modules = modules;
    }
  })),
  getModuleEntityTree: (searchKey: string, groupByType: boolean) => {
    const tempExpandedKeys: any = [];
    const tableLimit = get().project?.projectJSON?.profile?.tableLimit || 1000;
    let tmp_table_count=0;

    const map = get().project.projectJSON?.modules?.map((module: any) => {
      const moduleNode = {
        key: module.name,
        title: module.chnname || module.name,
        type: 'module',
        module: module.name,
        chnname: module.chnname,  // 确保模型节点包含 chnname
        children: [] as any[],
      };

      if (groupByType) {
        const tablesNode = {
          key: `${module.name}-tables`,
          title: '表',
          type: 'folder',
          children: [],
        };

        const relationsNode = {
          key: `${module.name}-relations`,
          title: '关系',
          type: 'folder',
          children: [],
        };

        // 添加防护措施，确保 module.entities 存在
        if (Array.isArray(module.entities)) {
          module.entities.forEach((entity: any) => {
            if (tmp_table_count >= tableLimit) {
              return;
            }
            if (searchKey && searchKey.length > 0) {
              const flag = (entity.name || entity.title).search(_.escapeRegExp(searchKey)) >= 0;
              if (flag) {
                const entityNode = {
                  key: `${module.name}-${entity.name || entity.title}`,
                  title: entity.name || entity.title,
                  chnname: entity.chnname,  // 确保实体节点包含 chnname
                  type: 'entity',
                  module: module.name,
                  fields: entity.fields,
                  isLeaf: true,
                };
                tablesNode.children.push(entityNode);
                tempExpandedKeys.push(`module${module.name}`);
                tmp_table_count = tmp_table_count + 1;
              }
            } else {
              const entityNode = {
                key: `${module.name}-${entity.name || entity.title}`,
                title: entity.name || entity.title,
                chnname: entity.chnname,  // 确保实体节点包含 chnname
                type: 'entity',
                module: module.name,
                fields: entity.fields,
                isLeaf: true,
              };
              tablesNode.children.push(entityNode);
              tmp_table_count = tmp_table_count + 1;
            }
          });
        }

        // ADR-0017：关系文件夹列「图列表」，不再逐边堆叶子（边归画布）
        const diagrams = listDiagrams(module);
        diagrams.forEach((d, idx) => {
          relationsNode.children.push({
            key: `${module.name}###relation###${d.id}`,
            title: d.name || DEFAULT_DIAGRAM_NAME,
            formatName: d.name || DEFAULT_DIAGRAM_NAME,
            type: 'relation',
            module: module.name,
            diagramId: d.id,
            isLeaf: true,
            // 主图保留稳定 testId，兼容既有 E2E
            testId: idx === 0 || d.id === DEFAULT_DIAGRAM_ID ? 'tree-open-relation' : undefined,
          });
        });

        // 无论是否有表或关系，都添加这两个文件夹
        moduleNode.children.push(tablesNode);
        moduleNode.children.push(relationsNode);
      } else {
        const match_entities: any = [];

        const relation = {
          type: 'relation',
          module: module.name,
          title: DEFAULT_DIAGRAM_NAME,
          formatName: DEFAULT_DIAGRAM_NAME,
          key: `${module.name}###relation###${DEFAULT_DIAGRAM_ID}`,
          diagramId: DEFAULT_DIAGRAM_ID,
          isLeaf: true,
          testId: 'tree-open-relation',
        };

        // 添加防护措，确保 module.entities 存在
        if (Array.isArray(module.entities)) {
          module.entities.some((f: any) => {
            if(tmp_table_count>=tableLimit){
              return true;
            }
            if (searchKey && searchKey.length > 0) {
              const flag = (f.name || f.title).search(_.escapeRegExp(searchKey)) >= 0;
              if (flag) {
                match_entities.push(f);
                tempExpandedKeys.push(`module${module.name}`);
                tmp_table_count = tmp_table_count + 1;
              }
            } else {
              match_entities.push(f);
              tmp_table_count = tmp_table_count + 1;
            }
            return false;
          });
        }

        const entities = match_entities.map((entity: any) => {
          const tableNameFormat = get().project?.projectJSON?.profile?.tableNameFormat || '{name} {chnname}';
          return {
            type: 'entity',
            module: module.name,
            length: entity?.fields?.length,
            title: entity.name || entity.title,
            chnname: entity.chnname,  // 确保实体节点包含 chnname
            formatName: tableNameFormat.render(entity),
            key: `entity${entity.name || entity.title}`,
            isLeaf: true
          }
        });
        moduleNode.children = [relation, ...entities];
      }

      return moduleNode;
    });

    return map;
  },
  getModuleEntityFieldTree: () => set(produce(state => {
    return state.project?.projectJSON?.modules?.map((module: any) => {
      const diagrams = listDiagrams(module);
      const relations = diagrams.map((d, idx) => ({
        type: 'relation',
        title: d.name || DEFAULT_DIAGRAM_NAME,
        key: `${module.name}###relation###${d.id}`,
        diagramId: d.id,
        isLeaf: true,
        testId: idx === 0 || d.id === DEFAULT_DIAGRAM_ID ? 'tree-open-relation' : undefined,
      }));
      const entities = module?.entities?.map((entity: any) => {
        return {type: 'entity', title: entity.name || entity.title, key: entity.name || entity.title, isLeaf: true}
      });
      return {
        type: 'module',
        title: module.name,
        key: module.name,
        children: _.concat(relations, entities)
      }
    });
  })),
  ...EntitiesSlice(set, get),
});


export default ModulesSlice;
