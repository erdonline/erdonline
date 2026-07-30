import React, { ReactNode } from "react";
import { Flex, Empty } from "antd";
import { Splitter } from 'antd';
import "./index.scss";
import TableTab from "@/pages/design/table/component/tab/TableTab";
import useTabStore, { ModuleEntity, TabGroup } from "@/store/tab/useTabStore";
import Relation from "@/pages/design/relation";
import Query from "@/pages/design/query";
import CommonTabs from '@/components/CommonTabs';
import DataTable from '@/components/LeftContent/DesignLeftContent/component/DataTable';
import EmptyStateAnimation from '@/components/EmptyStateAnimation';
import useProjectStore from "@/store/project/useProjectStore";

// 修改 EmptyStateAnimation 的类型定义
interface EmptyStateAnimationProps {
  show: boolean;
  title?: string;
  description?: string | ReactNode;
  children?: ReactNode;
}

const Table: React.FC = () => {
  const tableTabs = useTabStore(state => state.tableTabs);
  const selectTabId = useTabStore(state => state.selectTabId);
  const tabDispatch = useTabStore(state => state.dispatch);
  const closeCurrent = useTabStore(state => state.closeCurrent);
  const modules = useProjectStore(state => state.project?.projectJSON?.modules);

  const getTab = (tab: ModuleEntity) => {
    if (tab.group === TabGroup.MODEL) {
      if (tab.entity?.startsWith('关系图')) {
        return <Relation moduleEntity={tab}/>
      } else {
        return (
          <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <TableTab moduleEntity={tab}/>
          </div>
        );
      }
    }

    if (tab.group === TabGroup.QUERY) {
      return <Query id={tab.module + ''}/>;
    }

    return <Empty
      image="/empty.svg"
      imageStyle={{ height: 200 }}
      style={{ marginTop: '100px' }}
      description={<span>这里空空如也!</span>}
    />
  }

  const getModuleEntity = (key: string) => {
    return {group: TabGroup.MODEL, module: key.split('###')[0], entity: key.split('###')[1]};
  }

  const onChange = (targetKey: string) => {
    tabDispatch.activeTab(getModuleEntity(targetKey));
  };

  const onEdit = (targetKey: any, action: 'add' | 'remove') => {
    if (action === 'remove') {
      closeCurrent(getModuleEntity(targetKey));
    }
  };

  return (
    <Flex style={{ height: '100%' }}>
      <Splitter>
        <Splitter.Panel defaultSize="20%" min="10%" max="40%">
          <DataTable />
        </Splitter.Panel>
        <Splitter.Panel style={{ overflow: 'hidden' }}>
          <EmptyStateAnimation 
            show={!selectTabId && modules && modules.length > 0}
            description="快去创建/打开一个表吧！"
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
                title="欢迎使用数据建模工具"
                description={
                  <span>
                    从左侧开始创建一个模型，或者
                    <a href="/design/table/import/reverse">从数据源逆向解析</a>
                  </span>
                }
              />
            )}
          </EmptyStateAnimation>
        </Splitter.Panel>
      </Splitter>
    </Flex>
  );
}

export default React.memo(Table);
