import React, {useEffect, useMemo} from 'react';
import {useLocation} from 'react-router-dom';
import defaultProps from './_defaultProps';
import {history, Link, Outlet} from "@@/exports";
import { QrcodeOutlined } from '@ant-design/icons';
import {Image, Layout, Menu, Popover, Typography} from "antd";
import type {MenuProps} from 'antd';
import type {IntlShape} from '@umijs/max';
import {useIntl, useModel} from "@umijs/max";
import useTabStore from "@/store/tab/useTabStore";
import LocaleSwitcher from '@/components/LocaleSwitcher';
import ChromeNotificationsButton from '@/components/ChromeNotificationsButton';
import ChromeUserMenu from '@/components/ChromeUserMenu';
import Theme from "@/components/Theme";
import { erdColors } from "@/theme/tokens";
import { resolveRouteLabel } from '@/utils/resolveRouteLabel';
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
        <QrcodeOutlined style={{ fontSize: 18, color: erdColors.brand }} />
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

/** @deprecated 请直接从 @/components/ChromeUserMenu 导入 */
export { getMenuHeaderDropdown } from '@/components/ChromeUserMenu';

type HomeRoute = {
  path?: string;
  name?: string;
  nameKey?: string;
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
        const routeLabel = resolveRouteLabel(intl, r);
        const label = isExternal ? (
          <a href={r.path} target="_blank" rel="noreferrer">
            {routeLabel}
          </a>
        ) : (
          <Link to={r.path || '/home'}>{routeLabel}</Link>
        );
        return {
          key: r.path || r.nameKey || String(routeLabel),
          icon: r.icon,
          label,
        };
      }),
    [routes, intl],
  );

  const selectedKey = useMemo(() => {
    const matches = routes
      .filter(
        (r) => r.path && !r.path.startsWith('http') && pathname.startsWith(r.path),
      )
      .sort((a, b) => (b.path?.length ?? 0) - (a.path?.length ?? 0));
    return matches[0]?.path || '/home';
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
            onClick={() => history.push('/')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                history.push('/');
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
            <ChromeNotificationsButton />
            <ChromeUserMenu />
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
