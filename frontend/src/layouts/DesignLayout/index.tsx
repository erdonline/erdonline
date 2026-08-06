import { useProjectDraftGuard } from '@/hooks/useProjectDraftGuard';
import DesignLeftContent from "@/components/LeftContent/DesignLeftContent";
import PageSkeleton from "@/components/PageSkeleton";
import CollabPresence from "@/components/CollabPresence";
import SaveStatus from "@/components/SaveStatus";
import SaveVersionButton from "@/components/SaveVersionButton";
import VersionDirtyChip from "@/components/VersionDirtyChip";
import SchemaProbeControl from "@/components/SchemaProbeControl";
import ShareProjectButton from "@/components/ShareProjectButton";
import Theme from "@/components/Theme";
import { APP_VERSION_LABEL } from "@/constants/appVersion";
import { ProjectMenu } from "@/components/Menu";
import { ProjectMenuCloseContext } from "@/components/Menu/projectMenuClose";
import { getHomeRightContent } from "@/layouts/HomeLayout";
import ChromeNotificationsButton from '@/components/ChromeNotificationsButton';
import ChromeUserMenu from '@/components/ChromeUserMenu';
import { GET } from "@/services/crud";
import useProjectStore from "@/store/project/useProjectStore";
import * as cache from "@/utils/cache";
import { CONSTANT } from "@/utils/constant";
import { resolveRouteLabel } from '@/utils/resolveRouteLabel';
import { history, Outlet, useSearchParams } from "@@/exports";
import { useAccess } from "@@/plugin-access";
import { useUnmount } from '@umijs/hooks';
import { Link, useIntl, useModel } from "@umijs/max";
import {
  AuditOutlined,
  CaretDownOutlined,
  MoreOutlined,
  OrderedListOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Layout, Menu, Tooltip } from "antd";
import type { MenuProps } from "antd";
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from "react-router-dom";
import shallow from "zustand/shallow";
import defaultProps, { secondaryRoutes } from './_defaultProps';
import '../erd-chrome.less';
import './index.less';

const { Header, Sider, Content } = Layout;

export const siderWidth = 320;

/** GroupLayout 等复用：保存态/版本/协作/分享 + Home 安全子集（公众号/GitHub） */
export function getHeadRightContent(intl: ReturnType<typeof useIntl>): React.ReactNode[] {
  return [
    <div className="erd-chrome-status-cluster" key="status-cluster" data-testid="erd-chrome-status-cluster">
      <SaveStatus key="save-status" />
      <VersionDirtyChip key="version-dirty-chip" />
    </div>,
    <SaveVersionButton key="save-version" />,
    <CollabPresence key="presence" />,
    <ShareProjectButton key="share" />,
    ...getHomeRightContent(intl),
  ];
}


export type DesignLayoutLayoutProps = {
  children?: React.ReactNode;
};

type DesignRoute = {
  path?: string;
  name?: string;
  nameKey?: string;
  icon?: React.ReactNode;
  exact?: boolean;
  access?: string;
  routes?: DesignRoute[];
};

function filterAccessibleRoutes(routes: DesignRoute[], access: Record<string, unknown>): DesignRoute[] {
  return routes
    .map((m) => {
      const pathAccess = m?.access ? access[m.access] : undefined;
      if (pathAccess === false) {
        return undefined;
      }
      return {
        ...m,
        routes: m?.routes
          ?.map((m1) => {
            const pathAccess1 = m1?.access ? access[m1.access] : undefined;
            if (pathAccess1 === false) {
              return undefined;
            }
            return m1;
          })
          .filter(Boolean) as DesignRoute[] | undefined,
      };
    })
    .filter(Boolean) as DesignRoute[];
}

export function fixRouteAccess(defaultPropsTmp: { route: { routes: DesignRoute[] } }, access: Record<string, unknown>) {
  const routes = filterAccessibleRoutes(defaultPropsTmp.route.routes || [], access);
  return routes;
}

export function getNowTimeParse() {
  const time = new Date();
  const YYYY = time.getFullYear();
  const MM =
    time.getMonth() < 9 ? '0' + (time.getMonth() + 1) : time.getMonth() + 1;
  const DD = time.getDate() < 10 ? '0' + time.getDate() : time.getDate();
  const hh = time.getHours() < 10 ? '0' + time.getHours() : time.getHours();
  const mm =
    time.getMinutes() < 10 ? '0' + time.getMinutes() : time.getMinutes();
  const ss =
    time.getSeconds() < 10 ? '0' + time.getSeconds() : time.getSeconds();
  const ms = time.getMilliseconds();

  return `${YYYY}-${MM}-${DD}T${hh}:${mm}:${ss}.${ms}`;
}

const ProjectMenuDropdown: React.FC<{ projectName?: string }> = ({ projectName }) => {
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const ignoreOpenRef = React.useRef(false);
  // 菜单内点开 Modal 后关闭下拉；短时忽略随后的 onOpenChange(true) 回声
  const closeMenu = () => {
    ignoreOpenRef.current = true;
    setOpen(false);
    window.setTimeout(() => {
      ignoreOpenRef.current = false;
    }, 400);
  };
  const label =
    projectName?.trim() ||
    intl.formatMessage({ id: 'designLayout.project.fallback' });
  return (
    <ProjectMenuCloseContext.Provider value={closeMenu}>
      <Dropdown
        trigger={['click']}
        open={open}
        onOpenChange={(next) => {
          if (next && ignoreOpenRef.current) {
            return;
          }
          setOpen(next);
        }}
        // 菜单内 ModalForm 依赖挂载；关闭下拉时勿销毁，否则弹窗一并卸掉。
        // 关闭后须禁点击，否则残留层会挡住弹窗（导出 DDL TreeSelect 等）。
        destroyPopupOnHide={false}
        dropdownRender={() => (
          <div
            className={
              open
                ? 'erd-project-menu'
                : 'erd-project-menu erd-project-menu--closed'
            }
            data-testid="project-menu-panel"
            aria-hidden={!open}
          >
            <ProjectMenu open={open} />
          </div>
        )}
      >
        <Button
          type="text"
          aria-label={intl.formatMessage({ id: 'designLayout.project.menuAria' })}
          className="design-layout__project"
          data-testid="project-menu-trigger"
        >
          <span className="design-layout__project-name">{label}</span>
          <CaretDownOutlined />
        </Button>
      </Dropdown>
    </ProjectMenuCloseContext.Provider>
  );
};

const ChromeOverflow: React.FC = () => {
  const intl = useIntl();
  const items: MenuProps['items'] = useMemo(
    () => [
      {
        key: 'extras',
        type: 'group',
        label: (
          <div className="design-layout__overflow-extras" onClick={(e) => e.stopPropagation()}>
            {getHomeRightContent(intl)}
          </div>
        ),
      },
      { type: 'divider' },
      {
        key: 'app-version',
        label: APP_VERSION_LABEL,
        disabled: true,
      },
    ],
    [intl],
  );

  return (
    <Dropdown
      menu={{ items, className: 'erd-dense-menu' }}
      trigger={['click']}
      placement="bottomRight"
    >
      <Button
        type="text"
        className="design-layout__overflow"
        aria-label={intl.formatMessage({ id: 'designLayout.overflow.moreAria' })}
        data-testid="design-chrome-overflow"
        icon={<MoreOutlined />}
      />
    </Dropdown>
  );
};

function routeLinkLabel(
  item: DesignRoute,
  projectId: string,
  intl: ReturnType<typeof useIntl>,
): React.ReactNode {
  const routeLabel = resolveRouteLabel(intl, item);
  const isExternal = Boolean(item.exact) || Boolean(item.path?.startsWith('http'));
  if (isExternal) {
    return (
      <a href={item.path} target="_blank" rel="noreferrer">
        {routeLabel}
      </a>
    );
  }
  return (
    <Link to={`${item.path || '/home'}?projectId=${projectId}`}>
      {routeLabel}
    </Link>
  );
}

const DesignLayout: React.FC<DesignLayoutLayoutProps> = () => {
  const intl = useIntl();
  const access = useAccess();
  const location = useLocation();
  const pathname = location.pathname || '/design/table/model';
  const [collapsed, setCollapsed] = useState(false);
  const [searchParams] = useSearchParams();
  let projectId = searchParams.get("projectId") || '';

  if (!projectId || projectId === '') {
    projectId = cache.getItem(CONSTANT.PROJECT_ID) || '';
  } else {
    cache.setItem(CONSTANT.PROJECT_ID, projectId);
  }


  const { fetch, project, projectLoading, initSocket, closeSocket } = useProjectStore(
    state => ({
      fetch: state.fetch,
      project: state.project,
      projectLoading: state.projectLoading,
      initSocket: state.initSocket,
      closeSocket: state.closeSocket,
    }), shallow);

  useProjectDraftGuard(projectId);

  useEffect(() => {
    fetch(projectId);
  }, [projectId]);

  const { setInitialState } = useModel('@@initialState');


  useEffect(() => {
    if (!project || !projectId) return;
    // P3b：任意设计器会话进房间 presence（不再依赖 localhost:3000）
    initSocket(projectId);
    if (project.type === '2') {
      GET("/ncnb/project/group/currentRolePermission", {
        projectId
      }).then(r => {
        if (r?.code === 200) {
          r?.data?.permission?.push('initialized');
          setInitialState((s: any) => ({ ...s, access: { ...r.data, person: false } }));
        }
      })
      if (access.initialized) {
        defaultProps.route.routes = fixRouteAccess(
          defaultProps,
          access as Record<string, unknown>,
        ) as typeof defaultProps.route.routes;
      }
    } else {
      setInitialState((s: any) => ({ ...s, access: { person: true } }));
    }
  }, [project, access.initialized, defaultProps.route.routes])


  // 页面卸载
  useUnmount(() => {
    closeSocket(projectId);
  });

  const primaryRoutes = ((defaultProps.route.routes || []) as DesignRoute[]).filter(Boolean);
  const allNavRoutes = useMemo(() => {
    const secondary = filterAccessibleRoutes(
      secondaryRoutes as DesignRoute[],
      access as Record<string, unknown>,
    );
    return [...primaryRoutes, ...secondary];
    // primaryRoutes 来自可变 defaultProps；access.initialized 变化时需重算
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access.initialized, primaryRoutes.length, access]);

  const topMenuItems: MenuProps['items'] = useMemo(
    () =>
      primaryRoutes.map((r) => ({
        key: r.path || r.nameKey || String(resolveRouteLabel(intl, r)),
        icon: r.icon,
        label: resolveRouteLabel(intl, r),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [access.initialized, primaryRoutes.length, intl],
  );

  const activeTopRoute = useMemo(() => {
    const match = allNavRoutes.find(
      (r) =>
        r.path &&
        !r.path.startsWith('http') &&
        (pathname === r.path || pathname.startsWith(`${r.path}/`)),
    );
    return match;
  }, [allNavRoutes, pathname]);

  const topSelectedKey = useMemo(() => {
    const match = primaryRoutes.find(
      (r) =>
        r.path &&
        (pathname === r.path || pathname.startsWith(`${r.path}/`)),
    );
    return match?.path;
  }, [primaryRoutes, pathname]);

  const siderChildRoutes = useMemo(
    () => (activeTopRoute?.routes || []).filter(Boolean) as DesignRoute[],
    [activeTopRoute],
  );

  const siderMenuItems: MenuProps['items'] = useMemo(
    () =>
      siderChildRoutes.map((r) => ({
        key: r.path || r.nameKey || String(resolveRouteLabel(intl, r)),
        icon: r.icon,
        label: routeLinkLabel(r, projectId, intl),
      })),
    [siderChildRoutes, projectId, intl],
  );

  const siderSelectedKey = useMemo(() => {
    const match = siderChildRoutes.find(
      (r) => r.path && pathname.startsWith(r.path),
    );
    return match?.path;
  }, [siderChildRoutes, pathname]);

  const showDesignLeft = pathname === '/design/table/model';
  const showSiderNav = siderChildRoutes.length > 0;
  const showSider = showDesignLeft || showSiderNav;
  const showTreeSkip = showDesignLeft && !collapsed;

  const focusSkipTarget = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.focus({ preventScroll: false });
    el.scrollIntoView({ block: 'nearest' });
  };

  return (
    <Layout className="design-layout" data-testid="design-layout">
      <nav
        className="erd-skip-nav"
        aria-label={intl.formatMessage({id: 'common.skipNav'})}
        data-testid="erd-skip-nav"
      >
        {showTreeSkip ? (
          <a
            href="#erd-design-tree"
            className="erd-skip-link"
            data-testid="erd-skip-tree"
            onClick={(e) => {
              e.preventDefault();
              focusSkipTarget('erd-design-tree');
            }}
          >
            {intl.formatMessage({ id: 'designLayout.skip.tree' })}
          </a>
        ) : null}
        <a
          href="#erd-design-workspace"
          className="erd-skip-link"
          data-testid="erd-skip-workspace"
          onClick={(e) => {
            e.preventDefault();
            focusSkipTarget('erd-design-workspace');
          }}
        >
          {intl.formatMessage({ id: 'designLayout.skip.workspace' })}
        </a>
      </nav>
      <Header
        className="erd-chrome-header design-layout__header"
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
        <ProjectMenuDropdown projectName={project?.projectName} />
        <div className="design-layout__top-menu-wrap" data-testid="design-top-tabs">
          <Menu
            mode="horizontal"
            selectedKeys={topSelectedKey ? [topSelectedKey] : []}
            items={topMenuItems}
            className="design-layout__top-menu"
            onClick={({ key }) => {
              const route = primaryRoutes.find((r) => r.path === key);
              if (!route?.path || route.path.startsWith('http') || route.exact) {
                return;
              }
              // 有子路由时进第一个子页（对齐 ProLayout splitMenus 点击父项行为）
              const firstChild = (route.routes || []).filter(Boolean)[0] as DesignRoute | undefined;
              const target = firstChild?.path || route.path;
              history.push(`${target}?projectId=${projectId}`);
            }}
          />
        </div>
        <div className="erd-chrome-actions design-layout__actions" data-testid="erd-chrome-actions">
          <div className="erd-chrome-status-cluster" data-testid="erd-chrome-status-cluster">
            <SaveStatus key="save-status" />
            <VersionDirtyChip key="version-dirty-chip" />
            <SchemaProbeControl key="schema-probe" variant="chrome" />
          </div>
          <SaveVersionButton key="save-version" />
          <CollabPresence key="presence" />
          <ShareProjectButton key="share" />
          <div className="design-layout__workflow" data-testid="design-workflow-links">
            <Tooltip title={intl.formatMessage({ id: 'designLayout.workflow.myOrders' })}>
              <Button
                type="text"
                size="small"
                className="design-layout__workflow-btn"
                icon={<OrderedListOutlined />}
                aria-label={intl.formatMessage({ id: 'designLayout.workflow.myOrders' })}
                data-testid="design-workflow-my-orders"
                onClick={() =>
                  history.push(`/design/table/version/order?projectId=${projectId}`)
                }
              >
                {intl.formatMessage({ id: 'designLayout.workflow.myOrders' })}
              </Button>
            </Tooltip>
            <Tooltip
              title={intl.formatMessage({ id: 'designLayout.workflow.pendingApprovalAria' })}
            >
              <Button
                type="text"
                size="small"
                className="design-layout__workflow-btn"
                icon={<AuditOutlined />}
                aria-label={intl.formatMessage({
                  id: 'designLayout.workflow.pendingApprovalAria',
                })}
                data-testid="design-workflow-pending-approval"
                onClick={() =>
                  history.push(`/design/table/version/approval?projectId=${projectId}`)
                }
              >
                {intl.formatMessage({ id: 'designLayout.workflow.pendingApproval' })}
              </Button>
            </Tooltip>
            <ChromeNotificationsButton variant="workflow" />
          </div>
          <ChromeOverflow />
          <ChromeUserMenu />
        </div>
      </Header>
      <Layout>
        {showSider ? (
          <Sider
            width={siderWidth}
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            className="design-layout__sider"
            theme="light"
          >
            <div className="design-layout__sider-inner">
              {showDesignLeft ? (
                <DesignLeftContent collapsed={collapsed} />
              ) : null}
              {showSiderNav ? (
                <Menu
                  mode="inline"
                  selectedKeys={siderSelectedKey ? [siderSelectedKey] : []}
                  items={siderMenuItems}
                  className="design-layout__sider-menu"
                  data-testid="design-layout-sider-menu"
                  aria-label={intl.formatMessage({ id: 'designLayout.sider.navAria' })}
                />
              ) : null}
            </div>
          </Sider>
        ) : null}
        <Content
          id="erd-design-workspace"
          className="design-layout__content"
          tabIndex={-1}
          data-testid="erd-design-workspace"
          aria-label={intl.formatMessage({ id: 'designLayout.workspace.aria' })}
        >
          <Theme>
            {/* 硬导航首帧 store 仍为空且 projectLoading 尚未置 true；勿挂载子页（JExcel 等只 init 一次） */}
            {projectLoading || !project?.projectJSON ? (
              <PageSkeleton rows={6} />
            ) : (
              <Outlet />
            )}
          </Theme>
        </Content>
      </Layout>
    </Layout>
  );
}
export default React.memo(DesignLayout)
