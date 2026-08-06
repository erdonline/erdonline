import React from 'react';
import { Menu } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import type { IntlShape } from '@umijs/max';
import { history } from '@@/exports';
import { logout } from '@/utils/request';

/** 头像菜单：个人中心 / 授权信息 / 退出 */
export function getMenuHeaderDropdown(intl: IntlShape): React.ReactNode {
  return (
    <Menu
      selectedKeys={[]}
      style={{ minWidth: 160 }}
      data-testid="user-menu-dropdown"
      items={[
        {
          key: 'center',
          icon: <UserOutlined />,
          label: intl.formatMessage({ id: 'homeLayout.user.accountCenter' }),
          onClick: () => {
            history.push('/account/settings?selectKey=base');
          },
        },
        {
          key: 'vip',
          icon: <UserOutlined />,
          label: intl.formatMessage({ id: 'homeLayout.user.licenseInfo' }),
          onClick: () => {
            history.push('/account/settings?selectKey=identification');
          },
        },
        { type: 'divider' },
        {
          key: 'logout',
          icon: <LogoutOutlined />,
          label: intl.formatMessage({ id: 'homeLayout.user.logout' }),
          onClick: () => {
            logout();
          },
        },
      ]}
    />
  );
}
