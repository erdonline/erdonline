/**
 * Recapture HTTP MCP guide screenshots (no live app required).
 * Run: cd frontend && node scripts/capture-mcp-guide-shots.mjs
 *
 * Uses the same fixture PAT as personal-access-tokens.spec.ts
 * (`erd_pat_e2e_mcp_secret`) — never a production secret.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const outGuide = path.join(repo, 'website/static/img/guide');
const outArticles = path.join(repo, 'content/articles/assets');
const fixturePat = 'erd_pat_e2e_mcp_secret';
const mcpUrl = 'https://api.erdonline.com/mcp';
const cursorJson = `{
  "mcpServers": {
    "erdonline": {
      "url": "${mcpUrl}",
      "headers": {
        "Authorization": "Bearer ${fixturePat}"
      }
    }
  }
}
`;

const revealHtml = `<!doctype html>
<html lang="zh-Hans">
<head>
  <meta charset="utf-8"/>
  <title>PAT reveal</title>
  <style>
    body { margin: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .wrap { padding: 24px; }
    .dialog {
      width: 720px; background: #fff; border-radius: 8px;
      box-shadow: 0 6px 16px rgba(0,0,0,.12); overflow: hidden;
    }
    .title { padding: 12px 16px; font-size: 13px; font-weight: 600; border-bottom: 1px solid #f0f0f0; }
    .body { padding: 16px; }
    .warn {
      margin: 0 0 12px; padding: 8px 12px; border-radius: 6px;
      background: #fff2f0; color: #a8071a; font-size: 12px; line-height: 18px;
    }
    .label { margin: 0 0 4px; font-size: 12px; color: rgba(0,0,0,.65); }
    .token { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    code.pat {
      font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;
      font-size: 12px; background: #f5f5f5; padding: 4px 8px; border-radius: 4px;
    }
    .link { color: #1677ff; font-size: 12px; }
    h3 { margin: 12px 0 6px; font-size: 13px; }
    .hint { margin: 0 0 8px; font-size: 12px; line-height: 18px; color: rgba(0,0,0,.65); }
    .card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px; }
    .card strong { display: block; font-size: 12px; margin-bottom: 4px; }
    .actions { font-size: 12px; color: #1677ff; margin-bottom: 4px; }
    pre {
      margin: 4px 0 0; max-height: 180px; overflow: auto; padding: 8px 10px;
      border-radius: 6px; background: #f5f5f5; font-size: 11px; line-height: 16px;
      font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; white-space: pre;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="dialog" id="reveal">
      <div class="title">请立即保存令牌</div>
      <div class="body">
        <p class="warn">令牌明文仅此一次显示，关闭后无法再查看，请立即复制到安全位置。</p>
        <p class="label">token</p>
        <div class="token"><code class="pat">${fixturePat}</code><span class="link">复制</span></div>
        <h3>趁明文仍可见，现在就装进客户端</h3>
        <p class="hint">下面的复制动作已填入本次 PAT。Cursor 打开链接只含 URL，不含 PAT，仍需复制旁边的已填配置。</p>
        <div class="card">
          <strong>Cursor</strong>
          <div class="actions">打开程序（无 PAT）　复制已填 PAT 配置</div>
          <pre id="mcp-json">${cursorJson.replace(/</g, '&lt;')}</pre>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

const jsonHtml = `<!doctype html>
<html lang="zh-Hans">
<head>
  <meta charset="utf-8"/>
  <title>mcp.json</title>
  <style>
    body { margin: 0; background: #fff; }
    pre {
      margin: 16px; padding: 16px; border-radius: 8px; background: #f6f8fa;
      font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;
      font-size: 13px; line-height: 20px; white-space: pre;
    }
  </style>
</head>
<body><pre id="mcp-json">${cursorJson.replace(/</g, '&lt;')}</pre></body>
</html>`;

const toolsHtml = `<!doctype html>
<html lang="zh-Hans">
<head>
  <meta charset="utf-8"/>
  <title>MCP tools</title>
  <style>
    body { margin: 0; background: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    table { border-collapse: collapse; margin: 16px; font-size: 13px; line-height: 20px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; vertical-align: top; }
    th { background: #f6f8fa; font-weight: 600; }
    code { font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; font-size: 12px; }
  </style>
</head>
<body>
  <table id="tools">
    <thead>
      <tr><th>Tool</th><th>作用</th><th>Scope</th></tr>
    </thead>
    <tbody>
      <tr><td><code>list_projects</code> / <code>get_project</code> / <code>get_project_schema</code></td><td>列项目、读 projectJSON</td><td><code>projects:read</code></td></tr>
      <tr><td><code>list_tables</code> / <code>describe_table</code></td><td>契约渐进披露：先列表、再按需读单表字段 + FK 邻域</td><td><code>projects:read</code></td></tr>
      <tr><td><code>list_versions</code> / <code>get_version</code></td><td>读版本历史</td><td><code>versions:read</code></td></tr>
      <tr><td><code>diff_versions</code></td><td>对比两个命名版本的语义差异（表/列增删改）</td><td><code>versions:read</code></td></tr>
      <tr><td><code>preview_ddl</code></td><td>从命名版本生成 CREATE TABLE 草稿；永不连库、永不执行 SQL</td><td><code>versions:read</code></td></tr>
      <tr><td><code>create_version</code></td><td>提交一版（人再 diff）</td><td><code>versions:write</code></td></tr>
      <tr><td><code>update_project</code> / <code>put_project_json</code></td><td>改项目元数据 / 整份 JSON</td><td><code>projects:write</code></td></tr>
      <tr><td><code>list_templates</code> / <code>get_template</code> / <code>install_template</code></td><td>模板广场</td><td>read / <code>projects:write</code></td></tr>
    </tbody>
  </table>
</body>
</html>`;

function writeHtml(name, html) {
  const file = path.join('/tmp', name);
  fs.writeFileSync(file, html);
  return `file://${file}`;
}

async function shot(page, url, selector, destPng) {
  await page.goto(url);
  const el = page.locator(selector);
  await el.waitFor();
  await el.screenshot({path: destPng});
}

async function toWebp(pngPath) {
  const webpPath = pngPath.replace(/\.png$/, '.webp');
  const {spawnSync} = await import('node:child_process');
  const cwebp = spawnSync('cwebp', ['-q', '82', pngPath, '-o', webpPath], {
    encoding: 'utf8',
  });
  if (cwebp.status !== 0) {
    const magick = spawnSync(
      'magick',
      [pngPath, '-quality', '82', webpPath],
      {encoding: 'utf8'},
    );
    if (magick.status !== 0) {
      console.warn(`webp convert skipped for ${pngPath}`);
      return pngPath;
    }
  }
  return webpPath;
}

function copyToArticles(file) {
  fs.copyFileSync(file, path.join(outArticles, path.basename(file)));
}

const browser = await chromium.launch();
const page = await browser.newPage({viewport: {width: 900, height: 900}});
fs.mkdirSync(outGuide, {recursive: true});
fs.mkdirSync(outArticles, {recursive: true});

const revealPng = path.join(outGuide, 'mcp-pat-reveal.png');
const jsonPng = path.join(outGuide, 'mcp-json.png');
const toolsPng = path.join(outGuide, 'mcp-agent-tools.png');

await shot(page, writeHtml('mcp-pat-reveal.html', revealHtml), '#reveal', revealPng);
await shot(page, writeHtml('mcp-json.html', jsonHtml), '#mcp-json', jsonPng);
await shot(page, writeHtml('mcp-tools.html', toolsHtml), '#tools', toolsPng);

for (const png of [revealPng, jsonPng, toolsPng]) {
  copyToArticles(png);
  const webp = await toWebp(png);
  if (webp.endsWith('.webp')) {
    copyToArticles(webp);
  }
}

await browser.close();
console.log('wrote', revealPng, jsonPng, toolsPng);
