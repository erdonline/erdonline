import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  Handle,
  Position,
  NodeProps,
  Edge,
  Node,
  useNodesState,
  useUpdateNodeInternals,
  applyNodeChanges,
  OnNodesChange,
  OnEdgesChange,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import useProjectStore from '@/store/project/useProjectStore';
import useGlobalStore from '@/store/global/globalStore';
import { ModuleEntity } from '@/store/tab/useTabStore';
import { message } from 'antd';
import shallow from 'zustand/shallow';
import CommandPalette, { CommandItem } from './CommandPalette';
import './reactflow-relation.scss';

/**
 * ReactFlow 关系图（ADR-0001 绞杀者策略）
 *
 * 核心设计决策（区别于旧 g6 的致命缺陷）：
 * **实体即节点**——module.entities 全集即画布节点，创建即上图；
 * graphCanvas 只存布局（坐标），无坐标节点自动网格布局。
 * R2：节点即编辑器——字段的增/改/删全部在节点上内联完成，
 * 不再跳转「双击开标签页 + handsontable」的 4 步长链路。
 */

type FieldData = {
  name: string;
  type?: string;
  chnname?: string;
  pk?: boolean;
  notNull?: boolean;
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

/** associations → ReactFlow edges（字段级 handle） */
function associationsToEdges(associations: Association[]): Edge[] {
  return (associations || [])
    .filter(a => a?.from?.entity && a?.from?.field && a?.to?.entity && a?.to?.field)
    .map((a, i) => ({
      id: `e-${a.from!.entity}-${a.from!.field}-${a.to!.entity}-${a.to!.field}-${i}`,
      source: a.from!.entity!,
      sourceHandle: `${a.from!.field}-src`,
      target: a.to!.entity!,
      targetHandle: `${a.to!.field}-tgt`,
      label: a.relation || '',
      labelStyle: { fontSize: 10 },
      animated: false,
    }));
}

const FIELD_TYPES = ['IdOrKey', 'String', 'Integer', 'Decimal', 'Boolean', 'DateTime', 'Text'];

/** 行内编辑状态：editing === 字段名（改名）| '__NEW__'（新增）| null */
type EditingState = { key: string; name: string; type: string; pk: boolean } | null;

/** 表节点：字段级 Handle + 内联字段编辑（增/改/删）+ 表头改名 */
const TableNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const entity: EntityData = data.entity;
  const onFieldsChange: (fields: FieldData[]) => void = data.onFieldsChange;
  const onRename: (newTitle: string) => void = data.onRename;
  const updateNodeInternals = useUpdateNodeInternals();
  const [editing, setEditing] = useState<EditingState>(null);
  const [headerEditing, setHeaderEditing] = useState(false);
  const [headerName, setHeaderName] = useState(entity.title);
  const fields = (entity.fields || []).filter(f => !f.relationNoShow);
  const handleSignature = fields.map(f => f.name).join('\0');
  // Enter 提交后 blur 会再进一次 commit；用 ref 保证只落地一次，避免二次提交用陈旧 fields 把刚改名的字段「删掉」并清关联
  const editingRef = useRef<EditingState>(null);
  editingRef.current = editing;
  const entityFieldsRef = useRef(entity.fields || []);
  entityFieldsRef.current = entity.fields || [];

  useEffect(() => {
    setHeaderName(entity.title);
  }, [entity.title]);

  // 字段增删改名会增删 Handle；必须通知 RF 重算锚点，否则边有 association 却不渲染
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, handleSignature, updateNodeInternals]);

  const commit = () => {
    const current = editingRef.current;
    if (!current) {
      return;
    }
    editingRef.current = null;
    const name = current.name.trim();
    if (!name) {
      setEditing(null);
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
    if (current.key === '__NEW__') {
      // IdOrKey 默认主键：建模直觉（新建 ID 字段几乎总是 PK）
      const pk = current.pk || current.type === 'IdOrKey';
      onFieldsChange([...allFields, {
        name, type: current.type, chnname: '', remark: '', pk, notNull: pk,
      } as FieldData]);
    } else {
      onFieldsChange(allFields.map(f => (
        f.name === current.key ? { ...f, name, type: current.type, pk: current.pk, notNull: current.pk || f.notNull } : f
      )));
    }
    setEditing(null);
  };

  const removeField = (fieldName: string) => {
    onFieldsChange((entity.fields || []).filter(f => f.name !== fieldName));
  };

  const togglePk = (fieldName: string) => {
    onFieldsChange((entity.fields || []).map(f => (
      f.name === fieldName ? { ...f, pk: !f.pk, notNull: !f.pk ? true : f.notNull } : f
    )));
  };

  const commitHeader = () => {
    const name = headerName.trim();
    if (!name || name === entity.title) {
      setHeaderEditing(false);
      setHeaderName(entity.title);
      return;
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      message.warning('表名仅支持字母、数字、下划线，且以字母或下划线开头');
      setHeaderName(entity.title);
      setHeaderEditing(false);
      return;
    }
    onRename(name);
    setHeaderEditing(false);
  };

  const editRow = (key: string) => (
    <div className="erd-field-row erd-field-editing nodrag">
      <label className="erd-field-pk-toggle" title="主键">
        <input
          type="checkbox"
          checked={!!editing?.pk}
          onChange={e => setEditing(prev => (prev ? { ...prev, pk: e.target.checked } : prev))}
          onKeyDown={e => e.stopPropagation()}
        />
        PK
      </label>
      <input
        className="erd-field-input"
        autoFocus
        placeholder="字段名"
        value={editing?.name ?? ''}
        onChange={e => setEditing(prev => (prev ? { ...prev, name: e.target.value } : prev))}
        onKeyDown={e => {
          e.stopPropagation();
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(null);
        }}
        onBlur={e => {
          // 焦点移到同行控件时不提交，避免「改类型/勾 PK」误触发空名 commit
          const next = e.relatedTarget as HTMLElement | null;
          if (next && next.closest('.erd-field-editing')) {
            return;
          }
          commit();
        }}
      />
      <select
        className="erd-field-type-select"
        value={editing?.type ?? 'String'}
        onChange={e => setEditing(prev => (prev ? { ...prev, type: e.target.value } : prev))}
        onKeyDown={e => e.stopPropagation()}
        onBlur={e => {
          const next = e.relatedTarget as HTMLElement | null;
          if (next && next.closest('.erd-field-editing')) {
            return;
          }
          commit();
        }}
      >
        {FIELD_TYPES.map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
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
        title="选中后再点表名，或双击，可修改表名"
      >
        {headerEditing ? (
          <input
            className="erd-header-input"
            autoFocus
            value={headerName}
            onChange={e => setHeaderName(e.target.value)}
            onKeyDown={e => {
              e.stopPropagation();
              if (e.key === 'Enter') commitHeader();
              if (e.key === 'Escape') {
                setHeaderName(entity.title);
                setHeaderEditing(false);
              }
            }}
            onBlur={e => {
              // 焦点仍在表头内（极少见）时不提交
              const next = e.relatedTarget as HTMLElement | null;
              if (next && next.closest('.erd-table-header')) {
                return;
              }
              commitHeader();
            }}
          />
        ) : (
          <>
            <span className="erd-table-title">{entity.title}</span>
            {entity.chnname && <span className="erd-table-chnname">{entity.chnname}</span>}
            <button
              type="button"
              className="erd-header-edit nodrag nopan"
              title="修改表名"
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
              className="erd-field-row"
              onDoubleClick={() => setEditing({ key: f.name, name: f.name, type: f.type || 'String', pk: !!f.pk })}
              title="双击编辑字段"
              data-field={f.name}
            >
              <Handle type="target" id={`${f.name}-tgt`} position={Position.Left} className="erd-field-handle" />
              <span className="erd-field-name">
                <span
                  className={`erd-pk-badge nodrag${f.pk ? ' active' : ' inactive'}`}
                  title={f.pk ? '取消主键' : '设为主键'}
                  onClick={e => {
                    e.stopPropagation();
                    togglePk(f.name);
                  }}
                >
                  PK
                </span>
                {f.name}
                {f.chnname ? <span className="erd-field-chnname"> {f.chnname}</span> : null}
              </span>
              <span className="erd-field-type">{f.type}</span>
              <span
                className="erd-field-delete nodrag"
                title="删除字段"
                onClick={e => {
                  e.stopPropagation();
                  removeField(f.name);
                }}
              >
                ×
              </span>
              <Handle type="source" id={`${f.name}-src`} position={Position.Right} className="erd-field-handle" />
            </div>
          )
        )}
        {editing?.key === '__NEW__' && editRow('__NEW__')}
        {editing === null && (
          <div
            className="erd-field-add nodrag"
            onClick={() => setEditing({ key: '__NEW__', name: '', type: 'String', pk: false })}
          >
            + 添加字段
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes = { table: TableNode };

/** 无坐标节点自动网格布局（兜底；dagre 布局为主） */
function gridPosition(index: number) {
  const col = index % 4;
  const row = Math.floor(index / 4);
  return { x: 60 + col * 300, y: 60 + row * 260 };
}

const NODE_WIDTH = 240;
const nodeHeight = (entity?: EntityData) => 52 + Math.max((entity?.fields || []).filter(f => !f.relationNoShow).length, 1) * 28 + 36;

/** dagre 分层布局（LR），返回 {id: {x, y}}（左上角坐标） */
function dagreLayout(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 140, marginx: 40, marginy: 40 });
  g.setDefaultEdgeLabel(() => ({}));
  nodes.forEach(n => {
    const h = nodeHeight(n.data?.entity);
    g.setNode(n.id, { width: NODE_WIDTH, height: h });
  });
  edges.forEach(e => g.setEdge(e.source, e.target));
  dagre.layout(g);
  const positions: Record<string, { x: number; y: number }> = {};
  nodes.forEach(n => {
    const d = g.node(n.id);
    positions[n.id] = { x: d.x - NODE_WIDTH / 2, y: d.y - nodeHeight(n.data?.entity) / 2 };
  });
  return positions;
}

export type ReactFlowRelationProps = {
  moduleEntity: ModuleEntity;
};

const ReactFlowRelation: React.FC<ReactFlowRelationProps> = ({ moduleEntity }) => {
  const projectJSON = useProjectStore(state => state.project?.projectJSON);
  const projectDispatch = useProjectStore(state => state.dispatch);
  const { saved, saving } = useGlobalStore(
    (s) => ({ saved: s.saved, saving: s.saving }),
    shallow,
  );
  const [nodes, setNodes] = useNodesState([]);
  /** 边选中态（本地）；边列表本身始终从 associations 派生，避免 RF 因 handle 失效清空本地 edges */
  const [edgeSelected, setEdgeSelected] = useState<Record<string, boolean>>({});
  const [isEmpty, setIsEmpty] = useState(true);
  const [cmdOpen, setCmdOpen] = useState(false);

  const saveLabel = saving ? '保存中…' : saved ? '已保存' : '未保存';
  const saveTone = saving ? 'saving' : saved ? 'saved' : 'dirty';

  const edges: Edge[] = useMemo(() => {
    const module = (projectJSON?.modules || []).find((m: any) => m.name === moduleEntity.module);
    return associationsToEdges(module?.associations || []).map(e => ({
      ...e,
      selected: !!edgeSelected[e.id],
    }));
  }, [projectJSON, moduleEntity.module, edgeSelected]);

  // 实体/坐标 → 节点。实体即节点：entities 全集渲染，位置优先级
  // graphCanvas 坐标 > 现有画布位置 > 网格自动布局（拖动持久化后 saved==local，无跳变）
  useEffect(() => {
    const module = (projectJSON?.modules || []).find((m: any) => m.name === moduleEntity.module);
    const entities: EntityData[] = module?.entities || [];
    const savedNodes: any[] = module?.graphCanvas?.nodes || [];
    setIsEmpty(entities.length === 0);

    // 旧 g6 坐标复用：node.title 形如 "ENTITY:..."，按首段匹配实体
    const posOf = (title: string) => {
      const saved = savedNodes.filter(n => (n.title || '').split(':')[0] === title)[0];
      return saved && typeof saved.x === 'number' ? { x: saved.x, y: saved.y } : null;
    };

    setNodes(prev =>
      entities.map((entity, i) => {
        const live = prev.find(n => n.id === entity.title);
        return {
          id: entity.title,
          type: 'table',
          position: posOf(entity.title) || live?.position || gridPosition(i),
          data: {
            entity,
            onFieldsChange: (newFields: FieldData[]) =>
              projectDispatch.updateEntityFields(moduleEntity.module, entity.title, newFields),
            onRename: (newTitle: string) =>
              projectDispatch.renameEntity({
                oldModuleName: moduleEntity.module,
                newModuleName: moduleEntity.module,
                oldTitle: entity.title,
                newTitle,
                newChnname: entity.chnname || '',
              }),
          },
          // 重建必须保留交互态（selected），否则点击选中立即被重建抹掉（已实证）
          selected: live?.selected,
        } as Node;
      })
    );
  }, [projectJSON, moduleEntity.module, setNodes, projectDispatch]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // 画布上禁止按键删节点：实体即节点，删节点=删表（破坏性），不能交给一次误按。
      // 表的删除统一走左侧模型树（有上下文、可回收），此处拦截并提示
      const nodeRemoved = changes.some(c => c.type === 'remove');
      if (nodeRemoved) {
        message.info('数据表的删除请在左侧模型树中操作');
      }
      const safe = changes.filter(c => c.type !== 'remove');
      setNodes(prev => applyNodeChanges(safe, prev));
    },
    [setNodes]
  );

  // 拖动结束 → 布局持久化（含多选拖动：第三个参数为全部节点当前坐标）
  const onNodeDragStop = useCallback(
    (_: any, __: Node, allNodes: Node[]) => {
      projectDispatch.updateGraphCanvasLayout(
        moduleEntity.module,
        allNodes.map(n => ({ id: n.id, position: n.position }))
      );
    },
    [projectDispatch, moduleEntity.module]
  );

  const selectedCount = nodes.filter(n => n.selected).length;

  // 多选对齐：以选中集的包围盒为基准，改坐标后持久化
  const alignSelected = useCallback((mode: 'left' | 'right' | 'top' | 'bottom' | 'hcenter' | 'vcenter') => {
    setNodes(prev => {
      const selected = prev.filter(n => n.selected);
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

      const next = prev.map(n => {
        if (!n.selected) {
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
        moduleEntity.module,
        next.map(n => ({ id: n.id, position: n.position }))
      );
      return next;
    });
  }, [projectDispatch, moduleEntity.module, setNodes]);

  // 字段拖连线 → 建关联：from=外键侧（source 右锚点），to=主键侧（target 左锚点）
  const onConnect = useCallback(
    (connection: { source?: string | null; sourceHandle?: string | null; target?: string | null; targetHandle?: string | null }) => {
      const { source, sourceHandle, target, targetHandle } = connection;
      if (!source || !target || !sourceHandle || !targetHandle) {
        return;
      }
      projectDispatch.addAssociation(moduleEntity.module, {
        relation: '0,n:1',
        from: { entity: source, field: sourceHandle.replace(/-src$/, '') },
        to: { entity: target, field: targetHandle.replace(/-tgt$/, '') },
      });
    },
    [projectDispatch, moduleEntity.module]
  );

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
        const fromField = (e.sourceHandle || '').replace(/-src$/, '');
        const toField = (e.targetHandle || '').replace(/-tgt$/, '');
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

  // 一键 dagre 自动布局（布局即持久化）
  const autoLayout = useCallback(() => {
    setNodes(prev => {
      const positions = dagreLayout(prev, edges);
      const next = prev.map(n => ({ ...n, position: positions[n.id] || n.position }));
      projectDispatch.updateGraphCanvasLayout(
        moduleEntity.module,
        next.map(n => ({ id: n.id, position: n.position }))
      );
      return next;
    });
  }, [edges, projectDispatch, moduleEntity.module, setNodes]);

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
    <div className="erd-reactflow-container">
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} commands={commands} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onEdgesChange={onEdgesChange}
        onEdgesDelete={onEdgesDelete}
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode="Shift"
        selectionOnDrag
        panOnDrag={[1, 2]}
        fitView
        // maxZoom 上限 1：空画布 fitView 对单个空节点可放大到 scale>2，
        // 后续节点增长后右侧节点连同字段手柄被推出画布可视区（连线手柄不可点，已实证）
        fitViewOptions={{ maxZoom: 1, padding: 0.15 }}
        minZoom={0.2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} />
        <Controls />
        <MiniMap pannable zoomable />
        <Panel position="top-right">
          <div className="erd-canvas-toolbar">
            <span
              className={`erd-save-status erd-save-status--${saveTone}`}
              data-testid="save-status"
              title="模型变更会自动保存到服务器"
            >
              {saveLabel}
            </span>
            <button className="erd-canvas-tool" onClick={() => setCmdOpen(true)} title="命令面板 (Cmd/Ctrl+K)">
              命令
            </button>
            <button className="erd-canvas-tool" onClick={() => projectDispatch.undoCanvas()} title="撤销 (Cmd/Ctrl+Z)">
              撤销
            </button>
            <button className="erd-canvas-tool" onClick={() => projectDispatch.redoCanvas()} title="重做 (Cmd/Ctrl+Shift+Z)">
              重做
            </button>
            <button className="erd-canvas-tool" onClick={autoLayout} title="按关联关系自动排布全部表">
              自动布局
            </button>
            {selectedCount >= 2 && (
              <span className="erd-align-group" role="group" aria-label="对齐">
                <button className="erd-canvas-tool" data-testid="align-left" onClick={() => alignSelected('left')} title="左对齐">
                  左齐
                </button>
                <button className="erd-canvas-tool" onClick={() => alignSelected('hcenter')} title="水平居中">
                  水平中
                </button>
                <button className="erd-canvas-tool" onClick={() => alignSelected('right')} title="右对齐">
                  右齐
                </button>
                <button className="erd-canvas-tool" data-testid="align-top" onClick={() => alignSelected('top')} title="顶对齐">
                  顶齐
                </button>
                <button className="erd-canvas-tool" onClick={() => alignSelected('vcenter')} title="垂直居中">
                  垂直中
                </button>
                <button className="erd-canvas-tool" onClick={() => alignSelected('bottom')} title="底对齐">
                  底齐
                </button>
              </span>
            )}
          </div>
        </Panel>
        {isEmpty && (
          <Panel position="top-center">
            <div className="erd-empty-cta">
              <div className="erd-empty-title">画布还是空的</div>
              <div className="erd-empty-desc">创建第一张表，立即上图建模</div>
              <button className="erd-empty-button nodrag" onClick={createFirstTable}>
                + 新建第一张表
              </button>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

export default ReactFlowRelation;
