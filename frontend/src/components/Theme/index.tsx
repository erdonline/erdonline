import React from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { Outlet } from '@@/exports';
import { erdTheme } from '@/theme/tokens';

export type ThemeProps = {
  /** 传入则渲染 children；否则渲染路由 Outlet（Umi 布局默认） */
  children?: React.ReactNode;
};

/**
 * 工作台 antd 主题入口：tokens + 中文 locale。
 * Pro/presets 摘除后不再注入 zh_CN；缺 locale 时 Modal 默认 OK/Cancel，
 * 会卡死依赖「确定」的创建项目等 E2E/旅程。
 */
const Theme: React.FC<ThemeProps> = ({ children }) => (
  <ConfigProvider theme={erdTheme} locale={zhCN}>
    {children !== undefined ? children : <Outlet />}
  </ConfigProvider>
);

export default React.memo(Theme);
