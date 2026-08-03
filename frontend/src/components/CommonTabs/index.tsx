import React, { useCallback, useLayoutEffect, useMemo } from 'react';
import { Dropdown, Menu, Tabs, TabsProps, Tooltip } from 'antd';
import useTabStore, { ModuleEntity, TabGroup } from '@/store/tab/useTabStore';
import { CommonTabsProps } from './interface';
import { CloseOutlined, LeftOutlined, RightOutlined, CloseCircleOutlined, EllipsisOutlined } from '@ant-design/icons';
import './index.less';

const { TabPane } = Tabs;

const tabKeyOf = (tab: Pick<ModuleEntity, 'module' | 'entity'>) =>
  `${tab.module}###${tab.entity}`;

const closeLabelOf = (entity: string) => `关闭 ${entity}`;

const focusAfterTabRemove = () => {
  const root = document.querySelector<HTMLElement>('[data-testid="common-tabs"]');
  const next =
    (root?.querySelector<HTMLElement>('.ant-tabs-tab-active [role="tab"]')) ||
    (root?.querySelector<HTMLElement>('.ant-tabs-tab-active .ant-tabs-tab-btn'));
  if (next) {
    next.focus();
    return;
  }
  document.getElementById('erd-design-workspace')?.focus();
};

const CommonTabs: React.FC<CommonTabsProps> = ({
    tabs,
    activeKey,
    onTabChange,
    onTabClose,
    onCloseLeft,
    onCloseRight,
    onCloseAll,
    renderTabContent,
}) => {
    const tabDispatch = useTabStore(state => state.dispatch);

    // rc-tabs 关闭钮默认 aria-label="remove"；按实体刷成「关闭 {表名}」供读屏 / getByRole
    useLayoutEffect(() => {
      const root = document.querySelector<HTMLElement>('[data-testid="common-tabs"]');
      if (!root || !tabs?.length) {
        return;
      }
      for (const tab of tabs) {
        const key = tabKeyOf(tab);
        const node = root.querySelector(`[data-node-key="${key}"]`);
        const remove = node?.querySelector<HTMLElement>('.ant-tabs-tab-remove');
        if (!remove) {
          continue;
        }
        remove.setAttribute('aria-label', closeLabelOf(tab.entity));
        remove.setAttribute('data-testid', `common-tab-close-${tab.entity}`);
      }
    }, [tabs, activeKey]);

    // 默认的关闭方法
    const defaultOnTabClose = useCallback((tab: ModuleEntity) => {
        tabDispatch.removeTab(tab);
    }, [tabDispatch]);

    const defaultOnCloseLeft = useCallback((tab: ModuleEntity) => {
        tabDispatch.removeLeftTab(tab);
    }, [tabDispatch]);

    const defaultOnCloseRight = useCallback((tab: ModuleEntity) => {
        tabDispatch.removeRightTab(tab);
    }, [tabDispatch]);

    const defaultOnCloseAll = useCallback((tab: ModuleEntity) => {
        tabDispatch.removeAllTab(tab);
    }, [tabDispatch]);

    // 使用传入的方法或默认方法
    const handleTabClose = onTabClose || defaultOnTabClose;
    const handleCloseLeft = onCloseLeft || defaultOnCloseLeft;
    const handleCloseRight = onCloseRight || defaultOnCloseRight;
    const handleCloseAll = onCloseAll || defaultOnCloseAll;

    // 关签卸掉关闭钮后焦点常坠 body → 归还下一 active 签或主工作区地标
    const restoreFocusAfterClose = useCallback(() => {
        requestAnimationFrame(() => {
            requestAnimationFrame(focusAfterTabRemove);
        });
    }, []);

    const closeOne = useCallback((tab: ModuleEntity) => {
        handleTabClose(tab);
        restoreFocusAfterClose();
    }, [handleTabClose, restoreFocusAfterClose]);

    const renderRightContent = useCallback((tab: ModuleEntity) => {
        const menuItems = [
            {
                key: 'closeCurrent',
                icon: <CloseOutlined />,
                label: '关闭当前',
                onClick: () => closeOne(tab),
            },
            {
                key: 'closeLeft',
                icon: <LeftOutlined />,
                label: '关闭左边',
                onClick: () => {
                    handleCloseLeft(tab);
                    restoreFocusAfterClose();
                },
            },
            {
                key: 'closeRight',
                icon: <RightOutlined />,
                label: '关闭右边',
                onClick: () => {
                    handleCloseRight(tab);
                    restoreFocusAfterClose();
                },
            },
            {
                key: 'closeAll',
                icon: <CloseCircleOutlined />,
                label: '关闭全部',
                onClick: () => {
                    handleCloseAll(tab);
                    restoreFocusAfterClose();
                },
                danger: true,
            },
        ];

        return <Menu className="erd-dense-menu" items={menuItems} />;
    }, [closeOne, handleCloseLeft, handleCloseRight, handleCloseAll, restoreFocusAfterClose]);

    const tabPanes = useMemo(() => {
        if (!tabs || !Array.isArray(tabs)) {
            return [];
        }
        return tabs.map((tab: ModuleEntity) => (
            <TabPane
                tab={
                    <Tooltip title={tab.entity}>
                        <span className="erd-common-tabs__label">{tab.entity}</span>
                    </Tooltip>
                }
                key={tabKeyOf(tab)}
                closable={true}
            >
                {renderTabContent(tab)}
            </TabPane>
        ));
    }, [tabs, renderTabContent]);

    const renderTabBar = useCallback<TabsProps['renderTabBar']>((tabBarProps, DefaultTabBar) => (
        <DefaultTabBar {...tabBarProps}>
            {(node: any) => {
                const [module, entity] = node.key.split('###');
                return (
                    <Dropdown overlay={renderRightContent({ module, entity, group: TabGroup.MODEL })} trigger={['contextMenu']}>
                        {node}
                    </Dropdown>
                );
            }}
        </DefaultTabBar>
    ), [renderRightContent]);

    const handleEdit = useCallback((targetKey: React.MouseEvent | React.KeyboardEvent | string, action: 'add' | 'remove') => {
        if (action !== 'remove') {
            return;
        }
        const key = String(targetKey);
        const [module, entity] = key.split('###');
        closeOne({ module, entity, group: TabGroup.MODEL });
    }, [closeOne]);

    return (
        <div
          className="erd-common-tabs"
          data-testid="common-tabs"
          role="navigation"
          aria-label="已打开的签页"
          style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}
        >
            <Tabs
                type="editable-card"
                hideAdd
                onEdit={handleEdit}
                activeKey={activeKey}
                onChange={onTabChange}
                renderTabBar={renderTabBar}
                tabBarGutter={-1}
                className="erd-common-tabs__tabs"
                style={{ height: '100%' }}
                destroyOnHidden
                locale={{
                  removeAriaLabel: '关闭标签',
                  dropdownAriaLabel: '更多标签',
                }}
                moreIcon={<Tooltip title="更多标签页"><EllipsisOutlined /></Tooltip>}
            >
                {tabPanes}
            </Tabs>
        </div>
    );
};

export default React.memo(CommonTabs);