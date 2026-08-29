#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const NODE22 = path.join(os.homedir(), '.nvm/versions/node/v22.22.0/bin');

const env = { ...process.env, PATH: `${NODE22}:${process.env.PATH}` };

function cdt(args) {
  const r = spawnSync('npx', ['-y', '--package=chrome-devtools-mcp', 'chrome-devtools', ...args, '--output-format=json'], {
    env,
    encoding: 'utf-8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout);
  const raw = r.stdout.trim();
  const m = raw.match(/```json\n([\s\S]*?)\n```/);
  return JSON.parse(m ? m[1] : raw);
}

const body = fs
  .readFileSync('content/articles/cursor-mcp-read-and-suggest-version.juejin.md', 'utf-8')
  .replace(/^# .+\n+/, '')
  .trimEnd();

const fn = `async () => {
  const md = ${JSON.stringify(body)};
  const esc = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const lines = md.split('\\n');
  let html = '';
  let inCode = false;
  for (const line of lines) {
    if (line.startsWith('\`\`\`')) {
      if (!inCode) { html += '<pre><code>'; inCode = true; }
      else { html += '</code></pre>'; inCode = false; }
      continue;
    }
    if (inCode) { html += esc(line) + '\\n'; continue; }
    if (line.startsWith('## ')) { html += '<h2>' + esc(line.slice(3)) + '</h2>'; continue; }
    if (line.startsWith('> ')) { html += '<blockquote><p>' + esc(line.slice(2)) + '</p></blockquote>'; continue; }
    if (line.trim() === '') continue;
    let t = esc(line);
    t = t.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');
    t = t.replace(/\\[(.+?)\\]\\((.+?)\\)/g, '<a href="$2">$1</a>');
    html += '<p>' + t + '</p>';
  }
  const xsrf = document.cookie.match(/_xsrf=([^;]+)/)?.[1];
  const res = await fetch('/api/articles/2077045243858392500/draft', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', 'x-xsrftoken': xsrf },
    credentials: 'include',
    body: JSON.stringify({ content: html, table_of_contents: false, can_reward: false, delta_time: 30 }),
  });
  return { status: res.status, htmlLen: html.length, chinese: (html.match(/[\\u4e00-\\u9fff]/g) || []).length, ok: res.ok };
}`;

const pageId = process.argv[2] || '52';
console.log(JSON.stringify(cdt(['evaluate_script', fn, `--pageId=${pageId}`]), null, 2));
