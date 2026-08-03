import React, { useEffect, useRef, useState } from 'react';
import 'handsontable/dist/handsontable.full.css';
import "handsontable/languages/zh-CN";
import useProjectStore from "@/store/project/useProjectStore";
import {ModuleEntity} from "@/store/tab/useTabStore";
import JExcel from "@/pages/JExcel";
import { Button, Empty, Space, message } from 'antd';
import { confirmDestructive } from '@/utils/destructiveConfirm';
import {
  formatIndexFieldsCell,
  parseIndexFieldsCell,
} from './indexFieldsCell';

export type TableIndexEditProps = {
  moduleEntity: ModuleEntity
};

type IndexRow = {
  name?: string;
  fields?: string | string[];
  isUnique?: boolean;
  /** 部分/过滤索引谓词（PG WHERE / SQL Server filter_definition） */
  filter?: string;
};

const indexNameBase = (entity: { title?: string; name?: string }) =>
  String(entity.title || entity.name || 'T').replace(/\W+/g, '_');

const nextIndexName = (base: string, existing: IndexRow[]) => {
  const names = new Set(existing.map((i) => i.name).filter(Boolean));
  let n = existing.length + 1;
  while (names.has(`${base}_IDX${n}`)) n += 1;
  return `${base}_IDX${n}`;
};

const firstFieldName = (entity: { fields?: { name?: string }[] }) =>
  entity.fields?.find((f) => f?.name)?.name;

const TableIndexEdit: React.FC<TableIndexEditProps> = (props) => {
  const { module, entity: entityName } = props.moduleEntity;
  const {entity, projectDispatch, currentModule} = useProjectStore(state => ({
    entity: state.project?.projectJSON?.modules[state.currentModuleIndex || 0].entities[state.currentEntityIndex || 0],
    projectDispatch: state.dispatch,
    currentModule: state.currentModule,
  }));

  const indexs: IndexRow[] = Array.isArray(entity?.indexs) ? entity.indexs : [];
  const hasIndexes = indexs.length > 0;
  /** 无字段可绑定时仅展开空表，不写库 */
  const [started, setStarted] = useState(false);
  /** 落盘失败时重挂 JExcel（组件不吃 props.data），回滚到 store 快照 */
  const [sheetEpoch, setSheetEpoch] = useState(0);
  const [indexSaving, setIndexSaving] = useState(false);
  const pendingRef = useRef<IndexRow[] | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    setStarted(false);
    setSheetEpoch(0);
    pendingRef.current = null;
  }, [module, entityName]);

  const columnNames = (entity?.fields?.map((f: { name?: string }) => f.name).filter(Boolean) ||
    []) as string[];
  const entityTitle = entity?.title || entity?.name;

  const normalizePayload = (payload: IndexRow[]): IndexRow[] =>
    payload.map((m) => {
      const filter =
        typeof m.filter === 'string' && m.filter.trim() ? m.filter.trim() : undefined;
      return {
        name: m.name,
        isUnique: !!m.isUnique,
        fields: parseIndexFieldsCell(m.fields),
        ...(filter ? { filter } : {}),
      };
    });

  /**
   * 禁止本地 mutate 即成功：队列最新 payload，仅 saveProject code===200 写 store；
   * 失败 toast（persistProjectNow）+ 重挂网格回滚草稿。
   */
  const flushPersist = async () => {
    if (savingRef.current) return;
    if (!currentModule || !entity || !entityTitle) return;
    const payload = pendingRef.current;
    if (!payload) return;
    pendingRef.current = null;
    savingRef.current = true;
    setIndexSaving(true);
    try {
      const ok = await Promise.resolve(
        projectDispatch.updateEntityIndex(
          currentModule,
          entityTitle,
          payload,
          { persist: true },
        ),
      );
      if (!ok) {
        pendingRef.current = null;
        setSheetEpoch((e) => e + 1);
        return;
      }
    } catch {
      message.error('索引保存失败');
      pendingRef.current = null;
      setSheetEpoch((e) => e + 1);
    } finally {
      savingRef.current = false;
      setIndexSaving(false);
      if (pendingRef.current) {
        void flushPersist();
      }
    }
  };

  const afterChange = (payload: IndexRow[]) => {
    if (!currentModule || !entity) {
      console.error('当前模块或实体未定义');
      return;
    }
    pendingRef.current = normalizePayload(payload);
    void flushPersist();
  };

  const persistIndex = async (payload: IndexRow[]): Promise<boolean> => {
    if (!currentModule || !entity || !entityTitle) {
      console.error('当前模块或实体未定义');
      return false;
    }
    try {
      const ok = await Promise.resolve(
        projectDispatch.updateEntityIndex(
          currentModule,
          entityTitle,
          payload,
          { persist: true },
        ),
      );
      return !!ok;
    } catch {
      message.error('索引保存失败');
      return false;
    }
  };

  const seedIndex = async (existing: IndexRow[], isUnique: boolean): Promise<boolean> => {
    if (!currentModule || !entity || !entityTitle) {
      setStarted(true);
      return false;
    }
    const fieldName = firstFieldName(entity);
    if (!fieldName) {
      setStarted(true);
      return false;
    }
    if (savingRef.current) return false;
    const base = indexNameBase(entity);
    const payload: IndexRow[] = [
      ...existing,
      {
        name: nextIndexName(base, existing),
        fields: [fieldName],
        isUnique,
      },
    ];
    savingRef.current = true;
    setIndexSaving(true);
    try {
      return await persistIndex(payload);
    } finally {
      savingRef.current = false;
      setIndexSaving(false);
    }
  };

  const addFirstIndex = () => {
    void seedIndex([], false);
  };

  /** 字段唯一 = 唯一索引；空态明确 CTA，勿藏在「是否唯一」勾选里 */
  const addFirstUniqueIndex = () => {
    void seedIndex([], true);
  };

  /** 已有索引后表内明确 CTA；勿只靠 JExcel 工具栏「+」图标（无文案死 affordance） */
  const addAnotherIndex = (isUnique = false) => {
    if (!firstFieldName(entity || {})) {
      message.warning('请先添加字段再创建索引');
      return;
    }
    void seedIndex(indexs, isUnique);
  };

  /** 破坏性：表内明确「删除」+ Modal 二次确认；勿只靠 JExcel 工具栏无确认 remove */
  const confirmDeleteIndex = (rowIndex: number) => {
    if (!currentModule || !entity || !entityTitle) {
      message.error('当前模块或实体未定义');
      return;
    }
    const target = indexs[rowIndex];
    const indexName = target?.name || `第 ${rowIndex + 1} 条`;
    confirmDestructive({
      title: `确定删除索引 "${indexName}" 吗?`,
      content: '此操作不可逆，请谨慎操作。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        const next = indexs.filter((_, i) => i !== rowIndex);
        const ok = await persistIndex(next);
        if (!ok) {
          return Promise.reject(new Error('索引删除落盘失败'));
        }
      },
    });
  };

  if (!hasIndexes && !started) {
    return (
      <div
        data-testid="table-index-edit"
        className="erd-table-index-empty"
        aria-busy={indexSaving || undefined}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span data-testid="index-unique-hint">
              还没有索引。字段唯一约束请在此创建唯一索引（勾选「是否唯一」）
            </span>
          }
        >
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Button
              type="primary"
              size="small"
              data-testid="index-empty-add"
              aria-label="添加第一个索引"
              loading={indexSaving}
              disabled={indexSaving}
              onClick={addFirstIndex}
            >
              添加第一个索引
            </Button>
            <Button
              type="link"
              size="small"
              data-testid="index-empty-add-unique"
              aria-label="添加唯一索引"
              loading={indexSaving}
              disabled={indexSaving}
              onClick={addFirstUniqueIndex}
            >
              添加唯一索引
            </Button>
          </Space>
        </Empty>
      </div>
    );
  }

  const data = (hasIndexes ? indexs : [{} as IndexRow]).map((row) => ({
    ...JSON.parse(JSON.stringify(row)),
    fields: formatIndexFieldsCell(row.fields),
  }));
  const columns = [
    {
      title: '索引名*',
      name: 'name',
      type: 'text',
      width: document.body.clientWidth * 0.2,
    },
    {
      // 文本格：列名与表达式可混写（分号分隔）；禁 dropdown 丢掉 LOWER(email) 等
      title: '字段/表达式*',
      name: 'fields',
      type: 'text',
      width: document.body.clientWidth * 0.35,
    },
    {
      title: '是否唯一',
      name: 'isUnique',
      type: 'checkbox',
      width: document.body.clientWidth * 0.1,
    },
    {
      // 部分/过滤索引谓词原样（PG WHERE / SQL Server filter_definition）；无则为空
      title: '过滤条件',
      name: 'filter',
      type: 'text',
      width: document.body.clientWidth * 0.2,
    },
  ];

  const sheetKey = `index-grid-${module}-${entityName}-${indexs.length}-${sheetEpoch}`;
  const columnHint =
    columnNames.length > 0
      ? `可选列：${columnNames.slice(0, 8).join('、')}${columnNames.length > 8 ? '…' : ''}。`
      : '';

  return (
    <div
      data-testid="table-index-edit"
      className="erd-table-index-edit"
      aria-busy={indexSaving || undefined}
    >
      <p
        className="erd-table-index-hint"
        data-testid="index-unique-hint"
        aria-label="索引字段编辑说明"
      >
        勾选「是否唯一」= UNIQUE；画布显示 UK。字段/表达式列用分号分隔列名或表达式（如
        {' '}
        id;LOWER(email)）。过滤条件为部分/过滤索引谓词（可选）。{columnHint}
      </p>
      {/* key：条数/epoch 变则重挂，JExcel 不吃 props.data 更新 */}
      <JExcel
        key={sheetKey}
        data={data}
        columns={columns}
        saveData={afterChange}
        notEmptyColumn={['name', 'fields']}
      />
      {hasIndexes ? (
        <>
          <div
            className="erd-table-index-delete-list"
            data-testid="index-delete-list"
          >
            {indexs.map((idx, i) => {
              const name = idx.name || `第 ${i + 1} 条`;
              return (
                <Button
                  key={`${name}-${i}`}
                  danger
                  type="link"
                  size="small"
                  data-testid={`index-delete-${i}`}
                  aria-label={`删除索引 ${name}`}
                  disabled={indexSaving}
                  onClick={() => confirmDeleteIndex(i)}
                >
                  删除索引 {name}
                </Button>
              );
            })}
          </div>
          <div className="erd-table-index-add-row">
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              <Button
                type="dashed"
                size="small"
                block
                data-testid="index-add-row"
                aria-label="再添加一条索引"
                loading={indexSaving}
                disabled={indexSaving}
                onClick={() => addAnotherIndex(false)}
              >
                + 再添加一条索引
              </Button>
              <Button
                type="link"
                size="small"
                block
                data-testid="index-add-row-unique"
                aria-label="再添加一条唯一索引"
                loading={indexSaving}
                disabled={indexSaving}
                onClick={() => addAnotherIndex(true)}
              >
                + 再添加一条唯一索引
              </Button>
            </Space>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default React.memo(TableIndexEdit);
