#!/usr/bin/env node
/**
 * Prerender the landing page by loading the built dist/ in a headless browser
 * and capturing the #root innerHTML. Used by gen-seo-static.mjs for SSG.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { defaultDistDir, resolveDistFile } from "./serve-dist-pages.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

function startServer(distDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
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

    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      console.log(`[prerender-landing] dist served at http://127.0.0.1:${port}`);
      resolve({ server, port });
    });
  });
}

/**
 * @param {string} [distDir]
 * @returns {Promise<string>} the rendered #root innerHTML
 */
export async function prerenderLanding(distDir = defaultDistDir()) {
  const { server, port } = await startServer(distDir);
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      locale: "en-US",
      // Disable service workers / caches to keep renders deterministic.
      serviceWorkers: "block",
    });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${port}/`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    // Give React an extra beat to finish initial paint/hydration.
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const switcher = document.querySelector('[data-testid="locale-switcher"]');
      if (switcher) {
        switcher.outerHTML =
          '<div class="landingNavLocaleStatic" data-testid="locale-switcher" aria-label="语言">' +
          '<select class="locale-switcher-static" onchange="location.href=this.value" aria-label="语言" ' +
          'style="background:transparent;color:inherit;border:1px solid rgba(255,255,255,.25);border-radius:4px;padding:2px 6px;font-size:12px;"> ' +
          '<option value="/" selected>中文</option>' +
          '<option value="/en">EN</option>' +
          '</select>' +
          '</div>';
      }
    });
    const rootHtml = await page.evaluate(() => {
      const root = document.getElementById("root");
      return root ? root.innerHTML : "";
    });
    return rootHtml;
  } finally {
    await browser.close();
    server.close();
  }
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  return path.resolve(entry) === fileURLToPath(import.meta.url);
}

if (isDirectRun()) {
  const distDir = defaultDistDir();
  prerenderLanding(distDir)
    .then((html) => {
      console.log("[prerender-landing] captured #root innerHTML");
      console.log(html.slice(0, 200) + "...");
    })
    .catch((err) => {
      console.error("[prerender-landing] failed:", err.message);
      process.exit(1);
    });
}
