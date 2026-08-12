#!/usr/bin/env node
/**
 * SEO / indexing health check (no external deps).
 *
 * Checks:
 * 1) Key landing pages: HTTP 200, HTML, has title/description/canonical, not noindex.
 * 2) Sitemap presence and sampled URL reachability.
 *
 * Exit code:
 * - 0: pass
 * - 1: any hard failure
 */

const BASE_URL = (process.env.SEO_BASE_URL || "https://www.erdonline.com").replace(/\/+$/, "");
const SITEMAP_SAMPLE = Number(process.env.SEO_SITEMAP_SAMPLE || 20);
const TIMEOUT_MS = Number(process.env.SEO_TIMEOUT_MS || 15000);

const PAGE_PATHS = [
  "/",
  "/demo",
  "/catalog",
  "/compare",
  "/docs/",
  "/docs/roadmap",
];

/** Fixed path that must NOT exist as a static file or SPA route. */
const SOFT_404_PROBE_PATH = "/__seo_health_nonexistent_path__";

/** Known SPA routes that must stay HTTP 200 after true-404 rollout. */
const SPA_ROUTE_PATHS = ["/compare", "/catalog", "/demo", "/login"];

function timeoutSignal(ms) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(id) };
}

async function fetchText(url) {
  const t = timeoutSignal(TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: t.signal,
      headers: { "user-agent": "erd-seo-health-check/1.0" },
    });
    const text = await res.text();
    return { res, text, error: null };
  } catch (error) {
    return { res: null, text: "", error };
  } finally {
    t.cancel();
  }
}

function extractTag(html, re) {
  const m = html.match(re);
  return m ? m[1].trim() : "";
}

function isNoIndex(html) {
  return /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
}

function pickCanonical(html) {
  return extractTag(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
}

function pickDescription(html) {
  return extractTag(
    html,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
  );
}

function pickTitle(html) {
  return extractTag(html, /<title>([^<]+)<\/title>/i);
}

function parseLocs(xml) {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1].trim());
}

function abs(path) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function checkPage(path) {
  const url = abs(path);
  const { res, text, error } = await fetchText(url);
  if (error) {
    return { path, url, ok: false, reason: `fetch error: ${error.message}` };
  }
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const title = pickTitle(text);
  const description = pickDescription(text);
  const canonical = pickCanonical(text);
  const noindex = isNoIndex(text);

  const failures = [];
  if (res.status !== 200) failures.push(`status=${res.status}`);
  if (!ct.includes("text/html")) failures.push(`content-type=${ct || "missing"}`);
  if (!title) failures.push("missing <title>");
  if (!description) failures.push("missing meta description");
  if (!canonical) failures.push("missing canonical");
  if (noindex) failures.push("contains noindex");

  return {
    path,
    url,
    ok: failures.length === 0,
    reason: failures.join("; "),
    title,
    canonical,
  };
}

async function checkSoft404() {
  const path = SOFT_404_PROBE_PATH;
  const url = abs(path);
  const { res, error } = await fetchText(url);
  if (error) {
    return { ok: false, path, url, reason: `fetch error: ${error.message}` };
  }
  if (!res || res.status !== 404) {
    return {
      ok: false,
      path,
      url,
      reason: `expected HTTP 404 for unknown path, got status=${res ? res.status : "unknown"}`,
    };
  }
  return { ok: true, path, url, reason: "" };
}

async function checkSpaRoute(path) {
  const url = abs(path);
  const { res, error } = await fetchText(url);
  if (error) {
    return { path, url, ok: false, reason: `fetch error: ${error.message}` };
  }
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const failures = [];
  if (res.status !== 200) failures.push(`status=${res.status}`);
  if (!ct.includes("text/html")) failures.push(`content-type=${ct || "missing"}`);
  return {
    path,
    url,
    ok: failures.length === 0,
    reason: failures.join("; "),
  };
}

async function checkRobotsTxt() {
  const url = abs("/robots.txt");
  const { res, text, error } = await fetchText(url);
  if (error) {
    return { ok: false, url, reason: `fetch error: ${error.message}` };
  }
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const failures = [];
  if (res.status !== 200) failures.push(`status=${res.status}`);
  if (ct.includes("text/html")) failures.push("content-type=text/html (likely SPA soft 404 or CF default)");
  if (!/user-agent:\s*\*/i.test(text)) failures.push("missing User-agent: *");
  if (!/sitemap:\s*https?:\/\//i.test(text)) failures.push("missing Sitemap: absolute URL");
  if (/content-signal:/i.test(text)) failures.push("still serving Cloudflare injected default robots.txt");

  return {
    ok: failures.length === 0,
    url,
    reason: failures.join("; "),
  };
}

async function checkSitemap() {
  const candidates = ["/sitemap.xml", "/sitemap-index.xml"];
  for (const p of candidates) {
    const url = abs(p);
    const { res, text, error } = await fetchText(url);
    if (error) continue;
    if (res.status !== 200) continue;
    if (!text.includes("<urlset") && !text.includes("<sitemapindex")) continue;

    const locs = parseLocs(text);
    if (locs.length === 0) {
      return {
        ok: false,
        sitemapUrl: url,
        sampled: [],
        reason: "sitemap has zero <loc>",
      };
    }

    const sampled = locs.slice(0, Math.max(1, SITEMAP_SAMPLE));
    const bad = [];
    for (const s of sampled) {
      const { res: sRes, error: sErr } = await fetchText(s);
      if (sErr) {
        bad.push({ url: s, reason: `fetch error: ${sErr.message}` });
        continue;
      }
      if (!sRes || sRes.status >= 400) {
        bad.push({ url: s, reason: `status=${sRes ? sRes.status : "unknown"}` });
      }
    }

    return {
      ok: bad.length === 0,
      sitemapUrl: url,
      sampled,
      totalLocs: locs.length,
      bad,
      reason: bad.length ? `${bad.length}/${sampled.length} sampled sitemap URLs failed` : "",
    };
  }

  return {
    ok: false,
    sitemapUrl: "",
    sampled: [],
    reason: "no reachable sitemap.xml or sitemap-index.xml",
  };
}

function printHeader(msg) {
  console.log(`\n=== ${msg} ===`);
}

async function main() {
  console.log(`SEO health check base: ${BASE_URL}`);

  printHeader("Page Indexability");
  const pageResults = [];
  for (const p of PAGE_PATHS) {
    const r = await checkPage(p);
    pageResults.push(r);
    if (r.ok) {
      console.log(`PASS ${r.path} (${r.title})`);
    } else {
      console.log(`FAIL ${r.path} -> ${r.reason}`);
    }
  }

  printHeader("Robots.txt");
  const robots = await checkRobotsTxt();
  if (robots.ok) {
    console.log(`PASS robots.txt (${robots.url})`);
  } else {
    console.log(`FAIL robots.txt -> ${robots.reason}`);
  }

  printHeader("Soft 404 (unknown path)");
  const soft404 = await checkSoft404();
  if (soft404.ok) {
    console.log(`PASS ${soft404.path} returns HTTP 404`);
  } else {
    console.log(`FAIL ${soft404.path} -> ${soft404.reason}`);
  }

  printHeader("SPA routes (must stay 200)");
  const spaResults = [];
  for (const p of SPA_ROUTE_PATHS) {
    const r = await checkSpaRoute(p);
    spaResults.push(r);
    if (r.ok) {
      console.log(`PASS ${r.path} → HTTP 200`);
    } else {
      console.log(`FAIL ${r.path} -> ${r.reason}`);
    }
  }

  printHeader("Sitemap Health");
  const sitemap = await checkSitemap();
  if (sitemap.ok) {
    console.log(
      `PASS sitemap=${sitemap.sitemapUrl} totalLocs=${sitemap.totalLocs} sampled=${sitemap.sampled.length}`,
    );
  } else {
    console.log(`FAIL sitemap -> ${sitemap.reason}`);
    if (Array.isArray(sitemap.bad)) {
      sitemap.bad.slice(0, 10).forEach((b) => {
        console.log(`  - ${b.url} (${b.reason})`);
      });
    }
  }

  const failedPages = pageResults.filter((r) => !r.ok);
  const failedSpaRoutes = spaResults.filter((r) => !r.ok);
  const hardFail =
    failedPages.length > 0 ||
    failedSpaRoutes.length > 0 ||
    !sitemap.ok ||
    !robots.ok ||
    !soft404.ok;

  printHeader("Summary");
  console.log(
    JSON.stringify(
      {
        baseUrl: BASE_URL,
        checkedPages: pageResults.length,
        failedPages: failedPages.map((x) => ({ path: x.path, reason: x.reason })),
        robots: { ok: robots.ok, reason: robots.reason || "" },
        soft404: { ok: soft404.ok, path: soft404.path, reason: soft404.reason || "" },
        spaRoutes: failedSpaRoutes.map((x) => ({ path: x.path, reason: x.reason })),
        sitemap: {
          ok: sitemap.ok,
          url: sitemap.sitemapUrl,
          reason: sitemap.reason || "",
        },
      },
      null,
      2,
    ),
  );

  if (hardFail) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("FATAL:", error);
  process.exit(1);
});

