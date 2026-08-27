/**
 * Shared SEO + SPA routing config for sitemap, robots.txt, CF Pages _redirects, nginx map.
 * Source of truth for public indexable paths and client-side routes that must return HTTP 200.
 */

/** @type {string} */
export const DEFAULT_SITE_URL = "https://www.erdonline.com";

/** Crawler-visible `/` shell (document.ejs / config.ts). Keep in sync with landing.seo en-US. */
export const HOME_SEO = {
  title: "Draw ER Diagram Online — Free Editor | ERD Online",
  description:
    "Draw ER diagrams online for free. ERD editor and maker for entity-relationship models in the browser — versions, collaboration, no signup.",
};

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
 * Marketing paths that get a distinct SPA shell in dist/<path>/index.html.
 * Titles/descriptions must stay in sync with locale files (landing.seo / catalog.seo).
 * `/` stays document.ejs (English SERP). `/demo` + `/en/demo` redirect to /s/public-demo — not prerendered.
 *
 * @typedef {{ path: string, locale: 'zh-CN' | 'en-US', title: string, description: string }} PrerenderPage
 * @type {readonly PrerenderPage[]}
 */
export const PRERENDER_PAGES = [
  {
    path: "/compare",
    locale: "zh-CN",
    title: "ERD Online vs draw.io — 协作、版本与外键语义",
    description:
      "诚实对照 ERD Online、draw.io、dbdiagram 与 DBML：外键语义、协作、版本、开放与自部署。",
  },
  {
    path: "/catalog",
    locale: "zh-CN",
    title: "ER 图模板 — 免费数据库模型广场 | ERD Online",
    description:
      "浏览免费 ER 图模板。安装官方或社区数据库模型到浏览器，随后可编辑、保存版本并协作。",
  },
  {
    path: "/en",
    locale: "en-US",
    title: HOME_SEO.title,
    description: HOME_SEO.description,
  },
  {
    path: "/en/compare",
    locale: "en-US",
    title: "ERD Online vs draw.io — collaboration, versions, and FK semantics",
    description:
      "An honest comparison of ERD Online, draw.io, dbdiagram, and DBML: foreign-key semantics, collaboration, versioning, openness, and self-hosting.",
  },
  {
    path: "/en/catalog",
    locale: "en-US",
    title: "ER diagram templates — free database models | ERD Online",
    description:
      "Browse free ER diagram templates. Install an official or community database model in the browser, then edit, version, and collaborate.",
  },
];

/**
 * Absolute canonical / hreflang URLs for a marketing pathname (no trailing slash except `/`).
 * Keep in sync with frontend/src/utils/localePath.ts getMarketingHreflang.
 *
 * @param {string} pathname
 * @param {string} origin
 */
export function marketingHreflang(pathname, origin) {
  const base =
    pathname === "/en" ? "/" : pathname.startsWith("/en/") ? pathname.slice(3) || "/" : pathname;
  const zhPath = base;
  const enPath = base === "/" ? "/en" : `/en${base}`;
  const abs = (p) => `${origin}${p === "/" ? "/" : p}`;
  return {
    canonical: abs(pathname === "/" ? "/" : pathname),
    zh: abs(zhPath),
    en: abs(enPath),
    xDefault: abs(zhPath),
  };
}

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
 * Exact prerendered marketing paths (PRERENDER_PAGES) must NOT appear here —
 * CF 200-rewrite to `/` would ship the homepage title/canonical to crawlers.
 *
 * @type {readonly string[]}
 */
export const CF_SPA_REDIRECT_RULES = [
  "/demo / 200",
  "/en/demo / 200",
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

/** Exact paths that have dist/<path>/index.html — never 200-rewrite these to `/`. */
export function prerenderedExactPaths() {
  return new Set(PRERENDER_PAGES.map((p) => p.path));
}

/** CF rules with prerendered exact paths stripped (safety net if they sneak back into the array). */
export function cfSpaRedirectRules() {
  const skip = prerenderedExactPaths();
  return CF_SPA_REDIRECT_RULES.filter((rule) => {
    const from = rule.split(/\s+/)[0];
    return !skip.has(from);
  });
}

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
