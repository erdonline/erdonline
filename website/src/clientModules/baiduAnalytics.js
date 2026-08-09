/**
 * Baidu Tongji for docs site (same site id as product frontend).
 * SPA route changes need explicit _trackPageview.
 */
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

export function onRouteDidUpdate({ location, previousLocation }) {
  if (!ExecutionEnvironment.canUseDOM) {
    return;
  }
  if (previousLocation && location.pathname === previousLocation.pathname) {
    return;
  }
  const path = `${location.pathname}${location.search || ''}`;
  window._hmt = window._hmt || [];
  window._hmt.push(['_trackPageview', path]);
}
