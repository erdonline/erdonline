#!/usr/bin/env node
/**
 * Post-build: emit sitemap.xml, robots.txt, CF Pages _redirects, 404.html,
 * and per-path SPA shells so crawlers see that URL's title/canonical (not homepage).
 *
 * Run after `max build` so dist/index.html exists. Writes into frontend/dist/ by default.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CATALOG_DETAIL_FIXTURES,
  HOME_SEO,
  PRERENDER_PAGES,
  ROBOTS_DISALLOW,
  SITEMAP_PATHS,
  catalogDetailPage,
  cfSpaRedirectRules,
  jsonLdForPage,
  marketingHreflang,
  resolveSiteUrl,
} from "./seo-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function defaultDistDir() {
  return process.env.ERD_DIST_DIR || path.join(__dirname, "..", "dist");
}

function escapeAttr(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function escapeRe(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Replace content="..." on meta tags keyed by name or property (either attribute order).
 * @param {string} html
 * @param {string} key
 * @param {string} content
 */
export function replaceMetaContent(html, key, content) {
  const esc = escapeAttr(content);
  const k = escapeRe(key);
  const withKeyFirst = new RegExp(
    `(<(?:meta)\\b[^>]*(?:name|property)=["']${k}["'][^>]*\\bcontent=["'])[^"']*(["'])`,
    "gi",
  );
  const withContentFirst = new RegExp(
    `(<(?:meta)\\b[^>]*\\bcontent=["'])[^"']*(["'][^>]*(?:name|property)=["']${k}["'])`,
    "gi",
  );
  return html.replace(withKeyFirst, `$1${esc}$2`).replace(withContentFirst, `$1${esc}$2`);
}

/**
 * @param {string} html
 * @param {string} href
 */
export function replaceCanonicalHref(html, href) {
  const esc = escapeAttr(href);
  return html
    .replace(
      /(<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["'])[^"']*(["'])/gi,
      `$1${esc}$2`,
    )
    .replace(
      /(<link\b[^>]*\bhref=["'])[^"']*(["'][^>]*\brel=["']canonical["'])/gi,
      `$1${esc}$2`,
    );
}

/**
 * @param {string} html
 * @param {{ canonical: string, zh: string, en: string, xDefault: string }} hreflang
 */
export function upsertHreflang(html, hreflang) {
  const stripped = html.replace(
    /\s*<link\b[^>]*rel=["']alternate["'][^>]*hreflang=["'][^"']+["'][^>]*\/?>/gi,
    "",
  );
  const block = [
    `<link rel="alternate" hreflang="zh-CN" href="${escapeAttr(hreflang.zh)}"/>`,
    `<link rel="alternate" hreflang="en" href="${escapeAttr(hreflang.en)}"/>`,
    `<link rel="alternate" hreflang="x-default" href="${escapeAttr(hreflang.xDefault)}"/>`,
  ].join("\n    ");
  if (!/<link\b[^>]*rel=["']canonical["']/i.test(stripped)) {
    return stripped;
  }
  return stripped.replace(
    /(<link\b[^>]*rel=["']canonical["'][^>]*\/?>)/i,
    `$1\n    ${block}`,
  );
}

/**
 * Replace every application/ld+json script with path-appropriate structured data.
 * @param {string} html
 * @param {object} data
 */
export function replaceJsonLd(html, data) {
  const script = `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
  const re = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi;
  if (re.test(html)) {
    return html.replace(re, script);
  }
  return html.replace(/<\/head>/i, `    ${script}\n</head>`);
}

/**
 * Dist path for a marketing pathname (`/` → index.html).
 * @param {string} distDir
 * @param {string} pathname
 */
export function distHtmlPath(distDir, pathname) {
  if (pathname === "/") return path.join(distDir, "index.html");
  return path.join(distDir, pathname.replace(/^\//, ""), "index.html");
}

/**
 * Rewrite SPA shell head tags for one public path.
 * @param {string} html
 * @param {{ path: string, locale: 'zh-CN' | 'en-US', title: string, description: string }} page
 * @param {string} siteUrl
 */
export function applyPageSeo(html, page, siteUrl) {
  const hreflang = marketingHreflang(page.path, siteUrl);
  const canonical = hreflang.canonical;
  const lang = page.locale === "en-US" ? "en" : "zh-CN";
  const ogLocale = page.locale === "en-US" ? "en_US" : "zh_CN";
  const title = escapeAttr(page.title);

  let out = html.replace(/<html\b[^>]*>/i, `<html lang="${lang}">`);
  out = out.replace(/<title>[^<]*<\/title>/gi, `<title>${title}</title>`);
  out = replaceMetaContent(out, "description", page.description);
  out = replaceMetaContent(out, "og:title", page.title);
  out = replaceMetaContent(out, "og:description", page.description);
  out = replaceMetaContent(out, "og:url", canonical);
  out = replaceMetaContent(out, "twitter:title", page.title);
  out = replaceMetaContent(out, "twitter:description", page.description);
  out = replaceCanonicalHref(out, canonical);
  out = upsertHreflang(out, hreflang);
  out = replaceJsonLd(out, jsonLdForPage(page, siteUrl));

  if (/property=["']og:locale["']/i.test(out)) {
    out = replaceMetaContent(out, "og:locale", ogLocale);
  } else {
    out = out.replace(
      /(<meta\b[^>]*property=["']og:url["'][^>]*\/?>)/i,
      `$1\n    <meta property="og:locale" content="${ogLocale}"/>`,
    );
  }

  return out;
}

function ensureDist(distDir) {
  if (!fs.existsSync(distDir)) {
    console.error(`gen-seo-static: dist not found at ${distDir} — run max build first`);
    process.exit(1);
  }
  const indexPath = path.join(distDir, "index.html");
  if (!fs.existsSync(indexPath)) {
    console.error(`gen-seo-static: ${indexPath} missing — run max build first`);
    process.exit(1);
  }
  return indexPath;
}

function writeSitemap(distDir, siteUrl, builtAt) {
  const urls = SITEMAP_PATHS.map((p) => {
    const loc = p === "/" ? `${siteUrl}/` : `${siteUrl}${p}`;
    const priority = p === "/" ? "1.0" : "0.8";
    const changefreq = p === "/" ? "weekly" : "monthly";
    return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${builtAt}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
  fs.writeFileSync(path.join(distDir, "sitemap.xml"), xml, "utf8");
}

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function writeRobots(distDir, siteUrl) {
  const lines = [
    "# ERD Online — project-controlled robots.txt (overrides CF Pages default when deployed).",
    "User-agent: *",
    "Allow: /",
    ...ROBOTS_DISALLOW.map((p) => `Disallow: ${p}`),
    "",
    `# Agent index (llmstxt.org): ${siteUrl}/llms.txt`,
    `Sitemap: ${siteUrl}/sitemap.xml`,
    "",
  ];
  fs.writeFileSync(path.join(distDir, "robots.txt"), lines.join("\n"), "utf8");
}

function writeLlmsTxt(distDir) {
  const src = path.join(__dirname, "..", "public", "llms.txt");
  if (!fs.existsSync(src)) {
    throw new Error(`missing ${src}`);
  }
  fs.copyFileSync(src, path.join(distDir, "llms.txt"));
}

function writeRedirects(distDir) {
  const lines = [
    "# Generated by scripts/gen-seo-static.mjs — do not edit dist/ copy by hand.",
    "# Cloudflare Pages: explicit SPA rewrites only; proxy to / (NOT /index.html — CF 308s .html).",
    "# Prerendered marketing paths are dist/<path>/index.html — do not 200-rewrite them to /.",
    "# Unknown paths → 404.html (HTTP 404) when top-level 404.html is present.",
    ...cfSpaRedirectRules(),
    "",
  ];
  fs.writeFileSync(path.join(distDir, "_redirects"), lines.join("\n"), "utf8");
}

function write404Shell(distDir, indexHtml) {
  fs.writeFileSync(path.join(distDir, "404.html"), indexHtml, "utf8");
}

function writePrerenderedShells(distDir, indexHtml, siteUrl) {
  const homeHreflang = applyPageSeo(
    indexHtml,
    {
      path: "/",
      locale: "en-US",
      title: HOME_SEO.title,
      description: HOME_SEO.description,
    },
    siteUrl,
  );
  fs.writeFileSync(path.join(distDir, "index.html"), homeHreflang, "utf8");

  for (const page of PRERENDER_PAGES) {
    const outPath = distHtmlPath(distDir, page.path);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, applyPageSeo(indexHtml, page, siteUrl), "utf8");
  }

  fs.rmSync(path.join(distDir, "catalog", "_item"), { recursive: true, force: true });

  for (const fixture of CATALOG_DETAIL_FIXTURES) {
    const page = catalogDetailPage(fixture);
    const outPath = distHtmlPath(distDir, page.path);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, applyPageSeo(indexHtml, page, siteUrl), "utf8");
  }
}

/**
 * @param {string} [distDir]
 * @param {string} [siteUrl]
 */
export function generateSeoStatic(distDir = defaultDistDir(), siteUrl = resolveSiteUrl()) {
  const indexPath = ensureDist(distDir);
  const indexHtml = fs.readFileSync(indexPath, "utf8");
  const builtAt = new Date().toISOString().slice(0, 10);
  writeSitemap(distDir, siteUrl, builtAt);
  writeRobots(distDir, siteUrl);
  writeLlmsTxt(distDir);
  writeRedirects(distDir);
  write404Shell(distDir, indexHtml);
  writePrerenderedShells(distDir, indexHtml, siteUrl);
  const shells = [
    ...PRERENDER_PAGES.map((p) => p.path),
    ...CATALOG_DETAIL_FIXTURES.map((f) => `/catalog/${f.id}`),
  ].join(", ");
  console.log(
    `gen-seo-static: wrote sitemap.xml, robots.txt, _redirects, 404.html, prerender [${shells}] → ${distDir} (site=${siteUrl})`,
  );
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  return path.resolve(entry) === fileURLToPath(import.meta.url);
}

if (isDirectRun()) {
  generateSeoStatic();
}
