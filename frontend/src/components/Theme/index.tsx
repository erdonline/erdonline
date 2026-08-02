import React from 'react';
import { ConfigProvider } from 'antd';
import { Outlet } from '@@/exports';
import { erdTheme } from '@/theme/tokens';

export type ThemeProps = {
  /** 传入则渲染 children；否则渲染路由 Outlet（Umi 布局默认） */
  children?: React.ReactNode;
};

/** 工作台 antd 主题入口：颜色/圆角/间距优先走 ConfigProvider tokens */
const Theme: React.FC<ThemeProps> = ({ children }) => (
  <ConfigProvider theme={erdTheme}>
    {children !== undefined ? children : <Outlet />}
  </ConfigProvider>
);

export default React.memo(Theme);
