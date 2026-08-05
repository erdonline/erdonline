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
  /** 表头 / 次级面板（略深于 sunk，截图层次更清晰） */
  surfaceMuted: '#F3F5F7',
  success: '#2F8F7B',
  warning: '#D48806',
  /** PK 徽章底 / 描边（与 warning 成对） */
  warningBg: '#FFF7E6',
  warningBorder: '#FFE58F',
  /** FK 徽章底 / 描边（与 success 成对） */
  successBg: '#E8F5F1',
  successBorder: '#B7DFD4',
  /** Frame 浅底（ADR-0016：禁 Ant 蓝等散落色） */
  frameFill: 'rgba(47, 143, 123, 0.10)',
  frameFillBrand: 'rgba(222, 41, 16, 0.08)',
  frameFillWarning: 'rgba(212, 136, 6, 0.10)',
  frameFillInk: 'rgba(11, 28, 44, 0.06)',
  /** 轻阴影 / MiniMap mask */
  inkA06: 'rgba(11, 28, 44, 0.06)',
  /** 浅 brand 叠色（非选中环；选中统一 brandA18） */
  brandA12: 'rgba(222, 41, 16, 0.12)',
  /** 表 / Frame 共用选中光晕环（CSS `--erd-selection-ring`） */
  brandA18: 'rgba(222, 41, 16, 0.18)',
} as const;

/** 输入类控件 focus — 中性灰环/描边；invalid 仍走 antd colorError */
export const erdControlFocus = {
  border: erdColors.ink400,
  borderHover: erdColors.ink600,
  shadow: '0 0 0 2px rgba(11, 28, 44, 0.08)',
  outline: erdColors.ink400,
} as const;

/** 新建 Frame 按序轮换；demo 分组同序 */
export const FRAME_COLOR_PALETTE = [
  erdColors.frameFill,
  erdColors.frameFillInk,
  erdColors.frameFillWarning,
  erdColors.frameFillBrand,
] as const;

export function frameColorAt(index: number): string {
  const i = ((index % FRAME_COLOR_PALETTE.length) + FRAME_COLOR_PALETTE.length) % FRAME_COLOR_PALETTE.length;
  return FRAME_COLOR_PALETTE[i];
}

export const erdFontFamily =
  "'IBM Plex Sans', 'PingFang SC', 'Noto Sans SC', sans-serif";

/** 字段名 / 类型等标识符：等宽，截图更像「Schema」 */
export const erdFontMono =
  "'IBM Plex Mono', 'SF Mono', 'Menlo', 'Consolas', 'PingFang SC', monospace";

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
      hoverBorderColor: erdControlFocus.borderHover,
      activeBorderColor: erdControlFocus.border,
      activeShadow: erdControlFocus.shadow,
    },
    Select: {
      borderRadius: 6,
      hoverBorderColor: erdControlFocus.borderHover,
      activeBorderColor: erdControlFocus.border,
      activeShadow: erdControlFocus.shadow,
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
      horizontalItemSelectedColor: erdColors.brand,
      horizontalItemHoverColor: erdColors.brand,
      itemSelectedColor: erdColors.brand,
      itemHoverColor: erdColors.brand,
    },
  },
};
