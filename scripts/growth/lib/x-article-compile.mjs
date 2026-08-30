/**
 * X Article compile-once payload — Markdown/IR → HTML + insertPlan (no Chrome).
 * playOrder decided here; consumers play insertPlan sorted by playOrder ascending.
 */

import { buildBlocks, INSERT_KINDS } from './x-article-block-ir.mjs';
import { collectMarkPhrases } from './x-article-bold.mjs';
import { resolvePack } from './x-article-packs.mjs';

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** @param {string} text @param {string[]} markPhrases */
function applyMarkPhrases(text, markPhrases = []) {
  let html = escapeHtml(text);
  const sorted = [...markPhrases].sort((a, b) => b.length - a.length);
  for (const phrase of sorted) {
    const esc = escapeHtml(phrase);
    html = html.replace(new RegExp(escapeRegex(esc), 'g'), `<strong>${esc}</strong>`);
  }
  return html;
}

/** @param {string} html @param {{ label: string, url: string }[]} links */
function applyLinks(html, links = []) {
  let out = html;
  for (const { label, url } of links) {
    const esc = escapeHtml(label);
    out = out.replace(
      new RegExp(escapeRegex(esc), 'g'),
      `<a href="${escapeHtml(url)}">${esc}</a>`,
    );
  }
  return out;
}

/** @param {import('./x-article-block-ir.mjs').Block} block */
function textBlockToHtml(block) {
  switch (block.kind) {
    case 'body': {
      let inner = applyMarkPhrases(block.text, block.markPhrases);
      inner = applyLinks(inner, block.links);
      return `<p>${inner}</p>`;
    }
    case 'heading':
    case 'subheading':
      return `<h2>${escapeHtml(block.text)}</h2>`;
    case 'quote': {
      let inner = applyMarkPhrases(block.text, block.markPhrases);
      inner = applyLinks(inner, block.links);
      return `<blockquote><p>${inner}</p></blockquote>`;
    }
    case 'ul':
      return `<ul>${block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
    case 'ol':
      return `<ol>${block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ol>`;
    default:
      return '';
  }
}

function textBlockToPlain(block) {
  switch (block.kind) {
    case 'body':
      return block.text;
    case 'heading':
    case 'subheading':
      return block.text;
    case 'quote':
      return block.text;
    case 'ul':
      return block.items.map((i) => `- ${i}`).join('\n');
    case 'ol':
      return block.items.map((i, n) => `${n + 1}. ${i}`).join('\n');
    default:
      return '';
  }
}

const TEXT_KINDS = new Set(['body', 'heading', 'subheading', 'quote', 'ul', 'ol']);

/**
 * Assign playOrder: trailing batch (≥2 inserts, no body between) → irIndex descending;
 * else irIndex ascending.
 * @param {object[]} insertPlan
 * @param {import('./x-article-block-ir.mjs').Block[]} blocks
 */
function assignPlayOrder(insertPlan, blocks) {
  if (insertPlan.length === 0) return;

  let trailing = false;
  if (insertPlan.length >= 2) {
    const firstIr = insertPlan[0].irIndex;
    const lastIr = insertPlan[insertPlan.length - 1].irIndex;
    const hasBodyBetween = blocks
      .slice(firstIr + 1, lastIr + 1)
      .some((b) => b.kind === 'body');
    trailing = !hasBodyBetween && insertPlan.every((e) => e.anchor?.type === 'trailing');
  }

  const sorted = trailing
    ? [...insertPlan].sort((a, b) => b.irIndex - a.irIndex)
    : [...insertPlan].sort((a, b) => a.irIndex - b.irIndex);

  sorted.forEach((entry, i) => {
    entry.playOrder = i;
  });
}

/**
 * @param {import('./x-article-block-ir.mjs').Block[]} blocks
 * @param {string} title
 */
export function compileBlocks(blocks, title) {
  /** @type {string[]} */
  const htmlParts = [];
  /** @type {string[]} */
  const plainParts = [];
  /** @type {object[]} */
  const insertPlan = [];
  /** @type {object[]} */
  const postPasteActions = [];
  /** @type {string[]} */
  const h2Texts = [];
  let lastTextPlain = null;
  let textBlockCount = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (TEXT_KINDS.has(block.kind)) {
      htmlParts.push(textBlockToHtml(block));
      const plainSeg = textBlockToPlain(block);
      plainParts.push(plainSeg);
      lastTextPlain = plainSeg;
      textBlockCount++;
      if (block.kind === 'subheading' || block.kind === 'heading') {
        h2Texts.push(block.text);
      }
      if (block.kind === 'body' || block.kind === 'quote') {
        for (const link of block.links ?? []) {
          postPasteActions.push({ type: 'link', label: link.label, url: link.url });
        }
      }
      continue;
    }

    if (INSERT_KINDS.has(block.kind)) {
      const prev = blocks[i - 1];
      /** @type {{ type: string, text?: string }} */
      let anchor;
      if (prev && (prev.kind === 'subheading' || prev.kind === 'heading')) {
        anchor = { type: 'afterHeading', text: prev.text };
      } else if (lastTextPlain) {
        anchor = { type: 'afterText', text: lastTextPlain.slice(0, 80) };
      } else {
        anchor = { type: 'trailing', text: '' };
      }
      /** @type {object} */
      const entry = {
        kind: block.kind,
        irIndex: i,
        anchor,
      };
      if (block.text != null) entry.text = block.text;
      if (block.language != null) entry.language = block.language;
      if (block.markdown != null) entry.markdown = block.markdown;
      if (block.fenceTag != null) entry.fenceTag = block.fenceTag;
      if (block.rows != null) entry.rows = block.rows.map((r) => [...r]);
      if (block.filePath != null) entry.filePath = block.filePath;
      if (block.url != null) entry.url = block.url;
      if (block.src != null) entry.src = block.src;
      if (block.alt != null) entry.alt = block.alt;
      insertPlan.push(entry);
    }
  }

  if (insertPlan.length >= 2) {
    const lastInsertIr = insertPlan[insertPlan.length - 1].irIndex;
    const hasBodyAfterFirstInsert = blocks
      .slice(insertPlan[0].irIndex + 1, lastInsertIr + 1)
      .some((b) => b.kind === 'body');
    if (!hasBodyAfterFirstInsert) {
      for (const entry of insertPlan) {
        entry.anchor = { type: 'trailing' };
      }
    }
  }

  assignPlayOrder(insertPlan, blocks);

  const html = htmlParts.join('\n');
  const plain = plainParts.join('\n\n');
  const markPhrases = collectMarkPhrases(blocks);

  return {
    title,
    html,
    plain,
    insertPlan,
    postPasteActions,
    meta: {
      textBlockCount,
      insertCount: insertPlan.length,
      h2Texts,
      firstPlainLine: plainParts[0]?.slice(0, 80) ?? '',
      markPhrases,
    },
  };
}

/**
 * Compile pack for slug — deterministic, Node-only.
 * @param {string} slug
 */
export function compileArticle(slug) {
  const pack = resolvePack(slug);
  const blocks = buildBlocks(slug);
  const payload = compileBlocks(blocks, pack.title);
  payload.meta.slug = slug;
  return payload;
}
