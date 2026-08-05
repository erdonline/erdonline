import React, { useMemo } from 'react';
import { ConfigProvider } from 'antd';
import { Outlet } from '@@/exports';
import { useIntl } from '@umijs/max';
import { erdTheme } from '@/theme/tokens';
import { getAntdLocale } from '@/utils/getAntdLocale';

export type ThemeProps = {
  /** 传入则渲染 children；否则渲染路由 Outlet（Umi 布局默认） */
  children?: React.ReactNode;
};

/**
 * 工作台 antd 主题入口：tokens + umi locale → antd ConfigProvider。
 * 缺 locale 时 Modal 默认 OK/Cancel，会卡死依赖「确定」的创建项目等 E2E/旅程。
 */
const Theme: React.FC<ThemeProps> = ({ children }) => {
  const { locale } = useIntl();
  const antdLocale = useMemo(() => getAntdLocale(locale), [locale]);

  return (
    <ConfigProvider theme={erdTheme} locale={antdLocale}>
      {children !== undefined ? children : <Outlet />}
    </ConfigProvider>
  );
};

export default React.memo(Theme);
