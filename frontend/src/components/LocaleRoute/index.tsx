import React, { useEffect } from 'react';
import { history, Outlet, setLocale, useLocation } from '@umijs/max';
import {
  isMarketingLocalePath,
  resolveLocaleFromPath,
  shouldAutoRedirectToEnglish,
} from '@/utils/localePath';

/**
 * ADR-0034: on marketing routes, locale follows URL prefix (/ vs /en/*),
 * overriding localStorage and baseNavigator.
 */
const LocaleRoute: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!isMarketingLocalePath(pathname)) return;
    setLocale(resolveLocaleFromPath(pathname), false);
    if (shouldAutoRedirectToEnglish(pathname)) {
      history.replace('/en');
    }
  }, [pathname]);

  return <Outlet />;
};

export default LocaleRoute;
