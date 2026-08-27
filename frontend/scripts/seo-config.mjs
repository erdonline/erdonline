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
 * Official catalog templates (keep in sync with CatalogSeedRunner.OFFICIAL).
 * Unknown /catalog/:id 200-rewrites to `/catalog/` (list shell). Do not emit `/catalog/_item`.
 * No /en/catalog/:id route (ADR-0034).
 *
 * @typedef {{ id: string, title: string, description: string }} CatalogDetailFixture
 * @type {readonly CatalogDetailFixture[]}
 */
export const CATALOG_DETAIL_FIXTURES = [
  {
    id: "demo-authz",
    title: "功能鉴权示例",
    description: "RBAC 用户/角色/权限/会话/审计 + 业务订单",
  },
  {
    id: "blank",
    title: "空白项目",
    description: "从零开始建模",
  },
  {
    id: "blog-basic",
    title: "博客基础模型",
    description: "文章/作者/标签及多对多",
  },
  {
    id: "ecommerce-basic",
    title: "电商基础模型",
    description: "商品/分类/订单/明细",
  },
];

/**
 * @param {CatalogDetailFixture} fixture
 * @returns {PrerenderPage}
 */
export function catalogDetailPage(fixture) {
  return {
    path: `/catalog/${fixture.id}`,
    locale: "zh-CN",
    title: `${fixture.title} — ER 图模板 | ERD Online`,
    description: fixture.description,
  };
}

/**
 * Paths included in sitemap.xml (pathname, leading slash).
 * Unbounded /catalog/:id and /s/:token stay out; official fixtures are listed.
 * Never list `/catalog/_item`.
 */
export const SITEMAP_PATHS = [
  "/",
  "/compare",
  "/catalog",
  ...CATALOG_DETAIL_FIXTURES.map((f) => `/catalog/${f.id}`),
  "/demo",
  "/en",
  "/en/compare",
  "/en/catalog",
  "/en/demo",
];

/**
 * Marketing paths that get a distinct SPA shell in dist/<path>/index.html.
 * Titles/descriptions must stay in sync with locale files (landing.seo / catalog.seo / share.seo).
 * `/` stays document.ejs (English SERP). `/demo` + `/en/demo` still client-redirect to /s/public-demo;
 * crawlers get a per-path shell (not the homepage Draw-ERD HTML).
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
      "诚实对照 ERD Online、draw.io、dbdiagram 与 DBML：外键语义、协作、版本、开放、自部署与 Agent/MCP。",
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
      "An honest comparison of ERD Online, draw.io, dbdiagram, and DBML: foreign-key semantics, collaboration, versioning, openness, self-hosting, and Agent/MCP.",
  },
  {
    path: "/en/catalog",
    locale: "en-US",
    title: "ER diagram templates — free database models | ERD Online",
    description:
      "Browse free ER diagram templates. Install an official or community database model in the browser, then edit, version, and collaborate.",
  },
  {
    path: "/demo",
    locale: "zh-CN",
    title: "ERD Online 示例 — 免登录查看真实 ER 图",
    description: "无需登录，以只读方式查看真实 ER 图，30 秒上手 ERD Online 数据库建模。",
  },
  {
    path: "/en/demo",
    locale: "en-US",
    title: "ERD Online demo — view a real ER diagram without signing in",
    description:
      "Explore a real ER diagram in read-only mode without signing in. Get started with ERD Online in 30 seconds.",
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
  const abs = (p) => `${origin}${p === "/" ? "/" : p}`;
  // No /en/catalog/:id route (ADR-0034); EN alternate is the catalog list.
  if (/^\/catalog\/[^/]+$/.test(pathname)) {
    return {
      canonical: abs(pathname),
      zh: abs(pathname),
      en: abs("/en/catalog"),
      xDefault: abs(pathname),
    };
  }
  const base =
    pathname === "/en" ? "/" : pathname.startsWith("/en/") ? pathname.slice(3) || "/" : pathname;
  const zhPath = base;
  const enPath = base === "/" ? "/en" : `/en${base}`;
  return {
    canonical: abs(pathname === "/" ? "/" : pathname),
    zh: abs(zhPath),
    en: abs(enPath),
    xDefault: abs(zhPath),
  };
}

/**
 * Path-appropriate JSON-LD. WebApplication only on `/`.
 * Catalog list = CollectionPage; official `/catalog/:id` = ItemPage; other marketing = WebPage.
 *
 * @param {{ path: string, title: string, description: string }} page
 * @param {string} siteUrl
 */
export function jsonLdForPage(page, siteUrl) {
  const url = marketingHreflang(page.path, siteUrl).canonical;
  const site = { "@type": "WebSite", name: "ERD Online", url: `${siteUrl}/` };
  if (page.path === "/") {
    return {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "ERD Online",
      alternateName: ["Draw ER diagram online", "ERD editor", "ERD diagram online"],
      url,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description:
        "Draw ER diagrams online for free. ERD editor and maker for entity-relationship models in the browser.",
    };
  }
  if (page.path === "/catalog" || page.path === "/en/catalog") {
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: page.title,
      url,
      description: page.description,
      isPartOf: site,
    };
  }
  if (/^\/catalog\/[^/]+$/.test(page.path)) {
    return {
      "@context": "https://schema.org",
      "@type": "ItemPage",
      name: page.title,
      url,
      description: page.description,
      isPartOf: site,
    };
  }
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    url,
    description: page.description,
    isPartOf: site,
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
 * Do NOT use `/catalog/*` — CF splat matches `/catalog/` (empty) and hides dist/catalog/index.html.
 * Live 0a5f3aff: 200-rewrite to `/catalog/_item` (a directory) 308d onto `/catalog/_item/` (junk URL).
 * Unknown `/catalog/:id` 200-rewrites to `/catalog/` (list shell, already slashed) so CF cannot
 * 308 onto a new junk path. Official fixtures get identity 200 *before* the placeholder
 * (with and without trailing slash). Leftover `/catalog/_item` 301s to `/catalog/`.
 *
 * @type {readonly string[]}
 */
export const CF_SPA_REDIRECT_RULES = [
  ...CATALOG_DETAIL_FIXTURES.flatMap((f) => [
    `/catalog/${f.id} /catalog/${f.id} 200`,
    `/catalog/${f.id}/ /catalog/${f.id}/ 200`,
  ]),
  "/catalog/_item /catalog/ 301",
  "/catalog/_item/ /catalog/ 301",
  "/catalog/:id /catalog/ 200",
  "/catalog/:id/ /catalog/ 200",
  "/catalog/creator/:handle / 200",
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
