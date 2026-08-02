import React from 'react';
import 'handsontable/dist/handsontable.full.css';
import "handsontable/languages/zh-CN";
import useProjectStore from "@/store/project/useProjectStore";
import {ModuleEntity} from "@/store/tab/useTabStore";
import _ from "lodash";
import JExcel from "@/pages/JExcel";

export type TableIndexEditProps = {
  moduleEntity: ModuleEntity
};

const TableIndexEdit: React.FC<TableIndexEditProps> = (props) => {
  const {entity, projectDispatch, currentModule} = useProjectStore(state => ({
    entity: state.project?.projectJSON?.modules[state.currentModuleIndex || 0].entities[state.currentEntityIndex || 0],
    projectDispatch: state.dispatch,
    currentModule: state.currentModule,
  }));

  const fields = entity?.fields.map((f: any) => f.name);

  const afterChange = (payload: any) => {
    const updatedPayload = payload.map((m: any) => ({
      ...m,
      fields: m.fields.constructor === String ? _.split(_.trimStart(m?.fields, ";"), ";") : m.fields
    }));
    
    if (currentModule && entity) {
      projectDispatch.updateEntityIndex(currentModule, entity.title || entity.name, updatedPayload);
    } else {
      console.error('当前模块或实体未定义');
    }
  }

  const data = JSON.parse(JSON.stringify(entity?.indexs || [{}]));
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
