import type { IntlShape } from '@umijs/max';
import zhCN from '@/locales/zh-CN';

/** Shared formatter for copy modules (dualLayerTokens / schemaProbeCopy / chrome). */
export type MessageFormatFn = (
  id: string,
  values?: Record<string, string | number>,
) => string;

function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return Object.entries(values).reduce(
    (msg, [key, value]) => msg.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template,
  );
}

/** Unit tests / non-React callers: resolve keys from zh-CN locale file. */
export function zhCnFormat(): MessageFormatFn {
  const dict = zhCN as Record<string, string>;
  return (id, values) => interpolate(dict[id] ?? id, values);
}

export function intlFormat(intl: IntlShape): MessageFormatFn {
  return (id, values) => intl.formatMessage({ id }, values);
}
