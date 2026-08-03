import React, {useEffect, useMemo} from 'react';
import {useLocation} from 'react-router-dom';
import defaultProps from './_defaultProps';
import {history, Link, Outlet} from "@@/exports";
import {Me, TwoDimensionalCodeOne} from "@icon-park/react";
import {Dropdown, Image, Layout, Menu, Popover, Typography} from "antd";
import type {MenuProps} from 'antd';
import {logout} from "@/utils/request";
import * as cache from "@/utils/cache";
import {useModel} from "@umijs/max";
import useTabStore from "@/store/tab/useTabStore";
import Theme from "@/components/Theme";
import { erdColors } from "@/theme/tokens";
import {LogoutOutlined, UserOutlined} from "@ant-design/icons";
import '../erd-chrome.less';
import './index.less';

const {Header, Content} = Layout;
const {Text} = Typography;

export interface HomeLayoutLayoutProps {
  children?: React.ReactNode;
}

/** Home 顶栏安全子集：公众号 + GitHub；不含 SaveStatus / 分享 / presence */
export const homeRightContent = [
  <Popover
    key="mp"
    placement="bottom"
    title="公众号"
    content={<Image src="/mp.jpg" />}
    trigger="hover"
  >
    <span role="img" aria-label="公众号" style={{ display: 'inline-flex', cursor: 'pointer' }}>
      <TwoDimensionalCodeOne theme="filled" size="18" fill={erdColors.brand} strokeWidth={2} />
    </span>
  </Popover>,
  <a
    key="github"
    className="erd-chrome-link"
    target="_blank"
    rel="noreferrer"
    href="https://github.com/erdonline/erdonline"
    aria-label="GitHub 仓库"
  >
    GitHub
  </a>,
];

/** 头像菜单：仅保留已接线入口（个人中心 / 授权信息 / 退出）；无假项 */
export const menuHeaderDropdown = (
  <Menu
    selectedKeys={[]}
    style={{ minWidth: 160 }}
    items={[
      {
        key: 'center',
        icon: <UserOutlined />,
        label: '个人中心',
        onClick: () => {
          history.push('/account/settings?selectKey=base');
        },
      },
      {
        key: 'vip',
        icon: <UserOutlined />,
        label: '授权信息',
        onClick: () => {
          history.push('/account/settings?selectKey=identification');
        },
      },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: () => {
          logout();
        },
      },
    ]}
  />
);

type HomeRoute = {
  path?: string;
  name?: string;
  icon?: React.ReactNode;
  exact?: boolean;
};

const HomeLayout: React.FC<HomeLayoutLayoutProps> = props => {
  const location = useLocation();
  const pathname = location.pathname;
  const {setInitialState} = useModel('@@initialState');
  const {tabDispatch} = useTabStore(state => ({tabDispatch: state.dispatch}));

  useEffect(() => {
    tabDispatch.removeAllTab({});
    setInitialState((s: any) => ({...s, access: {}}));
  }, [])

  const routes = (defaultProps.route.routes || []) as HomeRoute[];

  const menuItems: MenuProps['items'] = useMemo(
    () =>
      routes.map((r) => {
        const isExternal = Boolean(r.exact) || Boolean(r.path?.startsWith('http'));
        const label = isExternal ? (
          <a href={r.path} target="_blank" rel="noreferrer">
            {r.name}
          </a>
        ) : (
          <Link to={r.path || '/home'}>{r.name}</Link>
        );
        return {
          key: r.path || String(r.name),
          icon: r.icon,
          label,
        };
      }),
    [routes],
  );

  const selectedKey = useMemo(() => {
    const match = routes.find(
      (r) => r.path && !r.path.startsWith('http') && pathname.startsWith(r.path),
    );
    return match?.path || '/home';
  }, [pathname, routes]);

  const focusSkipTarget = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.focus({ preventScroll: false });
    el.scrollIntoView({ block: 'nearest' });
  };

  return (
    <Theme>
      <Layout className="home-layout" data-testid="home-layout">
        <nav className="erd-skip-nav" aria-label="跳过导航" data-testid="home-skip-nav">
          <a
            href="#home-main-content"
            className="erd-skip-link"
            data-testid="home-skip-main"
            onClick={(e) => {
              e.preventDefault();
              focusSkipTarget('home-main-content');
            }}
          >
            跳到主内容
          </a>
        </nav>
        <Header className="erd-chrome-header home-layout__header">
          <div
            className="erd-chrome-brand"
            role="link"
            tabIndex={0}
            aria-label="ERD Online 首页"
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
          <Menu
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={menuItems}
            className="home-layout__menu"
          />
          <div className="erd-chrome-actions">
            {homeRightContent}
            <Dropdown
              placement="bottomRight"
              arrow={{pointAtCenter: true}}
              overlay={menuHeaderDropdown}
            >
              <div
                className="erd-chrome-user"
                role="button"
                tabIndex={0}
                aria-label="用户菜单"
                data-testid="user-menu-trigger"
              >
                <Me theme="filled" size="28" fill={erdColors.brand} strokeWidth={2}/>
                {cache.getItem('username')}
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="home-layout__content">
          <div
            className="home-layout__shell"
            id="home-main-content"
            tabIndex={-1}
            data-testid="home-main-content"
          >
            <div className="home-layout__body">
              <Outlet />
            </div>
            <div className="home-layout__footer">
              <Text type="secondary">© 2026 ERD Online · MIT</Text>
            </div>
          </div>
        </Content>
      </Layout>
    </Theme>
  );
}

export default React.memo(HomeLayout);
