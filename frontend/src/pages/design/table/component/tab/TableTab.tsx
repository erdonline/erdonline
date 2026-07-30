import CodeTab from "@/pages/design/table/component/tab/CodeTab";
import TableIndexEdit from "@/pages/design/table/component/table/TableIndexEdit";
import TableInfoEdit from "@/pages/design/table/component/table/TableInfoEdit";
import { ModuleEntity } from "@/store/tab/useTabStore";
import React from 'react';

import { ProCard } from '@ant-design/pro-components';
import { Tabs } from "antd";

const {TabPane} = Tabs;
export type TableTabProps = {
  moduleEntity: ModuleEntity
};

const TableTab: React.FC<TableTabProps> = (props) => {

  return (
    <ProCard bodyStyle={{ paddingTop: 0, paddingBottom: 0 }}>
        <Tabs
          id="tableNav"
          defaultActiveKey="field"
          size={'small'}
        >
          <TabPane key="field" tab="字段">
            <TableInfoEdit moduleEntity={props.moduleEntity}/>
          </TabPane>
          <TabPane key="index" tab="索引"><TableIndexEdit moduleEntity={props.moduleEntity}/></TabPane>
          <TabPane key="code" tab="元数据应用"><CodeTab moduleEntity={props.moduleEntity}/></TabPane>
        </Tabs>
    </ProCard>
  );
}

export default React.memo(TableTab)
