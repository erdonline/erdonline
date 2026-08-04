import type { Locale } from 'antd/es/locale';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';

/** 产品默认 locale（ADR-0023）；E2E 与 Modal OK 文案仍依赖 zh-CN。 */
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
      /** 运行时 locale；空或未识别 → DEFAULT_APP_LOCALE */
      LOCALE?: string;
    };
  }
}

/** 规范化 env / 构建注入的 locale 字符串。 */
export function resolveAppLocale(source?: string | null): AppLocale {
  const raw = (source ?? '').trim();
  if (!raw) return DEFAULT_APP_LOCALE;
  const lower = raw.replace(/_/g, '-').toLowerCase();
  if (lower === 'zh-cn') return 'zh-CN';
  if (lower === 'en-us') return 'en-US';
  return DEFAULT_APP_LOCALE;
}

/** 解析当前应用 locale：env-config → 构建变量 → 默认 zh-CN。 */
export function getAppLocale(): AppLocale {
  if (typeof window !== 'undefined' && window._env_?.LOCALE != null) {
    return resolveAppLocale(window._env_.LOCALE);
  }
  if (typeof process !== 'undefined' && process.env?.ERD_LOCALE) {
    return resolveAppLocale(process.env.ERD_LOCALE);
  }
  return DEFAULT_APP_LOCALE;
}

/** ConfigProvider 用 antd locale 包；缺省仍为 zh-CN。 */
export function getAntdLocale(): Locale {
  return ANTD_LOCALES[getAppLocale()];
}
