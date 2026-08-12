/**
 * Baidu Tongji for docs site (same site id as product frontend).
 * SPA route changes need explicit _trackPageview.
 * Skips localhost / 127.0.0.1 so `yarn serve` does not pollute production stats.
 */
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

function isLocalAnalyticsHost(): boolean {
  if (!ExecutionEnvironment.canUseDOM) return true;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
}

export function onRouteDidUpdate({ location, previousLocation }) {
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
