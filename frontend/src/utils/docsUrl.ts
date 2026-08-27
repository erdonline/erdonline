import {resolveAppLocale} from './getAntdLocale';

const DOCS_ORIGIN = 'https://doc.erdonline.com/';

export function docsUrl(locale?: string, path = ''): string {
  const base =
    resolveAppLocale(locale) === 'en-US'
      ? `${DOCS_ORIGIN}en/`
      : DOCS_ORIGIN;
  const trimmed = path.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!trimmed) return base;
  if (/\.[a-zA-Z0-9]+$/.test(trimmed)) return `${base}${trimmed}`;
  return `${base}${trimmed}/`;
}
