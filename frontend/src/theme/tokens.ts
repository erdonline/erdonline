import type { ThemeConfig } from 'antd';

/** 工作台亮色系统（与 docs/ui-home-model-redesign.md 一致；落地页深色门面不走此表） */
export const erdColors = {
  brand: '#DE2910',
  brandHover: '#B91E0C',
  ink900: '#0B1C2C',
  ink600: '#44525F',
  ink400: '#8A97A3',
  line: '#E4E7ED',
  surface: '#FFFFFF',
  surfaceSunk: '#FAFBFC',
  success: '#2F8F7B',
  warning: '#D48806',
} as const;

export const erdFontFamily =
  "'IBM Plex Sans', 'PingFang SC', 'Noto Sans SC', sans-serif";

/** antd 5 ConfigProvider.theme —— 颜色/圆角/字号优先改这里，勿散落 less 魔法数 */
export const erdTheme: ThemeConfig = {
  token: {
    colorPrimary: erdColors.brand,
    colorPrimaryHover: erdColors.brandHover,
    colorSuccess: erdColors.success,
    colorWarning: erdColors.warning,
    colorText: erdColors.ink900,
    colorTextSecondary: erdColors.ink600,
    colorTextTertiary: erdColors.ink400,
    colorBorder: erdColors.line,
    colorBorderSecondary: erdColors.line,
    colorBgContainer: erdColors.surface,
    colorBgLayout: erdColors.surfaceSunk,
    borderRadius: 8,
    borderRadiusSM: 6,
    borderRadiusLG: 8,
    fontSize: 14,
    fontSizeHeading2: 28,
    fontFamily: erdFontFamily,
  },
  components: {
    Button: {
      borderRadius: 8,
    },
    Input: {
      borderRadius: 6,
    },
    Select: {
      borderRadius: 6,
    },
    Card: {
      borderRadiusLG: 8,
    },
    Layout: {
      headerBg: erdColors.surface,
      bodyBg: erdColors.surfaceSunk,
      siderBg: erdColors.surface,
      triggerBg: erdColors.surface,
    },
    Menu: {
      itemBorderRadius: 6,
    },
  },
};
