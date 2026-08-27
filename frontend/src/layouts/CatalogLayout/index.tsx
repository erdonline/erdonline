import React, {useEffect} from 'react';
import {Outlet, history, useLocation} from '@@/exports';
import Theme from '@/components/Theme';
import LandingChrome from '@/pages/landing/LandingChrome';
import {usePageSeo} from '@/hooks/usePageSeo';
import {isCatalogDetailPath} from '@/utils/catalogSeoPath';
import '@/pages/landing/index.less';
import * as cache from '@/utils/cache';
import './index.less';

/** 模板广场：公开发现面，复用 Landing 品牌壳，不走 HomeLayout 工作台导航 */
const CatalogLayout: React.FC = () => {
  const location = useLocation();
  const isDetail = isCatalogDetailPath(location.pathname);
  usePageSeo('catalog.seo.title', 'catalog.seo.description', {enabled: !isDetail});
  const isReview = location.pathname.startsWith('/catalog/review');

  useEffect(() => {
    if (isReview && !cache.getItem('Authorization')) {
      history.replace(`/login?redirect=${encodeURIComponent(location.pathname)}`);
    }
  }, [isReview, location.pathname]);

  return (
    <Theme>
      <LandingChrome
        variant="subpage"
        testId="catalog-chrome"
        skipTargetId="catalog-main-content"
        activeNav="catalog"
      >
        <main
          className="catalog-layout__main"
          id="catalog-main-content"
          tabIndex={-1}
          data-testid="catalog-main-content"
        >
          <Outlet />
        </main>
      </LandingChrome>
    </Theme>
  );
};

export default React.memo(CatalogLayout);
