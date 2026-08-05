import React from "react";
import { Flex, Empty } from "antd";
import "./index.scss";
import TableTab from "@/pages/design/table/component/tab/TableTab";
import useTabStore, { ModuleEntity, TabGroup } from "@/store/tab/useTabStore";
import Relation from "@/pages/design/relation";
import CommonTabs from '@/components/CommonTabs';
import EmptyStateAnimation from '@/components/EmptyStateAnimation';
import useProjectStore from "@/store/project/useProjectStore";
import {useIntl} from '@@/exports';

const Table: React.FC = () => {
  const intl = useIntl();
  const tableTabs = useTabStore(state => state.tableTabs);
  const selectTabId = useTabStore(state => state.selectTabId);
  const tabDispatch = useTabStore(state => state.dispatch);
  const modules = useProjectStore(state => state.project?.projectJSON?.modules);

  const getTab = (tab: ModuleEntity) => {
    if (tab.group === TabGroup.MODEL) {
      if (tab.entity?.startsWith('关系图')) {
        // ReactFlow 画布（ADR-0001 R3：唯一关系图实现）
        return <Relation moduleEntity={tab}/>
      } else {
        return (
          <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <TableTab moduleEntity={tab}/>
          </div>
        );
      }
    }

    // 防御签兜底（TabGroup 目前仅 MODEL）；禁 marginTop:100 / 高 200 插画下沉
    return (
      <div className="erd-pane-empty" data-testid="designer-pane-empty">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span>{intl.formatMessage({id: 'designTable.empty.fallback'})}</span>
          }
        />
      </div>
    );
  }

  const getModuleEntity = (key: string) => {
    return {group: TabGroup.MODEL, module: key.split('###')[0], entity: key.split('###')[1]};
  }

  const onChange = (targetKey: string) => {
    tabDispatch.activeTab(getModuleEntity(targetKey));
  };

  const onEdit = (targetKey: any, action: 'add' | 'remove') => {
    if (action === 'remove') {
      tabDispatch.removeTab(getModuleEntity(targetKey));
    }
  };

  // 左树唯一来源 = DesignLayout sider（DesignLeftContent）；此处不再嵌套 Splitter/DataTable
  return (
    <Flex vertical className="erd-design-workspace" style={{ height: '100%', minHeight: 0, flex: 1 }}>
      <EmptyStateAnimation
        show={!selectTabId && modules && modules.length > 0}
        title={intl.formatMessage({id: 'designTable.empty.noTab.title'})}
        description={intl.formatMessage({id: 'designTable.empty.noTab.description'})}
      >
        {modules && modules.length > 0 ? (
          <CommonTabs
            tabs={tableTabs}
            activeKey={selectTabId}
            onTabChange={onChange}
            onTabEdit={onEdit}
            renderTabContent={getTab}
          />
        ) : (
          <EmptyStateAnimation
            show={true}
            title={intl.formatMessage({id: 'designTable.empty.noModel.title'})}
            description={
              <span>
                {intl.formatMessage({id: 'designTable.empty.noModel.descriptionPrefix'})}{' '}
                <a href="/design/table/import/reverse">
                  {intl.formatMessage({id: 'designTable.empty.noModel.reverseLink'})}
                </a>
              </span>
            }
          />
        )}
      </EmptyStateAnimation>
    </Flex>
  );
}

export default React.memo(Table);
