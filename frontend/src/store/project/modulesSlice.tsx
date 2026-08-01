import {GetState, SetState} from "zustand";
import {ProjectState} from "@/store/project/useProjectStore";
import produce from "immer";
import EntitiesSlice from "@/store/project/entitiesSlice";
import {message} from "antd";
import _ from 'lodash';
import * as cache from '../../utils/cache';
import {redoModules, snapshotModules, undoModules} from "@/store/project/canvasHistory";


export type IModulesSlice = {
  expandedKeys?: string[];
  currentModule?: string;
  currentModuleIndex?: number;
}

const validateModule = (data: any) => {
  return data && typeof data.name === 'string' && Array.isArray(data.entities);
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
  updateGraphCanvasLayout: (moduleName: string, layoutNodes: any[]) => void;
  addAssociation: (moduleName: string, association: any) => void;
  removeAssociation: (moduleName: string, association: any) => void;
  undoCanvas: () => void;
  redoCanvas: () => void;
  setCurrentModule: (payload: any) => any,
  updateAllModules: (payload: any) => void,
  getModuleEntityTree: (searchKey: string, groupByType: boolean) => any,
  getModuleEntityFieldTree: () => any,
  setExpandedKey: (expandedKey: string) => any,
  setExpandedKeys: (expandedKey: any) => any,
  getExpandedKeys: (expandedKey: any) => any,
};

const ERD_MODULE_CLIPBOARD = 'erd_module_clipboard';

const ModulesSlice = (set: SetState<ProjectState>, get: GetState<ProjectState>) => ({
  expandedKeys: [],
  currentModule: '',
  currentModuleIndex: -1,
  addModule: (payload: any) => set(produce(state => {
    const moduleName = payload.name;
    const findIndex = state.project.projectJSON?.modules?.findIndex((m: any) => m.name === moduleName);
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
    console.log(42, currentModuleIndex);
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

    let moduleName = data.name;
    let counter = 0;
    
    const isCut = data._isCut;
    delete data._isCut;

    // 查找可用的模块名
    while (state.project.projectJSON.modules.some((m: any) => m.name === moduleName)) {
      counter++;
      moduleName = `${data.name}${counter === 1 ? '副本' : `副本${counter}`}`;
    }

    const newModule = {
      ...data,
      name: moduleName,
      chnname: counter === 0 ? data.chnname : `${data.chnname || data.name}${counter === 1 ? '副本' : `副本${counter}`}`,
      entities: (data.entities || []).map((entity: any) => {
        let entityName = entity.title || entity.name;
        let entityCounter = 0;
        // 检查整个项目中是否存在相同名称的实体
        while (state.project.projectJSON.modules.some((m: any) => 
          m.entities.some((e: any) => (e.title || e.name) === entityName)
        )) {
          entityCounter++;
          entityName = `${entity.title || entity.name}${entityCounter === 1 ? '副本' : `副本${entityCounter}`}`;
        }
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
  // 按模块名 upsert 画布布局（graphCanvas 只存坐标，实体以 entities 为准——ADR-0001 补充决策）。
  // 不用 currentModuleIndex：关系图 tab 的模块与当前选中模块可能不同（A 模块画布开着、B 模块被选中）。
  updateGraphCanvasLayout: (moduleName: string, layoutNodes: any[]) => {
    snapshotModules(get().project?.projectJSON?.modules);
    set(produce(state => {
      const module = state.project.projectJSON?.modules?.find((m: any) => m?.name === moduleName);
      if (!module) {
        return;
      }
      if (!module.graphCanvas) {
        module.graphCanvas = { nodes: [], edges: [] };
      }
      const layout = (module.graphCanvas.nodes || []) as any[];
      layoutNodes.forEach(n => {
        const idx = layout.findIndex((s: any) => (s.title || '').split(':')[0] === n.id || s.id === n.id);
        const entry = { id: n.id, title: n.id, x: Math.round(n.position.x), y: Math.round(n.position.y) };
        if (idx >= 0) {
          layout[idx] = { ...layout[idx], ...entry };
        } else {
          layout.push(entry);
        }
      });
      module.graphCanvas.nodes = layout;
    }));
  },
  // 追加关联（按 from/to 去重）；按模块名定位，理由同 updateGraphCanvasLayout
  addAssociation: (moduleName: string, association: any) => {
    const modules = get().project?.projectJSON?.modules;
    const module = modules?.find((m: any) => m?.name === moduleName);
    if (!module) {
      return;
    }
    const exists = (module.associations || []).some((a: any) =>
      a?.from?.entity === association.from?.entity && a?.from?.field === association.from?.field &&
      a?.to?.entity === association.to?.entity && a?.to?.field === association.to?.field);
    if (exists) {
      return;
    }
    snapshotModules(modules);
    set(produce(state => {
      const m = state.project.projectJSON?.modules?.find((x: any) => x?.name === moduleName);
      if (!m) {
        return;
      }
      m.associations = [...(m.associations || []), association];
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
    console.log(73, 'modules', modules);
    if (modules) {
      state.project.projectJSON.modules = modules;
    }
  })),
  getModuleEntityTree: (searchKey: string, groupByType: boolean) => {
    const tempExpandedKeys: any = [];
    console.log(70, get().project);
    const tableLimit = get().project?.projectJSON?.profile?.tableLimit || 1000;
    let tmp_table_count=0;

    let map = get().project.projectJSON?.modules?.map((module: any) => {
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

        // 关系图入口始终置顶：画布是核心功能，文件夹模式下也必须可达
        // （修复：此前仅 groupByType=false 的扁平模式才有此叶子，而界面恒用文件夹模式，关系图无任何入口）
        relationsNode.children.unshift({
          key: `${module.name}###relation`,
          title: '关系图',
          formatName: '关系图',
          type: 'relation',
          module: module.name,
          isLeaf: true,
        });

        if (module.graphCanvas && module.graphCanvas.edges) {
          module.graphCanvas.edges.forEach((edge: any) => {
            const relationNode = {
              key: `${module.name}-relation-${edge.source}-${edge.target}`,
              title: `${edge.source} - ${edge.target}`,
              type: 'relation',
              module: module.name,
              isLeaf: true,
            };
            relationsNode.children.push(relationNode);
          });
        }

        // 无论是否有表或关系，都添加这两个文件夹
        moduleNode.children.push(tablesNode);
        moduleNode.children.push(relationsNode);
      } else {
        const match_entities: any = [];

        let relation = {
          type: 'relation',
          module: module.name,
          title: '关系图',
          formatName: '关系图',
          key: `${module.name}###relation`,
          isLeaf: true
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

        let entities = match_entities.map((entity: any) => {
          const tableNameFormat = get().project?.projectJSON?.profile?.tableNameFormat || '{name} {chnname}';
          console.log(102, tableNameFormat?.render(entity))
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
        const moduleNameFormat = get().project?.projectJSON?.profile?.moduleNameFormat || '{name} {chnname}';
        moduleNode.children = [relation, ...entities];
      }

      return moduleNode;
    });

    console.log(82, 'getModuleEntityTree', map);
    return map;
  },
  getModuleEntityFieldTree: () => set(produce(state => {
    return state.project?.projectJSON?.modules?.map((module: any) => {
      let relation = {type: 'relation', title: '关系图', key: `${module.name}###relation`, isLeaf: true};
      let entities = module?.entities?.map((entity: any) => {
        return {type: 'entity', title: entity.name || entity.title, key: entity.name || entity.title, isLeaf: true}
      });
      return {
        type: 'module',
        title: module.name,
        key: module.name,
        children: _.concat(relation, entities)
      }
    });
  })),
  setExpandedKey: (expandedKey: string) => set(produce(state => {
    console.log(129, get());
    // state.expandedKeys?.push(expandedKey);
  })),
  setExpandedKeys: (expandedKeys: any) => set(produce(state => {
    state.expandedKeys = expandedKeys;
  })),
  getExpandedKeys: (searchKey: string) => {
    const tempExpandedKeys: any = [];
    console.log(70, get().project)
    get().project.projectJSON?.modules?.forEach((module: any) => {
      module?.entities?.filter((f: any) => {
        if (searchKey && searchKey.length > 0) {
          const flag = (f.name || f.title).search(_.escapeRegExp(searchKey)) >= 0;
          if (flag) {
            tempExpandedKeys.push(`module${module.name}`);
          }
          return flag
        } else {
          return true;
        }
      })
    });
    console.log(155, 'tempExpandedKeys', tempExpandedKeys);
    return tempExpandedKeys;
  },
  ...EntitiesSlice(set, get),
});


export default ModulesSlice;
