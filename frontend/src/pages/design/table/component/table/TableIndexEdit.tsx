import React, { useEffect, useState } from 'react';
import 'handsontable/dist/handsontable.full.css';
import "handsontable/languages/zh-CN";
import useProjectStore from "@/store/project/useProjectStore";
import {ModuleEntity} from "@/store/tab/useTabStore";
import _ from "lodash";
import JExcel from "@/pages/JExcel";
import { Button, Empty, message } from 'antd';

export type TableIndexEditProps = {
  moduleEntity: ModuleEntity
};

type IndexRow = { name?: string; fields?: string | string[]; isUnique?: boolean };

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

  useEffect(() => {
    setStarted(false);
  }, [module, entityName]);

  const fields = entity?.fields?.map((f: { name?: string }) => f.name).filter(Boolean) as string[];

  const afterChange = (payload: IndexRow[]) => {
    const updatedPayload = payload.map((m) => ({
      ...m,
      fields: m.fields?.constructor === String ? _.split(_.trimStart(m?.fields as string, ";"), ";") : m.fields
    }));
    
    if (currentModule && entity) {
      projectDispatch.updateEntityIndex(currentModule, entity.title || entity.name, updatedPayload);
    } else {
      console.error('当前模块或实体未定义');
    }
  }

  const seedIndex = (existing: IndexRow[]) => {
    if (!currentModule || !entity) {
      setStarted(true);
      return false;
    }
    const fieldName = firstFieldName(entity);
    if (!fieldName) {
      setStarted(true);
      return false;
    }
    const base = indexNameBase(entity);
    projectDispatch.updateEntityIndex(currentModule, entity.title || entity.name, [
      ...existing,
      {
        name: nextIndexName(base, existing),
        fields: [fieldName],
        isUnique: false,
      },
    ]);
    return true;
  };

  const addFirstIndex = () => {
    seedIndex([]);
  };

  /** 已有索引后表内明确 CTA；勿只靠 JExcel 工具栏「+」图标（无文案死 affordance） */
  const addAnotherIndex = () => {
    if (!firstFieldName(entity || {})) {
      message.warning('请先添加字段再创建索引');
      return;
    }
    seedIndex(indexs);
  };

  if (!hasIndexes && !started) {
    return (
      <div
        data-testid="table-index-edit"
        className="erd-table-index-empty"
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="还没有索引"
        >
          <Button
            type="primary"
            size="small"
            data-testid="index-empty-add"
            aria-label="添加第一个索引"
            onClick={addFirstIndex}
          >
            添加第一个索引
          </Button>
        </Empty>
      </div>
    );
  }

  const data = JSON.parse(JSON.stringify(hasIndexes ? indexs : [{}]));
  const columns = [
    {
      title: '索引名*',
      name: 'name',
      type: 'text',
      width: document.body.clientWidth * 0.2,
    },
    {
      title: '字段*',
      name: 'fields',
      type: 'dropdown',
      width: document.body.clientWidth * 0.35,
      multiple: true,
      source: fields
    },
    {
      title: '是否唯一',
      name: 'isUnique',
      type: 'checkbox',
      width: document.body.clientWidth * 0.1,
    }
  ];

  return (
    <div data-testid="table-index-edit" className="erd-table-index-edit">
      {/* key：条数变则重挂，JExcel 不吃 props.data 更新 */}
      <JExcel
        key={`index-grid-${indexs.length}`}
        data={data}
        columns={columns}
        saveData={afterChange}
        notEmptyColumn={['name', 'fields']}
      />
      {hasIndexes ? (
        <div className="erd-table-index-add-row">
          <Button
            type="dashed"
            size="small"
            block
            data-testid="index-add-row"
            aria-label="再添加一条索引"
            onClick={addAnotherIndex}
          >
            + 再添加一条索引
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default React.memo(TableIndexEdit);
