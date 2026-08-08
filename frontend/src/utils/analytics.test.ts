/**
 * 运行：cd frontend && npx tsx src/utils/analytics.test.ts
 *
 * 覆盖：首触 UTM 归因（幂等不覆盖）、直达无 utm 不建归因、track 落 __erdFunnel。
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { captureAttribution, getAttribution, track } from './analytics';

// —— 浏览器全局桩（Node 无 window/document/localStorage）——
function makeStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? (m.get(k) as string) : null),
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
  };
}
function setEnv(search: string, referrer: string, pathname = '/') {
  (globalThis as any).window = {
    location: { search, pathname, host: 'app.example.com' },
  };
  (globalThis as any).document = { referrer };
  (globalThis as any).localStorage = makeStorage();
}

setEnv('', '');

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error('FAIL: ' + msg);
}

// 1) 首触：带 utm → 建归因
setEnv('?utm_source=hn&utm_medium=show&utm_campaign=launch', 'https://news.ycombinator.com/');
captureAttribution();
let a = getAttribution();
assert(!!a && a.utm_source === 'hn', 'utm_source captured');
assert(a!.utm_medium === 'show' && a!.utm_campaign === 'launch', 'utm medium/campaign captured');
assert(a!.landing === '/', 'landing path recorded');

// 2) 幂等：再来一次不同 utm，不覆盖首触
const search2 = '?utm_source=reddit';
(globalThis as any).window.location.search = search2;
captureAttribution();
a = getAttribution();
assert(a!.utm_source === 'hn', 'first-touch not overwritten');

// 3) 直达且无 utm、无外部来源 → 不建归因
setEnv('', '');
captureAttribution();
assert(getAttribution() === null, 'no attribution for direct/no-utm');

// 4) 外部 referrer（无 utm）→ 建归因（referrer）
setEnv('', 'https://www.google.com/');
captureAttribution();
a = getAttribution();
assert(!!a && (a.referrer || '').includes('google'), 'referrer-only attribution');

// 5) track 落 __erdFunnel
setEnv('', '');
track('landing_view');
track('demo_open', { token: 'public-demo' });
const funnel = (globalThis as any).window.__erdFunnel as Array<{ event: string }>;
assert(Array.isArray(funnel) && funnel.length === 2, 'two events tracked');
assert(funnel[0].event === 'landing_view' && funnel[1].event === 'demo_open', 'event names/order');

// eslint-disable-next-line no-console
console.log('analytics.test.ts: all assertions passed');
