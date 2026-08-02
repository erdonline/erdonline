import React, {useEffect, useState} from 'react';
import {useLocation} from 'react-router-dom';
import defaultProps from './_defaultProps';
import {history, Link} from "@@/exports";
import {PageContainer, ProCard, ProLayout, ProSettings, WaterMark} from '@ant-design/pro-components';
import {Me} from "@icon-park/react";
import {Dropdown, Menu, Typography, Space} from "antd";
import {logout} from "@/utils/request";
import * as cache from "@/utils/cache";
import {useModel} from "@umijs/max";
import useTabStore from "@/store/tab/useTabStore";
import Theme from "@/components/Theme";
import {LogoutOutlined, UserOutlined} from "@ant-design/icons";
import businessSlogansData from './businessSlogans.json';

const { Text } = Typography;


export interface HomeLayoutLayoutProps {
  children?: React.ReactNode;
}

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

const HomeLayout: React.FC<HomeLayoutLayoutProps> = props => {
  const location = useLocation();
  const [pathname, setPathname] = useState(location.pathname);
  const {setInitialState} = useModel('@@initialState');
  const {tabDispatch} = useTabStore(state => ({tabDispatch: state.dispatch}));
  const [currentSlogan, setCurrentSlogan] = useState(() => {
    // 初始化时随机选择一条话术
    return businessSlogansData.slogans[Math.floor(Math.random() * businessSlogansData.slogans.length)];
  });

  useEffect(() => {
    tabDispatch.removeAllTab({});
    setInitialState((s: any) => ({...s, access: {}}));
  }, [])

  const settings: ProSettings | undefined = {
    "layout": "top", // Changed from "mix" to "top"
    "navTheme": "light",
    "contentWidth": "Fluid",
    "fixedHeader": true,
    // Removed "fixSiderbar" and "siderMenuType" as they're not applicable to top layout
  };

  const licence = cache.getItem2object('licence');

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentSlogan(() => {
        // 每次更新时随机选择一条新的话术
        let newSlogan;
        do {
          newSlogan = businessSlogansData.slogans[Math.floor(Math.random() * businessSlogansData.slogans.length)];
        } while (newSlogan === currentSlogan); // 确保新选择的话术与当前的不同
        return newSlogan;
      });
    }, 10000); // 每10秒更换一次话术

    return () => clearInterval(intervalId);
  }, [currentSlogan]);

  return (
    <WaterMark content={[licence?.licensedTo?licence?.licensedTo:'ERD Online', 'V5.0.0']}>
      <ProLayout
        logo={"/logo.svg"}
        title={"ERD Online"}
        {...defaultProps}
        location={{
          pathname,
        }}
        avatarProps={{
          src: <Me theme="filled" size="28" fill="#DE2910" strokeWidth={2}/>,
          title: <Dropdown
            placement="bottomRight" // Changed from "bottom" to "bottomRight"
            arrow={{pointAtCenter: true}}
            overlay={menuHeaderDropdown}>
            <div
              role="button"
              tabIndex={0}
              aria-label="用户菜单"
              data-testid="user-menu-trigger"
            >
              {cache.getItem('username')}
            </div>
          </Dropdown>,
        }}
        actionsRender={() => {
          // Home 仅头像/用户菜单；SaveStatus / 分享 / presence 仅 DesignLayout
          return [];
        }}
        onMenuHeaderClick={() => history.push('/home')}
        menuItemRender={(item, dom) => (
          <Link to={item.path || '/home'}>{dom}</Link>
        )}
        {...settings}
      >
        <PageContainer
          title={false}
          style={{
            height: 'calc(100vh - 70px)', // 减去头部导航的高度
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden', // 防止出现滚动条

          }}
        >
          <ProCard
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden', // 防止出现滚动条
            }}
          >
            <div style={{ flex: 1, overflow: 'auto' }}>
              <Theme />
              {props.children}
              <div style={{ textAlign: 'center' }}>
                <Space split={<Text type="secondary"> | </Text>} wrap>
                  <Text type="secondary">{currentSlogan}</Text>
                  <Text type="secondary">© 2026 ERD Online · MIT</Text>
                  <Text type="secondary">ERD Online</Text>
                </Space>
              </div>
            </div>
          </ProCard>

        </PageContainer>
      </ProLayout>
    </WaterMark>
  );
}

export default React.memo(HomeLayout);
