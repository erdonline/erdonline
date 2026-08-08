/**
 * 轻量漏斗埋点 + 首触 UTM 归因（推广链路 · 度量层）。
 *
 * - 不引入新依赖：事件转发给已接入的百度统计（`window._hmt`，见 config.ts），
 *   并落到 `window.__erdFunnel`（供 E2E 断言）；开发态 console.debug。
 * - 归因用**首触**（first-touch）：首次带 utm_* 或外部 referrer 落地时写 localStorage，
 *   之后不覆盖，便于把「北极星（非空存版本）」归因到真正带来建模的渠道。
 */

const ATTRIBUTION_KEY = 'erd:attribution';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
  landing?: string;
  ts?: number;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function isExternalReferrer(): boolean {
  try {
    const ref = document.referrer;
    if (!ref) return false;
    return new URL(ref).host !== window.location.host;
  } catch {
    return false;
  }
}

/** 首触归因：仅在尚无归因、且本次带 utm 或外部来源时写入。幂等、不覆盖。 */
export function captureAttribution(): void {
  if (!isBrowser()) return;
  try {
    if (localStorage.getItem(ATTRIBUTION_KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const attr: Attribution = {};
    let hasUtm = false;
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) {
        (attr as Record<string, string>)[k] = v.slice(0, 128);
        hasUtm = true;
      }
    }
    const external = isExternalReferrer();
    if (!hasUtm && !external) return; // 直达且无 utm：不建归因，等真正的渠道来源
    if (external) attr.referrer = document.referrer.slice(0, 256);
    attr.landing = window.location.pathname.slice(0, 128);
    attr.ts = Date.now();
    localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attr));
  } catch {
    // 埋点绝不影响主流程
  }
}

export function getAttribution(): Attribution | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(ATTRIBUTION_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch {
    return null;
  }
}

/** 记录一个漏斗事件。绝不抛错。 */
export function track(event: string, props?: Record<string, unknown>): void {
  if (!isBrowser()) return;
  try {
    const w = window as unknown as {
      __erdFunnel?: Array<{ event: string; props?: Record<string, unknown>; ts: number }>;
      _hmt?: Array<unknown[]>;
    };
    w.__erdFunnel = w.__erdFunnel || [];
    w.__erdFunnel.push({ event, props, ts: Date.now() });
    if (w.__erdFunnel.length > 200) w.__erdFunnel.shift();
    // 转发百度统计自定义事件（prod 构建注入 hm.js；dev 无 _hmt 时跳过）
    if (Array.isArray(w._hmt)) {
      w._hmt.push(['_trackEvent', 'funnel', event, props ? JSON.stringify(props).slice(0, 256) : '']);
    }
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('[funnel]', event, props || '');
    }
  } catch {
    // ignore
  }
}
