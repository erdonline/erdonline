import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  MiniMap,
  Panel,
  Handle,
  Position,
  NodeProps,
  Edge,
  Node,
  NodeResizer,
  useNodesState,
  useUpdateNodeInternals,
  applyNodeChanges,
  OnNodesChange,
  OnEdgesChange,
  NodeChange,
  EdgeChange,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import useProjectStore from '@/store/project/useProjectStore';
import useTabStore, { ModuleEntity, TabGroup } from '@/store/tab/useTabStore';
import { history } from 'umi';
import { erdColors } from '@/theme/tokens';
import ErdEmptyDiagram from '@/components/ErdEmptyDiagram';
import {
  DEFAULT_FRAME_H,
  DEFAULT_FRAME_W,
  DiagramFrame,
  computeFrameBoundsFromNodes,
  expandFrameBoundsToNodes,
  frameNodeId,
  getActiveDiagramFrames,
  getActiveDiagramLayoutNodes,
  isFrameNodeId,
  isPointInFrameBounds,
  listDiagrams,
  parseDiagramIdFromTabEntity,
  parseFrameIdFromNodeId,
  relationTabEntity,
} from '@/utils/diagram';
import { dagrePositions, resolveEntityPositions } from '@/utils/graphLayout';
import {
  DEFAULT_RELATION,
  EDGE_INTERACTION_WIDTH,
  EDGE_STROKE,
  EDGE_STROKE_WIDTH,
  EDGE_STROKE_WIDTH_SELECTED,
  ERD_EDGE_TYPE,
  associationsToEdges,
  crowFootMarkersForRelation,
  parseFieldHandle,
} from '@/utils/relationEdges';
import {
  FIT_VIEW_INIT,
  FIT_VIEW_SHAREABLE,
  fitViewOptionsForTableCount,
} from '@/utils/canvasFit';

export { EDGE_INTERACTION_WIDTH } from '@/utils/relationEdges';
import { Input, Modal, Select, message } from 'antd';
import CollabCursors from '@/components/CollabCursors';
import ReverseDBML from '@/components/dialog/import/ReverseDBML';
import CommandPalette, { CommandItem } from './CommandPalette';
import ErdCrowFootMarkers from './ErdCrowFootMarkers';
import ErdRelationEdge from './ErdRelationEdge';
import ZhControls from './ZhControls';
import './reactflow-relation.scss';

/**
 * ReactFlow 关系图（ADR-0001 绞杀者策略）
 *
 * 核心设计决策（区别于旧 g6 的致命缺陷）：
 * **实体即节点**——module.entities 全集即画布节点，创建即上图；
 * graphCanvas 只存布局（坐标）；无坐标时 dagre 按关联分层（ADR-0016），不再网格散点。
 * R2：节点即编辑器——字段的增/改/删全部在节点上内联完成，
 * 不再跳转「双击开标签页 + handsontable」的 4 步长链路。
 */

type FieldData = {
  name: string;
  type?: string;
  chnname?: string;
  defaultValue?: string;
  pk?: boolean;
  notNull?: boolean;
  autoIncrement?: boolean;
  relationNoShow?: boolean;
};

type EntityData = {
  title: string;
  chnname?: string;
  fields?: FieldData[];
};

type Association = {
  relation?: string;
  from?: { entity?: string; field?: string };
  to?: { entity?: string; field?: string };
};

/** from 侧字段 = FK；按实体聚合，供节点徽章 */
function fkFieldsByEntity(associations: Association[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const a of associations || []) {
    const entity = a?.from?.entity;
    const field = a?.from?.field;
    if (!entity || !field) continue;
    const list = map.get(entity) || [];
    if (!list.includes(field)) list.push(field);
    map.set(entity, list);
  }
  return map;
}

const FIELD_TYPES = ['IdOrKey', 'String', 'Integer', 'Decimal', 'Boolean', 'DateTime', 'Text'];

/** 行内编辑状态：editing === 字段名（改名）| '__NEW__'（新增）| null */
type EditingState = {
  key: string;
  name: string;
  chnname: string;
  type: string;
  defaultValue: string;
  pk: boolean;
  notNull: boolean;
  autoIncrement: boolean;
} | null;

/** 视口裁剪阈值：小图开启 onlyRenderVisibleElements 反而更慢（RF 官方/实践） */
export const VIEWPORT_CULL_THRESHOLD = 24;

type TableNodeData = {
  entity: EntityData;
  moduleName: string;
  /** 本表作为 association.from 的字段名（外键） */
  fkFields?: string[];
};

/** 表节点：字段级 Handle + 内联字段编辑（增/改/删）+ 表头改名。memo 避免拖动画布时全量重渲。 */
const TableNode: React.FC<NodeProps<TableNodeData>> = React.memo(({ id, data, selected }) => {
  const entity = data.entity;
  const moduleName = data.moduleName;
  const fkSet = useMemo(() => new Set(data.fkFields || []), [data.fkFields]);
  const updateNodeInternals = useUpdateNodeInternals();

  const onFieldsChange = (fields: FieldData[]) => {
    useProjectStore.getState().dispatch.updateEntityFields(moduleName, entity.title, fields);
  };
  const onRename = (newTitle: string, newChnname: string) => {
    useProjectStore.getState().dispatch.renameEntity({
      oldModuleName: moduleName,
      newModuleName: moduleName,
      oldTitle: entity.title,
      newTitle,
      newChnname,
    });
  };
  const [editing, setEditing] = useState<EditingState>(null);
  /** 浏览态选中字段：Delete/Backspace → 二次确认删除（编辑态 Backspace 仍只改字） */
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [headerEditing, setHeaderEditing] = useState(false);
  const [headerName, setHeaderName] = useState(entity.title);
  const [headerChnname, setHeaderChnname] = useState(entity.chnname || '');
  /** 展开已隐藏字段列表，便于从图上恢复显示（不必绕表设计） */
  const [showHiddenFields, setShowHiddenFields] = useState(false);
  const fields = (entity.fields || []).filter(f => !f.relationNoShow);
  const hiddenFields = (entity.fields || []).filter(f => !!f.relationNoShow);
  const handleSignature = fields.map(f => f.name).join('\0');
  // Enter/Tab 提交后 blur 会再进一次 commit；用 ref 保证只落地一次，避免二次提交用陈旧 fields 把刚改名的字段「删掉」并清关联
  const editingRef = useRef<EditingState>(null);
  // Tab 跳行会换掉编辑行，旧 input blur 不得把下一行误提交关掉
  const ignoreBlurRef = useRef(false);
  // 表头 Escape / Tab 换焦点：禁止 blur 误 commit
  const headerIgnoreBlurRef = useRef(false);
  // ignoreBlur 期间禁止用 state 回写 ref（onFieldsChange 同步重渲会把 advance 目标打回旧行）
  if (!ignoreBlurRef.current) {
    editingRef.current = editing;
  }
  const entityFieldsRef = useRef(entity.fields || []);
  entityFieldsRef.current = entity.fields || [];

  useEffect(() => {
    setHeaderName(entity.title);
  }, [entity.title]);

  useEffect(() => {
    setHeaderChnname(entity.chnname || '');
  }, [entity.chnname]);

  // 字段增删改名会增删 Handle；必须通知 RF 重算锚点，否则边有 association 却不渲染
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, handleSignature, updateNodeInternals]);

  const startEditField = (f: {
    name: string;
    chnname?: string;
    type?: string;
    defaultValue?: string;
    pk?: boolean;
    notNull?: boolean;
    autoIncrement?: boolean;
  }) => {
    const pk = !!f.pk;
    setSelectedField(null);
    setEditing({
      key: f.name,
      name: f.name,
      chnname: f.chnname || '',
      type: f.type || 'String',
      defaultValue: f.defaultValue || '',
      pk,
      notNull: pk || !!f.notNull,
      autoIncrement: !!f.autoIncrement,
    });
  };

  /** 已有字段改类型/PK/非空/自增：立刻落盘，顶栏 save-status 即时反馈（不必等 Enter/blur） */
  const persistFieldMeta = (
    key: string,
    type: string,
    pk: boolean,
    notNull: boolean,
    autoIncrement: boolean,
  ) => {
    if (key === '__NEW__') return;
    const allFields = entityFieldsRef.current;
    onFieldsChange(allFields.map(f => (
      f.name === key ? { ...f, type, pk, notNull: pk || notNull, autoIncrement } : f
    )));
  };

  /** 已有字段在关系图中隐藏：立刻落盘并退出编辑（行会从画布消失） */
  const persistHideOnCanvas = (fieldName: string) => {
    if (!fieldName || fieldName === '__NEW__') return;
    const allFields = entityFieldsRef.current;
    onFieldsChange(allFields.map(f => (
      f.name === fieldName ? { ...f, relationNoShow: true } : f
    )));
    ignoreBlurRef.current = true;
    editingRef.current = null;
    setEditing(null);
    setShowHiddenFields(true);
    setTimeout(() => { ignoreBlurRef.current = false; }, 0);
    message.info(`已在关系图中隐藏「${fieldName}」；可点表底「已隐藏」恢复，或在表设计「字段」签取消隐藏`);
  };

  const unhideOnCanvas = (fieldName: string) => {
    onFieldsChange((entityFieldsRef.current || []).map(f => (
      f.name === fieldName ? { ...f, relationNoShow: false } : f
    )));
    message.success(`已在关系图中显示「${fieldName}」`);
  };

  const commit = (advance?: 'next' | 'prev') => {
    const current = editingRef.current;
    if (!current) {
      return;
    }
    editingRef.current = null;
    const name = current.name.trim();
    if (!name) {
      // 新增空名 = 取消；改已有字段空名 = toast 并留在编辑（禁止静默丢）
      if (current.key === '__NEW__') {
        setEditing(null);
        return;
      }
      editingRef.current = current;
      message.warning('字段名不能为空');
      return;
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      editingRef.current = current;
      message.warning('字段名仅支持字母、数字、下划线，且以字母或下划线开头');
      return;
    }
    const allFields = entityFieldsRef.current;
    const visible = allFields.filter(f => !f.relationNoShow);
    const dup = visible.some(f => f.name === name && f.name !== current.key);
    if (dup) {
      editingRef.current = current;
      message.warning(`字段 ${name} 已存在`);
      return;
    }

    const chnname = (current.chnname || '').trim();
    const defaultValue = (current.defaultValue || '').trim();
    // 跳行：先锁 blur/ref，再落盘（避免 store 同步重渲把 editingRef 打回旧行）
    if (advance) {
      ignoreBlurRef.current = true;
    }
    let nextFields: FieldData[];
    if (current.key === '__NEW__') {
      // IdOrKey 默认主键：建模直觉（新建 ID 字段几乎总是 PK）
      const pk = current.pk || current.type === 'IdOrKey';
      const notNull = pk || current.notNull;
      const created = {
        name, type: current.type, chnname, defaultValue, remark: '', pk, notNull,
        autoIncrement: current.autoIncrement,
      } as FieldData;
      nextFields = [...allFields, created];
      onFieldsChange(nextFields);
    } else {
      nextFields = allFields.map(f => (
        f.name === current.key
          ? {
            ...f,
            name,
            chnname,
            defaultValue,
            type: current.type,
            pk: current.pk,
            notNull: current.pk || current.notNull,
            autoIncrement: current.autoIncrement,
          }
          : f
      ));
      onFieldsChange(nextFields);
    }

    if (advance) {
      const visibleAfter = nextFields.filter(f => !f.relationNoShow);
      const idx = visibleAfter.findIndex(f => f.name === name);
      const targetIdx = advance === 'next' ? idx + 1 : idx - 1;
      if (idx >= 0 && targetIdx >= 0 && targetIdx < visibleAfter.length) {
        const f = visibleAfter[targetIdx];
        const pk = !!f.pk;
        const nextEdit = {
          key: f.name,
          name: f.name,
          chnname: f.chnname || '',
          type: f.type || 'String',
          defaultValue: f.defaultValue || '',
          pk,
          notNull: pk || !!f.notNull,
          autoIncrement: !!f.autoIncrement,
        };
        editingRef.current = nextEdit;
        setEditing(nextEdit);
        // 等旧行卸载 blur + 新行 autoFocus 落稳（0ms 偶发早于 blur）
        setTimeout(() => { ignoreBlurRef.current = false; }, 50);
        return;
      }
      // 末行 Tab → 开新建行（表格式建模回路；空名 toast 仍走 commit 校验）
      if (advance === 'next' && idx >= 0 && targetIdx >= visibleAfter.length) {
        const nextEdit = {
          key: '__NEW__', name: '', chnname: '', type: 'String', defaultValue: '',
          pk: false, notNull: false, autoIncrement: false,
        };
        editingRef.current = nextEdit;
        setEditing(nextEdit);
        setTimeout(() => { ignoreBlurRef.current = false; }, 50);
        return;
      }
      ignoreBlurRef.current = false;
    }
    setEditing(null);
  };

  const removeField = (fieldName: string) => {
    onFieldsChange((entity.fields || []).filter(f => f.name !== fieldName));
    setSelectedField(prev => (prev === fieldName ? null : prev));
  };

  /** 破坏性：按钮 / 浏览态 Delete·Backspace 共用二次确认 */
  const confirmRemoveField = (fieldName: string) => {
    Modal.confirm({
      title: `确定删除字段 "${fieldName}" 吗?`,
      content: '此操作不可逆，请谨慎操作。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        removeField(fieldName);
      },
    });
  };

  const togglePk = (fieldName: string) => {
    onFieldsChange((entity.fields || []).map(f => (
      f.name === fieldName ? { ...f, pk: !f.pk, notNull: !f.pk ? true : f.notNull } : f
    )));
  };

  const resetHeaderDraft = () => {
    setHeaderName(entity.title);
    setHeaderChnname(entity.chnname || '');
  };

  const cancelHeaderEdit = () => {
    headerIgnoreBlurRef.current = true;
    resetHeaderDraft();
    setHeaderEditing(false);
    setTimeout(() => { headerIgnoreBlurRef.current = false; }, 0);
  };

  const focusHeaderPart = (part: 'name' | 'chnname') => {
    headerIgnoreBlurRef.current = true;
    const root = document.activeElement?.closest('.erd-table-header');
    const sel = part === 'name'
      ? 'input[aria-label="表名"]'
      : 'input[aria-label="表中文名"]';
    setTimeout(() => {
      (root?.querySelector(sel) as HTMLElement | null)?.focus();
      headerIgnoreBlurRef.current = false;
    }, 0);
  };

  const commitHeader = () => {
    const name = headerName.trim();
    const chn = headerChnname.trim();
    if (!name) {
      // 与字段空名同形：toast 并留在编辑（禁止静默丢）
      message.warning('表名不能为空');
      return;
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      message.warning('表名仅支持字母、数字、下划线，且以字母或下划线开头');
      return;
    }
    const titleSame = name === entity.title;
    const chnSame = chn === (entity.chnname || '');
    if (titleSame && chnSame) {
      setHeaderEditing(false);
      resetHeaderDraft();
      return;
    }
    onRename(name, chn);
    setHeaderEditing(false);
  };

  const onHeaderEditKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      commitHeader();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelHeaderEdit();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const label = (e.currentTarget as HTMLElement).getAttribute('aria-label');
      if (!e.shiftKey) {
        if (label === '表名') {
          focusHeaderPart('chnname');
          return;
        }
        commitHeader();
        return;
      }
      if (label === '表中文名') {
        focusHeaderPart('name');
        return;
      }
      commitHeader();
    }
  };

  const onHeaderEditBlur = (e: React.FocusEvent) => {
    if (headerIgnoreBlurRef.current) return;
    const next = e.relatedTarget as HTMLElement | null;
    if (next && next.closest('.erd-table-header')) {
      return;
    }
    commitHeader();
  };

  /** Escape：丢弃未提交的字段名，禁止 blur 再走 commit（否则取消变静默落盘） */
  const cancelFieldEdit = () => {
    ignoreBlurRef.current = true;
    editingRef.current = null;
    setEditing(null);
    setTimeout(() => { ignoreBlurRef.current = false; }, 0);
  };

  /** 行内焦点：名 → 中文名 → 类型 → 默认值；跳行仍从默认值 Tab（与既有稳定路径一致） */
  const focusEditPart = (part: 'name' | 'chnname' | 'type' | 'default') => {
    ignoreBlurRef.current = true;
    const root = document.activeElement?.closest('.erd-field-editing');
    const sel = part === 'name'
      ? 'input[aria-label="字段名"]'
      : part === 'chnname'
        ? 'input[aria-label="中文名"]'
        : part === 'type'
          ? 'select[aria-label="字段类型"]'
          : 'input[aria-label="默认值"]';
    // 等当前 keydown 结束再 focus，避免与 blur 竞态
    setTimeout(() => {
      (root?.querySelector(sel) as HTMLElement | null)?.focus();
      ignoreBlurRef.current = false;
    }, 0);
  };

  const onFieldEditKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      commit();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelFieldEdit();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const label = (e.currentTarget as HTMLElement).getAttribute('aria-label');
      const nameTrim = (editingRef.current?.name ?? '').trim();
      if (!e.shiftKey) {
        // 字段名 Tab → 中文名；空名仍走 commit 校验（保留空名 toast）
        if (label === '字段名') {
          if (!nameTrim) {
            commit();
            return;
          }
          focusEditPart('chnname');
          return;
        }
        // 中文名 Tab → 类型（不跳行）
        if (label === '中文名') {
          focusEditPart('type');
          return;
        }
        // 类型 Tab → 默认值（不跳行；默认放次行避免挤爆主栏）
        if (label === '字段类型') {
          focusEditPart('default');
          return;
        }
        // 默认值 Tab → 提交并跳下一行
        commit('next');
        return;
      }
      if (label === '中文名') {
        focusEditPart('name');
        return;
      }
      if (label === '字段类型') {
        focusEditPart('chnname');
        return;
      }
      if (label === '默认值') {
        focusEditPart('type');
        return;
      }
      commit('prev');
    }
  };

  const onFieldEditBlur = (e: React.FocusEvent, rowKey: string) => {
    if (ignoreBlurRef.current) return;
    // Tab 跳行/Escape 后旧 input 卸载 blur：行 key 已变则忽略，避免关掉刚打开的下一行
    if (editingRef.current?.key !== rowKey) return;
    if (!(e.target as HTMLElement).isConnected) return;
    // 焦点移到同行控件时不提交，避免「改类型/勾 PK」误触发空名 commit
    const next = e.relatedTarget as HTMLElement | null;
    if (next && next.closest('.erd-field-editing')) {
      return;
    }
    commit();
  };

  const editRow = (rowKey: string) => (
    <div className="erd-field-row erd-field-editing nodrag">
      <div className="erd-field-edit-main">
        <label className="erd-field-meta-toggle erd-field-pk-toggle" title="主键">
          <input
            type="checkbox"
            aria-label="主键"
            checked={!!editing?.pk}
            onChange={e => {
              const pk = e.target.checked;
              const current = editingRef.current;
              if (!current) return;
              const notNull = pk || current.notNull;
              const next = { ...current, pk, notNull };
              editingRef.current = next;
              setEditing(next);
              persistFieldMeta(current.key, current.type, pk, notNull, current.autoIncrement);
            }}
            onKeyDown={e => e.stopPropagation()}
          />
          PK
        </label>
        <label className="erd-field-meta-toggle erd-field-nn-toggle" title="非空">
          <input
            type="checkbox"
            aria-label="非空"
            checked={!!editing?.notNull}
            disabled={!!editing?.pk}
            onChange={e => {
              const current = editingRef.current;
              if (!current || current.pk) return;
              const notNull = e.target.checked;
              const next = { ...current, notNull };
              editingRef.current = next;
              setEditing(next);
              persistFieldMeta(current.key, current.type, current.pk, notNull, current.autoIncrement);
            }}
            onKeyDown={e => e.stopPropagation()}
          />
          NN
        </label>
        <label className="erd-field-meta-toggle erd-field-ai-toggle" title="自增">
          <input
            type="checkbox"
            aria-label="自增"
            checked={!!editing?.autoIncrement}
            onChange={e => {
              const current = editingRef.current;
              if (!current) return;
              const autoIncrement = e.target.checked;
              const next = { ...current, autoIncrement };
              editingRef.current = next;
              setEditing(next);
              persistFieldMeta(current.key, current.type, current.pk, current.notNull, autoIncrement);
            }}
            onKeyDown={e => e.stopPropagation()}
          />
          AI
        </label>
        {editing?.key !== '__NEW__' ? (
          <label className="erd-field-meta-toggle erd-field-hide-toggle" title="在关系图中隐藏">
            <input
              type="checkbox"
              aria-label="在关系图中隐藏"
              checked={false}
              onChange={e => {
                if (!e.target.checked) return;
                const current = editingRef.current;
                if (!current || current.key === '__NEW__') return;
                persistHideOnCanvas(current.key);
              }}
              onKeyDown={e => e.stopPropagation()}
            />
            隐
          </label>
        ) : null}
        <input
          className="erd-field-input"
          aria-label="字段名"
          autoFocus
          placeholder="字段名"
          value={editing?.name ?? ''}
          onChange={e => {
            const nextName = e.target.value;
            setEditing(prev => {
              if (!prev) return prev;
              const next = { ...prev, name: nextName };
              editingRef.current = next;
              return next;
            });
          }}
          onKeyDown={onFieldEditKeyDown}
          onBlur={e => onFieldEditBlur(e, rowKey)}
        />
        <input
          className="erd-field-chnname-input"
          aria-label="中文名"
          placeholder="中文名"
          value={editing?.chnname ?? ''}
          onChange={e => {
            const chnname = e.target.value;
            setEditing(prev => {
              if (!prev) return prev;
              const next = { ...prev, chnname };
              editingRef.current = next;
              return next;
            });
          }}
          onKeyDown={onFieldEditKeyDown}
          onBlur={e => onFieldEditBlur(e, rowKey)}
        />
        <select
          className="erd-field-type-select"
          aria-label="字段类型"
          value={editing?.type ?? 'String'}
          onChange={e => {
            const type = e.target.value;
            const current = editingRef.current;
            if (!current) return;
            const next = { ...current, type };
            editingRef.current = next;
            setEditing(next);
            persistFieldMeta(current.key, type, current.pk, current.notNull, current.autoIncrement);
          }}
          onKeyDown={onFieldEditKeyDown}
          onBlur={e => onFieldEditBlur(e, rowKey)}
        >
          {FIELD_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="erd-field-edit-default">
        <span className="erd-field-default-label" aria-hidden>默认</span>
        <input
          className="erd-field-default-input"
          aria-label="默认值"
          placeholder="默认值（可选）"
          value={editing?.defaultValue ?? ''}
          onChange={e => {
            const defaultValue = e.target.value;
            setEditing(prev => {
              if (!prev) return prev;
              const next = { ...prev, defaultValue };
              editingRef.current = next;
              return next;
            });
          }}
          onKeyDown={onFieldEditKeyDown}
          onBlur={e => onFieldEditBlur(e, rowKey)}
        />
      </div>
    </div>
  );

  return (
    <div className={`erd-table-node${selected ? ' selected' : ''}`}>
      <div
        className="erd-table-header nodrag nopan"
        onDoubleClick={e => {
          e.stopPropagation();
          setHeaderEditing(true);
        }}
        // 已选中时再点表名 → 进入改名（Figma 式，比纯双击更稳）
        onClick={e => {
          if (selected && !headerEditing) {
            e.stopPropagation();
            setHeaderEditing(true);
          }
        }}
        title="选中后再点表头，或双击，可改表名与中文名"
      >
        {headerEditing ? (
          <div className="erd-header-inputs">
            <input
              className="erd-header-input"
              aria-label="表名"
              autoFocus
              value={headerName}
              onChange={e => setHeaderName(e.target.value)}
              onKeyDown={onHeaderEditKeyDown}
              onBlur={onHeaderEditBlur}
            />
            <input
              className="erd-header-chnname-input"
              aria-label="表中文名"
              placeholder="中文名"
              value={headerChnname}
              onChange={e => setHeaderChnname(e.target.value)}
              onKeyDown={onHeaderEditKeyDown}
              onBlur={onHeaderEditBlur}
            />
          </div>
        ) : (
          <>
            <span className="erd-table-title">{entity.title}</span>
            {entity.chnname && <span className="erd-table-chnname">{entity.chnname}</span>}
            <button
              type="button"
              className="erd-header-edit nodrag nopan"
              data-testid="table-rename-btn"
              aria-label="修改表名"
              title="修改表名与中文名"
              onClick={e => {
                e.stopPropagation();
                setHeaderEditing(true);
              }}
            >
              ✎
            </button>
          </>
        )}
      </div>
      <div className="erd-table-fields">
        {fields.map(f =>
          editing?.key === f.name ? (
            <React.Fragment key={f.name}>{editRow(f.name)}</React.Fragment>
          ) : (
            <div
              key={f.name}
              className={[
                'erd-field-row',
                f.pk ? 'erd-field-pk' : '',
                fkSet.has(f.name) ? 'erd-field-fk' : '',
                selectedField === f.name ? 'erd-field-selected' : '',
              ].filter(Boolean).join(' ')}
              tabIndex={0}
              aria-label={`字段 ${f.name}`}
              aria-current={selectedField === f.name ? 'true' : undefined}
              onClick={e => {
                const t = e.target as HTMLElement;
                // 控件/锚点点击不抢选中（PK/✎/× 自带动作）
                if (t.closest('button, a, input, select, label, .react-flow__handle')) return;
                setSelectedField(f.name);
                (e.currentTarget as HTMLElement).focus();
              }}
              onDoubleClick={() => startEditField(f)}
              onKeyDown={e => {
                // 拦 RF deleteKeyCode；子控件（PK/✎/×）聚焦时不误删
                e.stopPropagation();
                if (e.key !== 'Delete' && e.key !== 'Backspace') return;
                const t = e.target as HTMLElement;
                if (t.closest('button, input, select, textarea')) return;
                e.preventDefault();
                confirmRemoveField(f.name);
              }}
              title="单击选中后 Delete/Backspace 删除；双击或点 ✎ 编辑"
              data-field={f.name}
            >
              {/* 双侧 src/tgt：左靶在上（易落点）、右源在上（易拖出）；几何择柄消竖叠 circle-route */}
              <Handle type="source" id={`${f.name}-src-l`} position={Position.Left} className="erd-field-handle erd-handle-src" />
              <Handle type="target" id={`${f.name}-tgt-l`} position={Position.Left} className="erd-field-handle erd-handle-tgt" />
              <span className="erd-field-name">
                <button
                  type="button"
                  className={`erd-pk-badge nodrag${f.pk ? ' active' : ' inactive'}`}
                  aria-label={f.pk ? '取消主键' : '设为主键'}
                  title={f.pk ? '取消主键' : '设为主键'}
                  onClick={e => {
                    e.stopPropagation();
                    togglePk(f.name);
                  }}
                >
                  PK
                </button>
                {fkSet.has(f.name) ? (
                  <span className="erd-fk-badge" title="外键" aria-label="外键">FK</span>
                ) : null}
                {f.name}
                {f.chnname ? <span className="erd-field-chnname"> {f.chnname}</span> : null}
              </span>
              <span className="erd-field-type">
                {f.type}
                {f.defaultValue ? (
                  <span className="erd-field-default" title={`默认 ${f.defaultValue}`}>
                    {' '}={f.defaultValue}
                  </span>
                ) : null}
              </span>
              <button
                type="button"
                className="erd-field-edit nodrag"
                data-testid="field-edit-btn"
                aria-label="编辑字段"
                title="编辑字段"
                onClick={e => {
                  e.stopPropagation();
                  startEditField(f);
                }}
              >
                ✎
              </button>
              <button
                type="button"
                className="erd-field-delete nodrag"
                aria-label="删除字段"
                title="删除字段"
                onClick={e => {
                  e.stopPropagation();
                  confirmRemoveField(f.name);
                }}
              >
                ×
              </button>
              <Handle type="target" id={`${f.name}-tgt-r`} position={Position.Right} className="erd-field-handle erd-handle-tgt" />
              <Handle type="source" id={`${f.name}-src-r`} position={Position.Right} className="erd-field-handle erd-handle-src" />
            </div>
          )
        )}
        {editing?.key === '__NEW__' && editRow('__NEW__')}
        {editing === null && (
          <div
            className="erd-field-add nodrag"
            data-testid="canvas-add-field"
            role="button"
            aria-label="添加字段"
            onClick={() => {
              setSelectedField(null);
              setEditing({
                key: '__NEW__', name: '', chnname: '', type: 'String', defaultValue: '',
                pk: false, notNull: false, autoIncrement: false,
              });
            }}
          >
            + 添加字段
          </div>
        )}
        {hiddenFields.length > 0 && (
          <div className="erd-field-hidden-bar nodrag">
            <button
              type="button"
              className="erd-field-hidden-toggle"
              data-testid="field-hidden-toggle"
              aria-expanded={showHiddenFields}
              aria-label={`已隐藏 ${hiddenFields.length} 个字段`}
              onClick={e => {
                e.stopPropagation();
                setShowHiddenFields(v => !v);
              }}
            >
              已隐藏 {hiddenFields.length} 个字段
            </button>
            {showHiddenFields && hiddenFields.map(f => (
              <div
                key={f.name}
                className="erd-field-hidden-row"
                data-testid={`field-hidden-${f.name}`}
              >
                <span className="erd-field-hidden-name">{f.name}</span>
                <button
                  type="button"
                  className="erd-field-unhide"
                  aria-label={`在关系图中显示 ${f.name}`}
                  onClick={e => {
                    e.stopPropagation();
                    unhideOnCanvas(f.name);
                  }}
                >
                  显示
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="erd-open-design nodrag nopan" role="group" aria-label="打开表设计">
          <button
            type="button"
            className="erd-open-design__btn"
            data-testid="canvas-open-field"
            aria-label="打开字段"
            title="打开表设计 · 字段"
            onClick={e => {
              e.stopPropagation();
              const projectDispatch = useProjectStore.getState().dispatch;
              projectDispatch.setCurrentModule(moduleName);
              projectDispatch.setCurrentEntity(moduleName, entity.title);
              useTabStore.getState().dispatch.addTab({
                group: TabGroup.MODEL,
                module: moduleName,
                entity: entity.title,
                designPane: 'field',
              });
            }}
          >
            字段
          </button>
          <button
            type="button"
            className="erd-open-design__btn"
            data-testid="canvas-open-index"
            aria-label="打开索引"
            title="打开表设计 · 索引"
            onClick={e => {
              e.stopPropagation();
              const projectDispatch = useProjectStore.getState().dispatch;
              projectDispatch.setCurrentModule(moduleName);
              projectDispatch.setCurrentEntity(moduleName, entity.title);
              useTabStore.getState().dispatch.addTab({
                group: TabGroup.MODEL,
                module: moduleName,
                entity: entity.title,
                designPane: 'index',
              });
            }}
          >
            索引
          </button>
          <button
            type="button"
            className="erd-open-design__btn"
            data-testid="canvas-open-code"
            aria-label="打开元数据应用"
            title="打开表设计 · 元数据应用"
            onClick={e => {
              e.stopPropagation();
              const projectDispatch = useProjectStore.getState().dispatch;
              projectDispatch.setCurrentModule(moduleName);
              projectDispatch.setCurrentEntity(moduleName, entity.title);
              useTabStore.getState().dispatch.addTab({
                group: TabGroup.MODEL,
                module: moduleName,
                entity: entity.title,
                designPane: 'code',
              });
            }}
          >
            元数据
          </button>
        </div>
      </div>
    </div>
  );
});

function frameNodeSize(n: Node): { w: number; h: number } {
  const styleW = typeof n.style?.width === 'number' ? n.style.width : undefined;
  const styleH = typeof n.style?.height === 'number' ? n.style.height : undefined;
  return {
    w: n.width || styleW || DEFAULT_FRAME_W,
    h: n.height || styleH || DEFAULT_FRAME_H,
  };
}

function tableNodeSize(n: Node): { w: number; h: number } {
  return { w: n.width || 220, h: n.height || 80 };
}

/** RF Node.width 可为 null；交给包围盒 helper 前归一化 */
function nodesForBounds(nodes: Node[]): Array<{ position: { x: number; y: number }; width?: number; height?: number }> {
  return nodes.map((n) => {
    const { w, h } = n.type === 'frame' ? frameNodeSize(n) : tableNodeSize(n);
    return { position: n.position, width: w, height: h };
  });
}

type FrameNodeData = {
  frame: DiagramFrame;
  moduleName?: string;
  diagramId?: string;
};

/** 视觉框：默认在表下方；选中后抬升以便缩放/拖框（表不再拦截命中） */
const FrameNode: React.FC<NodeProps<FrameNodeData>> = ({ data, selected }) => {
  const f = data.frame;
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(f.name);

  const commitRename = useCallback(() => {
    const next = draft.trim();
    setRenaming(false);
    if (!next || next === f.name) {
      setDraft(f.name);
      return;
    }
    const mod = data.moduleName;
    if (!mod) return;
    useProjectStore.getState().dispatch.renameFrame(mod, data.diagramId, f.id, next);
  }, [data.diagramId, data.moduleName, draft, f.id, f.name]);

  return (
    <>
      {/* 始终挂载手柄；未选中时用 CSS 隐藏，避免 selected 与 RF 内部态短暂不一致 */}
      <NodeResizer
        isVisible
        minWidth={140}
        minHeight={100}
        color={erdColors.brand}
        handleClassName={`erd-frame-resize-handle${selected ? ' is-active' : ''}`}
        lineClassName={`erd-frame-resize-line${selected ? ' is-active' : ''}`}
      />
      <div
        className={`erd-frame-node${selected ? ' selected' : ''}`}
        data-testid="diagram-frame"
        data-frame-id={f.id}
        data-selected={selected ? '1' : '0'}
        style={{
          width: '100%',
          height: '100%',
          background: f.color || erdColors.frameFill,
        }}
        aria-label={`分组 ${f.name}`}
      >
        <div className="erd-frame-chrome">
          {renaming ? (
            <input
              className="erd-frame-rename nodrag nopan"
              data-testid="frame-rename-input"
              aria-label="分组名称"
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitRename();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setDraft(f.name);
                  setRenaming(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              className="erd-frame-label"
              data-testid="frame-rename-label"
              title="双击重命名"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setDraft(f.name);
                setRenaming(true);
              }}
            >
              {f.name}
            </div>
          )}
          {(f.memberEntityIds?.length || 0) > 0 ? (
            <div className="erd-frame-meta">{f.memberEntityIds.length} 张表</div>
          ) : (
            <div className="erd-frame-meta">拖表入框或点「加入分组」</div>
          )}
        </div>
      </div>
    </>
  );
};

const nodeTypes = { table: TableNode, frame: FrameNode };
const edgeTypes = { [ERD_EDGE_TYPE]: ErdRelationEdge };

export type ReactFlowRelationProps = {
  moduleEntity: ModuleEntity;
};

const ReactFlowRelation: React.FC<ReactFlowRelationProps> = ({ moduleEntity }) => {
  const projectJSON = useProjectStore(state => state.project?.projectJSON);
  const projectDispatch = useProjectStore(state => state.dispatch);
  const publishCursor = useProjectStore(state => state.publishCursor);
  const tabDispatch = useTabStore(state => state.dispatch);
  const [nodes, setNodes] = useNodesState([]);
  /** 边选中态（本地）；边列表本身始终从 associations 派生，避免 RF 因 handle 失效清空本地 edges */
  const [edgeSelected, setEdgeSelected] = useState<Record<string, boolean>>({});
  const [isEmpty, setIsEmpty] = useState(true);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [diagramModal, setDiagramModal] = useState<
    null | { mode: 'create' | 'rename'; name: string; diagramId?: string }
  >(null);
  const [frameAssignModal, setFrameAssignModal] = useState<null | { frameId: string }>(null);
  const [dbmlImportOpen, setDbmlImportOpen] = useState(false);
  /** >0 = 待 fitView 的表数（导入/自动布局后首屏铺满） */
  const pendingFitRef = useRef(0);
  const fitDiagramKeyRef = useRef('');
  const rfRef = useRef<ReactFlowInstance | null>(null);

  const moduleName = moduleEntity.module || '';
  const diagramIdFromTab = parseDiagramIdFromTabEntity(moduleName, moduleEntity.entity);
  const [activeDiagramId, setActiveDiagramId] = useState(diagramIdFromTab);

  useEffect(() => {
    setActiveDiagramId(diagramIdFromTab);
  }, [diagramIdFromTab]);

  const scheduleFitView = useCallback((tableCount: number, duration = 200) => {
    const opts = { ...fitViewOptionsForTableCount(tableCount), duration };
    requestAnimationFrame(() => {
      window.setTimeout(() => {
        rfRef.current?.fitView(opts);
      }, 50);
    });
  }, []);

  const currentModule = useMemo(
    () => (projectJSON?.modules || []).find((m: any) => m.name === moduleName),
    [projectJSON, moduleName],
  );
  const diagrams = useMemo(() => listDiagrams(currentModule), [currentModule]);
  const frames = useMemo(
    () => getActiveDiagramFrames(currentModule, activeDiagramId),
    [currentModule, activeDiagramId],
  );

  const switchDiagram = useCallback(
    (nextId: string) => {
      setActiveDiagramId(nextId);
      tabDispatch.switchRelationDiagram(moduleName, relationTabEntity(moduleName, nextId));
    },
    [moduleName, tabDispatch],
  );

  const onCreateDiagram = useCallback(() => {
    setDiagramModal({ mode: 'create', name: '关系图' });
  }, []);

  const onRenameDiagram = useCallback(() => {
    const current = diagrams.find((d) => d.id === activeDiagramId) || diagrams[0];
    if (!current) return;
    setDiagramModal({ mode: 'rename', name: current.name, diagramId: current.id });
  }, [activeDiagramId, diagrams]);

  const onDiagramModalOk = useCallback(() => {
    if (!diagramModal) return;
    const name = (diagramModal.name || '').trim() || '关系图';
    if (diagramModal.mode === 'create') {
      const id = projectDispatch.createDiagram(moduleName, name);
      setDiagramModal(null);
      if (id) {
        switchDiagram(id);
      }
      return;
    }
    if (diagramModal.diagramId) {
      projectDispatch.renameDiagram(moduleName, diagramModal.diagramId, name);
    }
    setDiagramModal(null);
  }, [diagramModal, moduleName, projectDispatch, switchDiagram]);

  const edges: Edge[] = useMemo(() => {
    const associations = currentModule?.associations || [];
    const entities = currentModule?.entities || [];
    const layout = getActiveDiagramLayoutNodes(currentModule);
    const { positions } = resolveEntityPositions(entities, associations, layout);
    return associationsToEdges(associations, { positions }).map((e) => {
      const selected = !!edgeSelected[e.id];
      const stroke = selected ? erdColors.brand : EDGE_STROKE;
      const relation =
        typeof e.label === 'string' ? e.label : DEFAULT_RELATION;
      const markers = crowFootMarkersForRelation(
        relation,
        selected ? 'brand' : 'ink',
      );
      return {
        ...e,
        selected,
        data: {
          ...e.data,
          editable: true,
          moduleName,
        },
        style: {
          ...e.style,
          stroke,
          strokeWidth: selected ? EDGE_STROKE_WIDTH_SELECTED : EDGE_STROKE_WIDTH,
        },
        ...markers,
      };
    });
  }, [currentModule, edgeSelected, moduleName]);

  // 实体/坐标 → 节点。实体即节点：entities 全集渲染，位置优先级
  // 当前图 layout 坐标 > 现有画布位置 > dagre 补缺（导入/逆向无坐标时分层；并持久化到 diagrams）
  useEffect(() => {
    const module = currentModule;
    const entities: EntityData[] = module?.entities || [];
    const associations: Association[] = module?.associations || [];
    const savedNodes: any[] = getActiveDiagramLayoutNodes(module, activeDiagramId);
    setIsEmpty(entities.length === 0);

    const { positions, didAutoLayout } = resolveEntityPositions(
      entities,
      associations,
      savedNodes,
    );
    const fkMap = fkFieldsByEntity(associations);

    const diagramFrames = getActiveDiagramFrames(module, activeDiagramId);

    setNodes(prev => {
      const tableNodes = entities.map((entity) => {
        const live = prev.find(n => n.id === entity.title);
        const saved = positions[entity.title];
        // 已有持久坐标时以 saved 为准；仅缺坐标且 live 已有拖动中位置时保留 live
        const hasSaved =
          savedNodes.some(
            (n: any) =>
              ((n.title || '').split(':')[0] === entity.title || n.id === entity.title) &&
              typeof n.x === 'number' &&
              typeof n.y === 'number',
          );
        return {
          id: entity.title,
          type: 'table',
          zIndex: 2,
          // 切图/自动补坐标时禁止沿用上一图的 live 坐标
          position: hasSaved
            ? saved
            : (didAutoLayout ? saved : (live?.position || saved)),
          // entity + moduleName + fkFields：回调走 getState，便于 TableNode memo
          data: {
            entity,
            moduleName,
            fkFields: fkMap.get(entity.title) || [],
          },
          // 重建必须保留交互态（selected），否则点击选中立即被重建抹掉（已实证）
          selected: live?.selected,
        } as Node;
      });

      const frameNodes: Node[] = diagramFrames.map((f) => {
        const nid = frameNodeId(f.id);
        const live = prev.find((n) => n.id === nid);
        const selected = !!live?.selected;
        // 选中时抬到表上方，否则缩放手柄/拖框会被表节点挡住
        const z = selected ? 3 : 0;
        return {
          id: nid,
          type: 'frame',
          zIndex: z,
          position: { x: f.x, y: f.y },
          width: f.w,
          height: f.h,
          style: { width: f.w, height: f.h, zIndex: z },
          data: { frame: f, moduleName, diagramId: activeDiagramId },
          draggable: true,
          /** 仅顶栏拖动，避免与 NodeResizer 边线抢手势 */
          dragHandle: '.erd-frame-chrome',
          selectable: true,
          connectable: false,
          selected,
        };
      });

      // 框在下、表在上（渲染顺序 + zIndex）
      return [...frameNodes, ...tableNodes];
    });

    if (didAutoLayout && entities.length > 0) {
      projectDispatch.updateGraphCanvasLayout(
        moduleName,
        entities.map((e) => ({
          id: e.title,
          position: positions[e.title],
        })),
        activeDiagramId,
      );
      pendingFitRef.current = entities.length;
    }
  }, [currentModule, moduleName, activeDiagramId, setNodes, projectDispatch]);

  /** 拖框起始：绝对坐标平移成员（非 RF parent） */
  const frameDragRef = useRef<{
    nodeId: string;
    startX: number;
    startY: number;
    memberStarts: Record<string, { x: number; y: number }>;
  } | null>(null);
  /** RF onNodeDrag* 第三参是「正在拖的节点」，不是全量；成员坐标从这里取 */
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // 表：禁止按键删除（走模型树）。Frame：Delete → 写路径 removeFrame，由 store 重建。
      const removes = changes.filter((c) => c.type === 'remove') as Array<{ type: 'remove'; id: string }>;
      const tableRemoves = removes.filter((c) => !isFrameNodeId(c.id));
      const frameRemoves = removes.filter((c) => isFrameNodeId(c.id));
      if (tableRemoves.length) {
        message.info('数据表的删除请在左侧模型树中操作');
      }
      frameRemoves.forEach((c) => {
        projectDispatch.removeFrame(moduleName, activeDiagramId, parseFrameIdFromNodeId(c.id));
      });
      const safe = changes.filter((c) => c.type !== 'remove');
      const resizeEndedIds = new Set(
        changes
          .filter(
            (c): c is NodeChange & { type: 'dimensions'; id: string; resizing?: boolean } =>
              c.type === 'dimensions' && isFrameNodeId(c.id) && c.resizing === false,
          )
          .map((c) => c.id),
      );
      const selectionTouched = changes.some((c) => c.type === 'select');
      setNodes((prev) => {
        let next = applyNodeChanges(safe, prev);
        // 选中态变化时同步 Frame zIndex（表不再挡住手柄）
        if (selectionTouched) {
          next = next.map((n) => {
            if (n.type !== 'frame') return n;
            const z = n.selected ? 3 : 0;
            return {
              ...n,
              zIndex: z,
              style: { ...n.style, width: n.width ?? n.style?.width, height: n.height ?? n.style?.height, zIndex: z },
            };
          });
        }
        if (resizeEndedIds.size) {
          const updates = next
            .filter((n) => n.type === 'frame' && resizeEndedIds.has(n.id))
            .map((n) => {
              const { w, h } = frameNodeSize(n);
              return {
                id: parseFrameIdFromNodeId(n.id),
                x: n.position.x,
                y: n.position.y,
                w,
                h,
              };
            });
          if (updates.length) {
            queueMicrotask(() => {
              projectDispatch.updateFrameBounds(moduleName, activeDiagramId, updates);
            });
          }
        }
        return next;
      });
    },
    [setNodes, projectDispatch, moduleName, activeDiagramId],
  );

  const onNodeDragStart = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type !== 'frame' && !isFrameNodeId(node.id)) {
        frameDragRef.current = null;
        return;
      }
      const fid = parseFrameIdFromNodeId(node.id);
      const fromData = (node.data?.frame as DiagramFrame | undefined)?.memberEntityIds;
      const fromStore = frames.find((f) => f.id === fid)?.memberEntityIds;
      const memberIds = fromData?.length ? fromData : fromStore || [];
      const memberStarts: Record<string, { x: number; y: number }> = {};
      nodesRef.current.forEach((n) => {
        if (n.type === 'table' && memberIds.includes(n.id)) {
          memberStarts[n.id] = { x: n.position.x, y: n.position.y };
        }
      });
      frameDragRef.current = {
        nodeId: node.id,
        startX: node.position.x,
        startY: node.position.y,
        memberStarts,
      };
    },
    [frames],
  );

  const onNodeDrag = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const origin = frameDragRef.current;
      if (!origin || node.id !== origin.nodeId || !Object.keys(origin.memberStarts).length) {
        return;
      }
      const dx = node.position.x - origin.startX;
      const dy = node.position.y - origin.startY;
      setNodes((prev) =>
        prev.map((n) => {
          const start = origin.memberStarts[n.id];
          if (!start) return n;
          return {
            ...n,
            position: { x: Math.round(start.x + dx), y: Math.round(start.y + dy) },
          };
        }),
      );
    },
    [setNodes],
  );

  /** 拖表结束：中心落在框内 → 加入并扩边；拖出原成员框 → 移出 */
  const syncTableFrameMembership = useCallback(
    (allNodes: Node[], draggedTableIds: string[]) => {
      if (!draggedTableIds.length) return;
      const frameNodes = allNodes.filter((n) => n.type === 'frame');
      if (!frameNodes.length) return;

      type Bound = { x: number; y: number; w: number; h: number };
      const frameBound = (n: Node): Bound => {
        const { w, h } = frameNodeSize(n);
        return { x: n.position.x, y: n.position.y, w, h };
      };

      for (const tableId of draggedTableIds) {
        const table = allNodes.find((n) => n.id === tableId && n.type === 'table');
        if (!table) continue;
        const { w, h } = tableNodeSize(table);
        const cx = table.position.x + w / 2;
        const cy = table.position.y + h / 2;

        const containing = frameNodes
          .filter((fn) => isPointInFrameBounds(cx, cy, frameBound(fn)))
          .sort((a, b) => {
            const sa = frameNodeSize(a);
            const sb = frameNodeSize(b);
            return sa.w * sa.h - sb.w * sb.h;
          });
        const target = containing[0];
        const targetFrameId = target ? parseFrameIdFromNodeId(target.id) : null;

        for (const fn of frameNodes) {
          const fid = parseFrameIdFromNodeId(fn.id);
          const members: string[] = fn.data?.frame?.memberEntityIds || [];
          const isMember = members.includes(tableId);
          if (targetFrameId === fid) {
            if (!isMember) {
              projectDispatch.addFrameMembers(moduleName, activeDiagramId, fid, [tableId]);
              const expanded = expandFrameBoundsToNodes(frameBound(fn), nodesForBounds([table]));
              projectDispatch.updateFrameBounds(moduleName, activeDiagramId, [
                { id: fid, ...expanded },
              ]);
            }
          } else if (isMember) {
            projectDispatch.removeFrameMembers(moduleName, activeDiagramId, fid, [tableId]);
          }
        }
      }
    },
    [projectDispatch, moduleName, activeDiagramId],
  );

  // 拖动结束 → 表写 layout；框写 groups；拖框按起始 Δ 平移成员（兜底，避免 onNodeDrag 被挡）
  const onNodeDragStop = useCallback(
    (_: any, node: Node, draggedNodes: Node[]) => {
      const origin = frameDragRef.current;
      const wasFrameDrag = !!(origin && origin.nodeId === node.id);
      // 第三参仅含拖动项；合并进全量 nodes 再持久化
      const byId = new Map(nodesRef.current.map((n) => [n.id, n]));
      draggedNodes.forEach((n) => byId.set(n.id, n));
      let persistNodes = [...byId.values()];
      if (wasFrameDrag && origin && (node.type === 'frame' || isFrameNodeId(node.id))) {
        const dx = node.position.x - origin.startX;
        const dy = node.position.y - origin.startY;
        if (dx !== 0 || dy !== 0) {
          let starts = origin.memberStarts;
          if (!Object.keys(starts).length) {
            const fid = parseFrameIdFromNodeId(node.id);
            const ids =
              (node.data?.frame as DiagramFrame | undefined)?.memberEntityIds ||
              frames.find((f) => f.id === fid)?.memberEntityIds ||
              [];
            starts = {};
            nodesRef.current.forEach((n) => {
              if (n.type === 'table' && ids.includes(n.id)) {
                starts[n.id] = { x: n.position.x - dx, y: n.position.y - dy };
              }
            });
          }
          persistNodes = persistNodes.map((n) => {
            const start = starts[n.id];
            if (!start) return n;
            return {
              ...n,
              position: { x: Math.round(start.x + dx), y: Math.round(start.y + dy) },
            };
          });
          setNodes(persistNodes);
        }
      }
      frameDragRef.current = null;

      const tables = persistNodes.filter((n) => n.type === 'table');
      const movedFrames = persistNodes.filter((n) => n.type === 'frame');
      if (tables.length) {
        projectDispatch.updateGraphCanvasLayout(
          moduleName,
          tables.map((n) => ({ id: n.id, position: n.position })),
          activeDiagramId,
        );
      }
      if (movedFrames.length) {
        projectDispatch.updateFrameBounds(
          moduleName,
          activeDiagramId,
          movedFrames.map((n) => {
            const { w, h } = frameNodeSize(n);
            return {
              id: parseFrameIdFromNodeId(n.id),
              x: n.position.x,
              y: n.position.y,
              w,
              h,
            };
          }),
        );
      }
      // 拖表（非拖框连带）时同步归属
      if (!wasFrameDrag && node.type === 'table') {
        syncTableFrameMembership(persistNodes, [node.id]);
      }
    },
    [projectDispatch, moduleName, activeDiagramId, syncTableFrameMembership, setNodes, frames],
  );

  const selectedTables = nodes.filter((n) => n.selected && n.type === 'table');
  const selectedCount = selectedTables.length;
  const selectedFrame = nodes.find((n) => n.selected && n.type === 'frame');

  const expandFrameForMembers = useCallback(
    (frameId: string, memberNodes: Node[]) => {
      const frameNode = nodes.find((n) => n.type === 'frame' && parseFrameIdFromNodeId(n.id) === frameId);
      const frameMeta = frames.find((f) => f.id === frameId);
      if (!frameMeta || !memberNodes.length) return;
      const size = frameNode ? frameNodeSize(frameNode) : { w: frameMeta.w, h: frameMeta.h };
      const expanded = expandFrameBoundsToNodes(
        {
          x: frameNode?.position.x ?? frameMeta.x,
          y: frameNode?.position.y ?? frameMeta.y,
          ...size,
        },
        nodesForBounds(memberNodes),
      );
      projectDispatch.updateFrameBounds(moduleName, activeDiagramId, [{ id: frameId, ...expanded }]);
    },
    [nodes, frames, projectDispatch, moduleName, activeDiagramId],
  );

  const onCreateFrame = useCallback(() => {
    const selected = nodes.filter((n) => n.selected && n.type === 'table');
    const memberEntityIds = selected.map((n) => n.id);
    const bounds = computeFrameBoundsFromNodes(nodesForBounds(selected));
    projectDispatch.createFrame(moduleName, activeDiagramId, {
      name: `分组${frames.length + 1}`,
      memberEntityIds,
      ...bounds,
    });
  }, [nodes, frames.length, projectDispatch, moduleName, activeDiagramId]);

  const onFitSelectedFrame = useCallback(() => {
    const frameNode = nodes.find((n) => n.selected && n.type === 'frame');
    if (!frameNode) {
      message.info('请先选中一个分组');
      return;
    }
    const frame = frameNode.data?.frame as DiagramFrame;
    const members = nodes.filter(
      (n) => n.type === 'table' && (frame.memberEntityIds || []).includes(n.id),
    );
    if (!members.length) {
      message.info('分组内还没有表，可拖表进入或点「加入分组」');
      return;
    }
    const bounds = computeFrameBoundsFromNodes(nodesForBounds(members));
    projectDispatch.updateFrameBounds(moduleName, activeDiagramId, [
      { id: frame.id, ...bounds },
    ]);
    message.success('已适应成员');
  }, [nodes, projectDispatch, moduleName, activeDiagramId]);

  const onAssignToFrame = useCallback(() => {
    const selected = nodes.filter((n) => n.selected && n.type === 'table');
    if (!selected.length) {
      message.info('请先选中要加入分组的表');
      return;
    }
    if (!frames.length) {
      message.info('请先新建分组');
      return;
    }
    const applyJoin = (frameId: string) => {
      projectDispatch.addFrameMembers(
        moduleName,
        activeDiagramId,
        frameId,
        selected.map((n) => n.id),
      );
      const frameMeta = frames.find((f) => f.id === frameId);
      const allMemberIds = new Set([
        ...(frameMeta?.memberEntityIds || []),
        ...selected.map((n) => n.id),
      ]);
      const memberNodes = nodes.filter((n) => n.type === 'table' && allMemberIds.has(n.id));
      expandFrameForMembers(frameId, memberNodes);
    };
    const selFrame = nodes.find((n) => n.selected && n.type === 'frame');
    if (selFrame) {
      applyJoin(parseFrameIdFromNodeId(selFrame.id));
      return;
    }
    if (frames.length === 1) {
      applyJoin(frames[0].id);
      return;
    }
    setFrameAssignModal({ frameId: frames[0].id });
  }, [nodes, frames, projectDispatch, moduleName, activeDiagramId, expandFrameForMembers]);

  // 多选对齐：仅表节点；以选中集的包围盒为基准，改坐标后持久化
  const alignSelected = useCallback((mode: 'left' | 'right' | 'top' | 'bottom' | 'hcenter' | 'vcenter') => {
    setNodes(prev => {
      const selected = prev.filter(n => n.selected && n.type === 'table');
      if (selected.length < 2) {
        message.info('请先选中至少两张表（Shift+点击或框选）');
        return prev;
      }
      const w = (n: Node) => n.width || 220;
      const h = (n: Node) => n.height || 80;
      const minX = Math.min(...selected.map(n => n.position.x));
      const maxR = Math.max(...selected.map(n => n.position.x + w(n)));
      const minY = Math.min(...selected.map(n => n.position.y));
      const maxB = Math.max(...selected.map(n => n.position.y + h(n)));
      const midX = (minX + maxR) / 2;
      const midY = (minY + maxB) / 2;
      const selectedIds = new Set(selected.map((n) => n.id));

      const next = prev.map(n => {
        if (!selectedIds.has(n.id)) {
          return n;
        }
        let { x, y } = n.position;
        if (mode === 'left') x = minX;
        if (mode === 'right') x = maxR - w(n);
        if (mode === 'top') y = minY;
        if (mode === 'bottom') y = maxB - h(n);
        if (mode === 'hcenter') x = midX - w(n) / 2;
        if (mode === 'vcenter') y = midY - h(n) / 2;
        return { ...n, position: { x: Math.round(x), y: Math.round(y) } };
      });
      projectDispatch.updateGraphCanvasLayout(
        moduleName,
        next.filter((n) => n.type === 'table').map(n => ({ id: n.id, position: n.position })),
        activeDiagramId,
      );
      return next;
    });
  }, [projectDispatch, moduleName, activeDiagramId, setNodes]);

  /** 拖连线进行中；成功 onConnect 置位，失败落点由 onConnectEnd 给反馈（取消空白处不打扰） */
  const connectAttemptRef = useRef<{ active: boolean; connected: boolean }>({
    active: false,
    connected: false,
  });

  const onConnectStart = useCallback(() => {
    connectAttemptRef.current = { active: true, connected: false };
  }, []);

  // 字段拖连线 → 建关联：from=外键侧（source），to=主键侧（target）；侧由几何择柄重绑
  const onConnect = useCallback(
    (connection: { source?: string | null; sourceHandle?: string | null; target?: string | null; targetHandle?: string | null }) => {
      connectAttemptRef.current.connected = true;
      const { source, sourceHandle, target, targetHandle } = connection;
      if (!source || !target || !sourceHandle || !targetHandle) {
        message.warning('连线未完成，请从外键字段拖到主键字段的接入点');
        return;
      }
      const fromH = parseFieldHandle(sourceHandle);
      const toH = parseFieldHandle(targetHandle);
      if (!fromH || fromH.role !== 'src' || !toH || toH.role !== 'tgt') {
        message.warning('请从外键字段实心锚点拖出，接到主键字段空心接入点');
        return;
      }
      projectDispatch.addAssociation(moduleEntity.module, {
        relation: DEFAULT_RELATION,
        from: { entity: source, field: fromH.field },
        to: { entity: target, field: toH.field },
      });
    },
    [projectDispatch, moduleEntity.module]
  );

  const onConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
    const attempt = connectAttemptRef.current;
    connectAttemptRef.current = { active: false, connected: false };
    if (!attempt.active || attempt.connected) {
      return;
    }
    // mouseup 的 target 常是 pane/连线层；用坐标判断是否落在表节点上（含被连线层盖住）
    const point =
      'changedTouches' in event
        ? { x: event.changedTouches[0]?.clientX, y: event.changedTouches[0]?.clientY }
        : { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY };
    if (point.x == null || point.y == null) {
      return;
    }
    const overNode = Array.from(document.querySelectorAll('.react-flow__node')).some((n) => {
      const r = n.getBoundingClientRect();
      return point.x >= r.left && point.x <= r.right && point.y >= r.top && point.y <= r.bottom;
    });
    if (!overNode) {
      return; // 空白处松开 = 取消
    }
    const el = document.elementFromPoint(point.x, point.y);
    if (el && typeof el.closest === 'function' && el.closest('.react-flow__handle')) {
      message.warning('请拖到目标字段的接入点（空心圆）；不能接到同类型锚点');
      return;
    }
    message.warning('请对准字段旁的接入点（空心圆）松开，才能建立关联');
  }, []);

  // 边变更：只保留选中态；忽略 RF 因 handle 失效产生的 remove（边列表由 associations 派生）。
  const onEdgesChange: OnEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdgeSelected(prev => {
      let next = prev;
      let changed = false;
      for (const c of changes) {
        if (c.type === 'select') {
          if (!changed) {
            next = { ...prev };
            changed = true;
          }
          next[c.id] = c.selected;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  // 用户 Delete/Backspace 删边 → 同步删关联（字段已改名导致的幽灵边不会走到这里）
  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      const liveJson = useProjectStore.getState().project?.projectJSON;
      const module = (liveJson?.modules || []).find((m: any) => m.name === moduleEntity.module);
      const entities: EntityData[] = module?.entities || [];
      deleted.forEach(e => {
        const fromH = parseFieldHandle(e.sourceHandle || '');
        const toH = parseFieldHandle(e.targetHandle || '');
        const fromField = fromH?.field || '';
        const toField = toH?.field || '';
        const fromEnt = entities.find(x => x.title === e.source || x.name === e.source);
        const toEnt = entities.find(x => x.title === e.target || x.name === e.target);
        const fromStill = (fromEnt?.fields || []).some(f => f.name === fromField);
        const toStill = (toEnt?.fields || []).some(f => f.name === toField);
        if (!fromStill || !toStill) {
          return;
        }
        projectDispatch.removeAssociation(moduleEntity.module, {
          from: { entity: e.source, field: fromField },
          to: { entity: e.target, field: toField },
        });
      });
      setEdgeSelected({});
    },
    [projectDispatch, moduleEntity.module]
  );

  // 空态 CTA：新建第一张表（智能默认名，创建即上图；改名留待表头内联编辑批次）
  const createFirstTable = useCallback(() => {
    const modules = projectJSON?.modules || [];
    let i = 1;
    let title = 'T_TABLE_1';
    while (modules.some((m: any) => (m.entities || []).some((e: any) => (e.title || e.name) === title))) {
      i += 1;
      title = `T_TABLE_${i}`;
    }
    // fields 留空由 addEntity 注入默认字段（主键等），建表即见结构
    projectDispatch.addEntity({ moduleName: moduleEntity.module, title, chnname: '' });
  }, [projectJSON, projectDispatch, moduleEntity.module]);

  // 一键 dagre 自动布局（仅表；Frame 坐标不动）
  const autoLayout = useCallback(() => {
    setNodes(prev => {
      const tables = prev.filter((n) => n.type === 'table');
      const rest = prev.filter((n) => n.type !== 'table');
      const entities = tables.map(n => n.data?.entity || { title: n.id });
      const associations = edges.map(e => ({
        from: { entity: e.source },
        to: { entity: e.target },
      }));
      const positions = dagrePositions(entities, associations);
      const nextTables = tables.map(n => ({ ...n, position: positions[n.id] || n.position }));
      projectDispatch.updateGraphCanvasLayout(
        moduleName,
        nextTables.map(n => ({ id: n.id, position: n.position })),
        activeDiagramId,
      );
      pendingFitRef.current = nextTables.length;
      return [...rest, ...nextTables];
    });
  }, [edges, projectDispatch, moduleName, activeDiagramId, setNodes]);

  // Cmd/Ctrl+Z 撤销，Cmd/Ctrl+Shift+Z 重做；Cmd/Ctrl+K 命令面板（输入框内不拦截）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if ((e.metaKey || e.ctrlKey) && e.key && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen(v => !v);
        return;
      }
      if (typing || cmdOpen) {
        return;
      }
      if (!(e.metaKey || e.ctrlKey) || !e.key || e.key.toLowerCase() !== 'z') {
        return;
      }
      e.preventDefault();
      if (e.shiftKey) {
        projectDispatch.redoCanvas();
      } else {
        projectDispatch.undoCanvas();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [projectDispatch, cmdOpen]);

  const cursorThrottleRef = useRef(0);

  // 切图 / 导入直开：有表则铺满首屏（与分享只读同密 padding）
  useEffect(() => {
    const entityCount = (currentModule?.entities || []).length;
    const key = `${moduleName}::${activeDiagramId}`;
    const switched = fitDiagramKeyRef.current !== key;
    fitDiagramKeyRef.current = key;
    if (entityCount === 0) {
      return;
    }
    if (switched) {
      scheduleFitView(entityCount);
    }
  }, [moduleName, activeDiagramId, currentModule, scheduleFitView]);

  // didAutoLayout / 一键布局：节点落盘后再 fit
  useEffect(() => {
    const n = pendingFitRef.current;
    if (n <= 0) {
      return;
    }
    pendingFitRef.current = 0;
    scheduleFitView(n);
  }, [nodes, scheduleFitView]);

  const onPointerMoveCursor = useCallback(
    (e: React.PointerEvent) => {
      const rf = rfRef.current;
      if (!rf) return;
      const now = Date.now();
      if (now - cursorThrottleRef.current < 50) return;
      cursorThrottleRef.current = now;
      const bounds = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const pos = rf.project({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });
      publishCursor(pos.x, pos.y);
    },
    [publishCursor],
  );

  // E2E：静默灌表 + 设视口（单次 setState，避免 N 次 toast）
  useEffect(() => {
    const w = window as Window & {
      __ERD_E2E__?: {
        ensureTables: (total: number) => number;
        setViewport: (vp: { x: number; y: number; zoom: number }) => void;
        getDiagramGroups: () => DiagramFrame[];
      };
    };
    w.__ERD_E2E__ = {
      getDiagramGroups: () => getActiveDiagramFrames(currentModule, activeDiagramId),
      ensureTables: (total: number) => {
        const state = useProjectStore.getState();
        const modName = moduleEntity.module;
        const project = state.project;
        const modules = project?.projectJSON?.modules || [];
        const modIdx = modules.findIndex((m: any) => m.name === modName);
        if (modIdx < 0) {
          return 0;
        }
        const current = modules[modIdx].entities || [];
        if (current.length >= total) {
          return current.length;
        }
        const defaultFields = JSON.parse(
          JSON.stringify(state.dispatch.getDefaultFields?.() || [])
        );
        const nextEntities = [...current];
        while (nextEntities.length < total) {
          const title = `T_LOAD_${nextEntities.length}`;
          nextEntities.push({
            title,
            name: title,
            chnname: '',
            fields: defaultFields,
            indexs: [],
          });
        }
        const nextModules = modules.map((m: any, i: number) =>
          i === modIdx ? { ...m, entities: nextEntities } : m
        );
        useProjectStore.setState({
          project: {
            ...project,
            projectJSON: {
              ...project.projectJSON,
              modules: nextModules,
            },
          },
        });
        return nextEntities.length;
      },
      setViewport: (vp) => {
        rfRef.current?.setViewport(vp, { duration: 0 });
      },
    };
    return () => {
      delete w.__ERD_E2E__;
    };
  }, [moduleEntity.module, currentModule, activeDiagramId]);

  const tableNodeCount = nodes.filter((n) => n.type === 'table').length;
  const cullViewport = tableNodeCount >= VIEWPORT_CULL_THRESHOLD;

  const commands: CommandItem[] = useMemo(() => [
    {
      id: 'new-table',
      title: '新建表',
      hint: '创建并立即上图',
      run: createFirstTable,
    },
    {
      id: 'auto-layout',
      title: '自动布局',
      hint: '按关联分层排布',
      run: autoLayout,
    },
    {
      id: 'align-left',
      title: '左对齐',
      hint: '选中 ≥2 张表',
      run: () => alignSelected('left'),
    },
    {
      id: 'align-top',
      title: '顶对齐',
      hint: '选中 ≥2 张表',
      run: () => alignSelected('top'),
    },
    {
      id: 'undo',
      title: '撤销',
      hint: '⌘Z',
      run: () => projectDispatch.undoCanvas(),
    },
    {
      id: 'redo',
      title: '重做',
      hint: '⌘⇧Z',
      run: () => projectDispatch.redoCanvas(),
    },
  ], [createFirstTable, autoLayout, alignSelected, projectDispatch]);

  return (
    <div
      className="erd-reactflow-container"
      data-testid="reactflow-canvas"
      data-node-total={tableNodeCount}
      data-viewport-cull={cullViewport ? '1' : '0'}
    >
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} commands={commands} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onConnectStart={onConnectStart}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onEdgesChange={onEdgesChange}
        onEdgesDelete={onEdgesDelete}
        onlyRenderVisibleElements={cullViewport}
        onInit={(instance) => {
          rfRef.current = instance;
        }}
        onPointerMove={onPointerMoveCursor}
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode="Shift"
        selectionOnDrag
        panOnDrag={[1, 2]}
        fitView
        // maxZoom 上限 1：空画布 fitView 对单个空节点可放大到 scale>2，
        // 后续节点增长后右侧节点连同字段手柄被推出画布可视区（连线手柄不可点，已实证）
        fitViewOptions={{ ...FIT_VIEW_INIT }}
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{ interactionWidth: EDGE_INTERACTION_WIDTH }}
        proOptions={{ hideAttribution: true }}
      >
        <ErdCrowFootMarkers />
        <Background gap={20} size={1} color={erdColors.line} />
        <ZhControls fitViewOptions={{ ...FIT_VIEW_SHAREABLE }} />
        {!isEmpty && (
          <MiniMap
            pannable
            zoomable
            ariaLabel="画布缩略图"
            nodeColor={erdColors.surface}
            nodeStrokeColor={erdColors.line}
            nodeStrokeWidth={1.5}
            maskColor={erdColors.inkA06}
            style={{ backgroundColor: erdColors.surfaceSunk }}
          />
        )}
        <CollabCursors />
        <Panel position="top-right">
          <div className="erd-canvas-toolbar">
            <span className="erd-diagram-switcher" data-testid="diagram-switcher">
              <Select
                size="small"
                value={activeDiagramId}
                onChange={switchDiagram}
                style={{ minWidth: 96 }}
                options={diagrams.map((d) => ({ value: d.id, label: d.name }))}
                popupMatchSelectWidth={false}
                getPopupContainer={() => document.body}
                // 仅挂 input/combobox，避免外层 div 与 search input 双 aria-label
                aria-label="切换关系图"
              />
              <button
                type="button"
                className="erd-canvas-tool"
                onClick={onCreateDiagram}
                title="新建关系图"
                aria-label="新建关系图"
              >
                新建图
              </button>
              <button
                type="button"
                className="erd-canvas-tool"
                onClick={onRenameDiagram}
                title="重命名当前关系图"
                aria-label="重命名关系图"
              >
                重命名
              </button>
            </span>
            <button
              type="button"
              className="erd-canvas-tool"
              data-testid="canvas-create-table"
              onClick={createFirstTable}
              title="新建表并立即上图"
              aria-label="新建表"
            >
              新建表
            </button>
            <button
              type="button"
              className="erd-canvas-tool"
              data-testid="create-frame"
              onClick={onCreateFrame}
              title="新建分组（可选先选中表）"
              aria-label="新建分组"
            >
              新建分组
            </button>
            <button
              type="button"
              className="erd-canvas-tool"
              data-testid="assign-frame"
              onClick={onAssignToFrame}
              title="将选中表加入分组（框自动扩边）"
              aria-label="加入分组"
            >
              加入分组
            </button>
            {selectedFrame && (
              <button
                type="button"
                className="erd-canvas-tool"
                data-testid="fit-frame"
                onClick={onFitSelectedFrame}
                title="按成员表包围盒调整分组大小"
                aria-label="适应成员"
              >
                适应成员
              </button>
            )}
            <button
              type="button"
              className="erd-canvas-tool"
              onClick={() => setCmdOpen(true)}
              title="命令面板 (Cmd/Ctrl+K)"
              aria-label="命令"
            >
              命令
            </button>
            <button
              type="button"
              className="erd-canvas-tool"
              onClick={() => projectDispatch.undoCanvas()}
              title="撤销 (Cmd/Ctrl+Z)"
              aria-label="撤销"
            >
              撤销
            </button>
            <button
              type="button"
              className="erd-canvas-tool"
              onClick={() => projectDispatch.redoCanvas()}
              title="重做 (Cmd/Ctrl+Shift+Z)"
              aria-label="重做"
            >
              重做
            </button>
            <button
              type="button"
              className="erd-canvas-tool erd-canvas-tool--primary"
              onClick={autoLayout}
              title="按关联关系自动排布全部表"
              aria-label="自动布局"
            >
              自动布局
            </button>
            {selectedCount >= 2 && (
              <span className="erd-align-group" role="group" aria-label="对齐">
                <button
                  type="button"
                  className="erd-canvas-tool"
                  data-testid="align-left"
                  onClick={() => alignSelected('left')}
                  title="左对齐"
                  aria-label="左对齐"
                >
                  左齐
                </button>
                <button
                  type="button"
                  className="erd-canvas-tool"
                  onClick={() => alignSelected('hcenter')}
                  title="水平居中"
                  aria-label="水平居中"
                >
                  水平中
                </button>
                <button
                  type="button"
                  className="erd-canvas-tool"
                  onClick={() => alignSelected('right')}
                  title="右对齐"
                  aria-label="右对齐"
                >
                  右齐
                </button>
                <button
                  type="button"
                  className="erd-canvas-tool"
                  data-testid="align-top"
                  onClick={() => alignSelected('top')}
                  title="顶对齐"
                  aria-label="顶对齐"
                >
                  顶齐
                </button>
                <button
                  type="button"
                  className="erd-canvas-tool"
                  onClick={() => alignSelected('vcenter')}
                  title="垂直居中"
                  aria-label="垂直居中"
                >
                  垂直中
                </button>
                <button
                  type="button"
                  className="erd-canvas-tool"
                  onClick={() => alignSelected('bottom')}
                  title="底对齐"
                  aria-label="底对齐"
                >
                  底齐
                </button>
              </span>
            )}
          </div>
        </Panel>
        {isEmpty && (
          <Panel position="top-center" className="erd-empty-panel">
            <div className="erd-empty-cta" data-testid="canvas-empty-state">
              <ErdEmptyDiagram size="compact" />
              <div className="erd-empty-title">开始你的第一张关系图</div>
              <div className="erd-empty-desc">一张表即可上图；也可导入或逆向</div>
              <button
                type="button"
                className="erd-empty-button nodrag"
                data-testid="canvas-empty-create"
                aria-label="新建第一张表"
                onClick={createFirstTable}
              >
                + 新建第一张表
              </button>
              <div className="erd-empty-links">
                <button
                  type="button"
                  className="erd-empty-secondary nodrag"
                  data-testid="canvas-empty-import-dbml"
                  aria-label="导入 DBML"
                  onClick={() => setDbmlImportOpen(true)}
                >
                  导入 DBML
                </button>
                <span className="erd-empty-links-sep" aria-hidden="true">
                  ·
                </span>
                <button
                  type="button"
                  className="erd-empty-secondary nodrag"
                  data-testid="canvas-empty-reverse"
                  aria-label="从数据源逆向"
                  onClick={() => history.push('/design/table/import/reverse')}
                >
                  从数据源逆向
                </button>
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
      <ReverseDBML
        hideTrigger
        open={dbmlImportOpen}
        onOpenChange={setDbmlImportOpen}
      />
      <Modal
        title={diagramModal?.mode === 'rename' ? '重命名关系图' : '新建关系图'}
        open={!!diagramModal}
        onOk={onDiagramModalOk}
        onCancel={() => setDiagramModal(null)}
        okText={diagramModal?.mode === 'rename' ? '保存' : '创建'}
        cancelText="取消"
        destroyOnClose
        okButtonProps={{ 'data-testid': 'diagram-modal-ok' } as any}
      >
        <Input
          aria-label="关系图名称"
          placeholder="例如：鉴权域"
          value={diagramModal?.name || ''}
          onChange={(e) =>
            setDiagramModal((prev) => (prev ? { ...prev, name: e.target.value } : prev))
          }
          onPressEnter={onDiagramModalOk}
        />
      </Modal>
      <Modal
        title="加入分组"
        open={!!frameAssignModal}
        onOk={() => {
          if (!frameAssignModal) return;
          const selected = nodes.filter((n) => n.selected && n.type === 'table');
          const frameId = frameAssignModal.frameId;
          projectDispatch.addFrameMembers(
            moduleName,
            activeDiagramId,
            frameId,
            selected.map((n) => n.id),
          );
          const frameMeta = frames.find((f) => f.id === frameId);
          const allMemberIds = new Set([
            ...(frameMeta?.memberEntityIds || []),
            ...selected.map((n) => n.id),
          ]);
          const memberNodes = nodes.filter((n) => n.type === 'table' && allMemberIds.has(n.id));
          expandFrameForMembers(frameId, memberNodes);
          setFrameAssignModal(null);
        }}
        onCancel={() => setFrameAssignModal(null)}
        okText="加入"
        cancelText="取消"
        destroyOnClose
        okButtonProps={{ 'data-testid': 'frame-assign-ok' } as any}
      >
        <Select
          aria-label="选择分组"
          style={{ width: '100%' }}
          value={frameAssignModal?.frameId}
          onChange={(id) => setFrameAssignModal({ frameId: id })}
          options={frames.map((f) => ({ value: f.id, label: f.name }))}
          getPopupContainer={() => document.body}
        />
      </Modal>
    </div>
  );
};

export default ReactFlowRelation;
