/**
 * Shared SEO + SPA routing config for sitemap, robots.txt, CF Pages _redirects, nginx map.
 * Source of truth for public indexable paths and client-side routes that must return HTTP 200.
 */

/** @type {string} */
export const DEFAULT_SITE_URL = "https://www.erdonline.com";

/** @returns {string} */
export function resolveSiteUrl() {
  const raw = (process.env.ERD_SITE_URL || process.env.SEO_BASE_URL || DEFAULT_SITE_URL).trim();
  return raw.replace(/\/+$/, "");
}

/**
 * Paths included in sitemap.xml (pathname, leading slash).
 * Dynamic segments (/catalog/:id, /s/:token) are intentionally omitted.
 */
export const SITEMAP_PATHS = [
  '/',
  '/compare',
  '/catalog',
  '/demo',
  '/en',
  '/en/compare',
  '/en/catalog',
  '/en/demo',
];

/**
 * robots.txt Disallow prefixes (private / low-SEO areas).
 * Trailing slash = prefix match per robots convention.
 */
export const ROBOTS_DISALLOW = [
  "/login",
  "/register",
  "/home",
  "/project/",
  "/design/",
  "/account/",
  "/databaseConfig",
  "/dataModels",
  "/oauth/",
  "/403",
];

/**
 * Cloudflare Pages _redirects rules (200 proxy → index.html).
 * Do NOT add a catch-all `/*` — unknown paths must fall through to 404.html (HTTP 404).
 * Root `/` is served by index.html statically; no rule needed.
 *
 * @type {readonly string[]}
 */
export const CF_SPA_REDIRECT_RULES = [
  "/compare /index.html 200",
  "/demo /index.html 200",
  "/en /index.html 200",
  "/en/compare /index.html 200",
  "/en/demo /index.html 200",
  "/en/catalog /index.html 200",
  "/catalog /index.html 200",
  "/catalog/* /index.html 200",
  "/s/* /index.html 200",
  "/login /index.html 200",
  "/login/* /index.html 200",
  "/register /index.html 200",
  "/register/* /index.html 200",
  "/oauth/authorize /index.html 200",
  "/403 /index.html 200",
  "/project/* /index.html 200",
  "/project/group/setting /index.html 200",
  "/project/group/setting/* /index.html 200",
  "/design/* /index.html 200",
  "/dataModels /index.html 200",
  "/dataModels/* /index.html 200",
  "/home /index.html 200",
  "/home/* /index.html 200",
  "/databaseConfig /index.html 200",
  "/databaseConfig/* /index.html 200",
  "/account /index.html 200",
  "/account/* /index.html 200",
];

/**
 * nginx map regexes: URI matches → serve index.html; else HTTP 404 + 404.html body.
 * Keep in sync with CF_SPA_REDIRECT_RULES.
 *
 * @type {readonly string[]}
 */
export const NGINX_SPA_URI_REGEXES = [
  "^/$",
  "^/compare$",
  "^/demo$",
  "^/en$",
  "^/en/compare$",
  "^/en/demo$",
  "^/en/catalog$",
  "^/catalog(/|$)",
  "^/s/[^/]+$",
  "^/login(/|$)",
  "^/register(/|$)",
  "^/oauth/authorize$",
  "^/403$",
  "^/project(/|$)",
  "^/design(/|$)",
  "^/dataModels(/|$)",
  "^/home(/|$)",
  "^/databaseConfig(/|$)",
  "^/account(/|$)",
];
