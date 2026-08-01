import Upgrade from "@/components/dialog/upgrade";
import DesignLeftContent from "@/components/LeftContent/DesignLeftContent";
import QueryLeftContent from "@/components/LeftContent/QueryLeftContent";
import PageSkeleton from "@/components/PageSkeleton";
import CollabPresence from "@/components/CollabPresence";
import ShareProjectButton from "@/components/ShareProjectButton";
import Theme from "@/components/Theme";
import { menuHeaderDropdown } from "@/layouts/HomeLayout";
import { GET } from "@/services/crud";
import useProjectStore from "@/store/project/useProjectStore";
import * as cache from "@/utils/cache";
import { CONSTANT } from "@/utils/constant";
import { history, useSearchParams } from "@@/exports";
import { useAccess } from "@@/plugin-access";
import { PageContainer, ProCard, ProLayout, ProSettings, WaterMark } from "@ant-design/pro-components";
import { Me, TwoDimensionalCodeOne } from "@icon-park/react";
import {
  useUnmount
} from '@umijs/hooks';
import { Link, useModel } from "@umijs/max";
import { Dropdown, Image, Popover } from "antd";
import React, { useEffect, useState } from 'react';
import shallow from "zustand/shallow";
import defaultProps from './_defaultProps';
import './index.less';

export const siderWidth = 400;
const licence = cache.getItem2object('licence');

export const headRightContent = [
  <CollabPresence key="presence" />,
  <ShareProjectButton key="share" />,
  licence?.licensedStartTime ? '' : <Upgrade />,
  <Popover placement="bottom" title="公众号" content={<Image src="/mp.jpg" />} trigger="hover">
    <TwoDimensionalCodeOne theme="filled" size="18" fill="#DE2910" strokeWidth={2} />
  </Popover>,
  <a style={{ marginTop: '-10px' }} target={"_blank"} href='https://gitee.com/MARTIN-88/erd-online'><img
    src='https://gitee.com/MARTIN-88/erd-online/badge/star.svg?theme=white' alt='star'></img></a>,

];


export interface DesignLayoutLayoutProps {
  children: any;
}

export function fixRouteAccess(defaultPropsTmp: any, access: any) {
  const routes = defaultPropsTmp.route.routes.map((m: any) => {
    const pathAccess = access[m?.access];
    if (pathAccess !== false) {
      return {
        ...m,
        routes: m?.routes?.map((m1: any) => {
          const pathAccess1 = access[m1?.access];
          if (pathAccess1 !== false) {
            return m1;
          }
        })
      };
    }
  });

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

const DesignLayout: React.FC<DesignLayoutLayoutProps> = props => {
  const access = useAccess();

  const [pathname, setPathname] = useState('/design/table/model');
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

  useEffect(() => {
    fetch(projectId);
  }, [projectId]);


  const settings: Partial<ProSettings> | undefined = {
    fixSiderbar: true,
    layout: 'top',
    splitMenus: true,

  };
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
        defaultProps.route.routes = fixRouteAccess(defaultProps, access);
      }
    } else {
      setInitialState((s: any) => ({ ...s, access: { person: true } }));
    }
  }, [project, access.initialized, defaultProps.route.routes])


  // 页面卸载
  useUnmount(() => {
    closeSocket(projectId);
  });

  const licence = cache.getItem2object('licence');


  return (
    <WaterMark content={[licence?.licensedTo ? licence?.licensedTo : 'ERD Online', 'V5.0.0']}>
      <ProLayout
        logo={"/logo.svg"}
        title={'ERD Online'}
        bgLayoutImgList={[
          {
            src: '/ant-1.png',
            left: 85,
            bottom: 100,
            height: '303px',
          },
          {
            src: '/ant-1.png',
            bottom: -68,
            right: -45,
            height: '303px',
          },
          {
            src: '/ant-3.png',
            bottom: 0,
            left: 0,
            width: '331px',
          },
        ]}
        layout="mix"  // 改为混合布局,顶部+侧边栏
        navTheme="light"  // 导航主题改为亮色
        headerTheme="light"  // 头部主题改为亮色
        primaryColor="#DE2910"
        contentWidth="Fluid"  // 内容区域宽度改为流式
        fixedHeader  // 固定头部
        headerHeight={64}  // 设置头部高度
        {...defaultProps}
        location={{
          pathname,
          search: 'a=1'
        }}
        menu={{
          type: 'group',
        }}
        avatarProps={{
          src: <Me theme="filled" size="28" fill="#DE2910" strokeWidth={2} />,
          size: 'small',
          title: <Dropdown
            placement="bottom"
            arrow={{ pointAtCenter: true }}
            overlay={menuHeaderDropdown}
          >
            <div>{cache.getItem('username')}</div>
          </Dropdown>,
        }}
        menuExtraRender={(props) => {
          return (
            pathname === '/design/table/model' || pathname === '/design/table/chatsql'
              ? <DesignLeftContent collapsed={props.collapsed} />
              : pathname === '/design/table/query'
                ? <QueryLeftContent collapsed={props.collapsed} /> : null

          )
        }}
        siderWidth={siderWidth}
        actionsRender={(props) => {
          if (props.isMobile) return [];

          return headRightContent;
        }}
        menuFooterRender={(props) => {
          if (props?.collapsed) return undefined;
          return (
            <div
              style={{
                textAlign: 'center',
                paddingBlockStart: 12,
              }}
            >
              <div>{project.projectName}</div>
              <div>© 2024 Made with 零代科技</div>
              <div>ERD Online</div>
            </div>
          );
        }}
        onMenuHeaderClick={(e) => history.push("/")}
        itemRender={(route, params, routes, paths) => {
          const first = routes.indexOf(route) === 0;
          return first ? (
            <Link to={paths.join('/')}>{route.breadcrumbName}</Link>
          ) : (
            <span>{route.breadcrumbName}</span>
          );
        }}
        menuItemRender={(item, dom) => {
          return (

            item.path?.startsWith('http') || item.exact ?
              <a href={item.path} target={'_blank'}>
                {dom}
              </a>
              :
              <div
                onClick={() => {
                  setPathname(item?.path || pathname);
                }}
              >
                <Link to={item?.path + "?projectId=" + projectId || '/home'}>{dom}</Link>
              </div>

          );
        }}
        {...settings}
      >
        <PageContainer
          header={{
            title: false,
          }}
          className="no-padding-container"
        >
          <ProCard
            className="no-margin-card"
          >
            <Theme />
            {projectLoading ? <PageSkeleton rows={6} /> : props.children}
          </ProCard>
        </PageContainer>
      </ProLayout>
    </WaterMark>
  );
}
export default React.memo(DesignLayout)
