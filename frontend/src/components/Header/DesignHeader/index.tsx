import React from 'react';
import { Button, Dropdown, Input, Layout } from 'antd';
import { MenuOutlined, CaretDownOutlined, SearchOutlined } from '@ant-design/icons';
import shallow from "zustand/shallow";
import { NavigationMenu, ProjectMenu } from '@/components/Menu';
import useGlobalStore from "@/store/global/globalStore";
import './index.less';

const { Header } = Layout;

export type DesignHeaderProps = {};

const DesignHeader: React.FC<DesignHeaderProps> = () => {
  const { globalDispatch } = useGlobalStore(state => ({
    searchKey: state.searchKey,
    saved: state.saved,
    globalDispatch: state.dispatch
  }), shallow);

  return (
    <Header className="design-header">
      <div className="design-header-left">
        <Dropdown overlay={<NavigationMenu />} trigger={['click']}>
          <Button icon={<MenuOutlined />} type="text" aria-label="导航" />
        </Dropdown>
        <Dropdown overlay={<ProjectMenu />} trigger={['click']}>
          <Button icon={<CaretDownOutlined />} type="text">
            项目
          </Button>
        </Dropdown>
        <Input
          className="table-search-input"
          prefix={<SearchOutlined />}
          onChange={(e) => globalDispatch.setSearchKey(e.target.value)}
          placeholder="搜索元数据（区分大小写）"
          style={{ width: 280 }}
        />
      </div>
    </Header>
  );
};

export default React.memo(DesignHeader);
