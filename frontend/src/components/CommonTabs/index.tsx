import React, { useCallback, useMemo } from 'react';
import { Dropdown, Menu, Tabs, TabsProps, Typography, Tooltip } from 'antd';
import useTabStore, { ModuleEntity, TabGroup } from '@/store/tab/useTabStore';
import { CommonTabsProps } from './interface';
import { CloseOutlined, LeftOutlined, RightOutlined, CloseCircleOutlined, EllipsisOutlined } from '@ant-design/icons';
import './index.less';

const { TabPane } = Tabs;
const { Text } = Typography;

const CommonTabs: React.FC<CommonTabsProps> = ({
    tabs,
    activeKey,
    onTabChange,
    onTabEdit,
    onTabClose,
    onCloseLeft,
    onCloseRight,
    onCloseAll,
    renderTabContent,
}) => {
    const tabDispatch = useTabStore(state => state.dispatch);

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

    const renderRightContent = useCallback((tab: ModuleEntity) => {
        const menuItems = [
            {
                key: 'closeCurrent',
                icon: <CloseOutlined />,
                label: '关闭当前',
                onClick: () => handleTabClose(tab),
            },
            {
                key: 'closeLeft',
                icon: <LeftOutlined />,
                label: '关闭左边',
                onClick: () => handleCloseLeft(tab),
            },
            {
                key: 'closeRight',
                icon: <RightOutlined />,
                label: '关闭右边',
                onClick: () => handleCloseRight(tab),
            },
            {
                key: 'closeAll',
                icon: <CloseCircleOutlined />,
                label: '关闭全部',
                onClick: () => handleCloseAll(tab),
                danger: true,
            },
        ];

        return <Menu items={menuItems} />;
    }, [handleTabClose, handleCloseLeft, handleCloseRight, handleCloseAll]);

    const tabPanes = useMemo(() => {
        if (!tabs || !Array.isArray(tabs)) {
            return [];
        }
        return tabs.map((tab: ModuleEntity) => (
            <TabPane
                tab={
                    <Tooltip title={tab.entity}>
                        <Text type="secondary" ellipsis style={{ maxWidth: 120 }}>
                            {tab.entity}
                        </Text>
                    </Tooltip>
                }
                key={`${tab.module}###${tab.entity}`}
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
        if (action === 'remove') {
            const [module, entity] = (targetKey as string).split('###');
            handleTabClose({ module, entity, group: TabGroup.MODEL });
        }
    }, [handleTabClose]);

    return (
        <div className="erd-common-tabs" style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
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
                moreIcon={<Tooltip title="更多标签页"><EllipsisOutlined /></Tooltip>}
            >
                {tabPanes}
            </Tabs>
        </div>
    );
};

export default React.memo(CommonTabs);