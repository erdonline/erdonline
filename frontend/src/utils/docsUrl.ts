import {resolveAppLocale} from './getAntdLocale';

const DOCS_ORIGIN = 'https://erdonline.github.io/erdonline/';

export function docsUrl(locale?: string, path = ''): string {
  const base =
    resolveAppLocale(locale) === 'en-US'
      ? `${DOCS_ORIGIN}en/`
      : DOCS_ORIGIN;
  return `${base}${path.replace(/^\/+/, '')}`;
}
