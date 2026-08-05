import React, {useEffect, useMemo} from 'react';
import {useLocation} from 'react-router-dom';
import defaultProps from './_defaultProps';
import {history, Link, Outlet} from "@@/exports";
import {Me, TwoDimensionalCodeOne} from "@icon-park/react";
import {Dropdown, Image, Layout, Menu, Popover, Typography} from "antd";
import type {MenuProps} from 'antd';
import {logout} from "@/utils/request";
import * as cache from "@/utils/cache";
import type {IntlShape} from '@umijs/max';
import {useIntl, useModel} from "@umijs/max";
import useTabStore from "@/store/tab/useTabStore";
import LocaleSwitcher from '@/components/LocaleSwitcher';
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
export function getHomeRightContent(intl: IntlShape): React.ReactNode[] {
  const wechatLabel = intl.formatMessage({ id: 'homeLayout.chrome.wechatOfficial' });
  return [
    <LocaleSwitcher key="locale" variant="chrome" />,
    <Popover
      key="mp"
      placement="bottom"
      title={wechatLabel}
      content={<Image src="/mp.jpg" />}
      trigger="hover"
    >
      <span role="img" aria-label={wechatLabel} style={{ display: 'inline-flex', cursor: 'pointer' }}>
        <TwoDimensionalCodeOne theme="filled" size="18" fill={erdColors.brand} strokeWidth={2} />
      </span>
    </Popover>,
    <a
      key="github"
      className="erd-chrome-link"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/erdonline/erdonline"
      aria-label={intl.formatMessage({ id: 'homeLayout.chrome.githubAria' })}
    >
      {intl.formatMessage({ id: 'homeLayout.chrome.github' })}
    </a>,
  ];
}

/** 头像菜单：仅保留已接线入口（个人中心 / 授权信息 / 退出）；无假项 */
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

type HomeRoute = {
  path?: string;
  name?: string;
  icon?: React.ReactNode;
  exact?: boolean;
};

const HomeLayout: React.FC<HomeLayoutLayoutProps> = props => {
  const location = useLocation();
  const pathname = location.pathname;
  const intl = useIntl();
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

  /** 账号设置侧栏在主内容内：首 Skip 直达表单区，绕开顶栏+侧栏 */
  const isAccountSettings = pathname.startsWith('/account/settings');
  const skipTargetId = isAccountSettings
    ? 'account-settings-form'
    : 'home-main-content';
  const skipLabel = intl.formatMessage({
    id: isAccountSettings ? 'homeLayout.skip.form' : 'homeLayout.skip.main',
  });
  const skipTestId = isAccountSettings ? 'account-skip-form' : 'home-skip-main';

  const homeRightContent = useMemo(() => getHomeRightContent(intl), [intl]);
  const menuHeaderDropdown = useMemo(() => getMenuHeaderDropdown(intl), [intl]);

  return (
    <Theme>
      <Layout className="home-layout" data-testid="home-layout">
        <nav
          className="erd-skip-nav"
          aria-label={intl.formatMessage({id: 'common.skipNav'})}
          data-testid="home-skip-nav"
        >
          <a
            href={`#${skipTargetId}`}
            className="erd-skip-link"
            data-testid={skipTestId}
            onClick={(e) => {
              e.preventDefault();
              focusSkipTarget(skipTargetId);
            }}
          >
            {skipLabel}
          </a>
        </nav>
        <Header
          className="erd-chrome-header home-layout__header"
          data-testid="erd-chrome-header"
        >
          <div
            className="erd-chrome-brand"
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
          <Menu
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={menuItems}
            className="home-layout__menu"
            data-testid="home-layout-menu"
            aria-label={intl.formatMessage({ id: 'homeLayout.mainNavAria' })}
          />
          <div className="erd-chrome-actions" data-testid="erd-chrome-actions">
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
                aria-label={intl.formatMessage({ id: 'designLayout.user.menuAria' })}
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
