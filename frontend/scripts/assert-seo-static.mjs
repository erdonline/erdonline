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
  CATALOG_DETAIL_FIXTURES,
  HOME_SEO,
  PRERENDER_PAGES,
  SITEMAP_PATHS,
  catalogDetailPage,
  jsonLdForPage,
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

function extractJsonLd(html) {
  const m = html.match(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i,
  );
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

function assertJsonLd(rel, html, page, siteUrl) {
  const ld = extractJsonLd(html);
  const expected = jsonLdForPage(page, siteUrl);
  if (!ld) {
    fail(`${rel} missing JSON-LD`);
    return;
  }
  if (ld["@type"] !== expected["@type"]) {
    fail(`${rel} JSON-LD @type expected ${expected["@type"]}, got ${ld["@type"]}`);
  }
  if (ld.url !== expected.url) {
    fail(`${rel} JSON-LD url expected ${expected.url}, got ${ld.url || "(missing)"}`);
  }
  if (page.path !== "/") {
    if (ld["@type"] === "WebApplication") {
      fail(`${rel} JSON-LD must not be homepage WebApplication`);
    }
    if (ld.url === `${siteUrl}/`) {
      fail(`${rel} JSON-LD url still points at homepage`);
    }
  }
}

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
  if (expected.jsonLdPage) {
    assertJsonLd(rel, html, expected.jsonLdPage, siteUrl);
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
  const rules = [];
  for (const raw of text.split("\n")) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    rules.push(line);
    exact.add(line.split(/\s+/)[0]);
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
  for (const line of rules) {
    if (line.split(/\s+/)[1]?.replace(/\/$/, "") === "/catalog/_item") {
      fail(`_redirects must not rewrite onto /catalog/_item (CF 308s directory to /catalog/_item/): ${line}`);
    }
  }
  const detailRule = rules.find((r) => r.split(/\s+/)[0] === "/catalog/:id");
  if (!detailRule) {
    fail("_redirects must handle /catalog/:id without matching /catalog/");
  } else if (detailRule.split(/\s+/)[1] === "/") {
    fail("_redirects /catalog/:id must not 200-rewrite to homepage /");
  }
  if (!rules.includes("/catalog/:id /catalog/ 200")) {
    fail("_redirects must 200-rewrite unknown /catalog/:id to /catalog/ (list shell, already slashed)");
  }
  if (!rules.includes("/catalog/:id/ /catalog/ 200")) {
    fail("_redirects must 200-rewrite unknown /catalog/:id/ to /catalog/ (avoid 404)");
  }
  if (!rules.includes("/catalog/_item /catalog/ 301")) {
    fail("_redirects must 301 /catalog/_item to /catalog/");
  }
  if (!rules.includes("/catalog/_item/ /catalog/ 301")) {
    fail("_redirects must 301 /catalog/_item/ to /catalog/");
  }
  const idIdx = rules.findIndex((r) => r.split(/\s+/)[0] === "/catalog/:id");
  const idSlashIdx = rules.findIndex((r) => r.split(/\s+/)[0] === "/catalog/:id/");
  for (const fixture of CATALOG_DETAIL_FIXTURES) {
    const identity = `/catalog/${fixture.id} /catalog/${fixture.id} 200`;
    const identitySlash = `/catalog/${fixture.id}/ /catalog/${fixture.id}/ 200`;
    const idx = rules.indexOf(identity);
    const slashIdx = rules.indexOf(identitySlash);
    if (idx < 0) {
      fail(`_redirects must identity-200 ${identity} so CF does not proxy the fixture to the list`);
    } else if (idIdx >= 0 && idx > idIdx) {
      fail(`_redirects ${identity} must appear before /catalog/:id (CF first-match)`);
    }
    if (slashIdx < 0) {
      fail(`_redirects must identity-200 ${identitySlash} so /catalog/:id/ does not steal official shells`);
    } else if (idSlashIdx >= 0 && slashIdx > idSlashIdx) {
      fail(`_redirects ${identitySlash} must appear before /catalog/:id/`);
    }
  }
}

function assertSitemapFile(distDir, siteUrl) {
  const sitemapPath = path.join(distDir, "sitemap.xml");
  if (!fs.existsSync(sitemapPath)) {
    fail("missing sitemap.xml");
    return;
  }
  const xml = fs.readFileSync(sitemapPath, "utf8");
  if (xml.includes("/catalog/_item")) {
    fail("sitemap.xml must not list /catalog/_item");
  }
  for (const fixture of CATALOG_DETAIL_FIXTURES) {
    const loc = `${siteUrl}/catalog/${fixture.id}`;
    if (!xml.includes(`<loc>${loc}</loc>`)) {
      fail(`sitemap.xml missing official template ${loc}`);
    }
  }
}

function assertSitemapCoverage() {
  const prerendered = new Set([
    ...PRERENDER_PAGES.map((p) => p.path),
    ...CATALOG_DETAIL_FIXTURES.map((f) => `/catalog/${f.id}`),
  ]);
  const skip = new Set(["/"]);
  for (const p of SITEMAP_PATHS) {
    if (skip.has(p)) continue;
    if (p === "/catalog/_item" || p === "/catalog/_item/") {
      fail("SITEMAP_PATHS must not list /catalog/_item");
      continue;
    }
    if (!prerendered.has(p)) {
      fail(`SITEMAP_PATHS ${p} has no prerender shell (crawlers would get homepage HTML)`);
    }
  }
}

/**
 * @param {string} distDir
 * @param {string} [siteUrl]
 */
export function assertSeoStatic(distDir, siteUrl = resolveSiteUrl()) {
  assertSitemapCoverage();
  assertSitemapFile(distDir, siteUrl);
  assertRedirects(distDir);

  const llmsPath = path.join(distDir, "llms.txt");
  if (!fs.existsSync(llmsPath)) {
    fail("dist/llms.txt missing");
  } else {
    const llms = fs.readFileSync(llmsPath, "utf8");
    if (!llms.includes("https://doc.erdonline.com/docs/guide/api-and-mcp/")) {
      fail("llms.txt must link MCP guide with trailing slash");
    }
    if (!llms.includes("npx") || !llms.includes("--package")) {
      fail("llms.txt must mention npx --package mcp.json shape");
    }
    if (!/Git \+ Figma/i.test(llms)) {
      fail("llms.txt must keep Git + Figma positioning");
    }
    if (/github\.io/i.test(llms)) {
      fail("llms.txt must not use github.io");
    }
  }

  const robotsTxt = fs.readFileSync(path.join(distDir, "robots.txt"), "utf8");
  if (!robotsTxt.includes(`${siteUrl}/llms.txt`)) {
    fail("robots.txt must point agents at llms.txt");
  }

  assertShell(distDir, siteUrl, "/", {
    title: HOME_SEO.title,
    canonical: `${siteUrl}/`,
    lang: "en",
    jsonLdPage: {
      path: "/",
      title: HOME_SEO.title,
      description: HOME_SEO.description,
    },
  });

  for (const page of PRERENDER_PAGES) {
    assertShell(distDir, siteUrl, page.path, {
      title: page.title,
      canonical: marketingHreflang(page.path, siteUrl).canonical,
      lang: page.locale === "en-US" ? "en" : "zh-CN",
      jsonLdPage: page,
    });
    if (page.path === "/compare" || page.path === "/en/compare") {
      if (!page.description.includes("Agent/MCP")) {
        fail(`${page.path} prerender description must mention Agent/MCP`);
      }
      if (/ChatSQL|one-shot|一句话生成/i.test(page.description)) {
        fail(`${page.path} must not claim ChatSQL`);
      }
      const html = fs.readFileSync(distHtmlPath(distDir, page.path), "utf8");
      if (!html.includes(page.description)) {
        fail(`${page.path} shell meta must include Agent/MCP description`);
      }
      if (html.includes(`<title>${HOME_SEO.title}</title>`)) {
        fail(`${page.path} first HTML must stay the compare title, not homepage`);
      }
    }
  }

  for (const fixture of CATALOG_DETAIL_FIXTURES) {
    const page = catalogDetailPage(fixture);
    assertShell(distDir, siteUrl, page.path, {
      title: page.title,
      canonical: `${siteUrl}${page.path}`,
      lang: "zh-CN",
      jsonLdPage: page,
    });
  }

  const junkFile = distHtmlPath(distDir, "/catalog/_item");
  if (fs.existsSync(junkFile)) {
    fail("must not emit catalog/_item/index.html (crawlable junk; CF 308s onto it)");
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
