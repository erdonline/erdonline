import React, { useEffect, useRef, useState } from 'react';
import 'handsontable/dist/handsontable.full.css';
import "handsontable/languages/zh-CN";
import useProjectStore from "@/store/project/useProjectStore";
import {ModuleEntity} from "@/store/tab/useTabStore";
import JExcel from "@/pages/JExcel";
import { Button, Empty, Space, message } from 'antd';
import { confirmDestructive } from '@/utils/destructiveConfirm';
import { designIntl } from '@/pages/design/locales/intl';
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
      message.error(designIntl('design.table.index.error.saveFailed'));
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
      message.error(designIntl('design.table.index.error.saveFailed'));
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
      message.warning(designIntl('design.table.index.warn.noFields'));
      return;
    }
    void seedIndex(indexs, isUnique);
  };

  /** 破坏性：表内明确「删除」+ Modal 二次确认；勿只靠 JExcel 工具栏无确认 remove */
  const confirmDeleteIndex = (rowIndex: number) => {
    if (!currentModule || !entity || !entityTitle) {
      message.error(designIntl('design.common.error.moduleUndefined'));
      return;
    }
    const target = indexs[rowIndex];
    const indexName = target?.name || designIntl('design.table.index.rowFallback', {index: rowIndex + 1});
    confirmDestructive({
      title: designIntl('design.table.index.confirmDelete.title', {name: indexName}),
      content: designIntl('design.common.destructive.content'),
      okText: designIntl('design.common.delete'),
      okType: 'danger',
      cancelText: designIntl('design.common.cancel'),
      async onOk() {
        const next = indexs.filter((_, i) => i !== rowIndex);
        const ok = await persistIndex(next);
        if (!ok) {
          return Promise.reject(new Error(designIntl('design.table.index.error.deleteFailed')));
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
              {designIntl('design.table.index.empty.hint')}
            </span>
          }
        >
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Button
              type="primary"
              size="small"
              data-testid="index-empty-add"
              aria-label={designIntl('design.table.index.aria.addFirst')}
              loading={indexSaving}
              disabled={indexSaving}
              onClick={addFirstIndex}
            >
              {designIntl('design.table.index.aria.addFirst')}
            </Button>
            <Button
              type="link"
              size="small"
              data-testid="index-empty-add-unique"
              aria-label={designIntl('design.table.index.aria.addUnique')}
              loading={indexSaving}
              disabled={indexSaving}
              onClick={addFirstUniqueIndex}
            >
              {designIntl('design.table.index.aria.addUnique')}
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
      title: designIntl('design.table.index.col.name'),
      name: 'name',
      type: 'text',
      width: document.body.clientWidth * 0.2,
    },
    {
      // 文本格：列名与表达式可混写（分号分隔）；禁 dropdown 丢掉 LOWER(email) 等
      title: designIntl('design.table.index.col.fields'),
      name: 'fields',
      type: 'text',
      width: document.body.clientWidth * 0.35,
    },
    {
      title: designIntl('design.table.index.col.unique'),
      name: 'isUnique',
      type: 'checkbox',
      width: document.body.clientWidth * 0.1,
    },
    {
      // 部分/过滤索引谓词原样（PG WHERE / SQL Server filter_definition）；无则为空
      title: designIntl('design.table.index.col.filter'),
      name: 'filter',
      type: 'text',
      width: document.body.clientWidth * 0.2,
    },
  ];

  const sheetKey = `index-grid-${module}-${entityName}-${indexs.length}-${sheetEpoch}`;
  const columnHint =
    columnNames.length > 0
      ? designIntl('design.table.index.hint.columns', {
          names: columnNames.slice(0, 8).join('、'),
          ellipsis: columnNames.length > 8 ? designIntl('design.table.index.hint.ellipsis') : '',
        })
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
        aria-label={designIntl('design.table.index.aria.help')}
      >
        {designIntl('design.table.index.hint.body')}{columnHint}
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
              const name = idx.name || designIntl('design.table.index.rowFallback', {index: i + 1});
              return (
                <Button
                  key={`${name}-${i}`}
                  danger
                  type="link"
                  size="small"
                  data-testid={`index-delete-${i}`}
                  aria-label={designIntl('design.table.index.aria.delete', {name})}
                  disabled={indexSaving}
                  onClick={() => confirmDeleteIndex(i)}
                >
                  {designIntl('design.table.index.action.deleteWithName', {name})}
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
                aria-label={designIntl('design.table.index.aria.add')}
                loading={indexSaving}
                disabled={indexSaving}
                onClick={() => addAnotherIndex(false)}
              >
                {designIntl('design.table.index.action.addAnother')}
              </Button>
              <Button
                type="link"
                size="small"
                block
                data-testid="index-add-row-unique"
                aria-label={designIntl('design.table.index.aria.addUnique')}
                loading={indexSaving}
                disabled={indexSaving}
                onClick={() => addAnotherIndex(true)}
              >
                {designIntl('design.table.index.action.addAnotherUnique')}
              </Button>
            </Space>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default React.memo(TableIndexEdit);
