import React, { useMemo } from 'react';
import { Dropdown } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import * as cache from '@/utils/cache';
import { getMenuHeaderDropdown } from './menuDropdown';

export type ChromeUserMenuProps = {
  placement?: 'bottom' | 'bottomRight';
};

/** 三壳共用顶栏用户触发器 + 下拉菜单 */
const ChromeUserMenu: React.FC<ChromeUserMenuProps> = ({ placement = 'bottomRight' }) => {
  const intl = useIntl();
  const menuHeaderDropdown = useMemo(() => getMenuHeaderDropdown(intl), [intl]);
  const username = cache.getItem('username');

  return (
    <Dropdown
      placement={placement}
      arrow={{ pointAtCenter: true }}
      overlay={menuHeaderDropdown}
    >
      <div
        className="erd-chrome-user"
        role="button"
        tabIndex={0}
        aria-label={intl.formatMessage({ id: 'designLayout.user.menuAria' })}
        data-testid="user-menu-trigger"
      >
        <span className="erd-chrome-user__avatar" aria-hidden="true">
          <UserOutlined />
        </span>
        {username ? (
          <span className="erd-chrome-user__name">{username}</span>
        ) : null}
      </div>
    </Dropdown>
  );
};

export default React.memo(ChromeUserMenu);
export { getMenuHeaderDropdown } from './menuDropdown';
