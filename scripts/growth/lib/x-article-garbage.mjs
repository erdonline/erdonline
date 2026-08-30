/**
 * CDP type_text garbage detection — no chrome-devtools imports (breaks cycles).
 */

/** CDP type_text stutter: TTT/EEE/FFF prefixes or T×3+ before a word (e.g. TTTEEEFFriday). */
const STUTTER_PREFIX_RE = /^(?:T{3,}|E{3,}|F{3,}|R{3,}|RROR)/i;
const MIXED_STUTTER_RE = /^(?:[TEFR]{2,}){2,}[a-z]/i;

/**
 * @param {string} text
 * @param {string} [expected]
 * @returns {string|null} violation kind
 */
export function detectGarbagePrefix(text, expected = '') {
  if (!text) return null;
  const t = String(text);
  const exp = String(expected);

  if (STUTTER_PREFIX_RE.test(t)) return 'stutter-prefix';
  if (MIXED_STUTTER_RE.test(t) && (!exp || !t.startsWith(exp.slice(0, Math.min(4, exp.length))))) {
    return 'mixed-stutter-prefix';
  }
  if (exp.length > 3) {
    const wordStart = exp.slice(0, 6);
    const idx = t.indexOf(wordStart.slice(1));
    if (idx > 0 && /^(?:[TEFR]{2,})+/.test(t.slice(0, idx))) return 'garbage-before-word';
  }
  return null;
}
