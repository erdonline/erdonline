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
 * Cloudflare Pages _redirects rules (200 proxy → `/`).
 * Do NOT proxy to `/index.html` — CF Pages 308-redirects *.html to extension-less URLs.
 * Do NOT add a catch-all `/*` — unknown paths must fall through to 404.html (HTTP 404).
 * Root `/` is served by index.html statically; no rule needed.
 *
 * @type {readonly string[]}
 */
export const CF_SPA_REDIRECT_RULES = [
  "/compare / 200",
  "/demo / 200",
  "/en / 200",
  "/en/compare / 200",
  "/en/demo / 200",
  "/en/catalog / 200",
  "/catalog / 200",
  "/catalog/* / 200",
  "/s/* / 200",
  "/login / 200",
  "/login/* / 200",
  "/register / 200",
  "/register/* / 200",
  "/oauth/authorize / 200",
  "/403 / 200",
  "/project/* / 200",
  "/project/group/setting / 200",
  "/project/group/setting/* / 200",
  "/design/* / 200",
  "/dataModels / 200",
  "/dataModels/* / 200",
  "/home / 200",
  "/home/* / 200",
  "/databaseConfig / 200",
  "/databaseConfig/* / 200",
  "/account / 200",
  "/account/* / 200",
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
