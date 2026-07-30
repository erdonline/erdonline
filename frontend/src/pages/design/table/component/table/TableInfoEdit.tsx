import useProjectStore from "@/store/project/useProjectStore";
import { ModuleEntity } from "@/store/tab/useTabStore";
import 'handsontable/dist/handsontable.full.css';
import "handsontable/languages/zh-CN";
import React, { useMemo, useRef } from 'react';
import shallow from "zustand/shallow";
// @ts-ignore
import JExcel from "@/pages/JExcel";
import { column1, column2 } from "@/pages/design/setting/component/DefaultField";

export type TableInfoEditProps = {
  moduleEntity: ModuleEntity;
};

const TableInfoEdit: React.FC<TableInfoEditProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);



  const {datatype, entity, projectDispatch, currentModule} = useProjectStore(state => ({
    entity: state.project?.projectJSON?.modules[state.currentModuleIndex || 0]?.entities[state.currentEntityIndex || 0],
    datatype: state.project?.projectJSON?.dataTypeDomains?.datatype,
    database: state.project?.projectJSON?.dataTypeDomains?.database,
    projectDispatch: state.dispatch,
    currentModule: state.currentModule,
  }), shallow);
  console.log('datatype', 115, datatype)


  console.log('entity:useEffect', 148, entity)



  // 由于 zustand 冻结了所有属性，均不可直接编辑，所以需要做一次转换
  const s = JSON.stringify(entity?.fields || [{}]);

  const afterChange = (payload: any) => {
    if (currentModule && entity) {
      projectDispatch.updateEntityFields(currentModule, entity.title || entity.name, payload);
    } else {
      console.error('当前模块或实体未定义');
    }
  }

  const data = JSON.parse(s);
  const columns = useMemo(() => [
    ...column1, 
    {
      title: '类型*',
      name: 'typeName',
      type: 'dropdown',
      source: datatype?.map((t: any) => t.name) || [],
      width: 150,
    },
    ...column2
  ], [datatype]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '640px', overflow: 'auto' }}>
        <JExcel
          data={data}
          columns={columns}
          saveData={afterChange}
          notEmptyColumn={[ 'typeName']}
        />
    </div>
  );
}

export default React.memo(TableInfoEdit)
