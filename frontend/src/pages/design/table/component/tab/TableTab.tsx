import CodeTab from '@/pages/design/table/component/tab/CodeTab';
import TableIndexEdit from '@/pages/design/table/component/table/TableIndexEdit';
import TableInfoEdit from '@/pages/design/table/component/table/TableInfoEdit';
import useTabStore, {DesignPane, ModuleEntity} from '@/store/tab/useTabStore';
import useProjectStore from '@/store/project/useProjectStore';
import {erdColors} from '@/theme/tokens';
import React, {useEffect, useState} from 'react';
import {Tabs} from 'antd';
import {TableOutlined} from '@ant-design/icons';
import './TableTab.less';

const {TabPane} = Tabs;

export type TableTabProps = {
  moduleEntity: ModuleEntity;
};

const TableTab: React.FC<TableTabProps> = (props) => {
  const {module, entity: entityName, designPane} = props.moduleEntity;
  const entity = useProjectStore(state =>
    state.project?.projectJSON?.modules
      ?.find((m: any) => m.name === module)
      ?.entities?.find((e: any) => (e.title || e.name) === entityName));
  const [activeKey, setActiveKey] = useState<DesignPane>(designPane || 'field');

  // 画布入口再次带 designPane 时同步；勿在 mount 立刻 consume（Strict Mode 双挂载会丢定位）
  useEffect(() => {
    if (designPane) setActiveKey(designPane);
  }, [designPane, module, entityName]);

  return (
    <div className="erd-table-design" data-testid="table-design">
      <div className="erd-table-design__header">
        <TableOutlined style={{color: erdColors.warning}}/>
        <span className="erd-table-design__title">{entityName}</span>
        {entity?.chnname && (
          <span className="erd-table-design__chnname">{entity.chnname}</span>
        )}
        <span className="erd-table-design__module">{module}</span>
      </div>
      <Tabs
        id="tableNav"
        activeKey={activeKey}
        onChange={(key) => {
          setActiveKey(key as DesignPane);
          if (designPane) {
            useTabStore.getState().dispatch.consumeDesignPane({
              module,
              entity: entityName,
            });
          }
        }}
        size="small"
        className="erd-table-design__tabs"
      >
        <TabPane key="field" tab="字段">
          <TableInfoEdit moduleEntity={props.moduleEntity} />
        </TabPane>
        <TabPane key="index" tab="索引">
          <TableIndexEdit moduleEntity={props.moduleEntity} />
        </TabPane>
        <TabPane key="code" tab="元数据应用">
          <CodeTab moduleEntity={props.moduleEntity} />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default React.memo(TableTab);
