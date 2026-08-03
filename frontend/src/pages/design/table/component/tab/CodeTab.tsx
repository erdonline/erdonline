import React from 'react';
import DbTab from "@/pages/design/table/component/tab/DbTab";
import useProjectStore from "@/store/project/useProjectStore";
import shallow from "zustand/shallow";
import {ModuleEntity} from "@/store/tab/useTabStore";
import {Tabs} from "antd";

const {TabPane} = Tabs;

export type CodeTabProps = {
  moduleEntity: ModuleEntity
};

const CodeTab: React.FC<CodeTabProps> = (props) => {
  const {database} = useProjectStore(state => ({
    database: state.project?.projectJSON?.dataTypeDomains?.database,
    projectDispatch: state.dispatch,
  }), shallow);

  return (
    <div className="erd-code-tab" data-testid="table-code-edit">
      <Tabs id="codeNav" size="small" className="erd-code-tab__tabs">
        {database?.map((db: any) => {
          return <TabPane key={db.code} id={db.code} tab={db.code}><DbTab dbCode={db.code}
                                                                          moduleEntity={props.moduleEntity}/></TabPane>
        })}
      </Tabs>
    </div>
  );
}

export default React.memo(CodeTab)
