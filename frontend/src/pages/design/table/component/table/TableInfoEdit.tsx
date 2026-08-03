import useProjectStore from "@/store/project/useProjectStore";
import { ModuleEntity } from "@/store/tab/useTabStore";
import 'handsontable/dist/handsontable.full.css';
import "handsontable/languages/zh-CN";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import shallow from "zustand/shallow";
// @ts-ignore
import JExcel from "@/pages/JExcel";
import { column1, column2 } from "@/pages/design/setting/component/DefaultField";
import { Button, Empty } from 'antd';

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

  useEffect(() => {
    setStarted(false);
  }, [module, entityName]);

  const afterChange = (payload: FieldRow[]) => {
    if (currentModule && entity) {
      projectDispatch.updateEntityFields(currentModule, entity.title || entity.name, payload);
    } else {
      console.error('当前模块或实体未定义');
    }
  };

  const addFirstField = () => {
    if (!currentModule || !entity) {
      setStarted(true);
      return;
    }
    const defaults = (projectDispatch.getDefaultFields?.() || []).filter(
      (f: FieldRow | null | undefined) => f != null && !!f.name,
    ) as FieldRow[];
    if (defaults.length > 0) {
      projectDispatch.updateEntityFields(
        currentModule,
        entity.title || entity.name,
        [JSON.parse(JSON.stringify(defaults[0]))],
      );
      return;
    }
    const typeMeta = datatype?.[0];
    projectDispatch.updateEntityFields(currentModule, entity.title || entity.name, [
      {
        name: 'id',
        chnname: '主键',
        type: typeMeta?.code || 'IdOrKey',
        typeName: typeMeta?.name || 'String',
        pk: true,
        notNull: true,
        autoIncrement: false,
        relationNoShow: false,
        defaultValue: '',
      },
    ]);
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
            onClick={addFirstField}
          >
            添加第一个字段
          </Button>
        </Empty>
      </div>
    );
  }

  const data = JSON.parse(JSON.stringify(named ? fields : [{}]));

  return (
    <div
      ref={containerRef}
      data-testid="table-field-edit"
      className="erd-table-field-edit"
      style={{ width: '100%', height: '640px', overflow: 'auto' }}
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
