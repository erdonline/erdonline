#!/usr/bin/env node
/**
 * Docs SEO invariants (no deps). Run from website/:
 *   node scripts/assert-docs-seo.mjs
 * After yarn build, add --require-build to assert sitemap.xml.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const websiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requireBuild = process.argv.includes('--require-build');
const failures = [];

function fail(msg) {
  failures.push(msg);
}

function read(rel) {
  return fs.readFileSync(path.join(websiteRoot, rel), 'utf8');
}

const config = read('docusaurus.config.js');
if (!/trailingSlash:\s*true/.test(config)) {
  fail('docusaurus.config.js must set trailingSlash: true (CF Pages 308s directories to /)');
}

const robots = read('static/robots.txt');
for (const sitemap of [
  'https://doc.erdonline.com/sitemap.xml',
  'https://doc.erdonline.com/en/sitemap.xml',
]) {
  if (!robots.includes(`Sitemap: ${sitemap}`)) {
    fail(`static/robots.txt must list ${sitemap}`);
  }
}
if (!robots.includes('https://doc.erdonline.com/llms.txt')) {
  fail('static/robots.txt must point agents at https://doc.erdonline.com/llms.txt');
}

const llms = read('static/llms.txt');
if (!/^# .+/m.test(llms)) {
  fail('static/llms.txt must have an H1 heading');
}
const markdownLinks = [...llms.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g)];
if (markdownLinks.length < 3) {
  fail(`static/llms.txt must contain at least 3 Markdown-style links (found ${markdownLinks.length})`);
}
if (!llms.includes('https://doc.erdonline.com/docs/guide/api-and-mcp/')) {
  fail('static/llms.txt must link MCP guide with trailing slash');
}
if (!llms.includes('https://doc.erdonline.com/en/docs/guide/api-and-mcp/')) {
  fail('static/llms.txt must link English MCP guide with trailing slash');
}
if (!llms.includes('https://api.erdonline.com/mcp')) {
  fail('static/llms.txt must name the Streamable HTTP MCP URL');
}
if (!llms.includes('Authorization') || !llms.includes('Bearer erd_pat_')) {
  fail('static/llms.txt must show Bearer PAT header, not npx tarball');
}
if (llms.includes('erdonline-mcp-0.1.0.tgz') || llms.includes('--package')) {
  fail('static/llms.txt must not advertise the stdio tarball as the primary path');
}
if (!llms.includes('selectKey=personalAccessTokens')) {
  fail('static/llms.txt must link the PAT minting page');
}
if (!llms.includes('suggest-erd-version')) {
  fail('static/llms.txt must name prompt suggest-erd-version');
}
if (!/Git \+ Figma/i.test(llms)) {
  fail('static/llms.txt must keep Git + Figma positioning');
}
if (/github\.io/i.test(llms)) {
  fail('static/llms.txt must not use github.io docs host');
}

const zhMcpGuide = fs.readFileSync(
  path.join(websiteRoot, '../docs/guide/api-and-mcp.md'),
  'utf8',
);
const enMcpGuide = read(
  'i18n/en/docusaurus-plugin-content-docs/current/guide/api-and-mcp.md',
);
for (const [label, text] of [
  ['zh MCP guide', zhMcpGuide],
  ['en MCP guide', enMcpGuide],
]) {
  if (!text.includes('suggest-erd-version')) {
    fail(`${label} must name prompt suggest-erd-version`);
  }
  if (!text.includes('API 200')) {
    fail(`${label} must say API 200 is not human approval`);
  }
  if (!text.includes('https://api.erdonline.com/mcp')) {
    fail(`${label} must name the Streamable HTTP MCP URL`);
  }
  if (!text.includes('selectKey=personalAccessTokens')) {
    fail(`${label} must link the PAT minting page`);
  }
  if (!text.includes('mcp-pat-reveal.webp')) {
    fail(`${label} must embed the PAT reveal screenshot`);
  }
  if (text.includes('erdonline-mcp-0.1.0.tgz')) {
    fail(`${label} must not use the stdio tarball as the primary install`);
  }
}
const zhWhat = fs.readFileSync(
  path.join(websiteRoot, '../docs/guide/what-is-erd-online.md'),
  'utf8',
);
const enWhat = read(
  'i18n/en/docusaurus-plugin-content-docs/current/guide/what-is-erd-online.md',
);
for (const [label, text] of [
  ['zh what-is', zhWhat],
  ['en what-is', enWhat],
]) {
  if (!text.includes('suggest-erd-version')) {
    fail(`${label} must name prompt suggest-erd-version as a secondary path`);
  }
}
const zhIntro = fs.readFileSync(
  path.join(websiteRoot, '../docs/guide/intro.md'),
  'utf8',
);
const enIntro = read(
  'i18n/en/docusaurus-plugin-content-docs/current/guide/intro.md',
);
for (const [label, text] of [
  ['zh intro', zhIntro],
  ['en intro', enIntro],
]) {
  if (!text.includes('suggest-erd-version')) {
    fail(`${label} must name prompt suggest-erd-version`);
  }
}
const zhSave = fs.readFileSync(
  path.join(websiteRoot, '../docs/guide/save-version-and-diff.md'),
  'utf8',
);
const enSave = read(
  'i18n/en/docusaurus-plugin-content-docs/current/guide/save-version-and-diff.md',
);
for (const [label, text] of [
  ['zh save-version', zhSave],
  ['en save-version', enSave],
]) {
  if (!text.includes('suggest-erd-version')) {
    fail(`${label} must name prompt suggest-erd-version`);
  }
}
const zhHost = fs.readFileSync(
  path.join(websiteRoot, '../docs/guide/quick-self-host.md'),
  'utf8',
);
const enHost = read(
  'i18n/en/docusaurus-plugin-content-docs/current/guide/quick-self-host.md',
);
for (const [label, text] of [
  ['zh quick-self-host', zhHost],
  ['en quick-self-host', enHost],
]) {
  if (!text.includes('suggest-erd-version')) {
    fail(`${label} must name prompt suggest-erd-version`);
  }
  if (!text.includes('127.0.0.1:9502')) {
    fail(`${label} must point self-host MCP at 127.0.0.1:9502`);
  }
}
const zhRev = fs.readFileSync(
  path.join(websiteRoot, '../docs/guide/reverse-engineer.md'),
  'utf8',
);
const enRev = read(
  'i18n/en/docusaurus-plugin-content-docs/current/guide/reverse-engineer.md',
);
for (const [label, text] of [
  ['zh reverse-engineer', zhRev],
  ['en reverse-engineer', enRev],
]) {
  if (!text.includes('suggest-erd-version')) {
    fail(`${label} must name prompt suggest-erd-version`);
  }
}
if (fs.existsSync(path.join(websiteRoot, 'static/llms-full.txt'))) {
  fail('do not add llms-full.txt unless the site already had that pattern');
}

const redirects = read('static/_redirects');
for (const raw of redirects.split('\n')) {
  const line = raw.replace(/#.*$/, '').trim();
  if (!line) continue;
  const parts = line.split(/\s+/);
  if (parts.length < 3) continue;
  const dest = parts[1];
  if (dest.startsWith('/') && !dest.endsWith('/')) {
    fail(`_redirects destination must be canonical with trailing slash: ${raw.trim()}`);
  }
}

const middleware = read('functions/_middleware.js');
if (!/canonicalizeDocsPathname/.test(middleware)) {
  fail('functions/_middleware.js must canonicalize extensionless paths to trailing slash');
}

function assertSitemapFile(rel, introSuffix) {
  const xmlPath = path.join(websiteRoot, rel);
  if (!fs.existsSync(xmlPath)) {
    fail(`${rel} missing`);
    return;
  }
  const xml = fs.readFileSync(xmlPath, 'utf8');
  const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1].trim());
  if (locs.length === 0) fail(`${rel} has zero <loc>`);
  const intro = locs.find((u) => u.includes('/docs/guide/intro'));
  if (!intro?.endsWith(introSuffix)) {
    fail(`${rel} intro loc must end with ${introSuffix} (got ${intro || 'missing'})`);
  }
  for (const loc of locs) {
    const pathname = new URL(loc).pathname;
    if (/\/search\/?$/.test(pathname) || pathname.includes('/search/')) {
      fail(`${rel} must not include search utility URL: ${loc}`);
    }
    const last = pathname.split('/').pop() || '';
    if (last.includes('.')) continue;
    if (!pathname.endsWith('/')) {
      fail(`${rel} loc must use trailing slash: ${loc}`);
    }
  }
}

const sitemapPath = path.join(websiteRoot, 'build/sitemap.xml');
const sitemapExists = fs.existsSync(sitemapPath);
if (requireBuild && !sitemapExists) {
  fail('build/sitemap.xml missing (run yarn build first)');
}
if (sitemapExists) {
  assertSitemapFile('build/sitemap.xml', '/docs/guide/intro/');
  assertSitemapFile('build/en/sitemap.xml', '/en/docs/guide/intro/');

  const mcpZh = path.join(websiteRoot, 'build/docs/guide/api-and-mcp/index.html');
  const mcpEn = path.join(websiteRoot, 'build/en/docs/guide/api-and-mcp/index.html');
  if (!fs.existsSync(mcpZh)) fail('build/docs/guide/api-and-mcp/index.html missing');
  else {
    const html = fs.readFileSync(mcpZh, 'utf8');
    if (!/<title[^>]*>[^<]*MCP/i.test(html)) {
      fail('zh MCP page <title> must contain MCP');
    }
    if (!/name="description"[^>]*content="[^"]*projectJSON/i.test(html) && !/content="[^"]*projectJSON[^"]*"[^>]*name="description"/i.test(html)) {
      fail('zh MCP page description must mention projectJSON');
    }
    if (!/mcpServers/.test(html)) fail('zh MCP page must include copy-paste mcpServers JSON');
    if (!/api\.erdonline\.com\/mcp/.test(html)) {
      fail('zh MCP page must name https://api.erdonline.com/mcp');
    }
    if (!/mcp-pat-reveal/.test(html)) {
      fail('zh MCP page must embed the PAT reveal screenshot');
    }
  }
  if (!fs.existsSync(mcpEn)) fail('build/en/docs/guide/api-and-mcp/index.html missing');
  else {
    const html = fs.readFileSync(mcpEn, 'utf8');
    if (!/<title[^>]*>[^<]*MCP/i.test(html)) {
      fail('en MCP page <title> must contain MCP');
    }
    if (!/mcpServers/.test(html)) fail('en MCP page must include copy-paste mcpServers JSON');
    if (!/api\.erdonline\.com\/mcp/.test(html)) {
      fail('en MCP page must name https://api.erdonline.com/mcp');
    }
  }
}

if (failures.length) {
  console.error('FAIL docs SEO');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  `PASS docs SEO (sitemap ${sitemapExists ? 'checked' : 'skipped — build not present'})`,
);
