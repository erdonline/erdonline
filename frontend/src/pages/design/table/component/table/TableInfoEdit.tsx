import useProjectStore from "@/store/project/useProjectStore";
import { ModuleEntity } from "@/store/tab/useTabStore";
import 'handsontable/dist/handsontable.full.css';
import "handsontable/languages/zh-CN";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import shallow from "zustand/shallow";
// @ts-ignore
import JExcel from "@/pages/JExcel";
import { column1, column2 } from "@/pages/design/setting/component/DefaultField";
import { Button, Empty, message } from 'antd';

export type TableInfoEditProps = {
  moduleEntity: ModuleEntity;
  /** 字段无 unique 列；引导至索引签设置唯一 */
  onOpenIndex?: () => void;
};

type FieldRow = {
  name?: string;
  chnname?: string;
  type?: string;
  typeName?: string;
  pk?: boolean;
  notNull?: boolean;
  autoIncrement?: boolean;
  relationNoShow?: boolean;
  defaultValue?: string;
  [key: string]: unknown;
};

const hasNamedFields = (fields: FieldRow[] | undefined) =>
  (fields || []).some((f) => !!f?.name);

const TableInfoEdit: React.FC<TableInfoEditProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { module, entity: entityName } = props.moduleEntity;

  const {datatype, entity, projectDispatch, currentModule} = useProjectStore(state => ({
    entity: state.project?.projectJSON?.modules[state.currentModuleIndex || 0]?.entities[state.currentEntityIndex || 0],
    datatype: state.project?.projectJSON?.dataTypeDomains?.datatype,
    database: state.project?.projectJSON?.dataTypeDomains?.database,
    projectDispatch: state.dispatch,
    currentModule: state.currentModule,
  }), shallow);

  const fields: FieldRow[] = Array.isArray(entity?.fields) ? entity.fields : [];
  const named = hasNamedFields(fields);
  /** 无字段时先空态；CTA 后可暂展空表再填 */
  const [started, setStarted] = useState(false);
  /** 落盘失败时重挂 JExcel（组件不吃 props.data），回滚到 store 快照 */
  const [sheetEpoch, setSheetEpoch] = useState(0);
  const [fieldSaving, setFieldSaving] = useState(false);
  const pendingRef = useRef<FieldRow[] | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    setStarted(false);
    setSheetEpoch(0);
    pendingRef.current = null;
  }, [module, entityName]);

  const entityTitle = entity?.title || entity?.name;

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
    setFieldSaving(true);
    try {
      const ok = await Promise.resolve(
        projectDispatch.updateEntityFields(
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
      message.error('字段保存失败');
      pendingRef.current = null;
      setSheetEpoch((e) => e + 1);
    } finally {
      savingRef.current = false;
      setFieldSaving(false);
      if (pendingRef.current) {
        void flushPersist();
      }
    }
  };

  const afterChange = (payload: FieldRow[]) => {
    if (!currentModule || !entity) {
      console.error('当前模块或实体未定义');
      return;
    }
    pendingRef.current = payload;
    void flushPersist();
  };

  const persistFields = async (payload: FieldRow[]): Promise<boolean> => {
    if (!currentModule || !entity || !entityTitle) {
      console.error('当前模块或实体未定义');
      return false;
    }
    try {
      const ok = await Promise.resolve(
        projectDispatch.updateEntityFields(
          currentModule,
          entityTitle,
          payload,
          { persist: true },
        ),
      );
      return !!ok;
    } catch {
      message.error('字段保存失败');
      return false;
    }
  };

  const addFirstField = async () => {
    if (!currentModule || !entity || !entityTitle) {
      setStarted(true);
      return;
    }
    if (savingRef.current) return;
    const defaults = (projectDispatch.getDefaultFields?.() || []).filter(
      (f: FieldRow | null | undefined) => f != null && !!f.name,
    ) as FieldRow[];
    const payload: FieldRow[] = defaults.length > 0
      ? [JSON.parse(JSON.stringify(defaults[0]))]
      : (() => {
          const typeMeta = datatype?.[0];
          return [{
            name: 'id',
            chnname: '主键',
            type: typeMeta?.code || 'IdOrKey',
            typeName: typeMeta?.name || 'String',
            pk: true,
            notNull: true,
            autoIncrement: false,
            relationNoShow: false,
            defaultValue: '',
          }];
        })();
    savingRef.current = true;
    setFieldSaving(true);
    try {
      await persistFields(payload);
    } finally {
      savingRef.current = false;
      setFieldSaving(false);
    }
  };

  const enrichField = (f: FieldRow): FieldRow => {
    if (f?.typeName || !f) return f;
    // 画布行内字段常只有 type(code)，缺 typeName → JExcel notEmpty 会拦整表写回
    const d = (datatype || []).find(
      (t: { code?: string; name?: string }) => t.code === f.type || t.name === f.type,
    );
    if (d?.name) {
      return { ...f, typeName: d.name };
    }
    if (f.type) {
      return { ...f, typeName: String(f.type) };
    }
    return f;
  };

  const columns = useMemo(() => [
    ...column1,
    {
      title: '类型*',
      name: 'typeName',
      type: 'dropdown',
      source: datatype?.map((t: { name?: string }) => t.name) || [],
      width: 150,
    },
    ...column2
  ], [datatype]);

  if (!named && !started) {
    return (
      <div
        ref={containerRef}
        data-testid="table-field-edit"
        className="erd-table-field-empty"
        aria-busy={fieldSaving || undefined}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span data-testid="field-empty-hint">
              还没有字段。添加第一个字段开始设计表结构
            </span>
          }
        >
          <Button
            type="primary"
            size="small"
            data-testid="field-empty-add"
            aria-label="添加第一个字段"
            loading={fieldSaving}
            disabled={fieldSaving}
            onClick={() => { void addFirstField(); }}
          >
            添加第一个字段
          </Button>
        </Empty>
      </div>
    );
  }

  const data = JSON.parse(
    JSON.stringify((named ? fields : [{} as FieldRow]).map(enrichField)),
  );
  const sheetKey = `field-grid-${module}-${entityName}-${sheetEpoch}`;

  return (
    <div
      ref={containerRef}
      data-testid="table-field-edit"
      className="erd-table-field-edit"
      style={{ width: '100%', height: '640px', overflow: 'auto' }}
      aria-busy={fieldSaving || undefined}
    >
        <div className="erd-table-field-unique-hint" data-testid="field-unique-hint">
          <span>字段没有独立的「唯一」列；UNIQUE 请在「索引」签勾选「是否唯一」。</span>
          {props.onOpenIndex ? (
            <Button
              type="link"
              size="small"
              data-testid="field-goto-index"
              aria-label="去索引签设置唯一"
              onClick={props.onOpenIndex}
            >
              去索引签设置唯一
            </Button>
          ) : null}
        </div>
        <JExcel
          key={sheetKey}
          data={data}
          columns={columns}
          saveData={afterChange}
          // 与画布一致：英文名必填；类型必填（禁半成品静默丢行）
          notEmptyColumn={['name', 'typeName']}
        />
    </div>
  );
}

export default React.memo(TableInfoEdit)
