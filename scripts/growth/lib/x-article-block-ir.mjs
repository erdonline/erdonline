/**
 * X Article block IR — built from Markdown via x-article-md-map.mjs (control plane).
 * @typedef {import('./x-article-md-map.mjs').Block} Block
 */

import { parseMarkdownToBlocks, readPackBodyMarkdown } from './x-article-md-map.mjs';
import { readParagraphs, resolvePack } from './x-article-packs.mjs';

/** Re-export MD parser helpers for tests and legacy callers. */
export {
  buildCodeMarkdown,
  fenceTagToLanguage,
  parseInlineMarkdown,
  parseMarkdownToBlocks,
  readPackBodyMarkdown,
} from './x-article-md-map.mjs';

/** Kinds that open the Insert dropdown — must not appear back-to-back in IR. */
export const INSERT_KINDS = new Set(['divider', 'code', 'image', 'gif', 'posts', 'latex', 'table']);

/** @returns {number[]} IR indices of object/Insert blocks. */
export function getInsertBlockIndices(blocks) {
  return blocks.map((b, i) => (INSERT_KINDS.has(b.kind) ? i : -1)).filter((i) => i >= 0);
}

/** @deprecated use parseMarkdownToBlocks — kept for seo-essay legacy path */
export function isCodeParagraph(para) {
  const t = para.trim();
  if (/^ERROR:/i.test(t)) return true;
  if (/^curl\s+/i.test(t)) return true;
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|WITH|DROP)\s/i.test(t)) return true;
  if (/^```/.test(t)) return true;
  if (/^\{[\s\S]*\}$/.test(t) || /^\[[\s\S]*\]$/.test(t)) return true;
  return false;
}

/** @deprecated */
export function normalizeCodeText(para) {
  const t = para.trim();
  const fenced = t.match(/^```[\w-]*\n?([\s\S]*?)```$/);
  if (fenced) return fenced[1].trim();
  return t;
}

/** @deprecated */
export function parseFencedBlock(para) {
  const t = para.trim();
  const m = t.match(/^```([\w-]*)\n?([\s\S]*?)```$/);
  if (!m) return null;
  const tag = (m[1] || '').toLowerCase();
  const text = m[2].trim();
  return { text, language: tag === 'sql' ? 'SQL' : tag.toUpperCase(), tag };
}

function bodyBlock(text, { markPhrases = [], links = [] } = {}) {
  /** @type {Block} */
  const block = { kind: 'body', text };
  if (markPhrases.length) block.markPhrases = markPhrases;
  if (links.length) block.links = links;
  return block;
}

function buildSeoEssayBlocks(pack) {
  const paragraphs = readParagraphs(pack);
  const headings = pack.headings ?? new Set();
  const subheadings = pack.subheadings ?? new Set();
  /** @type {Block[]} */
  const blocks = [];

  blocks.push({ kind: 'quote', text: paragraphs[0] });

  for (let i = 1; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    if (isCodeParagraph(para)) {
      blocks.push({ kind: 'code', text: normalizeCodeText(para) });
      continue;
    }
    if (para.startsWith('Three smaller footguns')) {
      blocks.push(bodyBlock('Three smaller footguns cost us a deploy each, and nobody writes these down.'));
      blocks.push({ kind: 'ul', items: pack.footguns ?? [] });
      blocks.push(bodyBlock('Every one of those is a redirect rule that is almost right. That\'s the point: this class of bug produces a perfectly working website for humans and an unindexable one for crawlers, and no amount of reading your React code will surface it.'));
      continue;
    }
    if (para.startsWith('Three things we deliberately did not do')) {
      blocks.push(bodyBlock('Three things we deliberately did not do, now written down as rules rather than left to judgment.'));
      blocks.push({ kind: 'ul', items: pack.notDo ?? [] });
      continue;
    }
    if (para.startsWith('If you run a client-rendered site, these are worth thirty minutes.')) {
      blocks.push({ kind: 'divider' });
      blocks.push({ kind: 'subheading', text: 'THE CHECKLIST' });
      blocks.push({ kind: 'ol', items: pack.checklist ?? [] });
      continue;
    }
    if (headings.has(para)) {
      blocks.push({ kind: 'subheading', text: para });
      continue;
    }
    if (subheadings.has(para)) {
      blocks.push({ kind: 'subheading', text: para });
      continue;
    }
    if (para === 'Rank was never the bottleneck. Being a distinct page was.') {
      blocks.push({ kind: 'quote', text: para });
      continue;
    }
    if (para.startsWith('ERD Online is an open-source')) {
      blocks.push({ kind: 'divider' });
      blocks.push({ kind: 'subheading', text: "WHAT WE'RE BUILDING" });
      blocks.push(bodyBlock(para, { markPhrases: ['ERD Online', 'Git + Figma for database design', 'projectJSON'] }));
      continue;
    }
    if (para.startsWith('Open a real ER diagram')) {
      blocks.push(bodyBlock('Open a real ER diagram, read-only, no signup: erdonline.com/demo', {
        links: [{ label: 'erdonline.com/demo', url: 'https://www.erdonline.com/demo' }],
      }));
      continue;
    }
    if (para.startsWith('Source, issues')) {
      blocks.push(bodyBlock('Source, issues, and the SEO scripts described above: github.com/erdonline/erdonline', {
        links: [{ label: 'github.com/erdonline/erdonline', url: 'https://github.com/erdonline/erdonline' }],
      }));
      continue;
    }
    const markPhrases = [];
    if (para.includes('one identity')) markPhrases.push('one identity');
    if (para.includes('ERD Online')) markPhrases.push('ERD Online');
    if (para.includes('Cloudflare Pages')) markPhrases.push('Cloudflare Pages');
    if (para.includes('UmiJS')) markPhrases.push('UmiJS');
    blocks.push(bodyBlock(para, { markPhrases }));
  }
  return blocks;
}

function validateSparseInserts(blocks, slug) {
  for (let i = 1; i < blocks.length; i++) {
    if (INSERT_KINDS.has(blocks[i].kind) && INSERT_KINDS.has(blocks[i - 1].kind)) {
      throw new Error(
        `${slug}: consecutive Insert blocks ${blocks[i - 1].kind} → ${blocks[i].kind} at index ${i}`,
      );
    }
  }
}

/** @returns {Block[]} */
export function buildBlocks(slug) {
  const pack = resolvePack(slug);
  /** @type {Block[]} */
  let blocks;
  if (slug === 'dont-give-agent-prod-db' || slug === 'agent-wrote-migration-approve') {
    blocks = parseMarkdownToBlocks(readPackBodyMarkdown(pack));
  } else if (slug === 'seo-essay') {
    blocks = buildSeoEssayBlocks(pack);
  } else {
    throw new Error(`No block IR for slug "${slug}"`);
  }
  validateSparseInserts(blocks, slug);
  return blocks;
}

/** @returns {Record<string, number>} */
export function countBlocksByKind(blocks) {
  /** @type {Record<string, number>} */
  const counts = {};
  for (const b of blocks) counts[b.kind] = (counts[b.kind] ?? 0) + 1;
  return counts;
}
