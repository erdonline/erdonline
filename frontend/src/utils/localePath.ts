/** ADR-0034: marketing pages only; keep in sync with frontend/nginx.conf `$og_is_bot`. */
const CRAWLER_UA_RE =
  /facebookexternalhit|Twitterbot|Slackbot|LinkedInBot|WhatsApp|TelegramBot|Discordbot|Pinterest|redditbot|Googlebot|Google-InspectionTool|bingbot|Applebot|Embedly|Qwantify|SkypeUriPreview|vkShare|Mastodon|Prerender|WeChat|MicroMessenger|Bytespider|Baiduspider|Sogou|360Spider/i;

export type AppLocale = 'zh-CN' | 'en-US';

/** Pathname-only marketing routes that participate in /en prefix (not /catalog/:id). */
export const MARKETING_LOCALE_PATHS = ['/', '/compare', '/catalog', '/demo'] as const;

export function isEnglishLocalePath(pathname: string): boolean {
  return pathname === '/en' || pathname.startsWith('/en/');
}

export function stripLocalePrefix(pathname: string): string {
  if (pathname === '/en') return '/';
  if (pathname.startsWith('/en/')) return pathname.slice(3) || '/';
  return pathname;
}

export function isMarketingLocalePath(pathname: string): boolean {
  const base = stripLocalePrefix(pathname);
  return (MARKETING_LOCALE_PATHS as readonly string[]).includes(base);
}

export function resolveLocaleFromPath(pathname: string): AppLocale {
  return isEnglishLocalePath(pathname) ? 'en-US' : 'zh-CN';
}

/** Map a marketing pathname to the locale-specific URL (app routes unchanged). */
export function toLocalePath(pathname: string, locale: AppLocale): string {
  const base = stripLocalePrefix(pathname);
  if (locale === 'en-US') {
    if (base === '/') return '/en';
    return `/en${base}`;
  }
  return base;
}

export function isCrawlerUserAgent(ua?: string): boolean {
  const agent = ua ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  return CRAWLER_UA_RE.test(agent);
}

/** First visit `/` with en browser → `/en`; skip when user already chose locale or UA is bot. */
export function shouldAutoRedirectToEnglish(pathname: string): boolean {
  if (pathname !== '/') return false;
  if (typeof localStorage !== 'undefined' && localStorage.getItem('umi_locale')) return false;
  if (isCrawlerUserAgent()) return false;
  const lang = typeof navigator !== 'undefined' ? navigator.language : '';
  return lang.toLowerCase().startsWith('en');
}

export type MarketingHreflang = {
  canonical: string;
  zh: string;
  en: string;
  xDefault: string;
};

export function getMarketingHreflang(pathname: string, origin: string): MarketingHreflang | null {
  if (!isMarketingLocalePath(pathname)) return null;
  const base = stripLocalePrefix(pathname);
  const zhPath = base;
  const enPath = toLocalePath(base, 'en-US');
  const abs = (p: string) => `${origin}${p === '/' ? '/' : p}`;
  return {
    canonical: abs(pathname),
    zh: abs(zhPath),
    en: abs(enPath),
    xDefault: abs(zhPath),
  };
}
