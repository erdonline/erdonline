#!/usr/bin/env node
/**
 * Cloudflare Pages-like static server for prod-smoke.
 *
 * `/catalog` → dist/catalog/index.html when that shell exists.
 * `/catalog/:id` with no file → dist/catalog/index.html (list shell, keep URL).
 * `/catalog/_item` → 301 /catalog/ (must not be crawlable).
 * Missing extension-less paths → dist/index.html (SPA).
 *
 * Do not use `npx serve -s`: its `** → /index.html` rewrite (and cleanUrls)
 * ignores directory shells, so crawler-canonical smoke is a false negative
 * and blocks Pages deploy of the real dist.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 301 leftover CF junk URL onto the catalog list. */
export function catalogJunkRedirect(urlPath) {
  const raw = (urlPath || "/").split("?")[0].split("#")[0];
  let pathname;
  try {
    pathname = decodeURIComponent(raw);
  } catch {
    pathname = raw;
  }
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;
  if (pathname === "/catalog/_item" || pathname === "/catalog/_item/") return "/catalog/";
  return null;
}

export function defaultDistDir() {
  return process.env.ERD_DIST_DIR || path.join(__dirname, "..", "dist");
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".map": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

/**
 * @param {string} distDir
 * @param {string} urlPath pathname only
 * @returns {string | null} absolute file, or null if should 404
 */
export function resolveDistFile(distDir, urlPath) {
  const root = path.resolve(distDir);
  const raw = (urlPath || "/").split("?")[0].split("#")[0];
  let pathname;
  try {
    pathname = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;

  const rel = pathname === "/" ? "" : pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  const candidates = [];
  if (rel === "") {
    candidates.push(path.join(root, "index.html"));
  } else {
    candidates.push(path.join(root, rel, "index.html"));
    candidates.push(path.join(root, `${rel}.html`));
    candidates.push(path.join(root, rel));
  }

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (!resolved.startsWith(root + path.sep) && resolved !== root) continue;
    try {
      if (fs.statSync(resolved).isFile()) return resolved;
    } catch {
      /* try next */
    }
  }

  const catalogItem = pathname.match(/^\/catalog\/([^/]+)\/?$/);
  if (catalogItem && catalogItem[1] !== "_item") {
    const list = path.resolve(path.join(root, "catalog", "index.html"));
    if (list.startsWith(root + path.sep)) {
      try {
        if (fs.statSync(list).isFile()) return list;
      } catch {
        /* fall through to SPA */
      }
    }
  }

  const ext = path.extname(pathname);
  if (ext && ext !== ".html") return null;
  const spa = path.join(root, "index.html");
  try {
    if (fs.statSync(spa).isFile()) return spa;
  } catch {
    return null;
  }
  return spa;
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  return path.resolve(entry) === fileURLToPath(import.meta.url);
}

function checkResolver(distDir) {
  const want = (p) => path.join(path.resolve(distDir), p);
  const fail = (msg) => {
    console.error(`serve-dist-pages --check: ${msg}`);
    process.exit(1);
  };
  const cases = [
    ["/", "index.html"],
    ["/catalog", "catalog/index.html"],
    ["/catalog/", "catalog/index.html"],
    ["/en/catalog", "en/catalog/index.html"],
    ["/en/catalog/", "en/catalog/index.html"],
    ["/compare", "compare/index.html"],
    ["/demo", "demo/index.html"],
    ["/en/demo", "en/demo/index.html"],
    ["/catalog/demo-authz", "catalog/demo-authz/index.html"],
    ["/catalog/demo-authz/", "catalog/demo-authz/index.html"],
    ["/catalog/not-a-real-template", "catalog/index.html"],
    ["/catalog/not-a-real-template/", "catalog/index.html"],
  ];
  for (const [urlPath, rel] of cases) {
    const got = resolveDistFile(distDir, urlPath);
    if (!got || path.resolve(got) !== want(rel)) {
      fail(`${urlPath} → ${got}`);
    }
  }
  if (catalogJunkRedirect("/catalog/_item") !== "/catalog/") {
    fail("/catalog/_item must 301 to /catalog/");
  }
  if (catalogJunkRedirect("/catalog/_item/") !== "/catalog/") {
    fail("/catalog/_item/ must 301 to /catalog/");
  }
  console.log("serve-dist-pages --check: PASS (directory shells before SPA fallback)");
}

function listen(distDir, port) {
  const server = http.createServer((req, res) => {
    const loc = catalogJunkRedirect(req.url || "/");
    if (loc) {
      res.writeHead(301, { Location: loc, "Cache-Control": "no-store" });
      res.end();
      return;
    }
    const file = resolveDistFile(distDir, req.url || "/");
    if (!file) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(file);
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(file).pipe(res);
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`[serve-dist-pages] ${distDir} → http://127.0.0.1:${port}`);
  });
}

if (isDirectRun()) {
  const distDir = defaultDistDir();
  if (process.argv.includes("--check")) {
    checkResolver(distDir);
  } else {
    const port = Number(process.env.PROD_SMOKE_PORT || 4173);
    listen(distDir, port);
  }
}
