import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {GridContent} from '@ant-design/pro-layout';
import {Dropdown, Menu} from 'antd';
import BaseView from './components/base';
import SecurityView from './components/security';
import styles from './style.less';
import Identification from "@/pages/account/settings/components/identification";
import {PageContainer, ProCard, ProLayout, ProSettings, WaterMark} from '@ant-design/pro-components';
import {headRightContent} from "@/layouts/DesignLayout";
import {Me} from "@icon-park/react";
import * as cache from "@/utils/cache";
import {menuHeaderDropdown} from "@/layouts/HomeLayout";
import {useSearchParams} from "@@/exports";
import { history } from 'umi';

const {Item} = Menu;

type SettingsStateKeys = 'base' | 'security' | 'identification';
type SettingsState = {
  mode: 'inline' | 'horizontal';
  selectKey: SettingsStateKeys;
};

const SETTINGS_KEYS: SettingsStateKeys[] = ['base', 'security', 'identification'];

function parseSelectKey(raw: string | null): SettingsStateKeys {
  if (raw && SETTINGS_KEYS.includes(raw as SettingsStateKeys)) {
    return raw as SettingsStateKeys;
  }
  return 'base';
}

const Settings: React.FC = () => {
  const menuMap: Record<SettingsStateKeys, React.ReactNode> = {
    base: '基本设置',
    security: '安全设置',
    identification: '授权类型',
  };

  const [searchParams] = useSearchParams();
  const selectKeyFromUrl = parseSelectKey(searchParams.get('selectKey'));

  const [initConfig, setInitConfig] = useState<SettingsState>({
    mode: 'inline',
    selectKey: selectKeyFromUrl,
  });
  const dom = useRef<HTMLDivElement>();

  useEffect(() => {
    setInitConfig((prev) =>
      prev.selectKey === selectKeyFromUrl
        ? prev
        : {...prev, selectKey: selectKeyFromUrl},
    );
  }, [selectKeyFromUrl]);

  const resize = () => {
    requestAnimationFrame(() => {
      if (!dom.current) {
        return;
      }
      let mode: 'inline' | 'horizontal' = 'inline';
      const {offsetWidth} = dom.current;
      if (dom.current.offsetWidth < 641 && offsetWidth > 400) {
        mode = 'horizontal';
      }
      if (window.innerWidth < 768 && offsetWidth > 400) {
        mode = 'horizontal';
      }
      setInitConfig((prev) =>
        prev.mode === mode ? prev : {...prev, mode},
      );
    });
  };

  useLayoutEffect(() => {
    if (dom.current) {
      window.addEventListener('resize', resize);
      resize();
    }
    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [dom.current]);

  const getMenu = () => {
    return SETTINGS_KEYS.map((item) => <Item key={item}>{menuMap[item]}</Item>);
  };

  const renderChildren = () => {
    const {selectKey} = initConfig;
    switch (selectKey) {
      case 'base':
        return <BaseView/>;
      case 'security':
        return <SecurityView/>;
      case 'identification':
        return <Identification/>;
      default:
        return null;
    }
  };
  const settings: ProSettings | undefined = {
    fixSiderbar: true,
    layout: 'top',
    splitMenus: true,
  };
  const [pathname] = useState('/home');


  const licence = cache.getItem2object('licence');

  const handleLogoClick = () => {
    history.push('/home');
  };

  const selectTab = (key: SettingsStateKeys) => {
    setInitConfig((prev) => ({...prev, selectKey: key}));
    history.replace(`/account/settings?selectKey=${key}`);
  };

  return (
    <WaterMark content={[licence?.licensedTo?licence?.licensedTo:'ERD Online', 'V5.0.0']}>

      <ProLayout
        logo={"/logo.svg"}
        title={"ERD Online"}
        onMenuHeaderClick={handleLogoClick}
        bgLayoutImgList={[
          {
            src: 'https://img.alicdn.com/imgextra/i2/O1CN01O4etvp1DvpFLKfuWq_!!6000000000279-2-tps-609-606.png',
            left: 85,
            bottom: 100,
            height: '303px',
          },
          {
            src: 'https://img.alicdn.com/imgextra/i2/O1CN01O4etvp1DvpFLKfuWq_!!6000000000279-2-tps-609-606.png',
            bottom: -68,
            right: -45,
            height: '303px',
          },
          {
            src: 'https://img.alicdn.com/imgextra/i3/O1CN018NxReL1shX85Yz6Cx_!!6000000005798-2-tps-884-496.png',
            bottom: 0,
            left: 0,
            width: '331px',
          },
        ]}
        location={{
          pathname,
        }}
        avatarProps={{
          src: <Me theme="filled" size="28" fill="#DE2910" strokeWidth={2}/>,
          title: <Dropdown
            placement="bottom"
            arrow={{pointAtCenter: true}}
            overlay={menuHeaderDropdown}>
            <div>{cache.getItem('username')}</div>
          </Dropdown>,
        }}
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
              <div>© 2026 ERD Online · MIT</div>
              <div>ERD Online</div>
            </div>
          );
        }}
        {...settings}
      >
        <PageContainer title={false}>
          <ProCard
            style={{
              height: '80vh',
              minHeight: 800,
            }}
          >
            <GridContent>
              <div
                className={styles.main}
                ref={(ref) => {
                  if (ref) {
                    dom.current = ref;
                  }
                }}
              >
                <div className={styles.leftMenu}>
                  <Menu
                    mode={initConfig.mode}
                    selectedKeys={[initConfig.selectKey]}
                    onClick={({key}) => {
                      selectTab(key as SettingsStateKeys);
                    }}
                  >
                    {getMenu()}
                  </Menu>
                </div>
                <div className={styles.right}>
                  <div className={styles.title}>{menuMap[initConfig.selectKey]}</div>
                  {renderChildren()}
                </div>
              </div>
            </GridContent>
          </ProCard>
        </PageContainer>
      </ProLayout>
    </WaterMark>

  );
};
export default Settings;
