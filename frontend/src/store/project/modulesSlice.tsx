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
import { normalizeRelation } from "@/utils/relationEdges";


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
  addModule: (payload: any) => void;
  renameModule: (payload: any) => void;
  removeModule: () => void;
  updateModule: (payload: any) => void;
  copyModule: (payload: any) => void;
  cutModule: (payload: any) => void;
  pastModule: () => void;
  updateRelation: (payload: any) => void;
  /** 写当前图布局（ADR-0017：只写 diagrams；diagramId 缺省=main） */
  updateGraphCanvasLayout: (moduleName: string, layoutNodes: any[], diagramId?: string) => void;
  createDiagram: (moduleName: string, name?: string) => string | undefined;
  renameDiagram: (moduleName: string, diagramId: string, name: string) => void;
  removeDiagram: (moduleName: string, diagramId: string) => void;
  /** ADR-0017 Phase 2b：图内 Frame */
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
  ) => string | undefined;
  addFrameMembers: (
    moduleName: string,
    diagramId: string | undefined,
    frameId: string,
    memberEntityIds: string[],
  ) => void;
  removeFrameMembers: (
    moduleName: string,
    diagramId: string | undefined,
    frameId: string,
    memberEntityIds: string[],
  ) => void;
  updateFrameBounds: (
    moduleName: string,
    diagramId: string | undefined,
    frames: Array<{ id: string; x: number; y: number; w?: number; h?: number }>,
  ) => void;
  removeFrame: (moduleName: string, diagramId: string | undefined, frameId: string) => void;
  renameFrame: (
    moduleName: string,
    diagramId: string | undefined,
    frameId: string,
    name: string,
  ) => void;
  addAssociation: (moduleName: string, association: any) => void;
  removeAssociation: (moduleName: string, association: any) => void;
  /** 改关联基数（from/to 定位；relation 归一化后写入） */
  updateAssociationRelation: (
    moduleName: string,
    association: { from: { entity: string; field: string }; to: { entity: string; field: string } },
    relation: string,
  ) => void;
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
  addModule: (payload: any) => set(produce(state => {
    const moduleName = payload.name;
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
        entities: [],  // 确保新模型有一个空的 entities 数组
      });
      message.success('模型添加成功');
    } else {
      message.error(`模型${moduleName}已经存在`);
    }
  })),
  renameModule: (payload: any) => set(produce(state => {
    const moduleName = payload.name;
    const {currentModuleIndex} = state;
    const findIndex = state.project.projectJSON?.modules?.findIndex((m: any) => m.name === moduleName);
    if (findIndex === -1) {
      state.project.projectJSON.modules[currentModuleIndex].name = payload.name;
      state.project.projectJSON.modules[currentModuleIndex].chnname = payload.chnname;
      message.success('修改成功');
    } else {
      message.error(`模型${moduleName}已经存在`);
    }
  })),
  removeModule: () => set(produce(state => {
    const {currentModuleIndex} = state;
    state.project.projectJSON.modules =
      state.project.projectJSON.modules?.filter((e: any, index: number) => index !== currentModuleIndex) || [];
  })),
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
  cutModule: (payload: any) => set(produce(state => {
    const moduleName = payload.name || payload.title;
    if (!moduleName) {
      message.error('无效的模型数据');
      return;
    }
    const moduleIndex = state.project.projectJSON?.modules?.findIndex((m: any) => m.name === moduleName);
    if (moduleIndex !== -1) {
      const currentModule = state.project.projectJSON.modules[moduleIndex];
      const moduleToCut = {
        ...currentModule,
        chnname: payload.chnname || currentModule.chnname,
        _isCut: true
      };
      cache.setItem(ERD_MODULE_CLIPBOARD, JSON.stringify(moduleToCut));
      state.project.projectJSON.modules.splice(moduleIndex, 1);
      message.success(`模型 "${moduleName}" 已成功剪切到剪贴板`);
    } else {
      message.error(`未找到名为 "${moduleName}" 的模型`);
    }
  })),
  pastModule: () => set(produce(state => {
    let data;
    try {
      data = JSON.parse(cache.getItem(ERD_MODULE_CLIPBOARD) || 'null');
    } catch (error) {
      console.error('解析剪贴板数据时出错:', error);
      data = null;
    }

    if (!data || !validateModule(data)) {
      message.error('剪贴板中没有有效的模型数据');
      return;
    }

    delete data._isCut;

    const modules = state.project.projectJSON.modules;
    const { name: moduleName, counter } = nextCopyName(data.name, (n) =>
      modules.some((m: any) => m.name === n),
    );

    const newModule = {
      ...data,
      name: moduleName,
      chnname: counter === 0 ? data.chnname : `${data.chnname || data.name}${counter === 1 ? '副本' : `副本${counter}`}`,
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
          chnname: entityCounter === 0 ? entity.chnname : `${entity.chnname || entity.title || entity.name}${entityCounter === 1 ? '副本' : `副本${entityCounter}`}`
        };
      })
    };

    state.project.projectJSON.modules.push(newModule);
    message.success(`模型 "${moduleName}" 已成功粘贴`);
  })),
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
  createDiagram: (moduleName: string, name?: string) => {
    let createdId: string | undefined;
    snapshotModules(get().project?.projectJSON?.modules);
    set(produce(state => {
      const module = state.project.projectJSON?.modules?.find((m: any) => m?.name === moduleName);
      if (!module) {
        return;
      }
      const diagrams = ensureDiagrams(module);
      const id = newDiagramId();
      const base = (name || '关系图').trim() || '关系图';
      let display = base;
      let n = 2;
      while (diagrams.some((d) => d.name === display)) {
        display = `${base}${n}`;
        n += 1;
      }
      diagrams.push({ id, name: display, layout: { nodes: [] } });
      createdId = id;
    }));
    if (createdId) {
      message.success('已新建关系图');
    }
    return createdId;
  },
  renameDiagram: (moduleName: string, diagramId: string, name: string) => {
    const next = (name || '').trim();
    if (!next) {
      message.warning('图名称不能为空');
      return;
    }
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
      d.name = next;
    }));
  },
  removeDiagram: (moduleName: string, diagramId: string) => {
    if (diagramId === DEFAULT_DIAGRAM_ID) {
      message.warning('主关系图不可删除');
      return;
    }
    snapshotModules(get().project?.projectJSON?.modules);
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
    }));
  },
  createFrame: (moduleName, diagramId, opts) => {
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
      const frame = addFrameToDiagram(diagram, opts || {});
      createdId = frame.id;
    }));
    if (createdId) {
      message.success('已新建分组');
    }
    return createdId;
  },
  addFrameMembers: (moduleName, diagramId, frameId, memberEntityIds) => {
    if (!memberEntityIds.length) {
      message.info('请先选中要加入分组的表');
      return;
    }
    snapshotModules(get().project?.projectJSON?.modules);
    let frameName: string | undefined;
    set(produce(state => {
      const module = state.project.projectJSON?.modules?.find((m: any) => m?.name === moduleName);
      if (!module) {
        return;
      }
      const diagrams = ensureDiagrams(module);
      const id = diagramId || DEFAULT_DIAGRAM_ID;
      const diagram = diagrams.find((d) => d.id === id) || diagrams[0];
      const frame = addMembersToFrame(diagram, frameId, memberEntityIds);
      if (!frame) {
        return;
      }
      frameName = frame.name;
    }));
    if (frameName) {
      message.success(`已加入「${frameName}」`);
    } else {
      message.warning('未找到分组');
    }
  },
  removeFrameMembers: (moduleName, diagramId, frameId, memberEntityIds) => {
    if (!memberEntityIds.length) return;
    snapshotModules(get().project?.projectJSON?.modules);
    let frameName: string | undefined;
    set(produce(state => {
      const module = state.project.projectJSON?.modules?.find((m: any) => m?.name === moduleName);
      if (!module) {
        return;
      }
      const diagrams = ensureDiagrams(module);
      const id = diagramId || DEFAULT_DIAGRAM_ID;
      const diagram = diagrams.find((d) => d.id === id) || diagrams[0];
      const frame = removeMembersFromFrame(diagram, frameId, memberEntityIds);
      if (frame) {
        frameName = frame.name;
      }
    }));
    if (frameName) {
      message.info(`已移出「${frameName}」`);
    }
  },
  updateFrameBounds: (moduleName, diagramId, frames) => {
    if (!frames.length) return;
    snapshotModules(get().project?.projectJSON?.modules);
    set(produce(state => {
      const module = state.project.projectJSON?.modules?.find((m: any) => m?.name === moduleName);
      if (!module) {
        return;
      }
      const diagrams = ensureDiagrams(module);
      const id = diagramId || DEFAULT_DIAGRAM_ID;
      const diagram = diagrams.find((d) => d.id === id) || diagrams[0];
      frames.forEach((f) => applyFrameBounds(diagram, f.id, f));
    }));
  },
  removeFrame: (moduleName, diagramId, frameId) => {
    snapshotModules(get().project?.projectJSON?.modules);
    set(produce(state => {
      const module = state.project.projectJSON?.modules?.find((m: any) => m?.name === moduleName);
      if (!module) {
        return;
      }
      const diagrams = ensureDiagrams(module);
      const id = diagramId || DEFAULT_DIAGRAM_ID;
      const diagram = diagrams.find((d) => d.id === id) || diagrams[0];
      removeFrameFromDiagram(diagram, frameId);
    }));
    message.success('已删除分组');
  },
  renameFrame: (moduleName, diagramId, frameId, name) => {
    const next = (name || '').trim();
    if (!next) {
      message.warning('分组名称不能为空');
      return;
    }
    snapshotModules(get().project?.projectJSON?.modules);
    set(produce(state => {
      const module = state.project.projectJSON?.modules?.find((m: any) => m?.name === moduleName);
      if (!module) {
        return;
      }
      const diagrams = ensureDiagrams(module);
      const id = diagramId || DEFAULT_DIAGRAM_ID;
      const diagram = diagrams.find((d) => d.id === id) || diagrams[0];
      renameFrameInDiagram(diagram, frameId, next);
    }));
  },
  // 追加关联（按 from/to 去重）；重复时 toast，禁止静默失败
  addAssociation: (moduleName: string, association: any) => {
    const modules = get().project?.projectJSON?.modules;
    const module = modules?.find((m: any) => m?.name === moduleName);
    if (!module) {
      message.warning('未找到当前模块，无法建立关联');
      return;
    }
    const exists = (module.associations || []).some((a: any) =>
      a?.from?.entity === association.from?.entity && a?.from?.field === association.from?.field &&
      a?.to?.entity === association.to?.entity && a?.to?.field === association.to?.field);
    if (exists) {
      message.warning('该字段关联已存在，无需重复连线');
      return;
    }
    snapshotModules(modules);
    set(produce(state => {
      const m = state.project.projectJSON?.modules?.find((x: any) => x?.name === moduleName);
      if (!m) {
        return;
      }
      const relation = normalizeRelation(association.relation) || association.relation || 'n:1';
      m.associations = [...(m.associations || []), { ...association, relation }];
    }));
  },
  // 删除关联（画布删边）
  removeAssociation: (moduleName: string, association: any) => {
    snapshotModules(get().project?.projectJSON?.modules);
    set(produce(state => {
      const module = state.project.projectJSON?.modules?.find((m: any) => m?.name === moduleName);
      if (!module) {
        return;
      }
      module.associations = (module.associations || []).filter((a: any) => !(
        a?.from?.entity === association.from?.entity && a?.from?.field === association.from?.field &&
        a?.to?.entity === association.to?.entity && a?.to?.field === association.to?.field));
    }));
  },
  updateAssociationRelation: (moduleName, association, relation) => {
    const next = normalizeRelation(relation);
    if (!next) {
      message.warning('基数不能为空');
      return;
    }
    snapshotModules(get().project?.projectJSON?.modules);
    let found = false;
    set(produce(state => {
      const module = state.project.projectJSON?.modules?.find((m: any) => m?.name === moduleName);
      if (!module) {
        return;
      }
      const list = module.associations || [];
      for (const a of list) {
        if (
          a?.from?.entity === association.from?.entity &&
          a?.from?.field === association.from?.field &&
          a?.to?.entity === association.to?.entity &&
          a?.to?.field === association.to?.field
        ) {
          a.relation = next;
          found = true;
          break;
        }
      }
    }));
    if (!found) {
      message.warning('未找到该关联');
    }
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
