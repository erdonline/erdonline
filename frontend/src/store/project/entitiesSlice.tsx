import type { GetState, SetState } from 'zustand';
import type { ProjectState } from '@/store/project/useProjectStore';
import produce from 'immer';
import { message } from 'antd';
import useShortcutStore, { PANEL } from '@/store/shortcut/useShortcutStore';
import * as cache from '@/utils/cache';
import { snapshotModules } from '@/store/project/canvasHistory';
import {
  ackManualPersist,
  persistProjectNow,
} from '@/store/project/projectAutosave';
import type { PersistOpt } from '@/store/project/persistOpt';

export type IEntitiesSlice = {
  currentEntity?: string;
  currentEntityIndex?: number;
}

const validateEntity = (data: any) => {
  return data && (data.title || data.name) && Array.isArray(data.fields);
};

const generateUniqueId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export interface IEntitiesDispatchSlice {
  addEntity: (payload: any, opts?: PersistOpt) => void | Promise<boolean>;
  renameEntity: (
    payload: {
      oldModuleName: string;
      newModuleName: string;
      oldTitle: string;
      newTitle: string;
      newChnname: string;
    },
    opts?: PersistOpt,
  ) => void | Promise<boolean>;
  removeEntity: (moduleName: string, entityTitle: string) => void;
  removeIndex: (moduleName: string, entityTitle: string, index: number) => void;
  updateEntity: (moduleName: string, entityTitle: string, payload: any) => void;
  copyEntity: (moduleName: string, entityTitle: string) => void;
  cutEntity: (moduleName: string, entityTitle: string) => void;
  pastEntity: (moduleName: string) => void;
  updateEntityFields: (moduleName: string, entityTitle: string, payload: any) => void;
  updateEntityIndex: (moduleName: string, entityTitle: string, payload: any) => void;
  moveField: (moduleName: string, entityTitle: string, payload: any, startRow: number, endRow: number) => void;
  setCurrentEntity: (moduleName: string, entityName: string) => void;
  setCurrentModuleAndEntity: (moduleName: string, entityName: string) => void;
}

const ERD_ENTITY_CLIPBOARD = 'erd_entity_clipboard';

const shortcutState = useShortcutStore.getState();

let lastMessageTime = 0;
const MESSAGE_INTERVAL = 1000; // 消息显示的最小间隔时间（毫秒）
const messageQueue: { type: 'success' | 'error', content: string }[] = [];
let lastMessage: { type: 'success' | 'error', content: string } | null = null;
let messageTimeout: NodeJS.Timeout | null = null;

const showMessage = (type: 'success' | 'error', content: string) => {
  const now = Date.now();
  
  // 检查新消息是否与上一条消息相同
  if (lastMessage && lastMessage.type === type && lastMessage.content === content) {
    return; // 如果相同，直接返回，不添加到队列
  }

  // 更新最后一条消息
  lastMessage = { type, content };

  // 将新消息添加到队列
  messageQueue.push({ type, content });

  // 如果没有正在进行的消息显示计时器，启动一个新的
  if (!messageTimeout) {
    const processQueue = () => {
      if (messageQueue.length > 0) {
        const { type: msgType, content: msgContent } = messageQueue[0];
        if (msgType === 'success') {
          message.success(msgContent);
        } else {
          message.error(msgContent);
        }
        lastMessageTime = Date.now();
        
        // 移除已显示的消息
        messageQueue.shift();

        // 如果队列中还有消息，设置下一次显示
        if (messageQueue.length > 0) {
          messageTimeout = setTimeout(processQueue, MESSAGE_INTERVAL);
        } else {
          messageTimeout = null;
        }
      }
    };

    // 如果距离上次显示消息的时间小于间隔，延迟显示
    if (now - lastMessageTime < MESSAGE_INTERVAL) {
      messageTimeout = setTimeout(processQueue, MESSAGE_INTERVAL - (now - lastMessageTime));
    } else {
      processQueue();
    }
  }
};

const EntitiesSlice = (set: SetState<ProjectState>, get: GetState<ProjectState>) => ({
  currentEntity: '',
  currentEntityIndex: -1,
  addEntity: (payload: any, opts?: PersistOpt) => {
    const persist = !!opts?.persist;
    const { moduleName, ...entityData } = payload;
    const modules = get().project?.projectJSON?.modules || [];
    const moduleIndex = modules.findIndex((m: any) => m.name === moduleName);
    
    if (moduleIndex === -1) {
      showMessage('error', `模型 "${moduleName}" 不存在`);
      return persist ? Promise.resolve(false) : undefined;
    }

    if (!entityData.name && !entityData.title) {
      showMessage('error', '表名称不能为空');
      return persist ? Promise.resolve(false) : undefined;
    }

    const entityName = entityData.name || entityData.title;
    
    // 检查实体名称是否在整个项目中唯一
    const isEntityNameUnique = modules.every((module: any) => 
      (module.entities || []).every((entity: any) => entity.name !== entityName && entity.title !== entityName)
    );

    if (!isEntityNameUnique) {
      showMessage('error', `表名 "${entityName}" 已存在于项目中`);
      return persist ? Promise.resolve(false) : undefined;
    }

    // 未传字段或空数组时用项目默认字段（含主键），避免「建表即空壳」再多走一步
    const defaultFields = (get().dispatch.getDefaultFields?.() || []).filter((f: any) => f != null);
    const fields =
      Array.isArray(entityData.fields) && entityData.fields.length > 0
        ? entityData.fields
        : defaultFields;
    const indexs = Array.isArray(entityData.indexs) ? entityData.indexs : [];

    const newEntity = {
      ...entityData,
      name: entityName,
      title: entityName,
      fields: JSON.parse(JSON.stringify(fields)),
      indexs: JSON.parse(JSON.stringify(indexs)),
    };

    const applyLocal = () => {
      snapshotModules(modules);
      set(produce((state: any) => {
        const idx = state.project.projectJSON.modules.findIndex((m: any) => m.name === moduleName);
        if (!state.project.projectJSON.modules[idx].entities) {
          state.project.projectJSON.modules[idx].entities = [];
        }
        state.project.projectJSON.modules[idx].entities.push(newEntity);
        state.currentModule = moduleName;
        state.currentModuleIndex = idx;
        state.currentEntity = entityName;
        state.currentEntityIndex = state.project.projectJSON.modules[idx].entities.length - 1;
        if (!persist) {
          showMessage('success', '表添加成功');
        }
      }));
    };

    if (!persist) {
      applyLocal();
      return;
    }

    const project = get().project;
    const next = produce(project, (draft: any) => {
      const idx = draft.projectJSON.modules.findIndex((m: any) => m.name === moduleName);
      if (!draft.projectJSON.modules[idx].entities) {
        draft.projectJSON.modules[idx].entities = [];
      }
      draft.projectJSON.modules[idx].entities.push(JSON.parse(JSON.stringify(newEntity)));
    });

    return (async () => {
      const saved = await persistProjectNow(next, '表保存失败');
      if (!saved) {
        return false;
      }
      applyLocal();
      ackManualPersist(true);
      showMessage('success', '表添加成功');
      return true;
    })();
  },
  renameEntity: (
    payload: {
      oldModuleName: string;
      newModuleName: string;
      oldTitle: string;
      newTitle: string;
      newChnname: string;
    },
    opts?: PersistOpt,
  ) => {
    const persist = !!opts?.persist;
    const { oldModuleName, newModuleName, oldTitle, newTitle, newChnname } = payload;
    const modules = get().project?.projectJSON?.modules || [];
    // 检查新的表名是否在整个项目中唯一
    const isNewNameUnique = modules.every((module: any) =>
      (module.entities || []).every((entity: any) => (entity.title !== newTitle && entity.name !== newTitle) || entity.title === oldTitle)
    );

    if (!isNewNameUnique) {
      showMessage('error', `表名 "${newTitle}" 已存在于项目中`);
      return persist ? Promise.resolve(false) : undefined;
    }

    const oldModuleIndex = modules.findIndex((m: any) => m.name === oldModuleName);
    if (oldModuleIndex === -1) {
      showMessage('error', `原模型 "${oldModuleName}" 不存在`);
      return persist ? Promise.resolve(false) : undefined;
    }

    const entityIndex = modules[oldModuleIndex].entities.findIndex((e: any) => e.title === oldTitle || e.name === oldTitle);
    if (entityIndex === -1) {
      showMessage('error', `表 "${oldTitle}" 不存在于模型 "${oldModuleName}" 中`);
      return persist ? Promise.resolve(false) : undefined;
    }

    const applyRename = (state: any) => {
      const entity = state.project.projectJSON.modules[oldModuleIndex].entities[entityIndex];
    
      // 更新实体信息
      entity.title = newTitle;
      entity.name = newTitle;
      entity.chnname = newChnname;

      // 同步关联与布局中的实体名（画布节点 id = 表名）
      const mod = state.project.projectJSON.modules[oldModuleIndex];
      mod.associations = (mod.associations || []).map((assoc: any) => {
        const from =
          assoc?.from?.entity === oldTitle
            ? { ...assoc.from, entity: newTitle }
            : assoc?.from;
        const to =
          assoc?.to?.entity === oldTitle
            ? { ...assoc.to, entity: newTitle }
            : assoc?.to;
        return { ...assoc, from, to };
      });
      // ADR-0017：布局在 diagrams；同步遗留 graphCanvas（只读兼容，不双写新坐标）
      const renameLayoutNode = (node: any) => {
        if (node.id === oldTitle || (node.title || '').split(':')[0] === oldTitle) {
          return { ...node, id: newTitle, title: newTitle };
        }
        return node;
      };
      if (Array.isArray(mod.diagrams)) {
        mod.diagrams = mod.diagrams.map((d: any) => ({
          ...d,
          layout: {
            ...(d.layout || {}),
            nodes: (d.layout?.nodes || []).map(renameLayoutNode),
          },
          includeEntities: Array.isArray(d.includeEntities)
            ? d.includeEntities.map((t: string) => (t === oldTitle ? newTitle : t))
            : d.includeEntities,
          groups: Array.isArray(d.groups)
            ? d.groups.map((g: any) => ({
                ...g,
                memberEntityIds: (g.memberEntityIds || []).map((t: string) =>
                  t === oldTitle ? newTitle : t,
                ),
              }))
            : d.groups,
        }));
      }
      if (mod.graphCanvas?.nodes) {
        mod.graphCanvas.nodes = mod.graphCanvas.nodes.map(renameLayoutNode);
      }

      if (oldModuleName !== newModuleName) {
        // 如果模型名称发生变化，我们需要移动实体
        const newModuleIndex = state.project.projectJSON.modules.findIndex((m: any) => m.name === newModuleName);
        if (newModuleIndex === -1) {
          // 如果新模型不存在，我们创建它
          state.project.projectJSON.modules.push({
            name: newModuleName,
            chnname: newModuleName,
            entities: []
          });
          // 重新获取新模型的索引
          const createdModuleIndex = state.project.projectJSON.modules.length - 1;
          // 从旧模型中移除实体
          state.project.projectJSON.modules[oldModuleIndex].entities.splice(entityIndex, 1);
          // 添加到新模型
          state.project.projectJSON.modules[createdModuleIndex].entities.push(entity);
        } else {
          // 从旧模型中移除实体
          state.project.projectJSON.modules[oldModuleIndex].entities.splice(entityIndex, 1);
          // 添加到新模型
          state.project.projectJSON.modules[newModuleIndex].entities.push(entity);
        }
      }

      // 画布内联改名不弹 toast（UI 即反馈）；跨模块移动等场景仍提示
      if (oldModuleName !== newModuleName && !persist) {
        showMessage('success', `表 "${oldTitle}" 已成功重命名为 "${newTitle}"`);
      }
    };

    if (!persist) {
      snapshotModules(modules);
      set(produce((state: any) => {
        applyRename(state);
      }));
      return;
    }

    const project = get().project;
    const next = produce(project, (draft: any) => {
      applyRename(draft);
    });

    return (async () => {
      const saved = await persistProjectNow(next, '表保存失败');
      if (!saved) {
        return false;
      }
      snapshotModules(modules);
      set(produce((state: any) => {
        state.project.projectJSON = next.projectJSON;
      }));
      ackManualPersist(true);
      if (oldModuleName !== newModuleName) {
        showMessage('success', `表 "${oldTitle}" 已成功重命名为 "${newTitle}"`);
      }
      return true;
    })();
  },
  removeEntity: (moduleName: string, entityTitle: string) => set(produce((state: any) => {
    const moduleIndex = state.project.projectJSON.modules.findIndex((m: any) => m.name === moduleName);
    if (moduleIndex === -1) {
      showMessage('error', `型 "${moduleName}" 不存在`);
      return;
    }
    const mod = state.project.projectJSON.modules[moduleIndex];
    mod.entities = mod.entities.filter((e: any) => e.title !== entityTitle);
    // ADR-0017：从各图 Frame 成员中剔除
    if (Array.isArray(mod.diagrams)) {
      mod.diagrams.forEach((d: any) => {
        if (!Array.isArray(d.groups)) return;
        d.groups.forEach((g: any) => {
          g.memberEntityIds = (g.memberEntityIds || []).filter((t: string) => t !== entityTitle);
        });
      });
    }
    showMessage('success', '表删除成功');
  })),
  removeIndex: (moduleName: string, entityTitle: string, index: number) => set(produce((state: any) => {
    const moduleIndex = state.project.projectJSON.modules.findIndex((m: any) => m.name === moduleName);
    if (moduleIndex === -1) {
      showMessage('error', `模型 "${moduleName}" 不存在`);
      return;
    }
    const entityIndex = state.project.projectJSON.modules[moduleIndex].entities.findIndex((e: any) => e.title === entityTitle);
    if (entityIndex === -1) {
      showMessage('error', `表 "${entityTitle}" 不存在`);
      return;
    }
    state.project.projectJSON.modules[moduleIndex].entities[entityIndex].indexs =
      state.project.projectJSON.modules[moduleIndex].entities[entityIndex].indexs.filter((_: any, i: number) => i !== index);
    showMessage('success', '索引删除成功');
  })),
  updateEntity: (moduleName: string, entityTitle: string, payload: any) => set(produce((state: any) => {
    const moduleIndex = state.project.projectJSON.modules.findIndex((m: any) => m.name === moduleName);
    if (moduleIndex === -1) {
      showMessage('error', `模型 "${moduleName}" 不存在`);
      return;
    }
    const entityIndex = state.project.projectJSON.modules[moduleIndex].entities.findIndex((e: any) => e.title === entityTitle);
    if (entityIndex === -1) {
      showMessage('error', `表 "${entityTitle}" 不存在`);
      return;
    }
    state.project.projectJSON.modules[moduleIndex].entities[entityIndex] = {
      ...state.project.projectJSON.modules[moduleIndex].entities[entityIndex],
      ...payload
    };
    showMessage('success', '表更新成功');
  })),
  copyEntity: (moduleName: string, entityTitle: string) => set(produce((state: any) => {
    const moduleIndex = state.project.projectJSON.modules.findIndex((m: any) => m.name === moduleName);
    if (moduleIndex === -1) {
      showMessage('error', `未找到名为 "${moduleName}" 的模型`);
      return;
    }
    const entityIndex = state.project.projectJSON.modules[moduleIndex].entities.findIndex((e: any) => e.title === entityTitle);
    if (entityIndex === -1) {
      showMessage('error', `在模型 "${moduleName}" 中未找到名为 "${entityTitle}" 的表`);
      return;
    }
    const currentEntity = state.project.projectJSON.modules[moduleIndex].entities[entityIndex];
    cache.setItem(ERD_ENTITY_CLIPBOARD, JSON.stringify(currentEntity));
    showMessage('success', `表 "${entityTitle}" 已成功复制到剪贴板`);
  })),
  cutEntity: (moduleName: string, entityTitle: string) => set(produce((state: any) => {
    const moduleIndex = state.project.projectJSON.modules.findIndex((m: any) => m.name === moduleName);
    if (moduleIndex === -1) {
      showMessage('error', `未找到名为 "${moduleName}" 的模型`);
      return;
    }
    const entityIndex = state.project.projectJSON.modules[moduleIndex].entities.findIndex((e: any) => e.title === entityTitle);
    if (entityIndex === -1) {
      showMessage('error', `在模型 "${moduleName}" 中未找到名为 "${entityTitle}" 的表`);
      return;
    }
    const currentEntity = state.project.projectJSON.modules[moduleIndex].entities[entityIndex];
    cache.setItem(ERD_ENTITY_CLIPBOARD, JSON.stringify(currentEntity));
    state.project.projectJSON.modules[moduleIndex].entities.splice(entityIndex, 1);
    showMessage('success', `表 "${entityTitle}" 已成功剪切到剪贴板`);
  })),
  pastEntity: (moduleName: string) => set(produce((state: any) => {
    let data;
    try {
      data = JSON.parse(cache.getItem(ERD_ENTITY_CLIPBOARD) || 'null');
    } catch (error) {
      console.error('解析剪贴板数据时出错:', error);
      data = null;
    }

    if (!data || !validateEntity(data)) {
      showMessage('error', '剪贴板中没有有效的表数据');
      return;
    }

    const modules = state.project.projectJSON.modules;
    const baseName = data.title || data.name;
    let entityName = baseName;
    let counter = 0;
    const nameTaken = (name: string) =>
      modules.some((m: any) =>
        (m.entities || []).some((e: any) => (e.title || e.name) === name),
      );
    while (nameTaken(entityName)) {
      counter++;
      entityName = `${baseName}${counter === 1 ? '副本' : `副本${counter}`}`;
    }

    const newEntity = {
      ...data,
      title: entityName,
      name: entityName,
      chnname: counter === 0 ? data.chnname : `${data.chnname || data.title || data.name}${counter === 1 ? '副本' : `副本${counter}`}`,
      fields: data.fields.map((field: any) => ({
        ...field,
        id: generateUniqueId()
      }))
    };

    const moduleIndex = state.project.projectJSON.modules.findIndex((m: any) => m.name === moduleName);
    if (moduleIndex === -1) {
      showMessage('error', `未找到名为 "${moduleName}" 的模型`);
      return;
    }

    state.project.projectJSON.modules[moduleIndex].entities.push(newEntity);
    showMessage('success', `表 "${entityName}" 已成功粘贴到模型 "${moduleName}"`);
  })),
  updateEntityFields: (moduleName: string, entityTitle: string, payload: any) => {
    if (typeof moduleName !== 'string') {
      console.error('模块名称必须是字符串', moduleName);
      showMessage('error', '更新失败：无效的模块名称');
      return;
    }
    const modules = get().project?.projectJSON?.modules || [];
    const moduleIndex = modules.findIndex((m: any) => m.name === moduleName);
    if (moduleIndex === -1) {
      showMessage('error', `模型 "${moduleName}" 不存在`);
      return;
    }
    const entityIndex = modules[moduleIndex].entities.findIndex((e: any) => e.title === entityTitle || e.name === entityTitle);
    if (entityIndex === -1) {
      showMessage('error', `表 "${entityTitle}" 不存在`);
      return;
    }

    // 检查字段名称是否唯一
    const fieldNames = new Set();
    const duplicateFields = [];
    for (const field of payload) {
      if (fieldNames.has(field.name)) {
        duplicateFields.push(field.name);
      }
      fieldNames.add(field.name);
    }

    if (duplicateFields.length > 0) {
      showMessage('error', `以下字段名重复: ${duplicateFields.join(', ')}`);
      return;
    }

    snapshotModules(modules);
    set(produce((state: any) => {
    const entity = state.project.projectJSON.modules[moduleIndex].entities[entityIndex];
    const oldFields: any[] = entity.fields || [];
    // 检测字段改名并同步 associations：优先同长按下标对齐；否则「仅一名出/入」启发式
    const oldNameList = oldFields.map((f: any) => f?.name).filter(Boolean);
    const newNameList = payload.map((f: any) => f?.name).filter(Boolean);
    const newNames = new Set(newNameList);
    const oldNameSet = new Set(oldNameList);
    const onlyOld = oldNameList.filter((n: string) => !newNames.has(n));
    const onlyNew = newNameList.filter((n: string) => !oldNameSet.has(n));
    const renamedFrom = new Set<string>();
    const renamePairs: { oldName: string; newName: string }[] = [];
    if (oldFields.length === payload.length) {
      oldFields.forEach((of: any, i: number) => {
        const nf = payload[i];
        if (of?.name && nf?.name && of.name !== nf.name) {
          renamePairs.push({ oldName: of.name, newName: nf.name });
        }
      });
    } else if (onlyOld.length === 1 && onlyNew.length === 1) {
      renamePairs.push({ oldName: onlyOld[0], newName: onlyNew[0] });
    }
    renamePairs.forEach(({ oldName, newName }) => {
      renamedFrom.add(oldName);
      const modAssocs = state.project.projectJSON.modules[moduleIndex];
      modAssocs.associations = (modAssocs.associations || []).map((assoc: any) => {
        let from = assoc?.from;
        let to = assoc?.to;
        if (from?.entity === entityTitle && from?.field === oldName) {
          from = { ...from, field: newName };
        }
        if (to?.entity === entityTitle && to?.field === oldName) {
          to = { ...to, field: newName };
        }
        return { ...assoc, from, to };
      });
    });
    // 真正删除的字段才清关联（改名旧名除外）
    const removed = onlyOld.filter((n: string) => !renamedFrom.has(n));
    if (removed.length > 0) {
      state.project.projectJSON.modules[moduleIndex].associations =
        (state.project.projectJSON.modules[moduleIndex].associations || []).filter((a: any) => !(
          (a?.from?.entity === entityTitle && removed.includes(a?.from?.field)) ||
          (a?.to?.entity === entityTitle && removed.includes(a?.to?.field))
        ));
    }

    entity.fields = payload;
    // 不弹 success：画布内联编辑本身即时可见，toast 噪音会淹没删除守卫等关键提示
    }));
  },
  updateEntityIndex: (moduleName: string, entityTitle: string, payload: any) => set(produce((state: any) => {
    if (typeof moduleName !== 'string') {
      console.error('模块名称必须是字符串', moduleName);
      showMessage('error', '更新失败：无效的模块名称');
      return;
    }
    const moduleIndex = state.project.projectJSON.modules.findIndex((m: any) => m.name === moduleName);
    if (moduleIndex === -1) {
      showMessage('error', `模型 "${moduleName}" 不存在`);
      return;
    }
    const entityIndex = state.project.projectJSON.modules[moduleIndex].entities.findIndex((e: any) => e.title === entityTitle || e.name === entityTitle);
    if (entityIndex === -1) {
      showMessage('error', `表 "${entityTitle}" 不存在`);
      return;
    }

    // 检查索引名称是否唯一
    const indexNames = new Set();
    const duplicateIndexes = [];
    for (const index of payload) {
      if (indexNames.has(index.name)) {
        duplicateIndexes.push(index.name);
      }
      indexNames.add(index.name);
    }

    if (duplicateIndexes.length > 0) {
      showMessage('error', `以下索引名重复: ${duplicateIndexes.join(', ')}`);
      return;
    }

    state.project.projectJSON.modules[moduleIndex].entities[entityIndex].indexs = payload;
    
    showMessage('success', '索引更新成功');
  })),
  moveField: (moduleName: string, entityTitle: string, payload: any, startRow: number, endRow: number) => set(produce((state: any) => {
    const moduleIndex = state.project.projectJSON.modules.findIndex((m: any) => m.name === moduleName);
    if (moduleIndex === -1) {
      showMessage('error', `模型 "${moduleName}" 不存在`);
      return;
    }
    const entityIndex = state.project.projectJSON.modules[moduleIndex].entities.findIndex((e: any) => e.title === entityTitle);
    if (entityIndex === -1) {
      showMessage('error', `表 "${entityTitle}" 不存在`);
      return;
    }
    let targetRow = endRow;
    if (startRow < targetRow) {
      targetRow -= 1;
    }
    const nextFields = [...payload];
    const item = nextFields.splice(startRow, 1)[0];
    nextFields.splice(targetRow, 0, item);
    state.project.projectJSON.modules[moduleIndex].entities[entityIndex].fields = nextFields;
    showMessage('success', '字段移动成功');
  })),
  setCurrentEntity: (moduleName: string, entityName: string) => set(produce((state: any) => {
    const moduleIndex = state.project.projectJSON.modules.findIndex((m: any) => m.name === moduleName);
    if (moduleIndex === -1) {
      showMessage('error', `模型 "${moduleName}" 不存在`);
      return;
    }
    const module = state.project.projectJSON.modules[moduleIndex];
    if (!module.entities) {
      showMessage('error', `模型 "${moduleName}" 没有表`);
      return;
    }
    const entityIndex = module.entities.findIndex((e: any) => e.name === entityName || e.title === entityName);
    if (entityIndex === -1) {
      showMessage('error', `表 "${entityName}" 不存在`);
      return;
    }
    state.currentModule = moduleName;
    state.currentModuleIndex = moduleIndex;
    state.currentEntity = entityName;
    state.currentEntityIndex = entityIndex;
    shortcutState.dispatch.setPanel(PANEL.DEFAULT);
  })),
  setCurrentModuleAndEntity: (moduleName: string, entityName: string) => set(produce((state: any) => {
    const moduleIndex = state.project.projectJSON.modules.findIndex((m: any) => m.name === moduleName);
    if (moduleIndex === -1) {
      showMessage('error', `模型 "${moduleName}" 不存在`);
      return;
    }
    const module = state.project.projectJSON.modules[moduleIndex];
    if (!module.entities) {
      showMessage('error', `模型 "${moduleName}" 没有表`);
      return;
    }
    const entityIndex = module.entities.findIndex((e: any) => e.name === entityName || e.title === entityName);
    if (entityIndex === -1) {
      showMessage('error', `表 "${entityName}" 不存在`);
      return;
    }
    state.currentModule = moduleName;
    state.currentModuleIndex = moduleIndex;
    state.currentEntity = entityName;
    state.currentEntityIndex = entityIndex;
    shortcutState.dispatch.setPanel(PANEL.DEFAULT);
  })),
});

export default EntitiesSlice;
