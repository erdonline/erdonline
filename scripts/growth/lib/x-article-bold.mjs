/**
 * X Article bold — HTML paste vs ⌘B chord decision (no dual-toggle).
 */

import { press, sleep } from './x-article-cdp-guarded.mjs';
import { evaluate } from './x-article-cdp-guarded.mjs';
import { resetToBodyPlain, selectPhrase } from './x-article-typer.mjs';

/** @param {string} html */
export function payloadHasStrong(html) {
  return /<strong>/i.test(String(html ?? ''));
}

/**
 * When paste kept `<strong>`, skip chords (⌘B would toggle off). When stripped, chord pass.
 * @param {{ strongCount?: number, boldCount?: number }} snapshot
 * @param {string} html
 */
export function shouldApplyBoldChords(snapshot, html) {
  if (!payloadHasStrong(html)) return false;
  const liveBold = snapshot.boldCount ?? snapshot.strongCount ?? 0;
  return liveBold === 0;
}

/**
 * Collect unique markPhrases from IR blocks, longest first (overlap-safe).
 * @param {import('./x-article-md-map.mjs').Block[]} blocks
 * @returns {string[]}
 */
export function collectMarkPhrases(blocks) {
  /** @type {Set<string>} */
  const seen = new Set();
  for (const block of blocks) {
    for (const phrase of block.markPhrases ?? []) {
      if (phrase) seen.add(phrase);
    }
  }
  return [...seen].sort((a, b) => b.length - a.length);
}

/**
 * Expected `<strong>` count from compile HTML (unique phrase occurrences).
 * @param {string} html
 */
export function expectedStrongCount(html) {
  return (String(html ?? '').match(/<strong>/gi) || []).length;
}

/** @param {number} pageId @param {string} phrase */
export function isSelectionBold(pageId) {
  return evaluate(
    pageId,
    `() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return { bold: false, reason: 'no selection' };
    let node = sel.anchorNode;
    if (node?.nodeType === Node.TEXT_NODE) node = node.parentElement;
    while (node && node !== document.body) {
      const tag = node.tagName?.toLowerCase();
      if (tag === 'strong' || tag === 'b') return { bold: true, via: tag };
      const fw = node.style?.fontWeight;
      if (fw && (fw === 'bold' || parseInt(fw, 10) >= 600)) return { bold: true, via: 'style' };
      node = node.parentElement;
    }
    return { bold: false };
  }`,
    [],
    { stableDom: false },
  );
}

/** @param {number} pageId */
export function applyBoldChord(pageId) {
  press(pageId, 'Meta+B');
  sleep(0.1);
  resetToBodyPlain(pageId);
  return { ok: true };
}

/**
 * Apply ⌘B once per mark phrase when paste stripped `<strong>`.
 * @param {number} pageId
 * @param {string[]} phrases
 * @param {{ useChords: boolean }} opts
 */
export function applyPostPasteBold(pageId, phrases = [], { useChords = false } = {}) {
  /** @type {string[]} */
  const applied = [];
  /** @type {string[]} */
  const skipped = [];
  /** @type {string[]} */
  const warnings = [];

  if (!useChords || !phrases.length) {
    return { applied, skipped, warnings, useChords: false };
  }

  for (const phrase of phrases) {
    const picked = selectPhrase(pageId, phrase);
    if (!picked.found || picked.selectedText !== phrase) {
      warnings.push(
        `bold skip: cannot select full phrase ${JSON.stringify(phrase)}${picked.reason ? ` (${picked.reason})` : ''}`,
      );
      continue;
    }
    const boldState = isSelectionBold(pageId);
    if (boldState?.bold) {
      skipped.push(phrase);
      resetToBodyPlain(pageId);
      continue;
    }
    applyBoldChord(pageId);
    applied.push(phrase);
  }

  return { applied, skipped, warnings, useChords: true };
}
