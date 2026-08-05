import React, {useEffect, useMemo, useState} from "react";
import {useLocation} from "react-router-dom";
import defaultProps from './_defaultProps';
import {Me} from "@icon-park/react";
import {Dropdown, Layout, Menu} from "antd";
import type {MenuProps} from "antd";
import * as cache from "@/utils/cache";
import {fixRouteAccess, headRightContent} from "@/layouts/DesignLayout";
import {history, Link, useIntl, useModel, useSearchParams} from "@umijs/max";
import {GET} from "@/services/crud";
import {useAccess} from "@@/plugin-access";
import {CONSTANT} from "@/utils/constant";
import Theme from "@/components/Theme";
import { erdColors } from "@/theme/tokens";
import {menuHeaderDropdown} from "@/layouts/HomeLayout";
import '../erd-chrome.less';
import './index.less';

const {Header, Sider, Content} = Layout;

export type GroupLayoutProps = {
  children?: React.ReactNode;
};

type GroupRoute = {
  path?: string;
  name?: string;
  icon?: React.ReactNode;
  exact?: boolean;
  access?: string;
};

const GroupLayout: React.FC<GroupLayoutProps> = (props) => {
  const intl = useIntl();
  const {setInitialState} = useModel('@@initialState');
  const access = useAccess();
  const location = useLocation();
  const [pathname, setPathname] = useState(location.pathname || '/home');
  const [searchParams] = useSearchParams();
  let projectId = searchParams.get("projectId") || '';
  if (!projectId || projectId === '') {
    projectId = cache.getItem(CONSTANT.PROJECT_ID) || '';
  }

  useEffect(() => {
    GET("/ncnb/project/group/currentRolePermission", {
      projectId
    }).then(r => {
      if (r?.code === 200) {
        r?.data?.permission?.push('initialized');
        setInitialState((s: any) => ({...s, access: r.data}));
      }
    })
  }, [access.initialized, defaultProps.route.routes])

  // 权限初始化之后再过滤路由（与旧 ProLayout 行为一致，就地改写 defaultProps）
  if (access.initialized) {
    defaultProps.route.routes = fixRouteAccess(defaultProps, access);
  }

  const routes = (defaultProps.route.routes || []) as GroupRoute[];

  const menuItems: MenuProps['items'] = useMemo(
    () =>
      routes.map((item) => {
        const isExternal = Boolean(item.exact) || Boolean(item.path?.startsWith('http'));
        let label: React.ReactNode;
        if (isExternal) {
          label = (
            <a href={item.path || '/project'} target="_blank" rel="noreferrer">
              {item.name}
            </a>
          );
        } else {
          const to =
            item.path === '/dataModels'
              ? '/dataModels'
              : `${item.path || '/home'}?projectId=${projectId}`;
          label = (
            <Link
              to={to}
              onClick={() => {
                setPathname(item.path || '/home');
                if (item.path === '/design/table/model' && projectId) {
                  cache.setItem(CONSTANT.PROJECT_ID, projectId);
                }
              }}
            >
              {item.name}
            </Link>
          );
        }
        return {
          key: item.path || String(item.name),
          icon: item.icon,
          label,
        };
      }),
    // routes 来自可变 defaultProps；access.initialized 变化时需重算
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [access.initialized, projectId, routes.length],
  );

  const selectedKey = useMemo(() => {
    const match = routes.find(
      (r) => r.path && !r.path.startsWith('http') && location.pathname.startsWith(r.path),
    );
    return match?.path || pathname;
  }, [routes, location.pathname, pathname]);

  const focusSkipTarget = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.focus({ preventScroll: false });
    el.scrollIntoView({ block: 'nearest' });
  };

  return (
    <Layout className="group-layout" data-testid="group-layout">
      <nav
        className="erd-skip-nav"
        aria-label={intl.formatMessage({id: 'common.skipNav'})}
        data-testid="group-skip-nav"
      >
        <a
          href="#group-main-content"
          className="erd-skip-link"
          data-testid="group-skip-main"
          onClick={(e) => {
            e.preventDefault();
            focusSkipTarget('group-main-content');
          }}
        >
          跳到主内容
        </a>
      </nav>
      <Header
        className="erd-chrome-header group-layout__header"
        data-testid="erd-chrome-header"
      >
        <div
          className="erd-chrome-brand group-layout__brand"
          role="link"
          tabIndex={0}
          aria-label={intl.formatMessage({ id: 'auth.brand.homeAria' })}
          data-testid="erd-chrome-brand"
          onClick={() => history.push('/home')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              history.push('/home');
            }
          }}
        >
          <img src="/logo.svg" alt="" width={28} height={28} />
          <span>ERD Online</span>
        </div>
        <div className="erd-chrome-actions" data-testid="erd-chrome-actions">
          {headRightContent}
          <Dropdown
            placement="bottom"
            arrow={{pointAtCenter: true}}
            overlay={menuHeaderDropdown}
          >
            <div
              className="erd-chrome-user"
              role="button"
              tabIndex={0}
              aria-label={intl.formatMessage({ id: 'designLayout.user.menuAria' })}
              data-testid="user-menu-trigger"
            >
              <Me theme="filled" size="28" fill={erdColors.brand} strokeWidth={2}/>
              {cache.getItem('username')}
            </div>
          </Dropdown>
        </div>
      </Header>
      <Layout>
        <Sider width={220} className="group-layout__sider" theme="light">
          <div className="group-layout__sider-inner">
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={menuItems}
              className="group-layout__sider-menu"
              data-testid="group-layout-sider-menu"
              aria-label={intl.formatMessage({ id: 'groupLayout.siderNavAria' })}
            />
          </div>
        </Sider>
        <Content className="group-layout__content">
          <div
            className="group-layout__body"
            id="group-main-content"
            tabIndex={-1}
            data-testid="group-main-content"
          >
            <Theme />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default React.memo(GroupLayout)
