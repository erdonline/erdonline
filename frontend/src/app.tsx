import React from 'react';
import { ConfigProvider } from 'antd';
import { captureAttribution } from '@/utils/analytics';
import { erdTheme } from '@/theme/tokens';

/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<{}> {
  // 推广链路度量：首触 UTM/referrer 归因（幂等、不覆盖）
  captureAttribution();
  return {}
}

/**
 * 全站 antd 主题（ADR-0027 / 精密 IA）：layout:false 的登录/注册/404/分享
 * 也吃 brand primary；工作台 Theme 仍可再挂 locale，嵌套幂等。
 */
export function rootContainer(container: React.ReactNode) {
  return <ConfigProvider theme={erdTheme}>{container}</ConfigProvider>;
}
