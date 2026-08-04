import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Menu} from 'antd';
import BaseView from './components/base';
import SecurityView from './components/security';
import OAuthClientsView from './components/oauthClients';
import styles from './style.less';
import Identification from '@/pages/account/settings/components/identification';
import {useSearchParams} from '@@/exports';
import {history} from 'umi';

const {Item} = Menu;

type SettingsStateKeys = 'base' | 'security' | 'oauthClients' | 'identification';
type SettingsState = {
  mode: 'inline' | 'horizontal';
  selectKey: SettingsStateKeys;
};

const SETTINGS_KEYS: SettingsStateKeys[] = [
  'base',
  'security',
  'oauthClients',
  'identification',
];

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
    oauthClients: 'OAuth 客户端',
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
      setInitConfig((prev) => (prev.mode === mode ? prev : {...prev, mode}));
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
        return <BaseView />;
      case 'security':
        return <SecurityView />;
      case 'oauthClients':
        return <OAuthClientsView />;
      case 'identification':
        return <Identification />;
      default:
        return null;
    }
  };

  const selectTab = (key: SettingsStateKeys) => {
    setInitConfig((prev) => ({...prev, selectKey: key}));
    history.replace(`/account/settings?selectKey=${key}`);
  };

  return (
    <div
      className={styles.main}
      data-testid="account-settings-page"
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
          aria-label="设置分类"
          onClick={({key}) => {
            selectTab(key as SettingsStateKeys);
          }}
        >
          {getMenu()}
        </Menu>
      </div>
      <div
        className={styles.right}
        id="account-settings-form"
        tabIndex={-1}
        data-testid="account-settings-form"
      >
        <div
          className={`${styles.title} account-settings-page__title`}
          role="heading"
          aria-level={1}
        >
          {menuMap[initConfig.selectKey]}
        </div>
        {renderChildren()}
      </div>
    </div>
  );
};
export default Settings;
