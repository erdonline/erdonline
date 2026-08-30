/**
 * X Article paste classification + end-of-fill audit — pure functions, no Chrome.
 * Thresholds live ONLY here.
 */

import { detectGarbagePrefix } from './x-article-garbage.mjs';
import { expectedStrongCount, payloadHasStrong } from './x-article-bold.mjs';

/**
 * @typedef {import('./x-article-cdp-guarded.mjs').ObserveSnapshot} ObserveSnapshot
 */

/**
 * @param {ObserveSnapshot} snapshot
 * @param {{ plain: string, meta?: { textBlockCount?: number, firstPlainLine?: string } }} payload
 * @returns {'strong'|'weak'|'empty'}
 */
export function classifyPaste(snapshot, payload) {
  const plainLength = payload.plain.length;
  const bodyLength = snapshot.bodyLength ?? 0;
  const blockCount = snapshot.blockCount ?? 0;
  const textBlockCount = payload.meta?.textBlockCount ?? 1;

  if (bodyLength < 20) return 'empty';

  const lengthOk = bodyLength >= plainLength * 0.85;
  const blockOk = blockCount >= Math.ceil(textBlockCount * 0.6);
  const hook = payload.meta?.firstPlainLine?.slice(0, 20) ?? '';
  const firstOk = !hook || (snapshot.firstBlockText ?? '').includes(hook);

  if (lengthOk && blockOk && firstOk) return 'strong';
  return 'weak';
}

/**
 * @param {ObserveSnapshot} snapshot
 * @param {ReturnType<import('./x-article-compile.mjs').compileArticle>} payload
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function auditSnapshot(snapshot, payload) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  if (snapshot.titleValue !== payload.title) {
    errors.push(`title mismatch: got ${JSON.stringify(snapshot.titleValue?.slice(0, 60))}`);
  }

  const pasteClass = classifyPaste(snapshot, payload);
  if (pasteClass !== 'strong') {
    errors.push(
      `paste not strong (${pasteClass}): bodyLength=${snapshot.bodyLength} plainLength=${payload.plain.length} blockCount=${snapshot.blockCount}`,
    );
  }

  const hook = payload.meta?.firstPlainLine?.slice(0, 20) ?? '';
  if (hook && !(snapshot.firstBlockText ?? '').includes(hook)) {
    errors.push(`hook missing: expected first 20 chars of ${JSON.stringify(hook)}`);
  }

  const bodySample = snapshot.firstBlockText || snapshot.bodyHead || '';
  if (/^riday\b/i.test(bodySample)) {
    errors.push('first-letter-drop (riday)');
  }
  if (detectGarbagePrefix(bodySample, payload.meta?.firstPlainLine ?? '')) {
    errors.push('garbage prefix in body');
  }

  const h2Expected = payload.meta?.h2Texts?.length ?? 0;
  if (h2Expected > 0 && (snapshot.h2Count ?? 0) < h2Expected) {
    errors.push(`h2Count=${snapshot.h2Count} expected ${h2Expected}`);
  }

  if (snapshot.blockCount <= 1 && (payload.meta?.textBlockCount ?? 0) > 3) {
    warnings.push(`glued-paragraph blockCount=${snapshot.blockCount}`);
  }

  if (payloadHasStrong(payload.html) && (snapshot.boldCount ?? snapshot.strongCount ?? 0) === 0) {
    errors.push(
      `bold stripped: boldCount=0 but payload has ${expectedStrongCount(payload.html)} <strong> tag(s)`,
    );
  }

  if (!snapshot.isArticleEdit) {
    errors.push(`not on article edit URL: ${snapshot.href}`);
  }
  if (snapshot.isPostComposer) {
    errors.push('Post composer open — not Article edit');
  }

  return { ok: errors.length === 0, errors, warnings };
}
