import type { Locale } from 'antd/es/locale';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';

/** 无浏览器 / umi / env 信号时的回退 locale（ADR-0023）。 */
export const DEFAULT_APP_LOCALE = 'zh-CN';

/** 奠基切片支持的 antd locale 键；完整 i18n MVP 前仅 Theme 层可切换。 */
export type AppLocale = 'zh-CN' | 'en-US';

const ANTD_LOCALES: Record<AppLocale, Locale> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

declare global {
  interface Window {
    _env_?: {
      API_URL?: string;
      ERD_API_URL?: string;
      /** 部署显式覆盖 locale；非空时优先于 umi / 浏览器检测 */
      LOCALE?: string;
    };
  }
}

/** 规范化 env / 构建 / umi 注入的 locale 字符串。 */
export function resolveAppLocale(source?: string | null): AppLocale {
  const raw = (source ?? '').trim();
  if (!raw) return DEFAULT_APP_LOCALE;
  const lower = raw.replace(/_/g, '-').toLowerCase();
  if (lower === 'zh-cn' || lower.startsWith('zh')) return 'zh-CN';
  if (lower === 'en-us' || lower.startsWith('en')) return 'en-US';
  return DEFAULT_APP_LOCALE;
}

/** umi locale 插件运行时；单测 / SSR 无插件时安全降级。 */
function readUmiLocale(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const umi = require('@umijs/max') as { getLocale?: () => string };
    const loc = umi.getLocale?.()?.trim();
    return loc || undefined;
  } catch {
    return undefined;
  }
}

/**
 * 解析当前应用 locale：
 * 1. env-config `LOCALE`（非空，部署覆盖）
 * 2. 构建变量 `ERD_LOCALE`
 * 3. umi `getLocale()`（baseNavigator + localStorage `umi_locale`）
 * 4. DEFAULT_APP_LOCALE
 */
export function getAppLocale(): AppLocale {
  if (typeof window !== 'undefined') {
    const envLocale = window._env_?.LOCALE?.trim();
    if (envLocale) {
      return resolveAppLocale(envLocale);
    }
  }
  const buildLocale =
    typeof process !== 'undefined' ? process.env?.ERD_LOCALE?.trim() : undefined;
  if (buildLocale) {
    return resolveAppLocale(buildLocale);
  }
  const umiLocale = readUmiLocale();
  if (umiLocale) {
    return resolveAppLocale(umiLocale);
  }
  return DEFAULT_APP_LOCALE;
}

/** ConfigProvider 用 antd locale 包；可传入 umi locale 以随切换器更新。 */
export function getAntdLocale(localeOverride?: string | null): Locale {
  const appLocale =
    localeOverride != null && String(localeOverride).trim()
      ? resolveAppLocale(localeOverride)
      : getAppLocale();
  return ANTD_LOCALES[appLocale];
}
