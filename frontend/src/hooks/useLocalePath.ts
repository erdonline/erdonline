import { useCallback } from 'react';
import { useLocation } from '@umijs/max';
import {
  resolveLocaleFromPath,
  stripLocalePrefix,
  toLocalePath,
  type AppLocale,
} from '@/utils/localePath';

/** Resolve locale-aware marketing links for the current pathname. */
export function useLocalePath() {
  const { pathname } = useLocation();
  const locale = resolveLocaleFromPath(pathname);
  const lp = useCallback((path: string) => toLocalePath(path, locale), [locale]);
  const basePath = stripLocalePrefix(pathname);
  return { locale, lp, basePath, isEnglish: locale === 'en-US' };
}

export type { AppLocale };
