import {resolveAppLocale} from './getAntdLocale';

const DOCS_ORIGIN = 'https://doc.erdonline.com/';

export function docsUrl(locale?: string, path = ''): string {
  const base =
    resolveAppLocale(locale) === 'en-US'
      ? `${DOCS_ORIGIN}en/`
      : DOCS_ORIGIN;
  return `${base}${path.replace(/^\/+/, '')}`;
}
