/**
 * Baidu Tongji for docs site (same site id as product frontend).
 * SPA route changes need explicit _trackPageview.
 * Skips localhost / 127.0.0.1 so `yarn serve` does not pollute production stats.
 */
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

const BAIDU_TONGJI_ID = 'bd50dd978c8d8d94792f4e987c4a7aaf';

function isLocalAnalyticsHost() {
  if (!ExecutionEnvironment.canUseDOM) return true;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
}

if (ExecutionEnvironment.canUseDOM && !isLocalAnalyticsHost()) {
  window._hmt = window._hmt || [];
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://hm.baidu.com/hm.js?${BAIDU_TONGJI_ID}`;
  document.head.appendChild(s);
}

export function onRouteDidUpdate({location, previousLocation}) {
  if (!ExecutionEnvironment.canUseDOM || isLocalAnalyticsHost()) {
    return;
  }
  if (previousLocation && location.pathname === previousLocation.pathname) {
    return;
  }
  const path = `${location.pathname}${location.search || ''}`;
  window._hmt = window._hmt || [];
  window._hmt.push(['_trackPageview', path]);
}
