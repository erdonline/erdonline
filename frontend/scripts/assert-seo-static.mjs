#!/usr/bin/env node
/**
 * Assert per-path SPA shells in dist/ (or --self-test against a fixture).
 *
 *   node scripts/assert-seo-static.mjs              # frontend/dist after yarn build
 *   node scripts/assert-seo-static.mjs --self-test   # no umi build
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  HOME_SEO,
  PRERENDER_PAGES,
  SITEMAP_PATHS,
  marketingHreflang,
  resolveSiteUrl,
} from "./seo-config.mjs";
import { distHtmlPath, generateSeoStatic } from "./gen-seo-static.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const failures = [];

function fail(msg) {
  failures.push(msg);
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].trim() : "";
}

function extractCanonical(html) {
  const byRel = html.match(
    /<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i,
  );
  if (byRel) return byRel[1];
  const byHref = html.match(
    /<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i,
  );
  return byHref ? byHref[1] : "";
}

function extractHreflang(html, lang) {
  const re = new RegExp(
    `<link\\b[^>]*rel=["']alternate["'][^>]*hreflang=["']${lang}["'][^>]*href=["']([^"']+)["']`,
    "i",
  );
  const m = html.match(re);
  return m ? m[1] : "";
}

function extractHtmlLang(html) {
  const m = html.match(/<html\b[^>]*\blang=["']([^"']+)["']/i);
  return m ? m[1] : "";
}

const HOME_CANONICAL_RE = /href=["']https:\/\/www\.erdonline\.com\/["']/;

function assertShell(distDir, siteUrl, pathname, expected) {
  const file = distHtmlPath(distDir, pathname);
  const rel = path.relative(distDir, file);
  if (!fs.existsSync(file)) {
    fail(`missing shell ${rel}`);
    return;
  }
  const html = fs.readFileSync(file, "utf8");
  const title = extractTitle(html);
  const canonical = extractCanonical(html);
  const hreflang = marketingHreflang(pathname, siteUrl);

  if (title !== expected.title) {
    fail(`${rel} <title> expected ${JSON.stringify(expected.title)}, got ${JSON.stringify(title)}`);
  }
  if (canonical !== expected.canonical) {
    fail(`${rel} canonical expected ${expected.canonical}, got ${canonical || "(missing)"}`);
  }
  if (!html.includes('id="root"') && !html.includes("id='root'")) {
    fail(`${rel} must keep SPA #root`);
  }
  if (pathname !== "/") {
    const homeCanonicalTag = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i)?.[0] || "";
    if (HOME_CANONICAL_RE.test(homeCanonicalTag) && expected.canonical !== `${siteUrl}/`) {
      fail(`${rel} canonical still points at homepage`);
    }
    if (expected.title !== HOME_SEO.title && html.includes(`<title>${HOME_SEO.title}</title>`)) {
      fail(`${rel} still has homepage <title>`);
    }
  }
  for (const [lang, href] of [
    ["zh-CN", hreflang.zh],
    ["en", hreflang.en],
    ["x-default", hreflang.xDefault],
  ]) {
    const got = extractHreflang(html, lang);
    if (got !== href) {
      fail(`${rel} hreflang=${lang} expected ${href}, got ${got || "(missing)"}`);
    }
  }
  if (expected.lang && extractHtmlLang(html) !== expected.lang) {
    fail(`${rel} html lang expected ${expected.lang}, got ${extractHtmlLang(html) || "(missing)"}`);
  }
}

function assertRedirects(distDir) {
  const redirectsPath = path.join(distDir, "_redirects");
  if (!fs.existsSync(redirectsPath)) {
    fail("missing _redirects");
    return;
  }
  const text = fs.readFileSync(redirectsPath, "utf8");
  const exact = new Set();
  for (const raw of text.split("\n")) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const from = line.split(/\s+/)[0];
    exact.add(from);
  }
  for (const page of PRERENDER_PAGES) {
    if (exact.has(page.path)) {
      fail(`_redirects must not 200-rewrite prerendered ${page.path} to /`);
    }
    const splat = `${page.path}/*`;
    if (exact.has(splat)) {
      fail(
        `_redirects ${splat} splat matches ${page.path}/ (empty segment) and would serve homepage shell`,
      );
    }
  }
  if (!exact.has("/catalog/:id")) {
    fail("_redirects must 200-rewrite /catalog/:id details without matching /catalog/");
  }
}

function assertSitemapCoverage() {
  const prerendered = new Set(PRERENDER_PAGES.map((p) => p.path));
  const skip = new Set(["/"]);
  for (const p of SITEMAP_PATHS) {
    if (skip.has(p)) continue;
    if (!prerendered.has(p)) {
      fail(`SITEMAP_PATHS ${p} has no PRERENDER_PAGES entry (crawlers would get homepage shell)`);
    }
  }
}

/**
 * @param {string} distDir
 * @param {string} [siteUrl]
 */
export function assertSeoStatic(distDir, siteUrl = resolveSiteUrl()) {
  assertSitemapCoverage();
  assertRedirects(distDir);

  assertShell(distDir, siteUrl, "/", {
    title: HOME_SEO.title,
    canonical: `${siteUrl}/`,
    lang: "en",
  });

  for (const page of PRERENDER_PAGES) {
    assertShell(distDir, siteUrl, page.path, {
      title: page.title,
      canonical: marketingHreflang(page.path, siteUrl).canonical,
      lang: page.locale === "en-US" ? "en" : "zh-CN",
    });
  }

  if (failures.length) {
    console.error(`assert-seo-static: ${failures.length} failure(s)`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(
    `assert-seo-static: PASS (${PRERENDER_PAGES.length} prerender shells + / + _redirects)`,
  );
}

const HOME_FIXTURE = `<!DOCTYPE html>
<html lang="en">
<head>
    <title>${HOME_SEO.title}</title>
    <meta name="description" content="${HOME_SEO.description}"/>
    <link rel="canonical" href="https://www.erdonline.com/"/>
    <meta property="og:url" content="https://www.erdonline.com/"/>
    <meta property="og:title" content="${HOME_SEO.title}"/>
    <meta property="og:description" content="${HOME_SEO.description}"/>
    <meta name="twitter:title" content="${HOME_SEO.title}"/>
    <meta name="twitter:description" content="${HOME_SEO.description}"/>
    <script type="application/ld+json">{"url": "https://www.erdonline.com/"}</script>
</head>
<body><div id="root">shell</div></body>
</html>
`;

function selfTest() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "erd-seo-static-"));
  fs.writeFileSync(path.join(dir, "index.html"), HOME_FIXTURE, "utf8");
  generateSeoStatic(dir, "https://www.erdonline.com");
  assertSeoStatic(dir, "https://www.erdonline.com");
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  return path.resolve(entry) === fileURLToPath(import.meta.url);
}

if (isDirectRun()) {
  if (process.argv.includes("--self-test")) {
    selfTest();
  } else {
    const distDir = process.env.ERD_DIST_DIR || path.join(__dirname, "..", "dist");
    assertSeoStatic(distDir);
  }
}
