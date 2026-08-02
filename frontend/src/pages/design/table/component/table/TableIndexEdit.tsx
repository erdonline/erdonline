import React, { useEffect, useState } from 'react';
import 'handsontable/dist/handsontable.full.css';
import "handsontable/languages/zh-CN";
import useProjectStore from "@/store/project/useProjectStore";
import {ModuleEntity} from "@/store/tab/useTabStore";
import _ from "lodash";
import JExcel from "@/pages/JExcel";
import { Button, Empty } from 'antd';

export type TableIndexEditProps = {
  moduleEntity: ModuleEntity
};

const TableIndexEdit: React.FC<TableIndexEditProps> = (props) => {
  const { module, entity: entityName } = props.moduleEntity;
  const {entity, projectDispatch, currentModule} = useProjectStore(state => ({
    entity: state.project?.projectJSON?.modules[state.currentModuleIndex || 0].entities[state.currentEntityIndex || 0],
    projectDispatch: state.dispatch,
    currentModule: state.currentModule,
  }));

  const indexs = Array.isArray(entity?.indexs) ? entity.indexs : [];
  const hasIndexes = indexs.length > 0;
  /** 无字段可绑定时仅展开空表，不写库 */
  const [started, setStarted] = useState(false);

  useEffect(() => {
    setStarted(false);
  }, [module, entityName]);

  const fields = entity?.fields?.map((f: { name?: string }) => f.name).filter(Boolean) as string[];

  const afterChange = (payload: Array<{ name?: string; fields?: string | string[]; isUnique?: boolean }>) => {
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

  const addFirstIndex = () => {
    if (!currentModule || !entity) {
      setStarted(true);
      return;
    }
    const fieldName = entity.fields?.find((f: { name?: string }) => f?.name)?.name;
    if (!fieldName) {
      setStarted(true);
      return;
    }
    const base = String(entity.title || entity.name || 'T').replace(/\W+/g, '_');
    projectDispatch.updateEntityIndex(currentModule, entity.title || entity.name, [{
      name: `${base}_IDX1`,
      fields: [fieldName],
      isUnique: false,
    }]);
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
    <div data-testid="table-index-edit">
      <JExcel
        data={data}
        columns={columns}
        saveData={afterChange}
        notEmptyColumn={['name', 'fields']}
      />
    </div>
  );
}

export default React.memo(TableIndexEdit);
