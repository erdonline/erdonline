import React, {useEffect, useMemo, useState} from 'react';
import {useLocation} from 'react-router-dom';
import defaultProps from './_defaultProps';
import {history, Link} from "@@/exports";
import {Me, TwoDimensionalCodeOne} from "@icon-park/react";
import {Dropdown, Image, Layout, Menu, Popover, Typography, Space, Watermark} from "antd";
import type {MenuProps} from 'antd';
import {logout} from "@/utils/request";
import * as cache from "@/utils/cache";
import {useModel} from "@umijs/max";
import useTabStore from "@/store/tab/useTabStore";
import Theme from "@/components/Theme";
import { erdColors } from "@/theme/tokens";
import {APP_VERSION_LABEL} from "@/constants/appVersion";
import {LogoutOutlined, UserOutlined} from "@ant-design/icons";
import businessSlogansData from './businessSlogans.json';
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
      <TwoDimensionalCodeOne theme="filled" size="18" fill="#DE2910" strokeWidth={2} />
    </span>
  </Popover>,
  <a
    key="github"
    style={{ marginTop: '-10px' }}
    target="_blank"
    rel="noreferrer"
    href="https://github.com/erdonline/erdonline"
    aria-label="GitHub 仓库"
  >
    <img
      src="https://img.shields.io/github/stars/erdonline/erdonline?style=social"
      alt="GitHub stars"
    />
  </a>,
];

export const menuHeaderDropdown = (
  <Menu selectedKeys={[]}>
    <Menu.Item key="center" onClick={()=>{
      history.push("/account/settings?selectKey=base")
    }}>
      <UserOutlined/>
      个人中心
    </Menu.Item>
    <Menu.Divider/>
    <Menu.Item key="vip" onClick={()=>{
      history.push("/account/settings?selectKey=identification")
    }}>
      <UserOutlined/>
      授权信息
    </Menu.Item>
    <Menu.Divider/>

    <Menu.Item key="logout" onClick={() => {
      logout();
    }}>
      <LogoutOutlined/>
      退出登录
    </Menu.Item>
  </Menu>
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
  const [currentSlogan, setCurrentSlogan] = useState(() => {
    return businessSlogansData.slogans[Math.floor(Math.random() * businessSlogansData.slogans.length)];
  });

  useEffect(() => {
    tabDispatch.removeAllTab({});
    setInitialState((s: any) => ({...s, access: {}}));
  }, [])

  const licence = cache.getItem2object('licence');

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentSlogan(() => {
        let newSlogan;
        do {
          newSlogan = businessSlogansData.slogans[Math.floor(Math.random() * businessSlogansData.slogans.length)];
        } while (newSlogan === currentSlogan);
        return newSlogan;
      });
    }, 10000);

    return () => clearInterval(intervalId);
  }, [currentSlogan]);

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

  const watermarkContent = [
    licence?.licensedTo ? licence.licensedTo : 'ERD Online',
    APP_VERSION_LABEL,
  ];

  return (
    <Watermark content={watermarkContent}>
      <Layout className="home-layout">
        <Header className="home-layout__header">
          <div
            className="home-layout__brand"
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
          <div className="home-layout__actions">
            {homeRightContent}
            <Dropdown
              placement="bottomRight"
              arrow={{pointAtCenter: true}}
              overlay={menuHeaderDropdown}
            >
              <div
                className="home-layout__user"
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
          <div className="home-layout__body">
            <Theme />
            <div className="home-layout__footer">
              <Space split={<Text type="secondary"> | </Text>} wrap>
                <Text type="secondary">{currentSlogan}</Text>
                <Text type="secondary">© 2026 ERD Online · MIT</Text>
                <Text type="secondary">ERD Online</Text>
              </Space>
            </div>
          </div>
        </Content>
      </Layout>
    </Watermark>
  );
}

export default React.memo(HomeLayout);
