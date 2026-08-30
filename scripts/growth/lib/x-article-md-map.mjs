/**
 * X Article MD → IR middle layer.
 * Markdown in docs/growth-content/*-x.md is the control plane; compile maps tokens to X widgets.
 */

import fs from 'node:fs';

/** @typedef {'heading'|'subheading'|'body'|'ul'|'ol'|'quote'|'image'|'code'|'divider'|'gif'|'posts'|'latex'|'table'} BlockKind */
/** @typedef {{ label: string, url: string }} BlockLink */
/** @typedef {{ kind: BlockKind, text?: string, language?: string, fenceTag?: string, markdown?: string, items?: string[], markPhrases?: string[], links?: BlockLink[], rows?: string[][] }} Block */

const FENCE_LANG_TO_X = Object.freeze({
  sql: 'SQL',
  pgsql: 'SQL',
  text: 'SQL',
  txt: 'SQL',
  json: 'JSON',
  js: 'JavaScript',
  javascript: 'JavaScript',
});

export function readPackBodyMarkdown(pack) {
  const text = fs.readFileSync(pack.file, 'utf-8');
  const marker = '## X body (paste as-is, below the line)';
  const idx = text.indexOf(marker);
  if (idx === -1) throw new Error(`X body marker not found in ${pack.file}`);
  let body = text.slice(idx + marker.length).trim();
  const tagIdx = body.indexOf('\n---\n\n## Platform tag lines');
  if (tagIdx !== -1) body = body.slice(0, tagIdx).trim();
  return body;
}

/** @param {string} tag */
export function fenceTagToLanguage(tag) {
  const t = (tag || '').toLowerCase();
  if (FENCE_LANG_TO_X[t]) return FENCE_LANG_TO_X[t];
  if (!t) return 'Plain Text';
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** @param {string} tag @param {string} text */
export function buildCodeMarkdown(tag, text) {
  const fenceTag = (tag || 'plaintext').trim().toLowerCase() || 'plaintext';
  const displayTag = fenceTag === 'text' || fenceTag === 'txt' ? 'sql' : fenceTag;
  return `\`\`\`${displayTag}\n${String(text ?? '').trim()}\n\`\`\``;
}

/** @param {string} line */
function isTableRow(line) {
  return /^\|.+\|$/.test(line.trim());
}

/** @param {string} line */
function isTableSeparatorRow(line) {
  const cells = parseTableRow(line);
  return cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c));
}

/** @param {string} line */
function parseTableRow(line) {
  return line.trim().slice(1, -1).split('|').map((c) => c.trim());
}

/** @param {string} text */
export function parseInlineMarkdown(text) {
  /** @type {string[]} */
  const markPhrases = [];
  /** @type {BlockLink[]} */
  const links = [];
  let out = String(text ?? '');

  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    links.push({ label, url });
    return label;
  });

  out = out.replace(/`([^`]+)`/g, (_, code) => code);

  out = out.replace(/\*\*([^*]+)\*\*/g, (_, phrase) => {
    markPhrases.push(phrase);
    return phrase;
  });

  return { text: out, markPhrases, links };
}

/** @param {string} markdown @returns {Block[]} */
export function parseMarkdownToBlocks(markdown) {
  const lines = markdown.split('\n');
  /** @type {Block[]} */
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      blocks.push({ kind: 'subheading', text: line.slice(3).trim() });
      i++;
      continue;
    }

    if (line.startsWith('```')) {
      const tag = line.slice(3).trim();
      const fenceLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        fenceLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].startsWith('```')) i++;
      const text = fenceLines.join('\n').trim();
      const fenceTag = tag || 'plaintext';
      blocks.push({
        kind: 'code',
        text,
        language: fenceTagToLanguage(fenceTag),
        fenceTag,
        markdown: buildCodeMarkdown(fenceTag, text),
      });
      continue;
    }

    if (isTableRow(line)) {
      /** @type {string[][]} */
      const rows = [];
      while (i < lines.length && isTableRow(lines[i])) {
        if (!isTableSeparatorRow(lines[i])) {
          rows.push(parseTableRow(lines[i]));
        }
        i++;
      }
      if (rows.length) blocks.push({ kind: 'table', rows });
      continue;
    }

    if (line.startsWith('> ')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      const parsed = parseInlineMarkdown(quoteLines.join(' '));
      /** @type {Block} */
      const block = { kind: 'quote', text: parsed.text };
      if (parsed.markPhrases.length) block.markPhrases = parsed.markPhrases;
      if (parsed.links.length) block.links = parsed.links;
      blocks.push(block);
      continue;
    }

    if (/^-\s/.test(line)) {
      /** @type {string[]} */
      const items = [];
      while (i < lines.length && /^-\s/.test(lines[i])) {
        const parsed = parseInlineMarkdown(lines[i].replace(/^-\s+/, ''));
        items.push(parsed.text);
        i++;
      }
      blocks.push({ kind: 'ul', items });
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      /** @type {string[]} */
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'ol', items });
      continue;
    }

    const paraLines = [];
    while (i < lines.length) {
      const l = lines[i];
      if (!l.trim()) break;
      if (
        l.startsWith('## ')
        || l.startsWith('```')
        || isTableRow(l)
        || l.startsWith('> ')
        || /^-\s/.test(l)
        || /^\d+\.\s/.test(l)
      ) break;
      paraLines.push(l);
      i++;
    }
    const parsed = parseInlineMarkdown(paraLines.join('\n'));
    /** @type {Block} */
    const body = { kind: 'body', text: parsed.text };
    if (parsed.markPhrases.length) body.markPhrases = parsed.markPhrases;
    if (parsed.links.length) body.links = parsed.links;
    blocks.push(body);
  }

  return blocks;
}

/** @param {string} markdown */
export function countMarkdownH2(markdown) {
  return (markdown.match(/^## /gm) || []).length;
}

/** @param {string} markdown */
export function countMarkdownFences(markdown) {
  const opens = markdown.match(/^```[\w-]*\s*$/gm) || [];
  return opens.length;
}
